import { useState, useEffect, useRef } from 'react';
import { useDebounce } from './useDebounce';

/**
 * Hook para manejar búsquedas via URL (Server Side Filtering).
 * No hace fetch de datos, solo notifica cuando el usuario deja de escribir.
 * * @param initialValue Valor inicial del input (usualmente viene de URL params)
 * @param onSearch Callback que se ejecuta tras el debounce (ej: actualizar URL)
 * @param delay Tiempo de espera en ms (default 500)
 */
export function useDebouncedSearch(
   initialValue: string = "",
   onSearch: (term: string) => void,
   delay: number = 500
) {
   const [searchTerm, setSearchTerm] = useState(initialValue);
   const debouncedTerm = useDebounce(searchTerm, delay);

   // Ref para evitar que se ejecute onSearch en el primer render (montaje)
   const isMounting = useRef(true);

   useEffect(() => {
      // 1. Si es el montaje inicial, no hacemos nada (ya tenemos los datos iniciales)
      if (isMounting.current) {
         isMounting.current = false;
         return;
      }

      // 2. Ejecutamos el callback solo cuando el valor "debounced" cambia
      onSearch(debouncedTerm);

      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [debouncedTerm]);

   // Opcional: Si la URL cambia externamente (ej: navegación atrás), sincronizamos el input
   useEffect(() => {
      setSearchTerm(initialValue);
   }, [initialValue]);

   return {
      searchTerm,
      setSearchTerm
   };
}
