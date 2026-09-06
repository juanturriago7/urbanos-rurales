<#
Dispara el redeploy del ambiente de pruebas de urbanos-rurales.
Uso:
    .\deploy\deploy-staging.ps1                # despliega origin/develop
    .\deploy\deploy-staging.ps1 -Ref abc1234    # despliega un commit puntual (rollback)
#>
param(
    [string]$Ref = "develop"
)

$ErrorActionPreference = "Stop"

$VpsUser = "ubuntu"
$VpsIp = "51.222.140.140"
$SshKey = Join-Path $HOME ".ssh\tiviplay-ovh-key"
$Domain = "stage-urbanos.saintsoft.us"

Write-Host "==> Desplegando '$Ref' en https://$Domain ..." -ForegroundColor Cyan

& ssh -i $SshKey "$VpsUser@$VpsIp" "~/deploy-urbanos-staging.sh $Ref"
if ($LASTEXITCODE -ne 0) {
    Write-Host "==> Deploy remoto falló (exit $LASTEXITCODE). Revisa la salida de arriba." -ForegroundColor Red
    exit 1
}

Write-Host "==> Verificando https://$Domain/health ..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

try {
    $response = Invoke-WebRequest -Uri "https://$Domain/health" -UseBasicParsing -TimeoutSec 15
    if ($response.StatusCode -eq 200) {
        Write-Host "==> OK: $Domain responde 200 en /health" -ForegroundColor Green
    } else {
        Write-Host "==> FAIL: /health devolvió $($response.StatusCode)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "==> FAIL: no se pudo alcanzar https://$Domain/health -- $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
