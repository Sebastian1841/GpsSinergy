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
  nombre anterior. `deleteGeofences` permite eliminar varias geocercas en una
  sola operacion, pero solo dentro de las geocercas visibles para la empresa
  activa.
- `useGeofences.test.js`: pruebas del composable de geocercas, incluyendo
  creacion, borrado simple y multiple, renombrado de grupos e importacion.

## Regla de mantenimiento

Guardado comprobado (2026-11-05): cada accion prepara y persiste geocercas/grupos
antes de publicarlos. Renombrar/borrar grupo confirma ambos conjuntos juntos en
una clave. Fallar devuelve null/false/[] segun el contrato y expone
geofenceWriteError. No se reescribe almacenamiento al montar sin cambios;
se retiro el watcher que guardaba despues de publicar. Pruebas adicionales en
services/storage/confirmedFeatureWrites.test.js.

La geometria pura debe quedar en `utils/geofenceUtils.js` o `utils/geofenceMapUtils.js`.
