import assert from "node:assert/strict"
import test from "node:test"

import {
  buildAssetReportRows,
  createReportColumns,
  REPORT_REALTIME_COLUMN_KEYS,
} from "../execution/assetReportExecutionUtils.js"
import { createAssetReportExcelBuffer, exportAssetReportPdf } from "../export/assetReportExportUtils.js"

test("asset report columns respect the selected template variables", () => {
  const reportColumns = createReportColumns({
    columns: ["patente", "vehiculo", "ultimoDato"],
  })
  const reportColumnKeys = reportColumns.map((column) => column.key)

  assert.deepEqual(reportColumnKeys, ["fecha", "patente", "vehiculo", "ultimoDato"])
  assert.equal(reportColumnKeys.includes("deviceId"), false)
  assert.equal(reportColumnKeys.includes("canRpm"), false)
  assert.equal(reportColumnKeys.includes("address"), false)
})

test("idle-time report columns keep the operational ralenti fields", () => {
  const reportColumns = createReportColumns({
    reportTypeId: "idle-time",
    eventRuleIds: ["idle"],
    columns: ["patente", "vehiculo", "conductor", "duracion", "ultimoDato"],
  })
  const reportColumnKeys = reportColumns.map((column) => column.key)

  assert.deepEqual(reportColumnKeys, ["fecha", "timestamp", "patente", "duracion"])
})

test("custom ralenti report columns use the same operational fields", () => {
  const reportColumns = createReportColumns({
    name: "Reporte de ralenti",
    eventRuleIds: ["idle"],
    columns: ["patente", "vehiculo", "conductor", "duracion", "ultimoDato"],
  })
  const reportColumnKeys = reportColumns.map((column) => column.key)

  assert.deepEqual(reportColumnKeys, ["fecha", "timestamp", "patente", "duracion"])
})

test("geofence reports use pass-through and dwell time columns", () => {
  const reportColumns = createReportColumns({
    reportTypeId: "geofences",
    eventRuleIds: ["geofence"],
    columns: ["patente", "vehiculo", "geocerca", "evento", "ultimoDato"],
  })
  const reportColumnKeys = reportColumns.map((column) => column.key)

  assert.deepEqual(reportColumnKeys, [
    "fecha",
    "timestamp",
    "patente",
    "vehiculo",
    "geocerca",
    "evento",
    "duracion",
  ])
})

test("route-history reports use configured trip columns even when idle is enabled", () => {
  const reportColumns = createReportColumns({
    reportTypeId: "route-history",
    eventRuleIds: ["movement", "stops", "idle"],
    columns: [
      "fecha",
      "patente",
      "vehiculo",
      "tripStart",
      "tripEnd",
      "tripDistanceKm",
      "tripEvents",
    ],
  })
  const reportColumnKeys = reportColumns.map((column) => column.key)

  assert.deepEqual(reportColumnKeys, [
    "fecha",
    "patente",
    "vehiculo",
    "tripStart",
    "tripEnd",
    "tripDistanceKm",
    "tripEvents",
  ])
})

test("route-history reports fall back to full trip columns when the template has no columns", () => {
  const reportColumns = createReportColumns({
    reportTypeId: "route-history",
    eventRuleIds: ["movement", "stops", "idle"],
    columns: [],
  })
  const reportColumnKeys = reportColumns.map((column) => column.key)

  assert.deepEqual(reportColumnKeys, [
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
  ])
})

test("speeding reports include speed limit and over-limit columns", () => {
  const reportColumns = createReportColumns({
    reportTypeId: "speed",
    eventRuleIds: ["speeding"],
    columns: [
      "fecha",
      "timestamp",
      "patente",
      "vehiculo",
      "velocidad",
      "speedLimit",
      "speedingDelta",
      "evento",
    ],
  })
  const reportColumnKeys = reportColumns.map((column) => column.key)

  assert.deepEqual(reportColumnKeys, [
    "fecha",
    "timestamp",
    "patente",
    "vehiculo",
    "velocidad",
    "speedLimit",
    "speedingDelta",
    "evento",
  ])
})

test("reports that mix stops and ralenti use the same operational fields", () => {
  const reportColumns = createReportColumns({
    reportTypeId: "stops",
    eventRuleIds: ["stops", "idle"],
    columns: ["patente", "vehiculo", "conductor", "duracion", "ultimoDato"],
  })
  const reportColumnKeys = reportColumns.map((column) => column.key)

  assert.deepEqual(reportColumnKeys, ["fecha", "timestamp", "patente", "duracion"])
})

test("asset reports include and format realtime GPS and CAN columns", () => {
  const asset = {
    id: "asset-1",
    companyId: "company-1",
    patente: "MOCK-027",
    nombrePantalla: "Camion prueba",
    conductor: "Mario Rojas",
    estado: "moving",
    deviceId: "1234598765432",
  }
  const report = {
    assetId: "asset-1",
    timestamp: "2026-06-25T14:22:10.000Z",
    speed: 52.5,
    combustibleNivel: 54,
    satellites: 11,
    gpsSignal: 88,
    odometer: 12345.6,
    engineHours: 840.5,
    horometroDiario: 6.3,
    rpm: 2150,
    temperaturaMotor: 91,
    batteryVoltage: 13.8,
    engineLoad: 63,
    throttle: 34,
    fuelRate: 7.4,
    fuelUsed: 1042.5,
    oilPressure: 39,
    adBlueLevel: 68,
    canDtcCount: 1,
    ignition: true,
    digitalInput1: 1,
    digitalInput2: 0,
    lat: -33.448779,
    lng: -70.669335,
    address: "Av. Central 120",
  }
  const template = {
    eventRuleIds: ["can"],
    columns: ["patente", "vehiculo", "ultimoDato", "deviceId", ...REPORT_REALTIME_COLUMN_KEYS],
  }
  const reportColumns = createReportColumns(template)
  const reportColumnKeys = reportColumns.map((column) => column.key)

  assert.ok(reportColumnKeys.includes("deviceId"))

  for (const columnKey of REPORT_REALTIME_COLUMN_KEYS) {
    assert.ok(reportColumnKeys.includes(columnKey), `missing ${columnKey}`)
  }

  const rows = buildAssetReportRows({
    selectedAssets: [asset],
    reportColumns,
    companyNameById: new Map([["company-1", "Nodus"]]),
    dateFrom: "2026-06-25",
    dateTo: "2026-06-25",
    getReportEventsForAsset: () => [
      {
        id: "event-1",
        ruleId: "can",
        timestamp: report.timestamp,
        report,
      },
    ],
    template,
    eventRulesById: new Map([["can", { id: "can", active: true, conditions: [] }]]),
  })

  assert.equal(rows.length, 1)
  assert.equal(rows[0].values.deviceId, "1234598765432")
  assert.equal(rows[0].values.address, "Av. Central 120")
  assert.equal(rows[0].values.velocidad, "52,5 km/h")
  assert.equal(rows[0].values.combustible, "54%")
  assert.equal(rows[0].values.ignition, "true")
  assert.equal(rows[0].values.gpsSatellites, "11 sat")
  assert.equal(rows[0].values.gpsSignal, "88%")
  assert.equal(rows[0].values.odometro, "12.345,6 km")
  assert.equal(rows[0].values.horometroTotal, "840,5 h")
  assert.equal(rows[0].values.horometroDiario, "6,3 h")
  assert.equal(rows[0].values.canRpm, "2.150 rpm")
  assert.equal(rows[0].values.canEngineTemp, "91 C")
  assert.equal(rows[0].values.canBatteryVoltage, "13,8 V")
  assert.equal(rows[0].values.canEngineLoad, "63%")
  assert.equal(rows[0].values.canThrottle, "34%")
  assert.equal(rows[0].values.canFuelRate, "7,4 L/h")
  assert.equal(rows[0].values.canFuelUsed, "1.042,5 L")
  assert.equal(rows[0].values.canOilPressure, "39 psi")
  assert.equal(rows[0].values.canAdBlueLevel, "68%")
  assert.equal(rows[0].values.canDtcCount, "1")
  assert.equal(rows[0].values.digitalInput1, "Activa")
  assert.equal(rows[0].values.digitalInput2, "Inactiva")
  assert.equal(rows[0].values.coordinates, "-33.44878, -70.66934")
  assert.equal(rows[0].itineraryRow.speed, 52.5)
  assert.equal(rows[0].itineraryRow.speedLabel, "52,5 km/h")
  assert.equal(rows[0].itineraryRow.gpsSatellites, 11)
  assert.equal(rows[0].itineraryRow.canRpm, 2150)
  assert.equal(rows[0].itineraryRow.ignition, true)
  assert.equal(rows[0].itineraryRow.digitalInput1, 1)
  assert.equal(rows[0].itineraryRow.digitalInput2, 0)
  assert.equal(rows[0].itineraryRow.address, "Av. Central 120")
  assert.equal(rows[0].itineraryRow.assetPatente, "MOCK-027")
})

