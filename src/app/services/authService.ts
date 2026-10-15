import { api } from "@/lib/http";
import { changePasswordAction } from "@/actions/auth-actions";
import type { Token, Usuario, PasswordResetResponse, RefreshTokenPayload } from "@/types/api";
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
      const payload: RefreshTokenPayload = { refresh_token: refreshToken };
      await api.post("/auth/logout/", payload);
   },

   async requestPasswordReset(
      data: z.infer<typeof resetPasswordRequestSchema>,
   ): Promise<PasswordResetResponse> {
      return api.post<PasswordResetResponse>(
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
      const result = await changePasswordAction(data);
      if (result.error) throw new Error(result.error);
      if (result.loginRequired) window.location.assign(new URL("/login", window.location.origin).href);
   },

   async getMe(): Promise<Usuario> {
      return api.get<Usuario>("/usuarios/me/");
   },
};
