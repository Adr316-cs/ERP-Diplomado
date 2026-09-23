# ERP Empresarial Modular

Proyecto ERP multiempresa basado en una arquitectura modular por dominios.

## Estado

Fase 10: CRM, proyectos y Help Desk.

La evaluación inicial está documentada en
[`docs/architecture/ARCHITECTURE-ASSESSMENT.md`](docs/architecture/ARCHITECTURE-ASSESSMENT.md).

La API dispone de endpoints de liveness (`/api/v1/health`) y readiness
(`/api/v1/health/ready`), además de rutas base de autenticación bajo
`/api/v1/auth`.

También dispone de endpoints protegidos bajo `/api/v1/companies` para empresas
y sucursales.

## Comandos

Usa `npm.cmd` en PowerShell si la política local bloquea `npm.ps1`:

```text
npm.cmd install
npm.cmd run typecheck
npm.cmd run build
npm.cmd run lint
npm.cmd test
```

## Estructura inicial

- `apps/api`: API REST inicial con Express y TypeScript.
- `apps/web`: entrada inicial React Native Web.
- `apps/mobile`: entrada inicial React Native.
- `packages/types`: contratos de respuesta compartidos.

El workspace contiene dependencias instaladas y lockfile; todavía no contiene módulos funcionales del ERP.

La comunicación con MongoDB Atlas ocurrirá exclusivamente desde `apps/api`.

La conexión MongoDB está preparada mediante Mongoose: es opcional en desarrollo
y test, pero obligatoria en producción mediante `MONGODB_URI`.

La autenticación usa bcrypt, access tokens y refresh tokens JWT. El backend
valida Bearer tokens, usuarios activos, `tokenVersion` y permisos derivados de
roles. El registro y login requieren una conexión MongoDB activa.

Las operaciones empresariales verifican membresía, propiedad cuando corresponde
y formatos de identificadores antes de consultar datos.

El catálogo y CRM inicial están disponibles bajo rutas anidadas por empresa:
`/customers`, `/suppliers`, `/categories` y `/products`.

Inventario está disponible bajo `/warehouses` e `/inventory`, con movimientos
`IN`, `OUT`, `ADJUSTMENT` y `TRANSFER`.

Los movimientos actualizan saldos y generan un registro auditable dentro de una
transacción MongoDB. Las salidas y transferencias no permiten stock negativo.

Ventas está disponible bajo `/sales/quotes` y `/sales/orders`. Confirmar un
pedido descuenta inventario y crea la venta y el movimiento de salida en una
misma transacción.

Compras está disponible bajo `/purchases/orders`. Una orden pasa por `DRAFT`,
`APPROVED` y `RECEIVED`; la recepción incrementa inventario y registra un
movimiento `IN` en una transacción.

Finanzas está disponible bajo `/finance`, con cuentas, ingresos, egresos y pagos
vinculados a ventas u órdenes de compra. No se implementa contabilidad fiscal
compleja en esta fase.

CRM, proyectos y Help Desk están disponibles bajo `/crm`, `/projects` y
`/helpdesk`, siempre protegidos por autenticación y contexto de empresa.
