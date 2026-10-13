# Unreported Composables

`useUnreportedPagination.js` calcula paginas y filas visibles a partir de
la lista filtrada. Permite 10/20/50 filas, reinicia pagina al cambiar filtros
o tamano y corrige la pagina si disminuye la cantidad de resultados.
`useUnreportedPagination.test.js` valida esos contratos.
La exportacion recibe la lista filtrada completa, no solo la pagina visible.
