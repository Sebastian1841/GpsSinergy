# Bitacora de cambios

Registro simple de los cambios funcionales que se van incorporando a la plataforma.
La idea de este archivo es dejar trazabilidad rapida para revisar que se hizo, por que
se hizo y que partes del proyecto fueron afectadas.

## Indice rapido

- Recuperacion documental de mantenciones y rendimiento: entrada 2026-10-13 y
  `bitacora/modulos/mantenciones-y-rendimiento.md`.

- Cambios de modularizacion: `bitacora/modulos/modularizacion.md`
- Cambios de rendimiento: ver entradas del `2026-09-15` sobre precarga pasiva y
  modales bajo demanda.
- Cambios de Alertas: ver entradas del `2026-09-14` y `2026-09-11`.
- Cambios de Fleet/Activos: ver entradas de Alertas dentro de Fleet,
  Itinerarios, Geocercas y permisos.

## Criterio de orden

- Este archivo mantiene el registro cronologico, con lo mas reciente arriba.
- Cuando un cambio empieza a abarcar varios archivos o varias pasadas, se agrega
  una ficha en `bitacora/modulos/` para explicar la modularizacion o arquitectura
  sin hacer crecer demasiado esta vista principal.
- Las entradas nuevas deben incluir: objetivo, cambios realizados, motivo,
  archivos modificados y validacion.

## 2026-10-13 - Documento De Entrega A Produccion

Alcance corregido a pedido del usuario: el documento es exclusivamente del modulo
de mantenciones. La version general inicial fue reemplazada, conservando la
bitacora historica de los demas modulos. No modifica codigo funcional.

- Se creo `bitacora/cambios-y-traspaso-a-produccion.md` con sintesis por modulo
  de los cambios registrados desde 2026-09-04 y la recuperacion posterior.
- Incluye archivos principales a intervenir, limites del prototipo, propuesta
  de entidades, prioridades de integracion y recorridos de aceptacion.
- No atribuye fechas no registradas ni presenta requisitos de backend como
  implementados. No modifica funcionalidad.
- Validacion: 64 rutas completas citadas existen; formato Markdown revisado.
  Se conserva la distincion entre las pruebas/build anteriores y una validacion
  productiva, que sigue pendiente.

## 2026-10-13 - Recuperacion De Documentacion Pendiente

### Objetivo Y Motivo

Actualizar bitacora, README de carpeta e indices generales contra el codigo
actual despues de iteraciones que quedaron sin documentar. Registro
retrospectivo: no se inventan fechas individuales de implementacion.

### Cambios Registrados

- Flota/Analisis/Ordenes, ciclo de cierre y renovacion, criterios validos,
  catalogo de tipos e historial por vehiculo.
- Exportaciones filtradas de flota y descarga directa de historial PDF/Excel,
  encabezados corporativos, paginacion, fechas y espaciado.
- Persistencia versionada de mantenciones/base mock, evidencias IndexedDB,
  indices, busqueda limitada y permisos por Set de etiquetas.
- Sin reportar con paginacion/exportacion y servicios de itinerarios separados.
- README nuevos para cinco carpetas de codigo; correccion de referencias
  obsoletas y flujos que negaban la persistencia local actual.

### Archivos

Detalle y mapa en `bitacora/modulos/mantenciones-y-rendimiento.md`.
Se actualizaron README raiz/frontend y de carpetas afectadas, junto con
`frontend/docs/flujos-principales.md` y `frontend/docs/archivos-criticos.md`.
Esta pasada modifica documentacion, no comportamiento operativo.

### Validacion

Revision de referencias de archivos, presencia de README en carpetas de codigo
y contraste de flujos con implementaciones y pruebas. `npm test`: 252 pruebas
correctas, cero fallos. `npm run build`: correcto, con aviso informativo de
tiempos de plugins de Vite. Sin verificacion visual de PDF/Excel ni de todos
los viewports; no se afirma una ejecucion completa de lint en esta pasada.

## 2026-09-16 - Composables de configuracion de alertas

### Objetivo

Reducir nuevamente `AlarmConfigPanel.vue`, sacando la logica de alcance,
geocercas, validacion y payload del componente visual.

### Cambios realizados

- Se creo `useAlarmRuleAssetScope.js` para activos, busqueda, seleccion masiva y
  etiquetas de acceso.
- Se creo `useAlarmRuleGeofenceSelection.js` para geocercas, grupos y normalizacion
  de `geofenceScope`.
- Se creo `useAlarmRuleDraft.js` para presets, validacion del draft y payload de
  guardado.
- `AlarmConfigPanel.vue` quedo como orquestador de pantalla: selecciona regla,
  abre/cierra modal, guarda, elimina, activa/desactiva y muestra feedback.
- Se agrego README para `frontend/src/composables/alarms`.

### Por que se hizo

El componente ya estaba visualmente modularizado, pero seguia concentrando reglas
de negocio del formulario. Separar esas reglas deja el componente mas facil de
revisar y permite probar o ajustar payload/selecciones sin tocar el layout.

### Archivos modificados

- `frontend/src/components/alarms/AlarmConfigPanel.vue`
- `frontend/src/composables/alarms/useAlarmRuleAssetScope.js`
- `frontend/src/composables/alarms/useAlarmRuleGeofenceSelection.js`
- `frontend/src/composables/alarms/useAlarmRuleDraft.js`
- `frontend/src/composables/alarms/README.md`
- `frontend/src/composables/README.md`
- `frontend/src/components/alarms/README.md`
- `bitacora/bitacora.md`
- `bitacora/modulos/modularizacion.md`

### Validacion

- `npm run lint`
- `npm run format:check`
- `npm run build -- --logLevel error`

## 2026-09-23 - Nueva alerta integrada en la barra de filtros

**Que se hizo**

- Se retiro el boton `Nueva alerta` de la fila superior de navegacion interna.
- El boton se ubico al extremo derecho de la barra de filtros de configuracion,
  a la misma altura que busqueda, tipo, empresa, estado y limpiar.
- El buscador usa el espacio flexible restante en escritorio y queda mas corto
  que antes al compartir la fila con la nueva accion.
- Se corrigio la distribucion para que el buscador comience en el borde izquierdo
  y ocupe solo el espacio restante, mientras `Nueva alerta` permanece al extremo
  derecho sin dejar un bloque vacio antes de los filtros.
- La nueva accion reutiliza `startNewRule` y conserva el bloqueo visual cuando
  el usuario no tiene permiso para administrar alertas.

**Archivos modificados**

- `frontend/src/views/AlarmsView.vue`
- `frontend/src/components/alarms/AlarmConfigPanel.vue`
- `frontend/src/components/alarms/AlarmRuleFilters.vue`
- `frontend/src/components/alarms/README.md`

## 2026-09-22 - Navegacion lateral compacta y desplegable

**Que se hizo**

- Se reemplazo la barra lateral exclusivamente desplegable por una navegacion
  con dos estados: rail compacto de `76px` y panel expandido de `292px`.
- Se incorporaron iconos, estado activo naranja, ayudas flotantes sobre los
  iconos y una transicion breve para abrir o cerrar el panel.
- Se agrego un control para ocultar o recuperar la barra compacta. La eleccion
  queda persistida en `localStorage`.
- Se unifico la construccion de enlaces en una sola lista reactiva. El rail y
  el panel ya no mantienen copias separadas de las rutas.
- Se conservaron los permisos, la empresa activa, las rutas administrativas y
  los respaldos hacia la primera empresa accesible del comportamiento anterior.
- En movil no se reserva espacio para el rail: el boton del header abre el panel
  superpuesto y los enlaces lo cierran despues de navegar.
- Se mantuvo un unico boton hamburguesa en el header. La barra compacta no
  repite ese control, evitando dos acciones visualmente identicas juntas.
- Se optimizo la apertura del panel: se elimino el desenfoque de pantalla
  completa, el contenido permanece montado con `v-show` y la animacion usa
  solamente `transform` acelerado y opacidad. Esto reduce el trabajo de pintura
  sobre mapas y vistas con muchas filas.
- Al cambiar la preferencia de barra compacta desde el panel expandido, el
  panel ahora se cierra para mostrar inmediatamente el resultado de la accion.
- Se desacoplo `showSidebar` de `router-view`, `ActivosView` y
  `ActivosMapPanel`. Abrir la navegacion ya no provoca una actualizacion del
  mapa ni de la vista de flota; la cola de telemetria se conserva solamente
  para estados que realmente pausan el mapa, como la comparacion de rutas.
- El estado de apertura se movio desde `App.vue` hacia `AppSidebar.vue`. El
  header utiliza la API expuesta `toggle()` mediante una referencia, por lo que
  abrir o cerrar la navegacion ya no vuelve a renderizar el layout raiz ni sus
  vistas hijas.
- Se corrigio el footer del panel expandido para evitar controles y marca
  comprimidos. Cuando el rail esta visible se oculta la accion duplicada de
  ocultarlo; si el rail fue desactivado, el panel muestra una unica accion para
  restaurarlo. El bloque de marca conserva altura y ancho estables.
- Se asigno una capa global estable a la navegacion (`z-index: 2000`) y otra al
  overlay (`1990`). Esto evita que las capas internas de Leaflet, sus controles
  o el mapa se dibujen sobre la sidebar al reducir el ancho de la ventana.
- El control para mostrar u ocultar el rail compacto se ubico en el footer del
  panel y muestra siempre una etiqueta explicita segun la accion disponible.
- Para mejorar la respuesta se elimino la animacion del overlay y la sombra del
  panel durante el desplazamiento. La unica propiedad animada es `transform`,
  con una duracion corta de `110ms` y una capa de composicion estable.
- Se reemplazo `v-show` y `Transition` por capas persistentes controladas con
  clases. El panel y el overlay permanecen montados, conservan sus capas de
  composicion y solo cambian `transform`, `opacity` y `pointer-events`; esto
  evita reconstruir la capa visual en cada apertura.
- La sidebar dejo de mantener un renderizador SVG y rutas de iconos propios.
  Ahora utiliza el componente compartido `SvgIcon.vue`; los controles
  `panel-open` y `panel-close` se agregaron al catalogo central.
- Se habilitaron tooltips en los iconos del rail compacto. Se retiro el recorte
  horizontal que ocultaba las etiquetas y se agrego `title` nativo como
  respaldo para cada modulo.
- Se eliminaron cinco variantes SVG duplicadas que repetian los nombres de
  `reportes`, `alertas`, `mantenciones`, `empresas` y `usuarios`. El catalogo
  conserva una sola definicion publica por nombre.

## 2026-09-22 - Barra superior compacta en usuarios

**Que se hizo**

- Se retiro el encabezado independiente con el titulo y descripcion de
  Usuarios para evitar repetir el contexto ya indicado por el header global.
- La busqueda dejo de ocupar todo el espacio disponible y ahora conserva un
  ancho acotado en escritorio, manteniendo crecimiento flexible en movil.
- El boton `Nuevo usuario` se movio dentro de `UserFiltersBar`, alineado con los
  filtros de empresa, estado, rol y filtros adicionales.
- Se mantuvo la validacion `canCreateUsersForRoute`; el boton solo aparece
  cuando el usuario actual tiene permiso para crear usuarios.

**Archivos modificados**

- `frontend/src/views/UserManagementView.vue`
- `frontend/src/components/users/UserFiltersBar.vue`
- `bitacora/bitacora.md`

## 2026-09-22 - Nuevo diseno del editor de usuarios

**Que se hizo**

- Se reemplazo el modal compacto anterior por una composicion de dos zonas:
  `Datos de la cuenta` y `Acceso inicial`.
- La zona principal contiene nombre, correo, usuario y contrasena; la zona
  secundaria concentra estado, rol y empresa inicial.
- Se agrego un control accesible para mostrar u ocultar la contrasena y cierre
  mediante tecla `Escape`.
- El modo edicion reutiliza el mismo diseno, permite dejar la contrasena vacia y
  deriva la administracion de empresas al detalle de accesos existente.
- La validacion visual exige nombre, usuario, correo valido, empresa inicial y
  una contrasena de al menos ocho caracteres al crear.
- El modal se teletransporta a `body` y utiliza una capa superior a la sidebar y
  al mapa para evitar superposiciones.

**Por que se hizo**

El formulario anterior mezclaba todos los campos en una grilla pequena. La
nueva jerarquia separa identidad y credenciales de la configuracion operativa,
facilita la lectura y mantiene visibles las acciones principales.

**Archivos modificados**

- `frontend/src/components/users/UserEditorModal.vue`
- `frontend/src/components/users/README.md`
- `bitacora/bitacora.md`

## 2026-09-23 - Rediseño del catalogo de usuarios en tarjetas

**Que se hizo**

- Se reconstruyo la vista cards del directorio con una grilla de hasta tres
  columnas en escritorio.
- Cada tarjeta separa identidad, correo, rol y estado en su encabezado; empresa
  y cantidad de accesos se muestran como dos metricas intermedias.
- Se agregaron acciones independientes `Ver detalle` y `Editar` en el pie de la
  tarjeta, usando el catalogo compartido `SvgIcon`.
- `Ver detalle` conserva el drawer actual. `Editar` selecciona el usuario y abre
  directamente el editor existente.
- La accion de edicion solo se renderiza cuando `canEditUsersForRoute` lo
  permite; sin ese permiso, la accion de detalle ocupa el ancho completo.
- Las acciones `Ver detalle` y `Editar` muestran cursor de accion para dejar
  claro que son controles interactivos.

**Archivos modificados**

- `frontend/src/components/users/UserListPanel.vue`
- `frontend/src/views/UserManagementView.vue`
- `frontend/src/components/users/README.md`
- `bitacora/bitacora.md`

## 2026-09-23 - Rediseño de la vista lista de usuarios

**Que se hizo**

- La lista se reorganizo en las columnas Usuario, Rol, Empresa, Accesos,
  Ultimo acceso, Estado y Acciones.
- Se incorporaron iconos para empresa, accesos y fecha; los roles y estados se
  presentan como etiquetas compactas.
- Las acciones de editar y ver detalle son independientes y reutilizan los
  mismos flujos de las tarjetas.
- Se agrego un selector funcional de 5, 10 o 20 usuarios por pagina y se cambio
  el valor inicial a 10.
