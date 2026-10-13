# Modularizacion de archivos

Este documento complementa `bitacora/bitacora.md`.

El objetivo es registrar las separaciones grandes de codigo con mas detalle que
la bitacora cronologica, para saber que se saco, por que se saco y como quedo la
responsabilidad de cada archivo.

## Estado general

La modularizacion se esta haciendo archivo por archivo para reducir riesgo. La
regla es no cambiar comportamiento en la misma pasada donde solo se busca
separar responsabilidades.

## 2026-09-16 - Alertas: composables de configuracion

### Problema detectado

Despues de separar filtros, tabla y secciones visuales del modal,
`AlarmConfigPanel.vue` todavia tenia logica de negocio mezclada con la
orquestacion visual:

- seleccion de activos y etiquetas;
- seleccion de geocercas y grupos;
- normalizacion de condiciones por tipo de alerta;
- validacion del draft;
- armado del payload final;
- busquedas internas de selectores masivos.

Eso mantenia el componente demasiado largo y hacia dificil distinguir si un
cambio era visual o funcional.

### Decision tomada

Se extrajo la logica reactiva a composables dedicados, manteniendo el mismo
comportamiento visible y dejando `AlarmConfigPanel.vue` como coordinador.

La separacion se hizo por dominio:

- alcance de activos;
- seleccion de geocercas;
- draft, validacion y payload.

### Como quedo

- `AlarmConfigPanel.vue`
  - Orquesta filtros, seleccion de regla, modal, guardado, eliminacion,
    activacion/desactivacion y feedback.
  - Conecta los composables con las secciones visuales.
  - Bajo aproximadamente de `1171` a `651` lineas.

- `useAlarmRuleAssetScope.js`
  - Calcula activos disponibles para la empresa seleccionada.
  - Filtra activos por busqueda.
  - Limita la ventana visible del selector masivo.
  - Calcula etiquetas de acceso disponibles.
  - Maneja `assetScope` en modos `all`, `specific` y `asset-tags`.

- `useAlarmRuleGeofenceSelection.js`
  - Calcula geocercas disponibles para la empresa seleccionada.
  - Calcula grupos de geocercas combinando grupos existentes y grupos inferidos
    desde geocercas.
  - Filtra geocercas por busqueda.
  - Limita la ventana visible del selector masivo.
  - Normaliza `geofenceScope` y escribe `geofenceGroupId`,
    `geofenceGroupName`, `geofenceIds` y `geofenceNames`.

- `useAlarmRuleDraft.js`
  - Crea y clona drafts normalizados.
  - Aplica presets por tipo de alerta.
  - Calcula `fuelDropAmount`.
  - Valida si la regla puede guardarse.
  - Arma el payload final para `useAutomaticAlertRulesService.js`.

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

### Resultado esperado

El flujo visible debe comportarse igual:

- crear y editar reglas automaticas;
- cambiar empresa, tipo, alcance y notificaciones;
- seleccionar activos especificos o etiquetas;
- seleccionar todas las geocercas, grupo o geocercas especificas;
- guardar el mismo payload normalizado.

La diferencia es interna: el componente principal ya no contiene las reglas de
seleccion ni el armado del payload.

### Siguiente candidata

`AlarmRuleTriggerSection.vue` quedo como el archivo visual mas grande del modulo.
Si vuelve a crecer, conviene partirlo por familias de condicion, por ejemplo
geocercas, telemetria y horario.

## 2026-09-15 - Alertas: `AlarmConfigPanel.vue`

### Problema detectado

`AlarmConfigPanel.vue` estaba concentrando demasiadas responsabilidades:

- filtros de reglas automaticas;
- tabla/listado de reglas;
- acciones de fila: editar, eliminar y activar/desactivar;
- modal de creacion/edicion;
- draft y validacion;
- condiciones por tipo de alerta;
- seleccion de activos;
- seleccion de geocercas y grupos;
- estilos de tabla, filtros, modal y formulario.

Eso hacia que el archivo fuera dificil de mantener y aumentaba el riesgo de
romper el flujo al tocar una parte visual simple.

### Decision tomada

Se separo primero la UI de menor riesgo:

- filtros;
- tabla de reglas.

No se separo todavia el formulario del modal porque contiene la mayor parte de
la logica sensible: presets por tipo de alerta, condiciones, alcance de activos,
geocercas, horarios, notificaciones y payload final.

### Como quedo

- `AlarmConfigPanel.vue`
  - Orquesta el panel completo.
  - Mantiene `rules`, filtros, regla seleccionada, draft, validaciones y
    guardado.
  - Abre/cierra el modal de crear/editar.
  - Maneja cambios de empresa, tipo de alerta, alcance, activos, geocercas,
    horarios y notificaciones.
  - Recibe eventos desde los componentes hijos.

