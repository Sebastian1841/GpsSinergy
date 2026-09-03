# Company Composables

Estado del modulo de empresas.

## Archivos

- `useCompanyManagement.js`: estado y acciones de administracion de empresas.
  Centraliza busqueda, filtro por estado, paginacion del directorio, empresa
  seleccionada, KPIs superiores y modales de creacion/edicion.

## Flujo actual

`CompanyManagementView.vue` consume este composable y reparte su estado entre:

- header: `searchTerm`, `selectedStatus` y `summaryItems`;
- catalogo: `visibleCompanies`, `selectedCompanyId`, paginacion y
  `getCompanyHealth`;
- modales/paneles: `draftCompany`, `editorMode` y acciones de configuracion.

Los KPIs de empresas priorizan estados reales del catalogo (`all`, `active`,
`pending`, `inactive`, `internal`) y activos totales. No deben convertirse en
logica de negocio duplicada dentro de componentes visuales.

La organizacion de flota por grupos de vehiculos no se maneja en Empresas. Ese
flujo vive en el header de Activos y siempre trabaja sobre activos autorizados.

## Regla de mantenimiento

Mantener aqui coordinacion de UI y estado. Persistencia y adaptadores deben vivir en `services/companies`.
