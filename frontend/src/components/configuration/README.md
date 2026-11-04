# Configuration Components

Estado verificado contra el codigo: 2026-11-04.
Componentes del editor de Variables calculadas; las otras pantallas de
Configuracion se orquestan en `../../views/Configuration*View.vue`.

## Responsabilidades

- `CalculatedVariableEditor.vue`: formulario de tres pasos (Script, Probar,
  A que vehiculos), plantillas, editor resaltado, expansion y referencias del
  lenguaje. Recibe borrador, activos autorizados y estado de prueba de la vista.
- `CalculatedVariableTest.vue`: entradas manuales separadas por `var` y `ficha`,
  contexto de ficha del equipo y lecturas locales paginadas (25 por pagina,
  hasta 500). No ejecuta codigo ni fabrica resultados o numero de pasos.
- `CalculatedVariableVehicles.vue`: seleccion explicita de activos, filtros,
  modo por modelo y paginacion de 20. Seleccionar modelo agrega los vehiculos
  actuales, no futuras incorporaciones. Anadir compatibles es acumulativo.

## Estado Y Flujo

La vista abre una nueva sesion al elegir, crear o probar una variable. El selector
inicia vacio; la consola de portada sigue visible antes de seleccionar.
Las entradas manuales viven en el editor, no en el borrador persistido. Los pasos
de pruebas y vehiculos usan KeepAlive durante esa sesion para conservar filtros,
modelo, seleccion y pagina. Una nueva sesion no hereda el contexto anterior.

La compatibilidad exige las referencias literales de senales y ficha; cero y
false son datos disponibles. Un campo de ficha vacio no cuenta. Esto comprueba
presencia de entradas, no ejecucion del script ni compatibilidad de tipos.
Las utilidades compartidas viven en `../../utils/layout/`.

## Motor Pendiente

`ConfigurationVariablesView.vue` mantiene `executionAvailable = false`.
Probar script abre el paso de inspeccion: no llama a un motor, no registra exito
y no habilita Guardar. El contrato de plantillas y los topes mostrados deben
verificarse con el motor original al integrarlo. No agregar eval ni resultados
simulados para sortear esta limitacion.

## Presentacion Y Mantenimiento

La portada conserva consola de altura completa, cuatro KPI globales y pendientes;
no volver a compactarla como si el espacio libre requiriera datos de relleno.
Cabeceras coherentes entre portada/editor, sin marco interior duplicado.
La busqueda usa un solo borde azul de foco en su contenedor, no dos outlines.
Mantener controles accesibles, guardias de borrador y seleccion visible al probar.

## Pruebas

`CalculatedVariableEditor.test.js`, `CalculatedVariableVehicles.test.js` y las
pruebas `calculatedVariable*.test.js` de utils/layout. Compilacion y pruebas de
helpers no reemplazan comprobaciones de navegacion y foco en navegador.