- La tabla mantiene un ancho minimo con scroll horizontal para evitar que las
  columnas pierdan legibilidad en ventanas estrechas.

## 2026-09-23 - Mejora de legibilidad en Auditoria

**Que se hizo**

- Se agrego una escala tipografica central mediante `audit-readable` para toda
  la vista y sus componentes hijos.
- Los textos equivalentes a 9, 10 y 11px aumentaron a 11, 12 y 13px.
- Los controles de fecha, selectores, etiquetas y valores del detalle se
  alinearon con la misma escala.
- Se conservaron las dimensiones de filas, tarjetas y controles para mejorar
  lectura sin inflar innecesariamente el modulo.

**Archivos modificados**

- `frontend/src/views/AuditView.vue`
- `frontend/src/components/audit/README.md`
- `bitacora/bitacora.md`

## 2026-09-23 - Escala tipografica comun para modulos

**Que se hizo**

- La escala de legibilidad estrenada en Auditoria se movio al layout privado
  mediante la clase `module-readable`.
- Todos los modulos convierten textos de 9, 10 y 11px en 11, 12 y 13px dentro
  del area principal.
- Las rutas `Activos` y `AppActivos` quedan excluidas para conservar la densidad
  especial de Fleet, mapas, itinerarios y controles operativos.
- El header global y la sidebar no cambian porque se renderizan fuera de
  `main.module-readable`.

**Archivos modificados**

- `frontend/src/App.vue`
- `frontend/src/views/AuditView.vue`
- `frontend/src/components/audit/README.md`
- `bitacora/bitacora.md`

**Por que se hizo**

La navegacion anterior desaparecia por completo al cerrarse y repetia el mismo
marcado para cada modulo. El nuevo esquema mantiene acceso rapido a los modulos
en escritorio, reduce el espacio ocupado y evita inconsistencias entre la vista
compacta y la expandida.

**Archivos modificados**

- `frontend/src/components/Layout/AppSidebar.vue`
- `frontend/src/components/Layout/README.md`
- `bitacora/bitacora.md`

**Validacion**

- `npm run lint`
- `npm run build -- --logLevel error`

## 2026-09-16 - Modularizacion de disparo de alertas

### Objetivo

Sacar de `AlarmConfigPanel.vue` el bloque mas grande que quedaba dentro del
modal: la configuracion de condiciones y horario de disparo.

### Cambios realizados

- Se creo `AlarmRuleTriggerSection.vue`.
- Se movio la UI de condiciones por tipo de alerta: velocidad, bateria, sin
  senal, geocerca, detencion, encendido y combustible.
- Se movio la UI de seleccion de geocercas y grupos dentro de la condicion de
  geocerca.
- Se movio la UI de horario de evaluacion.
- `AlarmConfigPanel.vue` mantiene el draft, validacion, armado de payload y
  guardado.
- Se corrigio la responsabilidad de estilos: la grilla y controles de disparo
  viven en `AlarmRuleTriggerSection.vue`.

### Por que se hizo

`AlarmConfigPanel.vue` seguia siendo demasiado grande y mezclaba orquestacion con
la vista mas compleja del formulario. Separar el disparo reduce el contenedor y
deja la parte condicional aislada para futuras mejoras.

### Archivos modificados

- `frontend/src/components/alarms/AlarmConfigPanel.vue`
- `frontend/src/components/alarms/AlarmRuleTriggerSection.vue`
- `frontend/src/components/alarms/README.md`
- `bitacora/bitacora.md`
- `bitacora/modulos/modularizacion.md`

### Validacion

- `npm run lint`
- `npm run format:check`
- `npm run build -- --logLevel error`

## 2026-09-16 - Modularizacion de secciones del modal de alertas

### Objetivo

Continuar la modularizacion de `AlarmConfigPanel.vue` sin extraer todavia toda
la configuracion de disparo, que es la parte mas sensible del formulario.

### Cambios realizados

- Se creo `AlarmRuleGeneralSection.vue` para nombre, tipo y descripcion.
- Se creo `AlarmRuleScopeSection.vue` para empresa, alcance, activos especificos
  y etiquetas de acceso.
- Se creo `AlarmRuleNotificationsSection.vue` para canales de notificacion.
- `AlarmConfigPanel.vue` conserva el estado, draft, validacion, guardado y la
  configuracion de disparo.
- Se actualizaron README y el modulo de bitacora de modularizacion.

### Por que se hizo

El modal de crear/editar alerta seguia creciendo dentro del contenedor principal.
Separar secciones visuales simples reduce el tamano del archivo sin tocar aun la
logica delicada de condiciones por tipo, horarios y geocercas.

### Archivos modificados

- `frontend/src/components/alarms/AlarmConfigPanel.vue`
- `frontend/src/components/alarms/AlarmRuleGeneralSection.vue`
- `frontend/src/components/alarms/AlarmRuleScopeSection.vue`
- `frontend/src/components/alarms/AlarmRuleNotificationsSection.vue`
- `frontend/src/components/alarms/README.md`
- `bitacora/bitacora.md`
- `bitacora/modulos/modularizacion.md`

### Validacion

- `npm run lint`
- `npm run format:check`
- `npm run build -- --logLevel error`

## 2026-09-15 - Modularizacion inicial de configuracion de alertas

### Objetivo

Empezar el segundo punto de mejora separando archivos grandes uno por uno. La
primera pasada se hizo sobre `AlarmConfigPanel.vue`, que mezclaba filtros, tabla,
modal de formulario, condiciones por tipo, geocercas, acciones y estilos.

### Cambios realizados

- Se creo `AlarmRuleFilters.vue` para la busqueda y filtros de reglas
  automaticas.
- Se creo `AlarmRuleTable.vue` para el listado de reglas, estado, toggle,
  editar y eliminar.
- `AlarmConfigPanel.vue` quedo como contenedor de estado, draft, validacion y
  guardado, delegando filtros y tabla a componentes hijos.
- Se movieron los estilos de filtros y tabla a sus componentes correspondientes.
- Se documento el detalle de la modularizacion en
  `bitacora/modulos/modularizacion.md`.

### Por que se hizo

El panel de configuracion de alertas estaba concentrando demasiadas
responsabilidades y pasaba las 2200 lineas. Separar primero piezas visuales de
bajo riesgo permite mejorar mantenibilidad sin alterar todavia la logica del
formulario, que es la parte mas delicada.

### Archivos modificados

- `frontend/src/components/alarms/AlarmConfigPanel.vue`
- `frontend/src/components/alarms/AlarmRuleFilters.vue`
- `frontend/src/components/alarms/AlarmRuleTable.vue`
- `frontend/src/components/alarms/README.md`
- `bitacora/bitacora.md`
- `bitacora/modulos/modularizacion.md`

### Validacion

- `npm run lint`
- `npm run format:check`
- `npm run build -- --logLevel error`

## 2026-09-15 - Precarga de modales pesados bajo demanda

### Objetivo

Reducir trabajo oculto al entrar a Activos y Mantenciones, evitando descargar
modales grandes que el usuario aun no ha abierto.

### Cambios realizados

- `ActivosView.vue` dejo de llamar la precarga de modales de flota al montar.
- `useActivosFleetModals.js` ya no importa ni usa `preloadWhenIdle`.
- Los modales `AddActivoModal`, `FleetEditModal` y `FleetTerminalModal` siguen
  siendo async components, pero se descargan cuando se abren.
- `MaintenanceView.vue` dejo de precargar `MaintenanceActionModal` al montar.
- `MaintenanceActionModal` sigue cargandose async y bajo demanda cuando el
  usuario abre una accion de mantencion.
- Se actualizaron README locales de Activos y Mantenciones.

### Por que se hizo

Los modales de Activos concentran formularios y terminal de telemetria; el modal
de Mantenciones concentra varios formularios de mantenimiento, ordenes, costos y
exportacion. Precargarlos en reposo hacia que entrar a esas vistas descargara
trabajo no solicitado. Mantenerlos bajo demanda reduce carga inicial y evita
competir con mapa, tabla o filtros.

### Archivos modificados

- `frontend/src/views/ActivosView.vue`
- `frontend/src/composables/activos/view/useActivosFleetModals.js`
- `frontend/src/views/MaintenanceView.vue`
- `frontend/src/composables/activos/view/README.md`
- `frontend/src/components/maintenance/README.md`
- `bitacora/bitacora.md`

### Validacion

- `npm run lint`
- `npm run format:check`
- `npm run build -- --logLevel error`

## 2026-09-15 - Modales de reportes bajo demanda

### Objetivo

Evitar que el modulo de Reportes y la pestana Reportes de Fleet descarguen
modales grandes antes de que el usuario los use.

### Cambios realizados

- Se revisaron las cargas de `exceljs`, `jspdf`, `jspdf-autotable`,
  `html2canvas`, `jszip` y `chart.js`.
- Se confirmo que esos vendors pesados entran mediante `import()` dinamico:
  exportacion PDF/Excel, documentos de rutas, ZIP de geocercas y graficos.
- Se retiro la precarga pasiva de modales grandes desde `ReportsView.vue`.
- Se retiro la precarga pasiva de modales grandes desde `FleetReportsPanel.vue`.
- Los modales de ejecutar reporte, crear/editar plantilla, reglas y
  programaciones siguen usando `defineAsyncComponent`, pero se descargan al
  abrirse.
- Se actualizo la regla de mantenimiento para no volver a precargar por defecto
  modales con preview, mapas, graficos o exportacion.

### Por que se hizo

Aunque los vendors pesados ya estaban separados del bundle inicial, la precarga
de modales de reportes podia descargar logica de preview y configuracion en
segundo plano solo por entrar a Reportes. Mantenerlos bajo demanda reduce trabajo
oculto y evita competir con mapa, tablas o filtros.

### Archivos modificados

- `frontend/src/views/ReportsView.vue`
- `frontend/src/components/activos/fleet/FleetReportsPanel.vue`
- `frontend/src/views/README.md`
- `frontend/src/components/reports/README.md`
- `frontend/src/components/activos/fleet/README.md`
- `bitacora/bitacora.md`

### Validacion

- `npm run lint`
- `npm run format:check`
- `npm run build -- --logLevel error`

## 2026-09-15 - Precarga pasiva menos agresiva

### Objetivo

Reducir tirones de interfaz causados por precargar modulos pesados mientras el
usuario esta usando la plataforma.

### Cambios realizados

- La precarga global de rutas privadas dejo de intentar cargar todas las vistas.
- `preloadPrivateRouteViews()` ahora acepta una lista explicita de vistas
  livianas, limita cuantos chunks se cargan y respeta `saveData` del navegador.
- `App.vue` espera mas tiempo antes de iniciar esa precarga y solo solicita
  vistas livianas.
- En Fleet, la precarga pasiva queda limitada a `Alertas` y `Reportes`.
- `Itinerarios` y `Geocercas` ya no se descargan automaticamente al abrir
  Activos; se cargan cuando el usuario entra a esas pestanas.
- `preloadWhenIdle()` aumento sus tiempos por defecto y no corre cuando el
  navegador declara ahorro de datos.

### Por que se hizo

El analisis de build mostro chunks pesados de mapas, reportes, exportacion,
graficos y modulos grandes. Aunque estaban separados del bundle inicial, la
precarga podia traerlos en segundo plano demasiado pronto y competir con la
interaccion normal del usuario.

### Archivos modificados

- `frontend/src/App.vue`
- `frontend/src/router/index.js`
- `frontend/src/components/activos/fleet/FleetSectionContent.vue`
- `frontend/src/composables/ui/useIdlePreload.js`
- `frontend/src/router/README.md`
- `frontend/src/components/activos/fleet/README.md`
- `frontend/src/composables/ui/README.md`
- `bitacora/bitacora.md`

### Validacion

- `npm run lint`
- `npm run format:check`
- `npm run build -- --logLevel error`

## 2026-09-14 - Historial de alertas dentro de Fleet

### Objetivo

Agregar al panel lateral de Activos/Fleet una seccion `Alertas` que muestre solo
el historial operativo por empresa y por activos autorizados, sin duplicar el
configurador de reglas automaticas del modulo principal de Alertas.

### Cambios realizados

- Se corrigieron fences de Markdown pegados en archivos `.js` que dejaban el
  codigo dentro de strings y rompian los exports del build.
- `ActivosView.vue` calcula alertas autorizadas con los helpers existentes de
  `utils/alarms/alarmUtils.js`, usando `visibleAssets`, empresa activa y
  busqueda de la seccion.
- `FleetListPanel.vue` recibe `alertRows` y `alertSummary`, los entrega a la
  seccion activa y muestra el contador en la pestana `Alertas`.
- Se creo `FleetAlertsPanel.vue` como historial compacto con KPIs, filas de
  alerta, motivo, ubicacion, fecha y accion `Ver recorrido`.
- `FleetSectionContent.vue` monta la seccion `Alertas` con lazy-load igual que
  Reportes, Itinerarios y Geocercas.
- La accion `Ver recorrido` navega a `AppActivos` con
  `section=itinerarios`, `activoId`, `from=alertas`, `alarmId` y fecha para
  reutilizar el foco del punto GPS de la alerta.
- La seccion de Fleet tambien permite `Resolver` o `Reabrir` alertas cuando el
  usuario tiene permiso de edicion o administracion sobre Alertas.
- Fleet muestra `Activas` por defecto y `Limpiar` vuelve a ese filtro operativo.
  Al resolver una alerta desde Fleet, la vista vuelve a `Activas`, por lo que la
  fila desaparece sin borrar el registro historico.
- Se mantuvo la configuracion de reglas automaticas solo en el modulo principal
  de Alertas.

### Por que se hizo

Fleet necesita una lectura rapida del historial de alertas de la empresa activa
mientras el usuario monitorea activos. Duplicar el configurador dentro de Fleet
habria mezclado administracion con operacion y aumentado el riesgo de mantener
dos flujos distintos para lo mismo.

### Archivos modificados

