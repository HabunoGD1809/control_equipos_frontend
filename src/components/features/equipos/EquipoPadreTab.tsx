"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Box, Loader2, AlertCircle } from "lucide-react";
import {
   Card,
   CardContent,
   CardHeader,
   CardTitle,
   CardDescription,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import { api } from "@/lib/http";
import type { PadreInfo } from "@/types/api";

interface EquipoPadreTabProps {
   equipoId: string;
}

// Normaliza: null | PadreInfo | PadreInfo[] | { items: PadreInfo[] } => PadreInfo | null
function normalizePadreInfo(input: unknown): PadreInfo | null {
   if (!input) return null;

   // Si viene paginado
   if (typeof input === "object" && input !== null && "items" in (input as any)) {
      const items = (input as any).items;
      if (Array.isArray(items)) {
         const first = items[0];
         return first && typeof first === "object" ? (first as PadreInfo) : null;
      }
      return null;
   }

   // Si viene como array
   if (Array.isArray(input)) {
      const first = input[0];
      return first && typeof first === "object" ? (first as PadreInfo) : null;
   }

   // Si viene como objeto normal
   if (typeof input === "object") return input as PadreInfo;

   return null;
}

export function EquipoPadreTab({ equipoId }: EquipoPadreTabProps) {
   const [padreInfo, setPadreInfo] = useState<PadreInfo | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);

   useEffect(() => {
      let alive = true;

      const fetchPadre = async () => {
         setIsLoading(true);
         setError(null);

         try {
            // OJO: puede venir PadreInfo | PadreInfo[] | {items:[]} | null
            const raw = await api.get<unknown>(`/equipos/${equipoId}/parte_de`);
            if (!alive) return;

            const normalized = normalizePadreInfo(raw);

            // Guard extra: si falta padre, trátalo como "sin padre"
            if (!normalized || !normalized.padre) {
               setPadreInfo(null);
               return;
            }

            setPadreInfo(normalized);
         } catch (err) {
            if (!alive) return;
            const e = err as Error & { status?: number };
            console.error("Error fetching padre info", e);
            setError(e.message || "No se pudo cargar la información de jerarquía.");
         } finally {
            if (alive) setIsLoading(false);
         }
      };

      fetchPadre();
      return () => {
         alive = false;
      };
   }, [equipoId]);

   if (isLoading) {
      return (
         <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
         </div>
      );
   }

   if (error) {
      return (
         <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
         </Alert>
      );
   }

   // Si no hay padre o viene incompleto => UI de "sin padre"
   if (!padreInfo?.padre?.id) {
      return (
         <Card className="border-dashed">
            <CardHeader className="text-center pb-8 pt-8">
               <Box className="mx-auto h-12 w-12 text-muted-foreground/50 mb-2" />
               <CardTitle className="text-lg text-muted-foreground">
                  Sin Equipo Padre
               </CardTitle>
               <CardDescription>
                  Este equipo es un activo independiente o de nivel superior. No forma
                  parte de otro equipo actualmente.
               </CardDescription>
            </CardHeader>
         </Card>
      );
   }

   const padreNombre = padreInfo.padre.nombre ?? "Sin nombre";
   const padreSerie = padreInfo.padre.numero_serie ?? "N/A";

   return (
      <div className="space-y-4">
         <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Jerarquía Ascendente</h3>
            <Badge variant="outline" className="text-xs">
               Relación:{" "}
               {String(padreInfo.tipo_relacion ?? "")
                  .replace("_", " ")
                  .toUpperCase()}
            </Badge>
         </div>

         <Card>
            <CardHeader className="pb-2">
               <CardTitle className="text-base font-medium text-muted-foreground">
                  Pertenece al equipo:
               </CardTitle>
            </CardHeader>

            <CardContent>
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="bg-primary/10 p-2 rounded-full">
                        <Box className="h-6 w-6 text-primary" />
                     </div>
                     <div>
                        <h4 className="font-bold text-lg">{padreNombre}</h4>
                        <p className="text-sm text-muted-foreground font-mono">
                           S/N: {padreSerie}
                        </p>
                     </div>
                  </div>

                  <Link href={`/equipos/${padreInfo.padre.id}`}>
                     <Button variant="outline" size="sm" className="gap-2">
                        Ver Detalles
                        <ArrowUpRight className="h-4 w-4" />
                     </Button>
                  </Link>
               </div>

               <div className="mt-6 grid grid-cols-2 gap-4 text-sm bg-muted/50 p-4 rounded-lg">
                  <div>
                     <span className="text-muted-foreground block">
                        Cantidad Asignada:
                     </span>
                     <span className="font-medium">
                        {Number(padreInfo.cantidad ?? 0)} unidades
                     </span>
                  </div>
                  <div>
                     <span className="text-muted-foreground block">
                        Vinculado desde:
                     </span>
                     <span className="font-medium">
                        {padreInfo.created_at
                           ? new Date(padreInfo.created_at).toLocaleDateString()
                           : "N/A"}
                     </span>
                  </div>

                  {padreInfo.notas && (
                     <div className="col-span-2 mt-2 pt-2 border-t border-border/50">
                        <span className="text-muted-foreground block">
                           Notas de vinculación:
                        </span>
                        <p className="italic text-muted-foreground">{padreInfo.notas}</p>
                     </div>
                  )}
               </div>
            </CardContent>
         </Card>
      </div>
   );
}
