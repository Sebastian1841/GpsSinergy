export const HEAVY_ITINERARY_ROWS_THRESHOLD = 5000

export const itineraryTablePageSizeOptions = [25, 50, 100, 200]

export const itineraryStatusOrder = {
  moving: 1,
  stopped: 2,
  idle: 3,
  offline: 4,
}

export const itineraryStatusLabels = {
  moving: "Movimiento",
  stopped: "Detenido",
  idle: "Espera",
  offline: "Offline",
}

export const itineraryTableColumns = [
  {
    key: "timestamp",
    label: "Hora",
    width: "104px",
    locked: true,
  },
  {
    key: "status",
    label: "Estado",
    width: "118px",
  },
  {
    key: "speed",
    label: "Vel.",
    width: "92px",
    align: "right",
  },
  {
    key: "address",
    label: "Direccion",
    width: "260px",
  },
  {
    key: "accumulatedDistanceKm",
    label: "Km acum.",
    width: "110px",
    align: "right",
  },
  {
    key: "assetDisplayName",
    label: "Activo",
    width: "150px",
    defaultVisible: false,
  },
  {
    key: "assetPatente",
    label: "Patente",
    width: "115px",
    defaultVisible: false,
  },
  {
    key: "assetDeviceId",
    label: "Dispositivo",
    width: "130px",
    defaultVisible: false,
  },
  {
    key: "dateLabel",
    label: "Fecha",
    width: "115px",
    defaultVisible: false,
  },
  {
    key: "event",
    label: "Evento",
    width: "150px",
    defaultVisible: false,
  },
  {
    key: "lat",
    label: "Latitud",
    width: "110px",
    align: "right",
    defaultVisible: false,
  },
  {
    key: "lng",
    label: "Longitud",
    width: "110px",
    align: "right",
    defaultVisible: false,
  },
]

export const normalizeItineraryTableText = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
}
