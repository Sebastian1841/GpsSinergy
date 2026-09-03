# Public Assets

Archivos servidos directamente por Vite desde la raiz publica.

## Archivos

- `favicon.ico`: icono del navegador.
- `login-dashboard-hero.jpg`: imagen hero activa del login. Es una version optimizada generada desde `login-dashboard-hero.png` para reducir la carga inicial.
- `login-dashboard-hero.png`: fuente original de mayor peso. Mantener solo si se necesita regenerar la version optimizada.
- `logo-sinergy.html`: animacion HTML del logo corporativo usada por `LoginView.vue` y `AppHeader.vue`.

## Regla de mantenimiento

Antes de agregar una imagen pesada, confirmar que exista una referencia real en `src` o en la documentacion. Si se reemplaza la imagen del login, eliminar assets antiguos no usados y actualizar `src/views/README.md`.
