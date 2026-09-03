# Router

Configuracion de rutas de Vue Router.

## Archivos

- `index.js`: declara rutas, redirecciones y guards de acceso. Tambien centraliza los loaders lazy de vistas y expone `preloadPrivateRouteViews()` para precargar en segundo plano los modulos privados despues del login.
- `../App.vue`: dispara la precarga solo despues de entrar a una ruta privada. La precarga espera un margen inicial y luego carga los modulos restantes por lotes para no competir con el primer render del mapa, tabla o dashboard activo.

## Regla de mantenimiento

El router debe decidir navegacion y permisos de entrada. No debe cargar logica de negocio de las vistas.

Las vistas principales deben mantenerse como imports dinamicos. Si se agrega un modulo nuevo y su primer acceso queda lento, registrar su loader en `routeViewLoaders`, agregar su clave a `PRIVATE_ROUTE_VIEW_KEYS` si corresponde y usar `meta.preloadKey` en sus rutas.

`preloadPrivateRouteViews()` no debe precargar todo de inmediato. Mantener `startDelayMs` y `batchDelayMs` con valores conservadores para que el modulo actual se pinte primero y los chunks pesados de reportes, mantenciones, auditoria, usuarios y empresas se descarguen despues.

El modulo visual de mantenciones usa `MaintenanceView.vue`. La ruta de trabajo es `/app/:empresaId/mantenciones`, protegida con la funcion `maintenance-view`, porque la vista debe cargar patentes y ordenes dentro de una empresa. `/mantenciones` queda como entrada de compatibilidad y redirige a la ultima empresa accesible cuando existe.

Desde el menu contextual de activos se puede abrir mantenciones con query
`assetId`, `patente` y `open=maintenance-detail`; la vista usa esos parametros
para seleccionar el vehiculo y abrir directamente el modal de sus mantenciones.
