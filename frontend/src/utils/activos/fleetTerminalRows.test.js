import assert from "node:assert/strict"
import test from "node:test"

import { buildTerminalRow } from "./fleetTerminalRows.js"

test("terminal telemetry rows expose the same realtime GPS and CAN variables", () => {
  const row = buildTerminalRow({
    id: "pulse-1",
    type: "report",
    source: "RX Pulse",
    time: "12:00:00",
    message: "PULSE moving · 42 km/h · -33.450000, -70.660000",
    payload: {
      estado: "moving",
      speed: 42,
      lat: -33.45,
      lng: -70.66,
      combustibleNivel: 54,
      satellites: 11,
      gpsSignal: 88,
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
      ignition: true,
      digitalInput1: 1,
      digitalInput2: 0,
    },
  })
  const details = Object.fromEntries(
    row.telemetryDetails.map((detail) => [detail.key, detail.value]),
  )

  assert.equal(row.isTelemetry, true)
  assert.equal(details.combustible, "54%")
  assert.equal(details.ignition, "true")
  assert.equal(details.gpsSatellites, "11 sat")
  assert.equal(details.gpsSignal, "88%")
  assert.equal(details.odometro, "12.345,6 km")
  assert.equal(details.horometroTotal, "840,5 h")
  assert.equal(details.horometroDiario, "6,3 h")
  assert.equal(details.canRpm, "2.150 rpm")
  assert.equal(details.canEngineTemp, "91 C")
  assert.equal(details.canBatteryVoltage, "13,8 V")
  assert.equal(details.canEngineLoad, "63%")
  assert.equal(details.canThrottle, "22%")
  assert.equal(details.canFuelRate, "7,4 L/h")
  assert.equal(details.canFuelUsed, "18,2 L")
  assert.equal(details.canOilPressure, "42 psi")
  assert.equal(details.canAdBlueLevel, "76%")
  assert.equal(details.digitalInput1, "Activa")
  assert.equal(details.digitalInput2, "Inactiva")
})
