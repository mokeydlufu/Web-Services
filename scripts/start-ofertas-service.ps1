# ============================================================
# Script: Iniciar y verificar ofertas-service (Puerto 8082)
# - Verifica si el puerto ya esta ocupado
# - Inicia como proceso completamente independiente
# - Espera hasta que el endpoint responda HTTP 200
# - Registra el resultado en logs/ofertas.log
# ============================================================

$rootPath  = (Resolve-Path "$PSScriptRoot\..").Path
$svcDir    = Join-Path $rootPath "ofertas-service\ofertas-service"
$mvnw      = Join-Path $svcDir "mvnw.cmd"
$logFile   = Join-Path $rootPath "logs\ofertas.log"
$pidFile   = Join-Path $rootPath "logs\ofertas.pid"
$logsDir   = Join-Path $rootPath "logs"
$endpoint  = "http://localhost:8082/api/ofertas/publicas?ubicacion=Peru"

if (-not (Test-Path $logsDir)) { New-Item -ItemType Directory -Path $logsDir -Force | Out-Null }

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Iniciando ofertas-service (Puerto 8082)                   " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# 1. Cargar variables de entorno desde .env
$envFile = Join-Path $rootPath ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
            $parts = $line.Split("=", 2)
            $k = $parts[0].Trim()
            $v = $parts[1].Trim().Trim('"').Trim("'")
            [System.Environment]::SetEnvironmentVariable($k, $v, "Process")
        }
    }
    Write-Host "[OK]  Variables desde .env cargadas." -ForegroundColor DarkGray
}

# 2. Verificar si el puerto 8082 ya esta ocupado
$conexion = Get-NetTCPConnection -LocalPort 8082 -State Listen -ErrorAction SilentlyContinue
if ($conexion) {
    $pid8082 = ($conexion | Select-Object -ExpandProperty OwningProcess -Unique) -join ", "
    Write-Host ""
    Write-Host "[INFO] Puerto 8082 ya en uso (PID $pid8082)." -ForegroundColor Yellow
    Write-Host "       Si el servicio ya esta corriendo, no es necesario reiniciarlo." -ForegroundColor Yellow

    # Verificar si responde correctamente
    try {
        $res = Invoke-WebRequest -Uri $endpoint -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        Write-Host "[OK]  ofertas-service ya esta ACTIVO y respondio HTTP $($res.StatusCode)." -ForegroundColor Green
        Write-Host "      Endpoint: $endpoint" -ForegroundColor DarkGray
    } catch {
        Write-Host "[WARN] El puerto esta ocupado pero el endpoint no responde. Considera reiniciar." -ForegroundColor Red
    }
    Write-Host ""
    exit 0
}

# 3. Generar un .bat temporal con rutas absolutas para lanzar sin ventana
$mavenOpts = "-Xmx384m -XX:+TieredCompilation -XX:TieredStopAtLevel=1"
$jvmArgs   = "-Xmx256m -Xms128m -XX:+TieredCompilation -XX:TieredStopAtLevel=1"

$envSetLines = ""
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
            $parts = $line.Split("=", 2)
            $k = $parts[0].Trim()
            $v = $parts[1].Trim().Trim('"').Trim("'")
            $envSetLines += "set `"$k=$v`"`r`n"
        }
    }
}

# Encabezado en el log
$now = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"
"=== INICIO ofertas-service [$now] (java -jar) ===" | Out-File -FilePath $logFile -Append -Encoding utf8

Write-Host "[1/3] Lanzando ofertas-service con java -jar..." -ForegroundColor White

# Lanzar java -jar directamente como proceso independiente (Java es el proceso raiz,
# no depende del cmd padre — no muere cuando el lanzador termina)
$jvmArgsList = @("-Xmx256m", "-Xms128m", "-XX:+TieredCompilation", "-XX:TieredStopAtLevel=1", "-jar", "`"$jarFile`"")