test("asset reports generate rows directly for the selected assets only", () => {
  const selectedAsset = {
    id: "asset-1",
    companyId: "company-1",
    patente: "SEL-001",
    nombrePantalla: "Activo seleccionado",
    estado: "moving",
  }
  const template = {
    eventRuleIds: ["movement"],
    columns: ["patente", "vehiculo", "evento", "velocidad"],
  }
  const reportColumns = createReportColumns(template)
  const reportsByAssetId = new Map([
    [
      "asset-1",
      [
        {
          id: "report-1",
          assetId: "asset-1",
          timestamp: "2026-06-25T12:00:00.000Z",
          speed: 38,
          lat: -33.44,
          lng: -70.66,
        },
        {
          id: "report-1b",
          assetId: "asset-1",
          timestamp: "2026-06-25T12:05:00.000Z",
          speed: 42,
          lat: -33.45,
          lng: -70.67,
        },
      ],
    ],
    [
      "asset-2",
      [
        {
          id: "report-2",
          assetId: "asset-2",
          timestamp: "2026-06-25T12:05:00.000Z",
          speed: 42,
          lat: -33.45,
          lng: -70.67,
        },
      ],
    ],
  ])

  const rows = buildAssetReportRows({
    selectedAssets: [selectedAsset],
    reportColumns,
    companyNameById: new Map([["company-1", "Nodus"]]),
    dateFrom: "2026-06-25",
    dateTo: "2026-06-25",
    getReportsForAsset: (asset) => reportsByAssetId.get(asset.id) || [],
    getReportEventsForAsset: () => [
      {
        id: "speeding-duplicate-event",
        assetId: "asset-1",
        ruleId: "speeding",
        ruleLabel: "Exceso de velocidad",
        timestamp: "2026-06-25T12:05:00.000Z",
        sourceReportKey: "over-limit|asset-1|2026-06-25T12:05:00.000Z|-33.45|-70.67|92|",
        report: {
          id: "over-limit",
          assetId: "asset-1",
          timestamp: "2026-06-25T12:05:00.000Z",
          speed: 92,
          speedLimit: 80,
          lat: -33.45,
          lng: -70.67,
          evento: "Exceso de velocidad",
        },
      },
    ],
    template,
    eventRulesById: new Map([
      [
        "movement",
        {
          id: "movement",
          label: "Movimiento",
          active: true,
          conditions: [
            {
              field: "speed",
              operator: "greaterThan",
              value: "0",
            },
          ],
        },
      ],
    ]),
  })

  assert.equal(rows.length, 2)
  assert.equal(rows[0].values.patente, "SEL-001")
  assert.equal(rows[0].values.vehiculo, "Activo seleccionado")
  assert.equal(rows[0].values.evento, "Movimiento")
  assert.equal(rows[0].itineraryRow.event, "Movimiento")
  assert.equal(rows[0].itineraryRow.speed, 42)
  assert.ok(rows[0].itineraryRow.accumulatedDistanceKm > 0)
  assert.equal(rows[1].itineraryRow.accumulatedDistanceKm, 0)
})

test("speeding reports only include over-limit points and calculate the excess", () => {
  const selectedAsset = {
    id: "asset-1",
    companyId: "company-1",
    patente: "SPD-001",
    nombrePantalla: "Activo exceso",
    estado: "moving",
    speeding: true,
  }
  const template = {
    reportTypeId: "speed",
    eventRuleIds: ["speeding"],
    columns: [
      "fecha",
      "timestamp",
      "patente",
      "vehiculo",
      "velocidad",
      "speedLimit",
      "speedingDelta",
      "evento",
    ],
  }
  const reportColumns = createReportColumns(template)
  const reportsByAssetId = new Map([
    [
      "asset-1",
      [
        {
          id: "under-limit",
          assetId: "asset-1",
          timestamp: "2026-06-25T12:00:00.000Z",
          speed: 85,
          speedLimit: 90,
          lat: -33.44,
          lng: -70.66,
        },
        {
          id: "over-limit",
          assetId: "asset-1",
          timestamp: "2026-06-25T12:05:00.000Z",
          speed: 92,
          speedLimit: 80,
          lat: -33.45,
          lng: -70.67,
        },
        {
          id: "explicit-speeding",
          assetId: "asset-1",
          timestamp: "2026-06-25T12:10:00.000Z",
          speed: 95,
          speeding: true,
          lat: -33.46,
          lng: -70.68,
        },
        {
          id: "stale-asset-speeding-flag",
          assetId: "asset-1",
          timestamp: "2026-06-25T12:15:00.000Z",
          speed: 15.5,
          speedLimit: 80,
          lat: -33.47,
          lng: -70.69,
        },
      ],
    ],
  ])

  const rows = buildAssetReportRows({
    selectedAssets: [selectedAsset],
    reportColumns,
    companyNameById: new Map([["company-1", "Nodus"]]),
    dateFrom: "2026-06-25",
    dateTo: "2026-06-25",
    getReportsForAsset: (asset) => reportsByAssetId.get(asset.id) || [],
    template,
    eventRulesById: new Map([
      [
        "speeding",
        {
          id: "speeding",
          label: "Exceso de velocidad",
          active: true,
          conditions: [
            {
              field: "speed",
              operator: "greaterThan",
              value: "80",
            },
          ],
        },
      ],
    ]),
  })

  const overLimitRow = rows.find((row) => row.report.id === "over-limit")
  const explicitSpeedingRow = rows.find((row) => row.report.id === "explicit-speeding")

  assert.equal(rows.length, 2)
  assert.ok(overLimitRow)
  assert.ok(explicitSpeedingRow)
  assert.equal(overLimitRow.values.velocidad, "92 km/h")
  assert.equal(overLimitRow.values.speedLimit, "80 km/h")
  assert.equal(overLimitRow.values.speedingDelta, "+12 km/h")
  assert.equal(overLimitRow.values.evento, "Exceso de velocidad")
  assert.equal(explicitSpeedingRow.values.speedingDelta, "+15 km/h")
  assert.equal(
    rows.some((row) => row.report.id === "stale-asset-speeding-flag"),
    false,
  )
})

test("speeding reports use the current asset speed limit over stale history limits", () => {
  const selectedAsset = {
    id: "asset-1",
    companyId: "company-1",
    patente: "SPD-040",
    nombrePantalla: "Activo limite actual",
    estado: "moving",
    speedLimit: 40,
  }
  const template = {
    reportTypeId: "speed",
    eventRuleIds: ["speeding"],
    columns: ["fecha", "timestamp", "patente", "velocidad", "speedLimit", "speedingDelta"],
  }
  const reportColumns = createReportColumns(template)
  const rows = buildAssetReportRows({
    selectedAssets: [selectedAsset],
    reportColumns,
    companyNameById: new Map([["company-1", "Nodus"]]),
    dateFrom: "2026-06-25",
    dateTo: "2026-06-25",
    getReportsForAsset: () => [
      {
        id: "stale-limit",
        assetId: "asset-1",
        timestamp: "2026-06-25T12:00:00.000Z",
        speed: 55,
        speedLimit: 80,
      },
    ],
    template,
    eventRulesById: new Map([
      [
        "speeding",
        {
          id: "speeding",
          label: "Exceso de velocidad",
          active: true,
          conditions: [
            {
              field: "speed",
              operator: "greaterThan",
              value: "80",
            },
          ],
        },
      ],
    ]),
  })

  assert.equal(rows.length, 1)
  assert.equal(rows[0].values.speedLimit, "40 km/h")
  assert.equal(rows[0].values.speedingDelta, "+15 km/h")
})

test("speeding reports use custom rule thresholds before stale history limits", () => {
  const selectedAsset = {
    id: "asset-1",
    companyId: "company-1",
    patente: "SPD-R40",
    nombrePantalla: "Activo regla 40",
    estado: "moving",
  }
  const template = {
    reportTypeId: "speed",
    eventRuleIds: ["speeding"],
    columns: ["fecha", "timestamp", "patente", "velocidad", "speedLimit", "speedingDelta"],
  }
  const reportColumns = createReportColumns(template)
  const rows = buildAssetReportRows({
    selectedAssets: [selectedAsset],
    reportColumns,
    companyNameById: new Map([["company-1", "Nodus"]]),
    dateFrom: "2026-06-25",
    dateTo: "2026-06-25",
    getReportsForAsset: () => [
      {
        id: "custom-rule-limit",
        assetId: "asset-1",
        timestamp: "2026-06-25T12:00:00.000Z",
        speed: 55,
        speedLimit: 80,
      },
    ],
    template,
    eventRulesById: new Map([
      [
        "speeding",
        {
          id: "speeding",
          label: "Exceso de velocidad",
          active: true,
          conditions: [
            {
              field: "speed",
              operator: "greaterThan",
              value: "40",
            },
          ],
        },
      ],
    ]),
  })

  assert.equal(rows.length, 1)
  assert.equal(rows[0].values.speedLimit, "40 km/h")
  assert.equal(rows[0].values.speedingDelta, "+15 km/h")
})

