"use client";

import React, { createContext, useContext, useState } from "react";
import type { Usuario } from "@/types/api";

interface SessionContextType {
   user: Usuario | null;
   setUser: (user: Usuario | null) => void;
}

const SessionContext = createContext<SessionContextType>({
   user: null,
   setUser: () => { },
});

export function SessionProvider({
   children,
   user: initialUser,
}: {
   children: React.ReactNode;
   user: Usuario | null;
}) {
   const [user, setUser] = useState<Usuario | null>(initialUser);

   return (
      <SessionContext.Provider value={{ user, setUser }}>
         {children}
      </SessionContext.Provider>
   );
}

export function useSession() {
   return useContext(SessionContext);
}
