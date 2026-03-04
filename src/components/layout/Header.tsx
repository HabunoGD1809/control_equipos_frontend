"use client"

import { useState } from "react"
import { LogOut, UserCircle, Settings } from "lucide-react"
import { useRouter } from "next/navigation"
import { useSession } from "@/contexts/SessionProvider";
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
import { GlobalSearch } from "./GlobalSearch"
import { LogoutModal } from "@/components/ui/LogoutModal"
import { cn } from "@/lib/utils"

export function Header() {
   const { user } = useSession();
   const router = useRouter();
   const [isLogoutModalOpen, setLogoutModalOpen] = useState(false);

   return (
      <>
         <header className={cn(
            "flex-none flex items-center justify-between h-16 px-4 sm:px-6",
            "bg-background/80 backdrop-blur-md border-b border-border/50 w-full gap-4 transition-all duration-300 ease-in-out z-10"
         )}>
            {/* Buscador Global */}
            <div className="flex-1 min-w-0 max-w-2xl">
               <GlobalSearch />
            </div>

            {/* Acciones y Perfil */}
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
               <div className="flex items-center gap-1 sm:gap-2 mr-2">
                  <ThemeToggle />
                  <Notifications />
               </div>

               <div className="h-6 w-px bg-border hidden sm:block"></div>

               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Button
                        variant="ghost"
                        className="relative h-10 w-auto px-2 sm:px-3 flex items-center gap-3 hover:bg-accent/80 rounded-full sm:rounded-lg transition-colors"
                     >
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                           <UserCircle className="h-5 w-5 text-primary" />
                        </div>
                        <div className="text-left hidden sm:flex flex-col">
                           <span className="text-sm font-semibold leading-none text-foreground">{user?.nombre_usuario}</span>
                           <span className="text-xs text-muted-foreground mt-1 truncate max-w-30 font-medium">{user?.rol?.nombre}</span>
                        </div>
                     </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 rounded-xl shadow-lg border-border/50" align="end" forceMount>
                     <DropdownMenuLabel className="font-normal p-3 bg-muted/30 rounded-t-lg">
                        <div className="flex flex-col space-y-1.5">
                           <p className="text-sm font-bold leading-none">{user?.nombre_usuario}</p>
                           <p className="text-xs leading-none text-muted-foreground truncate">
                              {user?.email || "Sin email registrado"}
                           </p>
                        </div>
                     </DropdownMenuLabel>
                     <DropdownMenuSeparator className="mb-1" />
                     <DropdownMenuItem
                        onClick={() => router.push('/perfil')}
                        className="cursor-pointer py-2.5 px-3 focus:bg-accent focus:text-accent-foreground rounded-md transition-colors"
                     >
                        <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Configuración de Perfil</span>
                     </DropdownMenuItem>
                     <DropdownMenuSeparator className="my-1" />
                     <DropdownMenuItem
                        onClick={() => setLogoutModalOpen(true)}
                        className="cursor-pointer py-2.5 px-3 text-destructive focus:text-destructive focus:bg-destructive/10 rounded-md transition-colors mt-1"
                     >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span className="font-medium">Cerrar sesión</span>
                     </DropdownMenuItem>
                  </DropdownMenuContent>
               </DropdownMenu>
            </div>
         </header>

         <LogoutModal isOpen={isLogoutModalOpen} onOpenChange={setLogoutModalOpen} />
      </>
   );
}
