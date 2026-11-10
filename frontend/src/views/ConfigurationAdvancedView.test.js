import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { parse, compileScript, compileTemplate } from "@vue/compiler-sfc"
import { CONFIGURATION_MODULES } from "../utils/layout/configurationNavigation.js"
import { ref } from "vue"

test("advanced configuration compiles and keeps platform-only access and local processing disclosure", () => {
  const source = readFileSync(new URL("ConfigurationAdvancedView.vue", import.meta.url), "utf8")
  const { descriptor, errors } = parse(source)
  assert.deepEqual(errors, [])
  const script = compileScript(descriptor, { id: "advanced" })
  assert.deepEqual(
    compileTemplate({
      source: descriptor.template.content,
      filename: "ConfigurationAdvancedView.vue",
      id: "advanced",
      compilerOptions: { bindingMetadata: script.bindings },
    }).errors,
    [],
  )
  assert.equal(CONFIGURATION_MODULES.find((item) => item.slug === "avanzado").platformOnly, true)
  const router = readFileSync(new URL("../router/index.js", import.meta.url), "utf8")
  assert.ok(router.includes('import("../views/ConfigurationAdvancedView.vue")'))
  assert.ok(source.includes("isPlatformAdmin.value"))
  assert.ok(source.includes("Aplicacion al procesamiento de eventos pendiente"))
  assert.ok(source.includes("onBeforeRouteLeave"))
  assert.ok(source.includes("advanced-setting-header"))
  assert.ok(source.includes('class="advanced-introduction"'))
  assert.ok(source.includes("Parámetros de funcionamiento"))
  assert.ok(source.includes('class="advanced-defaults-status"'))
  assert.ok(!descriptor.template.content.includes('class="advanced-setting-icon"'))
  assert.ok(source.includes("advanced-measurement"))
  assert.ok(source.includes("<details"))
  assert.ok(source.includes("<summary>Medición de referencia</summary>"))
  assert.ok(!source.includes("advanced-summary"))
  assert.ok(!source.includes("advanced-category"))
  assert.equal((source.match(/ref="informationButton"/g) || []).length, 1)
  assert.ok(!source.includes("advanced-navigation"))
  assert.ok(source.includes("Lo que no se configura acá"))
  assert.ok(source.includes("advanced-setting-icon"))
  assert.ok(source.includes("Sin guardar"))
  assert.ok(source.includes("Personalizado"))
  assert.ok(source.includes('class="advanced-factory-hint"'))
  assert.ok(source.includes('@click="resetGroup(group)"'))
  assert.ok(source.includes('class="advanced-module-header"'))
  assert.ok(source.includes("Restablecer todo"))
  assert.ok(!source.includes("advanced-footer"))
  assert.ok(source.includes('@click="discard"'))
  assert.ok(source.includes('class="advanced-field-comparison"'))
  assert.ok(source.includes('@submit.prevent="reviewSave"'))
  assert.ok(source.includes("Confirmar guardado"))
  assert.ok(!source.includes("openHistory"))
  assert.ok(!source.includes(">Historial"))
  assert.ok(source.includes("syncAdvancedAudit"))
  assert.ok(source.includes("requirePersistence: true"))
  assert.ok(!source.includes("advanced-history"))
  assert.ok(!source.includes("ADVANCED_HISTORY_DEMO"))
})

test("a transient advanced save error allows retry without discarding the draft", () => {
  const source = readFileSync(new URL("ConfigurationAdvancedView.vue", import.meta.url), "utf8")
  const review = source.slice(
    source.indexOf("const reviewSave ="),
    source.indexOf("const informationButton ="),
  )
  const save = source.slice(source.indexOf("const save ="), source.indexOf("const onStorage ="))
  const draft = ref({ value: 2 }),
    baseline = ref({ value: 1 }),
    saveError = ref(""),
    error = ref("")
  let writes = 0
  const state = {
    editable: ref(true),
    ready: ref(true),
    dirty: ref(true),
    error,
    saveError,
    attempted: ref(false),
    errors: ref({}),
    reviewedDraft: ref(null),
    draft,
    baseline,
    changesDialog: ref({ showModal() {} }),
    currentUser: ref({ id: "user" }),
    message: ref(""),
    closeChangesDialog() {},
    syncAudit() {},
    sameAdvancedConfiguration: (a, b) => JSON.stringify(a) === JSON.stringify(b),
    readStorageValue() {},
    writeStorageValue() {},
    saveAdvancedConfiguration: ({ draft }) => {
      if (++writes === 1) throw new Error("Storage full")
      return draft
    },
  }
  const handlers = new Function(
    ...Object.keys(state),
    `${review}\n${save}\nreturn { reviewSave, save }`,
  )(...Object.values(state))
  handlers.reviewSave()
  handlers.save()
  assert.equal(saveError.value, "Storage full")
  assert.equal(error.value, "")
  assert.deepEqual(draft.value, { value: 2 })
  handlers.reviewSave()
  handlers.save()
  assert.equal(writes, 2)
  assert.equal(saveError.value, "")
  assert.deepEqual(baseline.value, { value: 2 })
  error.value = "Changed in another window"
  handlers.reviewSave()
  handlers.save()
  assert.equal(writes, 2)
})
