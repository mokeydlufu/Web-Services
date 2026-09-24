# Contrato de Integración: ofertas-service

Este documento especifica el contrato de API REST expuesto por `ofertas-service` para uso exclusivo de integración con otros microservicios (especialmente `postulaciones-service`).

## 1. Obtener Estado de Oferta para Postulación

Este endpoint está diseñado para que `postulaciones-service` pueda validar rápidamente si una oferta puede recibir postulaciones antes de guardar la postulación en la base de datos.

### Request

- **URL:** `/api/ofertas/{id}/estado-postulacion`
- **Method:** `GET`
- **Auth:** No requiere token (Endpoint interno/abierto para lectura simple de estado o protegido según configuración de Gateway, actualmente abierto a GET para microservicios). *Nota: Considerar asegurar este endpoint con mTLS o JWT Client Credentials en el futuro.*

### Response (200 OK)

Devuelve únicamente los datos estrictamente necesarios para validar la posibilidad de postulación.

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "empresaId": "789e4567-e89b-12d3-a456-426614174001",
  "estado": "PUBLICADA",
  "aceptaPostulaciones": true,
  "fechaVencimiento": "2026-12-31T23:59:59Z"
}
```

### Reglas de Negocio en postulaciones-service:
- Una postulación solo puede ser creada si:
  1. El HTTP Status es 200 OK.
  2. `estado` == "PUBLICADA".
  3. `aceptaPostulaciones` == true.
  4. `fechaVencimiento` es mayor a la fecha y hora actual (OffsetDateTime.now()).

### Errores Posibles

- **404 Not Found:**
```json
{
  "timestamp": "2026-08-17T12:00:00Z",
  "status": 404,
  "error": "NOT_FOUND",
  "message": "Oferta no encontrada",
  "traceId": "trace-uuid"
}
```
