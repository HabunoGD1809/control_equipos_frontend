# Arranque del frontend

Requisitos: Node.js 22 o posterior. El backend debe estar disponible en `http://127.0.0.1:8086`. `.env.local` contiene `API_BASE_URL=http://127.0.0.1:8086/api/v1`; en una instalación nueva copie `.env.example`.

```powershell
cd C:\Users\fjvaldez\control-equipos-frontend
.\scripts\start.ps1 -Development
```

Abra `http://localhost:3000`. El script instala las versiones del lockfile. En esta instalación ya están instaladas y puede añadir `-SkipInstall`. El modo local por defecto también es desarrollo para permitir acceso por HTTP.

Ingrese con `admin`. Abra el `.env` del backend y use el texto asignado a la derecha de `SUPERUSER_PASSWORD=`, sin las comillas que delimitan el valor. `SUPERUSER_PASSWORD` es el nombre de la variable. El primer acceso exige cambiar la contraseña. Administración → Empresa configura el nombre y logo para el login y los reportes.

El registro de argumentos de Server Functions está desactivado para evitar que Next escriba contraseñas en la terminal. Reinicie el frontend después de actualizar `next.config.mjs`.

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

Para producción, use `scripts/start.ps1 -Production` y publique mediante HTTPS: las cookies de sesión son HttpOnly y Secure en ese modo. El navegador se comunica con Next; `API_BASE_URL` es privada del servidor. Configure `APP_URL` con el origen público. Si hay proxy inverso, transmita correctamente Host y X-Forwarded-Proto y permita conexiones SSE sin almacenar ni agrupar su respuesta. El canal de notificaciones usa `/api/sse/notificaciones`; reconecta y mantiene consulta de respaldo si se interrumpe.

Se actualizaron npm y pnpm lockfiles. Use un solo gestor por instalación; `npm ci` o `pnpm install --frozen-lockfile`. No aplique `npm audit fix --force`: la propuesta automática degrada Next y rompe la compatibilidad. La auditoría de dependencias de producción no encontró vulnerabilidades conocidas. Sigue un aviso sin corrección publicada en `braces`, dependencia del analizador de desarrollo: https://github.com/advisories/GHSA-vfj7-8cjw-p6xm . El lint conserva una advertencia de React Compiler sobre TanStack Table; React Compiler no está activado.

Se corrigieron navegación móvil, alturas de diálogos, formularios, carga de listas y permisos. Pasaron 33 pruebas unitarias, TypeScript, la compilación de producción y 38 escenarios de navegador en escritorio y móvil. La pasada completa aprobó 37 y la prueba de roles de escritorio aprobó al repetirla con la búsqueda por nombre corregida para la tabla paginada. Se verificaron seis perfiles y 17 pantallas por perfil en ambos tamaños. Esto no equivale a probar todas las resoluciones ni todas las combinaciones de permisos posibles.

La guía de entrega y las pruebas de PostgreSQL, Redis, Celery, Beat y Docker están en `C:\Users\fjvaldez\Desktop\control_equipos_backend\ENTREGA_DESDE_CERO.md`. Para el entorno aislado preparado en esta máquina, `scripts/start-e2e.ps1` inicia la compilación `.next-release-final` en el puerto 3100 y comprueba antes que la API use una base de pruebas. El acceso habitual permanece en el puerto 3000 y usa la base principal limpia.

Después de restaurar o reiniciar una base, una sesión del navegador puede apuntar a un usuario anterior. La aplicación cierra automáticamente esa sesión y vuelve al login; no requiere borrar las cookies manualmente. Se añadieron dos casos Playwright de sesión eliminada, uno por tamaño, y se comprobaron también sesiones vencidas. La suite contiene ahora 40 casos; la evidencia de la entrega anterior y la regresión específica de autenticación se conservan por separado.
