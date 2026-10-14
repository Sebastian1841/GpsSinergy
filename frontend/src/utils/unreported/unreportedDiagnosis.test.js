import test from "node:test"
import assert from "node:assert/strict"
import { parseUnreportedPower, describeUnreportedDiagnosis } from "./unreportedDiagnosis.js"
const baseline = {
  mode: "active",
  lastReportAt: "2026-10-13T12:00:00Z",
  sensorReportedAt: "2026-10-13T12:00:00Z",
  externalVoltage: 0,
  internalVoltage: 3.41,
}
test("legacy readings are parsed without mistaking missing values for zero", () => {
  assert.deepEqual(parseUnreportedPower("Alim. 0,0 V · Bat. 3,41 V de 4,15 V habituales"), {
    externalVoltage: 0,
    internalVoltage: 3.41,
  })
  assert.deepEqual(parseUnreportedPower("Sin datos"), {
    externalVoltage: null,
    internalVoltage: null,
  })
})
test("zero external voltage is stated as an observation, not a confirmed cable or battery fault", () => {
  const value = describeUnreportedDiagnosis(baseline)
  assert.equal(value.reason, "Alimentacion desconectada")
  assert.match(value.evidence, /Externa: 0 V/)
  assert.match(value.evidence, /3,41 V/)
  assert.equal("possibleCause" in value, false)
})
test("positive voltage does not imply a confirmed SIM, network or GPS coverage problem", () => {
  const value = describeUnreportedDiagnosis({ ...baseline, externalVoltage: 28.13 })
  assert.equal(value.reason, "Sin comunicacion")
  assert.equal(value.evidence, "Sin datos de conexion · Causa no determinada")
  assert.doesNotMatch(value.evidence, /Externa|Interna| V/)
  assert.equal("possibleCause" in value, false)
})
test("missing and invalid readings never produce a confirmed power-cut diagnosis", () => {
  for (const externalVoltage of [null, undefined, NaN, -1])
    assert.match(
      describeUnreportedDiagnosis({ ...baseline, externalVoltage }).reason,
      /Sin comunicacion/,
    )
})
test("a newer report without new electrical readings never reuses old zero voltage as the current cause", () => {
  const value = describeUnreportedDiagnosis({ ...baseline, lastReportAt: "2026-10-13T13:00:00Z" })
  assert.equal(value.reason, "Sin comunicacion")
  assert.equal(value.evidence, "Sin datos de conexion · Causa no determinada")
})
test("never reported equipment is distinguished from recovered and manually retired equipment", () => {
  assert.match(describeUnreportedDiagnosis({ ...baseline, lastReportAt: null }).reason, /Nunca/)
  assert.equal(
    describeUnreportedDiagnosis({ ...baseline, mode: "recovered" }).reason,
    "Reporte retomado",
  )
  const retired = describeUnreportedDiagnosis({
    ...baseline,
    mode: "inactive",
    operationReason: "Almacenado",
  })
  assert.equal(retired.evidence, "Almacenado")
  assert.equal(retired.reason, "Fuera de operacion")
})
test("previous external voltage is displayed only when supplied, never copied from internal battery reference", () => {
  const value = describeUnreportedDiagnosis({ ...baseline, previousExternalVoltage: 12.82 })
  assert.match(value.evidence, /Externa: 12,82 V -> 0 V/)
  assert.doesNotMatch(describeUnreportedDiagnosis(baseline).evidence, /->/)
})
test("explicit SIM faults are reported individually and unknown codes do not become causes", () => {
  for (const [simStatus, reason] of [
    ["absent", "SIM ausente"],
    ["error", "Error de SIM"],
    ["pin_required", "SIM bloqueada (PIN)"],
  ]) {
    assert.equal(
      describeUnreportedDiagnosis({ ...baseline, externalVoltage: 12.82, simStatus }).reason,
      reason,
    )
  }
  for (const simStatus of [undefined, null, "toString", "unknown"]) {
    const value = describeUnreportedDiagnosis({ ...baseline, externalVoltage: 12.82, simStatus })
    assert.equal(value.reason, "Sin comunicacion")
    assert.match(value.evidence, /Causa no determinada/)
  }
})
test("an explicit mobile registration fault includes the received signal value", () => {
  const value = describeUnreportedDiagnosis({
    ...baseline,
    externalVoltage: 12.82,
    mobileRegistered: false,
    mobileSignalDbm: -109,
  })
  assert.equal(value.reason, "Sin registro en red movil")
  assert.match(value.evidence, /-109 dBm/)
  assert.doesNotMatch(value.evidence, /Externa|Interna| V/)
  for (const mobileRegistration of ["denied", "searching", "not_registered"])
    assert.equal(
      describeUnreportedDiagnosis({ ...baseline, externalVoltage: 12.82, mobileRegistration })
        .reason,
      "Sin registro en red movil",
    )
})
test("low signal alone does not diagnose a cellular outage", () => {
  const value = describeUnreportedDiagnosis({
    ...baseline,
    externalVoltage: 12.82,
    mobileSignalDbm: -120,
  })
  assert.equal(value.reason, "Sin comunicacion")
  assert.match(value.evidence, /Causa no determinada/)
  assert.match(value.evidence, /-120 dBm/)
})
test("missing GPS fix is a positioning observation, not the cause of missing packets", () => {
  const value = describeUnreportedDiagnosis({
    ...baseline,
    externalVoltage: 12.82,
    gpsFixValid: false,
    satellites: 0,
  })
  assert.equal(value.reason, "Sin comunicacion")
  assert.equal(value.evidence, "Sin datos de conexion · Causa no determinada")
  assert.match(value.evidence, /Causa no determinada/)
})
test("old or future modem and SIM readings cannot diagnose the latest missing report", () => {
  for (const sensorReportedAt of ["2026-10-13T11:00:00Z", "2026-10-13T13:00:00Z"]) {
    const value = describeUnreportedDiagnosis({
      ...baseline,
      externalVoltage: 12.82,
      simStatus: "error",
      mobileRegistered: false,
      sensorReportedAt,
    })
    assert.equal(value.reason, "Sin comunicacion")
    assert.match(value.evidence, /Causa no determinada/)
    assert.match(value.evidence, /Datos anteriores/)
    assert.doesNotMatch(value.evidence, /Externa|Interna| V/)
  }
})
test("communication evidence shows registered network and ready SIM without electrical readings", () => {
  const value = describeUnreportedDiagnosis({
    ...baseline,
    externalVoltage: 12.82,
    mobileRegistered: true,
    mobileSignalDbm: -85,
    simStatus: "ready",
  })
  assert.equal(value.reason, "Sin comunicacion")
  assert.match(value.evidence, /SIM: lista/)
  assert.match(value.evidence, /Red movil: registrada/)
  assert.match(value.evidence, /-85 dBm/)
  assert.doesNotMatch(value.evidence, /Externa|Interna| V/)
})
test("an equipment may still report without GPS fix and preserves explicit valid flags", () => {
  const value = describeUnreportedDiagnosis({
    ...baseline,
    externalVoltage: 12.82,
    mode: "reporting",
    gpsFix: "Sin fix",
    satellites: 0,
  })
  assert.equal(value.reason, "Reportando")
  assert.match(value.evidence, /GPS: sin posicion valida/)
  const valid = describeUnreportedDiagnosis({
    ...baseline,
    externalVoltage: 12.82,
    gpsFixValid: true,
    gpsFix: "Sin fix",
    mobileRegistered: true,
    mobileRegistration: "denied",
  })
  assert.equal(valid.reason, "Sin comunicacion")
  assert.doesNotMatch(valid.evidence, /sin posicion valida|registro rechazado/)
})
