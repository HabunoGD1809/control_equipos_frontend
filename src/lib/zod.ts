// src/lib/zod.ts
import * as z from "zod";
import { isBefore, isAfter, startOfDay, isValid } from "date-fns";
import {
  EstadoMantenimientoEnum,
  TipoMovimientoEquipoEnum,
  CategoriaItemEnum,
  UnidadMedidaEnum,
  TipoLicenciaSoftwareEnum,
  MetricaLicenciamientoEnum,
  TipoMovimientoInvEnum,
  TipoRelacionComponenteEnum,
  TipoDocumento,
  TipoMantenimiento,
  EstadoDocumentoEnum,
  TipoMovimientoEquipo,
  EstadoReservaEnum,
  InventarioStock,
} from "@/types/api";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export const MIME_TYPE_MAP: Record<string, string[]> = {
  pdf: ["application/pdf"],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  png: ["image/png"],
  webp: ["image/webp"],
  doc: ["application/msword"],
  docx: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  xls: ["application/vnd.ms-excel"],
  xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  xml: ["text/xml", "application/xml"],
  txt: ["text/plain"],
};

// ─── HELPERS DE VALIDACIÓN ────────────────────────────────

const requiredString = (message = "Este campo es requerido.") =>
  z.string({ error: () => message }).min(1, { error: message });
//                                          ^^^^^ message → error  [v4]

const requiredUuid = (message = "Debe seleccionar una opción.") =>
  z.guid({ error: "Formato UUID inválido." }).min(1, { error: message });
//                                          ^^^^^ message → error  [v4]

const requiredDate = (message = "La fecha es requerida.") =>
  z.preprocess((arg) => {
    if (typeof arg === "string" && arg.trim() === "") return undefined;
    return arg;
  }, z.coerce.date({ error: () => message }));
//  required_error eliminado en v4 — error: () => message cubre ambos casos  [v4]

const optionalDate = () =>
  z.preprocess((arg) => {
    if (typeof arg === "string" && arg.trim() === "") return null;
    return arg;
  }, z.coerce.date().optional().nullable());

const requiredEnum = <T extends string>(
  values: T[],
  message = "Debe seleccionar una opción válida.",
) => z.enum(values as [T, ...T[]], { error: () => message });

// REGEX MONETARIOS ESTRICTOS (PostgreSQL Numeric 12,2 y 12,4)
const monetaryRegex2 = /^(?!^[-+.]*$)[+-]?0*(?:\d{0,10}|(?=[\d.]{1,13}0*$)\d{0,10}\.\d{0,2}0*)$/;
const monetaryRegex4 = /^(?!^[-+.]*$)[+-]?0*(?:\d{0,8}|(?=[\d.]{1,13}0*$)\d{0,8}\.\d{0,4}0*)$/;

const optionalMonetary2 = () => z.preprocess(
  (val) => (val === "" || val === null || val === undefined ? null : String(val)),
  z.string()
    .regex(monetaryRegex2, { error: "Formato monetario inválido (máx 10 enteros y 2 decimales)." })
    .refine(val => Number(val) >= 0, { error: "El valor no puede ser negativo." })
    .nullable()
    .optional()
);
// ^^^^^ ambos message → error  [v4]

const requiredMonetary2 = () => z.preprocess(
  (val) => (val === "" || val === null || val === undefined ? undefined : String(val)),
  z.string({ error: () => "El costo es requerido." })
    .regex(monetaryRegex2, { error: "Formato monetario inválido (máx 10 enteros y 2 decimales)." })
    .refine(val => Number(val) >= 0, { error: "El valor no puede ser negativo." })
);
// ^^^^^ required_error → error: () => "..."  y  message → error  [v4]

const optionalMonetary4 = () => z.preprocess(
  (val) => (val === "" || val === null || val === undefined ? null : String(val)),
  z.string()
    .regex(monetaryRegex4, { error: "Formato monetario inválido (máx 8 enteros y 4 decimales)." })
    .refine(val => Number(val) >= 0, { error: "El valor no puede ser negativo." })
    .nullable()
    .optional()
);
// ^^^^^ ambos message → error  [v4]

// ─── SCHEMAS DINÁMICOS (DOCUMENTOS) ─────────────────────────────────────────

