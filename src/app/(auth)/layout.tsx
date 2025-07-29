"use client";

import React from "react";
import { motion } from "framer-motion";

export default function AuthLayout({
   children,
}: {
   children: React.ReactNode;
}) {
   return (
      <div className="flex min-h-screen w-full items-center justify-center bg-muted/40">
         <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
         >
            {children}
         </motion.div>
      </div>
   );
}
