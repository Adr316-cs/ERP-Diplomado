# Desarrollo

## Requisitos y workspaces

El `package.json` raíz declara Node `>=20.12.0` y npm workspaces para `apps/*` y `packages/*`. Node 20.12+ proporciona `process.loadEnvFile`, usado para cargar `.env` al ejecutar la API local. En Windows PowerShell, utiliza `npm.cmd`.

## Variables de entorno

La API valida variables con Zod. En desarrollo carga `.env` desde la raíz del repositorio si el archivo existe; las variables definidas por el entorno del proceso tienen prioridad. `.env.example` solo es plantilla, sin secretos. En test no se carga `.env` para evitar contaminar pruebas.

Variables principales: `NODE_ENV`, `API_PORT`, `API_HOST`, `CORS_ORIGIN`, `LOG_LEVEL`, `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRES_IN` y `JWT_REFRESH_EXPIRES_IN`.

## Comandos

- `npm.cmd install`
- `npm.cmd run dev --workspace=@erp/api`
- `npm.cmd run typecheck`
- `npm.cmd run lint`
- `npm.cmd run build`
- `npm.cmd test`

Los comandos de calidad deben ejecutarse desde la raíz. No declarar una fase validada hasta registrar resultados reales.

## UI compartida

`packages/ui` contiene componentes React Native compartidos por web y móvil. Las aplicaciones consumen el mismo `Layout`, navegación, estados, formularios, controles y tabla. La biblioteca evita implementar reglas de negocio en los clientes; servicios y autorizaciones pertenecen a la API.

## Flujo de cambios

Inspeccionar implementación y pruebas antes de modificar módulos; mantener cambios acotados; ejecutar validaciones de la fase; actualizar README y documentos relacionados. Trabajar en rama de función cuando Git esté disponible y confirmar estado de rama antes de cambios.
