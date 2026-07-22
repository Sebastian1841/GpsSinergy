# Report Components

Componentes Vue del area de reportes.

## Archivos principales

- `ReportExecutionModal.vue`: ejecuta reportes, muestra preview y dispara exportaciones.
- `ReportTemplateModal.vue`: crea y modifica plantillas de reportes.
- `ReportEventRulesModal.vue`: administra reglas de evento.
- `ReportEventRuleFormModal.vue`: formulario completo de regla de evento.
- `ReportSchedulesModal.vue`: lista y administra programaciones visuales.
- `ReportScheduleFormModal.vue`: formulario de programacion.
- `event-rules/`: secciones internas del formulario de reglas.

## Regla de mantenimiento

Estos archivos deberian quedarse enfocados en UI y eventos. El estado Vue debe vivir en `../../composables/reports` y la logica pura en `../../utils/reports`.
