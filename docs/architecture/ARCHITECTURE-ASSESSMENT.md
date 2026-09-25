# Evaluación de arquitectura y estado

Fecha de revisión: 2026-09-23

## Inventario observado

Monorepo npm con workspaces `apps/*` y `packages/*`, lockfile, configuración TypeScript base, ESLint, `.env.example` y documentación arquitectónica. La API usa Express 4, TypeScript, Mongoose, Zod, JWT (`jose`), `bcryptjs`, Pino, Helmet, CORS y `express-rate-limit`. Web usa React Native y React Native Web; mobile usa React Native. `packages/types` expone tipos básicos de respuesta.

La API tiene módulos/rutas para auth; companies/branches; customers; suppliers; categories; products; warehouses; inventory; sales; purchases; finance; CRM; projects; helpdesk; HR; audit; notifications y reports. Hay pruebas bajo `apps/api/test`. El inventario revisado incluye HR, incorporado en el código inspeccionado durante la validación; no encontró IA. Las interfaces web/móvil son pantallas de entrada mínimas.

## Arquitectura actual

La API está modularizada por dominio con archivos para modelo, servicio, rutas, validación, repositorio o tipos según cada módulo. Se mantiene esta estructura coherente; no se propone una migración masiva a subcarpetas. `app.ts` compone middleware y rutas versionadas bajo `/api/v1`. Mongoose es accedido exclusivamente desde la API.

## Configuración y limitaciones

- `server.ts` espera la conexión `connectDatabase(MONGODB_URI)` antes de escuchar.
- MongoDB puede estar deshabilitado sin URI en desarrollo/test; producción exige URI y secretos JWT de longitud mínima.
- Los scripts actuales no cargan automáticamente `.env`; las variables deben llegar a `process.env` por el entorno de ejecución.
- Las transacciones dependen de Atlas o replica set. La documentación previa indica que falta validación persistente real contra una base aislada.
- Git no pudo inspeccionarse en esta sesión porque el ejecutable no estaba disponible en PATH.
- Este inventario confirma presencia de archivos, no cumplimiento integral ni seguridad de cada requisito.

## Diferencias con README anterior

El README decía que no había módulos funcionales, contradicho por código API presente. La evaluación anterior también describía el workspace como vacío y mezclaba resultados de fases con una numeración que no coincide con el prompt maestro. El estado aquí se basa en archivos observados y evita declarar fases completas solo por documentación.

## FASE 0: resultado

Se documentaron arquitectura, base de datos, seguridad, API y desarrollo en archivos separados bajo `docs/architecture/`; README y esta evaluación se alinearon con el inventario; `.env.example` quedó sin credenciales.

Queda una acción operativa externa: la URI con credenciales que estuvo previamente en `.env.example` debe rotarse en Atlas. El cambio local no revoca credenciales ni limpia copias remotas/historial de Git.

FASE 0 cubre el diagnóstico, estándares y documentación. La estructura de clientes y verificaciones ejecutables pertenecen a FASE 1. No se afirma que FASE 1 ni las fases de negocio estén completas.

## FASE 1: implementación en curso

Se añadió `packages/ui` con componentes React Native compartidos y se conectó desde web y móvil. La API carga `.env` de la raíz mediante `process.loadEnvFile` en Node 20.12+; las variables del proceso tienen precedencia. Se elevó el requisito de Node a `>=20.12.0`.

Verificación ejecutada: `npm.cmd run typecheck`, `lint`, `build` y `test` terminaron correctamente. Las pruebas reportaron 29 pasadas y 0 fallidas. No se validó conexión real con Atlas ni el render en dispositivos; web y móvil aún solo compilan como entradas TypeScript.

FASE 1 completada para la fundación API y shell compartido. La ejecución visual real y la conexión persistente siguen como validaciones externas pendientes.

## Siguiente fase: FASE 2

1. Decidir/codificar carga explícita de `.env` para desarrollo local sin debilitar secretos.
2. Validar configuración API, arranque, conexión DB, errores y health/readiness.
3. Completar base visual reutilizable de web/móvil sin implementar nuevos dominios ERP.
4. Ejecutar typecheck, lint, build y pruebas existentes; corregir fallos de fundación.
5. Validar conexión contra MongoDB de prueba si la URI está disponible; sin ella, reportar esa limitación.




## FASE 2: autorización inicial

El acceso se mantiene por Bearer JWT. Se sembró el catálogo de roles/permisos sin aceptar privilegios desde el registro; se protegieron las rutas empresariales existentes y el tipo de movimiento de inventario decide el permiso requerido. El propietario puede operar dentro de su propia empresa, siempre detrás de autenticación y contexto de tenant. El refresh token anterior queda inválido tras una rotación CAS de `tokenVersion`.

