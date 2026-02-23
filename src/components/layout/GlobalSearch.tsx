"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FileText, HardDrive, Wrench, Loader2, Search, CalendarClock } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

import {
   CommandDialog,
   CommandEmpty,
   CommandGroup,
   CommandInput,
   CommandItem,
   CommandList,
   CommandSeparator,
} from "@/components/ui/Command";
import { Badge } from "@/components/ui/Badge";

import type { GlobalSearchResult } from "@/types/api";
import { searchService } from "@/app/services/searchService";

function getMeta<T = unknown>(meta: GlobalSearchResult["metadata"], key: string): T | undefined {
   if (!meta || typeof meta !== "object") return undefined;
   return (meta as Record<string, unknown>)[key] as T | undefined;
}

export function GlobalSearch() {
   const [open, setOpen] = useState(false);
   const [query, setQuery] = useState("");
   const [results, setResults] = useState<GlobalSearchResult[]>([]);
   const [isLoading, setIsLoading] = useState(false);

   const debouncedQuery = useDebounce(query, 400);
   const router = useRouter();

   useEffect(() => {
      const down = (e: KeyboardEvent) => {
         if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            setOpen((v) => !v);
         }
      };
      document.addEventListener("keydown", down);
      return () => document.removeEventListener("keydown", down);
   }, []);

   useEffect(() => {
      const run = async () => {
         if (debouncedQuery.trim().length < 3) {
            setResults([]);
            return;
         }

         setIsLoading(true);
         try {
            const data = await searchService.global(debouncedQuery.trim());
            setResults(data);
         } catch (e) {
            console.error("Error en búsqueda global:", e);
            setResults([]);
         } finally {
            setIsLoading(false);
         }
      };

      run();
   }, [debouncedQuery]);

   const handleSelect = useCallback((result: GlobalSearchResult) => {
      setOpen(false);

      switch (result.tipo) {
         case "equipo":
            router.push(`/equipos/${result.id}`);
            break;

         case "mantenimiento": {
            const equipoId = getMeta<string>(result.metadata, "equipo_id");
            if (equipoId) router.push(`/equipos/${equipoId}?tab=mantenimientos`);
            else router.push(`/mantenimientos?highlight=${result.id}`);
            break;
         }

         case "documento": {
            const equipoId = getMeta<string>(result.metadata, "equipo_id");
            if (equipoId) router.push(`/equipos/${equipoId}?tab=documentacion`);
            else router.push(`/documentacion?highlight=${result.id}`);
            break;
         }
      }
   }, [router]);

   const renderIcon = (tipo: GlobalSearchResult["tipo"]) => {
      switch (tipo) {
         case "equipo":
            return <HardDrive className="mr-2 h-4 w-4 text-blue-500" />;
         case "documento":
            return <FileText className="mr-2 h-4 w-4 text-emerald-500" />;
         case "mantenimiento":
            return <Wrench className="mr-2 h-4 w-4 text-amber-500" />;
         default:
            return <Search className="mr-2 h-4 w-4" />;
      }
   };

   // Reseteamos el buscador al cerrarlo para no dejar estados sucios
   const handleOpenChange = (isOpen: boolean) => {
      setOpen(isOpen);
      if (!isOpen) {
         setTimeout(() => {
            setQuery("");
            setResults([]);
         }, 200);
      }
   };

   return (
      <>
         <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 relative w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64"
         >
            <span className="hidden lg:inline-flex">Buscar en el sistema...</span>
            <span className="inline-flex lg:hidden">Buscar...</span>
            <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
               <span className="text-xs">⌘</span>K
            </kbd>
         </button>

         <CommandDialog open={open} onOpenChange={handleOpenChange} shouldFilter={false}>
            <CommandInput
               placeholder="Buscar por serie, nombre, documento, mant..."
               value={query}
               onValueChange={setQuery}
            />
            <CommandList>
               {isLoading && (
                  <div className="py-6 text-center text-sm text-muted-foreground flex items-center justify-center">
                     <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" /> Buscando...
                  </div>
               )}

               {!isLoading && results.length === 0 && debouncedQuery.length >= 3 && (
                  <CommandEmpty>No se encontraron resultados para "{debouncedQuery}".</CommandEmpty>
               )}

               {!isLoading && results.length > 0 && (
                  <CommandGroup heading="Resultados encontrados (Ordenados por relevancia)">
                     {results.map((result) => {
                        const estado = getMeta<string>(result.metadata, "estado") || getMeta<string>(result.metadata, "estado_id"); // Fallback
                        const fecha = getMeta<string>(result.metadata, "fecha_programada");

                        return (
                           <CommandItem
                              key={`${result.tipo}-${result.id}`}
                              value={`${result.tipo}-${result.id}`} // Value único forzado
                              onSelect={() => handleSelect(result)}
                              className="cursor-pointer py-3"
                           >
                              {renderIcon(result.tipo)}
                              <div className="flex flex-col flex-1 mx-2 overflow-hidden">
                                 <span className="font-medium truncate">{result.titulo}</span>
                                 <span className="text-xs text-muted-foreground truncate">
                                    {result.descripcion ?? ""}
                                 </span>
                              </div>

                              <div className="flex items-center shrink-0">
                                 {result.tipo === "equipo" && estado && (
                                    <Badge variant="outline" className="ml-auto text-[10px]">
                                       {estado}
                                    </Badge>
                                 )}

                                 {result.tipo === "mantenimiento" && fecha && (
                                    <div className="ml-auto flex items-center text-[10px] text-muted-foreground bg-muted/50 px-2 py-1 rounded-sm">
                                       <CalendarClock className="mr-1 h-3 w-3" />
                                       {new Date(fecha).toLocaleDateString()}
                                    </div>
                                 )}
                              </div>
                           </CommandItem>
                        );
                     })}
                  </CommandGroup>
               )}

               <CommandSeparator />

               {results.length > 0 && (
                  <CommandGroup heading="Ayuda">
                     <CommandItem disabled className="text-xs text-muted-foreground">
                        Usa ↑↓ para navegar y Enter para abrir
                     </CommandItem>
                  </CommandGroup>
               )}
            </CommandList>
         </CommandDialog>
      </>
   );
}
