import { api } from "@/lib/http";

export interface GlobalSearchResult {
   tipo: "equipo" | "documento" | "mantenimiento";
   id: string;
   titulo: string;
   descripcion: string;
   relevancia: number;
   metadata: {
      equipo_id?: string;
      numero_serie?: string;
      ubicacion?: string;
      estado?: string;
      nombre_archivo?: string;
      fecha_programada?: string;
   };
}

export const searchService = {
   global: async (q: string): Promise<GlobalSearchResult[]> => {
      const query = new URLSearchParams({ q }).toString();
      return api.get<GlobalSearchResult[]>(`/equipos/search/global?${query}`);
   },
};
