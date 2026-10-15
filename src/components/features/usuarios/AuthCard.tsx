"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CompanyBrand } from "@/components/features/empresa/CompanyBrand";

export function AuthCard({ title, description, children, backHref }: { title: string; description: string; children: ReactNode; backHref?: string }) {
   return <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full min-w-0 max-w-100">
      <Card className="w-full">
         <CardHeader className="text-center">
            <div className="mb-4 flex items-center justify-center"><CompanyBrand /></div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
         </CardHeader>
         <CardContent>
            {children}
            {backHref && <Button asChild variant="outline" className="mt-4 w-full"><Link href={backHref}><ArrowLeft className="mr-2 h-4 w-4" />Volver al inicio de sesión</Link></Button>}
         </CardContent>
      </Card>
   </motion.div>;
}
