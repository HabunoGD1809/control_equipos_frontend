import { cookies } from 'next/headers';
import { UserCircle, Shield, Mail, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Separator } from '@/components/ui/Separator';
import { ChangePasswordForm } from '@/components/features/usuarios/ChangePasswordForm';
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

         <Card>
            <CardHeader>
               <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                     <AvatarImage src={`https://api.dicebear.com/8.x/initials/svg?seed=${user.nombre_usuario}`} />
                     <AvatarFallback>{user.nombre_usuario.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                     <CardTitle className="text-2xl">{user.nombre_usuario}</CardTitle>
                     <p className="text-muted-foreground">{user.rol.nombre}</p>
                  </div>
               </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
               <ProfileInfo icon={Mail} label="Email" value={user.email} />
               <ProfileInfo icon={Calendar} label="Miembro desde" value={format(new Date(user.created_at), "PPP", { locale: es })} />
               <ProfileInfo icon={Calendar} label="Último acceso" value={user.ultimo_login ? format(new Date(user.ultimo_login), "Pp", { locale: es }) : 'N/A'} />
            </CardContent>
         </Card>

         <Card>
            <CardHeader>
               <CardTitle>Seguridad</CardTitle>
            </CardHeader>
            <CardContent>
               <ChangePasswordForm />
            </CardContent>
         </Card>
      </div>
   );
}
