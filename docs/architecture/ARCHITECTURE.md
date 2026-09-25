# Arquitectura actual

Fecha de revisión: 2026-09-23

## Estado

El repositorio es un monorepo npm con workspaces `apps/*` y `packages/*`, TypeScript y Node.js. Las aplicaciones son `apps/api`, `apps/web` y `apps/mobile`; `packages/types` contiene contratos TypeScript sencillos para respuestas HTTP.

La API es Express 4 con módulos por dominio. Cada módulo agrupa archivos de modelo, servicio, rutas, validación y tipos por nombre de archivo. Esta organización es coherente y se conserva; no hace falta migrarla a subdirectorios `controller/`, `service/`, etc. antes de que exista una necesidad concreta.

La API monta las rutas bajo `/api/v1`. La persistencia usa MongoDB mediante Mongoose. Web y móvil comparten un shell React Native inicial desde `packages/ui`; todavía no existe configuración completa de ejecución/despliegue de clientes ni pantallas de dominio.

## Módulos observados en código

Autenticación; empresas y sucursales; clientes; proveedores; categorías; productos; almacenes; inventario; ventas; compras; finanzas; CRM; proyectos; Help Desk; recursos humanos; auditoría; notificaciones y reportes.

La presencia de un módulo no certifica que cubra todos los requisitos ERP ni que haya sido validado contra MongoDB real. No se encontraron módulos de integraciones externas o IA en el inventario revisado.

## Límites y convenciones

- Los dominios permanecen en `apps/api/src/modules/<domain>`.
- `app.ts` compone middleware y routers; servicios contienen las operaciones de dominio y repositorios encapsulan acceso a datos en los módulos que los tienen.
- Los clientes no acceden directamente a MongoDB.
- Los contratos compartidos se publican desde `packages/types`.
- Los cambios siguen el orden de fases establecido en el prompt maestro y deben actualizar documentación y validaciones.

## Dependencias arquitectónicas

Los flujos existentes relacionan ventas e inventario, compras e inventario, pagos y finanzas, y reportes con varios dominios. Auditoría y notificaciones tienen servicios, pero su invocación automática desde todas las operaciones críticas no está demostrada. La API aún necesita evaluar cobertura de permisos por endpoint y consistencia transaccional.

## Decisiones

Se conserva el monorepo modular y la estructura actual por archivos. No se agregan microservicios, paquetes o herramientas de UI hasta que la fase correspondiente lo justifique.


