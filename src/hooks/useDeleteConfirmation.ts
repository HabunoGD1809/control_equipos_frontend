"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { api } from "@/lib/http";

type HttpError = Error & { status?: number };

function getErrorMessage(error: unknown, fallback: string) {
   if (error instanceof Error) return error.message || fallback;
   if (typeof error === "string" && error.trim()) return error;
   return fallback;
}

/**
 * Hook genérico para confirmar y ejecutar eliminación.
 *
 * USO:
 * - openAlert(id) abre el modal y guarda el id
 * - handleDelete(endpoint) ejecuta DELETE al endpoint exacto
 *    Ej: handleDelete(`/proveedores/${itemToDelete}`)
 */
export const useDeleteConfirmation = (itemType: string, onSuccess?: () => void) => {
   const [isAlertOpen, setIsAlertOpen] = useState(false);
   const [isDeleting, setIsDeleting] = useState(false);
   const [itemToDelete, setItemToDelete] = useState<string | null>(null);

   const { toast } = useToast();
   const router = useRouter();

   const openAlert = (id: string) => {
      setItemToDelete(id);
      setIsAlertOpen(true);
   };

   const handleDelete = async (endpoint: string) => {
      if (!itemToDelete) return;

      setIsDeleting(true);
      try {
         await api.delete<void>(endpoint);

         toast({
            title: "Éxito",
            description: `${itemType} eliminado correctamente.`,
         });

         setItemToDelete(null);
         setIsAlertOpen(false);

         if (onSuccess) onSuccess();
         else router.refresh();
      } catch (error) {
         const err = error as HttpError;

         // Si tu api wrapper pone message “detail/message/HTTP 500”, aquí ya viene listo.
         const msg = getErrorMessage(err, `No se pudo eliminar el ${itemType.toLowerCase()}.`);

         toast({
            variant: "destructive",
            title: "Error",
            description: msg,
         });
      } finally {
         setIsDeleting(false);
      }
   };

   return {
      isAlertOpen,
      isDeleting,
      itemToDelete,
      openAlert,
      setIsAlertOpen,
      handleDelete,
   };
};
