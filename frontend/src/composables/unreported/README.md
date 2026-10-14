# Unreported Composables

`useUnreportedPagination.js` calcula paginas y filas visibles a partir de
la lista filtrada. Inicia con 5 filas y permite 5/10/20/50, reinicia pagina al cambiar filtros
o tamano y corrige la pagina si disminuye la cantidad de resultados.
`useUnreportedPagination.test.js` valida esos contratos.
La exportacion recibe la lista filtrada completa, no solo la pagina visible.
