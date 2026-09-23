# Seguridad

## Capas implementadas

- Helmet.
- CORS explícito.
- rate limiting.
- validación con Zod.
- manejo centralizado de errores.
- hashing con bcrypt.
- JWT con access y refresh token.
- validación de usuario activo.
- aislamiento por empresa.
- control por permisos del usuario.

## Reglas críticas

- Ningún cliente debe conectarse directamente a MongoDB.
- Toda autorización debe validarse en backend.
- Todas las rutas sensibles deben verificar:
  - autenticación
  - usuario activo
  - pertenencia a la empresa
  - permisos apropiados
  - propiedad del recurso cuando aplica

## Riesgos actuales

- falta de integración completa con MongoDB real
- permisos granulares no están aplicados a todas las rutas
- estrategia de refresh tokens aún necesita revisión de revocación y rotación
- auditoría automática no se dispara de forma universal en todas las operaciones críticas

## Recomendación inmediata

La fase 1 debe reforzar:

- entorno con secretos reales
- validación de JWT de producción
- log y monitoreo
- cierre elegante del servidor
- revisión de rutas sensibles por permisos