export const createDocumentoSchema = (tiposDisponibles: TipoDocumento[]) =>
  z
    .object({
      titulo: requiredString("El título es requerido.")
        .min(3, { error: "Mínimo 3 caracteres." })
        .max(255, { error: "Máximo 255 caracteres." }),
      tipo_documento_id: requiredUuid("Debe seleccionar un tipo de documento."),
      descripcion: z.string().optional().nullable(),
      equipo_id: z.guid().optional().nullable(),
      mantenimiento_id: z.guid().optional().nullable(),
      licencia_id: z.guid().optional().nullable(),
      file: z
        .any()
        .refine((f) => f instanceof File || (typeof window === "undefined" && f), {
          error: "El archivo es requerido.",
        })
        .refine((f) => !f || f.size <= MAX_FILE_SIZE, {
          error: "El tamaño máximo es 10 MB.",
        }),
    })
    .superRefine((data, ctx) => {
      if (!data.equipo_id && !data.mantenimiento_id && !data.licencia_id) {
        ctx.addIssue({
          code: "custom",
          message:
            "El documento debe estar vinculado a un equipo, mantenimiento o licencia.",
          path: ["tipo_documento_id"],
        });
      }

      const tipoSeleccionado = tiposDisponibles.find(
        (t) => t.id === data.tipo_documento_id,
      );

      if (!tipoSeleccionado) {
        ctx.addIssue({
          code: "custom",
          message: "Tipo de documento inválido.",
          path: ["tipo_documento_id"],
        });
        return;
      }

      const file = data.file as File;
      if (!file) return;

      if (
        tipoSeleccionado.formato_permitido &&
        tipoSeleccionado.formato_permitido.length > 0
      ) {
        const allowedMimes = tipoSeleccionado.formato_permitido.flatMap(
          (ext) => MIME_TYPE_MAP[ext.toLowerCase()] || [],
        );

        if (allowedMimes.length > 0 && !allowedMimes.includes(file.type)) {
          ctx.addIssue({
            code: "custom",
            message: `Formato inválido. Permitidos: ${tipoSeleccionado.formato_permitido.join(", ")}`,
            path: ["file"],
          });
        }
      }
    });

export const documentacionUpdateSchema = z.object({
  titulo: z
    .string()
    .min(3, { error: "Mínimo 3 caracteres." })
    .max(255, { error: "Máximo 255 caracteres." })
    .optional(),
  descripcion: z.string().optional().nullable(),
  tipo_documento_id: z.guid().optional(),
});

export const documentacionVerifySchema = z
  .object({
    estado: requiredEnum([
      EstadoDocumentoEnum.Verificado,
      EstadoDocumentoEnum.Rechazado,
    ]),
    notas_verificacion: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (
      data.estado === EstadoDocumentoEnum.Rechazado &&
      (!data.notas_verificacion || data.notas_verificacion.trim().length === 0)
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Debe indicar la razón del rechazo.",
        path: ["notas_verificacion"],
      });
    }
  });

// ─── EQUIPOS ────────────────────────────────────────────────────────────────

