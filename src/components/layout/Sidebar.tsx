"use client"

import { useState } from "react";
import Image from "next/image";
import {
   LayoutDashboard, HardDrive, Settings, History, Package, Wrench, ShieldCheck,
   Calendar, ShoppingCart, Shield, User, BookUser, Book, ShieldAlert, DatabaseBackup,
   FileText, LogOut, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useSession } from "@/contexts/SessionProvider";
import { SidebarNav, NavItemProps } from "./SidebarNav";
import { useUiStore } from "@/store/uiStore";
import { LogoutModal } from "@/components/ui/LogoutModal";
import { cn } from "@/lib/utils";

const mainRoutes: NavItemProps[] = [
   { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", permissions: ["ver_dashboard"] },
   {
      label: "Activos",
      icon: HardDrive,
      permissions: ["ver_equipos", "ver_movimientos", "ver_inventario"],
      subRoutes: [
         { href: "/equipos", icon: HardDrive, label: "Equipos", permissions: ["ver_equipos"] },
         { href: "/movimientos", icon: History, label: "Movimientos", permissions: ["ver_movimientos"] },
         { href: "/inventario", icon: Package, label: "Inventario", permissions: ["ver_inventario"] },
      ]
   },
   {
      label: "Gestión",
      icon: Settings,
      permissions: ["ver_mantenimientos", "ver_licencias", "ver_reservas", "ver_proveedores", "ver_documentacion"],
      subRoutes: [
         { href: "/mantenimientos", icon: Wrench, label: "Mantenimientos", permissions: ["ver_mantenimientos"] },
         { href: "/licencias", icon: ShieldCheck, label: "Licencias", permissions: ["ver_licencias"] },
         { href: "/reservas", icon: Calendar, label: "Reservas", permissions: ["ver_reservas"] },
         { href: "/proveedores", icon: ShoppingCart, label: "Proveedores", permissions: ["ver_proveedores"] },
         { href: "/documentacion", icon: FileText, label: "Documentación", permissions: ["ver_documentacion"] },
      ]
   }
];

const adminRoutes: NavItemProps[] = [
   {
      label: "Administración",
      icon: Shield,
      permissions: ["administrar_usuarios", "administrar_roles", "administrar_catalogos", "ver_auditoria", "administrar_sistema"],
      subRoutes: [
         { href: "/administracion/usuarios", icon: User, label: "Usuarios", permissions: ["administrar_usuarios"] },
         { href: "/administracion/roles", icon: BookUser, label: "Roles", permissions: ["administrar_roles"] },
         { href: "/administracion/catalogos", icon: Book, label: "Catálogos", permissions: ["administrar_catalogos"] },
         { href: "/administracion/auditoria", icon: ShieldAlert, label: "Auditoría", permissions: ["ver_auditoria"] },
         { href: "/administracion/backups", icon: DatabaseBackup, label: "Backups", permissions: ["administrar_sistema"] },
      ]
   }
];

export function Sidebar() {
   const { user } = useSession();
   const { isSidebarCollapsed, toggleSidebar } = useUiStore();
   const [isLogoutModalOpen, setLogoutModalOpen] = useState(false);

   if (!user) return null;

   return (
      <>
         <aside className={cn(
            "hidden md:flex flex-none flex-col bg-card/95 backdrop-blur-md border-r h-full transition-all duration-300 ease-in-out z-20 shadow-sm",
            isSidebarCollapsed ? "w-20" : "w-64"
         )}>
            <div className="h-16 flex items-center justify-between px-4 border-b shrink-0 bg-background/50">
               <div className="flex items-center gap-3 overflow-hidden">
                  <div className="relative shrink-0 w-8 h-8 rounded-md overflow-hidden bg-primary/10 flex items-center justify-center">
                     <Image
                        src="/assets/logo.png"
                        alt="ControlEquipos Logo"
                        fill
                        className="object-contain p-1"
                        sizes="32px"
                        priority
                     />
                  </div>
                  {!isSidebarCollapsed && (
                     <h1 className="text-xl font-bold bg-linear-to-r from-primary to-primary/70 bg-clip-text text-transparent truncate tracking-tight">
                        ControlEquipos
                     </h1>
                  )}
               </div>
            </div>

            {/* Zona de Navegación */}
            <div className="flex-1 py-6 overflow-y-auto overflow-x-hidden no-scrollbar">
               <div className="px-3 mb-8 space-y-1">
                  {!isSidebarCollapsed && <p className="px-3 mb-3 text-xs font-bold text-muted-foreground/70 uppercase tracking-widest">Principal</p>}
                  <SidebarNav items={mainRoutes} isCollapsed={isSidebarCollapsed} />
               </div>

               <div className="px-3 space-y-1">
                  {!isSidebarCollapsed && <p className="px-3 mb-3 text-xs font-bold text-muted-foreground/70 uppercase tracking-widest">Sistema</p>}
                  <SidebarNav items={adminRoutes} isCollapsed={isSidebarCollapsed} />
               </div>
            </div>

            {/* Footer del Sidebar (Controles y Logout) */}
            <div className="p-4 border-t shrink-0 flex flex-col gap-3 bg-muted/10">
               <button
                  onClick={toggleSidebar}
                  className="flex w-full items-center justify-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 text-muted-foreground hover:bg-accent hover:text-foreground active:scale-95"
                  title={isSidebarCollapsed ? "Expandir menú" : "Colapsar menú"}
               >
                  {isSidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
               </button>

               <button
                  onClick={() => setLogoutModalOpen(true)}
                  title={isSidebarCollapsed ? "Cerrar sesión" : undefined}
                  className={cn(
                     "group flex w-full items-center py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                     "text-destructive/90 hover:bg-destructive hover:text-destructive-foreground hover:shadow-md active:scale-95",
                     isSidebarCollapsed ? "justify-center px-0" : "px-3"
                  )}
               >
                  <LogOut className={cn("h-5 w-5 shrink-0 transition-transform group-hover:-translate-x-1", isSidebarCollapsed ? "mr-0" : "mr-3")} />
                  {!isSidebarCollapsed && <span className="font-semibold">Cerrar sesión</span>}
               </button>
            </div>
         </aside>

         <LogoutModal isOpen={isLogoutModalOpen} onOpenChange={setLogoutModalOpen} />
      </>
   );
}
