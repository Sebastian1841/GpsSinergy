# Frontend Source

Raiz del codigo Vue del frontend. La organizacion se mantiene por tipo de responsabilidad para evitar duplicar modulos:

- `assets/`: imagenes, iconos raster y estilos globales especificos.
- `components/`: componentes Vue reutilizables o secciones visuales.
- `composables/`: estado, coordinacion de flujos y hooks Vue.
- `data/`: datos mock o configuraciones estaticas de dominio.
- `router/`: definicion de rutas de la aplicacion.
- `services/`: capa de acceso a datos, adaptadores y servicios externos.
- `utils/`: funciones puras, formateadores, calculos y helpers testeables.
- `views/`: pantallas principales conectadas al router.
- `App.vue`: contenedor raiz de la aplicacion.
- `main.js`: punto de entrada de Vue.
- `style.css`: estilos globales base.

## Regla de arquitectura

La UI debe quedar en `components` y `views`. La logica con estado Vue debe ir en `composables`. La logica pura que se puede testear sin montar Vue debe ir en `utils`. La comunicacion con almacenamiento, mocks o APIs debe vivir en `services`.