test("speeding reports discard stale speeding alerts below the configured limit", () => {
  const selectedAsset = {
    id: "asset-1",
    companyId: "company-1",
    patente: "MIX-001",
    nombrePantalla: "Activo alertas",
    estado: "moving",
  }
  const template = {
    reportTypeId: "alerts",
    eventRuleIds: ["alerts", "speeding", "custom-speeding"],
    columns: [
      "fecha",
      "timestamp",
      "patente",
      "vehiculo",
      "velocidad",
      "speedLimit",
      "speedingDelta",
      "evento",
    ],
  }
  const reportColumns = createReportColumns(template)
  const reportsByAssetId = new Map([
    [
      "asset-1",
      [
        {
          id: "stale-speeding-alert",
          assetId: "asset-1",
          timestamp: "2026-06-25T12:00:00.000Z",
          speed: 30.5,
          speedLimit: 80,
          alerta: "Exceso de velocidad",
          lat: -33.44,
          lng: -70.66,
        },
        {
          id: "real-speeding-alert",
          assetId: "asset-1",
          timestamp: "2026-06-25T12:05:00.000Z",
          speed: 91,
          speedLimit: 80,
          alerta: "Exceso de velocidad",
          lat: -33.45,
          lng: -70.67,
        },
      ],
    ],
  ])

  const rows = buildAssetReportRows({
    selectedAssets: [selectedAsset],
    reportColumns,
    companyNameById: new Map([["company-1", "Nodus"]]),
    dateFrom: "2026-06-25",
    dateTo: "2026-06-25",
    getReportsForAsset: (asset) => reportsByAssetId.get(asset.id) || [],
    template,
    eventRulesById: new Map([
      [
        "alerts",
        {
          id: "alerts",
          label: "Alertas",
          active: true,
          conditions: [
            {
              field: "alert",
              operator: "exists",
              value: "",
            },
          ],
        },
      ],
      [
        "speeding",
        {
          id: "speeding",
          label: "Exceso de velocidad",
          active: true,
          conditions: [
            {
              field: "speed",
              operator: "greaterThan",
              value: "80",
            },
          ],
        },
      ],
      [
        "custom-speeding",
        {
          id: "custom-speeding",
          label: "Exceso de velocidad",
          active: true,
          conditions: [],
        },
      ],
    ]),
  })

  assert.equal(
    rows.some((row) => row.report.id === "stale-speeding-alert"),
    false,
  )
  assert.ok(rows.length > 0)
  assert.ok(rows.every((row) => String(row.values.speedingDelta).startsWith("+")))
})

test("speeding reports include explicit non-pulse events", () => {
  const selectedAsset = {
    id: "asset-1",
    companyId: "company-1",
    patente: "EVT-001",
    nombrePantalla: "Activo evento",
    estado: "moving",
  }
  const template = {
    reportTypeId: "speed",
    eventRuleIds: ["speeding"],
    columns: ["fecha", "timestamp", "patente", "velocidad", "speedingDelta", "evento"],
  }
  const reportColumns = createReportColumns(template)

  const rows = buildAssetReportRows({
    selectedAssets: [selectedAsset],
    reportColumns,
    companyNameById: new Map([["company-1", "Nodus"]]),
    dateFrom: "2026-06-25",
    dateTo: "2026-06-25",
    getReportsForAsset: () => [],
    getReportEventsForAsset: () => [
      {
        id: "non-pulse-speeding",
        assetId: "asset-1",
        ruleId: "speeding",
        ruleLabel: "Exceso de velocidad",
        timestamp: "2026-06-25T13:00:00.000Z",
        report: {
          id: "external-speeding-event",
          assetId: "asset-1",
          timestamp: "2026-06-25T13:00:00.000Z",
          speed: 95,
          speeding: true,
          evento: "Exceso de velocidad",
        },
      },
    ],
    template,
    eventRulesById: new Map([
      [
        "speeding",
        {
          id: "speeding",
          label: "Exceso de velocidad",
          active: true,
          conditions: [
            {
              field: "speed",
              operator: "greaterThan",
              value: "80",
            },
          ],
        },
      ],
    ]),
  })

  assert.equal(rows.length, 1)
  assert.equal(rows[0].report.id, "external-speeding-event")
  assert.equal(rows[0].values.patente, "EVT-001")
  assert.equal(rows[0].values.evento, "Exceso de velocidad")
})

test("asset report rows are grouped by vehicle when multiple assets are selected", () => {
  const selectedAssets = [
    {
      id: "asset-b",
      companyId: "company-1",
      patente: "ZZZ-002",
      nombrePantalla: "Camion Z",
      estado: "moving",
    },
    {
      id: "asset-a",
      companyId: "company-1",
      patente: "AAA-001",
      nombrePantalla: "Camion A",
      estado: "moving",
    },
  ]
  const template = {
    eventRuleIds: ["movement"],
    columns: ["fecha", "timestamp", "patente", "vehiculo", "evento", "velocidad"],
  }
  const reportColumns = createReportColumns(template)
  const reportsByAssetId = new Map([
    [
      "asset-b",
      [
        {
          id: "b-new",
          assetId: "asset-b",
          timestamp: "2026-06-25T12:10:00.000Z",
          speed: 35,
          lat: -33.44,
          lng: -70.66,
        },
      ],
    ],
    [
      "asset-a",
      [
        {
          id: "a-old",
          assetId: "asset-a",
          timestamp: "2026-06-25T12:00:00.000Z",
          speed: 40,
          lat: -33.45,
          lng: -70.67,
        },
        {
          id: "a-new",
          assetId: "asset-a",
          timestamp: "2026-06-25T12:20:00.000Z",
          speed: 42,
          lat: -33.46,
          lng: -70.68,
        },
      ],
    ],
  ])

  const rows = buildAssetReportRows({
    selectedAssets,
    reportColumns,
    companyNameById: new Map([["company-1", "Nodus"]]),
    dateFrom: "2026-06-25",
    dateTo: "2026-06-25",
    getReportsForAsset: (asset) => reportsByAssetId.get(asset.id) || [],
    template,
    eventRulesById: new Map([
      [
        "movement",
        {
          id: "movement",
          label: "Movimiento",
          active: true,
          conditions: [
            {
              field: "speed",
              operator: "greaterThan",
              value: "0",
            },
          ],
        },
      ],
    ]),
  })

  assert.deepEqual(
    rows.map((row) => row.values.patente),
    ["AAA-001", "AAA-001", "ZZZ-002"],
  )
  assert.deepEqual(
    rows.map((row) => row.report.id),
    ["a-new", "a-old", "b-new"],
  )
})

test("route-history reports group movement, stops and idle points into trips", () => {
  const selectedAsset = {
    id: "asset-1",
    companyId: "company-1",
    patente: "RTE-001",
    nombrePantalla: "Activo recorrido",
    estado: "moving",
  }
  const template = {
    reportTypeId: "route-history",
    eventRuleIds: ["movement", "stops", "idle"],
    columns: [
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
    ],
  }
  const reportColumns = createReportColumns(template)
  const reportsByAssetId = new Map([
    [
      "asset-1",
      [
        {
          id: "moving-point",
          assetId: "asset-1",
          timestamp: "2026-06-25T12:00:00.000Z",
          speed: 35,
          ignition: true,
          estado: "moving",
          lat: -33.44,
          lng: -70.66,
        },
        {
          id: "idle-point",
          assetId: "asset-1",
          timestamp: "2026-06-25T12:05:00.000Z",
          speed: 0,
          ignition: true,
          estado: "stopped",
          lat: -33.45,
          lng: -70.67,
        },
        {
          id: "stop-point",
          assetId: "asset-1",
          timestamp: "2026-06-25T12:10:00.000Z",
          speed: 0,
          ignition: false,
          estado: "stopped",
          lat: -33.46,
          lng: -70.68,
        },
      ],
    ],
  ])

  const rows = buildAssetReportRows({
    selectedAssets: [selectedAsset],
    reportColumns,
    companyNameById: new Map([["company-1", "Nodus"]]),
    dateFrom: "2026-06-25",
    dateTo: "2026-06-25",
    getReportsForAsset: (asset) => reportsByAssetId.get(asset.id) || [],
    template,
    eventRulesById: new Map([
      [
        "movement",
        {
          id: "movement",
          label: "Movimiento",
          active: true,
          conditions: [
            {
              field: "speed",
              operator: "greaterThan",
              value: "0",
            },
          ],
        },
      ],
      [
        "stops",
        {
          id: "stops",
          label: "Detenciones",
          active: true,
          conditions: [
            {
              field: "speed",
              operator: "equals",
              value: "0",
            },
          ],
        },
      ],
      [
        "idle",
        {
          id: "idle",
          label: "Ralenti",
          active: true,
          conditions: [
            {
              field: "ignition",
              operator: "equals",
              value: "true",
            },
            {
              field: "speed",
              operator: "lessThanOrEqual",
              value: "3",
            },
          ],
        },
      ],
    ]),
  })

  assert.equal(rows.length, 1)
  assert.equal(rows[0].values.tripMaxSpeed, "35 km/h")
  assert.equal(rows[0].values.tripStops, "1 parada")
  assert.match(rows[0].values.tripEvents, /1 detencion/)
  assert.match(rows[0].values.tripEvents, /1 ralenti/)
  assert.notEqual(rows[0].values.tripDistanceKm, "0 km")
  assert.notEqual(rows[0].values.tripOrigin, "-")
  assert.notEqual(rows[0].values.tripDestination, "-")
  assert.match(rows[0].values.tripOrigin, /-33\.440000, -70\.660000/)
  assert.match(rows[0].values.tripDestination, /-33\.460000, -70\.680000/)
  assert.equal(rows[0].event, "Viaje")
  assert.ok(Array.isArray(rows[0].routeTrip.points))
  assert.ok(rows[0].routeTrip.points.length >= 2)
})