Validación ejecutada: `npm.cmd run typecheck`, `lint`, `build` y `test` completaron correctamente; 33 pruebas pasaron. No se comprobó la persistencia del seed/refresh contra Atlas.

FASE 2 deja establecidos catálogo y enforcement inicial. La asignación organizacional usa `UserRole` por empresa desde FASE 3; recuperación de contraseña sigue pendiente.

## FASE 3: multiempresa y multisucursal

Completar el contexto multiempresa/multisucursal, incluyendo membresías y asignación de roles/permisos por empresa para sustituir con seguridad el alcance global temporal de los roles.

## FASE 3: multiempresa y multisucursal (corte actual)

La API valida pertenencia antes de establecer `companyId`, `userId`, roles y permisos del tenant. `UserRole` asigna roles por empresa; los endpoints de miembros y roles están restringidos al propietario. El usuario puede seleccionar sucursal por parámetro, encabezado o cuerpo; si hay más de un selector, deben coincidir. Los listados de catálogos, almacenes, compras y ventas usan filtros de sucursal; inventario y movimientos validan almacenes permitidos. El listado de sucursales también limita resultados a las asignadas.

Validación de este corte: `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd run build` y `npm.cmd test` terminaron correctamente; 38 pruebas pasaron. No se validó persistencia multi-documento contra MongoDB replica set.

FASE 3 completada en el alcance estructural: `UserCompany` persiste la membresía con índice único usuario/empresa, `UserRole` asigna roles por empresa y el middleware establece/valida contexto de tenant y sucursal. Se conserva temporalmente `User.memberships` mediante doble escritura y migración idempotente de registros heredados. Las rutas empresariales auditadas exigen contexto de compañía. Los dominios futuros o aún sin dimensión de sucursal (finanzas, CRM, proyectos, Help Desk y RR. HH.) deben añadirla cuando se implementen sus flujos; los informes de finanzas y tickets permanecen actualmente a nivel empresa y deberán alinearse en FASE 12.



Verificación final de FASE 3: 
pm.cmd run typecheck, 
pm.cmd run lint, 
pm.cmd run build y 
pm.cmd test completaron correctamente; 38 pruebas pasaron. La prueba nueva inspecciona el esquema y el índice único de UserCompany. Sin MongoDB disponible, no se validó la migración ni las transacciones en una instancia real.

## FASE 4: catálogo maestro implementado; validación persistente pendiente

Los catálogos de clientes, proveedores, productos, categorías y almacenes tienen listado paginado/búsqueda, altas, edición y baja lógica con permisos. Se añadieron Brands, Units, Taxes y PaymentMethods bajo `master-data`, cada uno con índice único por empresa y endpoints CRUD. Productos referencian sus catálogos maestros en el mismo tenant, guardan costo y precio de venta, y mantienen `unitPrice` sincronizado para compatibilidad. Los pagos aceptan método de pago opcional con validación de empresa.

Validacion: typecheck, lint, build y test finalizaron correctamente; 55 pruebas pasaron. La suite cubre schemas, indices, permisos, rutas, precios, ciclos, duplicados y estados de compras; no verifica CRUD contra MongoDB aislado. La web consulta los nueve catalogos con busqueda y paginacion.

FASE 4 tiene endpoints, validaciones, permisos, referencias, baja logica y consulta web implementados; falta ejecutar CRUD contra MongoDB aislado. La edicion desde web y el calculo fiscal de ordenes siguen pendientes.


## FASE 5: solicitudes, cotizaciones y cuentas por pagar implementadas; replica set pendiente

El flujo de compra exige solicitud, aprobación, cotizaciones por proveedor, selección transaccional y generación de orden. Las órdenes siguen DRAFT -> SUBMITTED -> PENDING_APPROVAL -> APPROVED y permiten rechazo/cancelación antes de aprobar. La recepción transaccional actualiza inventario, crea movimientos y una cuenta por pagar con el total tributario. Los pagos parciales/liquidación actualizan el saldo por pagar dentro de la misma transacción que el movimiento de cuenta y el pago.

La suite valida esquemas, permisos, estados y cálculo de impuestos; typecheck, lint, build y 55 pruebas pasan. No hay .env, mongod, Docker ni servicio MongoDB disponible en este entorno; la selección, recepción, CxP y pagos aún requieren verificación real contra MongoDB replica set. No se inicia FASE 6 hasta obtener esa evidencia de integración.

