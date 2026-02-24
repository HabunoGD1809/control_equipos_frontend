'use server';

import { serverApi } from '@/lib/http-server';
import { revalidatePath } from 'next/cache';
import { updateProfileSchema } from '@/lib/zod';
import { z } from 'zod';

type FormValues = z.infer<typeof updateProfileSchema>;

export async function updateProfileAction(data: FormValues) {
   const parsed = updateProfileSchema.safeParse(data);

   if (!parsed.success) {
      return { error: "Datos inválidos: Revise los campos enviados." };
   }

   try {
      await serverApi.put('/usuarios/me', parsed.data);

      revalidatePath('/dashboard');
      revalidatePath('/perfil');

      return { success: true };
   } catch (error: any) {
      console.error("Error updating profile:", error);
      return { error: error.detail || error.message || "No se pudo actualizar el perfil." };
   }
}
