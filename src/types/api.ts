// --- ENUMS ---
export enum EstadoDocumentoEnum {
   Pendiente = "Pendiente",
   Verificado = "Verificado",
   Rechazado = "Rechazado",
}

export enum EstadoMantenimientoEnum {
   Programado = "Programado",
   EnProceso = "En Proceso",
   Completado = "Completado",
   Cancelado = "Cancelado",
   PendienteAprobacion = "Pendiente Aprobacion",
   RequierePiezas = "Requiere Piezas",
   Pausado = "Pausado",
}

export enum EstadoMovimientoEquipoEnum {
   Pendiente = "Pendiente",
   Autorizado = "Autorizado",
   EnProceso = "En Proceso",
   Completado = "Completado",
   Cancelado = "Cancelado",
   Rechazado = "Rechazado",
}

export enum EstadoReservaEnum {
   PendienteAprobacion = "Pendiente Aprobacion",
   Confirmada = "Confirmada",
   Rechazada = "Rechazada",
   Cancelada = "Cancelada",
   CanceladaPorUsuario = "Cancelada por Usuario",
   CanceladaPorGestor = "Cancelada por Gestor",
   EnCurso = "En Curso",
   Finalizada = "Finalizada",
}

export enum TipoMovimientoEquipoEnum {
   SalidaTemporal = "Salida Temporal",
   SalidaDefinitiva = "Salida Definitiva",
   Entrada = "Entrada",
   AsignacionInterna = "Asignacion Interna",
   TransferenciaBodega = "Transferencia Bodega",
}

export enum TipoRelacionComponenteEnum {
   Componente = "componente",
   ConectadoA = "conectado_a",
   ParteDe = "parte_de",
   Accesorio = "accesorio",
}

export enum TipoNotificacionEnum {
   Info = "info",
   Alerta = "alerta",
   Error = "error",
   Mantenimiento = "mantenimiento",
   Reserva = "reserva",
   Sistema = "sistema",
}

export enum TipoLicenciaSoftwareEnum {
   Perpetua = "Perpetua",
   SuscripcionAnual = "Suscripción Anual",
   SuscripcionMensual = "Suscripción Mensual",
   OEM = "OEM",
   Freeware = "Freeware",
   OpenSource = "Open Source",
   Otra = "Otra",
}

export enum MetricaLicenciamientoEnum {
   PorDispositivo = "Por Dispositivo",
   PorUsuarioNominal = "Por Usuario Nominal",
   PorUsuarioConcurrente = "Por Usuario Concurrente",
   PorCore = "Por Core",
   PorServidor = "Por Servidor",
   Gratuita = "Gratuita",
   Otra = "Otra",
}

export enum UnidadMedidaEnum {
   Unidad = "Unidad",
   Metro = "Metro",
   Kg = "Kg",
   Litro = "Litro",
   Caja = "Caja",
   Paquete = "Paquete",
}

export enum TipoMovimientoInvEnum {
   EntradaCompra = "Entrada Compra",
   SalidaUso = "Salida Uso",
   SalidaDescarte = "Salida Descarte",
   AjustePositivo = "Ajuste Positivo",
   AjusteNegativo = "Ajuste Negativo",
   TransferenciaSalida = "Transferencia Salida",
   TransferenciaEntrada = "Transferencia Entrada",
   DevolucionProveedor = "Devolucion Proveedor",
   DevolucionInterna = "Devolucion Interna",
}


// --- Modelos Base ---
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
}

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
   estado: EstadoDocumentoEnum;
   verificado_por?: string | null;
   fecha_verificacion?: string | null;
   notas_verificacion?: string | null;
   tipo_documento: TipoDocumento;
   subido_por_usuario?: UsuarioSimple | null;
}

export interface Movimiento {
   id: string;
   equipo_id: string;
   tipo_movimiento: TipoMovimientoEquipoEnum;
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
   estado: EstadoMovimientoEquipoEnum;
   created_at: string;
   equipo: EquipoSimple;
   usuario_registrador?: UsuarioSimple | null;
   usuario_autorizador?: UsuarioSimple | null;
}

export interface TipoMantenimiento {
   id: string;
   nombre: string;
   descripcion?: string | null;
   periodicidad_dias?: number | null;
   requiere_documentacion: boolean;
   es_preventivo: boolean;
   created_at: string;
}

export interface TipoDocumento {
   id: string;
   nombre: string;
   descripcion?: string | null;
   requiere_verificacion: boolean;
   formato_permitido?: string[] | null;
   created_at: string;
}

