# User Utils

Funciones puras del dominio de usuarios y permisos.

## Archivos

- `userAccessStateUtils.js`: helpers para estado de accesos.
- `userAccessUtils.js`: normalizacion y calculos de permisos.

## Regla de mantenimiento

Los permisos deben ser faciles de probar sin UI. Cualquier regla compartida debe vivir aqui antes que dentro de componentes.
