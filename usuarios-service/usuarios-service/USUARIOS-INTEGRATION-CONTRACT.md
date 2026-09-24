# Contrato de Integración de `usuarios-service`

Este documento describe cómo los otros microservicios (`ofertas-service` y `postulaciones-service`) deben integrarse con `usuarios-service`.

## 1. Contrato JWT Definitivo
El token JWT firmado por `usuarios-service` utiliza **HMAC256** y contiene los siguientes claims:
- **`sub`**: Identificador único (UUID) del usuario (en formato String). **¡ATENCIÓN!** Ya no es el email.
- **`rol`**: Rol principal del usuario (ej. `EMPRESA`, `ESTUDIANTE`).

> **IMPORTANTE**: No existen los claims duplicados `id`, `userId`, `empresaId` ni `estudianteId`. Debido a la estrategia de herencia en base de datos (`JOINED`), la clave primaria de un Estudiante o una Empresa **es exactamente la misma** que su `UUID` en `UsuarioBase`. Para obtener el ID del usuario, simplemente se lee el claim `sub`.

## 2. Roles Definitivos
Los roles que viajarán en el token son:
- `ESTUDIANTE`
- `PROFESIONAL`
- `EMPRESA`
- `RECLUTADOR`
- `MODERADOR`
- `ADMINISTRADOR`

## 3. Endpoint de Usuario Autenticado (`/me`)
`usuarios-service` expone el siguiente endpoint seguro:
- **Endpoint**: `GET /api/auth/me`
- **Requiere**: Header `Authorization: Bearer <token>`
- **Retorna**: `UsuarioResponseDTO`

## 4. Validaciones requeridas por otros servicios (Autorización)

### Conversión de Rol a ROLE_xxx
En Spring Security, para que funcione `@PreAuthorize("hasRole('EMPRESA')")` o el chequeo `hasRole()`, los servicios consumidores (`ofertas-service`, `postulaciones-service`) DEBEN convertir el claim `rol` (ej. `EMPRESA`) añadiéndole el prefijo `ROLE_` para generar el `GrantedAuthority` correspondiente (`ROLE_EMPRESA`).
Si usan un `JwtAuthenticationConverter`, este debe configurarse para leer el claim `rol` y anteponer `ROLE_`.

### `ofertas-service`
- Debe extraer `sub` del JWT y usarlo como identificador (ID) de la Empresa que publica una oferta.
- Para publicar, debe verificar la autoridad `ROLE_EMPRESA`.

### `postulaciones-service`
- Debe extraer `sub` del JWT y usarlo como identificador (ID) del postulante.
- Para postularse, debe verificar la autoridad `ROLE_ESTUDIANTE` o `ROLE_PROFESIONAL`.

## 5. Incompatibilidades Pendientes
Los demás servicios (`ofertas-service` y `postulaciones-service`) actualmente pueden estar leyendo claims redundantes o intentando validar usuarios mediante llamadas directas o campos erróneos. Estos servicios deben actualizarse para leer únicamente `sub` (como UUID) y `rol` del JWT.
