import { z } from "zod";

export type Empresa = { nombre: string; identificacion: string | null; direccion: string | null; telefono: string | null; email: string | null; logo_url: string | null; updated_at?: string | null };

export const companySchema = z.object({
   nombre: z.string().trim().min(1, "Escribe el nombre de la empresa.").max(150, "Máximo 150 caracteres."),
   identificacion: z.string().trim().max(50, "Máximo 50 caracteres."),
   direccion: z.string().trim().max(500, "Máximo 500 caracteres."),
   telefono: z.string().trim().max(50, "Máximo 50 caracteres."),
   email: z.string().trim().max(254, "Máximo 254 caracteres.").refine(value => !value || z.email().safeParse(value).success, "Escribe un correo válido."),
});
export type CompanyValues = z.infer<typeof companySchema>;
export function companyValues(company: Empresa): CompanyValues {
   return { nombre: company.nombre, identificacion: company.identificacion ?? "", direccion: company.direccion ?? "", telefono: company.telefono ?? "", email: company.email ?? "" };
}
export function companyPayload(values: CompanyValues) {
   const clean = companySchema.parse(values);
   return { nombre: clean.nombre, identificacion: clean.identificacion || null, direccion: clean.direccion || null, telefono: clean.telefono || null, email: clean.email || null };
}

export function validateCompanyLogo(file: Pick<File, "type" | "size">): string | null {
   if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) return "Selecciona una imagen PNG, JPG o WEBP.";
   if (file.size > 2 * 1024 * 1024) return "El logo debe pesar hasta 2 MB.";
   if (!file.size) return "La imagen está vacía.";
   return null;
}
