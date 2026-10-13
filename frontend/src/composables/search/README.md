# Search Composables

Composables para busquedas transversales de la plataforma.

## Archivos

- `useGlobalSearch.js`: construye resultados agrupados para el buscador del header. Cruza empresas, activos, reportes, usuarios, auditoria y espacios de trabajo usando los datos visibles del frontend y validando permisos antes de exponer rutas. Recibe `typeFilter` para limitar la busqueda a una entidad concreta antes de aplicar el limite global de resultados. En un tipo concreto, como `asset` o `company`, devuelve todos los resultados del tipo para no esconder activos o empresas por el limite del modo `Todo`.

## Regla de mantenimiento

La busqueda general limita resultados a 36 y detiene el recorrido al alcanzar
el limite; no concatena todas las entidades para descartarlas despues. Una
busqueda de tipo especifico evalua esa fuente y conserva todas sus coincidencias.
Sin consulta, se mantienen los resultados sugeridos y limites por grupo.
`useGlobalSearch.test.js` cubre limites, tipos y comportamiento del recorrido.

La busqueda global debe resolver datos y rutas, pero no debe renderizar UI. Si se agregan nuevas entidades buscables, agregarlas aqui y mantener `AppHeader.vue` como consumidor visual.

`AppHeader.vue` muestra esta busqueda para usuarios autenticados. El composable
debe limitar resultados a lo permitido por `accessibleCompanies`,
`visibleAssets`, usuarios prefiltrados por `useAppHeaderAccessScope`,
`canAccessModule` y `canAccessFunction`. El administrador ve todo porque la capa
de acceso le entrega alcance completo.

Cuando la UI necesite buscar solo empresas, activos u otro tipo, debe enviar el
tipo seleccionado a `typeFilter`. Evitar filtrar despues de `globalSearchResults`
en el componente, porque en ese punto los resultados ya vienen limitados y se
pueden perder empresas si antes coincidieron muchos activos.

Los activos deben resolver una empresa antes de crear la ruta de navegacion. Si
un activo no trae `companyId`, `useGlobalSearch.js` puede usar la empresa activa
como respaldo; si no hay empresa resoluble, el activo no debe exponerse como
resultado porque no existe una ruta segura para abrirlo.
