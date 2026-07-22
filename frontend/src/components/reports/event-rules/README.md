# Event Rule Form Sections

Secciones pequenas usadas por `ReportEventRuleFormModal.vue`.

## Archivos

- `ReportEventRuleGeneralSection.vue`: datos base de la regla.
- `ReportEventRuleModuleNav.vue`: navegacion por modulo/tipo.
- `ReportEventRuleScopeSection.vue`: alcance operativo.
- `ReportEventRuleExpressionsSection.vue`: listado de condiciones.
- `ReportEventRuleExpressionCard.vue`: tarjeta de una condicion.
- `ReportEventRuleScriptConsole.vue`: vista de expresion/script.
- `ReportEventRuleCalendarSection.vue`: calendario y horario.
- `ReportEventRuleActivationSection.vue`: activacion y estado.
- `ReportEventRuleNotificationsSection.vue`: canales de aviso.
- `ReportEventRuleFormFooter.vue`: acciones finales del formulario.

## Criterio

Cada componente controla solo su bloque visual. Las listas, labels y normalizaciones se mantienen en `../../../utils/reports/event-rules`.