- `frontend/src/views/ActivosView.vue`
- `frontend/src/components/activos/fleet/FleetAlertsPanel.vue`
- `frontend/src/components/activos/fleet/FleetListPanel.vue`
- `frontend/src/components/activos/fleet/FleetSectionContent.vue`
- `frontend/src/components/activos/fleet/FleetPanelHeader.vue`
- `frontend/src/composables/activos/fleet/useFleetPanelSearch.js`
- `frontend/src/composables/activos/fleet/useFleetPanelSections.js`
- `frontend/src/composables/activos/view/useActivosFilters.js`
- `frontend/src/composables/activos/view/useActivosPermissions.js`
- `frontend/src/composables/activos/view/useActivosWorkspacePersistence.js`
- README locales de Fleet y Views
- `bitacora/bitacora.md`

### Validacion

- Se ejecuto `node --test src/utils/alarms/alarmUtils.test.js src/utils/alarms/automaticAlertRuleUtils.test.js`.
- Se ejecuto `npm run format:check`.
- Se ejecuto `npm run lint`.
- Se ejecuto `npm run build -- --logLevel error`.

## 2026-09-14 - Cambio de nombre visible de Alarmas a Alertas

### Objetivo

Renombrar el modulo de cara al usuario desde `Alarmas` a `Alertas`, para que el
nombre coincida con el flujo funcional definido: configuracion de reglas de
alerta e historial de alertas activadas.

### Cambios realizados

- La navegacion principal ahora muestra `Alertas`.
- El header de contexto muestra `Alertas` cuando se entra al modulo.
- La ruta principal del modulo cambio a `/alertas` y
  `/app/:empresaId/alertas`.
- Las rutas anteriores `/alarmas` y `/app/:empresaId/alarmas` quedaron como
  alias legacy para no romper accesos guardados.
- Los mensajes visibles de resolver/reabrir ahora hablan de `alertas`.
- El permiso mock sigue usando la clave tecnica `alarms`, pero el nombre visible
  cambio a `Alertas`.
- Las descripciones de reglas automaticas ahora dicen que generan alertas, no
  alarmas.
- Se actualizaron README generales y locales para usar el nombre vigente del
  modulo.

### Por que se hizo

El modulo ya estaba funcionando como un centro de alertas: por un lado se
configuran reglas automaticas y por otro se revisan alertas generadas. Mantener
`Alarmas` en la UI mezclaba el lenguaje y hacia menos claro el flujo.

### Archivos modificados

- `frontend/src/router/index.js`
- `frontend/src/components/Layout/AppSidebar.vue`
- `frontend/src/components/Layout/AppHeader.vue`
- `frontend/src/views/AlarmsView.vue`
- `frontend/src/components/alarms/AlarmFilters.vue`
- `frontend/src/components/alarms/AlarmDetailPanel.vue`
- `frontend/src/utils/alarms/automaticAlertRuleUtils.js`
- `frontend/src/data/mockDatabase.js`
- `README.md`
- `frontend/README.md`
- `frontend/docs/archivos-criticos.md`
- `frontend/docs/flujos-principales.md`
- README locales dentro de `frontend/src/`
- `bitacora/bitacora.md`

### Validacion

- Se ejecuto `node --test src/utils/alarms/alarmUtils.test.js src/utils/alarms/automaticAlertRuleUtils.test.js`.
- Se ejecuto `npm run format:check`.
- Se ejecuto `npm run lint`.
- Se ejecuto `npm run build -- --logLevel error`.

## 2026-09-11 - Modal de creacion y edicion de alertas automaticas

### Objetivo

Cambiar la creacion y edicion de reglas automaticas desde una barra lateral a un
modal centrado, para que la tabla de configuracion use todo el ancho disponible y
el formulario se abra solo cuando el usuario selecciona `Nueva alerta` o
`Editar`.

### Cambios realizados

- `AlarmConfigPanel.vue` ya no renderiza el editor como segunda columna.
- El formulario de crear/editar ahora se muestra en un modal con overlay.
- La tabla de reglas mantiene una sola columna principal y no cambia de ancho al
  abrir el formulario.
- El modal no aparece por defecto al entrar a Configuracion.
- Al guardar una regla creada o editada, el modal se cierra automaticamente.
- Se mantuvo la misma logica de guardado, validacion, geocercas, alcance,
  horarios y notificaciones.
- Se actualizaron README locales para reflejar que el editor es modal.

### Por que se hizo

La barra lateral dejaba la tabla comprimida y hacia que el formulario se sintiera
como parte permanente de la pantalla. El modal separa mejor la accion puntual de
crear/editar y permite que el listado de reglas conserve el ancho completo.

### Archivos modificados

- `frontend/src/components/alarms/AlarmConfigPanel.vue`
- `frontend/src/components/alarms/README.md`
- `frontend/src/views/README.md`
- `bitacora/bitacora.md`

### Validacion

- Se ejecuto `npm run lint`.
- Se ejecuto `npm run build -- --logLevel error`.
- Se ejecuto `npm run format:check`.

## 2026-09-11 - Seleccion real de geocercas en reglas automaticas

### Objetivo

Evitar que las alertas automaticas de tipo geocerca dependan de un texto libre.
La regla debe poder aplicarse a todas las geocercas, a un grupo de geocercas o a
geocercas especificas seleccionadas desde las zonas reales del modulo Activos.

### Cambios realizados

- `AlarmsView.vue` ahora conecta `useGeofences` y entrega `geofences` y
  `geofenceGroups` al panel de configuracion de alertas.
- En `AlarmConfigPanel.vue`, la condicion de tipo `geofence` cambio de un input
  de texto a un flujo estructurado:
  - evento de geocerca: entrada, salida o entrada/salida;
  - alcance de geocercas: todas, grupo o geocercas especificas;
  - selector de grupo cuando se elige `Grupo de geocercas`;
  - buscador y checks cuando se elige `Geocercas especificas`.
- Se agrego validacion para impedir guardar una regla de geocerca con grupo
  vacio o sin geocercas marcadas cuando el alcance es especifico.
- `automaticAlertRuleUtils.js` ahora normaliza y conserva `geofenceScope`,
  `geofenceGroupId`, `geofenceGroupName`, `geofenceIds` y `geofenceNames`.
- La etiqueta de condicion en la tabla ahora explica el alcance configurado, por
  ejemplo `Salir - Grupo Bodegas` o `Ingresar - 2 geocercas`.
- Se corrigio la seleccion del alcance de geocerca para que `Grupo de
geocercas` y `Geocercas especificas` siempre puedan elegirse; si no hay datos,
  el panel muestra el mensaje correspondiente en vez de parecer que la opcion no
  responde.
- Se agregaron tests para verificar que la normalizacion mantiene los objetivos
  de geocerca y que la etiqueta de condicion se genera correctamente.
- Se actualizaron README y docs del modulo para dejar claro que las reglas de
  geocerca usan selecciones reales, no texto libre.

### Por que se hizo

Una alerta de geocerca debe quedar asociada a entidades reales para que despues
pueda evaluarse contra telemetria y mantenerse consistente si el usuario edita
la regla. El texto libre no garantiza que exista la geocerca ni permite distinguir
entre aplicar a todas, a un grupo o a una seleccion puntual.

### Archivos modificados

- `frontend/src/views/AlarmsView.vue`
- `frontend/src/components/alarms/AlarmConfigPanel.vue`
- `frontend/src/utils/alarms/automaticAlertRuleUtils.js`
- `frontend/src/utils/alarms/automaticAlertRuleUtils.test.js`
- `frontend/src/components/alarms/README.md`
- `frontend/src/utils/alarms/README.md`
- `frontend/src/views/README.md`
- `frontend/docs/flujos-principales.md`
- `frontend/docs/archivos-criticos.md`
- `README.md`
- `bitacora/bitacora.md`

### Validacion

- Se ejecuto `npm test -- src/utils/alarms/automaticAlertRuleUtils.test.js`.
- Se ejecuto `npm run lint`.
- Se ejecuto `npm run format:check`.
- Se ejecuto `npm run build -- --logLevel error`.

## 2026-09-11 - Configuracion de alertas como panel principal

### Objetivo

Convertir la configuracion de alertas automaticas en un panel propio dentro del
modulo Alarmas, separandola visual y funcionalmente del historial de alertas ya
activadas.

### Cambios realizados

- Se reemplazo el acceso por modal por dos paneles superiores:
  `Historial` y `Configuracion`.
- `Historial` mantiene el listado de alertas ocurridas, detalle lateral,
  resolucion/reapertura y navegacion a Itinerarios con el punto de alerta.
- `Configuracion` ahora muestra filtros, tabla de reglas y formulario para crear
  o editar reglas automaticas.
- El formulario de configuracion permite definir:
  - nombre, tipo y descripcion;
  - empresa;
  - alcance por toda la flota, activos especificos o etiquetas de acceso;
  - condicion segun tipo de alerta;
  - horario siempre o personalizado;
  - notificaciones en plataforma o correo.
- El formulario ahora se puede cerrar de forma real desde la `X` o
  `Cancelar`; `Nueva alerta` y `Editar` lo vuelven a abrir cuando corresponde.
- Se retiro `WhatsApp` de la interfaz de configuracion porque no existe todavia
  una integracion real de envio para ese canal.
- Se elimino el componente modal antiguo de reglas automaticas para evitar dos
  experiencias superpuestas.
- Se amplio la normalizacion de reglas para persistir `description`,
  `schedule`, `notificationChannels` y `assetScope.assetTagIds`.
- Se agrego soporte de alcance por etiquetas de acceso al armado de filas de
  reglas automaticas.
- Se amplio la semilla mock de reglas para cubrir casos tipicos: velocidad,
  bateria, sin senal, geocercas, horario, detencion y combustible.
- Se actualizo documentacion tecnica y README para reflejar que reglas e
  historial son paneles separados.
- Se ajusto la vista para acercarla a la referencia: `Configuracion` abre por
  defecto, los tabs principales viven en la cabecera con iconos, el boton
  `Nueva alerta` queda arriba a la derecha y la lista de reglas se renderiza
  como tabla compacta en vez de cards separadas.
- Se pulio el historial de alertas para evitar jerarquias duplicadas:
  - se dejo `Ver recorrido` solo en el detalle de la alerta seleccionada;
  - el filtro de estado usa `Todas`, `Activas` y `Resueltas`;
  - la lista incluye encabezados y aprovecha el espacio central con ubicacion;
  - el panel lateral bajo peso visual en bordes, iconos, espaciado y botones.
- En configuracion de alertas se estabilizo el toggle de activa/desactivada:
  al cambiar estado la fila ya no salta por reordenamiento automatico, y el
  switch usa una transicion corta solo para el indicador.
- Se corrigio el refresco interno del formulario para que el toggle no reabra el
  panel lateral ni cambie el ancho de la tabla cuando el editor esta cerrado.
- Se retiro el encabezado redundante de `Alarmas` dentro de la vista, dejando la
  identificacion principal al `AppHeader` y ganando espacio vertical para los
  controles y tablas.
- El paso `Condiciones` del formulario de reglas automaticas ahora cambia segun
  el tipo de alerta:
  - velocidad usa umbral y duracion;
  - bateria usa voltaje o porcentaje;
  - sin senal usa minutos sin reporte;
  - geocerca usa evento de entrada/salida y geocerca objetivo;
  - detencion usa minutos y estado de motor;
  - encendido usa la regla de fuera de horario;
  - combustible usa baja, unidad y ventana de tiempo.
- Se actualizo la normalizacion de reglas para conservar esos campos especificos
  y mostrar condiciones legibles en la tabla.

### Por que se hizo

El flujo anterior escondia la configuracion dentro de un modal y hacia que el
modulo pareciera tener una sola responsabilidad. En la practica hay dos
responsabilidades distintas:

```txt
Configuracion de alertas
-> reglas automaticas que definen condiciones futuras

Historial de alertas
-> eventos ya activados por activos autorizados
-> detalle operativo
-> recorrido del dia en Itinerarios
```

Separarlo evita que acciones como `Ver recorrido` aparezcan donde se crean las
reglas, y permite que configurar alertas sea una tarea administrativa clara.

### Archivos modificados

- `frontend/src/views/AlarmsView.vue`
- `frontend/src/components/alarms/AlarmConfigPanel.vue`
- `frontend/src/components/alarms/AutomaticAlertsModal.vue`
- `frontend/src/utils/alarms/automaticAlertRuleUtils.js`
- `frontend/src/utils/alarms/automaticAlertRuleUtils.test.js`
- `frontend/src/data/mockAutomaticAlertRules.js`
- `frontend/src/components/alarms/README.md`
- `frontend/src/views/README.md`
- `frontend/docs/flujos-principales.md`
- `frontend/docs/archivos-criticos.md`
- `README.md`
- `frontend/README.md`

### Validacion

- Se ejecuto `node --test --test-reporter=dot "src/**/*.test.js"`.
- Se ejecuto `npm run lint`.
- Se ejecuto `npm run format:check`.
- Se ejecuto `npm run build -- --logLevel error`.

## 2026-09-10 - Historial de alertas conectado con Itinerarios

### Objetivo

Separar claramente los dos paneles de alertas: el modulo principal debe mostrar
el historial de alertas activadas y el modal debe quedar solo para configurar
reglas automaticas. Desde una alerta activada, el usuario debe poder revisar el
recorrido del activo en Itinerarios y ubicar el punto donde se genero la alerta.

### Cambios realizados

- Se cambio el titulo principal de Alarmas a `Historial de alertas`.
- Se cambio la accion superior y del detalle desde ver mapa vivo hacia
  `Ver recorrido`.
- La navegacion desde Alarmas ahora envia a `AppActivos` con:
  `section=itinerarios`, `activoId`, `date`, `from=alarmas` y `alarmId`.
- `ActivosView.vue` lee esos parametros, respeta la seccion Itinerarios y no
  vuelve automaticamente a la tabla de activos cuando existe `activoId`.
- `ActivosView.vue` busca la alerta por `alarmId`, valida empresa y activo, y
  arma un `itineraryContextRequest` con la alerta enfocada.
- `ItineraryPanel.vue` acepta fecha exacta desde contexto externo, selecciona el
  activo, genera el recorrido del dia y puede usar fallback de prototipo solo
  para este flujo.
- `ItineraryPanel.vue` calcula el punto GPS mas cercano a la hora de la alerta y
  lo emite como `selectedItineraryPoint`.
- `useMapItinerary.js` muestra un tooltip especial para puntos de alerta con
  titulo, patente, hora, velocidad, descripcion y direccion del punto.
