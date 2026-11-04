import test from "node:test"
import assert from "node:assert/strict"
import {
  createReportLimitsContext,
  getIdleFuelAmounts,
  readLastFuelPrice,
  fuelPriceStorageKey,
} from "./reportLimitsContext.js"
import { limitsStorageKey } from "../../layout/limitsConfiguration.js"
import { buildAssetReportRows, createReportColumns } from "./assetReportExecutionUtils.js"

const rules = new Map([
  [
    "speeding",
    {
      id: "speeding",
      label: "Exceso de velocidad",
      active: true,
      conditions: [{ field: "speed", operator: "greaterThan", value: "80" }],
    },
  ],
  [
    "idle",
    {
      id: "idle",
      label: "Ralenti",
      active: true,
      conditions: [
        { field: "ignition", operator: "equals", value: "true" },
        { field: "speed", operator: "lessThanOrEqual", value: "3" },
      ],
    },
  ],
])
const base = { id: "one", companyId: "company", assetType: "bus", patente: "TEST" }
function run(asset, ruleId, report, columns) {
  const template = { eventRuleIds: [ruleId], columns }
  return buildAssetReportRows({
    selectedAssets: [asset],
    template,
    reportColumns: createReportColumns(template),
    companyNameById: new Map(),
    dateFrom: "2026-06-25",
    dateTo: "2026-06-25",
    eventRulesById: rules,
    getReportsForAsset: () => [{ id: "sample", timestamp: "2026-06-25T12:00:00Z", ...report }],
  })
}

test("report snapshot resolves company, platform and defaults without repeated storage parsing", () => {
  const data = new Map([
    [limitsStorageKey(), JSON.stringify({ speed: { bus: 110 }, idle: { bus: 4 } })],
    [limitsStorageKey("company"), JSON.stringify({ speed: { bus: 90 }, idle: { bus: 0 } })],
    [fuelPriceStorageKey("company"), JSON.stringify({ price: 1548, date: "2026-10-08" })],
  ])
  let reads = 0
  const prepare = createReportLimitsContext({
    read: (key) => {
      reads++
      return data.get(key) ?? null
    },
  })
  const configured = prepare(base)
  assert.equal(configured.configuredSpeedLimit, 90)
  assert.equal(configured.configuredIdleConsumption, 0)
  assert.equal(configured.reportFuelPrice, 1548)
  const before = reads
  for (let index = 0; index < 100; index++) prepare(base)
  assert.equal(reads, before)
  assert.equal(prepare({ ...base, companyId: "other" }).configuredSpeedLimit, 110)
  assert.equal(base.configuredSpeedLimit, undefined)
})

test("speed reports use saved limits, explicit run override and exclude vehicles without type", () => {
  const read = (key) =>
    key === limitsStorageKey("company") ? JSON.stringify({ speed: { bus: 40 }, idle: {} }) : null
  const prepare = createReportLimitsContext({ read })
  const columns = ["patente", "speedLimit", "speedingDelta"]
  const rows = run(prepare(base), "speeding", { speed: 55, speedLimit: 80 }, columns)
  assert.equal(rows.length, 1)
  assert.equal(rows[0].values.speedLimit, "40 km/h")
  assert.equal(rows[0].values.speedingDelta, "+15 km/h")
  const override = createReportLimitsContext({ read, manualSpeedLimit: 60 })
  assert.equal(run(override(base), "speeding", { speed: 55 }, columns).length, 0)
  assert.equal(
    run(prepare({ ...base, assetType: "" }), "speeding", { speed: 150 }, columns).length,
    0,
  )
})

test("idle reports compute liters and pesos from session duration and configured consumption", () => {
  const prepare = createReportLimitsContext({ read: () => null, fuelPrice: 1548 })
  const rows = run(prepare(base), "idle", { speed: 0, ignition: true, duracion: "1 h 30 min" }, [
    "patente",
    "idleFuelLiters",
    "idleFuelCost",
  ])
  assert.equal(rows.length, 1)
  assert.equal(rows[0].values.idleFuelLiters, "5,24 L")
  assert.match(rows[0].values.idleFuelCost, /8.104/)
  assert.deepEqual(
    getIdleFuelAmounts({
      report: { durationMs: 3600000 },
      asset: { configuredIdleConsumption: 0, reportFuelPrice: 1548 },
    }),
    { liters: 0, cost: 0 },
  )
  assert.deepEqual(getIdleFuelAmounts({ report: {}, asset: prepare(base) }), {
    liters: null,
    cost: null,
  })
})

test("last fuel price is company-scoped and corrupt limits abort instead of silently using defaults", () => {
  const data = new Map([
    [fuelPriceStorageKey("one"), JSON.stringify({ price: 1548, date: "2026-10-08" })],
  ])
  const read = (key) => data.get(key) ?? null
  assert.equal(readLastFuelPrice(read, "one").price, 1548)
  assert.equal(readLastFuelPrice(read, "other"), null)
  data.set(limitsStorageKey(), "bad")
  assert.throws(() => createReportLimitsContext({ read }))
})
