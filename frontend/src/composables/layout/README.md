# Layout Composables

Estado y composicion de datos para componentes estructurales.

## Archivos

- `useAppHeaderAccessScope.js`: prepara los datos autorizados que consume
  `AppHeader.vue`: empresas accesibles, activos visibles de la empresa activa,
  usuarios buscables y usuarios activos disponibles para compartir espacios.
- `useAppHeaderGlobalSearchState.js`: estado local del buscador del header:
  tipo seleccionado, debounce, placeholder, mensaje vacio y limpieza.

## Regla de mantenimiento

Los composables de layout pueden cruzar servicios y permisos, pero no deben
renderizar UI. Si una regla no usa Vue, moverla a `utils/layout`.
