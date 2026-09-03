# Sinergy Group Fleet Platform

Frontend Vue para un prototipo funcional de gestion de flota GPS en entorno
multiempresa. La plataforma cubre activos, mapa, geocercas, reportes,
mantenciones, usuarios, permisos, empresas y auditoria.

El objetivo del proyecto es modelar una operacion real de flota: primero se
calcula que empresas y vehiculos puede ver el usuario, y despues se aplican
filtros visuales, vistas guardadas, reportes y acciones de cada modulo.

## Donde esta cada cosa

```txt
Emulador/
|-- README.md                         README general para GitHub
`-- frontend/
    |-- README.md                     Guia corta del frontend
    |-- package.json                  Dependencias y scripts npm
    |-- package-lock.json             Versiones bloqueadas de dependencias
    |-- vite.config.js                Configuracion Vite, Vue, Tailwind y chunks
    |-- public/                       Imagenes/recursos referenciados por URL
    |-- docs/                         Documentacion tecnica general
    `-- src/
        |-- main.js                   Entrada de Vue
        |-- App.vue                   Contenedor raiz y layout publico/privado
        |-- style.css                 Estilos globales base
        |-- router/                   Rutas, redirects y guards de acceso
        |-- views/                    Pantallas principales por modulo
        |-- components/               Componentes visuales reutilizables
        |-- composables/              Estado reactivo y coordinacion de flujos
        |-- services/                 Storage, mocks y adaptadores de datos
        |-- utils/                    Funciones puras, calculos y exportadores
        |-- data/                     Datos mock y configuraciones semilla
        `-- assets/                   Branding, estilos e imagenes internas