test("route-history reports split trips when ignition is off and speed is zero", () => {
  const selectedAsset = {
    id: "asset-1",
    companyId: "company-1",
    patente: "RTE-002",
    nombrePantalla: "Activo con cortes",
    estado: "moving",
  }
  const template = {
    reportTypeId: "route-history",
    eventRuleIds: ["movement", "stops", "tripEnd"],
    columns: [
      "fecha",
      "patente",
      "vehiculo",
      "tripStart",
      "tripEnd",
      "tripOrigin",
      "tripDestination",
      "tripDistanceKm",
      "tripMaxSpeed",
      "tripStops",
    ],
  }
  const reportColumns = createReportColumns(template)
  const reportsByAssetId = new Map([
    [
      "asset-1",
      [
        {
          id: "trip-1-start",
          assetId: "asset-1",
          timestamp: "2026-06-25T08:00:00.000Z",
          speed: 28,
          ignition: true,
          estado: "moving",
          lat: -33.44,
          lng: -70.66,
        },
        {
          id: "trip-1-end",
          assetId: "asset-1",
          timestamp: "2026-06-25T08:12:00.000Z",
          speed: 0,
          ignition: false,
          estado: "stopped",
          lat: -33.45,
          lng: -70.67,
        },
        {
          id: "parked-after-trip-1",
          assetId: "asset-1",
          timestamp: "2026-06-25T08:20:00.000Z",
          speed: 0,
          ignition: false,
          estado: "stopped",
          lat: -33.45,
          lng: -70.67,
        },
        {
          id: "trip-2-start",
          assetId: "asset-1",
          timestamp: "2026-06-25T08:28:00.000Z",
          speed: 22,
          ignition: true,
          estado: "moving",
          lat: -33.46,
          lng: -70.68,
        },
        {
          id: "trip-2-end",
          assetId: "asset-1",
          timestamp: "2026-06-25T08:36:00.000Z",
          speed: 0,
          ignition: false,
          estado: "stopped",
          lat: -33.47,
          lng: -70.69,
        },
      ],
    ],
  ])

  const rows = buildAssetReportRows({
    selectedAssets: [selectedAsset],
    reportColumns,
    companyNameById: new Map([["company-1", "Nodus"]]),
    dateFrom: "2026-06-25",
    dateTo: "2026-06-25",
    getReportsForAsset: (asset) => reportsByAssetId.get(asset.id) || [],
    template,
    eventRulesById: new Map([
      [
        "movement",
        {
          id: "movement",
          label: "Movimiento",
          active: true,
          conditions: [
            {
              field: "speed",
              operator: "greaterThan",
              value: "0",
            },
          ],
        },
      ],
      [
        "tripEnd",
        {
          id: "tripEnd",
          label: "Fin de viaje",
          active: true,
          conditions: [
            {
              field: "ignition",
              operator: "equals",
              value: "false",
            },
            {
              field: "speed",
              operator: "equals",
              value: "0",
            },
          ],
        },
      ],
      [
        "stops",
        {
          id: "stops",
          label: "Detenciones",
          active: true,
          conditions: [
            {
              field: "speed",
              operator: "equals",
              value: "0",
            },
          ],
        },
      ],
    ]),
  })

  const tripsByStart = [...rows].sort((firstRow, secondRow) => {
    return (
      new Date(firstRow.routeTrip.startTimestamp).getTime() -
      new Date(secondRow.routeTrip.startTimestamp).getTime()
    )
  })

  assert.equal(tripsByStart.length, 2)
  assert.equal(tripsByStart[0].values.patente, "RTE-002")
  assert.equal(tripsByStart[1].values.patente, "RTE-002")
  assert.match(tripsByStart[0].values.tripOrigin, /-33\.440000, -70\.660000/)
  assert.match(tripsByStart[0].values.tripDestination, /-33\.450000, -70\.670000/)
  assert.match(tripsByStart[1].values.tripOrigin, /-33\.460000, -70\.680000/)
  assert.match(tripsByStart[1].values.tripDestination, /-33\.470000, -70\.690000/)
  assert.equal(tripsByStart[0].routeTrip.pointCount, 2)
  assert.equal(tripsByStart[1].routeTrip.pointCount, 2)
})

test("route-history reports keep one trip when no trip-end rule is selected", () => {
  const selectedAsset = {
    id: "asset-1",
    companyId: "company-1",
    patente: "RTE-003",
    nombrePantalla: "Activo sin cortes",
    estado: "moving",
  }
  const template = {
    reportTypeId: "route-history",
    eventRuleIds: ["movement"],
    columns: ["fecha", "patente", "vehiculo", "tripOrigin", "tripDestination", "tripDistanceKm"],
  }
  const reportColumns = createReportColumns(template)
  const reportsByAssetId = new Map([
    [
      "asset-1",
      [
        {
          id: "trip-start",
          assetId: "asset-1",
          timestamp: "2026-06-25T08:00:00.000Z",
          speed: 28,
          ignition: true,
          estado: "moving",
          lat: -33.44,
          lng: -70.66,
        },
        {
          id: "ignition-off-stop",
          assetId: "asset-1",
          timestamp: "2026-06-25T08:12:00.000Z",
          speed: 0,
          ignition: false,
          estado: "stopped",
          lat: -33.45,
          lng: -70.67,
        },
        {
          id: "trip-continues",
          assetId: "asset-1",
          timestamp: "2026-06-25T08:28:00.000Z",
          speed: 22,
          ignition: true,
          estado: "moving",
          lat: -33.46,
          lng: -70.68,
        },
      ],
    ],
  ])

  const rows = buildAssetReportRows({
    selectedAssets: [selectedAsset],
    reportColumns,
    companyNameById: new Map([["company-1", "Nodus"]]),
    dateFrom: "2026-06-25",
    dateTo: "2026-06-25",
    getReportsForAsset: (asset) => reportsByAssetId.get(asset.id) || [],
    template,
    eventRulesById: new Map([
      [
        "movement",
        {
          id: "movement",
          label: "Movimiento",
          active: true,
          conditions: [
            {
              field: "speed",
              operator: "greaterThan",
              value: "0",
            },
          ],
        },
      ],
    ]),
  })

  assert.equal(rows.length, 1)
  assert.match(rows[0].values.tripOrigin, /-33\.440000, -70\.660000/)
  assert.match(rows[0].values.tripDestination, /-33\.460000, -70\.680000/)
  assert.equal(rows[0].routeTrip.pointCount, 3)
})

test("geofence reports group consecutive positions and calculate dwell time", () => {
  const selectedAsset = {
    id: "asset-1",
    companyId: "company-1",
    patente: "GEO-001",
    nombrePantalla: "Camion peaje",
    estado: "moving",
  }
  const template = {
    reportTypeId: "geofences",
    eventRuleIds: ["geofence"],
    columns: ["fecha", "timestamp", "patente", "vehiculo", "geocerca", "evento", "duracion"],
  }
  const reportColumns = createReportColumns(template)
  const reportsByAssetId = new Map([
    [
      "asset-1",
      [
        {
          id: "outside-before",
          assetId: "asset-1",
          timestamp: "2026-06-25T12:00:00.000Z",
          lat: -33.46,
          lng: -70.69,
          speed: 40,
        },
        {
          id: "inside-start",
          assetId: "asset-1",
          timestamp: "2026-06-25T12:05:00.000Z",
          lat: -33.4488,
          lng: -70.6693,
          speed: 18,
        },
        {
          id: "inside-still",
          assetId: "asset-1",
          timestamp: "2026-06-25T12:08:00.000Z",
          lat: -33.4487,
          lng: -70.6692,
          speed: 10,
        },
        {
          id: "outside-after",
          assetId: "asset-1",
          timestamp: "2026-06-25T12:12:00.000Z",
          lat: -33.46,
          lng: -70.69,
          speed: 35,
        },
      ],
    ],
  ])

  const rows = buildAssetReportRows({
    selectedAssets: [selectedAsset],
    reportColumns,
    companyNameById: new Map([["company-1", "Nodus"]]),
    dateFrom: "2026-06-25",
    dateTo: "2026-06-25",
    getReportsForAsset: (asset) => reportsByAssetId.get(asset.id) || [],
    template,
    eventRulesById: new Map([
      [
        "geofence",
        {
          id: "geofence",
          label: "Geocercas",
          active: true,
          conditions: [
            {
              field: "geofence",
              operator: "exists",
              value: "",
            },
          ],
        },
      ],
    ]),
    geofences: [
      {
        id: "geo-1",
        name: "Peaje Norte",
        groupName: "PEAJE",
        type: "circle",
        center: {
          lat: -33.4488,
          lng: -70.6693,
        },
        radius: 120,
      },
    ],
  })

  assert.equal(rows.length, 1)
  assert.equal(rows[0].report.id, "inside-start")
  assert.equal(rows[0].values.patente, "GEO-001")
  assert.equal(rows[0].values.geocerca, "PEAJE")
  assert.equal(rows[0].values.evento, "Paso por geocerca")
  assert.equal(rows[0].values.duracion, "7 min")
})

