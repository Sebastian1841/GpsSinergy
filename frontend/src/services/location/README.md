# Location Services

Servicios de ubicacion.

## Archivos

- `reverseGeocodingService.js`: geocodificacion inversa. Centraliza proveedor, cache, cola de peticiones, limites de resolucion y override de URL usando `browserStorage`.
- `reverseGeocodingService.test.js`: pruebas de geocodificacion inversa.
- `reverseGeocodingQueue.test.js`: reloj controlado para red/JSON bloqueados,
  cancelacion compartida/individual, cola, reintentos, presupuesto de lote y cache tardio.

## Tiempo Maximo Y Cancelacion

Desde 2026-11-05, cada consulta iniciada tiene 10 segundos para red y lectura de
JSON. Se aborta el transporte y se libera la cola aunque fetch no respete la
senal. Respuestas tardias canceladas no escriben cache. Se mantiene el intervalo
de 1100 ms entre inicios y se limpian timers/listeners y entradas pendientes.

reverseGeocodeCoordinates acepta `{ signal }`. Las coordenadas compartidas usan
una sola peticion: cancelar un consumidor no interrumpe a los demas; cancelar
el ultimo aborta el transporte. Trabajos cancelados en cola se saltan sin fetch.
El plazo por peticion comienza al iniciar red, no al entrar a la cola.

resolveReverseGeocodedSources acepta signal y timeoutMs (20 segundos por defecto
para todo el lote, incluida espera en cola). Al cancelar/agotar presupuesto
conserva todas las filas, direcciones reales y cache; usa coordenadas de respaldo
para lo pendiente sin mutar entradas. El limite de cantidad de consultas sigue
vigente. Este plazo solo acota direcciones, no render de mapas ni generacion PDF/Excel.

## Regla de mantenimiento

Centralizar proveedor, cache y limites de uso para no repartir llamadas de geocoding por componentes.
