const buildReportAccess = (enabledReportIds, reportTypes) => {
  const enabledReports = new Set(enabledReportIds)

  return reportTypes.map((reportType) => ({
    reportId: reportType.id,
    enabled: enabledReports.has(reportType.id),
  }))
}

const createPermissions = ({ view = false, edit = false, admin = false } = {}) => ({
  view,
  edit,
  admin,
})

const createFunctionAccess = (functionId, permissions = {}) => ({
  functionId,
  enabled: true,
  permissions: createPermissions(permissions),
})

const systemModuleIds = ["assets", "users", "audit"]

const getModuleIdFromFunctionId = (functionId) => {
  const normalizedFunctionId = String(functionId || "")

  if (normalizedFunctionId.startsWith("users-")) return "users"
  if (normalizedFunctionId.startsWith("audit-")) return "audit"

  return "assets"
}

const createAccessScope = (scope = {}) => {
  const cleanScope = {
    ...scope,
  }

  delete cleanScope.criticalAlerts
  delete cleanScope.reports

  return {
    type: "all-assets",
    sucursalIds: [],
    assetIds: [],
    ...cleanScope,
  }
}

const createAccess = ({
  id,
  userId,
  applicationId,
  role,
  status = "active",
  functions = [],
  scope = {},
}) => {
  const enabledModuleIds = new Set(
    functions.map((functionAccess) => {
      return getModuleIdFromFunctionId(functionAccess.functionId)
    }),
  )

  return {
    id,
    userId,
    applicationId,
    role,
    status,
    modules: systemModuleIds.map((moduleId) => ({
      moduleId,
      enabled: enabledModuleIds.has(moduleId),
    })),
    functions,
    scope: createAccessScope(scope),
  }
}

const createAsset = ({
  id,
  companyId,
  applicationId,
  sucursalId,
  patente,
  vehiculo,
  conductor,
  estado,
  lat,
  lng,
  velocidad = 0,
  odometro,
  combustible,
  datosUlt,
  imei,
  mapIcon = "vehicle-3d",
  assetType,
  assetTypeLabel,
}) => ({
  id,
  companyId,
  applicationId,
  sucursalId,
  source: "mock-database",
  estado,
  vehiculo,
  name: vehiculo,
  nombrePantalla: vehiculo,
  patente,
  patent: patente,
  conductor,
  datosUlt,
  choque: "-",
  lat,
  lng,
  speed: velocidad,
  velocidad: `${velocidad} km/h`,
  combustible,
  fuelPercent: combustible,
  combustibleNivel: combustible,
  odometro: `${odometro.toLocaleString("es-CL")} km`,
  odometer: odometro,
  direccion: `Ultima ubicacion registrada de ${vehiculo}`,
  imei,
  deviceId: imei,
  protocol: "tcp",
  trackerModel: "teltonika-fmb920",
  trackerModelLabel: "Teltonika FMB920",
  trackerManufacturer: "Teltonika",
  assetType,
  assetTypeLabel,
  tipoActivo: assetType,
  tipoActivoLabel: assetTypeLabel,
  descripcion: `Activo operativo ${patente}`,
  fechaIngreso: "2026-01-15",
  fechaBaja: "-",
  fechaSuspension: "-",
  horometroDiario: estado === "offline" ? "-" : `${(2 + (odometro % 7)).toFixed(1)} h`,
  horometroTotal: `${Math.round(odometro / 42).toLocaleString("es-CL")} h`,
  engineHours: Math.round(odometro / 42),
  gpsSignal: estado === "offline" ? 0 : 78 + (odometro % 18),
  gpsSignalLabel: estado === "offline" ? "0%" : `${78 + (odometro % 18)}%`,
  gpsSatellites: estado === "offline" ? 0 : 8 + (odometro % 9),
  gpsFix: estado === "offline" ? "Sin fix" : "Fix 3D",
  canStatus: estado === "offline" ? "Sin datos" : "OK",
  canRpm: estado === "moving" ? 1100 + (odometro % 1200) : estado === "idle" ? 780 : 0,
  canEngineTemp: estado === "offline" ? 0 : 78 + (odometro % 19),
  canBatteryVoltage: estado === "offline" ? 0 : Number((12.5 + (odometro % 18) / 10).toFixed(1)),
  canEngineLoad: estado === "moving" ? 35 + (odometro % 52) : estado === "idle" ? 18 : 0,
  canThrottle: estado === "moving" ? 15 + (odometro % 55) : 0,
  canFuelRate:
    estado === "moving"
      ? Number((6 + (odometro % 120) / 10).toFixed(1))
      : estado === "idle"
        ? 2.1
        : 0,
  canFuelUsed: Number((1000 + odometro / 85).toFixed(1)),
  canOilPressure: estado === "offline" ? 0 : 25 + (odometro % 24),
  canAdBlueLevel: estado === "offline" ? 0 : 42 + (odometro % 47),
  canDtcCount: estado === "offline" ? 0 : odometro % 3,
  canSummary:
    estado === "offline"
      ? "Sin datos"
      : `RPM ${
          estado === "moving" ? 1100 + (odometro % 1200) : estado === "idle" ? 780 : 0
        } / ${78 + (odometro % 19)} C / ${
          estado === "moving" ? 35 + (odometro % 52) : estado === "idle" ? 18 : 0
        }%`,
  ibutton: "-",
  ignition: estado === "moving" || estado === "idle",
  ignicion: estado === "moving" || estado === "idle",
  contacto: estado === "moving" || estado === "idle",
  digitalInput1: estado === "moving" || estado === "idle",
  digitalInput2: odometro % 5 === 0 ? 1 : 0,
  input1: estado === "moving" || estado === "idle" ? 1 : 0,
  input2: odometro % 5 === 0 ? 1 : 0,
  ...(mapIcon ? { mapIcon } : {}),
})

