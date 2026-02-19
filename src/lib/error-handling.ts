import { AxiosError } from "axios";

export interface ApiErrorResponse {
   message: string;
   field?: string; // Campo del formulario al que asociar el error
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

   // Catalogos
   "uq_estados_equipo_nombre": "Ya existe un estado con este nombre.",
};

// Mapa de errores de Triggers (Mensajes custom lanzados por PL/pgSQL)
const TRIGGER_ERROR_KEYWORDS: Record<string, string> = {
   "Stock insuficiente": "No hay suficiente stock en la ubicación de origen para realizar este movimiento.",
   "disponible de licencia no puede ser negativa": "No hay licencias disponibles para asignar.",
   "fechas lógica": "Las fechas ingresadas son inconsistentes (ej. inicio posterior a fin).",
};

/**
 * Analiza un error de Axios y extrae un mensaje amigable para el usuario.
 * Detecta códigos 409/422 y busca coincidencias con constraints conocidos.
 */
export function getFriendlyErrorMessage(error: unknown): ApiErrorResponse {
   if (error instanceof AxiosError) {
      const data = error.response?.data;
      const detail = data?.detail || data?.message || "";

      // 1. Buscar coincidencia exacta con Constraint (Unique Violations)
      for (const [constraint, message] of Object.entries(DB_CONSTRAINT_MAP)) {
         if (detail.includes(constraint)) {
            // Intentamos deducir el campo basado en el constraint
            const field = constraint.split("_").pop(); // ej: 'serie' de 'uq_equipos_numero_serie'
            // Mapeo manual de campos si el nombre del constraint no coincide con el form
            const fieldMap: Record<string, string> = {
               "serie": "numero_serie",
               "interno": "codigo_interno",
               "usuario": "nombre_usuario",
            };

            return { message, field: fieldMap[field || ""] || field };
         }
      }

      // 2. Buscar palabras clave de Triggers (Business Logic Violations)
      for (const [keyword, message] of Object.entries(TRIGGER_ERROR_KEYWORDS)) {
         if (detail.includes(keyword)) {
            return { message };
         }
      }

      // 3. Fallback a mensaje del backend o genérico
      if (detail) return { message: detail };
      if (error.response?.status === 401) return { message: "Sesión expirada. Por favor inicie sesión nuevamente." };
      if (error.response?.status === 403) return { message: "No tiene permisos para realizar esta acción." };
      if (error.response?.status === 500) return { message: "Error interno del servidor." };
   }

   return { message: "Ocurrió un error inesperado. Intente nuevamente." };
}
