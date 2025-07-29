# Control de Equipos - Frontend

Bienvenido al frontend del **Sistema de Control y Gestión de Equipos Físicos**. Esta aplicación ha sido desarrollada utilizando Next.js y Tailwind CSS para ofrecer una experiencia de usuario rápida, modular y visualmente atractiva.

El proyecto se conecta a un backend desarrollado en **Python con FastAPI**, que gestiona toda la lógica de negocio y la persistencia de datos. Puedes encontrar el repositorio del backend aquí: [control_equipos_backend](https://github.com/HabunoGD1809/control_equipos_backend).

## ✨ Características Principales

La aplicación cuenta con una amplia gama de funcionalidades para la gestión integral de activos físicos y digitales en una organización:

- **Dashboard Intuitivo**: Visualización rápida de métricas clave como el total de equipos, mantenimientos próximos, licencias por expirar y artículos con bajo stock.
- **Gestión de Equipos**: Módulo completo para registrar, visualizar y administrar el ciclo de vida de los equipos, incluyendo detalles, componentes, historial de movimientos, documentación y mantenimientos asociados.
- **Control de Inventario**: Sistema para gestionar el stock de consumibles y repuestos, registrar movimientos (entradas, salidas, ajustes) y definir tipos de ítems.
- **Administración de Licencias**: Seguimiento de licencias de software, desde un catálogo centralizado hasta la asignación a equipos o usuarios específicos.
- **Sistema de Reservas**: Calendario interactivo para solicitar y gestionar reservas de equipos, con flujos de aprobación para administradores.
- **Gestión de Mantenimiento**: Programación y seguimiento de tareas de mantenimiento preventivo y correctivo para los equipos.
- **Administración Avanzada**:
    - **Usuarios y Roles**: Gestión detallada de usuarios y asignación de roles con permisos específicos para cada módulo del sistema.
    - **Catálogos Dinámicos**: Administración de listas maestras (estados de equipo, tipos de documento, proveedores, etc.) para mantener la consistencia de los datos.
    - **Auditoría y Backups**: Módulos para el seguimiento de cambios en la base de datos y la visualización del historial de copias de seguridad.
- **Experiencia de Usuario Mejorada**:
    - **Búsqueda Global**: Acceso rápido a equipos, documentos y mantenimientos desde cualquier parte de la aplicación con `Ctrl+K`.
    - **Notificaciones**: Sistema de alertas en tiempo real para mantener a los usuarios informados sobre eventos importantes.
    - **Tema Claro/Oscuro**: Soporte para temas personalizables según las preferencias del usuario o del sistema.

## 🛠️ Stack Tecnológico

- **Framework**: [Next.js](https://nextjs.org/) 15 (App Router)
- **Librería UI**: [React](https://react.dev/) 19
- **Estilos**: [Tailwind CSS](https://tailwindcss.com/) 4 con [PostCSS](https://postcss.org/)
- **Componentes UI**: [Shadcn/ui](https://ui.shadcn.com/) - Componentes accesibles y personalizables.
- **Gestión de Estado**: [Zustand](https://zustand-demo.pmnd.rs/) - Manejo de estado global simple y potente.
- **Peticiones HTTP**: [Axios](https://axios-http.com/) con interceptores para el manejo de tokens de autenticación.
- **Animaciones**: [Framer Motion](https://www.framer.com/motion/) para transiciones fluidas.
- **Validación de Formularios**: [React Hook Form](https://react-hook-form.com/) con [Zod](https://zod.dev/) para la validación de esquemas.
- **Tablas de Datos**: [TanStack Table](https://tanstack.com/table/v8) para tablas potentes y personalizables.
- **Iconos**: [Lucide React](https://lucide.dev/).
- **Linting y Formato**: ESLint.

## 🚀 Cómo Empezar

Sigue estos pasos para levantar el entorno de desarrollo local.

### Prerrequisitos

- [Node.js](https://nodejs.org/en/) (v20.x o superior)
- [pnpm](https://pnpm.io/installation) (recomendado)
- Docker y Docker Compose (para el backend)
- El backend de la API debe estar ejecutándose.

### Instalación

1.  **Clona el repositorio del frontend:**
    ```bash
    git clone [https://github.com/HabunoGD1809/control_equipos_frontend.git](https://github.com/HabunoGD1809/control_equipos_frontend.git)
    cd control_equipos_frontend
    ```

2.  **Instala las dependencias con pnpm:**
    ```bash
    pnpm install
    ```

3.  **Configura las variables de entorno:**
    Crea un archivo `.env.local` en la raíz del proyecto y añade la URL de tu backend.
    ```env
    NEXT_PUBLIC_API_BASE_URL=http://localhost:8086/api/v1
    ```
    *(Asegúrate de que el puerto coincida con la configuración de tu backend en Docker).*

4.  **Levanta el backend:**
    Sigue las instrucciones del repositorio [control_equipos_backend](https://github.com/HabunoGD1809/control_equipos_backend) para iniciar los servicios con Docker Compose.

5.  **Inicia el servidor de desarrollo del frontend:**
    ```bash
    pnpm dev
    ```

    Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la aplicación.
