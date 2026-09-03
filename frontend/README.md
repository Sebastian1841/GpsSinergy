# Frontend

Aplicacion Vue 3 + Vite de la plataforma Sinergy Group Fleet Platform.

La descripcion general del proyecto esta en `../README.md`. Este README resume
como trabajar dentro del frontend.

## Comandos

```bash
npm install
npm run dev
npm run build
npm test
npm run lint
npm run format:check
```

Tambien existe:

```bash
npm run validate
```

que ejecuta pruebas, lint, revision de formato y build.

## Estructura principal

```txt
src/
  assets/       branding, estilos e imagenes internas
  components/   componentes Vue por dominio
  composables/  estado y coordinacion de flujos
  data/         datos mock y configuracion estatica
  router/       rutas y guards de acceso
  services/     adaptadores, storage y servicios mock
  utils/        helpers puros, calculos y exportadores
  views/        pantallas principales
```

## Regla de organizacion

- `views` orquesta pantallas completas.
- `components` contiene UI reutilizable o secciones visuales.
- `composables` concentra estado reactivo y coordinacion de flujos.
- `utils` contiene funciones puras y testeables.
- `services` encapsula storage, mocks y futuros adaptadores de API.

## Documentacion

- `docs/flujos-principales.md`
- `docs/archivos-criticos.md`
- `docs/criterios-arquitectura.md`
- `docs/guia-frontend.md`

Los README locales dentro de `src` explican responsabilidades por carpeta.
