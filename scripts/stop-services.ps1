# ====================================================================
# Script: Detener todos los microservicios Backend
# Mata Jobs de PowerShell + procesos Java en los puertos del proyecto
# ====================================================================

Write-Host "============================================================" -ForegroundColor Yellow
Write-Host "       DETENIENDO MICROSERVICIOS BACKEND                    " -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Yellow
Write-Host ""

$jobNames = @("usuarios-service", "ofertas-service", "postulaciones-service")
$ports    = @(8081, 8082, 8083)
$portNames = @{8081="usuarios-service"; 8082="ofertas-service"; 8083="postulaciones-service"}
$stoppedCount = 0

# 1. Detener Jobs de PowerShell del proyecto
Write-Host "[1/2] Deteniendo Jobs de PowerShell..." -ForegroundColor Gray
foreach ($jobName in $jobNames) {
    $job = Get-Job -Name $jobName -ErrorAction SilentlyContinue
    if ($job) {
        Stop-Job  -Name $jobName -ErrorAction SilentlyContinue
        Remove-Job -Name $jobName -Force -ErrorAction SilentlyContinue
        Write-Host "  [OK] Job '$jobName' detenido." -ForegroundColor Green
        $stoppedCount++
    } else {
        Write-Host "  [--] Job '$jobName' no estaba activo." -ForegroundColor DarkGray
    }
}

# 2. Matar procesos en los puertos 8081, 8082, 8083
Write-Host ""
Write-Host "[2/2] Liberando puertos..." -ForegroundColor Gray
foreach ($port in $ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($connections) {
        $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($p in $pids) {
            try {
                $proc = Get-Process -Id $p -ErrorAction SilentlyContinue
                $procName = if ($proc) { $proc.Name } else { "desconocido" }
                taskkill /F /T /PID $p 2>$null | Out-Null
                Write-Host "  [OK] Puerto $port ($($portNames[$port])): proceso $procName (PID $p) detenido." -ForegroundColor Green
                $stoppedCount++
            } catch {
                Write-Host "  [ERR] No se pudo matar PID $p en puerto $port" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "  [--] Puerto $port ($($portNames[$port])) ya estaba libre." -ForegroundColor DarkGray
    }
}

# 3. Limpiar procesos residuales de Maven/Java del proyecto
$residuales = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -ne $null -and
    $_.CommandLine -match "spring-boot:run" -and
    $_.CommandLine -match "proyecto-final"
}
if ($residuales) {
    Write-Host ""
    Write-Host "Limpiando procesos residuales de Maven..." -ForegroundColor Gray
    foreach ($r in $residuales) {
        taskkill /F /T /PID $r.ProcessId 2>$null | Out-Null
        Write-Host "  [OK] Proceso residual PID $($r.ProcessId) limpiado." -ForegroundColor Yellow
        $stoppedCount++
    }
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Yellow
if ($stoppedCount -gt 0) {
    Write-Host "  Todos los servicios backend detenidos correctamente." -ForegroundColor Green
} else {
    Write-Host "  No habia servicios backend activos." -ForegroundColor Gray
}
Write-Host "============================================================" -ForegroundColor Yellow
Write-Host ""
