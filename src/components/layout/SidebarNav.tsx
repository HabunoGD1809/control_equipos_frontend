"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

import { useHasPermission } from "@/hooks/useHasPermission";
import { cn } from "@/lib/utils";

export type NavItemProps = {
   href?: string;
   icon: React.ElementType;
   label: string;
   permissions: string[];
   subRoutes?: NavItemProps[];
};

interface SidebarNavProps {
   items: NavItemProps[];
   isCollapsed: boolean;
}

export function SidebarNav({ items, isCollapsed }: SidebarNavProps) {
   return (
      <nav className="flex flex-col gap-1">
         {items.map((item, index) =>
            item.subRoutes ? (
               <CollapsibleNavItem key={`collapsible-${index}`} item={item} isCollapsed={isCollapsed} />
            ) : (
               <NavItem key={item.href} item={item} isCollapsed={isCollapsed} />
            )
         )}
      </nav>
   );
}

function CollapsibleNavItem({ item, isCollapsed }: { item: NavItemProps; isCollapsed: boolean }) {
   const pathname = usePathname();
   const hasPermissionForAnySubRoute = useHasPermission(item.subRoutes?.flatMap(sub => sub.permissions) || []);
   const isAnySubRouteActive = item.subRoutes?.some(sub => sub.href && pathname.startsWith(sub.href)) || false;
   const [isOpen, setIsOpen] = useState(isAnySubRouteActive);

   useEffect(() => {
      if (isCollapsed) setIsOpen(false);
   }, [isCollapsed]);

   if (!hasPermissionForAnySubRoute) return null;

   return (
      <div className="flex flex-col mb-1">
         <button
            onClick={() => !isCollapsed && setIsOpen(!isOpen)}
            title={isCollapsed ? item.label : undefined}
            className={cn(
               "flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200 group outline-none focus-visible:ring-2 focus-visible:ring-primary/50 relative",
               isOpen && !isCollapsed
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
               isCollapsed ? "justify-center" : "justify-between"
            )}
         >
            <div className="flex items-center transition-transform duration-200 group-hover:translate-x-1">
               <item.icon className={cn(
                  "h-5 w-5 shrink-0 transition-colors",
                  isCollapsed ? "mr-0" : "mr-3",
                  isOpen && !isCollapsed ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
               )} />
               {!isCollapsed && <span>{item.label}</span>}
            </div>
            {!isCollapsed && (
               <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="h-4 w-4 opacity-50" />
               </motion.div>
            )}
         </button>

         <AnimatePresence initial={false}>
            {isOpen && !isCollapsed && (
               <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="overflow-hidden"
               >
                  {/* Línea guía vertical más suave */}
                  <div className="mt-1 ml-5 pl-4 border-l border-border/40 flex flex-col gap-1 relative">
                     {item.subRoutes?.map(subItem => (
                        <NavItem key={subItem.href} item={subItem} isCollapsed={false} isSubItem />
                     ))}
                  </div>
               </motion.div>
            )}
         </AnimatePresence>
      </div>
   );
}

function NavItem({ item, isCollapsed, isSubItem = false }: { item: NavItemProps; isCollapsed: boolean; isSubItem?: boolean }) {
   const pathname = usePathname();
   const hasPermission = useHasPermission(item.permissions);

   if (!hasPermission) return null;

   const isActive = item.href ? pathname.startsWith(item.href) : false;

   return (
      <Link
         href={item.href || "#"}
         title={isCollapsed ? item.label : undefined}
         className={cn(
            "flex items-center py-2 text-sm font-medium rounded-md transition-all duration-200 relative group outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
            isActive
               ? "text-primary bg-primary/10"
               : "text-muted-foreground hover:bg-accent hover:text-foreground",
            isCollapsed ? "justify-center px-3" : "px-3"
         )}
      >
         {/* Barra indicadora vertical (Estilo Linear/Vercel) */}
         {isActive && !isSubItem && !isCollapsed && (
            <motion.div
               layoutId="active-sidebar-indicator"
               className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 bg-primary rounded-r-full"
               transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
         )}

         {/* Animación de la píldora solo para modo colapsado (como un tooltip de fondo) */}
         {isActive && isCollapsed && (
            <motion.div
               layoutId="active-collapsed-pill"
               className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-md"
               transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
         )}

         <div className={cn(
            "flex items-center z-10 w-full transition-transform duration-200",
            !isActive && !isCollapsed && "group-hover:translate-x-1"
         )}>
            <item.icon className={cn(
               "shrink-0 transition-colors",
               isCollapsed ? "mr-0 h-5 w-5" : "mr-3",
               isSubItem ? "h-4 w-4" : "h-5 w-5",
               isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
            )} />

            {!isCollapsed && (
               <span className={cn(
                  "truncate",
                  isActive && "font-semibold"
               )}>
                  {item.label}
               </span>
            )}
         </div>
      </Link>
   );
}
