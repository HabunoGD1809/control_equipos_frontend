"use client"

import { useState } from "react";
import { Loader2 } from "lucide-react";
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
   const [isLoading, setIsLoading] = useState(false);

   const handleLogout = async () => {
      if (isLoading) return;
      setIsLoading(true);
      // A full navigation disposes the authenticated tree and its query cache together.
      window.location.replace("/api/auth/logout?callbackUrl=/login");
   };

   return (
      <AlertDialog open={isOpen} onOpenChange={open => { if (!isLoading) onOpenChange(open); }}>
         <AlertDialogContent>
            <AlertDialogHeader>
               <AlertDialogTitle>¿Cerrar sesión?</AlertDialogTitle>
               <AlertDialogDescription>
                  Estás a punto de salir de tu cuenta. Tendrás que volver a ingresar
                  tus credenciales para acceder al sistema. ¿Deseas continuar?
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
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? "Cerrando sesión..." : "Sí, cerrar sesión"}
               </AlertDialogAction>
            </AlertDialogFooter>
         </AlertDialogContent>
      </AlertDialog>
   );
}
