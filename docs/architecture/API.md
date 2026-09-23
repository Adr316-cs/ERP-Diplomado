# API

## Base

La API se publica bajo ` /api/v1 `.

## Endpoints base

- `GET /api/v1/health`
- `GET /api/v1/health/ready`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

## Response contract

```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully"
}
```

## Error contract

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Resource not found"
  }
}
```

## Multitenancy

Todas las rutas de dominio empiezan desde:

```text
/api/v1/companies/:companyId/...
```

Esto permite aislar cada recurso por empresa.

## Recomendación inmediata

Antes de más fases de negocio, se debe completar:

- contratos OpenAPI o Swagger
- documentación endpoint por dominio
- estándares de permisos por módulo
- pruebas de integración por tenant
