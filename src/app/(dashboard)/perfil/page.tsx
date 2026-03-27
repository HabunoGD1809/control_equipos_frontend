import { cookies } from 'next/headers';
import { Mail, Calendar, ShieldCheck, Activity, Building2, User } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Separator } from '@/components/ui/Separator';
import { Badge } from '@/components/ui/Badge';
import { ChangePasswordForm } from '@/components/features/usuarios/ChangePasswordForm';
import { UpdateProfileForm } from '@/components/features/usuarios/UpdateProfileForm';
import { Usuario } from '@/types/api';

// --- Función de obtención de datos ---
async function getCurrentUser(): Promise<Usuario | null> {
   const accessToken = (await cookies()).get('access_token')?.value;
   if (!accessToken) return null;

   try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/usuarios/me`, {
         headers: { 'Authorization': `Bearer ${accessToken}` },
         cache: 'no-store',
      });
      if (!response.ok) return null;
      return response.json();
   } catch (error) {
      console.error("[GET_CURRENT_USER_ERROR]", error);
      return null;
   }
}

function ProfileInfoRow({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: string | null }) {
   if (!value) return null;
   return (
      <div className="flex items-center justify-between p-2.5 rounded-md bg-muted/30 border border-border/50 text-[13px] transition-colors hover:bg-muted/50">
         <div className="flex items-center text-muted-foreground">
            <Icon className="h-4 w-4 mr-2 text-primary/70" />
            <span className="font-medium">{label}</span>
         </div>
         <span className="font-medium text-foreground text-right truncate max-w-37.5" title={value}>{value}</span>
      </div>
   );
}

// --- Componente Principal ---
export default async function PerfilPage() {
   const user = await getCurrentUser();

   if (!user) {
      return (
         <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 animate-in fade-in zoom-in duration-500">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
               <ShieldCheck className="h-8 w-8 text-muted-foreground opacity-60" />
            </div>
            <div className="text-center space-y-1">
               <h2 className="text-xl font-bold tracking-tight text-foreground">Sesión no encontrada</h2>
               <p className="text-sm text-muted-foreground max-w-xs">No pudimos verificar tu identidad. Inicia sesión nuevamente.</p>
            </div>
         </div>
      );
   }

   const userInitials = user.nombre_usuario.substring(0, 2).toUpperCase();

   return (
      <div className="space-y-5 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-4">

         <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Configuración de Perfil</h1>
            <p className="text-muted-foreground mt-1 text-sm">
               Administra tu información personal y las credenciales de tu cuenta.
            </p>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            <div className="lg:col-span-4 space-y-6">
               <Card className="overflow-hidden border-border/50 shadow-sm">
                  <div className="h-20 bg-linear-to-r from-primary/15 via-primary/5 to-transparent w-full relative">
                     <div className="absolute inset-0 bg-grid-white/10 mask-[linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-black/10"></div>
                  </div>

                  <CardContent className="px-5 pb-5 pt-0 relative flex flex-col items-center">
                     {/* Avatar Ajustado */}
                     <Avatar className="h-24 w-24 border-4 border-background shadow-sm -mt-12 mb-3 bg-primary/5">
                        <AvatarImage src={`https://api.dicebear.com/8.x/initials/svg?seed=${user.nombre_usuario}&backgroundColor=1e293b,2563eb`} alt={user.nombre_usuario} />
                        <AvatarFallback className="text-xl font-bold text-primary">{userInitials}</AvatarFallback>
                     </Avatar>

                     {/* Nombre de Usuario y Badges */}
                     <div className="text-center space-y-1 mb-4 w-full">
                        <h2 className="text-xl font-bold tracking-tight text-foreground truncate px-2" title={user.nombre_usuario}>
                           {user.nombre_usuario}
                        </h2>

                        <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2">
                           <Badge variant="default" className="text-xs font-medium px-2 py-0.5 capitalize shadow-none flex items-center gap-1 bg-primary/90 hover:bg-primary">
                              <User className="w-3 h-3" />
                              {user.rol?.nombre || 'Usuario'}
                           </Badge>

                           {user.departamento_rel && (
                              <Badge variant="outline" className="text-xs font-medium px-2 py-0.5 shadow-none flex items-center gap-1 border-primary/20 text-foreground bg-primary/5">
                                 <Building2 className="w-3 h-3 text-primary/70" />
                                 {user.departamento_rel.nombre}
                              </Badge>
                           )}
                        </div>
                     </div>

                     <Separator className="w-full mb-4 opacity-50" />

                     {/* Detalles Informativos */}
                     <div className="w-full space-y-2">
                        <ProfileInfoRow
                           icon={Mail}
                           label="Correo"
                           value={user.email || 'No registrado'}
                        />
                        <ProfileInfoRow
                           icon={Calendar}
                           label="Miembro"
                           value={format(new Date(user.created_at), "dd MMM yyyy", { locale: es })}
                        />
                        <ProfileInfoRow
                           icon={Activity}
                           label="Acceso"
                           value={user.ultimo_login ? format(new Date(user.ultimo_login), "dd/MM/yy HH:mm", { locale: es }) : 'Sesión actual'}
                        />
                     </div>
                  </CardContent>
               </Card>
            </div>

            <div className="lg:col-span-8 space-y-5">

               {/* Tarjeta de Información General */}
               <Card className="border-border/50 shadow-sm overflow-hidden">
                  <CardHeader className="bg-muted/10 border-b border-border/40 pb-3 pt-4 px-6">
                     <CardTitle className="text-base flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        Información Pública
                     </CardTitle>
                     <CardDescription className="text-[13px] mt-1">
                        Actualiza tu usuario y correo. Cambios de rol o departamento requieren un administrador.
                     </CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 sm:p-6">
                     <UpdateProfileForm currentUser={user} />
                  </CardContent>
               </Card>

               <Card className="border-destructive/20 shadow-sm overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-1 h-full bg-destructive/50"></div>

                  <CardHeader className="bg-destructive/5 border-b border-destructive/10 pb-3 pt-4 px-6 pl-8">
                     <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-destructive" />
                        <CardTitle className="text-base">Seguridad de la Cuenta</CardTitle>
                     </div>
                     <CardDescription className="text-[13px] mt-1">
                        Usa una combinación de letras, números y símbolos para mayor seguridad.
                     </CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 sm:p-6 pl-8">
                     <ChangePasswordForm />
                  </CardContent>
               </Card>

            </div>
         </div>
      </div>
   );
}
