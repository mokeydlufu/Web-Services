# Contrato de Integración (Integration Contract)

Este documento define las expectativas y contratos necesarios que `postulaciones-service` requiere de los otros microservicios (`usuarios-service` y `ofertas-service`). **IMPORTANTE:** `postulaciones-service` NO modificará directamente la base de datos de estos servicios, sino que dependerá de estas APIs.

---

## 1. USUARIOS-SERVICE

Este servicio es la única fuente de verdad para la identidad, roles y perfiles básicos de los usuarios.

### 1.1 Obtener Resumen de Candidato
- **Endpoint Esperado:** `GET /api/usuarios/internos/{uuid}/resumen`
- **Descripción:** Obtiene los datos básicos necesarios de un candidato para mostrar en una postulación.
- **Request:** Ninguno (se envía el UUID por path).
- **Headers:** `Authorization: Bearer <JWT_TOKEN>` (token de servicio a servicio o propagado).
- **Response Exitosa (200 OK):**
  ```json
  {
    "uuid": "123e4567-e89b-12d3-a456-426614174000",
    "nombreCompleto": "Juan Pérez",
    "email": "juan@example.com",
    "tituloProfesional": "Ingeniero de Software",
    "fotoPerfil": "https://url.foto"
  }
  ```
- **Errores Posibles:** `404 Not Found` (Candidato no existe), `401 Unauthorized`.
- **Timeout Requerido:** Máximo 2000ms.

---

## 2. OFERTAS-SERVICE

Este servicio es la única fuente de verdad para las ofertas de trabajo, su estado de apertura y a qué empresa pertenecen.

### 2.1 Validar Existencia y Estado de Oferta
- **Endpoint Esperado:** `GET /api/ofertas/internos/{uuid}/validacion`
- **Descripción:** Valida si una oferta existe, a qué empresa pertenece, y si actualmente acepta postulaciones.
- **Request:** Ninguno (UUID en path).
- **Headers:** `Authorization: Bearer <JWT_TOKEN>`
- **Response Exitosa (200 OK):**
  ```json
  {
    "ofertaId": "987e6543-e21b-12d3-a456-426614174111",
    "empresaId": "555e4567-e89b-12d3-a456-426614174222",
    "titulo": "Desarrollador Backend Senior",
    "estado": "ACTIVA",
    "aceptaPostulaciones": true,
    "fechaCierre": "2026-12-31T23:59:59Z"
  }
  ```
- **Errores Posibles:** `404 Not Found` (Oferta no existe).
- **Timeout Requerido:** Máximo 2000ms.

---

## Estado Actual
*(Este documento se actualizará si se detecta que los endpoints requeridos aún no existen en los otros repositorios).*
