"use client";

import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import Image from 'next/image';

type Brand = { nombre: string; logo_url: string | null };

export function CompanyBrand({ compact = false, iconOnly = false }: { compact?: boolean; iconOnly?: boolean }) {
   const [brand, setBrand] = useState<Brand>({ nombre: "ControlEquipos", logo_url: null });
   useEffect(() => {
      const controller = new AbortController();
      const load = () => fetch("/api/proxy/empresa/publica", { cache: "no-store", signal: controller.signal })
         .then(response => response.ok ? response.json() : null)
         .then(data => { if (data) setBrand(data); })
         .catch(() => {});
      void load();
      const changed = (event: Event) => {
         const next = (event as CustomEvent<Brand>).detail;
         if (next?.nombre) setBrand(next);
         else void load();
      };
      window.addEventListener("company-changed", changed);
      return () => { controller.abort(); window.removeEventListener("company-changed", changed); };
   }, []);
   return (
      <div className={compact ? "flex items-center gap-3 min-w-0" : "flex flex-col items-center gap-3"}>
         {brand.logo_url ? (
            <Image src={brand.logo_url} width={224} height={64} unoptimized alt={`Logo de ${brand.nombre}`} className={compact ? "h-8 w-8 object-contain shrink-0" : "h-16 max-w-56 object-contain"} />
         ) : <Building2 aria-hidden="true" className={compact ? "h-8 w-8 text-primary shrink-0" : "h-12 w-12 text-primary"} />}
         {!iconOnly && <span className={compact ? "min-w-0 truncate font-bold text-lg" : "max-w-full font-bold text-xl text-center break-words"} title={brand.nombre}>{brand.nombre}</span>}
      </div>
   );
}
