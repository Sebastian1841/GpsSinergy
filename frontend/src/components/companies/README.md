# Company Components

Componentes para administracion de empresas. El modulo sigue una estructura
similar a un directorio corporativo: encabezado de gestion, busqueda/filtros/KPIs
y tarjetas de empresas en dos columnas. La topbar global la entrega el layout
principal; este modulo no debe replicarla.

## Archivos

- `CompanyManagementHeader.vue`: cabecera principal del modulo. Incluye titulo,
  busqueda, accion de crear empresa, filtros por estado, limpiar filtros y KPIs
  compactos. No renderiza logo ni usuario porque eso pertenece al header global.
- `CompanyCatalog.vue`: grilla de tarjetas de empresa. Cada tarjeta resume
  identidad, estado, ubicacion, activos, usuarios, reportes base y acciones
  principales.
- `CompanyConfigPanel.vue`: panel modal de configuracion profunda. Contiene
  tabs de resumen y reportes. Se carga async y se monta solo cuando el usuario
  abre la configuracion. No administra grupos de vehiculos: esos viven en el
  header de Activos como filtros organizativos.
- `CompanyEditorModal.vue`: modal de creacion y edicion de datos generales.
  Tambien se carga async para que el directorio de empresas abra sin cargar el
  formulario antes de usarlo.
- `CompanyReportPanel.vue`: panel de reportes asociados a empresa, usado dentro
  de `CompanyConfigPanel.vue`.

## Criterio visual

Mantener el modulo corporativo y denso, pero no saturado. La pantalla debe
parecer un directorio de empresas: busqueda arriba, filtros visibles y tarjetas
claras con acciones. La configuracion avanzada debe seguir viviendo en
modales/paneles dedicados.

El scroll vertical lo controla `CompanyManagementView.vue` en el area principal.
`CompanyCatalog.vue` no debe crear un scroll interno propio, porque eso impide
bajar de forma natural cuando el usuario mueve la rueda fuera de la grilla.

Las tarjetas de empresa deben mantenerse compactas: avatar cercano a 48px,
acciones de 32px de alto y paddings moderados. La prioridad de esta pantalla es
ver varias empresas al mismo tiempo, no mostrar fichas grandes.

Los bordes de las tarjetas deben ser suaves y consistentes con el resto de la
plataforma: usar tonos cercanos a `#edf1f7`, divisores internos claros y sombras
ligeras. Reservar bordes fuertes o rings marcados solo para estado seleccionado
o foco real. Las tarjetas no deben desplazarse ni levantarse con animaciones en
hover; solo pueden cambiar levemente borde o sombra.

El buscador del header debe ser claro y compacto: icono en capsula, estado de
focus visible, boton de limpiar cuando hay texto y espacio reservado para sus
controles internos para evitar saltos visuales.

Los filtros de estado viven junto al buscador como un control segmentado con
etiqueta `Estado`. Evitar volver a botones sueltos sin agrupacion, porque se
lee desordenado en anchos grandes.

## Regla de mantenimiento

La UI de empresas debe delegar estado y persistencia en `composables/companies`
y `services/companies`. Si se agrega una nueva seccion visible, documentarla en
este README.

Los grupos de vehiculos no pertenecen a este modulo. Empresas solo gestiona la
ficha corporativa y sus reportes base; la organizacion de flota se realiza en
Activos, despues de aplicar permisos y etiquetas de acceso.
