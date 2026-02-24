"use client";

import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";

type HttpError = Error & { status?: number };

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
         const err = error as HttpError;
         toast({
            variant: "destructive",
            title: "Error",
            description: err.message || errorMessage,
         });
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
