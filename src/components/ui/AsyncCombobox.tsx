"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/Command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { useDebounce } from "@/hooks/useDebounce";
import { Input } from "@/components/ui/Input";

export interface Option {
   value: string;
   label: string;
}

interface AsyncComboboxProps {
   value?: string | null;
   onChange: (value: string | null) => void;
   fetcher: (search: string) => Promise<Option[]>;
   placeholder?: string;
   emptyMessage?: string;
   defaultOptions?: Option[];
   disabled?: boolean;
}

// 🚀 CLAVE: Definir el array vacío FUERA del componente para que siempre tenga la misma referencia en memoria
const EMPTY_OPTIONS: Option[] = [];

export function AsyncCombobox({
   value,
   onChange,
   fetcher,
   placeholder = "Seleccione una opción...",
   emptyMessage = "No se encontraron resultados.",
   defaultOptions = EMPTY_OPTIONS,
   disabled = false,
}: AsyncComboboxProps) {
   const [open, setOpen] = React.useState(false);
   const [options, setOptions] = React.useState<Option[]>(defaultOptions);
   const [isLoading, setIsLoading] = React.useState(false);

   const [searchTerm, setSearchTerm] = React.useState("");
   const debouncedSearchTerm = useDebounce(searchTerm, 400);

   // 🚀 CLAVE 2: Guardar el fetcher en un ref para que no dispare re-renders si el padre lo cambia de memoria
   const fetcherRef = React.useRef(fetcher);
   React.useEffect(() => {
      fetcherRef.current = fetcher;
   }, [fetcher]);

   // 🚀 CLAVE 3: Convertimos a String para forzar una comparación de valores y matar el bucle infinito de raíz
   const defaultOptionsStr = React.useMemo(() => JSON.stringify(defaultOptions), [defaultOptions]);

   React.useEffect(() => {
      let isMounted = true;

      const loadOptions = async () => {
         if (!debouncedSearchTerm) {
            if (isMounted) {
               const parsedDefaults = JSON.parse(defaultOptionsStr);
               // Solo actualizamos el estado si realmente los datos cambiaron
               setOptions((prev) => {
                  if (JSON.stringify(prev) === defaultOptionsStr) return prev;
                  return parsedDefaults;
               });
               setIsLoading(false);
            }
            return;
         }

         setIsLoading(true);
         try {
            const results = await fetcherRef.current(debouncedSearchTerm);
            if (isMounted) setOptions(results);
         } catch (error) {
            console.error("Error fetching options:", error);
         } finally {
            if (isMounted) setIsLoading(false);
         }
      };

      loadOptions();
      return () => { isMounted = false; };
   }, [debouncedSearchTerm, defaultOptionsStr]);

   const selectedOption = React.useMemo(
      () => options.find((opt) => opt.value === value) || defaultOptions.find(opt => opt.value === value),
      [value, options, defaultOptions]
   );

   return (
      <Popover open={open} onOpenChange={(newOpen) => {
         setOpen(newOpen);
         if (!newOpen) setSearchTerm("");
      }}>
         <PopoverTrigger asChild>
            <Button
               variant="outline"
               role="combobox"
               aria-expanded={open}
               disabled={disabled}
               className={cn(
                  "w-full justify-between font-normal bg-background",
                  disabled && "opacity-50 cursor-not-allowed",
                  !selectedOption && "text-muted-foreground"
               )}
            >
               <span className="truncate">
                  {selectedOption ? selectedOption.label : placeholder}
               </span>
               <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
         </PopoverTrigger>

         <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
            <Command shouldFilter={false}>
               <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
                  <Input
                     placeholder="Escriba para buscar..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 shadow-none"
                  />
               </div>

               <CommandList>
                  {isLoading ? (
                     <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                     </div>
                  ) : options.length === 0 ? (
                     <CommandEmpty className="py-4 text-center text-sm text-muted-foreground">
                        {searchTerm.trim().length > 0 && searchTerm.trim().length < 3
                           ? "Escriba al menos 3 caracteres..."
                           : emptyMessage}
                     </CommandEmpty>
                  ) : (
                     <CommandGroup>
                        {options.map((option) => (
                           <CommandItem
                              key={option.value}
                              value={option.value}
                              onSelect={() => {
                                 onChange(option.value === value ? null : option.value);
                                 setOpen(false);
                              }}
                           >
                              <Check
                                 className={cn(
                                    "mr-2 h-4 w-4 shrink-0",
                                    value === option.value ? "opacity-100" : "opacity-0"
                                 )}
                              />
                              <span className="truncate">{option.label}</span>
                           </CommandItem>
                        ))}
                     </CommandGroup>
                  )}
               </CommandList>
            </Command>
         </PopoverContent>
      </Popover>
   );
}
