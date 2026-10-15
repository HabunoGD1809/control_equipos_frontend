"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Building2, Loader2, Upload, Trash2, Save, CheckCircle2, FileText, LogIn, ImagePlus, RotateCcw } from "lucide-react";
import Image from "next/image";
import { api } from "@/lib/http";
import { companySchema, companyValues, companyPayload, validateCompanyLogo, type Empresa, type CompanyValues } from "@/lib/company";
import { useSession } from "@/contexts/SessionProvider";
import { useHasPermission } from "@/hooks/useHasPermission";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/Form";
import { Alert, AlertDescription } from "@/components/ui/Alert";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/AlertDialog";
import { useToast } from "@/components/ui/use-toast";

export function EmpresaClient() {
   const { user } = useSession();
   const systemPermission = useHasPermission(["administrar_sistema"]);
   const companyPermission = useHasPermission(["configurar_sistema"]);
   const allowed = systemPermission || companyPermission;
   const { data, isPending, error, refetch } = useQuery({ queryKey: ["empresa"], queryFn: () => api.get<Empresa>("/empresa/"), enabled: allowed });
   if (!user) return null;
   if (!allowed) return <Alert><AlertDescription>No tienes permiso para configurar la empresa.</AlertDescription></Alert>;
   if (isPending) return <div className="flex items-center gap-3 py-12" role="status"><Loader2 className="h-5 w-5 animate-spin" />Cargando identidad de la empresa...</div>;
   if (error || !data) return <Alert variant="destructive"><AlertDescription className="flex flex-wrap items-center gap-3">No se pudo cargar la configuración.<Button variant="outline" onClick={() => void refetch()}>Reintentar</Button></AlertDescription></Alert>;
   return <EmpresaForm initial={data} />;
}

