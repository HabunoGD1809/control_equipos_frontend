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
import type { ResetTokenResponse } from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

// ─── TIPOS DE RETORNO ─────────────────────────────────────────────────────────

type ResetActionResult =
   | { success: true; data: ResetTokenResponse }
   | { success?: never; error: string };

// ─── LOGIN ────────────────────────────────────────────────────────────────────

export async function loginAction(values: z.infer<typeof loginSchema>) {
   const parsed = loginSchema.safeParse(values);
   if (!parsed.success) return { error: "Datos inválidos" };

   const { username, password } = parsed.data;
   const params = new URLSearchParams();
   params.append("username", username);
   params.append("password", password);

   try {
      const res = await fetch(`${API_URL}/auth/login/access-token`, {
         method: "POST",
         headers: { "Content-Type": "application/x-www-form-urlencoded" },
         body: params,
         cache: "no-store",
      });

      if (!res.ok) {
         return { error: "Credenciales incorrectas o usuario bloqueado" };
      }

      const tokens = await res.json();
      const cookieStore = await cookies();

      cookieStore.set(AUTH_COOKIE_NAME, tokens.access_token, {
         httpOnly: true,
         secure: process.env.NODE_ENV === "production",
         maxAge: 60 * 60 * 24 * 7,
         path: "/",
         sameSite: "lax",
      });

      if (tokens.refresh_token) {
         cookieStore.set(REFRESH_COOKIE_NAME, tokens.refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24 * 30,
            path: "/",
            sameSite: "lax",
         });
      }

      const meRes = await fetch(`${API_URL}/usuarios/me`, {
         headers: { Authorization: `Bearer ${tokens.access_token}` },
         cache: "no-store",
      });

      const user = meRes.ok ? await meRes.json() : null;

      return { success: true, user };
   } catch (error) {
      console.error("Login error:", error);
      return { error: "Error de conexión con el servidor" };
   }
}

// ─── LOGOUT ───────────────────────────────────────────────────────────────────

export async function logoutAction() {
   const cookieStore = await cookies();
   cookieStore.delete(AUTH_COOKIE_NAME);
   cookieStore.delete(REFRESH_COOKIE_NAME);
   redirect("/login");
}

// ─── RECUPERACIÓN DE CONTRASEÑA ───────────────────────────────────────────────

export async function requestPasswordResetAction(
   values: z.infer<typeof resetPasswordRequestSchema>
): Promise<ResetActionResult> {
   const parsed = resetPasswordRequestSchema.safeParse(values);
   if (!parsed.success) return { error: "Datos inválidos" };

   const cookieStore = await cookies();
   const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

   if (!token) {
      return { error: "Acceso denegado. Solo un administrador autenticado puede generar un token." };
   }

   try {
      const res = await fetch(
         `${API_URL}/auth/password-recovery/request-reset`,
         {
            method: "POST",
            headers: {
               "Content-Type": "application/json",
               "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(parsed.data),
            cache: "no-store",
         }
      );

      if (!res.ok) {
         const errorData = await res.json().catch(() => ({}));
         return { error: errorData.detail || "Error al solicitar recuperación. Verifique si el usuario existe." };
      }

      const data: ResetTokenResponse = await res.json();
      return { success: true, data };
   } catch (error) {
      console.error("Request Reset error:", error);
      return { error: "Error de conexión con el servidor." };
   }
}

export async function confirmPasswordResetAction(
   values: z.infer<typeof resetPasswordConfirmSchema>
) {
   const parsed = resetPasswordConfirmSchema.safeParse(values);
   if (!parsed.success) return { error: "Datos inválidos" };

   // El backend no recibe confirm_password, se filtra
   const { confirm_password, ...payload } = parsed.data;

   try {
      const res = await fetch(
         `${API_URL}/auth/password-recovery/confirm-reset`,
         {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            cache: "no-store",
         }
      );

      if (!res.ok) {
         const errorData = await res.json().catch(() => ({}));
         return { error: errorData.detail || "Token inválido o expirado." };
      }

      return { success: true };
   } catch (error) {
      console.error("Confirm Reset error:", error);
      return { error: "Error de conexión con el servidor." };
   }
}

export async function changePasswordAction(
   values: z.infer<typeof changePasswordSchema>
) {
   const parsed = changePasswordSchema.safeParse(values);
   if (!parsed.success) return { error: "Datos inválidos" };

   const cookieStore = await cookies();
   const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

   if (!token) return { error: "Sesión expirada. Inicie sesión nuevamente." };

   try {
      const res = await fetch(`${API_URL}/auth/change-password`, {
         method: "POST",
         headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
         },
         body: JSON.stringify({
            current_password: parsed.data.current_password,
            new_password: parsed.data.new_password,
         }),
         cache: "no-store",
      });

      if (!res.ok) {
         const errorData = await res.json().catch(() => ({}));
         return { error: errorData.detail || "La contraseña actual es incorrecta." };
      }

      return { success: true };
   } catch (error) {
      console.error("Change Password error:", error);
      return { error: "Error de conexión con el servidor." };
   }
}
