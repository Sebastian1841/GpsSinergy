# Company Composables

Estado del modulo de empresas.

## Archivos

- `useCompanyManagement.js`: estado y acciones de administracion de empresas.
  Centraliza busqueda, filtros laterales, opciones de region/ciudad,
  ordenamiento, cambio de vista, paginacion, empresa seleccionada, KPIs
  superiores y modales de creacion/edicion.

## Flujo actual

`CompanyManagementView.vue` consume este composable y reparte su estado entre:

- header: accion de creacion de empresa;
- filtros laterales: `searchTerm`, `selectedStatus`, `selectedRegion`,
  `selectedCity`, `regionOptions`, `cityOptions` y `summaryItems`;
- resumen superior: `summaryItems`;
- catalogo: `paginatedCompanies`, `filteredCompanies`, `selectedCompanyId`,
  `sortKey`, `sortDirection`, `viewMode`, `currentPage`, `pageSize` y
  `totalPages`;
- modales/paneles: `draftCompany`, `editorMode` y acciones de configuracion.

Los KPIs de empresas priorizan estados reales del catalogo (`all`, `active`,
`pending`, `inactive`, `internal`) y activos totales. No deben convertirse en
logica de negocio duplicada dentro de componentes visuales.

El filtro visual `Inactivas` incluye empresas con estado `inactive` e
`internal`. Esto permite mantener simple el panel lateral sin perder el badge
`Interna` en la tabla.

El catalogo usa paginacion por pagina y no el patron anterior de `Mostrar mas`.
Cuando cambia busqueda, estado, region, ciudad u ordenamiento, la pagina vuelve
a `1` para evitar resultados vacios por quedar parado en una pagina anterior.

La organizacion de flota por grupos de vehiculos no se maneja en Empresas. Ese
flujo vive en el header de Activos y siempre trabaja sobre activos autorizados.

## Regla de mantenimiento

Mantener aqui coordinacion de UI y estado. Persistencia y adaptadores deben vivir en `services/companies`.
