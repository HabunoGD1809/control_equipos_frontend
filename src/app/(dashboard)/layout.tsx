"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useAuthStore } from "@/store/authStore";

export default function DashboardLayout({
   children,
}: {
   children: React.ReactNode;
}) {
   const { isAuthenticated, isLoading, checkAuthStatus } = useAuthStore();
   const router = useRouter();

   useEffect(() => {
      checkAuthStatus();
   }, [checkAuthStatus]);

   useEffect(() => {
      if (!isLoading && !isAuthenticated) {
         router.push('/login');
      }
   }, [isLoading, isAuthenticated, router]);

   if (isLoading) {
      return (
         <div className="flex h-screen items-center justify-center bg-background">
            <p className="text-muted-foreground">Cargando sesión...</p>
         </div>
      );
   }

   if (!isAuthenticated) {
      return null;
   }

   return (
      <div className="flex h-screen bg-secondary/20">
         <Sidebar />
         <main className="flex-1 flex flex-col md:ml-64">
            <Header />
            <div className="flex-1 overflow-y-auto p-6 lg:p-8">
               {children}
            </div>
         </main>
      </div>
   );
}
