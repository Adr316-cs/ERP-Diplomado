# Catálogos: API y estado de implementación

## Listados existentes

Los listados de clientes, proveedores, productos, categorías y almacenes aceptan:

| Parámetro | Tipo | Predeterminado | Límite |
|---|---|---:|---:|
| `q` | texto literal | sin búsqueda | 100 caracteres |
| `page` | entero | 1 | 1–1,000,000 |
| `pageSize` | entero | 25 | 1–100 |
| `sortBy` | texto allowlisted | `name` | depende del recurso |
| `order` | `asc` / `desc` | `asc` | — |
| `status` | `active` / `inactive` / `all` | `active` | — |

La respuesta conserva `data` como arreglo y añade `meta` con `page`, `pageSize`, `total` y `totalPages`. Todos los listados fuerzan el `companyId` de la ruta. Clientes, proveedores, productos y almacenes respetan el contexto de sucursal cuando aplica; categorías son compartidas dentro de la empresa.

## Catálogos maestros

Base: `/api/v1/companies/:companyId/master-data`

| Recurso | Permisos | Campos principales |
|---|---|---|
| `brands` | `brands.read/create/update/delete` | `name`, `code`, `description` |
| `units` | `units.read/create/update/delete` | `name`, `symbol`, `decimalPlaces` |
| `taxes` | `taxes.read/create/update/delete` | `name`, `code`, `rate` (0–100), `isInclusive` |
| `paymentMethods` | `paymentMethods.read/create/update/delete` | `name`, `code`, `kind` (`CASH`, `CARD`, `BANK_TRANSFER`, `CHECK`, `OTHER`) |

Cada recurso admite `GET /:resource`, `GET /:resource/:id`, `POST /:resource`, `PUT /:resource/:id` y `DELETE /:resource/:id`. Las listas aceptan los parámetros comunes. `DELETE` es baja lógica. Marca, unidad e impuesto no se pueden dar de baja si un producto activo los referencia; un método tampoco si ya aparece en un pago. Códigos/símbolos son únicos dentro de la empresa.

## Productos y pagos

Los productos ahora guardan `cost`, `salePrice`, `brandId`, `unitId` y `taxId`. Las referencias deben estar activas y pertenecer a la misma empresa. Se mantiene `unitPrice` como alias sincronizado de `salePrice` para que Compras/Ventas existentes sigan funcionando. Los pagos pueden enviar `paymentMethodId`; se valida en la misma empresa y su ausencia conserva compatibilidad con registros/clientes antiguos.

La aplicación de impuestos al total de ventas y compras se implementará en sus fases de flujo (FASE 5/7); FASE 4 solo mantiene la tasa/referencia maestra.

## Escrituras de los catálogos previos

Clientes, proveedores, productos, categorías y almacenes conservan `POST`/`GET`, y agregan `PUT /:id` y `DELETE /:id`. Las actualizaciones exigen al menos un campo y respetan empresa/sucursal. La baja de productos con existencias, categorías con productos/subcategorías y almacenes con stock u órdenes abiertas devuelve conflicto.

## Verificación y límites

Typecheck, lint, build y 55 pruebas pasan. Las pruebas cubren schemas, permisos, indices, precios, rutas protegidas, ciclos de categoria, duplicados y estados del flujo de compras. No se ha ejecutado CRUD contra MongoDB aislado. La web permite lectura tabular, busqueda y paginacion; la edicion desde la interfaz sigue pendiente.

## Actualización de validación — 2026-09-24

La afirmación histórica anterior sobre CRUD pendiente quedó superada: `catalogs.integration.test.ts` ejecuta operaciones de catálogo contra un MongoDB replica set efímero. La suite actual del monorepo pasa con 63 pruebas; typecheck, lint y build también pasan. Atlas en vivo y edición desde la web siguen pendientes.





