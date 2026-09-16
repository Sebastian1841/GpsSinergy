import assert from "node:assert/strict"
import test from "node:test"

import {
  buildAlarmSummary,
  filterAlarmRows,
  getAuthorizedAlarmRows,
  getAlarmTriggerReason,
  sortAlarmRows,
} from "./alarmUtils.js"

const companies = [
  {
    id: "company-1",
    name: "Empresa Uno",
  },
  {
    id: "company-2",
    name: "Empresa Dos",
  },
]

const assets = [
  {
    id: "asset-1",
    companyId: "company-1",
    patente: "AAA-001",
    vehiculo: "Camion 1",
  },
  {
    id: "asset-2",
    companyId: "company-1",
    patente: "BBB-002",
    vehiculo: "Camion 2",
  },
  {
    id: "asset-3",
    companyId: "company-2",
    patente: "CCC-003",
    vehiculo: "Camion 3",
  },
]

const alarms = [
  {
    id: "alarm-1",
    companyId: "company-1",
    assetId: "asset-1",
    type: "speeding",
    severity: "critical",
    status: "open",
    title: "Exceso de velocidad",
    description: "Sobre limite",
    createdAt: "2026-09-09T10:00:00-04:00",
    metadata: {
      speed: "96 km/h",
      limit: "80 km/h",
    },
  },
  {
    id: "alarm-2",
    companyId: "company-1",
    assetId: "asset-2",
    type: "fuel",
    severity: "medium",
    status: "open",
    title: "Combustible",
    description: "Baja brusca",
    createdAt: "2026-09-08T10:00:00-04:00",
  },
  {
    id: "alarm-3",
    companyId: "company-2",
    assetId: "asset-3",
    type: "no_signal",
    severity: "high",
    status: "resolved",
    title: "Sin senal",
    description: "Equipo sin reporte",
    createdAt: "2026-09-07T10:00:00-04:00",
  },
]

test("getAuthorizedAlarmRows only returns alarms for visible assets", () => {
  const rows = getAuthorizedAlarmRows({
    alarms,
    visibleAssets: [assets[0]],
    companies,
    companyId: "company-1",
  })

  assert.deepEqual(
    rows.map((row) => row.id),
    ["alarm-1"],
  )
})

test("getAuthorizedAlarmRows applies company scope after visible assets", () => {
  const rows = getAuthorizedAlarmRows({
    alarms,
    visibleAssets: assets,
    companies,
    companyId: "company-2",
  })

  assert.deepEqual(
    rows.map((row) => row.id),
    ["alarm-3"],
  )
})

test("filterAlarmRows supports status, severity, type, asset and date filters", () => {
  const rows = getAuthorizedAlarmRows({
    alarms,
    visibleAssets: assets,
    companies,
  })
  const filteredRows = filterAlarmRows({
    rows,
    selectedStatus: "open",
    selectedSeverity: "critical",
    selectedType: "speeding",
    selectedAssetId: "asset-1",
    dateFrom: "2026-09-09",
    dateTo: "2026-09-09",
  })

  assert.deepEqual(
    filteredRows.map((row) => row.id),
    ["alarm-1"],
  )
})

test("filterAlarmRows treats active status as every non resolved alarm", () => {
  const rows = getAuthorizedAlarmRows({
    alarms,
    visibleAssets: assets,
    companies,
  })
  const filteredRows = filterAlarmRows({
    rows,
    selectedStatus: "active",
  })

  assert.deepEqual(
    filteredRows.map((row) => row.id),
    ["alarm-1", "alarm-2"],
  )
})

test("sortAlarmRows prioritizes open status and severity before date", () => {
  const rows = getAuthorizedAlarmRows({
    alarms,
    visibleAssets: assets,
    companies,
  })

  assert.deepEqual(
    sortAlarmRows(rows).map((row) => row.id),
    ["alarm-1", "alarm-2", "alarm-3"],
  )
})

test("buildAlarmSummary counts open, critical and resolved alarms", () => {
  const rows = getAuthorizedAlarmRows({
    alarms,
    visibleAssets: assets,
    companies,
  })

  assert.deepEqual(buildAlarmSummary(rows), {
    total: 3,
    active: 2,
    open: 2,
    critical: 1,
    resolved: 1,
  })
})

test("getAuthorizedAlarmRows normalizes legacy intermediate alarms as open", () => {
  const rows = getAuthorizedAlarmRows({
    alarms: [
      {
        ...alarms[1],
        status: "reviewed",
      },
    ],
    visibleAssets: assets,
    companies,
  })

  assert.equal(rows[0].status, "open")
  assert.equal(rows[0].statusLabel, "Activa")
})

test("getAlarmTriggerReason explains why an alarm was triggered", () => {
  assert.equal(
    getAlarmTriggerReason(alarms[0]),
    "Velocidad registrada 96 km/h sobre limite 80 km/h.",
  )
})
