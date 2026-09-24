@echo off
set "JOOBLE_API_KEY=03ea94dd-384a-4509-bab8-208bba450403"
set "APISPERU_TOKEN=adfdc4c3c78621141079079b2e5deb05"
java -Xmx256m -Xms128m -jar "D:\proyecto final de base de datos\proyecto-final\ofertas-service\ofertas-service\target\ofertas-service-0.0.1-SNAPSHOT.jar" >> "D:\proyecto final de base de datos\proyecto-final\logs\ofertas.log" 2>&1
