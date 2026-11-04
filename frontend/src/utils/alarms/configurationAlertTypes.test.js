import test from "node:test"
import assert from "node:assert/strict"
import { ref } from "vue"
import {
  CONFIGURATION_ALERT_TYPES,
  EPISODE_PRESETS,
  episodeCondition,
  episodeConditionError,
} from "./configurationAlertTypes.js"
import {
  normalizeAutomaticAlertRule,
  getAutomaticAlertConditionLabel,
} from "./automaticAlertRuleUtils.js"
import {
  createInitialAlarmRuleDraft,
  useAlarmRuleDraft,
} from "../../composables/alarms/useAlarmRuleDraft.js"

test("configuration exposes exactly the ten reference types without replacing legacy ids", () => {
  assert.deepEqual(
    CONFIGURATION_ALERT_TYPES.map((option) => option.id),
    [
      "speeding",
      "idle",
      "temperature",
      "fuel_load",
      "fuel",
      "geofence",
      "door_open",
      "no_signal",
      "ignition_event",
      "signal",
    ],
  )
  assert.equal(normalizeAutomaticAlertRule({ type: "battery" }).type, "battery")
  assert.equal(normalizeAutomaticAlertRule({ type: "ignition" }).schedule.type, "custom")
  assert.equal(normalizeAutomaticAlertRule({ type: "ignition_event" }).schedule.type, "always")
})

test("five upcoming types are blocked while the other five remain available", () => {
  const disabled = CONFIGURATION_ALERT_TYPES.filter((option) => option.disabled)
  assert.deepEqual(
    disabled.map((option) => option.id),
    ["idle", "temperature", "geofence", "door_open", "ignition_event"],
  )
  assert.ok(disabled.every((option) => option.status === "Pr\u00f3ximamente"))
  assert.equal(CONFIGURATION_ALERT_TYPES.filter((option) => !option.disabled).length, 5)
})

test("each new episode type keeps its specific fields through draft serialization and normalization", () => {
  for (const type of Object.keys(EPISODE_PRESETS)) {
    const condition = episodeCondition(type)
    assert.equal(episodeConditionError(type, condition), "")
    const rule = normalizeAutomaticAlertRule({
      name: "Regla " + type,
      companyId: "company-001",
      type,
      condition,
      enabled: false,
    })
    const draft = ref(rule)
    const editor = useAlarmRuleDraft({
      draft,
      batteryConditionOptions: [],
      fallbackCompanyId: ref("company-001"),
      getSelectedGeofenceNames: () => [],
      selectedDraftAssetIds: ref([]),
      selectedDraftGeofenceGroup: ref(null),
      selectedDraftGeofenceIds: ref([]),
    })
    assert.deepEqual(
      normalizeAutomaticAlertRule(editor.getDraftPayload()).condition,
      condition,
      type,
    )
    assert.ok(getAutomaticAlertConditionLabel(rule).length > 0, type)
  }
})

test("temperature, duration and signal values validate without rejecting digital zero", () => {
  assert.notEqual(
    episodeConditionError("temperature", {
      field: "temperature",
      lower: 10,
      upper: 5,
      durationSeconds: 30,
    }),
    "",
  )
  assert.notEqual(
    episodeConditionError("signal", { field: "", value: 10, durationSeconds: 30 }),
    "",
  )
  assert.notEqual(episodeConditionError("fuel_load", { value: 0, windowMinutes: 15 }), "")
  assert.equal(episodeCondition("door_open", { value: 0 }).value, 0)
  assert.equal(episodeCondition("ignition_event", { value: "Apagado" }).value, "Apagado")
  assert.equal(
    episodeCondition("signal", { source: "calculated", field: "miVariable", value: 2 }).source,
    "calculated",
  )
})

test("new presets are initialized when switching type, without retaining speed fields", () => {
  const draft = ref(createInitialAlarmRuleDraft({ companyId: "company-001" }))
  const editor = useAlarmRuleDraft({
    draft,
    batteryConditionOptions: [],
    fallbackCompanyId: ref("company-001"),
    getSelectedGeofenceNames: () => [],
    selectedDraftAssetIds: ref([]),
    selectedDraftGeofenceGroup: ref(null),
    selectedDraftGeofenceIds: ref([]),
  })
  draft.value.type = "idle"
  editor.applyTypePreset()
  assert.equal(draft.value.condition.engineState, "on")
  assert.equal(draft.value.condition.stationaryOnly, true)
  assert.equal(draft.value.condition.limitSource, undefined)
})
