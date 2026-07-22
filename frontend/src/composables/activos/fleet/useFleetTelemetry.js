import { computed, getCurrentInstance, onBeforeUnmount, shallowRef, triggerRef } from "vue"
import { parseNumberFromLabel } from "../../../utils/numberUtils.js"
import { endDevMeasure, startDevMeasure } from "../../../utils/performanceUtils.js"
import { formatTelemetryTime, getTelemetryTimestamp } from "../../../utils/telemetryUtils.js"
import {
  appendTelemetryReports,
  clearReportsForAsset,
  clearTelemetryHistory,
} from "./useTelemetryHistory.js"

const DEFAULT_MOCK_INTERVAL_MS = 1000
const DEFAULT_MOCK_BATCH_SIZE = 25
const APPLY_TELEMETRY_BATCH_MEASURE = "applyTelemetryBatch"

let mockTelemetryStreamLoader = null

const loadMockTelemetryStreamFactory = async () => {
  if (!mockTelemetryStreamLoader) {
    mockTelemetryStreamLoader = import("../../../data/mockTelemetryStream.js").then((module) => {
      return module.createMockTelemetryStream
    })
  }

  return mockTelemetryStreamLoader
}

const LIVE_TELEMETRY_FIELDS = [
  "lat",
  "lng",
  "latitude",
  "longitude",
  "lon",
  "estado",
  "status",
  "speed",
  "velocidad",
  "velocidad_kmh",
  "timestamp",
  "lastTelemetryAt",
  "lastReport",
  "lastReportAt",
  "reportedAt",
  "updatedAt",
  "updated_at",
  "datosUlt",
  "direccion",
  "address",
  "odometro",
  "odometer",
  "horometroDiario",
  "horometroTotal",
  "engineHours",
  "engineHoursDaily",
  "combustible",
  "fuelPercent",
  "combustibleNivel",
  "gpsSignal",
  "gpsSignalLabel",
  "gpsSatellites",
  "satellites",
  "satelites",
  "gpsFix",
  "canStatus",
  "canSummary",
  "canRpm",
  "canEngineTemp",
  "canBatteryVoltage",
  "canEngineLoad",
  "canThrottle",
  "canFuelRate",
  "canFuelUsed",
  "canOilPressure",
  "canAdBlueLevel",
  "canDtcCount",
  "ignition",
  "ignicion",
  "contacto",
  "digitalInput1",
  "digitalInput2",
  "input1",
  "input2",
  "di1",
  "di2",
]

const normalizeId = (value) => {
  return String(value ?? "").trim()
}

const getActivoIdentityValues = (source = {}) => {
  const nestedActivo = source.activo || {}

  return Array.from(
    new Set(
      [
        source.id,
        source.assetId,
        source.activoId,
        source.deviceId,
        source.device_id,
        source.imei,
        source.patente,
        source.patent,
        nestedActivo.id,
        nestedActivo.assetId,
        nestedActivo.activoId,
        nestedActivo.deviceId,
        nestedActivo.device_id,
        nestedActivo.imei,
        nestedActivo.patente,
        nestedActivo.patent,
      ]
        .map(normalizeId)
        .filter(Boolean),
    ),
  )
}

const isValidNumber = (value) => {
  return Number.isFinite(Number(value))
}

const normalizeCoordinate = (value, fallback = null) => {
  const numberValue = Number(value)

  if (!Number.isFinite(numberValue)) return fallback

  return numberValue
}

const formatSpeedLabel = (value) => {
  const numberValue = parseNumberFromLabel(value, null)

  if (!isValidNumber(numberValue)) return "-"

  return `${Number(numberValue).toFixed(1)} km/h`
}

const normalizeTelemetryBoolean = (value, fallback = null) => {
  if (value === null || value === undefined || value === "") return fallback
  if (typeof value === "boolean") return value

  const numberValue = Number(value)

  if (Number.isFinite(numberValue)) return numberValue > 0

  const normalizedValue = String(value)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  if (
    ["true", "on", "si", "yes", "active", "activo", "activa", "encendido", "encendida"].includes(
      normalizedValue,
    )
  ) {
    return true
  }

  if (
    ["false", "off", "no", "inactive", "inactivo", "inactiva", "apagado", "apagada"].includes(
      normalizedValue,
    )
  ) {
    return false
  }

  return fallback
}