const mockReportTypes = [
  {
    id: "mileage",
    name: "Kilometraje",
    description: "Distancia recorrida por activo, periodo y grupo.",
    category: "Operacion",
  },
  {
    id: "speed",
    name: "Velocidad",
    description: "Velocidad maxima, promedio y excesos por activo.",
    category: "Operacion",
  },
  {
    id: "route-history",
    name: "Recorridos",
    description: "Historial de trayectos, posiciones y eventos.",
    category: "Operacion",
  },
  {
    id: "stops",
    name: "Detenciones",
    description: "Tiempos detenidos, ubicaciones y permanencia.",
    category: "Operacion",
  },
  {
    id: "idle-time",
    name: "Ralenti",
    description: "Tiempo con motor encendido sin movimiento.",
    category: "Operacion",
  },
  {
    id: "geofences",
    name: "Geocercas",
    description: "Entradas, salidas y pasos por zonas configuradas.",
    category: "Control",
  },
  {
    id: "gps-signal",
    name: "Senal GPS",
    description: "Perdidas de senal, ultimo reporte y equipos sin datos.",
    category: "Control",
  },
  {
    id: "can",
    name: "CAN",
    description: "Datos CAN disponibles por activo y periodo.",
    category: "Telemetria",
  },
  {
    id: "fuel",
    name: "Combustible",
    description: "Consumo, variacion de estanque y rendimiento.",
    category: "Telemetria",
  },
  {
    id: "engine-hours",
    name: "Horas motor",
    description: "Horas de motor, ralenti y actividad operacional.",
    category: "Telemetria",
  },
  {
    id: "ignition",
    name: "Encendido",
    description: "Cambios de contacto, encendido y apagado.",
    category: "Telemetria",
  },
]

const allReportIds = mockReportTypes.map((reportType) => reportType.id)

