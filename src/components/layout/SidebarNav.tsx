"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";

import { useHasPermission } from "@/hooks/useHasPermission";
import { cn } from "@/lib/utils";

// --- Tipos y Componentes de Navegación ---

export type NavItemProps = {
   href?: string;
   icon: React.ElementType;
   label: string;
   permissions: string[];
   subRoutes?: NavItemProps[];
};

interface SidebarNavProps {
   items: NavItemProps[];
}

// Componente principal que decide si renderizar un item simple o uno desplegable
export function SidebarNav({ items }: SidebarNavProps) {
   return (
      <nav className="flex flex-col gap-1">
         {items.map((item, index) =>
            item.subRoutes ? (
               <CollapsibleNavItem key={`collapsible-${index}`} item={item} />
            ) : (
               <NavItem key={item.href} item={item} />
            )
         )}
      </nav>
   );
}

// Componente para Items Desplegables
function CollapsibleNavItem({ item }: { item: NavItemProps }) {
   const pathname = usePathname();
   const hasPermissionForAnySubRoute = useHasPermission(item.subRoutes?.flatMap(sub => sub.permissions) || []);

   const isAnySubRouteActive = item.subRoutes?.some(sub => sub.href && pathname.startsWith(sub.href)) || false;
   const [isOpen, setIsOpen] = useState(isAnySubRouteActive);

   if (!hasPermissionForAnySubRoute) return null;

   return (
      <div>
         <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md transition-colors text-foreground/70 hover:bg-accent hover:text-accent-foreground"
         >
            <div className="flex items-center">
               <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
               <span>{item.label}</span>
            </div>
            <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
            </motion.div>
         </button>
         {isOpen && (
            <div className="mt-1 ml-4 pl-4 border-l-2 border-dashed border-muted">
               {item.subRoutes?.map(subItem => (
                  <NavItem key={subItem.href} item={subItem} />
               ))}
            </div>
         )}
      </div>
   );
}

// Componente Original para Items Simples
function NavItem({ item }: { item: NavItemProps }) {
   const pathname = usePathname();
   const hasPermission = useHasPermission(item.permissions);

   if (!hasPermission) return null;

   const isActive = item.href ? pathname.startsWith(item.href) : false;

   return (
      <Link
         href={item.href || "#"}
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
