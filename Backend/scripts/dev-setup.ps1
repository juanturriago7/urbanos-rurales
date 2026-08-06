<#
.SYNOPSIS
    Deja el entorno de desarrollo listo: contenedor de PostgreSQL, esquema y
    usuario administrador.

.DESCRIPTION
    Pensado para que quien clona el repositorio por primera vez ejecute un solo
    comando. Es idempotente: se puede volver a correr sin romper nada.

        1. Levanta el contenedor postgres y espera a que reporte 'healthy'.
        2. Verifica que el puerto del host esté libre para el contenedor.
        3. Instala la herramienta dotnet-ef si falta.
        4. Aplica las migraciones de EF Core.
        5. Crea el usuario administrador de desarrollo.

    El admin NO se siembra en la migración a propósito: esa migración también se
    aplica en producción y dejaría una cuenta con contraseña conocida.

.PARAMETER Recreate
    Borra el volumen de datos y reconstruye la base desde cero. Destructivo:
    se pierde todo lo que haya en la base local.

.EXAMPLE
    ./scripts/dev-setup.ps1

.EXAMPLE
    ./scripts/dev-setup.ps1 -Recreate
#>
[CmdletBinding()]
param(
    [switch]$Recreate
)

$ErrorActionPreference = 'Stop'

# El contenedor publica el 5433 del host (ver docker-compose.yml). El 5432 suele
# estar ocupado por una instalación nativa de PostgreSQL en Windows.
$PuertoHost   = 5433
$Contenedor   = 'portal_postgres'
$BaseDatos    = 'portal_db'
$UsuarioBd    = 'portal_user'
$AdminCorreo  = 'admin@portal.local'
$AdminClave   = 'Admin123*'

$RaizBackend = Split-Path -Parent $PSScriptRoot
Push-Location $RaizBackend

function Write-Paso { param([string]$Texto) Write-Host "`n==> $Texto" -ForegroundColor Cyan }
function Write-Ok   { param([string]$Texto) Write-Host "    $Texto" -ForegroundColor Green }
function Write-Aviso{ param([string]$Texto) Write-Host "    $Texto" -ForegroundColor Yellow }

<#
.SYNOPSIS
    Ejecuta un comando externo y falla solo si su código de salida no es 0.
.DESCRIPTION
    Con $ErrorActionPreference = 'Stop', PowerShell 5.1 convierte cualquier línea
    que un .exe escriba en stderr en un error terminante, aunque el comando haya
    terminado bien (docker y dotnet emiten avisos por stderr de forma rutinaria).
    Esta función relaja la preferencia mientras corre el comando y decide el
    resultado por el código de salida, que es la señal fiable.
#>
function Invoke-Externo {
    param(
        [Parameter(Mandatory)][scriptblock]$Comando,
        [Parameter(Mandatory)][string]$MensajeError
    )

    $preferenciaAnterior = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        # Se combinan los flujos y se convierte cada línea a texto: así el
        # progreso que docker y dotnet mandan por stderr se muestra como salida
        # normal y no como registros de error en rojo.
        & $Comando 2>&1 | ForEach-Object { Write-Host "$_" }
    }
    finally { $ErrorActionPreference = $preferenciaAnterior }

    if ($LASTEXITCODE -ne 0) { throw $MensajeError }
}

