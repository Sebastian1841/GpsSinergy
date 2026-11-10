# Frontend Source

`App.vue` muestra `persistenceError` de la base compartida como aviso accesible.
No descarta el estado de formularios cuando un guardado local falla o entra en
conflicto con otra ventana.

Raiz del codigo Vue del frontend. La organizacion se mantiene por tipo de responsabilidad para evitar duplicar modulos:

- `assets/`: imagenes, iconos raster y estilos globales especificos.
- `components/`: componentes Vue reutilizables o secciones visuales.
- `composables/`: estado, coordinacion de flujos y hooks Vue.
- `data/`: datos mock o configuraciones estaticas de dominio.
- `fixtures/`: datos sinteticos controlados por banderas para validar mantenciones e historial.
- `router/`: definicion de rutas de la aplicacion.
- `services/`: capa de acceso a datos, adaptadores y servicios externos.
- `utils/`: funciones puras, formateadores, calculos y helpers testeables.
- `views/`: pantallas principales conectadas al router.
- `App.vue`: contenedor raiz de la aplicacion.
- `main.js`: punto de entrada de Vue.
- `style.css`: estilos globales base.

`App.vue` coordina la precarga diferida de vistas privadas livianas despues del
login mediante preloadPrivateRouteViews(). Los loaders pesados siguen bajo
demanda; consultar router/README.md antes de ampliar la precarga.

## Configuracion

Las cinco pantallas viven en views/Configuration*View.vue. Componentes del editor
de Variables en components/configuration; contratos puros y almacenamiento en
utils/layout; reglas operativas en components/alarms y composables/alarms.
Consultar los README de esas carpetas para permisos, persistencia y fronteras
sin backend. No confundir motor de informes con motor de Variables calculadas.

Los flujos activos mas sensibles del prototipo estan documentados con mas
detalle en `../docs/flujos-principales.md`: permisos y etiquetas de acceso,
busqueda global, filtros visuales de ciudades/grupos de vehiculos, geocercas
con importacion/exportacion, reportes configurables, alertas operativas,
alertas automaticas y mantenciones.

## Regla de arquitectura

La UI debe quedar en `components` y `views`. La logica con estado Vue debe ir en `composables`. La logica pura que se puede testear sin montar Vue debe ir en `utils`. La comunicacion con almacenamiento, mocks o APIs debe vivir en `services`.
