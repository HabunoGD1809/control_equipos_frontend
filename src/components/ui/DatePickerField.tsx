"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Calendar } from "@/components/ui/Calendar";
import { FormControl, FormDescription, FormItem, FormLabel, FormMessage } from "@/components/ui/Form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { cn } from "@/lib/utils";

interface DatePickerFieldProps {
   label: string;
   value: Date | null | undefined;
   onChange: (d: Date | null) => void;
   disabled?: (date: Date) => boolean;
   description?: string;
}

export function DatePickerField({
   label,
   value,
   onChange,
   disabled,
   description,
}: DatePickerFieldProps) {
   const [open, setOpen] = useState(false);

   return (
      <FormItem className="flex flex-col">
         <FormLabel>{label}</FormLabel>
         <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
               <FormControl>
                  <Button
                     type="button"
                     variant="outline"
                     className={cn(
                        "w-full pl-3 text-left font-normal",
                        !value && "text-muted-foreground"
                     )}
                  >
                     {value ? format(value, "PPP") : <span>Seleccione fecha</span>}
                     <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
               </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
               <Calendar
                  mode="single"
                  selected={value ?? undefined}
                  onSelect={(d) => {
                     onChange(d ?? null);
                     setOpen(false); // ✅ cierra al seleccionar
                  }}
                  disabled={disabled}
                  initialFocus
               />
            </PopoverContent>
         </Popover>
         {description && <FormDescription>{description}</FormDescription>}
         <FormMessage />
      </FormItem>
   );
}
