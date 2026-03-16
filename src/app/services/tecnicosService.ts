import { api } from "@/lib/http";
import type {
   Tecnico,
   TecnicoCreate,
   TecnicoUpdate,
} from "@/types/api";

type TecnicosQuery = {
   skip?: number;
   limit?: number;
};

export const tecnicosService = {
   getAll(params?: TecnicosQuery): Promise<Tecnico[]> {
      return api.get<Tecnico[]>("/tecnicos/", { params });
   },

   create(payload: TecnicoCreate): Promise<Tecnico> {
      return api.post<Tecnico>("/tecnicos/", payload);
   },

   update(id: string, payload: TecnicoUpdate): Promise<Tecnico> {
      return api.put<Tecnico>(`/tecnicos/${id}`, payload);
   }
};
