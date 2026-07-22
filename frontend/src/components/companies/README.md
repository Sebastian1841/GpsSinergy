# Company Components

Componentes para administracion de empresas.

## Archivos

- `CompanyCatalog.vue`: listado o catalogo de empresas.
- `CompanyConfigPanel.vue`: panel de configuracion de empresa.
- `CompanyEditorModal.vue`: modal de creacion y edicion.
- `CompanyFiltersBar.vue`: filtros del listado.
- `CompanyManagementHeader.vue`: encabezado del modulo.
- `CompanyReportPanel.vue`: panel de reportes asociados a empresa.

## Regla de mantenimiento

La UI de empresas debe delegar estado y persistencia en `composables/companies` y `services/companies`.
