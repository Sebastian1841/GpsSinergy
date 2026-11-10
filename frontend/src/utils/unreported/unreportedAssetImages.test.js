import test from "node:test"
import assert from "node:assert/strict"
import { computed, ref } from "vue"
import { buildUnreportedAssetImageIndex, unreportedAssetImageKey } from "./unreportedAssetImages.js"

test("images match the real asset by company and IMEI, never its display name", () => {
  const companies = [
    { id: "a", name: "Empresa A" },
    { id: "b", name: "Empresa B" },
  ]
  const a = { companyId: "a", imei: "00123", mapIcon: "vehicle-bus" }
  const b = { companyId: "b", imei: "00123", mapIcon: "vehicle-pickup" }
  const index = buildUnreportedAssetImageIndex([a, b], companies)
  assert.equal(index.get(unreportedAssetImageKey("a", "00123")), a)
  assert.equal(index.get(unreportedAssetImageKey("b", "00123")), b)
  assert.equal(index.get(unreportedAssetImageKey("a", "123")), undefined)
  assert.equal(buildUnreportedAssetImageIndex([a, b], [companies[0]]).size, 1)
  assert.equal(
    buildUnreportedAssetImageIndex([a, { ...a }], companies).get(
      unreportedAssetImageKey("a", "00123"),
    ),
    null,
  )
})

test("asset configuration updates are reactive and duplicate company names stay separate", () => {
  const assets = ref([{ companyId: "a", imei: "00123", assetType: "bus" }])
  const companies = ref([{ id: "a", name: "Empresa" }])
  const index = computed(() => buildUnreportedAssetImageIndex(assets.value, companies.value))
  const key = unreportedAssetImageKey("a", "00123")
  assert.equal(index.value.get(key).assetType, "bus")
  assets.value[0].mapIcon = "vehicle-truck"
  assert.equal(index.value.get(key).mapIcon, "vehicle-truck")
  companies.value.push({ id: "b", name: "Empresa" })
  assert.equal(index.value.get(key), assets.value[0])
  assert.equal(index.value.size, 1)
})
