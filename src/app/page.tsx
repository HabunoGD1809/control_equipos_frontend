import { Button } from "@/components/ui/Button";

export default function HomePage() {
   return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
         <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
               Bienvenido al Sistema de Control de Equipos
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
               Proyecto Frontend iniciado correctamente.
            </p>
            <div className="mt-8">
               <Button>Empezar</Button>
            </div>
         </div>
      </main>
   );
}
