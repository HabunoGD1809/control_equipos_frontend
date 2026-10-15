"use client";

import { useId } from "react";
import { CONSUMABLE_COLORS, type ConsumableColor } from "@/lib/consumable-colors";

export function ColorSwatch({ color }: { color: string | null | undefined }) {
   const match = CONSUMABLE_COLORS.find(item => item.name === color);
   return match ? <span aria-hidden="true" className="inline-block h-4 w-4 shrink-0 rounded-full border border-black/15 ring-1 ring-white/30" style={{ background: match.background }} /> : null;
}

export function ConsumableColorPicker({ value, onChange, ...props }: { value?: string | null; onChange: (color: ConsumableColor | null) => void; id?: string; "aria-describedby"?: string; "aria-invalid"?: boolean }) {
   const group = useId();
   const options = [...CONSUMABLE_COLORS, { name: "No aplica", code: "", background: "transparent" }];
   return (
      <div role="radiogroup" aria-label="Color del consumible" className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3" {...props}>
         {options.map(option => {
            const color = option.name === "No aplica" ? null : option.name as ConsumableColor;
            return (
               <label key={option.name} className="flex min-w-0 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border p-2 text-center text-sm transition-colors hover:bg-accent has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring sm:flex-row sm:justify-start sm:gap-2 sm:p-3 sm:text-left">
                  <input type="radio" name={group} value={color ?? ""} checked={(value ?? null) === color} onChange={() => onChange(color)} className="sr-only" />
                  {color ? <ColorSwatch color={color} /> : <span aria-hidden="true" className="h-4 w-4 shrink-0 rounded-full border border-dashed" />}
                  <span className="min-w-0 break-words leading-tight">{option.name}</span>
                  {option.code && <span aria-hidden="true" className="ml-auto hidden text-[10px] text-muted-foreground sm:inline">{option.code}</span>}
               </label>
            );
         })}
      </div>
   );
}
