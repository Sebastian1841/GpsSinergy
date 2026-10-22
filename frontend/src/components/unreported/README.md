# Unreported Components

Optimizacion punto 3 (2026-10-16): UnreportedHistoryDetail usa presentacion
calculada por fila visible, sin repetir diagnostico/fechas en plantilla. El cuerpo
de details se monta solo al abrir (toggle nativo); llamadas calculadas bajo demanda
y actualizadas si cambian consultas. Conserva estilos, teclado y varios abiertos.

La seccion de graficos de Sin reportar y UnreportedCharts.vue fueron retirados.
Permanece la bandeja con resumen numerico, listado, filtros, consultas y Excel.
Graficos y Chart.js de otros modulos no se modifican.

UnreportedOperationModal.vue abre Revisar equipo con Resumen, Consultas e Historial.
Resumen: conectividad, ultimo reporte, tiempo, ubicacion, dato GPS y decision
de visita. Registrar consulta captura situacion informada por empresa, decision
de terreno y observacion opcional; guarda fecha y responsable en historial.
No cambia conectividad ni oculta equipos en taller o sin uso.

Formulario de consulta inicialmente oculto, abierto al pulsar Registrar consulta.
Guardar correctamente vuelve al historial; errores conservan el borrador.
En equipos recuperados se conserva el historial, sin registrar nuevas consultas.
Simular reporte (demo) solo en desarrollo y dentro del resumen.
Ver historial abre directamente la pestaña Historial: contador de interrupciones,
ultimo reporte antes de cada corte, recuperacion y duracion. Las consultas de
cada episodio se pueden desplegar; no se mezclan con otras interrupciones.
Episodios abiertos muestran Aun sin recuperar. El modal mantiene sus dimensiones.

Dialog nativo centrado explicitamente, 680 px de ancho y 600 px de alto maximo,
acotado a pantalla. Dimensiones estables entre vistas; scroll interno cuando
el contenido lo necesita. Fechas en America/Santiago.

Notas retiradas de interfaz: sin pestana, editor, menu ni contador. Solo quedan
datos y helpers legacy en el store para compatibilidad y reversion; no se muestran
ni exportan. No hay retiro manual de equipos ni reactivacion.

# Historial Completo Del Equipo

La pestaña Historial del modal muestra todos los episodios conservados (abierto y
cerrados), fechas, duracion, dato GPS propio y llamadas asociadas. Nunca toma el
diagnostico actual del equipo para completar episodios antiguos. El acceso Historial
de la tabla operativa abre directamente esta pestaña.

# Modal Sin Historial Duplicado (2026-10-15)

UnreportedOperationModal conserva unicamente Resumen y Consultas. Se elimina la
pestaña Historial, sus propiedades initialTab/now, helpers y estilos exclusivos.
El historial se consulta desde Historial de desconexiones en la pagina, con fechas,
duracion, diagnostico y llamadas por episodio. Datos anteriores no se eliminan.
Esta entrada reemplaza las indicaciones anteriores sobre historial dentro del modal.

# Ficha Historica Dentro De La Pagina

UnreportedHistoryDetail.vue recibe un equipo y sus episodios terminados del periodo.
Muestra fechas, duracion, evidencia GPS y todas las consultas del caso, sin modal.
Paginacion y ordenamiento propios; back retorna al listado sin modificar su estado.
Contador muestra encontrados y total cuando difieren. Sin episodio abierto en el
contador, pero aviso Actualmente sin reportar separado. Prueba de plantilla propia.

# Detalles Historicos Desplegables

Cada episodio usa details/summary nativo, cerrado inicialmente. Fechas, duracion y
motivo GPS resumido permanecen visibles. Abrir la fila muestra evidencia GPS y
llamadas con autor/fecha, situacion, decision y observacion en secciones separadas.
Permite abrir varios casos para comparar; conserva paginacion y orden de encabezados.
Chevron gira al abrir, foco visible y accion por teclado. Sin cambios de datos/Excel.

# Cabecera De Ficha Con Scroll

Identidad del equipo, Volver a resultados y contador ahora se desplazan dentro del
mismo contenedor que los episodios. La cabecera no queda fija al abrir/desplazar
desconexiones. Footer de paginacion fuera del scroll, siempre accesible.

