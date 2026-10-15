/** Fetch complete catalogs and stock without silently stopping at the API page limit. */
export async function collectPages<T extends { id: string }>(fetchPage: (skip: number, limit: number) => Promise<T[]>, pageSize = 200): Promise<T[]> {
   const items = new Map<string, T>();
   for (let skip = 0; ; skip += pageSize) {
      const page = await fetchPage(skip, pageSize);
      const before = items.size;
      for (const item of page) items.set(item.id, item);
      if (page.length < pageSize) return [...items.values()];
      if (before === items.size) throw new Error("El servidor no avanzó de página. Actualice la vista para volver a cargar los datos.");
   }
}
