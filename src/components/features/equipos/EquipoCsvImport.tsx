"use client";

import { useRef, useState } from "react";
import { Download, Loader2, UploadCloud } from "lucide-react";
import { equiposService } from "@/app/services/equiposService";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/use-toast";
import { getFriendlyErrorMessage } from "@/lib/error-handling";
import { downloadReportBlob } from "@/lib/report-download";
import type { EquipoBulkResult } from "@/types/api";

const template = [
   ["nombre", "numero_serie", "tipo_activo", "estado", "ubicacion_actual", "marca", "modelo", "codigo_interno", "proveedor", "fecha_adquisicion", "valor_adquisicion", "tecnico.hostname", "tecnico.direccion_ip", "tecnico.ram", "tecnico.rack", "tecnico.posicion_rack", "notas"],
   ["Servidor de ejemplo", "EJEMPLO-SRV-001", "Servidor", "", "", "", "", "", "", "", "", "srv-ejemplo-01", "192.0.2.10", "64 GB", "R1", "U12-U14", "Reemplaza esta fila antes de importar"],
].map(row => row.map(value => `"${value.replaceAll('"', '""')}"`).join(",")).join("\r\n");

export function EquipoCsvImport({ onSuccess }: { onSuccess: () => void }) {
   const [open, setOpen] = useState(false);
   const [busy, setBusy] = useState(false);
   const [result, setResult] = useState<EquipoBulkResult | null>(null);
   const input = useRef<HTMLInputElement>(null);
   const { toast } = useToast();

   async function upload(event: React.ChangeEvent<HTMLInputElement>) {
      const file = event.currentTarget.files?.[0];
      event.currentTarget.value = "";
      if (!file) return;
      if (!file.name.toLowerCase().endsWith(".csv") || file.size > 10 * 1024 * 1024) {
         toast({ variant: "destructive", title: "Archivo inválido", description: "Selecciona un CSV de hasta 10 MB." });
         return;
      }
      setBusy(true);
      setResult(null);
      try {
         const response = await equiposService.bulkUpload(file);
         setResult(response);
         if (response.insertados > 0) onSuccess();
      } catch (error) {
         toast({ variant: "destructive", title: "No se pudo importar", description: getFriendlyErrorMessage(error).message });
      } finally {
         setBusy(false);
      }
   }

   return <>
      <Button variant="secondary" className="shadow-sm" onClick={() => { setResult(null); setOpen(true); }}>
         <UploadCloud className="mr-2 h-4 w-4" /> Importar CSV
      </Button>
      <Dialog open={open} onOpenChange={value => { if (!busy) setOpen(value); }}>
         <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
               <DialogTitle>Importar equipos</DialogTitle>
               <DialogDescription>Carga equipos, servidores y dispositivos de red sin registrarlos uno por uno.</DialogDescription>
            </DialogHeader>
            <div className="min-w-0 space-y-4 text-sm [overflow-wrap:anywhere]">
               <p>Descarga la plantilla y reemplaza la fila de ejemplo. <strong>nombre</strong> y <strong>numero_serie</strong> son obligatorios; cada serie debe ser única.</p>
               <p>Estado, ubicación, marca y proveedor deben coincidir con los catálogos. Si omites el estado, se utiliza el estado operativo disponible con el nombre configurado en el catálogo. Las fechas usan AAAA-MM-DD y los importes, punto decimal.</p>
               <p>Las columnas <strong>tecnico.</strong> guardan la ficha técnica. Puedes añadir campos como <strong>tecnico.vlan</strong> o <strong>tecnico.puertos</strong>. Las entregas a custodios se registran después desde Movimientos.</p>
               <p className="text-muted-foreground">CSV UTF-8 con coma o punto y coma. Máximo 5000 filas y 10 MB. Las filas válidas se guardan; los errores se detallan aquí para corregirlos. Importa de nuevo únicamente las filas rechazadas.</p>
               <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <Button type="button" variant="outline" disabled={busy} onClick={() => downloadReportBlob(new Blob(["\ufeff", template], { type: "text/csv;charset=utf-8" }), "Plantilla_equipos.csv")}>
                     <Download className="mr-2 h-4 w-4" /> Descargar plantilla
                  </Button>
                  <Button type="button" disabled={busy} onClick={() => input.current?.click()}>
                     {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                     {busy ? "Importando…" : "Seleccionar CSV"}
                  </Button>
                  <input ref={input} type="file" accept=".csv,text/csv" className="hidden" aria-label="Archivo CSV de equipos" disabled={busy} onChange={upload} />
               </div>
               {result && <div role="status" className="space-y-3 rounded-lg border p-3">
                  <p className="font-medium">Resultado: {result.insertados} guardados de {result.total_procesados} filas.</p>
                  {result.errores.length > 0 ? <>
                     <p>Corrige estas {result.errores.length} filas antes de volver a importarlas:</p>
                     <ol className="list-decimal space-y-2 pl-5">{result.errores.map((error, index) => <li key={index}>{error}</li>)}</ol>
                  </> : <p>Todos los equipos se guardaron correctamente.</p>}
               </div>}
            </div>
         </DialogContent>
      </Dialog>
   </>;
}
