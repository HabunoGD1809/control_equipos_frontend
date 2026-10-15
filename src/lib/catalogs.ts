const systemStates = new Set(["disponible", "en_uso", "prestado", "en_mantenimiento", "dado_de_baja"]);
export function isSystemState(endpoint: string, code?: string | null): boolean {
   return endpoint.includes("estados-equipo") && !!code && systemStates.has(code);
}
