import test from "node:test"
import assert from "node:assert/strict"
import { calculatedVariableOutputs, renameCalculatedVariableOutput } from "./calculatedVariableInputs.js"

test("output discovery counts assignments, ignoring comments, literals, comparisons and object properties", () => {
  const script = [
    '# out["comment"] = 1',
    'text = \'out["literal"] = 2\'',
    'doc = """out["documentation"] = 3"""',
    'obj.out["property"] = 4',
    'if out["comparison"] == 5:',
    '    out [ "old" ] = 0',
    "else:\n    out['old'] = False",
  ].join("\n")
  assert.deepEqual(calculatedVariableOutputs(script, "new_name"), { keys: ["old"], dynamic: false, matches: false, canRename: true })
  assert.equal(calculatedVariableOutputs(script, "old").matches, true)
})

test("rename updates only matching out literals, preserving branches, reads, comments and text", () => {
  const script = '# out["old"] = 7\ntext = \'out["old"]\'\nif True:\n    out [ "old" ] = 0\nelse:\n    out[\'old\'] = out["old"]\nother = out["other"]'
  const renamed = renameCalculatedVariableOutput(script, "new_name")
  assert.equal(renamed, '# out["old"] = 7\ntext = \'out["old"]\'\nif True:\n    out [ "new_name" ] = 0\nelse:\n    out[\'new_name\'] = out["new_name"]\nother = out["other"]')
  assert.equal(calculatedVariableOutputs(renamed, "new_name").matches, true)
})

test("automatic rename refuses ambiguous outputs, dynamic accesses, absent assignments and invalid names", () => {
  for (const script of ['out["a"] = 1\nout["b"] = 2', 'out["a"] = 1\nout[key] = 2', 'out["a" + suffix] = 1', 'x = out["a"]', 'out["a"] == 1']) {
    assert.equal(calculatedVariableOutputs(script, "new_name").canRename, false)
    assert.equal(renameCalculatedVariableOutput(script, "new_name"), script)
  }
  const script = 'out["a"] = 1'
  for (const key of ['Bad Key', '', 'a', 'a"injection', 'a'.repeat(65)]) assert.equal(renameCalculatedVariableOutput(script, key), script)
})
