# Fleet Components

Componentes de la vista de flota dentro de activos.

## Archivos

- `AddActivoModal.vue`: modal para crear un activo. Muestra el perfil
  operativo calculado por tipo de vehiculo con reportes y KPIs sugeridos.
- `FleetAssetTagModal.vue`: modal para crear o editar etiquetas de activos.
  Permite buscar activos, filtrar todos/seleccionados/no seleccionados,
  seleccionar por pagina y guardar la etiqueta con los activos asociados.
- `FleetAssetTagsPanel.vue`: panel de administracion de etiquetas de activos.
  Lista etiquetas, calcula cuantos activos tiene cada una, pagina resultados y
  emite acciones de crear, actualizar o eliminar sin persistir directamente.
- `FleetContextMenu.vue`: menu contextual de acciones sobre activos. Incluye
  accesos a editar, terminal, mantenciones, eliminacion, `Mostrar resumen
diario (solo este)`, `Agregar a resumen diario` y `Mostrar itinerario`. Los
  resumenes e itinerarios usan rangos rapidos desde el mismo menu contextual.
  `Agregar a resumen diario` depende de `hasActiveDailySummary`: se muestra solo
  cuando ya existe un resumen diario iniciado para sumar otro activo al mismo
  contexto.
- `FleetEditModal.vue`: modal para editar un activo existente. Mantiene visible
  el perfil operativo que se recalcula al cambiar el tipo de activo.
- `FleetGeofencePanel.vue`: panel de geocercas asociadas a flota. Permite
  importar y exportar geocercas en KML, KMZ, GeoJSON, CSV y XML usando
  utilidades puras de `utils/geofenceImportExportUtils.js`. Es el unico punto
  visual donde se crean y eliminan grupos de geocercas; el editor del mapa solo
  consume esos grupos mediante dropdown o deja la geocerca `Sin grupo`. Ordena
  la seccion con una tarjeta superior de acciones, una busqueda propia debajo de
  esa tarjeta y el listado principal. El control `Usar geocerca como direccion`
  queda como fila compacta con switch dentro de la tarjeta superior para activar
  o desactivar el uso de la geocerca/grupo como referencia de direccion del
  activo. La creacion, renombrado y eliminacion de
  grupos vive en un modal compacto: campo de nombre, boton crear y listado de
  grupos existentes con acciones por fila. El filtro por grupo queda en el
  encabezado del listado para no mezclar creacion con busqueda. El intercambio
  de archivos vive en su propio modal con modulos internos `Exportar` e
  `Importar`, mostrando una accion a la vez: la exportacion permite elegir uno,
  varios o todos los grupos visibles antes de generar el archivo, y la
  importacion muestra barra de progreso con mensaje de exito/error cuando
  termina la carga. La
  lista muestra el filtro activo, agrupa por `groupName`, permite
  ordenar por nombre/grupo/tipo, conserva grupos vacios creados por el usuario
  y permite plegar o expandir grupos para revisar importaciones grandes sin
  mezclar todas las zonas. La seleccion multiple no aparece por defecto: se
  activa desde `Eliminar varias` y recien ahi muestra checks, contador, limpieza
  y eliminacion confirmada. El boton `Nueva geocerca` solo orienta al usuario
  hacia las herramientas reales del mapa para no duplicar el flujo de dibujo.
- `FleetListPanel.vue`: contenedor principal del listado lateral de activos.
  Abre el menu contextual si el usuario puede administrar activos o ver
  itinerarios o mantenciones, recibe el estado del resumen diario activo desde
  `ActivosView.vue` y delega la accion seleccionada a la vista. Su coordinacion
  interna de secciones, busqueda y geocercas vive en composables de
  `composables/activos/fleet`. Tambien entrega las geocercas a la tabla de
  activos para que el switch `Usar geocerca como direccion` pueda reemplazar la
  columna `Direccion` por el grupo o nombre de la zona donde esta el vehiculo.
  Aplica `fleet-readable` para subir levemente la escala de textos pequenos del
  panel sin cambiar la densidad general de la vista.
- `FleetPanelHeader.vue`: cabecera del panel de flota.
- `FleetReportsPanel.vue`: panel de reportes relacionados con flota. Destaca y
  ordena primero los reportes recomendados por el perfil operativo de los
  activos visibles sin ocultar el resto del catalogo. Sus modales de ejecutar,
  crear/editar, reglas y programaciones se cargan async y se precargan en reposo
  para que la pestana de reportes no bloquee la interaccion inicial.
- `FleetSectionContent.vue`: cambia el contenido segun seccion activa.
- `FleetTable.vue`: tabla de activos y telemetria. Cuando la columna
  `Direccion` esta visible y el uso de geocercas como direccion esta activo,
  cruza la posicion del activo con las geocercas disponibles antes de resolver
  direcciones por geocodificacion inversa.
- `FleetTerminalModal.vue`: terminal visual de telemetria.
- `terminal/`: piezas internas de la terminal.

## Regla de mantenimiento

Los componentes no deben decidir reglas de negocio de telemetria. Para eso usar `composables/activos/fleet` y `utils/activos`.

Los perfiles operativos viven en `utils/activos/operationalProfileOptions.js`.
Si se agrega un nuevo tipo de vehiculo o reporte predeterminado, actualizar esa
configuracion y este README.

Las etiquetas operativas de activos se usan para limitar que activos puede ver
un usuario desde el modulo de usuarios. Los grupos de vehiculos solo filtran la
flota ya autorizada desde el header de Activos. Si se cambia el flujo visual de
etiquetas, revisar tambien `components/users/UserAssetTagScopeSelector.vue`
y `utils/users/userAssetTagUtils.js`.

En la tabla, `stopped` se etiqueta como `Detenido`. No reutilizar ese estado
para alertas; si se agrega alerta real, debe venir en un campo o regla propia.

Los grupos de vehiculos no se administran desde el panel lateral ni desde
Empresas. El unico punto visual de gestion es el menu del header de Activos,
donde se combinan ciudades y grupos como filtros posteriores a permisos.

La escala visual del panel se maneja desde `FleetListPanel.vue` con
`fleet-readable`. Si se agregan nuevos textos de 8 a 13 px dentro de Fleet,
deben mantener esa lectura minima para que tabla, tabs y acciones contextuales
no queden demasiado pequenas.