export const equipoSchema = z
  .object({
    nombre: requiredString("El nombre es requerido.")
      .min(2, { error: "El nombre debe tener al menos 2 caracteres." })
      .max(255, { error: "Máximo 255 caracteres." }),
    numero_serie: requiredString("El número de serie es requerido.").regex(
      /^[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+$/,
      {
        error:
          "Formato estricto: Bloques alfanuméricos en mayúscula separados por guiones (Ej: AB-1234-X)",
      },
    ),
    codigo_interno: z
      .string()
      .max(100, { error: "Máximo 100 caracteres." })
      .optional()
      .nullable(),
    estado_id: requiredUuid("Debe seleccionar un estado."),
    proveedor_id: z.guid().optional().nullable(),
    ubicacion_actual: z
      .string()
      .max(255, { error: "Máximo 255 caracteres." })
      .optional()
      .nullable(),
    marca: z
      .string()
      .max(100, { error: "Máximo 100 caracteres." })
      .optional()
      .nullable(),
    modelo: z
      .string()
      .max(100, { error: "Máximo 100 caracteres." })
      .optional()
      .nullable(),
    fecha_adquisicion: optionalDate(),
    fecha_puesta_marcha: optionalDate(),
    fecha_garantia_expiracion: optionalDate(),
    valor_adquisicion: optionalMonetary2(),
    centro_costo: z
      .string()
      .max(100, { error: "Máximo 100 caracteres." })
      .optional()
      .nullable(),
    notas: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    const now = new Date();

    if (data.fecha_adquisicion && isAfter(data.fecha_adquisicion, now)) {
      ctx.addIssue({
        code: "custom",
        message: "La fecha de adquisición no puede ser futura.",
        path: ["fecha_adquisicion"],
      });
    }

    if (
      data.fecha_adquisicion &&
      data.fecha_puesta_marcha &&
      isBefore(data.fecha_puesta_marcha, data.fecha_adquisicion)
    ) {
      ctx.addIssue({
        code: "custom",
        message: "La puesta en marcha no puede ser anterior a la adquisición.",
        path: ["fecha_puesta_marcha"],
      });
    }

    if (
      data.fecha_adquisicion &&
      data.fecha_garantia_expiracion &&
      !isAfter(data.fecha_garantia_expiracion, data.fecha_adquisicion)
    ) {
      ctx.addIssue({
        code: "custom",
        message: "La garantía debe expirar después de la adquisición.",
        path: ["fecha_garantia_expiracion"],
      });
    }
  });

export const addComponenteSchema = z.object({
  equipo_componente_id: requiredUuid("Debe seleccionar un equipo componente."),
  cantidad: z.coerce
    .number()
    .int()
    .min(1, { error: "La cantidad debe ser al menos 1." }),
  tipo_relacion: requiredEnum(
    Object.values(TipoRelacionComponenteEnum),
    "Tipo de relación inválida.",
  ),
  notas: z.string().optional().nullable(),
});

export const editComponenteSchema = z.object({
  cantidad: z.coerce
    .number()
    .int()
    .min(1, { error: "La cantidad debe ser al menos 1." }),
  tipo_relacion: requiredEnum(
    Object.values(TipoRelacionComponenteEnum),
    "Tipo de relación inválida.",
  ),
  notas: z.string().optional().nullable(),
});

// ─── MANTENIMIENTO ──────────────────────────────────────────────────────────

export const mantenimientoSchema = z.object({
  equipo_id: requiredUuid("Debe seleccionar un equipo."),
  tipo_mantenimiento_id: requiredUuid(
    "Debe seleccionar un tipo de mantenimiento.",
  ),
  fecha_programada: requiredDate("La fecha programada es requerida.").refine(
    (date) => {
      const today = startOfDay(new Date());
      return isAfter(date, today) || date.getTime() >= today.getTime();
    },
    { error: "La fecha programada no puede estar en el pasado." },
  ),
  tecnico_responsable: requiredString(
    "El nombre del técnico es requerido.",
  ).min(3, {
    error: "Mínimo 3 caracteres.",
  }),
  prioridad: z.coerce
    .number()
    .int()
    .min(0)
    .max(2, { error: "Prioridad inválida (0-2)." }),
  observaciones: z.string().optional().nullable(),
  costo_estimado: optionalMonetary2(),
  proveedor_servicio_id: z.guid().optional().nullable(),
});

export const mantenimientoUpdateSchema = z.object({
  fecha_programada: optionalDate(),
  fecha_inicio: optionalDate(),
  fecha_finalizacion: optionalDate(),
  costo_estimado: optionalMonetary2(),
  costo_real: optionalMonetary2(),
  tecnico_responsable: z.string().optional().nullable(),
  proveedor_servicio_id: z.guid().optional().nullable(),
  prioridad: z.coerce.number().int().min(0).max(2).optional(),
  estado: requiredEnum(Object.values(EstadoMantenimientoEnum)).optional(),
  observaciones: z.string().optional().nullable(),
});

export const createCierreMantenimientoSchema = (
  tipoMantenimiento: TipoMantenimiento,
  tieneDocumentosAdjuntos: boolean,
) =>
  z
    .object({
      estado: requiredEnum(Object.values(EstadoMantenimientoEnum)),
      costo_real: requiredMonetary2(),
      fecha_inicio: requiredDate("Fecha de inicio real requerida."),
      fecha_finalizacion: requiredDate("Fecha de finalización requerida."),
      observaciones: z.string().optional().nullable(),
      tecnico_responsable: requiredString("Técnico responsable requerido."),
    })
    .superRefine((data, ctx) => {
      if (
        data.estado === EstadoMantenimientoEnum.Completado &&
        tipoMantenimiento.requiere_documentacion &&
        !tieneDocumentosAdjuntos
      ) {
        ctx.addIssue({
          code: "custom",
          message:
            "Este tipo de mantenimiento requiere adjuntar documentación antes de completarse.",
          path: ["estado"],
        });
      }

      if (
        data.fecha_inicio &&
        data.fecha_finalizacion &&
        isAfter(data.fecha_inicio, data.fecha_finalizacion)
      ) {
        ctx.addIssue({
          code: "custom",
          message: "La finalización no puede ser antes del inicio.",
          path: ["fecha_finalizacion"],
        });
      }
    });

// ─── INVENTARIO ─────────────────────────────────────────────────────────────

export const tipoItemSchema = z.object({
  nombre: requiredString("El nombre es requerido.")
    .min(2, { error: "Mínimo 2 caracteres." })
    .max(100, { error: "Máximo 100 caracteres." }),
  categoria: requiredEnum(
    Object.values(CategoriaItemEnum),
    "Categoría inválida.",
  ),
  unidad_medida: requiredEnum(
    Object.values(UnidadMedidaEnum),
    "Unidad de medida inválida.",
  ),
  descripcion: z.string().optional().nullable(),
  marca: z.string().max(100).optional().nullable(),
  modelo: z.string().max(100).optional().nullable(),
  sku: z.string().max(100).optional().nullable(),
  codigo_barras: z.string().max(100).optional().nullable(),
  stock_minimo: z.coerce.number().int().min(0).default(0),
  proveedor_preferido_id: z.guid().optional().nullable(),
});

export const createInventarioMovimientoSchema = (stockData?: InventarioStock[]) => z
  .object({
    tipo_item_id: requiredUuid("Debe seleccionar un ítem."),
    tipo_movimiento: requiredEnum(
      Object.values(TipoMovimientoInvEnum),
      "Tipo de movimiento inválido.",
    ),
    cantidad: z.coerce
      .number()
      .int()
      .min(1, { error: "La cantidad debe ser mayor a 0." }),
    fecha_hora: optionalDate(),
    costo_unitario: optionalMonetary4(),
    lote_origen: z.string().max(50).optional().default("N/A"),
    lote_destino: z.string().max(50).optional().default("N/A"),
    ubicacion_origen: z.string().optional().nullable(),
    ubicacion_destino: z.string().optional().nullable(),
    motivo_ajuste: z.string().optional().nullable(),
    equipo_asociado_id: z.guid().optional().nullable(),
    mantenimiento_id: z.guid().optional().nullable(),
    referencia_externa: z.string().optional().nullable(),
    referencia_transferencia: z.guid().optional().nullable(),
    notas: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    const salidas = [
      TipoMovimientoInvEnum.SalidaUso,
      TipoMovimientoInvEnum.SalidaDescarte,
      TipoMovimientoInvEnum.TransferenciaSalida,
      TipoMovimientoInvEnum.DevolucionProveedor,
    ] as string[];

    if (salidas.includes(data.tipo_movimiento) && !data.ubicacion_origen) {
      ctx.addIssue({
        code: "custom",
        message: "Origen requerido.",
        path: ["ubicacion_origen"],
      });
    }

    const entradas = [
      TipoMovimientoInvEnum.EntradaCompra,
      TipoMovimientoInvEnum.TransferenciaEntrada,
      TipoMovimientoInvEnum.DevolucionInterna,
    ] as string[];

    if (entradas.includes(data.tipo_movimiento) && !data.ubicacion_destino) {
      ctx.addIssue({
        code: "custom",
        message: "Destino requerido.",
        path: ["ubicacion_destino"],
      });
    }

    if (
      data.tipo_movimiento.includes("Ajuste") &&
      (!data.motivo_ajuste || data.motivo_ajuste.length < 5)
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Motivo requerido (mín 5 caracteres).",
        path: ["motivo_ajuste"],
      });
    }

    // VALIDACIÓN ESTRICTA DE STOCK ANTES DE MUTACIÓN
    const salidasParaStock = [...salidas, TipoMovimientoInvEnum.AjusteNegativo];

    if (stockData && salidasParaStock.includes(data.tipo_movimiento) && data.ubicacion_origen) {
      const stockActual = stockData.find(
        s => s.tipo_item_id === data.tipo_item_id && s.ubicacion === data.ubicacion_origen && s.lote === (data.lote_origen || "N/A")
      );
      const disponible = stockActual ? stockActual.cantidad_actual : 0;

      if (data.cantidad > disponible) {
        ctx.addIssue({
          code: "custom",
          message: `Stock insuficiente. Máximo disponible: ${disponible}.`,
          path: ["cantidad"],
        });
      }
    }
  });