const mockCompanies = [
  {
    id: "company-001",
    applicationId: "app-001",
    name: "Transportes San Pedro",
    shortName: "TSP",
    rut: "76.145.982-1",
    status: "active",
    contactName: "Claudio Rivas",
    contactEmail: "claudio.rivas@tsp.cl",
    contactPhone: "+56 9 4421 8912",
    region: "Metropolitana",
    city: "Santiago",
    createdAt: "2026-01-15",
    lastTelemetryAt: "Hace 2 min",
    workspacePath: "/app/company-001/activos",
    sucursalesHabilitadas: true,
    sucursales: [
      { id: "sucursal-company-001-001", name: "Casa matriz", active: true },
      { id: "sucursal-company-001-002", name: "Base norte", active: true },
      { id: "sucursal-company-001-003", name: "Centro de distribucion", active: true },
    ],
    reports: buildReportAccess(allReportIds, mockReportTypes),
  },
  {
    id: "company-002",
    applicationId: "app-002",
    name: "Forestal Los Robles",
    shortName: "FLR",
    rut: "78.204.441-6",
    status: "active",
    contactName: "Maria Torres",
    contactEmail: "maria.torres@flr.cl",
    contactPhone: "+56 9 8764 2011",
    region: "Araucania",
    city: "Temuco",
    createdAt: "2026-02-03",
    lastTelemetryAt: "Hace 5 min",
    workspacePath: "/app/company-002/activos",
    sucursalesHabilitadas: true,
    sucursales: [
      { id: "sucursal-company-002-001", name: "Temuco", active: true },
      { id: "sucursal-company-002-002", name: "Angol", active: true },
    ],
    reports: buildReportAccess(allReportIds, mockReportTypes),
  },
  {
    id: "company-003",
    applicationId: "app-003",
    name: "Constructora Norte",
    shortName: "CN",
    rut: "77.991.204-8",
    status: "pending",
    contactName: "Jorge Medina",
    contactEmail: "jorge.medina@constructoranorte.cl",
    contactPhone: "+56 9 3320 7814",
    region: "Antofagasta",
    city: "Calama",
    createdAt: "2026-03-21",
    lastTelemetryAt: "Hace 14 min",
    workspacePath: "/app/company-003/activos",
    sucursalesHabilitadas: true,
    sucursales: [
      { id: "sucursal-company-003-001", name: "Calama", active: true },
      { id: "sucursal-company-003-002", name: "Antofagasta", active: true },
      { id: "sucursal-company-003-003", name: "Faena Sierra", active: true },
    ],
    reports: buildReportAccess(allReportIds, mockReportTypes),
  },
  {
    id: "company-004",
    applicationId: "app-004",
    name: "Sinergy Interno",
    shortName: "SG",
    rut: "76.000.000-0",
    status: "internal",
    contactName: "Equipo Sinergy",
    contactEmail: "admin@sinergy.cl",
    contactPhone: "+56 2 2400 0000",
    region: "Metropolitana",
    city: "Santiago",
    createdAt: "2026-01-01",
    lastTelemetryAt: "Hace 1 min",
    workspacePath: "/app/company-004/activos",
    sucursalesHabilitadas: true,
    sucursales: [{ id: "sucursal-company-004-001", name: "Oficina central", active: true }],
    reports: buildReportAccess(allReportIds, mockReportTypes),
  },
]

const mockApplicationDefinitions = mockCompanies.map((company) => ({
  id: company.applicationId,
  companyId: company.id,
  shortName: company.shortName,
  type: company.status === "internal" ? "Administracion interna" : "Empresa cliente",
}))

const SAN_PEDRO_LOAD_TEST_ASSET_TARGET = 280
const SAN_PEDRO_LOAD_TEST_EXISTING_ASSETS = 16

const sanPedroLoadTestBranches = [
  "sucursal-company-001-001",
  "sucursal-company-001-002",
  "sucursal-company-001-003",
]

const sanPedroLoadTestModels = [
  { label: "Automovil operativo", mapIcon: "vehicle-car", type: "car" },
  { label: "Camioneta reparto", mapIcon: "vehicle-pickup", type: "pickup" },
  { label: "Camion urbano", mapIcon: "vehicle-truck", type: "truck" },
  { label: "Bus traslado", mapIcon: "vehicle-bus", type: "bus" },
  { label: "Furgon logistico", mapIcon: "vehicle-van", type: "van" },
  { label: "Moto despacho", mapIcon: "vehicle-motorcycle", type: "motorcycle" },
  { label: "Maquinaria apoyo", mapIcon: "vehicle-machinery", type: "machinery" },
  { label: "Remolque carga", mapIcon: "vehicle-trailer", type: "trailer" },
]

