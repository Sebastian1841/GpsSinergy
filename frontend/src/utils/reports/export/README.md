# Report Export

Exportacion y recursos visuales de reportes.

## Archivos

- `assetReportExportUtils.js`: orquesta PDF y Excel. Usa `../execution/assetReportRenderModelUtils.js` para compartir con la vista previa la preparacion de filas, activos, metricas, titulos y columnas; el PDF usa el estilo corporativo vertical y detenciones marca `pdfLayout: "stops-operational"` para ajustar textos y columnas. Excel abre en una hoja `Reporte` con lectura tipo vista previa y mantiene las columnas completas en hojas de datos auxiliares; PDF mantiene una tabla principal compacta y agrega `Detalle adicional` cuando hay mas columnas seleccionadas.
- `assetReportExcelUtils.js`: hojas, estilos y datos de Excel. La hoja `Datos reporte` es la tabla cruda completa para analisis y no reemplaza a la hoja visual `Reporte`. Los encabezados Excel usan fondo blanco, texto azul y separador naranja para que el logo corporativo azul sea legible.
- `reportChartRowUtils.js`: filas para graficos.
- `reportBranding.js`: logo y datos de marca.

## Criterio

Las funciones aqui pueden usar dependencias pesadas de exportacion bajo carga dinamica cuando sea posible.

Los mapas de viajes/detenciones se cachean por contenido para evitar regenerar la misma imagen durante preview, PDF y Excel.
