import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { parse, compileScript, compileTemplate } from "@vue/compiler-sfc"

test("inline variable editor compiles with three steps, real signals and paginated vehicles", () => {
  const source = readFileSync(new URL("./CalculatedVariableEditor.vue", import.meta.url), "utf8")
  const { descriptor } = parse(source)
  const script = compileScript(descriptor, { id: "variable-editor" })
  const compiled = compileTemplate({ source: descriptor.template.content, filename: "CalculatedVariableEditor.vue", id: "variable-editor", compilerOptions: { bindingMetadata: script.bindings } })
  assert.deepEqual(compiled.errors, [])
  assert.match(source, /\['Script', 'Probar', 'A qué vehículos'\]/)
  assert.match(source, /v-model="draft.unit"/)
  assert.match(source, /v-model="draft.showInDetail"/)
  assert.match(source, /<KeepAlive>[\s\S]*<CalculatedVariableTest v-if="step === 2"[\s\S]*<CalculatedVariableVehicles v-else-if="step === 3"[\s\S]*<\/KeepAlive>/)
  assert.match(source, /<CalculatedVariableVehicles[^>]*:profile-keys="scriptInputs.profile"/)
  assert.match(source, /calculatedVariableTokens/)
  assert.match(source, /class="calculated-save" type="submit" :disabled="!canSave"/)
  assert.match(source, /index === 1 \? testStatus.badge/)
  assert.match(source, /@submit.prevent="requestSave"/)
  assert.match(source, /ÚLTIMOS 30 DÍAS/)
  assert.match(source, /calculatedSignalReadings/)
  assert.match(source, /La salida no coincide con el nombre interno/)
  assert.match(source, /v-if="outputInfo.canRename"/)
  assert.match(source, /renameCalculatedVariableOutput\(draft.value.script, draft.value.key\)/)
  assert.match(source, /9 funciones, 3 entradas y los topes/)
  for (const name of ["abs", "interp", "limpiar", "max", "min", "numero", "partir", "promedio", "round"]) assert.ok(source.includes(`"${name}()"`))
  assert.match(source, /2000 pasos, 64 vueltas/)
  assert.match(source, /4096 caracteres y 256 elementos/)
  assert.match(source, /ficha_capacidad_estanque_l/)
  assert.doesNotMatch(source, /v-html/)
  assert.doesNotMatch(source, /\beval\(|new Function\(/)
})
