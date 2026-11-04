import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { parse, compileScript, compileTemplate } from "@vue/compiler-sfc"
import { ref } from "vue"
import {
  LIMIT_TYPES,
  limitAssetType,
  limitsStorageKey,
  readLimitsConfiguration,
  saveLimit,
  saveLimitsConfiguration,
} from "./limitsConfiguration.js"

test("limits layout preserves navigation, explicit saving and edit permissions", () => {
  const { descriptor } = parse(
    readFileSync(new URL("../../views/ConfigurationLimitsView.vue", import.meta.url), "utf8"),
  )
  const script = compileScript(descriptor, { id: "limits" })
  const compiled = compileTemplate({
    source: descriptor.template.content,
    filename: "ConfigurationLimitsView.vue",
    id: "limits",
    compilerOptions: { bindingMetadata: script.bindings },
  })
  assert.deepEqual(compiled.errors, [])
  assert.match(
    descriptor.scriptSetup.content,
    /canAccessFunction\("configuration-limits", companyId.value, "edit"\)/,
  )
  assert.match(descriptor.scriptSetup.content, /const speedTypes = LIMIT_TYPES\s/)
  assert.doesNotMatch(descriptor.scriptSetup.content, /LIMIT_TYPES.slice/)
  assert.match(descriptor.template.content, /v-for="mode in modes"/)
  assert.doesNotMatch(descriptor.template.content, /limits-heading|limits-navigation/)
  assert.doesNotMatch(descriptor.template.content, /<aside|Ir a ficha|untyped/)
  assert.match(descriptor.template.content, /role="tabpanel"/)
  assert.match(descriptor.template.content, /Guardar cambios/)
  assert.match(descriptor.template.content, /Restablecer valores/)
  assert.match(descriptor.template.content, /class="limits-editor-layout"/)
  assert.match(descriptor.template.content, /@click="selectedId = type.id"/)
  assert.match(descriptor.scriptSetup.content, /saveLimitsConfiguration/)
  assert.match(descriptor.template.content, /@click="save"/)
  assert.doesNotMatch(descriptor.template.content, /<dialog|Ver vehículos|Cambio sin guardar/)
  assert.doesNotMatch(descriptor.scriptSetup.content, /Valor de fábrica|reviewDialog|showVehicles/)
  assert.match(descriptor.template.content, /@click="discard"/)
  assert.doesNotMatch(descriptor.template.content, /limits-origin"|limits-row-reset|limits-coverage|limits-detail-state|Exceso desde/)
  assert.match(descriptor.template.content, /class="limits-detail-summary limits-original-summary"/)
  assert.match(descriptor.template.content, /<dt>Valor original<\/dt>/)
  assert.doesNotMatch(descriptor.scriptSetup.content, /const resetType|const missingTypes|const origin =/)
})

test("batch save is atomic, validates drafts and rejects stale or unauthorized changes", () => {
  const { read, write } = fixture()
  const expected = { speed: {}, idle: {} }
  const draft = { speed: { bus: 110 }, idle: { bus: 0 } }
  let writes = 0
  const options = {
    read,
    write: (...args) => {
      writes++
      return write(...args)
    },
    companyId: "one",
    draft,
    expected,
    canEdit: () => true,
  }
  assert.deepEqual(readLimitsConfiguration(read, "one"), expected)
  assert.throws(() =>
    saveLimitsConfiguration({ ...options, draft: { speed: { bus: 301 }, idle: {} } }),
  )
  assert.throws(() => saveLimitsConfiguration({ ...options, canEdit: () => false }))
  assert.equal(writes, 0)
  assert.deepEqual(saveLimitsConfiguration(options), draft)
  assert.equal(writes, 1)
  assert.throws(() => saveLimitsConfiguration(options), /otra ventana/)
  assert.throws(
    () => saveLimitsConfiguration({ ...options, expected: draft, write: () => false }),
    /guardar/,
  )
  assert.deepEqual(readLimitsConfiguration(read, "one"), draft)
  assert.deepEqual(
    saveLimitsConfiguration({ ...options, expected: draft, draft: expected }),
    expected,
  )
})

test("limits warns on reload only with unsaved changes, including a focused uncommitted field", () => {
  const source = readFileSync(new URL("../../views/ConfigurationLimitsView.vue", import.meta.url), "utf8")
  const handler = source.slice(source.indexOf("const hasUnsavedChanges ="), source.indexOf("onBeforeRouteLeave(confirmLeave)"))
  const dirty = ref(false)
  const input = { value: "100", dataset: { scope: "platform" } }
  let prompts = 0
  const { protectUnload, confirmLeave } = new Function("dirty", "document", "ready", "editable", "scope", "effectiveValue", "activeMode", "selectedType", "window", `${handler}; return { protectUnload, confirmLeave }`)(
    dirty, { getElementById: () => input }, ref(true), ref(true), ref("platform"),
    () => 100, ref("speed"), ref({ id: "bus" }), { confirm: () => { prompts++; return false } },
  )
  const fires = () => {
    let prevented = false
    const event = { preventDefault: () => { prevented = true } }
    protectUnload(event)
    if (prevented) assert.equal(event.returnValue, "")
    return prevented
  }
  assert.equal(fires(), false)
  assert.equal(confirmLeave(), true)
  assert.equal(prompts, 0)
  dirty.value = true
  assert.equal(fires(), true)
  assert.equal(confirmLeave(), false)
  dirty.value = false
  assert.equal(fires(), false)
  input.value = "110"
  assert.equal(fires(), true)
  assert.equal(confirmLeave(), false)
  input.value = "100"
  assert.equal(fires(), false)
  input.value = ""
  assert.equal(fires(), true)
  assert.match(source, /addEventListener\("beforeunload", protectUnload\)/)
  assert.match(source, /removeEventListener\("beforeunload", protectUnload\)/)
})

test("optional reasons persist with limits and participate in conflict detection", () => {
  const { read, write } = fixture()
  const expected = { speed: {}, idle: {} }
  const draft = { ...expected, notes: { speed: { bus: "Politica interna" }, idle: { bus: "Motor auxiliar" } } }
  const options = { read, write, draft, expected, canEdit: () => true }
  assert.deepEqual(saveLimitsConfiguration(options), draft)
  assert.deepEqual(readLimitsConfiguration(read), draft)
  assert.throws(() => saveLimitsConfiguration(options), /otra ventana/)
  assert.throws(() => saveLimitsConfiguration({ ...options, expected: draft, draft: { ...draft, notes: { speed: { bus: "x".repeat(501) } } } }), /500/)
  assert.throws(() => readLimitsConfiguration(() => JSON.stringify({ ...expected, notes: { speed: { unknown: "bad" } } })))
  assert.deepEqual(saveLimitsConfiguration({ ...options, expected: draft, draft: expected }), expected)
})

function fixture() {
  const data = new Map()
  const read = (key) => data.get(key) ?? null
  const write = (key, value) => {
    data.set(key, value)
    return true
  }
  const save = (options = {}) =>
    saveLimit({
      read,
      write,
      companyId: "one",
      kind: "speed",
      type: "bus",
      raw: "110",
      canEdit: () => true,
      ...options,
    })
  return { data, read, write, save }
}

test("limits use reference defaults and do not silently classify missing types as cars", () => {
  assert.equal(LIMIT_TYPES.find((type) => type.id === "bus").speed, 100)
  assert.equal(LIMIT_TYPES.find((type) => type.id === "truck").idle, 3.49)
  assert.equal(limitAssetType({ assetType: "pickup" }), "pickup")
  assert.equal(limitAssetType({ tipoActivo: "bus" }), "bus")
  assert.equal(limitAssetType({}), null)
  assert.equal(limitAssetType({ assetType: "unknown" }), null)
})

test("limits save per company, preserve other values and restore inheritance when cleared", () => {
  const { read, save } = fixture()
  save()
  save({ kind: "idle", type: "car", raw: "1,8" })
  assert.deepEqual(readLimitsConfiguration(read, "one"), {
    speed: { bus: 110 },
    idle: { car: 1.8 },
  })
  assert.deepEqual(readLimitsConfiguration(read, "two"), { speed: {}, idle: {} })
  assert.deepEqual(readLimitsConfiguration(read), { speed: {}, idle: {} })
  save({ raw: "" })
  assert.deepEqual(readLimitsConfiguration(read, "one"), { speed: {}, idle: { car: 1.8 } })
  save({ kind: "idle", type: "bus", raw: "0" })
  assert.equal(readLimitsConfiguration(read, "one").idle.bus, 0)
})

test("limits reject invalid numbers, read-only access and storage failures", () => {
  const { save, data } = fixture()
  for (const raw of ["NaN", "Infinity", "0", "-1", "301", "1.5"]) assert.throws(() => save({ raw }))
  assert.throws(() => save({ kind: "idle", raw: "100.01" }))
  assert.throws(() => save({ canEdit: () => false }), /permiso/)
  assert.throws(() => save({ write: () => false }), /guardar/)
  assert.equal(data.size, 0)
})

test("limits refuse to overwrite corrupt saved settings", () => {
  const { data, read, save } = fixture()
  for (const invalid of [
    "{bad",
    "null",
    '{"speed":[],"idle":{}}',
    '{"speed":{"bus":-1},"idle":{}}',
  ]) {
    data.set(limitsStorageKey("one"), invalid)
    assert.throws(() => readLimitsConfiguration(read, "one"))
    assert.throws(() => save())
    assert.equal(data.get(limitsStorageKey("one")), invalid)
  }
})
