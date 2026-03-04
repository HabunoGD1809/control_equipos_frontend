"use client"

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useQueryClient } from "@tanstack/react-query";
import { logoutAction } from "@/actions/auth-actions";
import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
} from "@/components/ui/AlertDialog";

interface LogoutModalProps {
   isOpen: boolean;
   onOpenChange: (open: boolean) => void;
}

export function LogoutModal({ isOpen, onOpenChange }: LogoutModalProps) {
   const logoutZustand = useAuthStore(state => state.logout);
   const queryClient = useQueryClient();
   const [isLoading, setIsLoading] = useState(false);

   const handleLogout = async () => {
      try {
         setIsLoading(true);
         // 1. Limpiamos estados del cliente
         logoutZustand();
         queryClient.clear();

         // 2. Ejecutamos el Server Action
         await logoutAction();
      } catch (error) {
         console.error("Error al cerrar sesión:", error);
      } finally {
         setIsLoading(false);
         onOpenChange(false);
      }
   };

   return (
      <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
         <AlertDialogContent>
            <AlertDialogHeader>
               <AlertDialogTitle>¿Cerrar sesión?</AlertDialogTitle>
               <AlertDialogDescription>
                  Estás a punto de salir de tu cuenta. Tendrás que volver a ingresar tus credenciales para acceder al sistema. ¿Deseas continuar?
               </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
               <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
               <AlertDialogAction
                  onClick={(e) => {
                     e.preventDefault();
                     handleLogout();
                  }}
                  disabled={isLoading}
                  className="bg-red-600 text-white hover:bg-red-700"
               >
                  {isLoading ? "Cerrando sesión..." : "Sí, cerrar sesión"}
               </AlertDialogAction>
            </AlertDialogFooter>
         </AlertDialogContent>
      </AlertDialog>
   );
}
