# Icon Components

Componentes de iconografia compartida.

## Archivos

- `SvgIcon.vue`: wrapper para renderizar iconos SVG centralizados. Incluye iconos operativos reutilizables como `mantenciones`, `ok`, `vencida`, `configuracion`, `llave`, `filter-clear`, `panel-open` y `panel-close`. Los iconos usados en KPI deben quedar opticamente centrados dentro de un `viewBox` 24x24 para que puedan reutilizarse dentro de botones, tarjetas y badges sin ajustes locales.

Los iconos `alarm-no-signal`, `alarm-low-battery`, `alarm-long-stop`, `alarm-after-hours`,
`alarm-geofence-exit`, `alarm-fuel-variation` y `alarm-speeding` identifican tipos de
alerta en configuracion, historial y detalle.

`alarm-long-stop` y `alarm-after-hours` incluyen correcciones de escala optica
independientes porque sus trazados dejan cantidades distintas de espacio
interno. Esta correccion no debe trasladarse al contenedor compartido.

## Regla de mantenimiento

`maintenance-time`, `maintenance-odometer` y `maintenance-hours` son reloj,
medidor y reloj de arena para los tres criterios del catalogo de mantenciones.
No usar `proxima` (advertencia) para identificar tiempo u horometro.
`download` se usa en el menu de exportacion directa del historial.

`power-cut` representa el corte de alimentacion en el KPI del modulo Sin reportar.

`unreported` es el icono normalizado de `20x20px` para el modulo Sin reportar.
No reutiliza `alarm-no-signal`, cuyo trazado detallado esta destinado a las
filas de Alertas.

`fleet-reports` representa un documento con grafico y se usa en la pestana
Reportes del panel de Fleet.

`fleet-itineraries` representa una ruta con marcadores y se usa en la pestana
Itinerarios de Fleet.

`fleet-tags` representa etiquetas superpuestas y se usa en la pestana Etiquetas
de Fleet y en el filtro rapido Etiquetas de Auditoria.

`menu`, `audit-shield-alert` y `audit-circle-x` se reutilizan en las categorias
rapidas de Auditoria para Todos, Acciones sensibles y Fallidos.

`detail-info` representa informacion descriptiva y se usa en el detalle del
historial de Alertas.

Agregar aqui solo piezas de iconografia reutilizables. Iconos especificos de una pantalla pueden vivir cerca de su componente.