const sanPedroLoadTestCenters = [
  { lat: -33.4489, lng: -70.6693 },
  { lat: -33.0472, lng: -71.6127 },
  { lat: -34.1708, lng: -70.7444 },
  { lat: -35.4264, lng: -71.6554 },
  { lat: -36.8201, lng: -73.0444 },
  { lat: -39.8142, lng: -73.2459 },
]

const buildSanPedroLoadTestAsset = (index) => {
  const sequence = index + 1
  const model = sanPedroLoadTestModels[index % sanPedroLoadTestModels.length]
  const center = sanPedroLoadTestCenters[index % sanPedroLoadTestCenters.length]
  const ring = Math.floor(index / sanPedroLoadTestCenters.length)
  const angle = (index * 137.508 * Math.PI) / 180
  const radius = 0.008 + (ring % 9) * 0.004
  const speed = index % 5 === 0 ? 0 : 22 + (index % 58)
  const estado = index % 13 === 0 ? "offline" : speed > 0 ? "moving" : "idle"
  const patenteNumber = String(sequence).padStart(3, "0")

  return createAsset({
    id: `asset-sp-load-${patenteNumber}`,
    companyId: "company-001",
    applicationId: "app-001",
    sucursalId: sanPedroLoadTestBranches[index % sanPedroLoadTestBranches.length],
    patente: `SP-${patenteNumber}`,
    vehiculo: `${model.label} ${patenteNumber}`,
    conductor: `Conductor San Pedro ${patenteNumber}`,
    estado,
    lat: Number((center.lat + Math.sin(angle) * radius).toFixed(6)),
    lng: Number((center.lng + Math.cos(angle) * radius).toFixed(6)),
    velocidad: estado === "moving" ? speed : 0,
    odometro: 65000 + sequence * 487,
    combustible: estado === "offline" ? "-" : `${45 + (index % 48)}%`,
    datosUlt: `12:${String(10 + (index % 49)).padStart(2, "0")}:${String(index % 60).padStart(
      2,
      "0",
    )}`,
    imei: `86812346${String(sequence).padStart(6, "0")}`,
    mapIcon: model.mapIcon,
    assetType: model.type,
    assetTypeLabel: model.label,
  })
}

const mockSanPedroLoadTestAssets = Array.from(
  {
    length: SAN_PEDRO_LOAD_TEST_ASSET_TARGET - SAN_PEDRO_LOAD_TEST_EXISTING_ASSETS,
  },
  (_, index) => buildSanPedroLoadTestAsset(index),
)

