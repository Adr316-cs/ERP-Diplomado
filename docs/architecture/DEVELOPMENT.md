# Desarrollo

## Requisitos

- Node.js >= 20
- npm
- MongoDB Atlas o replica set para validación real

## Comandos

```bash
npm install
npm run typecheck
npm run build
npm run lint
npm test
```

## Ejecutar API

```bash
npm run dev --workspace=@erp/api
```

## Variables de entorno

Se recomienda definir:

```env
NODE_ENV=development
API_HOST=localhost
API_PORT=4000
CORS_ORIGIN=http://localhost:8081
MONGODB_URI=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
LOG_LEVEL=info
```

## Estado actual

El backend ya es funcional en desarrollo sin MongoDB. El siguiente paso es reforzar la base técnica de Fase 1 y continuar con la reconciliación del proyecto antes de avanzar con más dominio empresarial.
