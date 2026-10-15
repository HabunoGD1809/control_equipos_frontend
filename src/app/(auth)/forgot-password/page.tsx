import Link from "next/link";
import { AuthCard } from "@/components/features/usuarios/AuthCard";
import { Button } from "@/components/ui/Button";
export default function ForgotPasswordPage() {
   return <AuthCard title="Recuperar acceso" description="Solicita a tu administrador un token de recuperación desde Administración → Usuarios." backHref="/login">
      <div className="space-y-4"><p className="text-sm text-muted-foreground">El token caduca en 15 minutos y solo permite un cambio de contraseña. Cuando lo recibas, úsalo para establecer una contraseña nueva.</p><Button asChild className="w-full"><Link href="/reset-password">Ya tengo mi token</Link></Button></div>
   </AuthCard>;
}
