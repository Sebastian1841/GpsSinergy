# Maintenance Utils

Funciones puras y configuracion estatica del modulo de mantenciones.

## Archivos

- `maintenanceFormatUtils.js`: helpers sin Vue para normalizar texto, parsear numeros, formatear montos, fechas, identificadores visuales, unidades de lectura e intervalos.
- `maintenanceModuleConfig.js`: datos estaticos del prototipo: tabs, tipos base, fuentes de lectura, templates, filtros, prioridades, dias de calendario, pasos de ciclo, costos base, campos del formulario y textos de modales.
- `maintenanceUiUtils.js`: helpers visuales sin Vue para etiquetas, clases CSS e iconos por estado de mantencion, OT, prioridad y tareas.

## Criterio de uso

Todo lo que no necesite `ref`, `computed`, `watch`, router ni servicios debe quedar aqui. Esto permite testear reglas y estilos logicos sin montar componentes Vue.
