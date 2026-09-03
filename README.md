# Sinergy Group Fleet Platform

Frontend Vue para un prototipo funcional de gestion de flota GPS en entorno
multiempresa. La plataforma cubre activos, mapa, geocercas, reportes,
mantenciones, usuarios, permisos, empresas y auditoria.

El objetivo del proyecto es modelar una operacion real de flota: primero se
calcula que empresas y vehiculos puede ver el usuario, y despues se aplican
filtros visuales, vistas guardadas, reportes y acciones de cada modulo.

## Jerarquia funcional

```txt
Sinergy Group Fleet Platform
|-- Login y sesion
|-- Layout privado
|   |-- Header global
|   |-- Busqueda global por permisos
|   |-- Selector de empresa / vista
|   `-- Sidebar de modulos disponibles
|-- Empresas
|   |-- Activos / Fleet
|   |   |-- Mapa GPS
|   |   |-- Tabla y cards de vehiculos
|   |   |-- Filtros de ciudad
|   |   |-- Grupos de vehiculos
|   |   |-- Etiquetas de acceso
|   |   |-- Geocercas
|   |   |-- Itinerarios
|   |   `-- Rutas planificadas
|   |-- Reportes
|   |   |-- Biblioteca de plantillas
|   |   |-- Reglas de evento
|   |   |-- Ejecucion y vista previa
|   |   `-- Exportacion PDF / Excel
|   |-- Mantenciones
|   |   |-- Planes de mantencion
|   |   |-- Ordenes de trabajo
|   |   |-- Historial
|   |   `-- Costos
|   |-- Usuarios y permisos
|   `-- Auditoria
`-- Administracion de plataforma
    |-- Empresas
    |-- Usuarios globales
    `-- Accesos por aplicacion
```

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

## Estructura tecnica

```txt
frontend/
|-- docs/                  Documentacion tecnica y flujos principales
|-- public/                Recursos publicos usados por URL directa
|-- src/
|   |-- assets/            Branding, estilos e imagenes internas
|   |-- components/        Componentes Vue por dominio
|   |-- composables/       Estado reactivo y coordinacion de flujos
|   |-- data/              Datos mock y configuracion estatica
|   |-- router/            Rutas y guards de acceso
|   |-- services/          Adaptadores, storage y servicios mock
|   |-- utils/             Helpers puros, calculos y exportadores
|   `-- views/             Pantallas principales conectadas al router
|-- package.json
|-- package-lock.json
`-- vite.config.js
```

Regla de organizacion:

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
