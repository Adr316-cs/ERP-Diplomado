# Seguridad

## Controles observados e implementados

- Bearer JWT con access/refresh separados, bcryptjs, expiración y `tokenVersion`.
- El refresh se rota con una actualización atómica por versión; volver a usar el token anterior se rechaza. Logout también incrementa la versión y revoca tokens de esa sesión de usuario.
- Usuarios activos/inactivos se comprueban al autenticar.
- Registro asigna únicamente `EMPLOYEE`; el cliente no puede enviar roles.
- Catálogo inicial de roles: `SUPER_ADMIN`, `ADMIN`, `MANAGER`, `SALES`, `PURCHASE`, `WAREHOUSE`, `FINANCE`, `HR`, `SUPPORT` y `EMPLOYEE`.
- Permisos granulares iniciales y middleware de autorización aplicado a las rutas empresariales existentes. Entradas/salidas de inventario, ajustes y transferencias requieren permisos distintos.
- El acceso por membresía sigue siendo obligatorio. La propiedad de una empresa da permisos dentro de esa empresa únicamente.
- Validación Zod, Helmet, CORS configurable, rate limiting y Pino con redacción de Authorization/cookies.
- Errores internos se responden sin stack traces.

Los permisos se cargan desde roles persistidos, no se confía en los permisos que mande el cliente. En rutas de empresa se usan las asignaciones `UserRole` y permisos resueltos para esa empresa. El seed conserva personalizaciones de roles existentes; el rol histórico `user` recibe permisos mínimos compatibles.

## Límites pendientes

`UserRole` ya asigna roles por empresa y los endpoints de gestión están protegidos para el propietario. `UserCompany` es la fuente canónica de membresías y roles siguen en `UserRole`; `User.memberships` se conserva en doble escritura como compatibilidad temporal mientras lecturas migran documentos antiguos. Varios dominios carecen de alcance por sucursal, por lo que el aislamiento multisucursal integral sigue pendiente.

No hay endpoint de recuperación de contraseña. No se ejecutó el flujo de registro, seed o rotación contra MongoDB real; la suite actual prueba tokens, reglas del guard y middleware, pero no persistencia.

## Secretos

No guardar contraseñas, URI de base de datos ni secretos JWT en Git. `.env` está ignorado y `.env.example` solo tiene valores vacíos. Si una credencial real estuvo expuesta, rotarla en el proveedor; borrarla del archivo no invalida copias anteriores.

En producción, los secretos JWT deben ser distintos y de al menos 32 caracteres según la validación actual. Usar el gestor de secretos del entorno de despliegue.

## Revisión antes de producción

Revisar permisos por ruta al añadir endpoints, asignación de roles por tenant, abuso de refresh tokens, rate limits específicos de autenticación, CORS, filtros multiempresa/sucursal, logs, dependencias, recuperación de acceso e integración persistente.


