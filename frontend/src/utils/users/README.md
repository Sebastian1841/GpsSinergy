# User Utils

Funciones puras del dominio de usuarios y permisos.

## Archivos

- `userAccessStateUtils.js`: helpers para estado de accesos. Migra alcances legacy por sucursal a `selected-assets` para que sucursal no siga operando como permiso activo.
- `userAccessStateUtils.test.js`: pruebas de normalizacion y migracion de alcances legacy por sucursal a activos especificos.
- `userAccessUtils.js`: normalizacion y calculos de permisos.
- `userAssetTagUtils.js`: normaliza etiquetas de acceso de activos, agrupa etiquetas por empresa y calcula coincidencias para el alcance por etiquetas. Solo debe leer campos explicitos de acceso como `assetTagIds` o `assetTags`; campos genericos como `tags`, `labels` o `etiquetas` no deben entregar permisos.
- `userAssetTagUtils.test.js`: pruebas de normalizacion, conteo de etiquetas
  por activo, agrupacion por empresa y coincidencia de activos visibles contra etiquetas seleccionadas.

## Regla de mantenimiento

Los permisos deben ser faciles de probar sin UI. Cualquier regla compartida debe vivir aqui antes que dentro de componentes.