- `mapSignatures.js` incluye campos de alerta en la firma del punto seleccionado
  para refrescar el tooltip cuando cambia la alerta enfocada.
- Se actualizo la documentacion local de alarmas, vistas, itinerarios, mapa y
  composables de Activos.

### Por que se hizo

El historial de alertas y la configuracion de reglas automaticas son flujos
distintos. El historial responde a eventos ya ocurridos y debe permitir revisar
su contexto operativo. La configuracion crea reglas que en el futuro generan
eventos, pero no debe absorber el historial ni sus acciones.

La navegacion a Itinerarios permite revisar el recorrido completo del dia sin
perder el contexto de la alerta. La regla aplicada queda:

```txt
alerta activada
-> activo autorizado
-> dia de ocurrencia
-> recorrido del activo
-> punto GPS mas cercano a la hora de la alerta
-> tooltip con detalle de la alerta
```

### Archivos modificados

- `frontend/src/views/AlarmsView.vue`
- `frontend/src/components/alarms/AlarmDetailPanel.vue`
- `frontend/src/components/alarms/AlarmList.vue`
- `frontend/src/views/ActivosView.vue`
- `frontend/src/components/activos/itinerarios/ItineraryPanel.vue`
- `frontend/src/composables/activos/map/useMapItinerary.js`
- `frontend/src/composables/activos/map/mapSignatures.js`
- `frontend/src/composables/activos/view/useActivosWorkspacePersistence.js`
- `frontend/src/components/alarms/README.md`
- `frontend/src/views/README.md`
- `frontend/src/components/activos/itinerarios/README.md`
- `frontend/src/composables/activos/map/README.md`
- `frontend/src/composables/activos/view/README.md`
- `README.md`
- `frontend/README.md`
- `frontend/docs/flujos-principales.md`
- `frontend/docs/archivos-criticos.md`

### Validacion

- Se ejecuto `npm run format:check`.
- Se ejecuto `npm run lint`.
- Se ejecuto `node --test --test-reporter=dot "src/**/*.test.js"`.
- Se ejecuto `npm run build -- --logLevel error`.

## 2026-09-10 - Panel de alertas automaticas

### Objetivo

Agregar un panel modal para configurar reglas automaticas que pueden originar
alarmas operativas, sin mezclar esa configuracion con el listado de alarmas ya
generadas.

### Cambios realizados

- Se agrego `AutomaticAlertsModal.vue` como modal de configuracion dentro del
  modulo de Alarmas.
- Se conecto `AlarmsView.vue` con un boton `Alertas automaticas`, manteniendo el
  panel como modal y no como ruta separada.
- Se creo `mockAutomaticAlertRules.js` como semilla de reglas por empresa.
- Se creo `useAutomaticAlertRulesService.js` con persistencia local en
  `sinergy-automatic-alert-rules`.
- Se agregaron operaciones locales para crear, editar, activar/pausar y eliminar
  reglas automaticas.
- Se agrego `automaticAlertRuleUtils.js` para normalizar reglas, resolver empresa
  y activos afectados, filtrar, ordenar y calcular resumen.
- Se agregaron tests para alcance por empresa, activos autorizados, filtros,
  orden, resumen y defaults por tipo de alerta.
- Se actualizo documentacion principal, README internos y flujos tecnicos para
  explicar la separacion entre reglas automaticas y alarmas ocurridas.

### Por que se hizo

El centro de alarmas debe atender eventos ya generados. Las alertas automaticas
pertenecen a otra responsabilidad: configurar condiciones operativas que, cuando
exista evaluacion real de telemetria/backend, podran crear nuevas alarmas. Por
eso se dejo como modal administrativo separado, con su propio servicio, mock y
utils.

La regla conceptual queda:

```txt
reglas automaticas
-> empresa y activos afectados
-> condicion operativa
-> futura generacion de alarmas
-> centro de alarmas
```

### Archivos modificados

- `frontend/src/views/AlarmsView.vue`
- `frontend/src/components/alarms/AutomaticAlertsModal.vue`
- `frontend/src/services/alarms/useAutomaticAlertRulesService.js`
- `frontend/src/utils/alarms/automaticAlertRuleUtils.js`
- `frontend/src/utils/alarms/automaticAlertRuleUtils.test.js`
- `frontend/src/data/mockAutomaticAlertRules.js`
- `README.md`
- `frontend/README.md`
- `frontend/src/README.md`
- `frontend/src/components/README.md`
- `frontend/src/components/alarms/README.md`
- `frontend/src/services/README.md`
- `frontend/src/services/alarms/README.md`
- `frontend/src/utils/README.md`
- `frontend/src/utils/alarms/README.md`
- `frontend/src/data/README.md`
- `frontend/src/views/README.md`
- `frontend/docs/flujos-principales.md`
- `frontend/docs/archivos-criticos.md`

### Validacion

- Se ejecuto `npm run lint`.
- Se ejecuto `node --test --test-reporter=dot "src/**/*.test.js"`.
- Se ejecuto `npm run format:check`.
- Se ejecuto `npm run build -- --logLevel error`.

## 2026-09-10 - Redisenio visual de Alarmas

### Objetivo

Recrear el modulo de Alarmas como una bandeja operativa similar a la referencia:
cabecera limpia, tabs de estado, filtros compactos, lista seleccionable y panel
de detalle fijo a la derecha.

### Cambios realizados

- Se reemplazo la presentacion tipo tabla por una bandeja de filas
  seleccionables.
- Se agrego `AlarmDetailPanel.vue` para mostrar el detalle dentro de la vista,
  sin abrir modal.
- Se redisenio `AlarmSummaryHeader.vue` como tabs `Todas`, `Activas` y
  `Resueltas`.
- Se simplifico `AlarmFilters.vue` para usar busqueda, estado, empresa, fecha y
  limpiar filtros.
- Se ajusto `AlarmsView.vue` para seleccionar automaticamente la primera alarma
  visible y mantener el panel lateral sincronizado.
- Se agrego filtro `active` en `alarmUtils.js`, interpretado como toda alarma no
  resuelta.
- Se agrego test unitario para asegurar que `active` incluya alarmas abiertas y
  cualquier alarma no resuelta, pero excluya resueltas.
- Se actualizo documentacion local de componentes y vistas.
- Se ajusto la escala visual del modulo para alinearlo con el resto de la
  plataforma: titulos mas contenidos, tabs menos altos, filtros compactos, filas
  mas densas, bordes sutiles y panel lateral menos pesado.
- Se elimino el flujo de estado intermedio, dejando el ciclo operativo en dos
  estados: alarma activa y alarma resuelta.
- Se elimino el modal antiguo de detalle para evitar dos detalles con acciones
  distintas.

### Por que se hizo

La version anterior funcionaba, pero se leia como tabla tecnica. La referencia
necesita un flujo mas operativo: revisar una lista, seleccionar una alarma y
atenderla desde el panel lateral sin perder contexto.

### Archivos modificados

- `frontend/src/views/AlarmsView.vue`
- `frontend/src/components/alarms/AlarmSummaryHeader.vue`
- `frontend/src/components/alarms/AlarmFilters.vue`
- `frontend/src/components/alarms/AlarmList.vue`
- `frontend/src/components/alarms/AlarmDetailPanel.vue`
- `frontend/src/components/alarms/AlarmStatusBadge.vue`
- `frontend/src/services/alarms/useAlarmsService.js`
- `frontend/src/data/mockAlarms.js`
- `frontend/src/utils/alarms/alarmUtils.js`
- `frontend/src/utils/alarms/alarmUtils.test.js`
- `frontend/src/components/alarms/README.md`
- `frontend/src/views/README.md`

### Validacion

- Se ejecuto `npm run lint`.
- Se ejecuto `node --test --test-reporter=dot "src/**/*.test.js"`.
- Se ejecuto `npm run format:check`.
- Se ejecuto `npm run build -- --logLevel error`.

## 2026-09-09 - Modulo de alarmas

### Objetivo

Crear un modulo propio de Alarmas para revisar eventos operativos de la flota sin
mezclarlos con Auditoria ni con Reportes. La vista debe respetar la misma regla
central del proyecto: primero permisos y etiquetas de acceso, despues filtros
visuales.

### Cambios realizados

- Se creo `AlarmsView.vue` como pantalla principal del modulo.
- Se agrego ruta general `/alarmas` para administradores de plataforma y ruta
  por empresa `/app/:empresaId/alarmas` para usuarios con permiso.
- Se agrego acceso en `AppSidebar.vue` con resolucion de empresa activa o
  primera empresa accesible con permiso de alarmas.
- Se actualizo `AppHeader.vue` para identificar el contexto de Alarmas y permitir
  entrada de empresa cuando ese modulo sea el disponible.
- Se agrego la funcion de permiso `alarms` en los datos mock, habilitada para
  administrador y perfiles operativos de demo.
- Se ajusto la normalizacion de la base mock para que accesos seed persistidos
  puedan incorporar funciones nuevas definidas en el seed, sin habilitarlas en
  accesos personalizados.
- Se creo `mockAlarms.js` como semilla de alarmas por empresa y activo.
- Se creo `useAlarmsService.js` para persistir alarmas en `localStorage` con la
  clave `sinergy-alarms`.
- Se agregaron acciones de prototipo para resolver y reabrir alarmas.
- Se agrego auditoria local para las acciones de estado de alarma.
- Se agregaron componentes visuales para KPIs, filtros, tabla, badges y modal de
  detalle.
- Se agrego `alarmUtils.js` para construir filas, recortar por activos
  autorizados, filtrar, ordenar y resumir alarmas.
- Se agrego test unitario para verificar alcance, filtros, orden y resumen.
- Se actualizo la documentacion principal y los README internos para ubicar el
  modulo dentro de la jerarquia del proyecto.

### Por que se hizo

Alarmas representa seguimiento operativo de eventos activos o recientes. No debe
confundirse con Auditoria, porque Auditoria registra acciones del usuario sobre
la plataforma. Tampoco debe vivir dentro de Reportes, porque Reportes genera
documentos y plantillas, mientras Alarmas requiere una bandeja de trabajo para
atender eventos.

El recorte por permisos se dejo antes del render para evitar que un usuario vea
alarmas de vehiculos fuera de su alcance. La logica correcta queda:

```txt
alarmas mock/localStorage
-> activos visibles por permisos/etiquetas
-> alarmas autorizadas
-> filtros visuales
-> tabla, detalle y acciones
```

### Archivos modificados

- `frontend/src/views/AlarmsView.vue`
- `frontend/src/components/alarms/AlarmSummaryHeader.vue`
- `frontend/src/components/alarms/AlarmFilters.vue`
- `frontend/src/components/alarms/AlarmList.vue`
- `frontend/src/components/alarms/AlarmStatusBadge.vue`
- `frontend/src/components/alarms/AlarmDetailPanel.vue`
- `frontend/src/services/alarms/useAlarmsService.js`
- `frontend/src/utils/alarms/alarmUtils.js`
- `frontend/src/utils/alarms/alarmUtils.test.js`
- `frontend/src/data/mockAlarms.js`
- `frontend/src/data/mockDatabase.js`
- `frontend/src/composables/mock/useMockDatabase.js`
- `frontend/src/router/index.js`
- `frontend/src/components/Layout/AppSidebar.vue`
- `frontend/src/components/Layout/AppHeader.vue`
- `README.md`
- `frontend/README.md`
- `frontend/src/README.md`
- `frontend/src/views/README.md`
- `frontend/src/components/README.md`
- `frontend/src/components/alarms/README.md`
- `frontend/src/services/README.md`
- `frontend/src/services/alarms/README.md`
- `frontend/src/utils/README.md`
- `frontend/src/utils/alarms/README.md`
- `frontend/src/data/README.md`
- `frontend/src/router/README.md`
- `frontend/src/components/Layout/README.md`
- `frontend/docs/flujos-principales.md`
- `frontend/docs/archivos-criticos.md`

### Validacion

- Se ejecuto `npm run format:check`.
- Se ejecuto `npm run lint`.
- Se ejecuto `node --test --test-reporter=dot "src/**/*.test.js"`.
- Se ejecuto `npm run build -- --logLevel error`.

## 2026-09-09 - Itinerarios responsive

### Objetivo

Corregir el comportamiento responsive del modulo de Itinerarios dentro de Fleet.
La vista tenia controles con muchos anchos automaticos en una sola fila y tablas
que dependian del scroll horizontal para verse en pantallas chicas.

### Cambios realizados

- Se ajusto `ItineraryPanel.vue` para que la busqueda, selector de activos,
  botones de buscar/actualizar/comparar/exportar/limpiar y rangos de fecha
  puedan envolver en varias lineas.
- Se corrigio la posicion del dropdown de dispositivos para abrir debajo del
  bloque completo de controles, no encima cuando el buscador crece en mobile.
- Se agrego vista mobile de cards en `ItineraryTable.vue` bajo `lg`, manteniendo
  la tabla de escritorio con columnas configurables y ordenamiento.
- Se ajusto la cabecera de `ItineraryTable.vue` para que paginacion, filas,
  orden y columnas no se corten en anchos reducidos.
- Se agrego presentacion mobile tipo cards en el detalle diario de
  `ItineraryDaySummary.vue` bajo `md`.
- Se ajustaron alturas de graficos en mobile en `ItineraryCharts.vue` y
  `ItineraryDaySummary.vue`.
- Se cambio `ItinerarySummary.vue` para usar una columna en pantallas muy
  pequenas antes de pasar a dos y cuatro columnas.

### Por que se hizo

Itinerarios mezcla filtros, seleccion de dispositivos, graficos, resumen y
tablas de datos. En escritorio la tabla es correcta, pero en mobile genera cortes
o scroll excesivo. Las cards entregan lectura rapida y mantienen las acciones
principales sin cambiar la logica de generacion, seleccion, comparacion ni
exportacion.

### Archivos modificados

- `frontend/src/components/activos/itinerarios/ItineraryPanel.vue`
- `frontend/src/components/activos/itinerarios/ItineraryTable.vue`
- `frontend/src/components/activos/itinerarios/ItineraryDaySummary.vue`
- `frontend/src/components/activos/itinerarios/ItineraryCharts.vue`
- `frontend/src/components/activos/itinerarios/ItinerarySummary.vue`
- `frontend/src/components/activos/itinerarios/README.md`

