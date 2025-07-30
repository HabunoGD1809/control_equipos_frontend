import { cookies } from 'next/headers';
import { UserCircle, Shield, Mail, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Separator } from '@/components/ui/Separator';
import { ChangePasswordForm } from '@/components/features/usuarios/ChangePasswordForm';
import { Usuario } from '@/types/api';
import { UpdateProfileForm } from '@/components/features/usuarios/UpdateProfileForm';

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
      <div className="flex items-center text-sm">
         <Icon className="h-4 w-4 mr-3 text-muted-foreground" />
         <span className="font-semibold mr-2">{label}:</span>
         <span className="text-muted-foreground">{value}</span>
      </div>
   );
}

export default async function PerfilPage() {
   const user = await getCurrentUser();

   if (!user) {
      return <div>No se pudo cargar la información del perfil.</div>;
   }

   return (
      <div className="space-y-8 max-w-4xl mx-auto">
         <div>
            <h1 className="text-3xl font-bold">Mi Perfil</h1>
            <p className="text-muted-foreground">
               Gestiona tu información personal y la seguridad de tu cuenta.
            </p>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-8">
               <Card>
                  <CardHeader>
                     <div className="flex flex-col items-center space-y-4">
                        <Avatar className="h-24 w-24">
                           <AvatarImage src={`https://api.dicebear.com/8.x/initials/svg?seed=${user.nombre_usuario}`} />
                           <AvatarFallback>{user.nombre_usuario.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                           <CardTitle className="text-2xl text-center">{user.nombre_usuario}</CardTitle>
                           <p className="text-muted-foreground text-center">{user.rol.nombre}</p>
                        </div>
                     </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                     <Separator />
                     <ProfileInfo icon={Mail} label="Email" value={user.email} />
                     <ProfileInfo icon={Calendar} label="Miembro desde" value={format(new Date(user.created_at), "PPP", { locale: es })} />
                     <ProfileInfo icon={Calendar} label="Último acceso" value={user.ultimo_login ? format(new Date(user.ultimo_login), "Pp", { locale: es }) : 'N/A'} />
                  </CardContent>
               </Card>
            </div>
            <div className="lg:col-span-2 space-y-8">
               {/* NUEVO: Tarjeta para actualizar perfil */}
               <Card>
                  <CardHeader>
                     <CardTitle>Información de la Cuenta</CardTitle>
                     <CardDescription>Actualiza tu nombre de usuario y correo electrónico.</CardDescription>
                  </CardHeader>
                  <CardContent>
                     <UpdateProfileForm currentUser={user} />
                  </CardContent>
               </Card>
               <Card>
                  <CardHeader>
                     <CardTitle>Seguridad</CardTitle>
                     <CardDescription>Cambia tu contraseña.</CardDescription>
                  </CardHeader>
                  <CardContent>
                     <ChangePasswordForm />
                  </CardContent>
               </Card>
            </div>
         </div>
      </div>
   );
}
