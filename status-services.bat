@echo off
title Plataforma - Estado de Servicios Backend
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\status-services.ps1"
echo Presiona cualquier tecla para cerrar...
pause > nul
