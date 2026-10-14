# Unreported Components

`UnreportedCharts.vue` renderiza graficos del modulo Sin reportar con los
datos recibidos de la vista. No consulta telemetria ni guarda registros.
La tabla, filtros y exportacion se coordinan en `../../views/UnreportedView.vue`.
Los datos actuales son mock; no presentar estos graficos como diagnostico
de conectividad real.

`UnreportedOperationModal.vue` muestra Notas del equipo y permite agregar
notas de hasta 500 caracteres con fecha y autor, sin cambiar el seguimiento.
Se abre desde Notas (contador); los textos no recargan las filas de la tabla.
Se conserva cada nota tras recuperarse y el formulario se limpia solo al guardar.
Modal de 680 px maximo, titulo con equipo e identidad debajo, notas con fondo
suave, separador antes del formulario y botones Cancelar/Agregar nota.
Diseno responsive y fechas en zona America/Santiago con formato de 12 horas.
Cada nota tiene autor y fecha arriba en negrita, con texto debajo de peso normal.
Menu por nota con Editar y Eliminar. Editar usa el formulario, preserva autor y
fecha original y muestra modificacion. Eliminar exige confirmacion en la nota.
El formulario inicia oculto. Agregar nota o Editar lo abre y enfoca; Cancelar
lo oculta sin guardar y un guardado exitoso devuelve a la lista. Un error conserva
el borrador abierto para reintentar.
Altura estable de 600 px (acotada al viewport), sin cambios al abrir el editor.
La lista ocupa el espacio restante y se desplaza internamente; textarea fijo.
No hay retiro manual ni reactivacion en este flujo.
Dialog nativo centrado explicitamente con inset y margen automatico para no
depender de los margenes del navegador eliminados por el reset CSS.
Altura acotada a la pantalla y botones adaptables en anchos pequenos.

La libreta anterior fue retirada. Las notas actuales pertenecen al seguimiento
del equipo y se almacenan en unreportedLifecycleStore, no en el servicio antiguo.
