import test from "node:test"
import assert from "node:assert/strict"
import { validateSupportFiles, supportStatusLabel } from "./supportRequestUtils.js"
test("attachment validation limits count, size and file extensions", () => {
  assert.doesNotThrow(() =>
    validateSupportFiles([
      { name: "foto.JPG", size: 100 },
      { name: "detalle.pdf", size: 1024 },
    ]),
  )
  assert.throws(() => validateSupportFiles([{ name: "pagina.html", size: 1 }]), /Solo/)
  assert.throws(
    () => validateSupportFiles([{ name: "grande.pdf", size: 11 * 1024 * 1024 }]),
    /10 MB/,
  )
  assert.throws(
    () => validateSupportFiles(Array.from({ length: 6 }, () => ({ name: "foto.png", size: 1 }))),
    /5 archivos/,
  )
})
test("status labels cover the support workflow", () => {
  assert.equal(supportStatusLabel("waiting"), "Esperando al cliente")
  assert.equal(supportStatusLabel("resolved"), "Resuelta")
})
