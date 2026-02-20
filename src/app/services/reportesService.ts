import type { ReporteParams } from "@/types/api";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const PROXY_PREFIX = "/api/proxy";

export const reportesService = {
   async generarReporte(params: ReporteParams): Promise<void> {
      let endpoint = "";
      const queryParams = new URLSearchParams({ limit: "1000" }); // Traer un batch grande para el reporte

      // 1. Determinar el endpoint adecuado según la API y asignar parámetros de fecha si aplican
      switch (params.tipo_reporte) {
         case "equipos":
            endpoint = "/equipos/";
            break;
         case "mantenimientos":
            endpoint = "/mantenimientos/";
            if (params.fecha_inicio) queryParams.append("start_date", new Date(params.fecha_inicio).toISOString());
            if (params.fecha_fin) queryParams.append("end_date", new Date(params.fecha_fin).toISOString());
            break;
         case "inventario":
            endpoint = "/inventario/movimientos/";
            if (params.fecha_inicio) queryParams.append("start_date", new Date(params.fecha_inicio).toISOString());
            if (params.fecha_fin) queryParams.append("end_date", new Date(params.fecha_fin).toISOString());
            break;
         case "movimientos":
            endpoint = "/movimientos/";
            // El endpoint de movimientos no filtra por fecha en BD, filtraremos en memoria
            break;
         case "auditoria":
            endpoint = "/auditoria/";
            if (params.fecha_inicio) queryParams.append("start_time", new Date(params.fecha_inicio).toISOString());
            if (params.fecha_fin) queryParams.append("end_time", new Date(params.fecha_fin).toISOString());
            break;
      }

      // 2. Consultar al backend
      const res = await fetch(`${PROXY_PREFIX}${endpoint}?${queryParams.toString()}`);
      if (!res.ok) {
         const errorData = await res.json().catch(() => null);
         throw new Error(errorData?.detail || `Error del servidor HTTP ${res.status}`);
      }

      const rawData = await res.json();
      let dataList: any[] = Array.isArray(rawData) ? rawData : rawData.items || [];

      // Filtro manual en memoria para endpoints que no soportan filtrado por fecha nativo
      if (params.tipo_reporte === "equipos" || params.tipo_reporte === "movimientos") {
         const start = new Date(params.fecha_inicio).getTime();
         const end = new Date(params.fecha_fin).getTime();

         dataList = dataList.filter((item: any) => {
            const itemDate = new Date(item.created_at || item.fecha_hora || item.fecha_adquisicion || Date.now()).getTime();
            return itemDate >= start && itemDate <= end;
         });
      }

      if (dataList.length === 0) {
         throw new Error("No hay datos disponibles para el rango de fechas seleccionado.");
      }

      // 3. Mapear la data cruda a un formato tabular y amigable
      const mappedData = this.mapearDatos(params.tipo_reporte, dataList);
      const fileName = `Reporte_${params.tipo_reporte.toUpperCase()}_${Date.now()}`;

      // 4. Generar el archivo final
      if (params.formato === "excel") {
         this.generarExcel(mappedData, `${fileName}.xlsx`);
      } else {
         this.generarPDF(mappedData, params.tipo_reporte, `${fileName}.pdf`);
      }
   },

   mapearDatos(tipo: string, data: any[]): Record<string, string | number>[] {
      switch (tipo) {
         case "equipos":
            return data.map((d) => ({
               "Nombre": d.nombre,
               "N. Serie": d.numero_serie,
               "Código": d.codigo_interno || "N/A",
               "Estado": d.estado?.nombre || d.estado_id,
               "Ubicación": d.ubicacion_actual || "N/A",
               "Marca": d.marca || "N/A",
               "Modelo": d.modelo || "N/A",
               "F. Adquisición": d.fecha_adquisicion || "N/A",
               "Valor": d.valor_adquisicion || "0.00"
            }));

         case "mantenimientos":
            return data.map((d) => ({
               "Equipo": d.equipo?.nombre || "N/A",
               "Técnico": d.tecnico_responsable,
               "Estado": d.estado,
               "Prioridad": d.prioridad === 2 ? "Alta" : d.prioridad === 1 ? "Media" : "Baja",
               "F. Programada": d.fecha_programada ? new Date(d.fecha_programada).toLocaleDateString() : "N/A",
               "Costo": d.costo_real || d.costo_estimado || "0.00"
            }));

         case "inventario":
            return data.map((d) => ({
               "Movimiento": d.tipo_movimiento,
               "Ítem": d.tipo_item?.nombre || "N/A",
               "Cantidad": d.cantidad,
               "Origen": d.ubicacion_origen || "N/A",
               "Destino": d.ubicacion_destino || "N/A",
               "Fecha": d.fecha_hora ? new Date(d.fecha_hora).toLocaleDateString() : "N/A"
            }));

         case "movimientos":
            return data.map((d) => ({
               "Equipo": d.equipo?.nombre || "N/A",
               "Tipo": d.tipo_movimiento,
               "Estado": d.estado,
               "Origen": d.origen || "N/A",
               "Destino": d.destino || "N/A",
               "Fecha": d.fecha_hora ? new Date(d.fecha_hora).toLocaleString() : "N/A",
               "Recibido por": d.recibido_por || "N/A"
            }));

         case "auditoria":
            return data.map((d) => ({
               "Tabla": d.table_name,
               "Operación": d.operation,
               "Usuario DB": d.username || "Sistema",
               "Fecha": d.audit_timestamp ? new Date(d.audit_timestamp).toLocaleString() : "N/A"
            }));

         default:
            // Fallback genérico aplanando el objeto principal
            return data.map((d) => {
               const flat: Record<string, string> = {};
               Object.keys(d).forEach(k => flat[k] = String(d[k] ?? "N/A"));
               return flat;
            });
      }
   },

   generarExcel(data: Record<string, string | number>[], fileName: string) {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Datos");
      XLSX.writeFile(workbook, fileName);
   },

   generarPDF(data: Record<string, string | number>[], titulo: string, fileName: string) {
      const doc = new jsPDF("landscape");

      // Cabecera del Documento
      doc.setFontSize(16);
      doc.text(`Reporte de ${titulo.toUpperCase()}`, 14, 20);
      doc.setFontSize(10);
      doc.text(`Generado el: ${new Date().toLocaleString()}`, 14, 28);

      // Extraer cabeceras y filas del objeto JSON
      const columns = Object.keys(data[0] || {});
      const rows = data.map((obj) => Object.values(obj).map((v) => String(v)));

      autoTable(doc, {
         head: [columns],
         body: rows,
         startY: 35,
         theme: "striped",
         headStyles: { fillColor: [41, 128, 185], textColor: 255 },
         styles: { fontSize: 8, cellPadding: 3 },
      });

      doc.save(fileName);
   },
};
