import { redirect } from "next/navigation";
import { serverApi } from "@/lib/http-server";
import type { Usuario } from "@/types/api";

export default async function ChangeTemporaryPasswordPage() {
   const user = await serverApi.get<Usuario>("/usuarios/me");
   if (!user.requiere_cambio_contrasena) redirect("/dashboard");
   return null;
}
