"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

import { EquipoForm } from "@/components/features/equipos/EquipoForm";
import type { EquipoRead, EstadoEquipo, Proveedor } from "@/types/api";

interface EditarEquipoClientProps {
   equipo: EquipoRead;
   estados: EstadoEquipo[];
   proveedores: Proveedor[];
}

export function EditarEquipoClient({ equipo, estados, proveedores }: EditarEquipoClientProps) {
   const router = useRouter();

   return (
      <div className="space-y-6 max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
         {/* Encabezado */}
         <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
               <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
               <h1 className="text-2xl font-bold tracking-tight">Editar Equipo</h1>
               <p className="text-muted-foreground">Modifica los detalles de {equipo.nombre}</p>
            </div>
         </div>

         {/* Contenedor del Formulario */}
         <div className="bg-card border rounded-lg p-6 shadow-sm">
            <EquipoForm
               initialData={equipo}
               estados={estados}
               proveedores={proveedores}
               isEditing={true}
            />
         </div>
      </div>
   );
}