export const mockAssets = [
  createAsset({
    id: "asset-001",
    companyId: "company-001",
    applicationId: "app-001",
    sucursalId: "sucursal-company-001-001",
    patente: "MAES-01",
    vehiculo: "Camion reparto 01",
    conductor: "Carlos Ramirez",
    estado: "idle",
    lat: -33.4489,
    lng: -70.6693,
    odometro: 125430,
    combustible: "68%",
    datosUlt: "12:22:14",
    imei: "868123450001",
  }),
  createAsset({
    id: "asset-002",
    companyId: "company-001",
    applicationId: "app-001",
    sucursalId: "sucursal-company-001-003",
    patente: "GKZK-26",
    vehiculo: "Camioneta JAC",
    conductor: "Ana Torres",
    estado: "idle",
    lat: -33.4521,
    lng: -70.6625,
    odometro: 88420,
    combustible: "72%",
    datosUlt: "12:22:12",
    imei: "868123450002",
  }),
  createAsset({
    id: "asset-003",
    companyId: "company-001",
    applicationId: "app-001",
    sucursalId: "sucursal-company-001-002",
    patente: "TWDR-56",
    vehiculo: "Tracto camion norte",
    conductor: "Juan Perez",
    estado: "idle",
    lat: -33.4448,
    lng: -70.6755,
    odometro: 54210,
    combustible: "64%",
    datosUlt: "12:20:17",
    imei: "868123450003",
  }),
  createAsset({
    id: "asset-004",
    companyId: "company-001",
    applicationId: "app-001",
    sucursalId: "sucursal-company-001-001",
    patente: "SSGY-01",
    vehiculo: "Camioneta SsangYong",
    conductor: "Maria Gonzalez",
    estado: "moving",
    lat: -33.4568,
    lng: -70.6712,
    velocidad: 38,
    odometro: 76550,
    combustible: "61%",
    datosUlt: "12:19:46",
    imei: "868123450004",
  }),
  createAsset({
    id: "asset-005",
    companyId: "company-001",
    applicationId: "app-001",
    sucursalId: "sucursal-company-001-003",
    patente: "PLKR-18",
    vehiculo: "Furgon de reparto",
    conductor: "Felipe Soto",
    estado: "stopped",
    lat: -33.461,
    lng: -70.658,
    odometro: 99280,
    combustible: "55%",
    datosUlt: "12:12:11",
    imei: "868123450005",
  }),
  createAsset({
    id: "asset-006",
    companyId: "company-001",
    applicationId: "app-001",
    sucursalId: null,
    patente: "LXHD-60",
    vehiculo: "Maxus T60",
    conductor: "Luis Hidalgo",
    estado: "offline",
    lat: -33.4412,
    lng: -70.6552,
    odometro: 143210,
    combustible: "-",
    datosUlt: "12:09:44",
    imei: "868123450006",
  }),
  createAsset({
    id: "asset-013",
    companyId: "company-001",
    applicationId: "app-001",
    sucursalId: "sucursal-company-001-002",
    patente: "ARIC-13",
    vehiculo: "Camion norte Arica",
    conductor: "Pedro Salinas",
    estado: "moving",
    lat: -18.4783,
    lng: -70.3126,
    velocidad: 42,
    odometro: 154280,
    combustible: "69%",
    datosUlt: "12:24:13",
    imei: "868123450013",
  }),
  createAsset({
    id: "asset-014",
    companyId: "company-001",
    applicationId: "app-001",
    sucursalId: "sucursal-company-001-002",
    patente: "IQQU-14",
    vehiculo: "Camion Iquique",
    conductor: "Ramon Paredes",
    estado: "idle",
    lat: -20.2133,
    lng: -70.1524,
    odometro: 118430,
    combustible: "73%",
    datosUlt: "12:23:44",
    imei: "868123450014",
  }),
  createAsset({
    id: "asset-015",
    companyId: "company-001",
    applicationId: "app-001",
    sucursalId: "sucursal-company-001-002",
    patente: "LSER-15",
    vehiculo: "Furgon La Serena",
    conductor: "Camila Rojas",
    estado: "moving",
    lat: -29.9027,
    lng: -71.2519,
    velocidad: 35,
    odometro: 90410,
    combustible: "81%",
    datosUlt: "12:23:12",
    imei: "868123450015",
  }),
  createAsset({
    id: "asset-016",
    companyId: "company-001",
    applicationId: "app-001",
    sucursalId: "sucursal-company-001-003",
    patente: "VALP-16",
    vehiculo: "Camion Valparaiso",
    conductor: "Ignacio Morales",
    estado: "stopped",
    lat: -33.0472,
    lng: -71.6127,
    odometro: 130220,
    combustible: "57%",
    datosUlt: "12:22:40",
    imei: "868123450016",
  }),
  createAsset({
    id: "asset-017",
    companyId: "company-001",
    applicationId: "app-001",
    sucursalId: "sucursal-company-001-003",
    patente: "RANC-17",
    vehiculo: "Camion Rancagua",
    conductor: "Elena Fuentes",
    estado: "idle",
    lat: -34.1708,
    lng: -70.7444,
    odometro: 74120,
    combustible: "76%",
    datosUlt: "12:22:01",
    imei: "868123450017",
  }),
  createAsset({
    id: "asset-018",
    companyId: "company-001",
    applicationId: "app-001",
    sucursalId: "sucursal-company-001-003",
    patente: "TALC-18",
    vehiculo: "Camion Talca",
    conductor: "Victor Campos",
    estado: "moving",
    lat: -35.4264,
    lng: -71.6554,
    velocidad: 51,
    odometro: 164730,
    combustible: "62%",
    datosUlt: "12:21:35",
    imei: "868123450018",
  }),
  createAsset({
    id: "asset-019",
    companyId: "company-001",
    applicationId: "app-001",
    sucursalId: "sucursal-company-001-001",
    patente: "CCPC-19",
    vehiculo: "Camion Concepcion",
    conductor: "Sofia Carrasco",
    estado: "idle",
    lat: -36.8201,
    lng: -73.0444,
    odometro: 101650,
    combustible: "70%",
    datosUlt: "12:21:02",
    imei: "868123450019",
  }),
  createAsset({
    id: "asset-020",
    companyId: "company-001",
    applicationId: "app-001",
    sucursalId: "sucursal-company-001-001",
    patente: "VDIV-20",
    vehiculo: "Camion Valdivia",
    conductor: "Cristobal Vera",
    estado: "moving",
    lat: -39.8142,
    lng: -73.2459,
    velocidad: 44,
    odometro: 112870,
    combustible: "67%",
    datosUlt: "12:20:31",
    imei: "868123450020",
  }),
  createAsset({
    id: "asset-021",
    companyId: "company-001",
    applicationId: "app-001",
    sucursalId: "sucursal-company-001-001",
    patente: "PMNT-21",
    vehiculo: "Camion Puerto Montt",
    conductor: "Javiera Lagos",
    estado: "stopped",
    lat: -41.4693,
    lng: -72.9424,
    odometro: 149530,
    combustible: "59%",
    datosUlt: "12:19:58",
    imei: "868123450021",
  }),
  createAsset({
    id: "asset-022",
    companyId: "company-001",
    applicationId: "app-001",
    sucursalId: "sucursal-company-001-002",
    patente: "PARN-22",
    vehiculo: "Camion Punta Arenas",
    conductor: "Matias Andrade",
    estado: "offline",
    lat: -53.1638,
    lng: -70.9171,
    odometro: 187340,
    combustible: "-",
    datosUlt: "12:18:49",
    imei: "868123450022",
  }),
  ...mockSanPedroLoadTestAssets,
  createAsset({
    id: "asset-007",
    companyId: "company-002",
    applicationId: "app-002",
    sucursalId: "sucursal-company-002-001",
    patente: "JSFG-74",
    vehiculo: "Camion forestal 01",
    conductor: "Daniel Rojas",
    estado: "moving",
    lat: -38.7359,
    lng: -72.5904,
    velocidad: 46,
    odometro: 176820,
    combustible: "74%",
    datosUlt: "12:18:20",
    imei: "868123450007",
  }),
  createAsset({
    id: "asset-008",
    companyId: "company-002",
    applicationId: "app-002",
    sucursalId: "sucursal-company-002-002",
    patente: "FLRB-22",
    vehiculo: "Camioneta supervisora",
    conductor: "Andrea Molina",
    estado: "idle",
    lat: -37.8014,
    lng: -72.7162,
    odometro: 65300,
    combustible: "82%",
    datosUlt: "12:17:03",
    imei: "868123450008",
  }),
  createAsset({
    id: "asset-009",
    companyId: "company-002",
    applicationId: "app-002",
    sucursalId: "sucursal-company-002-001",
    patente: "MDFR-09",
    vehiculo: "Maquinaria forestal",
    conductor: "Sin conductor",
    estado: "offline",
    lat: -38.7384,
    lng: -72.5951,
    odometro: 35210,
    combustible: "-",
    datosUlt: "11-05-2026",
    imei: "868123450009",
  }),
  createAsset({
    id: "asset-010",
    companyId: "company-003",
    applicationId: "app-003",
    sucursalId: "sucursal-company-003-001",
    patente: "CNRT-10",
    vehiculo: "Camion tolva",
    conductor: "Marcelo Soto",
    estado: "moving",
    lat: -22.4544,
    lng: -68.9292,
    velocidad: 32,
    odometro: 212430,
    combustible: "58%",
    datosUlt: "12:21:11",
    imei: "868123450010",
  }),
  createAsset({
    id: "asset-011",
    companyId: "company-003",
    applicationId: "app-003",
    sucursalId: "sucursal-company-003-003",
    patente: "FNSA-11",
    vehiculo: "Camioneta faena",
    conductor: "Jose Medina",
    estado: "stopped",
    lat: -22.4698,
    lng: -68.918,
    odometro: 97210,
    combustible: "66%",
    datosUlt: "12:15:08",
    imei: "868123450011",
  }),
  createAsset({
    id: "asset-012",
    companyId: "company-004",
    applicationId: "app-004",
    sucursalId: "sucursal-company-004-001",
    patente: "SGIN-12",
    vehiculo: "Movil soporte Sinergy",
    conductor: "Soporte Tecnico",
    estado: "idle",
    lat: -33.432,
    lng: -70.66,
    odometro: 43210,
    combustible: "78%",
    datosUlt: "12:23:01",
    imei: "868123450012",
  }),
]

