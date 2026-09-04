# Bitacora de cambios

Registro simple de los cambios funcionales que se van incorporando a la plataforma.
La idea de este archivo es dejar trazabilidad rapida para revisar que se hizo, por que
se hizo y que partes del proyecto fueron afectadas.

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
