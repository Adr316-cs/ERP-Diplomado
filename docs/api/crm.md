# CRM

Las rutas viven bajo `/api/v1/companies/:companyId/crm`, requieren autenticación, membresía de tenant, permiso CRM y respetan las sucursales autorizadas.

## Flujo comercial

1. `POST/GET /leads` registra y consulta prospectos asignados a usuarios de la empresa. `POST /leads/:id/qualify` mueve `NEW` a `QUALIFIED`; `POST /leads/:id/lost` cierra leads no convertidos.
2. `POST /opportunities` enlaza una oportunidad con un cliente o con un lead calificado. Las oportunidades avanzan desde `QUALIFIED` al generar propuesta y luego pueden cerrarse como `LOST`.
3. `POST /opportunities/:id/quote` genera una cotización de ventas con los precios y los impuestos del catálogo. Si parte de un lead, convierte lead a cliente y crea el contacto principal en la misma transacción MongoDB que la cotización y el vínculo a la oportunidad.
4. Tras aceptar la cotización, Ventas genera el pedido, lo aprueba y entrega. La oportunidad solo admite cierre `WON` cuando el pedido basado en su cotización consta como entregado.

## Contactos y actividad

- `POST/GET /contacts`: crea y consulta contactos vinculados a clientes activos de la misma empresa.
- `POST/GET /activities`: registra notas o seguimientos `CALL`, `EMAIL`, `MEETING` y `NOTE` con cliente o lead, y vínculo opcional a su oportunidad.
- `POST/GET /interactions`: registra interacciones `CALL`, `EMAIL`, `MEETING`, `MESSAGE` u `OTHER`, con asunto, resumen y fecha.
- `GET /customers/:customerId/history`: combina contactos, actividades, interacciones, oportunidades y ventas; también recupera actividades históricas ligadas al lead que se convirtió en ese cliente.

Los IDs relacionados se validan contra empresa, sucursal y entidad objetivo. Los usuarios asignados deben pertenecer a la empresa y, cuando se especifica, a la sucursal.

## Validación

La integración con MongoDB replica set cubre calificación, oportunidad, conversión a cliente, cotización, entrega y consulta de historial. La última ejecución global pasó typecheck, lint, build y las 63 pruebas; se incluye la integración CRM end-to-end.
