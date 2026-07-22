import { REPORT_WIDGET_IDS } from "../config/reportWidgetUtils.js"

export const REPORT_TEMPLATE_MODAL_STEPS = [
  {
    id: "datos",
    label: "Datos",
  },
  {
    id: "evento",
    label: "Evento",
  },
  {
    id: "columnas",
    label: "Columnas",
  },
  {
    id: "vista",
    label: "Vista",
  },
]

export const TRIP_REPORT_RULE_IDS = ["movement", "stops", "idle", "tripEnd"]

export const TRIP_REPORT_COLUMN_IDS = [
  "fecha",
  "patente",
  "vehiculo",
  "tripStart",
  "tripEnd",
  "tripDuration",
  "tripOrigin",
  "tripDestination",
  "tripDistanceKm",
  "tripMaxSpeed",
  "tripStops",
  "tripEvents",
]

export const TRIP_REPORT_WIDGET_IDS = [
  REPORT_WIDGET_IDS.summaryCards,
  REPORT_WIDGET_IDS.table,
  REPORT_WIDGET_IDS.charts,
]

export const REPORT_TEMPLATE_PREVIEW_CARDS = [
  {
    label: "Activos",
    value: "24",
  },
  {
    label: "Eventos",
    value: "138",
  },
  {
    label: "Alertas",
    value: "7",
  },
]

export const REPORT_TEMPLATE_PREVIEW_ROWS = [1, 2, 3]

const REPORT_TEMPLATE_PREVIEW_VALUES = {
  fecha: ["17/06/2026", "17/06/2026", "17/06/2026"],
  patente: ["JH-KL-22", "BC-TR-88", "LP-ZX-41"],
  vehiculo: ["Camioneta 4x4", "Camion reparto", "Furgon tecnico"],
  deviceId: ["1234598765432", "8675309000123", "3593390800456"],
  empresa: ["Nodus", "Nodus", "Nodus"],
  conductor: ["Mario Rojas", "Camila Soto", "Felipe Diaz"],
  estado: ["En movimiento", "Detenido", "Ralenti"],
  ignition: ["true", "false", "true"],
  ignicion: ["true", "false", "true"],
  contacto: ["true", "false", "true"],
  ultimoDato: ["12:24", "12:21", "12:18"],
  velocidad: ["62 km/h", "0 km/h", "8 km/h"],
  odometro: ["82.440 km", "41.102 km", "66.220 km"],
  horometro: ["1.204 h", "890 h", "1.560 h"],
  geocerca: ["Grupo Norte", "Bodega Central", "Ruta 5"],
  evento: ["Entrada", "Salida", "Permanencia"],
  duracion: ["12 min", "4 min", "38 min"],
  combustible: ["74%", "38%", "62%"],
  gpsSatellites: ["12 sat", "8 sat", "10 sat"],
  gpsSignal: ["92%", "81%", "88%"],
  gpsFix: ["3D", "3D", "2D"],
  lat: ["-33.448779", "-33.446913", "-33.451240"],
  lng: ["-70.669335", "-70.671204", "-70.668501"],
  coordinates: ["-33.44878, -70.66934", "-33.44691, -70.67120", "-33.45124, -70.66850"],
  address: ["Av. Central 120", "Bodega Central", "Ruta 5"],
  lastPosition: ["Av. Central 120", "Bodega Central", "Ruta 5"],
  horometroTotal: ["1.204 h", "890 h", "1.560 h"],
  horometroDiario: ["4,2 h", "1,1 h", "6,7 h"],
  canRpm: ["2.150 rpm", "0 rpm", "780 rpm"],
  canEngineTemp: ["91 C", "74 C", "82 C"],
  canBatteryVoltage: ["13,8 V", "12,6 V", "13,1 V"],
  canEngineLoad: ["63%", "0%", "18%"],
  canSummary: ["RPM 2.150 / 91 C / 63%", "RPM 0 / 74 C / 0%", "RPM 780 / 82 C / 18%"],
  canThrottle: ["34%", "0%", "8%"],
  canFuelRate: ["7,4 L/h", "0 L/h", "2,1 L/h"],
  canFuelUsed: ["1.042,5 L", "890,2 L", "1.214,8 L"],
  canOilPressure: ["39 psi", "25 psi", "31 psi"],
  canAdBlueLevel: ["68%", "72%", "61%"],
  canDtcCount: ["0", "1", "0"],
  digitalInput1: ["Activa", "Inactiva", "Activa"],
  digitalInput2: ["Inactiva", "Activa", "Inactiva"],
  trackerModelLabel: ["Teltonika FMC130", "Concox GT06", "Queclink GV300"],
  imei: ["1234598765432", "8675309000123", "3593390800456"],
  protocol: ["TCP", "TCP", "UDP"],
  fechaIngreso: ["2026-06-17", "2026-06-16", "2026-06-15"],
  alerta: ["Sin alerta", "Velocidad", "Sin senal"],
}

export const getReportTemplatePreviewValue = (columnId, rowIndex) => {
  return REPORT_TEMPLATE_PREVIEW_VALUES[columnId]?.[rowIndex - 1] || "-"
}
