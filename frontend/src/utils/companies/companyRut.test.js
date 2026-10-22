import test from "node:test"
import assert from "node:assert/strict"
import { formatCompanyRut } from "./companyRut.js"

test("RUT formatting groups digits, adds verifier separator and uppercases K", () => {
  for (const [input, output] of [
    ["123456789", "12.345.678-9"],
    ["76123456k", "76.123.456-K"],
    ["1.234.567-8", "1.234.567-8"],
    ["abc12!3456789", "12.345.678-9"],
    ["", ""],
    [null, ""],
    ["K", ""],
    ["1", "1"],
  ])
    assert.equal(formatCompanyRut(input), output)
})
test("RUT formatting is bounded to eight body digits and one verifier and is idempotent", () => {
  for (const input of ["12345678999999", "12.345.678-9", "76123456k", "123k456k78K"]) {
    const formatted = formatCompanyRut(input)
    assert.ok(formatted.length <= 12)
    assert.ok(formatted.replace(/[^0-9K]/g, "").length <= 9)
    assert.equal(formatCompanyRut(formatted), formatted)
  }
})
