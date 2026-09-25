# Compras

Todas las rutas requieren Bearer JWT y contexto de `companyId`; el `branchId` de una solicitud debe corresponder al almacén seleccionado.

## Flujo

1. `POST /api/v1/companies/:companyId/purchases/requests` crea una solicitud con motivo, sucursal, almacén y productos/cantidades.
2. La solicitud avanza con `POST /requests/:id/submit`, `POST /requests/:id/request-approval` y `POST /requests/:id/approve`. Un aprobador distinto al creador debe autorizarla. También puede rechazarse con `{ "reason": "..." }` o cancelarse antes de aprobar.
3. `POST /purchases/quotations` registra una propuesta de proveedor para una solicitud aprobada. Las líneas y cantidades deben coincidir exactamente; cada proveedor solo puede cotizar una vez por solicitud. Las cotizaciones tienen vigencia opcional.
4. `POST /purchases/quotations/:quotationId/select` selecciona una cotización, marca las otras como rechazadas, convierte la solicitud y genera la orden `DRAFT` dentro de una transacción.
5. La orden recorre `DRAFT -> SUBMITTED -> PENDING_APPROVAL -> APPROVED`; un aprobador distinto del creador debe autorizarla. Puede rechazarse con motivo o cancelarse antes de aprobar.
6. `POST /orders/:id/receive` recibe la orden dentro de una transacción: actualiza existencias, registra movimientos, crea una cuenta por pagar y cambia la orden a `RECEIVED`.
7. `GET /api/v1/companies/:companyId/finance/accounts-payable` lista saldos. `POST /finance/payments` con `type: SUPPLIER`, `purchaseOrderId`, `amount` y `accountId` registra pagos parciales o liquida el saldo. El pago no puede exceder el pendiente.

Los precios de cotización aplican el impuesto activo configurado en el producto y conservan subtotal, impuesto y total con redondeo monetario. La API no permite crear órdenes directamente: deben provenir de una cotización seleccionada.

## Validación y límites

Typecheck, lint, build y pruebas unitarias pasan. Las pruebas cubren esquemas, estados, rutas protegidas, cálculo de impuestos y modelo/índice de cuentas por pagar. Aún falta ejecutar la selección de cotización, recepción y pago en MongoDB replica set; las transacciones no se verifican con una base deshabilitada o standalone.

## Actualización de validación — 2026-09-24

La prueba `purchases.integration.test.ts` ya valida solicitud, cotización, orden, aprobación, recepción, movimientos, CxP y pagos parciales en MongoDB replica set efímero. También confirma que cada pago genera el movimiento financiero asociado. En la última suite del monorepo, typecheck, lint, build y 63 pruebas pasaron. Atlas en vivo no se ha probado.
