"use client";

import { useState } from "react";
import { Plus, Trash2, Link as LinkIcon, Component, ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/use-toast";
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
} from "@/components/ui/Dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
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

import { useDeleteConfirmation } from "@/hooks/useDeleteConfirmation";
import type { ComponenteInfo, EquipoSimple, PadreInfo } from "@/types/api"; // Tipos corregidos

import { AddComponenteForm } from "./AddComponenteForm";

// Interfaz corregida para aceptar los datos directamente
interface EquipoComponentesTabProps {
   equipoId: string;
   componentes: ComponenteInfo[];
   padres?: PadreInfo[]; // Hacemos opcional por si no se carga
   equiposDisponibles?: EquipoSimple[]; // Para el formulario de añadir
   onRefresh?: () => void; // Callback para recargar datos tras cambios
   isEditable?: boolean;
}

export function EquipoComponentesTab({
   equipoId,
   componentes,
   padres = [],
   onRefresh,
   isEditable = true
}: EquipoComponentesTabProps) {
   const { toast } = useToast();
   const [isAddOpen, setIsAddOpen] = useState(false);

   // Hook de borrado
   const {
      isAlertOpen,
      openAlert,
      setIsAlertOpen,
      handleDelete,
      isDeleting,
      itemToDelete
   } = useDeleteConfirmation("Componente", onRefresh || (() => { }));

   const executeDelete = () => {
      if (itemToDelete) {
         // DELETE /api/v1/equipos/componentes/{relacion_id}
         handleDelete(`/equipos/componentes/${itemToDelete}`);
      }
   };

   const handleComponenteAdded = () => {
      setIsAddOpen(false);
      if (onRefresh) onRefresh();
      toast({ title: "Componente vinculado exitosamente" });
   };

   return (
      <div className="space-y-6">

         {/* SECCIÓN 1: Jerarquía Superior (Padres) */}
         {padres && padres.length > 0 && (
            <Alert className="bg-blue-50 border-blue-200">
               <ArrowUpRight className="h-4 w-4 text-blue-600" />
               <AlertTitle className="text-blue-800">Jerarquía Superior</AlertTitle>
               <AlertDescription className="text-blue-700">
                  Este equipo está instalado dentro de:{" "}
                  <Link href={`/equipos/${padres[0].padre.id}`} className="font-bold underline hover:text-blue-900">
                     {padres[0].padre.nombre} ({padres[0].padre.numero_serie})
                  </Link>
                  <span className="ml-2 text-xs opacity-75">
                     (Relación: {padres[0].tipo_relacion})
                  </span>
               </AlertDescription>
            </Alert>
         )}

         {/* SECCIÓN 2: Componentes Hijos */}
         <Card>
            <CardHeader className="flex flex-row items-center justify-between">
               <div>
                  <CardTitle>Componentes Instalados</CardTitle>
                  <CardDescription>
                     Equipos y accesorios vinculados a este activo ({componentes.length})
                  </CardDescription>
               </div>
               {isEditable && (
                  <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                     <DialogTrigger asChild>
                        <Button size="sm">
                           <Plus className="h-4 w-4 mr-2" />
                           Vincular Componente
                        </Button>
                     </DialogTrigger>
                     <DialogContent>
                        <DialogHeader>
                           <DialogTitle>Añadir Componente</DialogTitle>
                           <DialogDescription>
                              Busque y seleccione un equipo existente para vincularlo como componente.
                           </DialogDescription>
                        </DialogHeader>
                        <AddComponenteForm padreId={equipoId} onSuccess={handleComponenteAdded} />
                     </DialogContent>
                  </Dialog>
               )}
            </CardHeader>
            <CardContent>
               {componentes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                     <Component className="h-10 w-10 mb-2 opacity-20" />
                     <p>Este equipo no tiene componentes vinculados.</p>
                  </div>
               ) : (
                  <Table>
                     <TableHeader>
                        <TableRow>
                           <TableHead>Equipo / Componente</TableHead>
                           <TableHead>Relación</TableHead>
                           <TableHead>Cantidad</TableHead>
                           <TableHead>Notas</TableHead>
                           <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                     </TableHeader>
                     <TableBody>
                        {componentes.map((item) => (
                           <TableRow key={item.id}>
                              <TableCell>
                                 <div className="flex flex-col">
                                    <Link
                                       href={`/equipos/${item.componente.id}`}
                                       className="font-medium hover:underline text-primary flex items-center gap-2"
                                    >
                                       <LinkIcon className="h-3 w-3" />
                                       {item.componente.nombre}
                                    </Link>
                                    <span className="text-xs text-muted-foreground">
                                       S/N: {item.componente.numero_serie}
                                    </span>
                                 </div>
                              </TableCell>
                              <TableCell>
                                 <Badge variant="secondary">{item.tipo_relacion}</Badge>
                              </TableCell>
                              <TableCell>{item.cantidad}</TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                 {item.notas || "-"}
                              </TableCell>
                              <TableCell className="text-right">
                                 {isEditable && (
                                    <Button
                                       variant="ghost"
                                       size="icon"
                                       className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                       // Pasamos item.id (ID de Relación)
                                       onClick={() => openAlert(item.id)}
                                    >
                                       <Trash2 className="h-4 w-4" />
                                    </Button>
                                 )}
                              </TableCell>
                           </TableRow>
                        ))}
                     </TableBody>
                  </Table>
               )}
            </CardContent>
         </Card>

         {/* Alerta de Confirmación de Borrado */}
         <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
               <AlertDialogHeader>
                  <AlertDialogTitle>¿Desvincular componente?</AlertDialogTitle>
                  <AlertDialogDescription>
                     Se eliminará la relación de componente. El equipo físico no será borrado del sistema, solo desvinculado de este padre.
                  </AlertDialogDescription>
               </AlertDialogHeader>
               <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                     onClick={(e) => {
                        e.preventDefault();
                        executeDelete();
                     }}
                     disabled={isDeleting}
                     className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                     {isDeleting ? "Desvinculando..." : "Confirmar"}
                  </AlertDialogAction>
               </AlertDialogFooter>
            </AlertDialogContent>
         </AlertDialog>
      </div>
   );
}
