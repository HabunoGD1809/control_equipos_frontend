import { cookies } from 'next/headers';
import { Mail, Calendar, ShieldCheck, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Separator } from '@/components/ui/Separator';
import { Badge } from '@/components/ui/Badge';
import { ChangePasswordForm } from '@/components/features/usuarios/ChangePasswordForm';
import { UpdateProfileForm } from '@/components/features/usuarios/UpdateProfileForm';
import { Usuario } from '@/types/api';

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

function ProfileInfo({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: string | null }) {
   if (!value) return null;
   return (
      <div className="flex items-center justify-between p-3 rounded-md bg-muted/30 border border-border/50 text-sm">
         <div className="flex items-center text-muted-foreground">
            <Icon className="h-4 w-4 mr-2" />
            <span>{label}</span>
         </div>
         <span className="font-medium text-foreground">{value}</span>
      </div>
   );
}

export default async function PerfilPage() {
   const user = await getCurrentUser();

   if (!user) {
      return (
         <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
            <ShieldCheck className="h-12 w-12 text-muted-foreground opacity-50" />
            <h2 className="text-xl font-semibold">Sesión no encontrada</h2>
            <p className="text-muted-foreground">No se pudo cargar la información de tu perfil.</p>
         </div>
      );
   }

   return (
      <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in duration-500">

         {/* Encabezado del Dashboard */}
         <div>
            <h1 className="text-3xl font-bold tracking-tight">Configuración de Perfil</h1>
            <p className="text-muted-foreground mt-1">
               Administra tus datos personales y las preferencias de seguridad de tu cuenta.
            </p>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* Columna Izquierda: Tarjeta de Identidad */}
            <div className="lg:col-span-4 space-y-6">
               <Card className="overflow-hidden border-border/60 shadow-sm">
                  {/* Banner decorativo superior */}
                  <div className="h-24 bg-linear-to-r from-primary/10 via-primary/5 text-transparent to-transparent w-full"></div>

                  <CardContent className="px-6 pb-6 pt-0 relative">
                     <div className="flex flex-col items-center">
                        <Avatar className="h-24 w-24 border-4 border-background shadow-md -mt-12 mb-4 bg-muted">
                           <AvatarImage src={`https://api.dicebear.com/8.x/initials/svg?seed=${user.nombre_usuario}&backgroundColor=1e293b,2563eb`} />
                           <AvatarFallback className="text-xl font-bold">{user.nombre_usuario.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>

                        <div className="text-center space-y-1 mb-6">
                           <h2 className="text-2xl font-bold tracking-tight">{user.nombre_usuario}</h2>
                           <Badge variant="secondary" className="font-normal px-3 py-0.5 capitalize">
                              {user.rol?.nombre || 'Usuario'}
                           </Badge>
                        </div>

                        <Separator className="w-full mb-6 opacity-70" />

                        <div className="w-full space-y-3">
                           <ProfileInfo icon={Mail} label="Email" value={user.email || 'No registrado'} />
                           <ProfileInfo icon={Calendar} label="Miembro desde" value={format(new Date(user.created_at), "dd MMM yyyy", { locale: es })} />
                           <ProfileInfo icon={Activity} label="Último acceso" value={user.ultimo_login ? format(new Date(user.ultimo_login), "dd/MM/yy HH:mm", { locale: es }) : 'Primera sesión'} />
                        </div>
                     </div>
                  </CardContent>
               </Card>
            </div>

            {/* Columna Derecha: Formularios de Edición */}
            <div className="lg:col-span-8 space-y-6">

               {/* Tarjeta de Información General */}
               <Card className="border-border/60 shadow-sm">
                  <CardHeader className="bg-muted/10 border-b border-border/40 pb-4">
                     <CardTitle className="text-lg">Información Pública</CardTitle>
                     <CardDescription>Actualiza tu nombre de usuario y correo de contacto.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                     <UpdateProfileForm currentUser={user} />
                  </CardContent>
               </Card>

               {/* Tarjeta de Seguridad (Zona Sensible) */}
               <Card className="border-border/60 shadow-sm">
                  <CardHeader className="bg-muted/10 border-b border-border/40 pb-4">
                     <div className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">Seguridad de la Cuenta</CardTitle>
                     </div>
                     <CardDescription>Asegúrate de usar una contraseña larga y combinada.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                     <ChangePasswordForm />
                  </CardContent>
               </Card>

            </div>
         </div>
      </div>
   );
}
