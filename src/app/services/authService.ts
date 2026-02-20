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
   /**
    * Login directo contra el backend (CORS/Proxy)
    * 🚨 OBLIGATORIO: application/x-www-form-urlencoded
    */
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

   /**
    * Invalida el token actual en el backend si existe la ruta (Opcional, en JWT stateless suele ser local)
    */
   async logout(): Promise<void> {
      // El backend no tiene ruta de logout en OpenAPI para JWT stateless,
      // esto generalmente solo borra cookies localmente o llama a un endpoint custom.
      // Se deja la firma por compatibilidad con tu proxy interno si lo tienes implementado ahí.
      await api.post("/auth/logout", {});
   },

   /**
    * Genera un token de reseteo (Solo Admin)
    */
   async requestPasswordReset(data: z.infer<typeof resetPasswordRequestSchema>): Promise<ResetTokenResponse> {
      return api.post<ResetTokenResponse>(`/auth/password-recovery/request-reset`, data);
   },

   /**
    * Confirma y aplica la nueva contraseña usando el token
    */
   async confirmPasswordReset(
      data: z.infer<typeof resetPasswordConfirmSchema>,
   ): Promise<void> {
      const { confirm_password, ...payload } = data;
      await api.post("/auth/password-recovery/confirm-reset", payload);
   },

   /**
    * Cambio de contraseña para el usuario autenticado
    */
   async changePassword(
      data: z.infer<typeof ChangePasswordSchema>,
   ): Promise<void> {
      await api.post("/auth/change-password", {
         current_password: data.current_password,
         new_password: data.new_password,
      });
   },

   /**
    * Obtiene la info del usuario actual
    */
   async getMe(): Promise<Usuario> {
      return api.get<Usuario>("/usuarios/me");
   },
};
