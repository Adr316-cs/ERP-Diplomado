# ADR-0001: Arquitectura inicial del ERP

- Estado: aceptada como propuesta para la Fase 1
- Fecha: 2026-09-23

## Contexto

El workspace no contiene código ni configuración. El sistema debe soportar
clientes web y móviles, una API REST segura y dominios ERP multiempresa sin
introducir complejidad distribuida prematuramente.

## Decisión

Usar un monorepo con npm workspaces, una API modular Express/TypeScript en
`apps/api`, clientes React Native/React Native Web separados en `apps/mobile` y
`apps/web`, y paquetes TypeScript compartidos en `packages/`. MongoDB Atlas será
accedido únicamente por la API mediante Mongoose.

## Motivos

- Mantiene contratos y validaciones compartidos sin duplicar código.
- Permite separar los ciclos de despliegue de API, web y mobile.
- Conserva límites por dominio sin el coste operativo de microservicios.
- Se ajusta al stack solicitado y al tamaño inicial del proyecto.

## Consecuencias

- Será necesario aplicar reglas de dependencias entre workspaces.
- Algunas pantallas no se compartirán si las necesidades móvil y web difieren.
- La versión de Node deberá alinearse con las versiones soportadas por Expo y React Native.
- La escalabilidad futura podrá extraer servicios solo cuando exista evidencia operativa.

## Alternativas descartadas por ahora

- Microservicios: complejidad prematura para un workspace vacío.
- GraphQL: no es necesario para la API REST versionada requerida.
- Acceso directo del frontend a MongoDB: rechazado por seguridad y control de negocio.