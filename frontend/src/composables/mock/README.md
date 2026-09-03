# Mock Composables

Estado mock del prototipo.

## Archivos

- `useMockDatabase.js`: acceso reactivo a la base mock local. Normaliza activos, empresas, accesos y scopes, incluyendo `assetTagIds` para el alcance por etiquetas. Migra scopes legacy por sucursal a activos especificos y asegura que todo usuario con `isPlatformAdmin` tenga acceso `admin` activo a todas las aplicaciones/empresas actuales y a las que se creen despues.
- `useMockDatabase.test.js`: valida que los administradores de plataforma reciban acceso completo a cada aplicacion, con rol `admin`, scope `all-assets` y permisos completos. Tambien cubre que los scopes legacy por sucursal ya no se expongan como alcances editables ni queden activos en accesos normalizados.

## Regla de mantenimiento

Esta carpeta es temporal para prototipo. En arquitectura productiva, este rol debe ser reemplazado por servicios HTTP o SDK de backend.
