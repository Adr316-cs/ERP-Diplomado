# Base de datos

## Motor

MongoDB con Mongoose.

## Reglas de diseño

- Los documentos empresariales deben incluir `companyId`.
- Cuando aplica, deben incluir `branchId`.
- Cada modelo debe conservar `createdBy` y timestamps.
- Se deben definir índices para búsquedas frecuentes.
- Se priorizarán referencias por ObjectId para mantener trazabilidad.

## Patrones actuales en el repositorio

- `companyId` en casi todos los modelos empresariales.
- validación de pertenencia por empresa antes de operaciones sensibles.
- transacciones para stock, ventas, compras y finanzas cuando corresponda.
- movimiento de inventario con historial.

## Reglas de transacción

Las operaciones de negocio críticas deben ejecutarse con transacciones MongoDB cuando afecten más de un documento.

Ejemplos:

- confirmar pedido / venta
- recibir orden de compra
- transferencias entre almacenes
- movimientos de inventario que cambien stock y bitácora

## Limitaciones actuales

- El entorno actual no tiene `MONGODB_URI` configurada.
- Por eso la API arranca en modo desarrollo sin conexión real.
- El comportamiento correcto en producción requiere MongoDB Atlas o un replica set.

## Recomendación inmediata

Antes de seguir con módulos más complejos, se debe validar a nivel de integración:

- conexión efectiva a MongoDB
- transacciones reales
- índices reales
- validación de multiempresa vs sucursal
