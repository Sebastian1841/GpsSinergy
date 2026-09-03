# Audit Components

Componentes visuales del modulo de auditoria.

## Archivos

- `AuditActivityTable.vue`: tabla agrupada de actividad auditada.
- `AuditDetailModal.vue`: modal de detalle de un registro. Se carga async desde
  `AuditView.vue` y se monta con `v-if` solo cuando hay detalle abierto.
- `AuditFilters.vue`: filtros de busqueda, rango de fechas, modulo, accion, estado y exportacion.
- `AuditSummaryHeader.vue`: encabezado con metricas de auditoria.

## Regla de mantenimiento

Los componentes reciben datos y callbacks desde `AuditView.vue` o composables. El registro real de auditoria debe centralizarse en `composables/audit` y `services/audit`.

## Visual

El modulo evita fondos blancos puros para no cansar la vista en tablas largas. La paleta debe mantenerse corporativa: azul `#102372` para encabezados y zonas principales, naranjo `#ff6600` para acciones, acentos y seleccion, y superficies gris/azul claras (`#eef3f8`, `#f2f5f9`, `#f5f7fb`) para contenido denso.

En la tabla de actividad, `Responsable` y `Entidad` deben diferenciarse visualmente. `Entidad` usa separador vertical y acento naranjo para evitar que ambas columnas se lean como una sola.

La zona superior de auditoria sigue el orden `filtros -> KPI -> tabla`. No duplicar el header global dentro de la vista; el contexto principal ya lo entrega `AppHeader.vue`. `AuditFilters.vue` usa controles tipo tarjeta compacta con icono, etiqueta y valor para busqueda, rango de fechas, modulo, accion y estado. `AuditSummaryHeader.vue` muestra cuatro KPI equivalentes como indicadores minimalistas con punto de color, valor y texto secundario; no debe competir visualmente con la tabla. El KPI activo puede marcarse con borde naranjo cuando aplica un filtro real, pero la tabla de actividad no debe modificarse por cambios en esta zona superior.

Los KPI funcionan tambien como filtros rapidos: `Total` limpia el filtro de KPI, `Correctos` filtra `status: success`, `Fallidos` filtra `status: failed` y `Acciones sensibles` filtra `severity: warning`. Ese KPI no representa alertas operacionales de vehiculos, sino acciones de auditoria que requieren atencion.

Las categorias rapidas de la vista deben usar el mismo criterio visual: evitar
el texto `Alertas` para `severity: warning`, porque puede confundirse con reglas
o alertas operacionales. Usar `Acciones sensibles`.

El filtro por fecha se maneja con campos `Desde` y `Hasta`. `AuditView.vue` interpreta esas fechas en horario local y aplica el rango de forma inclusiva: `Desde` parte a las 00:00:00 y `Hasta` termina a las 23:59:59.999. Al cambiar fecha, busqueda o modulo, la pagina vuelve a la primera.

La barra de busqueda tambien compara contra la fecha del registro. Debe aceptar formatos comunes como `YYYY-MM-DD`, `DD/MM/YYYY`, `DD-MM-YYYY`, fecha larga local y hora visible del registro. Esto es busqueda textual; para un rango exacto se deben usar `Desde` y `Hasta`.

`AuditView.vue` aplica debounce al texto de busqueda antes de filtrar. El input responde inmediato, pero `filteredRecords` espera un margen breve para evitar recalcular paginas, grupos y conteos en cada tecla cuando el historial crece.

Las utilidades usadas por `computed` durante el `setup`, como el parseo de fecha, deben declararse como `function` o estar definidas antes de los `computed`. Evitar `const helper = () => {}` si el helper se usa antes de su declaracion, porque puede romper la carga inicial de la vista.

La tabla no debe renderizar todo el historial de una sola vez. `AuditView.vue` pagina los resultados filtrados en bloques de 150 registros y `AuditActivityTable.vue` muestra controles `Anterior`/`Siguiente`. Los filtros, KPI y exportacion CSV siguen trabajando sobre el total filtrado, no solo sobre la pagina visible.

El modal de detalle debe mantenerse como ficha simple de auditoria: accion y descripcion en el encabezado, resumen principal en filas claras y datos tecnicos al final. El diseno puede reforzarse con header azul corporativo, barras de seccion y boton naranjo, pero no debe usar una franja superior naranjo ni alterar ese orden.

Las acciones de grupos de geocercas deben mostrarse con etiquetas humanas:
creacion, renombrado y eliminacion de grupo, evitando exponer codigos como
`geofence-group:rename` en la tabla o en el detalle.
