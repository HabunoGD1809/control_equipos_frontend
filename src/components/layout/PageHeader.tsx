import React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
   title: string;
   description?: string;
   actions?: React.ReactNode;
}

export function PageHeader({
   title,
   description,
   actions,
   className,
   ...props
}: PageHeaderProps) {
   return (
      <div
         className={cn(
            "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-2 sm:pb-4 border-b border-transparent",
            className
         )}
         {...props}
      >
         <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl text-foreground">
               {title}
            </h1>
            {description && (
               <p className="text-sm text-muted-foreground md:text-base max-w-2xl">
                  {description}
               </p>
            )}
         </div>
         {actions && (
            <div className="flex items-center gap-2 shrink-0">
               {actions}
            </div>
         )}
      </div>
   );
}
