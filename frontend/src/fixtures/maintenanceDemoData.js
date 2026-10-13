// Temporary volume data for validating the maintenance UI with larger datasets.
// Set this flag to false to restore the module to its normal data source.
export const ENABLE_MAINTENANCE_DEMO_DATA = true
export const ENABLE_MAINTENANCE_HISTORY_DEMO_DATA = true
export const MAINTENANCE_DEMO_BASE_ORDER_LIMIT = 6

export const createMaintenanceHistoryDemoOrders = (vehicles) =>
  vehicles.slice(0, 2).flatMap((vehicle, vehicleIndex) =>
    Array.from({ length: 2 }, (_, index) => {
      const job = [
        "Cambio de aceite y filtros",
        "Revision de frenos",
        "Permiso de circulacion",
        "Revision de suspension",
        "Filtro de combustible",
        "Revision tecnica",
        "Alineacion y balanceo",
        "Inspeccion de luces",
      ][index]
      const closedAt = new Date(Date.UTC(2026, 9, 6 - index * 18, 16, 30)).toISOString()
      const reading = Math.max(Number(vehicle.odometer || 0) - (index + 1) * 1800, 0)
      return {
        id: `OT-DEMO-H-${vehicleIndex + 1}-${index + 1}`,
        maintenanceDemo: true,
        vehicleId: vehicle.id,
        companyId: vehicle.companyId,
        plate: vehicle.plate,
        job,
        type: job,
        status: "finished",
        priority: ["Media", "Alta", "Baja"][index % 3],
        createdAt: closedAt,
        closedAt,
        scheduledDate: closedAt.slice(0, 10),
        closingReading: `${reading.toLocaleString("es-CL")} km`,
        owner: ["Juan Vivar", "Luis Araya", "Mario Torres"][index % 3],
        closedBy: ["Juan Vivar", "Luis Araya", "Mario Torres"][index % 3],
        workshop: vehicle.workshop,
        description: `Ejecucion de demostracion: ${job}.`,
        workPerformed: `${job}; inspeccion y prueba final realizadas.`,
        tasks: [job, "Inspeccion final"],
        demoLaborCost: 45000 + index * 12000,
        demoPartsCost: index % 3 === 2 ? 0 : 65000 + index * 17000,
        demoOtherCost: 8000 + index * 2500,
        estimatedCost: `$ ${(150000 + index * 30000).toLocaleString("es-CL")}`,
      }
    }),
  )

export const MAINTENANCE_DEMO_TYPES = [
  "Rotacion y cambio de neumaticos",
  "Revision de suspension",
  "Cambio de bateria",
  "Sistema electrico",
  "Sistema de refrigeracion",
  "Revision de transmision",
  "Alineacion y balanceo",
  "Lubricacion general",
  "Inspeccion de luces",
  "Revision de elementos de seguridad",
]

export const MAINTENANCE_DEMO_TYPE_READING_SOURCES = {
  "Alineacion y balanceo": "Odometro",
  "Cambio de bateria": "Fecha/Hora",
  "Inspeccion de luces": "Fecha/Hora",
  "Lubricacion general": "Horometro",
  "Revision de elementos de seguridad": "Fecha/Hora",
  "Revision de suspension": "Odometro",
  "Revision de transmision": "Horometro",
  "Rotacion y cambio de neumaticos": "Odometro",
  "Sistema de refrigeracion": "Horometro",
  "Sistema electrico": "Fecha/Hora",
}

const plates = [
  "KJHG33",
  "PLRT55",
  "BXDF21",
  "HTKL88",
  "LPQS47",
  "TRNV62",
  "GHDW19",
  "CVBN74",
  "PXLM36",
  "DFRT90",
  "WQAZ58",
  "NMJK24",
]

const vehicleNames = [
  "Camion Volvo FMX 440",
  "Camion Scania P 410",
  "Camion Mercedes Actros",
  "Camion Iveco Tector",
  "Camion MAN TGS",
  "Camion Volvo FH 500",
]

export const createMaintenanceDemoAssets = (companyId, amount = 36) =>
  Array.from({ length: amount }, (_, index) => ({
    id: `maintenance-demo-${index + 1}`,
    companyId: companyId || "maintenance-demo-company",
    maintenanceDemo: true,
    odometro: 48500 + index * 5370,
    patente:
      index < plates.length
        ? plates[index]
        : `DM${String(index + 1).padStart(2, "0")}${String(20 + (index % 70)).padStart(2, "0")}`,
    vehiculo: vehicleNames[index % vehicleNames.length],
  }))