const mockSystemModules = [
  {
    id: "assets",
    name: "Activos",
    description: "Gestion operativa de flota, mapa, rutas, geocercas y reportes.",
  },
  {
    id: "users",
    name: "Usuarios",
    description: "Administracion de cuentas, empresas asignadas y permisos.",
  },
  {
    id: "audit",
    name: "Auditoria",
    description: "Trazabilidad de sesiones, permisos, reportes y cambios operativos.",
  },
]

const mockModuleFunctions = [
  { id: "gps", moduleId: "assets", name: "Control GPS", description: "Monitoreo de activos." },
  { id: "geofences", moduleId: "assets", name: "Geocercas", description: "Control territorial." },
  {
    id: "itineraries",
    moduleId: "assets",
    name: "Itinerarios",
    description: "Historial de recorridos.",
  },
  {
    id: "branches",
    moduleId: "assets",
    name: "Grupos",
    description: "Administracion y asignacion de grupos de activos.",
  },
  { id: "reports", moduleId: "assets", name: "Reportes", description: "Informes operativos." },
  {
    id: "users-view",
    moduleId: "users",
    name: "Ver usuarios",
    description: "Consultar usuarios.",
  },
  {
    id: "users-create",
    moduleId: "users",
    name: "Crear usuarios",
    description: "Registrar usuarios.",
  },
  {
    id: "users-edit",
    moduleId: "users",
    name: "Editar usuarios",
    description: "Modificar usuarios.",
  },
  {
    id: "users-permissions",
    moduleId: "users",
    name: "Modificar permisos",
    description: "Administrar permisos.",
  },
  {
    id: "audit-view",
    moduleId: "audit",
    name: "Ver auditoria",
    description: "Consultar registros de auditoria.",
  },
  {
    id: "audit-export",
    moduleId: "audit",
    name: "Exportar auditoria",
    description: "Descargar registros de auditoria.",
  },
]

