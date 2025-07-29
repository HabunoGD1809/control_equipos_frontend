"use client";

import { useAuthStore } from '@/store/authStore';
import { useMemo } from 'react';

export const useHasPermission = (requiredPermissions: string[]): boolean => {
   const user = useAuthStore((state) => state.user);

   const hasPermission = useMemo(() => {
      if (!user) {
         return false;
      }

      // El admin siempre tiene acceso a todo.
      if (user.rol.nombre === 'admin') {
         return true;
      }

      if (!user.rol.permisos || user.rol.permisos.length === 0) {
         return false;
      }

      const userPermissions = new Set(user.rol.permisos.map(p => p.nombre));

      return requiredPermissions.every(permission => userPermissions.has(permission));
   }, [user, requiredPermissions]);

   return hasPermission;
};