### Validacion

- Se ejecuto `npm run format:check`.
- Se ejecuto `npm run lint`.
- Se ejecuto `node --test --test-reporter=dot "src/**/*.test.js"`.
- Se ejecuto `npm run build -- --logLevel error`.

## 2026-09-09 - Fleet activos responsive

### Objetivo

Corregir el comportamiento responsive del modulo de activos dentro de Fleet. La
vista funcionaba bien en escritorio ancho, pero en pantallas menores el panel de
activos y el mapa se apilaban sin filas definidas y la tabla dependia demasiado
del scroll horizontal.

### Cambios realizados

- Se definieron filas responsive en `ActivosView.vue` antes del breakpoint `xl`
  para que Fleet y mapa compartan el alto disponible al apilarse.
- Se agrego `min-w-0` a los contenedores principales para permitir que los hijos
  reduzcan su ancho sin provocar overflow lateral.
- Se ajusto `FleetPanelHeader.vue` para que busqueda, limpiar orden, agregar
  activo y columnas puedan envolverse en varias lineas cuando el panel queda
  angosto.
- Se mantuvo `FleetTable.vue` como tabla unica de activos en todos los tamanos.
- Se conservo el scroll horizontal propio de la tabla para columnas extensas,
  incluyendo ordenamiento, redimension de columnas, seleccion y menu contextual.
- El footer de paginacion ahora puede envolver sus controles para evitar cortes
  horizontales.

### Por que se hizo

El modulo de activos trabaja mejor como tabla porque permite comparar muchas
columnas de telemetria. El responsive se ajusto alrededor de esa tabla mediante
contenedores con scroll, header flexible y paginacion compacta, sin cambiar el
patron visual principal del modulo.

### Archivos modificados

- `frontend/src/views/ActivosView.vue`
- `frontend/src/components/activos/fleet/FleetPanelHeader.vue`
- `frontend/src/components/activos/fleet/FleetTable.vue`
- `frontend/src/components/activos/fleet/README.md`

### Validacion

- Se ejecuto `npm run format:check`.
- Se ejecuto `npm run lint`.
- Se ejecuto `node --test --test-reporter=dot "src/**/*.test.js"`.
- Se ejecuto `npm run build`.

## 2026-09-07 - Usuarios

### Objetivo

Agregar al directorio de usuarios el mismo funcionamiento de catalogo que se
incorporo en Empresas: ordenamiento, cambio entre lista/cards y paginacion, sin
modificar la logica de permisos, filtros, accesos ni el drawer de detalle.

### Cambios realizados

- Se agrego estado `userViewMode` en el composable de usuarios.
- Se agregaron `userSortKey`, `userSortDirection`, `currentPage`, `pageSize`,
  `sortedUsers` y `paginatedUsers`.
- Se conecto `userViewMode` desde `UserManagementView.vue` hacia
  `UserListPanel.vue`.
- Se agrego una toolbar de catalogo en la cabecera del listado de usuarios con
  selector de orden, cambio de direccion y selector lista/cards.
- Se mantuvo la vista existente como modo `Lista`.
- Se agrego una vista `Cards` que usa los mismos usuarios filtrados y muestra
  nombre, correo, estado, rol principal, cantidad de accesos y resumen de
  empresa.
- Al seleccionar un usuario desde lista o cards se abre el mismo drawer de
  detalle existente.
- Se reemplazo el patron de `Mostrar mas` por paginacion real, igual que en
  Empresas.
- Los cambios de filtros u orden reinician la pagina actual para evitar paginas
  vacias.
- Se ajusto la cabecera del listado para responder mejor en pantallas pequenas
  cuando aparece el selector de vista.

### Por que se hizo

El modulo de usuarios ya tenia una vista tipo lista/tabla, pero no compartia el
flujo completo de catalogo que quedo en Empresas. Agregar cards, ordenamiento y
paginacion deja ambos modulos con el mismo patron operativo: filtrar, ordenar,
elegir la vista y navegar paginas.

El cambio se dejo en el nivel de presentacion y navegacion del directorio: los
permisos, accesos, alcances operativos, etiquetas y acciones de auditoria siguen
dependiendo de la misma logica existente. Las cards y la lista consumen el mismo
resultado filtrado, ordenado y paginado.

### Archivos modificados

- `frontend/src/views/UserManagementView.vue`
- `frontend/src/components/users/UserListPanel.vue`
- `frontend/src/composables/users/useUserAccessManagement.js`
- `frontend/src/components/users/README.md`
- `frontend/src/composables/users/README.md`
- `frontend/src/views/README.md`

### Validacion

- Se ejecuto `npm run format:check`.
- Se ejecuto `npm run lint`.
- Se ejecuto `node --test --test-reporter=dot "src/**/*.test.js"`.
- Se ejecuto `npm run build`.

## 2026-09-04 - Empresas

### Objetivo

Reorganizar visualmente el modulo de empresas para acercarlo a una vista de
gestion administrativa: filtros laterales, indicadores superiores y una tabla
principal compacta. La version anterior funcionaba como directorio de cards, pero
ocupaba mas espacio vertical y mezclaba busqueda, filtros y KPIs dentro del
header.

### Cambios realizados

- En esa version se simplifico la cabecera de Empresas y se mantuvo alli el
  boton `Nueva empresa`; su ubicacion actual se documenta en la entrada del
  `2026-09-23`.
- Se creo un panel lateral de filtros con busqueda, estado, region, ciudad y
  limpiar filtros.
- Se creo una franja de resumen con empresas totales, activas, suspendidas e
  inactivas.
- Se cambio el catalogo principal para usar tabla como vista principal.
- Se agrego toolbar de ordenamiento y cambio de vista tabla/grilla.
- Se reemplazo el patron de `Mostrar mas` por paginacion.
- Se agregaron filtros por region y ciudad usando opciones derivadas de las
  empresas disponibles.
- Se reemplazo el boton de tres puntos en la tabla por una accion explicita
  `Configurar`, ya que esa accion abre directamente el panel de configuracion de
  la empresa.
- Se ajusto el panel lateral de filtros para estirarse con el alto del contenido
  principal y no quedar visualmente mas corto que la tabla.
- Se cambio el overlay del panel de configuracion de empresa desde azul
  translucido a negro translucido y se aclaro el fondo interno del contenido para
  evitar que la pantalla se vea con tinte azul.
- Se ajusto el filtro visual `Inactivas` para incluir empresas con estado
  `inactive` e `internal`. El badge `Interna` se conserva en la tabla, pero no se
  muestra como filtro separado para mantener el panel simple.
- Se corrigio formato Prettier despues de la implementacion.

### Por que se hizo

La pantalla de Empresas necesitaba sentirse mas parecida a una herramienta de
administracion que a una grilla de tarjetas. La tabla permite comparar empresas
por RUT, ubicacion, estado, activos, usuarios y reportes base de forma mas
rapida. Separar filtros del header reduce ruido visual y deja la cabecera como
presentacion del modulo.

Tambien se corrigio la diferencia entre el resumen y los filtros: si las empresas
internas se cuentan como inactivas en el resumen, el filtro `Inactivas` debe
mostrar tambien esas empresas para no confundir al usuario.

### Archivos modificados

- `frontend/src/views/CompanyManagementView.vue`
- `frontend/src/components/companies/CompanyManagementHeader.vue`
- `frontend/src/components/companies/CompanyFiltersPanel.vue`
- `frontend/src/components/companies/CompanySummaryStrip.vue`
- `frontend/src/components/companies/CompanyCatalog.vue`
- `frontend/src/components/companies/CompanyConfigPanel.vue`
- `frontend/src/composables/companies/useCompanyManagement.js`
- `frontend/src/components/companies/README.md`
- `frontend/src/composables/companies/README.md`
- `frontend/src/views/README.md`

### Validacion

- Se ejecuto `npm run format:check`.
- Se ejecuto `npm run lint`.
- Se ejecuto `node --test --test-reporter=dot "src/**/*.test.js"`.
- Se ejecuto `npm run build`.

## 2026-09-04 - Geocercas

### Objetivo

Mejorar el flujo de gestion de geocercas en la vista de activos. Antes la
edicion y la eliminacion tenian comportamientos poco claros: al editar no habia
una salida explicita para cancelar, algunos cambios podian sentirse aplicados al
momento, y eliminar varias geocercas no estaba disponible desde el panel.

La meta fue dejar tres reglas simples:

- Editar una geocerca debe permitir `Guardar` o `Cancelar`.
- Eliminar varias geocercas debe ser posible, pero sin dejar la interfaz en modo
  seleccion por defecto.
- Mapa, panel lateral, estado seleccionado y auditoria deben quedar sincronizados.

### 1. Edicion de geocercas con guardar y cancelar

**Que se hizo**

- Se agrego boton `Guardar` en el panel de edicion.
- Se agrego boton `Cancelar` en el panel de edicion.
- Se separo la accion de salir de la accion de guardar.
- Al guardar, se confirma la geocerca editada y se cierra el modo edicion.
- Al cancelar, se descartan los cambios no confirmados y se vuelve al estado
  anterior.

**Por que se hizo**

El flujo anterior no dejaba suficientemente claro si los cambios estaban siendo
confirmados o solo preparados. Esto podia provocar que el usuario moviera puntos,
cambiara campos o ajustara la geocerca sin entender bien cuando quedaba guardada.

Con este cambio, la edicion funciona como un borrador: el usuario puede probar
cambios, revisar el resultado en el mapa y decidir si guarda o cancela.

**Archivos modificados**

- `frontend/src/components/activos/geocercas/GeofenceEditorPanel.vue`
- `frontend/src/components/activos/map/ActivosMapPanel.vue`
- `frontend/src/composables/activos/map/useActivosMap.js`
- `frontend/src/composables/activos/map/geofences/useMapGeofences.js`
- `frontend/src/composables/activos/map/geofences/useGeofenceEditing.js`
- `frontend/src/composables/activos/map/geofences/useMapPanelGeofenceActions.js`

### 2. Edicion como borrador antes de confirmar

**Que se hizo**

- Se evito que los cambios de geometria se emitan automaticamente al arrastrar
  puntos del poligono.
- Se evito que cambios de nombre, descripcion o color actualicen la geocerca
  final sin pasar por `Guardar`.
- Se agrego una funcion de guardado explicita para emitir la version final de la
  geocerca editada.
- Se mantuvo la vista previa del dibujo en el mapa mientras se edita.

**Por que se hizo**

La edicion de geocercas tiene alto riesgo operativo: mover un punto o cambiar un
radio puede alterar zonas de entrada, salida, permanencia o alertas asociadas. Por
eso la plataforma debe evitar cambios accidentales y dejar una confirmacion clara.

**Archivos modificados**

- `frontend/src/composables/activos/map/geofences/useGeofenceEditing.js`
- `frontend/src/composables/activos/map/geofences/useMapGeofences.js`
- `frontend/src/composables/activos/map/geofences/useMapPanelGeofenceActions.js`

### 3. Cancelacion limpia del modo edicion

**Que se hizo**

- Se agrego manejo de cancelacion desde el panel de edicion.
- Al cancelar, se cierra el modo edicion sin emitir cambios.
- Si la geocerca que se estaba editando deja de existir en la lista, el mapa sale
  automaticamente del modo edicion.
- Se actualizo el texto de ayuda para indicar que se debe guardar o cancelar.

**Por que se hizo**

Si una geocerca se elimina desde otro panel mientras estaba siendo editada, el
mapa podia quedar en un estado visual incoherente. Tambien era necesario que el
usuario pudiera salir de una edicion sin sentirse obligado a guardar.

**Archivos modificados**

- `frontend/src/components/activos/geocercas/GeofenceEditorPanel.vue`
- `frontend/src/components/activos/map/ActivosMapPanel.vue`
- `frontend/src/composables/activos/map/geofences/useMapGeofences.js`
- `frontend/src/composables/activos/map/geofences/useMapPanelGeofenceActions.js`

### 4. Eliminacion multiple de geocercas

**Que se hizo**

- Se agrego soporte para eliminar mas de una geocerca a la vez.
- Se agrego una funcion `deleteGeofences` para recibir varios IDs.
- La eliminacion multiple queda limitada a las geocercas visibles y disponibles
  dentro del contexto actual.
- Al eliminar varias, se actualiza la lista, se refresca el mapa y se limpia la
  seleccion activa si correspondia.
- Se agrego confirmacion antes de ejecutar la eliminacion multiple.

**Por que se hizo**

Antes habia que eliminar geocercas una por una. Eso era lento para limpieza o
mantencion de flotas con muchas zonas configuradas. La eliminacion multiple
reduce pasos, pero mantiene control mediante confirmacion y alcance acotado.

**Archivos modificados**

- `frontend/src/composables/activos/geocercas/useGeofences.js`
- `frontend/src/composables/activos/view/useActivosGeofenceActions.js`
- `frontend/src/composables/activos/fleet/useFleetPanelGeofences.js`
- `frontend/src/views/ActivosView.vue`
- `frontend/src/components/activos/fleet/FleetSectionContent.vue`
- `frontend/src/components/activos/fleet/FleetListPanel.vue`
- `frontend/src/components/activos/fleet/FleetGeofencePanel.vue`

### 5. Modo de seleccion multiple no visible por defecto

**Que se hizo**

- La lista de geocercas vuelve a mostrarse normal por defecto.
- Se agrego la accion `Eliminar varias` para activar el modo seleccion.
- Al entrar al modo seleccion, aparecen los checks y la barra de acciones.
- El boton cambia a `Cancelar seleccion` mientras el modo esta activo.
- Al cancelar seleccion, se limpian las geocercas marcadas.

**Por que se hizo**

Mostrar checks y una barra de seleccion desde el inicio hacia que la pantalla se
viera como si siempre estuviera en modo eliminar. Visualmente era mas pesado y
confundia una accion puntual con el estado normal del modulo.

Con este ajuste, la accion existe cuando se necesita, pero la vista principal se
mantiene limpia.

**Archivos modificados**

- `frontend/src/components/activos/fleet/FleetGeofencePanel.vue`
- `frontend/src/components/activos/fleet/README.md`

