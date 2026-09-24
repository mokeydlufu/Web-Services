@echo off
set "MAVEN_OPTS=-Xmx384m -XX:+TieredCompilation -XX:TieredStopAtLevel=1"

:: Cargar variables de entorno desde .env
if exist "%~dp0..\.env" (
    for /f "usebackq tokens=1* delims==" %%a in ("%~dp0..\.env") do (
        if not "%%a"=="" set "%%a=%%b"
    )
)

:: Comprobar si el puerto 8082 ya esta ocupado
for /f "tokens=5" %%p in ('netstat -ano 2^>nul ^| findstr /R ":8082.*LISTENING"') do (
    exit /b 0
)

cd /d "%~dp0..\ofertas-service\ofertas-service"
call mvnw.cmd spring-boot:run -Dspring-boot.run.jvmArguments="-Xmx256m -Xms128m -XX:+TieredCompilation -XX:TieredStopAtLevel=1" >> "%~dp0..\logs\ofertas.log" 2>&1
