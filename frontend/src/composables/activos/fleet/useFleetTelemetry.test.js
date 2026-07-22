import assert from "node:assert/strict"
import test from "node:test"
import { computed } from "vue"

import { buildItineraryResult } from "../../../data/mockItineraryData.js"
import { createMockTelemetryStream } from "../../../data/mockTelemetryStream.js"
import { getCellValue } from "../../../utils/activos/fleetTelemetryColumns.js"
import { itineraryTableColumns } from "../../../utils/activos/itineraryTableColumns.js"
import { useFleetTelemetry } from "./useFleetTelemetry.js"
import {
  appendTelemetryReports,
  clearTelemetryHistory,
  getReportsForAsset,
  TELEMETRY_HISTORY_MAX_REPORTS_PER_ASSET,
} from "./useTelemetryHistory.js"

test("telemetry batches resolve aliases, normalize coordinates and notify computed values", () => {
  clearTelemetryHistory()

  const telemetry = useFleetTelemetry([
    {
      id: "asset-1",
      deviceId: "device-1",
      patente: "TEST-01",
      lat: -33.45,
      lng: -70.66,
      speed: 10,
    },
  ])
  const observedSpeed = computed(() => telemetry.activos.value[0]?.speed)

  assert.equal(observedSpeed.value, 10)

  const appliedUpdates = telemetry.applyTelemetryBatch([
    {
      assetId: "device-1",
      latitude: -34.1,
      longitude: -71.2,
      speed: 42,
      satellites: 11,
      gpsSignal: 88,
      combustibleNivel: 54,
      odometer: 12345.6,
      engineHours: 840.5,
      engineHoursDaily: 6.25,
      rpm: 2150,
      temperaturaMotor: 91,
      batteryVoltage: 13.8,
      engineLoad: 63,
      throttle: 22,
      fuelRate: 7.4,
      fuelUsed: 18.2,
      oilPressure: 42,
      adBlueLevel: 76,
      contacto: 1,
      input1: 1,
      input2: 0,
      timestamp: "2026-06-24T12:00:00.000Z",
    },
  ])

  assert.equal(appliedUpdates.length, 1)
  assert.equal(appliedUpdates[0].id, "asset-1")
  assert.equal(observedSpeed.value, 42)
  assert.equal(telemetry.activos.value[0].lat, -34.1)
  assert.equal(telemetry.activos.value[0].lng, -71.2)
  assert.equal(telemetry.activos.value[0].gpsSatellites, 11)
  assert.equal(telemetry.activos.value[0].canRpm, 2150)
  assert.equal(telemetry.activos.value[0].canBatteryVoltage, 13.8)
  assert.equal(telemetry.activos.value[0].ignition, true)
  assert.equal(telemetry.activos.value[0].digitalInput1, 1)
  assert.equal(telemetry.activos.value[0].digitalInput2, 0)
  assert.equal(telemetry.getActivoById("TEST-01")?.id, "asset-1")

  const [historyPoint] = getReportsForAsset("asset-1")

  assert.equal(historyPoint.gpsSatellites, 11)
  assert.equal(historyPoint.gpsSignal, 88)
  assert.equal(historyPoint.fuelPercent, 54)
  assert.equal(historyPoint.odometer, 12345.6)
  assert.equal(historyPoint.engineHours, 840.5)
  assert.equal(historyPoint.engineHoursDaily, 6.25)
  assert.equal(historyPoint.canRpm, 2150)
  assert.equal(historyPoint.canEngineTemp, 91)
  assert.equal(historyPoint.canBatteryVoltage, 13.8)
  assert.equal(historyPoint.canEngineLoad, 63)
  assert.equal(historyPoint.canThrottle, 22)
  assert.equal(historyPoint.canFuelRate, 7.4)
  assert.equal(historyPoint.canFuelUsed, 18.2)
  assert.equal(historyPoint.canOilPressure, 42)
  assert.equal(historyPoint.canAdBlueLevel, 76)
  assert.equal(historyPoint.ignition, true)
  assert.equal(historyPoint.contacto, true)
  assert.equal(historyPoint.digitalInput1, 1)
  assert.equal(historyPoint.digitalInput2, 0)

  clearTelemetryHistory()
})