## Estado actualizado al 2026-09-24

Esta sección reemplaza las notas históricas de fase anteriores cuando discrepan. La API carga `.env` desde el directorio de trabajo con Node 20.12+; `.env` está excluido de Git. Las pruebas de integración de catálogos, compras e inventario corrieron contra MongoDB replica set efímero y pasaron.

### FASE 7: ventas implementada y verificada

El flujo requiere cotización aceptada antes de crear el pedido. Las órdenes avanzan por envío, aprobación separada, preparación y entrega. La entrega transaccional descuenta existencias, registra movimiento `OUT`, genera factura y crea CxC. Los cobros actualizan el saldo de CxC y la cuenta financiera, con protección contra sobrepago. Las acciones y listados aplican el ámbito de sucursal autorizado.

Verificación actual: `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd run build` y `npm.cmd test` finalizaron correctamente; 60 pruebas pasaron, incluida la integración de ventas contra replica set. No se probó Atlas en vivo.

### FASE 8: finanzas en revisión

El módulo ya contiene cuentas, transacciones de ingreso/gasto, pagos, CxP y CxC. En esta fase se debe cerrar el registro financiero automático de pagos, validar referencias cruzadas y agregar presupuestos con permisos y persistencia probada. No se marca FASE 8 como completada.

### Cierre de FASE 8 — 2026-09-24

La implementación ya crea un `FinanceTransaction` ligado a cada pago dentro de la misma transacción que actualiza cuenta y saldo de CxP/CxC. Los movimientos manuales verifican la empresa/estado de la venta o compra relacionada. Se agregaron presupuestos de ingreso/gasto con código por empresa, periodo, importe ejecutado y saldo restante. Cuentas, transacciones, pagos, CxP, CxC y presupuestos tienen endpoints protegidos.

Validación ejecutada tras FASE 8: `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd run build` y `npm.cmd test` pasaron; 62 pruebas, incluidas integraciones replica set para ventas, compras y cálculo presupuestario. No se verificó una conexión en vivo con Atlas. FASE 8 completada en su alcance inicial; sigue FASE 9 CRM.

## Cierre de FASE 9 — CRM

Se implementaron leads con calificación/cierre, oportunidades enlazadas a cliente o lead, contactos, actividades, interacciones e historial del cliente. La propuesta generada desde una oportunidad convierte el lead y crea cliente/contacto, cotización y vínculo de oportunidad en una transacción replica set. La oportunidad solo se marca ganada tras entregar el pedido asociado a su cotización. Las consultas validan tenant, usuario asignado y ámbito de sucursal.

Validación tras FASE 9: typecheck, lint, build y 63 pruebas pasaron. La suite incluye un flujo replica set desde lead hasta oportunidad, cotización, entrega e historial. No se ha verificado Atlas en vivo. FASE 9 completada en su alcance inicial; sigue FASE 10 Proyectos y Help Desk.

## Avance de FASE 10 - Proyectos y Help Desk

Se añadieron miembros, hitos, registro de tiempo y gastos a Proyectos, con validación de pertenencia empresarial/sucursal y acumulación transaccional de horas vinculadas a tareas. Help Desk ahora tiene categorías, políticas SLA por prioridad, los seis estados requeridos, asignación validada, metadata de adjuntos e historial de cambios. Las rutas respetan los permisos y filtros de sucursal existentes. Los contratos están descritos en `docs/api/projects.md` y `docs/api/helpdesk.md`.

Validación de FASE 10: `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd run build` y `npm.cmd test` pasaron; 64 pruebas en total. La integración replica set cubre los flujos de Proyectos y Help Desk junto con las fases previas. FASE 10 completada en su alcance inicial; sigue FASE 11 RR. HH. La API de adjuntos registra metadata y storageKey; el transporte binario requiere almacenamiento externo.

## Avance de FASE 11 - Recursos Humanos

Inspección inicial confirmó que el módulo existente cubría departamentos, empleados, contratos, asistencia y permisos, pero no puestos ni documentos; tampoco comprobaba consistentemente la cuenta asociada, la sucursal ni la aprobación de permisos. FASE 11 agregó puestos, metadata documental, validación tenant/sucursal, flujo de aprobación auditable y protección separada de lectura de salarios. Nómina sigue independiente.

Validación de FASE 11: typecheck, lint, build y 66 pruebas pasaron. La suite incluye integración replica set para altas relacionadas, tenant/sucursal, contratos, asistencia, documentos, aprobación de permisos y rechazo de autoaprobación. FASE 11 completada en alcance inicial; sigue FASE 12 Reportes y Dashboard.

