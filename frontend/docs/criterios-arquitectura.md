# Criterios de arquitectura frontend

El proyecto esta ordenado por responsabilidad tecnica, no por una carpeta de modulos separada. Esto evita duplicar componentes, composables y utils del mismo dominio en dos estructuras distintas.

## Capas

### `views`

Pantallas conectadas al router. Deben orquestar componentes, composables y servicios.

Usar para:

- Leer parametros de ruta.
- Conectar varios componentes de una pantalla.
- Disparar acciones de alto nivel.
- Manejar modales principales.

Evitar:

- Calculos pesados.
- Normalizacion compleja.
- Acceso directo a `localStorage`.
- Reglas de permisos duplicadas.

### `components`

UI reutilizable o secciones visuales. Deben recibir datos por props y emitir eventos.

Usar para:

- Layout visual.
- Tablas, modales, formularios y paneles.
- Estados visuales de carga, vacio o error.

Evitar:

- Mutar servicios directamente.
- Guardar datos persistentes.
- Ejecutar reglas de negocio pesadas.

### `composables`

Estado Vue, computed, watchers y coordinacion de flujos.

Usar para:

- Estado compartido entre componentes.
- Sincronizacion de datos reactivos.
- Ciclos de vida.
- Coordinacion de servicios y utils.

Evitar:

- HTML o UI.
- Funciones puras largas que pueden vivir en `utils`.
- Acoplarse a un componente visual especifico si la logica es reusable.

### `services`

Capa de datos. Oculta si la fuente viene de mocks, storage, APIs o proveedores externos.

Usar para:

- Login y sesion.
- CRUD de entidades.
- Persistencia local.
- Servicios externos como geocoding o routing.
- Adaptadores mock.

Evitar:

- Componentes Vue.
- Reglas visuales.
- Formato especifico de una tabla o modal.

### `utils`

Funciones puras y testeables.

Usar para:

- Normalizar datos.
- Calcular filas de reportes.
- Evaluar reglas.
- Formatear valores.
- Construir documentos o mapas exportables.

Evitar:

- Estado Vue.
- Acceso directo a servicios.
- Dependencias de componentes.

### `data`

Semillas mock y configuraciones estaticas.

Usar para:

- Datos iniciales del prototipo.
- Configuraciones base.
- Fixtures simples.

Evitar:

- Convertirlo en base de datos real.
- Guardar datos que el usuario espera compartir entre navegadores.

## Como decidir donde poner codigo nuevo

Si renderiza algo, va en `components`.

Si coordina estado reactivo, va en `composables`.

Si calcula algo sin Vue, va en `utils`.

Si lee o escribe datos, va en `services`.

Si es una pantalla del router, va en `views`.

Si es mock o configuracion semilla, va en `data`.

## Senales de alerta

- Un componente empieza a tener muchos `watch`: mover a composable.
- Una vista tiene muchos helpers internos: mover a composables o utils.
- Un service formatea columnas o textos visuales: mover a utils/componentes.
- Un util importa Vue: probablemente debe ser composable.
- Un archivo toca `localStorage` directamente: mover a `services/storage`.
- Un cambio rompe PDF y Excel distinto a preview: revisar que usen la misma fuente de filas.

## Regla para documentacion nueva

Cada carpeta con archivos directos debe tener `README.md`.

El README debe incluir:

- Para que existe la carpeta.
- Que hace cada archivo.
- Que no deberia ponerse ahi.
- Archivos o carpetas relacionadas.

La explicacion funcion por funcion solo debe agregarse cuando la funcion sea critica, compartida o riesgosa.
