"use client";

import { useState } from "react";
import { Plus, Trash2, Link as LinkIcon, Component, ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/Dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import { ConfirmDeleteDialog } from "@/components/ui/ConfirmDeleteDialog";
import { useToast } from "@/components/ui/use-toast";

import { useDeleteConfirmation } from "@/hooks/useDeleteConfirmation";
import { api } from "@/lib/http";
import type { ComponenteInfo, EquipoSimple, PadreInfo } from "@/types/api";

import { AddComponenteForm } from "./AddComponenteForm";

interface EquipoComponentesTabProps {
   equipoId: string;
   componentes: ComponenteInfo[];
   padres?: PadreInfo[];
   equiposDisponibles?: EquipoSimple[];
   onRefresh?: () => void;
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

   const { isAlertOpen, openAlert, closeAlert, confirmDelete, isDeleting } = useDeleteConfirmation({
      onDelete: (id) => api.delete(`/equipos/componentes/${id}`),
      onSuccess: () => {
         if (onRefresh) onRefresh();
      },
      successMessage: "Componente desvinculado exitosamente."
   });

   const handleComponenteAdded = () => {
      setIsAddOpen(false);
      if (onRefresh) onRefresh();
      toast({ title: "Componente vinculado exitosamente" });
   };

   return (
      <div className="space-y-6 animate-in fade-in duration-300">

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

         <Card className="shadow-sm">
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
                        <Button size="sm" className="shadow-sm">
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
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground border-2 border-dashed rounded-lg bg-muted/10">
                     <Component className="h-10 w-10 mb-2 opacity-20" />
                     <p>Este equipo no tiene componentes vinculados.</p>
                  </div>
               ) : (
                  <div className="rounded-md border">
                     <Table>
                        <TableHeader className="bg-muted/50">
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
                                          onClick={() => openAlert(item.id)}
                                          title="Desvincular"
                                       >
                                          <Trash2 className="h-4 w-4" />
                                       </Button>
                                    )}
                                 </TableCell>
                              </TableRow>
                           ))}
                        </TableBody>
                     </Table>
                  </div>
               )}
            </CardContent>
         </Card>

         <ConfirmDeleteDialog
            isOpen={isAlertOpen}
            isDeleting={isDeleting}
            onClose={closeAlert}
            onConfirm={confirmDelete}
            title="¿Desvincular componente?"
            description="Se eliminará la relación de componente. El equipo físico no será borrado del sistema, solo será desvinculado de este equipo padre."
         />
      </div>
   );
}
