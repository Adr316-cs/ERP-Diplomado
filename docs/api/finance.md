# Finanzas

Las rutas base son `/api/v1/companies/:companyId/finance`. Todas requieren autenticación, membresía de empresa y permiso `finance.read`, `finance.create` o `finance.pay`, según la operación.

## Recursos

- `POST/GET /accounts`: crea y lista cuentas `CASH`, `BANK`, `RECEIVABLE`, `PAYABLE` y `OTHER`, con moneda y saldo.
- `POST /transactions` y `GET /transactions`: registra y consulta ingresos/egresos. Las referencias opcionales a ventas deben ser ingresos de ventas completadas; las referencias a compras deben ser egresos de órdenes recibidas. No se aceptan ambos vínculos en un mismo movimiento.
- `POST /payments` y `GET /payments`: registra y consulta cobros a clientes y pagos a proveedores. Cada pago actualiza el saldo de cuenta y CxC/CxP, crea un movimiento financiero vinculado y queda en una transacción MongoDB. No se permite rebasar el saldo pendiente.
- `GET /accounts-receivable` y `GET /accounts-payable`: muestra saldos abiertos, parciales y liquidados, ligados a facturas de venta y órdenes de compra.
- `POST/GET /budgets`: registra presupuestos de ingreso o gasto con código único por empresa y fecha inicial. La consulta agrega los movimientos del periodo y devuelve `actualAmount` y `remainingAmount`.

## Presupuestos

El cuerpo de `POST /budgets` contiene `code`, `name`, `type` (`INCOME` o `EXPENSE`), `periodStart`, `periodEnd` y `amount`. Las fechas son inclusivas por día; el fin debe ser posterior al inicio. Los importes ejecutados se calculan desde movimientos financieros, incluidos los movimientos creados automáticamente por pagos.

## Integración y validación

La recepción de compra crea CxP. La entrega de venta crea factura y CxC. El pago parcial ajusta CxP/CxC, saldo de cuenta, `Payment` y `FinanceTransaction` en una misma transacción. No se implementa contabilidad fiscal mexicana avanzada.

La prueba de finanzas replica-set verifica saldos de cuenta y ejecución presupuestaria; las pruebas de compras/ventas verifican la relación automática de los pagos con movimientos financieros. Última suite del monorepo: typecheck, lint, build y 63 pruebas pasaron, incluidas las pruebas replica set.
