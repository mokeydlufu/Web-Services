@echo off
set "MAVEN_OPTS=-Xmx384m -XX:+TieredCompilation -XX:TieredStopAtLevel=1"
if exist "%~dp0..\.env" (
    for /f "usebackq tokens=1* delims==" %%a in ("%~dp0..\.env") do (
        if not "%%a"=="" set "%%a=%%b"
    )
)
cd /d "%~dp0..\usuarios-service\usuarios-service"
call mvnw.cmd spring-boot:run -Dspring-boot.run.jvmArguments="-Xmx256m -Xms128m -XX:+TieredCompilation -XX:TieredStopAtLevel=1" >> "%~dp0..\logs\usuarios.log" 2>&1
