import test from "node:test"
import assert from "node:assert/strict"
import { resolveUnreportedCompanyContact } from "./unreportedCompanyContact.js"

test("contact reuses company data, preserves display and creates only safe telephone links", () => {
  const companies = [{ name: "Empresa", contactName: " Ana ", contactPhone: "+56 (9) 1234-5678" }]
  assert.deepEqual(resolveUnreportedCompanyContact(companies, "Empresa"), {
    name: "Ana",
    phone: "+56 (9) 1234-5678",
    href: "tel:+56912345678",
  })
  companies[0].contactPhone = "221234567"
  assert.equal(resolveUnreportedCompanyContact(companies, "Empresa").href, "tel:221234567")
  companies[0].contactPhone = "javascript:alert(1)"
  assert.equal(resolveUnreportedCompanyContact(companies, "Empresa").href, "")
  assert.equal(companies[0].contactName, " Ana ")
})

test("missing or ambiguous companies never borrow another company's contact", () => {
  const empty = { name: "", phone: "", href: "" }
  assert.deepEqual(
    resolveUnreportedCompanyContact([{ name: "Otra", contactName: "Pedro" }], "Empresa"),
    empty,
  )
  assert.deepEqual(resolveUnreportedCompanyContact([{ name: "Empresa" }], "Empresa"), empty)
  assert.deepEqual(
    resolveUnreportedCompanyContact(
      [
        { name: "Empresa", contactName: "Ana" },
        { name: "Empresa", contactName: "Pedro" },
      ],
      "Empresa",
    ),
    empty,
  )
})
