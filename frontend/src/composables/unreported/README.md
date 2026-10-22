# Unreported Composables

`useUnreportedHistoryPresentation.js` prepara resumenes solo para episodios de la
pagina visible. Reutiliza formateadores de Chile y conserva los calculos mientras
no cambia esa pagina. Cada fila tiene llamadas computed: se leen al abrir el
desplegable y se invalidan al cambiar consultas. No precarga llamadas cerradas.
Cambiar pagina u orden crea filas cerradas; permite varios casos abiertos.
Su prueba comprueba carga diferida, cache, actualizacion y aislamiento por episodio.

`useUnreportedPagination.js` calcula paginas y filas visibles a partir de
la lista filtrada. Inicia con 5 filas y permite 5/10/20/50, reinicia pagina al cambiar filtros
o tamano y corrige la pagina si disminuye la cantidad de resultados.
`useUnreportedPagination.test.js` valida esos contratos.
La exportacion recibe la lista filtrada completa, no solo la pagina visible.
# Primer Reporte (2026-10-19)

Presentacion de casos first_report muestra Sin reporte previo / Inicio desconocido,
sin formatear null como 1970. Diagnostico distingue primer reporte de falla conocida.