test("geofence reports aggregate explicit geofence telemetry without local geometry", () => {
  const selectedAsset = {
    id: "asset-1",
    companyId: "company-1",
    patente: "GEO-002",
    nombrePantalla: "Camion peaje",
    estado: "moving",
  }
  const template = {
    reportTypeId: "geofences",
    eventRuleIds: ["geofence"],
    columns: ["fecha", "timestamp", "patente", "geocerca", "evento", "duracion"],
  }
  const reportColumns = createReportColumns(template)
  const reportsByAssetId = new Map([
    [
      "asset-1",
      [
        {
          id: "outside-before",
          assetId: "asset-1",
          timestamp: "2026-06-25T12:00:00.000Z",
          speed: 40,
        },
        {
          id: "inside-start",
          assetId: "asset-1",
          timestamp: "2026-06-25T12:05:00.000Z",
          geocerca: "PEAJE",
          evento: "Entrada a geocerca",
          speed: 18,
        },
        {
          id: "inside-still",
          assetId: "asset-1",
          timestamp: "2026-06-25T12:08:00.000Z",
          geocerca: "PEAJE",
          evento: "Permanencia en geocerca",
          speed: 10,
        },
        {
          id: "outside-after",
          assetId: "asset-1",
          timestamp: "2026-06-25T12:12:00.000Z",
          speed: 35,
        },
      ],
    ],
  ])

  const rows = buildAssetReportRows({
    selectedAssets: [selectedAsset],
    reportColumns,
    companyNameById: new Map([["company-1", "Nodus"]]),
    dateFrom: "2026-06-25",
    dateTo: "2026-06-25",
    getReportsForAsset: (asset) => reportsByAssetId.get(asset.id) || [],
    template,
    eventRulesById: new Map([
      [
        "geofence",
        {
          id: "geofence",
          label: "Geocercas",
          active: true,
          conditions: [
            {
              field: "geofence",
              operator: "exists",
              value: "",
            },
          ],
        },
      ],
    ]),
    geofences: [],
  })

  assert.equal(rows.length, 1)
  assert.equal(rows[0].report.id, "inside-start")
  assert.equal(rows[0].values.patente, "GEO-002")
  assert.equal(rows[0].values.geocerca, "PEAJE")
  assert.equal(rows[0].values.evento, "Paso por geocerca")
  assert.equal(rows[0].values.duracion, "7 min")
})

test("geofence reports apply custom geofence conditions to aggregated sessions", () => {
  const selectedAsset = {
    id: "asset-1",
    companyId: "company-1",
    patente: "GEO-003",
    nombrePantalla: "Camion zonas",
    estado: "moving",
  }
  const template = {
    reportTypeId: "geofences",
    eventRuleIds: ["geofence"],
    columns: ["fecha", "timestamp", "patente", "geocerca", "evento", "duracion"],
  }
  const reportColumns = createReportColumns(template)
  const reportsByAssetId = new Map([
    [
      "asset-1",
      [
        {
          id: "north-start",
          assetId: "asset-1",
          timestamp: "2026-06-25T12:00:00.000Z",
          geocerca: "Peaje Norte",
        },
        {
          id: "north-end",
          assetId: "asset-1",
          timestamp: "2026-06-25T12:03:00.000Z",
        },
        {
          id: "south-start",
          assetId: "asset-1",
          timestamp: "2026-06-25T12:10:00.000Z",
          geocerca: "Peaje Sur",
        },
        {
          id: "south-end",
          assetId: "asset-1",
          timestamp: "2026-06-25T12:15:00.000Z",
        },
      ],
    ],
  ])

  const rows = buildAssetReportRows({
    selectedAssets: [selectedAsset],
    reportColumns,
    companyNameById: new Map([["company-1", "Nodus"]]),
    dateFrom: "2026-06-25",
    dateTo: "2026-06-25",
    getReportsForAsset: (asset) => reportsByAssetId.get(asset.id) || [],
    template,
    eventRulesById: new Map([
      [
        "geofence",
        {
          id: "geofence",
          label: "Geocercas",
          active: true,
          conditions: [
            {
              field: "geofence",
              operator: "contains",
              value: "Sur",
            },
          ],
        },
      ],
    ]),
  })

  assert.equal(rows.length, 1)
  assert.equal(rows[0].report.id, "south-start")
  assert.equal(rows[0].values.geocerca, "Peaje Sur")
  assert.equal(rows[0].values.duracion, "5 min")
})

test("asset reports fall back to the current asset snapshot when history is empty", () => {
  const selectedAsset = {
    id: "asset-1",
    companyId: "company-1",
    patente: "LIVE-001",
    nombrePantalla: "Activo en vivo",
    estado: "moving",
    timestamp: "2026-06-25T12:00:00.000Z",
    speed: 35,
    lat: -33.4488,
    lng: -70.6693,
    gpsSatellites: 12,
  }
  const template = {
    eventRuleIds: ["movement"],
    columns: ["patente", "vehiculo", "evento", "velocidad", "gpsSatellites"],
  }
  const reportColumns = createReportColumns(template)

  const rows = buildAssetReportRows({
    selectedAssets: [selectedAsset],
    reportColumns,
    companyNameById: new Map([["company-1", "Nodus"]]),
    dateFrom: "2026-06-25",
    dateTo: "2026-06-25",
    getReportsForAsset: () => [],
    template,
    eventRulesById: new Map([
      [
        "movement",
        {
          id: "movement",
          label: "Movimiento",
          active: true,
          conditions: [
            {
              field: "speed",
              operator: "greaterThan",
              value: "0",
            },
          ],
        },
      ],
    ]),
  })

  assert.equal(rows.length, 1)
  assert.equal(rows[0].values.patente, "LIVE-001")
  assert.equal(rows[0].values.evento, "Movimiento")
  assert.equal(rows[0].values.velocidad, "35 km/h")
  assert.equal(rows[0].values.gpsSatellites, "12 sat")
})

test("asset reports match ignition rules from boolean ignition values", () => {
  const selectedAsset = {
    id: "asset-1",
    companyId: "company-1",
    patente: "IGN-001",
    nombrePantalla: "Activo ignicion",
    estado: "idle",
  }
  const template = {
    eventRuleIds: ["ignition"],
    columns: ["patente", "vehiculo", "evento", "ignition"],
  }
  const reportColumns = createReportColumns(template)
  const reportsByAssetId = new Map([
    [
      "asset-1",
      [
        {
          id: "ignition-on",
          assetId: "asset-1",
          timestamp: "2026-06-25T12:00:00.000Z",
          ignicion: true,
          speed: 0,
          lat: -33.44,
          lng: -70.66,
        },
      ],
    ],
  ])

  const rows = buildAssetReportRows({
    selectedAssets: [selectedAsset],
    reportColumns,
    companyNameById: new Map([["company-1", "Nodus"]]),
    dateFrom: "2026-06-25",
    dateTo: "2026-06-25",
    getReportsForAsset: (asset) => reportsByAssetId.get(asset.id) || [],
    template,
    eventRulesById: new Map([
      [
        "ignition",
        {
          id: "ignition",
          label: "Encendido",
          active: true,
          conditions: [
            {
              field: "ignition",
              operator: "equals",
              value: "true",
            },
          ],
        },
      ],
    ]),
  })

  assert.equal(rows.length, 1)
  assert.equal(rows[0].values.evento, "Encendido")
  assert.equal(rows[0].values.ignition, "true")
})

test("asset reports respect event rules scoped to asset groups", () => {
  const selectedAssets = [
    {
      id: "asset-1",
      companyId: "company-1",
      patente: "GRP-001",
      nombrePantalla: "Activo grupo norte",
      estado: "moving",
      sucursalId: "north",
    },
    {
      id: "asset-2",
      companyId: "company-1",
      patente: "GRP-002",
      nombrePantalla: "Activo grupo sur",
      estado: "moving",
      sucursalId: "south",
    },
  ]
  const template = {
    eventRuleIds: ["movement"],
    columns: ["patente", "vehiculo", "evento", "velocidad"],
  }
  const reportColumns = createReportColumns(template)
  const reportsByAssetId = new Map(
    selectedAssets.map((asset, index) => [
      asset.id,
      [
        {
          id: `report-${index + 1}`,
          assetId: asset.id,
          timestamp: "2026-06-25T12:00:00.000Z",
          speed: 38,
          lat: -33.44 - index * 0.01,
          lng: -70.66 - index * 0.01,
        },
      ],
    ]),
  )

  const rows = buildAssetReportRows({
    selectedAssets,
    reportColumns,
    companyNameById: new Map([["company-1", "Nodus"]]),
    dateFrom: "2026-06-25",
    dateTo: "2026-06-25",
    getReportsForAsset: (asset) => reportsByAssetId.get(asset.id) || [],
    template,
    eventRulesById: new Map([
      [
        "movement",
        {
          id: "movement",
          label: "Movimiento norte",
          active: true,
          groupIds: ["north"],
          conditions: [
            {
              field: "speed",
              operator: "greaterThan",
              value: "0",
            },
          ],
        },
      ],
    ]),
  })

  assert.equal(rows.length, 1)
  assert.equal(rows[0].values.patente, "GRP-001")
  assert.equal(rows[0].values.evento, "Movimiento norte")
})

