# Fleet Composables

Estado y comportamiento de flota.

## Archivos

- `useFleetColumns.js`: columnas visibles, orden y definicion de tabla.
- `useFleetColumns.test.js`: pruebas de columnas de flota.
- `useFleetCreateForm.js`: estado del formulario de creacion. Expone el perfil
  operativo recomendado segun el tipo de activo seleccionado.
- `useFleetDeviceContextMenu.js`: estado del menu contextual de activos.
  Calcula posicion visible en pantalla, recibe `canOpenDeviceContextMenu` como
  permiso de apertura y reenvia completo el payload de acciones, incluyendo el
  rango seleccionado cuando se usa `Mostrar itinerario` o `Mostrar resumen
diario`, la accion de agregar al resumen diario y los datos del activo cuando
  se abre `Mantenciones`.
- `useFleetEditForm.js`: estado del formulario de edicion. Recalcula el perfil
  operativo cuando cambia el tipo de activo.
- `useFleetFormWizard.js`: pasos del asistente de formulario.
- `useFleetPanelGeofences.js`: filtrado y eventos de geocercas usados por el
  panel lateral de flota. La busqueda considera nombre, tipo, metadatos y grupo
  (`groupName`, `group` o `grupo`) para que las geocercas importadas por bloque
  se puedan encontrar desde el panel. Expone geocercas activas para `Activos`,
  `Reportes` y `Geocercas`: en `Activos` alimenta el reemplazo de la columna
  `Direccion` cuando el usuario activa `Usar geocerca como direccion`.
- `useFleetPanelSearch.js`: busqueda local con debounce y placeholder por
  seccion del panel lateral, incluyendo `Alertas`.
- `useFleetPanelSections.js`: coordinacion de tabs del panel lateral. Calcula
  secciones visibles, columnas activas, datos de reportes, itinerarios y
  alertas, y sincroniza la seccion externa enviada por la vista.
- `useFleetAssetTagModal.js`: estado interno del modal de etiquetas de activos.
  Maneja nombre, busqueda con debounce, filtros de seleccion, paginacion,
  seleccion por pagina, bloqueo de scroll del body y cierre con Escape.
- `useFleetSorting.js`: ordenamiento de tabla.
- `useFleetTelemetry.js`: preparacion de telemetria de flota.
- `useFleetTelemetry.test.js`: pruebas de telemetria de flota.
- `useFleetTerminal.js`: estado y comandos de terminal.
- `useFleetTerminalModal.js`: apertura, cierre y layout del modal de terminal.
- `usePersistedFleetLayout.js`: persistencia local de layout de flota. Guarda el
  ancho del panel izquierdo entre `300px` y `1600px` para permitir abrir mas la
  tabla sin que una preferencia extrema rompa la vista al recargar.
- `useAssetCityFilter.js`: conserva el filtro seleccionado de ciudad/activos
  para el header y los espacios de trabajo. No crea grupos operativos; las
  etiquetas de acceso son el mecanismo para limitar el alcance de usuarios. Es
  un wrapper de `useScopedAssetGroupFilter.js` y oculta ciudades sin activos
  disponibles.
- `useAssetVehicleGroupFilter.js`: conserva el filtro seleccionado de grupo de
  vehiculos para el header y los espacios de trabajo. Usa un contexto de flota
  para persistir la preferencia, trabaja sobre activos ya autorizados y no
  modifica permisos. Es un wrapper de `useScopedAssetGroupFilter.js` y mantiene
  visibles los grupos vacios para poder administrarlos.
- `useScopedAssetGroupFilter.js`: mecanica compartida para filtros persistidos
  por `userId::contextId`. Recorta siempre contra `availableActivos`, limpia
  selecciones invalidas, persiste la preferencia local y no aplica permisos.
- `useScopedAssetGroupFilter.test.js`: pruebas del filtro compartido.
- `useAssetVehicleGroupManagement.js`: administra la definicion local de grupos
  de vehiculos por contexto de Activos. Permite crear, editar asignaciones y
  eliminar grupos como organizacion visual. Sus `assetIds` se recortan contra
  los activos autorizados antes de exponerse a la UI.
- `useTelemetryHistory.js`: historial de pulsos y reportes de telemetria.

## Regla de mantenimiento

Mantener aqui estado y efectos Vue. Calculos reutilizables deben moverse a `utils/activos`.
Los perfiles operativos se consumen desde `utils/activos/operationalProfileOptions.js`;
los composables solo los exponen a la UI.
