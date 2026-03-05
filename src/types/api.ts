type ValuesOf<T extends Record<string, string>> = T[keyof T];

// ─── ENUMS → as const satisfies ─────────────────────────────────────────────

export const EstadoDocumentoEnum = {
  Pendiente: "Pendiente",
  Verificado: "Verificado",
  Rechazado: "Rechazado",
} as const satisfies Record<string, string>;

export type EstadoDocumento = ValuesOf<typeof EstadoDocumentoEnum>;

// ---

export const EstadoMantenimientoEnum = {
  Programado: "Programado",
  EnProceso: "En Proceso",
  Completado: "Completado",
  Cancelado: "Cancelado",
  PendienteAprobacion: "Pendiente Aprobacion",
  RequierePiezas: "Requiere Piezas",
  Pausado: "Pausado",
} as const satisfies Record<string, string>;

export type EstadoMantenimiento = ValuesOf<typeof EstadoMantenimientoEnum>;

// ---

export const EstadoMovimientoEquipoEnum = {
  Pendiente: "Pendiente",
  Autorizado: "Autorizado",
  EnProceso: "En Proceso",
  Completado: "Completado",
  Cancelado: "Cancelado",
  Rechazado: "Rechazado",
} as const satisfies Record<string, string>;

export type EstadoMovimientoEquipo = ValuesOf<typeof EstadoMovimientoEquipoEnum>;

// ---

export const EstadoReservaEnum = {
  PendienteAprobacion: "Pendiente Aprobacion",
  Confirmada: "Confirmada",
  Rechazada: "Rechazada",
  Cancelada: "Cancelada",
  CanceladaPorUsuario: "Cancelada por Usuario",
  CanceladaPorGestor: "Cancelada por Gestor",
  EnCurso: "En Curso",
  Finalizada: "Finalizada",
} as const satisfies Record<string, string>;

export type EstadoReserva = ValuesOf<typeof EstadoReservaEnum>;

// ---

export const TipoMovimientoEquipoEnum = {
  SalidaTemporal: "Salida Temporal",
  SalidaDefinitiva: "Salida Definitiva",
  Entrada: "Entrada",
  AsignacionInterna: "Asignacion Interna",
  TransferenciaBodega: "Transferencia Bodega",
} as const satisfies Record<string, string>;

export type TipoMovimientoEquipo = ValuesOf<typeof TipoMovimientoEquipoEnum>;

// ---

export const TipoRelacionComponenteEnum = {
  Componente: "componente",
  ConectadoA: "conectado_a",
  ParteDe: "parte_de",
  Accesorio: "accesorio",
} as const satisfies Record<string, string>;

export type TipoRelacionComponente = ValuesOf<typeof TipoRelacionComponenteEnum>;

// ---

export const TipoNotificacionEnum = {
  Info: "info",
  Alerta: "alerta",
  Error: "error",
  Mantenimiento: "mantenimiento",
  Reserva: "reserva",
  Sistema: "sistema",
} as const satisfies Record<string, string>;

export type TipoNotificacion = ValuesOf<typeof TipoNotificacionEnum>;

// ---

export const TipoLicenciaSoftwareEnum = {
  Perpetua: "Perpetua",
  SuscripcionAnual: "Suscripción Anual",
  SuscripcionMensual: "Suscripción Mensual",
  OEM: "OEM",
  Freeware: "Freeware",
  OpenSource: "Open Source",
  Otra: "Otra",
} as const satisfies Record<string, string>;

export type TipoLicenciaSoftware = ValuesOf<typeof TipoLicenciaSoftwareEnum>;

// ---

export const MetricaLicenciamientoEnum = {
  PorDispositivo: "Por Dispositivo",
  PorUsuarioNominal: "Por Usuario Nominal",
  PorUsuarioConcurrente: "Por Usuario Concurrente",
  PorCore: "Por Core",
  PorServidor: "Por Servidor",
  Gratuita: "Gratuita",
  Otra: "Otra",
} as const satisfies Record<string, string>;

export type MetricaLicenciamiento = ValuesOf<typeof MetricaLicenciamientoEnum>;

// ---

export const UnidadMedidaEnum = {
  Unidad: "Unidad",
  Metro: "Metro",
  Kg: "Kg",
  Litro: "Litro",
  Caja: "Caja",
  Paquete: "Paquete",
} as const satisfies Record<string, string>;

