export function auditValue(value: unknown): string {
   if (value === null || value === undefined) return "Sin valor";
   if (typeof value === "object") return JSON.stringify(value, null, 2);
   return String(value);
}
export function auditChanges(before?: Record<string, unknown> | null, after?: Record<string, unknown> | null) {
   return [...new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])]
      .filter(key => key !== "updated_at" && JSON.stringify(before?.[key]) !== JSON.stringify(after?.[key]))
      .map(key => ({ key, before: before?.[key], after: after?.[key] }));
}
export function auditDateRange(start: string, end: string, offsetMinutes: number) {
   const valid = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
   if (!valid(start) || !valid(end) || start > end || !Number.isInteger(offsetMinutes) || Math.abs(offsetMinutes) > 840) throw new Error("Selecciona un rango de fechas válido.");
   return { start_time: new Date(Date.parse(start + "T00:00:00Z") + offsetMinutes * 60000).toISOString(), end_time: new Date(Date.parse(end + "T23:59:59.999Z") + offsetMinutes * 60000).toISOString() };
}