const removeTelemetryReportsFromActivo = (activo = {}) => {
  const cleanActivo = { ...activo }

  delete cleanActivo.telemetryReports

  return cleanActivo
}

const getUniqueSnapshotById = (snapshot = []) => {
  const uniqueSnapshot = []
  const seenIds = new Set()

  snapshot.forEach((activo) => {
    const id = normalizeId(activo?.id)

    if (!id || seenIds.has(id)) return

    seenIds.add(id)
    uniqueSnapshot.push(activo)
  })

  return uniqueSnapshot
}

const hasLiveTelemetryState = (activo = {}) => {
  return Boolean(
    activo.lastTelemetryAt || activo.timestamp || activo.lastReport || activo.reportedAt,
  )
}

const mergeSnapshotIntoLiveActivo = ({ snapshotActivo = {}, currentActivo = null }) => {
  const cleanSnapshotActivo = removeTelemetryReportsFromActivo(snapshotActivo)

  if (!currentActivo) return cleanSnapshotActivo

  const nextActivo = {
    ...currentActivo,
    ...cleanSnapshotActivo,
  }

  if (!hasLiveTelemetryState(currentActivo)) return nextActivo

  LIVE_TELEMETRY_FIELDS.forEach((field) => {
    if (currentActivo[field] !== undefined && currentActivo[field] !== null) {
      nextActivo[field] = currentActivo[field]
    }
  })

  return nextActivo
}

const appendActivoTelemetryReports = (activo = {}) => {
  const id = normalizeId(activo?.id)
  const telemetryReports = Array.isArray(activo?.telemetryReports) ? activo.telemetryReports : []

  if (!id || !telemetryReports.length) return

  appendTelemetryReports(
    telemetryReports.map((report) => ({
      ...report,
      id,
      assetId: id,
      activo,
      isLiveTelemetry: report.isLiveTelemetry ?? false,
      isCurrentLocation: report.isCurrentLocation ?? false,
    })),
  )
}

const appendSnapshotTelemetryReports = (snapshot = []) => {
  snapshot.forEach((activo) => {
    appendActivoTelemetryReports(activo)
  })
}

const normalizeTelemetryUpdate = (update = {}, resolvedId = "") => {
  const id = normalizeId(resolvedId || update.id || update.assetId || update.activoId)

  if (!id) return null

  const timestamp = getTelemetryTimestamp(update)
  const speedValue = parseNumberFromLabel(
    update.speed ?? update.velocidad_kmh ?? update.velocidad ?? 0,
    null,
  )
  const ignitionValue = normalizeTelemetryBoolean(
    update.ignition ?? update.ignicion ?? update.contacto,
  )

  return {
    ...update,

    id,

    lat: normalizeCoordinate(update.lat ?? update.latitude),
    lng: normalizeCoordinate(update.lng ?? update.lon ?? update.longitude),

    estado: update.estado || update.status || null,

    speed: speedValue ?? 0,
    velocidad: update.velocidad || formatSpeedLabel(speedValue ?? 0),
    velocidad_kmh: speedValue ?? 0,

    timestamp,
    lastReport: timestamp,
    lastReportAt: timestamp,
    reportedAt: timestamp,
    updatedAt: timestamp,
    updated_at: timestamp,

    datosUlt: update.datosUlt || formatTelemetryTime(timestamp),

    direccion: update.direccion || update.address || null,
    address: update.address || update.direccion || null,

    odometro: update.odometro ?? update.odometer ?? null,
    odometer: update.odometer ?? update.odometro ?? null,

    horometroDiario: update.horometroDiario ?? update.engineHoursDaily ?? null,
    horometroTotal: update.horometroTotal ?? update.engineHours ?? null,
    engineHours: update.engineHours ?? update.horometroTotal ?? null,
    engineHoursDaily: update.engineHoursDaily ?? update.horometroDiario ?? null,

    combustible: update.combustible ?? null,
    fuelPercent: update.fuelPercent ?? update.combustibleNivel ?? null,
    combustibleNivel: update.combustibleNivel ?? update.fuelPercent ?? null,

    gpsSignal: update.gpsSignal ?? null,
    gpsSignalLabel: update.gpsSignalLabel ?? null,
    gpsSatellites: update.gpsSatellites ?? update.satellites ?? update.satelites ?? null,
    satellites: update.satellites ?? update.gpsSatellites ?? update.satelites ?? null,
    gpsFix: update.gpsFix ?? null,

    canStatus: update.canStatus ?? null,
    canSummary: update.canSummary ?? null,
    canRpm: update.canRpm ?? update.rpm ?? null,
    canEngineTemp: update.canEngineTemp ?? update.temperaturaMotor ?? null,
    canBatteryVoltage:
      update.canBatteryVoltage ?? update.batteryVoltage ?? update.voltajeBateria ?? null,
    canEngineLoad: update.canEngineLoad ?? update.engineLoad ?? null,
    canThrottle: update.canThrottle ?? update.throttle ?? null,
    canFuelRate: update.canFuelRate ?? update.fuelRate ?? null,
    canFuelUsed: update.canFuelUsed ?? update.fuelUsed ?? null,
    canOilPressure: update.canOilPressure ?? update.oilPressure ?? null,
    canAdBlueLevel: update.canAdBlueLevel ?? update.adBlueLevel ?? null,
    canDtcCount: update.canDtcCount ?? null,

    ignition: ignitionValue,
    ignicion: ignitionValue,
    contacto: ignitionValue,
    digitalInput1: update.digitalInput1 ?? update.input1 ?? update.di1 ?? null,
    digitalInput2: update.digitalInput2 ?? update.input2 ?? update.di2 ?? null,
    input1: update.input1 ?? update.digitalInput1 ?? update.di1 ?? null,
    input2: update.input2 ?? update.digitalInput2 ?? update.di2 ?? null,
  }
}

