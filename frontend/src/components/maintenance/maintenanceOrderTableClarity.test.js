import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { parse, compileScript, compileTemplate } from "@vue/compiler-sfc"

test("orders shows operational KPI and fixed columns without duplicating maintenance under plate", () => {
  const source = readFileSync(new URL("./MaintenanceWorkOrdersTab.vue", import.meta.url), "utf8")
  assert.doesNotMatch(source, /order.type|Estimado:|getCostDeviation|metric.detail/)
  assert.match(source, /<th>Costo real<\/th>/)
  assert.doesNotMatch(source, /showPriority|orders-column-menu|closeColumnsOnBlur/)
  assert.match(source, /<th>Prioridad<\/th>/)
  assert.match(source, /getPriorityClass\(order.priority\)/)
  assert.match(source, /class="expand-table-button"/)
  const metrics = source.slice(source.indexOf("const summaryMetrics"), source.indexOf("const getDeadlineStatus"))
  for (const label of ["OT abiertas", "OT vencidas", "En ejecucion", "En espera"]) assert.ok(metrics.includes(label))
  assert.doesNotMatch(metrics, /Tiempo promedio|Cumplimiento|Costo real/)
})

test("analysis retains performance metrics for finished orders in selected period and compiles", () => {
  const filename = new URL("./MaintenanceCostsTab.vue", import.meta.url)
  const source = readFileSync(filename, "utf8")
  const { descriptor } = parse(source)
  const script = compileScript(descriptor, { id: "analysis-results" })
  const template = compileTemplate({ source: descriptor.template.content, filename: filename.pathname, id: "analysis-results", compilerOptions: { bindingMetadata: script.bindings } })
  assert.deepEqual(template.errors, [])
  assert.match(source, /Resultados de OT finalizadas en el periodo/)
  assert.match(source, /order.status === "finished" && closed && closed >= periodStart.value && closed <= now/)
  assert.match(source, /summarizeMaintenanceOrders/)
})
