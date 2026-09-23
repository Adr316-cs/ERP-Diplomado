# ARCHITECTURE ASSESSMENT

Fecha: 2026-09-23

## Estado actual

- El workspace `Proyecto ERP` está vacío.
- No existen aplicaciones, módulos, documentación ni archivos de configuración.
- No existe `package.json`, lockfile, configuración TypeScript ni configuración de React Native.
- No existe `.git` en el workspace.
- Git no está disponible en el PATH del entorno inspeccionado.
- Node.js está disponible en la versión `v24.1.0`.
- `npm` está instalado, pero el wrapper `npm.ps1` está bloqueado por la política de ejecución de PowerShell; puede verificarse con `npm.cmd` cuando comience la inicialización.
- No se detectaron `pnpm` ni `yarn`.
- No hay código funcional que reutilizar, modificar o eliminar.

## Problemas encontrados

1. No existe una base de proyecto sobre la que implementar módulos.
2. No hay control de versiones inicializado.
3. No hay una política de dependencias ni un gestor de paquetes elegido.
4. No hay configuración de entornos, secretos, compilación, lint, pruebas o documentación API.
5. La disponibilidad de MongoDB Atlas y sus credenciales todavía no está configurada, como es esperable en esta fase.

Estos puntos son condiciones de arranque, no fallos de una implementación existente.

## Arquitectura objetivo recomendada

Se recomienda un monorepo modular con workspaces de npm en la primera versión.
Es suficiente para separar aplicaciones y paquetes sin introducir microservicios,
Kafka, Redis o Kubernetes antes de que exista una necesidad operativa.

```text
apps/
  api/                         API REST Express
  web/                         React Native Web
  mobile/                      React Native
packages/
  types/                       contratos TypeScript compartidos
  validation/                  esquemas Zod compartidos
  constants/                   permisos y constantes de dominio
  shared/                      utilidades sin efectos de infraestructura
  ui/                          componentes compartidos cuando sea viable
docs/
  architecture/
  api/
  database/
  security/
  testing/
tests/
  integration/
  e2e/
  performance/
```

### API

`apps/api` usará Express, TypeScript, Mongoose y una API REST bajo `/api/v1/`.
Cada dominio tendrá sus propios controller, service, repository, model,
validation, types, routes y tests. La aplicación compondrá los módulos y
middleware comunes, mientras que la lógica empresarial permanecerá en services.

### Clientes

`apps/web` y `apps/mobile` compartirán tipos, validaciones, constantes y lógica
de dominio no visual. React Native Web se usará para compartir componentes cuando
la experiencia sea equivalente; las pantallas podrán diferir cuando desktop y
móvil tengan necesidades distintas.

### Datos y multiempresa

MongoDB Atlas será accedido exclusivamente por la API. Los documentos
empresariales incluirán `companyId`, `branchId`, `createdBy`, `createdAt` y
`updatedAt` cuando corresponda. El contexto de empresa y sucursal se derivará
del usuario autenticado y se aplicará en repositorios y consultas, no solo en el
cliente.

### Seguridad transversal

La base incluirá configuración por entorno, validación con Zod, Helmet, CORS
explícito, rate limiting, hashing de contraseñas, access/refresh tokens, RBAC,
errores sanitizados, logging y auditoría de operaciones críticas. Ningún cliente
se conectará directamente a MongoDB.

## Dependencias necesarias en la Fase 1

La lista se limita a la inicialización y no se instalará hasta autorizar esa fase:

- Workspace: npm workspaces y TypeScript.
- API: Express, Mongoose, Zod, Helmet, CORS, rate limiting, logging y JWT.
- Clientes: React Native, React Native Web, Expo/Metro y TypeScript.
- Calidad: ESLint, Prettier, Vitest o Jest, Supertest y Playwright según el alcance.
- Documentación: OpenAPI/Swagger para la API.

Las versiones concretas deben fijarse durante la Fase 1 después de comprobar
compatibilidad entre React Native, Expo, React Native Web y Node.

## Riesgos

