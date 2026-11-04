import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { parse, compileScript, compileTemplate } from "@vue/compiler-sfc"
import { CALCULATED_VARIABLES_KEY, seedCalculatedVariables, readCalculatedVariables, saveCalculatedVariables, updateCalculatedVariable } from "./calculatedVariables.js"

test("variables initialize once from actual asset IDs, empty storage never restores deleted definitions", () => {
  const assets = Array.from({ length: 120 }, (_, id) => ({ id }))
  const seed = readCalculatedVariables(() => null, assets)
  assert.equal(seed.length, 1)
  assert.equal(seed[0].assetIds.length, 99)
  assert.equal(seed[0].versions.length, 1)
  assert.deepEqual(readCalculatedVariables(() => JSON.stringify({ version: 1, records: [] }), assets), [])
})

test("definitions save atomically, reject conflicts, invalid identifiers and denied edits", () => {
  const data = new Map()
  const read = key => data.get(key) ?? null
  const write = (key, value) => { data.set(key, value); return true }
  const expected = seedCalculatedVariables()
  const draft = { ...expected[0], label: "Estado actualizado", script: 'out["estado_vehiculo"] = "Listo"', unit: "km/h", showInDetail: false }
  const records = updateCalculatedVariable(expected, draft, { actor: "Ana", timestamp: "2026-11-02T14:00:00Z", id: "unused" })
  assert.equal(records[0].versions.length, 2)
  assert.equal(records[0].unit, "km/h")
  assert.equal(records[0].showInDetail, false)
  assert.equal(expected[0].versions.length, 1)
  const options = { read, write, records, expected, canEdit: () => true }
  assert.throws(() => saveCalculatedVariables({ ...options, write: () => false }), /reintentar/)
  assert.equal(data.size, 0)
  assert.throws(() => saveCalculatedVariables({ ...options, canEdit: () => false }), /administrador/)
  assert.throws(() => saveCalculatedVariables({ ...options, records: [{ ...records[0], key: "Bad Key" }] }), /invalidos/)
  assert.deepEqual(saveCalculatedVariables(options), records)
  assert.throws(() => saveCalculatedVariables(options), /otra ventana/)
  const before = data.get(CALCULATED_VARIABLES_KEY)
  assert.throws(() => saveCalculatedVariables({ ...options, expected: records, records: [records[0], records[0]] }), /invalidos/)
  assert.equal(data.get(CALCULATED_VARIABLES_KEY), before)
})

test("corrupt records are not replaced and new variables start paused", () => {
  assert.throws(() => readCalculatedVariables(() => "{bad"), /leer/)
  assert.throws(() => readCalculatedVariables(() => "null"), /compatible/)
  const next = updateCalculatedVariable([], { id: "", key: "prueba", label: "Prueba", script: 'out["prueba"] = 1', assetIds: ["a", "a"] }, { actor: "Ana", timestamp: "2026-11-02T14:00:00Z", id: "new" })
  assert.equal(next[0].active, false)
  assert.deepEqual(next[0].assetIds, ["a"])
})

test("configuration updates preserve script versions, their author and timestamp", () => {
  const records = seedCalculatedVariables([{ id: "a" }])
  const original = JSON.parse(JSON.stringify(records[0].versions))
  const options = { actor: "Editora de configuracion", timestamp: "2026-11-03T14:00:00Z", id: "unused" }
  const draft = { ...records[0], key: "nuevo_nombre", label: "Otro nombre visible", unit: "L", showInDetail: false, assetIds: ["b", "c"] }
  const next = updateCalculatedVariable(records, draft, options)
  assert.deepEqual(next[0].versions, original)
  assert.equal(next[0].updatedBy, options.actor)
  assert.equal(next[0].updatedAt, options.timestamp)
  assert.equal(next[0].unit, "L")
  assert.deepEqual(next[0].assetIds, ["b", "c"])
  assert.deepEqual(updateCalculatedVariable(next, next[0], options)[0].versions, original)
  assert.deepEqual(records[0].versions, original)
})

