import test from "node:test"
import assert from "node:assert/strict"
import { calculatedVariableTemplates } from "./calculatedVariableTemplates.js"

test("template output follows the current key without unsafe string interpolation", () => {
  for (const template of calculatedVariableTemplates("mi_variable")) assert.ok(template.code.includes('out["mi_variable"]'))
  assert.ok(calculatedVariableTemplates("")[0].code.includes('out["resultado"]'))
  assert.ok(calculatedVariableTemplates('nombre"nuevo')[0].code.includes('out["nombre\\"nuevo"]'))
})

test("text and CSV templates use only the documented reference helpers", () => {
  const templates = calculatedVariableTemplates("resultado")
  const clean = templates.find(template => template.label === "Limpiar texto").code
  const average = templates.find(template => template.label === "Promedio CSV").code
  assert.match(clean, /limpiar\(texto\) if texto is not None else None/)
  assert.match(clean, /limpio if limpio else None/)
  assert.match(average, /partir\(csv, ","\)/)
  assert.match(average, /numero\(campo\)/)
  assert.match(average, /promedio\(valores\) if valido and valores else None/)
  assert.match(average, /if valor is None:/)
  assert.match(average, /if campo is None or campo == "":/)
  assert.doesNotMatch(average, /if valor:/)
  for (const code of [clean, average]) {
    assert.doesNotMatch(code, /\b(?:str|float|sum|len)\(|\.strip\(|\.split\(|else 0/)
    assert.ok(code.length < 20000)
  }
})
