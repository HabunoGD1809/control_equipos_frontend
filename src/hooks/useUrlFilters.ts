"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

/**
 * Hook para gestionar los filtros de la URL de forma centralizada.
 * Elimina las claves vacías automáticamente para mantener URLs limpias.
 */
export function useUrlFilters() {
   const router = useRouter();
   const pathname = usePathname();
   const searchParams = useSearchParams();

   const setFilters = useCallback(
      (updates: Record<string, string | number | undefined | null>) => {
         const params = new URLSearchParams(searchParams.toString());

         Object.entries(updates).forEach(([key, value]) => {
            if (value === undefined || value === null || value === "" || value === 0) {
               params.delete(key);
            } else {
               params.set(key, String(value));
            }
         });

         router.push(`${pathname}?${params.toString()}`);
      },
      [router, pathname, searchParams]
   );

   return { setFilters, searchParams };
}
