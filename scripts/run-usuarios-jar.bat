@echo off
set "APISPERU_TOKEN=sk_19762.Hy3Zw5B6GCkZh4ouX6ppElumGMTYlFS8"
set "APISPERU_DNI_URL=https://api.apis.net.pe/v1/dni"
set "APISPERU_RUC_URL=https://api.apis.net.pe/v1/ruc"
java -Xmx256m -Xms128m -jar "D:\proyecto final de base de datos\proyecto-final\usuarios-service\usuarios-service\target\usuarios-service-0.0.1-SNAPSHOT.jar" >> "D:\proyecto final de base de datos\proyecto-final\logs\usuarios.log" 2>&1
