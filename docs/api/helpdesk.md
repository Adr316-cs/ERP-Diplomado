# Help Desk

Rutas bajo `/api/v1/companies/:companyId/helpdesk`; requieren autenticación, membresía de empresa y permisos `helpdesk.read`, `helpdesk.create` o `helpdesk.update`. Las consultas y cambios de tickets respetan sucursal.

- `POST/GET /categories`: mantiene categorías activas por empresa. Para crear un ticket se requiere una categoría activa existente.
- `GET /sla`, `PUT /sla`: consulta o define los minutos objetivo por prioridad (`LOW`, `MEDIUM`, `HIGH`, `URGENT`). Sin política específica se usan 4320, 1440, 240 y 60 minutos respectivamente. La fecha SLA se calcula al crear el ticket.
- `POST/GET /tickets`: crea y consulta tickets. Estados disponibles: `OPEN`, `IN_PROGRESS`, `WAITING`, `RESOLVED`, `CLOSED`, `CANCELLED`.
- `PATCH /tickets/:ticketId/status`: aplica transiciones válidas; terminales `CLOSED` y `CANCELLED` no se reabren. `RESOLVED` puede cerrarse o volver a `IN_PROGRESS`.
- `PATCH /tickets/:ticketId/assignment`: asigna un usuario de la misma empresa/sucursal o recibe `null` para desasignar.
- `POST /tickets/:ticketId/comments` agrega comentarios; `POST /tickets/:ticketId/attachments` registra metadata (nombre, clave de almacenamiento, tipo y tamaño, máximo 25 MB).
- `GET /tickets/:ticketId/history` devuelve eventos de creación, asignación, cambios de estado, comentarios y adjuntos.

El endpoint de adjuntos solo guarda metadata y `storageKey`; la carga/binario debe ser gestionada por un almacenamiento externo y no está implementada aquí. Los tickets ya existentes con categoría libre requieren que se cree esa categoría antes de nuevas altas.

## Validación

`projects-helpdesk.integration.test.ts` valida política SLA, asignación tenant/sucursal, comentario, metadata de adjunto, historial, secuencia de estados, rechazo de transiciones inválidas y filtrado por sucursal sobre MongoDB replica set temporal.
