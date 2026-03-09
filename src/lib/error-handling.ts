export interface ApiErrorResponse {
   message: string;
   field?: string;
}

// Mapa de Constraints de Base de Datos (PostgreSQL/Alembic) a Mensajes Amigables
const DB_CONSTRAINT_MAP: Record<string, string> = {
   // Equipos
   "uq_equipos_numero_serie": "Este número de serie ya existe en el sistema.",
   "uq_equipos_codigo_interno": "Este código interno ya está asignado a otro equipo.",

   // Usuarios
   "uq_usuarios_email": "Este correo electrónico ya está registrado.",
   "uq_usuarios_nombre_usuario": "Este nombre de usuario no está disponible.",

   // Inventario
   "uq_tipos_item_inventario_sku": "El SKU ingresado ya existe.",
   "uq_tipos_item_inventario_codigo_barras": "El código de barras ya está registrado.",

   // Proveedores
   "uq_proveedores_nombre": "Ya existe un proveedor con este nombre.",

   // Catalogos y Software
   "uq_estados_equipo_nombre": "Ya existe un estado con este nombre.",
   "uq_software_nombre_version": "Ya existe un software registrado con este mismo nombre y versión.",
};

// Mapa de errores de Triggers (Mensajes custom lanzados por PL/pgSQL)
const TRIGGER_ERROR_KEYWORDS: Record<string, string> = {
   "Stock insuficiente": "No hay suficiente stock en la ubicación de origen para realizar este movimiento.",
   "disponible de licencia no puede ser negativa": "No hay licencias disponibles para asignar.",
   "fechas lógica": "Las fechas ingresadas son inconsistentes (ej. inicio posterior a fin).",
};

export function getFriendlyErrorMessage(error: unknown): ApiErrorResponse {
   if (error instanceof Error) {
      const customErr = error as Error & { status?: number; data?: any };
      const detailStr = typeof customErr.data?.detail === "string"
         ? customErr.data.detail
         : customErr.data?.message || customErr.message || "";

      // 1. Buscar coincidencia exacta con Constraint (Unique Violations)
      for (const [constraint, message] of Object.entries(DB_CONSTRAINT_MAP)) {
         if (detailStr.includes(constraint)) {
            const field = constraint.split("_").pop();
            const fieldMap: Record<string, string> = {
               "serie": "numero_serie",
               "interno": "codigo_interno",
               "usuario": "nombre_usuario",
               "version": "version", // uq_software_nombre_version
            };

            return { message, field: fieldMap[field || ""] || field };
         }
      }

      // 2. Buscar palabras clave de Triggers (Business Logic Violations)
      for (const [keyword, message] of Object.entries(TRIGGER_ERROR_KEYWORDS)) {
         if (detailStr.includes(keyword)) {
            return { message };
         }
      }

      // 3. Fallbacks
      if (customErr.status === 401) return { message: "Sesión expirada. Por favor inicie sesión nuevamente." };
      if (customErr.status === 403) return { message: "No tiene permisos para realizar esta acción." };
      if (customErr.status === 500) return { message: "Error interno del servidor. Contacte soporte." };

      if (customErr.message) return { message: customErr.message };
   }

   return { message: "Ocurrió un error inesperado. Intente nuevamente." };
}