export interface LicenciaSoftwareSimple {
   id: string;
   software_nombre?: string | null;
   software_version?: string | null;
   clave_producto?: string | null;
   fecha_expiracion?: string | null;
}

export interface LicenciaSoftware extends LicenciaSoftwareSimple {
   software_catalogo_id: string;
   fecha_adquisicion: string;
   proveedor_id?: string | null;
   costo_adquisicion?: string | null;
   numero_orden_compra?: string | null;
   cantidad_total: number;
   notas?: string | null;
   cantidad_disponible: number;
   created_at: string;
   updated_at: string;
   software_info: SoftwareCatalogoSimple;
   proveedor?: ProveedorSimple | null;
}

export interface SoftwareCatalogoSimple {
   id: string;
   nombre: string;
   version?: string | null;
   fabricante?: string | null;
}

export interface SoftwareCatalogo extends SoftwareCatalogoSimple {
   descripcion?: string | null;
   categoria?: string | null;
   tipo_licencia: TipoLicenciaSoftwareEnum;
   metrica_licenciamiento: MetricaLicenciamientoEnum;
   created_at: string;
   updated_at: string;
}

export interface ReservaEquipo {
   id: string;
   equipo_id: string;
   usuario_solicitante_id: string;
   fecha_hora_inicio: string;
   fecha_hora_fin: string;
   estado: EstadoReservaEnum;
   proposito: string;
   notas?: string;
   aprobado_por_id?: string;
   fecha_aprobacion?: string;
   check_in_time?: string;
   check_out_time?: string;
   notas_administrador?: string;
   notas_devolucion?: string;
   created_at: string;
   updated_at: string;
   equipo: EquipoSimple;
   solicitante: UsuarioSimple;
   aprobado_por?: UsuarioSimple;
}

export interface InventarioStock {
   id: string;
   tipo_item_id: string;
   ubicacion: string;
   lote?: string | null;
   fecha_caducidad?: string | null;
   cantidad_actual: number;
   ultima_actualizacion: string;
   tipo_item: TipoItemInventarioSimple;
}

export interface TipoItemInventarioSimple {
   id: string;
   nombre: string;
   unidad_medida: UnidadMedidaEnum;
   sku?: string | null;
   marca?: string | null;
   modelo?: string | null;
   stock_minimo: number;
}

export interface TipoItemInventario extends TipoItemInventarioSimple {
   categoria: string;
   descripcion?: string | null;
   stock_minimo: number;
   proveedor_preferido_id?: string | null;
   proveedor_preferido?: ProveedorSimple | null;
}

export interface Notificacion {
   id: string;
   mensaje: string;
   tipo: TipoNotificacionEnum;
   urgencia: number;
   referencia_id?: string | null;
   referencia_tabla?: string | null;
   leido: boolean;
   created_at: string;
   fecha_leido?: string | null;
}

export interface AuditLog<T = unknown> {
   id: string;
   audit_timestamp: string;
   table_name: string;
   operation: 'INSERT' | 'UPDATE' | 'DELETE';
   username?: string | null;
   app_user_id?: string | null;
   old_data?: Record<string, T> | null;
   new_data?: Record<string, T> | null;
}

export interface BackupLog {
   id: string;
   backup_timestamp: string;
   backup_status: string;
   backup_type: string;
   duration?: string | null;
   file_path?: string | null;
   error_message?: string | null;
   notes?: string | null;
}

// --- DTOs (Data Transfer Objects) para Creación y Actualización ---
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

export interface MantenimientoCreate {
   equipo_id: string;
   tipo_mantenimiento_id: string;
   fecha_programada: string;
   tecnico_responsable: string;
   proveedor_servicio_id?: string | null;
   observaciones?: string | null;
}

export interface MantenimientoUpdate extends Partial<Omit<MantenimientoCreate, 'equipo_id'>> {
   estado?: EstadoMantenimientoEnum;
   costo_real?: string;
   fecha_inicio?: string;
   fecha_finalizacion?: string;
}

export interface MovimientoCreate {
   equipo_id: string;
   tipo_movimiento: TipoMovimientoEquipoEnum;
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

export interface ReservaEquipoUpdateEstado {
   estado: EstadoReservaEnum;
   notas_administrador?: string | null;
}

export interface ReservaEquipoCheckInOut {
   check_in_time?: string | null;
   check_out_time?: string | null;
   notas_devolucion?: string | null;
}

export interface DocumentacionVerify {
   estado: 'Verificado' | 'Rechazado';
   notas_verificacion?: string | null;
}
