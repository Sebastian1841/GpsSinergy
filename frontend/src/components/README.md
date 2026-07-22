# Components

Componentes Vue reutilizables y piezas visuales por dominio.

## Carpetas

- `activos/`: UI de flota, mapa, geocercas, itinerarios y rutas.
- `audit/`: modulo visual de auditoria.
- `auth/`: componentes ligados a autenticacion o sesion.
- `companies/`: administracion de empresas.
- `icons/`: componentes de iconografia.
- `Layout/`: estructura principal de navegacion y header.
- `reports/`: modales y formularios de reportes.
- `ui/`: componentes genericos de interfaz.
- `users/`: administracion de usuarios y permisos.

## Regla de mantenimiento

Un componente debe priorizar render, eventos y props. Si empieza a contener reglas de negocio, mover esa logica a `composables` o `utils`.
