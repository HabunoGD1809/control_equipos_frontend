"use client"

import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
   Building, Calendar, DollarSign, Hash, Info, MapPin, ShieldCheck, Tag
} from 'lucide-react';
import { motion } from 'framer-motion';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { EquipoRead } from "@/types/api";

interface DetailItemProps {
   icon: React.ElementType;
   label: string;
   value?: string | number | null;
}

const DetailItem = ({ icon: Icon, label, value }: DetailItemProps) => {
   if (!value && typeof value !== 'number') return null;
   return (
      <div className="flex items-start">
         <Icon className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
         <div className="ml-4">
            <p className="font-semibold text-sm">{label}</p>
            <p className="text-muted-foreground text-sm">{value}</p>
         </div>
      </div>
   );
}

const cardVariants = {
   hidden: { opacity: 0, y: 20 },
   visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export function EquipoDetailTab({ equipo }: { equipo: EquipoRead }) {
   return (
      <div className="space-y-6 mt-4">
         <motion.div variants={cardVariants} initial="hidden" animate="visible">
            <Card>
               <CardHeader><CardTitle>Información General</CardTitle></CardHeader>
               <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-4">
                  <DetailItem icon={Hash} label="Código Interno" value={equipo.codigo_interno} />
                  <DetailItem icon={Tag} label="Marca" value={equipo.marca} />
                  <DetailItem icon={Info} label="Modelo" value={equipo.modelo} />
                  <DetailItem icon={MapPin} label="Ubicación Actual" value={equipo.ubicacion_actual} />
                  <DetailItem icon={Building} label="Centro de Costo" value={equipo.centro_costo} />
               </CardContent>
            </Card>
         </motion.div>

         <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={1}>
            <Card>
               <CardHeader><CardTitle>Información de Adquisición</CardTitle></CardHeader>
               <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-4">
                  <DetailItem icon={Building} label="Proveedor" value={equipo.proveedor?.nombre} />
                  <DetailItem icon={DollarSign} label="Valor de Adquisición" value={equipo.valor_adquisicion ? `$${Number(equipo.valor_adquisicion).toFixed(2)}` : null} />
                  <DetailItem icon={Calendar} label="Fecha de Adquisición" value={equipo.fecha_adquisicion ? format(new Date(equipo.fecha_adquisicion), "PPP", { locale: es }) : null} />
                  <DetailItem icon={Calendar} label="Puesta en Marcha" value={equipo.fecha_puesta_marcha ? format(new Date(equipo.fecha_puesta_marcha), "PPP", { locale: es }) : null} />
                  <DetailItem icon={ShieldCheck} label="Expiración de Garantía" value={equipo.fecha_garantia_expiracion ? format(new Date(equipo.fecha_garantia_expiracion), "PPP", { locale: es }) : null} />
               </CardContent>
            </Card>
         </motion.div>

         <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={2}>
            <Card>
               <CardHeader><CardTitle>Notas Adicionales</CardTitle></CardHeader>
               <CardContent>
                  <p className="text-sm text-muted-foreground italic">
                     {equipo.notas || "No hay notas adicionales para este equipo."}
                  </p>
               </CardContent>
            </Card>
         </motion.div>
      </div>
   );
}
