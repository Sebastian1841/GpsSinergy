import test from "node:test"
import assert from "node:assert/strict"
import { watch } from "vue"
import { createCollectionDatabaseStorage } from "../../services/storage/collectionDatabaseStorage.js"

test("configuration tag transactions persist together before publishing; failure and retry preserve data", async () => {
  const previous = globalThis.window
  const data = new Map()
  let failOn = ""
  const storage = {
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => {
      if (failOn && key.includes(failOn)) throw Error("quota")
      data.set(key, value)
    },
    removeItem: key => data.delete(key),
  }
  globalThis.window = { localStorage: storage, setTimeout: () => 1, clearTimeout: () => {}, addEventListener: () => {}, removeEventListener: () => {} }
  let stops = []
  try {
    const { useMockDatabase } = await import("./useMockDatabase.js?tag-transaction-regression")
    const db = useMockDatabase()
    const company = String(db.companies.value[0].id)
    const fleet = db.assets.value.filter(asset => String(asset.companyId) === company)
    assert.ok(fleet.length >= 2)
    const visible = fleet.slice(0, 2).map(asset => String(asset.id))
    const options = { companyId: company, editableAssetIds: visible, canEdit: () => true }
    const create = () => db.commitAssetTagConfiguration({ ...options, action: "create", name: "Prueba", assetIds: [visible[0]] })
    let publishes = 0
    stops = [db.assetTags, db.assets, db.accesses].map(value => watch(value, () => { publishes++ }, { flush: "sync" }))
    const snapshot = () => JSON.stringify({ tags: db.assetTags.value, assets: db.assets.value, accesses: db.accesses.value })
    const committed = () => createCollectionDatabaseStorage({ storage, key: "sinergy-mock-database" }).read()
    let before = snapshot()
    failOn = ":assets:"
    assert.throws(create, /No se pudieron guardar/)
    assert.equal(snapshot(), before)
    assert.equal(publishes, 0)
    assert.equal(committed(), null)
    failOn = ""
    const created = create()
    assert.equal(db.assetTags.value.filter(tag => tag.id === created.id).length, 1)
    assert.ok(committed().assets.find(asset => String(asset.id) === visible[0]).assetTagIds.includes(created.id))
    const access = db.accesses.value[0]
    access.scope.assetTagIds = [...(access.scope.assetTagIds || []), created.id]
    const hidden = fleet[2]
    if (hidden) hidden.assetTagIds = [...(hidden.assetTagIds || []), created.id]

    for (const action of ["update", "unassign", "delete"]) {
      const change = () => db.commitAssetTagConfiguration({ ...options, action, tagId: created.id,
        name: "Renombrada", assetIds: visible, assetId: visible[0] })
      for (const failure of [":assets:", ":collections", ...(action === "delete" ? [":accesses:"] : [])]) {
        failOn = failure
        before = snapshot()
        const savedBefore = JSON.stringify(committed())
        const publishedBefore = publishes
        assert.throws(change, /No se pudieron guardar/)
        assert.equal(snapshot(), before)
        assert.equal(JSON.stringify(committed()), savedBefore)
        assert.equal(publishes, publishedBefore)
      }
      failOn = ""
      assert.ok(change())
      if (action === "update") {
        assert.equal(committed().assetTags.find(tag => tag.id === created.id).name, "Renombrada")
        assert.ok(committed().assets.find(asset => String(asset.id) === visible[1]).assetTagIds.includes(created.id))
        if (hidden) assert.ok(committed().assets.find(asset => asset.id === hidden.id).assetTagIds.includes(created.id))
        assert.ok(committed().accesses.find(item => item.id === access.id).scope.assetTagIds.includes(created.id))
      }
      if (action === "unassign") {
        assert.ok(!committed().assets.find(asset => String(asset.id) === visible[0]).assetTagIds.includes(created.id))
        assert.ok(committed().assets.find(asset => String(asset.id) === visible[1]).assetTagIds.includes(created.id))
      }
    }
    assert.ok(!committed().assetTags.some(tag => tag.id === created.id))
    assert.ok(!committed().assets.some(asset => asset.assetTagIds?.includes(created.id)))
    assert.ok(!committed().accesses.some(access => access.scope?.assetTagIds?.includes(created.id)))
    before = snapshot()
    assert.throws(() => db.commitAssetTagConfiguration({ ...options, action: "create", name: "No", canEdit: () => false }), /permiso/)
    assert.throws(() => db.commitAssetTagConfiguration({ ...options, action: "create", name: "No", assetIds: ["foreign"] }), /seleccion/)
    assert.equal(snapshot(), before)
  } finally {
    stops.forEach(stop => stop())
    if (previous === undefined) delete globalThis.window
    else globalThis.window = previous
  }
})
