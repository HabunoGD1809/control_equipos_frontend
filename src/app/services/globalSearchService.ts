import { api } from "@/lib/http";
import type { GlobalSearchResult } from "@/types/api";

export const busquedaService = {
   global: (q: string): Promise<GlobalSearchResult[]> =>
      api.get<GlobalSearchResult[]>("/equipos/search/global", {
         params: { q },
      }),
};
