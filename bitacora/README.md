# Bitacora

Punto de entrada al trabajo registrado. No necesitas leer toda la cronologia
para encontrar los cambios utiles para produccion.

**Documento principal de traspaso:** [Resumen de cambios frontend](CAMBIOS_PENDIENTES.md).
Consolida los resultados por modulo, puntos de entrada, dependencias,
paquetes de incorporacion y criterios de aceptacion. Los demas archivos
son antecedentes; no hace falta unirlos manualmente para preparar la entrega.

## Por Donde Empezar

| Necesidad | Consultar |
| --- | --- |
| Revisar propuestas aun no implementadas | [Ideas pendientes](IDEAS_PENDIENTES.md) |
| Elegir que llevar a produccion | [Cambios pendientes](CAMBIOS_PENDIENTES.md) |
| Consultar la revision integral y sus limites | [Auditoria frontend 2026-11-04](modulos/auditoria-integral-frontend-2026-11-04.md) |
| Buscar informacion de un modulo | [Indice por modulo](modulos/README.md) |
| Revisar decisiones e iteraciones | [Historial](bitacora.md) |
| Revisar una entrega especifica | [Produccion](produccion/README.md) |
| Consultar criterios visuales | [Referencias](referencias/README.md) |

El estado vigente se documenta junto al codigo. El historial incluye pruebas y
reversiones, no solo funcionalidades que siguen activas. Los inventarios son
capturas: no se actualizan automaticamente ni certifican un despliegue.

## Archivos

- `bitacora.md`: registro cronologico principal. Lo mas reciente queda arriba.
- `CAMBIOS_PENDIENTES.md`: inventario del ultimo estado remoto conocido y resumen
  de casos utiles para produccion, integraciones necesarias y exclusiones.
- `referencias/diseno-operacion-administracion.md`: patrones visuales observados
  y criterios compartidos; no una certificacion funcional.
- `produccion/mantenciones-2026-10-13.md`: entrega historica de mantenciones,
  anterior a Conductores; incluye archivos, limites mock y requisitos de integracion.
- `modulos/modularizacion.md`: detalle de separaciones de archivos grandes y
  responsabilidades resultantes.
- `modulos/mantenciones-y-rendimiento.md`: recuperacion retrospectiva del flujo
  de planes/OT, analisis, historial, exportaciones y optimizaciones compartidas.

## Como usarla

Cada entrada nueva debe explicar:

- que se hizo;
- por que se hizo;
- en que archivos se hizo;
- como se valido.

Cuando un cambio sea grande o abarque varias pasadas, mantener la entrada corta
en `bitacora.md` y documentar el detalle en un archivo dentro de `modulos/`.

Las entregas concretas van en `produccion/` con fecha de corte y alcance.
Los criterios compartidos van en `referencias/`. Evitar duplicar la cronologia
en cada ficha; enlazar los antecedentes y actualizar los indices al mover archivos.

Los README de las carpetas de codigo deben actualizarse en el mismo cambio:
responsabilidades, flujo vigente, permisos, pruebas y limitaciones. La bitacora
no los reemplaza. No copiar iteraciones descartadas a un README como si siguieran
activas; usar la bitacora para conservar ese historial de decisiones.
