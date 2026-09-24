@echo off
set "APISPERU_TOKEN=adfdc4c3c78621141079079b2e5deb05"
set "APISPERU_DNI_URL=https://peruapi.com/api/dni"
set "APISPERU_RUC_URL=https://peruapi.com/api/ruc"
java -Xmx256m -Xms128m -jar "D:\proyecto final de base de datos\proyecto-final\usuarios-service\usuarios-service\target\usuarios-service-0.0.1-SNAPSHOT.jar" >> "D:\proyecto final de base de datos\proyecto-final\logs\usuarios.log" 2>&1
