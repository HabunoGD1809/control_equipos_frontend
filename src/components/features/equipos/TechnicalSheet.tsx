"use client";

import { useId, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { TECHNICAL_LABELS, suggestedTechnicalFields } from "@/lib/technical-sheet";

export function TechnicalSheetEditor({ value, onChange, type, disabled }: {
   value: Record<string, string>; onChange: (value: Record<string, string>) => void; type: string; disabled?: boolean;
}) {
   const id = useId();
   const [newField, setNewField] = useState("");
   const key = newField.trim();
   const canAdd = !!key && key.length <= 40 && !Object.hasOwn(value, key) && Object.keys(value).length < 20;
   return <div className="min-w-0 space-y-4">
      <p className="text-sm text-muted-foreground">Datos técnicos y de conexión. Puedes agregar campos propios; las contraseñas y claves se gestionan fuera del inventario.</p>
      <Button type="button" variant="outline" className="h-auto min-h-10 w-full whitespace-normal sm:w-auto" disabled={disabled} onClick={() => onChange(suggestedTechnicalFields(type, value))}>Agregar campos sugeridos</Button>
      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
         {Object.entries(value).map(([name, content], index) => <div key={name} className="min-w-0 space-y-1">
            <label htmlFor={`${id}-${index}`} className="block text-sm font-medium break-words">{TECHNICAL_LABELS[name] ?? name}</label>
            <div className="flex min-w-0 gap-2">
               <Input id={`${id}-${index}`} value={content} maxLength={500} disabled={disabled} onChange={event => onChange({ ...value, [name]: event.target.value })} />
               <Button type="button" variant="ghost" size="icon" className="shrink-0" aria-label={`Quitar ${TECHNICAL_LABELS[name] ?? name}`} disabled={disabled} onClick={() => { const updated = { ...value }; delete updated[name]; onChange(updated); }}><Trash2 className="h-4 w-4" /></Button>
            </div>
         </div>)}
      </div>
      <div className="flex flex-wrap items-end gap-2">
         <div className="min-w-0 flex-1 basis-48 space-y-1"><label htmlFor={`${id}-new`} className="text-sm font-medium">Campo personalizado</label><Input id={`${id}-new`} placeholder="Ej: Etiqueta del puerto / circuito" value={newField} maxLength={40} disabled={disabled || Object.keys(value).length >= 20} onChange={event => setNewField(event.target.value)} /></div>
         <Button type="button" variant="outline" disabled={disabled || !canAdd} onClick={() => { onChange({ ...value, [key]: "" }); setNewField(""); }}><Plus className="mr-2 h-4 w-4" />Agregar campo</Button>
      </div>
      {key && Object.hasOwn(value, key) && <p className="text-sm text-destructive">Ese campo ya está en la ficha.</p>}
   </div>;
}

export function TechnicalSheetSummary({ value }: { value?: Record<string, string> }) {
   const entries = Object.entries(value ?? {}).filter(([, content]) => content.trim());
   return entries.length ? <dl className="grid min-w-0 gap-4 sm:grid-cols-2">{entries.map(([key, content]) => <div key={key} className="min-w-0"><dt className="text-sm text-muted-foreground break-words">{TECHNICAL_LABELS[key] ?? key}</dt><dd className="mt-1 whitespace-pre-wrap text-sm font-medium [overflow-wrap:anywhere]">{content}</dd></div>)}</dl> : <p className="text-sm text-muted-foreground">Aún no hay especificaciones técnicas. Agrégalas desde Editar equipo.</p>;
}
