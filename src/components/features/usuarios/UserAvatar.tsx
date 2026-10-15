"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { getAvatarSrc } from "@/lib/avatar-url";
import { cn } from "@/lib/utils";

export function UserAvatar({ user, className }: { user: { nombre_usuario: string; avatar_url?: string | null } | null; className?: string }) {
   const src = getAvatarSrc(user?.avatar_url);
   return (
      <Avatar className={cn("h-8 w-8 shrink-0 border border-border/50", className)}>
         {src && <AvatarImage src={src} alt={`Foto de ${user?.nombre_usuario ?? "usuario"}`} className="object-cover" />}
         <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{user?.nombre_usuario.slice(0, 2).toUpperCase() ?? "US"}</AvatarFallback>
      </Avatar>
   );
}
