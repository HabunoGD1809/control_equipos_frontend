"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";

import { movimientoEquipoSchema } from "@/lib/zod";
import { movimientosService } from "@/app/services/movimientosService";
import { equiposService } from "@/app/services/equiposService";
import {
  MovimientoCreate,
  TipoMovimientoEquipoEnum,
  EquipoRead,
  UsuarioSimple,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Calendar } from "@/components/ui/Calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { AsyncCombobox } from "@/components/ui/AsyncCombobox";

type MovimientoFormValues = z.infer<typeof movimientoEquipoSchema>;

interface MovimientoFormProps {
  equipo?: EquipoRead;
  equipos?: EquipoRead[];
  usuarios: UsuarioSimple[];
  onSuccess?: () => void;
  onCancel: () => void;
}

export function MovimientoForm({
  equipo,
  equipos,
  usuarios,
  onSuccess,
  onCancel,
}: MovimientoFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<MovimientoFormValues>({
    resolver: standardSchemaResolver(movimientoEquipoSchema),
    defaultValues: {
      equipo_id: equipo?.id ?? "",
      tipo_movimiento: undefined as any,
      origen: equipo?.ubicacion_actual ?? "",
      destino: "",
      proposito: "",
      observaciones: "",
      fecha_prevista_retorno: null,
      recibido_por: null,
    },
  });

  const tipoSeleccionado = useWatch({
    control: form.control,
    name: "tipo_movimiento",
  });

  const equipoIdSeleccionado = useWatch({
    control: form.control,
    name: "equipo_id",
  });

  const isEntrada = tipoSeleccionado === TipoMovimientoEquipoEnum.Entrada;

  useEffect(() => {
    if (equipo) return;
    if (!equipoIdSeleccionado) {
      form.setValue("origen", "");
      return;
    }

    if (!isEntrada) {
      const foundInProps = equipos?.find((e) => e.id === equipoIdSeleccionado);
      if (foundInProps) {
        form.setValue("origen", foundInProps.ubicacion_actual ?? "Almacén Principal");
      } else {
        equiposService.getById(equipoIdSeleccionado).then((eq) => {
          form.setValue("origen", eq.ubicacion_actual ?? "Almacén Principal");
        }).catch(() => {
          form.setValue("origen", "Almacén Principal");
        });
      }
    }
  }, [equipoIdSeleccionado, equipos, equipo, form, isEntrada]);

  useEffect(() => {
    if (!tipoSeleccionado) return;

    if (tipoSeleccionado === TipoMovimientoEquipoEnum.Entrada) {
      form.setValue("origen", ""); // Obligamos al usuario a decir de dónde viene
      form.setValue("destino", "Almacén Principal");
      form.setValue("recibido_por", null);
      form.setValue("fecha_prevista_retorno", null);
    } else if (tipoSeleccionado === TipoMovimientoEquipoEnum.AsignacionInterna) {
      form.setValue("destino", "");
    }
  }, [tipoSeleccionado, form]);

  const mutation = useMutation({
    mutationFn: movimientosService.create,
    onSuccess: () => {
      toast({
        title: "Movimiento registrado",
        description: "El estado del equipo ha sido actualizado exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["movimientos"] });
      queryClient.invalidateQueries({ queryKey: ["equipos"] });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error al registrar movimiento",
        description: error.detail || error.message || "Error desconocido",
      });
    },
  });

  const onSubmit = (data: MovimientoFormValues) => {
    const payload: MovimientoCreate = {
      equipo_id: data.equipo_id,
      tipo_movimiento: data.tipo_movimiento,
      origen: data.origen || null,
      destino: data.destino || null,
      proposito: data.proposito || null,
      observaciones: data.observaciones || null,
      recibido_por: data.recibido_por || null,
      fecha_prevista_retorno: data.fecha_prevista_retorno
        ? (data.fecha_prevista_retorno as Date).toISOString()
        : null,
    };

    mutation.mutate(payload);
  };

  const mostrarDestino = tipoSeleccionado && !isEntrada;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {!equipo && (
          <FormField
            control={form.control}
            name="equipo_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Equipo a mover</FormLabel>
                <FormControl>
                  <AsyncCombobox
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Buscar equipo por nombre o serie..."
                    emptyMessage="No se encontraron equipos disponibles."
                    fetcher={async (query) => {
                      const resultados = await equiposService.search(query);
                      return resultados.map((eq) => ({
                        value: eq.id,
                        label: `${eq.nombre} (${eq.numero_serie})`,
                      }));
                    }}
                    defaultOptions={equipos?.map(e => ({
                      value: e.id,
                      label: `${e.nombre} (${e.numero_serie})`
                    }))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="tipo_movimiento"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Acción a realizar</FormLabel>
              <Select value={(field.value as string | undefined) ?? ""} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Seleccione el tipo de movimiento" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(TipoMovimientoEquipoEnum).map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {tipoSeleccionado && (
                <FormDescription className="text-xs text-primary font-medium">
                  Estado resultante: {movimientosService.predecirEstadoFinal(tipoSeleccionado, equipo?.estado?.nombre || "Actual")}
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {tipoSeleccionado && (
          <div className="grid grid-cols-1 gap-4 border-l-2 border-primary/20 pl-4 animate-in slide-in-from-left-2 duration-300">

            {/* 🚀 Origen - Escribible SOLAMENTE si es Entrada */}
            <FormField
              control={form.control}
              name="origen"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ubicación origen {isEntrada && <span className="text-destructive">*</span>}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      readOnly={!isEntrada}
                      className={!isEntrada ? "bg-muted text-muted-foreground" : ""}
                      tabIndex={!isEntrada ? -1 : undefined}
                      placeholder={isEntrada ? "Ej: Proveedor, Donación, Sede Central..." : ""}
                    />
                  </FormControl>
                  {isEntrada && <FormDescription>Especifique de dónde ingresa el equipo al almacén.</FormDescription>}
                  <FormMessage />
                </FormItem>
              )}
            />

            {mostrarDestino && (
              <FormField
                control={form.control}
                name="destino"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ubicación destino <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Oficina Cliente, Departamento de Finanzas..." {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormDescription>El lugar físico donde quedará el equipo.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {tipoSeleccionado === TipoMovimientoEquipoEnum.AsignacionInterna && (
              <FormField
                control={form.control}
                name="recibido_por"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asignar a empleado <span className="text-destructive">*</span></FormLabel>
                    <Select value={field.value ?? ""} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Buscar empleado..." /></SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-50">
                        {usuarios.map((u) => (
                          <SelectItem key={u.id} value={u.nombre_usuario}>{u.nombre_usuario}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {tipoSeleccionado === TipoMovimientoEquipoEnum.SalidaTemporal && (
              <FormField
                control={form.control}
                name="fecha_prevista_retorno"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha prevista de retorno <span className="text-destructive">*</span></FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? format(field.value as Date, "PPP") : "Seleccionar fecha"}
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
                )}
              />
            )}

            <FormField
              control={form.control}
              name="proposito"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Propósito</FormLabel>
                  <FormControl>
                    <Input placeholder="Justificación del movimiento..." {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
          <Button type="submit" disabled={mutation.isPending || !tipoSeleccionado}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar
          </Button>
        </div>
      </form>
    </Form>
  );
}