const mergeTelemetryIntoActivo = (activo = {}, update = {}) => {
  const timestamp = getTelemetryTimestamp(update)

  const speedValue = parseNumberFromLabel(
    update.speed ??
      update.velocidad_kmh ??
      update.velocidad ??
      activo.speed ??
      activo.velocidad ??
      0,
    null,
  )

  const hasSpeed = isValidNumber(speedValue)
  const ignitionValue = normalizeTelemetryBoolean(
    update.ignition ?? update.ignicion ?? update.contacto,
    normalizeTelemetryBoolean(activo.ignition ?? activo.ignicion ?? activo.contacto),
  )

  return removeTelemetryReportsFromActivo({
    ...activo,
    ...update,

    lat: update.lat ?? activo.lat,
    lng: update.lng ?? activo.lng,

    estado: update.estado || activo.estado,

    speed: hasSpeed ? speedValue : activo.speed,
    velocidad: hasSpeed ? formatSpeedLabel(speedValue) : activo.velocidad,
    velocidad_kmh: hasSpeed ? speedValue : activo.velocidad_kmh,

    lastTelemetryAt: timestamp,
    timestamp,
    lastReport: timestamp,
    lastReportAt: timestamp,
    reportedAt: timestamp,
    updatedAt: timestamp,
    updated_at: timestamp,

    datosUlt: update.datosUlt || formatTelemetryTime(timestamp),

    direccion: update.direccion || update.address || activo.direccion,
    address: update.address || update.direccion || activo.address || activo.direccion,

    odometro: update.odometro ?? update.odometer ?? activo.odometro,
    odometer: update.odometer ?? update.odometro ?? activo.odometer,

    horometroDiario: update.horometroDiario ?? update.engineHoursDaily ?? activo.horometroDiario,
    horometroTotal: update.horometroTotal ?? update.engineHours ?? activo.horometroTotal,
    engineHours: update.engineHours ?? update.horometroTotal ?? activo.engineHours,
    engineHoursDaily: update.engineHoursDaily ?? update.horometroDiario ?? activo.engineHoursDaily,

    combustible: update.combustible ?? activo.combustible,
    fuelPercent: update.fuelPercent ?? update.combustibleNivel ?? activo.fuelPercent,
    combustibleNivel: update.combustibleNivel ?? update.fuelPercent ?? activo.combustibleNivel,

    gpsSignal: update.gpsSignal ?? activo.gpsSignal,
    gpsSignalLabel: update.gpsSignalLabel ?? activo.gpsSignalLabel,
    gpsSatellites:
      update.gpsSatellites ??
      update.satellites ??
      update.satelites ??
      activo.gpsSatellites ??
      activo.satellites ??
      activo.satelites,
    satellites:
      update.satellites ??
      update.gpsSatellites ??
      update.satelites ??
      activo.satellites ??
      activo.gpsSatellites ??
      activo.satelites,
    gpsFix: update.gpsFix ?? activo.gpsFix,

    canStatus: update.canStatus ?? activo.canStatus,
    canSummary: update.canSummary ?? activo.canSummary,
    canRpm: update.canRpm ?? activo.canRpm,
    canEngineTemp: update.canEngineTemp ?? activo.canEngineTemp,
    canBatteryVoltage: update.canBatteryVoltage ?? activo.canBatteryVoltage,
    canEngineLoad: update.canEngineLoad ?? activo.canEngineLoad,
    canThrottle: update.canThrottle ?? activo.canThrottle,
    canFuelRate: update.canFuelRate ?? activo.canFuelRate,
    canFuelUsed: update.canFuelUsed ?? activo.canFuelUsed,
    canOilPressure: update.canOilPressure ?? activo.canOilPressure,
    canAdBlueLevel: update.canAdBlueLevel ?? activo.canAdBlueLevel,
    canDtcCount: update.canDtcCount ?? activo.canDtcCount,

    ignition: ignitionValue,
    ignicion: ignitionValue,
    contacto: ignitionValue,
    digitalInput1: update.digitalInput1 ?? update.input1 ?? update.di1 ?? activo.digitalInput1,
    digitalInput2: update.digitalInput2 ?? update.input2 ?? update.di2 ?? activo.digitalInput2,
    input1: update.input1 ?? update.digitalInput1 ?? update.di1 ?? activo.input1,
    input2: update.input2 ?? update.digitalInput2 ?? update.di2 ?? activo.input2,
  })
}

