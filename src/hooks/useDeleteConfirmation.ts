"use client";

import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { getFriendlyErrorMessage } from "@/lib/error-handling";

interface UseDeleteConfirmationProps {
   onDelete: (id: string) => Promise<any>;
   onSuccess?: () => void;
   successMessage?: string;
   errorMessage?: string;
}

export const useDeleteConfirmation = ({
   onDelete,
   onSuccess,
   successMessage = "Registro eliminado correctamente.",
   errorMessage = "Ocurrió un error al intentar eliminar el registro.",
}: UseDeleteConfirmationProps) => {
   const [isAlertOpen, setIsAlertOpen] = useState(false);
   const [isDeleting, setIsDeleting] = useState(false);
   const [itemToDelete, setItemToDelete] = useState<string | null>(null);

   const { toast } = useToast();

   const openAlert = useCallback((id: string) => {
      setItemToDelete(id);
      setIsAlertOpen(true);
   }, []);

   const closeAlert = useCallback(() => {
      setIsAlertOpen(false);
      setItemToDelete(null);
   }, []);

   const confirmDelete = useCallback(async () => {
      if (!itemToDelete) return;

      setIsDeleting(true);
      try {
         await onDelete(itemToDelete);

         toast({
            title: "Éxito",
            description: successMessage,
         });

         closeAlert();
         if (onSuccess) onSuccess();
      } catch (error) {
         let { message } = getFriendlyErrorMessage(error);

         const msgLower = message.toLowerCase();
         const isConstraintError =
            msgLower.includes("foreign key") ||
            msgLower.includes("violates") ||
            msgLower.includes("integrity") ||
            msgLower.includes("restrict");

         if (isConstraintError) {
            message = "No se puede eliminar este registro porque está siendo utilizado (o referenciado) en otra parte del sistema.";
         }

         toast({
            variant: "destructive",
            title: isConstraintError ? "Acción Denegada" : "Error al eliminar",
            description: message || errorMessage,
         });

         closeAlert();
      } finally {
         setIsDeleting(false);
      }
   }, [itemToDelete, onDelete, onSuccess, successMessage, errorMessage, toast, closeAlert]);

   return {
      isAlertOpen,
      isDeleting,
      openAlert,
      closeAlert,
      confirmDelete,
   };
};
