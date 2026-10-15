"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { cn } from "@/lib/utils"

interface StatCardProps {
   title: string;
   value: string | number;
   icon: React.ReactNode;
   description?: string;
   className?: string;
}

export function StatCard({ title, value, icon, description, className }: StatCardProps) {
   return (
      <motion.div
         initial={{ opacity: 0, y: 15 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.4, ease: "easeOut" }}
         className="h-full"
      >
         <Card className={cn("overflow-hidden h-full flex flex-col shadow-sm", className)}>
            <CardHeader className="flex flex-col-reverse items-start justify-between gap-2 space-y-0 bg-transparent p-4 pb-2">
               <CardTitle className="min-w-0 break-words text-sm font-semibold leading-snug tracking-tight text-foreground/80">
                  {title}
               </CardTitle>
               <div className="shrink-0 p-2 rounded-lg bg-background/50 shadow-sm border border-muted/50 backdrop-blur-sm">
                  {icon}
               </div>
            </CardHeader>
            <CardContent className="min-w-0 flex-1 flex flex-col justify-end p-4 pt-2">
               <div className="break-words text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {value}
               </div>
               {description && (
                  <p className="text-xs font-medium text-muted-foreground mt-1">
                     {description}
                  </p>
               )}
            </CardContent>
         </Card>
      </motion.div>
   );
}