### 6. Auditoria de eliminacion multiple

**Que se hizo**

- Se agrego registro de auditoria para la eliminacion multiple.
- La accion registrada es `geofence:delete-bulk`.
- Se agrego etiqueta legible para auditoria: `Geocercas eliminadas`.

**Por que se hizo**

Eliminar varias geocercas puede afectar configuraciones operativas importantes.
La accion debe quedar trazable para saber quien elimino, cuando se hizo y que
tipo de operacion se ejecuto.

**Archivos modificados**

- `frontend/src/composables/activos/view/useActivosGeofenceActions.js`
- `frontend/src/views/AuditView.vue`

### 7. Documentacion actualizada

**Que se hizo**

- Se actualizaron README internos relacionados con fleet, geocercas, mapa y
  acciones de vista.
- Se dejo documentado el flujo de edicion con guardar/cancelar.
- Se dejo documentado el flujo de eliminacion multiple.
- Se dejo documentado que la seleccion multiple se activa manualmente y no aparece
  por defecto.

**Por que se hizo**

Los README internos sirven para entender rapidamente como esta organizado el
modulo y que responsabilidades tiene cada archivo. Como el flujo cambio en varias
capas, era necesario dejar registro para futuras modificaciones.

**Archivos modificados**

- `frontend/src/components/activos/fleet/README.md`
- `frontend/src/components/activos/geocercas/README.md`
- `frontend/src/composables/activos/geocercas/README.md`
- `frontend/src/composables/activos/map/geofences/README.md`
- `frontend/src/composables/activos/view/README.md`

### Validacion

**Que se valido**

- Se agrego prueba automatizada para la eliminacion multiple de geocercas.
- Se ejecuto la suite de tests del frontend.
- Se valido formato, lint y build del frontend despues de los cambios.

**Comandos utilizados**

- `node --test --test-reporter=dot "src/**/*.test.js"`
- `npm run lint`
- `npm run format:check`
- `npm run build`

**Archivo de prueba modificado**

- `frontend/src/composables/activos/geocercas/useGeofences.test.js`

## 2026-09-10 - Correccion de `Ver activo en mapa` desde Alarmas

**Que se hizo**

- Se cambio la navegacion del boton `Ver activo en mapa` para usar la ruta
  nombrada `AppActivos`.
- La navegacion ahora envia `activoId`, `from=alarmas` y `alarmId` como query.
- En la vista de Activos, cuando existe un `activoId` en la URL, se fuerza la
  seccion `activos`, se limpian filtros visuales de busqueda, estado, ciudad y
  grupo de vehiculos, y se selecciona el activo solicitado.
- La restauracion del workspace ya no pisa el activo solicitado por URL.
- Si un filtro visual anterior dejaba fuera al activo, la vista lo vuelve a
  incluir solamente desde las listas ya autorizadas de la empresa.

**Por que se hizo**

El boton podia navegar correctamente, pero la vista de Activos podia restaurar
un estado previo o conservar filtros visuales que escondian el activo. Eso hacia
que el mapa no siempre quedara centrado ni seleccionado en el vehiculo de la
alarma.

El cambio mantiene la separacion de permisos: la seleccion por URL no busca en
todos los activos, solo en el conjunto permitido por `visibleAssets`.

**Archivos modificados**

- `frontend/src/views/AlarmsView.vue`
- `frontend/src/views/ActivosView.vue`
- `frontend/src/composables/activos/view/useActivosWorkspacePersistence.js`
- `frontend/src/views/README.md`
- `frontend/src/components/alarms/README.md`
- `frontend/src/composables/activos/view/README.md`

## 2026-09-10 - Simplificacion del modal de alertas automaticas

**Que se hizo**

- Se reemplazo el modal anterior de alertas automaticas por una version mas
  simple.
- El panel ahora mantiene una lista de reglas a la izquierda y un formulario
  compacto a la derecha.
- Se eliminaron de la interfaz los bloques de resumen, filtros internos de
  reglas, notificaciones por canal, enfriamiento visible y resumen lateral.
- El formulario quedo centrado en lo necesario para crear una alerta automatica:
  nombre, empresa, tipo, condicion, activos, prioridad y estado activa/pausada.
- La persistencia y el modelo interno se conservaron para no romper reglas ya
  guardadas.

**Por que se hizo**

El modal estaba sobredimensionado para el uso esperado. La configuracion de
alertas automaticas debe ser un CRUD simple de reglas, mientras que las alertas
activadas, su detalle, resolucion y navegacion al recorrido corresponden al
centro de alertas ocurridas.

**Archivos modificados**

- `frontend/src/components/alarms/AutomaticAlertsModal.vue`
- `frontend/src/components/alarms/README.md`
- `frontend/src/views/README.md`

## 2026-09-11 - Rediseno del modal de configuracion de alertas

**Que se hizo**

- Se ajusto el modal de crear/editar reglas automaticas para que use un dialogo
  central similar al diseno objetivo.
- El formulario quedo dividido en cuatro bloques claros:
  informacion general, alcance, configuracion de disparo y notificaciones.
- La configuracion de disparo agrupa en una misma seccion las condiciones y el
  horario de evaluacion.
- Las notificaciones ahora se muestran como tarjetas seleccionables para
  plataforma y correo electronico.
- Se mantuvo la logica existente de reglas por tipo de alerta, incluyendo las
  condiciones dinamicas de velocidad, bateria, sin senal, geocerca, detencion,
  encendido y combustible.
- Para geocercas se conserva la seleccion por todas, por grupo de geocercas o
  por geocercas especificas.

**Por que se hizo**

El formulario anterior ya funcionaba, pero visualmente no seguia la referencia:
las secciones se percibian como una lista larga y no como un configurador claro.
El cambio ordena la informacion sin cambiar el modelo de datos ni la persistencia
de reglas automaticas.

**Archivos modificados**

- `frontend/src/components/alarms/AlarmConfigPanel.vue`
- `frontend/src/components/alarms/README.md`

**Validacion**

- `npm run lint`
- `npm run format:check`
- `npm run build -- --logLevel error`

## 2026-09-11 - Optimizacion de rendimiento en Alertas

**Que se hizo**

- Se quitaron busquedas lineales repetidas en reglas automaticas al comparar
  activos seleccionados, reemplazandolas por `Set`.
- El historial ahora descarta alarmas no autorizadas antes de construir filas
  normalizadas.
- El resumen de alarmas calcula activos, abiertas, criticas y resueltas en un
  solo recorrido.
- El modal de configuracion usa `Set` para consultar activos, etiquetas y
  geocercas seleccionadas por fila.
- Los selectores masivos de activos y geocercas dentro del modal limitan la
  cantidad de filas renderizadas y muestran un mensaje para usar el buscador
  cuando hay mas resultados.
- Los servicios de alarmas y reglas automaticas usan `structuredClone` cuando
  esta disponible, dejando `JSON.parse(JSON.stringify(...))` solo como fallback.

**Por que se hizo**

El modulo funcionaba, pero podia sentirse lento con muchas reglas, activos o
geocercas porque varias listas se recorrian completas varias veces y el modal
intentaba renderizar todos los elementos disponibles. La optimizacion reduce
trabajo de CPU y peso de DOM sin cambiar el flujo visible ni la persistencia.

**Archivos modificados**

- `frontend/src/components/alarms/AlarmConfigPanel.vue`
- `frontend/src/utils/alarms/alarmUtils.js`
- `frontend/src/utils/alarms/alarmUtils.test.js`
- `frontend/src/utils/alarms/automaticAlertRuleUtils.js`
- `frontend/src/services/alarms/useAlarmsService.js`
- `frontend/src/services/alarms/useAutomaticAlertRulesService.js`
- `frontend/src/views/AlarmsView.vue`
- `frontend/src/components/alarms/README.md`
- `frontend/src/utils/alarms/README.md`

**Validacion**

- `node --test src/utils/alarms/alarmUtils.test.js src/utils/alarms/automaticAlertRuleUtils.test.js`
- `npm run lint`
- `npm run format:check`
- `npm run build -- --logLevel error`

## 2026-09-21 - Modularizacion de exportacion de itinerarios

**Que se hizo**

- Se redujo `itineraryExportService.js` a una fachada publica de exportaciones.
- Se movio la logica compartida de columnas, celdas, ordenamiento y metricas a
  `itineraryExportModel.js`.
- Se separo toda la generacion PDF en `itineraryPdfExportService.js`.
- Se separo toda la generacion Excel en `itineraryExcelExportService.js`.
- Se conservaron los nombres y puntos de entrada utilizados por el resto de la
  plataforma.

**Por que se hizo**

El servicio original superaba las 2800 lineas y mezclaba dos formatos con
reglas visuales distintas. La nueva estructura permite modificar PDF o Excel
sin recorrer ni arriesgar el otro formato, manteniendo una sola fuente para la
informacion que ambos comparten.

**Archivos modificados**

- `frontend/src/services/itinerarios/itineraryExportService.js`
- `frontend/src/services/itinerarios/itineraryExportModel.js`
- `frontend/src/services/itinerarios/itineraryPdfExportService.js`
- `frontend/src/services/itinerarios/itineraryExcelExportService.js`
- `frontend/src/services/itinerarios/README.md`
- `bitacora/modulos/modularizacion.md`

**Validacion**

- 181 pruebas aprobadas.
- `npm run lint`
- `npm run format:check`
- `npm run build`

## 2026-09-21 - Correccion del boton Abrir en la busqueda global

**Que se hizo**

- El envio de la busqueda ahora sincroniza inmediatamente el texto pendiente
  antes de elegir el primer resultado.
- El boton `Abrir` queda deshabilitado cuando el campo esta vacio.
- Se evita navegar a un resultado predeterminado que no corresponde a una
  consulta escrita por el usuario.

**Por que se hizo**

La lista usa un retraso breve para evitar recalcular en cada pulsacion. Antes,
si el usuario escribia y presionaba `Abrir` rapidamente, el boton podia usar los
resultados de la consulta anterior. Con el campo vacio tambien podia abrir el
primer elemento general sin una intencion clara.

**Archivos modificados**

- `frontend/src/components/Layout/HeaderGlobalSearch.vue`
- `frontend/src/composables/layout/useAppHeaderGlobalSearchState.js`

**Validacion**

- `npm run lint`
- `npm run format:check`
- `npm run build`

### Ajuste posterior

- Se elimino el boton visible `Abrir` porque repetia de forma menos precisa la
  seleccion directa de resultados del desplegable.
- El campo recupero el espacio horizontal que ocupaba el boton.
- Se conservo Enter como atajo de teclado para abrir el primer resultado de la
  consulta actual.
- El boton para limpiar la busqueda se movio al borde derecho del campo.

## 2026-09-21 - Ajuste de escala visual en Empresas

**Que se hizo**

- Se amplio el panel lateral de filtros de `220px` a `240px` en escritorio.
- Se aumentaron moderadamente las tipografias de filtros, resumen, tabla,
  tarjetas y paginacion.
- Los inputs, selectores, filas y botones ganaron altura para mejorar lectura y
  area de interaccion.
- Se mantuvo la estructura responsive y la misma cantidad de informacion.

**Por que se hizo**

El modulo utilizaba textos de `9px` y `10px` en gran parte de su interfaz, por
lo que se percibia mas pequeno que el resto de la plataforma y costaba leerlo
en pantallas amplias.

**Archivos modificados**

- `frontend/src/views/CompanyManagementView.vue`
- `frontend/src/components/companies/CompanyManagementHeader.vue`
- `frontend/src/components/companies/CompanyFiltersPanel.vue`
- `frontend/src/components/companies/CompanySummaryStrip.vue`
- `frontend/src/components/companies/CompanyCatalog.vue`

**Validacion**

- `npm run lint`
- `npm run format:check`
- `npm run build`

## 2026-09-21 - Rediseño del catálogo de reglas de evento

**Que se hizo**

- Se amplio el modal de reglas hasta un maximo de `1260px` en escritorio.
- El encabezado ahora incluye contexto, titulo, descripcion y cierre accesible.
- Se agrego icono al buscador y un contador de resultados filtrados.
- Las reglas se muestran en dos columnas en escritorio y una columna en
  pantallas reducidas.
- Se aumento la escala de textos, controles y tarjetas.
- El resumen operativo quedo separado por un divisor en la parte inferior de
  cada tarjeta.
- Se agrego una nota en el pie explicando donde se aplican las reglas.
- Se conservaron crear, editar y eliminar reglas personalizadas.

**Por que se hizo**

El modal anterior estaba limitado a `680px`, presentaba todas las reglas en una
sola columna y utilizaba una escala menor que el resto de la plataforma. El
nuevo diseño aprovecha mejor el espacio disponible y facilita comparar reglas
sin cambiar su comportamiento.

**Archivos modificados**

- `frontend/src/components/reports/ReportEventRulesModal.vue`
- `frontend/src/components/reports/README.md`

**Validacion**

- `npm run lint`
- `npm run format:check`
- `npm run build`

### Ajuste posterior de escala

- Se redujo el ancho maximo de `1260px` a `1120px` para adaptarlo a la escala
  real de la plataforma.
- Se compacto el encabezado, barra de busqueda, tarjetas, acciones y pie.
- La altura maxima quedo en `88vh`, manteniendo scroll interno para no ocupar
  toda la pantalla cuando existen mas reglas que en la referencia visual.
- Se conservaron las dos columnas y la misma jerarquia del diseño objetivo.

### Optimización de apertura

- El formulario completo de crear/editar dejo de importarse y montarse junto al
  catalogo.
- `ReportEventRuleFormModal.vue` ahora se carga de forma asincrona durante un
  periodo inactivo y se monta solamente al crear o editar una regla.
- Se retiro el desenfoque del fondo del modal para evitar composicion grafica
  adicional durante apertura y desplazamiento.
- El catalogo abre sin ejecutar anticipadamente los watchers, computados y
  secciones internas del formulario.

### Ajuste del encabezado

- Se redujo la altura de la franja superior.
- Se compacto la escala del contexto, titulo, descripcion y boton de cierre.
- Se agregaron una linea inferior naranja y planos diagonales sutiles para dar
  detalle visual sin aumentar el contenido ni la altura del modal.

## 2026-09-14 - Alertas visibles en Fleet por empresa