test("asset reports enforce movement semantics even when a stored system rule has no conditions", () => {
  const selectedAsset = {
    id: "asset-1",
    companyId: "company-1",
    patente: "MOV-001",
    nombrePantalla: "Activo movimiento",
    estado: "moving",
  }
  const template = {
    eventRuleIds: ["movement"],
    columns: ["patente", "vehiculo", "evento", "velocidad"],
  }
  const reportColumns = createReportColumns(template)
  const reportsByAssetId = new Map([
    [
      "asset-1",
      [
        {
          id: "idle-report",
          assetId: "asset-1",
          timestamp: "2026-06-25T12:00:00.000Z",
          speed: 0,
          ignition: true,
          estado: "stopped",
          evento: "Ralenti",
          lat: -33.44,
          lng: -70.66,
        },
        {
          id: "moving-report",
          assetId: "asset-1",
          timestamp: "2026-06-25T12:05:00.000Z",
          speed: 38,
          estado: "moving",
          evento: "Movimiento",
          lat: -33.45,
          lng: -70.67,
        },
      ],
    ],
  ])

  const rows = buildAssetReportRows({
    selectedAssets: [selectedAsset],
    reportColumns,
    companyNameById: new Map([["company-1", "Nodus"]]),
    dateFrom: "2026-06-25",
    dateTo: "2026-06-25",
    getReportsForAsset: (asset) => reportsByAssetId.get(asset.id) || [],
    template,
    eventRulesById: new Map([
      [
        "movement",
        {
          id: "movement",
          label: "Movimiento",
          active: true,
          conditions: [],
        },
      ],
    ]),
  })

  assert.equal(rows.length, 1)
  assert.equal(rows[0].report.id, "moving-report")
  assert.equal(rows[0].values.velocidad, "38 km/h")
})

test("asset reports do not mix idle telemetry into stop event rules", () => {
  const selectedAsset = {
    id: "asset-1",
    companyId: "company-1",
    patente: "STP-001",
    nombrePantalla: "Activo detenido",
    estado: "stopped",
  }
  const template = {
    eventRuleIds: ["stops"],
    columns: ["patente", "vehiculo", "evento", "velocidad"],
  }
  const reportColumns = createReportColumns(template)
  const reportsByAssetId = new Map([
    [
      "asset-1",
      [
        {
          id: "idle-report",
          assetId: "asset-1",
          timestamp: "2026-06-25T12:00:00.000Z",
          speed: 0,
          estado: "stopped",
          evento: "Ralenti",
          lat: -33.44,
          lng: -70.66,
        },
        {
          id: "stop-report",
          assetId: "asset-1",
          timestamp: "2026-06-25T12:05:00.000Z",
          speed: 0,
          ignition: false,
          estado: "stopped",
          evento: "Detencion",
          lat: -33.45,
          lng: -70.67,
        },
      ],
    ],
  ])

  const rows = buildAssetReportRows({
    selectedAssets: [selectedAsset],
    reportColumns,
    companyNameById: new Map([["company-1", "Nodus"]]),
    dateFrom: "2026-06-25",
    dateTo: "2026-06-25",
    getReportsForAsset: (asset) => reportsByAssetId.get(asset.id) || [],
    template,
    eventRulesById: new Map([
      [
        "stops",
        {
          id: "stops",
          label: "Detenciones",
          active: true,
          conditions: [
            {
              field: "speed",
              operator: "equals",
              value: "0",
            },
          ],
        },
      ],
    ]),
  })

  assert.equal(rows.length, 1)
  assert.equal(rows[0].report.id, "stop-report")
  assert.equal(rows[0].values.evento, "Detenciones")
})

test("asset reports apply the default idle rule to ralenti events", () => {
  const selectedAsset = {
    id: "asset-1",
    companyId: "company-1",
    patente: "IDL-001",
    nombrePantalla: "Activo ralenti",
    estado: "stopped",
  }
  const template = {
    eventRuleIds: ["idle"],
    columns: ["patente", "vehiculo", "evento", "velocidad"],
  }
  const reportColumns = createReportColumns(template)
  const reportsByAssetId = new Map([
    [
      "asset-1",
      [
        {
          id: "idle-report",
          assetId: "asset-1",
          timestamp: "2026-06-25T12:00:00.000Z",
          speed: 0,
          ignition: true,
          estado: "stopped",
          evento: "Ralenti",
        },
        {
          id: "idle-report-2",
          assetId: "asset-1",
          timestamp: "2026-06-25T12:03:00.000Z",
          speed: 0,
          ignition: true,
          estado: "stopped",
          evento: "Ralenti",
        },
        {
          id: "stop-report",
          assetId: "asset-1",
          timestamp: "2026-06-25T12:05:00.000Z",
          speed: 0,
          ignition: false,
          estado: "stopped",
          evento: "Detencion",
        },
      ],
    ],
  ])

  const rows = buildAssetReportRows({
    selectedAssets: [selectedAsset],
    reportColumns,
    companyNameById: new Map([["company-1", "Nodus"]]),
    dateFrom: "2026-06-25",
    dateTo: "2026-06-25",
    getReportsForAsset: (asset) => reportsByAssetId.get(asset.id) || [],
    template,
    eventRulesById: new Map([
      [
        "idle",
        {
          id: "idle",
          label: "Ralenti",
          active: true,
          conditions: [
            {
              field: "ignition",
              operator: "equals",
              value: "true",
            },
            {
              field: "speed",
              operator: "lessThanOrEqual",
              value: "3",
            },
          ],
        },
      ],
    ]),
  })

  assert.equal(rows.length, 1)
  assert.equal(rows[0].report.id, "idle-report")
  assert.equal(rows[0].report.evento, "Ralenti")
  assert.equal(rows[0].values.patente, "IDL-001")
  assert.equal(rows[0].values.duracion, "5 min")
  assert.match(rows[0].values.timestamp, /^\d{2}:\d{2}:\d{2}$/)
})

test("asset reports do not duplicate ralenti sessions with generated pulse events", () => {
  const selectedAsset = {
    id: "asset-1",
    companyId: "company-1",
    patente: "IDL-001",
    nombrePantalla: "Activo ralenti",
    estado: "stopped",
  }
  const template = {
    reportTypeId: "idle-time",
    eventRuleIds: ["idle"],
    columns: ["patente", "duracion"],
  }
  const reportColumns = createReportColumns(template)
  const idleRule = {
    id: "idle",
    label: "Ralenti",
    active: true,
    conditions: [
      {
        field: "ignition",
        operator: "equals",
        value: "true",
      },
      {
        field: "speed",
        operator: "lessThanOrEqual",
        value: "3",
      },
    ],
  }
  const reportsByAssetId = new Map([
    [
      "asset-1",
      [
        {
          id: "idle-report",
          assetId: "asset-1",
          timestamp: "2026-06-25T12:00:00.000Z",
          speed: 0,
          ignition: true,
          estado: "stopped",
        },
        {
          id: "idle-report-2",
          assetId: "asset-1",
          timestamp: "2026-06-25T12:03:00.000Z",
          speed: 0,
          ignition: true,
          estado: "stopped",
        },
        {
          id: "stop-report",
          assetId: "asset-1",
          timestamp: "2026-06-25T12:05:00.000Z",
          speed: 0,
          ignition: false,
          estado: "stopped",
        },
      ],
    ],
  ])
  const generatedIdleEvents = [
    {
      id: "generated-idle-1",
      ruleId: "idle",
      ruleLabel: "Ralenti",
      assetId: "asset-1",
      timestamp: "2026-06-25T12:00:00.000Z",
      report: reportsByAssetId.get("asset-1")[0],
    },
    {
      id: "generated-idle-2",
      ruleId: "idle",
      ruleLabel: "Ralenti",
      assetId: "asset-1",
      timestamp: "2026-06-25T12:03:00.000Z",
      report: reportsByAssetId.get("asset-1")[1],
    },
  ]

  const rows = buildAssetReportRows({
    selectedAssets: [selectedAsset],
    reportColumns,
    companyNameById: new Map([["company-1", "Nodus"]]),
    dateFrom: "2026-06-25",
    dateTo: "2026-06-25",
    getReportsForAsset: (asset) => reportsByAssetId.get(asset.id) || [],
    getReportEventsForAsset: () => generatedIdleEvents,
    template,
    eventRulesById: new Map([["idle", idleRule]]),
  })

  assert.equal(rows.length, 1)
  assert.equal(rows[0].report.id, "idle-report")
  assert.equal(rows[0].values.duracion, "5 min")
})

