import { api } from "@/lib/http";
import type { Token, Usuario, ResetTokenResponse } from "@/types/api";
import type { z } from "zod";
import {
   LoginSchema,
   ChangePasswordSchema,
   resetPasswordConfirmSchema,
   resetPasswordRequestSchema,
} from "@/lib/zod";

export const authService = {
   async login(credentials: z.infer<typeof LoginSchema>): Promise<Token> {
      const params = new URLSearchParams();
      params.append("username", credentials.username);
      params.append("password", credentials.password);

      return api.post<Token>("/auth/login/access-token", params, {
         headers: {
            "Content-Type": "application/x-www-form-urlencoded",
         },
      });
   },

   async logout(refreshToken: string): Promise<void> {
      await api.post("/auth/logout/", { refresh_token: refreshToken });
   },

   async requestPasswordReset(
      data: z.infer<typeof resetPasswordRequestSchema>,
   ): Promise<ResetTokenResponse> {
      return api.post<ResetTokenResponse>(
         "/auth/password-recovery/request-reset/",
         data,
      );
   },

   async confirmPasswordReset(
      data: z.infer<typeof resetPasswordConfirmSchema>,
   ): Promise<void> {
      const { confirm_password, ...payload } = data;
      await api.post("/auth/password-recovery/confirm-reset/", payload);
   },

   async changePassword(data: z.infer<typeof ChangePasswordSchema>): Promise<void> {
      await api.post("/auth/change-password/", {
         current_password: data.current_password,
         new_password: data.new_password,
      });
   },

   async getMe(): Promise<Usuario> {
      return api.get<Usuario>("/usuarios/me/");
   },
};
