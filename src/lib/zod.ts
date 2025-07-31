import * as z from "zod";

const requiredString = (message = "Este campo es requerido.") =>
   z.string({ error: (iss) => iss.input === undefined ? message : undefined })
      .min(1, { message });

const requiredUuid = (message = "Debe seleccionar una opción.") =>
   requiredString(message).uuid({ message });

const requiredDate = (message = "La fecha es requerida.") =>
   z.date({
      error: (iss) => iss.input === undefined ? message : "Fecha inválida."
   });

const requiredEnum = <T extends [string, ...string[]]>(
   values: T,
   message = "Debe seleccionar una opción."
) =>
   z.enum(values).refine(
      (val) => values.includes(val),
      { params: { message } }
   ).superRefine((val, ctx) => {
      if (!values.includes(val)) {
         ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message,
         });
      }
   });

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_FILE_TYPES = ["image/jpeg", "image/png", "application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];

export const documentoSchema = z.object({
   titulo: requiredString("El título es requerido.").min(3).max(255),
   tipo_documento_id: requiredUuid("Debe seleccionar un tipo de documento."),
   descripcion: z.string().optional().nullable(),
   file: z
      .any()
      .refine((file) => file, "El archivo es requerido.")
      .refine((file) => file?.size <= MAX_FILE_SIZE, `El tamaño máximo es 10 MB.`)
      .refine(
         (file) => ACCEPTED_FILE_TYPES.includes(file?.type),
         "Formato de archivo no soportado (.jpg, .png, .pdf, .docx, .xlsx)"
      ),
});

export const equipoSchema = z.object({
   nombre: requiredString("El nombre debe tener al menos 2 caracteres.").min(2).max(255),
   numero_serie: requiredString("El número de serie es requerido."),
   codigo_interno: z.string().max(100).optional().nullable(),
   estado_id: requiredUuid("Debe seleccionar un estado."),
   proveedor_id: z.string().uuid().optional().nullable(),
   ubicacion_actual: z.string().max(255).optional().nullable(),
   marca: z.string().max(100).optional().nullable(),
   modelo: z.string().max(100).optional().nullable(),
   fecha_adquisicion: z.date().optional().nullable(),
   fecha_puesta_marcha: z.date().optional().nullable(),
   fecha_garantia_expiracion: z.date().optional().nullable(),
   valor_adquisicion: z.coerce.number().min(0).optional().nullable(),
   centro_costo: z.string().max(100).optional().nullable(),
   notas: z.string().optional().nullable(),
});

export const addComponenteSchema = z.object({
   equipo_componente_id: requiredUuid("Debe seleccionar un equipo componente."),
   cantidad: z.coerce.number().int().min(1, "La cantidad debe ser al menos 1."),
   tipo_relacion: requiredEnum(
      ["componente", "conectado_a", "parte_de", "accesorio"],
      "Debe seleccionar un tipo de relación."
   ),
   notas: z.string().optional().nullable(),
});

export const mantenimientoSchema = z.object({
   tipo_mantenimiento_id: requiredUuid("Debe seleccionar un tipo de mantenimiento."),
   fecha_programada: requiredDate("La fecha programada es requerida."),
   tecnico_responsable: requiredString("El nombre del técnico es requerido.").min(3),
   prioridad: z.coerce.number().int().min(0).max(2, "La prioridad no es válida."),
   observaciones: z.string().optional().nullable(),
});

// TipoItemSchema:
export const tipoItemSchema = z.object({
   nombre: requiredString("El nombre es requerido.").min(2).max(100),
   categoria: requiredEnum(
      ["Consumible", "Parte Repuesto", "Accesorio", "Otro"],
      "Debe seleccionar una categoría."
   ),
   unidad_medida: requiredEnum(
      ["Unidad", "Metro", "Kg", "Litro", "Caja", "Paquete"],
      "Debe seleccionar una unidad de medida."
   ),
   descripcion: z.string().optional().nullable(),
   marca: z.string().max(100).optional().nullable(),
   modelo: z.string().max(100).optional().nullable(),
   sku: z.string().max(100).optional().nullable(),
   stock_minimo: z.coerce.number().int().min(0).default(0),
   proveedor_preferido_id: z.string().uuid().optional().nullable(),
});

// En movimientos:
export const inventarioMovimientoSchema = z.object({
   tipo_item_id: requiredUuid("Debe seleccionar un ítem."),
   tipo_movimiento: requiredEnum(
      [
         "Entrada Compra", "Salida Uso", "Salida Descarte", "Ajuste Positivo",
         "Ajuste Negativo", "Transferencia Salida", "Transferencia Entrada",
         "Devolucion Proveedor", "Devolucion Interna"
      ],
      "Debe seleccionar un tipo de movimiento."
   ),
   cantidad: z.coerce.number().int().min(1, "La cantidad debe ser mayor a 0."),
   ubicacion_origen: z.string().optional().nullable(),
   ubicacion_destino: z.string().optional().nullable(),
   motivo_ajuste: z.string().optional().nullable(),
   equipo_asociado_id: z.string().uuid().optional().nullable(),
   notas: z.string().optional().nullable(),
})
   .refine(data => {
      if (["Salida Uso", "Salida Descarte", "Transferencia Salida", "Devolucion Proveedor"]
         .includes(data.tipo_movimiento)) {
         return !!data.ubicacion_origen && data.ubicacion_origen.length > 0;
      }
      return true;
   }, { message: "La ubicación de origen es requerida.", path: ["ubicacion_origen"] })
   .refine(data => {
      if (["Entrada Compra", "Transferencia Entrada", "Devolucion Interna"]
         .includes(data.tipo_movimiento)) {
         return !!data.ubicacion_destino && data.ubicacion_destino.length > 0;
      }
      return true;
   }, { message: "La ubicación de destino es requerida.", path: ["ubicacion_destino"] })
   .refine(data => {
      if (data.tipo_movimiento.includes("Ajuste")) {
         return !!data.motivo_ajuste && data.motivo_ajuste.length > 5;
      }
      return true;
   }, { message: "El motivo es requerido para ajustes (mín. 5 caracteres).", path: ["motivo_ajuste"] });

// Esquema para el Catálogo de Software
export const softwareCatalogoSchema = z.object({
   nombre: requiredString("El nombre es requerido.").min(2).max(255),
   version: z.string().max(50).optional().nullable(),
   fabricante: z.string().max(100).optional().nullable(),
   tipo_licencia: requiredEnum(["Perpetua", "Suscripción Anual", "Suscripción Mensual", "OEM", "Freeware", "Open Source", "Otra"]),
   metrica_licenciamiento: requiredEnum(["Por Dispositivo", "Por Usuario Nominal", "Por Usuario Concurrente", "Por Core", "Por Servidor", "Gratuita", "Otra"]),
   descripcion: z.string().optional().nullable(),
});

// Esquema para Licencias de Software Adquiridas
export const licenciaSoftwareSchema = z.object({
   software_catalogo_id: requiredUuid("Debe seleccionar un software del catálogo."),
   clave_producto: z.string().optional().nullable(),
   fecha_adquisicion: requiredDate(),
   fecha_expiracion: z.date().optional().nullable(),
   proveedor_id: z.string().uuid().optional().nullable(),
   costo_adquisicion: z.coerce.number().min(0).optional().nullable(),
   cantidad_total: z.coerce.number().int().min(1, "La cantidad debe ser al menos 1."),
   notas: z.string().optional().nullable(),
   numero_orden_compra: z.string().optional().nullable(),
});

// Esquema para Asignar una Licencia
export const asignarLicenciaSchema = z.object({
   asignar_a: requiredEnum(["equipo", "usuario"], "Debe seleccionar un tipo de asignación."),
   equipo_id: z.string().uuid().optional().nullable(),
   usuario_id: z.string().uuid().optional().nullable(),
   notas: z.string().optional().nullable(),
}).refine(data => (data.asignar_a === 'equipo' ? !!data.equipo_id : true), {
   message: "Debe seleccionar un equipo.",
   path: ["equipo_id"],
}).refine(data => (data.asignar_a === 'usuario' ? !!data.usuario_id : true), {
   message: "Debe seleccionar un usuario.",
   path: ["usuario_id"],
});

// Esquema para la creación de Usuarios
export const usuarioCreateSchema = z.object({
   nombre_usuario: z.string().min(3, "Mínimo 3 caracteres").max(50),
   email: z.string().email("Debe ser un email válido.").optional().nullable(),
   password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
   rol_id: requiredUuid("Debe seleccionar un rol."),
});

// Esquema para la actualización de Usuarios
export const usuarioUpdateSchema = z.object({
   nombre_usuario: z.string().min(3, "Mínimo 3 caracteres").max(50).optional(),
   email: z.string().email("Debe ser un email válido.").optional().nullable(),
   password: z.string().min(8, "Mínimo 8 caracteres.").optional().nullable().or(z.literal('')),
   rol_id: z.string().uuid().optional(),
   bloqueado: z.boolean().optional(),
});

// Esquema para la creación y actualización de Roles
export const rolSchema = z.object({
   nombre: requiredString("El nombre del rol es requerido.").min(3).max(100),
   descripcion: z.string().optional().nullable(),
   permiso_ids: z.array(z.string().uuid()).min(1, "Debe seleccionar al menos un permiso."),
});

// Esquema para Proveedores
export const proveedorSchema = z.object({
   nombre: requiredString("El nombre es requerido.").min(2).max(255),
   descripcion: z.string().optional().nullable(),
   contacto: z.string().optional().nullable(),
   direccion: z.string().optional().nullable(),
   sitio_web: z.string().url("Debe ser una URL válida.").optional().nullable().or(z.literal('')),
   rnc: z.string().max(50).optional().nullable(),
});

// Esquema genérico para catálogos simples
export const genericCatalogSchema = z.object({
   nombre: requiredString("El nombre es requerido.").min(2).max(100),
   descripcion: z.string().optional().nullable(),
   color_hex: z.string().regex(/^#([0-9a-fA-F]{6})$/, "Debe ser un color hexadecimal válido, ej: #FFFFFF").optional().nullable().or(z.literal('')),
   es_preventivo: z.boolean().optional(),
   periodicidad_dias: z.coerce.number().int().min(0).optional().nullable(),
});

// Esquema para la creación de Reservas
export const reservaSchema = z.object({
   equipo_id: requiredUuid("Debe seleccionar un equipo."),
   proposito: requiredString("El propósito es requerido (mín. 5 caracteres).").min(5),
   fecha_inicio: requiredDate(),
   hora_inicio: requiredString("La hora de inicio es requerida."),
   fecha_fin: requiredDate(),
   hora_fin: requiredString("La hora de fin es requerida."),
   notas: z.string().optional().nullable(),
}).refine(data => {
   const [startHour, startMinute] = data.hora_inicio.split(':').map(Number);
   const [endHour, endMinute] = data.hora_fin.split(':').map(Number);
   const startDate = new Date(data.fecha_inicio.setHours(startHour, startMinute));
   const endDate = new Date(data.fecha_fin.setHours(endHour, endMinute));
   return endDate > startDate;
}, {
   message: "La fecha y hora de fin debe ser posterior a la de inicio.",
   path: ["fecha_fin"],
});

// Esquema para el formulario de cambio de contraseña
export const changePasswordSchema = z.object({
   current_password: requiredString("La contraseña actual es requerida."),
   new_password: z.string().min(8, "La nueva contraseña debe tener al menos 8 caracteres."),
   confirm_password: z.string()
}).refine(data => data.new_password === data.confirm_password, {
   message: "Las contraseñas no coinciden.",
   path: ["confirm_password"],
});
