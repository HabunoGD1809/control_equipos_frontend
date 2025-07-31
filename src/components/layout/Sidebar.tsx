"use client"

import {
   LayoutDashboard, HardDrive, Settings, History, Package, Wrench, ShieldCheck, Calendar, ShoppingCart, Shield, User, BookUser, Book, ShieldAlert, DatabaseBackup
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { SidebarNav, NavItemProps } from "./SidebarNav";

// --- Estructura de Rutas ---

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
      permissions: ["ver_mantenimientos", "ver_licencias", "ver_reservas", "ver_proveedores"],
      subRoutes: [
         { href: "/mantenimientos", icon: Wrench, label: "Mantenimientos", permissions: ["ver_mantenimientos"] },
         { href: "/licencias", icon: ShieldCheck, label: "Licencias", permissions: ["ver_licencias"] },
         { href: "/reservas", icon: Calendar, label: "Reservas", permissions: ["ver_reservas"] },
         { href: "/proveedores", icon: ShoppingCart, label: "Proveedores", permissions: ["ver_proveedores"] },
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

// --- Componente Principal del Sidebar ---

export function Sidebar() {
   const user = useAuthStore((state) => state.user);
   const isLoading = useAuthStore((state) => state.isLoading);

   if (isLoading) {
      return (
         <aside className="hidden md:flex flex-col w-64 bg-card border-r h-full fixed">
            <div className="p-4 border-b animate-pulse"><div className="h-8 bg-muted rounded"></div></div>
            <div className="flex-1 px-4 py-4 space-y-2">
               <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
               {[...Array(6)].map((_, i) => <div key={i} className="h-10 bg-muted rounded"></div>)}
            </div>
         </aside>
      );
   }

   if (!user) return null;

   return (
      <aside className="hidden md:flex flex-col w-64 bg-card border-r h-full fixed">
         <div className="p-4 border-b">
            <h1 className="text-2xl font-bold text-primary">ControlEquipos</h1>
         </div>
         <div className="flex-1 px-4 py-4 space-y-4 overflow-y-auto">
            <div>
               <p className="px-2 mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Principal</p>
               <SidebarNav items={mainRoutes} />
            </div>
            <div>
               <p className="px-2 mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sistema</p>
               <SidebarNav items={adminRoutes} />
            </div>
         </div>
      </aside>
   );
}
