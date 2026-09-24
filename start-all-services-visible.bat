@echo off
echo ========================================
echo  Iniciando todos los servicios backend (Modo Ventanas Visibles)
echo ========================================
echo.

if exist .env (
    echo Cargando variables desde .env...
    for /f "usebackq tokens=1* delims==" %%a in (".env") do (
        if not "%%a"=="" set "%%a=%%b"
    )
    echo Variables cargadas correctamente.
    echo.
)

set MAVEN_OPTS=-Xmx384m -XX:+TieredCompilation -XX:TieredStopAtLevel=1
set BOOT_JVM_ARGS=-Dspring-boot.run.jvmArguments="-Xmx256m -Xms128m -XX:+TieredCompilation -XX:TieredStopAtLevel=1"

echo [1/3] Iniciando usuarios-service (8081)...
cd usuarios-service\usuarios-service
start "USUARIOS-SERVICE (8081)" cmd /k "mvnw.cmd spring-boot:run %BOOT_JVM_ARGS%"
cd ..\..

timeout /t 8 /nobreak > nul

echo [2/3] Iniciando ofertas-service (8082)...
cd ofertas-service\ofertas-service
start "OFERTAS-SERVICE (8082)" cmd /k "mvnw.cmd spring-boot:run %BOOT_JVM_ARGS%"
cd ..\..

timeout /t 8 /nobreak > nul

echo [3/3] Iniciando postulaciones-service (8083)...
cd postulaciones-service\postulaciones-service
start "POSTULACIONES-SERVICE (8083)" cmd /k "mvnw.cmd spring-boot:run %BOOT_JVM_ARGS%"
cd ..\..

echo.
echo ========================================
echo  Todos los servicios iniciados!
echo ========================================
echo.
echo Puertos:
echo - usuarios-service: http://localhost:8081
echo - ofertas-service: http://localhost:8082
echo - postulaciones-service: http://localhost:8083
echo.
echo Presiona cualquier tecla para cerrar...
pause > nul
