@echo off
title Plataforma - Detener Servicios Backend
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\stop-services.ps1"
echo.
echo Presiona cualquier tecla para cerrar...
pause > nul
