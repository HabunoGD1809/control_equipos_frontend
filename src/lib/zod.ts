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
} from "@/types/api";

// --- HELPERS & CONSTANTS ---

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// Mapa de extensiones (BD) a MIME Types (Navegador)
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

// ─── HELPERS DE VALIDACIÓN ──────────────────────────────────────────────────

const requiredString = (message = "Este campo es requerido.") =>
  z.string(message).min(1, { error: message });

const requiredUuid = (message = "Debe seleccionar una opción.") =>
  z.guid({ error: message });

const requiredDate = (message = "La fecha es requerida.") =>
  z.date({ error: message });

const requiredEnum = <T extends string>(
  values: T[],
  message = "Debe seleccionar una opción válida.",
) => z.enum(values as [T, ...T[]], { error: message });

// ─── SCHEMAS DINÁMICOS ───────────────────────────────────────────────────────

/**
 * Valida documentos contra las reglas de la BD (TiposDocumento y Relaciones)
 */
export const createDocumentoSchema = (tiposDisponibles: TipoDocumento[]) =>
  z
    .object({
      titulo: requiredString("El título es requerido.").min(3).max(255),
      tipo_documento_id: requiredUuid("Debe seleccionar un tipo de documento."),
      descripcion: z.string().optional().nullable(),
      equipo_id: z.guid().optional().nullable(),
      mantenimiento_id: z.guid().optional().nullable(),
      licencia_id: z.guid().optional().nullable(),
      file: z
        .any()
        .refine((file) => file, "El archivo es requerido.")
        .refine(
          (file) => file?.size <= MAX_FILE_SIZE,
          "El tamaño máximo es 10 MB.",
        ),
    })
    .check((ctx) => {
      const data = ctx.value;

      // Validación 1: Evitar documentos huérfanos
      if (!data.equipo_id && !data.mantenimiento_id && !data.licencia_id) {
        ctx.issues.push({
          code: "custom",
          message: "El documento debe estar vinculado a un equipo, mantenimiento o licencia.",
          path: ["tipo_documento_id"],
          input: data.tipo_documento_id,
        });
      }

      // Validación 2: Tipo de documento válido
      const tipoSeleccionado = tiposDisponibles.find(
        (t) => t.id === data.tipo_documento_id,
      );

      if (!tipoSeleccionado) {
        ctx.issues.push({
          code: "custom",
          message: "Tipo de documento inválido.",
          path: ["tipo_documento_id"],
          input: data.tipo_documento_id,
        });
        return;
      }

      // Validación 3: Reglas de MIME Types de la BD
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
          ctx.issues.push({
            code: "custom",
            message: `Formato inválido. Permitidos: ${tipoSeleccionado.formato_permitido.join(
              ", ",
            )}`,
            path: ["file"],
            input: file.type,
          });
        }
      }
    });

export const documentacionUpdateSchema = z.object({
  titulo: z.string().min(3).max(255).optional(),
  descripcion: z.string().optional().nullable(),
  tipo_documento_id: z.guid().optional(),
});

export const createCierreMantenimientoSchema = (
  tipoMantenimiento: TipoMantenimiento,
  tieneDocumentosAdjuntos: boolean,
) =>
  z
    .object({
      estado: requiredEnum(Object.values(EstadoMantenimientoEnum)),
      costo_real: z.coerce
        .number()
        .min(0, { error: "El costo real es requerido." }),
      fecha_inicio: requiredDate("Fecha de inicio real requerida."),
      fecha_finalizacion: requiredDate("Fecha de finalización requerida."),
      observaciones: z.string().optional().nullable(),
      tecnico_responsable: requiredString("Técnico responsable requerido."),
    })
    .check((ctx) => {
      const data = ctx.value;

      if (
        data.estado === EstadoMantenimientoEnum.Completado &&
        tipoMantenimiento.requiere_documentacion &&
        !tieneDocumentosAdjuntos
      ) {
        ctx.issues.push({
          code: "custom",
          message:
            "Este tipo de mantenimiento requiere adjuntar documentación antes de completarse.",
          path: ["estado"],
          input: data.estado,
        });
      }

      if (
        data.fecha_inicio &&
        data.fecha_finalizacion &&
        isAfter(data.fecha_inicio, data.fecha_finalizacion)
      ) {
        ctx.issues.push({
          code: "custom",
          message: "La finalización no puede ser antes del inicio.",
          path: ["fecha_finalizacion"],
          input: data.fecha_finalizacion,
        });
      }
    });

