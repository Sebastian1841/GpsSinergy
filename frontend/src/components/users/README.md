# User Components

Componentes del modulo de usuarios y permisos. La vista esta organizada como un panel administrativo: topbar oscuro con buscador, KPIs superiores sin iconos, panel izquierdo de filtros/directorio y panel derecho con tabs de resumen, accesos y auditoria.

## Archivos

- `UserManagementHeader.vue`: topbar del modulo con logo, titulo, buscador global del modulo, KPIs filtrables sin iconos y accion de crear usuario.
- `UserFiltersBar.vue`: filtros por empresa, rol, estado y modulo. Recibe `companyFilterLocked` cuando la vista viene desde una empresa especifica.
- `UserListPanel.vue`: directorio plano de usuarios. Muestra estado, correo, rol principal y cantidad de accesos. El filtro de empresa limita los accesos considerados sin duplicar usuarios ni agrupar la lista por empresa.
- `UserAccessDetail.vue`: detalle del usuario seleccionado con tabs. `Resumen` muestra informacion general, KPIs de accesos/permisos y acciones rapidas; `Accesos` contiene la edicion completa y agrupa los accesos por empresa cuando el usuario tiene permisos en mas de una; `Auditoria` referencia el historial general. Si el usuario es `isPlatformAdmin`, muestra una nota de acceso total y deja los permisos en modo lectura.
- `UserCompanyAccessMatrix.vue`: accesos por empresa/aplicacion. Cada bloque coordina rol, estado, permisos por modulo y alcance operativo. Las etiquetas se resuelven por `applicationId` y, como respaldo, por `companyId` para mantener compatibilidad con etiquetas creadas antes de ligar aplicacion.
- `UserModulePermissionGrid.vue`: editor simple de modulos y funciones con navegacion lateral y tabla plana de permisos.
- `UserOperationalScopePanel.vue`: selector simple de alcance operativo: todos los activos, activos especificos o etiquetas de acceso. Los alcances antiguos por sucursal se interpretan como activos especificos equivalentes para no perder permisos guardados, pero no se ofrecen como opcion nueva.
- `UserAssetScopeSelector.vue`: selector de activos autorizados con busqueda y carga progresiva para listas largas.
- `UserAssetTagScopeSelector.vue`: selector de etiquetas operativas. Permite que un usuario vea todos los activos que compartan una o mas etiquetas. Si recibe etiquetas de varias empresas, las separa por empresa y permite buscar tambien por nombre o id de empresa.
- `UserApplicationSearchSelect.vue`: buscador de aplicaciones disponibles por empresa para agregar accesos.
- `UserEditorModal.vue`: modal de creacion y edicion de usuario, separado del editor de permisos. Se carga async desde `UserManagementView.vue` y se monta solo al abrir para no hacer mas pesada la pantalla principal.

## Regla de mantenimiento

Los componentes solo deben presentar estado y emitir cambios del draft. La normalizacion de permisos, scopes, filtros y persistencia debe quedar en `composables/users`, `utils/users` o `services/users`.

Cuando se agregue una nueva regla visual o una nueva pieza del flujo de usuarios, documentarla aqui junto con el archivo responsable.

Mantener la estructura de cuatro zonas: topbar/KPIs, filtros, directorio y detalle con tabs. Si se agrega una funcionalidad nueva, debe entrar en una de esas zonas sin agregar capas visuales innecesarias.

La vista `UserManagementView.vue` aplica una escala de legibilidad sobre el
modulo completo mediante `users-management-readable`. Mantener los textos base
del modulo como minimo en una lectura equivalente a 11-13px reales; evitar
volver a usar 8-10px efectivos en tablas, filtros, badges o permisos porque el
panel pierde legibilidad.
