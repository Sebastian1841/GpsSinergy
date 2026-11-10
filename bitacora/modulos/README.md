# Registros Por Modulo

## Revision Integral

[Auditoria frontend 2026-11-04](auditoria-integral-frontend-2026-11-04.md):
cobertura por area, nueve hallazgos priorizados, reproducciones, comprobaciones
y limites de validacion. No representa correcciones ni certificacion de produccion.

## Estado Actual

| Tema | Documentacion junto al codigo |
| --- | --- |
| Limites, Etiquetas y Ajustes avanzados | [Vistas](../../frontend/src/views/README.md) y [utilidades de configuracion](../../frontend/src/utils/layout/README.md) |
| Variables calculadas | [Componentes y flujo del editor](../../frontend/src/components/configuration/README.md) |
| Alertas y reglas | [Componentes](../../frontend/src/components/alarms/README.md) y [persistencia](../../frontend/src/services/alarms/README.md) |
| Sidebar y navegacion | [Layout](../../frontend/src/components/Layout/README.md) |
| Mantenciones y Conductores | [Componentes](../../frontend/src/components/maintenance/README.md) |
| Auditoria | [Componentes](../../frontend/src/components/audit/README.md) y [servicio](../../frontend/src/services/audit/README.md) |
| Reportes | [Componentes](../../frontend/src/components/reports/README.md) |

## Antecedentes Historicos

- `modularizacion.md`: separaciones y responsabilidades registradas previamente.
- `mantenciones-y-rendimiento.md`: recuperacion retrospectiva al 2026-10-13 de
  planes, OT, historial, analisis, exportaciones y optimizaciones compartidas.

Las fechas de recuperacion documental no deben atribuirse a cada cambio anterior.
Agregar un resumen en ../bitacora.md cuando se actualiza una ficha de modulo.

La recuperacion de Mantenciones no incluye Conductores ni cambios posteriores
al corte. Su [entrega a produccion](../produccion/mantenciones-2026-10-13.md)
comparte ese limite. Las siguientes candidatas de modularizacion son propuestas
de la fecha registrada, no deudas verificadas hoy.

Consultar tambien [referencias visuales](../referencias/README.md),
[pendientes generales](../CAMBIOS_PENDIENTES.md) e [historial](../bitacora.md).
