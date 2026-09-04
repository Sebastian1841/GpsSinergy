# Company Components

Componentes para administracion de empresas. El modulo sigue una estructura de
panel administrativo: cabecera simple, filtros laterales, resumen superior y
catalogo central en tabla. La topbar global la entrega el layout principal; este
modulo no debe replicarla.

## Archivos

- `CompanyManagementHeader.vue`: cabecera principal del modulo. Incluye icono,
  contexto `Empresas`, titulo, descripcion y accion `Nueva empresa`. No contiene
  busqueda, filtros ni KPIs para mantener la cabecera limpia.
- `CompanyFiltersPanel.vue`: panel lateral de filtros. Coordina busqueda por
  nombre/RUT/ciudad, estado, region, ciudad y accion para limpiar filtros. Debe
  estirarse con el contenido principal para que no quede visualmente mas corto
  que la tabla.
- `CompanySummaryStrip.vue`: franja superior de indicadores. Resume total de
  empresas, activas, suspendidas e inactivas. Las empresas internas se cuentan
  visualmente dentro de inactivas, pero mantienen badge propio en la tabla.
- `CompanyCatalog.vue`: catalogo principal. Muestra toolbar de ordenamiento,
  cambio de vista tabla/grilla, tabla de empresas, vista grid opcional, estado
  vacio y paginacion.
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

Mantener el modulo corporativo, denso y facil de escanear. La pantalla debe
parecer una consola de administracion: filtros a la izquierda, metricas arriba y
tabla clara para comparar empresas. La configuracion avanzada debe seguir
viviendo en modales/paneles dedicados.

El scroll vertical lo controla `CompanyManagementView.vue` en el area principal.
`CompanyCatalog.vue` solo puede usar scroll horizontal en la tabla cuando el
ancho no alcance. No debe crear un scroll vertical interno propio.

La tabla debe mantenerse compacta: avatar cercano a 36px, filas de altura
moderada, textos truncados cuando corresponda y acciones claras. Evitar que la
accion principal quede solo como tres puntos si abre directamente el panel de
configuracion; en ese caso debe decir `Configurar` para que se entienda a simple
vista. La prioridad de esta pantalla es comparar varias empresas rapidamente.

Los bordes deben ser suaves y consistentes con el resto de la plataforma: usar
tonos cercanos a `#dfe5ed` y `#edf1f5`, divisores claros y sombras ligeras.
Evitar animaciones de desplazamiento o levantamiento; el hover puede cambiar
levemente fondo o borde.

El buscador vive en `CompanyFiltersPanel.vue`, no en el header. Debe ser claro y
compacto, con icono, boton de limpiar cuando hay texto y estado de focus visible.

Los filtros de estado viven en el panel lateral. La UI visible usa cuatro
opciones: `Todas`, `Activas`, `Suspendidas` e `Inactivas`. El estado interno
`internal` se conserva como dato real, pero cae dentro del filtro visual
`Inactivas` para mantener el modulo simple.

## Regla de mantenimiento

La UI de empresas debe delegar estado y persistencia en `composables/companies`
y `services/companies`. Si se agrega una nueva seccion visible, documentarla en
este README.

Los grupos de vehiculos no pertenecen a este modulo. Empresas solo gestiona la
ficha corporativa y sus reportes base; la organizacion de flota se realiza en
Activos, despues de aplicar permisos y etiquetas de acceso.
