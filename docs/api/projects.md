# Proyectos

Rutas bajo `/api/v1/companies/:companyId/projects`. Requieren sesión, membresía empresarial, permiso `projects.*` y respetan el filtro de sucursal seleccionado o asignado al usuario.

- `POST/GET /`: crea y consulta proyectos. El manager debe pertenecer a la empresa y sucursal; al crear se registra como miembro MANAGER. Admite `branchId`, nombre, descripción y fechas.
- `POST /tasks`, `GET /tasks?projectId=...`: crea/consulta tareas, valida proyecto y usuario asignado.
- `POST/GET /:projectId/members`: agrega y lista miembros `MANAGER` o `MEMBER`.
- `POST/GET /:projectId/milestones`: crea y consulta hitos; `PATCH /:projectId/milestones/:milestoneId/status` avanza a `IN_PROGRESS` o `COMPLETED`.
- `POST/GET /:projectId/time-entries`: registra y consulta tiempo por usuario, fecha, minutos y descripción. Si se vincula una tarea, sus horas acumuladas se actualizan en la misma transacción.
- `POST/GET /:projectId/expenses`: registra y consulta gastos con importe, moneda y fecha.

Los IDs se validan dentro de la empresa y los recursos de proyecto se buscan dentro del contexto de sucursal. El registro de tiempo requiere MongoDB configurado como replica set por usar transacción.

## Validación

`projects-helpdesk.integration.test.ts` valida con un replica set temporal creación y consulta de miembro, hito, tarea, tiempo y gasto, además de la acumulación de horas.
