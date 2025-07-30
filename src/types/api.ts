// --- ENUMS ---
export type EstadoDocumentoEnum = "Pendiente" | "Verificado" | "Rechazado";
export type EstadoMantenimientoEnum = "Programado" | "En Proceso" | "Completado" | "Cancelado" | "Pendiente Aprobacion" | "Requiere Piezas" | "Pausado";
export type EstadoMovimientoEquipoEnum = "Pendiente" | "Autorizado" | "En Proceso" | "Completado" | "Cancelado" | "Rechazado";
export type EstadoReservaEnum = "Pendiente Aprobacion" | "Confirmada" | "Rechazada" | "Cancelada" | "Cancelada por Usuario" | "Cancelada por Gestor" | "En Curso" | "Finalizada";
export type TipoMovimientoEquipoEnum = "Salida Temporal" | "Salida Definitiva" | "Entrada" | "Asignacion Interna" | "Transferencia Bodega";
export type TipoRelacionComponenteEnum = "componente" | "conectado_a" | "parte_de" | "accesorio";

// --- Modelos Base ---

export interface Permiso {
   id: string;
   nombre: string;
   descripcion?: string;
}

export interface Rol {
   id: string;
   nombre: string;
   descripcion?: string;
   permisos: Permiso[];
}

export interface UsuarioSimple {
   id: string;
   nombre_usuario: string;
   email?: string;
}

export interface Usuario {
   id: string;
   nombre_usuario: string;
   email?: string;
   rol_id: string;
   bloqueado: boolean;
   ultimo_login?: string;
   created_at: string;
   updated_at: string;
   requiere_cambio_contrasena: boolean;
   rol: {
      id: string;
      nombre: string;
      descripcion?: string;
   };
}

export interface ProveedorSimple {
   id: string;
   nombre: string;
}

export interface Proveedor extends ProveedorSimple {
   descripcion?: string;
   contacto?: string;
   direccion?: string;
   sitio_web?: string;
   rnc?: string;
   created_at: string;
   updated_at: string;
}

export interface EstadoEquipo {
   id: string;
   nombre: string;
   descripcion?: string;
   permite_movimientos: boolean;
   requiere_autorizacion: boolean;
   es_estado_final: boolean;
   color_hex?: string;
   icono?: string;
   created_at: string;
}

export interface EquipoSimple {
   id: string;
   nombre: string;
   numero_serie: string;
   marca?: string;
   modelo?: string;
}

export interface EquipoRead {
   id: string;
   nombre: string;
   numero_serie: string;
   codigo_interno?: string;
   estado_id: string;
   ubicacion_actual?: string;
   marca?: string;
   modelo?: string;
   fecha_adquisicion?: string;
   fecha_puesta_marcha?: string;
   fecha_garantia_expiracion?: string;
   valor_adquisicion?: string;
   proveedor_id?: string;
   centro_costo?: string;
   notas?: string;
   created_at: string;
   updated_at: string;
   estado?: {
      id: string;
      nombre: string;
      color_hex?: string;
      icono?: string;
   };
   proveedor?: ProveedorSimple;
}

export interface Token {
   access_token: string;
   refresh_token: string;
   token_type: string;
}

// NUEVO: Interfaces para Componentes y Padres
export interface ComponenteInfo {
   id: string;
   componente: EquipoSimple;
   tipo_relacion: TipoRelacionComponenteEnum;
   cantidad: number;
   notas?: string;
   created_at: string;
}

export interface PadreInfo {
   id: string;
   padre: EquipoSimple;
   tipo_relacion: TipoRelacionComponenteEnum;
   cantidad: number;
   notas?: string;
   created_at: string;
}


// --- DTOs (Data Transfer Objects) ---

export interface UsuarioCreate {
   nombre_usuario: string;
   email?: string;
   password?: string;
   rol_id: string;
}

export interface UsuarioUpdate {
   nombre_usuario?: string;
   email?: string;
   password?: string;
   rol_id?: string;
   bloqueado?: boolean;
   requiere_cambio_contrasena?: boolean;
}

export interface EquipoCreate {
   nombre: string;
   numero_serie: string;
   codigo_interno?: string | null;
   estado_id: string;
   ubicacion_actual?: string | null;
   marca?: string | null;
   modelo?: string | null;
   fecha_adquisicion?: string | null;
   fecha_puesta_marcha?: string | null;
   fecha_garantia_expiracion?: string | null;
   valor_adquisicion?: string | null;
   proveedor_id?: string | null;
   centro_costo?: string | null;
   notas?: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface EquipoUpdate extends Partial<EquipoCreate> { }

export interface Mantenimiento {
   id: string;
   equipo_id: string;
   tipo_mantenimiento_id: string;
   fecha_programada?: string;
   fecha_inicio?: string;
   fecha_finalizacion?: string;
   costo_estimado?: string;
   costo_real?: string;
   tecnico_responsable: string;
   proveedor_servicio_id?: string;
   estado: EstadoMantenimientoEnum;
   prioridad: number;
   observaciones?: string;
   fecha_proximo_mantenimiento?: string;
   created_at: string;
   updated_at: string;
   equipo: EquipoSimple;
   tipo_mantenimiento: TipoMantenimiento;
   proveedor_servicio?: ProveedorSimple;
}


export interface MantenimientoCreate {
   equipo_id: string;
   tipo_mantenimiento_id: string;
   fecha_programada: string;
   tecnico_responsable: string;
   proveedor_servicio_id?: string | null;
   observaciones?: string | null;
}

export interface Documentacion {
   id: string;
   titulo: string;
   tipo_documento: { nombre: string };
   fecha_subida: string;
   estado: string;
   enlace: string;
}

export interface Movimiento {
   id: string;
   tipo_movimiento: string;
   fecha_hora: string;
   origen?: string;
   destino?: string;
   usuario_registrador?: { nombre_usuario: string };
   proposito?: string;
}

export interface TipoMantenimiento {
   id: string;
   nombre: string;
}

export interface TipoDocumento {
   id: string;
   nombre: string;
}

export interface LicenciaSoftware {
   id: string;
   software_info: { nombre: string; version?: string };
   cantidad_disponible: number;
   cantidad_total: number;
   fecha_expiracion?: string;
   fecha_adquisicion: string;
   costo_adquisicion?: number;
}

export interface SoftwareCatalogo {
   id: string;
   nombre: string;
   version?: string;
   fabricante?: string;
   tipo_licencia: string;
   metrica_licenciamiento: string;
}

export interface ReservaEquipo {
   id: string;
   fecha_hora_inicio: string;
   fecha_hora_fin: string;
   estado: EstadoReservaEnum;
   proposito: string;
   equipo: EquipoSimple;
   solicitante: UsuarioSimple;
}

export interface InventarioStock {
   id: string;
   tipo_item: {
      nombre: string;
      sku?: string;
      stock_minimo: number;
   };
   ubicacion: string;
   cantidad_actual: number;
   lote?: string;
}

export interface TipoItemInventario {
   id: string;
   nombre: string;
   categoria: string;
   marca?: string;
   modelo?: string;
   unidad_medida: string;
}

export interface Notificacion {
   id: string;
   mensaje: string;
   leido: boolean;
   created_at: string;
}

export interface AuditLog {
   id: string;
   audit_timestamp: string;
   table_name: string;
   operation: string;
   username: string;
   app_user_id?: string;
}

export interface BackupLog {
   id: string;
   backup_timestamp: string;
   backup_type: string;
   backup_status: string;
   file_path?: string;
   error_message?: string;
   duration?: string;
}
