"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
   changePasswordSchema,
   loginSchema,
   resetPasswordConfirmSchema,
   resetPasswordRequestSchema,
} from "@/lib/zod";
import { AUTH_COOKIE_NAME, REFRESH_COOKIE_NAME } from "@/lib/constants";
import { serverApi } from "@/lib/http-server";
import type { ResetTokenResponse, Usuario } from "@/types/api";

type ResetActionResult =
   | { success: true; data: ResetTokenResponse }
   | { success?: never; error: string };

type LoginResponse = {
   access_token: string;
   refresh_token?: string;
   token_type: string;
};

const ACCESS_COOKIE_MAX_AGE = 60 * 60 * 24; // 24h
const REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7d

export async function loginAction(values: z.infer<typeof loginSchema>) {
   const parsed = loginSchema.safeParse(values);
   if (!parsed.success) return { error: "Datos inválidos" };

   const { username, password } = parsed.data;
   const params = new URLSearchParams();
   params.append("username", username);
   params.append("password", password);

   try {
      const tokens = await serverApi.post<LoginResponse>("/auth/login/access-token", params);

      const cookieStore = await cookies();

      cookieStore.set(AUTH_COOKIE_NAME, tokens.access_token, {
         httpOnly: true,
         secure: process.env.NODE_ENV === "production",
         maxAge: ACCESS_COOKIE_MAX_AGE,
         path: "/",
         sameSite: "lax",
      });

      if (tokens.refresh_token) {
         cookieStore.set(REFRESH_COOKIE_NAME, tokens.refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: REFRESH_COOKIE_MAX_AGE,
            path: "/",
            sameSite: "lax",
         });
      }

      const user = await serverApi.get<Usuario>("/usuarios/me");
      return { success: true, user };
   } catch (error: any) {
      console.error("Login error:", error);
      if (error.status === 400 || error.status === 401) {
         return { error: "Credenciales incorrectas o usuario bloqueado" };
      }
      return { error: "Error de conexión con el servidor" };
   }
}

export async function logoutAction() {
   const cookieStore = await cookies();
   const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value;

   if (refreshToken) {
      try {
         // 🚨 NUEVO: Revocamos el token explícitamente en la Base de Datos
         await serverApi.post("/auth/logout", { refresh_token: refreshToken });
      } catch (error) {
         // Si falla (ej: el token ya expiró o el backend no responde), 
         // capturamos el error silenciosamente para asegurar que las 
         // cookies locales siempre se borren y el usuario no quede atascado.
         console.error("No se pudo revocar el token en el servidor:", error);
      }
   }

   cookieStore.delete(AUTH_COOKIE_NAME);
   cookieStore.delete(REFRESH_COOKIE_NAME);
   redirect("/login");
}

export async function requestPasswordResetAction(
   values: z.infer<typeof resetPasswordRequestSchema>
): Promise<ResetActionResult> {
   const parsed = resetPasswordRequestSchema.safeParse(values);
   if (!parsed.success) return { error: "Datos inválidos" };

   try {
      const data = await serverApi.post<ResetTokenResponse>(
         "/auth/password-recovery/request-reset",
         parsed.data
      );

      return { success: true, data };
   } catch (error: any) {
      console.error("Request Reset error:", error);
      if (error.status === 401 || error.status === 403) {
         return { error: "Acceso denegado. Solo un administrador autenticado puede generar un token." };
      }
      return { error: error.detail || "Error al solicitar recuperación. Verifique si el usuario existe." };
   }
}

export async function confirmPasswordResetAction(values: z.infer<typeof resetPasswordConfirmSchema>) {
   const parsed = resetPasswordConfirmSchema.safeParse(values);
   if (!parsed.success) return { error: "Datos inválidos" };

   const { confirm_password, ...payload } = parsed.data;

   try {
      await serverApi.post("/auth/password-recovery/confirm-reset", payload);
      return { success: true };
   } catch (error: any) {
      console.error("Confirm Reset error:", error);
      return { error: error.detail || "Token inválido o expirado." };
   }
}

export async function changePasswordAction(values: z.infer<typeof changePasswordSchema>) {
   const parsed = changePasswordSchema.safeParse(values);
   if (!parsed.success) return { error: "Datos inválidos" };

   try {
      await serverApi.post("/auth/change-password", {
         current_password: parsed.data.current_password,
         new_password: parsed.data.new_password,
      });

      return { success: true };
   } catch (error: any) {
      console.error("Change Password error:", error);
      if (error.status === 401) {
         return { error: "Sesión expirada. Inicie sesión nuevamente." };
      }
      return { error: error.detail || "La contraseña actual es incorrecta." };
   }
}
