"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/Command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { useDebounce } from "@/hooks/useDebounce";

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

   const debouncedSearchTerm = useDebounce(searchTerm, 300);

   React.useEffect(() => {
      let isMounted = true;

      const loadOptions = async () => {
         if (!debouncedSearchTerm && defaultOptions.length > 0) {
            setOptions(defaultOptions);
            return;
         }

         setIsLoading(true);
         try {
            const results = await fetcher(debouncedSearchTerm);
            if (isMounted) {
               const valueExistsInResults = results.some(r => r.value === value);
               const defaultSelected = defaultOptions.find(d => d.value === value);

               if (value && !valueExistsInResults && defaultSelected) {
                  setOptions([defaultSelected, ...results]);
               } else {
                  setOptions(results);
               }
            }
         } catch (error) {
            console.error("Error fetching options:", error);
         } finally {
            if (isMounted) {
               setIsLoading(false);
            }
         }
      };

      loadOptions();

      return () => {
         isMounted = false;
      };
   }, [debouncedSearchTerm, fetcher, defaultOptions, value]);

   const selectedOption = React.useMemo(
      () => options.find((opt) => opt.value === value),
      [value, options]
   );

   return (
      <Popover open={open} onOpenChange={setOpen}>
         <PopoverTrigger asChild>
            <Button
               variant="outline"
               role="combobox"
               aria-expanded={open}
               disabled={disabled}
               className={cn(
                  "w-full justify-between font-normal bg-background",
                  disabled && "opacity-50 cursor-not-allowed"
               )}
            >
               {selectedOption ? (
                  <span className="truncate">{selectedOption.label}</span>
               ) : (
                  <span className="text-muted-foreground">{placeholder}</span>
               )}
               <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
         </PopoverTrigger>
         <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
            <Command shouldFilter={false}>
               <CommandInput placeholder="Escriba para buscar..." value={searchTerm} onValueChange={setSearchTerm} />
               <CommandList>
                  {isLoading && (
                     <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                     </div>
                  )}
                  {!isLoading && options.length === 0 && (
                     <CommandEmpty>
                        {/* 🚀 UX FIX: Mensaje dinámico si faltan letras */}
                        {searchTerm.trim().length > 0 && searchTerm.trim().length < 3
                           ? "Escriba al menos 3 caracteres..."
                           : emptyMessage}
                     </CommandEmpty>
                  )}
                  <CommandGroup>
                     {!isLoading &&
                        options.map((option) => (
                           <CommandItem
                              key={option.value}
                              value={option.value}
                              onSelect={() => {
                                 onChange(option.value === value ? null : option.value);
                                 setOpen(false);
                              }}
                           >
                              <Check
                                 className={cn("mr-2 h-4 w-4 shrink-0", value === option.value ? "opacity-100" : "opacity-0")}
                              />
                              <span className="truncate">{option.label}</span>
                           </CommandItem>
                        ))}
                  </CommandGroup>
               </CommandList>
            </Command>
         </PopoverContent>
      </Popover>
   );
}