test("only exact code changes append numbered versions; legacy history remains intact", () => {
  const records = seedCalculatedVariables()
  const legacy = { ...records[0], versions: [records[0].versions[0], { ...records[0].versions[0], number: 5, actor: "Edicion anterior" }] }
  const options = { actor: "Autora del script", timestamp: "2026-11-03T15:00:00Z", id: "unused" }
  const unchanged = updateCalculatedVariable([legacy], { ...legacy, unit: "km/h" }, options)[0]
  assert.deepEqual(unchanged.versions, legacy.versions)
  const updated = updateCalculatedVariable([unchanged], { ...unchanged, script: unchanged.script + "\n# nueva revision" }, options)[0]
  assert.equal(updated.versions.length, 3)
  assert.equal(updated.versions.at(-1).number, 6)
  assert.equal(updated.versions.at(-1).actor, options.actor)
  assert.equal(updated.versions.at(-1).script, updated.script)
  assert.deepEqual(updated.versions.slice(0, 2), legacy.versions)
})

test("retention cap applies only when appending code, without resetting version numbers", () => {
  const seed = seedCalculatedVariables()[0]
  const row = { ...seed, versions: Array.from({ length: 100 }, (_, index) => ({ ...seed.versions[0], number: index + 1 })) }
  const options = { actor: "Ana", timestamp: "2026-11-03T15:00:00Z", id: "unused" }
  assert.deepEqual(updateCalculatedVariable([row], { ...row, label: "Configuracion" }, options)[0].versions, row.versions)
  const next = updateCalculatedVariable([row], { ...row, script: row.script + "\n" }, options)[0]
  assert.equal(next.versions.length, 100)
  assert.equal(next.versions[0].number, 2)
  assert.equal(next.versions.at(-1).number, 101)
})

test("variables view compiles and stays platform-only with guarded local saving and no script execution", () => {
  const source = readFileSync(new URL("../../views/ConfigurationVariablesView.vue", import.meta.url), "utf8")
  const { descriptor } = parse(source)
  const script = compileScript(descriptor, { id: "variables" })
  const template = compileTemplate({ source: descriptor.template.content, filename: "ConfigurationVariablesView.vue", id: "variables", compilerOptions: { bindingMetadata: script.bindings } })
  assert.deepEqual(template.errors, [])
  assert.match(source, /const editable = computed\(\(\) => isPlatformAdmin.value\)/)
  assert.match(source, /onBeforeRouteLeave\(confirmDiscard\)/)
  assert.match(source, /:disabled="!editable \|\| !ready"/)
  assert.doesNotMatch(source, /\beval\(|new Function\(/)
  assert.match(source, /class="variables-home"/)
  assert.match(source, /class="variable-console"/)
  assert.match(descriptor.template.content, /row.script/)
  assert.doesNotMatch(descriptor.template.content, /Sin variable seleccionada/)
  for (const label of ["DEFINICIONES", "ACTIVAS", "VEHÍCULOS ALCANZADOS", "LEEN LA FICHA"]) assert.ok(source.includes(`<span>${label}</span>`))
  assert.match(source, /<div class="variables-metrics"/)
  assert.doesNotMatch(descriptor.template.content, /class="variable-information"/)
  assert.match(source, /selectedKey = ref\(""\)/)
  const selectionHandler = source.slice(source.indexOf("const selectVariable ="), source.indexOf("const commit ="))
  assert.match(selectionHandler, /openEditor\(row\)/)
  assert.match(selectionHandler, /selectedKey.value = previousKey/)
  const clearHandler = source.slice(source.indexOf("const clearFilters ="), source.indexOf("const commit ="))
  assert.match(clearHandler, /if \(!confirmDiscard\(\)\) return/)
  assert.match(clearHandler, /search.value = ""/)
  assert.match(clearHandler, /selectedKey.value = ""/)
  assert.match(source, /aria-label="Limpiar filtros"/)
  assert.match(source, /records.value.filter\(row => testStatusFor\(row\).pending\)/)
  assert.match(source, /draftTestStatus.value.canSave/)
  assert.match(source, /:test-status="draftTestStatus"/)
  assert.match(source, /Historial del script/)
  assert.match(source, /Último cambio de configuración/)
  const router = readFileSync(new URL("../../router/index.js", import.meta.url), "utf8")
  assert.match(router, /item.slug === "variables-calculadas"\s*\? routeViewLoaders.configurationVariables/)
})
