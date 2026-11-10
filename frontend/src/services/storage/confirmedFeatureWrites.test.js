import assert from "node:assert/strict"
import test from "node:test"
import { readFileSync } from "node:fs"
import { ref } from "vue"
import { useGeofences } from "../../composables/activos/geocercas/useGeofences.js"
import {
  resetWorkspacesForTest,
  useWorkspaces,
} from "../../composables/workspaces/useWorkspaces.js"
import { writeJsonStorageBatch } from "./browserStorage.js"

const setup = (context) => {
  const previous = globalThis.window
  const values = new Map()
  let failKey = ""
  globalThis.window = {
    addEventListener() {},
    localStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => {
        if (failKey && key.includes(failKey)) throw Error("quota")
        values.set(key, value)
      },
      removeItem: (key) => values.delete(key),
    },
  }
  context.after(() => {
    resetWorkspacesForTest()
    if (previous === undefined) delete globalThis.window
    else globalThis.window = previous
  })
  return {
    values,
    fail: (key) => {
      failKey = key
    },
  }
}

test("workspace form retains its fields until the parent confirms saving", () => {
  const source = readFileSync(
    new URL("../../components/Layout/WorkspaceSelector.vue", import.meta.url),
    "utf8",
  )
  const handler = source.slice(
    source.indexOf("const submitForm ="),
    source.indexOf("const handleDeleteClick ="),
  )
  const mode = ref("form")
  let cleared = false
  let acknowledge
  new Function(
    "normalizedFormName",
    "formMode",
    "formSharedUserIds",
    "editingWorkspaceId",
    "emit",
    "resetForm",
    "panelMode",
    `${handler}; submitForm()`,
  )(
    ref("Draft"),
    ref("create"),
    ref(["user"]),
    ref(null),
    (_event, payload, confirm) => {
      assert.equal(payload.name, "Draft")
      acknowledge = confirm
    },
    () => {
      cleared = true
    },
    mode,
  )
  acknowledge(false)
  assert.equal(cleared, false)
  assert.equal(mode.value, "form")
  acknowledge(true)
  assert.equal(cleared, true)
  assert.equal(mode.value, "menu")
})

test("report consumers keep failed template saves open and geofence drafts wait for acknowledgement", () => {
  for (const path of [
    "../../views/ReportsView.vue",
    "../../components/activos/fleet/FleetReportsPanel.vue",
  ]) {
    const source = readFileSync(new URL(path, import.meta.url), "utf8")
    assert.match(source, /if \(!savedTemplate\) return/)
    assert.match(source, /:save-error="templatesWriteError"/)
  }
  const map = readFileSync(
    new URL("../../composables/activos/map/geofences/useMapGeofences.js", import.meta.url),
    "utf8",
  )
  const handler = map.slice(
    map.indexOf("const saveEditing ="),
    map.indexOf("const startPolygonDraw ="),
  )
  let acknowledge
  let stopped = false
  new Function("props", "editingDraft", "editing", "stopEditing", `${handler}; saveEditing()`)(
    { canEditGeofences: true },
    ref({ id: "draft" }),
    {
      emitUpdatedGeofence: (callback) => {
        acknowledge = callback
      },
    },
    () => {
      stopped = true
    },
  )
  acknowledge(false)
  assert.equal(stopped, false)
  acknowledge(true)
  assert.equal(stopped, true)
})

test("related-key failure rolls back an earlier write without publishing success", (t) => {
  const { values, fail } = setup(t)
  values.set("first", '"old"')
  fail("second")
  assert.equal(
    writeJsonStorageBatch([
      ["first", "new"],
      ["second", "other"],
    ]),
    false,
  )
  assert.equal(values.get("first"), '"old"')
  assert.equal(values.has("second"), false)
  fail("")
  assert.equal(
    writeJsonStorageBatch([
      ["first", "new"],
      ["second", "other"],
    ]),
    true,
  )
})

test("confirmed default-template deletions remain deleted when the saved catalog is empty", async (t) => {
  setup(t)
  const { useReportTemplates } =
    await import("../../composables/reports/useReportTemplates.js?delete-all-confirmed")
  const service = useReportTemplates()
  for (const template of [...service.reportTemplates.value])
    assert.equal(service.deleteReportTemplate(template.id), true)
  assert.deepEqual(service.reportTemplates.value, [])
  const reloaded =
    await import("../../composables/reports/useReportTemplates.js?delete-all-reloaded")
  assert.deepEqual(reloaded.useReportTemplates().reportTemplates.value, [])
})

const circle = (id, groupName = "") => ({
  id,
  name: id,
  type: "circle",
  center: { lat: -33, lng: -70 },
  radius: 100,
  groupName,
})

