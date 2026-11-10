# Maintenance Utils

Orden de navegacion: Flota, Ordenes, Conductores, Analisis. Se conservan los IDs
de las vistas y sus rutas; solo cambia la posicion de las pestanas.

Funciones puras y configuracion del modulo; no dependen de componentes Vue.

## Archivos

- `maintenanceOrderWizard.js`: validacion de Trabajo, Programacion y Confirmar;
  fechas calendario reales, plazo no anterior y asignacion obligatoria.

- `maintenanceDateTarget.js`: convierte fecha calendario exacta a intervalo y
  viceversa, sin desplazamientos de zona horaria; valida fechas reales.

- `maintenanceTelemetryReading.js`: lee horas acumuladas desde los campos
  reales de plataforma y aliases, con soporte numerico/etiquetas locales.

- `maintenanceRemainingThreshold.js`: texto de cuanto falta para vencer por
  kilometraje/horometro actual o fecha, independiente de anticipacion del aviso.

- `maintenanceOrderPlanning.js`: normaliza fechas antiguas para inputs date y
  valida planificacion: limite obligatorio, inicio opcional no posterior,
  hora opcional valida y responsable/taller requeridos. Sin transiciones de estado.

- `maintenanceOrderDetail.js`: formato de fechas del detalle: yyyy-mm-dd es
  calendario sin zona horaria; instantes muestran hora de Santiago sin segundos.
  Historial desde audit o hechos fechados, sin pasos/usuarios inventados. Filtra
  entradas antiguas Programada que almacenaban fecha objetivo como evento.
  Pruebas en `maintenanceOrderDetail.test.js`.

- `maintenanceOrderIdentity.js`: ademas de migracion, getLegacyMaintenanceOrderReview
  agrupa referencias tecnicas antiguas por ID y categorias de datos. Excluye
  registros de otra empresa explicita y nunca devuelve patentes, importes,
  descripciones ni adjuntos. Referencias sin empresa se muestran sin payload.
  Regresion en `maintenanceLegacyReview.test.js`.

- `maintenanceOrderIdentity.js`: identidad estable por empresa/vehiculo y
  migracion conservadora de IDs posicionales con evidencia guardada de pertenencia.
  No adjudica registros ambiguos por posicion. Pruebas de migracion y colisiones.

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

# Referencia De Lectura Por Fecha

maintenanceHistoricalReading selecciona ultima lectura explicita del dia en
America/Santiago; rechaza futuro, ausencias y valores negativos. No interpola
ni usa el odometro heredado del activo en reportes sin marcador verificable.

