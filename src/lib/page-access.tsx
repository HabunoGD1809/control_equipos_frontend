import "server-only";
import { cache } from "react";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { serverApi } from "@/lib/http-server";
import type { Usuario } from "@/types/api";
import { canVisitPage, landingPage } from "@/lib/permissions";
import { Button } from "@/components/ui/Button";

export const getPageUser = cache(() => serverApi.get<Usuario>("/usuarios/me"));

export async function guardPage(path: string) {
   const user = await getPageUser();
   if (canVisitPage(user, path)) return null;
   return <section className="mx-auto max-w-lg space-y-4 rounded-xl border bg-card p-6 text-center">
      <ShieldAlert className="mx-auto h-10 w-10 text-muted-foreground" />
      <h1 className="text-xl font-semibold">No tienes acceso a esta pantalla</h1>
      <p className="text-sm text-muted-foreground">Tu rol no tiene los permisos necesarios. Puedes continuar en las opciones disponibles de tu menú.</p>
      <Button asChild><Link href={landingPage(user)}>Ir a mi área de trabajo</Link></Button>
   </section>;
}