test("asset reports derive ralenti from ignition and low speed without text labels", () => {
  const selectedAsset = {
    id: "asset-1",
    companyId: "company-1",
    patente: "IDL-002",
    nombrePantalla: "Activo ralenti calculado",
    estado: "stopped",
  }
  const template = {
    eventRuleIds: ["idle"],
    columns: ["patente", "vehiculo", "evento", "velocidad", "ignition"],
  }
  const reportColumns = createReportColumns(template)
  const reportsByAssetId = new Map([
    [
      "asset-1",
      [
        {
          id: "calculated-idle",
          assetId: "asset-1",
          timestamp: "2026-06-25T12:00:00.000Z",
          speed: 2,
          ignition: true,
          estado: "stopped",
          evento: "Reporte GPS",
        },
        {
          id: "engine-off-stop",
          assetId: "asset-1",
          timestamp: "2026-06-25T12:05:00.000Z",
          speed: 0,
          ignition: false,
          estado: "stopped",
          evento: "Reporte GPS",
        },
        {
          id: "moving-low",
          assetId: "asset-1",
          timestamp: "2026-06-25T12:10:00.000Z",
          speed: 8,
          ignition: true,
          estado: "moving",
          evento: "Reporte GPS",
        },
      ],
    ],
  ])

  const rows = buildAssetReportRows({
    selectedAssets: [selectedAsset],
    reportColumns,
    companyNameById: new Map([["company-1", "Nodus"]]),
    dateFrom: "2026-06-25",
    dateTo: "2026-06-25",
    getReportsForAsset: (asset) => reportsByAssetId.get(asset.id) || [],
    template,
    eventRulesById: new Map([
      [
        "idle",
        {
          id: "idle",
          label: "Ralenti",
          active: true,
          conditions: [
            {
              field: "ignition",
              operator: "equals",
              value: "true",
            },
            {
              field: "speed",
              operator: "lessThanOrEqual",
              value: "3",
            },
          ],
        },
      ],
    ]),
  })

  assert.equal(rows.length, 1)
  assert.equal(rows[0].report.id, "calculated-idle")
  assert.equal(rows[0].report.ignition, true)
  assert.equal(rows[0].values.patente, "IDL-002")
  assert.equal(rows[0].values.duracion, "5 min")
  assert.match(rows[0].values.timestamp, /^\d{2}:\d{2}:\d{2}$/)
})

test("asset reports keep explicit ralenti event duration for sparse events", () => {
  const selectedAsset = {
    id: "asset-1",
    companyId: "company-1",
    patente: "IDL-003",
    nombrePantalla: "Activo ralenti evento",
    estado: "stopped",
  }
  const template = {
    eventRuleIds: ["idle"],
    columns: ["patente", "duracion", "address"],
  }
  const reportColumns = createReportColumns(template)
  const reportsByAssetId = new Map([
    [
      "asset-1",
      [
        {
          id: "sparse-idle",
          assetId: "asset-1",
          timestamp: "2026-06-25T12:00:00.000Z",
          speed: 0,
          ignition: true,
          duracion: "18 min",
          address: "Av. Siempre Viva 123",
          evento: "Ralenti",
        },
      ],
    ],
  ])

  const rows = buildAssetReportRows({
    selectedAssets: [selectedAsset],
    reportColumns,
    companyNameById: new Map([["company-1", "Nodus"]]),
    dateFrom: "2026-06-25",
    dateTo: "2026-06-25",
    getReportsForAsset: (asset) => reportsByAssetId.get(asset.id) || [],
    template,
    eventRulesById: new Map([
      [
        "idle",
        {
          id: "idle",
          label: "Ralenti",
          active: true,
          conditions: [
            {
              field: "ignition",
              operator: "equals",
              value: "true",
            },
            {
              field: "speed",
              operator: "lessThanOrEqual",
              value: "3",
            },
          ],
        },
      ],
    ]),
  })

  assert.equal(rows.length, 1)
  assert.equal(rows[0].report.id, "sparse-idle")
  assert.equal(rows[0].values.patente, "IDL-003")
  assert.equal(rows[0].values.duracion, "18 min")
  assert.equal(rows[0].values.address, "Av. Siempre Viva 123")
})

test("asset reports do not treat normal satellite telemetry as a GPS signal event", () => {
  const selectedAsset = {
    id: "asset-1",
    companyId: "company-1",
    patente: "GPS-001",
    nombrePantalla: "Activo GPS",
    estado: "moving",
  }
  const template = {
    eventRuleIds: ["gpsSignal"],
    columns: ["patente", "vehiculo", "evento", "gpsSatellites", "gpsSignal"],
  }
  const reportColumns = createReportColumns(template)
  const reportsByAssetId = new Map([
    [
      "asset-1",
      [
        {
          id: "normal-gps",
          assetId: "asset-1",
          timestamp: "2026-06-25T12:00:00.000Z",
          speed: 30,
          satellites: 12,
          gpsSignal: 82,
          gpsFix: true,
        },
        {
          id: "signal-issue",
          assetId: "asset-1",
          timestamp: "2026-06-25T12:05:00.000Z",
          speed: 0,
          satellites: 2,
          gpsSignal: 20,
          gpsFix: false,
        },
      ],
    ],
  ])

  const rows = buildAssetReportRows({
    selectedAssets: [selectedAsset],
    reportColumns,
    companyNameById: new Map([["company-1", "Nodus"]]),
    dateFrom: "2026-06-25",
    dateTo: "2026-06-25",
    getReportsForAsset: (asset) => reportsByAssetId.get(asset.id) || [],
    template,
    eventRulesById: new Map([
      [
        "gpsSignal",
        {
          id: "gpsSignal",
          label: "Senal GPS",
          active: true,
          conditions: [
            {
              field: "satellites",
              operator: "lessThanOrEqual",
              value: "3",
            },
          ],
        },
      ],
    ]),
  })

  assert.equal(rows.length, 1)
  assert.equal(rows[0].report.id, "signal-issue")
  assert.equal(rows[0].values.gpsSatellites, "2 sat")
})

test("asset reports allow custom GPS satellite thresholds", () => {
  const selectedAsset = {
    id: "asset-1",
    companyId: "company-1",
    patente: "GPS-002",
    nombrePantalla: "Activo GPS",
    estado: "moving",
  }
  const template = {
    eventRuleIds: ["gpsSignal"],
    columns: ["patente", "vehiculo", "evento", "gpsSatellites", "gpsSignal"],
  }
  const reportColumns = createReportColumns(template)
  const reportsByAssetId = new Map([
    [
      "asset-1",
      [
        {
          id: "four-satellites",
          assetId: "asset-1",
          timestamp: "2026-06-25T12:00:00.000Z",
          speed: 30,
          satellites: 4,
          gpsSignal: 70,
          gpsFix: true,
        },
        {
          id: "healthy-gps",
          assetId: "asset-1",
          timestamp: "2026-06-25T12:05:00.000Z",
          speed: 30,
          satellites: 8,
          gpsSignal: 80,
          gpsFix: true,
        },
      ],
    ],
  ])

  const rows = buildAssetReportRows({
    selectedAssets: [selectedAsset],
    reportColumns,
    companyNameById: new Map([["company-1", "Nodus"]]),
    dateFrom: "2026-06-25",
    dateTo: "2026-06-25",
    getReportsForAsset: (asset) => reportsByAssetId.get(asset.id) || [],
    template,
    eventRulesById: new Map([
      [
        "gpsSignal",
        {
          id: "gpsSignal",
          label: "Senal GPS",
          active: true,
          conditions: [
            {
              field: "satellites",
              operator: "lessThanOrEqual",
              value: "5",
            },
          ],
        },
      ],
    ]),
  })

  assert.equal(rows.length, 1)
  assert.equal(rows[0].report.id, "four-satellites")
  assert.equal(rows[0].values.gpsSatellites, "4 sat")
})

test("asset reports ignore Sin alerta for the default alerts rule", () => {
  const selectedAsset = {
    id: "asset-1",
    companyId: "company-1",
    patente: "ALT-001",
    nombrePantalla: "Activo alerta",
    estado: "moving",
  }
  const template = {
    eventRuleIds: ["alerts"],
    columns: ["patente", "vehiculo", "evento", "alerta"],
  }
  const reportColumns = createReportColumns(template)
  const reportsByAssetId = new Map([
    [
      "asset-1",
      [
        {
          id: "without-alert",
          assetId: "asset-1",
          timestamp: "2026-06-25T12:00:00.000Z",
          speed: 30,
          alerta: "Sin alerta",
        },
        {
          id: "with-alert",
          assetId: "asset-1",
          timestamp: "2026-06-25T12:05:00.000Z",
          speed: 0,
          alerta: "Choque",
        },
      ],
    ],
  ])

  const rows = buildAssetReportRows({
    selectedAssets: [selectedAsset],
    reportColumns,
    companyNameById: new Map([["company-1", "Nodus"]]),
    dateFrom: "2026-06-25",
    dateTo: "2026-06-25",
    getReportsForAsset: (asset) => reportsByAssetId.get(asset.id) || [],
    template,
    eventRulesById: new Map([
      [
        "alerts",
        {
          id: "alerts",
          label: "Alertas",
          active: true,
          conditions: [
            {
              field: "alert",
              operator: "exists",
              value: "",
            },
          ],
        },
      ],
    ]),
  })

  assert.equal(rows.length, 1)
  assert.equal(rows[0].report.id, "with-alert")
  assert.equal(rows[0].values.alerta, "Choque")
})

