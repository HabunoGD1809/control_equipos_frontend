import "server-only";
import { serverApi } from "@/lib/http-server";
import { collectPages } from "@/lib/collection-pages";
import type { BaseFetchOptions } from "@/lib/http-utils";

export function serverCollection<T extends { id: string }>(path: string, params?: BaseFetchOptions["params"]) {
   return collectPages<T>((skip, limit) => serverApi.get<T[]>(path, { params: { ...params, skip, limit } }));
}