- `AlarmRuleFilters.vue`
  - Renderiza busqueda, tipo, empresa, estado y boton limpiar.
  - Recibe opciones desde el padre.
  - Usa `v-model` nombrado para devolver cambios al padre.
  - No conoce `rules` ni filtra directamente.

- `AlarmRuleTable.vue`
  - Renderiza encabezado y filas de reglas.
  - Muestra icono, tipo, condicion, empresa, alcance, estado y acciones.
  - Contiene los estilos del toggle y de la fila.
  - Emite `select-rule`, `toggle-rule` y `delete-rule`.
  - No llama servicios ni modifica datos directamente.

### Archivos modificados

- `frontend/src/components/alarms/AlarmConfigPanel.vue`
- `frontend/src/components/alarms/AlarmRuleFilters.vue`
- `frontend/src/components/alarms/AlarmRuleTable.vue`
- `frontend/src/components/alarms/README.md`
- `bitacora/bitacora.md`
- `bitacora/modulos/modularizacion.md`

### Resultado esperado

El flujo visible debe comportarse igual:

- filtrar reglas automaticas;
- limpiar filtros;
- seleccionar una regla;
- editar desde la fila;
- activar/desactivar con toggle;
- eliminar regla;
- crear o guardar desde el modal.

La diferencia es interna: el archivo principal queda menos cargado y preparado
para una segunda pasada donde el modal/formulario se pueda separar con mas
cuidado.

### Siguiente candidata

La siguiente separacion logica es extraer la configuracion de disparo del modal,
pero conviene hacerlo en una pasada aparte porque ese bloque tiene muchas ramas
por tipo de alerta.

## 2026-09-16 - Alertas: secciones del modal de reglas

### Problema detectado

Despues de separar filtros y tabla, `AlarmConfigPanel.vue` seguia conteniendo el
modal casi completo. El riesgo principal era que cualquier ajuste simple de texto
o layout obligaba a navegar por el mismo archivo donde tambien vive la logica de
condiciones, geocercas y guardado.

### Decision tomada

Se separaron secciones visuales del modal que tienen bajo riesgo y no calculan
payload:

- informacion general;
- alcance;
- notificaciones.

Se dejo dentro de `AlarmConfigPanel.vue` la seccion `Configuracion de disparo`
porque concentra:

- presets por tipo de alerta;
- reglas de bateria, velocidad, sin senal, geocerca, detencion, encendido y
  combustible;
- seleccion de geocercas y grupos;
- horarios;
- normalizacion del payload final.

### Como quedo

- `AlarmConfigPanel.vue`
  - Mantiene estado, draft, validacion, guardado y efectos.
  - Sigue armando `getDraftPayload()`.
  - Sigue controlando la seccion de disparo.
  - Entrega datos y callbacks a secciones hijas.

- `AlarmRuleGeneralSection.vue`
  - Renderiza nombre, tipo y descripcion.
  - Emite `apply-type-preset` cuando cambia el tipo.

- `AlarmRuleScopeSection.vue`
  - Renderiza empresa, tipo de alcance, activos especificos y etiquetas.
  - Recibe listas ya calculadas por el padre.
  - Emite cambios de busqueda y acciones de seleccion.

- `AlarmRuleNotificationsSection.vue`
  - Renderiza canales de notificacion.
  - No llama servicios ni guarda datos.

### Archivos modificados

- `frontend/src/components/alarms/AlarmConfigPanel.vue`
- `frontend/src/components/alarms/AlarmRuleGeneralSection.vue`
- `frontend/src/components/alarms/AlarmRuleScopeSection.vue`
- `frontend/src/components/alarms/AlarmRuleNotificationsSection.vue`
- `frontend/src/components/alarms/README.md`
- `bitacora/bitacora.md`
- `bitacora/modulos/modularizacion.md`

### Resultado esperado

El flujo visible debe comportarse igual:

- crear alerta;
- editar alerta;
- cambiar tipo y aplicar preset;
- cambiar empresa;
- elegir toda la flota, activos especificos o etiquetas;
- activar/desactivar notificacion en plataforma o correo;
- guardar o cancelar.

La diferencia es interna: el contenedor bajo de aproximadamente `1993` a `1765`
lineas y el modal quedo dividido en secciones mantenibles.

### Siguiente candidata

Extraer o probar en detalle la logica de payload y validacion del draft. Esa
parte sigue en `AlarmConfigPanel.vue` porque es donde se decide que se guarda.

## 2026-09-16 - Alertas: `AlarmRuleTriggerSection.vue`

### Problema detectado

