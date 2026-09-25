# API

## Base

Las rutas observadas usan `/api/v1`. Éxitos: `{ success: true, data, message }`; errores actuales: `{ success: false, message, code }` y, para validación, `details`. Esto difiere del objeto anidado `error` del ejemplo maestro; cualquier migración debe ser compatible y documentada.

## Rutas

- `GET /api/v1/health` y `GET /api/v1/health/ready`
- `/api/v1/auth`: register, login, refresh, logout y me
- `/api/v1/companies`: empresas y sucursales
- Bajo `/api/v1/companies/:companyId`: customers, suppliers, categories, products, warehouses, inventory, sales, purchases, finance, CRM, projects, helpdesk, HR, audit, notifications y reports

Consultar los routers como fuente definitiva de métodos, payloads y permisos. Las operaciones de autenticación públicas son register, login y refresh; logout/me requieren access token. Las rutas empresariales requieren autenticación, pertenencia a empresa y el permiso de la operación, o propiedad de esa empresa.

Los contratos operativos documentados para [Ventas](../api/sales.md) y [Finanzas](../api/finance.md) incluyen transiciones, permisos, vínculos de pago y validaciones de saldos.

## Autorización

Los permisos usan `resource.action` (por ejemplo `sales.read`, `sales.create`, `sales.approve`, `inventory.adjust`, `inventory.transfer`). El seed inicial define los roles ERP documentados en `SECURITY.md`; el registro asigna `EMPLOYEE` sin aceptar roles del request. El propietario solo obtiene bypass de permisos dentro de su propio `companyId`.

## Errores y validación

Zod produce 422, JSON malformado produce 400 y rutas inexistentes 404. Errores HTTP tienen códigos estables; los errores inesperados se registran y responden sin stack trace. Los servicios deben comprobar empresa/sucursal de los recursos relacionados además del formato de entrada.

## Estado documental

Contratos operativos: [Ventas](../api/sales.md), [Finanzas](../api/finance.md), [Proyectos](../api/projects.md) y [Help Desk](../api/helpdesk.md).
Recursos Humanos: [HR](../api/hr.md).

Este inventario no es OpenAPI ni garantiza cobertura completa. Documentar cada payload, estado, permiso y respuesta al extender un módulo.
