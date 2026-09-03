# Layout Utils

Helpers puros usados por el layout.

## Archivos

- `appHeaderAccessScopeUtils.js`: calcula usuarios permitidos para el buscador
  global y el selector de espacios. La regla clave es que un usuario normal solo
  ve usuarios asociados a empresas donde tenga `users-view`; el administrador de
  plataforma mantiene alcance global.
- `appHeaderAccessScopeUtils.test.js`: pruebas del alcance de usuarios del
  header.

## Regla de mantenimiento

Mantener aqui funciones sin Vue ni DOM. Las reglas de permisos que afecten el
header deben probarse antes de conectarlas a componentes.
