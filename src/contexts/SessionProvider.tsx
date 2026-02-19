"use client";

import React, { createContext, useContext } from "react";
import type { Usuario } from "@/types/api";

interface SessionContextType {
   user: Usuario | null;
}

const SessionContext = createContext<SessionContextType>({ user: null });

export function SessionProvider({
   children,
   user,
}: {
   children: React.ReactNode;
   user: Usuario | null;
}) {
   return (
      <SessionContext.Provider value={{ user }}>
         {children}
      </SessionContext.Provider>
   );
}

export function useSession() {
   return useContext(SessionContext);
}
