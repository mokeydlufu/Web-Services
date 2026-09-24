Start-Process -FilePath "cmd.exe" -ArgumentList '/c "D:\proyecto final de base de datos\proyecto-final\scripts\run-ofertas-jar.bat"' -WindowStyle Hidden
Write-Host "Lanzado. Esperando 40s..."
Start-Sleep -Seconds 40
$c = Get-NetTCPConnection -LocalPort 8082 -State Listen -ErrorAction SilentlyContinue
if ($c) {
    Write-Host "[OK] Puerto 8082 ACTIVO. PID=$($c.OwningProcess)"
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:8082/api/ofertas/publicas" -UseBasicParsing -TimeoutSec 5
        Write-Host "[OK] /api/ofertas/publicas -> HTTP $($r.StatusCode)"
    } catch {
        Write-Host "[INFO] Endpoint respondio con error: $($_.Exception.Message)"
    }
} else {
    Write-Host "[ERROR] Puerto 8082 no responde."
    Get-Content "D:\proyecto final de base de datos\proyecto-final\logs\ofertas.log" -Tail 20
}
