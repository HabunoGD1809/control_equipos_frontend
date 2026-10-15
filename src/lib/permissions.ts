export type PermissionUser = { rol?: { nombre?: string; permisos?: { nombre: string }[] } | null } | null | undefined;

export const PAGE_PERMISSIONS: Record<string, string[]> = {
   "/dashboard": ["ver_dashboard"], "/equipos": ["ver_equipos"], "/movimientos": ["ver_movimientos"],
   "/inventario": ["ver_inventario"], "/mantenimientos": ["ver_mantenimientos"], "/licencias": ["ver_licencias"],
   "/reservas": ["ver_reservas"], "/proveedores": ["ver_proveedores"], "/documentacion": ["ver_documentos"],
   "/reportes": ["generar_reportes"], "/administracion/usuarios": ["administrar_usuarios"],
   "/administracion/roles": ["administrar_roles"], "/administracion/catalogos": ["administrar_catalogos"],
   "/administracion/auditoria": ["ver_auditoria"], "/administracion/empresa": ["administrar_sistema", "configurar_sistema"],
   "/administracion/backups": ["administrar_sistema"], "/perfil": [], "/notificaciones": [], "/cambiar-contrasena": [],
};

export function hasPermission(user: PermissionUser, required: readonly string[], mode: "any" | "all" = "any"): boolean {
   if (!user) return false;
   if (!required.length) return true;
   const available = new Set(user.rol?.permisos?.map(permission => permission.nombre) ?? []);
   if (user.rol?.nombre?.toLowerCase() === "admin") return true;
   return mode === "all" ? required.every(permission => available.has(permission)) : required.some(permission => available.has(permission));
}

export function landingPage(user: PermissionUser): string {
   return Object.entries(PAGE_PERMISSIONS).find(([path, required]) => required.length > 0 && hasPermission(user, required))?.[0] ?? "/perfil";
}

export function canVisitPage(user: PermissionUser, path: string): boolean {
   const entry = Object.entries(PAGE_PERMISSIONS).find(([base]) => path === base || path.startsWith(base + "/"));
   return entry ? hasPermission(user, entry[1]) : false;
}
