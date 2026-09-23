# Arquitectura del ERP

## Estado real del repositorio

El repositorio actual ya contiene una base funcional de backend y una estructura modular de dominio. No es un proyecto vacío ni una red desde cero. La fuente de verdad del estado real es el código en `apps/api/src` y los workspaces del monorepo.

## Principios

- Monorepo con npm workspaces.
- API REST versionada bajo `/api/v1`.
- Dominio modular por carpeta.
- Multitenancy por `companyId`.
- Sucursales por `branchId` cuando corresponda.
- Seguridad en backend antes de cualquier operación crítico.
- Validación con Zod.
- Transacciones MongoDB para operaciones críticas.
- Documentación técnica y de dominio actualizada con cada fase.

## Estructura actual

```text
apps/
  api/
  web/
  mobile/
packages/
  types/
docs/
  architecture/
```

## Backend actual

La API se compone por dominios bajo `apps/api/src/modules`:

- auth
- companies
- branches
- customers
- suppliers
- products
- categories
- inventory
- warehouses
- purchases
- sales
- finance
- crm
- projects
- helpdesk
- hr
- reports
- notifications
- audit

Cada dominio mantiene un patrón coherente basado en:

- model
- validation
- service
- routes
- repository cuando aplica

## Frontend objetivo para Fase 1

El web y mobile deben mantenerse como base operacional mínima. La lógica crítica no debe ir al cliente; solo se debe mover la UI y la gestión de sesión.

Deben existir, al menos:

- Layout
- Header
- Sidebar
- Navigation
- Dashboard shell
- Loading
- ErrorState
- EmptyState
- Button
- Input
- Modal
- Table
- Form
- Notification

## Seguridad

- JWT access/refresh tokens.
- bcrypt para contraseñas.
- validación de membresías por empresa.
- middleware de acceso por compañía.
- controles por permisos.
- no acceso directo a MongoDB desde clientes.

## Dependencias clave

- Express
- TypeScript
- Mongoose
- Zod
- bcryptjs
- jose
- helmet
- cors
- express-rate-limit
- pino
- react / react-native / react-native-web

## Estado de la fase actual

La base ya está desarrollada en backend y compila. La Fase 0 debe centrarse en documentar el estado real y reforzar la fundación antes de continuar con nuevas capas funcionales.