export const editStockSchema = z.object({
  lote: z.string().optional().nullable(),
  fecha_caducidad: optionalDate(),
});

// ─── LICENCIAS ──────────────────────────────────────────────────────────────

export const softwareCatalogoSchema = z.object({
  nombre: requiredString("El nombre es requerido.").min(2).max(255),
  version: z.string().max(50).optional().nullable(),
  fabricante: z.string().max(100).optional().nullable(),
  tipo_licencia: requiredEnum(Object.values(TipoLicenciaSoftwareEnum)),
  metrica_licenciamiento: requiredEnum(
    Object.values(MetricaLicenciamientoEnum),
  ),
  descripcion: z.string().optional().nullable(),
  categoria: z.string().optional().nullable(),
});

export const licenciaSoftwareSchema = z
  .object({
    software_catalogo_id: requiredUuid("Debe seleccionar un software."),
    clave_producto: z.string().optional().nullable(),
    fecha_adquisicion: requiredDate("La fecha de adquisición es requerida."),
    fecha_expiracion: optionalDate(),
    proveedor_id: z.guid().optional().nullable(),
    costo_adquisicion: optionalMonetary2(),
    cantidad_total: z.coerce
      .number()
      .int()
      .min(1, { error: "Mínimo 1 licencia." }),
    notas: z.string().optional().nullable(),
    numero_orden_compra: z.string().optional().nullable(),
  })
  .refine(
    (data) =>
      !data.fecha_expiracion ||
      !data.fecha_adquisicion ||
      isBefore(data.fecha_adquisicion, data.fecha_expiracion),
    {
      error: "La expiración debe ser posterior a la adquisición.",
      path: ["fecha_expiracion"],
    },
  );

