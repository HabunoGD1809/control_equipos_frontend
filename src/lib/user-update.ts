import type { UsuarioUpdate } from "@/types/api";

export function userUpdatePayload(data: UsuarioUpdate, isSelf: boolean): UsuarioUpdate {
   const payload: UsuarioUpdate = {
      email: data.email?.trim() || null,
   };
   if (!isSelf) {
      Object.assign(payload, {
         departamento_id: data.departamento_id || null, empleado_id: data.empleado_id || null,
         nombre_usuario: data.nombre_usuario?.trim() || undefined, rol_id: data.rol_id,
         bloqueado: data.bloqueado, requiere_cambio_contrasena: data.requiere_cambio_contrasena,
      });
      if (data.password) payload.password = data.password;
   }
   return payload;
}
