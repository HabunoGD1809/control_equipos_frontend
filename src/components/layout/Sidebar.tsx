"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import {
   LayoutDashboard, HardDrive, Warehouse, ShieldCheck, CalendarClock, Wrench, Users, KeyRound, Book, ShieldAlert, DatabaseBackup
} from "lucide-react"
import { useAuthStore } from "@/store/authStore"
import { useHasPermission } from "@/hooks/useHasPermission"
import { cn } from "@/lib/utils"

const mainRoutes = [
   { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", permissions: ["ver_dashboard"] },
   { href: "/equipos", icon: HardDrive, label: "Equipos", permissions: ["ver_equipos"] },
   { href: "/inventario", icon: Warehouse, label: "Inventario", permissions: ["ver_inventario"] },
   { href: "/licencias", icon: ShieldCheck, label: "Licencias", permissions: ["ver_licencias"] },
   { href: "/reservas", icon: CalendarClock, label: "Reservas", permissions: ["ver_reservas"] },
   { href: "/mantenimientos", icon: Wrench, label: "Mantenimientos", permissions: ["ver_mantenimientos"] },
];

const adminRoutes = [
   { href: "/administracion/usuarios", icon: Users, label: "Usuarios", permissions: ["administrar_usuarios"] },
   { href: "/administracion/roles", icon: KeyRound, label: "Roles y Permisos", permissions: ["administrar_roles"] },
   { href: "/administracion/catalogos", icon: Book, label: "Catálogos", permissions: ["administrar_catalogos"] },
   { href: "/administracion/auditoria", icon: ShieldAlert, label: "Auditoría", permissions: ["ver_auditoria"] },
   { href: "/administracion/backups", icon: DatabaseBackup, label: "Backups", permissions: ["administrar_sistema"] },
];

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
         <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
            <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Principal</p>
            {mainRoutes.map((item) => (
               <NavItem key={item.href} item={item} />
            ))}

            <p className="px-2 pt-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Administración</p>
            {adminRoutes.map((item) => (
               <NavItem key={item.href} item={item} />
            ))}
         </nav>
      </aside>
   );
}

// ✅ Componente NavItem Corregido
function NavItem({ item }: { item: typeof mainRoutes[0] }) {
   const pathname = usePathname();
   const hasPermission = useHasPermission(item.permissions);

   if (!hasPermission) return null;

   const isActive = pathname.startsWith(item.href);

   return (
      <Link
         href={item.href}
         className={cn(
            "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors relative",
            isActive
               ? "text-primary-foreground"
               : "text-foreground/70 hover:bg-accent hover:text-accent-foreground"
         )}
      >
         {isActive && (
            <motion.div
               layoutId="active-nav-pill"
               className="absolute inset-0 bg-primary rounded-md"
               style={{ borderRadius: 6 }}
               transition={{ type: "spring", stiffness: 350, damping: 30 }}
            />
         )}
         <item.icon className="h-5 w-5 mr-3 z-10 flex-shrink-0" />
         <span className="z-10">{item.label}</span>
      </Link>
   );
}