export const asignarLicenciaSchema = z
  .object({
    asignar_a: z.enum(["equipo", "usuario"], {
      error: () => "Seleccione un destino.",
    }),
    // ^^^^^ errorMap: () => ({ message }) → error: () => "..."  [v4]
    equipo_id: z.guid().optional().nullable(),
    usuario_id: z.guid().optional().nullable(),
    notas: z.string().optional().nullable(),
    instalado: z.boolean().optional(),
  })
  .refine((data) => data.asignar_a !== "equipo" || !!data.equipo_id, {
    error: "Seleccione un equipo.",
    path: ["equipo_id"],
  })
  .refine((data) => data.asignar_a !== "usuario" || !!data.usuario_id, {
    error: "Seleccione un usuario.",
    path: ["usuario_id"],
  })
  .refine((data) => !(data.equipo_id && data.usuario_id), {
    error: "No puede asignar a un equipo y a un usuario al mismo tiempo.",
    path: ["asignar_a"],
  });

// ─── USUARIOS Y ROLES ───────────────────────────────────────────────────────

export const usuarioCreateSchema = z.object({
  nombre_usuario: z.string().min(3).max(50),
  email: z.union([
    z.string().regex(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/, {
      error: "Formato de correo inválido.",
    }),
    z.literal(""),
    z.null(),
    z.undefined(),
  ]),
  password: z.string().min(8, { error: "Mínimo 8 caracteres" }),
  rol_id: requiredUuid("Rol requerido."),
});

export const usuarioUpdateSchema = z.object({
  nombre_usuario: z.string().min(3).max(50).optional(),
  email: z.union([
    z.string().regex(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/, {
      error: "Formato de correo inválido.",
    }),
    z.literal(""),
    z.null(),
    z.undefined(),
  ]),
  password: z.union([
    z.string().min(8, { error: "Mínimo 8 caracteres" }),
    z.literal(""),
    z.null(),
    z.undefined(),
  ]),
  rol_id: z.guid().optional(),
  bloqueado: z.boolean().optional(),
  requiere_cambio_contrasena: z.boolean().optional(),
});

export const rolSchema = z.object({
  nombre: requiredString("Nombre requerido.").min(3).max(100),
  descripcion: z.string().optional().nullable(),
  permiso_ids: z.array(z.guid()).min(1, { error: "Mínimo un permiso." }),
});