# Ficha Segun Referencia Visual (2026-10-15)

Filas resumidas de minimo 52 px, columnas alineadas 20/19/16/45, contenido expandido
blanco con division vertical entre dato GPS y llamadas (apiladas en pantallas pequenas).
Perdida de alimentacion muestra punto naranja y valores Externa/Interna alineados,
solo desde telemetria del episodio; otros diagnosticos conservan evidencia textual.
Situacion y decision de llamadas en una fila, con etiquetas accesibles no visibles.
Ficha inicia en 20 por pagina; cabecera sigue dentro del scroll. Sin cambios de datos.

# Consulta Actual, Proxima Llamada Y Visita (2026-10-19)

Revisar equipo muestra Consultas del caso: solo el episodio abierto, no llamadas
de desconexiones anteriores. Datos anteriores siguen en Historial de desconexiones.
Registrar consulta agrega fecha opcional de proxima llamada y acceso Llamar manana.
Apartado plegable Registrar visita realizada permite resultado y fecha: falla
corregida, otra intervencion o sin falla encontrada. La decision de terreno sigue
siendo explicita; una visita no confirma recuperacion ni cambia conectividad.
Resumen, consultas e historial muestran esos datos; dimensiones del modal iguales,
con scroll cuando el formulario ampliado lo requiere. Sin nuevas pestanas/filtros.

# Contacto En Revisar Equipo (2026-10-19)

Cabecera del modal muestra contacto y telefono bajo la identidad. Numero valido
es enlace tel:; faltantes tienen texto explicito. Datos vienen de Empresas, no de
notas o GPS; edicion sigue en Empresas. Mantiene tamano del modal y scroll existente.

# Simular Otra Desconexion (2026-10-19)

Ficha historica muestra Simular nueva desconexion (demo) solo en desarrollo para
equipo recuperado/reportando vigente. Emite a vista, vuelve a bandeja del mismo
equipo y conserva caso anterior. Sin controles de simulacion en produccion.

# Persona Contactada (2026-10-19)

Registrar consulta agrega Hablo con (100 caracteres) y Cargo (80), ambos opcionales
y vacios al abrir. No copia contacto de empresa ni autor del registro. Nombre/cargo
se muestran en consultas del caso y detalle historico cuando existen. Sin pestañas,
filtros o columnas nuevas; mantiene tamano del modal y scroll del formulario.

# Modal Ampliado Y Formulario En Columnas (2026-10-19)

Revisar equipo pasa a 980x820 px maximos, siempre limitado al viewport menos 32 px.
Contacto/telefono comparten linea cuando caben. Resumen usa texto 14/16 px.
Formulario distribuye datos principales en dos columnas y seguimiento/visita al
lado; observacion ocupa ancho de su seccion. Bajo 780 px se apilan secciones y
bajo 540 px campos. Header/footer fuera del scroll; solo contenido central puede
desplazarse si pantalla pequena, texto largo o muchas consultas lo requieren.
Dimensiones estables entre pestañas; no oculta contenido para evitar scroll.
Esta entrada reemplaza dimensiones anteriores de 680x600. Prueba de contrato SFC.

# Modal Segun Referencia De Consulta (2026-10-19)

Revisar equipo usa cabecera con icono, tipo del activo y estado real (sin afirmar
Operativo por defecto), contacto/telefono con iconos y pestañas azules. Editor:
izquierda Informacion de la consulta en dos columnas y Observacion separada con
contador 0/500; derecha visita en details abierto inicialmente. Mantiene acceso
Llamar manana, fecha de visita condicional, autor/consultas y validaciones previas.
Cancelar a izquierda y Guardar a derecha, footer/cabecera fuera de scroll central.
1380x960 maximo limitado al viewport; debajo de 980 px apila visita y debajo de
540 px campos. Resumen sigue siendo entrada inicial; Registrar consulta abre editor.
Esta entrada reemplaza dimensiones/distribucion anterior. Sin cambios de datos.

# Ajuste De Recorte Y Repintado (2026-10-19)