test("telemetry history preserves more than 500 reports without duplicating aliases", () => {
  clearTelemetryHistory()

  const reports = Array.from({ length: 650 }, (_, index) => ({
    id: "asset-1",
    assetId: "asset-1",
    deviceId: "device-1",
    patente: "TEST-01",
    lat: -33.45 + index * 0.00001,
    lng: -70.66,
    speed: 30,
    timestamp: new Date(Date.UTC(2026, 5, 24, 0, 0, index)).toISOString(),
  }))

  appendTelemetryReports(reports)

  assert.equal(getReportsForAsset("asset-1").length, 650)
  assert.equal(getReportsForAsset("device-1").length, 650)
  assert.equal(
    getReportsForAsset({
      id: "asset-1",
      deviceId: "device-1",
      patente: "TEST-01",
    }).length,
    650,
  )

  clearTelemetryHistory()
})

test("telemetry history trims oldest reports per asset after the bounded window", () => {
  clearTelemetryHistory()

  const extraReports = 25
  const reports = Array.from(
    { length: TELEMETRY_HISTORY_MAX_REPORTS_PER_ASSET + extraReports },
    (_, index) => ({
      id: "asset-1",
      assetId: "asset-1",
      deviceId: "device-1",
      patente: "TEST-01",
      lat: -33.45 + index * 0.00001,
      lng: -70.66,
      speed: 30,
      timestamp: new Date(Date.UTC(2026, 5, 24, 0, 0, index)).toISOString(),
    }),
  )

  appendTelemetryReports(reports)

  const history = getReportsForAsset("asset-1")

  assert.equal(history.length, TELEMETRY_HISTORY_MAX_REPORTS_PER_ASSET)
  assert.equal(history[0].timestamp, reports[extraReports].timestamp)
  assert.equal(history.at(-1).timestamp, reports.at(-1).timestamp)
  assert.equal(getReportsForAsset("device-1").length, TELEMETRY_HISTORY_MAX_REPORTS_PER_ASSET)

  clearTelemetryHistory()
})

test("mock telemetry stream always includes priority ids in the next batch", () => {
  const activos = Array.from({ length: 24 }, (_, index) => ({
    id: `asset-${index + 1}`,
    lat: -33.45 + index * 0.001,
    lng: -70.66,
    estado: "Movimiento",
  }))
  const stream = createMockTelemetryStream({
    activos,
    batchSize: 3,
    getPriorityIds: () => ["asset-19"],
  })

  for (let index = 0; index < 10; index += 1) {
    const batch = stream.generateBatch()

    assert.equal(batch.length, 3)
    assert.ok(
      batch.some((pulse) => pulse.id === "asset-19"),
      "expected priority asset to be included in every generated batch",
    )
  }
})

test("itinerary rows preserve and display the same realtime telemetry variables", () => {
  const telemetryPoint = {
    id: "report-1",
    assetId: "asset-1",
    timestamp: "2026-06-24T12:00:00.000Z",
    lat: -33.45,
    lng: -70.66,
    speed: 42,
    gpsSatellites: 11,
    gpsSignal: 88,
    fuelPercent: 54,
    odometer: 12345.6,
    engineHours: 840.5,
    engineHoursDaily: 6.25,
    canRpm: 2150,
    canEngineTemp: 91,
    canBatteryVoltage: 13.8,
    canEngineLoad: 63,
    canThrottle: 22,
    canFuelRate: 7.4,
    canFuelUsed: 18.2,
    canOilPressure: 42,
    canAdBlueLevel: 76,
    ignition: true,
    digitalInput1: 1,
    digitalInput2: 0,
  }
  const result = buildItineraryResult({
    asset: { id: "asset-1", patente: "TEST-01" },
    points: [telemetryPoint],
  })
  const [row] = result.rows
  const columnsByKey = new Map(itineraryTableColumns.map((column) => [column.key, column]))

  assert.equal(row.gpsSatellites, telemetryPoint.gpsSatellites)
  assert.equal(row.ignition, telemetryPoint.ignition)
  assert.equal(row.digitalInput1, telemetryPoint.digitalInput1)
  assert.equal(row.digitalInput2, telemetryPoint.digitalInput2)
  assert.equal(row.canRpm, telemetryPoint.canRpm)
  assert.equal(row.canFuelRate, telemetryPoint.canFuelRate)
  assert.equal(getCellValue(row, columnsByKey.get("gpsSatellites")), "11 sat")
  assert.equal(getCellValue(row, columnsByKey.get("ignition")), "true")
  assert.equal(getCellValue(row, columnsByKey.get("digitalInput1")), "Activa")
  assert.equal(getCellValue(row, columnsByKey.get("digitalInput2")), "Inactiva")
  assert.equal(getCellValue(row, columnsByKey.get("canRpm")), "2.150 rpm")
  assert.equal(getCellValue(row, columnsByKey.get("canFuelRate")), "7,4 L/h")
})
