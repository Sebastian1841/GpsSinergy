import test from "node:test"
import assert from "node:assert/strict"
import { reactive } from "vue"
import {
  unreportedWorkerSnapshot,
  runUnreportedExcelWorker,
} from "./unreportedExcelWorkerClient.js"
import { buildUnreportedExcelBuffer } from "./unreportedExcelWorker.js"

test("worker payload strips nested Vue proxies without changing optional fields", () => {
  const rows = reactive([
    { imei: "00123", interruptions: [{ telemetry: { externalVoltage: 0 } }], missing: undefined },
  ])
  const snapshot = structuredClone(unreportedWorkerSnapshot(rows))
  assert.equal(snapshot[0].imei, "00123")
  assert.equal(snapshot[0].interruptions[0].telemetry.externalVoltage, 0)
  assert.ok("missing" in snapshot[0])
})

test("worker client transfers result and terminates on success and failures", async () => {
  for (const mode of ["success", "reported", "runtime", "message", "clone"]) {
    let terminated = 0
    const buffer = new ArrayBuffer(8)
    const worker = {
      terminate() {
        terminated++
      },
      postMessage() {
        if (mode === "clone") throw new Error("clone failed")
        if (mode === "runtime") return this.onerror()
        if (mode === "message") return this.onmessageerror()
        this.onmessage({ data: mode === "reported" ? { error: "failed" } : { buffer } })
      },
    }
    const result = runUnreportedExcelWorker(worker, {})
    if (mode === "success") assert.equal(await result, buffer)
    else await assert.rejects(result)
    assert.equal(terminated, 1)
  }
})

test("worker buffer is a readable workbook with all sheets and bounded report columns", async () => {
  const buffer = await buildUnreportedExcelBuffer({
    rows: [{ name: "Equipo", imei: "00123", interruptions: [], consultations: [] }],
    options: { history: true, brandImage: "", observedAt: "2026-10-16T12:00:00Z" },
  })
  assert.ok(buffer instanceof ArrayBuffer)
  const module = await import("exceljs")
  const workbook = new (module.default || module).Workbook()
  await workbook.xlsx.load(buffer)
  assert.equal(workbook.worksheets.length, 3)
  assert.equal(workbook.getWorksheet("Resumen de equipos").getCell("B2").value, "00123")
  assert.ok(workbook.getWorksheet("Reporte").columnCount <= 13)
})