test("all geofence mutations keep committed records and groups unchanged on failure", (t) => {
  const { values, fail } = setup(t)
  const service = useGeofences({ companyId: "A" })
  assert.equal(values.size, 0)
  service.createGeofence(circle("existing", "Group"))
  const group = service.createGeofenceGroup("Group")
  const operations = [
    () => service.createGeofence(circle("new")),
    () => service.updateGeofence({ id: "existing", name: "Edited" }),
    () => service.createGeofenceGroup("New group"),
    () => service.renameGeofenceGroup({ groupIdOrName: group.id, name: "Changed" }),
    () => service.importGeofences([circle("import")]),
    () => service.deleteGeofence("existing"),
    () => service.deleteGeofenceGroup(group.id),
    () => service.clearGeofences(),
  ]
  for (const operation of operations) {
    const before = JSON.stringify([service.geofences.value, service.geofenceGroups.value])
    const stored = values.get("sinergy-activos-geofences")
    fail("sinergy-activos-geofences")
    const result = operation()
    assert.ok(result === null || result === false || (Array.isArray(result) && !result.length))
    assert.equal(JSON.stringify([service.geofences.value, service.geofenceGroups.value]), before)
    assert.equal(values.get("sinergy-activos-geofences"), stored)
    assert.match(service.geofenceWriteError.value, /guardar/)
  }
  fail("")
  assert.equal(service.updateGeofence({ id: "existing", name: "Retry" }).name, "Retry")
  assert.equal(service.geofenceWriteError.value, "")
})

test("workspaces preserve record, active selection and audit on failed writes", (t) => {
  const { values, fail } = setup(t)
  resetWorkspacesForTest()
  const service = useWorkspaces({ userId: ref("operator"), currentRoutePath: ref("/activos") })
  const original = service.activeWorkspaceId.value
  const second = service.createWorkspace({ name: "Second" })
  const operations = [
    () => service.createWorkspace({ name: "New" }),
    () => service.renameWorkspace(second.id, "Renamed", ["other"]),
    () => service.shareWorkspace(second.id, ["other"]),
    () => service.saveCurrentWorkspaceView(),
    () => service.deleteWorkspace(second.id),
  ]
  for (const operation of operations) {
    const before = JSON.stringify(service.workspaces.value)
    const stored = new Map(values)
    fail("sinergy-active-workspace")
    assert.equal(operation(), null)
    assert.equal(JSON.stringify(service.workspaces.value), before)
    assert.deepEqual(values, stored)
    assert.equal(service.activeWorkspaceId.value, second.id)
    assert.match(service.workspaceWriteError.value, /guardar/)
  }
  assert.equal(service.selectWorkspace(original), null)
  assert.equal(service.activeWorkspaceId.value, second.id)
  fail("")
  assert.ok(service.renameWorkspace(second.id, "Retry", ["other"]))
  assert.equal(service.workspaceWriteError.value, "")
})

test("report templates and rules publish only confirmed writes, including default deletion", async (t) => {
  const { values, fail } = setup(t)
  const { useReportTemplates } =
    await import("../../composables/reports/useReportTemplates.js?confirmed-writes")
  const templates = useReportTemplates()
  const first = templates.reportTemplates.value[0]
  const operations = [
    () => templates.createReportTemplate({ name: "New", eventRuleIds: first.eventRuleIds }),
    () => templates.updateReportTemplate(first.id, { name: "Edited" }),
    () => templates.deleteReportTemplate(first.id),
  ]
  for (const operation of operations) {
    const before = JSON.stringify(templates.reportTemplates.value)
    const stored = new Map(values)
    fail("sinergy-report-templates")
    assert.ok(!operation())
    assert.equal(JSON.stringify(templates.reportTemplates.value), before)
    assert.deepEqual(values, stored)
    assert.match(templates.templatesWriteError.value, /guardar/)
  }
  fail("")
  assert.ok(templates.updateReportTemplate(first.id, { name: "Retry" }))
  assert.equal(templates.templatesWriteError.value, "")
  const { useReportEventRules } =
    await import("../../composables/reports/useReportEventRules.js?confirmed-writes")
  const rules = useReportEventRules()
  const custom = rules.createEventRule({ label: "Custom" })
  for (const operation of [
    () => rules.createEventRule({ label: "New" }),
    () => rules.updateEventRule(custom.id, { label: "Edited" }),
    () => rules.deleteEventRule(custom.id),
    () => rules.resetEventRules(),
  ]) {
    const before = JSON.stringify(rules.reportEventRules.value)
    const stored = new Map(values)
    fail("sinergy-report-event-rules")
    assert.ok(!operation())
    assert.equal(JSON.stringify(rules.reportEventRules.value), before)
    assert.deepEqual(values, stored)
    assert.match(rules.rulesWriteError.value, /guardar/)
  }
  fail("")
  assert.ok(rules.updateEventRule(custom.id, { label: "Retry" }))
  assert.equal(rules.rulesWriteError.value, "")
})