export type UnidadMedida = ValuesOf<typeof UnidadMedidaEnum>;

// ---

export const TipoMovimientoInvEnum = {
  EntradaCompra: "Entrada Compra",
  SalidaUso: "Salida Uso",
  SalidaDescarte: "Salida Descarte",
  AjustePositivo: "Ajuste Positivo",
  AjusteNegativo: "Ajuste Negativo",
  TransferenciaSalida: "Transferencia Salida",
  TransferenciaEntrada: "Transferencia Entrada",
  DevolucionProveedor: "Devolucion Proveedor",
  DevolucionInterna: "Devolucion Interna",
} as const satisfies Record<string, string>;

export type TipoMovimientoInv = ValuesOf<typeof TipoMovimientoInvEnum>;

// ---

export const CategoriaItemEnum = {
  Consumible: "Consumible",
  ParteRepuesto: "Parte Repuesto",
  Accesorio: "Accesorio",
  Otro: "Otro",
} as const satisfies Record<string, string>;

export type CategoriaItem = ValuesOf<typeof CategoriaItemEnum>;

// ─── UTILIDADES GLOBALES ─────────────────────────────────────────────────────
export interface Msg {
  msg: string;
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────

export interface EquipoPorEstado {
  estado_id: string;
  estado_nombre: string;
  cantidad_equipos: number;
  estado_color?: string | null;
}

export interface DashboardData {
  total_equipos: number;
  equipos_por_estado: EquipoPorEstado[];
  mantenimientos_proximos_count: number;
  licencias_por_expirar_count: number;
  items_bajo_stock_count: number;
  reservas_pendientes_count: number;
  documentos_pendientes_count: number;
  movimientos_recientes: MovimientoReciente[];
}

// ─── ROLES Y PERMISOS ────────────────────────────────────────────────────────

export interface Permiso {
  id: string;
  nombre: string;
  descripcion?: string | null;
  created_at: string;
}

export interface Rol {
  id: string;
  nombre: string;
  descripcion?: string | null;
  created_at: string;
  updated_at: string;
  permisos: Permiso[];
}

// ─── USUARIOS ────────────────────────────────────────────────────────────────

export interface UsuarioSimple {
  id: string;
  nombre_usuario: string;
  email?: string | null;
}

export interface RolResumen {
  id: string;
  nombre: string;
  descripcion?: string | null;
}

export interface Usuario {
  id: string;
  nombre_usuario: string;
  email?: string | null;
  rol_id: string;
  bloqueado: boolean;
  ultimo_login?: string | null;
  created_at: string;
  updated_at: string;
  requiere_cambio_contrasena: boolean;
  rol: RolResumen;
}

// ─── PROVEEDORES ─────────────────────────────────────────────────────────────

export interface ProveedorSimple {
  id: string;
  nombre: string;
}

export interface Proveedor {
  id: string;
  nombre: string;
  descripcion?: string | null;
  contacto?: string | null;
  direccion?: string | null;
  sitio_web?: string | null;
  rnc?: string | null;
  created_at: string;
  updated_at: string;
}

// ─── EQUIPOS ────────────────────────────────────────────────────────────────

export interface EstadoEquipoSimple {
  id: string;
  nombre: string;
  color_hex?: string | null;
  icono?: string | null;
}

export interface EstadoEquipo extends EstadoEquipoSimple {
  descripcion?: string | null;
  permite_movimientos: boolean;
  requiere_autorizacion: boolean;
  es_estado_final: boolean;
  created_at: string;
}

export interface EquipoSimple {
  id: string;
  nombre: string;
  numero_serie: string;
  marca?: string | null;
  modelo?: string | null;
}

export interface EquipoRead {
  id: string;
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
  valor_adquisicion?: string | number | null;
  proveedor_id?: string | null;
  centro_costo?: string | null;
  notas?: string | null;
  created_at: string;
  updated_at: string;
  estado?: EstadoEquipoSimple | null;
  proveedor?: ProveedorSimple | null;
}

export interface EquipoSearchResult {
  id: string;
  nombre: string;
  numero_serie: string;
  marca?: string | null;
  modelo?: string | null;
  ubicacion_actual?: string | null;
  estado_nombre?: string | null;
  relevancia: number;
}

export interface GlobalSearchResult {
  tipo: "equipo" | "documento" | "mantenimiento";
  id: string;
  titulo: string;
  descripcion: string | null;
  relevancia: number;
  metadata?: Record<string, unknown> | null;
}

// ─── AUTH ────────────────────────────────────────────────────────────────────

export interface Token {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface ResetTokenResponse {
  username: string;
  reset_token: string;
  expires_at: string;
}

export interface PasswordChange {
  current_password: string;
  new_password: string;
}

export interface PasswordResetRequest {
  username: string;
}

export interface PasswordResetConfirm {
  username: string;
  token: string;
  new_password: string;
}

// ─── COMPONENTES ─────────────────────────────────────────────────────────────

export interface ComponenteInfo {
  id: string;
  componente: EquipoSimple;
  tipo_relacion: TipoRelacionComponente;
  cantidad: number;
  notas?: string | null;
  created_at: string;
}

export interface PadreInfo {
  id: string;
  padre: EquipoSimple;
  tipo_relacion: TipoRelacionComponente;
  cantidad: number;
  notas?: string | null;
  created_at: string;
}

// ─── MANTENIMIENTO ──────────────────────────────────────────────────────────

export interface TipoMantenimiento {
  id: string;
  nombre: string;
  descripcion?: string | null;
  periodicidad_dias?: number | null;
  requiere_documentacion: boolean;
  es_preventivo: boolean;
  created_at: string;
}

export interface MantenimientoSimple {
  id: string;
  tipo_mantenimiento_nombre?: string | null;
  equipo_nombre?: string | null;
  fecha_programada?: string | null;
  fecha_finalizacion?: string | null;
  estado: EstadoMantenimiento;
}

export interface Mantenimiento {
  id: string;
  equipo_id: string;
  tipo_mantenimiento_id: string;
  fecha_programada?: string | null;
  fecha_inicio?: string | null;
  fecha_finalizacion?: string | null;
  costo_estimado?: string | number | null;
  costo_real?: string | number | null;
  tecnico_responsable: string;
  proveedor_servicio_id?: string | null;
  estado: EstadoMantenimiento;
  prioridad: number;
  observaciones?: string | null;
  fecha_proximo_mantenimiento?: string | null;
  created_at: string;
  updated_at: string;
  equipo: EquipoSimple;
  tipo_mantenimiento: TipoMantenimiento;
  proveedor_servicio?: ProveedorSimple | null;
}

// ─── DOCUMENTACIÓN ───────────────────────────────────────────────────────────

export interface TipoDocumento {
  id: string;
  nombre: string;
  descripcion?: string | null;
  requiere_verificacion: boolean;
  formato_permitido?: string[] | null;
  created_at: string;
}

export interface Documentacion {
  id: string;
  titulo: string;
  descripcion?: string | null;
  tipo_documento_id: string;
  enlace: string;
  nombre_archivo?: string | null;
  mime_type?: string | null;
  tamano_bytes?: number | null;
  fecha_subida: string;
  subido_por?: string | null;
  estado: EstadoDocumento;
  verificado_por?: string | null;
  fecha_verificacion?: string | null;
  notas_verificacion?: string | null;
  tipo_documento: TipoDocumento;
  subido_por_usuario?: UsuarioSimple | null;
  verificado_por_usuario?: UsuarioSimple | null;
  equipo?: EquipoSimple | null;
  mantenimiento?: MantenimientoSimple | null;
  licencia?: LicenciaSoftwareSimple | null;
}

// ─── MOVIMIENTOS ─────────────────────────────────────────────────────────────

export interface Movimiento {
  id: string;
  equipo_id: string;
  tipo_movimiento: TipoMovimientoEquipo;
  fecha_prevista_retorno?: string | null;
  origen?: string | null;
  destino?: string | null;
  proposito?: string | null;
  recibido_por?: string | null;
  observaciones?: string | null;
  usuario_id?: string | null;
  autorizado_por?: string | null;
  fecha_hora: string;
  fecha_retorno?: string | null;
  estado: EstadoMovimientoEquipo;
  created_at: string;
  equipo: EquipoSimple;
  usuario_registrador?: UsuarioSimple | null;
  usuario_autorizador?: UsuarioSimple | null;
}

export interface MovimientoReciente {
  id: string;
  equipo_nombre: string;
  tipo_movimiento: string;
  fecha_hora: string;
  usuario_nombre?: string | null;
}

// ─── LICENCIAS ───────────────────────────────────────────────────────────────

export interface SoftwareCatalogoSimple {
  id: string;
  nombre: string;
  version?: string | null;
  fabricante?: string | null;
}

export interface SoftwareCatalogo extends SoftwareCatalogoSimple {
  descripcion?: string | null;
  categoria?: string | null;
  tipo_licencia: TipoLicenciaSoftware;
  metrica_licenciamiento: MetricaLicenciamiento;
  created_at: string;
  updated_at: string;
}

export interface LicenciaSoftwareSimple {
  id: string;
  software_nombre?: string | null;
  software_version?: string | null;
  clave_producto?: string | null;
  fecha_expiracion?: string | null;
}

export interface LicenciaSoftware {
  id: string;
  software_catalogo_id: string;
  fecha_adquisicion: string;
  clave_producto?: string | null;
  fecha_expiracion?: string | null;
  proveedor_id?: string | null;
  costo_adquisicion?: string | number | null;
  numero_orden_compra?: string | null;
  cantidad_total: number;
  notas?: string | null;
  cantidad_disponible: number;
  created_at: string;
  updated_at: string;
  software_info: SoftwareCatalogoSimple;
  proveedor?: ProveedorSimple | null;
}

export interface AsignacionLicencia {
  id: string;
  licencia_id: string;
  equipo_id?: string | null;
  usuario_id?: string | null;
  instalado: boolean;
  notas?: string | null;
  fecha_asignacion: string;
  licencia: LicenciaSoftwareSimple;
  equipo?: EquipoSimple | null;
  usuario?: UsuarioSimple | null;
}

// ─── RESERVAS ────────────────────────────────────────────────────────────────

export interface ReservaEquipo {
  id: string;
  equipo_id: string;
  usuario_solicitante_id: string;
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  estado: EstadoReserva;
  proposito: string;
  notas?: string | null;
  aprobado_por_id?: string | null;
  fecha_aprobacion?: string | null;
  check_in_time?: string | null;
  check_out_time?: string | null;
  notas_administrador?: string | null;
  notas_devolucion?: string | null;
  created_at: string;
  updated_at: string;
  equipo: EquipoSimple;
  solicitante: UsuarioSimple;
  aprobado_por?: UsuarioSimple | null;
}

// ─── INVENTARIO ──────────────────────────────────────────────────────────────

export interface TipoItemInventarioSimple {
  id: string;
  nombre: string;
  unidad_medida: UnidadMedida;
  sku?: string | null;
  marca?: string | null;
  modelo?: string | null;
}

export interface TipoItemInventario extends TipoItemInventarioSimple {
  categoria: CategoriaItem;
  descripcion?: string | null;
  stock_minimo: number;
  codigo_barras?: string | null;
  proveedor_preferido_id?: string | null;
  proveedor_preferido?: ProveedorSimple | null;
}

export interface TipoItemInventarioConStock extends TipoItemInventario {
  stock_total_actual: number;
}

export interface InventarioStock {
  id: string;
  tipo_item_id: string;
  ubicacion: string;
  lote?: string | null;
  fecha_caducidad?: string | null;
  cantidad_actual: number;
  costo_promedio_ponderado?: string | null;
  ultima_actualizacion: string;
  tipo_item: TipoItemInventarioSimple;
}

export interface InventarioStockTotal {
  total: number;
}

export interface InventarioMovimiento {
  id: string;
  tipo_item_id: string;
  tipo_movimiento: TipoMovimientoInv;
  cantidad: number;
  fecha_hora: string;
  ubicacion_origen?: string | null;
  ubicacion_destino?: string | null;
  lote_origen?: string | null;
  lote_destino?: string | null;
  costo_unitario?: string | null;
  motivo_ajuste?: string | null;
  referencia_externa?: string | null;
  referencia_transferencia?: string | null;
  equipo_asociado_id?: string | null;
  mantenimiento_id?: string | null;
  notas?: string | null;
  usuario_id?: string | null;
  usuario_registrador?: UsuarioSimple | null;
  tipo_item?: TipoItemInventarioSimple | null;
}

// ─── NOTIFICACIONES ──────────────────────────────────────────────────────────

export interface Notificacion {
  id: string;
  mensaje: string;
  tipo: TipoNotificacion;
  urgencia: number;
  referencia_id?: string | null;
  referencia_tabla?: string | null;
  leido: boolean;
  created_at: string;
  fecha_leido?: string | null;
}

export interface NotificacionUpdate {
  leido: boolean;
}

// ─── LOGS Y AUDITORÍA ────────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  audit_timestamp: string;
  table_name: string;
  operation: "INSERT" | "UPDATE" | "DELETE";
  username?: string | null;
  app_user_id?: string | null;
  old_data?: Record<string, unknown> | null;
  new_data?: Record<string, unknown> | null;
}

export interface BackupLog {
  id: string;
  backup_timestamp: string;
  backup_status?: string | null;
  backup_type?: string | null;
  duration?: string | null;
  file_path?: string | null;
  error_message?: string | null;
  notes?: string | null;
}

// ─── DTOs DE CREACIÓN Y ACTUALIZACIÓN ───────────────────────────────────────

export interface RolCreate {
  nombre: string;
  descripcion?: string | null;
  permiso_ids?: string[] | null;
}

export type RolUpdate = Partial<RolCreate>;

export interface ProveedorCreate {
  nombre: string;
  descripcion?: string | null;
  contacto?: string | null;
  direccion?: string | null;
  sitio_web?: string | null;
  rnc?: string | null;
}

export type ProveedorUpdate = Partial<ProveedorCreate>;

export interface UsuarioCreate {
  nombre_usuario: string;
  email?: string | null;
  password: string;
  rol_id: string;
}

export interface UsuarioUpdate {
  nombre_usuario?: string | null;
  email?: string | null;
  password?: string | null;
  rol_id?: string | null;
  intentos_fallidos?: number | null;
  bloqueado?: boolean | null;
  requiere_cambio_contrasena?: boolean | null;
}

// Catálogos
export interface EstadoEquipoCreate {
  nombre: string;
  descripcion?: string | null;
  permite_movimientos?: boolean;
  requiere_autorizacion?: boolean;
  es_estado_final?: boolean;
  color_hex?: string | null;
  icono?: string | null;
}
export type EstadoEquipoUpdate = Partial<EstadoEquipoCreate>;

export interface TipoDocumentoCreate {
  nombre: string;
  descripcion?: string | null;
  requiere_verificacion?: boolean;
  formato_permitido?: string[] | null;
}
export type TipoDocumentoUpdate = Partial<TipoDocumentoCreate>;

export interface TipoMantenimientoCreate {
  nombre: string;
  descripcion?: string | null;
  periodicidad_dias?: number | null;
  requiere_documentacion?: boolean;
  es_preventivo?: boolean;
}
export type TipoMantenimientoUpdate = Partial<TipoMantenimientoCreate>;

export interface SoftwareCatalogoCreate {
  nombre: string;
  version?: string | null;
  fabricante?: string | null;
  descripcion?: string | null;
  categoria?: string | null;
  tipo_licencia: TipoLicenciaSoftware;
  metrica_licenciamiento: MetricaLicenciamiento;
}
export type SoftwareCatalogoUpdate = Partial<SoftwareCatalogoCreate>;

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
  valor_adquisicion?: number | string | null;
  proveedor_id?: string | null;
  centro_costo?: string | null;
  notas?: string | null;
}

