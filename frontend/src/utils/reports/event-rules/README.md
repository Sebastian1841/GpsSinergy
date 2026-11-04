# Report Event Rules

Motor y configuracion de reglas de evento.

## Archivos

- `reportEventRuleEngine.js`: evalua si un evento/telemetria cumple una regla.
- `reportEventRuleFormUtils.js`: constantes, grupos y helpers del formulario.

## Criterio

El motor debe mantenerse deterministico y testeable. Los componentes solo deben consumir sus resultados.

Los informes de velocidad pueden recibir configuredSpeedLimit desde la
instantanea de ejecucion (empresa/plataforma/tipo o limite propio de ejecucion).
No volver a imponer un default que contradiga ese contexto ni incluir excesos
de activos sin tipo. Ver `../execution/reportLimitsContext.js` y sus pruebas.
Este motor de informes es distinto del editor de reglas automaticas operativas
y del motor de scripts de Variables calculadas, que sigue sin conexion.