**Que se hizo**

- Se conectaron las filas y resumen de alertas calculados en `ActivosView` con
  `FleetListPanel`.
- El panel de Fleet ahora recibe `alertRows` y `alertSummary`, por lo que la
  seccion `Alertas` deja de depender de sus valores vacios por defecto.
- Se agrego el evento `view-alert-route` desde Fleet hacia `ActivosView`.
- El boton `Ver recorrido` ahora navega a `Itinerarios` con `activoId`,
  `alarmId` y fecha de la alerta.
- Para administrador de plataforma se agrego un respaldo con los activos mock de
  la empresa cuando `visibleAssets` no trae coincidencias, manteniendo
  `visibleAssets` como filtro para usuarios normales.

**Por que se hizo**

El historial de alertas ya tenia datos mock por empresa, pero el panel de Fleet
no los mostraba porque `ActivosView` no los estaba pasando al componente. Ademas,
si la lista de activos visibles no coincidia con los activos usados por el mock
de alertas, el filtro dejaba la seccion sin resultados.

**Archivos modificados**

- `frontend/src/views/ActivosView.vue`

**Validacion**

- `npm run lint`
- `npm run format:check`
- `npm run build -- --logLevel error`

## 2026-09-14 - Motivo visible en alertas de Fleet

**Que se hizo**

- Se agrego el motivo de disparo dentro de la columna `Alerta` del historial
  compacto de Fleet.
- El motivo usa el campo `triggerReason` ya calculado desde el historial de
  alertas y cae a `description` o tipo cuando no hay metadatos suficientes.
- Se muestra con la etiqueta `Motivo:` para que sea visible sin abrir el
  recorrido.
- Se evito una columna extra para no comprimir titulo, activo, fecha y accion.
- Se subio la escala tipografica del panel de Fleet Alertas para que filas,
  filtros, resumen, motivo, estado, paginacion y boton de recorrido sean
  legibles sin depender del zoom del navegador.

**Por que se hizo**

Desde Fleet se podia ver que existia una alerta, pero no quedaba claro por que
se habia disparado sin entrar al detalle o al recorrido. El usuario necesita ver
la causa directamente desde el panel operativo.

**Archivos modificados**

- `frontend/src/components/activos/fleet/FleetAlertsPanel.vue`
- `frontend/src/components/activos/fleet/README.md`

**Validacion**

- `npm run lint`
- `npm run format:check`
- `npm run build -- --logLevel error`

## 2026-09-11 - Correccion de condicion de encendido en Alertas

**Que se hizo**

- Se corrigio la regla automatica de tipo `ignition`.
- La condicion ya no se guarda como `schedule = Fuera de horario`.
- Ahora la condicion representa el evento real: `ignitionState = Encendido`.
- El concepto de `fuera de horario` queda en el bloque de horario, forzando
  `schedule.type = custom` para este tipo de alerta.
- En el formulario se cambio el campo deshabilitado por un mensaje explicativo:
  la alerta se activa cuando el activo enciende fuera del horario permitido.
- Se actualizo la semilla mock de `Encendido fuera de horario`.
- Se agrego prueba para validar normalizacion legacy y etiqueta legible.

**Por que se hizo**

La version anterior mezclaba condicion y horario. Eso hacia que la condicion
pareciera un dato tecnico de agenda, cuando en realidad la condicion operativa
es el encendido del contacto. Separar ambos conceptos deja el flujo mas claro:

```txt
condicion -> contacto encendido
horario -> ventana permitida
alarma -> encendido fuera de esa ventana
```

**Archivos modificados**

- `frontend/src/components/alarms/AlarmConfigPanel.vue`
- `frontend/src/utils/alarms/automaticAlertRuleUtils.js`
- `frontend/src/utils/alarms/automaticAlertRuleUtils.test.js`
- `frontend/src/data/mockAutomaticAlertRules.js`
- `frontend/src/utils/alarms/README.md`

**Validacion**

- `node --test src/utils/alarms/automaticAlertRuleUtils.test.js`
- `npm run lint`

## 2026-09-11 - Motivo visible en recorrido de alertas

**Que se hizo**

- Se agrego `getAlarmTriggerReason` para construir un motivo legible desde los
  metadatos de cada alerta.
- El historial de alertas ahora expone el motivo en el panel lateral de detalle.
- El motivo tambien participa en la busqueda del historial.
- Al usar `Ver recorrido`, Activos envia el motivo dentro de `focusedAlert`.
- `ItineraryPanel` conserva ese motivo en el punto especial de alerta.
- El mapa de itinerarios muestra el motivo en el tooltip del marcador de alerta.
- Cuando el punto seleccionado viene desde una alerta, el tooltip se abre
  automaticamente para que no haya que pasar el mouse sobre el marcador.

**Por que se hizo**

El recorrido mostraba el punto aproximado de la alerta, pero no explicaba por que
se habia generado. Eso obligaba al usuario a volver al historial para entender
si fue velocidad, bateria, geocerca, sin senal u otra condicion.

El flujo queda:

```txt
alerta activada
-> metadata de disparo
-> motivo legible
-> detalle de historial
-> recorrido del dia
-> tooltip del punto de alerta
```

**Archivos modificados**

- `frontend/src/utils/alarms/alarmUtils.js`
- `frontend/src/utils/alarms/alarmUtils.test.js`
- `frontend/src/components/alarms/AlarmDetailPanel.vue`
- `frontend/src/views/ActivosView.vue`
- `frontend/src/components/activos/itinerarios/ItineraryPanel.vue`
- `frontend/src/composables/activos/map/useMapItinerary.js`
- `frontend/src/components/alarms/README.md`
- `frontend/src/components/activos/itinerarios/README.md`
- `frontend/src/composables/activos/map/README.md`

**Validacion**

- `node --test src/utils/alarms/alarmUtils.test.js src/utils/alarms/automaticAlertRuleUtils.test.js`
- `npm run lint`
- `npm run format:check`
- `npm run build -- --logLevel error`

## 2026-09-23 - Reubicacion de Nueva empresa en el catalogo

**Que se hizo**

- Se retiro la accion `Nueva empresa` de la cabecera descriptiva del modulo.
- Se incorporo el boton al extremo derecho de la toolbar del catalogo, despues
  de los controles de ordenamiento y cambio de vista.
- Se mantuvo el mismo flujo de apertura de `CompanyEditorModal`, trasladando el
  evento `create-company` desde la cabecera hacia `CompanyCatalog`.
- En anchos reducidos la toolbar puede envolver sus controles sin superponer el
  boton ni la informacion del listado.
- Se retiro de la vista la cabecera local con icono, contexto, titulo y
  descripcion. El modulo comienza directamente con sus filtros, resumen y
  catalogo, ya que el header global identifica la vista actual.
- Se redujeron los margenes exteriores, la separacion entre paneles y el ancho
  fijo de filtros para que el resumen y el catalogo aprovechen mejor el espacio
  disponible sin aumentar artificialmente la altura de las filas.
- El panel de filtros y el catalogo ahora ocupan la altura util restante de la
  vista. Las filas permanecen compactas arriba y la paginacion queda alineada
  con el borde inferior, evitando un bloque de fondo suelto bajo el contenido.

**Por que se hizo**

La accion crea un elemento del catalogo, por lo que debe estar junto a los
controles que operan sobre ese listado. La nueva posicion coincide con la
referencia visual y deja la cabecera dedicada al contexto del modulo.

**Archivos modificados**

- `frontend/src/views/CompanyManagementView.vue`
- `frontend/src/components/companies/CompanyManagementHeader.vue`
- `frontend/src/components/companies/CompanyCatalog.vue`
- `frontend/src/components/companies/README.md`

**Validacion**

- `npm run lint`
- `npm run build -- --logLevel error`

## 2026-09-23 - Navegacion por pestanas en Alertas

**Que se hizo**

- Los controles `Configuracion de alertas` e `Historial de alertas` dejaron de
  mostrarse como botones solidos con iconos.
- Se reemplazaron por pestanas de texto sobre un divisor horizontal.
- La vista activa usa texto azul y un indicador naranja inferior, sin sombras ni
  cambios de posicion.

**Archivos modificados**

- `frontend/src/views/AlarmsView.vue`
- `frontend/src/components/alarms/README.md`

## 2026-09-23 - Icono compartido para limpiar filtros de Alertas

**Que se hizo**

- Se agrego `filter-clear` al catalogo central `SvgIcon` usando el SVG de filtro
  con cierre solicitado.
- Los botones `Limpiar` de configuracion e historial de Alertas dejaron de usar
  el icono local de recarga y ahora reutilizan `filter-clear` a `18px`.

**Archivos modificados**

- `frontend/src/components/icons/SvgIcon.vue`
- `frontend/src/components/alarms/AlarmRuleFilters.vue`
- `frontend/src/components/alarms/AlarmFilters.vue`
- `frontend/src/components/icons/README.md`

## 2026-09-23 - Correccion de escala tipografica duplicada en Usuarios

**Que se hizo**

- Se retiro la clase local `users-management-readable` y sus reglas de tamano
  desde `8px` hasta `18px`.
- Usuarios ahora depende de la misma escala global `module-readable` que
  Auditoria, Empresas, Alertas, Reportes y Mantenciones.
- Activos conserva su exclusion deliberada para mantener la densidad de mapas y
  controles operativos.

**Por que se hizo**

La escala global solo unificaba correctamente los modulos que no agregaban una
segunda capa tipografica. Usuarios mantenia una ampliacion propia y, por tanto,
contradecia la unificacion informada anteriormente.

**Archivos modificados**

- `frontend/src/views/UserManagementView.vue`
- `frontend/src/components/users/README.md`

## 2026-09-23 - Iconos semanticos para tipos de alerta

**Que se hizo**

- Se agregaron al catalogo `SvgIcon` los iconos `alarm-no-signal`,
  `alarm-geofence-exit`, `alarm-fuel-variation` y `alarm-speeding`.
- La tabla de configuracion de Alertas ahora usa estos iconos para sin reporte
  GPS, salida de geocerca, variacion de combustible y exceso de velocidad.
- Tras la primera revision visual se simplificaron las formas: wifi desconectado,
  pin clasico, gota de combustible y velocimetro de arco con aguja. Los cuatro
  usan trazo `2` para mejorar su lectura dentro de contenedores pequenos.
- El icono `alarm-no-signal` se reemplazo posteriormente por una version rellena
  de alta resolucion con ondas Wi-Fi interrumpidas. Se adapto de `512x512` a
  `SvgIcon`, eliminando XML y DOCTYPE y usando `currentColor`.
- `alarm-geofence-exit` tambien se reemplazo por una version rellena de alta
  resolucion que combina marcador y ondas de ubicacion. Se aplico la misma
  conversion a `currentColor` sin metadatos XML externos.
- El mismo SVG recibido se asigno despues a `alarm-fuel-variation`. Como su
  geometria es identica a la de geocerca, ambos nombres comparten una sola
  definicion dentro de `SvgIcon` para evitar duplicar los seis trazados.
- Esa asignacion temporal se corrigio al recibir el SVG adecuado de combustible.
  `alarm-fuel-variation` vuelve a tener una definicion independiente con surtidor,
  deposito y gota, adaptada a `currentColor` sobre `512x512`.
- `alarm-speeding` se reemplazo por un velocimetro relleno de alta resolucion con
  indicador de advertencia. Se conservo el `viewBox` de `512x512` y se adapto el
  relleno a `currentColor`.
- El alcance se limito al modulo de Alertas para revisar visualmente el resultado
  antes de reutilizarlos en historial, Fleet u otras vistas.

**Archivos modificados**

- `frontend/src/components/icons/SvgIcon.vue`
- `frontend/src/components/alarms/AlarmRuleTable.vue`
- `frontend/src/components/icons/README.md`
- `frontend/src/components/alarms/README.md`

## 2026-09-23 - Icono compartido de Activos en Fleet

**Que se hizo**

- La pestana `Activos` de Fleet dejo de usar un SVG de vehiculo dibujado dentro
  de `FleetPanelHeader.vue`.
- Ahora reutiliza `SvgIcon name="activos"`, el mismo icono utilizado por la
  sidebar principal.
- Los iconos de Reportes, Itinerarios, Geocercas, Etiquetas y Alertas no fueron
  modificados.

**Archivos modificados**

- `frontend/src/components/activos/fleet/FleetPanelHeader.vue`
- `frontend/src/components/activos/fleet/README.md`

## 2026-09-23 - Icono de Reportes en la navegacion de Fleet

**Que se hizo**

- Se agrego `fleet-reports` a `SvgIcon`, adaptando el documento con grafico de
  `512x512` a `currentColor` y eliminando XML/DOCTYPE.
- La pestana `Reportes` de `FleetPanelHeader.vue` ahora usa este icono compartido
  en el mismo bloque donde `Activos` usa su icono del catalogo.
- El icono general de Reportes utilizado por la sidebar no fue modificado.
- Tras revisar el resultado, `fleet-reports` se reemplazo por una version mas
  completa que combina documento, grafico circular, barras y lineas de detalle.
- Se corrigio su tamano dentro de Fleet. Como `SvgIcon` renderiza multiples
  raices condicionales, la clase del componente no llegaba al SVG nuevo y el
  navegador aplicaba su tamano intrinseco. `FleetPanelHeader` ahora lo contiene
  en una caja estable de `14x14px` y fuerza esas dimensiones con `:deep(svg)`.

**Archivos modificados**

- `frontend/src/components/icons/SvgIcon.vue`
- `frontend/src/components/activos/fleet/FleetPanelHeader.vue`
- `frontend/src/components/icons/README.md`
- `frontend/src/components/activos/fleet/README.md`

## 2026-09-24 - Icono compartido de Geocercas en Fleet

**Que se hizo**

- Se reemplazo el trazado local de la pestana `Geocercas` por
  `alarm-geofence-exit`, el mismo SVG utilizado en el modulo de Alertas.
- El icono se mantiene dentro del contenedor fijo de `14x14px` de las pestanas
  de Fleet para evitar cambios de tamano o alineacion.

**Archivos modificados**

- `frontend/src/components/activos/fleet/FleetPanelHeader.vue`
- `frontend/src/components/activos/fleet/README.md`

