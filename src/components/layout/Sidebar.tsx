"use client"

import { useState } from "react";
import { CompanyBrand } from "@/components/features/empresa/CompanyBrand";
import {
   LayoutDashboard, HardDrive, Settings, History, Package, Wrench, ShieldCheck,
   Calendar, ShoppingCart, Shield, User, BookUser, Book, ShieldAlert, DatabaseBackup,
   FileText, LogOut, ChevronLeft, ChevronRight, PieChart, ChevronsUpDown
} from "lucide-react";
import { useSession } from "@/contexts/SessionProvider";
import { hasPermission } from "@/lib/permissions";
import { SidebarNav, NavItemProps } from "./SidebarNav";
import { useUiStore } from "@/store/uiStore";
import { LogoutModal } from "@/components/ui/LogoutModal";
import { UserAvatar } from "@/components/features/usuarios/UserAvatar";
import { cn } from "@/lib/utils";

export const mainRoutes: NavItemProps[] = [
   { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", permissions: ["ver_dashboard"] },
   {
      label: "Activos Fijos",
      icon: HardDrive,
      permissions: ["ver_equipos", "ver_movimientos", "ver_inventario"],
      subRoutes: [
         { href: "/equipos", icon: HardDrive, label: "Equipos", permissions: ["ver_equipos"] },
         { href: "/movimientos", icon: History, label: "Movimientos", permissions: ["ver_movimientos"] },
         { href: "/inventario", icon: Package, label: "Inventario", permissions: ["ver_inventario"] },
      ]
   },
   {
      label: "Operaciones",
      icon: Settings,
      permissions: ["ver_mantenimientos", "ver_licencias", "ver_reservas", "ver_proveedores", "ver_documentos", "generar_reportes"],
      subRoutes: [
         { href: "/mantenimientos", icon: Wrench, label: "Mantenimientos", permissions: ["ver_mantenimientos"] },
         { href: "/licencias", icon: ShieldCheck, label: "Licencias", permissions: ["ver_licencias"] },
         { href: "/reservas", icon: Calendar, label: "Reservas", permissions: ["ver_reservas"] },
         { href: "/proveedores", icon: ShoppingCart, label: "Proveedores", permissions: ["ver_proveedores"] },
         { href: "/documentacion", icon: FileText, label: "Documentación", permissions: ["ver_documentos"] },
         { href: "/reportes", icon: PieChart, label: "Reportes", permissions: ["generar_reportes"] },
      ]
   }
];

export const adminRoutes: NavItemProps[] = [
   {
      label: "Administración",
      icon: Shield,
      permissions: ["administrar_usuarios", "administrar_roles", "administrar_catalogos", "ver_auditoria", "administrar_sistema", "configurar_sistema"],
      subRoutes: [
         { href: "/administracion/usuarios", icon: User, label: "Usuarios", permissions: ["administrar_usuarios"] },
         { href: "/administracion/roles", icon: BookUser, label: "Roles", permissions: ["administrar_roles"] },
         { href: "/administracion/catalogos", icon: Book, label: "Catálogos", permissions: ["administrar_catalogos"] },
         { href: "/administracion/auditoria", icon: ShieldAlert, label: "Auditoría", permissions: ["ver_auditoria"] },
         { href: "/administracion/empresa", icon: Settings, label: "Empresa", permissions: ["administrar_sistema", "configurar_sistema"] },
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
            {/* Header (Logo) */}
            <div className="h-16 flex items-center justify-between px-4 border-b shrink-0 bg-background/50">
               <CompanyBrand compact iconOnly={isSidebarCollapsed} />
            </div>

            {/* Zona de Navegación Principal */}
            <div className="flex-1 py-6 overflow-y-auto overflow-x-hidden no-scrollbar flex flex-col gap-6 px-3">

               {mainRoutes.some(route => hasPermission(user, route.permissions ?? [])) && <div className="space-y-1">
                  {!isSidebarCollapsed && <p className="px-2 mb-2 text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest">Principal</p>}
                  <SidebarNav items={mainRoutes} isCollapsed={isSidebarCollapsed} />
               </div>}

               {adminRoutes.some(route => hasPermission(user, route.permissions ?? [])) && <div className="space-y-1">
                  {!isSidebarCollapsed && <p className="px-2 mb-2 text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest">Configuración</p>}
                  <SidebarNav items={adminRoutes} isCollapsed={isSidebarCollapsed} />
               </div>}
            </div>

            {/* Footer (Mini-Perfil y Controles) */}
            <div className="p-3 border-t shrink-0 flex flex-col gap-2 bg-muted/10">

               {/* Mini Perfil Clickable */}
               <button
                  onClick={() => setLogoutModalOpen(true)}
                  className={cn(
                     "flex items-center gap-3 p-2 rounded-xl transition-colors hover:bg-accent hover:text-accent-foreground text-left outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                     isSidebarCollapsed ? "justify-center" : "justify-between"
                  )}
               >
                  <div className="flex items-center gap-3 overflow-hidden">
                     <UserAvatar user={user} className="h-9 w-9 shadow-sm" />
                     {!isSidebarCollapsed && (
                        <div className="flex flex-col truncate">
                           <span className="text-sm font-semibold leading-none truncate mb-1 text-foreground">
                              {user.nombre_usuario}
                           </span>
                           <span className="text-[10px] uppercase font-bold tracking-wide text-muted-foreground/80 truncate">
                              {user.rol?.nombre || 'Usuario'}
                           </span>
                        </div>
                     )}
                  </div>
                  {!isSidebarCollapsed && <LogOut className="h-4 w-4 text-muted-foreground shrink-0 opacity-60 transition-opacity hover:opacity-100" />}
               </button>

               {/* Botón de Colapsar */}
               <button
                  onClick={toggleSidebar}
                  className="flex w-full items-center justify-center px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 text-muted-foreground hover:bg-accent hover:text-foreground active:scale-95"
                  title={isSidebarCollapsed ? "Expandir menú" : "Colapsar menú"}
               >
                  {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
               </button>
            </div>
         </aside>

         <LogoutModal isOpen={isLogoutModalOpen} onOpenChange={setLogoutModalOpen} />
      </>
   );
}
