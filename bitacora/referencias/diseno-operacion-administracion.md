# Referencia Visual: Operacion Y Administracion

Referencia visual, no listado de pendientes ni aprobacion de produccion.

Revision del codigo frontend: 2026-11-03. Documento de referencia para futuros cambios
visuales, solicitado por el usuario. No implica una auditoria funcional ni una
verificacion visual exhaustiva de todas las pantallas en navegador.

## Alcance

- Operacion: Activos, Sin reportar, Reportes, Alertas y Mantenciones.
- Administracion: Empresas, Gestion de usuarios y Auditoria.
- Navegacion compartida: `frontend/src/components/Layout/AppSidebar.vue`.
- Son patrones observados, no un sistema de diseno uniforme ya implementado.

## Identidad Compartida

- Azul corporativo `#102372`: titulos, cifras, seleccion y acciones secundarias.
- Naranja `#ff6600`: accion principal, acentos y foco; hover habitual `#e65c00`.
- Estructura de navegacion oscura `#1c2937`, texto claro y seleccion naranja.
- Superficies de trabajo blancas; fondos claros `#f4f7fb`, `#f5f8fc`, `#f6f8fb`
  y `#f7f9fc`. Activos utiliza tambien `#eef2f7`.
- Bordes discretos `#d8dee8`, `#dfe5ed`, `#dbe3ee`; divisores mas claros
  `#edf1f5`, `#e6ebf2`. Evitar contrastes decorativos innecesarios.
- Texto secundario gris slate; gris mas suave para metadata, fechas y ayudas.
- Verde para exito/activo, ambar para advertencia/pendiente y rojo para fallo o
  accion destructiva. El estado lleva texto, no solo color.

## Escala Y Forma

- Interfaz de trabajo compacta: el contenido domina, no las cabeceras.
- Titulos de modulo observados entre 16 y 22 px; subsecciones entre 13 y 16 px.
- Datos y controles habitualmente entre 11 y 13 px; etiquetas auxiliares entre
  9 y 11 px. Son valores observados, no una obligacion de reducir legibilidad.
- Predominan pesos semibold/bold y titulos extrabold/black.
- Separaciones frecuentes de 8, 12, 16, 20 y 24 px; alineacion por columnas.
- Controles de 32 a 40 px; botones de icono cuadrados de 32 a 36 px.
- Controles generalmente de radio 6 a 8 px; badges de estado tipo pastilla.
- Hay contenedores existentes `rounded-xl` de 12 px en Empresas, Usuarios y
  Auditoria. No inventar nuevos radios grandes ni convertir todo en tarjetas.
- Sombras ligeras para separar herramientas y mas marcadas en modales.

## Como Se Entrega La Informacion

- Orden habitual: filtros/acciones, resumen relevante, listado, detalle.
- Una accion principal naranja; exportar, ordenar, limpiar y cambiar vista son
  secundarios. Acciones por fila compactas con nombre accesible y tooltip.
- Tablas y filas con columnas estables, separadores finos y hover suave.
- Identidad principal destacada; dato secundario debajo con menor contraste.
- Resumenes pequenos y relacionados con el trabajo, no bloques vacios estirados.
- Busqueda con icono, filtros por estado/empresa/fecha segun contexto y limpieza.
- Mostrar cantidad de resultados y paginacion cuando corresponda.
- Seleccion visible: fondo azul muy suave y, en algunos listados, borde lateral.
- Detalle progresivo: panel lateral, desplegable o modal para no saturar la lista.
- Alturas con `h-full`, `min-h-0`, flex/grid; scroll en el contenido, no cabeceras.
- En pantallas pequenas los controles se reorganizan; no ocultar contenido para
  fingir que cabe todo. Algunos listados existentes permiten scroll horizontal.

## Diferencias Por Modulo

- Activos: lista y mapa simultaneos, panel redimensionable, pestanas compactas con
  icono/contador; seleccion azul solida. Prioridad a inspeccion contextual.
- Sin reportar: filtros laterales y espacio principal para equipos; filtros
  plegables cuando falta ancho; acciones operativas y detalle del equipo.
- Reportes: busqueda y acciones arriba, pestañas por tipo, filtros y catalogo;
  CTA Nuevo naranja. Reglas y Programados son secundarios.
- Alertas: bandeja de trabajo por estado de atencion, indicadores de pendientes,
  antiguedad y atraso; lista con detalle contextual y permisos de lectura/edicion.
- Mantenciones: navegacion por tarea, acciones contextuales, periodo en analisis;
  tablas y formularios especializados, no una portada ornamental.
- Empresas: filtros laterales de 220 px en escritorio, resumen compacto de cuatro
  cifras, catalogo ordenable con selector tabla/tarjetas y panel de configuracion.
- Usuarios: cabecera compacta con Nuevo usuario; filtros, orden, lista/tarjetas,
  estados, rol, empresa y acceso. Formularios separan cuenta y permisos/alcance.
- Auditoria: filtros por fecha/modulo/accion/estado, categorias con conteo,
  registros agrupados por dia y detalle separado del evento seleccionado.

## Formularios Y Detalles

- Etiqueta sobre el campo, requeridos identificados, ayudas breves y validacion.
- Modales: cabecera y cierre visibles, cuerpo desplazable con altura limitada,
  acciones claras; no deben crecer sin limite con los datos.
- Distinguir consultar, editar, guardar y cancelar; respetar permisos existentes.
- Metadata y detalles en pares etiqueta/valor. No repetir toda la fila en tarjetas.
- Mantener vacios, errores y datos no disponibles explicitos; no inventar cifras.

## Archivos De Referencia

- `frontend/src/views/{Activos,Unreported,Reports,Alarms,Maintenance}View.vue`
- `frontend/src/components/activos/fleet/FleetPanelHeader.vue`
- `frontend/src/views/{CompanyManagement,UserManagement,Audit}View.vue`
- `frontend/src/components/companies/{CompanyCatalog,CompanySummaryStrip}.vue`
- `frontend/src/components/users/{UserManagementHeader,UserListPanel,UserEditorModal}.vue`
- `frontend/src/components/audit/{AuditActivityTable,AuditDetailModal}.vue`

## Criterio Para Proximos Cambios

Reutilizar primero componentes y patrones del modulo equivalente. Mantener azul,
naranja y neutros, densidad util, acciones predecibles y jerarquia de datos. No
copiar automaticamente las inconsistencias existentes (radios, letras muy pequenas,
espaciado de mayusculas o variantes de pestanas). No cambiar flujos por redisenar.
