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
      tipo_movimiento: undefined,
      origen: equipo?.ubicacion_actual ?? "",
      destino: "",
      proposito: "",
      observaciones: "",
      fecha_prevista_retorno: null,
      usuario_id: null,
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

  // Al cambiar de equipo, actualizamos automáticamente el origen
  useEffect(() => {
    if (equipo || !equipos) return;
    const found = equipos.find((e) => e.id === equipoIdSeleccionado);
    if (found) {
      form.setValue("origen", found.ubicacion_actual ?? "Almacén Principal");
      // Reseteamos el destino si cambiamos de equipo, salvo que ya esté manipulado
    }
  }, [equipoIdSeleccionado, equipos, equipo, form]);

  // Al cambiar el tipo de movimiento, autocompletamos campos según reglas de negocio
  useEffect(() => {
    if (!tipoSeleccionado) return;

    const eq = equipo || (equipos && equipos.find((e) => e.id === form.getValues("equipo_id")));
    const locActual = eq?.ubicacion_actual || "Almacén Principal";

    // El origen siempre debe ser la ubicación actual
    form.setValue("origen", locActual);

    if (tipoSeleccionado === TipoMovimientoEquipoEnum.Entrada) {
      form.setValue("destino", "Almacén Principal");
      form.setValue("usuario_id", null);
      form.setValue("fecha_prevista_retorno", null);
    } else if (tipoSeleccionado === TipoMovimientoEquipoEnum.AsignacionInterna) {
      // Para asignación interna, el destino se debe llenar obligatoriamente
      // (ej. "Oficina de Finanzas")
      form.setValue("destino", "");
    }
  }, [tipoSeleccionado, form, equipo, equipos]);

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
    onError: (error: unknown) => {
      const detail =
        error instanceof Error
          ? error.message
          : (error as { response?: { data?: { detail?: string } } })?.response
            ?.data?.detail ?? "Error desconocido";
      toast({
        variant: "destructive",
        title: "Error al registrar movimiento",
        description: detail,
      });
    },
  });

  const onSubmit = (data: MovimientoFormValues) => {
    // Obtenemos el nombre del usuario seleccionado para mandarlo como "recibido_por", 
    // ya que la API no acepta "usuario_id" en la creación del movimiento.
    const selectedUser = usuarios.find((u) => u.id === data.usuario_id);

    const payload: MovimientoCreate = {
      equipo_id: data.equipo_id,
      tipo_movimiento: data.tipo_movimiento,
      origen: data.origen || null,
      destino: data.destino || null,
      proposito: data.proposito || null,
      observaciones: data.observaciones || null,
      // La API acepta string en recibido_por
      recibido_por: selectedUser ? selectedUser.nombre_usuario : null,
      fecha_prevista_retorno: data.fecha_prevista_retorno
        ? (data.fecha_prevista_retorno as Date).toISOString()
        : null,
    };

    mutation.mutate(payload);
  };

  if (!equipo && !equipos?.length) {
    return (
      <p className="p-4 text-destructive text-sm">
        Error: No hay equipos disponibles para mover.
      </p>
    );
  }

  // Corregido: Mostrar destino siempre que NO sea Entrada (AsignacionInterna SÍ requiere destino visible)
  const mostrarDestino =
    tipoSeleccionado && tipoSeleccionado !== TipoMovimientoEquipoEnum.Entrada;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {!equipo && equipos && (
          <FormField
            control={form.control}
            name="equipo_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Equipo a mover</FormLabel>
                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un equipo..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {equipos.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.nombre} ({e.numero_serie})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              <Select
                value={(field.value as string | undefined) ?? ""}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione el tipo de movimiento" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(TipoMovimientoEquipoEnum).map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {tipoSeleccionado && (
                <FormDescription className="text-xs text-primary font-medium">
                  Estado resultante:{" "}
                  {movimientosService.predecirEstadoFinal(tipoSeleccionado)}
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {tipoSeleccionado && (
          <div className="grid grid-cols-1 gap-4 border-l-2 border-primary/20 pl-4 animate-in slide-in-from-left-2 duration-300">

            {/* Campo Origen en modo ReadOnly (Transparencia para el usuario) */}
            <FormField
              control={form.control}
              name="origen"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ubicación origen</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      readOnly
                      className="bg-muted"
                      tabIndex={-1}
                    />
                  </FormControl>
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
                    <FormLabel>
                      Ubicación destino{" "}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: Oficina Cliente, Departamento de Finanzas..."
                        {...field}
                        value={field.value ?? ""}
                      />
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
                name="usuario_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Asignar a empleado{" "}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Buscar empleado..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-50">
                        {usuarios.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.nombre_usuario}
                          </SelectItem>
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
                    <FormLabel>
                      Fecha prevista de retorno{" "}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value
                              ? format(field.value as Date, "PPP")
                              : "Seleccionar fecha"}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={(field.value as Date) ?? undefined}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
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
                    <Input
                      placeholder="Justificación del movimiento..."
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending || !tipoSeleccionado}
          >
            {mutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Confirmar
          </Button>
        </div>
      </form>
    </Form>
  );
}
