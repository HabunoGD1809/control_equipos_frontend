import { api } from "@/lib/http";
import type { Token, Usuario } from "@/types/api";
import type { z } from "zod";
import {
   LoginSchema,
   ChangePasswordSchema,
   resetPasswordConfirmSchema,
} from "@/lib/zod";

export const authService = {
   /**
    * Login vía Next route: POST /api/auth/login
    * (Ese route debería setear cookie httpOnly)
    */
   async login(credentials: z.infer<typeof LoginSchema>): Promise<Token> {
      // Si tu route /api/auth/login espera JSON (recomendado)
      return api.post<Token>("/auth/login", credentials);
   },

   /**
    * Logout vía Next route: POST /api/auth/logout
    */
   async logout(): Promise<void> {
      await api.post("/auth/logout", {});
   },

   async requestPasswordReset(email: string): Promise<void> {
      // Si esto existe en tu backend, pásalo por el proxy:
      await api.post(`/auth/password-recovery/${encodeURIComponent(email)}`, {});
   },

   async confirmPasswordReset(
      data: z.infer<typeof resetPasswordConfirmSchema>,
   ): Promise<void> {
      await api.post("/auth/password-recovery/reset", {
         token: data.token,
         new_password: data.new_password,
      });
   },

   async changePassword(
      data: z.infer<typeof ChangePasswordSchema>,
   ): Promise<void> {
      await api.post("/auth/change-password", {
         current_password: data.current_password,
         new_password: data.new_password,
      });
   },

   async getMe(): Promise<Usuario> {
      return api.get<Usuario>("/auth/me");
   },
};
