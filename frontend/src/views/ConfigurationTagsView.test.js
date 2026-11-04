import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { parse, compileScript, compileTemplate } from "@vue/compiler-sfc"
import { ref } from "vue"

test("configuration tags reuses the existing editor and protects company mutations", () => {
  const { descriptor } = parse(
    readFileSync(new URL("./ConfigurationTagsView.vue", import.meta.url), "utf8"),
  )
  const script = compileScript(descriptor, { id: "tags" })
  const compiled = compileTemplate({
    source: descriptor.template.content,
    filename: "ConfigurationTagsView.vue",
    id: "tags",
    compilerOptions: { bindingMetadata: script.bindings },
  })
  assert.deepEqual(compiled.errors, [])
  assert.match(descriptor.template.content, /FleetAssetTagModal/)
  assert.match(descriptor.template.content, /tags-list/)
  assert.match(descriptor.template.content, /tags-assets-table/)
  assert.match(descriptor.template.content, /Buscar etiqueta o activo/)
  assert.match(descriptor.template.content, /tags-search-scope">General/)
  assert.match(descriptor.template.content, /tags-search-scope">Activos/)
  assert.match(descriptor.template.content, /Filtra solo el listado de etiquetas/)
  assert.match(
    descriptor.scriptSetup.content,
    /canAccessFunction\("configuration-tags", companyId.value, "edit"\)/,
  )
  assert.match(
    descriptor.scriptSetup.content,
    /canAccessFunction\("gps", companyId.value, "edit"\)/,
  )
  assert.match(descriptor.scriptSetup.content, /!findTag\(id\)/)
  assert.match(descriptor.scriptSetup.content, /commitAssetTagConfiguration/)
  assert.match(descriptor.scriptSetup.content, /editableAssetIds: fleet.value.map/)
  assert.match(descriptor.scriptSetup.content, /if \(saved\) editorOpen.value = false/)
  assert.match(descriptor.template.content, /:save-error="error"/)
  const router = readFileSync(new URL("../router/index.js", import.meta.url), "utf8")
  assert.equal((router.match(/\? routeViewLoaders.configurationTags/g) || []).length, 2)
})

test("failed tag create or edit keeps the modal open for retry", () => {
  const source = readFileSync(new URL("./ConfigurationTagsView.vue", import.meta.url), "utf8")
  const handler = source.slice(source.indexOf("const saveEditor ="), source.indexOf("const removeAssignment ="))
  for (const id of ["", "existing"]) {
    const editorOpen = ref(true)
    let succeed = false
    let received
    const save = (payload) => { received = payload; return succeed }
    const run = new Function("guard", "editorCompanyId", "companyId", "editingId", "updateTag", "createTag", "editorOpen", `${handler}; return saveEditor`)(
      () => true, ref("one"), ref("one"), ref(id), save, save, editorOpen,
    )
    const payload = { name: "Mi etiqueta", assetIds: ["asset-a", "asset-b"] }
    run(payload)
    assert.equal(editorOpen.value, true)
    assert.deepEqual(received.assetIds, payload.assetIds)
    assert.equal(id ? received.changes.name : received.name, payload.name)
    succeed = true
    run(payload)
    assert.equal(editorOpen.value, false)
  }
})
