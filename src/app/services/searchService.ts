import { api } from "@/lib/http";
import type { GlobalSearchResult } from "@/types/api";

export const searchService = {
   global: async (q: string): Promise<GlobalSearchResult[]> => {
      return api.get<GlobalSearchResult[]>("/equipos/search/global", {
         params: { q },
      });
   },
};
