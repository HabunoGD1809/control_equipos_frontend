"use client"

import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";

interface ApiError {
   detail: string;
}

export const useDeleteConfirmation = (
   itemType: string,
   onSuccess?: () => void
) => {
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
         await api.delete(endpoint);
         toast({
            title: "Éxito",
            description: `${itemType} eliminado correctamente.`,
         });
         setItemToDelete(null);
         setIsAlertOpen(false);
         if (onSuccess) {
            onSuccess();
         } else {
            router.refresh();
         }
      } catch (error) {
         const axiosError = error as AxiosError<ApiError>;
         const msg = axiosError.response?.data?.detail || `No se pudo eliminar el ${itemType.toLowerCase()}.`;
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
