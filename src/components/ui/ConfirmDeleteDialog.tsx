"use client";

import { Loader2, AlertTriangle } from "lucide-react";
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
import { Button } from "@/components/ui/Button";

interface ConfirmDeleteDialogProps {
   isOpen: boolean;
   isDeleting: boolean;
   onClose: () => void;
   onConfirm: () => void;
   title?: string;
   description?: string;
}

export function ConfirmDeleteDialog({
   isOpen,
   isDeleting,
   onClose,
   onConfirm,
   title = "¿Estás completamente seguro?",
   description = "Esta acción no se puede deshacer. Esto eliminará permanentemente el registro de los servidores.",
}: ConfirmDeleteDialogProps) {
   return (
      <AlertDialog open={isOpen} onOpenChange={(open) => !open && !isDeleting && onClose()}>
         <AlertDialogContent>
            <AlertDialogHeader>
               <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  {title}
               </AlertDialogTitle>
               <AlertDialogDescription>{description}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
               <AlertDialogCancel disabled={isDeleting} onClick={onClose}>
                  Cancelar
               </AlertDialogCancel>
               <Button
                  variant="destructive"
                  onClick={(e) => {
                     e.preventDefault();
                     onConfirm();
                  }}
                  disabled={isDeleting}
               >
                  {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isDeleting ? "Eliminando..." : "Sí, eliminar"}
               </Button>
            </AlertDialogFooter>
         </AlertDialogContent>
      </AlertDialog>
   );
}
