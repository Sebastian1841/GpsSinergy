# Bitacora de cambios

## 2026-11-09 - Nueva OT En Tres Pasos

- Trabajo (vehiculo/plan, titulo, prioridad), Programacion (fechas/asignacion)
  y Confirmar (resumen y opcionales plegables). Volver conserva entradas.
- Desde tabla, vehiculo y plan fijos con contexto separado del payload.
- Validacion por paso y al guardar; fecha limite no anterior al inicio.
  Solo el ultimo paso crea la OT; se conserva prevencion de duplicados.

## 2026-11-09 - Restaurar Diseno Completo De Nueva OT

- Revertido formulario simplificado con Mas opciones. Se restaura el formulario
  anterior por secciones y columna de costos/observaciones/datos automaticos.
- Se mantienen ancho comun de modales, fechas actuales y validaciones/prevencion
  de duplicados. Flota y Ordenes usan el mismo formulario restaurado.

## 2026-11-09 - Completar Fondo Del Panel Lateral

- Panel de filtros extendido hasta la parte inferior de la tabla. Controles
  mantienen ubicacion y orden; sin filtros nuevos ni franja superior.

## 2026-11-09 - Nutella De Franja Superior

- Revertido solo el experimento de filtros horizontales. Se restaura panel
  lateral compacto anterior, sin alterar prioridad ni acordeon/enfoque de planes.

## 2026-11-09 - Eliminar Hueco Lateral De Filtros

- Filtros en franja superior compacta y tabla a ancho completo. Busqueda, tipo,
  fechas y estados mantienen comportamiento, sin espacio vacio bajo una sidebar.
- Responsive a dos/una columnas, controles accesibles con altura limitada.

## 2026-11-09 - Enfocar Planes Del Vehiculo Seleccionado

- Ver planes cierra el vehiculo anterior y expande solo el seleccionado.
- Tras renderizar, desplaza tabla hasta fila/planes, descontando cabecera.
  Tambien al volver desde acciones. Respeta movimiento reducido y cancela
  solicitudes previas para evitar saltos al pulsar varios vehiculos rapido.

## 2026-11-09 - Ordenar Planes Por Urgencia

- Tabla expandida: vencidos, proximos, pendientes de renovacion y resto.
  Empates urgentes priorizan planes sin OT abierta. No compara unidades distintas.
- Fila principal usa el mismo orden para su mantencion prioritaria. Sin mutar
  registros guardados y con actualizacion reactiva al cambiar estado/OT.

## 2026-11-09 - Compactar Y Ordenar Panel De Filtros

- Busqueda y tipo juntos, estados debajo, rango de fechas al final. Cabecera
  compacta, panel termina con su contenido sin estirarse a la altura de tabla.
- Fechas en filas completas Desde/Hasta para evitar recortes de los inputs.
  Se mantiene scroll interno en ventanas bajas y mismo comportamiento de filtros.

## 2026-11-09 - Simplificar Filtros De Mantenciones Para Cliente

- Se retiran Empresa y Tipo de vehiculo de Flota, con su estado/filtro local.
- Se conservan busqueda, estado, tipo de mantencion y fecha de vencimiento.
  Sin cambios de permisos ni alcance de empresa de la sesion/ruta.

## 2026-11-09 - Eliminar Planes Fantasma Sin Configuracion

- Eliminada generacion de planes base y fallback de filas ficticias en Flota.
  Solo planes guardados; sin planes, vehiculo Sin configurar con contador cero.
- No se crean OT sinteticas por tener un activo; se retienen overrides/costos
  existentes. Se retira el historico de OT generado por demostracion.
- Alta valida todos los campos obligatorios antes de crear registro. Pruebas de
  flujo crean ahora sus propios planes/OT explicitamente, no dependen de fakes.

## 2026-11-09 - Eliminar Modal Mantenciones Del Vehiculo

- Retirada pantalla duplicada de planes/historial del vehiculo. Tabla expandida
  conserva planes; nombre/configuracion abre edicion directa del plan exacto.
- Guardar/cancelar ya no reabre detalle retirado. Accesos heredados vuelven a
  Flota y solicitan expansion de la fila. Detalle de OT intacto.
- Eliminar plan manual permanece accesible en edicion, con confirmacion existente.

## 2026-11-09 - Unificar Evaluacion De Planes Base

- Se retiran fechas/restantes/estados prefijados de planes base de la tabla.
  Sin intervalo y referencia reales muestran Sin configurar; comparten evaluador
  con planes nuevos. No se inventa objetivo para completar datos ausentes.
- Criterio base coincide con catalogo del tipo. Configurar plan lleva al detalle
  exacto y editar mantiene objetivo vacio. Planes guardados existentes intactos.

## 2026-11-09 - Proxima Mantencion Por Fecha Exacta

- Se sustituye Cada dias por calendario de proxima mantencion, vacio y obligatorio.
- Inicio precargado hoy, aviso en dias; confirmacion muestra fecha sin unidad dias.
- Conversion compatible con intervalos existentes y validacion al avanzar/guardar.

## 2026-11-09 - Corregir Campos De Horometro GPS

- Mantenciones usa engineHours/horometroTotal, que son los campos emitidos por
  la plataforma, manteniendo aliases anteriores. Numeros decimales/cero reales.
- Reportes historicos usan la misma lectura explicita por update, sin fallback
  actual ni horas diarias. No se agregan datos de prueba al modulo.

## 2026-11-09 - Horometro Con Objetivo Absoluto Obligatorio

- Se sustituye Cada horas por Proxima mantencion a las (horas), vacio al crear.
- Comparte conversion de objetivo, validacion obligatoria y preservacion de
  objetivo al cambiar fecha con odometro. Aviso previo sigue independiente.

## 2026-11-09 - Objetivo De Kilometraje Obligatorio

- Campo Proxima mantencion con asterisco/required y aviso de dato obligatorio.
- Siguiente/Crear no permiten objetivo vacio o intervalo no positivo; tambien
  se protege el manejador y la validacion de guardado con mensaje especifico.

## 2026-11-09 - Corregir Significado De Umbral

- Confirmacion: Umbral restante = objetivo - lectura actual GPS, no inicio del
  aviso. Ejemplo 130000 - 125430 = faltan 4570 km, independientemente de aviso.
- Fecha/horometro equivalentes. Distingue vencimiento, exceso y lectura ausente.

## 2026-11-09 - Umbral De Aviso En Confirmacion

- Resumen muestra desde que kilometraje, hora o fecha se avisara, ademas de la
  anticipacion configurada. Ejemplo: objetivo 130000 y aviso 1000 -> 129000 km.
- Sin cambios de persistencia ni reglas de estado; calculo cubierto por pruebas.

## 2026-11-09 - Retirar Ejemplos Del Historico

- Eliminados controles, lecturas ficticias, generador de ejemplos y bloqueo de
  demostracion en crear/editar plan. Se mantienen fecha y lectura historica real.
- No hay datos de demostracion persistidos que migrar o eliminar del GPS.

## 2026-11-09 - Ordenar Configuracion Del Plan

- Se elimina nombre repetido bajo tipo seleccionado. Orden: criterio/fecha,
  lectura con hora, objetivo/aviso. Fecha ya no queda separada debajo.
- Notas opcionales y ejemplos temporales en desplegables secundarios; grilla
  estable de dos columnas, una en pantallas estrechas. Sin cambios de calculo.

## 2026-11-09 - Lectura Seleccionada En Banda Principal

- La banda azul cambia a lectura historica al elegir una fecha anterior y
  muestra la fecha/indicacion de demo. Ya no permanece el valor actual en
  primer plano mientras la referencia distinta aparece abajo. Se conserva hora.

## 2026-11-09 - Ejemplos Temporales De Lectura Historica

- Checkbox Lecturas de demostracion en selector de fecha. Reportes ficticios
  para ayer, hace 3 y 10 dias, tanto kilometraje como horometro; dia -5 sin dato.
- Guardado bloqueado durante demo. No modifica historial GPS ni almacenamiento;
  al desactivar restaura referencia anterior y cambios de contexto descartan demo.

## 2026-11-09 - Fecha De Inicio Y Lectura Historica Del Plan

- Se retira Actualizar y su carga simulada. Nuevo selector de fecha de inicio
  para planes numericos: hoy usa lectura actual; pasado consulta cache del
  activo y toma ultimo reporte explicito del dia de Chile, con fecha/hora visible.
- Guarda startDate/referenceReadingAt y conserva objetivo elegido. Ausencia
  historica no sustituye con lectura actual ni cero y deja referencia vacia.
- Reportes preservan lecturas explicitas de cada update, sin heredar la lectura
  actual como historica. No se inventan datos ni se agrega endpoint backend.

## 2026-11-09 - Proxima Mantencion Sin Valor Sugerido

- Campo de objetivo por odometro vacio al crear o cambiar a ese criterio.
  Sin sugerencia calculada desde plantilla; Actualizar conserva el vacio.
- Edicion mantiene el kilometraje guardado del plan existente.

## 2026-11-09 - Sustituir Cada Km Por Objetivo Absoluto

- Por solicitud del usuario, odometro muestra Proxima mantencion a los (km),
  GPS informativo y aviso. Se retira ultimo servicio editable en ese criterio.
- Resumen usa objetivo absoluto. Actualizar GPS conserva el kilometraje elegido,
  sin convertirlo de nuevo en una distancia adicional. Fecha/horometro sin cambios.

## 2026-11-09 - Indicador De Actualizacion De Lectura

- Actualizar muestra circulo y Actualizando, aria-busy y bloqueo de clics
  repetidos. Ancho estable y respeto de movimiento reducido.
- Sigue siendo copia local, sin consulta GPS simulada; descarta la accion si
  cambia el borrador, vehiculo o criterio antes de completarse.

## 2026-11-09 - Mostrar Criterio Sin Intervalo En Tipos

- La lista de nuevo plan conserva el criterio por tiempo, odometro u horometro
  debajo del nombre, sin mostrar Cada ni un intervalo fijo.

## 2026-11-09 - Tipos Sin Criterio Ni Intervalo En La Seleccion

- Nuevo plan muestra solo el nombre del tipo y Ya configurada si corresponde.
  Se retiran subtitulos Por tiempo/odometro/horometro y Cada de esta lista.
- Criterio, intervalo y aviso permanecen configurables en el segundo paso.
  No se altera el catalogo ni los planes existentes.

## 2026-11-09 - Bloquear Tipos Antes De Seleccionar Vehiculo

- Nuevo plan mantiene todos los tipos deshabilitados hasta elegir un vehiculo
  valido, sin seleccion visual ni mensaje enganoso Ya configurada.
- Se protege tambien el manejador de seleccion; tras elegir vehiculo se conserva
  la validacion de tipos ya configurados y el bloqueo de Siguiente.

## 2026-11-09 - Actualizar Lectura Desde El Formulario

- Boton Actualizar junto a lectura GPS, en crear/editar plan. Copia la lectura
  disponible al borrador del ultimo servicio, sin guardar ni simular refresco
  remoto. Deshabilitado cuando no existe lectura, admite cero real.

## 2026-11-09 - Precargar Referencia Desde GPS

- En nuevos planes, ultimo servicio precargado con odometro/horometro actual
  al seleccionar vehiculo, tipo o criterio; permite corregirlo sin boton extra.
- Sin lectura queda vacio; cero real se conserva. Planes existentes no se
  actualizan automaticamente con cada lectura, para no desplazar el vencimiento.

## 2026-11-09 - Separar GPS Y Referencia Del Ultimo Servicio

- Se reemplaza la propuesta anterior de objetivo absoluto: lectura actual del
  GPS informativa, ultimo servicio, intervalo y aviso anticipado configurables.
- Odometro/horometro ausentes no usan datos ficticios ni cero; se conserva el
  objetivo del ciclo y se muestra Sin lectura hasta recibir datos del activo.
- Nuevos planes no inventan una lectura del ultimo servicio. Se exige ingresarla.

## 2026-11-09 - Objetivo Absoluto De Kilometraje En Planes

- Configuracion por odometro muestra actual, proxima mantencion a los y aviso
  anticipado. Objetivo absoluto se traduce al intervalo existente, sin migrar
  planes anteriores ni alterar fecha/horometro. Resumen confirma objetivo.
- Lectura actual precargada, correccion manual conservada en actualReading.
- Al cambiar vehiculo/tipo no se reutiliza la plantilla del tipo anterior.

## 2026-11-09 - Bloqueo De Tipos Ya Configurados

- Nuevo plan no omite tipos existentes por planId/editMode residual. Solo la
  edicion puede excluir su propio plan. Al elegir vehiculo se selecciona un
  tipo disponible y los bloqueados no muestran estado seleccionado.

## 2026-11-09 - Creacion Rapida De OT

- Una vista con vehiculo y plan precargados, fecha de ejecucion, responsable y
  taller. Opcionales agrupados en Mas opciones cerrado inicialmente.
- Se conservan titulo editable, prioridad, limite/hora, descripcion,
  observaciones y presupuesto; sin pasos extra ni cambios al cierre/inicio.
- Se elimina la fecha fija de septiembre: inicio en el dia actual de Santiago
  y fecha limite opcional vacia. Se conserva validacion de duplicados.

## 2026-11-09 - Retirar Selector De Columnas En OT

- Se elimina el menu Columnas de Ordenes y su estado de visibilidad.
- Tabla fija con Prioridad siempre visible, tambien en detalle/planificacion. Se mantiene
  Ampliar tabla y no se modifica el selector de columnas de Flota.

## 2026-11-06 - Unificar Anchos De Modales De Mantenciones

- Decision final del usuario: todos a 900px, sin excepciones para detalles,
  catalogo, confirmaciones, exportacion o revision de referencias antiguas.
- Se conserva altura por contenido, limite del viewport y scroll interno;
  no se modifica el comportamiento de los formularios.

## 2026-11-06 - Presentacion Del Modal De Planificacion

- Tras revision del usuario se sustituye la cabecera azul por blanca compacta.
  Identidad de OT en una linea y grupos Fechas y Asignacion en filas de tres
  campos, sin separador vertical ni espacios amplios. Una columna en movil.
- Se conserva el guardado unificado y el estado operativo. Errores con estilo
  de alerta. Revision visual del componente real a 1440x900 y 500x844.

## 2026-11-06 - Unificar Edicion De Planificacion De OT

- Reprogramar + Editar asignacion se sustituyen por Editar planificacion en
  detalle. Formulario unico de inicio planificado, limite/hora, responsable,
  taller y prioridad. Sin selector de estado ni cambios de activo/plan.
- Se conserva ID interno reprogram-order. Guardado no devuelve trabajos en
  proceso/espera a Programada ni modifica inicio real o motivo de espera.
- Validacion de fechas y asignacion, auditoria de planificacion, regreso al
  detalle al guardar/cancelar. Costos, espera, inicio/reanudacion y cierre separados.

## 2026-11-06 - Redisenar Detalle De OT Y Corregir Datos Enganosos

- Gestion queda fuera de la cuadricula. Columnas normales en lugar de
  display:contents/filas fijas que generaban huecos. Ancho maximo 1080px,
  scroll de contenido, una columna en ventana estrecha y pie siempre accesible.
- Resumen sin prioridad/fecha duplicadas; lectura inicial solo cuando aplica.
  Se retira tabla vacia de comentarios y se muestran detalles reales en historial.
- Presupuesto estimado separado del total real registrado, sin usar real como
  supuesto estimado. Fecha calendario no se convierte a dia previo a las 21h.
- Historial no inserta pasos de espera inexistentes ni autores ficticios, no
  toma vencimiento como cierre y omite antiguas fechas objetivo de programacion
  tratadas como eventos. Nuevas programaciones guardan instante real y objetivo
  en detail. No se reescriben registros historicos.
- Validacion: 680 pruebas correctas, build correcto. Fixture aislado del modal
  real revisado en Edge a 1440x900 y ventana estrecha 500x844; sin datos persistidos.

## 2026-11-06 - Simplificar Accesos En Flota

- Vehiculo: unico Ver planes/Ocultar planes; se retira chevron duplicado y
  accesos contextuales a OT en el agregado. Acciones queda siempre visible.
- Plan: Crear OT, Ver OT o Renovar plan. Se unifica Continuar OT como Ver OT.
  Se elimina Ver detalle completo: nombre enlaza al plan exacto con validacion
  de pertenencia al vehiculo. Sin planes se conserva Agregar primer plan.
- Sustituye la apertura directa de OT en fila de vehiculo del punto 1 previo,
  a solicitud del usuario. No modifica contadores ni estados ni OT almacenadas.

## 2026-11-06 - Completar Paginacion De Ordenes

- Anterior/siguiente conectados, rango de filas, pagina/total y 10/25/50 filas.
  Toda la lista filtrada es accesible, incluidas Finalizadas y Canceladas.
- Filtros/pestana/tamano reinician pagina; altas vuelven al inicio. Reduccion del
  listado ajusta la pagina valida y evita paginas vacias residuales.
- Acceso a OT desde Flota ubica pagina exacta y espera resultados de filtros,
  sin forzar 50 filas. Se mantiene tabla ampliada y navegacion por estados.

## 2026-11-06 - Ordenes Abiertas Por Defecto

- Se reemplaza Todas por Abiertas al ingresar, limpiar filtros y crear OT.
  Programadas/en proceso/en espera permanecen en el listado operativo.
- Finalizadas y Canceladas tienen pestanas separadas. Enlace explicito a una OT
  terminal selecciona su pestana; no se oculta del acceso contextual.
- Cambiar busqueda no fuerza volver al inicio. Contador inferior corresponde
  a la pestana seleccionada. No se borran ni alteran OT historicas.

## 2026-11-06 - Reducir Informacion Redundante De Ordenes

- Patente sin repeticion de mantencion; columna Costo real sin desglose ni
  desviacion presupuestaria. Detalle conserva la informacion completa.
- Prioridad oculta inicialmente; checkbox en Columnas para mostrarla.
- Cuatro KPI operativos sin subtitulos repetidos. Promedio de cierre,
  cumplimiento y costo acumulado quedan en Analisis, filtrados por fecha de
  cierre de OT finalizadas en periodo, sin incluir canceladas ni cierres futuros.

## 2026-11-06 - Simplificar Opciones Por Fila De OT

- Se retira menu de tres puntos y su logica/listeners/estilos de la tabla. Solo
  Ver OT y siguiente accion por estado; terminales solo Ver OT.
- Gestion en detalle: Reprogramar, Editar asignacion y Poner en espera en proceso.
  Agregar costos junto a Costos; Cancelar OT en pie, solo para OT abiertas.
- Guardar/cancelar gestion vuelve al detalle de la misma OT. Se oculta detalle
  de cierre en trabajos aun abiertos. No se eliminan operaciones ni datos.

## 2026-11-06 - Confirmacion Breve De Inicio De Trabajo

- Iniciar/Reanudar trabajo: modal compacto con pregunta por OT y contexto del
  vehiculo, mantencion, responsable y taller. Sin campos editables de asignacion,
  prioridad ni estado. Cancelar y confirmar conservan sus comportamientos.
- Editar asignacion, espera con motivo y cierre conservan formularios completos.
- Feedback de iniciada/reanudada/en espera y auditoria Trabajo reanudado al retomar.

## 2026-11-06 - Acciones De OT Segun El Siguiente Paso

- Se elimina selector de estado por fila. Programada -> Iniciar trabajo;
  en proceso -> Cerrar OT; en espera -> Reanudar trabajo. Ver OT se mantiene.
- Menu secundario conserva costos/cancelacion y agrega Reprogramar, Editar
  asignacion y Poner en espera (solo en proceso). Se despliega hacia arriba si
  falta espacio inferior en la tabla.
- Modales de transicion usan titulo/boton de la accion y estado de solo lectura.
  Cancelar no cambia la OT; esperar mantiene motivo obligatorio. Sin cierre ni
  renovacion automatica; edicion general de asignacion permanece disponible.

## 2026-11-06 - Alinear Revision De OT Con Modales Existentes

- Referencias revisadas: CompanyEditorModal (Empresas) y MaintenanceFleetExportModal.
  Cabecera clara con icono azul, titulo destacado, texto secundario y pie con
  Entendido naranja. Tabla interior con espaciado y bordes del sistema.
- Se quita la columna redundante Sin verificar y se conserva un estado unico
  Identidad pendiente. Una explicacion del problema, sin notas repetidas.
- Se mantienen lectura exclusiva, cierre, foco, tabla acotada y pagina sin crecer.

## 2026-11-06 - Aviso Visible Con Revision Sin Estirar Pagina

- Boton N OT por revisar, en la misma fila. Revision pasa de seccion desplegable
  a modal acotado con explicacion, datos conservados y scroll interno. Sin cambios
  a registros. Escape/fondo/cierre, foco contenido y restauracion al boton.

## 2026-11-06 - Compactar Aviso De Referencias Antiguas

- Se sustituye la fila completa por icono+cantidad junto a Nueva OT. Tooltip
  conserva contexto y el boton abre la revision existente sin ocupar otra franja.

## 2026-11-06 - Ampliar Tabla De Ordenes

- Boton Ampliar tabla junto a las pestanas de estado. Tabla a viewport completo
  sin KPI/filtros, con paginacion/acciones originales y estado conservado.
- Salida por boton o Escape; conserva scroll y foco. Se limpia al desactivar
  la vista y respeta Escape dentro de modales de OT. Sin permisos de navegador.

## 2026-11-06 - Completar Los Cinco Puntos De Claridad En Flota

- Punto 1 de apertura directa de OT ya aplicado, se conserva.
- Punto 2: se reemplaza requiere atencion por pendientes sin OT, con OT abierta,
  por renovar y por configurar. Los trabajos con OT abierta no suman sin OT.
- Punto 3: Estado del plan y Mantencion prioritaria en tabla/menu de columnas.
- Punto 4: titulo Planes por vehiculo.
- Punto 5: advertencia retirada de Flota; en Ordenes, Revisar registros despliega
  referencias antiguas agrupadas y categorias conservadas, en solo lectura.
  Sin asignar identidad ni exponer payload de registros no verificados; empresa
  explicita ajena excluida. No se borran ni migran datos durante la consulta.
- Sustituye ubicacion previa de la advertencia junto al contador de Flota.

## 2026-11-06 - Punto 1: Accion De OT Coincide Con Su Texto

- Una OT abierta sin decisiones pendientes se abre directamente desde la fila.
  Varias OT distintas: Ver N OT despliega los planes para elegir. Se deduplican
  IDs y se conserva prioridad de pendientes/renovaciones sin elegir por el usuario.
- Con planes desplegados la accion directa sigue abriendo la OT, no se convierte
  en Ocultar planes. Se conserva el chevron independiente para plegar/desplegar.
- Solo punto 1 de la nueva lista; puntos 2-5 no se modifican en esta entrega.

## 2026-11-06 - Orden De Pestanas De Mantenciones

- Flota -> Ordenes -> Conductores -> Analisis. Sin cambios de rutas ni acciones.

## 2026-11-06 - Resaltar Etiquetas Del Punto 2

**REVERTIDO por nutella:** se retira solo el amarillo temporal. Se conservan
las etiquetas especificas del punto 2 y los demas cambios anteriores.

- Amarillo temporal solo en la etiqueta de ultima fecha/kilometraje/horometro,
  en configuracion, edicion y confirmacion. Sin cambios funcionales.

## 2026-11-06 - Quitar Amarillo Y Aclarar Ultima Lectura

- Se retira el resaltado temporal de tipo/nombre y su CSS exclusivo.
- Punto 2: Ultima vez se sustituye por kilometraje, horometro o fecha de la
  ultima mantencion segun criterio. Misma etiqueta en configuracion, edicion y
  confirmacion; no cambia el valor, calculo ni persistencia del plan.

## 2026-11-06 - Nombre Automatico Del Plan

- Nombre del plan pasa a solo lectura. La seleccion de tipo ya sincroniza su
  nombre automaticamente; se conserva ese flujo sin renombrar planes historicos
  ni bloquear la edicion del catalogo. Se mantiene el resaltado temporal amarillo.

## 2026-11-06 - Resaltado Temporal De Tipo Y Nombre

- Etiquetas modificadas en configuracion/confirmacion marcadas en amarillo
  para revision del usuario. Sin cambios funcionales.

## 2026-11-06 - Distinguir Tipo Y Nombre Del Plan

- Punto 1 de claridad: el tipo seleccionado no cambia visualmente al editar el
  nombre. Se etiqueta Nombre del plan y se muestran ambos en confirmacion.
- No se modifica el catalogo ni las reglas de duplicados; sin tocar puntos 2-6.

## 2026-11-06 - Centrado Del Descarte De Advertencia

- Se corrige la cascada que aplicaba padding de botones de texto al descarte.
  Boton de 28px con icono de 16px centrado, sin cambios en su comportamiento.

## 2026-11-06 - Quitar Contador De Vehiculos En Flota

- Se elimina el contador de la barra superior por solicitud del usuario.
  Se mantienen la advertencia y las acciones Exportar/Tipos/Nuevo plan.

## 2026-11-06 - Advertencia Junto Al Contador De Flota

- Se mueve el aviso de OT antiguas sin identidad a la barra del contador de
  vehiculos, manteniendo texto completo, icono y descarte. Sin franja duplicada
  debajo en Flota. Se adapta con salto de linea si falta ancho; otros mensajes
  de operaciones conservan su presentacion global.

## 2026-11-05 - Correccion De Vehiculo Oculto En Nuevo Plan

- Alta global inicia con vehicleId vacio; alta desde detalle conserva el vehiculo
  de la fila y lo muestra. Selector visible en paso 1, obligatorio para avanzar.
- Ya configurada se calcula solo para el ID explicito del borrador. Sincronizar
  tipo/vehiculo o guardar ya no selecciona silenciosamente otro activo.
- Se mantiene la reversion del experimento simplificado; este es un arreglo
  puntual de identidad/seleccion, sin preview ni resaltado ni nuevos pasos.

## 2026-11-05 - Prueba De Nuevo Plan Simplificado

**REVERTIDO por solicitud nutella.** Se restaura el formulario, confirmacion,
validacion y retorno anteriores a esta prueba. Se eliminan preview, selector
agregado, resaltado/enfoque de plan y sus tests/helpers exclusivos. Se mantienen
los puntos 1-5 y la correccion del boton Siguiente. La descripcion siguiente
es historica y no representa el estado actual.

- Se mantienen tres pasos para comparar con la version previa. Selector de
  vehiculo visible, etiquetas de ultima fecha/lectura especificas y opcion de
  lectura manual oculta en calendario. Taller/responsable/costos siguen en OT.
- Configuracion previsualiza proximo vencimiento con el mismo calculo del plan
  guardado. Confirmacion prioriza vehiculo, frecuencia y proximo vencimiento.
- Validacion compartida antes de avanzar y guardar: campos obligatorios,
  frecuencia positiva, aviso dentro del intervalo, lectura cero valida y fecha
  calendario real. No se modifican ciclos ni se crean OT automaticamente.
- Tras alta se limpia filtrado de Flota para revelar el vehiculo en su pagina,
  desplegar sus planes y resaltar/enfocar el creado. Ver plan creado repite ese
  acceso. Se sustituye el retorno a detalle tras alta; edicion no cambia.
- Comparacion: antes se guardaba y habia que ubicar el resultado; ahora se
  anticipa el vencimiento y se muestra directamente el plan creado.
- Validacion: 659 pruebas correctas, build correcto y ESLint sin errores en
  archivos revisados. Sin comprobacion visual automatizada en navegador.

## 2026-11-05 - Mantenciones: Pasos 3, 4 Y 5

- Paso 3: resultado global visible tambien en Flota, descartable y sin timeout.
  Crear OT permite Ver OT creada; cerrar ofrece Revisar renovacion cuando queda
  ciclo pendiente; renovar ofrece Ver planes del vehiculo. Destinos concretos,
  sin ejecutar automaticamente otra operacion. Se limpian al cambiar empresa.
- Paso 4: Ordenes conserva Nueva OT y Planes sin OT, sin repetir Nuevo plan ni
  Tipos de mantencion (disponibles en Flota); el conteo corresponde a ordenes.
- Paso 5: Flota evita vencimiento repetido y cero pendientes, corrige singular
  de planes/atencion. OT abierta no aparece verde como cerrada ni presenta su
  fecha limite como fecha de cierre. Avisos neutrales, no todos como exitos.
- Se autorizan estos pasos ahora; no se restaura en bloque el experimento de
  claridad revertido anteriormente ni se renombran estados de renovacion.
- Validacion: 656 pruebas correctas, build correcto y ESLint sin errores en
  archivos modificados. Sin comprobacion visual automatizada en navegador.

## 2026-11-05 - Punto 2: Contexto Entre Plan Y OT

- Ver/Continuar OT desde Flota abre directamente el detalle de la OT vinculada.
- Volver al plan en Flota desde modal o cabecera de Ordenes conserva filtros,
  pagina, vehiculo desplegado y scroll, sin seleccionar otro plan ni crear OT.
- Se reutilizan los datos de activo y mantencion del detalle existente.
- Si Crear OT recibe un plan con OT abierta se muestra esa orden; se conserva
  tambien el bloqueo de duplicados al guardar. Sin cambios a cierre/renovacion.
- El contexto se limpia al cambiar de empresa y solo admite OT del scope actual.
- Validacion: 653 pruebas correctas, build correcto y ESLint sin errores en los
  archivos modificados. Sin validacion visual automatizada en navegador en este punto.

Registro historico: incluye experimentos, cambios reemplazados y reversiones.
Para estado actual y pendientes, comenzar por el [indice](README.md).

## 2026-11-05 - Alineacion De Siguiente En Nuevo Plan

- Se centra el texto y la flecha del boton mediante inline-flex, sin alineacion
  por linea base. Icono fijo de 16px y separacion de 8px; sin cambios al wizard.

## 2026-11-05 - Punto 1: Acciones Contextuales En Flota

- Se implementa solo el punto 1 solicitado: cada fila indica la siguiente
  gestion disponible en lugar de mostrar Revisar planes para todos los casos.
- Sin planes: Configurar mantencion abre el formulario para ese vehiculo.
  Planes con decisiones pendientes: Revisar N pendientes, Revisar renovacion
  o Revisar configuracion. Con OT abiertas: distingue programada/en curso/en
  espera, o Ver OT abiertas si se mezclan estados. Al dia: Ver planes.
- Todos los casos con planes despliegan el listado existente para elegir;
  no selecciona un plan implicitamente ni crea/renueva/cierra OT al pulsar la fila.
  Volver a pulsar oculta los planes. Se mantienen acciones existentes por plan.
- Pendientes del boton no incluyen planes proximos/vencidos con OT ya abierta;
  el contador existente requieren atencion sigue describiendo el estado del plan.
- Ancho estable de acciones y espacio independiente para icono/texto. Se conserva
  el arreglo anterior de filtros y no se reintroduce el experimento revertido de
  etiquetas/avisos/ciclo, ni se implementa el punto 2 de la propuesta.
- Archivos: MaintenanceFleetTab.vue, fleetVehicleAction.js, sus pruebas y README.
- Validacion: siete regresiones nuevas; 648 pruebas aprobadas, build correcto y
  ESLint sin errores (20 avisos existentes en FleetTab). Fixture temporal sin
  persistencia en Edge headless comprueba etiquetas, abrir/cerrar planes,
  configurar vehiculo correcto y ausencia de creacion automatica de OT.

## 2026-11-05 - Claridad De Plan, Trabajo Y Proximo Ciclo

**Revertido por solicitud del usuario (nutella).** Se restauraron etiquetas,
avisos, fechas, formularios y acciones anteriores a esta pasada. Se retiraron
helpers y pruebas exclusivos del cambio. Se conserva el arreglo previo del
panel de filtros de Flota y las correcciones anteriores de identidad/persistencia.

- Primera pasada de comprension en Mantenciones, sin agregar tutorial general
  ni alterar reglas de calculo, IDs o estados persistidos. Ordenes de trabajo y
  Planes sin OT distinguen ejecuciones de planes que aun no tienen una orden.
- Sin renovar pasa a Ciclo pendiente. Revisar proximo ciclo abre propuesta;
  Confirmar proximo ciclo la aplica; Mas tarde conserva el pendiente. Mensajes
  distinguen plan sin OT, trabajo finalizado y vencimiento confirmado.
- Avisos fuera del header condicional, visibles tambien en Flota y sin timeout;
  ocultarlos no altera registros. Destino de proximo ciclo se limpia al confirmar,
  emitir otro resultado mediante helper o fallar el guardado.
- Lista separa Finalizadas y Canceladas; selector conserva estado real al abrir
  el formulario, sin simular que ya se confirmo un cambio.
- Detalle usa Inicio planificado en OT abiertas y fecha real solo en terminales;
  fecha limite nunca reemplaza un cierre faltante. Fechas calendario conservan
  su dia sin desplazamiento UTC. Detalle de cierre no aparece en OT abiertas.
- Cierre retira el campo nextCycle editable ignorado que prometia generacion
  automatica. Muestra intervalo de solo lectura y ciclo pendiente de confirmacion.
- Archivos: MaintenanceView.vue, MaintenanceActionModal.vue, MaintenanceFleetTab.vue,
  MaintenanceWorkOrdersTab.vue, useMaintenanceModule.js, utils/config de mantenciones,
  sus pruebas y README de vistas/componentes/composables/utils.
- Validacion: seis regresiones nuevas (incluye recorrido crear plan/OT/finalizar/
  posponer/confirmar), 647 pruebas aprobadas y build correcto. ESLint de archivos
  revisados sin errores, con 211 avisos mayormente de formato existente. Dialogo
  revisado con fixture temporal en Edge headless de escritorio y ventana estrecha;
  no equivale a prueba completa de usuarios/permisos ni conexion de backend.

## 2026-11-05 - Prueba De Revision Por Seleccion De OT

**Revertido por solicitud del usuario (nutella).** Se retiraron seleccion,
bandeja, estilos y pruebas exclusivos del experimento. Listado de OT y README
restaurados; se conserva el arreglo anterior de filtros de Flota y los datos.

- Experimento solicitado: marcar OT y abrir Revisar seleccion. Bandeja con
  listado seleccionado y detalle lateral, anterior/siguiente y regreso a tabla.
- Solo lectura: trabajos, costos, observaciones y documentos existentes.
  Mantiene Ver OT y sus acciones; no agrega aprobaciones ni cambios de datos.
- Tabla se oculta sin desmontarse, conservando scroll/filtros. Seleccion por ID
  contra resultado vigente; al retirar acceso/filtrar se eliminan IDs ausentes.
- Escritorio usa altura disponible y scroll interno; vista estrecha permite
  alternar listado/detalle. Descargas pendientes no se completan si cambia la OT
  o se desmonta/desactiva la bandeja.
- Archivos: MaintenanceWorkOrdersTab.vue, MaintenanceOrderReview.vue,
  useWorkOrderReview.js, sus pruebas y README de componentes de mantenciones.
- Cinco regresiones nuevas y comprobacion visual/interactiva en Edge headless
  con fixture temporal, no datos agregados al modulo ni ensayo de permisos E2E.
  Suite completa: 646 pruebas aprobadas; build correcto. Nuevos componentes y
  logica sin errores ESLint; tabla conserva 23 avisos de formato anteriores.

## 2026-11-05 - Filtros De Flota Sin Recorte Inferior

- Panel lateral de Mantenciones/Flota con cabecera separada y cuerpo acotado
  desplazable; los filtros de fecha siguen accesibles en ventanas bajas.
- Se reducen separaciones verticales sin retirar controles ni cambiar filtros.
- Regresion de contrato CSS y compilacion Vue; no valida dimensiones en navegador.

## 2026-11-05 - Prueba De Exportacion A Calendario En OT

**Revertido por solicitud del usuario (nutella).** Se retiraron boton, mensajes,
estilos, generador y pruebas exclusivos del experimento. README restaurados;
sin cambios en datos de OT ni funcionalidades previas.

- Icono Anadir al calendario junto a Ver OT, solo para OT abiertas con fecha
  limite valida. Descarga .ics sin modificar la orden ni conectar cuentas.
- La fecha existente es un limite, no una cita: se exporta como dia completo,
  sin inventar horas, duracion ni reservas. Incluye activo, OT, trabajo, taller
  y responsable; mensaje y descripcion advierten que no se sincroniza.
- Generador nativo acotado a RFC 5545, sin dependencias nuevas. Fechas estrictas,
  escape de texto, CRLF y plegado UTF-8; UID nuevo por descarga (importar mas de
  una vez puede duplicar eventos). Sin recordatorio obligatorio.
- Cuatro pruebas automatizadas de formato, fechas/estados, escape y descarga.
  Suite completa: 644 pruebas aprobadas; build correcto; ESLint sin errores
  (23 avisos de formato preexistentes en el componente de OT).
  No se verifico importacion real en Outlook/Google Calendar ni aspecto visual.

## 2026-11-05 - Cola De Direcciones Acotada Y Cancelable

- Noveno hallazgo: red/JSON tienen timeout de 10 segundos; la cola se libera
  aunque fetch ignore abort. No se cachean resultados tardios cancelados.
- Suscripciones compartidas por coordenada: cancelar una no corta las demas;
  al cancelar la ultima se aborta transporte. Se mantiene intervalo de 1100 ms.
- Resolucion de lote tiene presupuesto de 20 segundos con respaldo de coordenadas
  para todas las filas pendientes. Itinerarios propaga signal/timeoutMs; el plazo
  acota geocodificacion, no construccion de PDF/Excel ni llamadas de mapas.
- Filas visibles cancelan al desmontar/desactivar y limpian pendientes/listeners.
  README de servicios/composables actualizados y siete regresiones nuevas.
- Validacion: 640 pruebas aprobadas, ESLint limpio en archivos tocados y build
  correcto. Sin red externa ni pruebas visuales. Los nueve hallazgos originales
  tienen correccion registrada; esto no certifica ausencia de otros errores.

## 2026-11-05 - Identidad Estable De Sin Reportar

- Octavo hallazgo: companyId/IMEI identifica registros, deduplicacion y alcance.
  Renombrar empresa mantiene notas, consultas e interrupciones. Homonimos no se
  mezclan. Imagen/contacto/modal e historial archivado resuelven por ID.
- Migracion verifica empresa, conserva originales con marcador y guarda destino
  y respaldo juntos. Datos ambiguos o con destino existente no se combinan;
  fallo conserva memoria/almacenamiento y permite reintentar. Aviso en la vista.
- Pruebas de identidad, permisos, renombrado, migracion, archivo y recarga real
  del adaptador local; contratos de la vista ajustados a IDs. README actualizados.
- Validacion: 633 pruebas aprobadas, build correcto y ESLint sin errores
  (45 advertencias en archivos revisados). Sin E2E visual de navegador.

## 2026-11-05 - Guardados Comprobados En Cuatro Areas

- Septimo hallazgo: Geocercas/grupos, vistas guardadas, plantillas y reglas de
  Reportes solo publican despues de confirmar escritura; fallo devuelve resultado
  negativo y error visible, sin auditoria de exito ni cierre del borrador.
- Mapa espera confirmacion antes de terminar dibujo/edicion o retirar una capa.
  WorkspaceSelector conserva nombre/usuarios compartidos hasta confirmar; el
  header guarda esas dos opciones juntas. Reportes y Fleet conservan el modal.
- Claves relacionadas usan rollback de mejor esfuerzo; no equivale a transaccion
  de servidor ni garantiza recuperacion ante cierre durante una escritura.
- Pruebas cruzadas en services/storage/confirmedFeatureWrites.test.js cubren
  errores, reintentos, segunda clave fallida, formularios y eliminaciones al recargar.
- README de carpetas afectadas actualizados; no se modifican los hallazgos 8 y 9.
- Validacion: 624 pruebas aprobadas, ESLint limpio en los archivos de codigo
  modificados y build correcto. Sin comprobacion visual/E2E de navegador.

## 2026-11-04 - Alcance Y Permisos De Rutas Esperadas

- Quinto hallazgo: catalogo por empresa, sesion y activos autorizados. Guardado
  exige itineraries/edit, preserva rutas ocultas y rechaza IDs fuera del alcance.
- Comparador recibe solo rutas autorizadas. Cambiar contexto invalida editor;
  fallo de guardado conserva borrador sin cerrar. README de tres carpetas actualizados.
- Legacy sin empresa explicita queda intacto en v1, sin atribuirlo arbitrariamente.
- La misma sustitucion del catalogo corrige el sexto hallazgo: borrar todas las
  rutas mantiene un array vacio, sin reconstruir ejemplos al guardar o recargar.
- El configurador permite eliminar la ultima ruta y guardar vacio. Validacion:
  617 pruebas aprobadas, ESLint limpio en archivos tocados y build correcto.
  Sin recorridos E2E en navegador ni autorizacion de servidor.

## 2026-11-04 - Conflictos Entre Ventanas En Mantenciones

- Cuarto hallazgo: maintenanceStateStorage compara base local, cambio y ultima
  version. Combina registros independientes de listas/mapas y rechaza conflictos
  antes de escribir cualquier seccion. Fallar no avanza la referencia local.
- Lecturas auxiliares no alteran esa referencia; migracion parcial conserva las
  secciones antiguas no modificadas. Modulo distingue conflicto en su aviso.
- Pruebas reproducen dos ventanas, cambios sucesivos, altas/bajas, conflicto,
  limpieza, reintento y migracion. README de servicios/composables actualizados.
- Validacion: 18 pruebas dirigidas y 609 de la suite completa aprobadas;
  ESLint limpio en archivos modificados y build correcto. Sin E2E de navegador.

## 2026-11-04 - Escritura Confirmada De Alertas Operativas

- Tercer hallazgo: servicio de alertas solo publica tras confirmar persistencia;
  fallo devuelve null y expone error recuperable. Atencion/reapertura masiva
  guarda el lote en una escritura, sin cambios parciales dentro de esa operacion.
- Bandeja conserva accion, nota y seleccion al fallar; auditoria y mensaje de
  exito solo despues de guardar. Fleet tambien muestra error de persistencia.
- README de servicio, componentes y vistas actualizados; pruebas de fallo,
  reintento y consumidores en useAlarmsService.test.js.
- Validacion: 604 pruebas aprobadas, build correcto y ESLint en archivos tocados
  sin errores (9 advertencias). No se ejecutaron pruebas visuales en navegador.

## 2026-11-04 - Nombres De Tooltips Como Texto

- Segundo hallazgo: geocercas y paradas entregan un nodo con textContent a
  Leaflet. Nombres editados/importados no se interpretan como HTML; se conserva
  el texto guardado y las opciones visuales de los tooltips.
- Helper y pruebas en composables/activos/map; consumidores de geocercas/rutas
  y README actualizados. Sin cambios al motor de mapas ni al almacenamiento.
- Validacion: suite completa de 601 pruebas aprobadas y ESLint limpio en los
  cuatro archivos de codigo modificados. Sin comprobacion visual en navegador.

## 2026-11-04 - Aislamiento De Historial De Telemetria

- Corregido el primer hallazgo de la auditoria: el ID estable no se sustituye
  por una patente/dispositivo compartido; alias tipados y alcance por
  empresa/aplicacion, sin placeholders ni resolucion de alias ambiguos.
- Consultar y borrar historial usan el mismo criterio conservador. Se conserva
  la asociacion legitima entre dispositivo e ID del activo en los pulsos de flota.
- Archivos: `useTelemetryHistory.js`, pruebas dedicadas y README de fleet.
- Validacion: nueve pruebas dirigidas y suite completa de 599 pruebas aprobadas;
  build correcto y ESLint sin observaciones en los dos archivos de codigo
  modificados. La auditoria conserva la evidencia del estado revisado.

## 2026-11-04 - Auditoria Integral Del Frontend

- Barrido estatico de 563 archivos y revision manual por areas, sin cambios funcionales.
- Nueve hallazgos priorizados: identidad de telemetria, HTML en tooltips,
  persistencia de alertas y otros modulos, concurrencia de Mantenciones,
  alcance/vaciado de rutas, identidad de Sin Reportar y cola de direcciones.
- Validacion: 595 pruebas aprobadas, build correcto, lint sin errores con 547
  advertencias; formato pendiente en 102 archivos. Sin pruebas E2E de navegador.
- Detalle, evidencia y limites: [auditoria integral](modulos/auditoria-integral-frontend-2026-11-04.md).

## 2026-11-04 - Correccion De Ocho Hallazgos De Flujo

- Usuarios: protegida la edicion de cuentas administradoras por operadores y
  validada la aplicacion/empresa destino de cada cambio de acceso o alta.
- Mantenciones: IDs de OT derivadas estables por empresa/vehiculo, migracion
  conservadora de IDs antiguos y recalculo de planes con lecturas actuales.
- Base compartida y Soporte: combinacion por registro de cambios independientes
  entre ventanas; conflictos rechazados sin reemplazar datos guardados.
- Itinerarios conserva fecha del reporte GPS. Soporte conserva respuestas y
  adjuntos pendientes por solicitud. Avanzado permite reintentar fallos de
  escritura sin descartar el borrador ni retirar controles de version.
- Actualizados README afectados y pruebas de regresion. Suite: 595 pruebas
  correctas; build correcto; lint sin errores, con 547 advertencias anteriores.
- Limites: no hay validacion manual integral en navegador ni transacciones
  multiusuario de servidor. Datos antiguos ambiguos se conservan sin reasignar.

## 2026-11-04 - Resumen Consolidado Para Traspaso Frontend

- Ampliado `CAMBIOS_PENDIENTES.md` a una entrega por modulo, incluyendo
  Configuracion, Operacion, Administracion, Conductores y mejoras compartidas.
- Separados resultados finales, puntos de entrada, adaptaciones necesarias,
  exclusiones, paquetes propuestos y criterios de aceptacion.
- Conservado el inventario original como captura historica, no como diff
  actualizado contra produccion. Sin nuevas afirmaciones de validacion funcional.
- Revision documental y de enlaces; sin cambios al codigo de la aplicacion.

## 2026-11-04 - Organizacion De La Bitacora


- Separadas referencias visuales y entregas en carpetas identificables.
- Agregado indice por modulo con enlaces a los README del codigo vigente.
- Conservados historial e inventario; entrega de Mantenciones identificada
  como historica al 2026-10-13, anterior a Conductores.
- Sin cambios funcionales ni perdida de antecedentes. Revisados enlaces locales.

## 2026-11-04 - Sincronizacion De README Por Carpeta

- Actualizados los README de Configuracion y las carpetas compartidas afectadas:
  navegacion, alertas, etiquetas, auditoria, reportes, mantenciones e iconos.
- Creado `frontend/src/components/configuration/README.md` para el editor de
  Variables, sesiones, pruebas, compatibilidad y limites de integracion.
- Corregidas descripciones antiguas sobre rutas vacias, autoguardado, reglas
  eliminadas, KPI retirados y pantallas reemplazadas. Separado funcionamiento
  local de ejecucion pendiente del backend; sin cambios funcionales.
- Revisados enlaces locales, cobertura por carpeta y formato del diff.

## 2026-11-04 - Seleccion De Casos Para Produccion

- Resumidos cambios por casos y prioridad dentro de `bitacora/CAMBIOS_PENDIENTES.md`, junto al inventario original.
- Separadas mejoras de interfaz, correcciones de flujo, integraciones necesarias y datos/experimentos excluidos.
- Sin despliegue, cambios funcionales ni borrado de datos del emulador.

## 2026-11-04 - Foco Unico En Busqueda De Variables

- Eliminados los contornos superpuestos de input y contenedor; foco indicado por un solo borde azul corporativo, sin alterar dimensiones.
- Resto de controles conserva su indicador de foco.

## 2026-11-04 - Velocimetro Simple Para Limites

- Reemplazada regla horizontal por velocimetro de contorno con una aguja y sin marcas menores; sin cambios de otros iconos o navegacion.

## 2026-11-04 - Regla Horizontal Para Limites

- Sustituida escala con barras por una regla horizontal de contorno con cuatro marcas; mismo nombre, tamano y color de navegacion.

## 2026-11-04 - Icono De Escala Para Limites

- Sustituido velocimetro de navegacion por escala con marcas y tope, compartida por menu compacto y desplegado.
- Sin cambios de otros iconos, rutas o comportamiento.

## 2026-11-03 - Iconos De Navegacion De Configuracion

- Limites identificado con velocimetro; Etiquetas, Alertas y Avanzado con iconos de contorno; Variables con simbolo de codigo.
- Mapeo compartido para menu compacto y desplegado; sin cambios en iconos de Operacion o Administracion, rutas o permisos.

## 2026-11-03 - Cabeceras Y Controles De Mantenciones

- Acciones de Flota y Analisis separadas de las pestanas en barra contextual; cabeceras con alineacion y espaciado compartidos.
- Acciones y filtros de 38 px, texto secundario de 11-12 px con menor peso; conservados naranja de creacion y azul de exportacion.
- Sin cambios de pestañas, datos, permisos o handlers de acciones.

## 2026-11-03 - Variables Alineadas Sin Reducir Consola

- Conservada la distribucion de altura completa de consola, cuatro KPI y pendientes.
- Cabeceras de portada/editor unificadas y retirado el marco interno redundante; resumen alineado con cabecera de variable.
- Solo presentacion; respaldo previo en frontend/node_modules/.cache/variables-check/ConfigurationVariablesView.before-alignment.vue.

## 2026-11-03 - Nutella: Reversion De Portada Compacta De Variables

- Revertida exclusivamente la prueba visual anterior de Variables al respaldo previo; sin revertir correcciones funcionales ni cambios en otros modulos.

## 2026-11-03 - Portada Compacta De Variables (Prueba Visual Reversible)

- Consolas de altura natural con maximo de 360 px, sin estiramiento por pantalla ni minimo artificial en movil.
- Cabeceras de portada/editor a escala de gestion; cuatro KPI y pendientes conservados con lista de altura limitada.
- Solo estilos de ConfigurationVariablesView.vue; copia previa en frontend/node_modules/.cache/variables-check/ConfigurationVariablesView.before-compact.vue para revertir exclusivamente esta prueba.

## 2026-11-03 - Etiquetas Con Presentacion Integrada

- Barra superior blanca unificada y detalle continuo con divisores, sin marcos anidados en cabecera, asignaciones y tabla.
- Busquedas existentes conservadas e identificadas por alcance, con tooltips; tipografia y filas compactas.
- Sin cambios de filtros, asignaciones, permisos, edicion o eliminacion.

## 2026-11-03 - Escala Visual Del Bus En Limites

- Compensado el espacio interno de la imagen del bus con escala visual de 1.4 en lista y cabecera, sin modificar dimensiones de filas ni otros tipos.

## 2026-11-03 - Escala Compacta De Limites

- Detalle blanco con divisores en lugar de marcos anidados, titulo de 20 px y entrada de 38 px con ancho limitado.
- Imagen de tipo, vista previa, valores guardado/original y explicaciones conservados con jerarquia mas compacta.
- Sin modificaciones de calculos, permisos, guardado, restablecimiento o descarte.

## 2026-11-03 - Lista Compacta De Alertas De Configuracion

- Reglas integradas en listado blanco con divisores y paginacion conectada, sin tarjetas separadas ni estiramiento por altura.
- Condicion no repetida si ya es la descripcion; canales y resumen con etiquetas discretas, conservando avisos de proveedores no conectados.
- Sin cambios de filtros, permisos, activacion, edicion o persistencia.

## 2026-11-03 - Ajustes Avanzados Con Densidad De Gestion

- Cabecera y texto introductorio compactos, controles de 36-38 px y titulos al nivel de Operacion/Administracion.
- Parametros en una herramienta blanca con divisores finos, sin tarjetas azules ni filas estiradas para llenar altura.
- Se conservan controles, validacion, confirmacion, permisos y auditoria.

## 2026-11-03 - Referencia Visual De Operacion Y Administracion

- Revisadas vistas principales y componentes representativos de listas, filtros, resumenes, formularios y detalles.
- Documentados colores, escala, formas, presentacion de datos y diferencias por modulo en `bitacora/referencias/diseno-operacion-administracion.md`.
- Referencia persistente para futuros cambios; sin modificaciones de interfaz o comportamiento.

## 2026-11-03 - Diseno De Ajustes Avanzados Segun Referencia

- Cabecera introductoria de parametros, estado global de valores de fabrica y cuatro filas suaves con campos alineados.
- Retirados iconos y etiquetas visibles por fila; se conservan estados accesibles, comparaciones, validaciones, restablecimiento y confirmacion de guardado.
- Ajuste responsive sin modificar cabecera global ni logica de configuracion o auditoria.

## 2026-11-03 - Compatibilidad Con Ficha Y Contexto Entre Pasos

- Compatibilidad exige las senales y campos de ficha referenciados; vacios no cuentan, cero y false se conservan.
- Pasos Probar y A que vehiculos conservan instancias durante la edicion mediante KeepAlive: filtros, modelo y pagina no se reinician al navegar.
- Cada nueva sesion del editor sigue comenzando sin contexto anterior.

## 2026-11-03 - Historial Exclusivo De Versiones Del Script

- Nuevas versiones solo ante cambios exactos de codigo; metadata y asignaciones actualizan configuracion sin duplicar script.
- Conservados autor y fecha de cada version, numeracion continua, limite de cien e historial previo sin deduplicacion destructiva.
- Modal identificado como Historial del script; portada separa version actual de ultimo cambio de configuracion.

## 2026-11-03 - Estados Reales De Pendientes De Prueba

- Registro independiente de ultima respuesta del motor por variable con codigo exacto, clave, resultado, equipo y fecha.
- Pendientes derivados: nunca probado, modificado y prueba con error; prueba vigente sale de lista.
- Editor, badge del paso y guardado comparten estado; cambios cosmeticos no invalidan prueba, codigo/clave si.
- Lectura corrupta visible, proteccion de conflictos y persistencia comprobada; abrir Probar nunca registra exito.
- Sin endpoint ni resultados simulados: motor sigue desconectado y guardar bloqueado; preparada frontera para recibir respuesta real.

## 2026-11-03 - Coherencia De Nombre Interno Y Salida Del Script

- Deteccion de asignaciones out literales con el mismo analizador de referencias; comentarios, textos y comparaciones no cuentan como salidas.
- Advertencia cuando ninguna salida coincide con nombre interno; accion explicita de renombrar solo para una salida fija sin accesos dinamicos.
- Renombrado por posiciones conserva comentarios, cadenas, formato y otras salidas; no se modifica codigo automaticamente al escribir nombre.
- Alcance frontend: advertencia de coherencia, no validacion de ejecucion ni habilitacion de guardado.

## 2026-11-03 - Persistencia Temporal De Entradas De Prueba

- Entradas manuales var/ficha viven en sesion del editor, fuera del borrador guardable y sobreviven cambio de pasos.
- Reconciliacion conserva claves vigentes y elimina solo las retiradas del script; claves nuevas no heredan datos anteriores.
- Nueva sesion al abrir o cambiar variable evita mezclar pruebas; ficha conserva ediciones manuales del mismo vehiculo.

## 2026-11-03 - Deteccion De Entradas De Ficha En Variables

- Deteccion compartida de referencias literales var y ficha, ignorando comentarios, textos y accesos de otros objetos.
- KPI y readsProfile derivados del script al leer, editar y guardar, sin bandera independiente desactualizada.
- Probar separa entradas manuales de telemetria/ficha y muestra valores de ficha actuales como contexto fijo de lecturas.
- Ausencias explicitas sin valores inventados; acceso solo a objeto ficha o campos prefijados ficha_, sin confundir telemetria.

## 2026-11-03 - Texto De Seleccion Acumulativa De Compatibles

- Boton renombrado a Añadir compatibles con contador, conforme a su accion acumulativa.
- Conservada seleccion previa y deduplicacion; ningun cambio en asignaciones o criterio de compatibilidad.

## 2026-11-03 - Filtro De Nivel De Combustible En Variables

- Corregida omision de fuelPercent; conservados fuelLevel, canFuelLevel y fuelLevelPercent.
- Filtro, contador y etiqueta NIVEL comparten criterio; cero cuenta como disponible y null/undefined no.
- Pruebas de campos alternativos, ausencia y distincion entre nivel y consumo; sin cambios en asignaciones.

## 2026-11-03 - Coherencia De Plantillas De Variables

- Limpiar texto usa limpiar y conserva None ante entrada ausente o limpia vacia.
- Promedio CSV usa partir, limpiar, numero y promedio; no sustituye ausencias por cero ni descarta silenciosamente campos invalidos.
- Plantillas extraidas a generador probado, salida actual escapada y preservados ceros numericos.
- Contrato frontend propuesto de firmas documentado en generador; compatibilidad del motor original sigue pendiente, no se ejecuta ni se afirma validacion backend.

## 2026-11-03 - Retiro De Ejemplos Temporales De Variables

- Eliminados ocho scripts de demostracion de pendientes y sesenta lecturas ficticias del paso Probar.
- Quitados avisos, controles y precarga manual de ejemplos; conservados estilos, orden y lecturas disponibles del emulador.
- Sin borrar variables guardadas ni historial compartido de telemetria.

## 2026-11-03 - Orden De Datos Sin Revertir Diseno De Pruebas

- Recuperados estilos de etiquetas y tabla, preservando alineacion estable.
- Orden uniforme alfabetico de entradas en campos manuales y lecturas: ignition antes de speed.
- No se muta orden del script ni datos de telemetria.

## 2026-11-03 - Tabla De Prueba Con Formato Original

- Retiradas etiquetas de colores; entradas como texto monoespaciado en una celda segun referencia original.
- Filas compactas, cabecera blanca y resultados/pasos alineados a la derecha; demostracion y estados pendientes conservados.

## 2026-11-03 - Alineacion De Entradas En Pruebas De Variables

- Etiquetas de señales distribuidas en columnas iguales entre filas; ausencias ya no desplazan las siguientes señales.
- Retirados margenes variables de etiquetas y conservada adaptacion a movil y multiples entradas.

## 2026-11-03 - Paso Probar Segun Referencia Con Etiquetas

- Panel manual de 280px, resultado destacado, tabla con cabecera suave y etiquetas azules para entradas, naranjas para ausencias.
- Tipografia y separadores ajustados, aviso de demostracion compacto y paginacion dentro del panel.
- Restaurados contadores de señales y vehiculos en pasos segun nueva captura; sin cambios de ejecucion ni datos.

## 2026-11-03 - Datos Temporales En Paso Probar

- Sesenta lecturas ficticias variadas, incluyendo ceros, false y ausencias; tres paginas de ejemplos y entradas manuales precargadas.
- Modo demostracion visible y desactivable para consultar lecturas reales; ejemplos no pertenecen al vehiculo ni se persisten.
- Resultados siguen sin ejecutar: no se simula el motor ni se habilita guardar.

## 2026-11-03 - Icono De Historial De Variables

- Sustituido icono de reinicio por reloj con flecha de historial en boton de versiones.
- Tooltip y etiqueta accesible indican historial; sin cambios de funcionamiento.

## 2026-11-03 - Editor De Variables Segun Nueva Referencia

- Fondo blanco, secciones sin tarjetas, panel de señales con separador vertical, tipografia legible y botones proporcionados.
- Encabezado del editor con volver y PLAT; pasos sin contadores, ayuda cerrada inicialmente.
- Conservados seleccion, proteccion de borrador, expandir editor, filtros y flujo de tres pasos; cambios solo de presentacion.

## 2026-11-02 - Ajuste Visual Del Desplegable De Sintaxis

- Bloque abierto inicialmente como referencia, tipografia y etiquetas compactas, espaciado reducido y cierre de texto en negrita.
- Quitado checkbox adicional del bloque para mantener la composicion de la captura; datos existentes conservados.

## 2026-11-02 - Referencia De Sintaxis Del Motor En Editor

- Desplegable bajo consola con nueve funciones, tres entradas, condicionales, for y None segun captura original.
- Texto de datos ausentes, repeticion de cadenas, topes y campos de ficha; etiquetas adaptables a pantallas pequeñas.
- Referencia visual del lenguaje, sin implementar ni simular ejecucion del motor en frontend.

## 2026-11-02 - Seleccion Visible Al Probar Scripts

- Probar conserva clave seleccionada tambien para ejemplos temporales; opcion activa visible aunque busqueda la excluya.
- Ejemplos siguen sin guardarse ni agregarse al catalogo real; selector identifica demostracion.
- Confirmar cancelacion de cambio de variable conserva tambien seleccion de ejemplo con borrador pendiente.

## 2026-11-02 - Contencion De Lista De Scripts Pendientes

- Corregido desbordamiento de filas bajo borde del panel; grid y columna derecha permiten contraccion real.
- Lista con scroll interno y paginacion fija dentro del panel; encabezado y aviso no se superponen a filas.
- En movil se conserva flujo natural con altura maxima de lista.

## 2026-11-02 - Ejemplos Temporales En Scripts Pendientes

- Ocho ejemplos solo en panel de pendientes, identificados como demostracion y paginados con registros reales.
- No se persisten ni alteran KPI, selector o consolas; boton Quitar ejemplos los retira de la vista.
- Probar un ejemplo abre borrador no guardado, sin marcarlo como probado.

## 2026-11-02 - Busqueda Amplia Y Limpieza De Filtros En Variables

- Busqueda flexible aprovecha espacio desde el final del encabezado hasta los controles.
- Boton con icono y tooltip limpia busqueda y selector, reinicia paginacion y vuelve a portada.
- Confirma antes de descartar borradores; cancelar conserva filtros y edicion.

## 2026-11-02 - Ajustes De Paridad Con Editor Original

- Resaltado visual seguro de cadenas, palabras clave y numeros, sincronizado con textarea y numeracion.
- Catalogo agrupado con los trece nombres GPS originales y señales del emulador; ventana real de treinta dias, maximo quinientas lecturas locales.
- Conversiones explicitas de coordenadas y odometro compartidas entre panel, pruebas y compatibilidad sin inventar valores ausentes.
- Guardar bloqueado hasta contar con prueba exitosa del motor original; repositorio no contiene backend ni contrato de ejecucion.
- No se afirma equivalencia funcional completa: motor, funciones admitidas y resultados calculados en ficha requieren integracion externa.

## 2026-11-02 - Scripts Pendientes De Prueba

- Reemplazadas ultimas actualizaciones por scripts sin prueba registrada, paginados de cinco en cinco.
- Boton Probar abre directamente el paso dos del editor sin modificar el script ni marcar pruebas realizadas.
- Sin resultados simulados: mientras no exista registro del motor, todas las definiciones figuran sin prueba registrada.

## 2026-11-02 - KPI Compactos Y Ultimas Actualizaciones

- Cuatro KPI con altura natural, menor tipografia y sin estiramiento vertical.
- Debajo, ultimas cuatro actualizaciones de configuracion local por variable con autor, fecha y acceso a versiones.
- Usa registros existentes sin inventar eventos ni sustituir auditoria.

## 2026-11-02 - Reversion De Ultima Distribucion De Variables

- A peticion del usuario, revertida unicamente la ultima redistribucion: consola izquierda y KPI derecha restaurados.
- Sin cambios funcionales ni reversion de modificaciones anteriores.

## 2026-11-02 - Proporciones Compactas De Portada Variables

- Retirado estiramiento vertical artificial de consola y KPI.
- Indicadores compactos arriba; consola debajo a ancho completo con altura segun contenido.
- Sin cambios funcionales ni datos adicionales.

## 2026-11-02 - Aprovechamiento De Altura En Variables

- Portada flexible ocupa altura disponible, consola unica se expande y resumen global distribuye cuatro KPI en dos filas.
- Mas ancho para codigo, tipografia de indicadores mas legible y footer al pie; movil conserva flujo natural.
- Sin cambios de seleccion, datos ni flujo del editor.

## 2026-11-02 - Consola Visible En Portada De Variables

- Restaurada previsualizacion de scripts y acciones originales sin seleccionar variable en el desplegable.
- Cambio visual: consolas a la izquierda y cuatro KPI globales a la derecha; sin panel de datos individuales adicional.
- Selector y lapiz abren editor de tres pasos; busqueda, paginacion y estados vacios conservados.

## 2026-11-02 - Portada Amplia Sin Variable Seleccionada

- Panel amplio con area neutral sin datos individuales a la izquierda y cuatro KPI globales a la derecha.
- Eliminada fila compacta; selector filtrable conserva apertura del editor de tres pasos.
- Acciones de estado, versiones y eliminacion disponibles al seleccionar, sin descartar borradores pendientes.

## 2026-11-02 - Correccion Del Flujo De Seleccion De Variables

- Selector vuelve a abrir el editor de tres pasos, con confirmacion si hay un borrador pendiente.
- Inicio sin seleccion, cuatro KPI globales y lista compacta; retirados script y datos individuales de la portada.
- Cancelar, guardar o recargar limpia la seleccion para volver al resumen sin mostrar una variable automaticamente.

## 2026-11-02 - Restauracion Del Resumen Global De Variables

- Restaurados los cuatro KPI originales: definiciones, activas, vehiculos alcanzados y leen la ficha.
- Resumen global solo en la vista inicial con lista; detalle y script exclusivamente tras seleccionar variable.
- Retirados los KPI sustitutos del detalle, manteniendo alcance y demas datos especificos sin duplicarlos.

## 2026-11-02 - Seleccion Previa Y Cuatro KPI De Variables

- Vista inicial con lista seleccionable sin mostrar detalles de ninguna variable por defecto.
- Selector abre detalle, no edicion; lapiz conserva la edicion con proteccion de cambios pendientes.
- Cuatro KPI por variable: vehiculos, entradas, versiones y estado; al guardar se conserva la seleccion.

## 2026-11-02 - Vista Inicial Con Informacion Por Variable

- Script a la izquierda y panel informativo a la derecha; eliminadas metricas globales y etiquetas repetidas.
- Alcance, entradas, unidad, visibilidad, consulta de ficha, version, autor y fecha del ultimo cambio.
- Señales referenciadas y estado de conexion al backend sin simular ejecucion; distribucion adaptable a movil.

## 2026-11-02 - Asignacion De Variables Segun Referencia

- Tabla a ancho completo con modelos, categorias de señales disponibles y seleccion individual o masiva.
- Busqueda, filtros, paginacion de 20 y seleccion de equipos actuales por modelo, conservando selecciones ocultas.
- Compatibilidad orientativa basada en datos presentes; sin inventar sensores ni asignacion futura por modelo.

## 2026-11-02 - Paso Probar De Variables Segun Referencia

- Paso Probar a ancho completo, valores manuales a la izquierda y tabla de lecturas a la derecha.
- Campos derivados de señales referenciadas, vacios como ausentes; preservados cero, false y datos faltantes.
- Usa historial local existente o una ultima lectura del catalogo identificada como tal; hasta 500 lecturas, 25 por pagina.
- Resultados y pasos indican sin ejecutar mientras no exista servicio de calculo; no se inventan salidas ni historicos.
- Datos de prueba separados del borrador de configuracion.

## 2026-11-02 - Editor Inline De Variables Segun Segunda Referencia

- Sustituido modal simple por editor en pagina con pasos Script, Probar y A que vehiculos.
- Nombre interno, nombre cliente, unidad y opcion de mostrar en detalle; metadatos persistidos con compatibilidad anterior.
- Codigo con numeros de linea, insercion en cursor, tabulacion, plantillas y expansion.
- Panel derecho con señales disponibles de la ultima lectura real del catalogo local; busqueda y seleccion de equipo.
- Seleccion de vehiculos paginada; borradores, conflictos y guardado local conservados.
- Prueba de ejecucion muestra explicitamente backend pendiente; no inventa resultados ni validacion de script.

## 2026-11-02 - Variables Calculadas Segun Referencia

- Sustituida vista vacia de Variables por modulo de plataforma con buscador, filtro, cuatro indicadores y definiciones con script.
- Referencia estado_vehiculo asignada a hasta 99 activos visibles; cifras y versiones reales, sin fabricar historial.
- Editor con seleccion de vehiculos paginada, nueva definicion pausada, activacion/pausa, eliminacion confirmada e historial local de versiones.
- Guardado local confirmado, conflictos entre ventanas, permisos y proteccion de borradores; ningun script se ejecuta en el navegador.
- Header/sidebar actuales conservados; backend de calculo no conectado y declarado en estado inferior.
- Comprobacion en navegador con guardado fallido/reintento, pausa, versiones, filtros, creacion, eliminacion y proteccion de borradores.
- Corregida superposicion preexistente de la barra compacta en movil: se oculta por debajo de 768px, manteniendo el panel desplegable.

## 2026-11-02 - Correccion 5: Aviso De Salida En Limites

- Advertencia nativa al recargar o cerrar pestana con cambios sin guardar; sin aviso si no hay cambios.
- Incluye el campo numerico editado aun enfocado, antes de emitir change.
- Mantiene proteccion de navegacion y empresa; retira listener al desmontar.
- Prueba de borrador, campo sin confirmar, estado guardado/descartado y registro/limpieza del listener.

## 2026-11-02 - Correccion 4: Guardado Atomico De Etiquetas

- Configuracion de Etiquetas usa una transaccion confirmada antes de publicar cambios en memoria.
- Crear/editar confirma nombre y asignaciones juntos; eliminar incluye activos y referencias de accesos en el mismo manifiesto atomico.
- Quitar un activo tambien confirma persistencia antes de actualizar pantalla o registrar Auditoria.
- Fallos muestran error dentro del modal sin cerrar ni reiniciar nombre/seleccion; operaciones fallidas no se registran como exito.
- Conservadas asignaciones de activos fuera del alcance visible y acciones existentes de otros modulos.
- Pruebas de fallos en colecciones y manifiesto, reintentos, permisos y conservacion de estado previo.

## 2026-11-02 - Correccion 3 De Alertas: Proteccion De Borradores

- Detectados cambios respecto al estado inicial del editor, incluidos campos anidados, sin marcar fechas como cambios.
- Confirmacion al cancelar, cerrar, cambiar de regla, crear otra o salir de ruta; advertencia de navegador al recargar/cerrar pestaña.
- Editor abierto no se reinicia ante cambios del listado, flota ni otra ventana.
- Conflictos conservan borrador y bloquean guardado hasta cargar version actual con confirmacion de descarte.
- Servicio verifica la regla actual antes de actualizar/eliminar, incluso sin recibir aun evento storage, y conserva reglas ajenas al crear.
- Pruebas de deteccion, cancelacion, cierre, cambios externos, eliminacion y rechazo de escritura desactualizada.

## 2026-10-30 - Correccion 2 De Alertas: Confirmar Escritura Antes De Publicar

- Crear, editar, eliminar y activar/desactivar preparan la lista sin modificar el estado visible hasta confirmar persistencia.
- Fallos muestran error en listado o editor, sin mensaje de exito ni cierre o reinicio del borrador.
- Reintento conserva las acciones habilitadas y limpia el error tras un guardado correcto.
- Pruebas de fallos y reintentos de las cuatro operaciones, sin cambios reactivos ni perdidas del estado anterior.

## 2026-10-30 - Correccion 1 De Configuracion: Carga De Reglas

- Ejemplos solo sin configuracion guardada; eliminada mezcla que reemplazaba ediciones y recuperaba reglas borradas.
- Lista vacia guardada se respeta; historicos permanecen sin recrear sus reglas.
- Datos corruptos muestran error con reintento y bloquean cambios para no sobrescribirlos.
- Regresiones para recarga, reglas personalizadas, desactivacion, eliminacion total y conservacion de historicos.
- No aborda aun el punto 2 de fallos de escritura ni el punto 3 de proteccion de borradores.

## 2026-10-30 - Tooltips De Sidebar

- Tooltips propios fuera del contenedor con scroll mediante Teleport, sin recortes ni espera del title nativo.
- Nombres de seccion y modulo por hover o foco; cierre al navegar, hacer clic, salir, desplazar, redimensionar o pulsar Escape.
- Conservada relacion accesible aria-describedby; sigue dentro de prueba Nutella.

## 2026-10-30 - Refinamiento De Prueba Sidebar

- Una seccion siempre abierta para evitar el panel vacio mostrado; repetir clic no oculta los modulos.
- Encabezados con icono y cantidad, nombres legibles y submenus con guia vertical.
- Activo con acento naranja discreto, sin bloque naranja completo en panel.
- Sigue perteneciendo a la prueba Nutella; copia anterior original conservada sin sobrescribir.

## 2026-10-30 - Prueba De Sidebar Acordeon (Nutella)

- Panel con una sola categoria desplegada; al navegar se abre automaticamente la categoria actual.
- Barra compacta con selector de tres secciones e iconos solo de la seleccionada.
- Filas compactas sin recuadro extra de icono; rutas, permisos y preferencia de barra sin cambios.
- Palabra acordada nutella: retirar esta prueba de sidebar, sin tocar otros modulos.
- Copia previa exacta de componente y test en frontend/node_modules/.cache/sidebar-nutella para restauracion acotada.
- Selector de empresas no incluido en esta prueba.

## 2026-10-30 - Explicacion En Espacio Inferior

- Movido texto explicativo debajo de los tres cuadros, en el espacio vacio indicado.
- Explica aplicacion del limite, igualdad y exceso, o estimacion de consumo segun pestana.

## 2026-10-30 - Explicacion Breve En Detalle De Limites

- Texto bajo el tipo seleccionado explica velocidad maxima y exceso estricto sobre el limite.
- En consumo explica litros por hora en ralenti; estilo compacto para conservar espacio.

## 2026-10-30 - Limites Ajustados Al Alto Disponible

- En escritorio el listado distribuye los nueve tipos en el alto disponible con filas e imagenes compactas.
- Panel y acciones usan flex con min-height cero; compactados editor, vista previa y resumen para pantallas bajas.
- Conservado desplazamiento natural en movil y ventanas pequenas para no ocultar controles.

## 2026-10-30 - Todos Los Tipos En Velocidad

- Agregados Furgon, Maquinaria, Otro y Moto al listado de limites de velocidad.
- Conservados valores configurados y originales existentes; sin cambios en consumo ni persistencia.
- Etiquetas de Maquinaria y Otro normalizadas para su presentacion.

## 2026-10-30 - Correccion Del Tercer Cuadro

- Sustituido Exceso desde por Valor original, como solicito el usuario.
- Muestra el valor base del tipo o el heredado de plataforma en empresa, sin seguir el borrador.

## 2026-10-30 - Tercer Cuadro De Resumen De Velocidad

- Recuperado tercer cuadro como Exceso desde, con umbral estricto Mas de X km/h segun edicion actual.
- Conservados total de vehiculos y limite guardado; sin aplicar concepto de exceso al consumo en ralenti.

## 2026-10-30 - Vista Previa Del Umbral

- Sustituido el campo de motivo por escala visual reactiva: dentro, en el limite y exceso de 10 km/h.
- Vista previa solo en velocidad; no genera alertas ni modifica condiciones de backend.
- Conservados valor guardado y compatibilidad con motivos previamente almacenados, sin borrarlos.

## 2026-10-30 - Motivo Y Valor Guardado En Limites

- Motivo opcional de hasta 500 caracteres por tipo y pestana, guardado atomicamente junto al limite en el almacenamiento existente.
- Descartar incluye motivos; deteccion de cambios y conflictos incluye ediciones de motivos.
- Resumen distingue valor guardado del borrador y muestra motivo guardado.
- Lectura compatible con configuraciones previas sin motivos; reducido estiramiento vertical del editor.

## 2026-10-30 - Retiro De Funciones De Prueba En Limites

- Eliminados origen, comparacion con original, restablecimiento individual y aviso de categorias ausentes.
- Conservado solo Descartar cambios de las funciones propuestas, ademas de guardar y restablecer global existentes.
- Conservada distribucion de listado y editor; campo ampliado al retirar estado lateral.

## 2026-10-30 - Retiro De Marcadores Amarillos En Limites

- Retirado resaltado temporal amarillo y prefijo Nuevo de tooltips.
- Conservadas funciones y etiquetas con estilo neutro del modulo.

## 2026-10-30 - Ajuste De Limites A Referencia Visual

- Recuperados los cuatro bloques inferiores del detalle y la superficie blanca del editor.
- Ajustadas proporciones de listado, imagen, campos y acciones a la referencia proporcionada.
- Aviso inferior azul unificado; retirada franja informativa adicional no presente en la referencia.

## 2026-10-30 - Limites Con Seleccion Y Detalle

- Distribucion segun referencia: listado de tipos, cantidades y valores a la izquierda; editor del tipo seleccionado a la derecha.
- Conservados borradores entre tipos y pestanas, guardado directo, descarte y restablecimiento.
- Comparacion con original visible en detalle, sin duplicar un resumen de los mismos valores.
- Adaptacion a una columna en movil y marcadores amarillos de la propuesta conservados.

## 2026-10-30 - Herramientas De Edicion De Limites En Prueba

- Restablecer individual por tipo sin afectar otras filas ni guardar automaticamente.
- Comparacion con el valor original cuando difiere; respeta herencia de plataforma en empresas.
- Descartar cambios de ambas pestanas recupera configuracion guardada y vigente.
- Aviso de categorias visibles ausentes de la tabla y activos sin tipo valido, sin afirmar que carecen de limites.
- Elementos nuevos conservan amarillo y tooltips temporales para su evaluacion.

## 2026-10-30 - Simplificacion De La Propuesta De Limites

- Retirados listado de vehiculos, revision previa y marcadores de pendientes por fila.
- Recuperado guardado directo y cantidades sin interaccion.
- Conservado origen del valor, renombrando fabrica a Valor original; mantiene amarillo temporal para revision.

## 2026-10-30 - Marcadores Temporales De Propuesta En Limites

- Resaltado amarillo y tooltips en consulta de vehiculos, origen, pendientes y guardado con revision.
- Cabeceras de ambos modales nuevos resaltadas para reconocer la propuesta.
- Sin cambios en la logica; marcadores agrupados para retirarlos al terminar la revision.

## 2026-10-30 - Propuesta De Valor Para Limites

- Cantidades abren un listado consultable de vehiculos visibles por tipo.
- Origen explicito: fabrica, plataforma o personalizacion; indicador de cambios pendientes.
- Revision previa al guardado de ambas pestanas con valores antes/despues y alcance visible.
- En plataforma se aclara que empresas con valores propios no heredan el cambio.
- Propuesta aislada en ConfigurationLimitsView.vue, sin alterar persistencia ni backend.

## 2026-10-30 - Historial Solo Desde Auditoria

- Retirado el boton Historial de ajustes avanzados y su navegacion asociada.
- Conservado el registro automatico de cambios en Auditoria y su reintento.

## 2026-10-30 - Ajustes Avanzados Integrados Con Auditoria

- Historial navega a Auditoria filtrada por modulo Configuracion y accion de ajustes avanzados.
- Cada guardado confirmado registra responsable, fecha y valores antes/despues en Auditoria.
- Cola pendiente junto a los valores evita perder eventos si falla Auditoria; reintentos sin duplicados.
- Historial real anterior se traslada conservando autor/fecha; retirados modal paralelo y ejemplos temporales.
- Conservada revision previa. Auditoria existente sigue usando almacenamiento local, no servidor.
- Eventos de ajustes avanzados visibles solo para administradores de plataforma.

## 2026-10-30 - Historial De Demostracion Ampliado

- 148 guardados ficticios de 16 usuarios, distribuidos entre septiembre y octubre.
- Ejemplos con uno a cuatro parametros y distintas horas para probar filtros y paginacion.
- Solo previsualizacion temporal: no se guardan ni modifican valores o historial real.

## 2026-10-30 - Filtros Del Historial

- Rango Desde/Hasta inclusivo segun fecha de Chile y filtro por ajuste.
- Combinables con busqueda de usuario o parametro, con limpieza de todos los filtros.
- Reinicio de paginacion y detalle al filtrar; advertencia ante fechas invertidas.
- Conservado tamano fijo del modal y scroll solo en el listado.

## 2026-10-30 - Historial Cronologico Por Fecha

- Sustituido el listado/detalle lateral por una vista cronologica agrupada por dia de Chile.
- Cada guardado conserva su hora y usuario; varios parametros se comparan en una sola tabla compacta.
- Eliminadas tarjetas repetidas, referencias de flota e informacion adicional duplicada del historial.
- Modal fijo con busqueda, cinco guardados por pagina, controles fijos y colores corporativos.

## 2026-10-29 - Historial Segun Referencia Visual

- Cabecera clara, buscador dentro del panel izquierdo y seleccion azul suave.
- Avatares circulares, identidad del responsable y contador en el detalle.
- Comparacion en bloques anterior/nuevo con acento naranja e informacion adicional.
- Referencias originales identificadas y sin duplicarlas por parametros del mismo ajuste.
- Consolidado CSS del modal; conservados tamano fijo, filtros, paginacion y modo movil.

## 2026-10-29 - Historial En Dos Paneles Corporativos

- Rediseno estructural: lista de guardados a la izquierda y detalle independiente a la derecha.
- Cabecera azul corporativo, acentos naranja, superficies blancas y comparacion de valores.
- En movil se alterna entre listado y detalle con regreso explicito.
- Conservados dimensiones estables, busqueda, paginacion y registros reales y de demostracion.

## 2026-10-29 - Rediseno Del Modal De Historial

- Cabecera con contexto del modulo y buscador fijo fuera del area desplazable.
- Registros con iniciales, resumen y metadatos separados; detalle con valores diferenciados.
- Nota de demostracion compacta, sin bloque destacado que compita con los registros.
- Conservados tamano fijo, paginacion, busqueda y apertura individual del detalle.

## 2026-10-29 - Modal De Cambios Con Tamano Estable

- Ancho y alto estables, limitados por el viewport, sin crecer al expandir registros.
- Contenido con scroll interno y espacio reservado para la barra; cabecera y pie fijos.

## 2026-10-29 - Historial Compacto Y Paginado

- Lista de guardados con usuario, fecha y resumen; un detalle expandido a la vez.
- Busqueda por usuario o parametro, tolerante a mayusculas y acentos.
- Cinco registros por pagina, contador y navegacion sin tablas repetidas abiertas.
- Conservados valores antes/despues y datos temporales de demostracion.

## 2026-10-29 - Ejemplos Temporales En Historial

- Cuatro usuarios ficticios con cambios de ejemplo, marcados como demostracion.
- Solo previsualizacion: no se escriben registros ni se modifican ajustes reales.
- Datos aislados en advancedConfigurationHistoryDemo.js para retirarlos enseguida.

## 2026-10-29 - Revision Y Historial De Ajustes Avanzados

- Revision modal de parametros modificados antes de confirmar cada guardado.
- Historial local con usuario, fecha y valores antes/despues; sin registros inventados.
- Valores e historial persisten juntos en una sola escritura, compatible con datos anteriores.
- Cancelar, descartar y restablecer sin guardar no generan historial; conservados permisos y conflictos.

## 2026-10-29 - Prueba De Descartar Y Comparar Cambios

- Descartar cambios aparece solo con modificaciones y vuelve a los valores guardados,
  incluidos cambios recientes de otra ventana, sin escribir en almacenamiento.
- Campos modificados muestran comparacion Guardado / Nuevo; vacios indican Sin valor.
- Conservados restablecimiento de fabrica y guardado explicito como acciones distintas.

## 2026-10-29 - Nombre De Ajustes Avanzados

- Nombre del modulo actualizado a Ajustes avanzados, sin abreviatura PLAT.
- Permisos exclusivos de plataforma conservados.

## 2026-10-29 - Estado De Guardado En Capsula

- Indicador compacto sin borde y con punto de estado en lugar del check.
- Conservados texto accesible y colores por estado.

## 2026-10-29 - Indicador Visual De Guardado

- Estado Sin cambios con fondo verde suave, borde e icono, sin comportamiento de boton.
- Cambios pendientes en ambar; errores en rojo y no disponible en gris.
- Mantiene anuncio accesible del estado y adaptacion movil.

## 2026-10-29 - Prueba De Header En Ajustes Avanzados

- Encabezado del modulo con titulo, alcance Plataforma y estado de guardado.
- Restablecer todo y Guardar cambios pasan del pie al encabezado, sin duplicacion.
- Cambio visual acotado a la vista para poder retirarlo sin modificar el layout global.

## 2026-10-29 - Estados Y Restablecimiento Por Ajuste

- Iconos de dominio y estado por ajuste: valor de fabrica, personalizado o sin guardar.
- Referencia al valor de fabrica visible junto a campos distintos al predeterminado.
- Restablecimiento individual sin modificar otros ajustes ni guardar automaticamente.
- Conservados validacion, permisos, guardado explicito y proteccion de conflictos.

## 2026-10-29 - Reducir Scroll De Ajustes Avanzados

- Menores margenes y separacion entre filas; descripciones aprovechan todo su ancho.
- Reducida altura natural de cada ajuste sin ocultar contenido ni bloquear scroll necesario.

## 2026-10-29 - Avanzado En Cuatro Filas

- Cuatro ajustes a todo el ancho, distribuidos en el alto disponible.
- Explicaciones a la izquierda y parametros relacionados juntos a la derecha.
- Pantallas estrechas apilan contenido y controles, con desplazamiento natural.

## 2026-10-29 - Propuesta Visual Compacta De Avanzado

- Dos columnas con titulos alineados arriba y altura natural, sin expansion vertical.
- Parametros relacionados agrupados en columnas de ancho limitado.
- Texto principal oscuro, explicaciones y unidades en gris, azul reservado a enlaces.
- Sin cambios en valores, permisos ni persistencia.

## 2026-10-29 - Panel Informativo Alineado Al Contenido

- Popover alineado al inicio del enlace, sin desplazarse sobre el menu lateral.
- Conserva ajuste al viewport y apertura superior o inferior segun espacio.

## 2026-10-29 - Ocupar El Alto Libre De Avanzado

- Las dos filas ocupan el alto disponible en escritorio, eliminando el sobrante inferior.
- Texto y parametros permanecen juntos y centrados dentro de cada ajuste.
- En pantallas bajas o estrechas se conserva altura natural y desplazamiento.

## 2026-10-29 - Parametros Repartidos En El Ancho Disponible

- Parametros en columnas adaptables, con etiqueta encima y unidad junto al valor.
- Tarjetas de cada fila alineadas en altura, sin huecos entre filas.
- Pantallas estrechas mantienen parametros apilados sin desbordamiento.

## 2026-10-29 - Enlace Contextual De Informacion General

- Informacion sobre otros ajustes como enlace con icono debajo del conjunto,
  sin boton aislado ni espacio reservado encima de las tarjetas.

## 2026-10-29 - Informacion General Fuera De Los Ajustes

- Boton de informacion situado en la esquina superior derecha de la vista,
  fuera de las tarjetas para evitar asociarlo solo al ajuste de temperatura.

## 2026-10-29 - Ajustes Compactos Sin Altura Forzada

- Eliminada la expansion vertical de las tarjetas y el espacio automatico antes de los controles.
- Espaciado reducido y campos mas cercanos a las descripciones, manteniendo dos columnas.

## 2026-10-29 - Ajustes En Dos Columnas

- Distribucion de dos ajustes por fila en escritorio y una columna en pantallas estrechas.
- Controles debajo del contenido, tipografia mas legible y unidades alineadas.
- Informacion integrada junto al primer ajuste, sin franja superior vacia.
- Conservados referencias plegables, permisos, validacion y guardado.

## 2026-10-29 - Simplificacion De Ajustes Avanzados

- Eliminados resumen lateral duplicado y etiquetas de categoria repetitivas.
- Cuatro ajustes a todo el ancho; mediciones de referencia plegadas por ajuste.
- Conservados controles, validacion, guardado y boton unico de informacion.

## 2026-10-29 - Informacion Junto Al Boton En Avanzado

- Popover se posiciona bajo o sobre el boton segun el espacio, ya no al pie
  de la pantalla. Contenido vertical legible, ancho limitado y scroll interno.
- Conserva cierre nativo por Escape/clic exterior; se cierra al desplazar la
  vista o redimensionar para no quedar desconectado del boton.

## 2026-10-29 - Avanzado A Todo El Alto Disponible

- En escritorio, cuatro ajustes repartidos a lo alto y resumen extendido hasta
  el mismo borde inferior. Sin alterar valores, acciones ni textos.
- Pantallas estrechas o bajas conservan altura natural y scroll sin recortes.

## 2026-10-29 - Orden Visual De Ajustes Avanzados

- Controles con columnas estables y alineacion uniforme entre ajustes.
- Resumen lateral compacto de etiqueta/valor, sin grandes cajas vacias, con
  boton de informacion junto al titulo. Contenido y comportamiento conservados.

## 2026-10-29 - Informacion Adicional En Un Solo Boton

- Bloque inferior y nota de procedencia pasan a un popover nativo abierto
  por un unico icono de informacion. Cierra con boton, Escape o clic exterior.
- Conserva todos los textos y enlace a Limites sin ocupar una franja completa.

## 2026-10-29 - Sin Encabezado Sobre Los Ajustes

- Retirados titulo visible, etiqueta Plataforma y subtitulo del editor.
  Ajustes y resumen permanecen; titulo accesible sin ocupar espacio.

## 2026-10-29 - Ajustes Avanzados Con Resumen Lateral

- Nueva distribucion de referencia: cuatro ajustes amplios a la izquierda,
  controles a la derecha de cada descripcion y resumen de siete valores lateral.
- Resumen reactivo al borrador, con unidades y guion para entradas invalidas.
  Bloque inferior a todo el ancho; sin navegacion superior adicional.
- Se mantienen permisos, validacion, guardado local y procedencia de mediciones.

## 2026-10-28 - Retiro De Navegacion Superior En Avanzado

- Quitados rotulo Configuracion/Plataforma y pestanas superiores de la vista.
  El contenido de Ajustes avanzados permanece sin cambios.

## 2026-10-28 - Replica Inicial De Ajustes Avanzados

- Navegacion superior, encabezado compacto, cuatro tarjetas de 720px centradas,
  controles numericos en linea, origen de fabrica y bloque inferior replicados.
- Repuestos titulos, descripciones y cuatro recuadros de mediciones de la
  captura; se identifican como referencia original, no calculos de esta flota.
- Conservadas validacion, persistencia local, permisos y conflictos. Acciones de
  guardado aparecen solo al editar o con valores personalizados.

## 2026-10-28 - Modulo De Ajustes Avanzados De Plataforma

- Ruta Avanzado reemplaza placeholder por siete parametros agrupados en
  temperatura, carga/caida de combustible e ignicion, con defaults de referencia.
- Guardado local atomico, validacion por campo, restablecimiento explicito,
  cambios sin guardar y proteccion ante conflicto de otra ventana.
- Solo administrador de plataforma puede editar; no hay ruta por empresa.
- No se copian estadisticas de otra flota ni se finge conexion con detectores:
  la aplicacion al procesamiento de eventos queda identificada como pendiente.

## 2026-10-28 - Etapas De Atencion Sin Pestana Redundante

- Retirada Pendientes de la bandeja. Sin atender pasa a Sin iniciar en pestana,
  indicador, estados de filas y grupos. La bandeja abre en Sin iniciar.
- Se mantienen En curso, Atendidas, Todas e Historicas. Prueba de etapas
  mutuamente excluyentes, sin modificar los registros ni el historial.

## 2026-10-28 - Atencion Multiple Y Estados De Grupo Consistentes

- Atencion multiple nunca cae a individual si se desmarca el grupo abierto.
  Se captura la seleccion al abrir y se cancela si cambian destinatarios o
  casillas; confirmar revalida antes de escribir.
- Grupos con estados diferentes muestran conteos por estado y marcador mixto;
  solo un grupo completamente atendido se considera resuelto. Episodios
  individuales muestran su estado dentro del detalle.
- Pruebas de seleccion vacia/sin grupo ancla, estados mezclados y orden inverso.

## 2026-10-28 - Filtro En Curso En La Bandeja

- Nueva pestana En curso junto a Sin atender; muestra solo alertas abiertas
  con atencion iniciada, excluyendo resueltas e historicas.

## 2026-10-28 - Cantidad Por Pagina Elegible

- Selector junto a paginacion: Automatico, 4, 10, 25 y 50 grupos por pagina.
- Automatico conserva ajuste al espacio; una cantidad manual permite scroll
  dentro de la tabla sin aumentar su alto. Cambiar cantidad vuelve a pagina 1.

## 2026-10-28 - Diez Alertas De Prueba Para Paginacion

- Agregadas diez alertas abiertas de prueba para Transportes San Pedro,
  vinculadas a vehiculos/reglas existentes, con ids estables y marca demo.
- Fechas diferentes conservan diez grupos separados. No cambia el limite de
  cuatro filas ni reemplaza estados de alertas ya guardadas.

## 2026-10-28 - Maximo Cuatro Alertas Por Pagina

- Paginas de hasta cuatro grupos: el quinto pasa a la siguiente. Se mantiene
  ajuste a pantallas menores, tabla a todo el alto y seleccion entre paginas.

## 2026-10-28 - Tabla A Todo El Alto Disponible

- Contenedor de tabla ocupa el espacio restante y mantiene paginacion abajo,
  conservando limite adaptable de filas completas sin estirar cada registro.

## 2026-10-28 - Paginacion Segun Filas Completas Disponibles

- Limite de pagina adaptado por ResizeObserver al alto disponible, descontando
  encabezado y barras. Filas estables y paginas recalculadas al redimensionar.
- Evita una ultima fila parcialmente visible; encabezado y paginacion quedan
  fuera del scroll de filas. Conserva seleccion multiple entre paginas.

## 2026-10-28 - Retiro De Ver Recorrido En Alertas

- Eliminados enlace, evento y navegacion al itinerario desde el detalle de
  alertas. Se conservan ubicacion, informacion y acciones de atencion.

## 2026-10-28 - Ancho Util Y Alto Ajustado De La Tabla

- Columnas proporcionales para Alerta/Empresa/Ubicacion y fecha de 150px;
  empresa y ubicacion pueden envolver texto en lugar de truncarlo.
- Tabla ajusta su altura a las filas presentes y conserva scroll al llenarse.
  Sin nuevas acciones ni cambios de datos.

## 2026-10-28 - Datos De Episodio Sin Alterar Las Filas

- Restablecida estructura de columnas y retirados botones de atencion por fila.
- Informacion nueva compacta dentro de Alerta, sin fila adicional a todo el
  ancho ni mensajes de datos ausentes. Atender sigue en el panel original.

## 2026-10-28 - Informacion De Episodio En Cada Fila

- Filas incluyen medicion, limite almacenado, exceso/grado de velocidad,
  antiguedad, duracion y modo de deteccion, con Atender directo por grupo.
- Duracion/deteccion ausentes se indican sin dato; no se deducen del cierre de
  atencion ni de configuraciones actuales. Se conservan seleccion y permisos.

## 2026-10-28 - Encabezado De Bandeja Compacto

- Sustituidos pills y tarjetas grandes por pestanas sobrias, indicadores sin
  tarjetas con separadores y filtros de 40px. Menos altura y peso visual.
- Conservados estados, metricas, filtros, permisos y acciones existentes.

## 2026-10-28 - Informacion Solo En Consulta De Alerta

- Restaurado bloque informativo antes de Atender; se oculta exclusivamente
  durante el formulario de atencion. Cancelar vuelve a mostrarlo.

## 2026-10-28 - Retiro Del Bloque Informativo Del Detalle

- Quitados responsable actual, empresa, fecha, ubicacion, recorrido, motivo y
  descripcion del panel. Se conservan atencion explicita e historial.

## 2026-10-28 - Solo Redistribucion Del Encabezado

- Pestanas y Las reglas arriba; indicadores en su propia fila con cifra sobre
  etiqueta; filtros debajo. Sin cambios de colores, acciones ni funcionamiento.

## 2026-10-28 - Header De Bandeja En Dos Filas

- Estados segmentados, cinco indicadores y Las reglas en la primera fila;
  buscador, empresa, fecha y Limpiar debajo a todo el ancho.
- Indicador Mas antigua naranja y filtros integrados al encabezado. Layout
  adaptable sin cambiar datos, permisos ni comportamiento de atencion.

## 2026-10-28 - Recorrido Como Accion Secundaria

- Ver recorrido pasa a enlace discreto junto a Ubicacion, sin boton principal
  ni espacio fijo en el pie. Atender/Reabrir conservan prioridad.

## 2026-10-28 - Formulario Solo Al Presionar Atender

- Consultar una alerta no abre el formulario. Atender inicia la accion
  individual; Atender seleccion abre la accion multiple explicitamente.
- Cancelar vuelve al detalle sin guardar. La atencion individual no incluye
  otros grupos marcados en la lista.

## 2026-10-28 - Atencion Directa Con Acciones Explicitas

- Cuatro acciones sin seleccion por defecto: La estoy viendo / Llame al
  conductor dejan En curso; Era real / Falsa alarma dejan Atendida.
- Formulario al inicio del detalle, nota opcional y una confirmacion. Cancelar
  no guarda. Cada confirmacion agrega responsable, fecha, accion y nota al
  historial sin pisar registros anteriores; mantiene atencion grupal/multiple.

## 2026-10-28 - Detalle De Alertas Sin Superponerse Al Menu

- Eliminada la capa fija del detalle en ventanas menores a 1280px.
- El detalle reemplaza temporalmente la lista dentro de la bandeja y conserva
  el encabezado y la navegacion. Cerrar vuelve a la lista con sus filtros.
- Desplazamiento del contenido en la propia bandeja, sin sombras de modal.

## 2026-10-28 - Funciones De Bandeja En El Diseno Actual

- Bandeja conserva tabla, filtros y detalle propios. Agrega pestanas de atencion,
  metricas reales, seleccion multiple y paginacion de 12 grupos.
- Agrupa por empresa, vehiculo, regla y dia de Chile; sin regla no fusiona avisos.
- Atencion individual, de grupo o seleccion: inicio, responsable y accion escrita
  persistidos en metadata y auditoria. Reabrir conserva el historial de atencion.
- Historicas solo incluye registros marcados metadata.historical; no confunde
  antiguedad con evaluacion historica. Atrasos solo con metadata.dueAt real.
- Persistencia local existente; no introduce un evaluador ni backend nuevo.

## 2026-10-28 - Bandeja Sin Configuracion Duplicada

- Alertas abre directamente la bandeja con filtros, historial y detalle.
- Eliminadas las pestanas y el editor duplicado de esta vista. La seccion
  Configuracion de alertas independiente permanece disponible sin cambios.

## 2026-10-28 - Lista De Alcance Mas Legible

- Buscador y empresa alineados con etiquetas; contador neutro y acciones juntas.
- Filas uniformes de 44px, patente y nombre separados, tipografia menos pesada
  y seleccion resaltada. Conserva filtros y seleccion masiva.

## 2026-10-28 - Seleccion Masiva De Vehiculos

- Una lista de vehiculos incorpora Seleccionar todos y Quitar seleccion.
- Seleccionar todos incluye todos los resultados filtrados y conserva la
  seleccion anterior. Quitar seleccion desmarca tambien los vehiculos ocultos.
- Acciones respetan permisos y vehiculos autorizados; no eliminan vehiculos.

## 2026-10-28 - Alcance Completo Sin Scroll Innecesario

- Compactadas separaciones del tercer paso con Toda la flota para que los
  controles existentes quepan en escritorio sin scroll innecesario. No se
  oculta overflow: en pantallas pequenas se conserva acceso a todo el contenido.
- Filtro de empresas y buscador siguen exclusivos de Una lista de vehiculos.

## 2026-10-27 - Empresa Con Busqueda En El Mismo Dropdown

- Filtro de empresas de la lista usa un combobox editable: escribir filtra
  nombres sin distinguir tildes/mayusculas. Todas las empresas queda disponible.
- Navegacion con flechas/Enter, cierre con Escape, Tab o clic exterior,
  estado sin resultados y lista de alto limitado. Filtrar no cambia selecciones.

## 2026-10-27 - Filtro De Empresas Dentro De La Lista De Vehiculos

- Filtro Todas las empresas/empresa autorizada solo dentro de Una lista de
  vehiculos, junto al buscador. No vuelve el selector general de empresa.
- Combina busqueda y empresa sobre las opciones visibles, sin modificar
  companyId, alcance ni seleccion de vehiculos de otras empresas.
- Nuevo/editor restablecen el filtro; contexto de empresa mantiene su limite
  autorizado. Control apilado en movil; pruebas de combinacion y conservacion.

## 2026-10-27 - Lista Completa De Vehiculos En Alcance

- Selector del wizard sin truncamiento de 120 filas. En plataforma muestra
  todos los activos autorizados, no solo los de la empresa fallback oculta.
  Contextos de empresa conservan su filtro y permisos.
- Nuevas reglas de plataforma guardan platformScope; normalizacion, payload y
  listado conservan seleccion entre empresas. Reglas de plataforma no se ofrecen
  para editar desde contextos de empresa, evitando ampliar permisos por esta via.
- Editar una regla antigua no amplia automaticamente su alcance de empresa;
  elegir nuevo alcance/vehiculos en plataforma es una accion explicita.
- Pruebas con 180 activos, busqueda, seleccion entre empresas, serializacion y
  exclusion de ids no autorizados; variantes operativas conservan limite previo.

## 2026-10-27 - Retiro De Empresa Del Alcance Del Wizard

- Eliminado selector Empresa del tercer paso de Configuracion Alertas para
  respetar la referencia. Se conserva el contexto de empresa del borrador y
  su filtrado autorizado, sin cambiarlo ni borrar datos al ocultar el control.
- El editor operativo conserva su selector anterior.

## 2026-10-27 - Alcance Y Acciones Segun Referencia

- Wizard muestra selector Toda la flota/Una lista de vehiculos, buscador por
  patente o nombre, contador y listado acotado con scroll. Lista comienza
  vacia, requiere al menos un vehiculo y conserva seleccion al buscar/volver.
- Mantiene empresa autorizada y payload existente. Etiquetas previas siguen
  visibles al editar reglas antiguas; no se ofrece un tercer modo nuevo.
- Acciones en filas de checkbox debajo del alcance. Plataforma usa el canal
  existente; informes, correo, datos anteriores y prueba de 30 dias muestran
  estado no disponible por integraciones ausentes, sin fingir ejecucion.
- Variante operativa del componente de alcance conserva el formulario anterior.

## 2026-10-27 - Retiro Del Resumen De Vigencia No Solicitado

- Eliminados resumen, barra horaria, estilos y helper de timeline agregados
  sin estar en la referencia. Se mantiene la redistribucion de los controles
  originales de horario, repeticion y dias, sin agregar funciones nuevas.

## 2026-10-27 - Redistribucion De Ruido Y Vigencia

- Segundo paso del wizard usa dos columnas para horario y control de avisos,
  selector Siempre/Personalizado, horas de ancho adaptable y unidades integradas.
- Dias ocupan las siete columnas del ancho disponible. Resumen inferior y
  franja de 24 horas reflejan seleccion y horarios que cruzan medianoche.
- Layout ocupa el alto del contenido; movil apila secciones y mantiene acciones
  al pie. El editor operativo conserva su horario anterior y se reutiliza el
  mismo borrador/payload, sin introducir nuevas reglas de evaluacion.
- Pruebas de franja diaria, nocturna e invalida; comprobacion de conservacion
  de valores entre pasos y selecciones del calendario en navegador aislado.

## 2026-10-27 - Variable De Senal De Solo Lectura

- El nombre de la variable en el editor queda fijo/de solo lectura. Cambia
  al elegir preset o senal disponible, no escribiendo. Condicion y umbral
  permanecen editables; eliminado el setter de texto del identificador.

## 2026-10-27 - Movimiento Fuera De Horario Con Senal Movement

- Preset usa movement = 1, sin unidad, nivel Advertencia y horario
  22:00-06:00. No infiere movimiento a partir de velocidad; el inspector
  muestra el campo solo cuando viene en el activo. Conserva reglas anteriores.

## 2026-10-27 - Nivel Predeterminado De Puerta Abierta

- Preset de senal Puerta abierta fija Advertencia al seleccionarlo, ademas
  de digital_input_2 = 0 y 300 s, sin heredar Critica de otro preset. El tipo
  independiente Puerta abierta permanece bloqueado como Proximamente.

## 2026-10-27 - Alimentacion Baja En Centivoltios

- Preset Alimentacion bajo 10 V usa ext_voltage_cv < 1000 cV, margen de
  salida 20 cV, duracion de 120 s y nivel Advertencia. Inspector reconoce
  el campo recibido sin inventarlo a partir de externalVoltage.
- Reglas guardadas conservan su campo/unidad. Prueba del preset y normalizacion.

## 2026-10-27 - Preset Corte De Alimentacion Con Unplug

- Corte de alimentacion externa configura unplug = 1, sin unidad, y nivel
  Critica. Inspector muestra unplug solo si lo trae el activo; no lo infiere
  de un voltaje en cero. Reglas ya guardadas conservan sus condiciones.

## 2026-10-27 - Bateria Interna Y Margen De Salida

- Preset Bateria del equipo baja usa bat_voltage_cv < 350 cV durante 300 s,
  con margen de salida de 20 cV, segun referencia. Reglas anteriores conservan
  su campo y unidad sin conversiones ni migraciones automaticas.
- Condiciones numericas de senal muestran margen editable no negativo,
  explicacion y unidad junto al umbral. Normalizacion/payload lo conservan.
- Inspector reconoce bat_voltage_cv solo si el activo trae ese campo; no lo
  inventa a partir de internalVoltage ni simula datos de los ultimos 30 dias.

## 2026-10-27 - Seis Presets Disponibles Dentro De Senal O Variable

- Los seis presets de senal quedan habilitados, incluidos puerta abierta y
  encendido fuera de horario. Son condiciones de senal, no habilitan los tipos
  independientes de episodios marcados Proximamente en el catalogo principal.
- Se conserva el bloqueo de ralenti, temperatura, puerta, ignicion y geocerca.

## 2026-10-27 - Ralenti Proximamente

- Ralenti tambien queda bloqueado en el selector y marcado Proximamente,
  sin modificar las reglas guardadas. Actualizada la prueba del catalogo.

## 2026-10-27 - Tipos De Alerta Proximamente

- Temperatura, puerta abierta, ignicion y entrada/salida de geocerca quedan
  deshabilitadas en el catalogo y marcadas Proximamente. Se conservan reglas
  guardadas y filtros. Tambien se bloquean los atajos puerta/encendido en los
  presets de senal para no ofrecer esos accesos por otra ruta del modal.

## 2026-10-27 - Puerta Abierta Como Preset De Senal

- El acceso Puerta abierta del wizard ahora elige Senal/variable con preset
  de puerta: digital_input_2 = 0 durante 300 segundos, editable. Canonicaliza
  el campo a digitalInput2 al guardar y conserva preset, cero y duracion.
- Editor incorpora los seis presets de referencia, condicion/valor, origen,
  duracion y severidad. Presets nocturnos asignan 22:00-06:00 al segundo paso.
- Panel lateral consulta solo activos autorizados de la empresa elegida y
  senales numericas/booleanas realmente cargadas. Seleccion inserta campo y
  unidad sin inventar valores. Muestra ultimo reporte, no un historico ficticio.
- Se conserva edicion de reglas door_open anteriores. No se afirma que exista
  detector de apertura ni historial de 30 dias; prueba historica deshabilitada.

## 2026-10-27 - Caida De Combustible Por Episodio En El Wizard

- Seleccionar caida de combustible ahora muestra aviso amarillo, nivel de
  alerta y prueba historica no disponible, sin umbral ni ventana manual.
- Configuracion del episodio guarda aviso al finalizar, revision de 10 minutos
  y vehiculo detenido. Conserva datos al editar; reglas legacy de umbral no
  se convierten ni pierden sus valores. No se implementa un detector de servidor.
- Pruebas de normalizacion, payload, severidad y compatibilidad legacy.

## 2026-10-27 - Catalogo De Diez Episodios En El Wizard

- Nuevas reglas de Configuracion ofrecen el catalogo de la referencia:
  velocidad, ralenti, temperatura fuera de rango, carga y caida de combustible,
  geocerca, puerta abierta, equipo sin reportar, ignicion y senal/variable.
- Ralenti fija motor encendido/vehiculo detenido; temperatura guarda sonda y
  rango; carga guarda subida/ventana; puerta entrada digital/polaridad;
  ignicion evento encendido/apagado sin forzar horario fuera de jornada;
  senal guarda origen medido/calculado, identificador, operador y umbral.
- Nuevos campos sobreviven normalizacion, borrador, persistencia y edicion.
  Tipos antiguos bateria/detencion/ignicion fuera de horario se conservan;
  no se migran ni borran. Filtros pueden seguir encontrandolos.
- Requisitos de sensores se indican sin inventar equipamiento. El formulario
  configura reglas; no implementa ni simula detectores de servidor.
- Pruebas de catalogo, payloads, validaciones, cero digital y compatibilidad;
  Edge recorre y guarda cada tipo en perfil aislado, sin activos inventados.

## 2026-10-27 - Opciones De Exceso De Velocidad En El Primer Paso

- Reemplazado el umbral generico del wizard por limite por tipo de vehiculo
  (resumen real de Configuracion Limites con herencia empresa/plataforma) o
  limite propio de 1 a 300 km/h. Nuevas reglas usan limites por tipo.
- Selector Avisar solo desde Leve/Moderada/Grave y relacion informativa,
  advertencia y critica en lugar de severidad manual. Configuracion guarda
  fuente, minimo, severidad por exceso e histeresis de salida de 5 km/h.
- Normalizacion, borrador y listado conservan/describen las nuevas opciones;
  reglas legacy sin campos siguen normalizandose como antes. Al abrirlas en
  este wizard se presentan con limite propio, manteniendo su umbral.
- Probar sobre 30 dias aparece deshabilitado y con motivo: este proyecto no
  tiene el evaluador historico de episodios. No se inventan resultados ni
  se afirma que estos campos activen un motor de deteccion de servidor.
- Pruebas de payload, normalizacion y bordes +10/+20; Edge comprueba seleccionar
  limite propio, guardar 105 km/h desde grave y recuperarlo al editar; sin
  desbordamiento horizontal en escritorio/movil.

## 2026-10-27 - Modal De Reglas En Tres Pasos

- Configuracion Alertas abre un modal con pasos Que detectar, Ruido y vigencia,
  Alcance y acciones. Anterior/Siguiente conserva el borrador y valida nombre,
  umbrales y horarios; usa activos, etiquetas y geocercas reales autorizados.
- Nuevas reglas se guardan inactivas; edicion conserva estado y canales previos.
  Silencio, dias y duracion de velocidad usan el payload existente. Sin dias
  elegidos se guardan los siete dias para evitar el fallback a lunes-viernes.
- Dialog nativo con foco contenido, Escape, cierre exterior y bloqueo del fondo.
  Encabezado, pasos y acciones permanecen visibles; el contenido tiene scroll interno.
- Correo deshabilitado en este flujo por falta de proveedor. No se simulan pruebas
  historicas, detectores faltantes ni integracion de episodios con informes.
- Verificado en Edge headless: avance, validacion, volver sin perder valores,
  guardar inactiva, editar, persistencia y cierre; capturas de escritorio/movil.

## 2026-10-27 - Iconos Uniformes En Alertas De Configuracion

- Todos los SVG quedan en 22 x 22 px; desactivada localmente la ampliacion
  optica de detencion y reloj, sin modificar iconos de otros modulos.

## 2026-10-27 - Seis Alertas Por Pagina Y Mayor Legibilidad

- Limite de seis reglas por pagina; restantes en paginas siguientes.
- Aumentados textos de titulo, descripcion, condicion, canales y resumen en
  escritorio. Filas de 90 a 120 px para acomodar la tipografia sin superponerla.

## 2026-10-27 - Limpiar Integrado Y Limite De Ocho Alertas

- Limpiar queda dentro del buscador de Configuracion Alertas y restablece
  busqueda y filtros. La cabecera operativa conserva su boton externo actual.
- Listado limitado a ocho reglas por pagina; navegacion y contador al pie,
  reinicio al filtrar y ajuste de pagina si disminuye la cantidad de resultados.

## 2026-10-27 - Filtros De Alertas Con Acceso A Bandeja

- Configuracion reutiliza la cabecera operativa: buscador, Tipo, Empresa,
  Estado, Limpiar y Nueva alerta, agregando Ver la bandeja en la misma fila.
- Filtros reales y reinicio de pagina; empresa bloqueada en rutas de cliente.
  El componente operativo conserva su distribucion sin el enlace adicional.

## 2026-10-27 - Distribucion Del Espacio En Alertas De Configuracion

- En escritorio las filas aprovechan el alto disponible entre 70 y 100 px,
  evitando tanto el vacio inferior con muchas reglas como filas gigantes con pocas.
- Resumen lateral ocupa 44% del ancho, con columnas proporcionales para reducir
  el vacio central y evitar cortes innecesarios de horarios y alcance.

## 2026-10-27 - Altura Compacta De Filas En Configuracion Alertas

- Filas de escritorio ajustadas a minimo de 70 px, como la lista operativa;
  condicion y canales comparten linea cuando hay espacio. Sin recortar contenido.
- Conserva iconos y controles, con espaciados y tipografia compactos.

## 2026-10-27 - Iconos Por Tipo En Configuracion Alertas

- Reglas de configuracion muestran los mismos SVG y tonos de la lista operativa:
  sin senal, bateria, detencion, encendido, velocidad, geocerca y combustible.
- Sin cambios a condiciones, permisos, activacion ni guardado.

## 2026-10-26 - Buscador De Alertas Aprovecha La Cabecera

- Buscador crece hasta las acciones, sin limite de 480 px ni espacio vacio central.

## 2026-10-26 - Cabecera Compacta De Configuracion Alertas

- Retirados titulo, descripcion e icono decorativo de la cabecera interna.
  Buscador a la izquierda y acciones a la derecha, sin cambiar sus funciones.

## 2026-10-26 - Alertas En Filas Amplias Con Resumen Lateral

- Diseno segun nueva referencia: regla, descripcion, condicion y canales a la
  izquierda; umbral real, alcance, vigencia, Editar e interruptor a la derecha.
- Conserva busqueda, paginacion y guardado. No inventa nombres de detectores ni
  registro en informes para funciones que usa otro motor de reglas.

## 2026-10-26 - Alertas De Configuracion Con Tabla E Interruptores

- Cambiadas tarjetas por tabla segun referencia: regla, condicion, alcance,
  vigencia, estado y acciones. Buscador, paginacion y severidad destacada.
- Interruptores accesibles activan/desactivan; Editar y Eliminar reutilizan
  editor, confirmacion y persistencia actuales sin alterar la vista operativa.

## 2026-10-26 - Alertas De Configuracion En Tarjetas

- Vista de Configuracion Alertas con cabecera, bandeja, nueva regla y tarjetas
  compactas con condicion, duracion minima, alcance, vigencia, canales y acciones.
- Reutiliza reglas automaticas y editor existentes, manteniendo separadas rutas
  operativas y de configuracion y los permisos de empresa y edicion.
- Ver la bandeja abre historial; no afirma envio externo sin proveedor ni
  registro de estas reglas automaticas en el motor distinto de reportes.

## 2026-10-26 - Busqueda Global De Etiquetas Filtra La Tabla

- Buscar un activo en la barra superior ahora muestra solo coincidencias en la
  tabla de la etiqueta seleccionada, reiniciando paginacion y filtro local previo.
- Buscar por nombre de etiqueta conserva sus activos completos; el buscador del
  detalle permite refinarlos. Conteo visible de coincidencias sobre asignados.

## 2026-10-26 - Modal De Etiquetas Segun Referencia

- Modal amplio con encabezado, nombre separado, resumen de seleccion, buscador,
  filtros segmentados, tabla, paginacion y acciones fijas al pie.
- Checkbox de cabecera selecciona la pagina y refleja seleccion parcial.
  Conserva el motor de seleccion entre paginas y los guardados de crear/editar.
- Dialogo nativo para foco y Escape, iconos compartidos y adaptacion movil.

## 2026-10-26 - Cabecera De Etiquetas Alineada Con Columnas

- Empresa, icono y conteo agrupados sobre listado izquierdo; buscador global
  ocupa el ancho derecho junto a Nueva etiqueta, segun referencia visual.
- Se conservan datos y acciones; cabecera adaptable a pantallas pequenas.

## 2026-10-26 - Cierre Del Menu De Activos En Etiquetas

- Menu de fila se cierra al pulsar fuera, elegir una accion o presionar Escape.
  Eventos se retiran al desmontar la vista y Escape devuelve foco al disparador.

## 2026-10-26 - Etiquetas Con Listado Lateral Y Detalle

- Diseno segun referencia: barra de empresa, conteo y buscador global;
  lista de etiquetas a la izquierda y detalle de activos asignados a la derecha.
- Buscadores por etiqueta y activo, orden por columnas, paginacion, seleccion,
  estado real del activo y menu con Ir a ficha y Quitar de etiqueta.
- Conserva modal existente, asignaciones, auditoria, permisos y datos compartidos.

## 2026-10-26 - Seleccion Inicial De Empresa Con Activos En Etiquetas

- En plataforma la seleccion inicial prioriza una empresa con activos visibles,
  en lugar de la primera empresa vacia. Selector muestra conteos por empresa.
- No mezcla datos ni crea vehiculos en empresas vacias; respeta seleccion manual
  posterior y rutas de cliente.

## 2026-10-26 - Datos De Ejemplo Para Etiquetas

- Etiquetas existentes Supervisores, Faena Norte y Contratistas reciben
  asignaciones a siete activos actuales de company-001, sin crear dispositivos.
- Migracion unica conserva etiquetas personalizadas y no repone asignaciones
  que luego quite el usuario; no enlaza etiquetas eliminadas ni de otra empresa.

## 2026-10-26 - Etiquetas En Configuracion

- Reutiliza el panel y modal existentes de Activos para copiar la referencia:
  cabecera, Nueva etiqueta, conteos, filas con estado y acciones, pie paginado.
- Crear, editar, asignar y eliminar usan la base compartida y auditoria;
  comprobaciones de empresa, alcance de activos y permisos en cada operacion.
- Selector de empresa solo en plataforma; cliente usa empresa de su ruta.

## 2026-10-26 - Retirado Aviso De Vehiculos Sin Tipo

- Eliminados cuadro y panel lateral de Limites. El formulario normal siempre
  asigna un tipo; se conserva validacion defensiva de informes.
- Retirada prueba de MAES-01 y GKZK-26: restaura el tipo por defecto anterior
  solo si siguen en estado de prueba, sin sobreescribir correcciones del usuario.

## 2026-10-26 - Icono De Pendientes En Limites

- Cambiado icono del encabezado Vehiculos sin tipo por triangulo de advertencia,
  manteniendo los iconos de las filas y el funcionamiento del panel.

## 2026-10-26 - Pendientes Con Dos Activos Existentes

- MAES-01 y GKZK-26 se dejan sin tipo valido para visualizar pendientes de
  Limites usando sus IDs, nombres y fichas existentes, sin crear dispositivos.
- Migracion unica por activo para datos ya guardados; asignar un tipo en la
  ficha se conserva al recargar y elimina el pendiente.

## 2026-10-23 - Pendientes Solo Con Activos Existentes

- Retirados los dos equipos inventados para Limites de la semilla y migrados
  sus dos IDs exactos fuera de la coleccion persistida, sin borrar otros activos.
- El panel conserva el filtro real por tipo y permisos; no fuerza pendientes.

## 2026-10-23 - Ir A Ficha Abre El Vehiculo En Activos

- Enlace de pendientes incluye apertura explicita asset-detail. Activos
  selecciona el ID autorizado y abre su ficha de edicion con permiso de gestion.
- No altera enlaces de itinerarios ni habilita edicion a usuarios de solo lectura.

## 2026-10-23 - Precio Del Combustible Compacto Y Explicito

- Sustituido bloque alto por franja horizontal con precio por litro y finalidad
  de estimar costo del ralenti. Aclara que el ejemplo no se aplica a informes.

## 2026-10-23 - Precio De Referencia Sobre La Tabla De Consumo

- Trasladado precio a la esquina superior derecha de la tabla de consumo,
  con importe destacado y fecha real o etiqueta Demostracion. Sin cambios al calculo.

## 2026-10-23 - Valor Demostrativo Del Precio Por Litro

- Consumo muestra $1548 por litro como ejemplo si no hay precio registrado,
  identificado como demostracion. No sustituye precios reales ni se persiste
  como si proviniera de un informe ejecutado.

## 2026-10-23 - Precio De Combustible Solo Con Datos

- Ocultada linea de ultimo precio cuando no existe registro; conserva importe
  y fecha reales cuando estan disponibles, sin afirmar ejecucion programada.

## 2026-10-23 - Aviso Informativo Al Pie De Limites

- Trasladado aviso azul debajo de la tabla, antes de las acciones de guardado.

## 2026-10-23 - Pestanas De Limites Como Mantenciones

- Velocidad y consumo usan pestanas planas compactas sin tarjetas ni iconos,
  con seleccion mediante subrayado naranja y tipografia de Mantenciones.

## 2026-10-23 - Revision De Pendientes En Panel Lateral

- Sustituido modal por panel lateral derecho con tabla visible a la izquierda,
  buscador, paginacion, cierre y enlaces Ir a ficha al activo correspondiente.
- Revisar pendientes usa acento naranja; en pantallas pequenas el panel se
  superpone para conservar legibilidad sin comprimir la tabla.

## 2026-10-23 - Diseno Del Cuadro Y Modal Sin Tipo

- Aviso compacto en tono preventivo y modal con encabezado, buscador con icono,
  filas con patente y estado, y pie de paginacion separado. Mantiene funciones.

## 2026-10-23 - Cuadro De Vehiculos Sin Tipo Con Listado Separado

- Cuadro compacto con total y boton Ver vehiculos; nombres en modal nativo
  con buscador y paginacion de ocho registros, sin expandir la tabla principal.

## 2026-10-23 - Aviso Visible De Vehiculos Sin Tipo

- Aviso destacado sobre la tabla de velocidad, con cantidad, exclusion del
  informe y despliegue de nombres. Conserva alcance y permisos actuales.

## 2026-10-23 - Dos Equipos Demo Sin Tipo Para Limites

- Agregados Equipo prueba 1 y 2 (DEMO) a company-001, sin tipo valido, para
  visualizar el aviso real y desplegar los nombres en Limites. No simulan excesos.
- La semilla se incorpora por ID sin borrar activos ni cambios existentes.

## 2026-10-23 - Ajuste Visual Del Bus En Limites

- Ampliado solo el dibujo del bus un 45%, manteniendo el espacio de su celda
  y la alineacion de nombres y controles.

## 2026-10-23 - Iconos De Vehiculos Mas Visibles En Limites

- Imagenes ampliadas a 54 x 40 px y 44 x 34 px en movil, conservando proporcion.
  Sin cambios al texto, controles ni guardado.

## 2026-10-23 - Limites Aprovecha La Altura Disponible

- En escritorio el panel y la tabla crecen con el espacio disponible; las filas
  reparten la altura restante, manteniendo controles, texto y encabezado compactos.
- En movil y ventanas bajas se conserva la distribucion natural del contenido.

## 2026-10-23 - Tablas De Limites Ajustadas Al Espacio

- Tabla a todo el ancho, columnas redistribuidas y filas compactas de 46 px.
- Reducidos espacios de aviso y acciones para mostrar ocho tipos de consumo
  sin scroll en escritorio estandar. Eliminado ancho minimo de 760 px en movil;
  se conserva acceso al contenido en ventanas pequenas sin ocultarlo.

## 2026-10-23 - Pestanas De Limites Mas Compactas

- Reducida altura de 76 a 56 px, texto de 20 a 16 px e iconos de 36 a 26 px.
  Ajustados espaciados y tamanos moviles sin cambiar comportamiento.

## 2026-10-23 - Limites Sin Navegacion Superior Duplicada

- Retirados el encabezado Configuracion y los accesos horizontales superiores.
  Se mantienen la sidebar, las pestanas velocidad/consumo y el guardado.

## 2026-10-23 - Limites Con Pestanas Y Guardado Explicito

- Nueva distribucion segun referencia: dos pestanas, aviso informativo y tabla
  con tipo, vehiculos, valor, unidad y nota. Reutiliza imagenes de Activos.
- Guardar cambios valida y persiste el borrador completo en una sola escritura;
  detecta conflictos entre ventanas y conserva el borrador ante errores.
- Restablecer elimina los valores propios del parametro seleccionado sin
  persistir hasta confirmar. Aviso al navegar con cambios sin guardar.
- Conserva permisos, conteos reales, herencia y detalle de activos sin tipo.

## 2026-10-19 - Activos Con Datos Fechados Para Probar Sin Reportar

- Semilla compartida de Activos completa reportes mock: offline con 2/4/8/15/30 dias
  y horas adicionales; online con 1-5 minutos antes de snapshot. Fechas completas
  Chile y timestamps ISO, sin dejar datosUlt solo como hora. Fecha antigua explicita
  como 11-05-2026 se conserva en su calendario y zona, no se convierte a hoy.
- Escenarios demo de alimentacion externa 0 V, SIM ausente, sin registro movil y
  causa no determinada. No afirma que sean mediciones reales ni infiere desde CAN.
- Migracion solo de fixtures seed conocidos source mock-database sin reporte
  explicito; preserva campos/editados, fechas completas, telemetria, reportes null
  deliberados y activos API/personalizados. Persiste assets una vez para estabilizar
  snapshot entre recargas; no limpia almacenamiento, consultas ni historial.
- Al completar fecha vieja previamente desconocida, lifecycle no crea recuperacion
  ficticia: mantiene incidencia abierta y consultas existentes. Prueba de integracion.
- Archivos: nuevo mockAssetReporting.js/prueba, mockDatabase.js, useMockDatabase.js,
  unreportedHistory.js, prueba adapter y README data/mock/utils/services.
- Para ver cambios de registros ya cargados se requiere recargar aplicacion.
  Sigue siendo informacion de demostracion del emulador, no conexion GPS productiva.
- Validacion: 398 pruebas aprobadas, build correcto y diff sin errores de espacios.
  No se inicia servidor adicional; verificados fixtures y migracion mediante pruebas.

## 2026-10-19 - Quitar Proxima Llamada Y Llamar Manana Del Formulario

- Eliminados campo de fecha y boton solicitados, borrador asociado, handler y CSS.
  Cuatro campos principales en dos columnas; fecha de visita permanece.
- No se eliminan fechas ya guardadas ni su lectura historica/Excel. Store compatible.
- Archivos: OperationModal.vue/prueba, View.test.js y README componentes/vistas.

## 2026-10-19 - Corregir Recorte Y Reducir Costo Visual Del Modal

- Eliminado blur del backdrop, sombra simplificada, encabezado y espacios compactos.
  No se atribuye toda la lentitud al blur sin perfil de pagina completa.
- Retirado min-height 100% del panel de visita, altura border-box y sin estirar filas
  del grid. Observacion 80 px con contador absoluto; texto legible y campos completos.
- Campos en tres columnas para escritorio ancho/bajo, contacto compacto por altura;
  movil sigue apilado con scroll central. Cabecera y acciones siempre separadas.
- Comprobacion visual real del componente aislado usando Edge headless por archivo
  local, sin servidor: captura escritorio 1366x768 con observacion/acciones completas
  y movil 500x844 con scroll funcional. Simuladas actualizaciones de textarea/contador,
  sin usar sus tiempos virtuales como benchmark. Fixture temporal en cache ignorada.
- Archivos: OperationModal.vue/prueba y README componentes. Sin cambios de datos.
- Validacion: 394 pruebas aprobadas, build correcto y ESLint sin errores (advertencias
  de formato). No se levanto servidor adicional.

## 2026-10-19 - Revisar Equipo Segun Referencia Visual

- Cabecera con icono, nombre, tipo del activo y estado real, contacto y telefono
  diferenciados. No se inventa estado Operativo ni personas de contacto.
- Editor en columna izquierda con Informacion de consulta y Observacion separada
  (contador 500); columna derecha de visita desplegable abierta al entrar.
  Guarda payload/validaciones anteriores, incluyendo persona/cargo y proxima llamada.
- Pestañas azules, Cancelar a izquierda y Guardar a derecha. Cabecera/footer visibles;
  modal hasta 1380x960 limitado a ventana y responsive con columnas apiladas.
- Resumen permanece inicial, historico de consultas y simulacion sin cambios.
  Solo OperationModal.vue, prueba y README componentes; sin cambios de persistencia.
- Validacion: 394 pruebas aprobadas, build correcto y ESLint sin errores (advertencias
  de formato). Sin comprobacion visual automatizada ni servidor adicional.

## 2026-10-19 - Modal Revisar Equipo Mas Amplio

- Aumentado maximo de 680x600 a 980x820 px, limitado a ventana menos 32 px.
  Contacto/telefono alineados si hay ancho; resumen mantiene letras legibles 14/16.
- Formulario en columnas: datos de consulta/persona a izquierda y seguimiento/visita
  a derecha. Observacion a ancho de su seccion. Responsive apila a 780/540 px.
- Form sin scroll propio, header/footer visibles y scroll solo en contenido si hace
  falta. No se promete ausencia de scroll con pantallas pequeñas o textos ilimitados.
- Archivos: OperationModal.vue, nueva prueba y README componentes. Datos sin cambios.
- Validacion: 394 pruebas aprobadas, build correcto y ESLint sin errores en archivos
  tocados (advertencias de formato). Sin verificacion visual automatizada ni servidor.

## 2026-10-19 - Persona Contactada Y Cargo En Cada Consulta

- Formulario agrega Hablo con y Cargo opcionales (100/80 caracteres), inicialmente
  vacios: no supone que respondio contacto maestro ni el operador que registra.
- Store valida/recorta antes de commit y conserva campos en consulta por episodio;
  author sigue siendo operador. Datos antiguos siguen compatibles sin migracion.
- Consultas y detalle historico muestran interlocutor; Excel operativo/agrupado y
  hojas auxiliares lo incluyen en Observaciones/textos existentes, sin columnas nuevas.
- Archivos: OperationModal.vue, HistoryDetail.vue, lifecycleStore.js/prueba,
  unreportedFlow.js/prueba, pruebas Excel/vista y READMEs de cuatro carpetas.
- Pruebas de guardado/recarga, campos opcionales, limites, autor independiente y
  presencia en exportaciones; sin cambios al contacto de Empresas ni conectividad.
- Validacion: 393 pruebas aprobadas y build correcto. Sin comprobacion visual
  automatizada del formulario ni servidor adicional.

## 2026-10-19 - Historial Excel Agrupado Por Equipo Con Formato Compartido

- Ajuste solicitado: mantiene logo/colores/margenes/fuentes del reporte operativo,
  separa historial por equipo con banda nombre/IMEI/empresa y contador; debajo,
  encabezados y filas de sus desconexiones. Espacio visible antes del siguiente.
- Nueve columnas de episodio B:J sin repetir identidad, margenes iguales A/K;
  mantiene fechas, evidencia y todas las consultas/seguimientos/visitas del caso.
- Encabezado general 1:5 congelado/repetido; no fija ni repite primer equipo al
  imprimir todos. Sin filtro global sobre bloques; hojas auxiliares siguen filtrables.
- Reporte de equipos actual no cambia. Archivos: generador compartido, pruebas Excel
  y README servicios. Reemplaza organizacion historica plana, sin borrar informacion.
- Validacion: 390 pruebas aprobadas, build correcto y ESLint limpio en archivos
  tocados. Verificados grupos, separadores, encabezados y reapertura de XLSX;
  sin comprobacion visual automatizada en Excel ni servidor adicional.

## 2026-10-19 - Excel De Historial Igual Al Formato De Equipos Sin Reportar

- Unificados logo/margenes/fecha/fuentes/estilos en generador continuous existente;
  eliminada implementacion historica duplicada por bloques. Wrapper conserva API.
- Historial: una fila por episodio terminado, tabla continua filtrable B6:L,
  columnas inicio/retorno/duracion y evidencia del caso. Todas las llamadas se
  conservan numeradas, con proximas llamadas y resultado de visitas. No se sustituyen
  por la ultima consulta actual del equipo ni se inventan inicios desconocidos.
- Conserva worker, hojas auxiliares, limites de impresion, margenes simetricos y
  logo centrado al 85%. Reporte operativo mantiene sus 10 columnas y formato previo.
- Archivos: unreportedContinuousReportSheet.js, unreportedReportSheet.js,
  pruebas Excel/exportWorker y README servicios. Sin datos eliminados ni servidor.
- Validacion: 390 pruebas aprobadas, build correcto y ESLint sin errores/advertencias
  en archivos tocados. Pruebas comparan estilos compartidos y reabren XLSX con todas
  las llamadas; sin comprobacion visual automatizada en Excel.

## 2026-10-19 - Verificacion De Reincidencia En Maquinaria Forestal

- Prueba con activo actual IMEI 868123450009 confirma que, tras ejecutar nueva
  desconexion demo, aparece en busqueda activa y conserva un caso cerrado y otro
  abierto. Tres pruebas del adaptador aprobadas. No se reprodujo fallo de transicion.
- No se modifica estado del navegador: buscar IMEI no activa simulacion. La accion
  sigue en Historial > Ver desconexiones > Simular nueva desconexion (demo).
- Solo prueba/README/bitacora; sin cambios de funcionamiento ni servidor nuevo.

## 2026-10-19 - Simular Nueva Desconexion Despues De Recuperacion

- Aniadido boton de desarrollo en ficha historica de equipo recuperado/reportando.
  Abre caso independiente marcado demo, vuelve a bandeja por empresa/IMEI y conserva
  primer episodio/consultas. No simula cambios en navegador sin accion del usuario.
- Store requiere acceso y allowSimulation explicito; singleton solo en desarrollo.
  Mantiene fechas reales, permite prueba bajo umbral y cierra al recibir nuevo
  reporte posterior. No afecta umbral ni correccion de paquetes de casos normales.
- Diagnostico indica simulacion, sin afirmar causa GPS real. Decision nueva pendiente.
- Archivos: lifecycleStore.js/prueba, history.js, HistoryDetail.vue, View.vue y README.
- Validacion: compilacion correcta y prueba de dos ciclos con consultas preservadas;
  ESLint de archivos tocados sin errores (advertencias de formato). Sin nuevo servidor
  ni acceso directo al localStorage del navegador del usuario.

## 2026-10-19 - Sin Reportar Con Activos Actuales

- Retiradas nueve filas estaticas y equipos demo inyectados al historial. Origen
  reactivo: visibleAssets + accessibleCompanies, respetando alcance por activo.
- Nuevo unreportedAssetsSource.js/prueba adapta empresa/IMEI, nombre, patente,
  ubicacion, icono/tipo y reportes reales del catalogo; sin inventar voltajes/fechas.
- datosUlt con hora sola no se convierte a hoy: offline queda con fecha desconocida;
  activo no offline sin fecha suficiente no se agrega como desconectado.
- Historial guardado no se elimina: ausentes quedan archivados fuera de bandeja.
  Antecedentes archivados solo para plataforma admin; otros usuarios conservan
  historial de activos actualmente visibles, sin ampliar sus permisos.
- Cambios de Activos recalculan origen y ciclo de reportes; prueba de cierre por
  nuevo reporte conserva voltaje/consultas del caso anterior. No inicia telemetria
  ficticia ni un backend nuevo. Imagen/contacto siguen reutilizando catalogos.
- Archivos: UnreportedView.vue/prueba, nuevo adaptador/prueba, README vistas/servicios.
- Validacion: 387 pruebas aprobadas, build correcto y ESLint sin errores (advertencias
  de formato). Sin verificacion visual automatizada ni servidor adicional.

## 2026-10-19 - Respaldo De Imagen Para Registros Sin Activo Coincidente

- Corregido fallback neutro mostrado para registros mock de Sin reportar cuyos
  IMEI no existen en Activos. Ahora precarga/usa imagen predeterminada del mismo
  selector de Activos; configuracion real sigue teniendo prioridad si hay vinculo.
- No cambia IMEI, empresas ni inventa activos/asociaciones por nombre. El icono
  neutro queda reservado a errores de carga. Archivos: vista/prueba y READMEs.

## 2026-10-19 - Imagenes De Sin Reportar Vinculadas A Activos

- Reemplazada seleccion auto/camion por nombre por el selector compartido de Activos
  getAssetImageMarkerVariant. Respeta mapIcon y tipo configurados del activo real.
- Vinculo por empresa autorizada + IMEI textual, no nombre; indice reactivo y sin
  asociar duplicados ambiguos. Cambios de icono se reflejan sin copias en historial.
- Precarga fuentes configuradas con tamano estable; icono neutro sin activo/imagen,
  incluidos demos no asociados. Sin cambios de datos, identidades o mantenimiento.
- Archivos: UnreportedView.vue/prueba, unreportedAssetImages.js/prueba y READMEs.
- Validacion: 385 pruebas aprobadas, compilacion correcta y ESLint sin errores
  en archivos tocados (advertencias de formato). Sin prueba visual ni otro servidor.

## 2026-10-19 - Equipos Recuperados Mas Recientemente Primero

- Historial cambia orden predeterminado a ultima recuperacion descendente, no
  inicio del corte. Columna Volvio a reportar muestra/ordena esa fecha coherente.
- Se conserva orden manual por encabezados; simulacion restablece predeterminado.
- Archivos: UnreportedView.vue/prueba, unreportedSorting.js/prueba y READMEs.
  No modifica registros historicos, filtros ni exportacion.

## 2026-10-19 - Reporte Simulado Y Primer Reporte Visibles En Historial

- Simulacion confirma recepcion, quita filtros que ocultaban el resultado y abre
  directamente equipo por empresa/IMEI tras flush de watchers. Errores sin exito falso.
- Nunca reporto ahora conserva su primer reporte como caso first_report; fecha
  recibida conocida, inicio y duracion null. Consultas sin ID hasta recepcion quedan
  vinculadas. Presentacion/Excel: Sin reporte previo / Inicio desconocido.
- Busqueda/contador incluye ese caso por fecha de recepcion sin inventar fecha de
  desconexion. Historial fechado previo no cambia. Primeros reportes ya guardados
  con historial inicializado, recovered y duracion null se recuperan una sola vez
  si no existia ningun episodio; sin borrar consultas ni duplicar al actualizar.
- Archivos: UnreportedView.vue/prueba, unreportedHistory.js/prueba,
  unreportedHistorySearch.js/prueba, useUnreportedHistoryPresentation.js/prueba,
  lifecycleStore.test.js y exportadores de hojas Reporte/datos. READMEs actualizados.
- Validacion: compilacion correcta, ESLint sin errores (advertencias de formato),
  pruebas de simulacion, consulta asociada, recarga y recuperacion sin duplicados.
  No se inicia servidor ni se afirma verificacion visual del navegador.

## 2026-10-19 - Contacto De Empresa En Revisar Equipo

- Cabecera muestra nombre y telefono del contacto con enlace tel: cuando el numero
  es valido. Faltantes explicitos, sin contactos inventados ni datos de otra empresa.
- Reutiliza companyRecords de useCompaniesService, reactivo y limitado a empresa
  autorizada. No duplica datos por vehiculo ni crea otro almacen/editor; se edita
  desde Empresas. Coincidencia por nombre exacto; duplicados no se resuelven a ciegas.
- Archivos: UnreportedView.vue/prueba, UnreportedOperationModal.vue, nuevo helper
  unreportedCompanyContact.js/prueba y README de vistas, componentes y utils.
- Validacion: 377 pruebas aprobadas, build correcto y ESLint de archivos tocados
  sin errores (advertencias de formato). Sin verificacion visual ni nuevo servidor.

## 2026-10-19 - Consultas Por Desconexion, Proxima Llamada Y Resultado De Visita

- Listado, filtro Sin consultar, modal y Excel operativo seleccionan consultas del
  episodio abierto. ID explicito tiene prioridad; legacy se asocia por rango.
  Consultas anteriores se conservan completas en historial y hoja de datos.
- Registrar consulta permite proxima llamada opcional y boton Llamar manana, usando
  calendario Chile. Listado muestra Llamada pendiente en rojo al vencer (sin alertas
  automaticas ni cambios al orden de prioridad existente).
- Apartado plegable de visita realizada captura fecha y resultado; decision de
  terreno sigue explicita. Guardar visita no marca recuperado ni altera GPS.
- Store valida fechas reales y rangos, enums y guarda campos con commit atomico
  existente. Registros anteriores siguen compatibles. Sin migracion destructiva.
- Resumen/modal, historial y Excel muestran campos; se reutilizan Observaciones y
  textos actuales sin agregar columnas, filtros o pestanas. Modal mantiene tamano.
- Archivos: unreportedFlow.js/prueba, unreportedLifecycleStore.js/prueba,
  UnreportedView.vue/prueba, UnreportedOperationModal.vue, UnreportedHistoryDetail.vue,
  exportador y hojas continuous/report de Excel con prueba. READMEs de cuatro
  carpetas actualizados. No se implementa edicion de consultas ni backend real.
- Validacion: 374 pruebas aprobadas, compilacion correcta y git diff --check sin
  errores. Sin verificacion visual automatizada; no se inicia servidor adicional.

## 2026-10-16 - Eficiencia De Sin Reportar, Punto 5: Actualizar Sin Espera Ficticia

- UnreportedView.refreshData elimina setTimeout de 800 ms. nextTick conserva
  actualizacion del boton sin demoras fijas; guardia de doble ejecucion y finally.
- Limpia error/aviso anterior, conserva error de observeReports y solo muestra
  Listado actualizado si no hubo fallo. Recalcula datos locales; no implica obtener
  nueva telemetria de un GPS o consultar un backend. Intervalo de 60 s sin cambios.
- Archivos: UnreportedView.vue/prueba y README de vistas. Test cubre exito, error,
  doble ejecucion y liberacion por excepcion, sin esperar tiempos reales.
- Validacion: 369 pruebas aprobadas y build correcto. Sin prueba visual ni servidor
  nuevo. Completados los cinco puntos del analisis; persistencia sigue siendo local.

## 2026-10-16 - Eficiencia De Sin Reportar, Punto 4: Excel

- Eliminada creacion de 16373 columnas vacias ocultas L:XFD del reporte historico.
  Solo A:K; misma impresion, margenes y contenido. Fuera del reporte quedan celdas
  normales visibles, igual que operativo, sin corte oscuro por columnas ocultas.
- Nuevos unreportedExcelWorkerClient.js y unreportedExcelWorker.js: snapshot sin
  proxies, logo cargado en navegador, generacion de hojas y compresion fuera del
  hilo principal. ArrayBuffer transferible; worker termina en exito/error.
- UnreportedView usa cliente nuevo, conserva filtros, mensajes y estado de exportar.
  Servicio acepta brandImage opcional y evita diagnostico duplicado por episodio.
  Sin Worker mantiene ruta compatible; errores reales se notifican sin doble trabajo.
- Conservadas hojas Reporte, resumen y datos historicos; pruebas de libro reabrible,
  IMEI textual, consultas, evidencia, columnas, limpieza y errores del worker.
- Validacion: 368 pruebas aprobadas y build incluye asset del worker. READMEs de
  servicios/vistas actualizados. Sin verificacion visual en navegador.
- Desplegar dist completo; CSP, si existe, debe admitir worker-src 'self'.
  Preparacion/snapshot aun en interfaz; memoria sigue proporcional a datos elegidos.
  No se cambia punto 5 ni se levanta servidor/proceso persistente.

## 2026-10-16 - Eficiencia De Sin Reportar, Punto 3: Detalles Bajo Demanda

- UnreportedHistoryDetail prepara una vez diagnostico, fechas, duracion y voltajes
  de cada fila visible mediante useUnreportedHistoryPresentation. Formateadores
  Intl reutilizados; no se calcula presentacion de paginas no visibles.
- Contenido GPS/llamadas se monta solo al desplegar con toggle nativo. Llamadas
  computed diferidas, cacheadas y reactivas a nuevas consultas; cada caso conserva
  su asociacion por ID o rango legado. Sin cambios de datos, estilos o exportacion.
- Cambio de pagina/orden reinicia desplegables; se mantienen multiples abiertos y
  teclado nativo. Nuevas pruebas de carga diferida, cache, actualizacion y paginas,
  ademas del contrato de plantilla. READMEs de componentes/composables actualizados.
- Validacion: 365 pruebas aprobadas, ESLint sin errores, build correcto y diff sin
  errores de espacios. Sin verificacion visual automatizada ni servidor nuevo.

## 2026-10-16 - Eficiencia De Sin Reportar, Punto 2: Guardado Por Equipo

- Sustituida reescritura del JSON global por secciones empresa/IMEI, reutilizando
  createCollectionDatabaseStorage existente. Solo equipo cambiado y manifiesto.
- Lifecycle marca claves afectadas explicitamente en observacion, reportes y llamadas
  (tambien helpers legados). Sin cambios, no escribe. Memoria cambia solo tras commit.
- Snapshot plano anterior compatible; migracion completa una sola vez y eliminacion
  del antiguo solo despues de confirmar. Fallo mantiene anterior, sin media transaccion.
- Cuota/almacenamiento bloqueado informan fallo sin perder memoria/datos; estado
  ilegible no puede sobrescribirse silenciosamente. No se cambia almacenamiento global.
- Prueba sintetica con 200 equipos/10000 episodios: 2111517 bytes en guardado global
  frente a 35965 bytes (equipo + indice) por un cambio, 98,3% menos JSON escrito.
  Usa clave real y UUID de secciones; no mide velocidad de navegador ni aumenta cuota.
- Archivos: nuevos unreportedStateStorage.js/prueba, unreportedLifecycleStore.js y
  README de servicios. Sin cambios visuales, exportacion ni otros puntos pendientes.
- Sigue siendo almacenamiento local y carga inicial completa. Migracion requiere
  espacio temporal; persistencia compartida/crecimiento productivo necesita API/BD.
- Validacion: 362 pruebas aprobadas, ESLint sin errores y build correcto.
  Probados migracion, fallo a mitad de lote, cuota/manifest, permisos, limpieza,
  recarga, datos ilegibles protegidos y ausencia de escrituras cuando no hay cambios.

## 2026-10-16 - Eficiencia De Sin Reportar, Punto 1: Calculo Historico

- Separados origen historico ligero, contador y agrupacion detallada. El contador
  no ordena episodios ni carga llamadas; historial detallado solo al abrir su pestaña.
- Busqueda/empresa antes de agrupar; contador mantiene alcance empresa/periodo,
  como antes. Sin filtros de fecha se evita formatear cada fecha a calendario Chile.
- Llamadas asociadas en una pasada por ID; casos legados conservan rango temporal
  inclusivo, orden y duplicados. Sin cambios a los datos o a permisos.
- Resumen de recuperaciones fuera del refresco operativo; se calcula al exportar.
- Comparacion sintetica local, mismo proceso y datos: 1000 equipos/100000 episodios,
  agrupacion anterior 859 ms y nueva 235 ms; contador 0,75 ms; busqueda de un equipo
  antes de agrupar 0,62 ms. No representa una medicion completa del navegador.
- Archivos: UnreportedView.vue/prueba, unreportedHistorySearch.js/prueba,
  servicio Excel/prueba y README de carpetas. Solo punto 1; no se modificaron
  almacenamiento, renderizado de desplegables ni generacion de hojas de Excel.
- Validacion: 354 pruebas aprobadas, ESLint sin errores y build correcto.
  Verificados contador reactivo sin llamadas, filtro previo, equivalencia de llamadas
  legadas y resumen de exportacion bajo demanda. Revision visual pendiente.

## 2026-10-16 - Logo Un Poco Menor Sin Mover Su Centro

- Logo operativo reducido 15% y centrado con la misma formula en ambos ejes.
- Cabecera, margenes, tabla y datos sin cambios.
- Archivos: unreportedContinuousReportSheet.js y README de servicios.

## 2026-10-16 - Margenes Simetricos Y Logo Que Aprovecha Su Celda

- Unificada medida de ambos margenes y calculo de ancho; retirado descuento adicional
  de 48 px al ancho de pantalla. Impresion centrada horizontalmente con margenes iguales.
- Logo ajustado/centrado a B1:B2, respetando proporcion real PNG 2800:900, en vez de
  medida fija pequena. Cabecera adapta altura con limite compacto; sin estirar imagen.
- Datos, letras mayores, tabla continua y columnas posteriores visibles conservados.
- Archivos: unreportedContinuousReportSheet.js, vista, prueba Excel y README locales.
- Validacion: 19 pruebas enfocadas aprobadas, ESLint sin errores y build correcto.
  Verificados margenes, centrado de impresion y logo proporcionado dentro de su area.
  Revision visual en Excel pendiente.

## 2026-10-16 - Letras Mayores En Excel Operativo

- Datos/nombre/encabezados de tabla 12 pt, IMEI 11 pt, titulo 17 pt.
- Alturas y calculo de lineas ajustados para evitar corte con fuentes mayores.
- Sin cambios a datos, columnas, filtros, zoom o historial.
- Archivos: unreportedContinuousReportSheet.js, prueba Excel y README de servicios.
- Validacion: 8 pruebas Excel aprobadas y build correcto. Revision visual pendiente.

## 2026-10-16 - Espacio Negro A La Derecha Del Excel

- Causa: columnas posteriores a L ocultas y ancho calculado desde navegador reducido.
- Reporte operativo deja visibles columnas posteriores; impresion limitada al reporte.
- Ancho minimo 1800 px y contexto de pantalla disponible para aprovechar Excel grande,
  sin aumentar fuente/zoom ni modificar datos. Margenes izquierdo/derecho iguales.
- Archivos: unreportedContinuousReportSheet.js, prueba Excel, vista y README locales.
- Validacion: 19 pruebas enfocadas aprobadas y compilacion correcta; verificados
  anchos pequeno/grande, columnas visibles y area de impresion. Revision visual pendiente.

## 2026-10-16 - Excel Operativo En Una Tabla Continua

- Redisenada solo hoja Reporte de EQUIPOS SIN REPORTAR, siguiendo solicitud adjunta.
- Un encabezado y una fila por equipo, diez columnas; sin bandas por vehiculo,
  sin Conectividad, sin columna separada IMEI ni espacios entre registros.
- Logo 120x38, titulo/subtitulo compactos, total/contexto y fecha en una misma linea;
  separador fino azul con acento naranja y margenes simetricos.
- Nombre en negrita e IMEI secundario en misma celda; tiempo destacado, fecha/hora
  en dos lineas, ultima llamada por fecha, autor debajo y campos vacios simplificados.
- Colores suaves solo en diagnosticos relevantes, filas casi blancas alternadas,
  bordes horizontales, alineacion central vertical y alturas ajustadas al contenido.
- Autofiltros sobre toda tabla, encabezado congelado y ancho proporcional legible.
- Historial, hojas de datos, filtros/seleccion, informacion original y todas las
  llamadas conservados. No se modifica almacenamiento ni se inicia servidor.
- Archivos: nuevo unreportedContinuousReportSheet.js, dispatcher unreportedReportSheet.js,
  pruebas de Excel y README de servicios. Sin cambios a vistas ni otros modulos.
- Prueba con 100 equipos guarda/reabre XLSX y verifica continuidad, logo, margenes,
  ultimo contacto, IMEI con ceros, valores literales y datos auxiliares preservados.
- Validacion: 346 pruebas aprobadas, ESLint sin errores, build correcto y diff
  sin errores de espacios. Revision visual del archivo en Excel pendiente.

## 2026-10-15 - Excel De Sin Reportar Con Estilo De Mantenciones

- Nueva hoja principal Reporte en equipos e historial: logo oficial, titulo, fecha,
  separador azul/naranja, bandas por equipo e IMEI/empresa, margenes simetricos.
- Historial: fechas, duracion, diagnostico/evidencia y llamadas numeradas por caso;
  sin reportar: estado, tiempo, ultimo reporte y consultas. Observaciones completas.
- Filas alternadas, altura automatica, texto envuelto, zoom 85%, ancho adaptable y
  configuracion horizontal de impresion. Cuadricula sobrante oculta en Reporte.
- Hojas de datos conservadas con filtros y estilos de lectura, sin mover columnas.
- Contexto de filtros/fechas/ancho capturado antes de importar; datos DEMO identificados.
- Archivos: nuevo unreportedReportSheet.js, servicio Excel/prueba, vista y README locales.
- Pruebas comprueban cabecera, logo incrustado, margenes, llamadas, orden de hojas,
  seguridad de texto y serializacion/reapertura XLSX con datos completos.
- Validacion: 345 pruebas aprobadas, ESLint sin errores y build correcto.
  Revision visual en Excel pendiente; no se iniciaron servidores.

## 2026-10-15 - Exportacion Sin Error Con Equipos Demo

- Causa: lectura row.diagnosis.reason en equipos historicos/DEMO sin diagnosis,
  ejecutada antes del try/finally; podia dejar Exportando activo.
- Conversion centralizada en prepareUnreportedExcelRows, con diagnostico opcional,
  fechas y valores faltantes seguros. Preparacion/importacion dentro de try/finally.
- Conservados periodo, equipo seleccionado y diagnosticos propios de cada episodio.
- Archivos: UnreportedView.vue/prueba, servicio Excel/prueba y README de carpetas.
- Pruebas generan archivo real con 12 equipos y 59 episodios, y una ficha filtrada.
- Validacion: 343 pruebas aprobadas, ESLint sin errores y compilacion correcta.
  Generacion XLSX verificada; descarga interactiva en navegador pendiente.

## 2026-10-15 - Limpiar Filtros Sin X

- Retirado icono X del boton Limpiar filtros de Sin reportar, sin cambiar su accion.
- Archivos: UnreportedView.vue y README de vistas. Ajuste solo visual.

## 2026-10-15 - Tablas Sin Superposicion En Ventanas Estrechas

- Anchos minimos por columna y contenido completo desplazable, cabecera alineada.
- Filas en flujo normal con altura automatica/minimo 92 px para texto de varias lineas.
- Footer fuera del scroll horizontal/vertical de tabla; controles envuelven sin cortarse.
- Filtros plegables bajo 1280 px para dejar ancho a equipos e historial; valores intactos.
- Raiz con altura acotada para evitar que el cuerpo desborde el espacio disponible.
- Archivos: UnreportedView.vue/prueba y README de vistas. Sin cambios de datos.
- Validacion: 340 pruebas aprobadas, ESLint sin errores y build correcto.
  Comprobacion visual al redimensionar navegador pendiente; sin servidores nuevos.

## 2026-10-15 - Estilo De Ficha Historica Segun Referencia

- Filas compactas, fechas y duracion alineadas, cabecera mas ajustada.
- Apertura blanca con GPS y llamadas en columnas separadas por linea vertical;
  se apilan en pantallas pequenas. Retirada linea naranja lateral.
- Punto naranja para alimentacion desconectada; valores externos/internos alineados
  desde telemetria propia. Otros motivos mantienen evidencia sin reinterpretar causas.
- Llamadas con autor/fecha, situacion/decision en la misma fila y observacion debajo.
- Ficha inicia en 20 por pagina; mantiene desplegables y cabecera con scroll.
- Archivos: UnreportedHistoryDetail.vue/prueba y README de componentes.
- Validacion de esta referencia: prueba del componente y build aprobados;
  ESLint sin errores. Revision visual en navegador pendiente.

## 2026-10-15 - Cabecera Historica Sin Fijar

- Cabecera de equipo, contador y Volver a resultados dentro del scroll de episodios.
- Paginacion conservada fuera del scroll. Sin cambios de datos ni de navegacion.
- Archivos: UnreportedHistoryDetail.vue/prueba y README de componentes.
- Validacion: prueba del componente aprobada y compilacion correcta; revision visual pendiente.

## 2026-10-15 - Filas Desplegables En Ficha Historica

- Detalle de desconexion cerrado inicialmente con fechas, duracion y motivo resumido.
- Abrir fila despliega evidencia GPS y llamadas separadas: autor/fecha, situacion,
  decision y observacion. Varias filas pueden permanecer abiertas para comparar.
- Chevron de estado, foco por teclado, columnas estables, paginacion/orden conservados.
- Archivos: UnreportedHistoryDetail.vue/prueba y README de componentes.
- Datos, filtros, contadores y exportaciones sin cambios. Sin servidores nuevos.
- Validacion: prueba del componente aprobada, ESLint sin errores y build correcto.
  Revision visual en navegador pendiente.

## 2026-10-15 - Ejemplos Amplios Para Entender El Historial

- Agregados 12 equipos DEMO y 59 desconexiones terminadas, varias fechas, causas
  repetidas/distintas, sin evidencia, sin llamadas y con seguimiento de llamadas.
- JSFG-74 (DEMO) tiene ocho casos; lista y ficha permiten probar paginacion y fechas.
- Solo desarrollo y empresas autorizadas; datos en memoria, sin tocar persistencia
  ni tabla operativa. Nombre e IMEI de ejemplos marcados tambien en Excel.
- Archivos: unreportedHistoryDemo.js/prueba, UnreportedView.vue/prueba y README locales.
- Sin servidores nuevos ni datos ficticios escritos sobre registros del usuario.
- Validacion: 339 pruebas aprobadas, ESLint sin errores y compilacion correcta.
  Ejemplos probados por cantidad, fechas, causas, llamadas y rango historico.
  Revision visual en navegador pendiente.

## 2026-10-15 - Botones De Tabla Sin Salto De Linea

- Revisar equipo y Ver desconexiones centrados, una sola linea, altura de 44 px.
- Reducido padding y peso del texto; columna operativa de acciones a 160 px.
- Archivos: UnreportedView.vue/prueba y README de vistas. Sin cambios funcionales.
- Validacion: 9 pruebas de vista aprobadas y build correcto. Revision visual pendiente.

## 2026-10-15 - Buscador De Historial Y Ficha De Equipo

- Historial reemplaza filas por episodio por una fila por equipo con total,
  ultima desconexion y Ver desconexiones. Ficha inline, no otro modal/acceso.
- Filtro fecha inicial de desconexion: todo (predeterminado), 30/90 dias o rango
  inclusivo en Chile. Totales encontrados y absolutos separados, rango invalido avisado.
- Ficha con fechas, duracion, diagnostico GPS propio y llamadas por episodio;
  paginacion/orden propios. Volver conserva busqueda y pagina del listado.
- Excel respeta periodo y equipo abierto, conservando detalle de episodios y llamadas.
- Archivos: UnreportedView.vue/prueba; UnreportedHistoryDetail.vue/prueba;
  unreportedHistorySearch.js/prueba; sorting/prueba y README afectados.
- Datos anteriores intactos. Aun local/mock; para muchos registros en produccion
  hace falta busqueda y paginacion en API. No se levantaron servidores nuevos.
- Validacion: 336 pruebas aprobadas, ESLint sin errores, build correcto y diff
  sin errores de espacios. Probados agrupacion, limites de fecha en Chile,
  contadores, llamadas del periodo y estructura de ficha inline/paginacion.
  Revision visual en navegador pendiente.

## 2026-10-15 - Ordenamiento En Encabezados De Sin Reportar

- Encabezados pulsables en equipos e historial, excepto Acciones.
- Flecha, aria-sort y ciclo ascendente/descendente/original. Conservado orden inicial
  por urgencia y fecha; cambiar pestaña o limpiar filtros lo restaura.
- Ordena resultados completos antes de paginar; reinicia primera pagina al ordenar.
  Exportacion respeta orden. Comparador usa fechas/duraciones reales y ausentes al final.
- Archivos: UnreportedView.vue/prueba, unreportedSorting.js/prueba y README locales.
- Sin cambios de almacenamiento ni servidores iniciados en segundo plano.
- Validacion: 331 pruebas aprobadas, ESLint sin errores y compilacion correcta.
  Comparaciones probadas con fechas entre meses, horas numericas, motivos y ausentes.
  Revision visual en navegador pendiente.

## 2026-10-15 - Contador Historico Sin Episodios Ocultos

- Corregido contador por equipo: antes sumaba interrupcion abierta y terminadas,
  aunque solo se mostraban terminadas. Ahora cuenta exactamente las terminadas.
- Etiqueta explicita desconexion terminada/desconexiones terminadas; estado actual
  sin reportar se informa aparte. Estado vacio tambien aclara terminadas.
- completedInterruptions compartido entre filas y exportacion. Sin borrar datos.
- Archivos: UnreportedView.vue/prueba, unreportedHistory.js/prueba y README locales.
- Validacion: 328 pruebas aprobadas, ESLint sin errores y build correcto.
  Regresion cubierta: una terminada mas una abierta muestra contador de una.
  Revision visual en navegador pendiente.

## 2026-10-15 - Unico Acceso Al Historial

- Conservada solo la pestaña Historial de desconexiones de la pagina.
- Quitados enlace Historial (N) de las filas y pestaña historica del modal.
- Revisar equipo mantiene Resumen, diagnostico actual y Consultas/llamadas.
- Eliminados propiedades, helpers y estilos exclusivos del historial del modal.
- Historial persistido, fechas, motivos por episodio y Excel conservados sin cambios.
- Archivos: UnreportedView.vue/prueba, UnreportedOperationModal.vue y README locales.
- Validacion: 327 pruebas aprobadas, ESLint sin errores y build correcto.
  Prueba de plantilla verifica un unico acceso y modal sin historial duplicado.
  Revision visual en navegador pendiente.

## 2026-10-15 - Comparacion De Interrupciones Y Motivos

- Historial muestra diagnostico/evidencia GPS y llamadas de cada episodio terminado.
  Acceso Historial (N) desde equipos sin reportar abre todos los episodios del equipo.
- Telemetria copiada por episodio al detectar silencio, solo con fecha coincidente.
  Recuperacion y siguientes reportes no reemplazan esa evidencia. Paquetes atrasados
  que corrigen fecha invalidan evidencia desfasada.
- Excel agrega diagnostico y evidencia por episodio. Consultas mantienen su relacion
  propia. Datos antiguos sin evidencia indican Diagnostico no registrado.
- Archivos: vista/prueba, modal, ciclo/prueba, exportador/prueba,
  unreportedHistory.js/prueba y README de las carpetas afectadas.
- No recupera episodios nunca almacenados: produccion requiere API historica GPS.
- Validacion: 327 pruebas aprobadas, ESLint sin errores y build correcto.
  Pruebas cubren dos causas distintas, consultas por episodio y recarga persistida.
  Revision visual en navegador pendiente.

## 2026-10-15 - Lectura Y Flujo Simplificados En Sin Reportar

- Pestanas Equipos sin reportar e Historial de desconexiones; historial solo con
  episodios terminados, incluidos Excel y contador. Abiertos permanecen guardados.
- Tres filtros principales: buscar, empresa, tiempo. Consulta y decision bajo
  Mas filtros, con aviso cuando estan aplicados. Limpiar filtros conserva su funcion.
- Quitados indicadores superiores y menu Columnas. Texto mayor, nombres/empresa
  sin truncar, controles con foco visible; orden urgente y llamadas preservados.
- Archivos: frontend/src/views/UnreportedView.vue, su prueba y README.
- Sin migracion ni perdida de consultas/historial; almacenamiento local existente.
- Validacion: 325 pruebas aprobadas, ESLint sin errores y compilacion correcta.
  Localhost:5173 responde; revision visual con usuario pendiente.

## 2026-10-15 - Historial Directo Y Simplificado

- Una fila por interrupcion con equipo, fecha inicial, regreso y duracion.
  Episodios abiertos: Sigue sin reportar. Total registrado visible junto al equipo.
- Quitados estado actual y accion Ver historial de esta vista; consultas y
  decisiones siguen disponibles en Revisar equipo, desde Sin reportar.
- Busqueda y filtro empresa conservados; episodios mas recientes primero.
  Exportacion sin duplicados por equipos con varios episodios.
- Archivos: frontend/src/views/UnreportedView.vue, su prueba y README.
- Datos y consultas anteriores preservados, sin nuevas dependencias.
- Validacion: 325 pruebas aprobadas, build correcto y ESLint sin errores.
  Revision visual en navegador pendiente.

Registro simple de los cambios funcionales que se van incorporando a la plataforma.
La idea de este archivo es dejar trazabilidad rapida para revisar que se hizo, por que
se hizo y que partes del proyecto fueron afectadas.

## Indice rapido

- Recuperacion documental de mantenciones y rendimiento: entrada 2026-10-13 y
  `bitacora/modulos/mantenciones-y-rendimiento.md`.

- Cambios de modularizacion: `bitacora/modulos/modularizacion.md`
- Cambios de rendimiento: ver entradas del `2026-09-15` sobre precarga pasiva y
  modales bajo demanda.
- Cambios de Alertas: ver entradas del `2026-09-14` y `2026-09-11`.
- Cambios de Fleet/Activos: ver entradas de Alertas dentro de Fleet,
  Itinerarios, Geocercas y permisos.

## Criterio de orden

- Este archivo mantiene el registro cronologico, con lo mas reciente arriba.
- Cuando un cambio empieza a abarcar varios archivos o varias pasadas, se agrega
  una ficha en `bitacora/modulos/` para explicar la modularizacion o arquitectura
  sin hacer crecer demasiado esta vista principal.
- Las entradas nuevas deben incluir: objetivo, cambios realizados, motivo,
  archivos modificados y validacion.

## 2026-10-14 - Historial Persistente Por Equipo

- Recuperados pasa a Historial: una fila por equipo con contador de interrupciones,
  ultima recuperacion y estado actual, buscable por equipo/IMEI/empresa aunque
  vuelva a desconectarse. Sin reportar conserva el trabajo operativo actual.
- Ver historial abre fechas/duraciones por episodio y consultas correspondientes.
  Episodios abiertos se distinguen de recuperados. Modal estable y columnas adaptadas.
- Store guarda interruptions y metadata por empresa/IMEI, sin reemplazar anteriores.
  Reportes duplicados, atrasados o futuros no inflan contadores; nunca reporto no
  inventa una interrupcion. Reincidencias capturadas por poll o paquete nuevo.
- Migracion de ultima recuperacion antigua solo si su duracion aporta fechas
  conocidas. No inventa recuperaciones anteriores no registradas.
- Equipos ausentes de fuente actual permanecen historicamente buscables como
  Sin dato actual; no generan nuevas incidencias ni llamadas operativas ficticias.
- Excel: resumen de equipos y detalle por interrupcion, con consultas vinculadas.
- Archivos: UnreportedView.vue y prueba, modal de equipo, servicio de ciclo y
  exportador/pruebas, nuevo unreportedHistory.js/prueba y README respectivos.
- Persistencia aun local/mock; produccion necesita API historica, eventos reales
  de comunicacion y permisos/evaluacion de servidor. Datos previos preservados.
- Polling espaciado de snapshots frescos no inventa interrupciones entre consultas.
  receiveReport reservado a eventos de flujo; historial incluye solo lo registrado.
- Validacion: 325 pruebas aprobadas, build correcto y ESLint sin errores
  (46 advertencias de formato Vue). Revision visual en navegador pendiente.

## 2026-10-14 - Altura Normal Con Pocos Resultados

- Filas dejan de ocupar una fraccion de toda la tabla. Minimo de 92 px y
  ajuste al contenido, alineadas arriba, evitando un registro gigante/centrado.
- Altura del contenedor y paginacion fija conservadas; espacio sobrante debajo.
- Archivos: UnreportedView.vue, prueba de plantilla y README de vistas.

## 2026-10-14 - Filtros Operativos Para Consultas

- Panel con buscador, empresa, ultima consulta, revision en terreno y tiempo
  sin reportar. Ultima consulta usa el registro mas reciente o Sin consultar;
  tiempo agrega Mas de 15 dias a los cortes de 3/7 dias.
- Filtros combinables, reinician pagina y se limpian con Limpiar filtros.
  Orden por prioridad, consultas, permisos y exportacion completa preservados.
- Archivos: UnreportedView.vue y prueba, unreportedFlow.js y prueba, README locales.

## 2026-10-14 - Miniaturas De Vehiculos En Sin Reportar

- Tabla usa los mismos PNG auto/camion y criterio por nombre de Mantenciones.
  Precarga y decodifica antes de mostrar, con tamaño fijo 48 px, carga lazy y
  icono de respaldo ante fallo, sin espacios vacios ni cambios de ancho.
- No se inventan fotos reales ni tipos de vehiculo: se reutilizan imagenes
  representativas actuales. No cambia consultas, permisos ni seguimiento.
- Archivos: UnreportedView.vue, prueba de plantilla y README de vistas.
- Validacion: seis pruebas de plantilla aprobadas, ESLint y build correctos.

## 2026-10-14 - Layout De Sin Reportar Segun Referencia

- Indicadores a todo el ancho arriba; filtros a izquierda y pestañas con acciones
  sobre tabla. Exportar/Actualizar conservan handlers y errores visibles.
- Filas con icono generico de equipo, nombre/empresa/IMEI legibles, fecha y hora
  separadas, botones mayores y pie/paginacion mas visible. Sin cambiar header global.
- Menu Columnas funcional mediante useFleetColumns existente: campos opcionales,
  equipo/acciones siempre visibles y restablecer. Cabecera/filas usan mismo grid.
- Flujo, filtros simplificados, prioridad y datos intactos. Excel sigue completo.
- Archivos: UnreportedView.vue, prueba de plantilla, README de vistas y bitacora.
- Copia previa en C:/Users/suazo/AppData/Local/Temp/
  sinergy-unreported-layout-20261014-064cd9fa, para revertir solo esta propuesta.
- Validacion: seis pruebas de plantilla/columnas aprobadas, ESLint y build correctos.
  Sin comprobacion visual automatizada disponible.

## 2026-10-14 - Filtros Simples Y Prioridad De Visitas

- Panel limitado a buscador, empresa, revision en terreno y tiempo sin reporte
  (todos, mas de 3 dias o mas de 7 dias). Retirados controles de conectividad,
  ultima consulta, fechas, orden y umbral; configuracion de umbral preservada.
- Orden fijo: terreno primero, pendientes de mayor tiempo conocido, no requieren
  por ahora al final. Equipos sin reporte previo no reciben dias ficticios.
  Recuperados por fecha mas reciente. Tiempo con letra mayor y visitas destacadas.
- Cambios solo en vista/prueba, helper de flujo/prueba y README respectivos.
  Consultas, almacenamiento, datos y resumen de cuatro tarjetas intactos.
- Copia exacta previa en C:/Users/suazo/AppData/Local/Temp/
  sinergy-unreported-filters-20261014-6f6bc306, con rutas src/views y src/utils.
  Permite volver atras solo esta simplificacion, sin restaurar el proyecto entero.
- Validacion: 308 pruebas aprobadas, ESLint y build correctos. Sin comprobacion
  visual automatizada disponible.

## 2026-10-14 - Reversion Del Resumen Compacto

- A pedido del usuario se restaura el resumen anterior desde la copia local:
  cuatro tarjetas y pestanas debajo. Restauradas vista y prueba anteriores.
- No se modifica almacenamiento, consultas, filtro de ultima consulta ni
  botones superiores de exportacion/actualizacion. README de vistas actualizado.

## 2026-10-14 - Resumen Compacto De Decisiones

- Pestanas Sin reportar/Recuperados arriba y tres contadores compactos debajo:
  pendientes de confirmar, requieren terreno y no requieren por ahora.
- Retiradas tarjetas de totales duplicadas, Nunca reporto del resumen (permanece
  en filtros), textos secundarios y barras decorativas. Seleccion con aria-pressed.
- Click alterna filtro de decision sin borrar conectividad ni otros filtros.
  Conteos por empresa/seccion activa. Mas espacio disponible para tabla.
- Cambios limitados a UnreportedView.vue y prueba, README de vistas/bitacora.
  No cambia almacenamiento, consultas ni exportacion.
- Copia local previa de vista y prueba en carpeta temporal:
  C:/Users/suazo/AppData/Local/Temp/sinergy-unreported-summary-20261014-5fb18f43.
  Permite revertir solo esta propuesta sin restaurar todo el push ni borrar datos.
- Validacion: cuatro pruebas de plantilla aprobadas, ESLint y build correctos.

## 2026-10-14 - Retiro De Graficos De Sin Reportar

- Retirada pestaña Graficos, componente UnreportedCharts.vue, import y estado
  de vista alterna. Filtros/paginacion funcionan directamente sobre el listado.
- Tabla, consultas, recuperados, KPI y exportacion permanecen. No cambia
  almacenamiento ni graficos/dependencias de otros modulos.
- Archivos: UnreportedView.vue, prueba de plantilla, README de vistas/componentes
  y componente de graficos eliminado.

## 2026-10-14 - Retiro De Notas A Favor De Consultas

- Se elimina pestaña Notas, editor/menu, contador en tabla y handlers de vista.
  Revisar equipo queda con Resumen y Consultas, manteniendo dimensiones del modal.
- Excel sin columna ni textos de notas, conserva historial de consultas.
- Datos antiguos intactos en almacenamiento para reversion; no se transforman
  en llamadas ficticias ni se eliminan. Helpers legacy del store sin uso en UI.
- Archivos: UnreportedView.vue, modal del modulo, exportador/prueba, prueba de
  plantilla y README locales. No cambia conectividad ni consultas existentes.
- Validacion: tres pruebas de plantilla/Excel aprobadas, ESLint y build correctos.

## 2026-10-14 - Consultas A Empresas Y Decision De Visita

- Exportar a Excel y Actualizar movidos al extremo derecho de la barra superior.
  Se retiran de filtros; mantienen carga/deshabilitado, error visible y handlers.
  Barra adaptable a pantallas pequenas, sin alterar exportacion ni seguimiento.

- Filtro Ultima consulta: todas, sin consultar, funcionando, sin uso, taller o
  no se logro contactar. Usa solo el ultimo registro, combina con los demas
  filtros y aplica tambien a exportacion/graficos; pagina se reinicia al cambiar.
- Espaciado del panel ajustado en pantallas de hasta 900 px de alto para alojarlo.

- Flujo adaptado al trabajo real: detectar equipos sin reporte, consultar a la
  empresa y registrar situacion/decision sin retirar ni recuperar manualmente.
- Situaciones: funcionando, sin uso, en taller o no se logro contactar.
  Decisiones: pendiente de confirmar, requiere terreno o no requiere por ahora.
- Historial de llamadas con observacion opcional, fecha y autor. Notas separadas.
  Tabla muestra ultima consulta y decision; Excel incluye historial completo.
- Recuperacion conserva consultas; nueva interrupcion vuelve a pendiente.
  Datos previos intactos; el antiguo En seguimiento no equivale a visita decidida.
- Archivos: UnreportedView.vue, modal del modulo, servicio de ciclo y exportador,
  helper unreportedFlow, pruebas y README locales. Persistencia sigue local/mock.
- Validacion: 302 pruebas aprobadas, ESLint del modulo y build correctos.
  Sin comprobacion visual automatizada disponible.

## 2026-10-14 - Bandeja Global Y Revision De Equipos

- Resumen del modal redistribuido: datos arriba, GPS/seguimiento en dos columnas
  y simulacion demo en el pie. Espacios ajustados sin cambiar tamano del modal;
  evita scroll con contenido habitual en escritorio sin ocultar datos largos.

- Correccion de encabezado: un signo > suelto creaba una octava celda y desplazaba
  Acciones debajo de Equipo. Retirado y cubierto por prueba del AST de plantilla.

- Empresa visible por equipo y listado limitado a empresas autorizadas. Separa
  conectividad automatica de seguimiento humano, sin atribuir cortes como estado.
- Pendiente de revision / En seguimiento se cambian explicitamente desde
  Revisar equipo; consultar/agregar notas no inicia seguimiento por si solo.
- Modal estable con Resumen y Notas. Ubicacion y diagnostico permanecen disponibles;
  la simulacion demo se mueve al resumen y se oculta en compilacion de produccion.
- Recuperacion automatica conserva notas/seguimiento. Nueva interrupcion reinicia
  revision pendiente. Registros antiguos se conservan y no se borra almacenamiento.
- KPI/filtros, graficos y Excel adaptados a los mismos estados y empresas.
- Archivos de codigo: views/UnreportedView.vue, components/unreported/
  UnreportedOperationModal.vue y UnreportedCharts.vue, services/unreported/
  unreportedLifecycleStore.js y unreportedExcelExportService.js, sus pruebas,
  utils/unreported/unreportedFlow.js y prueba nueva; README de esas carpetas.
- Reversion: volver solo estos archivos al push preventivo y retirar los dos
  archivos nuevos unreportedFlow; no resetear el proyecto ni borrar datos locales.
  La version anterior ignora campos followUp nuevos y conserva las notas existentes.
- Validacion: 299 pruebas totales aprobadas, ESLint del modulo y build correctos.
  localhost:5173 responde HTTP 200. Sin verificacion visual automatizada disponible.

## 2026-10-14 - Notas Del Equipo

- Modal con altura estable de 600 px acotada a la pantalla: abrir/cerrar el
  editor no cambia sus dimensiones; lista flexible con scroll y textarea fijo.

- Formulario inicialmente oculto; boton Agregar nota lo abre. Editar tambien
  abre/enfoca el editor. Cancelar o guardar correctamente vuelve a la lista;
  errores mantienen el borrador. No se modifica persistencia de notas.

- Menu por nota para editar y eliminar con confirmacion. La edicion mantiene
  autor/fecha original y agrega fecha/responsable de modificacion. Eliminacion
  persiste y no recrea notas migradas; fallos de guardado conservan datos previos.
- Archivos adicionales: servicio de seguimiento y pruebas, modal y vista.

- Cabecera de cada nota con autor y fecha arriba en negrita; contenido debajo
  con peso normal y separacion clara, sin alterar datos ni orden de las notas.

- Modal ajustado a referencia: titulo con equipo, identidad debajo, notas en fondo
  suave, separadores, formulario amplio y Cancelar/Agregar nota. Ancho maximo
  680 px con adaptacion movil; fecha corta y hora de 12 horas en America/Santiago.

- Notas (contador) reemplaza Registrar/editar falla en la tabla. Panel con notas
  mas recientes primero y formulario para agregar, sin sobrescribir anteriores.
- Cada nota conserva fecha y autor y permanece tras recuperar el equipo.
  La falla anterior se convierte en una nota una sola vez, sin perder datos.
- Diagnostico GPS separado; notas fuera del cuerpo de las filas. Excel incluye
  la lista de notas. Persistencia local, sin API operativa.
- Archivos: vista Sin reportar, modal del modulo, servicio de ciclo y exportador
  Excel, prueba de ciclo y README locales.
- Validacion: 17 pruebas de servicios aprobadas, ESLint y build correctos.

## 2026-10-14 - Registrar Falla Sin Retirar Equipos

- Correccion visual posterior: filas con minimo basado en contenido, padding
  vertical y ajuste de palabras para evitar que la falla/fecha invadan otra fila.
  No se altera ni elimina el registro guardado.

- Registrar/editar falla reemplaza Fuera de operacion y Reactivar. Se elimina
  la pestaña de retiros; registrar no modifica el seguimiento ni implica reparacion.
- Falla, fecha y responsable visibles separados del diagnostico GPS y conservados
  cuando el equipo vuelve a transmitir. Excel incluye esos tres campos.
- Retiros locales existentes regresan al seguimiento segun su ultimo reporte y
  umbral, conservando motivo/fecha/responsable como falla registrada.
- Archivos: UnreportedView.vue, UnreportedOperationModal.vue, servicio de ciclo,
  exportador Excel, pruebas de ambos servicios y README de carpetas afectadas.
- Validacion: 32 pruebas del modulo aprobadas, ESLint y build correctos.
  Persistencia aun local; produccion requiere API y permisos de servidor.

## 2026-10-14 - Altura Acotada En Sin Reportar

- Modal de retiro/reactivacion centrado explicitamente con inset y margin auto
  para compensar el reset CSS; formulario acotado al viewport y botones adaptables.

- Tabla inicia con cinco filas por pagina, de al menos 80 px y altura distribuida
  en el cuerpo disponible, en lugar de nueve filas pequenas con la ultima cortada.
  Se mantienen opciones para aumentar filas y exportacion de todos los filtrados.

- Se reemplazaron margenes combinados por un grid de filtros con gap uniforme
  de 14 px y controles de 36 px. Estados con columnas iguales y texto sin saltos.

- Correccion de proporciones segun captura: controles de filtros menos apretados,
  orden/umbral alineados sin salto de etiqueta, separacion del icono de busqueda
  y acciones de tabla lado a lado para reducir altura de filas.

- Filtros alineados a la referencia: estados en dos columnas y Nunca reporto
  a ancho completo, fechas etiquetadas, orden/umbral juntos y buscador con icono.

- Ajuste posterior: filtros sin scroll interno, espacios y controles compactos
  en escritorio para mantener Exportar y Actualizar visibles.

- Vista de escritorio ajustada al espacio del contenedor de la plataforma.
  Encabezado y paginacion permanecen visibles; solo las filas se desplazan
  cuando superan la altura disponible. Filtros tienen desplazamiento independiente.
- En movil se mantiene desplazamiento de pagina; graficos siguen accesibles.
- Archivo: frontend/src/views/UnreportedView.vue y README de vistas.
- Validacion: ESLint y build correctos; pendiente comprobacion visual en navegador.

## 2026-10-13 - Datos De Conexion Sin Voltajes

- Sin comunicacion muestra solo SIM, registro en red y senal disponibles.
  Sin esos campos: Sin datos de conexion y Causa no determinada.
- Fallos de SIM/red no mezclan datos electricos; alimentacion conserva voltajes.
  Lecturas de conexion antiguas siguen identificadas como anteriores.
- Tabla y Excel comparten el helper, por lo que aplican el mismo criterio.
- Archivos: utils/unreported/unreportedDiagnosis.js, pruebas y README local.
- Validacion: 28 pruebas de diagnostico/seguimiento aprobadas y ESLint correcto.

## 2026-10-13 - Diagnostico Segun Datos Del GPS

- Motivo breve sustentado por voltajes, estado SIM o registro movil recibido.
  Sin evidencia suficiente se muestra Causa no determinada, sin inferir averias.
- Posicion GPS invalida e intensidad de senal se muestran como observaciones;
  por si solas no explican una interrupcion de comunicacion.
- El seguimiento conserva una instantanea de diagnosticos por paquete. Una
  simulacion sin mediciones no convierte lecturas viejas en datos actuales.
- Los mocks no incorporan estados SIM/modem inventados. Produccion requiere
  conectar y normalizar estos campos desde la fuente real de telemetria.
- Archivos: UnreportedView.vue, utils/unreported/unreportedDiagnosis.js,
  services/unreported/unreportedLifecycleStore.js, sus pruebas y README locales.
- Validacion: 27 pruebas focalizadas y 289 pruebas totales aprobadas; ESLint
  del modulo y build de produccion correctos. Sin verificacion visual automatizada.

## 2026-10-13 - Datos Compactos De Desconexion

- Se retiraron textos largos e hipotesis de la tabla y Excel. Se muestran
  etiqueta breve, alimentacion externa y bateria interna del dato disponible.
- El voltaje externo previo solo se muestra si existe; no se inventa 12/24 V
  ni se confunde la referencia de bateria interna con alimentacion del vehiculo.
- Se mantiene la distincion entre mediciones anteriores y datos actuales.
- Archivos: UnreportedView.vue, unreportedDiagnosis.js y pruebas, exportador
  Excel y README de carpetas afectadas.

Validacion de esta simplificacion: 280 pruebas correctas, build y lint de
archivos afectados correctos; sin revision visual automatica.

## 2026-10-13 - Motivo Especifico De Desconexion

- Se sustituyo Motor apagado fijo por motivo observado, voltajes y posibles
  causas explicitamente no confirmadas. Se distingue 0 V de falta de datos.
- Datos electricos antiguos no se usan para atribuir un corte nuevo despues
  de recibir un reporte sin nuevas mediciones.
- Recuperacion y retiro manual no se presentan como fallas confirmadas.
- Excel incluye motivo, evidencia e hipotesis con la misma regla de la pantalla.
- Archivos: UnreportedView.vue, utils/unreported/unreportedDiagnosis.js y pruebas,
  exportador Excel y README de carpetas afectadas. Datos siguen siendo mock.
- Validacion: 279 pruebas generales correctas (6 nuevas de diagnostico), build y
  lint de archivos afectados correctos; sin revision visual automatica.

## 2026-10-13 - Retiro De Libreta De Notas

- A pedido del usuario se quitaron columna, contador, panel lateral, icono,
  servicio y pruebas exclusivos de notas de Sin reportar.
- Se ajusto la tabla y se elimino la dependencia de notas en las pruebas del ciclo.
- El alcance usado por las acciones se conserva como equipmentContext; no cambia
  el seguimiento Sin reportar/Recuperados/Fuera de operacion ni soporte.
- Se actualizaron README y se conservaron los registros historicos de la bitacora.
  La clave antigua de notas del navegador no se elimina ni se sigue usando.
- Validacion: 273 pruebas correctas, build y lint de archivos afectados correctos.

## 2026-10-13 - Ciclo De Equipos Sin Reportar

- Pestanas Sin reportar, Recuperados y Fuera de operacion con notas compartidas,
  filtros/paginacion y conteos derivados del alcance autorizado.
- Retiro con motivo, fecha y responsable; reactivacion segun ultimo reporte.
  Recibir reportes no reactiva automaticamente un equipo retirado.
- Recuperacion ligada a un reporte nuevo y regreso al listado al vencer umbral;
  datos antiguos o futuros no limpian una incidencia.
- Umbral local configurable y revision por minuto/Actualizar. Simular reporte
  (demo) permite probar sin presentar el mock como telemetria real.
- Excel incluye recuperacion, duracion, retiro, motivo y responsable.
- Archivos: UnreportedView.vue, UnreportedOperationModal.vue,
  unreportedLifecycleStore.js y sus pruebas, exportador Excel y README.
- Datos locales; se requieren API, IDs estables y evaluacion de servidor para
  produccion. No se borran notas ni se integran nuevos reportes reales.
- Validacion: 278 pruebas generales correctas (11 nuevas del ciclo), build y lint
  de archivos afectados correctos; sin revision visual automatica. Se mantiene
  el servidor existente en localhost:5173, sin abrir otro puerto.

## 2026-10-13 - Libreta De Observaciones En Sin Reportar

- Columna Notas con icono/contador y panel lateral por equipo, sin salir del
  listado. Incluye autor, fecha, edicion propia, eliminacion confirmada y
  advertencia al descartar un borrador.
- Persistencia independiente del listado: no cambia estado tecnico, no crea
  solicitudes de soporte ni borra notas cuando el equipo deja de aparecer.
- Alcance por empresa autorizada; solo autor edita/elimina. Notas locales en
  sinergy-unreported-notes-v1, con IMEI textual y empresa de las filas mock.
- Archivos: UnreportedView.vue, UnreportedNotesPanel.vue, unreportedNotesStore.js,
  sus pruebas, SvgIcon.vue y README de carpetas afectadas.
- Se requiere API e IDs estables para produccion; no hay sincronizacion entre
  navegadores ni pantalla nueva de equipos recuperados.
- Validacion: 267 pruebas generales correctas (5 nuevas de notas), build y lint
  de archivos afectados correctos. Sin verificacion visual automatica.

## 2026-10-13 - Panel De Soporte Desde Menu De Usuario

- Se agrego Panel de soporte al dropdown de usuario, con pagina /soporte
  autenticada y cargada bajo demanda, sin nueva opcion de sidebar.
- Listado con filtros, paginacion, creacion, conversacion, archivos, responsable,
  fecha de atencion y estados. Responder una solicitud resuelta la reabre.
- Alcance por empresa: cliente consulta; administrador de plataforma y tecnicos
  gestionan dentro de sus empresas autorizadas. Vehiculo opcional autorizado.
- Metadatos en localStorage y archivos en IndexedDB; guardado fallido no confirma
  cambios en memoria. Sigue siendo prototipo local, sin servicio remoto de soporte.
- Archivos: SupportView.vue, AppHeader.vue, router/index.js, SvgIcon.vue y nuevas
  carpetas components/support, composables/support, services/support y utils/support.
- Se agregaron README locales y pruebas de permisos, persistencia y validacion.
- Validacion: 262 pruebas generales correctas (10 nuevas de soporte), build y
  lint de archivos afectados correctos. No se completo revision visual automatica:
  el navegador headless del entorno no pudo iniciarse con depuracion disponible.
  Servidor local en http://127.0.0.1:5173, ruta de soporte /soporte.

## 2026-10-13 - Documento De Entrega A Produccion

Alcance corregido a pedido del usuario: el documento es exclusivamente del modulo
de mantenciones. La version general inicial fue reemplazada, conservando la
bitacora historica de los demas modulos. No modifica codigo funcional.

- Se creo el documento hoy ubicado en `bitacora/produccion/mantenciones-2026-10-13.md` con sintesis por modulo
  de los cambios registrados desde 2026-09-04 y la recuperacion posterior.
- Incluye archivos principales a intervenir, limites del prototipo, propuesta
  de entidades, prioridades de integracion y recorridos de aceptacion.
- No atribuye fechas no registradas ni presenta requisitos de backend como
  implementados. No modifica funcionalidad.
- Validacion: 64 rutas completas citadas existen; formato Markdown revisado.
  Se conserva la distincion entre las pruebas/build anteriores y una validacion
  productiva, que sigue pendiente.

## 2026-10-13 - Recuperacion De Documentacion Pendiente

### Objetivo Y Motivo

Actualizar bitacora, README de carpeta e indices generales contra el codigo
actual despues de iteraciones que quedaron sin documentar. Registro
retrospectivo: no se inventan fechas individuales de implementacion.

### Cambios Registrados

- Flota/Analisis/Ordenes, ciclo de cierre y renovacion, criterios validos,
  catalogo de tipos e historial por vehiculo.
- Exportaciones filtradas de flota y descarga directa de historial PDF/Excel,
  encabezados corporativos, paginacion, fechas y espaciado.
- Persistencia versionada de mantenciones/base mock, evidencias IndexedDB,
  indices, busqueda limitada y permisos por Set de etiquetas.
- Sin reportar con paginacion/exportacion y servicios de itinerarios separados.
- README nuevos para cinco carpetas de codigo; correccion de referencias
  obsoletas y flujos que negaban la persistencia local actual.

### Archivos

Detalle y mapa en `bitacora/modulos/mantenciones-y-rendimiento.md`.
Se actualizaron README raiz/frontend y de carpetas afectadas, junto con
`frontend/docs/flujos-principales.md` y `frontend/docs/archivos-criticos.md`.
Esta pasada modifica documentacion, no comportamiento operativo.

### Validacion

Revision de referencias de archivos, presencia de README en carpetas de codigo
y contraste de flujos con implementaciones y pruebas. `npm test`: 252 pruebas
correctas, cero fallos. `npm run build`: correcto, con aviso informativo de
tiempos de plugins de Vite. Sin verificacion visual de PDF/Excel ni de todos
los viewports; no se afirma una ejecucion completa de lint en esta pasada.

## 2026-09-16 - Composables de configuracion de alertas

### Objetivo

Reducir nuevamente `AlarmConfigPanel.vue`, sacando la logica de alcance,
geocercas, validacion y payload del componente visual.

### Cambios realizados

- Se creo `useAlarmRuleAssetScope.js` para activos, busqueda, seleccion masiva y
  etiquetas de acceso.
- Se creo `useAlarmRuleGeofenceSelection.js` para geocercas, grupos y normalizacion
  de `geofenceScope`.
- Se creo `useAlarmRuleDraft.js` para presets, validacion del draft y payload de
  guardado.
- `AlarmConfigPanel.vue` quedo como orquestador de pantalla: selecciona regla,
  abre/cierra modal, guarda, elimina, activa/desactiva y muestra feedback.
- Se agrego README para `frontend/src/composables/alarms`.

### Por que se hizo

El componente ya estaba visualmente modularizado, pero seguia concentrando reglas
de negocio del formulario. Separar esas reglas deja el componente mas facil de
revisar y permite probar o ajustar payload/selecciones sin tocar el layout.

### Archivos modificados

- `frontend/src/components/alarms/AlarmConfigPanel.vue`
- `frontend/src/composables/alarms/useAlarmRuleAssetScope.js`
- `frontend/src/composables/alarms/useAlarmRuleGeofenceSelection.js`
- `frontend/src/composables/alarms/useAlarmRuleDraft.js`
- `frontend/src/composables/alarms/README.md`
- `frontend/src/composables/README.md`
- `frontend/src/components/alarms/README.md`
- `bitacora/bitacora.md`
- `bitacora/modulos/modularizacion.md`

### Validacion

- `npm run lint`
- `npm run format:check`
- `npm run build -- --logLevel error`

## 2026-09-23 - Nueva alerta integrada en la barra de filtros

**Que se hizo**

- Se retiro el boton `Nueva alerta` de la fila superior de navegacion interna.
- El boton se ubico al extremo derecho de la barra de filtros de configuracion,
  a la misma altura que busqueda, tipo, empresa, estado y limpiar.
- El buscador usa el espacio flexible restante en escritorio y queda mas corto
  que antes al compartir la fila con la nueva accion.
- Se corrigio la distribucion para que el buscador comience en el borde izquierdo
  y ocupe solo el espacio restante, mientras `Nueva alerta` permanece al extremo
  derecho sin dejar un bloque vacio antes de los filtros.
- La nueva accion reutiliza `startNewRule` y conserva el bloqueo visual cuando
  el usuario no tiene permiso para administrar alertas.

**Archivos modificados**

- `frontend/src/views/AlarmsView.vue`
- `frontend/src/components/alarms/AlarmConfigPanel.vue`
- `frontend/src/components/alarms/AlarmRuleFilters.vue`
- `frontend/src/components/alarms/README.md`

## 2026-09-22 - Navegacion lateral compacta y desplegable

**Que se hizo**

- Se reemplazo la barra lateral exclusivamente desplegable por una navegacion
  con dos estados: rail compacto de `76px` y panel expandido de `292px`.
- Se incorporaron iconos, estado activo naranja, ayudas flotantes sobre los
  iconos y una transicion breve para abrir o cerrar el panel.
- Se agrego un control para ocultar o recuperar la barra compacta. La eleccion
  queda persistida en `localStorage`.
- Se unifico la construccion de enlaces en una sola lista reactiva. El rail y
  el panel ya no mantienen copias separadas de las rutas.
- Se conservaron los permisos, la empresa activa, las rutas administrativas y
  los respaldos hacia la primera empresa accesible del comportamiento anterior.
- En movil no se reserva espacio para el rail: el boton del header abre el panel
  superpuesto y los enlaces lo cierran despues de navegar.
- Se mantuvo un unico boton hamburguesa en el header. La barra compacta no
  repite ese control, evitando dos acciones visualmente identicas juntas.
- Se optimizo la apertura del panel: se elimino el desenfoque de pantalla
  completa, el contenido permanece montado con `v-show` y la animacion usa
  solamente `transform` acelerado y opacidad. Esto reduce el trabajo de pintura
  sobre mapas y vistas con muchas filas.
- Al cambiar la preferencia de barra compacta desde el panel expandido, el
  panel ahora se cierra para mostrar inmediatamente el resultado de la accion.
- Se desacoplo `showSidebar` de `router-view`, `ActivosView` y
  `ActivosMapPanel`. Abrir la navegacion ya no provoca una actualizacion del
  mapa ni de la vista de flota; la cola de telemetria se conserva solamente
  para estados que realmente pausan el mapa, como la comparacion de rutas.
- El estado de apertura se movio desde `App.vue` hacia `AppSidebar.vue`. El
  header utiliza la API expuesta `toggle()` mediante una referencia, por lo que
  abrir o cerrar la navegacion ya no vuelve a renderizar el layout raiz ni sus
  vistas hijas.
- Se corrigio el footer del panel expandido para evitar controles y marca
  comprimidos. Cuando el rail esta visible se oculta la accion duplicada de
  ocultarlo; si el rail fue desactivado, el panel muestra una unica accion para
  restaurarlo. El bloque de marca conserva altura y ancho estables.
- Se asigno una capa global estable a la navegacion (`z-index: 2000`) y otra al
  overlay (`1990`). Esto evita que las capas internas de Leaflet, sus controles
  o el mapa se dibujen sobre la sidebar al reducir el ancho de la ventana.
- El control para mostrar u ocultar el rail compacto se ubico en el footer del
  panel y muestra siempre una etiqueta explicita segun la accion disponible.
- Para mejorar la respuesta se elimino la animacion del overlay y la sombra del
  panel durante el desplazamiento. La unica propiedad animada es `transform`,
  con una duracion corta de `110ms` y una capa de composicion estable.
- Se reemplazo `v-show` y `Transition` por capas persistentes controladas con
  clases. El panel y el overlay permanecen montados, conservan sus capas de
  composicion y solo cambian `transform`, `opacity` y `pointer-events`; esto
  evita reconstruir la capa visual en cada apertura.
- La sidebar dejo de mantener un renderizador SVG y rutas de iconos propios.
  Ahora utiliza el componente compartido `SvgIcon.vue`; los controles
  `panel-open` y `panel-close` se agregaron al catalogo central.
- Se habilitaron tooltips en los iconos del rail compacto. Se retiro el recorte
  horizontal que ocultaba las etiquetas y se agrego `title` nativo como
  respaldo para cada modulo.
- Se eliminaron cinco variantes SVG duplicadas que repetian los nombres de
  `reportes`, `alertas`, `mantenciones`, `empresas` y `usuarios`. El catalogo
  conserva una sola definicion publica por nombre.

## 2026-09-22 - Barra superior compacta en usuarios

**Que se hizo**

- Se retiro el encabezado independiente con el titulo y descripcion de
  Usuarios para evitar repetir el contexto ya indicado por el header global.
- La busqueda dejo de ocupar todo el espacio disponible y ahora conserva un
  ancho acotado en escritorio, manteniendo crecimiento flexible en movil.
- El boton `Nuevo usuario` se movio dentro de `UserFiltersBar`, alineado con los
  filtros de empresa, estado, rol y filtros adicionales.
- Se mantuvo la validacion `canCreateUsersForRoute`; el boton solo aparece
  cuando el usuario actual tiene permiso para crear usuarios.

**Archivos modificados**

- `frontend/src/views/UserManagementView.vue`
- `frontend/src/components/users/UserFiltersBar.vue`
- `bitacora/bitacora.md`

## 2026-09-22 - Nuevo diseno del editor de usuarios

**Que se hizo**

- Se reemplazo el modal compacto anterior por una composicion de dos zonas:
  `Datos de la cuenta` y `Acceso inicial`.
- La zona principal contiene nombre, correo, usuario y contrasena; la zona
  secundaria concentra estado, rol y empresa inicial.
- Se agrego un control accesible para mostrar u ocultar la contrasena y cierre
  mediante tecla `Escape`.
- El modo edicion reutiliza el mismo diseno, permite dejar la contrasena vacia y
  deriva la administracion de empresas al detalle de accesos existente.
- La validacion visual exige nombre, usuario, correo valido, empresa inicial y
  una contrasena de al menos ocho caracteres al crear.
- El modal se teletransporta a `body` y utiliza una capa superior a la sidebar y
  al mapa para evitar superposiciones.

**Por que se hizo**

El formulario anterior mezclaba todos los campos en una grilla pequena. La
nueva jerarquia separa identidad y credenciales de la configuracion operativa,
facilita la lectura y mantiene visibles las acciones principales.

**Archivos modificados**

- `frontend/src/components/users/UserEditorModal.vue`
- `frontend/src/components/users/README.md`
- `bitacora/bitacora.md`

## 2026-09-23 - Rediseño del catalogo de usuarios en tarjetas

**Que se hizo**

- Se reconstruyo la vista cards del directorio con una grilla de hasta tres
  columnas en escritorio.
- Cada tarjeta separa identidad, correo, rol y estado en su encabezado; empresa
  y cantidad de accesos se muestran como dos metricas intermedias.
- Se agregaron acciones independientes `Ver detalle` y `Editar` en el pie de la
  tarjeta, usando el catalogo compartido `SvgIcon`.
- `Ver detalle` conserva el drawer actual. `Editar` selecciona el usuario y abre
  directamente el editor existente.
- La accion de edicion solo se renderiza cuando `canEditUsersForRoute` lo
  permite; sin ese permiso, la accion de detalle ocupa el ancho completo.
- Las acciones `Ver detalle` y `Editar` muestran cursor de accion para dejar
  claro que son controles interactivos.

**Archivos modificados**

- `frontend/src/components/users/UserListPanel.vue`
- `frontend/src/views/UserManagementView.vue`
- `frontend/src/components/users/README.md`
- `bitacora/bitacora.md`

## 2026-09-23 - Rediseño de la vista lista de usuarios

**Que se hizo**

- La lista se reorganizo en las columnas Usuario, Rol, Empresa, Accesos,
  Ultimo acceso, Estado y Acciones.
- Se incorporaron iconos para empresa, accesos y fecha; los roles y estados se
  presentan como etiquetas compactas.
- Las acciones de editar y ver detalle son independientes y reutilizan los
  mismos flujos de las tarjetas.
- Se agrego un selector funcional de 5, 10 o 20 usuarios por pagina y se cambio
  el valor inicial a 10.
- La tabla mantiene un ancho minimo con scroll horizontal para evitar que las
  columnas pierdan legibilidad en ventanas estrechas.

## 2026-09-23 - Mejora de legibilidad en Auditoria

**Que se hizo**

- Se agrego una escala tipografica central mediante `audit-readable` para toda
  la vista y sus componentes hijos.
- Los textos equivalentes a 9, 10 y 11px aumentaron a 11, 12 y 13px.
- Los controles de fecha, selectores, etiquetas y valores del detalle se
  alinearon con la misma escala.
- Se conservaron las dimensiones de filas, tarjetas y controles para mejorar
  lectura sin inflar innecesariamente el modulo.

**Archivos modificados**

- `frontend/src/views/AuditView.vue`
- `frontend/src/components/audit/README.md`
- `bitacora/bitacora.md`

## 2026-09-23 - Escala tipografica comun para modulos

**Que se hizo**

- La escala de legibilidad estrenada en Auditoria se movio al layout privado
  mediante la clase `module-readable`.
- Todos los modulos convierten textos de 9, 10 y 11px en 11, 12 y 13px dentro
  del area principal.
- Las rutas `Activos` y `AppActivos` quedan excluidas para conservar la densidad
  especial de Fleet, mapas, itinerarios y controles operativos.
- El header global y la sidebar no cambian porque se renderizan fuera de
  `main.module-readable`.

**Archivos modificados**

- `frontend/src/App.vue`
- `frontend/src/views/AuditView.vue`
- `frontend/src/components/audit/README.md`
- `bitacora/bitacora.md`

**Por que se hizo**

La navegacion anterior desaparecia por completo al cerrarse y repetia el mismo
marcado para cada modulo. El nuevo esquema mantiene acceso rapido a los modulos
en escritorio, reduce el espacio ocupado y evita inconsistencias entre la vista
compacta y la expandida.

**Archivos modificados**

- `frontend/src/components/Layout/AppSidebar.vue`
- `frontend/src/components/Layout/README.md`
- `bitacora/bitacora.md`

**Validacion**

- `npm run lint`
- `npm run build -- --logLevel error`

## 2026-09-16 - Modularizacion de disparo de alertas

### Objetivo

Sacar de `AlarmConfigPanel.vue` el bloque mas grande que quedaba dentro del
modal: la configuracion de condiciones y horario de disparo.

### Cambios realizados

- Se creo `AlarmRuleTriggerSection.vue`.
- Se movio la UI de condiciones por tipo de alerta: velocidad, bateria, sin
  senal, geocerca, detencion, encendido y combustible.
- Se movio la UI de seleccion de geocercas y grupos dentro de la condicion de
  geocerca.
- Se movio la UI de horario de evaluacion.
- `AlarmConfigPanel.vue` mantiene el draft, validacion, armado de payload y
  guardado.
- Se corrigio la responsabilidad de estilos: la grilla y controles de disparo
  viven en `AlarmRuleTriggerSection.vue`.

### Por que se hizo

`AlarmConfigPanel.vue` seguia siendo demasiado grande y mezclaba orquestacion con
la vista mas compleja del formulario. Separar el disparo reduce el contenedor y
deja la parte condicional aislada para futuras mejoras.

### Archivos modificados

- `frontend/src/components/alarms/AlarmConfigPanel.vue`
- `frontend/src/components/alarms/AlarmRuleTriggerSection.vue`
- `frontend/src/components/alarms/README.md`
- `bitacora/bitacora.md`
- `bitacora/modulos/modularizacion.md`

### Validacion

- `npm run lint`
- `npm run format:check`
- `npm run build -- --logLevel error`

## 2026-09-16 - Modularizacion de secciones del modal de alertas

### Objetivo

Continuar la modularizacion de `AlarmConfigPanel.vue` sin extraer todavia toda
la configuracion de disparo, que es la parte mas sensible del formulario.

### Cambios realizados

- Se creo `AlarmRuleGeneralSection.vue` para nombre, tipo y descripcion.
- Se creo `AlarmRuleScopeSection.vue` para empresa, alcance, activos especificos
  y etiquetas de acceso.
- Se creo `AlarmRuleNotificationsSection.vue` para canales de notificacion.
- `AlarmConfigPanel.vue` conserva el estado, draft, validacion, guardado y la
  configuracion de disparo.
- Se actualizaron README y el modulo de bitacora de modularizacion.

### Por que se hizo

El modal de crear/editar alerta seguia creciendo dentro del contenedor principal.
Separar secciones visuales simples reduce el tamano del archivo sin tocar aun la
logica delicada de condiciones por tipo, horarios y geocercas.

### Archivos modificados

- `frontend/src/components/alarms/AlarmConfigPanel.vue`
- `frontend/src/components/alarms/AlarmRuleGeneralSection.vue`
- `frontend/src/components/alarms/AlarmRuleScopeSection.vue`
- `frontend/src/components/alarms/AlarmRuleNotificationsSection.vue`
- `frontend/src/components/alarms/README.md`
- `bitacora/bitacora.md`
- `bitacora/modulos/modularizacion.md`

### Validacion

- `npm run lint`
- `npm run format:check`
- `npm run build -- --logLevel error`

## 2026-09-15 - Modularizacion inicial de configuracion de alertas

### Objetivo

Empezar el segundo punto de mejora separando archivos grandes uno por uno. La
primera pasada se hizo sobre `AlarmConfigPanel.vue`, que mezclaba filtros, tabla,
modal de formulario, condiciones por tipo, geocercas, acciones y estilos.

### Cambios realizados

- Se creo `AlarmRuleFilters.vue` para la busqueda y filtros de reglas
  automaticas.
- Se creo `AlarmRuleTable.vue` para el listado de reglas, estado, toggle,
  editar y eliminar.
- `AlarmConfigPanel.vue` quedo como contenedor de estado, draft, validacion y
  guardado, delegando filtros y tabla a componentes hijos.
- Se movieron los estilos de filtros y tabla a sus componentes correspondientes.
- Se documento el detalle de la modularizacion en
  `bitacora/modulos/modularizacion.md`.

### Por que se hizo

El panel de configuracion de alertas estaba concentrando demasiadas
responsabilidades y pasaba las 2200 lineas. Separar primero piezas visuales de
bajo riesgo permite mejorar mantenibilidad sin alterar todavia la logica del
formulario, que es la parte mas delicada.

### Archivos modificados

- `frontend/src/components/alarms/AlarmConfigPanel.vue`
- `frontend/src/components/alarms/AlarmRuleFilters.vue`
- `frontend/src/components/alarms/AlarmRuleTable.vue`
- `frontend/src/components/alarms/README.md`
- `bitacora/bitacora.md`
- `bitacora/modulos/modularizacion.md`

### Validacion

- `npm run lint`
- `npm run format:check`
- `npm run build -- --logLevel error`

## 2026-09-15 - Precarga de modales pesados bajo demanda

### Objetivo

Reducir trabajo oculto al entrar a Activos y Mantenciones, evitando descargar
modales grandes que el usuario aun no ha abierto.

### Cambios realizados

- `ActivosView.vue` dejo de llamar la precarga de modales de flota al montar.
- `useActivosFleetModals.js` ya no importa ni usa `preloadWhenIdle`.
- Los modales `AddActivoModal`, `FleetEditModal` y `FleetTerminalModal` siguen
  siendo async components, pero se descargan cuando se abren.
- `MaintenanceView.vue` dejo de precargar `MaintenanceActionModal` al montar.
- `MaintenanceActionModal` sigue cargandose async y bajo demanda cuando el
  usuario abre una accion de mantencion.
- Se actualizaron README locales de Activos y Mantenciones.

### Por que se hizo

Los modales de Activos concentran formularios y terminal de telemetria; el modal
de Mantenciones concentra varios formularios de mantenimiento, ordenes, costos y
exportacion. Precargarlos en reposo hacia que entrar a esas vistas descargara
trabajo no solicitado. Mantenerlos bajo demanda reduce carga inicial y evita
competir con mapa, tabla o filtros.

### Archivos modificados

- `frontend/src/views/ActivosView.vue`
- `frontend/src/composables/activos/view/useActivosFleetModals.js`
- `frontend/src/views/MaintenanceView.vue`
- `frontend/src/composables/activos/view/README.md`
- `frontend/src/components/maintenance/README.md`
- `bitacora/bitacora.md`

### Validacion

- `npm run lint`
- `npm run format:check`
- `npm run build -- --logLevel error`

## 2026-09-15 - Modales de reportes bajo demanda

### Objetivo

Evitar que el modulo de Reportes y la pestana Reportes de Fleet descarguen
modales grandes antes de que el usuario los use.

### Cambios realizados

- Se revisaron las cargas de `exceljs`, `jspdf`, `jspdf-autotable`,
  `html2canvas`, `jszip` y `chart.js`.
- Se confirmo que esos vendors pesados entran mediante `import()` dinamico:
  exportacion PDF/Excel, documentos de rutas, ZIP de geocercas y graficos.
- Se retiro la precarga pasiva de modales grandes desde `ReportsView.vue`.
- Se retiro la precarga pasiva de modales grandes desde `FleetReportsPanel.vue`.
- Los modales de ejecutar reporte, crear/editar plantilla, reglas y
  programaciones siguen usando `defineAsyncComponent`, pero se descargan al
  abrirse.
- Se actualizo la regla de mantenimiento para no volver a precargar por defecto
  modales con preview, mapas, graficos o exportacion.

### Por que se hizo

Aunque los vendors pesados ya estaban separados del bundle inicial, la precarga
de modales de reportes podia descargar logica de preview y configuracion en
segundo plano solo por entrar a Reportes. Mantenerlos bajo demanda reduce trabajo
oculto y evita competir con mapa, tablas o filtros.

### Archivos modificados

- `frontend/src/views/ReportsView.vue`
- `frontend/src/components/activos/fleet/FleetReportsPanel.vue`
- `frontend/src/views/README.md`
- `frontend/src/components/reports/README.md`
- `frontend/src/components/activos/fleet/README.md`
- `bitacora/bitacora.md`

### Validacion

- `npm run lint`
- `npm run format:check`
- `npm run build -- --logLevel error`

## 2026-09-15 - Precarga pasiva menos agresiva

### Objetivo

Reducir tirones de interfaz causados por precargar modulos pesados mientras el
usuario esta usando la plataforma.

### Cambios realizados

- La precarga global de rutas privadas dejo de intentar cargar todas las vistas.
- `preloadPrivateRouteViews()` ahora acepta una lista explicita de vistas
  livianas, limita cuantos chunks se cargan y respeta `saveData` del navegador.
- `App.vue` espera mas tiempo antes de iniciar esa precarga y solo solicita
  vistas livianas.
- En Fleet, la precarga pasiva queda limitada a `Alertas` y `Reportes`.
- `Itinerarios` y `Geocercas` ya no se descargan automaticamente al abrir
  Activos; se cargan cuando el usuario entra a esas pestanas.
- `preloadWhenIdle()` aumento sus tiempos por defecto y no corre cuando el
  navegador declara ahorro de datos.

### Por que se hizo

El analisis de build mostro chunks pesados de mapas, reportes, exportacion,
graficos y modulos grandes. Aunque estaban separados del bundle inicial, la
precarga podia traerlos en segundo plano demasiado pronto y competir con la
interaccion normal del usuario.

### Archivos modificados

- `frontend/src/App.vue`
- `frontend/src/router/index.js`
- `frontend/src/components/activos/fleet/FleetSectionContent.vue`
- `frontend/src/composables/ui/useIdlePreload.js`
- `frontend/src/router/README.md`
- `frontend/src/components/activos/fleet/README.md`
- `frontend/src/composables/ui/README.md`
- `bitacora/bitacora.md`

### Validacion

- `npm run lint`
- `npm run format:check`
- `npm run build -- --logLevel error`

## 2026-09-14 - Historial de alertas dentro de Fleet

### Objetivo

Agregar al panel lateral de Activos/Fleet una seccion `Alertas` que muestre solo
el historial operativo por empresa y por activos autorizados, sin duplicar el
configurador de reglas automaticas del modulo principal de Alertas.

### Cambios realizados

- Se corrigieron fences de Markdown pegados en archivos `.js` que dejaban el
  codigo dentro de strings y rompian los exports del build.
- `ActivosView.vue` calcula alertas autorizadas con los helpers existentes de
  `utils/alarms/alarmUtils.js`, usando `visibleAssets`, empresa activa y
  busqueda de la seccion.
- `FleetListPanel.vue` recibe `alertRows` y `alertSummary`, los entrega a la
  seccion activa y muestra el contador en la pestana `Alertas`.
- Se creo `FleetAlertsPanel.vue` como historial compacto con KPIs, filas de
  alerta, motivo, ubicacion, fecha y accion `Ver recorrido`.
- `FleetSectionContent.vue` monta la seccion `Alertas` con lazy-load igual que
  Reportes, Itinerarios y Geocercas.
- La accion `Ver recorrido` navega a `AppActivos` con
  `section=itinerarios`, `activoId`, `from=alertas`, `alarmId` y fecha para
  reutilizar el foco del punto GPS de la alerta.
- La seccion de Fleet tambien permite `Resolver` o `Reabrir` alertas cuando el
  usuario tiene permiso de edicion o administracion sobre Alertas.
- Fleet muestra `Activas` por defecto y `Limpiar` vuelve a ese filtro operativo.
  Al resolver una alerta desde Fleet, la vista vuelve a `Activas`, por lo que la
  fila desaparece sin borrar el registro historico.
- Se mantuvo la configuracion de reglas automaticas solo en el modulo principal
  de Alertas.

### Por que se hizo

Fleet necesita una lectura rapida del historial de alertas de la empresa activa
mientras el usuario monitorea activos. Duplicar el configurador dentro de Fleet
habria mezclado administracion con operacion y aumentado el riesgo de mantener
dos flujos distintos para lo mismo.

### Archivos modificados

- `frontend/src/views/ActivosView.vue`
- `frontend/src/components/activos/fleet/FleetAlertsPanel.vue`
- `frontend/src/components/activos/fleet/FleetListPanel.vue`
- `frontend/src/components/activos/fleet/FleetSectionContent.vue`
- `frontend/src/components/activos/fleet/FleetPanelHeader.vue`
- `frontend/src/composables/activos/fleet/useFleetPanelSearch.js`
- `frontend/src/composables/activos/fleet/useFleetPanelSections.js`
- `frontend/src/composables/activos/view/useActivosFilters.js`
- `frontend/src/composables/activos/view/useActivosPermissions.js`
- `frontend/src/composables/activos/view/useActivosWorkspacePersistence.js`
- README locales de Fleet y Views
- `bitacora/bitacora.md`

### Validacion

- Se ejecuto `node --test src/utils/alarms/alarmUtils.test.js src/utils/alarms/automaticAlertRuleUtils.test.js`.
- Se ejecuto `npm run format:check`.
- Se ejecuto `npm run lint`.
- Se ejecuto `npm run build -- --logLevel error`.

## 2026-09-14 - Cambio de nombre visible de Alarmas a Alertas

### Objetivo

Renombrar el modulo de cara al usuario desde `Alarmas` a `Alertas`, para que el
nombre coincida con el flujo funcional definido: configuracion de reglas de
alerta e historial de alertas activadas.

### Cambios realizados

- La navegacion principal ahora muestra `Alertas`.
- El header de contexto muestra `Alertas` cuando se entra al modulo.
- La ruta principal del modulo cambio a `/alertas` y
  `/app/:empresaId/alertas`.
- Las rutas anteriores `/alarmas` y `/app/:empresaId/alarmas` quedaron como
  alias legacy para no romper accesos guardados.
- Los mensajes visibles de resolver/reabrir ahora hablan de `alertas`.
- El permiso mock sigue usando la clave tecnica `alarms`, pero el nombre visible
  cambio a `Alertas`.
- Las descripciones de reglas automaticas ahora dicen que generan alertas, no
  alarmas.
- Se actualizaron README generales y locales para usar el nombre vigente del
  modulo.

### Por que se hizo

El modulo ya estaba funcionando como un centro de alertas: por un lado se
configuran reglas automaticas y por otro se revisan alertas generadas. Mantener
`Alarmas` en la UI mezclaba el lenguaje y hacia menos claro el flujo.

### Archivos modificados

- `frontend/src/router/index.js`
- `frontend/src/components/Layout/AppSidebar.vue`
- `frontend/src/components/Layout/AppHeader.vue`
- `frontend/src/views/AlarmsView.vue`
- `frontend/src/components/alarms/AlarmFilters.vue`
- `frontend/src/components/alarms/AlarmDetailPanel.vue`
- `frontend/src/utils/alarms/automaticAlertRuleUtils.js`
- `frontend/src/data/mockDatabase.js`
- `README.md`
- `frontend/README.md`
- `frontend/docs/archivos-criticos.md`
- `frontend/docs/flujos-principales.md`
- README locales dentro de `frontend/src/`
- `bitacora/bitacora.md`

### Validacion

- Se ejecuto `node --test src/utils/alarms/alarmUtils.test.js src/utils/alarms/automaticAlertRuleUtils.test.js`.
- Se ejecuto `npm run format:check`.
- Se ejecuto `npm run lint`.
- Se ejecuto `npm run build -- --logLevel error`.

## 2026-09-11 - Modal de creacion y edicion de alertas automaticas

### Objetivo

Cambiar la creacion y edicion de reglas automaticas desde una barra lateral a un
modal centrado, para que la tabla de configuracion use todo el ancho disponible y
el formulario se abra solo cuando el usuario selecciona `Nueva alerta` o
`Editar`.

### Cambios realizados

- `AlarmConfigPanel.vue` ya no renderiza el editor como segunda columna.
- El formulario de crear/editar ahora se muestra en un modal con overlay.
- La tabla de reglas mantiene una sola columna principal y no cambia de ancho al
  abrir el formulario.
- El modal no aparece por defecto al entrar a Configuracion.
- Al guardar una regla creada o editada, el modal se cierra automaticamente.
- Se mantuvo la misma logica de guardado, validacion, geocercas, alcance,
  horarios y notificaciones.
- Se actualizaron README locales para reflejar que el editor es modal.

### Por que se hizo

La barra lateral dejaba la tabla comprimida y hacia que el formulario se sintiera
como parte permanente de la pantalla. El modal separa mejor la accion puntual de
crear/editar y permite que el listado de reglas conserve el ancho completo.

### Archivos modificados

- `frontend/src/components/alarms/AlarmConfigPanel.vue`
- `frontend/src/components/alarms/README.md`
- `frontend/src/views/README.md`
- `bitacora/bitacora.md`

### Validacion

- Se ejecuto `npm run lint`.
- Se ejecuto `npm run build -- --logLevel error`.
- Se ejecuto `npm run format:check`.

## 2026-09-11 - Seleccion real de geocercas en reglas automaticas

### Objetivo

Evitar que las alertas automaticas de tipo geocerca dependan de un texto libre.
La regla debe poder aplicarse a todas las geocercas, a un grupo de geocercas o a
geocercas especificas seleccionadas desde las zonas reales del modulo Activos.

### Cambios realizados

- `AlarmsView.vue` ahora conecta `useGeofences` y entrega `geofences` y
  `geofenceGroups` al panel de configuracion de alertas.
- En `AlarmConfigPanel.vue`, la condicion de tipo `geofence` cambio de un input
  de texto a un flujo estructurado:
  - evento de geocerca: entrada, salida o entrada/salida;
  - alcance de geocercas: todas, grupo o geocercas especificas;
  - selector de grupo cuando se elige `Grupo de geocercas`;
  - buscador y checks cuando se elige `Geocercas especificas`.
- Se agrego validacion para impedir guardar una regla de geocerca con grupo
  vacio o sin geocercas marcadas cuando el alcance es especifico.
- `automaticAlertRuleUtils.js` ahora normaliza y conserva `geofenceScope`,
  `geofenceGroupId`, `geofenceGroupName`, `geofenceIds` y `geofenceNames`.
- La etiqueta de condicion en la tabla ahora explica el alcance configurado, por
  ejemplo `Salir - Grupo Bodegas` o `Ingresar - 2 geocercas`.
- Se corrigio la seleccion del alcance de geocerca para que `Grupo de
geocercas` y `Geocercas especificas` siempre puedan elegirse; si no hay datos,
  el panel muestra el mensaje correspondiente en vez de parecer que la opcion no
  responde.
- Se agregaron tests para verificar que la normalizacion mantiene los objetivos
  de geocerca y que la etiqueta de condicion se genera correctamente.
- Se actualizaron README y docs del modulo para dejar claro que las reglas de
  geocerca usan selecciones reales, no texto libre.

### Por que se hizo

Una alerta de geocerca debe quedar asociada a entidades reales para que despues
pueda evaluarse contra telemetria y mantenerse consistente si el usuario edita
la regla. El texto libre no garantiza que exista la geocerca ni permite distinguir
entre aplicar a todas, a un grupo o a una seleccion puntual.

### Archivos modificados

- `frontend/src/views/AlarmsView.vue`
- `frontend/src/components/alarms/AlarmConfigPanel.vue`
- `frontend/src/utils/alarms/automaticAlertRuleUtils.js`
- `frontend/src/utils/alarms/automaticAlertRuleUtils.test.js`
- `frontend/src/components/alarms/README.md`
- `frontend/src/utils/alarms/README.md`
- `frontend/src/views/README.md`
- `frontend/docs/flujos-principales.md`
- `frontend/docs/archivos-criticos.md`
- `README.md`
- `bitacora/bitacora.md`

### Validacion

- Se ejecuto `npm test -- src/utils/alarms/automaticAlertRuleUtils.test.js`.
- Se ejecuto `npm run lint`.
- Se ejecuto `npm run format:check`.
- Se ejecuto `npm run build -- --logLevel error`.

## 2026-09-11 - Configuracion de alertas como panel principal

### Objetivo

Convertir la configuracion de alertas automaticas en un panel propio dentro del
modulo Alarmas, separandola visual y funcionalmente del historial de alertas ya
activadas.

### Cambios realizados

- Se reemplazo el acceso por modal por dos paneles superiores:
  `Historial` y `Configuracion`.
- `Historial` mantiene el listado de alertas ocurridas, detalle lateral,
  resolucion/reapertura y navegacion a Itinerarios con el punto de alerta.
- `Configuracion` ahora muestra filtros, tabla de reglas y formulario para crear
  o editar reglas automaticas.
- El formulario de configuracion permite definir:
  - nombre, tipo y descripcion;
  - empresa;
  - alcance por toda la flota, activos especificos o etiquetas de acceso;
  - condicion segun tipo de alerta;
  - horario siempre o personalizado;
  - notificaciones en plataforma o correo.
- El formulario ahora se puede cerrar de forma real desde la `X` o
  `Cancelar`; `Nueva alerta` y `Editar` lo vuelven a abrir cuando corresponde.
- Se retiro `WhatsApp` de la interfaz de configuracion porque no existe todavia
  una integracion real de envio para ese canal.
- Se elimino el componente modal antiguo de reglas automaticas para evitar dos
  experiencias superpuestas.
- Se amplio la normalizacion de reglas para persistir `description`,
  `schedule`, `notificationChannels` y `assetScope.assetTagIds`.
- Se agrego soporte de alcance por etiquetas de acceso al armado de filas de
  reglas automaticas.
- Se amplio la semilla mock de reglas para cubrir casos tipicos: velocidad,
  bateria, sin senal, geocercas, horario, detencion y combustible.
- Se actualizo documentacion tecnica y README para reflejar que reglas e
  historial son paneles separados.
- Se ajusto la vista para acercarla a la referencia: `Configuracion` abre por
  defecto, los tabs principales viven en la cabecera con iconos, el boton
  `Nueva alerta` queda arriba a la derecha y la lista de reglas se renderiza
  como tabla compacta en vez de cards separadas.
- Se pulio el historial de alertas para evitar jerarquias duplicadas:
  - se dejo `Ver recorrido` solo en el detalle de la alerta seleccionada;
  - el filtro de estado usa `Todas`, `Activas` y `Resueltas`;
  - la lista incluye encabezados y aprovecha el espacio central con ubicacion;
  - el panel lateral bajo peso visual en bordes, iconos, espaciado y botones.
- En configuracion de alertas se estabilizo el toggle de activa/desactivada:
  al cambiar estado la fila ya no salta por reordenamiento automatico, y el
  switch usa una transicion corta solo para el indicador.
- Se corrigio el refresco interno del formulario para que el toggle no reabra el
  panel lateral ni cambie el ancho de la tabla cuando el editor esta cerrado.
- Se retiro el encabezado redundante de `Alarmas` dentro de la vista, dejando la
  identificacion principal al `AppHeader` y ganando espacio vertical para los
  controles y tablas.
- El paso `Condiciones` del formulario de reglas automaticas ahora cambia segun
  el tipo de alerta:
  - velocidad usa umbral y duracion;
  - bateria usa voltaje o porcentaje;
  - sin senal usa minutos sin reporte;
  - geocerca usa evento de entrada/salida y geocerca objetivo;
  - detencion usa minutos y estado de motor;
  - encendido usa la regla de fuera de horario;
  - combustible usa baja, unidad y ventana de tiempo.
- Se actualizo la normalizacion de reglas para conservar esos campos especificos
  y mostrar condiciones legibles en la tabla.

### Por que se hizo

El flujo anterior escondia la configuracion dentro de un modal y hacia que el
modulo pareciera tener una sola responsabilidad. En la practica hay dos
responsabilidades distintas:

```txt
Configuracion de alertas
-> reglas automaticas que definen condiciones futuras

Historial de alertas
-> eventos ya activados por activos autorizados
-> detalle operativo
-> recorrido del dia en Itinerarios
```

Separarlo evita que acciones como `Ver recorrido` aparezcan donde se crean las
reglas, y permite que configurar alertas sea una tarea administrativa clara.

### Archivos modificados

- `frontend/src/views/AlarmsView.vue`
- `frontend/src/components/alarms/AlarmConfigPanel.vue`
- `frontend/src/components/alarms/AutomaticAlertsModal.vue`
- `frontend/src/utils/alarms/automaticAlertRuleUtils.js`
- `frontend/src/utils/alarms/automaticAlertRuleUtils.test.js`
- `frontend/src/data/mockAutomaticAlertRules.js`
- `frontend/src/components/alarms/README.md`
- `frontend/src/views/README.md`
- `frontend/docs/flujos-principales.md`
- `frontend/docs/archivos-criticos.md`
- `README.md`
- `frontend/README.md`

### Validacion

- Se ejecuto `node --test --test-reporter=dot "src/**/*.test.js"`.
- Se ejecuto `npm run lint`.
- Se ejecuto `npm run format:check`.
- Se ejecuto `npm run build -- --logLevel error`.

## 2026-09-10 - Historial de alertas conectado con Itinerarios

### Objetivo

Separar claramente los dos paneles de alertas: el modulo principal debe mostrar
el historial de alertas activadas y el modal debe quedar solo para configurar
reglas automaticas. Desde una alerta activada, el usuario debe poder revisar el
recorrido del activo en Itinerarios y ubicar el punto donde se genero la alerta.

### Cambios realizados

- Se cambio el titulo principal de Alarmas a `Historial de alertas`.
- Se cambio la accion superior y del detalle desde ver mapa vivo hacia
  `Ver recorrido`.
- La navegacion desde Alarmas ahora envia a `AppActivos` con:
  `section=itinerarios`, `activoId`, `date`, `from=alarmas` y `alarmId`.
- `ActivosView.vue` lee esos parametros, respeta la seccion Itinerarios y no
  vuelve automaticamente a la tabla de activos cuando existe `activoId`.
- `ActivosView.vue` busca la alerta por `alarmId`, valida empresa y activo, y
  arma un `itineraryContextRequest` con la alerta enfocada.
- `ItineraryPanel.vue` acepta fecha exacta desde contexto externo, selecciona el
  activo, genera el recorrido del dia y puede usar fallback de prototipo solo
  para este flujo.
- `ItineraryPanel.vue` calcula el punto GPS mas cercano a la hora de la alerta y
  lo emite como `selectedItineraryPoint`.
- `useMapItinerary.js` muestra un tooltip especial para puntos de alerta con
  titulo, patente, hora, velocidad, descripcion y direccion del punto.
- `mapSignatures.js` incluye campos de alerta en la firma del punto seleccionado
  para refrescar el tooltip cuando cambia la alerta enfocada.
- Se actualizo la documentacion local de alarmas, vistas, itinerarios, mapa y
  composables de Activos.

### Por que se hizo

El historial de alertas y la configuracion de reglas automaticas son flujos
distintos. El historial responde a eventos ya ocurridos y debe permitir revisar
su contexto operativo. La configuracion crea reglas que en el futuro generan
eventos, pero no debe absorber el historial ni sus acciones.

La navegacion a Itinerarios permite revisar el recorrido completo del dia sin
perder el contexto de la alerta. La regla aplicada queda:

```txt
alerta activada
-> activo autorizado
-> dia de ocurrencia
-> recorrido del activo
-> punto GPS mas cercano a la hora de la alerta
-> tooltip con detalle de la alerta
```

### Archivos modificados

- `frontend/src/views/AlarmsView.vue`
- `frontend/src/components/alarms/AlarmDetailPanel.vue`
- `frontend/src/components/alarms/AlarmList.vue`
- `frontend/src/views/ActivosView.vue`
- `frontend/src/components/activos/itinerarios/ItineraryPanel.vue`
- `frontend/src/composables/activos/map/useMapItinerary.js`
- `frontend/src/composables/activos/map/mapSignatures.js`
- `frontend/src/composables/activos/view/useActivosWorkspacePersistence.js`
- `frontend/src/components/alarms/README.md`
- `frontend/src/views/README.md`
- `frontend/src/components/activos/itinerarios/README.md`
- `frontend/src/composables/activos/map/README.md`
- `frontend/src/composables/activos/view/README.md`
- `README.md`
- `frontend/README.md`
- `frontend/docs/flujos-principales.md`
- `frontend/docs/archivos-criticos.md`

### Validacion

- Se ejecuto `npm run format:check`.
- Se ejecuto `npm run lint`.
- Se ejecuto `node --test --test-reporter=dot "src/**/*.test.js"`.
- Se ejecuto `npm run build -- --logLevel error`.

## 2026-09-10 - Panel de alertas automaticas

### Objetivo

Agregar un panel modal para configurar reglas automaticas que pueden originar
alarmas operativas, sin mezclar esa configuracion con el listado de alarmas ya
generadas.

### Cambios realizados

- Se agrego `AutomaticAlertsModal.vue` como modal de configuracion dentro del
  modulo de Alarmas.
- Se conecto `AlarmsView.vue` con un boton `Alertas automaticas`, manteniendo el
  panel como modal y no como ruta separada.
- Se creo `mockAutomaticAlertRules.js` como semilla de reglas por empresa.
- Se creo `useAutomaticAlertRulesService.js` con persistencia local en
  `sinergy-automatic-alert-rules`.
- Se agregaron operaciones locales para crear, editar, activar/pausar y eliminar
  reglas automaticas.
- Se agrego `automaticAlertRuleUtils.js` para normalizar reglas, resolver empresa
  y activos afectados, filtrar, ordenar y calcular resumen.
- Se agregaron tests para alcance por empresa, activos autorizados, filtros,
  orden, resumen y defaults por tipo de alerta.
- Se actualizo documentacion principal, README internos y flujos tecnicos para
  explicar la separacion entre reglas automaticas y alarmas ocurridas.

### Por que se hizo

El centro de alarmas debe atender eventos ya generados. Las alertas automaticas
pertenecen a otra responsabilidad: configurar condiciones operativas que, cuando
exista evaluacion real de telemetria/backend, podran crear nuevas alarmas. Por
eso se dejo como modal administrativo separado, con su propio servicio, mock y
utils.

La regla conceptual queda:

```txt
reglas automaticas
-> empresa y activos afectados
-> condicion operativa
-> futura generacion de alarmas
-> centro de alarmas
```

### Archivos modificados

- `frontend/src/views/AlarmsView.vue`
- `frontend/src/components/alarms/AutomaticAlertsModal.vue`
- `frontend/src/services/alarms/useAutomaticAlertRulesService.js`
- `frontend/src/utils/alarms/automaticAlertRuleUtils.js`
- `frontend/src/utils/alarms/automaticAlertRuleUtils.test.js`
- `frontend/src/data/mockAutomaticAlertRules.js`
- `README.md`
- `frontend/README.md`
- `frontend/src/README.md`
- `frontend/src/components/README.md`
- `frontend/src/components/alarms/README.md`
- `frontend/src/services/README.md`
- `frontend/src/services/alarms/README.md`
- `frontend/src/utils/README.md`
- `frontend/src/utils/alarms/README.md`
- `frontend/src/data/README.md`
- `frontend/src/views/README.md`
- `frontend/docs/flujos-principales.md`
- `frontend/docs/archivos-criticos.md`

### Validacion

- Se ejecuto `npm run lint`.
- Se ejecuto `node --test --test-reporter=dot "src/**/*.test.js"`.
- Se ejecuto `npm run format:check`.
- Se ejecuto `npm run build -- --logLevel error`.

## 2026-09-10 - Redisenio visual de Alarmas

### Objetivo

Recrear el modulo de Alarmas como una bandeja operativa similar a la referencia:
cabecera limpia, tabs de estado, filtros compactos, lista seleccionable y panel
de detalle fijo a la derecha.

### Cambios realizados

- Se reemplazo la presentacion tipo tabla por una bandeja de filas
  seleccionables.
- Se agrego `AlarmDetailPanel.vue` para mostrar el detalle dentro de la vista,
  sin abrir modal.
- Se redisenio `AlarmSummaryHeader.vue` como tabs `Todas`, `Activas` y
  `Resueltas`.
- Se simplifico `AlarmFilters.vue` para usar busqueda, estado, empresa, fecha y
  limpiar filtros.
- Se ajusto `AlarmsView.vue` para seleccionar automaticamente la primera alarma
  visible y mantener el panel lateral sincronizado.
- Se agrego filtro `active` en `alarmUtils.js`, interpretado como toda alarma no
  resuelta.
- Se agrego test unitario para asegurar que `active` incluya alarmas abiertas y
  cualquier alarma no resuelta, pero excluya resueltas.
- Se actualizo documentacion local de componentes y vistas.
- Se ajusto la escala visual del modulo para alinearlo con el resto de la
  plataforma: titulos mas contenidos, tabs menos altos, filtros compactos, filas
  mas densas, bordes sutiles y panel lateral menos pesado.
- Se elimino el flujo de estado intermedio, dejando el ciclo operativo en dos
  estados: alarma activa y alarma resuelta.
- Se elimino el modal antiguo de detalle para evitar dos detalles con acciones
  distintas.

### Por que se hizo

La version anterior funcionaba, pero se leia como tabla tecnica. La referencia
necesita un flujo mas operativo: revisar una lista, seleccionar una alarma y
atenderla desde el panel lateral sin perder contexto.

### Archivos modificados

- `frontend/src/views/AlarmsView.vue`
- `frontend/src/components/alarms/AlarmSummaryHeader.vue`
- `frontend/src/components/alarms/AlarmFilters.vue`
- `frontend/src/components/alarms/AlarmList.vue`
- `frontend/src/components/alarms/AlarmDetailPanel.vue`
- `frontend/src/components/alarms/AlarmStatusBadge.vue`
- `frontend/src/services/alarms/useAlarmsService.js`
- `frontend/src/data/mockAlarms.js`
- `frontend/src/utils/alarms/alarmUtils.js`
- `frontend/src/utils/alarms/alarmUtils.test.js`
- `frontend/src/components/alarms/README.md`
- `frontend/src/views/README.md`

### Validacion

- Se ejecuto `npm run lint`.
- Se ejecuto `node --test --test-reporter=dot "src/**/*.test.js"`.
- Se ejecuto `npm run format:check`.
- Se ejecuto `npm run build -- --logLevel error`.

## 2026-09-09 - Modulo de alarmas

### Objetivo

Crear un modulo propio de Alarmas para revisar eventos operativos de la flota sin
mezclarlos con Auditoria ni con Reportes. La vista debe respetar la misma regla
central del proyecto: primero permisos y etiquetas de acceso, despues filtros
visuales.

### Cambios realizados

- Se creo `AlarmsView.vue` como pantalla principal del modulo.
- Se agrego ruta general `/alarmas` para administradores de plataforma y ruta
  por empresa `/app/:empresaId/alarmas` para usuarios con permiso.
- Se agrego acceso en `AppSidebar.vue` con resolucion de empresa activa o
  primera empresa accesible con permiso de alarmas.
- Se actualizo `AppHeader.vue` para identificar el contexto de Alarmas y permitir
  entrada de empresa cuando ese modulo sea el disponible.
- Se agrego la funcion de permiso `alarms` en los datos mock, habilitada para
  administrador y perfiles operativos de demo.
- Se ajusto la normalizacion de la base mock para que accesos seed persistidos
  puedan incorporar funciones nuevas definidas en el seed, sin habilitarlas en
  accesos personalizados.
- Se creo `mockAlarms.js` como semilla de alarmas por empresa y activo.
- Se creo `useAlarmsService.js` para persistir alarmas en `localStorage` con la
  clave `sinergy-alarms`.
- Se agregaron acciones de prototipo para resolver y reabrir alarmas.
- Se agrego auditoria local para las acciones de estado de alarma.
- Se agregaron componentes visuales para KPIs, filtros, tabla, badges y modal de
  detalle.
- Se agrego `alarmUtils.js` para construir filas, recortar por activos
  autorizados, filtrar, ordenar y resumir alarmas.
- Se agrego test unitario para verificar alcance, filtros, orden y resumen.
- Se actualizo la documentacion principal y los README internos para ubicar el
  modulo dentro de la jerarquia del proyecto.

### Por que se hizo

Alarmas representa seguimiento operativo de eventos activos o recientes. No debe
confundirse con Auditoria, porque Auditoria registra acciones del usuario sobre
la plataforma. Tampoco debe vivir dentro de Reportes, porque Reportes genera
documentos y plantillas, mientras Alarmas requiere una bandeja de trabajo para
atender eventos.

El recorte por permisos se dejo antes del render para evitar que un usuario vea
alarmas de vehiculos fuera de su alcance. La logica correcta queda:

```txt
alarmas mock/localStorage
-> activos visibles por permisos/etiquetas
-> alarmas autorizadas
-> filtros visuales
-> tabla, detalle y acciones
```

### Archivos modificados

- `frontend/src/views/AlarmsView.vue`
- `frontend/src/components/alarms/AlarmSummaryHeader.vue`
- `frontend/src/components/alarms/AlarmFilters.vue`
- `frontend/src/components/alarms/AlarmList.vue`
- `frontend/src/components/alarms/AlarmStatusBadge.vue`
- `frontend/src/components/alarms/AlarmDetailPanel.vue`
- `frontend/src/services/alarms/useAlarmsService.js`
- `frontend/src/utils/alarms/alarmUtils.js`
- `frontend/src/utils/alarms/alarmUtils.test.js`
- `frontend/src/data/mockAlarms.js`
- `frontend/src/data/mockDatabase.js`
- `frontend/src/composables/mock/useMockDatabase.js`
- `frontend/src/router/index.js`
- `frontend/src/components/Layout/AppSidebar.vue`
- `frontend/src/components/Layout/AppHeader.vue`
- `README.md`
- `frontend/README.md`
- `frontend/src/README.md`
- `frontend/src/views/README.md`
- `frontend/src/components/README.md`
- `frontend/src/components/alarms/README.md`
- `frontend/src/services/README.md`
- `frontend/src/services/alarms/README.md`
- `frontend/src/utils/README.md`
- `frontend/src/utils/alarms/README.md`
- `frontend/src/data/README.md`
- `frontend/src/router/README.md`
- `frontend/src/components/Layout/README.md`
- `frontend/docs/flujos-principales.md`
- `frontend/docs/archivos-criticos.md`

### Validacion

- Se ejecuto `npm run format:check`.
- Se ejecuto `npm run lint`.
- Se ejecuto `node --test --test-reporter=dot "src/**/*.test.js"`.
- Se ejecuto `npm run build -- --logLevel error`.

## 2026-09-09 - Itinerarios responsive

### Objetivo

Corregir el comportamiento responsive del modulo de Itinerarios dentro de Fleet.
La vista tenia controles con muchos anchos automaticos en una sola fila y tablas
que dependian del scroll horizontal para verse en pantallas chicas.

### Cambios realizados

- Se ajusto `ItineraryPanel.vue` para que la busqueda, selector de activos,
  botones de buscar/actualizar/comparar/exportar/limpiar y rangos de fecha
  puedan envolver en varias lineas.
- Se corrigio la posicion del dropdown de dispositivos para abrir debajo del
  bloque completo de controles, no encima cuando el buscador crece en mobile.
- Se agrego vista mobile de cards en `ItineraryTable.vue` bajo `lg`, manteniendo
  la tabla de escritorio con columnas configurables y ordenamiento.
- Se ajusto la cabecera de `ItineraryTable.vue` para que paginacion, filas,
  orden y columnas no se corten en anchos reducidos.
- Se agrego presentacion mobile tipo cards en el detalle diario de
  `ItineraryDaySummary.vue` bajo `md`.
- Se ajustaron alturas de graficos en mobile en `ItineraryCharts.vue` y
  `ItineraryDaySummary.vue`.
- Se cambio `ItinerarySummary.vue` para usar una columna en pantallas muy
  pequenas antes de pasar a dos y cuatro columnas.

### Por que se hizo

Itinerarios mezcla filtros, seleccion de dispositivos, graficos, resumen y
tablas de datos. En escritorio la tabla es correcta, pero en mobile genera cortes
o scroll excesivo. Las cards entregan lectura rapida y mantienen las acciones
principales sin cambiar la logica de generacion, seleccion, comparacion ni
exportacion.

### Archivos modificados

- `frontend/src/components/activos/itinerarios/ItineraryPanel.vue`
- `frontend/src/components/activos/itinerarios/ItineraryTable.vue`
- `frontend/src/components/activos/itinerarios/ItineraryDaySummary.vue`
- `frontend/src/components/activos/itinerarios/ItineraryCharts.vue`
- `frontend/src/components/activos/itinerarios/ItinerarySummary.vue`
- `frontend/src/components/activos/itinerarios/README.md`

### Validacion

- Se ejecuto `npm run format:check`.
- Se ejecuto `npm run lint`.
- Se ejecuto `node --test --test-reporter=dot "src/**/*.test.js"`.
- Se ejecuto `npm run build -- --logLevel error`.

## 2026-09-09 - Fleet activos responsive

### Objetivo

Corregir el comportamiento responsive del modulo de activos dentro de Fleet. La
vista funcionaba bien en escritorio ancho, pero en pantallas menores el panel de
activos y el mapa se apilaban sin filas definidas y la tabla dependia demasiado
del scroll horizontal.

### Cambios realizados

- Se definieron filas responsive en `ActivosView.vue` antes del breakpoint `xl`
  para que Fleet y mapa compartan el alto disponible al apilarse.
- Se agrego `min-w-0` a los contenedores principales para permitir que los hijos
  reduzcan su ancho sin provocar overflow lateral.
- Se ajusto `FleetPanelHeader.vue` para que busqueda, limpiar orden, agregar
  activo y columnas puedan envolverse en varias lineas cuando el panel queda
  angosto.
- Se mantuvo `FleetTable.vue` como tabla unica de activos en todos los tamanos.
- Se conservo el scroll horizontal propio de la tabla para columnas extensas,
  incluyendo ordenamiento, redimension de columnas, seleccion y menu contextual.
- El footer de paginacion ahora puede envolver sus controles para evitar cortes
  horizontales.

### Por que se hizo

El modulo de activos trabaja mejor como tabla porque permite comparar muchas
columnas de telemetria. El responsive se ajusto alrededor de esa tabla mediante
contenedores con scroll, header flexible y paginacion compacta, sin cambiar el
patron visual principal del modulo.

### Archivos modificados

- `frontend/src/views/ActivosView.vue`
- `frontend/src/components/activos/fleet/FleetPanelHeader.vue`
- `frontend/src/components/activos/fleet/FleetTable.vue`
- `frontend/src/components/activos/fleet/README.md`

### Validacion

- Se ejecuto `npm run format:check`.
- Se ejecuto `npm run lint`.
- Se ejecuto `node --test --test-reporter=dot "src/**/*.test.js"`.
- Se ejecuto `npm run build`.

## 2026-09-07 - Usuarios

### Objetivo

Agregar al directorio de usuarios el mismo funcionamiento de catalogo que se
incorporo en Empresas: ordenamiento, cambio entre lista/cards y paginacion, sin
modificar la logica de permisos, filtros, accesos ni el drawer de detalle.

### Cambios realizados

- Se agrego estado `userViewMode` en el composable de usuarios.
- Se agregaron `userSortKey`, `userSortDirection`, `currentPage`, `pageSize`,
  `sortedUsers` y `paginatedUsers`.
- Se conecto `userViewMode` desde `UserManagementView.vue` hacia
  `UserListPanel.vue`.
- Se agrego una toolbar de catalogo en la cabecera del listado de usuarios con
  selector de orden, cambio de direccion y selector lista/cards.
- Se mantuvo la vista existente como modo `Lista`.
- Se agrego una vista `Cards` que usa los mismos usuarios filtrados y muestra
  nombre, correo, estado, rol principal, cantidad de accesos y resumen de
  empresa.
- Al seleccionar un usuario desde lista o cards se abre el mismo drawer de
  detalle existente.
- Se reemplazo el patron de `Mostrar mas` por paginacion real, igual que en
  Empresas.
- Los cambios de filtros u orden reinician la pagina actual para evitar paginas
  vacias.
- Se ajusto la cabecera del listado para responder mejor en pantallas pequenas
  cuando aparece el selector de vista.

### Por que se hizo

El modulo de usuarios ya tenia una vista tipo lista/tabla, pero no compartia el
flujo completo de catalogo que quedo en Empresas. Agregar cards, ordenamiento y
paginacion deja ambos modulos con el mismo patron operativo: filtrar, ordenar,
elegir la vista y navegar paginas.

El cambio se dejo en el nivel de presentacion y navegacion del directorio: los
permisos, accesos, alcances operativos, etiquetas y acciones de auditoria siguen
dependiendo de la misma logica existente. Las cards y la lista consumen el mismo
resultado filtrado, ordenado y paginado.

### Archivos modificados

- `frontend/src/views/UserManagementView.vue`
- `frontend/src/components/users/UserListPanel.vue`
- `frontend/src/composables/users/useUserAccessManagement.js`
- `frontend/src/components/users/README.md`
- `frontend/src/composables/users/README.md`
- `frontend/src/views/README.md`

### Validacion

- Se ejecuto `npm run format:check`.
- Se ejecuto `npm run lint`.
- Se ejecuto `node --test --test-reporter=dot "src/**/*.test.js"`.
- Se ejecuto `npm run build`.

## 2026-09-04 - Empresas

### Objetivo

Reorganizar visualmente el modulo de empresas para acercarlo a una vista de
gestion administrativa: filtros laterales, indicadores superiores y una tabla
principal compacta. La version anterior funcionaba como directorio de cards, pero
ocupaba mas espacio vertical y mezclaba busqueda, filtros y KPIs dentro del
header.

### Cambios realizados

- En esa version se simplifico la cabecera de Empresas y se mantuvo alli el
  boton `Nueva empresa`; su ubicacion actual se documenta en la entrada del
  `2026-09-23`.
- Se creo un panel lateral de filtros con busqueda, estado, region, ciudad y
  limpiar filtros.
- Se creo una franja de resumen con empresas totales, activas, suspendidas e
  inactivas.
- Se cambio el catalogo principal para usar tabla como vista principal.
- Se agrego toolbar de ordenamiento y cambio de vista tabla/grilla.
- Se reemplazo el patron de `Mostrar mas` por paginacion.
- Se agregaron filtros por region y ciudad usando opciones derivadas de las
  empresas disponibles.
- Se reemplazo el boton de tres puntos en la tabla por una accion explicita
  `Configurar`, ya que esa accion abre directamente el panel de configuracion de
  la empresa.
- Se ajusto el panel lateral de filtros para estirarse con el alto del contenido
  principal y no quedar visualmente mas corto que la tabla.
- Se cambio el overlay del panel de configuracion de empresa desde azul
  translucido a negro translucido y se aclaro el fondo interno del contenido para
  evitar que la pantalla se vea con tinte azul.
- Se ajusto el filtro visual `Inactivas` para incluir empresas con estado
  `inactive` e `internal`. El badge `Interna` se conserva en la tabla, pero no se
  muestra como filtro separado para mantener el panel simple.
- Se corrigio formato Prettier despues de la implementacion.

### Por que se hizo

La pantalla de Empresas necesitaba sentirse mas parecida a una herramienta de
administracion que a una grilla de tarjetas. La tabla permite comparar empresas
por RUT, ubicacion, estado, activos, usuarios y reportes base de forma mas
rapida. Separar filtros del header reduce ruido visual y deja la cabecera como
presentacion del modulo.

Tambien se corrigio la diferencia entre el resumen y los filtros: si las empresas
internas se cuentan como inactivas en el resumen, el filtro `Inactivas` debe
mostrar tambien esas empresas para no confundir al usuario.

### Archivos modificados

- `frontend/src/views/CompanyManagementView.vue`
- `frontend/src/components/companies/CompanyManagementHeader.vue`
- `frontend/src/components/companies/CompanyFiltersPanel.vue`
- `frontend/src/components/companies/CompanySummaryStrip.vue`
- `frontend/src/components/companies/CompanyCatalog.vue`
- `frontend/src/components/companies/CompanyConfigPanel.vue`
- `frontend/src/composables/companies/useCompanyManagement.js`
- `frontend/src/components/companies/README.md`
- `frontend/src/composables/companies/README.md`
- `frontend/src/views/README.md`

### Validacion

- Se ejecuto `npm run format:check`.
- Se ejecuto `npm run lint`.
- Se ejecuto `node --test --test-reporter=dot "src/**/*.test.js"`.
- Se ejecuto `npm run build`.

## 2026-09-04 - Geocercas

### Objetivo

Mejorar el flujo de gestion de geocercas en la vista de activos. Antes la
edicion y la eliminacion tenian comportamientos poco claros: al editar no habia
una salida explicita para cancelar, algunos cambios podian sentirse aplicados al
momento, y eliminar varias geocercas no estaba disponible desde el panel.

La meta fue dejar tres reglas simples:

- Editar una geocerca debe permitir `Guardar` o `Cancelar`.
- Eliminar varias geocercas debe ser posible, pero sin dejar la interfaz en modo
  seleccion por defecto.
- Mapa, panel lateral, estado seleccionado y auditoria deben quedar sincronizados.

### 1. Edicion de geocercas con guardar y cancelar

**Que se hizo**

- Se agrego boton `Guardar` en el panel de edicion.
- Se agrego boton `Cancelar` en el panel de edicion.
- Se separo la accion de salir de la accion de guardar.
- Al guardar, se confirma la geocerca editada y se cierra el modo edicion.
- Al cancelar, se descartan los cambios no confirmados y se vuelve al estado
  anterior.

**Por que se hizo**

El flujo anterior no dejaba suficientemente claro si los cambios estaban siendo
confirmados o solo preparados. Esto podia provocar que el usuario moviera puntos,
cambiara campos o ajustara la geocerca sin entender bien cuando quedaba guardada.

Con este cambio, la edicion funciona como un borrador: el usuario puede probar
cambios, revisar el resultado en el mapa y decidir si guarda o cancela.

**Archivos modificados**

- `frontend/src/components/activos/geocercas/GeofenceEditorPanel.vue`
- `frontend/src/components/activos/map/ActivosMapPanel.vue`
- `frontend/src/composables/activos/map/useActivosMap.js`
- `frontend/src/composables/activos/map/geofences/useMapGeofences.js`
- `frontend/src/composables/activos/map/geofences/useGeofenceEditing.js`
- `frontend/src/composables/activos/map/geofences/useMapPanelGeofenceActions.js`

### 2. Edicion como borrador antes de confirmar

**Que se hizo**

- Se evito que los cambios de geometria se emitan automaticamente al arrastrar
  puntos del poligono.
- Se evito que cambios de nombre, descripcion o color actualicen la geocerca
  final sin pasar por `Guardar`.
- Se agrego una funcion de guardado explicita para emitir la version final de la
  geocerca editada.
- Se mantuvo la vista previa del dibujo en el mapa mientras se edita.

**Por que se hizo**

La edicion de geocercas tiene alto riesgo operativo: mover un punto o cambiar un
radio puede alterar zonas de entrada, salida, permanencia o alertas asociadas. Por
eso la plataforma debe evitar cambios accidentales y dejar una confirmacion clara.

**Archivos modificados**

- `frontend/src/composables/activos/map/geofences/useGeofenceEditing.js`
- `frontend/src/composables/activos/map/geofences/useMapGeofences.js`
- `frontend/src/composables/activos/map/geofences/useMapPanelGeofenceActions.js`

### 3. Cancelacion limpia del modo edicion

**Que se hizo**

- Se agrego manejo de cancelacion desde el panel de edicion.
- Al cancelar, se cierra el modo edicion sin emitir cambios.
- Si la geocerca que se estaba editando deja de existir en la lista, el mapa sale
  automaticamente del modo edicion.
- Se actualizo el texto de ayuda para indicar que se debe guardar o cancelar.

**Por que se hizo**

Si una geocerca se elimina desde otro panel mientras estaba siendo editada, el
mapa podia quedar en un estado visual incoherente. Tambien era necesario que el
usuario pudiera salir de una edicion sin sentirse obligado a guardar.

**Archivos modificados**

- `frontend/src/components/activos/geocercas/GeofenceEditorPanel.vue`
- `frontend/src/components/activos/map/ActivosMapPanel.vue`
- `frontend/src/composables/activos/map/geofences/useMapGeofences.js`
- `frontend/src/composables/activos/map/geofences/useMapPanelGeofenceActions.js`

### 4. Eliminacion multiple de geocercas

**Que se hizo**

- Se agrego soporte para eliminar mas de una geocerca a la vez.
- Se agrego una funcion `deleteGeofences` para recibir varios IDs.
- La eliminacion multiple queda limitada a las geocercas visibles y disponibles
  dentro del contexto actual.
- Al eliminar varias, se actualiza la lista, se refresca el mapa y se limpia la
  seleccion activa si correspondia.
- Se agrego confirmacion antes de ejecutar la eliminacion multiple.

**Por que se hizo**

Antes habia que eliminar geocercas una por una. Eso era lento para limpieza o
mantencion de flotas con muchas zonas configuradas. La eliminacion multiple
reduce pasos, pero mantiene control mediante confirmacion y alcance acotado.

**Archivos modificados**

- `frontend/src/composables/activos/geocercas/useGeofences.js`
- `frontend/src/composables/activos/view/useActivosGeofenceActions.js`
- `frontend/src/composables/activos/fleet/useFleetPanelGeofences.js`
- `frontend/src/views/ActivosView.vue`
- `frontend/src/components/activos/fleet/FleetSectionContent.vue`
- `frontend/src/components/activos/fleet/FleetListPanel.vue`
- `frontend/src/components/activos/fleet/FleetGeofencePanel.vue`

### 5. Modo de seleccion multiple no visible por defecto

**Que se hizo**

- La lista de geocercas vuelve a mostrarse normal por defecto.
- Se agrego la accion `Eliminar varias` para activar el modo seleccion.
- Al entrar al modo seleccion, aparecen los checks y la barra de acciones.
- El boton cambia a `Cancelar seleccion` mientras el modo esta activo.
- Al cancelar seleccion, se limpian las geocercas marcadas.

**Por que se hizo**

Mostrar checks y una barra de seleccion desde el inicio hacia que la pantalla se
viera como si siempre estuviera en modo eliminar. Visualmente era mas pesado y
confundia una accion puntual con el estado normal del modulo.

Con este ajuste, la accion existe cuando se necesita, pero la vista principal se
mantiene limpia.

**Archivos modificados**

- `frontend/src/components/activos/fleet/FleetGeofencePanel.vue`
- `frontend/src/components/activos/fleet/README.md`

### 6. Auditoria de eliminacion multiple

**Que se hizo**

- Se agrego registro de auditoria para la eliminacion multiple.
- La accion registrada es `geofence:delete-bulk`.
- Se agrego etiqueta legible para auditoria: `Geocercas eliminadas`.

**Por que se hizo**

Eliminar varias geocercas puede afectar configuraciones operativas importantes.
La accion debe quedar trazable para saber quien elimino, cuando se hizo y que
tipo de operacion se ejecuto.

**Archivos modificados**

- `frontend/src/composables/activos/view/useActivosGeofenceActions.js`
- `frontend/src/views/AuditView.vue`

### 7. Documentacion actualizada

**Que se hizo**

- Se actualizaron README internos relacionados con fleet, geocercas, mapa y
  acciones de vista.
- Se dejo documentado el flujo de edicion con guardar/cancelar.
- Se dejo documentado el flujo de eliminacion multiple.
- Se dejo documentado que la seleccion multiple se activa manualmente y no aparece
  por defecto.

**Por que se hizo**

Los README internos sirven para entender rapidamente como esta organizado el
modulo y que responsabilidades tiene cada archivo. Como el flujo cambio en varias
capas, era necesario dejar registro para futuras modificaciones.

**Archivos modificados**

- `frontend/src/components/activos/fleet/README.md`
- `frontend/src/components/activos/geocercas/README.md`
- `frontend/src/composables/activos/geocercas/README.md`
- `frontend/src/composables/activos/map/geofences/README.md`
- `frontend/src/composables/activos/view/README.md`

### Validacion

**Que se valido**

- Se agrego prueba automatizada para la eliminacion multiple de geocercas.
- Se ejecuto la suite de tests del frontend.
- Se valido formato, lint y build del frontend despues de los cambios.

**Comandos utilizados**

- `node --test --test-reporter=dot "src/**/*.test.js"`
- `npm run lint`
- `npm run format:check`
- `npm run build`

**Archivo de prueba modificado**

- `frontend/src/composables/activos/geocercas/useGeofences.test.js`

## 2026-09-10 - Correccion de `Ver activo en mapa` desde Alarmas

**Que se hizo**

- Se cambio la navegacion del boton `Ver activo en mapa` para usar la ruta
  nombrada `AppActivos`.
- La navegacion ahora envia `activoId`, `from=alarmas` y `alarmId` como query.
- En la vista de Activos, cuando existe un `activoId` en la URL, se fuerza la
  seccion `activos`, se limpian filtros visuales de busqueda, estado, ciudad y
  grupo de vehiculos, y se selecciona el activo solicitado.
- La restauracion del workspace ya no pisa el activo solicitado por URL.
- Si un filtro visual anterior dejaba fuera al activo, la vista lo vuelve a
  incluir solamente desde las listas ya autorizadas de la empresa.

**Por que se hizo**

El boton podia navegar correctamente, pero la vista de Activos podia restaurar
un estado previo o conservar filtros visuales que escondian el activo. Eso hacia
que el mapa no siempre quedara centrado ni seleccionado en el vehiculo de la
alarma.

El cambio mantiene la separacion de permisos: la seleccion por URL no busca en
todos los activos, solo en el conjunto permitido por `visibleAssets`.

**Archivos modificados**

- `frontend/src/views/AlarmsView.vue`
- `frontend/src/views/ActivosView.vue`
- `frontend/src/composables/activos/view/useActivosWorkspacePersistence.js`
- `frontend/src/views/README.md`
- `frontend/src/components/alarms/README.md`
- `frontend/src/composables/activos/view/README.md`

## 2026-09-10 - Simplificacion del modal de alertas automaticas

**Que se hizo**

- Se reemplazo el modal anterior de alertas automaticas por una version mas
  simple.
- El panel ahora mantiene una lista de reglas a la izquierda y un formulario
  compacto a la derecha.
- Se eliminaron de la interfaz los bloques de resumen, filtros internos de
  reglas, notificaciones por canal, enfriamiento visible y resumen lateral.
- El formulario quedo centrado en lo necesario para crear una alerta automatica:
  nombre, empresa, tipo, condicion, activos, prioridad y estado activa/pausada.
- La persistencia y el modelo interno se conservaron para no romper reglas ya
  guardadas.

**Por que se hizo**

El modal estaba sobredimensionado para el uso esperado. La configuracion de
alertas automaticas debe ser un CRUD simple de reglas, mientras que las alertas
activadas, su detalle, resolucion y navegacion al recorrido corresponden al
centro de alertas ocurridas.

**Archivos modificados**

- `frontend/src/components/alarms/AutomaticAlertsModal.vue`
- `frontend/src/components/alarms/README.md`
- `frontend/src/views/README.md`

## 2026-09-11 - Rediseno del modal de configuracion de alertas

**Que se hizo**

- Se ajusto el modal de crear/editar reglas automaticas para que use un dialogo
  central similar al diseno objetivo.
- El formulario quedo dividido en cuatro bloques claros:
  informacion general, alcance, configuracion de disparo y notificaciones.
- La configuracion de disparo agrupa en una misma seccion las condiciones y el
  horario de evaluacion.
- Las notificaciones ahora se muestran como tarjetas seleccionables para
  plataforma y correo electronico.
- Se mantuvo la logica existente de reglas por tipo de alerta, incluyendo las
  condiciones dinamicas de velocidad, bateria, sin senal, geocerca, detencion,
  encendido y combustible.
- Para geocercas se conserva la seleccion por todas, por grupo de geocercas o
  por geocercas especificas.

**Por que se hizo**

El formulario anterior ya funcionaba, pero visualmente no seguia la referencia:
las secciones se percibian como una lista larga y no como un configurador claro.
El cambio ordena la informacion sin cambiar el modelo de datos ni la persistencia
de reglas automaticas.

**Archivos modificados**

- `frontend/src/components/alarms/AlarmConfigPanel.vue`
- `frontend/src/components/alarms/README.md`

**Validacion**

- `npm run lint`
- `npm run format:check`
- `npm run build -- --logLevel error`

## 2026-09-11 - Optimizacion de rendimiento en Alertas

**Que se hizo**

- Se quitaron busquedas lineales repetidas en reglas automaticas al comparar
  activos seleccionados, reemplazandolas por `Set`.
- El historial ahora descarta alarmas no autorizadas antes de construir filas
  normalizadas.
- El resumen de alarmas calcula activos, abiertas, criticas y resueltas en un
  solo recorrido.
- El modal de configuracion usa `Set` para consultar activos, etiquetas y
  geocercas seleccionadas por fila.
- Los selectores masivos de activos y geocercas dentro del modal limitan la
  cantidad de filas renderizadas y muestran un mensaje para usar el buscador
  cuando hay mas resultados.
- Los servicios de alarmas y reglas automaticas usan `structuredClone` cuando
  esta disponible, dejando `JSON.parse(JSON.stringify(...))` solo como fallback.

**Por que se hizo**

El modulo funcionaba, pero podia sentirse lento con muchas reglas, activos o
geocercas porque varias listas se recorrian completas varias veces y el modal
intentaba renderizar todos los elementos disponibles. La optimizacion reduce
trabajo de CPU y peso de DOM sin cambiar el flujo visible ni la persistencia.

**Archivos modificados**

- `frontend/src/components/alarms/AlarmConfigPanel.vue`
- `frontend/src/utils/alarms/alarmUtils.js`
- `frontend/src/utils/alarms/alarmUtils.test.js`
- `frontend/src/utils/alarms/automaticAlertRuleUtils.js`
- `frontend/src/services/alarms/useAlarmsService.js`
- `frontend/src/services/alarms/useAutomaticAlertRulesService.js`
- `frontend/src/views/AlarmsView.vue`
- `frontend/src/components/alarms/README.md`
- `frontend/src/utils/alarms/README.md`

**Validacion**

- `node --test src/utils/alarms/alarmUtils.test.js src/utils/alarms/automaticAlertRuleUtils.test.js`
- `npm run lint`
- `npm run format:check`
- `npm run build -- --logLevel error`

## 2026-09-21 - Modularizacion de exportacion de itinerarios

**Que se hizo**

- Se redujo `itineraryExportService.js` a una fachada publica de exportaciones.
- Se movio la logica compartida de columnas, celdas, ordenamiento y metricas a
  `itineraryExportModel.js`.
- Se separo toda la generacion PDF en `itineraryPdfExportService.js`.
- Se separo toda la generacion Excel en `itineraryExcelExportService.js`.
- Se conservaron los nombres y puntos de entrada utilizados por el resto de la
  plataforma.

**Por que se hizo**

El servicio original superaba las 2800 lineas y mezclaba dos formatos con
reglas visuales distintas. La nueva estructura permite modificar PDF o Excel
sin recorrer ni arriesgar el otro formato, manteniendo una sola fuente para la
informacion que ambos comparten.

**Archivos modificados**

- `frontend/src/services/itinerarios/itineraryExportService.js`
- `frontend/src/services/itinerarios/itineraryExportModel.js`
- `frontend/src/services/itinerarios/itineraryPdfExportService.js`
- `frontend/src/services/itinerarios/itineraryExcelExportService.js`
- `frontend/src/services/itinerarios/README.md`
- `bitacora/modulos/modularizacion.md`

**Validacion**

- 181 pruebas aprobadas.
- `npm run lint`
- `npm run format:check`
- `npm run build`

## 2026-09-21 - Correccion del boton Abrir en la busqueda global

**Que se hizo**

- El envio de la busqueda ahora sincroniza inmediatamente el texto pendiente
  antes de elegir el primer resultado.
- El boton `Abrir` queda deshabilitado cuando el campo esta vacio.
- Se evita navegar a un resultado predeterminado que no corresponde a una
  consulta escrita por el usuario.

**Por que se hizo**

La lista usa un retraso breve para evitar recalcular en cada pulsacion. Antes,
si el usuario escribia y presionaba `Abrir` rapidamente, el boton podia usar los
resultados de la consulta anterior. Con el campo vacio tambien podia abrir el
primer elemento general sin una intencion clara.

**Archivos modificados**

- `frontend/src/components/Layout/HeaderGlobalSearch.vue`
- `frontend/src/composables/layout/useAppHeaderGlobalSearchState.js`

**Validacion**

- `npm run lint`
- `npm run format:check`
- `npm run build`

### Ajuste posterior

- Se elimino el boton visible `Abrir` porque repetia de forma menos precisa la
  seleccion directa de resultados del desplegable.
- El campo recupero el espacio horizontal que ocupaba el boton.
- Se conservo Enter como atajo de teclado para abrir el primer resultado de la
  consulta actual.
- El boton para limpiar la busqueda se movio al borde derecho del campo.

## 2026-09-21 - Ajuste de escala visual en Empresas

**Que se hizo**

- Se amplio el panel lateral de filtros de `220px` a `240px` en escritorio.
- Se aumentaron moderadamente las tipografias de filtros, resumen, tabla,
  tarjetas y paginacion.
- Los inputs, selectores, filas y botones ganaron altura para mejorar lectura y
  area de interaccion.
- Se mantuvo la estructura responsive y la misma cantidad de informacion.

**Por que se hizo**

El modulo utilizaba textos de `9px` y `10px` en gran parte de su interfaz, por
lo que se percibia mas pequeno que el resto de la plataforma y costaba leerlo
en pantallas amplias.

**Archivos modificados**

- `frontend/src/views/CompanyManagementView.vue`
- `frontend/src/components/companies/CompanyManagementHeader.vue`
- `frontend/src/components/companies/CompanyFiltersPanel.vue`
- `frontend/src/components/companies/CompanySummaryStrip.vue`
- `frontend/src/components/companies/CompanyCatalog.vue`

**Validacion**

- `npm run lint`
- `npm run format:check`
- `npm run build`

## 2026-09-21 - Rediseño del catálogo de reglas de evento

**Que se hizo**

- Se amplio el modal de reglas hasta un maximo de `1260px` en escritorio.
- El encabezado ahora incluye contexto, titulo, descripcion y cierre accesible.
- Se agrego icono al buscador y un contador de resultados filtrados.
- Las reglas se muestran en dos columnas en escritorio y una columna en
  pantallas reducidas.
- Se aumento la escala de textos, controles y tarjetas.
- El resumen operativo quedo separado por un divisor en la parte inferior de
  cada tarjeta.
- Se agrego una nota en el pie explicando donde se aplican las reglas.
- Se conservaron crear, editar y eliminar reglas personalizadas.

**Por que se hizo**

El modal anterior estaba limitado a `680px`, presentaba todas las reglas en una
sola columna y utilizaba una escala menor que el resto de la plataforma. El
nuevo diseño aprovecha mejor el espacio disponible y facilita comparar reglas
sin cambiar su comportamiento.

**Archivos modificados**

- `frontend/src/components/reports/ReportEventRulesModal.vue`
- `frontend/src/components/reports/README.md`

**Validacion**

- `npm run lint`
- `npm run format:check`
- `npm run build`

### Ajuste posterior de escala

- Se redujo el ancho maximo de `1260px` a `1120px` para adaptarlo a la escala
  real de la plataforma.
- Se compacto el encabezado, barra de busqueda, tarjetas, acciones y pie.
- La altura maxima quedo en `88vh`, manteniendo scroll interno para no ocupar
  toda la pantalla cuando existen mas reglas que en la referencia visual.
- Se conservaron las dos columnas y la misma jerarquia del diseño objetivo.

### Optimización de apertura

- El formulario completo de crear/editar dejo de importarse y montarse junto al
  catalogo.
- `ReportEventRuleFormModal.vue` ahora se carga de forma asincrona durante un
  periodo inactivo y se monta solamente al crear o editar una regla.
- Se retiro el desenfoque del fondo del modal para evitar composicion grafica
  adicional durante apertura y desplazamiento.
- El catalogo abre sin ejecutar anticipadamente los watchers, computados y
  secciones internas del formulario.

### Ajuste del encabezado

- Se redujo la altura de la franja superior.
- Se compacto la escala del contexto, titulo, descripcion y boton de cierre.
- Se agregaron una linea inferior naranja y planos diagonales sutiles para dar
  detalle visual sin aumentar el contenido ni la altura del modal.

## 2026-09-14 - Alertas visibles en Fleet por empresa

**Que se hizo**

- Se conectaron las filas y resumen de alertas calculados en `ActivosView` con
  `FleetListPanel`.
- El panel de Fleet ahora recibe `alertRows` y `alertSummary`, por lo que la
  seccion `Alertas` deja de depender de sus valores vacios por defecto.
- Se agrego el evento `view-alert-route` desde Fleet hacia `ActivosView`.
- El boton `Ver recorrido` ahora navega a `Itinerarios` con `activoId`,
  `alarmId` y fecha de la alerta.
- Para administrador de plataforma se agrego un respaldo con los activos mock de
  la empresa cuando `visibleAssets` no trae coincidencias, manteniendo
  `visibleAssets` como filtro para usuarios normales.

**Por que se hizo**

El historial de alertas ya tenia datos mock por empresa, pero el panel de Fleet
no los mostraba porque `ActivosView` no los estaba pasando al componente. Ademas,
si la lista de activos visibles no coincidia con los activos usados por el mock
de alertas, el filtro dejaba la seccion sin resultados.

**Archivos modificados**

- `frontend/src/views/ActivosView.vue`

**Validacion**

- `npm run lint`
- `npm run format:check`
- `npm run build -- --logLevel error`

## 2026-09-14 - Motivo visible en alertas de Fleet

**Que se hizo**

- Se agrego el motivo de disparo dentro de la columna `Alerta` del historial
  compacto de Fleet.
- El motivo usa el campo `triggerReason` ya calculado desde el historial de
  alertas y cae a `description` o tipo cuando no hay metadatos suficientes.
- Se muestra con la etiqueta `Motivo:` para que sea visible sin abrir el
  recorrido.
- Se evito una columna extra para no comprimir titulo, activo, fecha y accion.
- Se subio la escala tipografica del panel de Fleet Alertas para que filas,
  filtros, resumen, motivo, estado, paginacion y boton de recorrido sean
  legibles sin depender del zoom del navegador.

**Por que se hizo**

Desde Fleet se podia ver que existia una alerta, pero no quedaba claro por que
se habia disparado sin entrar al detalle o al recorrido. El usuario necesita ver
la causa directamente desde el panel operativo.

**Archivos modificados**

- `frontend/src/components/activos/fleet/FleetAlertsPanel.vue`
- `frontend/src/components/activos/fleet/README.md`

**Validacion**

- `npm run lint`
- `npm run format:check`
- `npm run build -- --logLevel error`

## 2026-09-11 - Correccion de condicion de encendido en Alertas

**Que se hizo**

- Se corrigio la regla automatica de tipo `ignition`.
- La condicion ya no se guarda como `schedule = Fuera de horario`.
- Ahora la condicion representa el evento real: `ignitionState = Encendido`.
- El concepto de `fuera de horario` queda en el bloque de horario, forzando
  `schedule.type = custom` para este tipo de alerta.
- En el formulario se cambio el campo deshabilitado por un mensaje explicativo:
  la alerta se activa cuando el activo enciende fuera del horario permitido.
- Se actualizo la semilla mock de `Encendido fuera de horario`.
- Se agrego prueba para validar normalizacion legacy y etiqueta legible.

**Por que se hizo**

La version anterior mezclaba condicion y horario. Eso hacia que la condicion
pareciera un dato tecnico de agenda, cuando en realidad la condicion operativa
es el encendido del contacto. Separar ambos conceptos deja el flujo mas claro:

```txt
condicion -> contacto encendido
horario -> ventana permitida
alarma -> encendido fuera de esa ventana
```

**Archivos modificados**

- `frontend/src/components/alarms/AlarmConfigPanel.vue`
- `frontend/src/utils/alarms/automaticAlertRuleUtils.js`
- `frontend/src/utils/alarms/automaticAlertRuleUtils.test.js`
- `frontend/src/data/mockAutomaticAlertRules.js`
- `frontend/src/utils/alarms/README.md`

**Validacion**

- `node --test src/utils/alarms/automaticAlertRuleUtils.test.js`
- `npm run lint`

## 2026-09-11 - Motivo visible en recorrido de alertas

**Que se hizo**

- Se agrego `getAlarmTriggerReason` para construir un motivo legible desde los
  metadatos de cada alerta.
- El historial de alertas ahora expone el motivo en el panel lateral de detalle.
- El motivo tambien participa en la busqueda del historial.
- Al usar `Ver recorrido`, Activos envia el motivo dentro de `focusedAlert`.
- `ItineraryPanel` conserva ese motivo en el punto especial de alerta.
- El mapa de itinerarios muestra el motivo en el tooltip del marcador de alerta.
- Cuando el punto seleccionado viene desde una alerta, el tooltip se abre
  automaticamente para que no haya que pasar el mouse sobre el marcador.

**Por que se hizo**

El recorrido mostraba el punto aproximado de la alerta, pero no explicaba por que
se habia generado. Eso obligaba al usuario a volver al historial para entender
si fue velocidad, bateria, geocerca, sin senal u otra condicion.

El flujo queda:

```txt
alerta activada
-> metadata de disparo
-> motivo legible
-> detalle de historial
-> recorrido del dia
-> tooltip del punto de alerta
```

**Archivos modificados**

- `frontend/src/utils/alarms/alarmUtils.js`
- `frontend/src/utils/alarms/alarmUtils.test.js`
- `frontend/src/components/alarms/AlarmDetailPanel.vue`
- `frontend/src/views/ActivosView.vue`
- `frontend/src/components/activos/itinerarios/ItineraryPanel.vue`
- `frontend/src/composables/activos/map/useMapItinerary.js`
- `frontend/src/components/alarms/README.md`
- `frontend/src/components/activos/itinerarios/README.md`
- `frontend/src/composables/activos/map/README.md`

**Validacion**

- `node --test src/utils/alarms/alarmUtils.test.js src/utils/alarms/automaticAlertRuleUtils.test.js`
- `npm run lint`
- `npm run format:check`
- `npm run build -- --logLevel error`

## 2026-09-23 - Reubicacion de Nueva empresa en el catalogo

**Que se hizo**

- Se retiro la accion `Nueva empresa` de la cabecera descriptiva del modulo.
- Se incorporo el boton al extremo derecho de la toolbar del catalogo, despues
  de los controles de ordenamiento y cambio de vista.
- Se mantuvo el mismo flujo de apertura de `CompanyEditorModal`, trasladando el
  evento `create-company` desde la cabecera hacia `CompanyCatalog`.
- En anchos reducidos la toolbar puede envolver sus controles sin superponer el
  boton ni la informacion del listado.
- Se retiro de la vista la cabecera local con icono, contexto, titulo y
  descripcion. El modulo comienza directamente con sus filtros, resumen y
  catalogo, ya que el header global identifica la vista actual.
- Se redujeron los margenes exteriores, la separacion entre paneles y el ancho
  fijo de filtros para que el resumen y el catalogo aprovechen mejor el espacio
  disponible sin aumentar artificialmente la altura de las filas.
- El panel de filtros y el catalogo ahora ocupan la altura util restante de la
  vista. Las filas permanecen compactas arriba y la paginacion queda alineada
  con el borde inferior, evitando un bloque de fondo suelto bajo el contenido.

**Por que se hizo**

La accion crea un elemento del catalogo, por lo que debe estar junto a los
controles que operan sobre ese listado. La nueva posicion coincide con la
referencia visual y deja la cabecera dedicada al contexto del modulo.

**Archivos modificados**

- `frontend/src/views/CompanyManagementView.vue`
- `frontend/src/components/companies/CompanyManagementHeader.vue`
- `frontend/src/components/companies/CompanyCatalog.vue`
- `frontend/src/components/companies/README.md`

**Validacion**

- `npm run lint`
- `npm run build -- --logLevel error`

## 2026-09-23 - Navegacion por pestanas en Alertas

**Que se hizo**

- Los controles `Configuracion de alertas` e `Historial de alertas` dejaron de
  mostrarse como botones solidos con iconos.
- Se reemplazaron por pestanas de texto sobre un divisor horizontal.
- La vista activa usa texto azul y un indicador naranja inferior, sin sombras ni
  cambios de posicion.

**Archivos modificados**

- `frontend/src/views/AlarmsView.vue`
- `frontend/src/components/alarms/README.md`

## 2026-09-23 - Icono compartido para limpiar filtros de Alertas

**Que se hizo**

- Se agrego `filter-clear` al catalogo central `SvgIcon` usando el SVG de filtro
  con cierre solicitado.
- Los botones `Limpiar` de configuracion e historial de Alertas dejaron de usar
  el icono local de recarga y ahora reutilizan `filter-clear` a `18px`.

**Archivos modificados**

- `frontend/src/components/icons/SvgIcon.vue`
- `frontend/src/components/alarms/AlarmRuleFilters.vue`
- `frontend/src/components/alarms/AlarmFilters.vue`
- `frontend/src/components/icons/README.md`

## 2026-09-23 - Correccion de escala tipografica duplicada en Usuarios

**Que se hizo**

- Se retiro la clase local `users-management-readable` y sus reglas de tamano
  desde `8px` hasta `18px`.
- Usuarios ahora depende de la misma escala global `module-readable` que
  Auditoria, Empresas, Alertas, Reportes y Mantenciones.
- Activos conserva su exclusion deliberada para mantener la densidad de mapas y
  controles operativos.

**Por que se hizo**

La escala global solo unificaba correctamente los modulos que no agregaban una
segunda capa tipografica. Usuarios mantenia una ampliacion propia y, por tanto,
contradecia la unificacion informada anteriormente.

**Archivos modificados**

- `frontend/src/views/UserManagementView.vue`
- `frontend/src/components/users/README.md`

## 2026-09-23 - Iconos semanticos para tipos de alerta

**Que se hizo**

- Se agregaron al catalogo `SvgIcon` los iconos `alarm-no-signal`,
  `alarm-geofence-exit`, `alarm-fuel-variation` y `alarm-speeding`.
- La tabla de configuracion de Alertas ahora usa estos iconos para sin reporte
  GPS, salida de geocerca, variacion de combustible y exceso de velocidad.
- Tras la primera revision visual se simplificaron las formas: wifi desconectado,
  pin clasico, gota de combustible y velocimetro de arco con aguja. Los cuatro
  usan trazo `2` para mejorar su lectura dentro de contenedores pequenos.
- El icono `alarm-no-signal` se reemplazo posteriormente por una version rellena
  de alta resolucion con ondas Wi-Fi interrumpidas. Se adapto de `512x512` a
  `SvgIcon`, eliminando XML y DOCTYPE y usando `currentColor`.
- `alarm-geofence-exit` tambien se reemplazo por una version rellena de alta
  resolucion que combina marcador y ondas de ubicacion. Se aplico la misma
  conversion a `currentColor` sin metadatos XML externos.
- El mismo SVG recibido se asigno despues a `alarm-fuel-variation`. Como su
  geometria es identica a la de geocerca, ambos nombres comparten una sola
  definicion dentro de `SvgIcon` para evitar duplicar los seis trazados.
- Esa asignacion temporal se corrigio al recibir el SVG adecuado de combustible.
  `alarm-fuel-variation` vuelve a tener una definicion independiente con surtidor,
  deposito y gota, adaptada a `currentColor` sobre `512x512`.
- `alarm-speeding` se reemplazo por un velocimetro relleno de alta resolucion con
  indicador de advertencia. Se conservo el `viewBox` de `512x512` y se adapto el
  relleno a `currentColor`.
- El alcance se limito al modulo de Alertas para revisar visualmente el resultado
  antes de reutilizarlos en historial, Fleet u otras vistas.

**Archivos modificados**

- `frontend/src/components/icons/SvgIcon.vue`
- `frontend/src/components/alarms/AlarmRuleTable.vue`
- `frontend/src/components/icons/README.md`
- `frontend/src/components/alarms/README.md`

## 2026-09-23 - Icono compartido de Activos en Fleet

**Que se hizo**

- La pestana `Activos` de Fleet dejo de usar un SVG de vehiculo dibujado dentro
  de `FleetPanelHeader.vue`.
- Ahora reutiliza `SvgIcon name="activos"`, el mismo icono utilizado por la
  sidebar principal.
- Los iconos de Reportes, Itinerarios, Geocercas, Etiquetas y Alertas no fueron
  modificados.

**Archivos modificados**

- `frontend/src/components/activos/fleet/FleetPanelHeader.vue`
- `frontend/src/components/activos/fleet/README.md`

## 2026-09-23 - Icono de Reportes en la navegacion de Fleet

**Que se hizo**

- Se agrego `fleet-reports` a `SvgIcon`, adaptando el documento con grafico de
  `512x512` a `currentColor` y eliminando XML/DOCTYPE.
- La pestana `Reportes` de `FleetPanelHeader.vue` ahora usa este icono compartido
  en el mismo bloque donde `Activos` usa su icono del catalogo.
- El icono general de Reportes utilizado por la sidebar no fue modificado.
- Tras revisar el resultado, `fleet-reports` se reemplazo por una version mas
  completa que combina documento, grafico circular, barras y lineas de detalle.
- Se corrigio su tamano dentro de Fleet. Como `SvgIcon` renderiza multiples
  raices condicionales, la clase del componente no llegaba al SVG nuevo y el
  navegador aplicaba su tamano intrinseco. `FleetPanelHeader` ahora lo contiene
  en una caja estable de `14x14px` y fuerza esas dimensiones con `:deep(svg)`.

**Archivos modificados**

- `frontend/src/components/icons/SvgIcon.vue`
- `frontend/src/components/activos/fleet/FleetPanelHeader.vue`
- `frontend/src/components/icons/README.md`
- `frontend/src/components/activos/fleet/README.md`

## 2026-09-24 - Icono compartido de Geocercas en Fleet

**Que se hizo**

- Se reemplazo el trazado local de la pestana `Geocercas` por
  `alarm-geofence-exit`, el mismo SVG utilizado en el modulo de Alertas.
- El icono se mantiene dentro del contenedor fijo de `14x14px` de las pestanas
  de Fleet para evitar cambios de tamano o alineacion.

**Archivos modificados**

- `frontend/src/components/activos/fleet/FleetPanelHeader.vue`
- `frontend/src/components/activos/fleet/README.md`

## 2026-09-24 - Icono compartido de Alertas en Fleet

**Que se hizo**

- Se reemplazo el triangulo local de la pestana `Alertas` de Fleet por el icono
  compartido `alertas`, utilizado tambien en la navegacion lateral.
- Se mantuvo el contenedor fijo de `14x14px` para conservar la alineacion y el
  tamano del resto de las pestanas.

**Archivos modificados**

- `frontend/src/components/activos/fleet/FleetPanelHeader.vue`
- `frontend/src/components/activos/fleet/README.md`

## 2026-09-24 - Iconos de categorias en Auditoria

**Que se hizo**

- Todos ahora usa la misma burger del boton que abre la sidebar.
- Acciones sensibles usa el nuevo escudo de alerta y Fallidos el nuevo circulo
  con cierre, ambos incorporados al catalogo `SvgIcon`.
- Etiquetas reutiliza `fleet-tags`, el icono incorporado para Fleet.
- Cambios de acceso conserva su candado y Usuarios aumenta el contraste de su
  fondo e icono para mejorar la visibilidad.
- Los iconos compartidos se fijaron a `14x14px` dentro de sus contenedores.

**Archivos modificados**

- `frontend/src/components/icons/SvgIcon.vue`
- `frontend/src/views/AuditView.vue`
- `frontend/src/components/icons/README.md`
- `frontend/src/components/audit/README.md`

## 2026-09-24 - Nombre consistente de acciones sensibles en Auditoria

**Que se hizo**

- El resumen superior dejo de mostrar `alerta` o `alertas` para los eventos con
  severidad `warning`.
- El contador ahora muestra `accion sensible` o `acciones sensibles`, evitando
  confundir eventos de auditoria con alertas operativas.

**Archivos modificados**

- `frontend/src/components/audit/AuditSummaryHeader.vue`

## 2026-09-24 - Retiro de KPI redundantes en Auditoria

**Que se hizo**

- Se retiraron los contadores superiores de eventos, acciones sensibles y
  fallidos porque duplicaban las categorias rapidas y el filtro de estado.
- `AuditFilters` ocupa ahora toda la zona superior disponible.
- Se elimino de `AuditView` el estado de severidad y los calculos, handlers e
  importaciones usados exclusivamente por esos KPI para evitar filtros
  invisibles y codigo muerto.

**Archivos modificados**

- `frontend/src/views/AuditView.vue`
- `frontend/src/components/audit/README.md`

## 2026-09-24 - Barra compacta de filtros en Auditoria

**Que se hizo**

- El buscador de Auditoria dejo de estar limitado a `290px` y ahora ocupa todo
  el espacio flexible de la fila.
- El rango de fechas, Filtros y Exportar mantienen dimensiones compactas y se
  alinean a la derecha en escritorio.
- En ventanas menores la barra conserva envoltura para evitar superposiciones.

**Archivos modificados**

- `frontend/src/components/audit/AuditFilters.vue`
- `frontend/src/components/audit/README.md`

## 2026-09-24 - Etiquetas del rango de Auditoria

**Que se hizo**

- Se agregaron las etiquetas visibles `Desde` y `Hasta` junto a los campos del
  rango de fechas para diferenciar claramente el inicio y termino del periodo.

**Archivos modificados**

- `frontend/src/components/audit/AuditFilters.vue`
- `frontend/src/components/audit/README.md`

## 2026-09-24 - Separadores del rango de fechas

**Que se hizo**

- Se agregaron divisores verticales despues del icono de calendario y entre los
  campos `Desde` y `Hasta` del filtro de Auditoria.
- Tras la revision visual se retiro el divisor posterior al calendario; se
  conserva solo la separacion entre ambas fechas.
- Se retiro tambien el calendario general anterior a `Desde`, ya que cada campo
  de fecha incluye su propio control nativo.

**Archivos modificados**

- `frontend/src/components/audit/AuditFilters.vue`
- `frontend/src/components/audit/README.md`

## 2026-09-24 - Retiro del encabezado local de Reportes

**Que se hizo**

- Se retiro el bloque `Reportes / Plantillas`, el titulo `Biblioteca de
reportes`, su descripcion y el divisor inferior.
- La vista comienza ahora con el buscador y las acciones Reglas, Programados y
  Nuevo, aprovechando todo el ancho disponible.

**Archivos modificados**

- `frontend/src/views/ReportsView.vue`
- `frontend/src/components/reports/README.md`

## 2026-09-24 - Contexto de Reportes en el header global

**Que se hizo**

- Se agrego el reconocimiento de las rutas `Reports` y `AppReports` en el
  contexto del header global.
- La ruta general de Reportes ahora muestra `Reportes` bajo `Vista actual` en
  vez del respaldo `Selecciona una empresa`.

**Archivos modificados**

- `frontend/src/components/Layout/AppHeader.vue`
- `frontend/src/components/Layout/README.md`

## 2026-09-24 - Agrupacion de controles en Usuarios

**Que se hizo**

- Se retiro el margen automatico que empujaba `Nuevo usuario` al extremo
  derecho y dejaba un espacio vacio despues de `Mas filtros`.
- La accion queda ahora integrada al grupo de filtros con una separacion corta
  y sombra discreta.
- Se ajusto posteriormente la distribucion para aprovechar todo el ancho: el
  buscador crece sobre el espacio disponible y mantiene filtros y accion a la
  derecha sin dejar aire muerto.

**Archivos modificados**

- `frontend/src/components/users/UserFiltersBar.vue`
- `frontend/src/components/users/README.md`

## 2026-09-24 - Badges mejorados en reglas de Alertas

**Que se hizo**

- La prioridad de cada regla dejo de mostrarse como texto plano y ahora utiliza
  `AlarmStatusBadge` con color semantico para baja, media, alta y critica.
- Los estados Activa y Desactivada incorporan un borde suave que mejora su
  definicion visual sin aumentar la altura de las filas.
- Se mantuvieron sin cambios el toggle y las acciones Editar y Eliminar.

**Archivos modificados**

- `frontend/src/components/alarms/AlarmRuleTable.vue`
- `frontend/src/components/alarms/README.md`

## 2026-09-24 - Iconos semanticos en historial de Alertas

**Que se hizo**

- La primera columna del historial dejo de mostrar solamente un punto de estado
  y ahora presenta el icono correspondiente al tipo de alerta.
- Sin senal, geocerca, combustible, velocidad y bateria reutilizan el mismo
  catalogo visual de la configuracion; otros tipos usan la campana de Alertas.
- Un punto pequeno sobre el icono mantiene la lectura del estado: rojo para
  activa y verde para resuelta.

**Archivos modificados**

- `frontend/src/components/alarms/AlarmList.vue`
- `frontend/src/components/alarms/README.md`

## 2026-09-24 - Retiro de resumen redundante en historial de Alertas

**Que se hizo**

- Se retiraron los botones superiores `Todas`, `Activas` y `Resueltas` porque
  duplicaban el selector Estado de `AlarmFilters`.
- Se eliminaron del historial el componente `AlarmSummaryHeader`, sus conteos y
  el handler que escribia sobre el mismo `selectedStatus`.
- `buildAlarmSummary` se conserva en las utilidades porque Fleet aun lo utiliza.

**Archivos modificados**

- `frontend/src/views/AlarmsView.vue`
- `frontend/src/components/alarms/AlarmSummaryHeader.vue` (eliminado)
- `frontend/src/components/alarms/README.md`

## 2026-09-24 - Edicion explicita de reglas de Alertas

**Que se hizo**

- Se retiro la apertura del editor al hacer clic sobre cualquier zona de una
  fila de configuracion.
- El modal de edicion se abre exclusivamente desde `Editar`, evitando que el
  boton duplique una accion disponible en toda la fila.
- La fila conserva respuesta visual al pasar el cursor, pero ya no comunica que
  toda su superficie sea una accion.

**Archivos modificados**

- `frontend/src/components/alarms/AlarmRuleTable.vue`
- `frontend/src/components/alarms/README.md`

## 2026-09-24 - Iconos del detalle de Alertas

**Que se hizo**

- Empresa ahora reutiliza el icono `empresas` del catalogo central.
- Motivo dejo el triangulo generico y muestra el icono semantico correspondiente
  al tipo de alerta.
- Descripcion reemplazo el documento local por el nuevo icono simple
  `detail-info`.

**Archivos modificados**

- `frontend/src/components/alarms/AlarmDetailPanel.vue`
- `frontend/src/components/icons/SvgIcon.vue`
- `frontend/src/components/alarms/README.md`
- `frontend/src/components/icons/README.md`

## 2026-09-24 - Consistencia entre reglas e historial de Alertas

### Icono de bateria baja

- Se agrego `alarm-low-battery` al catalogo `SvgIcon` usando el trazado SVG
  entregado y color heredable mediante `currentColor`.
- Bateria baja reutiliza el nuevo icono en configuracion, historial y detalle
  de Alertas.

### Icono de detencion prolongada

- Se agrego `alarm-long-stop` a `SvgIcon` conservando los trazados entregados.
- Detencion prolongada reutiliza el icono en configuracion, historial y detalle.

### Icono de encendido fuera de horario

- Se agrego `alarm-after-hours` con un reloj y se asigno al tipo `ignition` en
  configuracion, historial y detalle de Alertas.
- Se corrigio por separado la escala optica del reloj y del icono de detencion
  para igualar su tamano aparente con bateria y velocidad.

**Que se hizo**

- Se descarto el filtrado del historial como solucion, porque ocultaba eventos
  semilla en lugar de completar su configuracion.
- Se ajustaron las ocho reglas semilla para que correspondan por nombre, tipo,
  empresa, condicion y alcance a las ocho alertas historicas.
- Cada evento semilla ahora declara el `ruleId` exacto que lo genero.
- Los servicios enriquecen alertas antiguas y reemplazan reglas compatibles
  guardadas por su regla semilla exacta, evitando nombres distintos para el
  mismo evento.
- El historial vuelve a mostrar sus eventos completos; la consistencia se
  resuelve en el origen de datos y no mediante un filtro visual.

**Archivos modificados**

- `frontend/src/views/AlarmsView.vue`
- `frontend/src/data/mockAlarms.js`
- `frontend/src/data/mockAutomaticAlertRules.js`
- `frontend/src/services/alarms/useAlarmsService.js`
- `frontend/src/services/alarms/useAutomaticAlertRulesService.js`
- `frontend/src/services/alarms/useAutomaticAlertRulesService.test.js`
- `frontend/src/components/alarms/README.md`
- `frontend/src/services/alarms/README.md`

## 2026-09-24 - Icono de Itinerarios en Fleet

**Que se hizo**

- Se agrego `fleet-itineraries` a `SvgIcon` a partir del trazado de ruta y
  marcadores entregado como referencia.
- La geometria se optimizo a un `viewBox` de `24x24` para conservar legibilidad
  dentro de la pestana de `14x14px`.
- La pestana `Itinerarios` de `FleetPanelHeader.vue` ahora utiliza este icono en
  el mismo contenedor estable que Activos y Reportes.

**Archivos modificados**

- `frontend/src/components/icons/SvgIcon.vue`
- `frontend/src/components/activos/fleet/FleetPanelHeader.vue`
- `frontend/src/components/icons/README.md`
- `frontend/src/components/activos/fleet/README.md`

## 2026-09-24 - Icono de Etiquetas en Fleet

**Que se hizo**

- Se agrego `fleet-tags` a `SvgIcon` tomando como referencia el trazado de
  etiquetas superpuestas entregado.
- La geometria se optimizo a `24x24` para que la silueta y la perforacion sigan
  siendo reconocibles dentro de una pestana de `14x14px`.
- La pestana `Etiquetas` de Fleet ahora reutiliza este icono desde el mismo
  contenedor estable que Activos, Reportes e Itinerarios.

**Archivos modificados**

- `frontend/src/components/icons/SvgIcon.vue`
- `frontend/src/components/activos/fleet/FleetPanelHeader.vue`
- `frontend/src/components/icons/README.md`
- `frontend/src/components/activos/fleet/README.md`

## 2026-09-25 - Base del modulo Sin reportar

**Que se hizo**

- Se creo la vista base `UnreportedView.vue` con un estado vacio neutral.
- La base se amplio segun la referencia con encabezado, busqueda, cuatro KPI y
  una tabla mock de nueve equipos.
- Se agregaron filtros rapidos por estado, orden local, columna de estado,
  ultimo reporte separado y acciones por fila segun la segunda referencia.
- Se reforzo la jerarquia visual con iconos en KPI, indicadores en filtros,
  seleccion por fila y mayor espaciado en la tabla.
- Se retiro la barra horizontal de estados. Los KPI ahora filtran el listado y
  el panel lateral concentra busqueda, empresa, fechas, orden, limpieza,
  exportacion y actualizacion.
- Se retiro el encabezado interno `Equipos sin reporte` para comenzar el
  contenido inmediatamente bajo el header global.
- Se adapto la composicion final de Sin reportar: panel de filtros de 315px con
  estado, tiempo y fechas; KPI superiores; tabla sin seleccion ni acciones.
- Se igualo la altura inferior del panel de filtros y el bloque de resultados;
  la tabla ocupa el espacio restante y mantiene la paginacion al fondo.
- Se agregaron rutas generales y por empresa para `/sin-reportar`.
- El nuevo modulo aparece en la sidebar, conserva la empresa activa y usa el
  alcance de Activos mientras no exista un permiso propio.
- El header reconoce el nombre `Sin reportar`.
- Se creo el icono de navegacion `unreported` en formato `24x24` y tamano fijo
  `20x20px`; el modulo deja de reutilizar el SVG detallado de Alertas que se
  desbordaba visualmente en la barra compacta.

**Archivos modificados**

- `frontend/src/views/UnreportedView.vue`
- `frontend/src/router/index.js`
- `frontend/src/components/Layout/AppSidebar.vue`
- `frontend/src/components/Layout/AppHeader.vue`
- `frontend/src/views/README.md`
- `frontend/src/components/Layout/README.md`

## 2026-09-25 - Icono de corte de alimentacion

- Se agrego `power-cut` al catalogo `SvgIcon` con los trazados entregados y
  color heredable.
- Se aplico al KPI y a los estados de corte de alimentacion en Sin reportar.

# 2026-10-19 - Copiar IMEI En Sin Reportar

- Boton de copia junto al IMEI en tabla, modal y detalle del historial.
- Confirmacion accesible, manejo de errores y limpieza al salir.
- Validacion: 399 pruebas aprobadas y compilacion correcta.

# 2026-10-19 - Ultima Evidencia En Revisar Equipo

- Resumen con alimentacion externa, bateria interna, senal movil y SIM.
- Fecha de la lectura, faltantes explicitos y aviso de que no son datos actuales.
- Reutiliza la instantanea conservada; no genera telemetria ni modifica historial.
# 2026-10-19 - Evidencia Limitada A Voltajes

- Retirados senal movil y SIM del bloque de ultima evidencia.
- Los nuevos ejemplos de Activos ya no generan fallas de SIM ni datos de red movil.
- Se conservan registros historicos y datos existentes sin borrarlos.

# 2026-10-19 - Retirada Columna Conectividad

- Quitados encabezado y celda de Conectividad de la tabla de equipos sin reportar.
- Grilla y ancho minimo adaptados a seis columnas; estado conservado en el modal.

# 2026-10-19 - Excluir Recuperaciones Por Sin Uso

- Confirmado por usuario: Sin uso se excluye del historial al volver a reportar.
- Se conserva el caso internamente sin borrar consultas; contadores y resultados lo omiten.
- Solo decide la ultima consulta del caso recibida antes de la recuperacion.

# 2026-10-19 - Consulta Sin Uso O Sin Contacto Pendiente

- El formulario selecciona Pendiente de confirmar para ambas situaciones.
- Cambiar de situacion limpia decisiones anteriores; no modifica consultas guardadas.

# 2026-10-19 - Bloquear Revision Para Sin Uso

- Sin uso fija Pendiente de confirmar y deshabilita el selector de revision.
- Al cambiar de situacion el selector se habilita de nuevo.

# 2026-10-19 - Apariencia De Selector Bloqueado

- Revision deshabilitada con fondo gris, texto atenuado y cursor no permitido.

# 2026-10-19 - Formulario Sin Contacto

- No se logro contactar oculta y limpia nombre y cargo del contacto de la consulta.
- Revision queda bloqueada en Pendiente de confirmar igual que Sin uso.

# 2026-10-20 - Dias De Taller Y Aviso De Salida

- Campo de dias estimados en taller y persistencia en consulta.
- Desde el lunes de la semana de salida, aviso y prioridad en tabla activa.
- Plazos vencidos permanecen destacados hasta nueva consulta o reporte.
- Fechas calendario de Chile; consultas antiguas sin dias no inventan plazos.

# 2026-10-20 - Separacion De Detalles Y Consulta

- Detalles del vehiculo y Consultas registradas separados del editor.
- Boton Registrar consulta en pie abre formulario independiente con titulo propio.
- Cancelar regresa a origen; guardado muestra consultas, sin repetir resumen ni contacto.

# 2026-10-20 - Acciones Separadas En Tabla Offline

- Ver detalles y Registrar consulta como botones separados por fila.
- Acceso a consulta directo al formulario, conservando permisos y flujo de guardado.

# 2026-10-20 - Restaurar Accion Unica En Tabla

- A pedido del usuario se retiran los dos botones y vuelve Revisar equipo.
- Se mantiene la separacion interna de detalles, consultas y formulario.

# 2026-10-20 - Sin Uso Tambien En Historial

- Se revoca la exclusion a pedido del usuario: Sin uso cuenta y aparece al recuperar.
- Casos ocultados por la regla anterior vuelven a ser visibles sin borrar datos.

# 2026-10-20 - Retirar Registro De Visita Del Formulario

- Retirados panel, resultado y fecha de nueva visita; consulta a una columna.
- Se conserva la lectura de visitas historicas y sus datos guardados.

# 2026-10-20 - Modal Offline Mas Compacto

- Dimension maxima reducida de 1380 x 960 a 1020 x 760 px.
- Misma tipografia, controles y dimensiones estables entre detalles y consulta.

# 2026-10-20 - Cerrar Reglas Del Flujo Offline

- Decision automatica y bloqueada por situacion, validada tambien al guardar.
- Taller exige dias desde hoy y anticipa fecha de salida en el formulario.
- Pruebas de renovacion del plazo y de nueva desconexion sin consultas heredadas.
- Se conservan historial, consultas anteriores y prioridad por salida de taller.

# 2026-10-20 - Edicion Y Eliminacion De Consultas

- Acciones en Consultas registradas, formulario de edicion y confirmacion de borrado.
- Conserva autoria, fecha y caso al editar; recalcula seguimiento y avisos al modificar.
- Persistencia atomica, control de acceso y pruebas de errores y aislamiento de casos.

# 2026-10-20 - Diseno De Consultas Registradas

- Vista segun referencia: resumen de cantidad, autoria y fecha a izquierda,
  informacion central y Editar/Eliminar a derecha; apilado adaptable en movil.
- Conserva observaciones, taller, contacto, visitas antiguas y confirmacion de borrado.

# 2026-10-20 - Foto Del Vehiculo En Revisar Equipo

- Encabezado del modal usa la misma imagen de Activos que la tabla.
- Imagen contenida sin deformacion y fallback ante errores de carga.

# 2026-10-20 - Mas Filtros En Historial

- Motivo informado, duracion y revision en terreno dentro de Mas filtros.
- Combinacion por desconexion, con detalle, contador y exportacion consistentes.
- Limpiar y simulacion reinician filtros; paginacion y detalle reaccionan al cambio.

# 2026-10-20 - Empresas Solo Con Casos Offline

- Selector de Equipos sin reportar limitado a empresas con casos activos visibles.
- Comparte criterio con tabla y contador; seleccion obsoleta se restablece.
- No modifica opciones de empresas en historial.

# 2026-10-20 - Nueva Empresa Segun Referencia Sin Fondo Azul

- Modal blanco, encabezado claro y fondo exterior gris neutro.
- Empresa y contacto lado a lado, ubicacion debajo; tipografia ampliada.
- Sin cambios en campos, estados operativos ni validacion de guardado existente.

# 2026-10-20 - Formato Y Largo Maximo De RUT

- Campo RUT con puntos, guion, verificador K mayuscula y maximo 12 caracteres.
- Formato automatico al ingresar o pegar; pruebas de normalizacion y limite.

# 2026-10-20 - Identificar Mantenciones En Encabezado

- Titulo Mantenciones visible en rutas global y por empresa.
- Nombre de empresa conservado encima como contexto, sin alterar permisos o datos.

# 2026-10-20 - Ubicacion Visible En Todos Los Modulos

- Modulo como titulo principal y empresa como contexto en encabezado compartido.
- Tipografia ampliada y borde naranja; ubicacion visible tambien en movil.
- Pruebas de precedencia para rutas de activos, reportes, alertas, auditoria y offline.

# 2026-10-20 - Titulo De Modulo En Naranja

- Nombre del modulo en naranja claro sobre encabezado oscuro, en escritorio y movil.

# 2026-10-20 - Contorno Blanco En Nombre Del Modulo

- Letras con relleno naranja y borde blanco fino, aplicadas a ambas variantes del encabezado.

# 2026-10-20 - Ajustar Contorno Del Titulo

- Relleno blanco y contorno naranja fino de 0.6px segun correccion del usuario.

# 2026-10-20 - Corregir Prioridad Por Antiguedad En Offline

- Eliminada prioridad oculta de Revision en terreno sobre casos mas antiguos.
- Orden predeterminado: avisos de taller primero, despues antiguedad descendente.
- Pruebas de revision contra antiguedad, taller, empates y duracion desconocida.

# 2026-10-20 - Medicion Y Optimizacion De Historial Offline

- Benchmark sintetico reproducible de 10000/50000 desconexiones con 30000/150000 consultas.
- Indice por desconexion y busqueda temporal para consultas sin vinculo explicito.
- Mediana con 50000 casos baja de 576 a 128.59 ms (aprox. 4.5 veces mas rapido).
- Pruebas de acceso lineal, fechas limite, vinculos y cambios posteriores sin cache obsoleta.
- Medicion en Node de filtros/agrupacion; no garantiza rendimiento visual ni limites de localStorage.

# 2026-10-20 - Filtro Offline Por Tiempo Minimo

- Selector con 1/3/7/15 dias o mas, Otro plazo y Sin fecha conocida.
- Minimos inclusivos, validacion de dias personalizados y reinicio de paginacion.
- Exportacion incluye el umbral seleccionado; orden de prioridad conservado.

# 2026-10-20 - Conductores Y Licencias En Mantenciones

- Nueva pestaña por empresa con registro, edicion, clases, vencimiento, busqueda,
  filtros, contadores y paginacion; vencidas primero por fecha ascendente.
- Renovacion con historial de licencia anterior y autor; fotos frente/reverso
  opcionales en IndexedDB (JPG/PNG/WebP, maximo 5 MB por lado).
- Permisos de vista y edicion, errores de storage, control de cambios de otra
  pestana y limpieza de archivos nuevos ante fallo de guardado.
- Pruebas de datos/estados/persistencia y vista; screenshots aislados en Edge
  1440x900 y 500x844. Alta y renovacion sin fotos comprobadas en navegador aislado.
- Sin servidor iniciado, sin datos demo personales en la sesion del usuario.
- Limitacion: persistencia local del prototipo, sin verificacion oficial ni backend.

# 2026-10-20 - Flujo De Gestion Y Renovacion De Licencias

- Registro de contacto con cuatro resultados, cita opcional segun resultado,
  observacion, fecha y autor; no cambia vigencia de la licencia.
- Ultima gestion en tabla y ficha; historiales de gestiones/licencias separados.
- Confirmacion de fechas y clases anteriores/nuevas antes de renovar.
- Gestion vinculada a licencia para no heredar pendientes tras renovacion.
- Recorrido probado en Edge aislado: alta, cita, confirmacion y renovacion;
  screenshot de confirmacion 1440x900 y gestion 500x844, sin servidor local.

# 2026-10-20 - Rediseno Y Fluidez De Conductores

- Banda de estados, tabla compacta, datos agrupados y filas adaptadas para movil.
- Vista cacheada por empresa, sin JSON.parse repetido de datos sin cambios.
- Vistas de mantenciones bajo demanda; chunk principal pasa de 137499 a 94982 bytes JS.
- Indice de busqueda/estados y debounce120ms; benchmark de 9 consultas/10000 registros
  247.15ms -> 8.27ms, con preparacion inicial 185.37ms medida aparte.
- Validacion visual Edge 1440x900/500x844 y retorno de pestaña conservando busqueda.
- Modales y subidas pendientes se invalidan al salir, sin guardados tardios.

# 2026-10-21 - Conductores Ajustado A Referencia

- Ancho de Excel ajustado a ventana de exportacion en lugar de 1800px fijos,
  conservando gutters iguales y estrechos para reducir sobrante derecho.

- Excel de Conductores e historial alineado al formato previo de Sin reportar:
  margenes simetricos, logo centrado, cabecera, fuente, filas y pie de pagina.

- Actualizar reemplazado por Exportar a Excel; reporte con logo y dos hojas,
  filtros/orden aplicados sobre toda la lista y metadatos de imagen sin enlaces.

- Paginacion inicial Automatica: calcula filas que caben en el contenedor con
  alto real de filas, recalcula al redimensionar y conserva opciones manuales.

- Filtro de clases identificado dentro del selector, sin etiqueta exterior;
  ancho 260px maximo y alineacion con busqueda/limpiar.

- Nombre Clase de licencia visible junto al selector para identificar filtro
  sin agregar una segunda linea a la franja.

- Franja de filtros reducida: controles alineados al centro y sin etiqueta superior
  que agregaba altura; se conserva nombre accesible del filtro de clases.

- Quitado estiramiento vertical de tabla/cuerpo que agrandaba encabezado y filas;
  dimensiones compactas y selector de clases limitado a 260px.

- Retirada edicion duplicada de la tabla; Editar datos queda en ficha sin campos
  de licencia. El store bloquea cambios de vencimiento fuera de renovacion.

- Separados Editar datos y Renovar licencia. Eliminada casilla ambigua; renovacion
  oculta datos personales y pide vencimiento posterior al anterior con confirmacion.

- Ficha de licencia con alto estable 800px maximo ajustado a viewport y cuerpo
  flexible; alternar licencia actual/historial no redimensiona ni mueve el modal.

- Historial ajustado a referencia: filas abiertas con metadatos y fotos directas,
  sin acordeon. Botones sin foto deshabilitados y distribucion responsive.

- Ejemplo visual frente/reverso en licencia anterior de Felipe Munoz DEMO:
  PNG generados con aviso sin validez, persistidos sin cambiar licencia actual.

- Dos licencias anteriores para cada conductor DEMO, fechas ordenadas y autor
  de demostracion. Carga sin duplicados ni cambios a licencias actuales/usuarios.

- Fotos actuales con miniaturas reales y visor ampliado sin recorte; navegacion
  frente/reverso, cierre independiente y fondo inert mientras el visor esta abierto.
- Edge real verifica miniaturas, cambio de lado, cierre solo de imagen y conserva
  recorrido de guardado, renovacion, imagen historica y recarga sin perdida.

- Auditoria real Edge de guardado: alta con dos PNG, lectura/visualizacion,
  correccion sin perder fotos, confirmacion/renovacion e imagen historica.
- Fallo forzado de localStorage conserva datos, muestra error y elimina archivo
  nuevo huerfano; recarga completa conserva conductor, renovacion y dos fotos.
- Agregada regresion de alta/correccion/renovacion entre instancias nuevas del store.

- Ficha cliente ajustada a nueva referencia: paneles de conductor/licencia,
  estado separado de fecha, pestanas con linea naranja y dos espacios de fotos.

- Vista cliente simplificada: retirados Contactos, formulario y columna Ultima
  gestion. Solo licencia actual e historial; datos anteriores preservados.

- Ficha dividida en Licencia actual, Contactos y Licencias anteriores; eliminado
  resumen de contacto duplicado de la licencia. Acciones segun pestana y retorno
  a Contactos tras registrar; limpieza de fotos al cambiar de seccion.

- Ficha renombrada y agrupada por conductor/licencia/contactos/fotos. Sustituido
  Gestiones por Historial de contactos y Anotar contacto por Registrar llamada o
  contacto; campos de fecha, autor, resultado, cita y observacion identificados.

- Recuperado selector 5/10/20/50 por pagina, con cinco iniciales y reinicio de
  pagina al cambiar; scroll interno conserva encabezado y paginacion visibles.

- Encabezados sticky y scroll limitado a la tabla; paginacion y filtros fijos,
  sin estirar el contenedor mas alla del alto disponible en escritorio.

- Corregido cancel de input file que propagaba al dialog y cerraba formulario;
  el dialog solo procesa su propio cancel y el selector detiene propagacion.

- Modal de alta ajustado a referencia: dos columnas, documentos separados y clases
  seleccionables accesibles; captura Edge 1440x900 sin desbordamiento de pagina.

- Retirado selector de empresa de Conductores por ser vista del cliente; se mantiene
  aislamiento por empresa de ruta y permisos, con filtros redistribuidos.

- Flujo simplificado: dos botones visibles (Ver/Actualizar licencia), sin menu.
- Correcciones y renovacion en un formulario, con checkbox y confirmacion para
  conservar historial; anotacion de contacto dentro de la ficha.

- Encabezado de tabla limitado a 44px; el alto adicional se asigna al cuerpo.

- Tabla extendida al alto disponible en escritorio, con margen inferior de 12px;
  cinco filas y paginacion conservadas sin recortar contenido en pantallas pequenas.

- Tabla limitada a cinco registros por pagina para evitar scroll con diez filas;
  se conserva acceso al resto mediante paginacion, sin ocultar informacion.

- A solicitud del usuario se agregan 15 conductores DEMO para Transportes Schuck
  en desarrollo, sin reemplazar datos existentes, con estados y gestiones variados.

- Estados y botones de actualizar/agregar alineados en una misma fila responsive.

- Se retira titulo/subtitulo duplicado a solicitud del usuario; botones alineados
  a la derecha con estilo consistente con otros modulos (primario #102372).

- Segundo ajuste visual: subtitulo de gestion, pestanas inactivas sin fondo,
  filtros de menor altura y proporciones explicitas de columnas.

- Pestanas de estado compactas, filtros en franja y tabla de filas bajas.
- Encabezados ordenables, fecha de ultima gestion, menu por fila y paginas numeradas.
- Selector de empresas autorizadas conserva Conductores y actualiza encabezado.
- Capturas Edge aislado 1440x900 y 500x844, sin modificar datos del usuario.

# 2026-10-22 - Carga Inicial De Conductores

- Conductores cargado con MaintenanceView sin descarga/placeholder al seleccionar.
- Eliminada doble activacion mounted/activated del primer ingreso; se mantiene
  cache por empresa y reactivacion al volver a la pestana.

# 2026-10-22 - Exportacion De Conductores A PDF

- Boton Exportar con opciones Excel/PDF; mismas filas filtradas y licencias
  anteriores, carga bajo demanda y prevencion de descarga tras perder acceso.
- PDF horizontal con logo, formato corporativo y paginacion con cabeceras repetidas.

# 2026-10-22 - Acciones De Licencia Dentro De La Ficha

- Tabla solo con Ver licencia. Resumen unico de vigencia, conductor y panel de
  acciones Renovar/Editar dentro de ficha; pie solo Cerrar, sin datos repetidos.

# 2026-10-22 - Ancho De Acciones En Conductores

- Columna Acciones limitada a 170px y Ver licencia alineado al margen derecho;
  ancho restante reservado a datos, conservando adaptacion movil.

# 2026-10-22 - Renovacion Segun Vigencia

- Licencias vigentes sin accion Renovar. Entrada al formulario y guardado validan
  que este por vencer (30 dias inclusive) o vencida, sin alterar datos al rechazar.

# 2026-10-22 - Carga De Ordenes

- Ordenes importada con MaintenanceView, como Conductores, sin descarga separada
  ni placeholder Cargando al seleccionar la pestana.

# 2026-10-22 - Carga De Analisis Y Flota

- Analisis importado con MaintenanceView sin placeholder al seleccionar.
- Confirmado que Flota ya usa importacion directa y no tiene carga asincrona
  interna ni mensaje Cargando en su componente.

# 2026-10-22 - Vista Previa De Adjuntos

- Alta/edicion/renovacion muestran frente y reverso seleccionados simultaneamente,
  sin usar una sola imagen compartida. Limpieza automatica de URLs temporales.

# 2026-10-22 - Cuello De Botella 1: Renderizado De Flota

- Verificacion Edge aislado con 1000 vehiculos: 20 filas iniciales, pagina2 y
  planes correctos, 50 filas, orden/filtros previos a paginar y exportacion completa.

- Footer de paginacion antes decorativo conectado a paginas reales 10/20/50,
  con 20 iniciales y render limitado a pagina visible.
- Filtrar/ordenar precede a paginar; indices conservados para planes/vehiculos,
  exportacion completa intacta y estado vacio con controles deshabilitados.

# 2026-10-22 - Cuello De Botella 2: Guardado Incremental

- Conductores usa IndexedDB por empresa/registro, sin JSON.stringify de coleccion
  en cada guardado. Commit atomico del registro y version, indice RUT unico.
- Migracion de legacy una vez, sin eliminar original y con rollback completo.
- UI/demos esperan confirmacion durable; errores conservan datos y limpian fotos.
- Edge con 1000 conductores y 10 historiales: 1 registro escrito, 0 serializaciones
  completas, 3.9ms en esa ejecucion; concurrencia/recarga/rollback verificados.
- Vuelto a probar recorrido real de alta con dos fotos, edicion, renovacion, foto historica,
  fallo forzado y recarga completa: datos y adjuntos conservados.

# 2026-10-22 - Cuello De Botella 3: Indice De Conductores

Se eliminaron los calculos de ultima gestion, fecha de actividad y ordenamiento
por gestion del indice de Conductores: ya no corresponden a columnas visibles.
Historiales, contactos antiguos y fotos conservan sus referencias originales;
no se borran ni se modifican registros persistidos.
La regresion impide recorrer contactos o renovaciones al preparar, filtrar y
ordenar la tabla. Suite completa: 457 pruebas aprobadas; build aprobado.
Benchmark local de 10000 conductores: preparacion 116.12ms y nueve filtros 4.67ms.
Es una medicion del helper, no de carga de pantalla ni una garantia de latencia.

# 2026-10-22 - Cuello De Botella 4: Remontajes De Mantenciones

Cache acotada por empresa para las pestanas visitadas, con identidades separadas
para Analisis y pendientes sin OT. Se conserva estado local sin volver a montar
componentes en cada visita; los props siguen reactivos. Se retiran listeners
globales y overlays al desactivar. Se mantiene la carga directa solicitada por
el usuario: este cambio no reduce el peso del bundle inicial.

# 2026-10-22 - Categorias Y Accesos De Configuracion

Sidebar corporativa organizada en Operacion, Configuracion y Administracion.
Categorias plegables en panel y barra compacta, scroll compacto, iconos actuales
sin cambios y seleccion naranja. Cinco destinos nuevos con una vista vacia
compartida; Alertas de configuracion tiene ruta y seleccion independientes.
Se registran tres permisos de consulta sin concederlos automaticamente; variables
calculadas y avanzado quedan restringidos a plataforma. Permisos de modulos
actuales intactos. El header reconoce las nuevas ubicaciones por meta de ruta.

# 2026-10-22 - Replica Visual De Limites

Vista dedicada con paneles centrados de velocidad y consumo al ralenti, fondo
gris azulado, campos numericos y textos de referencia. Se mantiene la sidebar
sin repetir tabs horizontales. Conteos autorizados por empresa y detalle
desplegable de activos sin tipo; no se copian cantidades ficticias de la imagen.
Guardado local por alcance al cambiar campos, herencia de plataforma al vaciar,
validacion, permisos de edicion y proteccion ante JSON corrupto o fallo de cuota.
Sin conexion nueva con calculos nocturnos ni reportes. Precio sin registro cuando
no existe una fuente real. Auditoria de navegador verifica guardado, remontaje,
restauracion de herencia, fallo de cuota y ausencia de overflow en movil.

# 2026-10-22 - Ajuste De Limites Contra Referencia

La solicitud posterior de fidelidad visual reemplaza la decision de omitir tabs:
se agrega la barra horizontal de referencia con cinco destinos reales autorizados.
Ancho maximo 1422px, altura 50px y paneles de 784px. Se ajustan alineaciones,
filas, tipografia y espaciados. Velocidad muestra los cinco tipos y consumo los
ocho de la referencia. Los conteos siguen siendo reales, sin copiar cantidades
ficticias. Se verifica captura a 1873x828 y adaptacion movil sin overflow.

# 2026-10-22 - Limites Conectados A Informes

Se completa el desplegable con nombres de activos y ayuda sobre Tipo de activo.
Se unifica el azul de texto y controles. Los informes manuales ahora leen una
instantanea por empresa de los limites; el limite indicado al ejecutar prevalece
y los vehiculos sin tipo no producen excesos. Ralenti/horas motor incluyen litros
y pesos por duracion y consumo configurado. El precio indicado al generar se
conserva por empresa y aparece en Limites; sin dato se mantiene Sin registro.
Se prueba ejecucion real en navegador, guardado, herencia y fallo de cuota.
No se crea ni se afirma un trabajador nocturno de backend inexistente.

# 2026-10-23 - Limites Con Selector Lateral E Imagenes De Activos

Se adapta la nueva referencia: selector lateral de velocidad/consumo, seleccion
naranja, editor derecho, tabla alternada con cabecera fija e informacion al pie.
Imagenes de vehiculos reutilizadas mediante getAssetImageMarkerVariant, sin
modificar el catalogo de Activos. Se retira la barra horizontal de configuracion.
Guardado por empresa, herencia, validacion, permisos y conexion a informes se
conservan. Selector con teclado y adaptacion movil. Auditoria de navegador
comprueba cambios entre modos, persistencia e imagenes efectivamente cargadas.

# 2026-10-23 - Densidad Y Espacio De Limites

Se compactan titulos a 18px, tabla a 13px, campos a 32px y selector lateral
a 264px. El workspace ocupa la altura disponible, sin el limite previo de
680px, con margen exterior de 12px. Se conservan filas densas y cabecera fija,
sin estirar cada fila para rellenar espacio. Persistencia y permisos intactos.

# 2026-10-23 - Paneles De Limites Ajustados Al Contenido

Se elimina la altura de viewport del workspace y el crecimiento flexible del
contenedor de tabla. Selector y editor se alinean arriba con alturas propias;
el aviso sigue directamente a la tabla. Se retiran alturas minimas y limites
de scroll internos en movil. No se alteran anchos, filas, datos ni guardado.

# 2026-10-23 - Ambas Tablas De Limites Visibles

Para aprovechar el espacio sin agrandar filas se muestran velocidad y consumo
simultaneamente, en dos columnas. Se elimina el selector que ocultaba una de
las tablas. En pantallas menores a 1100px se apilan. Se mantiene el guardado
independiente de cada parametro, las imagenes de Activos y la herencia.

# 2026-10-23 - Restauracion Temporal Del Selector De Limites

A peticion del usuario se revierte la distribucion de dos tablas simultaneas.
Vuelve el selector lateral y una tabla por vez, con los tamanos compactos y
altura ajustada al contenido anteriores. Datos y funciones no se revierten.

# 2026-10-23 - Limites Segun Referencia Con Resumen Y Unidad

Se conserva selector lateral y una sola tabla. Nueva referencia aplicada con
breadcrumb, resumen real de tipos/vehiculos/origen de valores y cuarta columna
Unidad. Workspace y tabla ocupan la altura disponible; las filas tienen minimo
56px y pueden repartir el espacio. Cuando no caben, scroll interno con cabecera
fija y aviso visible al pie. Responsive movil en altura natural sin overflow.
Permisos, guardado, herencia e imagenes de Activos conservados.

# 2026-10-23 - Vuelta Al Diseno Inicial De Limites

Se restaura la composicion inicial indicada en la captura: encabezado pequeno,
barra horizontal de configuracion y dos paneles centrados apilados dentro del
contenedor gris con scroll. Sin selector lateral, resumenes, imagenes o columna
Unidad adicional. Navegacion filtrada por permisos. No se revierten datos,
guardado, herencia ni la integracion de limites con informes.
# 2026-11-10 - Estilo Unificado De Nueva OT

Nueva OT adopta el encabezado azul, titulo compacto, fondo blanco y proporciones
del asistente de mantencion. Mantiene el ancho de 900px, los tres pasos y las
validaciones existentes. Se agrega cobertura del contrato visual compartido.

