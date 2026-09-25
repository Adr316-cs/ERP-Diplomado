# Base de datos

## Tecnología y conexión

La API utiliza Mongoose (`apps/api/src/database/mongoose.ts`). `server.ts` espera a `connectDatabase(MONGODB_URI)` antes de abrir el puerto. Si la URI está vacía, la conexión queda deshabilitada en desarrollo/test; `loadEnvironment` exige URI en producción. El timeout de selección de servidor es de cinco segundos.

La URI debe estar en una variable de entorno local o de despliegue, nunca en código ni en un archivo de ejemplo. Atlas requiere una IP de cliente autorizada y un usuario de base de datos. Las transacciones requieren Atlas o un replica set.

## Modelos y convenciones observadas

Los modelos de dominio usan Mongoose y la mayoría declara `timestamps`. Los modelos empresariales incluyen `companyId`; varios incluyen `branchId`. Se han definido índices en algunos modelos, incluidos identificadores únicos por empresa y saldos de inventario.

Los servicios y repositorios deben filtrar por `companyId` y validar referencias dentro de la misma empresa. El contexto de sucursal y la obligatoriedad de `branchId` deben documentarse y probarse por dominio; no se asume cobertura universal.

## Integridad

Ventas confirmadas actualizan inventario y crean movimientos dentro de una sesión/transacción; recepciones de compras incrementan existencias transaccionalmente; finanzas usa transacciones en algunos flujos de pago. Falta ejecutar validación persistente real con una base aislada y revisar todas las rutas multi-documento.

## Pendientes

- Inventariar índices y referencias de todos los modelos y documentar estrategias de migración.
- Verificar índices únicos bajo escrituras concurrentes.
- Ejecutar pruebas de integración con MongoDB replica set/Atlas de prueba.
- Confirmar aislamiento por empresa y sucursal en cada consulta.
- Definir política de backups y retención durante la fase de producción.

## Autorización persistida

Los modelos `Permission`, `Role` y `User` almacenan claves, permisos asociados, roles y versión de tokens. El catálogo inicial de permisos/roles se upsertea al primer login, lectura autenticada o registro del proceso. Las personalizaciones de roles existentes se conservan; la asignación empresarial de roles queda para `UserRole` en FASE 3.


## Alcance multisucursal por fase

El middleware exige membresía `UserCompany` (con fallback/migración de `User.memberships`) y filtra por sucursal los catálogos con `branchId`, ventas, compras e inventario por almacén. Los dominios sin dimensión de sucursal y los informes de finanzas/tickets deben añadirse o ajustarse en sus fases funcionales correspondientes. La persistencia multi-documento y la migración heredada requieren verificación con MongoDB replica set.