function EmpresaForm({ initial }: { initial: Empresa }) {
   const form = useForm<CompanyValues>({ resolver: standardSchemaResolver(companySchema), defaultValues: companyValues(initial) });
   const values = useWatch({ control: form.control });
   const [logo, setLogo] = useState<File | null>(null);
   const [preview, setPreview] = useState<string | null>(null);
   const [removeOpen, setRemoveOpen] = useState(false);
   const fileInput = useRef<HTMLInputElement>(null);
   const qc = useQueryClient();
   const { toast } = useToast();
   useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
   const changed = (data: Empresa) => {
      qc.setQueryData(["empresa"], data);
      window.dispatchEvent(new CustomEvent("company-changed", { detail: { nombre: data.nombre, logo_url: data.logo_url } }));
   };
   const clearLogoSelection = () => { setLogo(null); setPreview(null); if (fileInput.current) fileInput.current.value = ""; };
   const error = (e: Error) => toast({ variant: "destructive", title: "No se pudo guardar", description: e.message });
   const save = useMutation({ mutationFn: (data: CompanyValues) => api.put<Empresa>("/empresa/", companyPayload(data)), onSuccess: data => {
      changed(data); form.reset(companyValues(data));
      toast({ title: "Datos guardados", description: "El nombre y los datos de contacto ya están disponibles en los reportes." });
   }, onError: error });
   const upload = useMutation({ mutationFn: async () => {
      if (!logo) throw new Error("Selecciona una imagen.");
      const problem = validateCompanyLogo(logo); if (problem) throw new Error(problem);
      const body = new FormData(); body.append("file", logo);
      return api.post<Empresa>("/empresa/logo", body);
   }, onSuccess: data => {
      changed(data); clearLogoSelection();
      toast({ title: "Logo actualizado", description: "Tus cambios pendientes en los datos de la empresa se conservaron." });
   }, onError: error });
   const remove = useMutation({ mutationFn: () => api.delete<Empresa>("/empresa/logo"), onSuccess: data => {
      changed(data); clearLogoSelection(); setRemoveOpen(false);
      toast({ title: "Logo retirado", description: "El nombre de la empresa seguirá apareciendo en el acceso y los reportes." });
   }, onError: error });
   const pending = save.isPending || upload.isPending || remove.isPending;
   const dirty = form.formState.isDirty;
   const displayedLogo = preview ?? initial.logo_url;
   const displayedName = values.nombre?.trim() || "Nombre de tu empresa";
   const logoImage = (className: string) => displayedLogo ? <Image src={displayedLogo} width={240} height={100} unoptimized alt={`Logo de ${displayedName}`} className={className} /> : <Building2 className="h-12 w-12 text-muted-foreground" aria-hidden="true" />;
   return (
      <div className="min-w-0 space-y-6">
         <PageHeader title="Identidad de la empresa" description="Haz que el acceso y los reportes reflejen tu organización." actions={<Badge variant={dirty || logo ? "secondary" : "outline"}>{dirty || logo ? "Cambios sin guardar" : <><CheckCircle2 className="mr-1 h-3 w-3" />Configuración al día</>}</Badge>} />
         <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="min-w-0 space-y-6">
               <Card>
                  <CardHeader><CardTitle>Datos de la organización</CardTitle><CardDescription>El nombre es obligatorio. Los contactos son opcionales.</CardDescription></CardHeader>
                  <CardContent>
                     <Form {...form}><form onSubmit={form.handleSubmit(data => save.mutate(data))} className="space-y-5">
                        <fieldset disabled={pending} className="min-w-0 space-y-4">
                           <FormField control={form.control} name="nombre" render={({ field }) => <FormItem><FormLabel>Nombre de la empresa <span className="text-destructive">*</span></FormLabel><FormControl><Input autoComplete="organization" maxLength={150} placeholder="Ej. Centro de Servicios Informáticos" {...field} /></FormControl><FormMessage /></FormItem>} />
                           <div className="grid gap-4 sm:grid-cols-2">
                              <FormField control={form.control} name="identificacion" render={({ field }) => <FormItem><FormLabel>Identificación fiscal</FormLabel><FormControl><Input maxLength={50} placeholder="RIF, RNC o identificación" {...field} /></FormControl><FormMessage /></FormItem>} />
                              <FormField control={form.control} name="telefono" render={({ field }) => <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input type="tel" autoComplete="tel" maxLength={50} placeholder="Teléfono de contacto" {...field} /></FormControl><FormMessage /></FormItem>} />
                           </div>
                           <FormField control={form.control} name="email" render={({ field }) => <FormItem><FormLabel>Correo de contacto</FormLabel><FormControl><Input type="email" autoComplete="email" maxLength={254} placeholder="informatica@empresa.com" {...field} /></FormControl><FormMessage /></FormItem>} />
                           <FormField control={form.control} name="direccion" render={({ field }) => <FormItem><FormLabel>Dirección</FormLabel><FormControl><Textarea autoComplete="street-address" maxLength={500} rows={3} placeholder="Dirección de la organización" {...field} /></FormControl><FormMessage /></FormItem>} />
                        </fieldset>
                        <div className="flex flex-wrap items-center gap-3 border-t pt-4">
                           <Button type="submit" disabled={pending || !dirty}>{save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Guardar datos</Button>
                           {dirty && <Button type="button" variant="ghost" disabled={pending} onClick={() => form.reset(companyValues(initial))}><RotateCcw className="mr-2 h-4 w-4" />Descartar cambios</Button>}
                           <span className="text-xs text-muted-foreground" role="status">{dirty ? "La vista previa muestra cambios que aún no se han guardado." : "Los datos están guardados."}</span>
                        </div>
                     </form></Form>
                  </CardContent>
               </Card>
               <Card>
                  <CardHeader><CardTitle>Logo de la empresa</CardTitle><CardDescription>PNG, JPG o WEBP de hasta 2 MB. Se conserva la proporción de la imagen.</CardDescription></CardHeader>
                  <CardContent className="space-y-4">
                     <div className="flex min-h-32 items-center justify-center rounded-xl border border-dashed bg-muted/20 p-5">{logoImage("h-auto max-h-28 max-w-full object-contain")}</div>
                     <Label htmlFor="company-logo" className="sr-only">Imagen del logo</Label>
                     <input ref={fileInput} id="company-logo" className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" disabled={pending} onChange={event => {
                        const selected = event.target.files?.[0]; if (!selected) return;
                        const problem = validateCompanyLogo(selected);
                        if (problem) { error(new Error(problem)); event.target.value = ""; return; }
                        setLogo(selected); setPreview(URL.createObjectURL(selected));
                     }} />
                     <div className="flex flex-wrap gap-2">
                        <Button variant="outline" disabled={pending} onClick={() => fileInput.current?.click()}><ImagePlus className="mr-2 h-4 w-4" />Seleccionar imagen</Button>
                        {logo && <><Button onClick={() => upload.mutate()} disabled={pending}>{upload.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}Guardar logo</Button><Button variant="ghost" onClick={clearLogoSelection} disabled={pending}>Cancelar selección</Button></>}
                        {initial.logo_url && !logo && <Button variant="ghost" onClick={() => setRemoveOpen(true)} disabled={pending}><Trash2 className="mr-2 h-4 w-4" />Quitar logo</Button>}
                     </div>
                     {logo && <p className="break-words text-xs text-muted-foreground">{logo.name} · {(logo.size / 1024).toFixed(0)} KB · imagen pendiente de guardar</p>}
                  </CardContent>
               </Card>
            </div>
            <div className="min-w-0 space-y-4">
               <Card className="xl:sticky xl:top-0">
                  <CardHeader><CardTitle>Vista previa en vivo</CardTitle><CardDescription>Comprueba cómo se verá antes de guardar.</CardDescription></CardHeader>
                  <CardContent>
                     <Tabs defaultValue="login" className="min-w-0">
                        <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="login"><LogIn className="mr-2 h-4 w-4" />Acceso</TabsTrigger><TabsTrigger value="report"><FileText className="mr-2 h-4 w-4" />Reportes</TabsTrigger></TabsList>
                        <TabsContent value="login"><div className="mt-4 space-y-5 rounded-xl border bg-background p-5 text-center">
                           <div className="flex justify-center">{logoImage("h-auto max-h-20 max-w-full object-contain")}</div>
                           <h3 className="break-words text-xl font-bold">{displayedName}</h3>
                           <p className="text-sm text-muted-foreground">Iniciar sesión</p>
                           <div aria-hidden="true" className="space-y-3 text-left"><div className="rounded-md border p-3 text-sm text-muted-foreground">Nombre de usuario</div><div className="rounded-md border p-3 text-sm text-muted-foreground">••••••••</div><div className="rounded-md bg-primary p-2 text-center text-sm text-primary-foreground">Ingresar</div></div>
                        </div></TabsContent>
                        <TabsContent value="report"><div className="mt-4 rounded-xl border bg-white p-5 text-slate-800">
                           <div className="flex flex-wrap items-center gap-4 border-b pb-4"><div className="max-w-28 shrink-0">{logoImage("h-auto max-h-16 max-w-full object-contain")}</div><div className="min-w-0 flex-1"><h3 className="break-words text-base font-bold">{displayedName}</h3><div className="mt-1 space-y-1 break-words text-xs text-slate-600">{[values.identificacion, values.direccion, values.telefono, values.email].filter(Boolean).map((text, index) => <p key={index}>{text}</p>)}</div></div></div>
                           <p className="mt-5 text-sm font-bold">Reporte de inventario</p><p className="mt-1 text-xs text-slate-500">Encabezado de ejemplo</p><div aria-hidden="true" className="mt-4 space-y-3"><div className="h-6 rounded bg-slate-800" /><div className="h-5 rounded bg-slate-100" /><div className="h-5 rounded bg-slate-50" /></div>
                        </div></TabsContent>
                     </Tabs>
                     <p className="mt-4 text-xs leading-relaxed text-muted-foreground">Los cambios de nombre y contacto se publican con Guardar datos. La imagen se publica con Guardar logo.</p>
                     {initial.updated_at && <p className="mt-3 text-xs text-muted-foreground">Última actualización: {new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(new Date(initial.updated_at))}</p>}
                  </CardContent>
               </Card>
            </div>
         </div>
         <AlertDialog open={removeOpen} onOpenChange={setRemoveOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Quitar el logo de la empresa?</AlertDialogTitle><AlertDialogDescription>El acceso y los reportes mostrarán el nombre de la empresa. Podrás subir otra imagen cuando lo necesites.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel><AlertDialogAction disabled={pending} onClick={event => { event.preventDefault(); remove.mutate(); }}>{remove.isPending ? "Quitando logo..." : "Quitar logo"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      </div>
   );
}
