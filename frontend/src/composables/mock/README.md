# Mock Composables

Migracion de reportes mock (2026-10-19): normalizacion completa solo activos de
semilla conocidos, source mock-database y sin reporte explicito, con fechas y datos
de demostracion. Nunca reemplaza snapshots del usuario/API, reportes vacios explicitos
o telemetria existente. Marca coleccion assets pendiente y persiste una vez; snapshot
inicial tambien se guarda para no regenerar fechas en cada recarga. No borra base,
identidades, consultas ni historial de Sin reportar. No aplica a activos personalizados.

Estado mock del prototipo.

## Archivos

- `useMockDatabase.js`: acceso reactivo a la base mock local. Normaliza activos, empresas, accesos y scopes, incluyendo `assetTagIds` para el alcance por etiquetas. Migra scopes legacy por sucursal a activos especificos y asegura que todo usuario con `isPlatformAdmin` tenga acceso `admin` activo a todas las aplicaciones/empresas actuales y a las que se creen despues.
- `useMockDatabase.test.js`: valida que los administradores de plataforma reciban acceso completo a cada aplicacion, con rol `admin`, scope `all-assets` y permisos completos. Tambien cubre que los scopes legacy por sucursal ya no se expongan como alcances editables ni queden activos en accesos normalizados.

## Regla de mantenimiento

La persistencia local usa colecciones versionadas y un manifiesto `sinergy-mock-database:collections`.
La primera escritura migra el snapshot legacy completo; las siguientes serializan solo las colecciones
marcadas por cada accion. El manifiesto confirma todas las colecciones de una operacion juntas.
Si falla el guardado, se conserva el snapshot anterior y las colecciones siguen pendientes para reintento.
No se escribe al salir si no hay cambios. Los accesos tienen un watcher dedicado porque su editor modifica
permisos anidados directamente; para las demas colecciones, las nuevas acciones deben llamar a
`schedulePersistDatabase` con todos los nombres afectados.

Esta carpeta es temporal para prototipo. En arquitectura productiva, este rol debe ser reemplazado por servicios HTTP o SDK de backend.
