# Report Components

Componentes Vue del area de reportes.

## Archivos principales

- `ReportExecutionModal.vue`: ejecuta reportes, muestra preview y dispara exportaciones. La vista previa usa el modelo comun de render de reportes para compartir con PDF/Excel los mismos titulos, datos generales, metricas, activos, columnas y filas base. Usa formato de hoja corporativa con logo, datos generales, resumen, mapa, graficos y tabla; diferencia el modo `PDF` compacto del modo `Excel` completo antes de descargar. El preview de mapa soporta viajes y detenciones.
- `ReportTemplateModal.vue`: crea y modifica plantillas con un flujo guiado:
  `Tipo`, `Datos`, `Eventos`, `Vista`, `Exportacion` y `Resumen`. El tipo de
  reporte aplica presets recomendados de reglas, columnas, widgets,
  comportamiento y exportacion; despues cada parte puede ajustarse sin tocar
  codigo. Las opciones avanzadas de comportamiento viven en `Eventos` para no
  mezclar configuracion especial con la vista. `Vista` define filtros
  disponibles, bloques visibles y columnas del reporte; usa el mismo modelo de
  render que ejecucion/exportacion para resolver columnas y valores de ejemplo.
  `Exportacion` define descargas disponibles y mapas incrustados en pantalla,
  PDF o Excel; debe verse como una mini vista de ejecucion del reporte, usando
  la hoja corporativa con logo, datos generales, resumen, mapa, graficos, tabla
  y salidas habilitadas. La opcion visual de mapa aplica a viajes y detenciones.
  Las tablas de vista previa, ejecucion y exportacion deben respetar el mismo
  criterio de columnas de `assetReportRenderModelUtils.js`: `PDF` muestra el
  informe paginado compacto, con tabla principal legible y, si faltan columnas,
  una seccion `Detalle adicional` dentro del mismo PDF. `Excel` debe abrir en
  una hoja principal visual con la misma lectura del preview y dejar el detalle completo en hojas
  auxiliares (`Detalle GPS`, `Activos` y `Datos reporte` cuando corresponda).
  `Resumen` es solo revision final: debe mostrar nombre,
  descripcion, estado y cards agrupadas de `Datos generales`, `Eventos`,
  `Filtros`, `Visualizacion`, `Columnas visibles` y `Exportacion`, con icono,
  conteo y chips compactos. No debe agregar nuevas opciones de configuracion ni
  paneles laterales pesados.
  El modal debe ser responsive: pantalla completa en movil, usar todo el ancho
  disponible en escritorio, pasos con scroll horizontal cuando no caben,
  formularios en una columna y division configuracion/vista previa solo en
  escritorio ancho.
- En reportes de geocercas, la regla `Geocercas` debe tener columnas propias
  para la sesion: `Hora entrada`, `Hora salida`, `Geocerca`, `Evento`,
  `Duracion` y `Direccion`. Si se agregan nuevas condiciones a la regla,
  revisar que tambien existan columnas configurables equivalentes para que el
  usuario pueda mostrar esos datos sin tocar codigo.
- `ReportEventRulesModal.vue`: administra reglas de evento. El formulario interno se carga async y se monta solo cuando se crea o edita una regla.
- `ReportEventRuleFormModal.vue`: modal de regla de evento; orquesta UI, guardado, eliminacion y auditoria. El estado editable vive en `../../composables/reports/useReportEventRuleFormDraft.js`.
- `ReportSchedulesModal.vue`: lista y administra programaciones visuales. El formulario interno se carga async y se monta solo cuando se crea o edita una programacion.
- `ReportScheduleFormModal.vue`: formulario de programacion.
- `event-rules/`: secciones internas del formulario de reglas.

## Regla de mantenimiento

Estos archivos deberian quedarse enfocados en UI y eventos. El estado Vue debe vivir en `../../composables/reports` y la logica pura en `../../utils/reports`.

La busqueda de la biblioteca en `ReportsView.vue` usa `useDebouncedValue` antes de llamar a `filterReportsViewRows`. Mantener ese patron para que plantillas, reglas y paginacion no se recalculen en cada tecla.

`ReportsView.vue` debe mantenerse como una biblioteca de reportes: cabecera
simple, busqueda y acciones arriba, tabs `Todos/Creados/Base`, filtros de
categoria y orden, vista por tarjetas como modo principal y lista como modo
secundario. Las cards muestran tipo, categoria, nombre, descripcion, resumen de
eventos, estado y acciones `Editar`/`Ejecutar` sin quitar los modales existentes
de reglas, programados o creacion. La configuracion detallada se modifica desde
el modal de creacion/edicion, no en paneles secundarios dentro de la biblioteca.
La ejecucion debe abrir `ReportExecutionModal` igual que en Fleet, usando solo
activos autorizados por `useAccessControl`, geocercas de la empresa actual y las
reglas asociadas a la plantilla.
Para aprovechar el espacio libre, mostrar mas reportes por pagina antes que
agrandar las tarjetas, manteniendo la paginacion visible aunque solo exista una
pagina. La grilla de cards debe mantenerse compacta, con
`content-start` y altura natural. No volver a forzar `h-full`, `grid-rows-*` o
estiramiento vertical para llenar el panel, porque las tarjetas quedan gigantes
y con aire muerto. Si el viewport no permite mostrar todas las cards, se acepta
scroll normal antes que aplastar eventos, estado o accion.

Los modales de reportes se cargan con `defineAsyncComponent` desde
`ReportsView.vue` y `FleetReportsPanel.vue`, pero no se precargan por defecto.
Al agregar un modal nuevo de reportes, mantenerlo bajo demanda si incluye
preview, graficos, mapas, ejecucion o exportacion para que abrir Reportes o la
pestana de Reportes en Activos no descargue trabajo que aun no se ha usado.

El flujo de creacion/edicion de plantillas debe mantenerse como configurador
guiado. No volver a juntar reglas, columnas, widgets, exportacion y
comportamiento en un solo panel, porque eso hace que el usuario normal vea
demasiadas opciones a la vez. Si se agrega una capacidad nueva de reporte,
ubicarla en el paso conceptual correcto y actualizar
`REPORT_TEMPLATE_MODAL_STEPS` si aparece una etapa real nueva. Evitar usar
`Salida` como etiqueta visible de este paso, porque se confunde con cierre de
sesion o resultado del reporte; usar `Exportacion`. Mantener `Resumen` como una
pantalla de confirmacion compacta estilo revision final: encabezado simple,
estado visible, navegacion por pasos con subrayado activo y cards de resumen en
dos columnas. Evitar KPIs redundantes o paneles laterales que compitan con la
revision.

La vista previa del paso `Exportacion` debe diferenciar claramente `PDF` y
`Excel`. No volver a usar una sola hoja comun para ambos formatos: PDF prioriza
lectura paginada y recorte compacto de columnas; Excel prioriza una primera
hoja tipo informe, vista previa a ancho completo y hojas auxiliares con el
detalle completo para analisis. La ejecucion del reporte debe mantener la misma
separacion visual mediante selector `PDF`/`Excel`: PDF muestra las columnas que
caben y avisa el detalle adicional; Excel muestra todas las columnas y usa el
ancho completo. El boton principal de exportacion debe descargar el formato
activo en la vista previa, no mostrar acciones separadas que dupliquen el
selector.
