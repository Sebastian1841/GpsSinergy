import test from "node:test"
import assert from "node:assert/strict"

test("strict audit append persists before publishing, deduplicates IDs and preserves data on failure", async () => {
  const previousWindow = globalThis.window
  const storage = new Map([["sinergy-audit-log", "[]"]])
  let fail = false
  let writes = 0
  globalThis.window = {
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => {
        if (fail) throw Error("quota")
        storage.set(key, value)
        writes++
      },
    },
    addEventListener() {},
  }
  try {
    const { appendAuditLog, useAuditService } = await import("./useAuditService.js")
    const entry = {
      id: "stable-audit",
      actorName: "Administrador",
      module: "configuracion",
      metadata: { before: { level: 10 }, after: { level: 15 } },
    }
    appendAuditLog(entry, { requirePersistence: true })
    assert.equal(writes, 1)
    appendAuditLog(entry, { requirePersistence: true })
    assert.equal(writes, 1)
    assert.equal(useAuditService().auditRecords.value.length, 1)
    const before = storage.get("sinergy-audit-log")
    fail = true
    assert.throws(
      () => appendAuditLog({ ...entry, id: "failed-audit" }, { requirePersistence: true }),
      /No se pudo guardar/,
    )
    assert.equal(storage.get("sinergy-audit-log"), before)
    assert.equal(useAuditService().auditRecords.value.length, 1)
    fail = false
    storage.set("sinergy-audit-log", "invalid")
    assert.throws(() => appendAuditLog(entry, { requirePersistence: true }), /No se pudo leer/)
    assert.equal(storage.get("sinergy-audit-log"), "invalid")
  } finally {
    globalThis.window = previousWindow
  }
})
