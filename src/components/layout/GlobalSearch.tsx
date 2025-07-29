"use client"

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileText, HardDrive, Wrench } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import api from "@/lib/api";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/Command";
import { Button } from "@/components/ui/Button";

interface SearchResult {
   id: string;
   tipo: 'equipo' | 'documento' | 'mantenimiento';
   titulo: string;
   descripcion: string;
}

const getIcon = (type: SearchResult['tipo']) => {
   switch (type) {
      case 'equipo': return <HardDrive className="mr-2 h-4 w-4" />;
      case 'documento': return <FileText className="mr-2 h-4 w-4" />;
      case 'mantenimiento': return <Wrench className="mr-2 h-4 w-4" />;
      default: return null;
   }
}

export function GlobalSearch() {
   const [open, setOpen] = useState(false);
   const [query, setQuery] = useState("");
   const [results, setResults] = useState<SearchResult[]>([]);
   const debouncedQuery = useDebounce(query, 300);
   const router = useRouter();

   useEffect(() => {
      const down = (e: KeyboardEvent) => {
         if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            setOpen((open) => !open);
         }
      };
      document.addEventListener("keydown", down);
      return () => document.removeEventListener("keydown", down);
   }, []);

   useEffect(() => {
      const search = async () => {
         if (debouncedQuery.length > 2) {
            try {
               const response = await api.get<SearchResult[]>(`/equipos/search/global?q=${debouncedQuery}`);
               setResults(response.data);
            } catch (error) {
               console.error("Search failed:", error);
               setResults([]);
            }
         } else {
            setResults([]);
         }
      };
      search();
   }, [debouncedQuery]);

   const handleSelect = (result: SearchResult) => {
      const path = result.tipo === 'equipo' ? `/equipos/${result.id}` : `/${result.tipo}s/${result.id}`; // Simplificación
      router.push(path);
      setOpen(false);
   }

   return (
      <>
         <Button
            variant="outline"
            className="w-full justify-start text-muted-foreground sm:w-40 lg:w-64"
            onClick={() => setOpen(true)}
         >
            Buscar...
            <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
               <span className="text-xs">⌘</span>K
            </kbd>
         </Button>
         <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput
               placeholder="Buscar equipos, documentos, mantenimientos..."
               value={query}
               onValueChange={setQuery}
            />
            <CommandList>
               <CommandEmpty>No se encontraron resultados.</CommandEmpty>
               {results.length > 0 && (
                  <CommandGroup heading="Resultados">
                     {results.map((result) => (
                        <CommandItem key={result.id} onSelect={() => handleSelect(result)}>
                           {getIcon(result.tipo)}
                           <div>
                              <span>{result.titulo}</span>
                              <p className="text-xs text-muted-foreground">{result.descripcion}</p>
                           </div>
                        </CommandItem>
                     ))}
                  </CommandGroup>
               )}
            </CommandList>
         </CommandDialog>
      </>
   );
}