- React Native Web y la aplicación móvil pueden divergir si se comparte UI sin criterios claros.
- Node `v24.1.0` puede no ser la versión LTS compatible con todas las herramientas de React Native; esto debe verificarse antes de fijar el entorno.
- El aislamiento multiempresa debe probarse en cada repositorio y endpoint para evitar fugas de datos.
- Access/refresh tokens, revocación y recuperación de cuenta requieren decisiones de seguridad antes de exponer autenticación.
- Un monorepo sin límites de dependencia puede terminar mezclando infraestructura, UI y dominio.
- MongoDB Atlas necesitará índices y reglas de consistencia definidos junto con cada módulo, no al final.

## Plan de migración e inicialización

1. Inicializar Git y el monorepo con npm workspaces.
2. Crear configuraciones base de TypeScript, lint, formato, pruebas y variables de entorno.
3. Crear la API mínima con configuración, manejo de errores, logging y health check.
4. Crear los clientes con navegación y una pantalla técnica mínima, sin módulos empresariales.
5. Añadir contratos compartidos y documentación OpenAPI inicial.
6. Implementar autenticación, usuarios, roles y permisos antes de los dominios empresariales.
7. Incorporar empresas y sucursales, y validar el aislamiento multiempresa.
8. Continuar con clientes, proveedores, productos e inventario por fases.

No se debe borrar código durante esta migración porque actualmente no existe
código funcional en el workspace.

## Resultado de la Fase 1

La base del monorepo fue inicializada con npm workspaces. Se añadieron:

- Configuración raíz de TypeScript, ESLint, `.env.example` y `.gitignore`.
- API Express con Helmet, CORS, rate limiting, respuestas consistentes y health check.
- Pruebas de health check y ruta inexistente.
- Paquete compartido inicial de tipos de respuesta.
- Entradas mínimas para React Native Web y React Native.
- `package-lock.json` generado mediante instalación reproducible.

TypeScript, compilación, lint y tests deben mantenerse como requisitos antes de
iniciar la siguiente fase.

## Resultado de la Fase 2

- Configuración de entorno validada con Zod y defaults seguros para desarrollo.
- MongoDB preparado mediante Mongoose, con estados de conexión y timeouts.
- Conexión opcional en desarrollo/test y obligatoria en producción.
- Logging estructurado con Pino y redacción de credenciales HTTP sensibles.
- Middleware centralizado para errores JSON, validación y errores HTTP.
- Health check de liveness y readiness con estado de MongoDB.
- Tres pruebas API cubren liveness, readiness y rutas inexistentes.

La API todavía no abre una conexión real porque `MONGODB_URI` permanece vacío.
La verificación contra Atlas requiere una URI proporcionada fuera del código.

`npm audit` mantiene seis vulnerabilidades altas transitivas relacionadas con
Metro/`image-size`. La corrección automática exigiría una actualización mayor de
React Native, por lo que queda como decisión de compatibilidad pendiente.

## Resultado de la Fase 3

- Modelos Mongoose iniciales para usuarios, roles y permisos.
- Registro con validación, hashing bcrypt y rol `user` predeterminado.
- Login con credenciales verificadas sin exponer hashes.
- Access tokens y refresh tokens JWT con issuer, expiración y claims mínimos.
- Revocación mediante `tokenVersion` al cerrar sesión.
- Middleware Bearer que valida firma, issuer, tipo, usuario activo y versión.
- Middleware `requirePermission` preparado para proteger operaciones por permiso.
- Rutas `/register`, `/login`, `/refresh`, `/logout` y `/me`.
- Siete pruebas para hashing, JWT, validación y protección de rutas.

El flujo persistente de registro/login no se ejecutó contra MongoDB Atlas porque no
hay una URI configurada en el entorno. RBAC queda preparado, pero la aplicación
todavía no tiene un dominio empresarial que consuma un permiso específico.

## Resultado de la Fase 4

- Modelos Mongoose para empresas y sucursales.
- Índice único de sucursal por combinación `companyId` + `code`.
- Membresías de usuario con empresas, sucursales permitidas y propiedad.
- Claims JWT ampliados con membresías para transportar el contexto autorizado.
- Middleware que valida `companyId`, membresía y propiedad de empresa.
- Servicios y repositorios que filtran empresas por las membresías del usuario.
- Rutas protegidas:
  - `POST /api/v1/companies`
  - `GET /api/v1/companies`
  - `POST /api/v1/companies/:companyId/branches`
  - `GET /api/v1/companies/:companyId/branches`
- Nueve pruebas totales, incluidas pruebas de aislamiento entre tenants.

