@echo off
title Plataforma - Iniciando Backend en Segundo Plano
echo ============================================================
echo   Iniciando microservicios Backend en SEGUNDO PLANO
echo ============================================================
echo.

if not exist logs mkdir logs

echo [1/3] Preparando usuarios-service (8081)...
echo [2/3] Preparando ofertas-service (8082)...
echo [3/3] Preparando postulaciones-service (8083)...
echo.
wscript.exe "%~dp0scripts\run-hidden.vbs"

echo.
echo ============================================================
echo   SERVICIOS ENVIADOS A SEGUNDO PLANO - SIN VENTANAS EXTRA
echo ============================================================
echo.
echo   URLs (estaran listos en ~15-30 segundos):
echo   - usuarios-service:      http://localhost:8081
echo   - ofertas-service:       http://localhost:8082
echo   - postulaciones-service: http://localhost:8083
echo.
echo   Herramientas de control:
echo   - Para ver estado:  ejecuta status-services.bat
echo   - Para detener:     ejecuta stop-all-services.bat
echo   - Para ver logs:    carpeta .\logs\
echo.
echo Esta ventana se cerrara automaticamente...
ping 127.0.0.1 -n 5 > nul
