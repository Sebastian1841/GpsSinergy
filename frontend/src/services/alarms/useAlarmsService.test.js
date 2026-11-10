import assert from "node:assert/strict"
import test from "node:test"
import { readFileSync } from "node:fs"
import { ref, watch } from "vue"

test("failed alarm writes publish nothing; create, resolve, reopen and batch retry safely", async (context) => {
  const previousWindow = globalThis.window
  context.after(() => {
    if (previousWindow === undefined) delete globalThis.window
    else globalThis.window = previousWindow
  })
  const storage = new Map()
  let failing = false
  let writes = 0
  globalThis.window = {
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => {
        if (failing) throw Error("quota")
        writes++
        storage.set(key, value)
      },
    },
    addEventListener() {},
  }
  const { useAlarmsService, ALARMS_STORAGE_KEY } =
    await import("./useAlarmsService.js?confirmed-write")
  const service = useAlarmsService()
  let publications = 0
  const stop = watch(service.alarms, () => publications++, { flush: "sync" })
  context.after(stop)
  const [a, b] = service.alarms.value
  for (const action of [
    () => service.createAlarm({ id: "created", title: "Nueva" }),
    () => service.updateAlarm(a.id, { title: "Cambio" }),
    () => service.resolveAlarm(a.id, "Operador"),
    () => service.reopenAlarm(a.id),
    () =>
      service.updateAlarms([
        { id: a.id, changes: { status: "resolved" } },
        { id: b.id, changes: { status: "resolved" } },
      ]),
  ]) {
    failing = true
    const before = JSON.stringify(service.alarms.value)
    const storedBefore = storage.get(ALARMS_STORAGE_KEY)
    const publishedBefore = publications
    assert.equal(action(), null)
    assert.match(service.alarmsWriteError.value, /No se pudo guardar/)
    assert.equal(JSON.stringify(service.alarms.value), before)
    assert.equal(storage.get(ALARMS_STORAGE_KEY), storedBefore)
    assert.equal(publications, publishedBefore)
    failing = false
    const writesBefore = writes
    assert.ok(action())
    assert.equal(writes, writesBefore + 1)
    assert.equal(publications, publishedBefore + 1)
    assert.equal(service.alarmsWriteError.value, "")
    assert.equal(storage.get(ALARMS_STORAGE_KEY), JSON.stringify(service.alarms.value))
  }
  const before = JSON.stringify(service.alarms.value)
  const writesBefore = writes
  assert.equal(
    service.updateAlarms([
      { id: a.id, changes: { status: "open" } },
      { id: "missing", changes: { status: "open" } },
    ]),
    null,
  )
  assert.equal(JSON.stringify(service.alarms.value), before)
  assert.equal(writes, writesBefore)
})

test("failed attention preserves selection and does not record audit or success", () => {
  const source = readFileSync(new URL("../../views/AlarmsView.vue", import.meta.url), "utf8")
  const handler = source.slice(
    source.indexOf("const handleAttention ="),
    source.indexOf("const handleReopenAlarm ="),
  )
  const selectedAlarmId = ref("a")
  const selectedGroupKeys = ref(["group-a"])
  const attentionMode = ref("single")
  const feedbackMessage = ref("Anterior")
  const unexpected = () => assert.fail("No success, audit or closing on failed write")
  new Function(
    "canManageAlarms",
    "attentionMode",
    "selectedAlarmId",
    "attentionIsUnchanged",
    "attentionTargets",
    "currentActorName",
    "buildAttentionUpdate",
    "updateAlarms",
    "recordAlarmAudit",
    "cancelAttention",
    "selectedGroupKeys",
    "showFeedback",
    "feedbackMessage",
    `${handler}; handleAttention({ id: 'a', action: 'real', note: 'Conservar' })`,
  )(
    ref(true),
    attentionMode,
    selectedAlarmId,
    () => true,
    ref([{ id: "a" }]),
    ref("Operador"),
    () => ({ metadata: { attention: { label: "Real", note: "Conservar" } } }),
    () => null,
    unexpected,
    unexpected,
    selectedGroupKeys,
    unexpected,
    feedbackMessage,
  )
  assert.equal(attentionMode.value, "single")
  assert.equal(selectedAlarmId.value, "a")
  assert.deepEqual(selectedGroupKeys.value, ["group-a"])
  assert.equal(feedbackMessage.value, "")
  const form = readFileSync(
    new URL("../../components/alarms/AlarmAttentionForm.vue", import.meta.url),
    "utf8",
  )
  const submit = form.slice(form.indexOf("const submit ="))
  assert.doesNotMatch(submit, /(?:action|note)\.value\s*=/)
})

test("reopening writes status and attention together and does not audit a failed batch", () => {
  const source = readFileSync(new URL("../../views/AlarmsView.vue", import.meta.url), "utf8")
  const start = source.indexOf("const handleReopenAlarm =")
  const handler = source.slice(start, source.indexOf("\nwatch(", start))
  let calls = 0
  const unexpected = () => assert.fail("No success or audit on failed reopen")
  new Function(
    "canManageAlarms",
    "visibleRows",
    "feedbackMessage",
    "currentActorName",
    "updateAlarms",
    "recordAlarmAudit",
    "showFeedback",
    `${handler}; handleReopenAlarm('a')`,
  )(
    ref(true),
    ref([{ id: "a", groupMembers: [{ id: "a", metadata: { attention: { note: "old" } } }] }]),
    ref(""),
    ref("Operador"),
    (updates) => {
      calls++
      assert.equal(updates[0].changes.status, "open")
      assert.equal(updates[0].changes.resolvedAt, null)
      assert.equal(updates[0].changes.metadata.attention, null)
      assert.equal(updates[0].changes.metadata.attentionHistory.length, 1)
      return null
    },
    unexpected,
    unexpected,
  )
  assert.equal(calls, 1)
})
