import test from "node:test"
import assert from "node:assert/strict"
import { shallowRef } from "vue"
import { useUnreportedHistoryPresentation } from "./useUnreportedHistoryPresentation.js"

const episode = (id) => ({
  id,
  lastReportAt: "2026-10-01T12:00:00Z",
  recoveredAt: "2026-10-02T12:00:00Z",
})
const call = (id, interruptionId) => ({
  id,
  interruptionId,
  createdAt: "2026-10-01T13:00:00Z",
  author: "Ana",
  observation: "En taller",
})

test("summaries are cached and closed episodes do not read calls", () => {
  let reads = 0
  const equipment = {
    get consultations() {
      reads++
      return [call("c1", "a"), call("c2", "b")]
    },
  }
  const rows = useUnreportedHistoryPresentation(
    shallowRef([episode("a"), episode("b")]),
    () => equipment,
  )
  const first = rows.value[0]
  assert.equal(first.open, false)
  assert.equal(first.diagnosis.reason, "Diagnostico no registrado")
  assert.equal(reads, 0)
  first.open = true
  assert.deepEqual(
    first.calls.map((item) => item.id),
    ["c1"],
  )
  const afterOpen = reads
  assert.ok(afterOpen > 0)
  assert.equal(first.calls[0].observation, "En taller")
  first.open = false
  first.open = true
  assert.equal(first.calls.length, 1)
  assert.equal(reads, afterOpen)
  assert.equal(rows.value[0], first)
})

test("calls update without rebuilding summaries or borrowing another episode's calls", () => {
  const equipment = shallowRef({ consultations: [call("c1", "a")] })
  const rows = useUnreportedHistoryPresentation(shallowRef([episode("a")]), equipment)
  const first = rows.value[0]
  first.open = true
  assert.equal(first.calls.length, 1)
  equipment.value = {
    consultations: [...equipment.value.consultations, call("c2", "a"), call("c3", "b")],
  }
  assert.equal(rows.value[0], first)
  assert.equal(first.open, true)
  assert.deepEqual(
    first.calls.map((item) => item.id),
    ["c1", "c2"],
  )
})

test("paging replaces presentation rows and leaves new dropdowns closed", () => {
  const visible = shallowRef([episode("a")])
  const rows = useUnreportedHistoryPresentation(visible, () => ({ consultations: [] }))
  rows.value[0].open = true
  visible.value = [episode("b")]
  assert.equal(rows.value[0].id, "b")
  assert.equal(rows.value[0].open, false)
  assert.deepEqual(rows.value[0].readings, [])
  assert.equal(rows.value[0].durationLabel, "1 dias 0 h")
})
test("first report displays unknown start instead of a fabricated date or duration", () => {
  const rows = useUnreportedHistoryPresentation(
    shallowRef([
      {
        id: "first",
        kind: "first_report",
        lastReportAt: null,
        recoveredAt: "2026-10-19T12:00:00Z",
      },
    ]),
    () => ({ consultations: [] }),
  )
  assert.equal(rows.value[0].startLabel, "Sin reporte previo")
  assert.equal(rows.value[0].durationLabel, "Inicio desconocido")
  assert.equal(rows.value[0].diagnosis.reason, "Primer reporte recibido")
})
