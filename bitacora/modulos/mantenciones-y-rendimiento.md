# Mantenciones Y Rendimiento

Actualizacion retrospectiva registrada el 2026-10-13. Describe cambios
verificables en el codigo y el flujo vigente; esta fecha no se atribuye a cada
implementacion anterior. No reemplaza las entradas historicas existentes.

## Objetivo

Recuperar documentacion omitida durante las iteraciones de mantenciones,
exportaciones e historial, y dejar claros los ajustes de rendimiento comunes.

## Mantenciones

- Navegacion vigente: Flota, Analisis y Ordenes. Flota usa MaintenanceFleetTab;
  el componente Overview anterior ya fue retirado. Componentes antiguos de
  calendario/historial siguen presentes sin ser pestanas principales.
- Tablas con orden por encabezados, paginacion y scroll interno; los avisos de
  operaciones se retiran despues de un intervalo. El detalle mantiene tamano
  exterior al alternar planes e historial.
- Crear y editar planes comparten formulario. Los tipos admiten solo Odometro,
  Horometro y Tiempo; registros legacy de Valor manual se migran preservando
  identidad, OT y evidencias, con configuracion pendiente cuando corresponde.
- Cerrar una OT conserva la ejecucion en el historial y propone el siguiente
  ciclo del plan vinculado. Sin renovar es un estado y filtro explicito.
  Renovar solicita confirmacion y permite editar antes; no elimina la OT cerrada.
- El catalogo de tipos tiene busqueda, filtros de criterio/origen, orden y
  paginacion; iconos reloj, medidor y reloj de arena identifican los criterios.
- Historial por vehiculo con ejecuciones finalizadas, filtros de mantencion y
  fechas, lectura, responsable, costos y acceso a la OT concreta.
- En Historial, Exportar historial reemplaza los botones de agregar plan/tipo
  del encabezado. Descarga directa Excel/PDF mediante menu, sin otro modal.
  El pie del detalle solo muestra Cerrar; no lleva al listado general de OT.
- Los fixtures siguen habilitados y completan aproximadamente 10 vehiculos
  si hay menos; no equivalen a una eliminacion de activos persistidos.

## Analisis

- Costos y composicion usan ejecuciones finalizadas con cierre y costos reales.
- Cumplimiento compara cierre con fecha limite dentro del periodo. Los activos
  sin ejecuciones medibles se excluyen del ranking; 0% con casos medibles no es
  equivalente a ausencia de datos.
- Proyeccion y vencimientos usan planes actuales; no se confunden con conteos
  de ejecuciones historicas. Los tooltips detallan porcentajes y montos.
- Indices y agregaciones compartidas reducen recorridos repetidos por grafico.

## Exportaciones

- Flota abre modal con seleccion de vehiculos y filtros de planes. El reporte
  incluye solo la interseccion seleccionada/filtrada, con filtros coincidentes
  en el mismo plan; no todas las mantenciones del vehiculo por accidente.
- Excel de flota incluye Reporte agrupado, Resumen, Vehiculos y Planes.
  Logo, titulo, generado, bandas por activo, estados y columnas numericas.
- PDF horizontal agrupado por vehiculo, con cabeceras repetidas y bloques
  compactos que comparten pagina cuando caben.
- Historial exporta todas las filas filtradas, no solo la pagina visible.
  Excel con encabezado corporativo, margenes iguales y espacio interior entre
  costos/fechas; PDF con texto blanco sobre azul en los encabezados repetidos.
- Fechas ISO de cierre se muestran legibles en America/Santiago. reportWidthPx
  aproxima el ancho del Excel al generarlo; no hace responsive a Excel.
- Bibliotecas pesadas de PDF/Excel se importan al solicitar descarga.

## Persistencia Y Rendimiento

- Mantenciones: localStorage por secciones versionadas y manifiesto atomico;
  escrituras agrupadas, migracion de snapshot anterior y conservacion ante fallo.
- Adjuntos: IndexedDB, metadatos en el estado, migracion de base64 y limpieza
  de temporales solo cuando no quedan referencias.
- Base mock compartida: colecciones versionadas, guardado solo de colecciones
  marcadas por la accion y reintento sin perder snapshot anterior. Un watcher
  dedicado cubre accesos anidados del editor de permisos.
- Indices de planes y OT abiertas evitan busquedas completas por fila.
- Busqueda global: detiene el modo general a 36 coincidencias; por tipo solo
  evalua la fuente relevante y mantiene todas sus coincidencias.
- Alcance por etiquetas: reutiliza Set normalizado sin reconstruccion por activo.
- Sin reportar: paginacion 10/20/50 y exportacion real Excel de la lista filtrada.
- Itinerarios: fachada de exportacion con modelo compartido y servicios PDF y
  Excel separados. La separacion no se presenta como un backend nuevo.

## Archivos Y Documentacion

Las responsabilidades estan detalladas en los README locales de:

- frontend/src/components/maintenance y components/icons
- frontend/src/composables/maintenance, search, auth, mock y unreported
- frontend/src/services/maintenance, storage, itinerarios y unreported
- frontend/src/utils/maintenance y utils/users
- frontend/src/fixtures, components/unreported y views

Tambien se actualizaron los indices generales y los flujos/archivos criticos
de frontend/docs. Los README existentes de otros dominios se conservaron al
no encontrar contradicciones en esta revision; no se borran cambios del usuario.

## Validacion Del 2026-10-13

- npm test: 252 pruebas correctas, cero fallos.
- npm run build: correcto; aviso informativo sobre tiempos de plugins de Vite.
- Revision documental de nombres de archivos y cobertura de README en carpetas
  de codigo. No se ejecutaron lint global ni validacion visual en esta pasada.

## Limites Del Prototipo

La plataforma sigue siendo un prototipo local con datos mock. No hay garantia
de respaldo, concurrencia entre usuarios, API de mantenciones ni automatizacion
real de correo/WhatsApp. Build y pruebas no equivalen a revisar visualmente
PDF, Excel y todos los viewports; no se afirma esa validacion.