test("asset reports filter dates using telemetry date labels without falling back to today", () => {
  const selectedAsset = {
    id: "asset-1",
    companyId: "company-1",
    patente: "DATE-001",
    nombrePantalla: "Activo fechas",
    estado: "moving",
  }
  const template = {
    eventRuleIds: ["movement"],
    columns: ["patente", "vehiculo", "evento", "velocidad"],
  }
  const reportColumns = createReportColumns(template)
  const reportsByAssetId = new Map([
    [
      "asset-1",
      [
        {
          id: "local-short-date",
          assetId: "asset-1",
          timestamp: "23-06-26 10:52:00 a. m.",
          speed: 25,
          lat: -33.44,
          lng: -70.66,
        },
        {
          id: "out-of-range",
          assetId: "asset-1",
          timestamp: "2026-06-24T10:52:00.000Z",
          speed: 25,
          lat: -33.45,
          lng: -70.67,
        },
      ],
    ],
  ])

  const rows = buildAssetReportRows({
    selectedAssets: [selectedAsset],
    reportColumns,
    companyNameById: new Map([["company-1", "Nodus"]]),
    dateFrom: "2026-06-23",
    dateTo: "2026-06-23",
    getReportsForAsset: (asset) => reportsByAssetId.get(asset.id) || [],
    template,
    eventRulesById: new Map([
      [
        "movement",
        {
          id: "movement",
          label: "Movimiento",
          active: true,
          conditions: [
            {
              field: "speed",
              operator: "greaterThan",
              value: "0",
            },
          ],
        },
      ],
    ]),
  })

  assert.equal(rows.length, 1)
  assert.equal(rows[0].report.id, "local-short-date")
  assert.equal(rows[0].values.fecha, "2026-06-23")
})

test("asset report Excel exports a dashboard and a complete data sheet", async () => {
  const zipModule = await import("jszip")
  const JSZip = zipModule.default || zipModule
  const reportColumns = createReportColumns({
    columns: ["patente", "vehiculo", "deviceId", "ultimoDato"],
  })
  const getValues = (deviceId, patent, vehicle) => ({
    ...Object.fromEntries(reportColumns.map((column) => [column.key, column.key])),
    deviceId,
    patente: patent,
    vehiculo: vehicle,
  })
  const buffer = await createAssetReportExcelBuffer({
    template: {
      name: "Reporte test",
    },
    reportColumns,
    reportRows: [
      {
        id: "row-1",
        asset: {
          estado: "moving",
          address: "Av. Exportacion 200",
        },
        values: getValues("DEV-200", "ZZ-99", "Camion Z"),
      },
      {
        id: "row-2",
        asset: {
          estado: "moving",
          address: "Av. Exportacion 100",
        },
        values: getValues("DEV-100", "AA-01", "Camion A"),
      },
    ],
    charts: {
      enabled: true,
      items: [
        {
          id: "chart-1",
          type: "bar",
          key: "canRpm",
          label: "RPM",
          unit: "rpm",
          decimals: 0,
          color: "#dc2626",
          labels: ["Activo 1"],
          values: [2150],
        },
      ],
    },
  })
  const zip = await JSZip.loadAsync(buffer)
  const workbookXml = await zip.file("xl/workbook.xml").async("string")
  const dashboardSheetXml = await zip.file("xl/worksheets/sheet1.xml").async("string")
  const detailSheetXml = await zip.file("xl/worksheets/sheet2.xml").async("string")
  const dataSheetXml = await zip.file("xl/worksheets/sheet5.xml").async("string")
  const chartXml = await zip.file("xl/charts/chart1.xml").async("string")
  const sharedStringsXml = await zip.file("xl/sharedStrings.xml").async("string")
  const excelModule = await import("exceljs")
  const ExcelJS = excelModule.default || excelModule
  const workbook = new ExcelJS.Workbook()

  await workbook.xlsx.load(buffer)

  const dataSheet = workbook.getWorksheet("Datos reporte")
  const deviceColumnIndex = reportColumns.findIndex((column) => column.key === "deviceId") + 1

  assert.match(workbookXml, /name="Reporte"/)
  assert.match(workbookXml, /name="Detalle GPS"/)
  assert.match(workbookXml, /name="Activos"/)
  assert.match(workbookXml, /name="DatosGraficos"/)
  assert.match(workbookXml, /name="Datos reporte"/)
  assert.doesNotMatch(dashboardSheetXml, /<autoFilter ref="A35:F35"/)
  assert.match(dashboardSheetXml, /<mergeCell ref="A35:C35"\/>/)
  assert.match(dashboardSheetXml, /<mergeCell ref="L35:M35"\/>/)
  assert.match(detailSheetXml, /<autoFilter ref="A5:F5"/)
  assert.match(dataSheetXml, /<autoFilter ref="A5:E5"/)
  assert.doesNotMatch(dashboardSheetXml, /<pane /)
  assert.match(chartXml, /<c:barChart>/)
  assert.match(sharedStringsXml, /Detalle GPS/)
  assert.match(sharedStringsXml, /Dispositivo/)
  assert.doesNotMatch(sharedStringsXml, /Direccion/)
  assert.doesNotMatch(sharedStringsXml, /Av\. Exportacion 100/)
  assert.doesNotMatch(sharedStringsXml, /Av\. Exportacion 200/)
  assert.doesNotMatch(sharedStringsXml, /Cons\. L\/h/)
  assert.doesNotMatch(sharedStringsXml, /Pres\. aceite/)
  assert.equal(dataSheet.getRow(6).getCell(deviceColumnIndex).value, "DEV-100")
  assert.equal(dataSheet.getRow(7).getCell(deviceColumnIndex).value, "DEV-200")
  assert.equal(dataSheet.getRow(6).getCell("E").value, "ultimoDato")
  assert.equal(dataSheet.getRow(7).getCell("E").value, "ultimoDato")
})

test("asset report Excel exports address only when the report includes the address column", async () => {
  const zipModule = await import("jszip")
  const JSZip = zipModule.default || zipModule
  const reportColumns = createReportColumns({
    columns: ["patente", "vehiculo", "deviceId", "address", "ultimoDato"],
  })
  const getValues = (deviceId, patent, vehicle, address) => ({
    ...Object.fromEntries(reportColumns.map((column) => [column.key, column.key])),
    address,
    deviceId,
    patente: patent,
    vehiculo: vehicle,
  })
  const buffer = await createAssetReportExcelBuffer({
    template: {
      name: "Reporte con direccion",
    },
    reportColumns,
    reportRows: [
      {
        id: "row-1",
        asset: {
          estado: "moving",
          address: "Av. Exportacion 200",
        },
        values: getValues("DEV-200", "ZZ-99", "Camion Z", "Av. Exportacion 200"),
      },
      {
        id: "row-2",
        asset: {
          estado: "moving",
          address: "Av. Exportacion 100",
        },
        values: getValues("DEV-100", "AA-01", "Camion A", "Av. Exportacion 100"),
      },
    ],
    charts: {
      enabled: false,
    },
  })
  const zip = await JSZip.loadAsync(buffer)
  const sharedStringsXml = await zip.file("xl/sharedStrings.xml").async("string")
  const excelModule = await import("exceljs")
  const ExcelJS = excelModule.default || excelModule
  const workbook = new ExcelJS.Workbook()

  await workbook.xlsx.load(buffer)

  const dataSheet = workbook.getWorksheet("Datos reporte")
  const addressColumnIndex = reportColumns.findIndex((column) => column.key === "address") + 1

  assert.match(sharedStringsXml, /Direccion/)
  assert.match(sharedStringsXml, /Av\. Exportacion 100/)
  assert.match(sharedStringsXml, /Av\. Exportacion 200/)
  assert.equal(dataSheet.getRow(6).getCell(addressColumnIndex).value, "Av. Exportacion 100")
  assert.equal(dataSheet.getRow(7).getCell(addressColumnIndex).value, "Av. Exportacion 200")
})

test("asset report PDF without charts keeps content below summary cards", async () => {
  const { jsPDF } = await import("jspdf")
  const originalAddImage = jsPDF.API.addImage
  const originalSave = jsPDF.API.save
  const originalText = jsPDF.API.text
  const textPlacements = []
  const reportColumns = createReportColumns({
    columns: ["patente", "vehiculo", "deviceId", "ultimoDato"],
  })
  const values = Object.fromEntries(reportColumns.map((column) => [column.key, column.key]))

  jsPDF.API.addImage = function addImage() {
    return this
  }

  jsPDF.API.text = function text(...args) {
    const [value, x, y] = args

    textPlacements.push({
      value: Array.isArray(value) ? value.join(" ") : String(value),
      x,
      y,
    })

    if (typeof originalText === "function") {
      return originalText.apply(this, args)
    }

    return this
  }

  jsPDF.API.save = function save() {
    return this
  }

  try {
    await exportAssetReportPdf({
      template: {
        name: "Reporte test",
        description: "Reporte sin graficos",
      },
      reportColumns,
      reportRows: [
        {
          id: "row-1",
          asset: {
            estado: "moving",
          },
          values: {
            ...values,
            patente: "CNRT-10",
            vehiculo: "Camion tolva",
            deviceId: "868123450010",
            ultimoDato: "10:52:28",
          },
        },
      ],
      charts: {
        enabled: false,
      },
    })
  } finally {
    jsPDF.API.addImage = originalAddImage
    jsPDF.API.text = originalText
    jsPDF.API.save = originalSave
  }

  assert.ok(
    textPlacements.some((placement) => {
      return placement.value === "Activos incluidos" && placement.y >= 80
    }),
  )
})