export function useFleetTelemetry(initialSnapshot = [], options = {}) {
  const activos = shallowRef([])
  const activosById = shallowRef(new Map())
  const assetOrderIds = shallowRef([])

  const indexById = new Map()

  let mockTelemetryStream = null

  const activeCount = computed(() => {
    return assetOrderIds.value.length
  })

  const rebuildIndexes = (snapshot = []) => {
    indexById.clear()

    const nextActivosById = new Map()
    const nextAssetOrderIds = []

    snapshot.forEach((activo, index) => {
      const id = normalizeId(activo?.id)

      if (!id) return

      indexById.set(id, index)
      nextActivosById.set(id, activo)
      nextAssetOrderIds.push(id)
    })

    snapshot.forEach((activo, index) => {
      getActivoIdentityValues(activo).forEach((identity) => {
        if (!indexById.has(identity)) {
          indexById.set(identity, index)
        }
      })
    })

    activosById.value = nextActivosById
    assetOrderIds.value = nextAssetOrderIds
  }

  const commitFleetSnapshot = (snapshot = []) => {
    activos.value = snapshot
    rebuildIndexes(snapshot)

    if (mockTelemetryStream) {
      mockTelemetryStream.updateSnapshot(snapshot)
    }
  }

  const replaceFleetSnapshot = (snapshot = []) => {
    const sourceSnapshot = getUniqueSnapshotById(Array.isArray(snapshot) ? snapshot : [])
    const currentActivosById = activosById.value
    const previousIds = new Set(assetOrderIds.value)
    const nextIds = new Set()
    const newSnapshotActivos = []

    const nextSnapshot = sourceSnapshot.map((activo) => {
      const id = normalizeId(activo?.id)
      const currentActivo = currentActivosById.get(id)

      if (id) {
        nextIds.add(id)

        if (!currentActivo) {
          newSnapshotActivos.push(activo)
        }
      }

      return mergeSnapshotIntoLiveActivo({
        snapshotActivo: activo,
        currentActivo,
      })
    })

    if (!previousIds.size) {
      clearTelemetryHistory()
      appendSnapshotTelemetryReports(sourceSnapshot)
    } else {
      previousIds.forEach((id) => {
        if (!nextIds.has(id)) {
          clearReportsForAsset(id)
        }
      })

      appendSnapshotTelemetryReports(newSnapshotActivos)
    }

    commitFleetSnapshot(nextSnapshot)
  }

  const upsertActivo = (activo) => {
    const id = normalizeId(activo?.id)

    if (!id) return

    appendActivoTelemetryReports(activo)

    const cleanActivo = removeTelemetryReportsFromActivo(activo)
    const existingIndex = indexById.get(id)

    if (existingIndex === undefined) {
      commitFleetSnapshot([...activos.value, cleanActivo])

      return
    }

    const currentActivo = activos.value[existingIndex]

    const nextActivo = {
      ...currentActivo,
      ...cleanActivo,
      id: currentActivo.id,
    }

    const nextSnapshot = [...activos.value]

    nextSnapshot[existingIndex] = nextActivo
    commitFleetSnapshot(nextSnapshot)
  }

  const removeActivo = (id) => {
    const normalizedId = normalizeId(id)
    const existingIndex = indexById.get(normalizedId)

    if (existingIndex === undefined) return

    const nextSnapshot = activos.value.filter((_, index) => {
      return index !== existingIndex
    })

    clearReportsForAsset(normalizedId)

    commitFleetSnapshot(nextSnapshot)
  }

  const applyTelemetryBatch = (batch = []) => {
    const measure = startDevMeasure(APPLY_TELEMETRY_BATCH_MEASURE)

    try {
      if (!Array.isArray(batch) || !batch.length) return []

      const updatesById = new Map()

      batch.forEach((rawUpdate) => {
        const resolvedIndex = getActivoIdentityValues(rawUpdate)
          .map((identity) => indexById.get(identity))
          .find((index) => index !== undefined)
        const resolvedId =
          resolvedIndex === undefined ? "" : normalizeId(activos.value[resolvedIndex]?.id)
        const update = normalizeTelemetryUpdate(rawUpdate, resolvedId)

        if (!update) return

        updatesById.set(update.id, update)
      })

      if (!updatesById.size) return []

      const appliedUpdates = []

      updatesById.forEach((update) => {
        const existingIndex = indexById.get(update.id)
        const currentActivo = existingIndex === undefined ? null : activos.value[existingIndex]

        if (!currentActivo) return

        const nextActivo = mergeTelemetryIntoActivo(currentActivo, update)

        activos.value[existingIndex] = nextActivo
        activosById.value.set(update.id, nextActivo)

        appliedUpdates.push({
          ...update,
          activo: nextActivo,
        })
      })

      if (appliedUpdates.length) {
        appendTelemetryReports(appliedUpdates)
        triggerRef(activos)
        triggerRef(activosById)
      }

      return appliedUpdates
    } finally {
      endDevMeasure(measure)
    }
  }

  const getActivoById = (id) => {
    const normalizedId = normalizeId(id)
    const directActivo = activosById.value.get(normalizedId)

    if (directActivo) return directActivo

    const activoIndex = indexById.get(normalizedId)

    return activoIndex === undefined ? null : activos.value[activoIndex] || null
  }

  const stopMockTelemetry = () => {
    mockTelemetryRunId += 1

    if (!mockTelemetryStream) return

    mockTelemetryStream.stop()
    mockTelemetryStream = null
  }

  let mockTelemetryRunId = 0

  const startMockTelemetry = async ({
    intervalMs = options.intervalMs || DEFAULT_MOCK_INTERVAL_MS,
    batchSize = options.batchSize || DEFAULT_MOCK_BATCH_SIZE,
    getPriorityIds = null,
    onBatch,
  } = {}) => {
    stopMockTelemetry()

    const runId = mockTelemetryRunId
    const createMockTelemetryStream = await loadMockTelemetryStreamFactory()

    if (runId !== mockTelemetryRunId) return null

    mockTelemetryStream = createMockTelemetryStream({
      activos: activos.value,
      intervalMs,
      batchSize,
      getPriorityIds,
      onBatch: (batch) => {
        const appliedUpdates = applyTelemetryBatch(batch)

        if (typeof onBatch === "function") {
          onBatch(appliedUpdates)
        }
      },
    })

    mockTelemetryStream.start()

    return mockTelemetryStream
  }

  replaceFleetSnapshot(initialSnapshot)

  if (getCurrentInstance()) {
    onBeforeUnmount(() => {
      stopMockTelemetry()
    })
  }

  return {
    activos,
    activosById,
    assetOrderIds,
    activeCount,

    applyTelemetryBatch,
    replaceFleetSnapshot,
    upsertActivo,
    removeActivo,
    getActivoById,

    startMockTelemetry,
    stopMockTelemetry,
  }
}
