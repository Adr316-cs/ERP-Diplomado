# Ventas

Las rutas viven bajo `/api/v1/companies/:companyId/sales` y requieren Bearer JWT, permisos del rol y contexto empresarial. Las operaciones que cambian cotizaciones, pedidos y facturas se limitan a las sucursales autorizadas para la membresía.

## Flujo

1. `POST /quotes` crea una cotización con precios tomados del catálogo (`salePrice` o `unitPrice`). El precio enviado por el cliente no se usa para fijar el importe.
2. `POST /quotes/:id/send` cambia `DRAFT` a `SENT`; después `POST /quotes/:id/accept` o `/reject` resuelve la cotización.
3. `POST /orders` acepta `quoteId` y `warehouseId`. Solo convierte cotizaciones aceptadas, y el almacén debe pertenecer a la sucursal cotizada. El índice único impide generar dos pedidos desde la misma cotización.
4. El pedido sigue `DRAFT -> SUBMITTED -> PENDING_APPROVAL -> APPROVED -> PREPARING -> READY_FOR_DELIVERY -> DELIVERED`. Aprobación y rechazo requieren `sales.approve`; quien creó el pedido no puede aprobarlo.
5. `POST /orders/:id/deliver` registra, en una transacción, la salida de inventario, el movimiento `OUT`, la venta/factura y la cuenta por cobrar. Si falta stock, la operación completa se revierte.
6. `GET /invoices` lista las ventas dentro del ámbito de sucursal. `GET` de finanzas en `/accounts-receivable` lista saldos; `/finance/payments` registra cobros parciales o totales y rechaza importes que excedan el pendiente.

Los importes conservan subtotal, impuesto y total con redondeo a centavos. Se usa la tasa activa enlazada al producto, tanto para impuestos incluidos como añadidos al precio.

## Validación

La prueba de integración con MongoDB replica set cubre el flujo completo, la separación de aprobador, límites de sucursal, reversión ante stock insuficiente, salida de inventario, factura y cobros parciales. En la última ejecución del monorepo, typecheck, lint, build y las 63 pruebas pasaron. Atlas en vivo sigue pendiente de validar con la URI de despliegue.
