import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { cookies } from 'next/headers';

import { Button } from "@/components/ui/Button";
import { EquiposClient } from "./components/EquiposClient";
import { EquipoRead } from "@/types/api";

// Helper de API para el lado del servidor
async function getEquipos(): Promise<EquipoRead[]> {
   const accessToken = cookies().get('access_token')?.value;
   if (!accessToken) return [];

   try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/equipos/?limit=200`, {
         headers: { 'Authorization': `Bearer ${accessToken}` },
         cache: 'no-store',
      });
      if (!response.ok) return [];
      return response.json();
   } catch (error) {
      console.error("[GET_EQUIPOS_ERROR]", error);
      return [];
   }
}

export default async function EquiposPage() {
   const equipos = await getEquipos();

   return (
      <div className="space-y-8">
         <div className="flex items-center justify-between">
            <div>
               <h1 className="text-3xl font-bold">Gestión de Equipos</h1>
               <p className="text-muted-foreground">
                  Visualiza, crea y administra todos los activos de la organización.
               </p>
            </div>
            <Link href="/equipos/nuevo" passHref>
               <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Crear Equipo
               </Button>
            </Link>
         </div>
         <EquiposClient data={equipos} />
      </div>
   );
}