# Construir bat temporal para redirigir stdout/stderr al log correctamente
$launcherBat = Join-Path $PSScriptRoot "launcher-ofertas-service-run.bat"
$batContent  = "@echo off`r`n"
if ($envSetLines) { $batContent += $envSetLines }
$batContent += "java -Xmx256m -Xms128m -XX:+TieredCompilation -XX:TieredStopAtLevel=1"
$batContent += " -jar `"$jarFile`""
$batContent += " >> `"$logFile`" 2>&1`r`n"
$batContent | Out-File -FilePath $launcherBat -Encoding ascii

$proc = Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/c `"$launcherBat`"" `
    -WindowStyle Hidden `
    -WorkingDirectory $svcDir `
    -PassThru

Write-Host "      PID del proceso lanzador: $($proc.Id)" -ForegroundColor DarkGray
Write-Host "      Log: logs\ofertas.log" -ForegroundColor DarkGray

# 4. Esperar hasta 90 segundos a que el endpoint responda HTTP 200
Write-Host ""
Write-Host "[2/3] Esperando que el servicio levante (hasta 90s)..." -ForegroundColor White
$maxIntentos = 30
$intento = 0
$activo = $false

while ($intento -lt $maxIntentos) {
    Start-Sleep -Seconds 3
    $intento++
    Write-Host "      Intento $intento/$maxIntentos..." -ForegroundColor DarkGray -NoNewline

    try {
        $res = Invoke-WebRequest -Uri $endpoint -UseBasicParsing -TimeoutSec 4 -ErrorAction Stop
        if ($res.StatusCode -eq 200) {
            $activo = $true
            Write-Host " HTTP 200 OK" -ForegroundColor Green
            break
        }
        Write-Host " HTTP $($res.StatusCode)" -ForegroundColor Yellow
    } catch {
        $status = $_.Exception.Response.StatusCode.value__
        if ($status) {
            Write-Host " HTTP $status" -ForegroundColor Yellow
        } else {
            Write-Host " sin respuesta aun" -ForegroundColor DarkGray
        }
    }
}

Write-Host ""

# 5. Reportar resultado
if ($activo) {
    # Guardar PID real del proceso Java en puerto 8082
    $conn8082 = Get-NetTCPConnection -LocalPort 8082 -State Listen -ErrorAction SilentlyContinue
    if ($conn8082) {
        $javaPid = ($conn8082 | Select-Object -ExpandProperty OwningProcess -Unique) -join ""
        $javaPid | Out-File -FilePath $pidFile -Encoding ascii
    }

    "[$(Get-Date -Format 'yyyy-MM-ddTHH:mm:ss')] ofertas-service ACTIVO. HTTP 200 en $endpoint" | Out-File -FilePath $logFile -Append -Encoding utf8

    Write-Host "============================================================" -ForegroundColor Green
    Write-Host "  [OK] ofertas-service ACTIVO en http://localhost:8082       " -ForegroundColor Green
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host ""

    # Test final: Test-NetConnection
    Write-Host "[3/3] Verificacion de conectividad:" -ForegroundColor Cyan
    $tcpTest = Test-NetConnection -ComputerName localhost -Port 8082 -WarningAction SilentlyContinue
    if ($tcpTest.TcpTestSucceeded) {
        Write-Host "  Test-NetConnection localhost -Port 8082 : TcpTestSucceeded = True" -ForegroundColor Green
    } else {
        Write-Host "  Test-NetConnection localhost -Port 8082 : TcpTestSucceeded = False" -ForegroundColor Red
    }
    Write-Host ""
} else {
    "[$(Get-Date -Format 'yyyy-MM-ddTHH:mm:ss')] ERROR: ofertas-service no respondio en 90 segundos." | Out-File -FilePath $logFile -Append -Encoding utf8
    Write-Host "============================================================" -ForegroundColor Red
    Write-Host "  [ERROR] ofertas-service NO respondio en 90 segundos.       " -ForegroundColor Red
    Write-Host "  Revisa el log completo en: logs\ofertas.log                " -ForegroundColor Yellow
    Write-Host "============================================================" -ForegroundColor Red
    Write-Host ""
}
