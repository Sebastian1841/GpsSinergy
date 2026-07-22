# Audit Components

Componentes visuales del modulo de auditoria.

## Archivos

- `AuditActivityTable.vue`: tabla agrupada de actividad auditada.
- `AuditDetailModal.vue`: modal de detalle de un registro.
- `AuditFilters.vue`: filtros de busqueda, modulo, estado y exportacion.
- `AuditSummaryHeader.vue`: encabezado con metricas de auditoria.

## Regla de mantenimiento

Los componentes reciben datos y callbacks desde `AuditView.vue` o composables. El registro real de auditoria debe centralizarse en `composables/audit` y `services/audit`.