export const updateProfileSchema = z.object({
  nombre_usuario: requiredString("Mínimo 3 caracteres")
    .min(3)
    .max(50)
    .optional(),
  email: z.union([
    z.string().regex(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/, {
      error: "Debe ser un email válido.",
    }),
    z.literal(""),
    z.null(),
    z.undefined(),
  ]),
});

// ─── PROVEEDORES Y CATÁLOGOS ─────────────────────────────────────────────────

export const proveedorSchema = z.object({
  nombre: requiredString("Nombre requerido.").min(2).max(255),
  descripcion: z.string().optional().nullable(),
  contacto: z.string().optional().nullable(),
  direccion: z.string().optional().nullable(),
  sitio_web: z.union([
    z.string().url({ error: "URL inválida" }),
    z.literal(""),
    z.null(),
    z.undefined(),
  ]),
  rnc: z.string().max(50).optional().nullable(),
});

export const estadoEquipoSchema = z.object({
  nombre: requiredString("Nombre requerido.").min(2).max(100),
  descripcion: z.string().optional().nullable(),
  color_hex: z.union([
    z.string().regex(/^#([0-9a-fA-F]{6})$/, { error: "Color Hex inválido" }),
    z.literal(""),
    z.null(),
    z.undefined(),
  ]),
  permite_movimientos: z.boolean().optional(),
  requiere_autorizacion: z.boolean().optional(),
  es_estado_final: z.boolean().optional(),
  icono: z.string().optional().nullable(),
});

export const tipoDocumentoSchema = z.object({
  nombre: requiredString("Nombre requerido.").min(2).max(100),
  descripcion: z.string().optional().nullable(),
  requiere_verificacion: z.boolean().optional(),
  formato_permitido: z.array(z.string()).optional().nullable(),
});

export const tipoMantenimientoSchema = z.object({
  nombre: requiredString("Nombre requerido.").min(2).max(100),
  descripcion: z.string().optional().nullable(),
  es_preventivo: z.boolean().optional(),
  requiere_documentacion: z.boolean().optional(),
  periodicidad_dias: z.coerce.number().int().min(0).optional().nullable(),
});

// ─── RESERVAS Y MOVIMIENTOS ─────────────────────────────────────────────────

export const reservaSchema = z
  .object({
    equipo_id: requiredUuid("Debe seleccionar un equipo."),
    proposito: requiredString("Propósito requerido (mín 5 chars).").min(5),
    fecha_inicio: requiredDate("Fecha de inicio requerida"),
    hora_inicio: requiredString("Hora requerida"),
    fecha_fin: requiredDate("Fecha de fin requerida"),
    hora_fin: requiredString("Hora requerida"),
    notas: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      if (!isValid(data.fecha_inicio) || !isValid(data.fecha_fin)) return false;
      const start = new Date(data.fecha_inicio);
      const [sh, sm] = data.hora_inicio.split(":").map(Number);
      start.setHours(sh, sm);
      const end = new Date(data.fecha_fin);
      const [eh, em] = data.hora_fin.split(":").map(Number);
      end.setHours(eh, em);
      return isAfter(end, start);
    },
    {
      error: "La fecha/hora fin debe ser posterior al inicio.",
      path: ["fecha_fin"],
    },
  );

export const movimientoEquipoSchema = z
  .object({
    equipo_id: requiredUuid("Debe seleccionar un equipo."),
    tipo_movimiento: requiredEnum(
      Object.values(TipoMovimientoEquipoEnum),
      "Tipo inválido.",
    ),
    destino: z.string().optional().nullable(),
    proposito: z.string().optional().nullable(),
    observaciones: z.string().optional().nullable(),
    fecha_prevista_retorno: optionalDate(),
    origen: z.string().optional().nullable(),
    recibido_por: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (
      data.tipo_movimiento === TipoMovimientoEquipoEnum.SalidaTemporal &&
      !data.fecha_prevista_retorno
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Fecha retorno requerida.",
        path: ["fecha_prevista_retorno"],
      });
    }

    if (data.tipo_movimiento === TipoMovimientoEquipoEnum.AsignacionInterna) {
      if (!data.destino || data.destino.length < 3) {
        ctx.addIssue({
          code: "custom",
          message: "Ubicación/Destino de la asignación requerido.",
          path: ["destino"],
        });
      }
      if (!data.origen || data.origen.length < 3) {
        ctx.addIssue({
          code: "custom",
          message: "Ubicación de origen requerida para asignaciones.",
          path: ["origen"],
        });
      }
    }

    if (data.tipo_movimiento === TipoMovimientoEquipoEnum.Entrada) {
      if (!data.origen || data.origen.length < 3) {
        ctx.addIssue({
          code: "custom",
          message: "Ubicación de origen requerida para registrar una entrada.",
          path: ["origen"],
        });
      }
    }

    const salidasConDestinoRequerido = [
      TipoMovimientoEquipoEnum.SalidaDefinitiva,
      TipoMovimientoEquipoEnum.TransferenciaBodega,
    ] as TipoMovimientoEquipo[];

    if (
      salidasConDestinoRequerido.includes(data.tipo_movimiento) &&
      (!data.destino || data.destino.length < 3)
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Destino físico requerido.",
        path: ["destino"],
      });
    }
  });