// ─── EQUIPOS ────────────────────────────────────────────────────────────────

export const equipoSchema = z
  .object({
    nombre: requiredString("El nombre debe tener al menos 2 caracteres.")
      .min(2)
      .max(255),
    numero_serie: requiredString("El número de serie es requerido.").regex(
      /^[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+$/,
      "Formato estricto: Bloques alfanuméricos separados por guiones (Ej: AB-1234-X)",
    ),
    codigo_interno: z.string().max(100).optional().nullable(),
    estado_id: requiredUuid("Debe seleccionar un estado."),
    proveedor_id: z.guid().optional().nullable(),
    ubicacion_actual: z.string().max(255).optional().nullable(),
    marca: z.string().max(100).optional().nullable(),
    modelo: z.string().max(100).optional().nullable(),
    fecha_adquisicion: z.date().optional().nullable(),
    fecha_puesta_marcha: z.date().optional().nullable(),
    fecha_garantia_expiracion: z.date().optional().nullable(),
    valor_adquisicion: z.coerce
      .number()
      .min(0, { error: "El valor no puede ser negativo." })
      .optional()
      .nullable(),
    centro_costo: z.string().max(100).optional().nullable(),
    notas: z.string().optional().nullable(),
  })
  .check((ctx) => {
    const data = ctx.value;
    const now = new Date();

    if (data.fecha_adquisicion && isAfter(data.fecha_adquisicion, now)) {
      ctx.issues.push({
        code: "custom",
        message: "La fecha de adquisición no puede ser futura.",
        path: ["fecha_adquisicion"],
        input: data.fecha_adquisicion,
      });
    }

    if (
      data.fecha_adquisicion &&
      data.fecha_puesta_marcha &&
      isBefore(data.fecha_puesta_marcha, data.fecha_adquisicion)
    ) {
      ctx.issues.push({
        code: "custom",
        message: "La puesta en marcha no puede ser anterior a la adquisición.",
        path: ["fecha_puesta_marcha"],
        input: data.fecha_puesta_marcha,
      });
    }

    if (
      data.fecha_adquisicion &&
      data.fecha_garantia_expiracion &&
      !isAfter(data.fecha_garantia_expiracion, data.fecha_adquisicion)
    ) {
      ctx.issues.push({
        code: "custom",
        message: "La garantía debe expirar después de la adquisición.",
        path: ["fecha_garantia_expiracion"],
        input: data.fecha_garantia_expiracion,
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
  tipo_mantenimiento_id: requiredUuid("Debe seleccionar un tipo de mantenimiento."),
  fecha_programada: requiredDate("La fecha programada es requerida.").refine(
    (date) => {
      const today = startOfDay(new Date());
      return isAfter(date, today) || date.getTime() >= today.getTime();
    },
    "La fecha programada no puede estar en el pasado.",
  ),
  tecnico_responsable: requiredString("El nombre del técnico es requerido.").min(3),
  prioridad: z.coerce.number().int().min(0).max(2, { error: "Prioridad inválida (0-2)." }),
  observaciones: z.string().optional().nullable(),
  costo_estimado: z.coerce.number().min(0).optional().nullable(),
  proveedor_servicio_id: z.guid().optional().nullable(),
});

export const mantenimientoUpdateSchema = z.object({
  fecha_programada: z.date().optional(),
  fecha_inicio: z.date().optional(),
  fecha_finalizacion: z.date().optional(),
  costo_estimado: z.coerce.number().optional(),
  costo_real: z.coerce.number().optional(),
  tecnico_responsable: z.string().optional(),
  proveedor_servicio_id: z.guid().optional().nullable(),
  prioridad: z.coerce.number().int().min(0).max(2).optional(),
  estado: requiredEnum(Object.values(EstadoMantenimientoEnum)).optional(),
  observaciones: z.string().optional(),
});

// ─── INVENTARIO ─────────────────────────────────────────────────────────────

export const tipoItemSchema = z.object({
  nombre: requiredString("El nombre es requerido.").min(2).max(100),
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

export const inventarioMovimientoSchema = z
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
    costo_unitario: z.coerce.number().min(0).optional().nullable(),
    lote_origen: z.string().max(50).optional().default("N/A"),
    lote_destino: z.string().max(50).optional().default("N/A"),
    ubicacion_origen: z.string().optional().nullable(),
    ubicacion_destino: z.string().optional().nullable(),
    motivo_ajuste: z.string().optional().nullable(),
    equipo_asociado_id: z.guid().optional().nullable(),
    mantenimiento_id: z.guid().optional().nullable(),
    notas: z.string().optional().nullable(),
  })
  .check((ctx) => {
    const data = ctx.value;

    const salidas = [
      TipoMovimientoInvEnum.SalidaUso,
      TipoMovimientoInvEnum.SalidaDescarte,
      TipoMovimientoInvEnum.TransferenciaSalida,
      TipoMovimientoInvEnum.DevolucionProveedor,
    ] as string[];

    if (salidas.includes(data.tipo_movimiento) && !data.ubicacion_origen) {
      ctx.issues.push({
        code: "custom",
        message: "Origen requerido.",
        path: ["ubicacion_origen"],
        input: data.ubicacion_origen,
      });
    }

    const entradas = [
      TipoMovimientoInvEnum.EntradaCompra,
      TipoMovimientoInvEnum.TransferenciaEntrada,
      TipoMovimientoInvEnum.DevolucionInterna,
    ] as string[];

    if (entradas.includes(data.tipo_movimiento) && !data.ubicacion_destino) {
      ctx.issues.push({
        code: "custom",
        message: "Destino requerido.",
        path: ["ubicacion_destino"],
        input: data.ubicacion_destino,
      });
    }

    if (
      data.tipo_movimiento.includes("Ajuste") &&
      (!data.motivo_ajuste || data.motivo_ajuste.length < 5)
    ) {
      ctx.issues.push({
        code: "custom",
        message: "Motivo requerido (mín 5 caracteres).",
        path: ["motivo_ajuste"],
        input: data.motivo_ajuste,
      });
    }
  });

export const editStockSchema = z.object({
  lote: requiredString("El lote es requerido (use N/A si no aplica)."),
  fecha_caducidad: z.date().optional().nullable(),
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
    fecha_adquisicion: requiredDate(),
    fecha_expiracion: z.date().optional().nullable(),
    proveedor_id: z.guid().optional().nullable(),
    costo_adquisicion: z.coerce.number().min(0).optional().nullable(),
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
      message: "Expiración debe ser posterior a adquisición.",
      path: ["fecha_expiracion"],
    },
  );

export const asignarLicenciaSchema = z
  .object({
    asignar_a: z.enum(["equipo", "usuario"], {
      error: "Seleccione un destino.",
    }),
    equipo_id: z.guid().optional().nullable(),
    usuario_id: z.guid().optional().nullable(),
    notas: z.string().optional().nullable(),
    instalado: z.boolean().optional(),
  })
  .refine((data) => data.asignar_a !== "equipo" || !!data.equipo_id, {
    message: "Seleccione un equipo.",
    path: ["equipo_id"],
  })
  .refine((data) => data.asignar_a !== "usuario" || !!data.usuario_id, {
    message: "Seleccione un usuario.",
    path: ["usuario_id"],
  })
  .refine((data) => !(data.equipo_id && data.usuario_id), {
    message: "Violación de restricción: No puede estar asignado a un equipo y a un usuario al mismo tiempo.",
    path: ["asignar_a"],
  });

// ─── USUARIOS Y ROLES ───────────────────────────────────────────────────────

export const usuarioCreateSchema = z.object({
  nombre_usuario: z.string().min(3).max(50),
  email: z
    .email({ error: "Email inválido" })
    .optional()
    .nullable()
    .or(z.literal("")),
  password: z.string().min(8, { error: "Mínimo 8 caracteres" }),
  rol_id: requiredUuid("Rol requerido."),
});

export const usuarioUpdateSchema = z.object({
  nombre_usuario: z.string().min(3).max(50).optional(),
  email: z
    .email({ error: "Email inválido" })
    .optional()
    .nullable()
    .or(z.literal("")),
  password: z.string().min(8).optional().nullable().or(z.literal("")),
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

  email: z
    .union([z.email("Debe ser un email válido."), z.literal("")])
    .optional()
    .nullable(),
});

// ─── PROVEEDORES Y CATÁLOGOS ────────────────────────────────────────────────

export const proveedorSchema = z.object({
  nombre: requiredString("Nombre requerido.").min(2).max(255),
  descripcion: z.string().optional().nullable(),
  contacto: z.string().optional().nullable(),
  direccion: z.string().optional().nullable(),
  sitio_web: z
    .url({ error: "URL inválida" })
    .optional()
    .nullable()
    .or(z.literal("")),
  rnc: z.string().max(50).optional().nullable(),
});

export const estadoEquipoSchema = z.object({
  nombre: requiredString("Nombre requerido.").min(2).max(100),
  descripcion: z.string().optional().nullable(),
  color_hex: z
    .string()
    .regex(/^#([0-9a-fA-F]{6})$/, "Color Hex inválido")
    .optional()
    .nullable()
    .or(z.literal("")),
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
    fecha_inicio: requiredDate(),
    hora_inicio: requiredString(),
    fecha_fin: requiredDate(),
    hora_fin: requiredString(),
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
      message: "La fecha/hora fin debe ser posterior al inicio.",
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
    fecha_prevista_retorno: z.date().optional().nullable(),
    usuario_id: z.guid().optional().nullable(),
    origen: z.string().optional().nullable(),
  })
  .check((ctx) => {
    const data = ctx.value;

    if (
      data.tipo_movimiento === TipoMovimientoEquipoEnum.SalidaTemporal &&
      !data.fecha_prevista_retorno
    ) {
      ctx.issues.push({
        code: "custom",
        message: "Fecha retorno requerida.",
        path: ["fecha_prevista_retorno"],
        input: data.fecha_prevista_retorno,
      });
    }

    if (data.tipo_movimiento === TipoMovimientoEquipoEnum.AsignacionInterna) {
      if (!data.usuario_id) {
        ctx.issues.push({
          code: "custom",
          message: "Usuario asignado requerido.",
          path: ["usuario_id"],
          input: data.usuario_id,
        });
      }
      if (!data.destino || data.destino.length < 3) {
        ctx.issues.push({
          code: "custom",
          message: "Ubicación/Destino de la asignación requerido.",
          path: ["destino"],
          input: data.destino,
        });
      }
      if (!data.origen || data.origen.length < 3) {
        ctx.issues.push({
          code: "custom",
          message: "Ubicación de origen requerida para asignaciones.",
          path: ["origen"],
          input: data.origen,
        });
      }
    }

    const salidасConDestinoRequerido = [
      TipoMovimientoEquipoEnum.SalidaDefinitiva,
      TipoMovimientoEquipoEnum.TransferenciaBodega,
    ] as TipoMovimientoEquipo[];

    if (
      salidасConDestinoRequerido.includes(data.tipo_movimiento) &&
      (!data.destino || data.destino.length < 3)
    ) {
      ctx.issues.push({
        code: "custom",
        message: "Destino físico requerido.",
        path: ["destino"],
        input: data.destino,
      });
    }
  });

export const autorizarMovimientoSchema = z
  .object({
    accion: z.enum(["Aprobar", "Rechazar"], {
      error: "Debe tomar una decisión.",
    }),
    observaciones: z.string().optional(),
  })
  .check((ctx) => {
    const data = ctx.value;

    if (
      data.accion === "Rechazar" &&
      (!data.observaciones || data.observaciones.length < 5)
    ) {
      ctx.issues.push({
        code: "custom",
        message: "Debe justificar el rechazo (mín. 5 caracteres).",
        path: ["observaciones"],
        input: data.observaciones,
      });
    }
  });

// ─── AUTH & SISTEMA ─────────────────────────────────────────────────────────

export const loginSchema = z.object({
  username: requiredString("Usuario requerido."),
  password: requiredString("Contraseña requerida."),
});

export const changePasswordSchema = z
  .object({
    current_password: requiredString("Contraseña actual requerida."),
    new_password: z.string().min(8, { error: "Mínimo 8 caracteres." }),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Las contraseñas no coinciden.",
    path: ["confirm_password"],
  });

export const resetPasswordRequestSchema = z.object({
  username: requiredString("El nombre de usuario es requerido."),
});

export const resetPasswordConfirmSchema = z
  .object({
    username: requiredString("El usuario es requerido."),
    token: requiredString("El token es requerido."),
    new_password: z.string().min(8, {
      error: "La nueva contraseña debe tener al menos 8 caracteres.",
    }),
    confirm_password: z.string().min(8, { error: "Confirme la contraseña." }),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Las contraseñas no coinciden.",
    path: ["confirm_password"],
  });

// ─── OTROS ──────────────────────────────────────────────────────────────────

export const reporteSchema = z
  .object({
    tipo_reporte: z.enum([
      "equipos",
      "mantenimientos",
      "inventario",
      "movimientos",
      "auditoria",
    ]),
    formato: z.enum(["pdf", "excel"]),
    fecha_inicio: requiredDate(),
    fecha_fin: requiredDate(),
  })
  .refine((data) => !isBefore(data.fecha_fin, data.fecha_inicio), {
    message: "Fecha fin inválida.",
    path: ["fecha_fin"],
  });

export const aprobarReservaSchema = z
  .object({
    accion: z.enum(["Aprobar", "Rechazar"]),
    notas_admin: z.string().optional(),
  })
  .check((ctx) => {
    const data = ctx.value;

    if (data.accion === "Rechazar" && !data.notas_admin) {
      ctx.issues.push({
        code: "custom",
        message: "Justifique el rechazo.",
        path: ["notas_admin"],
        input: data.notas_admin,
      });
    }
  });

export const reservaCheckOutSchema = z.object({
  notas_entrega: z.string().optional(),
});

export const reservaCheckInSchema = z.object({
  notas_devolucion: z.string().optional(),
  estado_final_id: z.guid().optional(),
});

export const documentacionVerifySchema = z
  .object({
    estado: requiredEnum([
      EstadoDocumentoEnum.Verificado,
      EstadoDocumentoEnum.Rechazado,
    ]),
    notas_verificacion: z.string().optional().nullable(),
  })
  .check((ctx) => {
    const data = ctx.value;

    if (
      data.estado === EstadoDocumentoEnum.Rechazado &&
      !data.notas_verificacion
    ) {
      ctx.issues.push({
        code: "custom",
        message: "Debe indicar la razón del rechazo.",
        path: ["notas_verificacion"],
        input: data.notas_verificacion,
      });
    }
  });

export const genericCatalogSchema = z.object({
  nombre: requiredString("Nombre requerido.").min(2).max(100),
  descripcion: z.string().optional().nullable(),
  color_hex: z
    .string()
    .regex(/^#([0-9a-fA-F]{6})$/, "Color Hex inválido")
    .optional()
    .nullable()
    .or(z.literal("")),
  periodicidad_dias: z.coerce.number().int().min(0).optional().nullable(),
  es_preventivo: z.boolean().optional(),
  requiere_documentacion: z.boolean().optional(),
});

export const auditFilterSchema = z.object({
  table_name: z.string().optional(),
  operation: z.string().optional(),
  username: z.string().optional(),
});

export const LoginSchema = loginSchema;
export const ChangePasswordSchema = changePasswordSchema;