La seccion `Configuracion de disparo` seguia dentro de `AlarmConfigPanel.vue` y
era el bloque mas grande del modal. Esa seccion mezcla muchos estados visuales:

- velocidad;
- bateria;
- sin senal;
- geocerca;
- detencion;
- encendido;
- combustible;
- horario de evaluacion.

Tambien contenia la UI de seleccion de geocercas especificas y grupos, que
agrega mucha estructura de template y estilos.

### Decision tomada

Se movio la UI completa de disparo a `AlarmRuleTriggerSection.vue`.

No se movio todavia la normalizacion de payload ni validacion del draft. Esas
siguen en `AlarmConfigPanel.vue` para no mezclar una modularizacion visual con
un cambio de logica de guardado.

### Como quedo

- `AlarmConfigPanel.vue`
  - Mantiene estado, draft, validaciones, payload y persistencia.
  - Entrega opciones y callbacks a `AlarmRuleTriggerSection.vue`.
  - Bajo aproximadamente de `1765` a `1171` lineas.

- `AlarmRuleTriggerSection.vue`
  - Renderiza condiciones por tipo de alerta.
  - Renderiza seleccion de geocercas, grupo y geocercas especificas.
  - Renderiza horario siempre/personalizado.
  - Emite acciones como aplicar preset de bateria, cambiar alcance de geocerca,
    seleccionar geocercas y actualizar busquedas.
  - No llama servicios ni guarda reglas.

### Archivos modificados

- `frontend/src/components/alarms/AlarmConfigPanel.vue`
- `frontend/src/components/alarms/AlarmRuleTriggerSection.vue`
- `frontend/src/components/alarms/README.md`
- `bitacora/bitacora.md`
- `bitacora/modulos/modularizacion.md`

### Resultado esperado

El flujo visible debe comportarse igual:

- cambiar entre tipos de alerta;
- configurar velocidad, bateria, sin senal, geocerca, detencion, encendido y
  combustible;
- buscar y seleccionar geocercas;
- elegir horario siempre o personalizado;
- guardar el mismo payload que antes.

### Siguiente candidata

Esta candidata ya se abordo en la pasada posterior de composables de
configuracion. El siguiente archivo a vigilar es `AlarmRuleTriggerSection.vue`,
porque concentra muchas variantes visuales por tipo de alerta.

## 2026-09-21 - Exportacion de itinerarios por formato

### Problema detectado

`itineraryExportService.js` concentraba cerca de 2800 lineas y cuatro
responsabilidades diferentes:

- normalizacion y ordenamiento del modelo exportable;
- construccion visual del PDF;
- construccion de hojas, imagenes y estilos de Excel;
- API publica usada por itinerarios y reportes.

Esto hacia riesgoso modificar un formato. Un ajuste de PDF obligaba a editar el
mismo archivo que genera Excel, aunque ambos solo comparten una parte del modelo.

### Decision tomada

Se mantuvo `itineraryExportService.js` como fachada publica y se extrajo la
implementacion por responsabilidad. No se cambiaron nombres de funciones ni
imports de los consumidores actuales.

### Como quedo

- `itineraryExportService.js`
  - Reexporta la API publica existente.
  - Evita que componentes y utilidades conozcan los archivos internos.

- `itineraryExportModel.js`
  - Define columnas de activos y detalle.
  - Normaliza valores de columnas.
  - Ordena activos y registros.
  - Construye metricas personalizadas compartidas.

- `itineraryPdfExportService.js`
  - Contiene exclusivamente layout, tablas, mapas, metricas y descarga PDF.
  - Conserva los layouts operativo y `legacy-landscape`.

- `itineraryExcelExportService.js`
  - Contiene estilos, hojas, imagenes, graficos y descarga Excel.
  - Conserva las hojas `Reporte`, `Detalle GPS`, `Activos` y datos para graficos.

### Compatibilidad

Los consumidores siguen importando desde:

```txt
services/itinerarios/itineraryExportService.js
```

La separacion es interna y no modifica el contrato utilizado por
`ItineraryPanel.vue`, `assetReportExportUtils.js` ni las pruebas existentes.

### Archivos modificados

- `frontend/src/services/itinerarios/itineraryExportService.js`
- `frontend/src/services/itinerarios/itineraryExportModel.js`
- `frontend/src/services/itinerarios/itineraryPdfExportService.js`
- `frontend/src/services/itinerarios/itineraryExcelExportService.js`
- `frontend/src/services/itinerarios/README.md`
- `bitacora/bitacora.md`
- `bitacora/modulos/modularizacion.md`

### Validacion

- 181 pruebas aprobadas.
- ESLint aprobado.
- Prettier aprobado.
- Build de produccion aprobado.
