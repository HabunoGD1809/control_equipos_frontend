"use client";

import { useEffect, useCallback, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Loader2, Eraser } from "lucide-react";

import { movimientoEquipoSchema } from "@/lib/zod";
import { movimientosService } from "@/app/services/movimientosService";
import { equiposService } from "@/app/services/equiposService";
import { ubicacionesService } from "@/app/services/ubicacionesService";
import { getFriendlyErrorMessage } from "@/lib/error-handling";
import {
  MovimientoCreate,
  TipoMovimientoEquipoEnum,
  TipoMovimientoEquipo,
  EquipoRead,
  UsuarioSimple,
  Ubicacion,
} from "@/types/api";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/Button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/Form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Calendar } from "@/components/ui/Calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { AsyncCombobox, type Option } from "@/components/ui/AsyncCombobox";

type MovimientoFormValues = z.infer<typeof movimientoEquipoSchema>;

interface MovimientoFormProps {
  equipo?: EquipoRead;
  equipos?: EquipoRead[];
  usuarios: UsuarioSimple[];
  ubicaciones: Ubicacion[];
  onSuccess?: () => void;
  onCancel: () => void;
}

export function MovimientoForm({ equipo, equipos, usuarios, ubicaciones, onSuccess, onCancel }: MovimientoFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<MovimientoFormValues>({
    resolver: standardSchemaResolver(movimientoEquipoSchema),
    defaultValues: {
      equipo_id: equipo?.id ?? "",
      tipo_movimiento: undefined as unknown as TipoMovimientoEquipo,
      ubicacion_origen_id: equipo?.ubicacion_id ?? null,
      ubicacion_destino_id: null,
      proposito: "",
      observaciones: "",
      fecha_prevista_retorno: null,
      recibido_por: null,
    },
  });

  const tipoSeleccionado = useWatch({ control: form.control, name: "tipo_movimiento" });
  const equipoIdSeleccionado = useWatch({ control: form.control, name: "equipo_id" });

  const isEntrada = tipoSeleccionado === TipoMovimientoEquipoEnum.Entrada;

  useEffect(() => {
    if (equipo) return;
    if (!equipoIdSeleccionado) {
      form.setValue("ubicacion_origen_id", null);
      return;
    }

    if (!isEntrada) {
      const foundInProps = equipos?.find((e) => e.id === equipoIdSeleccionado);
      if (foundInProps && foundInProps.ubicacion_id) {
        form.setValue("ubicacion_origen_id", foundInProps.ubicacion_id);
      } else {
        equiposService.getById(equipoIdSeleccionado).then((eq) => {
          if (eq.ubicacion_id) {
            form.setValue("ubicacion_origen_id", eq.ubicacion_id);
          }
        }).catch(() => { });
      }
    }
  }, [equipoIdSeleccionado, equipos, equipo, form, isEntrada]);

  useEffect(() => {
    if (!tipoSeleccionado) return;

    if (tipoSeleccionado === TipoMovimientoEquipoEnum.Entrada) {
      form.setValue("ubicacion_origen_id", null);
      const almacenPrincipal = ubicaciones.find(u => u.nombre.toLowerCase().includes("almacén"));
      form.setValue("ubicacion_destino_id", almacenPrincipal ? almacenPrincipal.id : null);
      form.setValue("recibido_por", null);
      form.setValue("fecha_prevista_retorno", null);
    } else if (tipoSeleccionado === TipoMovimientoEquipoEnum.AsignacionInterna) {
      form.setValue("ubicacion_destino_id", null);
    }
  }, [tipoSeleccionado, form, ubicaciones]);

  // ─── FETCHER SEGURO PARA TYPESCRIPT ───
  const fetchUbicaciones = useCallback(async (search: string): Promise<Option[]> => {
    try {
      const data = await ubicacionesService.getAll({ include_inactive: false });
      const searchLower = search.toLowerCase();
      const filtered = search
        ? data.filter(u => u.nombre.toLowerCase().includes(searchLower) || u.edificio?.toLowerCase().includes(searchLower))
        : data;

      return filtered.slice(0, 50).map(u => ({ value: u.id, label: `${u.nombre} ${u.edificio ? `(${u.edificio})` : ''}`.trim() }));
    } catch (error) {
      console.error(error);
      return [];
    }
  }, []);

  const defaultUbicacionesOptions = useMemo<Option[]>(() => {
    return ubicaciones.slice(0, 50).map(u => ({
      value: u.id,
      label: `${u.nombre} ${u.edificio ? `(${u.edificio})` : ''}`.trim()
    }));
  }, [ubicaciones]);
  // ──────────────────────────────

  const mutation = useMutation({
    mutationFn: movimientosService.create,
    onSuccess: () => {
      toast({ title: "Movimiento registrado", description: "El estado del equipo ha sido actualizado exitosamente." });
      queryClient.invalidateQueries({ queryKey: ["movimientos"] });
      queryClient.invalidateQueries({ queryKey: ["equipos"] });
      onSuccess?.();
    },
    onError: (error: unknown) => {
      const { message, field } = getFriendlyErrorMessage(error);
      if (field) {
        form.setError(field as keyof MovimientoFormValues, { type: "manual", message });
      } else {
        toast({ variant: "destructive", title: "Error al registrar movimiento", description: message });
      }
    },
  });

  const onSubmit = (data: MovimientoFormValues) => {
    const payload: MovimientoCreate = {
      equipo_id: data.equipo_id,
      tipo_movimiento: data.tipo_movimiento,
      ubicacion_origen_id: data.ubicacion_origen_id || null,
      ubicacion_destino_id: data.ubicacion_destino_id || null,
      proposito: data.proposito || null,
      observaciones: data.observaciones || null,
      recibido_por: data.recibido_por || null,
      fecha_prevista_retorno: data.fecha_prevista_retorno
        ? (data.fecha_prevista_retorno as Date).toISOString()
        : null,
    };
    mutation.mutate(payload);
  };

  const handleClear = () => {
    form.reset({
      equipo_id: equipo?.id ?? "",
      tipo_movimiento: undefined as unknown as TipoMovimientoEquipo,
      ubicacion_origen_id: equipo?.ubicacion_id ?? null,
      ubicacion_destino_id: null,
      proposito: "",
      observaciones: "",
      fecha_prevista_retorno: null,
      recibido_por: null,
    });
  };

  const mostrarDestino = tipoSeleccionado && !isEntrada;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {!equipo && (
          <FormField control={form.control} name="equipo_id" render={({ field }) => (
            <FormItem>
              <FormLabel>Equipo a mover <span className="text-destructive">*</span></FormLabel>
              <FormControl>
                <AsyncCombobox
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Buscar equipo por nombre o serie..."
                  emptyMessage="No se encontraron equipos disponibles."
                  fetcher={async (query) => {
                    const resultados = await equiposService.search(query);
                    return resultados.map((eq) => ({ value: eq.id, label: `${eq.nombre} (${eq.numero_serie})` }));
                  }}
                  defaultOptions={equipos?.slice(0, 50).map(e => ({ value: e.id, label: `${e.nombre} (${e.numero_serie})` }))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        )}

        <FormField control={form.control} name="tipo_movimiento" render={({ field }) => (
          <FormItem>
            <FormLabel>Acción a realizar <span className="text-destructive">*</span></FormLabel>
            <Select value={(field.value as string | undefined) ?? ""} onValueChange={field.onChange}>
              <FormControl><SelectTrigger><SelectValue placeholder="Seleccione el tipo de movimiento" /></SelectTrigger></FormControl>
              <SelectContent>
                {Object.values(TipoMovimientoEquipoEnum).map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {tipoSeleccionado && (
              <FormDescription className="text-xs text-primary font-medium bg-primary/5 p-2 rounded-md mt-2 inline-block">
                Estado resultante del equipo: <strong>{movimientosService.predecirEstadoFinal(tipoSeleccionado, equipo?.estado?.nombre || "Actual")}</strong>
              </FormDescription>
            )}
            <FormMessage />
          </FormItem>
        )} />

        {tipoSeleccionado && (
          <div className="grid grid-cols-1 gap-5 border-l-2 border-primary/20 pl-4 bg-muted/20 p-4 rounded-r-lg animate-in slide-in-from-left-2 duration-300">

            <FormField control={form.control} name="ubicacion_origen_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Ubicación Origen {isEntrada && <span className="text-destructive">*</span>}</FormLabel>
                <FormControl>
                  <AsyncCombobox
                    value={field.value}
                    onChange={field.onChange}
                    fetcher={fetchUbicaciones}
                    defaultOptions={defaultUbicacionesOptions}
                    placeholder={isEntrada ? "Buscar ubicación de origen (ej. Proveedor)..." : "Origen automático..."}
                    disabled={!isEntrada}
                  />
                </FormControl>
                {isEntrada && <FormDescription>Especifique de dónde ingresa el equipo al almacén.</FormDescription>}
                <FormMessage />
              </FormItem>
            )} />

            {mostrarDestino && (
              <FormField control={form.control} name="ubicacion_destino_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Ubicación Destino <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <AsyncCombobox
                      value={field.value}
                      onChange={field.onChange}
                      fetcher={fetchUbicaciones}
                      defaultOptions={defaultUbicacionesOptions}
                      placeholder="Buscar destino físico..."
                    />
                  </FormControl>
                  <FormDescription>El lugar físico donde quedará el equipo.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            )}

            {tipoSeleccionado === TipoMovimientoEquipoEnum.AsignacionInterna && (
              <FormField control={form.control} name="recibido_por" render={({ field }) => (
                <FormItem>
                  <FormLabel>Asignar a empleado <span className="text-destructive">*</span></FormLabel>
                  <Select value={field.value ?? ""} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger className="bg-card"><SelectValue placeholder="Buscar empleado..." /></SelectTrigger></FormControl>
                    <SelectContent className="max-h-50">
                      {usuarios.filter(u => u.is_active).map((u) => <SelectItem key={u.id} value={u.nombre_usuario}>{u.nombre_usuario}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            )}

            {tipoSeleccionado === TipoMovimientoEquipoEnum.SalidaTemporal && (
              <FormField control={form.control} name="fecha_prevista_retorno" render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha prevista de retorno <span className="text-destructive">*</span></FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant="outline" className={cn("w-full pl-3 text-left font-normal bg-card", !field.value && "text-muted-foreground")}>
                          {field.value ? format(field.value as Date, "PPP", { locale: es }) : "Seleccionar fecha"}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={(field.value as Date) ?? undefined} onSelect={field.onChange} disabled={(date) => date < new Date()} autoFocus />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )} />
            )}

            <FormField control={form.control} name="proposito" render={({ field }) => (
              <FormItem>
                <FormLabel>Propósito o Justificación</FormLabel>
                <FormControl><Input placeholder="Ej: Préstamo para conferencia..." className="bg-card" {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        )}

        <div className="flex justify-between items-center pt-4 border-t mt-6">
          <Button type="button" variant="ghost" onClick={handleClear} disabled={mutation.isPending} className="text-muted-foreground">
            <Eraser className="mr-2 h-4 w-4" /> Limpiar
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={mutation.isPending}>Cancelar</Button>
            <Button type="submit" disabled={mutation.isPending || !tipoSeleccionado} className="min-w-30">
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
