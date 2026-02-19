'use server';

import { z } from 'zod';
import { serverApi } from '@/lib/http-server';
import { revalidatePath } from 'next/cache';

const profileSchema = z.object({
   username: z.string().min(3, "Mínimo 3 caracteres").max(50).optional(),
   email: z.string().email("Debe ser un email válido.").optional().nullable(),
   first_name: z.string().optional(),
   last_name: z.string().optional(),
});

type FormValues = z.infer<typeof profileSchema>;

export async function updateProfileAction(data: FormValues) {
   // Nota: safeParse a veces falla si envías campos extra no definidos en el schema
   const parsed = profileSchema.safeParse(data);

   if (!parsed.success) {
      return { error: "Datos inválidos" };
   }

   try {
      await serverApi.put('/usuarios/me', parsed.data);

      revalidatePath('/dashboard');
      revalidatePath('/perfil');

      return { success: true };
   } catch (error: any) {
      console.error("Error updating profile:", error);
      return { error: error.message || "No se pudo actualizar el perfil." };
   }
}
