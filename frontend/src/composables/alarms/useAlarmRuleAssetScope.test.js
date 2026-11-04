import test from "node:test"
import assert from "node:assert/strict"
import { ref } from "vue"
import { useAlarmRuleAssetScope } from "./useAlarmRuleAssetScope.js"
import {
  normalizeAutomaticAlertRule,
  buildAutomaticAlertRuleRows,
} from "../../utils/alarms/automaticAlertRuleUtils.js"
import { useAlarmRuleDraft } from "./useAlarmRuleDraft.js"

const assets = Array.from({ length: 180 }, (_, index) => ({
  id: "asset-" + index,
  companyId: index < 100 ? "a" : "b",
  patente: "P-" + index,
  name: "Vehiculo " + index,
}))
const setup = (options = {}) => {
  const draft = ref(
    normalizeAutomaticAlertRule({
      id: "rule",
      companyId: "a",
      name: "Regla",
      type: "speeding",
      assetScope: { type: "specific", assetIds: [] },
      ...options.rule,
    }),
  )
  const scope = useAlarmRuleAssetScope({
    assets: ref(assets),
    assetTags: ref([]),
    draft,
    ...options,
  })
  return { draft, ...scope }
}

test("platform picker includes all authorized companies and does not truncate at 120", () => {
  const scope = setup({ allCompanies: true, pickerVisibleLimit: Infinity })
  assert.equal(scope.visibleAssetsForDraftCompany.value.length, 180)
  assert.equal(scope.hiddenFilteredAssetCount.value, 0)
  scope.toggleDraftAsset("asset-179")
  assert.deepEqual(scope.selectedDraftAssetIds.value, ["asset-179"])
  scope.assetSearchTerm.value = "P-1"
  assert.ok(scope.visibleAssetsForDraftCompany.value.some((asset) => asset.id === "asset-179"))
  scope.assetSearchTerm.value = "NO_MATCH"
  assert.equal(scope.visibleAssetsForDraftCompany.value.length, 0)
  assert.deepEqual(scope.selectedDraftAssetIds.value, ["asset-179"])
})

test("company and text filters only affect visible choices, not selections or rule company", () => {
  const scope = setup({ allCompanies: true, pickerVisibleLimit: Infinity })
  scope.toggleDraftAsset("asset-0")
  scope.toggleDraftAsset("asset-179")
  scope.assetCompanyFilter.value = "b"
  assert.equal(scope.visibleAssetsForDraftCompany.value.length, 80)
  assert.ok(scope.visibleAssetsForDraftCompany.value.every((asset) => asset.companyId === "b"))
  scope.assetSearchTerm.value = "P-179"
  assert.deepEqual(
    scope.visibleAssetsForDraftCompany.value.map((asset) => asset.id),
    ["asset-179"],
  )
  assert.deepEqual(scope.selectedDraftAssetIds.value, ["asset-0", "asset-179"])
  assert.equal(scope.draft.value.companyId, "a")
  scope.assetCompanyFilter.value = "not-authorized"
  assert.equal(scope.visibleAssetsForDraftCompany.value.length, 0)
  assert.equal(scope.selectedDraftAssetCount.value, 2)
  scope.clearAssetSearchTerm()
  assert.equal(scope.assetCompanyFilter.value, "all")
  assert.equal(scope.visibleAssetsForDraftCompany.value.length, 180)
})

test("bulk selection covers all filtered results and preserves hidden selections without duplicates", () => {
  const scope = setup({ allCompanies: true, pickerVisibleLimit: 10 })
  scope.selectFilteredDraftAssets()
  assert.equal(scope.selectedDraftAssetCount.value, 180)
  scope.clearDraftAssetSelection()
  scope.toggleDraftAsset("asset-0")
  scope.assetCompanyFilter.value = "b"
  scope.selectFilteredDraftAssets()
  scope.selectFilteredDraftAssets()
  assert.equal(scope.selectedDraftAssetCount.value, 81)
  assert.ok(scope.selectedDraftAssetIds.value.includes("asset-0"))
  scope.assetSearchTerm.value = "NO_MATCH"
  scope.clearDraftAssetSelection()
  assert.equal(scope.selectedDraftAssetCount.value, 0)
  assert.equal(scope.draft.value.assetScope.type, "specific")
})

test("bulk selection respects text filters and authorized company scope", () => {
  const scope = setup()
  scope.assetSearchTerm.value = "P-99"
  scope.selectFilteredDraftAssets()
  assert.deepEqual(scope.selectedDraftAssetIds.value, ["asset-99"])
  scope.assetSearchTerm.value = ""
  scope.selectFilteredDraftAssets()
  assert.equal(scope.selectedDraftAssetCount.value, 100)
})

test("company picker still excludes other companies and foreign selected ids", () => {
  const scope = setup()
  assert.equal(scope.assetsForDraftCompany.value.length, 100)
  scope.draft.value.assetScope.assetIds = ["asset-0", "asset-179", "unauthorized"]
  assert.deepEqual(scope.selectedDraftAssetIds.value, ["asset-0"])
})

test("showing all choices does not silently expand an existing company-wide rule", () => {
  const scope = setup({
    allCompanies: true,
    scopeAllCompanies: false,
    rule: { assetScope: { type: "all" } },
  })
  assert.equal(scope.assetsForDraftCompany.value.length, 180)
  assert.equal(scope.selectedDraftAssetCount.value, 100)
})

test("platform selection survives payload and rows without losing cross-company vehicles", () => {
  const scope = setup({
    allCompanies: true,
    rule: {
      platformScope: true,
      assetScope: { type: "specific", assetIds: ["asset-0", "asset-179", "unauthorized"] },
    },
  })
  const editor = useAlarmRuleDraft({
    draft: scope.draft,
    batteryConditionOptions: [],
    fallbackCompanyId: ref("a"),
    getSelectedGeofenceNames: () => [],
    selectedDraftAssetIds: scope.selectedDraftAssetIds,
    selectedDraftGeofenceGroup: ref(null),
    selectedDraftGeofenceIds: ref([]),
  })
  const rule = normalizeAutomaticAlertRule({ id: "rule", ...editor.getDraftPayload() })
  assert.equal(rule.platformScope, true)
  assert.deepEqual(rule.assetScope.assetIds, ["asset-0", "asset-179"])
  const options = { rules: [rule], assets, companies: [{ id: "a" }, { id: "b" }] }
  assert.equal(buildAutomaticAlertRuleRows(options)[0].selectedAssetCount, 2)
  assert.equal(buildAutomaticAlertRuleRows({ ...options, companyId: "a" }).length, 0)
  const limited = buildAutomaticAlertRuleRows({ ...options, companies: [{ id: "a" }] })[0]
  assert.deepEqual(limited.selectedAssetIds, ["asset-0"])
})
