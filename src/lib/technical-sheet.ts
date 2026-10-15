import { z } from "zod";

export const EQUIPMENT_TYPES = ["Equipo", "Servidor", "Red", "Impresora", "UPS", "Almacenamiento", "Periférico", "Otro"] as const;
export const TECHNICAL_LABELS: Record<string, string> = {
   hostname: "Nombre de host", direccion_ip: "Dirección IP", direccion_mac: "Dirección MAC",
   sistema_operativo: "Sistema operativo", cpu: "Procesador", ram: "Memoria RAM",
   almacenamiento: "Discos / almacenamiento", rack: "Rack", posicion_rack: "Posición en rack (U)",
   puertos: "Puertos e interfaces", firmware: "Versión de firmware", vlan: "VLAN", red: "Red / subred",
   potencia: "Potencia", capacidad: "Capacidad", conexiones: "Conexiones / enlaces",
};
const presets: Record<string, string[]> = {
   Servidor: ["hostname", "direccion_ip", "direccion_mac", "sistema_operativo", "cpu", "ram", "almacenamiento", "rack", "posicion_rack"],
   Red: ["hostname", "direccion_ip", "direccion_mac", "puertos", "firmware", "vlan", "red", "rack", "posicion_rack", "conexiones"],
   Equipo: ["hostname", "sistema_operativo", "cpu", "ram", "almacenamiento"],
   Impresora: ["hostname", "direccion_ip", "direccion_mac", "firmware"],
   UPS: ["potencia", "capacidad", "rack"], Almacenamiento: ["capacidad", "puertos", "firmware"],
};
export function suggestedTechnicalFields(type: string, current: Record<string, string>) {
   return Object.fromEntries([...new Set([...Object.keys(current), ...(presets[type] ?? [])])].slice(0, 20).map(key => [key, current[key] ?? ""]));
}
export const technicalSheetSchema = z.record(z.string().trim().min(1).max(40), z.string().trim().max(500)).superRefine((data, ctx) => {
   if (Object.keys(data).length > 20) ctx.addIssue({ code: "custom", message: "La ficha admite hasta 20 campos." });
   if (Object.keys(data).some(key => /password|contrasena|secret|token/.test(key.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()))) ctx.addIssue({ code: "custom", message: "Las credenciales se gestionan fuera de la ficha técnica." });
   if (data.direccion_ip && !z.union([z.ipv4(), z.ipv6()]).safeParse(data.direccion_ip).success) ctx.addIssue({ code: "custom", message: "La dirección IP debe ser IPv4 o IPv6 válida." });
   if (data.direccion_mac && !/^(?:[\da-f]{2}:){5}[\da-f]{2}$|^(?:[\da-f]{2}-){5}[\da-f]{2}$/i.test(data.direccion_mac)) ctx.addIssue({ code: "custom", message: "La dirección MAC debe tener seis pares hexadecimales." });
});
