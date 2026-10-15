export function reportExtension(format: string): string {
   return format.toLowerCase() === "excel" ? "xlsx" : format.toLowerCase();
}

export function downloadReportBlob(blob: Blob, filename?: string): void {
   const extension = blob.type.includes("pdf") ? "pdf" : blob.type.includes("spreadsheet") ? "xlsx" : blob.type.includes("csv") ? "csv" : "bin";
   const url = URL.createObjectURL(blob);
   const anchor = document.createElement("a");
   anchor.href = url;
   anchor.download = filename ?? `Reporte_${Date.now()}.${extension}`;
   document.body.appendChild(anchor);
   anchor.click();
   anchor.remove();
   window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
