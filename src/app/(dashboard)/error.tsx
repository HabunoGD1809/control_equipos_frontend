"use client";

import { useTransition } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function DashboardError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
   const [pending, startTransition] = useTransition();
   return <div role="alert" className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-lg border bg-card p-6 text-center sm:p-10">
      <AlertCircle className="h-8 w-8 text-muted-foreground" />
      <h1 className="text-xl font-semibold">No se pudo cargar esta pantalla</h1>
      <p className="text-sm text-muted-foreground">Compruebe la conexión y vuelva a intentarlo. Puede utilizar el menú para consultar otra sección.</p>
      <Button onClick={() => startTransition(() => retry())} disabled={pending}>{pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Reintentar</Button>
   </div>;
}