export type EquipoUpdate = Partial<EquipoCreate>;

export interface EquipoComponenteBodyCreate {
  equipo_componente_id: string;
  tipo_relacion?: TipoRelacionComponente;
  cantidad?: number;
  notas?: string | null;
}

export interface EquipoComponenteUpdate {
  tipo_relacion?: TipoRelacionComponente | null;
  cantidad?: number | null;
  notas?: string | null;
}

export interface MantenimientoCreate {
  equipo_id: string;
  tipo_mantenimiento_id: string;
  fecha_programada?: string | null;
  fecha_inicio?: string | null;
  fecha_finalizacion?: string | null;
  costo_estimado?: number | string | null;
  costo_real?: number | string | null;
  tecnico_responsable: string;
  proveedor_servicio_id?: string | null;
  estado?: EstadoMantenimiento;
  prioridad?: number;
  observaciones?: string | null;
}

export interface MantenimientoUpdate {
  fecha_programada?: string | null;
  fecha_inicio?: string | null;
  fecha_finalizacion?: string | null;
  costo_estimado?: number | string | null;
  costo_real?: number | string | null;
  tecnico_responsable?: string | null;
  proveedor_servicio_id?: string | null;
  estado?: EstadoMantenimiento | null;
  prioridad?: number | null;
  observaciones?: string | null;
}

