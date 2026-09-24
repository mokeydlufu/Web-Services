# ====================================================================
# Script: Consultar estado de los microservicios Backend
# ====================================================================
$Host.UI.RawUI.WindowTitle = "Estado de Servicios Backend"

$rootPath = (Resolve-Path "$PSScriptRoot\..").Path
$logsDir = Join-Path $rootPath "logs"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "       ESTADO ACTUAL DE LOS MICROSERVICIOS BACKEND          " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$services = @(
    @{ Name = "usuarios-service     "; Port = 8081; Log = "usuarios.log" },
    @{ Name = "ofertas-service      "; Port = 8082; Log = "ofertas.log" },
    @{ Name = "postulaciones-service"; Port = 8083; Log = "postulaciones.log" }
)

foreach ($svc in $services) {
    $conn = Get-NetTCPConnection -LocalPort $svc.Port -State Listen -ErrorAction SilentlyContinue
    $logPath = Join-Path $logsDir $svc.Log
    
    if ($conn) {
        $pids = ($conn | Select-Object -ExpandProperty OwningProcess -Unique) -join ', '
        Write-Host "  [EN LINEA]  $($svc.Name) -> http://localhost:$($svc.Port) (PID: $pids)" -ForegroundColor Green
    } else {
        # Verificar si hay algun proceso java o cmd activo para este servicio
        $hasProcess = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object {
            $_.CommandLine -match $svc.Log.Replace(".log", "") -and $_.Name -match "java|cmd"
        }
        
        if ($hasProcess) {
            Write-Host "  [INICIANDO] $($svc.Name) -> Puerto $($svc.Port) (Cargando Spring Boot...)" -ForegroundColor Yellow
        } else {
            Write-Host "  [DETENIDO]  $($svc.Name) -> Puerto $($svc.Port) (Inactivo)" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "Archivos de Registro (Logs en .\logs\):" -ForegroundColor Gray
foreach ($svc in $services) {
    $logPath = Join-Path $logsDir $svc.Log
    if (Test-Path $logPath) {
        $size = (Get-Item $logPath).Length
        Write-Host "  - $($svc.Log) ($([math]::Round($size / 1KB, 1)) KB)" -ForegroundColor DarkGray
    } else {
        Write-Host "  - $($svc.Log) (No creado aun)" -ForegroundColor DarkGray
    }
}
Write-Host ""
Write-Host "Para ver el log en vivo de un servicio en PowerShell:" -ForegroundColor DarkCyan
Write-Host "  Get-Content logs\usuarios.log -Wait -Tail 30" -ForegroundColor Gray
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
