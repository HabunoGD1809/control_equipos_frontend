"use client";

import { useMemo } from "react";
import { useSession } from "@/contexts/SessionProvider";

type PermisoLike = { nombre: string };

// helper: intenta leer permisos aunque el type sea RolResumen
function extractPermisos(user: any): PermisoLike[] {
   const permisos = user?.rol?.permisos;
   return Array.isArray(permisos) ? permisos : [];
}

export const useHasPermission = (requiredPermissions: string[]): boolean => {
   const { user } = useSession();

   const hasPermission = useMemo(() => {
      if (!user) return false;

      // Admin shortcut
      if (user.rol?.nombre === "admin") return true;

      // Si el backend NO incluye permisos en /usuarios/me, esto quedará vacío.
      const permisos = extractPermisos(user);

      if (permisos.length === 0) return false;

      const userPermissions = new Set(permisos.map((p: PermisoLike) => p.nombre));
      return requiredPermissions.every((perm) => userPermissions.has(perm));
   }, [user, requiredPermissions]);

   return hasPermission;
};
