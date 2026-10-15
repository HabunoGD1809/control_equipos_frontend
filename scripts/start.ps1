param([int]$Port = 3000, [switch]$Development, [switch]$Production, [switch]$SkipInstall)
$ErrorActionPreference = "Stop"
Push-Location (Split-Path -Parent $PSScriptRoot)
try {
    if (!(Get-Command node -ErrorAction SilentlyContinue)) { throw "Instale Node.js 22 LTS o posterior." }
    if (!(Test-Path -LiteralPath '.env.local')) { throw "Copie .env.example a .env.local y configure API_BASE_URL." }
    if (!$SkipInstall) {
        npm ci
        if ($LASTEXITCODE -ne 0) { throw "No se pudieron instalar las dependencias." }
    }
    if ($Development -and $Production) { throw "Use Development o Production, no ambos." }
    if (!$Production) { npm run dev -- --port $Port }
    else {
        Write-Host "Modo producción: publique el frontend con HTTPS para que el navegador envíe las cookies de sesión seguras."
        npm run build
        if ($LASTEXITCODE -ne 0) { throw "La compilación falló." }
        npm run start -- --port $Port
    }
    if ($LASTEXITCODE -ne 0) { throw "El frontend se detuvo con un error." }
} finally { Pop-Location }