try {
    # ── 1. Requisitos ────────────────────────────────────────────────────────
    Write-Paso 'Verificando requisitos'

    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        throw 'Docker no está instalado o no está en el PATH.'
    }
    Invoke-Externo { docker info *> $null } `
        'Docker no está corriendo. Inicia Docker Desktop y vuelve a ejecutar el script.'
    Write-Ok 'Docker disponible.'

    if (-not (Get-Command dotnet -ErrorAction SilentlyContinue)) {
        throw 'El SDK de .NET no está instalado o no está en el PATH.'
    }
    Write-Ok 'SDK de .NET disponible.'

    # ── 2. Puerto del host ───────────────────────────────────────────────────
    # Aviso informativo: si hay un PostgreSQL nativo en el 5432, no estorba
    # (usamos el 5433), pero conviene saberlo al conectarse con pgAdmin.
    $ocupa5432 = Get-NetTCPConnection -LocalPort 5432 -State Listen -ErrorAction SilentlyContinue
    if ($ocupa5432) {
        Write-Aviso 'Hay un servicio escuchando en el puerto 5432 del host (PostgreSQL nativo).'
        Write-Aviso "Este proyecto NO lo usa: el contenedor va por el $PuertoHost."
    }

    # Que el 5433 no lo tenga otro proceso ajeno al contenedor.
    $ocupaPuerto = Get-NetTCPConnection -LocalPort $PuertoHost -State Listen -ErrorAction SilentlyContinue
    if ($ocupaPuerto) {
        $existeContenedor = docker ps -a --filter "name=$Contenedor" --format '{{.Names}}'
        if ($existeContenedor -ne $Contenedor) {
            throw "El puerto $PuertoHost del host está ocupado por otro proceso. Libéralo o cambia el mapeo en docker-compose.yml."
        }
    }

    # ── 3. Contenedor ────────────────────────────────────────────────────────
    if ($Recreate) {
        Write-Paso 'Eliminando contenedor y volumen de datos (-Recreate)'
        Invoke-Externo { docker compose down -v } 'Falló "docker compose down -v".'
        Write-Ok 'Volumen eliminado.'
    }

    Write-Paso 'Levantando el contenedor de PostgreSQL'
    Invoke-Externo { docker compose up -d postgres } 'Falló "docker compose up -d postgres".'

    Write-Paso 'Esperando a que PostgreSQL acepte conexiones'
    $limite = (Get-Date).AddSeconds(120)
    $estado = ''
    do {
        $estado = docker inspect $Contenedor --format '{{.State.Health.Status}}' 2>$null
        if ($estado -eq 'healthy') { break }
        if ($estado -eq 'unhealthy') {
            throw "El contenedor quedó 'unhealthy'. Revisa: docker logs $Contenedor"
        }
        Start-Sleep -Seconds 2
    } while ((Get-Date) -lt $limite)

    if ($estado -ne 'healthy') {
        throw "El contenedor no llegó a 'healthy' en 120 segundos. Revisa: docker logs $Contenedor"
    }
    Write-Ok "PostgreSQL listo en localhost:$PuertoHost."

    # ── 4. Herramienta dotnet-ef ─────────────────────────────────────────────
    Write-Paso 'Verificando la herramienta dotnet-ef'

    # No basta con "dotnet ef": la herramienta puede estar instalada pero fuera
    # del PATH de la sesión actual, así que se resuelve por ruta.
    $rutaEf = Join-Path $env:USERPROFILE '.dotnet\tools\dotnet-ef.exe'
    if (-not (Test-Path $rutaEf)) {
        Write-Aviso 'No se encontró dotnet-ef. Instalando...'
        Invoke-Externo { dotnet tool install --global dotnet-ef } `
            'No se pudo instalar dotnet-ef. Instálala a mano: dotnet tool install --global dotnet-ef'
        if (-not (Test-Path $rutaEf)) {
            throw "dotnet-ef se instaló pero no está en $rutaEf. Instálala a mano y vuelve a ejecutar."
        }
    }
    Write-Ok 'dotnet-ef disponible.'

    # ── 5. Migraciones ───────────────────────────────────────────────────────
    Write-Paso 'Aplicando migraciones de EF Core'
    Invoke-Externo {
        & $rutaEf database update `
            --project src\Portal.Infrastructure `
            --startup-project src\Portal.Api `
            --context PortalDbContext
    } 'Falló la aplicación de migraciones.'
    Write-Ok 'Esquema al día.'

    # ── 6. Usuario administrador ─────────────────────────────────────────────
    # Se hace con ON CONFLICT para que el script sea idempotente. El hash lo
    # calcula pgcrypto dentro de la base; la contraseña nunca se guarda en claro.
    Write-Paso 'Creando el usuario administrador de desarrollo'
    $sql = @"
INSERT INTO usuarios (nombre, correo, password_hash, rol)
VALUES ('Administrador Dev', '$AdminCorreo', crypt('$AdminClave', gen_salt('bf', 11)), 'admin')
ON CONFLICT (correo) DO NOTHING;
"@
    Invoke-Externo {
        $sql | docker exec -i $Contenedor psql -U $UsuarioBd -d $BaseDatos -v ON_ERROR_STOP=1 -q
    } 'Falló la creación del usuario administrador.'
    Write-Ok "Usuario $AdminCorreo listo."

    # ── 7. Resumen ───────────────────────────────────────────────────────────
    Write-Host ''
    Write-Host '─────────────────────────────────────────────────────────────' -ForegroundColor DarkGray
    Write-Host ' Entorno de desarrollo listo' -ForegroundColor Green
    Write-Host '─────────────────────────────────────────────────────────────' -ForegroundColor DarkGray
    Write-Host ''
    Write-Host ' Base de datos (pgAdmin / DBeaver / psql)'
    Write-Host "   Host       : localhost"
    Write-Host "   Puerto     : $PuertoHost   <-- NO es el 5432"
    Write-Host "   Base       : $BaseDatos"
    Write-Host "   Usuario    : $UsuarioBd"
    Write-Host "   Contraseña : portal_pass"
    Write-Host ''
    Write-Host ' Panel administrativo'
    Write-Host "   Correo     : $AdminCorreo"
    Write-Host "   Contraseña : $AdminClave"
    Write-Host ''
    Write-Host ' Siguiente paso:' -ForegroundColor Cyan
    Write-Host '   dotnet run --project src/Portal.Api'
    Write-Host '   http://localhost:5095/health'
    Write-Host ''
}
finally {
    Pop-Location
}
