# Report View Helpers

Helpers especificos de pantallas y modales.

## Archivos

- `reportsViewUtils.js`: filas, filtros, categorias, ordenamiento, resumen de
  configuracion y estadisticas de la vista de reportes.
- `reportExecutionModalUtils.js`: limites, mensajes y resumen del modal de ejecucion.
- `reportTemplateModalConfig.js`: presets visuales, pasos del configurador de
  plantillas y composicion recomendada para reportes de viaje.

## Criterio

Esta carpeta puede contener helpers ligados a una vista concreta. Si el helper se vuelve reutilizable, moverlo a la subcarpeta correspondiente de `utils/reports`.

La biblioteca de reportes filtra por tipo (`Todos`, `Creados`, `Base`),
categoria, busqueda debounced y orden visual. Mantener esa logica en
`reportsViewUtils.js` para que `ReportsView.vue` solo orqueste estado de UI,
paginacion y apertura de modales.

La pagina visible usa `REPORTS_VIEW_PAGE_SIZE` para controlar cuantas cards se
muestran antes de paginar. Mantener ese valor como ajuste de densidad visual de
la biblioteca; no agregar paneles de detalle si el objetivo es solo ocupar
espacio libre. La configuracion editable completa debe seguir viviendo en el
modal de creacion/modificacion.

La ejecucion desde `ReportsView.vue` no debe duplicar logica de Fleet. La vista
solo prepara la plantilla seleccionada con sus `eventRuleIds`, valida que este
activa y abre `ReportExecutionModal` con activos ya autorizados, geocercas y
reglas disponibles. El filtrado fino de activos, fechas, grupos y exportacion
sigue viviendo en `useAssetReportExecution.js` y el modal de ejecucion.

`REPORT_TEMPLATE_MODAL_STEPS` define el orden del flujo de creacion/edicion:
`Tipo -> Datos -> Eventos -> Vista -> Exportacion -> Resumen`. Ese orden separa
datos generales, reglas que componen el reporte, configuracion visual,
descargas/mapa y revision final. Si se cambia el nombre de un paso, actualizar
tambien las condiciones `activeStep` de `ReportTemplateModal.vue`.

En el modal de plantillas, `Vista` no descarga ni ejecuta el reporte: define que
bloques y columnas se mostraran al generar. `Exportacion` no cambia los datos:
define que botones de descarga y que imagenes de mapa quedan disponibles al
ejecutar o exportar. Evitar volver a nombrar ese paso como `Salida`, porque no
describe bien la accion para el usuario.

El preview de `Exportacion` debe representar formatos distintos mediante
`assetReportRenderModelUtils.js`. PDF usa el corte compacto del modelo comun y
avisa si habra `Detalle adicional`; Excel simula la hoja visual `Reporte` y deja
claro que el detalle completo queda disponible en hojas auxiliares.

`Resumen` debe mantenerse como confirmacion final, no como otro panel de
edicion. Debe resumir nombre, descripcion, estado, tipo, eventos, vista y
exportacion con conteos claros para que el usuario entienda que va a guardar sin
volver a leer todos los pasos completos.