La persistencia real contra Atlas sigue pendiente por falta de `MONGODB_URI`.
Las consultas y restricciones deben verificarse con una base de prueba antes de
declarar completado el aislamiento en producción.

## Resultado de la Fase 5

- Clientes y proveedores con `companyId`, `branchId` opcional y `createdBy`.
- Categorías con código único por empresa y categoría padre validada dentro del tenant.
- Productos con SKU único por empresa, categoría obligatoria y stock mínimo.
- Validación de que sucursales y categorías referenciadas pertenecen a la misma empresa.
- Repositorios que incluyen `companyId` en sus consultas de lectura.
- Rutas protegidas y anidadas por empresa:
  - `POST/GET /api/v1/companies/:companyId/customers`
  - `POST/GET /api/v1/companies/:companyId/suppliers`
  - `POST/GET /api/v1/companies/:companyId/categories`
  - `POST/GET /api/v1/companies/:companyId/products`
- Índices únicos para emails por empresa, códigos de categoría y SKU de producto.
- Once pruebas totales, incluyendo validaciones de catálogo y protección de rutas.

La persistencia real contra Atlas sigue pendiente por falta de `MONGODB_URI`.
No se declara completada la validación de datos en producción hasta ejecutar
pruebas de integración con una base MongoDB aislada.

## Resultado de la Fase 6

- Almacenes vinculados a una empresa y sucursal.
- Saldos únicos por `companyId`, `warehouseId` y `productId`.
- Libro de movimientos con tipos `IN`, `OUT`, `ADJUSTMENT` y `TRANSFER`.
- Validación de producto y almacenes dentro de la misma empresa.
- Rechazo de salidas y transferencias que producirían stock negativo.
- Transferencias que actualizan origen y destino en una transacción.
- Índices para búsquedas por empresa y unicidad de saldos.
- Rutas protegidas:
  - `POST/GET /api/v1/companies/:companyId/warehouses`
  - `GET /api/v1/companies/:companyId/inventory`
  - `POST /api/v1/companies/:companyId/inventory/movements`
- Catorce pruebas totales, incluyendo reglas de stock y protección de inventario.

Las transacciones requieren MongoDB Atlas o un replica set. Como no hay
`MONGODB_URI` configurada, se validaron las reglas y contratos HTTP, pero no una
transacción persistente real.

## Resultado de la Fase 7

- Cotizaciones con líneas, precios, totales y estados `DRAFT`, `SENT`, `ACCEPTED` y `REJECTED`.
- Pedidos con cliente, sucursal, almacén, líneas, totales y estados `DRAFT`, `CONFIRMED` y `CANCELLED`.
- Ventas generadas al confirmar un pedido.
- Validación de clientes, sucursales, almacenes y productos dentro de la empresa.
- Confirmación transaccional que descuenta inventario y registra movimientos `OUT`.
- Rechazo de pedidos con stock insuficiente o estados no confirmables.
- Índices y referencias para mantener trazabilidad entre pedido, venta y movimiento.
- Rutas protegidas:
  - `POST/GET /api/v1/companies/:companyId/sales/quotes`
  - `POST/GET /api/v1/companies/:companyId/sales/orders`
  - `POST /api/v1/companies/:companyId/sales/orders/:orderId/confirm`
- Dieciséis pruebas totales, incluyendo validación comercial y protección de rutas.

La confirmación real de una venta no se ejecutó contra Atlas porque no existe
`MONGODB_URI` configurada. MongoDB Atlas o un replica set es requisito para
validar las transacciones de venta e inventario.

## Resultado de la Fase 8

- Órdenes de compra con proveedor, sucursal, almacén, líneas y totales.
- Estados `DRAFT`, `APPROVED`, `RECEIVED` y `CANCELLED`.
- Aprobación controlada desde borrador.
- Recepción permitida únicamente para órdenes aprobadas.
- Validación de proveedor, sucursal, almacén y productos dentro de la empresa.
- Recepción transaccional que incrementa inventario.
- Registro de movimientos `IN` vinculados a la recepción.
- Protección contra recepción duplicada mediante validación de estado.
- Rutas protegidas:
  - `POST/GET /api/v1/companies/:companyId/purchases/orders`
  - `POST /api/v1/companies/:companyId/purchases/orders/:orderId/approve`
  - `POST /api/v1/companies/:companyId/purchases/orders/:orderId/receive`