const mockPermissions = [
  { id: "view", name: "Ver" },
  { id: "edit", name: "Editar" },
  { id: "admin", name: "Administrar" },
]

const mockOperationalScopes = [
  { id: "all-assets", name: "Todos los activos", description: "Acceso a toda la flota." },
  { id: "sucursal", name: "Grupo asignado", description: "Acceso por grupo." },
  {
    id: "selected-assets",
    name: "Activos especificos",
    description: "Acceso a activos seleccionados.",
  },
]

const mockRoles = [
  { id: "admin", name: "Administrador" },
  { id: "supervisor", name: "Supervisor" },
  { id: "operator", name: "Operador" },
  { id: "technician", name: "Tecnico" },
  { id: "viewer", name: "Visualizador" },
]

const mockUsers = [
  {
    id: "user-001",
    name: "Administrador Principal",
    username: "admin",
    password: "admin1234",
    email: "admin@sinergy.cl",
    status: "active",
    isPlatformAdmin: true,
    lastAccess: "Hoy 09:42",
  },
  {
    id: "user-002",
    name: "Operador Flota Norte",
    username: "operador-norte",
    password: "operador1234",
    email: "operador.norte@sinergy.cl",
    status: "active",
    lastAccess: "Hoy 08:16",
  },
  {
    id: "user-003",
    name: "Supervisor Territorial",
    username: "supervisor-geo",
    password: "supervisor1234",
    email: "supervisor.geo@sinergy.cl",
    status: "active",
    lastAccess: "Ayer 17:55",
  },
  {
    id: "user-004",
    name: "Visualizador Cliente",
    username: "cliente",
    password: "cliente1234",
    email: "cliente@sinergy.cl",
    status: "pending",
    lastAccess: "-",
  },
  {
    id: "user-005",
    name: "Soporte Tecnico",
    username: "soporte",
    password: "soporte1234",
    email: "soporte@sinergy.cl",
    status: "inactive",
    lastAccess: "Lun 18:03",
  },
]

