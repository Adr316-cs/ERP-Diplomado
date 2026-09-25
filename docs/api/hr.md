# Recursos Humanos

Rutas bajo `/api/v1/companies/:companyId/hr`, protegidas por autenticación y membresía de empresa. Los empleados y sus contratos, asistencias, permisos y documentos respetan el alcance de sucursal del usuario.

- `POST/GET /departments`: alta y consulta de departamentos de la empresa.
- `POST/GET /positions`: alta y consulta de puestos; un puesto puede pertenecer a un departamento.
- `POST/GET /employees`: registra y consulta empleados vinculados a una cuenta activa y una membresía de la empresa. El alta puede asociar `branchId` y `positionId`.
- `POST/GET /contracts`: crea y consulta contratos. La lectura requiere `hr.compensation.read` porque expone salarios; HR y administradores reciben este permiso, MANAGER no.
- `POST/GET /attendance`: registra y consulta asistencia diaria. Se rechazan registros duplicados por empleado/fecha y una salida anterior a la entrada.
- `POST/GET /leaves`: crea solicitudes siempre como `PENDING`; el request no decide su estado. `PATCH /leaves/:leaveId/status` acepta `APPROVED` o `REJECTED`, registra quién resolvió y cuándo, y rechaza decisiones repetidas o autoaprobación.
- `POST/GET /employees/:employeeId/documents`: registra y consulta metadata de documentos, con tipo, clave de almacenamiento, content type, tamaño y vencimiento opcional. El binario se almacena externamente; esta API no lo carga.

La nómina permanece fuera de este módulo y no se genera desde los contratos. Las dependencias entre usuario, departamento, puesto, empleado y sucursal se validan en el servicio; índices únicos cubren códigos, correo y cuenta por empresa.

## Validación

La prueba `hr.integration.test.ts` usa MongoDB replica set para cubrir pertenencia, filtrado por sucursal, relación con departamento/puesto, contrato, asistencia, documentos, aprobación de permisos y rechazo de autoaprobación.
