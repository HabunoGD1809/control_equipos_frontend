"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { UseFormReturn, useWatch } from "react-hook-form";
import { AsyncCombobox } from "@/components/ui/AsyncCombobox";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/Form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { useHasPermission } from "@/hooks/useHasPermission";
import { collectPages } from "@/lib/collection-pages";
import { api } from "@/lib/http";
import { EquipoRead, LicenciaSoftware, Mantenimiento } from "@/types/api";
import type { UploadDocumentoValues } from "./UploadDocumentoForm";

type Association = "equipo_id" | "mantenimiento_id" | "licencia_id";

export function DocumentAssociationField({ form }: { form: UseFormReturn<UploadDocumentoValues> }) {
   const canSeeAssets = useHasPermission(["ver_equipos"]);
   const canSeeMaintenance = useHasPermission(["ver_mantenimientos"]);
   const canSeeLicenses = useHasPermission(["ver_licencias"]);
   const available = [
      ...(canSeeAssets ? [{ value: "equipo_id" as const, label: "Equipo" }] : []),
      ...(canSeeMaintenance ? [{ value: "mantenimiento_id" as const, label: "Mantenimiento" }] : []),
      ...(canSeeLicenses ? [{ value: "licencia_id" as const, label: "Licencia de software" }] : []),
   ];
   const [chosen, setChosen] = useState<Association>();
   const kind = available.find(item => item.value === chosen)?.value ?? available[0]?.value;
   const selected = useWatch({ control: form.control, name: kind ?? "equipo_id" });
   const options = useQuery({
      queryKey: ["document-associations", kind],
      enabled: !!kind,
      queryFn: async () => {
         if (kind === "equipo_id") {
            const rows = await collectPages<EquipoRead>((skip, limit) => api.get("/equipos/", { params: { skip, limit } }));
            return rows.map(row => ({ value: row.id, label: `${row.nombre} · ${row.numero_serie || "Sin serie"}` }));
         }
         if (kind === "mantenimiento_id") {
            const rows = await collectPages<Mantenimiento>((skip, limit) => api.get("/mantenimientos/", { params: { skip, limit } }));
            return rows.map(row => ({ value: row.id, label: `${row.equipo.nombre} · ${row.tipo_mantenimiento.nombre} · ${row.estado} · ${row.id.slice(0, 8)}` }));
         }
         const rows = await collectPages<LicenciaSoftware>((skip, limit) => api.get("/licencias/", { params: { skip, limit } }));
         return rows.map(row => ({ value: row.id, label: `${row.software_info.nombre} · ${row.numero_orden_compra || row.id.slice(0, 8)}` }));
      },
   });

   if (!kind) return <p role="alert" className="text-sm text-destructive">Necesitas acceso a equipos, mantenimientos o licencias para seleccionar el expediente del documento.</p>;

   return <div className="space-y-4">
      <div className="space-y-2">
         <Label htmlFor="document-association-kind">Tipo de expediente</Label>
         <Select value={kind} onValueChange={value => {
            setChosen(value as Association);
            for (const key of ["equipo_id", "mantenimiento_id", "licencia_id"] as const) form.setValue(key, null, { shouldDirty: true });
            form.clearErrors(["equipo_id", "mantenimiento_id", "licencia_id"]);
         }}>
            <SelectTrigger id="document-association-kind"><SelectValue /></SelectTrigger>
            <SelectContent>{available.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
         </Select>
      </div>
      <FormField control={form.control} name={kind} render={({ field }) => <FormItem>
         <FormLabel>Vincular documento <span className="text-destructive">*</span></FormLabel>
         <FormControl><AsyncCombobox key={kind} value={selected} onChange={field.onChange}
            placeholder={options.isPending ? "Cargando expedientes..." : "Buscar expediente..."}
            defaultOptions={options.data ?? []} disabled={options.isPending || options.isError}
            emptyMessage="No hay expedientes que coincidan con la búsqueda."
            fetcher={async search => (options.data ?? []).filter(item => item.label.toLocaleLowerCase().includes(search.toLocaleLowerCase()))} /></FormControl>
         <FormMessage />
      </FormItem>} />
      {kind !== "equipo_id" && form.formState.errors.equipo_id?.message && <p role="alert" className="text-sm text-destructive">{form.formState.errors.equipo_id.message}</p>}
      {options.isError && <div role="alert" className="text-sm text-destructive">No se pudieron cargar los expedientes. <Button type="button" variant="outline" size="sm" onClick={() => options.refetch()}>Reintentar</Button></div>}
   </div>;
}
