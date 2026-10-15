param(
    [string]$BuildDirectory = '.next-release-final',
    [string]$BackendApi = 'http://127.0.0.1:8091/api/v1',
    [int]$Port = 3100
)
$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$buildPath = [IO.Path]::GetFullPath((Join-Path $projectRoot $BuildDirectory))
if (-not $buildPath.StartsWith($projectRoot + [IO.Path]::DirectorySeparatorChar)) { throw 'La compilación debe estar dentro del frontend.' }
$buildIdFile = Join-Path $buildPath 'BUILD_ID'
if (-not (Test-Path -LiteralPath $buildIdFile)) { throw 'No existe una compilación preparada en el directorio indicado.' }
$backendUri = [Uri]$BackendApi
if ($backendUri.Scheme -ne 'http' -or -not $backendUri.IsLoopback -or $backendUri.UserInfo) { throw 'La API de pruebas debe ser local, sin credenciales en la URL.' }
$health = Invoke-RestMethod -Uri ([Uri]::new($backendUri, '/health')) -TimeoutSec 5
if (-not $health.test_database -or $health.test_database -notlike '*_test*') { throw 'La API no confirmó una base de pruebas aislada.' }
$probe = [Net.Sockets.TcpClient]::new()
try {
    try { $probe.Connect('127.0.0.1', $Port) } catch { }
    if ($probe.Connected) { throw "El puerto $Port está ocupado. Detén con Ctrl+C la terminal que lo mantiene abierto y repite este script." }
} finally { $probe.Dispose() }
$env:NEXT_BUILD_DIR = $BuildDirectory
$env:API_BASE_URL = $BackendApi
Write-Host ('Compilación: ' + (Get-Content -LiteralPath $buildIdFile -Raw).Trim())
Write-Host ('Base aislada: ' + $health.test_database)
Push-Location -LiteralPath $projectRoot
try {
    npm run start -- --hostname 127.0.0.1 --port $Port
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo iniciar el frontend de pruebas.' }
} finally { Pop-Location }
