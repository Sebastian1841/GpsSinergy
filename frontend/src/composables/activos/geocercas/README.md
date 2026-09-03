# Geocerca Composables

Estado de geocercas.

## Archivos

- `useGeofenceHistoryRows.js`: construye filas visibles del historial.
- `useGeofences.js`: CRUD, importacion por lote, grupos y estado de geocercas.
  Normaliza `groupName` desde geocercas creadas, editadas o importadas y ademas
  persiste grupos propios por empresa. Acepta el formato anterior de storage y
  guarda el formato actual con `{ geofences, groups }`. Borrar un grupo no borra
  geocercas: solo limpia su `groupName` para dejarlas `Sin grupo`. Renombrar un
  grupo actualiza el registro del grupo y todas las geocercas que apuntaban al
  nombre anterior.
- `useGeofences.test.js`: pruebas del composable de geocercas, incluyendo
  creacion, borrado, renombrado de grupos e importacion.

## Regla de mantenimiento

La geometria pura debe quedar en `utils/geofenceUtils.js` o `utils/geofenceMapUtils.js`.