export const autorizarMovimientoSchema = z
  .object({
    accion: z.enum(["Aprobar", "Rechazar"], {
      error: () => "Debe tomar una decisión.",
    }),
    // ^^^^^ errorMap: () => ({ message }) → error: () => "..."  [v4]
    observaciones: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.accion === "Rechazar" &&
      (!data.observaciones || data.observaciones.length < 5)
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Debe justificar el rechazo (mín. 5 caracteres).",
        path: ["observaciones"],
      });
    }
  });

// ─── AUTH & SISTEMA ─────────────────────────────────────────────────────────

export const loginSchema = z.object({
  username: requiredString("Usuario requerido."),
  password: requiredString("Contraseña requerida."),
});

export const authLogoutSchema = z.object({
  refresh_token: requiredString("Refresh token requerido."),
});

export const changePasswordSchema = z
  .object({
    current_password: requiredString("Contraseña actual requerida."),
    new_password: z.string().min(8, { error: "Mínimo 8 caracteres." }),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    error: "Las contraseñas no coinciden.",
    path: ["confirm_password"],
  });

export const resetPasswordRequestSchema = z.object({
  username: requiredString("El nombre de usuario es requerido."),
});

export const resetPasswordConfirmSchema = z
  .object({
    username: requiredString("El usuario es requerido."),
    token: requiredString("El token es requerido."),
    new_password: z
      .string()
      .min(8, {
        error: "La nueva contraseña debe tener al menos 8 caracteres.",
      }),
    confirm_password: z.string().min(8, { error: "Confirme la contraseña." }),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    error: "Las contraseñas no coinciden.",
    path: ["confirm_password"],
  });

// ─── OTROS ──────────────────────────────────────────────────────────────────

export const reporteSchema = z
  .object({
    tipo_reporte: z.enum([
      "equipos",
      "mantenimientos",
      "kardex",
      "movimientos",
      "auditoria",
    ]),
    formato: z.enum(["pdf", "excel", "csv"]),
    fecha_inicio: requiredDate("Fecha de inicio requerida"),
    fecha_fin: requiredDate("Fecha de fin requerida"),
  })
  .refine((data) => !isBefore(data.fecha_fin, data.fecha_inicio), {
    error: "Fecha fin inválida. No puede ser anterior al inicio.",
    path: ["fecha_fin"],
  });

export const aprobarReservaSchema = z
  .object({
    estado: requiredEnum(
      [EstadoReservaEnum.Confirmada, EstadoReservaEnum.Rechazada],
      "Seleccione una decisión.",
    ),
    notas_administrador: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (
      data.estado === EstadoReservaEnum.Rechazada &&
      (!data.notas_administrador || data.notas_administrador.length < 5)
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Justifique el rechazo (mínimo 5 caracteres).",
        path: ["notas_administrador"],
      });
    }
  });

export const reservaCheckInOutSchema = z.object({
  check_in_time: optionalDate(),
  check_out_time: optionalDate(),
  notas_devolucion: z.string().optional().nullable(),
});

export const auditFilterSchema = z.object({
  table_name: z.string().optional(),
  operation: z.string().optional(),
  username: z.string().optional(),
});

export const notificacionUpdateSchema = z.object({
  leido: z.boolean({ error: () => "Estado de lectura requerido" }),
  // ^^^^^ required_error → error: () => "..."  [v4]
});

// Re-exports de compatibilidad
export const LoginSchema = loginSchema;
export const ChangePasswordSchema = changePasswordSchema;
