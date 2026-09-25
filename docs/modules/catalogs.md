# Catálogos maestros: estado de implementación

Los catálogos están agrupados por dominio en `apps/api/src/modules/*`. Los listados comparten validación y paginación en `apps/api/src/shared/catalog-query.ts`. Las operaciones comunes de edición y baja lógica viven en `catalog-mutations.ts`.

## Catálogos existentes

Bajo `/api/v1/companies/:companyId/`:

- Clientes, proveedores, productos, categorías y almacenes: `POST`, `GET` paginado, `PUT /:id` parcial y `DELETE /:id` lógico.
- Filtros de tenant obligatorios; filtros de sucursal en los recursos que la modelan.
- Baja protegida por existencias/referencias activas para productos, categorías y almacenes.

## Catálogos maestros

Bajo `/api/v1/companies/:companyId/master-data/`:

- `brands`: marcas.
- `units`: unidades de medida y decimales permitidos.
- `taxes`: tasas de 0 a 100 y modalidad inclusiva.
- `paymentMethods`: efectivo, tarjeta, transferencia, cheque u otro.

Cada recurso tiene CRUD con `GET` de lista y detalle, permisos granulares, validadores Zod, índice único dentro de empresa y baja lógica con bloqueo cuando existen referencias activas. `products` valida marca/unidad/impuesto al mismo `companyId`; `finance/payments` acepta y valida un método opcional.

## Estado de FASE 4

- Los cinco catalogos existentes tambien tienen detalle por ID; las jerarquias impiden ciclos y los duplicados responden HTTP 409.
- La web ofrece consulta tabular, busqueda y paginacion por empresa para nueve catalogos.
- Falta validar CRUD contra MongoDB aislado; no hay instancia/URI de prueba acreditada en este entorno.
- El calculo de impuestos en ordenes corresponde a FASE 5/7 y aun no se aplica a totales.

