"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import {
   changePasswordSchema,
   loginSchema,
   resetPasswordConfirmSchema,
   resetPasswordRequestSchema,
} from "@/lib/zod";
import { serverApi } from "@/lib/http-server";
import { createSession, deleteSession, getSession } from "@/lib/session";
import type { ResetTokenResponse, Usuario, Token } from "@/types/api";

type ResetActionResult =
   | { success: true; data: ResetTokenResponse }
   | { success?: never; error: string };

export async function loginAction(values: z.infer<typeof loginSchema>) {
   const parsed = loginSchema.safeParse(values);
   if (!parsed.success) return { error: "Datos inválidos" };

   const { username, password } = parsed.data;
   const params = new URLSearchParams();
   params.append("username", username);
   params.append("password", password);

   try {
      const tokens = await serverApi.post<Token>("/auth/login/access-token", params);

      // Centralizado
      await createSession(tokens.access_token, tokens.refresh_token);

      const user = await serverApi.get<Usuario>("/usuarios/me");
      return { success: true, user };
   } catch (error: any) {
      console.error("[AUTH_ACTION_LOGIN] Error:", error);
      if (error.status === 400 || error.status === 401) {
         return { error: "Credenciales incorrectas o usuario bloqueado" };
      }
      return { error: "Error de conexión con el servidor" };
   }
}

export async function logoutAction() {
   const { refreshToken } = await getSession();

   if (refreshToken) {
      try {
         await serverApi.post("/auth/logout", { refresh_token: refreshToken });
      } catch (error) {
         console.error("[AUTH_ACTION_LOGOUT] No se pudo revocar el token en el servidor:", error);
      }
   }

   await deleteSession();
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
      if (error.status === 401 || error.status === 403) {
         return { error: "Acceso denegado. Solo un administrador puede realizar esto." };
      }
      return { error: error.detail || "Error al solicitar recuperación." };
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
      if (error.status === 401) {
         return { error: "Sesión expirada. Inicie sesión nuevamente." };
      }
      return { error: error.detail || "La contraseña actual es incorrecta." };
   }
}