```

## Mapa rapido de carpetas

| Necesitas revisar | Ubicacion principal |
| --- | --- |
| Rutas y permisos de navegacion | `frontend/src/router/index.js` |
| Pantallas principales | `frontend/src/views/` |
| Header, sidebar, buscador global y selector de vistas | `frontend/src/components/Layout/` |
| Login y sesion | `frontend/src/views/LoginView.vue`, `frontend/src/composables/auth/`, `frontend/src/services/auth/` |
| Permisos, empresas accesibles y activos visibles | `frontend/src/composables/auth/useAccessControl.js` |
| Datos mock de empresas, usuarios, activos y permisos | `frontend/src/data/mockDatabase.js` |
| Activos/Fleet | `frontend/src/views/ActivosView.vue`, `frontend/src/components/activos/`, `frontend/src/composables/activos/` |
| Mapa GPS | `frontend/src/components/activos/map/`, `frontend/src/composables/activos/map/` |
| Geocercas | `frontend/src/components/activos/geocercas/`, `frontend/src/composables/activos/geocercas/`, `frontend/src/utils/geofence*.js` |
| Filtros de ciudad y grupos de vehiculos | `frontend/src/components/Layout/HeaderFleetAssetFilterMenu.vue`, `frontend/src/composables/activos/fleet/`, `frontend/src/utils/activos/assetVehicleGroupUtils.js` |
| Etiquetas de acceso de activos | `frontend/src/components/activos/fleet/FleetAssetTagsPanel.vue`, `frontend/src/components/users/UserAssetTagScopeSelector.vue`, `frontend/src/utils/users/userAssetTagUtils.js` |
| Reportes | `frontend/src/views/ReportsView.vue`, `frontend/src/components/reports/`, `frontend/src/composables/reports/`, `frontend/src/utils/reports/` |
| Reglas de evento de reportes | `frontend/src/components/reports/ReportEventRulesModal.vue`, `frontend/src/utils/reports/event-rules/` |
| Ejecucion de reportes | `frontend/src/components/reports/ReportExecutionModal.vue`, `frontend/src/composables/reports/useAssetReportExecution.js`, `frontend/src/utils/reports/execution/` |
| Exportacion PDF/Excel | `frontend/src/utils/reports/export/`, `frontend/src/utils/reports/route-map/` |
| Mantenciones | `frontend/src/views/MaintenanceView.vue`, `frontend/src/components/maintenance/`, `frontend/src/composables/maintenance/`, `frontend/src/utils/maintenance/` |
| Usuarios y permisos | `frontend/src/views/UserManagementView.vue`, `frontend/src/components/users/`, `frontend/src/composables/users/`, `frontend/src/utils/users/` |
| Empresas | `frontend/src/views/CompanyManagementView.vue`, `frontend/src/components/companies/`, `frontend/src/composables/companies/`, `frontend/src/services/companies/` |
| Auditoria | `frontend/src/views/AuditView.vue`, `frontend/src/components/audit/`, `frontend/src/composables/audit/`, `frontend/src/services/audit/` |
| Storage/localStorage | `frontend/src/services/storage/browserStorage.js` |
| Documentacion tecnica | `frontend/docs/` y los `README.md` dentro de `frontend/src/` |

## Modulos y rutas principales

| Modulo | Ruta principal | Proposito |
| --- | --- | --- |
| Login | `/login` | Inicio de sesion contra usuarios mock. |
| Activos | `/app/:empresaId/activos` | Monitoreo de flota, mapa, tabla, geocercas, itinerarios y acciones de vehiculo. |
| Reportes | `/app/:empresaId/reportes` | Biblioteca, creacion, reglas, ejecucion, preview, PDF y Excel. |
| Mantenciones | `/app/:empresaId/mantenciones` | Planes, ordenes de trabajo, historial y costos por activo. |
| Auditoria | `/app/:empresaId/auditoria` | Registro visual de acciones y filtros de actividad. |
| Usuarios | `/app/:empresaId/usuarios` | Gestion de usuarios, roles, permisos y alcance operativo. |
| Empresas | `/empresas` | Gestion global de empresas para administradores de plataforma. |

Las rutas generales como `/activos`, `/reportes` o `/mantenciones` redirigen o
validan segun el usuario autenticado y la ultima empresa accesible.

## Reglas de dominio

La regla central es separar permisos reales de filtros visuales:

```txt
Activos de la empresa
-> permisos y etiquetas de acceso
-> activos autorizados del usuario
-> filtros visuales de ciudad o grupos de vehiculos
-> activos visibles en pantalla
```

- Etiquetas de acceso: limitan que vehiculos puede ver realmente un usuario.
- Grupos de vehiculos: solo organizan y filtran vehiculos ya autorizados.
- Ciudades: funcionan como filtro visual, no como permiso.
- Grupos de geocercas: organizan geocercas; no controlan permisos de activos.
- Busqueda global, reportes, mapa, tablas y selectores deben trabajar desde el
  universo autorizado del usuario.
- Preview, PDF y Excel de reportes deben salir desde las mismas filas generadas
  para evitar diferencias entre formatos.

## Estado actual

Este repositorio contiene principalmente el frontend. La app funciona como
prototipo local con datos mock y persistencia en el navegador.

Incluye:

- autenticacion mock;
- permisos por empresa, modulo y funcion;
- activos y telemetria simulada;
- geocercas y grupos de geocercas;
- plantillas y reglas de reportes;
- exportacion PDF/Excel;
- usuarios, roles y alcances;
- mantenciones de demostracion;
- auditoria local.

Para produccion, la sesion, permisos, auditoria, activos visibles y
exportaciones deben validarse tambien desde backend.

## Datos mock relevantes

Fuente principal:

```txt
frontend/src/data/mockDatabase.js
```

Empresas de demo:

- Transportes San Pedro
- Forestal Los Robles
- Constructora Norte
- Sinergy Interno

Cuentas mock principales:

| Usuario | Clave | Perfil |
| --- | --- | --- |
| `admin@sinergy.cl` | `admin1234` | Administrador de plataforma |
| `operador.norte@sinergy.cl` | `operador1234` | Operador |
| `supervisor.geo@sinergy.cl` | `supervisor1234` | Supervisor |
| `cliente@sinergy.cl` | `cliente1234` | Visualizador |
| `soporte@sinergy.cl` | `soporte1234` | Tecnico |

## Tecnologia y librerias

Versiones segun `frontend/package.json`.

| Paquete | Version | Uso |
| --- | --- | --- |
| `vue` | `^3.5.34` | Componentes e interfaz principal. |
| `vue-router` | `^4.6.4` | Rutas, redirecciones y guards. |
| `vite` | `^8.0.12` | Servidor local y build. |
| `@vitejs/plugin-vue` | `^6.0.6` | Soporte Vue en Vite. |
| `tailwindcss` | `^4.3.0` | Estilos utilitarios. |
| `@tailwindcss/vite` | `^4.3.0` | Integracion Tailwind con Vite. |
| `leaflet` | `^1.9.4` | Mapa, marcadores, geocercas y rutas. |
| `chart.js` | `^4.5.1` | Graficos en vistas y reportes. |
| `exceljs` | `^4.4.0` | Generacion de Excel. |
| `jspdf` | `^4.2.1` | Generacion de PDF. |
| `jspdf-autotable` | `^5.0.8` | Tablas dentro de PDF. |
| `html2canvas` | `^1.4.1` | Capturas visuales para exportacion. |
| `jszip` | `^3.10.1` | Archivos comprimidos e importacion/exportacion. |
| `dompurify` | `^3.4.11` | Sanitizacion de HTML generado. |
| `eslint` | `^10.4.0` | Revision de codigo. |
| `eslint-plugin-vue` | `^10.9.1` | Reglas Vue para ESLint. |
| `prettier` | `^3.8.3` | Formato de codigo. |

## Como esta organizado el codigo

- `views` orquesta pantallas completas.
- `components` renderiza UI y emite eventos.
- `composables` maneja estado Vue, watchers y coordinacion.
- `utils` contiene funciones puras y testeables.
- `services` encapsula storage, mocks y futuros adaptadores de API.
- `data` contiene semillas mock y configuracion estatica.

## Flujos clave

Login y permisos:

```txt
LoginView
-> useAuthSession
-> useAuthService
-> useAccessControl
-> router.beforeEach
-> vista permitida
```

Activos:

```txt
mock assets
-> visibleAssets por permisos/etiquetas
-> filtros de ciudad/grupo
-> mapa, tabla, cards, reportes y selectores
```

Reportes:

```txt
plantilla + activos autorizados + fechas + reglas
-> executeReport
-> reportRows
-> preview / Excel / PDF
```

Geocercas:

```txt
useGeofences
-> panel lateral de geocercas
-> mapa Leaflet
-> importacion/exportacion
-> auditoria local
```

## Instalacion

Requisitos:

- Node.js
- npm
- Navegador moderno
- Repositorio clonado localmente

El proyecto usa `package-lock.json`, por lo que se recomienda instalar con npm.

```bash
cd frontend
npm install
npm run dev
```

URL local por defecto:

```txt
http://localhost:5173
```

## Scripts utiles

```bash
npm run dev           # servidor local de desarrollo
npm run build         # build de produccion
npm run preview       # preview local del build
npm test              # pruebas unitarias con node:test
npm run lint          # revision ESLint
npm run lint:fix      # correccion automatica de lint cuando aplica
npm run format        # formatea archivos JS, Vue, CSS, JSON y HTML
npm run format:check  # revision de formato
npm run validate      # test + lint + formato + build
```

## Documentacion interna

La documentacion tecnica vive en `frontend/docs` y en los README locales dentro
de `frontend/src`.

Lectura recomendada:

- `frontend/docs/flujos-principales.md`: como se conectan los modulos.
- `frontend/docs/archivos-criticos.md`: archivos que requieren mas cuidado.
- `frontend/docs/criterios-arquitectura.md`: reglas para ubicar codigo nuevo.
- `frontend/docs/guia-frontend.md`: explicacion mas amplia del frontend.

## Notas de mantenimiento

- No usar grupos de vehiculos como permisos.
- No usar etiquetas de acceso como simple filtro visual.
- No acceder a `localStorage` directamente desde componentes; usar servicios.
- No duplicar calculos entre preview, PDF y Excel.
- Si una regla de reporte expone campos nuevos, tambien deben existir columnas
  configurables equivalentes.
- Si cambia un flujo importante, actualizar la documentacion del modulo
  afectado.
