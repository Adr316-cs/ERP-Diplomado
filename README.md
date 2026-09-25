# ERP Empresarial Modular

Monorepo npm multiempresa con API Express/TypeScript y Mongoose, clientes web y móvil en React Native y contratos compartidos en `packages/types`.

## Estado de fases

### Estado verificado al 2026-09-24

FASE 10 (Proyectos + Help Desk) y FASE 11 (RR. HH.) están completadas en su alcance inicial. La verificación más reciente pasó `typecheck`, `lint`, `build` y las 66 pruebas del monorepo, incluidas integraciones MongoDB replica set. La siguiente fase según el prompt maestro es FASE 12 (Reportes y Dashboard).

- FASE 0–3: arquitectura, base técnica, autenticación/autorización y contexto multiempresa/multisucursal implementados.
- FASE 4–6: catálogos, compras e inventario implementados e integrados con MongoDB replica set en pruebas.
- FASE 7: ventas implementada con cotización, pedido, aprobación, preparación, entrega, factura, inventario y cuentas por cobrar. Flujo verificado con una prueba de integración replica set.
- FASE 8: finanzas con cuentas, ingresos/egresos, pagos, CxP/CxC y presupuestos implementada e integrada con ventas y compras.
- FASE 9: CRM con leads, calificación, oportunidades, cotización vinculada, contactos, actividades, interacciones e historial de cliente implementado e integrado con ventas.
- FASE 10–18: pendientes según el orden descrito en el prompt maestro.

Última validación del monorepo: `typecheck`, `lint`, `build` y `test` finalizaron correctamente; 63 pruebas pasaron. La suite usa MongoDB replica set efímero para los flujos de catálogos, compras, inventario, ventas, finanzas y CRM. No se ha verificado la conexión en vivo con Atlas ni la interfaz en dispositivos.

## Requisitos y comandos

Node.js `>=20.12.0` y npm. Ejecuta los comandos desde la raíz:

```powershell
npm.cmd install
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd test
npm.cmd run dev --workspace=@erp/api
```

## Variables de entorno

Copia `.env.example` a `.env` en la raíz y configura `MONGODB_URI` con la cadena de conexión de Atlas. El código lee la URI completa desde esa variable; protege `.env` y no subas secretos a Git. Node 20.12+ carga el archivo local al iniciar la API.

## Documentación

- [Evaluación de arquitectura](docs/architecture/ARCHITECTURE-ASSESSMENT.md)
- [Arquitectura](docs/architecture/ARCHITECTURE.md)
- [Base de datos](docs/architecture/DATABASE.md)
- [Seguridad](docs/architecture/SECURITY.md)
- [API](docs/architecture/API.md)
- [Compras](docs/api/purchases.md)
- [Ventas](docs/api/sales.md)
- [Finanzas](docs/api/finance.md)

El README registra el estado validado por fase; el código y las pruebas son la fuente definitiva de implementación.
