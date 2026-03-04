"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
      <nav className="flex flex-col gap-1.5">
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
      <div className="flex flex-col gap-1">
         <button
            onClick={() => !isCollapsed && setIsOpen(!isOpen)}
            title={isCollapsed ? item.label : undefined}
            className={cn(
               "flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
               isOpen && !isCollapsed ? "text-primary" : "text-foreground/70 hover:bg-accent/80 hover:text-accent-foreground",
               isCollapsed ? "justify-center" : "justify-between"
            )}
         >
            <div className="flex items-center transition-transform duration-200 group-hover:translate-x-1">
               <item.icon className={cn("h-5 w-5 shrink-0", isCollapsed ? "mr-0" : "mr-3", isOpen && !isCollapsed ? "text-primary" : "")} />
               {!isCollapsed && <span>{item.label}</span>}
            </div>
            {!isCollapsed && (
               <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
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
                  <div className="mt-1 ml-5 pl-3 border-l-2 border-primary/10 flex flex-col gap-1">
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
            "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 relative group outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
            isActive
               ? "text-primary-foreground shadow-sm"
               : "text-foreground/70 hover:bg-accent/80 hover:text-accent-foreground",
            isCollapsed ? "justify-center" : "justify-start"
         )}
      >
         {isActive && (
            <motion.div
               layoutId={isSubItem ? "active-sub-nav-pill" : "active-nav-pill"}
               className="absolute inset-0 bg-primary rounded-lg"
               transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
         )}

         <div className={cn(
            "flex items-center z-10 w-full transition-transform duration-200",
            !isActive && !isCollapsed && "group-hover:translate-x-1"
         )}>
            <item.icon className={cn(
               "h-5 w-5 shrink-0",
               isCollapsed ? "mr-0" : "mr-3",
               isSubItem && !isCollapsed ? "h-4 w-4" : ""
            )} />
            {!isCollapsed && <span className="truncate">{item.label}</span>}
         </div>
      </Link>
   );
}
