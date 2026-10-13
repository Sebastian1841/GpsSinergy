# User Components

Componentes del modulo de usuarios y permisos. La vista principal prioriza una
barra compacta de busqueda, filtros y creacion, seguida por el directorio. El
detalle y la edicion se abren sobre esta superficie solo cuando se necesitan.

## Archivos

- `UserManagementHeader.vue`: encabezado legado conservado temporalmente para
  compatibilidad, pero ya no se monta desde `UserManagementView.vue`.
- `UserFiltersBar.vue`: barra compacta con buscador, filtros por empresa, rol,
  estado y modulo, y accion `Nuevo usuario` condicionada por permisos. Recibe
  `companyFilterLocked` cuando la vista viene desde una empresa especifica. La
  buscador absorbe el espacio flexible de la fila, mientras filtros y accion de
  creacion conservan su ancho natural a la derecha.
- `UserListPanel.vue`: directorio plano de usuarios. Usa la misma logica visual
  de catalogo que Empresas: toolbar de ordenamiento, cambio de direccion,
  selector lista/cards y paginacion. Ambas vistas muestran estado, correo, rol
  principal, cantidad de accesos y abren el mismo drawer de detalle al
  seleccionar un usuario. El filtro de empresa limita los accesos considerados
  sin duplicar usuarios ni agrupar la lista por empresa.
  En modo cards usa tres columnas en escritorio y separa identidad/estado,
  empresa/accesos y acciones. `Editar` solo aparece con permiso de edicion y
  abre directamente `UserEditorModal`; `Ver detalle` conserva el drawer.
  En modo lista presenta columnas para usuario, rol, empresa, accesos, ultimo
  acceso, estado y acciones. La tabla conserva ancho minimo y scroll horizontal
  en pantallas angostas, y permite elegir 5, 10 o 20 usuarios por pagina.
- `UserAccessDetail.vue`: detalle del usuario seleccionado con tabs. `Resumen` muestra informacion general, KPIs de accesos/permisos y acciones rapidas; `Accesos` contiene la edicion completa y agrupa los accesos por empresa cuando el usuario tiene permisos en mas de una; `Auditoria` referencia el historial general. Si el usuario es `isPlatformAdmin`, muestra una nota de acceso total y deja los permisos en modo lectura.
- `UserCompanyAccessMatrix.vue`: accesos por empresa/aplicacion. Cada bloque coordina rol, estado, permisos por modulo y alcance operativo. Las etiquetas se resuelven por `applicationId` y, como respaldo, por `companyId` para mantener compatibilidad con etiquetas creadas antes de ligar aplicacion.
- `UserModulePermissionGrid.vue`: editor simple de modulos y funciones con navegacion lateral y tabla plana de permisos.
- `UserOperationalScopePanel.vue`: selector simple de alcance operativo: todos los activos, activos especificos o etiquetas de acceso. Los alcances antiguos por sucursal se interpretan como activos especificos equivalentes para no perder permisos guardados, pero no se ofrecen como opcion nueva.
- `UserAssetScopeSelector.vue`: selector de activos autorizados con busqueda y carga progresiva para listas largas.
- `UserAssetTagScopeSelector.vue`: selector de etiquetas operativas. Permite que un usuario vea todos los activos que compartan una o mas etiquetas. Si recibe etiquetas de varias empresas, las separa por empresa y permite buscar tambien por nombre o id de empresa.
- `UserApplicationSearchSelect.vue`: buscador de aplicaciones disponibles por empresa para agregar accesos.
- `UserEditorModal.vue`: modal responsive de creacion y edicion separado del
  editor de permisos. Divide el formulario en `Datos de la cuenta` y `Acceso
inicial`, permite mostrar u ocultar la contrasena, valida correo y longitud
  minima al crear, y conserva los identificadores internos de aplicacion y rol.
  Se carga async desde `UserManagementView.vue` y se monta solo al abrir para no
  hacer mas pesada la pantalla principal.

## Regla de mantenimiento

Los componentes solo deben presentar estado y emitir cambios del draft. La normalizacion de permisos, scopes, filtros y persistencia debe quedar en `composables/users`, `utils/users` o `services/users`.

Cuando se agregue una nueva regla visual o una nueva pieza del flujo de usuarios, documentarla aqui junto con el archivo responsable.

Mantener la estructura de tres zonas: filtros y acciones, directorio y detalle
con tabs. Si se agrega una funcionalidad nueva, debe entrar en una de esas
zonas sin agregar capas visuales innecesarias.

El cambio de vista del directorio vive en `UserListPanel.vue` y se controla
desde `useUserAccessManagement.js` con `userViewMode`. El ordenamiento y la
paginacion tambien vienen del composable. No debe duplicar usuarios ni alterar
permisos; solo cambia la presentacion visual del mismo resultado filtrado,
ordenado y paginado.

La vista `UserManagementView.vue` aplica una escala de legibilidad sobre el
modulo completo mediante `users-management-readable`. Mantener los textos base
del modulo como minimo en una lectura equivalente a 11-13px reales; evitar
volver a usar 8-10px efectivos en tablas, filtros, badges o permisos porque el
panel pierde legibilidad.
La tipografia del modulo depende de la escala comun `module-readable` definida
en `App.vue`. No se debe agregar una segunda escala local en
`UserManagementView.vue`, porque produciria tamanos distintos al resto de los
modulos privados. Activos es la unica excepcion deliberada a esa escala.