export interface MovimientoCreate {
  equipo_id: string;
  tipo_movimiento: TipoMovimientoEquipo;
  fecha_prevista_retorno?: string | null;
  origen?: string | null;
  destino?: string | null;
  proposito?: string | null;
  recibido_por?: string | null;
  observaciones?: string | null;
}

export interface MovimientoUpdate {
  fecha_retorno?: string | null;
  recibido_por?: string | null;
  observaciones?: string | null;
}

export interface ReservaEquipoCreate {
  equipo_id: string;
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  proposito: string;
  notas?: string | null;
}

export interface ReservaEquipoUpdate {
  fecha_hora_inicio?: string | null;
  fecha_hora_fin?: string | null;
  proposito?: string | null;
  notas?: string | null;
}

export interface ReservaEquipoUpdateEstado {
  estado: EstadoReserva;
  notas_administrador?: string | null;
}

export interface ReservaEquipoCheckInOut {
  check_in_time?: string | null;
  check_out_time?: string | null;
  notas_devolucion?: string | null;
}

export interface DocumentacionVerify {
  estado: typeof EstadoDocumentoEnum.Verificado | typeof EstadoDocumentoEnum.Rechazado;
  notas_verificacion?: string | null;
}

export interface DocumentacionUpdate {
  titulo?: string | null;
  descripcion?: string | null;
  tipo_documento_id?: string | null;
}

