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
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.5 }}
      >
         <Card className={cn("overflow-hidden", className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
               <CardTitle className="text-sm font-medium">{title}</CardTitle>
               {icon}
            </CardHeader>
            <CardContent>
               <div className="text-2xl font-bold">{value}</div>
               {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </CardContent>
         </Card>
      </motion.div>
   );
}