## 2026-09-24 - Icono compartido de Alertas en Fleet

**Que se hizo**

- Se reemplazo el triangulo local de la pestana `Alertas` de Fleet por el icono
  compartido `alertas`, utilizado tambien en la navegacion lateral.
- Se mantuvo el contenedor fijo de `14x14px` para conservar la alineacion y el
  tamano del resto de las pestanas.

**Archivos modificados**

- `frontend/src/components/activos/fleet/FleetPanelHeader.vue`
- `frontend/src/components/activos/fleet/README.md`

## 2026-09-24 - Iconos de categorias en Auditoria

**Que se hizo**

- Todos ahora usa la misma burger del boton que abre la sidebar.
- Acciones sensibles usa el nuevo escudo de alerta y Fallidos el nuevo circulo
  con cierre, ambos incorporados al catalogo `SvgIcon`.
- Etiquetas reutiliza `fleet-tags`, el icono incorporado para Fleet.
- Cambios de acceso conserva su candado y Usuarios aumenta el contraste de su
  fondo e icono para mejorar la visibilidad.
- Los iconos compartidos se fijaron a `14x14px` dentro de sus contenedores.

**Archivos modificados**

- `frontend/src/components/icons/SvgIcon.vue`
- `frontend/src/views/AuditView.vue`
- `frontend/src/components/icons/README.md`
- `frontend/src/components/audit/README.md`

## 2026-09-24 - Nombre consistente de acciones sensibles en Auditoria

**Que se hizo**

- El resumen superior dejo de mostrar `alerta` o `alertas` para los eventos con
  severidad `warning`.
- El contador ahora muestra `accion sensible` o `acciones sensibles`, evitando
  confundir eventos de auditoria con alertas operativas.

**Archivos modificados**

- `frontend/src/components/audit/AuditSummaryHeader.vue`

## 2026-09-24 - Retiro de KPI redundantes en Auditoria

**Que se hizo**

- Se retiraron los contadores superiores de eventos, acciones sensibles y
  fallidos porque duplicaban las categorias rapidas y el filtro de estado.
- `AuditFilters` ocupa ahora toda la zona superior disponible.
- Se elimino de `AuditView` el estado de severidad y los calculos, handlers e
  importaciones usados exclusivamente por esos KPI para evitar filtros
  invisibles y codigo muerto.

**Archivos modificados**

- `frontend/src/views/AuditView.vue`
- `frontend/src/components/audit/README.md`

## 2026-09-24 - Barra compacta de filtros en Auditoria

**Que se hizo**

- El buscador de Auditoria dejo de estar limitado a `290px` y ahora ocupa todo
  el espacio flexible de la fila.
- El rango de fechas, Filtros y Exportar mantienen dimensiones compactas y se
  alinean a la derecha en escritorio.
- En ventanas menores la barra conserva envoltura para evitar superposiciones.

**Archivos modificados**

- `frontend/src/components/audit/AuditFilters.vue`
- `frontend/src/components/audit/README.md`

## 2026-09-24 - Etiquetas del rango de Auditoria

**Que se hizo**

- Se agregaron las etiquetas visibles `Desde` y `Hasta` junto a los campos del
  rango de fechas para diferenciar claramente el inicio y termino del periodo.

**Archivos modificados**

- `frontend/src/components/audit/AuditFilters.vue`
- `frontend/src/components/audit/README.md`

## 2026-09-24 - Separadores del rango de fechas

**Que se hizo**

- Se agregaron divisores verticales despues del icono de calendario y entre los
  campos `Desde` y `Hasta` del filtro de Auditoria.
- Tras la revision visual se retiro el divisor posterior al calendario; se
  conserva solo la separacion entre ambas fechas.
- Se retiro tambien el calendario general anterior a `Desde`, ya que cada campo
  de fecha incluye su propio control nativo.

**Archivos modificados**

- `frontend/src/components/audit/AuditFilters.vue`
- `frontend/src/components/audit/README.md`

## 2026-09-24 - Retiro del encabezado local de Reportes

**Que se hizo**

- Se retiro el bloque `Reportes / Plantillas`, el titulo `Biblioteca de
reportes`, su descripcion y el divisor inferior.
- La vista comienza ahora con el buscador y las acciones Reglas, Programados y
  Nuevo, aprovechando todo el ancho disponible.

**Archivos modificados**

- `frontend/src/views/ReportsView.vue`
- `frontend/src/components/reports/README.md`

## 2026-09-24 - Contexto de Reportes en el header global

**Que se hizo**

- Se agrego el reconocimiento de las rutas `Reports` y `AppReports` en el
  contexto del header global.
- La ruta general de Reportes ahora muestra `Reportes` bajo `Vista actual` en
  vez del respaldo `Selecciona una empresa`.

**Archivos modificados**

- `frontend/src/components/Layout/AppHeader.vue`
- `frontend/src/components/Layout/README.md`

## 2026-09-24 - Agrupacion de controles en Usuarios

**Que se hizo**

- Se retiro el margen automatico que empujaba `Nuevo usuario` al extremo
  derecho y dejaba un espacio vacio despues de `Mas filtros`.
- La accion queda ahora integrada al grupo de filtros con una separacion corta
  y sombra discreta.
- Se ajusto posteriormente la distribucion para aprovechar todo el ancho: el
  buscador crece sobre el espacio disponible y mantiene filtros y accion a la
  derecha sin dejar aire muerto.

**Archivos modificados**

- `frontend/src/components/users/UserFiltersBar.vue`
- `frontend/src/components/users/README.md`

## 2026-09-24 - Badges mejorados en reglas de Alertas

**Que se hizo**

- La prioridad de cada regla dejo de mostrarse como texto plano y ahora utiliza
  `AlarmStatusBadge` con color semantico para baja, media, alta y critica.
- Los estados Activa y Desactivada incorporan un borde suave que mejora su
  definicion visual sin aumentar la altura de las filas.
- Se mantuvieron sin cambios el toggle y las acciones Editar y Eliminar.

**Archivos modificados**

- `frontend/src/components/alarms/AlarmRuleTable.vue`
- `frontend/src/components/alarms/README.md`

## 2026-09-24 - Iconos semanticos en historial de Alertas

**Que se hizo**

- La primera columna del historial dejo de mostrar solamente un punto de estado
  y ahora presenta el icono correspondiente al tipo de alerta.
- Sin senal, geocerca, combustible, velocidad y bateria reutilizan el mismo
  catalogo visual de la configuracion; otros tipos usan la campana de Alertas.
- Un punto pequeno sobre el icono mantiene la lectura del estado: rojo para
  activa y verde para resuelta.

**Archivos modificados**

- `frontend/src/components/alarms/AlarmList.vue`
- `frontend/src/components/alarms/README.md`

## 2026-09-24 - Retiro de resumen redundante en historial de Alertas

**Que se hizo**

- Se retiraron los botones superiores `Todas`, `Activas` y `Resueltas` porque
  duplicaban el selector Estado de `AlarmFilters`.
- Se eliminaron del historial el componente `AlarmSummaryHeader`, sus conteos y
  el handler que escribia sobre el mismo `selectedStatus`.
- `buildAlarmSummary` se conserva en las utilidades porque Fleet aun lo utiliza.

**Archivos modificados**

- `frontend/src/views/AlarmsView.vue`
- `frontend/src/components/alarms/AlarmSummaryHeader.vue` (eliminado)
- `frontend/src/components/alarms/README.md`

## 2026-09-24 - Edicion explicita de reglas de Alertas

**Que se hizo**

- Se retiro la apertura del editor al hacer clic sobre cualquier zona de una
  fila de configuracion.
- El modal de edicion se abre exclusivamente desde `Editar`, evitando que el
  boton duplique una accion disponible en toda la fila.
- La fila conserva respuesta visual al pasar el cursor, pero ya no comunica que
  toda su superficie sea una accion.

**Archivos modificados**

- `frontend/src/components/alarms/AlarmRuleTable.vue`
- `frontend/src/components/alarms/README.md`

## 2026-09-24 - Iconos del detalle de Alertas

**Que se hizo**

- Empresa ahora reutiliza el icono `empresas` del catalogo central.
- Motivo dejo el triangulo generico y muestra el icono semantico correspondiente
  al tipo de alerta.
- Descripcion reemplazo el documento local por el nuevo icono simple
  `detail-info`.

**Archivos modificados**

- `frontend/src/components/alarms/AlarmDetailPanel.vue`
- `frontend/src/components/icons/SvgIcon.vue`
- `frontend/src/components/alarms/README.md`
- `frontend/src/components/icons/README.md`

## 2026-09-24 - Consistencia entre reglas e historial de Alertas

### Icono de bateria baja

- Se agrego `alarm-low-battery` al catalogo `SvgIcon` usando el trazado SVG
  entregado y color heredable mediante `currentColor`.
- Bateria baja reutiliza el nuevo icono en configuracion, historial y detalle
  de Alertas.

### Icono de detencion prolongada

- Se agrego `alarm-long-stop` a `SvgIcon` conservando los trazados entregados.
- Detencion prolongada reutiliza el icono en configuracion, historial y detalle.

### Icono de encendido fuera de horario

- Se agrego `alarm-after-hours` con un reloj y se asigno al tipo `ignition` en
  configuracion, historial y detalle de Alertas.
- Se corrigio por separado la escala optica del reloj y del icono de detencion
  para igualar su tamano aparente con bateria y velocidad.

**Que se hizo**

- Se descarto el filtrado del historial como solucion, porque ocultaba eventos
  semilla en lugar de completar su configuracion.
- Se ajustaron las ocho reglas semilla para que correspondan por nombre, tipo,
  empresa, condicion y alcance a las ocho alertas historicas.
- Cada evento semilla ahora declara el `ruleId` exacto que lo genero.
- Los servicios enriquecen alertas antiguas y reemplazan reglas compatibles
  guardadas por su regla semilla exacta, evitando nombres distintos para el
  mismo evento.
- El historial vuelve a mostrar sus eventos completos; la consistencia se
  resuelve en el origen de datos y no mediante un filtro visual.

**Archivos modificados**

- `frontend/src/views/AlarmsView.vue`
- `frontend/src/data/mockAlarms.js`
- `frontend/src/data/mockAutomaticAlertRules.js`
- `frontend/src/services/alarms/useAlarmsService.js`
- `frontend/src/services/alarms/useAutomaticAlertRulesService.js`
- `frontend/src/services/alarms/useAutomaticAlertRulesService.test.js`
- `frontend/src/components/alarms/README.md`
- `frontend/src/services/alarms/README.md`

## 2026-09-24 - Icono de Itinerarios en Fleet

**Que se hizo**

- Se agrego `fleet-itineraries` a `SvgIcon` a partir del trazado de ruta y
  marcadores entregado como referencia.
- La geometria se optimizo a un `viewBox` de `24x24` para conservar legibilidad
  dentro de la pestana de `14x14px`.
- La pestana `Itinerarios` de `FleetPanelHeader.vue` ahora utiliza este icono en
  el mismo contenedor estable que Activos y Reportes.

**Archivos modificados**

- `frontend/src/components/icons/SvgIcon.vue`
- `frontend/src/components/activos/fleet/FleetPanelHeader.vue`
- `frontend/src/components/icons/README.md`
- `frontend/src/components/activos/fleet/README.md`

## 2026-09-24 - Icono de Etiquetas en Fleet

**Que se hizo**

- Se agrego `fleet-tags` a `SvgIcon` tomando como referencia el trazado de
  etiquetas superpuestas entregado.
- La geometria se optimizo a `24x24` para que la silueta y la perforacion sigan
  siendo reconocibles dentro de una pestana de `14x14px`.
- La pestana `Etiquetas` de Fleet ahora reutiliza este icono desde el mismo
  contenedor estable que Activos, Reportes e Itinerarios.

**Archivos modificados**

- `frontend/src/components/icons/SvgIcon.vue`
- `frontend/src/components/activos/fleet/FleetPanelHeader.vue`
- `frontend/src/components/icons/README.md`
- `frontend/src/components/activos/fleet/README.md`

## 2026-09-25 - Base del modulo Sin reportar

**Que se hizo**

- Se creo la vista base `UnreportedView.vue` con un estado vacio neutral.
- La base se amplio segun la referencia con encabezado, busqueda, cuatro KPI y
  una tabla mock de nueve equipos.
- Se agregaron filtros rapidos por estado, orden local, columna de estado,
  ultimo reporte separado y acciones por fila segun la segunda referencia.
- Se reforzo la jerarquia visual con iconos en KPI, indicadores en filtros,
  seleccion por fila y mayor espaciado en la tabla.
- Se retiro la barra horizontal de estados. Los KPI ahora filtran el listado y
  el panel lateral concentra busqueda, empresa, fechas, orden, limpieza,
  exportacion y actualizacion.
- Se retiro el encabezado interno `Equipos sin reporte` para comenzar el
  contenido inmediatamente bajo el header global.
- Se adapto la composicion final de Sin reportar: panel de filtros de 315px con
  estado, tiempo y fechas; KPI superiores; tabla sin seleccion ni acciones.
- Se igualo la altura inferior del panel de filtros y el bloque de resultados;
  la tabla ocupa el espacio restante y mantiene la paginacion al fondo.
- Se agregaron rutas generales y por empresa para `/sin-reportar`.
- El nuevo modulo aparece en la sidebar, conserva la empresa activa y usa el
  alcance de Activos mientras no exista un permiso propio.
- El header reconoce el nombre `Sin reportar`.
- Se creo el icono de navegacion `unreported` en formato `24x24` y tamano fijo
  `20x20px`; el modulo deja de reutilizar el SVG detallado de Alertas que se
  desbordaba visualmente en la barra compacta.

**Archivos modificados**

- `frontend/src/views/UnreportedView.vue`
- `frontend/src/router/index.js`
- `frontend/src/components/Layout/AppSidebar.vue`
- `frontend/src/components/Layout/AppHeader.vue`
- `frontend/src/views/README.md`
- `frontend/src/components/Layout/README.md`

## 2026-09-25 - Icono de corte de alimentacion

- Se agrego `power-cut` al catalogo `SvgIcon` con los trazados entregados y
  color heredable.
- Se aplico al KPI y a los estados de corte de alimentacion en Sin reportar.