export interface TipoItemInventarioCreate {
  nombre: string;
  categoria: CategoriaItem;
  unidad_medida: UnidadMedida;
  descripcion?: string | null;
  stock_minimo?: number;
  marca?: string | null;
  modelo?: string | null;
  sku?: string | null;
  codigo_barras?: string | null;
  proveedor_preferido_id?: string | null;
}

export type TipoItemInventarioUpdate = Partial<TipoItemInventarioCreate>;

export interface InventarioMovimientoCreate {
  tipo_item_id: string;
  tipo_movimiento: TipoMovimientoInv;
  cantidad: number;
  fecha_hora?: string | null;
  costo_unitario?: number | string | null;
  ubicacion_origen?: string | null;
  ubicacion_destino?: string | null;
  lote_origen?: string | null;
  lote_destino?: string | null;
  motivo_ajuste?: string | null;
  referencia_externa?: string | null;
  equipo_asociado_id?: string | null;
  mantenimiento_id?: string | null;
  referencia_transferencia?: string | null;
  notas?: string | null;
}

export interface LicenciaSoftwareCreate {
  software_catalogo_id: string;
  fecha_adquisicion: string;
  clave_producto?: string | null;
  fecha_expiracion?: string | null;
  proveedor_id?: string | null;
  costo_adquisicion?: number | string | null;
  numero_orden_compra?: string | null;
  cantidad_total?: number;
  notas?: string | null;
  cantidad_disponible?: number | null;
}

export interface LicenciaSoftwareUpdate {
  clave_producto?: string | null;
  fecha_adquisicion?: string | null;
  fecha_expiracion?: string | null;
  proveedor_id?: string | null;
  costo_adquisicion?: number | string | null;
  numero_orden_compra?: string | null;
  notas?: string | null;
}

export interface AsignacionLicenciaCreate {
  licencia_id: string;
  equipo_id?: string | null;
  usuario_id?: string | null;
  instalado?: boolean;
  notas?: string | null;
}

export interface AsignacionLicenciaUpdate {
  instalado?: boolean | null;
  notas?: string | null;
}

export type ReporteParams = {
  tipo_reporte: "equipos" | "mantenimientos" | "kardex" | "movimientos" | "auditoria";
  formato: "pdf" | "excel" | "csv";
  fecha_inicio: string;
  fecha_fin: string;
};
