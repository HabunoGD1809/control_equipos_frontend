"use client";

import { useTransition, useRef, useState } from "react";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2, Save, Camera } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/use-toast";
import { Usuario } from "@/types/api";
import { updateProfileAction } from "@/actions/user-actions";
import { updateProfileSchema } from "@/lib/zod";
import { usuariosService } from "@/app/services/usuariosService";
import { AvatarCropModal } from "@/components/features/usuarios/AvatarCropModal";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace("/api/v1", "");

type FormValues = z.infer<typeof updateProfileSchema>;

interface UpdateProfileFormProps {
   currentUser: Usuario;
}

const cleanString = (str?: string | null) => (str && str.trim() !== "" ? str.trim() : null);

const getAvatarSrc = (url?: string | null) => {
   if (!url) return null;
   if (url.startsWith("http")) return url;
   return `${API_BASE_URL}${url}`;
};

export function UpdateProfileForm({ currentUser }: UpdateProfileFormProps) {
   const { toast } = useToast();
   const router = useRouter();
   const [isPending, startTransition] = useTransition();

   const fileInputRef = useRef<HTMLInputElement>(null);
   const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

   const [cropSrc, setCropSrc] = useState<string | null>(null);
   const [isCropOpen, setIsCropOpen] = useState(false);

   const [avatarPreview, setAvatarPreview] = useState<string | null>(
      getAvatarSrc((currentUser as any).avatar_url)
   );

   const form = useForm<FormValues>({
      resolver: standardSchemaResolver(updateProfileSchema),
      defaultValues: {
         nombre_usuario: currentUser.nombre_usuario,
         email: currentUser.email || "",
      },
   });

   const onSubmit = (data: FormValues) => {
      startTransition(async () => {
         const result = await updateProfileAction({
            nombre_usuario: data.nombre_usuario?.trim() || "",
            email: cleanString(data.email),
         } as any);

         if (result.error) {
            toast({ variant: "destructive", title: "Error al actualizar", description: result.error });
         } else {
            toast({ title: "Perfil actualizado", description: "Tus datos han sido guardados correctamente." });
         }
      });
   };

   // 1. Usuario selecciona archivo → abre crop modal
   const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const objectUrl = URL.createObjectURL(file);
      setCropSrc(objectUrl);
      setIsCropOpen(true);
      if (fileInputRef.current) fileInputRef.current.value = "";
   };

   // 2. Usuario confirma crop → sube el blob recortado
   const handleCropConfirm = async (croppedBlob: Blob) => {
      setIsCropOpen(false);
      setIsUploadingAvatar(true);
      try {
         const croppedFile = new File([croppedBlob], "avatar.webp", { type: "image/webp" });
         const updatedUser = await usuariosService.uploadAvatar(croppedFile);
         setAvatarPreview(getAvatarSrc((updatedUser as any).avatar_url));
         toast({ title: "Foto actualizada", description: "Tu foto de perfil ha sido cambiada." });
         router.refresh();
      } catch (error: any) {
         toast({ variant: "destructive", title: "Error", description: error.message || "No se pudo subir la foto." });
      } finally {
         setIsUploadingAvatar(false);
         if (cropSrc) URL.revokeObjectURL(cropSrc);
         setCropSrc(null);
      }
   };

   const handleCropClose = () => {
      setIsCropOpen(false);
      if (cropSrc) URL.revokeObjectURL(cropSrc);
      setCropSrc(null);
   };

   return (
      <>
         {cropSrc && (
            <AvatarCropModal
               imageSrc={cropSrc}
               open={isCropOpen}
               onClose={handleCropClose}
               onConfirm={handleCropConfirm}
            />
         )}

         <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Avatar */}
            <div className="flex flex-col items-center space-y-4 pt-4 shrink-0">
               <div
                  className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-muted bg-accent group cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
               >
                  {avatarPreview ? (
                     <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                     <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                        Sin Foto
                     </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                     <Camera className="text-white h-8 w-8" />
                  </div>
               </div>

               <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
               />

               <Button variant="outline" size="sm" disabled={isUploadingAvatar} onClick={() => fileInputRef.current?.click()}>
                  {isUploadingAvatar ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Cambiar Foto"}
               </Button>
            </div>

            {/* Formulario */}
            <Form {...form}>
               <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 flex-1 w-full">
                  <div className="grid grid-cols-1 gap-6">
                     <FormField control={form.control} name="nombre_usuario" render={({ field }) => (
                        <FormItem>
                           <FormLabel>Nombre de Usuario</FormLabel>
                           <FormControl>
                              <Input {...field} disabled={isPending} value={field.value ?? ""} className="bg-background max-w-md" />
                           </FormControl>
                           <FormMessage />
                        </FormItem>
                     )} />
                     <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem>
                           <FormLabel>Correo Electrónico <span className="text-muted-foreground font-normal text-xs">(Opcional)</span></FormLabel>
                           <FormControl>
                              <Input type="email" {...field} value={field.value ?? ""} disabled={isPending} placeholder="tucorreo@empresa.com" className="bg-background max-w-md" />
                           </FormControl>
                           <FormMessage />
                        </FormItem>
                     )} />
                  </div>
                  <div className="flex pt-4">
                     <Button type="submit" disabled={isPending} className="min-w-32 shadow-sm">
                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Guardar Cambios
                     </Button>
                  </div>
               </form>
            </Form>
         </div>
      </>
   );
}
