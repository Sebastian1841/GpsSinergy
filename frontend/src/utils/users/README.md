# User Utils

Funciones puras del dominio de usuarios y permisos.

## Archivos

- `userAccessStateUtils.js`: helpers para estado de accesos.
- `userAccessUtils.js`: normalizacion y calculos de permisos.
- `userAssetTagUtils.js`: normaliza etiquetas de activos, agrupa etiquetas por empresa, deriva etiquetas base cuando el activo no trae una lista explicita y calcula coincidencias para el alcance por etiquetas.
- `userAssetTagUtils.test.js`: pruebas de normalizacion, conteo de etiquetas
  por activo, agrupacion por empresa y coincidencia de activos visibles contra etiquetas seleccionadas.

## Regla de mantenimiento

Los permisos deben ser faciles de probar sin UI. Cualquier regla compartida debe vivir aqui antes que dentro de componentes.
