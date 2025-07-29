"use client"

import { LogOut, UserCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/authStore"
import { Button } from "@/components/ui/Button"
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuLabel,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu"
import { ThemeToggle } from "./ThemeToggle"
import { Notifications } from "./Notifications"
import { GlobalSearch } from "./GlobalSearch" // Importar Búsqueda Global

export function Header() {
   const { user, logout } = useAuthStore();
   const router = useRouter();

   const handleLogout = async () => {
      await fetch('/api/auth/logout', { method: 'POST' });
      logout();
      router.push('/login');
   };

   return (
      <header className="flex items-center justify-between h-16 px-6 bg-card border-b w-full gap-4">
         <div>
            <GlobalSearch /> {/* Añadir Búsqueda Global */}
         </div>
         <div className="flex items-center gap-4">
            <ThemeToggle />
            <Notifications />
            <DropdownMenu>
               <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-auto px-4 flex items-center gap-2">
                     <UserCircle className="h-6 w-6" />
                     <div className="text-left hidden sm:block">
                        <p className="text-sm font-medium">{user?.nombre_usuario}</p>
                        <p className="text-xs text-muted-foreground">{user?.rol.nombre}</p>
                     </div>
                  </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                     <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.nombre_usuario}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                           {user?.email}
                        </p>
                     </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/perfil')}>
                     <UserCircle className="mr-2 h-4 w-4" />
                     <span>Perfil</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                     <LogOut className="mr-2 h-4 w-4" />
                     <span>Cerrar sesión</span>
                  </DropdownMenuItem>
               </DropdownMenuContent>
            </DropdownMenu>
         </div>
      </header>
   );
}