- Dieciocho pruebas totales, incluyendo validación y autenticación de compras.

La recepción real no se ejecutó contra Atlas porque no existe `MONGODB_URI`.
MongoDB Atlas o un replica set es requisito para validar la transacción persistente
de entrada de inventario.

## Resultado de la Fase 9

- Cuentas financieras por empresa con código, tipo, moneda y saldo.
- Movimientos de ingresos y egresos con descripción y referencias opcionales.
- Pagos de clientes vinculados a ventas completadas.
- Pagos a proveedores vinculados a órdenes recibidas.
- Actualización de saldo y registro financiero dentro de transacciones.
- Redondeo monetario a dos decimales.
- Validación de cuentas y documentos relacionados dentro de la empresa.
- Rutas protegidas:
  - `POST/GET /api/v1/companies/:companyId/finance/accounts`
  - `POST /api/v1/companies/:companyId/finance/transactions`
  - `POST /api/v1/companies/:companyId/finance/payments`
- Veinte pruebas totales, incluyendo validación financiera y protección de rutas.

Esta fase cubre finanzas operativas iniciales. No cubre contabilidad fiscal,
libros contables, impuestos, conciliación bancaria ni cierres periodificados.
Las transacciones reales requieren `MONGODB_URI` apuntando a Atlas o un replica set.

## Resultado de la Fase 10

- CRM con oportunidades, etapas, valor, responsable y fecha esperada.
- Seguimientos CRM con llamadas, emails, reuniones y notas.
- Proyectos con estados, responsables, fechas y descripción.
- Tareas de proyecto con estado, responsable, fecha límite y horas.
- Help Desk con tickets, categorías, prioridades, estados y responsables.
- Comentarios de tickets con autor y fecha, conservando historial.
- Validación de clientes y oportunidades dentro de la empresa.
- Rutas protegidas:
  - `POST/GET /api/v1/companies/:companyId/crm/opportunities`
  - `POST/GET /api/v1/companies/:companyId/crm/activities`
  - `POST/GET /api/v1/companies/:companyId/projects`
  - `POST/GET /api/v1/companies/:companyId/projects/tasks`
  - `POST/GET /api/v1/companies/:companyId/helpdesk/tickets`
  - `POST /api/v1/companies/:companyId/helpdesk/tickets/:ticketId/comments`
- Veintitrés pruebas totales, incluyendo validaciones y protección de rutas.

La persistencia real de estos dominios no se ejecutó contra Atlas porque no existe
`MONGODB_URI` configurada. Quedan como extensiones futuras SLA, notificaciones,
automatización de Help Desk y RAG para soporte.

## Resultado de la Fase 11

- Auditoría persistida con usuario, empresa, módulo, acción, entidad, resultado y cambios opcionales.
- Consulta de auditoría limitada al contexto de empresa.
- Notificaciones persistidas por empresa y usuario.
- Lectura y marcado individual de notificaciones.
- Dashboard agregado con ventas, compras, finanzas, inventario y tickets.
- Reporte de ventas agrupado por día con filtros `from` y `to`.
- Rango de fechas validado antes de ejecutar reportes.
- Rutas protegidas:
  - `GET /api/v1/companies/:companyId/audit`
  - `GET /api/v1/companies/:companyId/notifications`
  - `POST /api/v1/companies/:companyId/notifications/:notificationId/read`
  - `GET /api/v1/companies/:companyId/reports/dashboard`
  - `GET /api/v1/companies/:companyId/reports/sales`
- Veinticinco pruebas totales, incluyendo filtros y protección de rutas.

La auditoría y las notificaciones están preparadas para ser invocadas desde
servicios de dominio; todavía falta conectar automáticamente cada operación
crítica existente a `recordAudit` y `createNotification`. La persistencia real
requiere `MONGODB_URI` apuntando a Atlas.

## Primera fase recomendada

La Fase 1 queda satisfecha con el bootstrap documentado arriba. La siguiente tarea
recomendada es la Fase 12: integración de IA, RAG y herramientas ERP autorizadas,
sin permitir acciones críticas sin confirmación y auditoría.

## Criterio de salida de la Fase 0

La Fase 0 queda completada como análisis arquitectónico. La implementación del
ERP queda pendiente y no debe declararse completada hasta que existan código,
pruebas, validaciones, seguridad, documentación y verificaciones ejecutables.