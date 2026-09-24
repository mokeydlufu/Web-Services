# ====================================================================
# Script: Iniciar microservicios Backend en Segundo Plano (Silencioso)
# Tecnica: genera un .bat temporal por servicio con rutas absolutas
# embebidas, luego lo ejecuta con powershell.exe oculto.
# Sin ventanas. Sin procesos huerfanos. Logs en .\logs\
# ====================================================================

$rootPath   = (Resolve-Path "$PSScriptRoot\..").Path
$logsDir    = Join-Path $rootPath "logs"
$scriptsDir = $PSScriptRoot

if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  PLATAFORMA DE EMPLEABILIDAD - INICIO EN SEGUNDO PLANO     " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Cargar variables de entorno desde .env
$envFile   = Join-Path $rootPath ".env"
$envSetLines = ""
if (Test-Path $envFile) {
    Write-Host "[INFO] Cargando variables desde .env..." -ForegroundColor Gray
    Get-Content $envFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
            $parts = $line.Split("=", 2)
            $k = $parts[0].Trim()
            $v = $parts[1].Trim().Trim('"').Trim("'")
            [System.Environment]::SetEnvironmentVariable($k, $v, "Process")
            $envSetLines += "set `"$k=$v`"`r`n"
        }
    }
    Write-Host "[OK]   Variables cargadas." -ForegroundColor DarkGray
    Write-Host ""
}

# 2. JVM / Maven config
$mavenOpts = "-Xmx384m -XX:+TieredCompilation -XX:TieredStopAtLevel=1"
$jvmArgs   = "-Xmx256m -Xms128m -XX:+TieredCompilation -XX:TieredStopAtLevel=1"

# 3. Definicion de servicios
$services = @(
    @{ Name = "usuarios-service";      Port = 8081; Path = "usuarios-service\usuarios-service";           Log = "usuarios.log" },
    @{ Name = "ofertas-service";       Port = 8082; Path = "ofertas-service\ofertas-service";             Log = "ofertas.log" },
    @{ Name = "postulaciones-service"; Port = 8083; Path = "postulaciones-service\postulaciones-service"; Log = "postulaciones.log" }
)

# 4. Verificar puertos ocupados
$hasConflict = $false
foreach ($svc in $services) {
    $conn = Get-NetTCPConnection -LocalPort $svc.Port -State Listen -ErrorAction SilentlyContinue
    if ($conn) {
        $pidNum = ($conn | Select-Object -ExpandProperty OwningProcess -Unique) -join ', '
        Write-Host "[ADVERTENCIA] Puerto $($svc.Port) ($($svc.Name)) ya en uso (PID $pidNum)." -ForegroundColor Yellow
        $hasConflict = $true
    }
}
if ($hasConflict) {
    Write-Host ""
    Write-Host "[!] Hay puertos ocupados. Ejecuta stop-all-services.bat primero." -ForegroundColor Yellow
    Write-Host ""
}

# 5. Por cada servicio: generar un .bat con rutas absolutas embebidas y ejecutarlo oculto
Write-Host "Iniciando servicios en segundo plano..." -ForegroundColor Green
Write-Host ""

$index = 1
foreach ($svc in $services) {
    $svcDir  = Join-Path $rootPath $svc.Path
    $logFile = Join-Path $logsDir  $svc.Log
    $mvnw    = Join-Path $svcDir   "mvnw.cmd"
    $batFile = Join-Path $scriptsDir "launcher-$($svc.Name).bat"

    # Encabezado inicial en el log
    $startTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "=== INICIO $($svc.Name) [$startTime] ===" | Out-File -FilePath $logFile -Encoding utf8

    Write-Host "[$index/3] Iniciando $($svc.Name) (puerto $($svc.Port))..." -ForegroundColor White
    Write-Host "      Log: logs\$($svc.Log)" -ForegroundColor DarkGray

    # Generar el .bat launcher con rutas absolutas (sin problemas de escapado)
    $batContent = "@echo off`r`n"
    $batContent += "set `"MAVEN_OPTS=$mavenOpts`"`r`n"
    if ($envSetLines) { $batContent += $envSetLines }
    $batContent += "cd /d `"$svcDir`"`r`n"
    $batContent += "`"$mvnw`" spring-boot:run "
    $batContent += "\"-Dspring-boot.run.jvmArguments=$jvmArgs\" "
    $batContent += ">> `"$logFile`" 2>&1`r`n"
    $batContent | Out-File -FilePath $batFile -Encoding ascii

    # Ejecutar el .bat como proceso completamente independiente (sin ventana)
    Start-Process -FilePath "cmd.exe" `
                  -ArgumentList "/c `"$batFile`"" `
                  -WindowStyle Hidden `
                  -WorkingDirectory $svcDir

    Start-Sleep -Seconds 1
    $index++
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  SERVICIOS LANZADOS - SIN VENTANAS - LOGS EN .\logs\       " -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  URLs (tardan ~30-60s en estar listos):" -ForegroundColor Cyan
Write-Host "  - usuarios-service:      http://localhost:8081" -ForegroundColor White
Write-Host "  - ofertas-service:       http://localhost:8082" -ForegroundColor White
Write-Host "  - postulaciones-service: http://localhost:8083" -ForegroundColor White
Write-Host ""
Write-Host "  Control:" -ForegroundColor Yellow
Write-Host "  - Estado:   status-services.bat" -ForegroundColor Gray
Write-Host "  - Detener:  stop-all-services.bat" -ForegroundColor Gray
Write-Host "  - Ver log:  Get-Content logs\usuarios.log -Wait -Tail 30" -ForegroundColor DarkGray
Write-Host ""