Retirado backdrop-filter del dialog y reducida sombra. Header/espacios mas compactos,
observacion de 80 px con contador posicionado sin sumar una fila extra. Visita con
altura border-box sin min-height 100% que provocaba desbordamiento; grid de edicion
no estira filas. En escritorio ancho con altura <=800 px, campos en tres columnas;
contacto compacto hasta 900 px de alto. En movil conserva scroll central y botones.
Verificacion visual de componente aislado en Edge headless con capturas de escritorio
1366x768 y movil 500x844; contador cambia al simular escritura. No equivale a medir
rendimiento de pagina completa ni garantiza ausencia de scroll con textos ilimitados.

# Retiro De Programacion De Llamadas (2026-10-19)

Retirados Proxima llamada y Llamar manana del editor, su borrador, handler y estilos.
Los cuatro campos principales quedan en dos columnas (una en movil). Fechas de
llamadas ya guardadas siguen visibles en antecedentes/Excel; no se borran datos.
Se conserva fecha de visita realizada. Esta entrada reemplaza controles anteriores.

# Copiar IMEI

`UnreportedCopyImei.vue` permite copiar el identificador desde la tabla, el modal
y el detalle del historial. Confirma la copia y avisa si el navegador la impide.

# Ultima Evidencia

El resumen de Revisar equipo muestra solo voltajes de la instantanea
de telemetria, con su fecha propia. No sustituye datos faltantes ni afirma estado
actual; los datos mock siguen siendo demostraciones.
# Decision Inicial De Consulta

Al seleccionar Sin uso o No se logro contactar, el formulario selecciona
Pendiente de confirmar. Sin uso bloquea el selector de revision en terreno para
mantener pendiente como unica decision. No se logro contactar tambien bloquea
la decision y oculta y limpia Hablo con y Cargo para no guardar datos residuales.
Al cambiar a otra situacion reinicia la
decision y habilita nuevamente el selector.

# Estadia En Taller

En taller solicita dias estimados (1 a 3650) desde la consulta, guardados con ella.
Las consultas antiguas sin plazo se conservan sin inventar fecha de salida.

# Detalles Y Registro Separados

Revisar equipo inicia en Detalles del vehiculo; Consultas registradas permite leer
el caso. Registrar consulta abre una vista de formulario independiente sin pestañas,
contacto ni resumen repetido. Cancelar vuelve a la vista de origen; guardar muestra
las consultas registradas. Se mantienen dimensiones y controles del formulario.

# Acceso Desde Tabla

Revisar equipo es el unico acceso por fila; abre los detalles y desde el modal se
puede registrar una consulta. Se retiro el acceso directo al formulario.

# Consulta Sin Registro De Visita

Retirado Registrar visita realizada del formulario. El editor ocupa una columna;
los resultados de visitas antiguas siguen visibles en consultas y resumen.

# Modal Compacto

Revisar equipo y Registrar consulta comparten dimensiones de hasta 1020 x 760 px,
limitadas al viewport, sin reducir tipografia ni controles. Se conserva scroll
interno en pantallas bajas y dimensiones estables entre vistas.

# Reglas De Consulta

La decision se fija por situacion: funcionando requiere terreno; sin uso, sin
contacto y taller quedan pendientes. Taller exige dias desde hoy y muestra la
fecha de salida estimada antes de guardar. No se editan consultas antiguas.

# Editar Y Eliminar Consultas

Consultas registradas ofrece Editar y Eliminar con confirmacion por registro.
Editar reutiliza el formulario y conserva fecha, autor y desconexion originales;
se indica autor y fecha de edicion. El plazo corregido cuenta desde la consulta
original, no desde la edicion. Errores de guardado mantienen abierto el formulario.

# Presentacion De Consultas Registradas

Cabecera con cantidad y registros distribuidos en autoria/fecha, informacion del
caso y acciones a la derecha. En pantallas pequenas se apilan sin ocultar datos.
Revision en terreno y Observacion tienen etiquetas diferentes, sin confundirlas.

# Imagen Del Encabezado

El modal recibe la misma imagen de Activos resuelta por la tabla para ese equipo.
Mantiene dimensiones estables, imagen completa y fallback a icono si falla la carga.