const adminAssetFunctions = [
  createFunctionAccess("gps", { view: true, edit: true, admin: true }),
  createFunctionAccess("geofences", { view: true, edit: true, admin: true }),
  createFunctionAccess("itineraries", { view: true, edit: true }),
  createFunctionAccess("branches", { view: true, edit: true, admin: true }),
  createFunctionAccess("reports", { view: true }),
]

const adminAuditFunctions = [
  createFunctionAccess("audit-view", { view: true }),
  createFunctionAccess("audit-export", { view: true }),
]

const mockUserAccesses = [
  createAccess({
    id: "access-001",
    userId: "user-001",
    applicationId: "app-001",
    role: "admin",
    functions: [
      ...adminAssetFunctions,
      ...adminAuditFunctions,
      createFunctionAccess("users-view", { view: true, edit: true, admin: true }),
      createFunctionAccess("users-create", { view: true, edit: true, admin: true }),
      createFunctionAccess("users-edit", { view: true, edit: true, admin: true }),
      createFunctionAccess("users-permissions", { view: true, edit: true, admin: true }),
    ],
    scope: {
      type: "all-assets",
    },
  }),
  createAccess({
    id: "access-002",
    userId: "user-001",
    applicationId: "app-002",
    role: "supervisor",
    functions: [...adminAssetFunctions, ...adminAuditFunctions],
    scope: {
      type: "all-assets",
    },
  }),
  createAccess({
    id: "access-003",
    userId: "user-002",
    applicationId: "app-003",
    role: "operator",
    functions: [
      createFunctionAccess("gps", { view: true, edit: true }),
      createFunctionAccess("itineraries", { view: true }),
      createFunctionAccess("branches", { view: true }),
    ],
    scope: {
      type: "sucursal",
      sucursalIds: ["sucursal-company-003-001"],
    },
  }),
  createAccess({
    id: "access-004",
    userId: "user-003",
    applicationId: "app-001",
    role: "supervisor",
    functions: [
      createFunctionAccess("gps", { view: true }),
      createFunctionAccess("geofences", { view: true, edit: true }),
      createFunctionAccess("branches", { view: true }),
      createFunctionAccess("reports", { view: true }),
    ],
    scope: {
      type: "sucursal",
      sucursalIds: ["sucursal-company-001-002"],
    },
  }),
  createAccess({
    id: "access-005",
    userId: "user-004",
    applicationId: "app-001",
    role: "viewer",
    status: "pending",
    functions: [createFunctionAccess("gps", { view: true })],
    scope: {
      type: "selected-assets",
      assetIds: ["asset-001", "asset-002"],
    },
  }),
  createAccess({
    id: "access-006",
    userId: "user-005",
    applicationId: "app-004",
    role: "technician",
    functions: [
      createFunctionAccess("gps", { view: true }),
      createFunctionAccess("branches", { view: true }),
    ],
    scope: {
      type: "all-assets",
    },
  }),
]

export const mockDatabaseSeed = {
  companies: mockCompanies,
  applicationDefinitions: mockApplicationDefinitions,
  assets: mockAssets,
  users: mockUsers,
  accesses: mockUserAccesses,
  reportTypes: mockReportTypes,
  modules: mockSystemModules,
  moduleFunctions: mockModuleFunctions,
  permissions: mockPermissions,
  scopes: mockOperationalScopes,
  roles: mockRoles,
}
