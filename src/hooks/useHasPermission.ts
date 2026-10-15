"use client";

import { useSession } from "@/contexts/SessionProvider";
import { hasPermission } from "@/lib/permissions";

export const useHasPermission = (requiredPermissions: string[], mode: "any" | "all" = "any"): boolean => {
   const { user } = useSession();

   return hasPermission(user, requiredPermissions, mode);
};
