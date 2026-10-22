# Maintenance Utils

Funciones puras y configuracion del modulo; no dependen de componentes Vue.

## Archivos

- `maintenanceModuleConfig.js`: tabs, tipos, prioridades, templates y formularios.
  Los criterios disponibles son Odometro, Horometro y Fecha/Hora (Tiempo en UI).
- `maintenanceFormatUtils.js`: numeros, fechas, montos, lecturas e intervalos.
- `maintenanceUiUtils.js`: etiquetas, clases e iconos de plan, OT y prioridad.
- `maintenancePlanIndex.js`: indice de planes con alias de vehiculo/empresa.
- `maintenanceOrderSummary.js`: resumen en una pasada de estados, costos,
  atrasos y cierres. El cumplimiento solo mide OT finalizadas con cierre y
  fecha limite; si no hay casos medibles, la tasa es null, no un cero inventado.
- `maintenanceOrderCosts.js`: normalizacion y desglose de costos de OT.
- `maintenanceAnalysisData.js`: indice de ejecuciones finalizadas por mes,
  vehiculo y componentes de costo; agregacion del periodo.
- `maintenanceReadingSourceMigration.js`: convierte registros legacy de
  Valor manual a un criterio valido. Los planes migrados quedan sin configurar
  cuando falta intervalo; conserva identidad, evidencias y referencias a OT.

## Reglas

No confundir plan, OT activa y ultima ejecucion. Crear un plan no crea una OT.
El cierre registra la ejecucion; la renovacion del plan es una accion separada.
Los costos historicos deben venir de OT cerradas, y los estados actuales del
plan no deben reemplazar las fechas de una ejecucion para calcular cumplimiento.
La palabra manual puede identificar un plan creado por usuario, pero ya no es
un cuarto criterio de lectura.

Los archivos `*.test.js` junto a los helpers verifican resumen, costos,
indices, analisis y migracion.
# Vencimientos De Licencias

driverLicenseUtils.js valida campos, clases y fechas calendario, normaliza RUT y
clasifica vigencia con dia de Chile. Vence hoy y hasta 30 dias se considera Por vencer;
fecha anterior a hoy es Vencida. Es seguimiento por fecha registrada, no validacion
oficial de la licencia ni calculo del digito verificador del RUT.

# Gestion De Renovaciones

Opciones de contacto, etiqueta de dias al vencimiento, validacion compartida de
renovacion y seleccion de gestiones por licencia. Los estados de contacto no se
usan para calcular vigencia ni para bloquear vehiculos.

# Indice De La Lista De Conductores

validateDriverRenewal exige estado por vencer o vencido (hasta30 dias inclusive),
ademas de vencimiento nuevo posterior y no vencido. Vigentes no se renuevan.

La lista permite ordenar por nombre, clases, vencimiento y estado.
El orden inicial reutiliza el indice; las ordenaciones manuales no mutan registros.

driverLicenseList prepara orden, busqueda normalizada, estados y contadores
una sola vez por cambio de datos. No calcula actividad ni recorre contactos o
renovaciones que no aparecen en la tabla. Conserva las referencias a historiales
y fotos para los modales, sin modificar los registros persistidos. El filtro no vuelve a ordenar
ni recorrer historiales. Benchmark: `node scripts/benchmark-driver-list.mjs`.
En esta maquina 9 consultas sobre 10000 conductores: 247.15ms antes, 8.27ms con indice;
preparacion del indice 185.37ms aparte. No mide la interfaz completa ni tiempos de red.

