# Alarm Utils

Funciones puras del modulo de Alertas.

## Archivos

- `alarmUtils.js`: normaliza alertas, cruza alertas contra activos autorizados,
  aplica filtros visuales, ordena filas y calcula resumen. El recorte por activos
  autorizados se hace antes de construir filas para evitar procesar alertas que
  no podrian mostrarse.
- `alarmUtils.test.js`: pruebas de alcance, filtros, orden y resumen.
- `automaticAlertRuleUtils.js`: normaliza reglas automaticas, calcula alcance de
  activos afectados por toda la flota, activos especificos o etiquetas de
  acceso, conserva condiciones especificas por tipo de alerta, filtra, ordena y
  resume reglas. Usa estructuras tipo `Set` para comparar activos seleccionados
  cuando arma filas de reglas.
- `automaticAlertRuleUtils.test.js`: pruebas de alcance, filtros, orden, resumen
  y defaults de reglas automaticas.

## Regla de permisos

El flujo correcto es:

```txt
alertas
-> activos visibles por permisos/etiquetas
-> alertas autorizadas
-> filtros visuales
-> tabla y detalle
```

No filtrar alertas solo por `companyId`. Una alerta de un activo no autorizado
no debe aparecer aunque pertenezca a la misma empresa.

Las reglas automaticas se recortan por empresas y activos disponibles para no
mostrar configuraciones fuera del alcance de la vista actual. El alcance por
etiquetas debe usar `assetTagIds`, no campos visuales genericos. No generan
alertas por si solas en el prototipo; solo configuran condiciones.

Las condiciones no deben volver a tratarse como un formulario generico para todos
los tipos. `speeding`, `battery`, `no_signal`, `geofence`, `stop_time`,
`ignition` y `fuel` guardan campos propios cuando corresponde, como duracion,
evento de geocerca, estado de motor o ventana de combustible.

En `ignition`, la condicion no debe guardarse como `schedule = Fuera de horario`.
La condicion representa el contacto encendido (`ignitionState = Encendido`) y el
fuera de horario se define con `schedule.type = custom`, usando la ventana
permitida configurada por el usuario.

Para `geofence`, la condicion debe mantener `geofenceScope` (`all`, `group` o
`specific`) y los datos asociados: `geofenceGroupId` / `geofenceGroupName` o
`geofenceIds` / `geofenceNames`. No usar texto libre como fuente principal.
