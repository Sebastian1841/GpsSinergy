import assert from "node:assert/strict"
import test from "node:test"

import {
  buildAutomaticAlertRuleRows,
  buildAutomaticAlertRuleSummary,
  filterAutomaticAlertRuleRows,
  getDefaultAutomaticAlertRulePayload,
  getAutomaticAlertConditionLabel,
  normalizeAutomaticAlertRule,
  sortAutomaticAlertRuleRows,
} from "./automaticAlertRuleUtils.js"

const companies = [
  {
    id: "company-1",
    name: "Empresa Uno",
  },
  {
    id: "company-2",
    name: "Empresa Dos",
  },
]

const assets = [
  {
    id: "asset-1",
    companyId: "company-1",
    patente: "AAA-001",
    vehiculo: "Camion 1",
    assetTagIds: ["faena-norte"],
  },
  {
    id: "asset-2",
    companyId: "company-1",
    patente: "BBB-002",
    vehiculo: "Camion 2",
    assetTagIds: ["faena-sur"],
  },
  {
    id: "asset-3",
    companyId: "company-2",
    patente: "CCC-003",
    vehiculo: "Camion 3",
  },
]

const rules = [
  {
    id: "rule-1",
    companyId: "company-1",
    name: "Velocidad",
    type: "speeding",
    severity: "high",
    enabled: true,
    condition: {
      field: "speed",
      operator: ">",
      value: 90,
      unit: "km/h",
    },
    assetScope: {
      type: "all",
      assetIds: [],
    },
    schedule: {
      type: "always",
    },
    cooldownMinutes: 15,
    createdAt: "2026-09-09T10:00:00-04:00",
    updatedAt: "2026-09-09T10:00:00-04:00",
  },
  {
    id: "rule-2",
    companyId: "company-1",
    name: "GPS",
    type: "no_signal",
    severity: "critical",
    enabled: false,
    condition: {
      field: "offlineMinutes",
      operator: ">=",
      value: 30,
      unit: "min",
    },
    assetScope: {
      type: "specific",
      assetIds: ["asset-2", "asset-404"],
    },
    cooldownMinutes: 30,
    createdAt: "2026-09-09T09:00:00-04:00",
    updatedAt: "2026-09-09T09:00:00-04:00",
  },
  {
    id: "rule-3",
    companyId: "company-2",
    name: "Geocerca",
    type: "geofence",
    severity: "critical",
    enabled: true,
    condition: {
      field: "geofenceEvent",
      operator: "=",
      value: "Salida",
      unit: "",
    },
    assetScope: {
      type: "all",
      assetIds: [],
    },
    cooldownMinutes: 10,
    createdAt: "2026-09-08T09:00:00-04:00",
    updatedAt: "2026-09-08T09:00:00-04:00",
  },
]

test("buildAutomaticAlertRuleRows applies company scope and authorized assets", () => {
  const rows = buildAutomaticAlertRuleRows({
    rules,
    companies,
    assets,
    companyId: "company-1",
  })

  assert.deepEqual(
    rows.map((row) => row.id),
    ["rule-1", "rule-2"],
  )
  assert.equal(rows[0].selectedAssetCount, 2)
  assert.equal(rows[1].selectedAssetCount, 1)
})

test("buildAutomaticAlertRuleRows supports access tag scope", () => {
  const rows = buildAutomaticAlertRuleRows({
    rules: [
      {
        id: "rule-tags",
        companyId: "company-1",
        name: "Faena Norte",
        type: "speeding",
        assetScope: {
          type: "asset-tags",
          assetTagIds: ["faena-norte"],
        },
      },
    ],
    companies,
    assets,
  })

  assert.equal(rows[0].assetScope.type, "asset-tags")
  assert.deepEqual(rows[0].selectedAssetIds, ["asset-1"])
  assert.equal(rows[0].targetLabel, "1 etiquetas / 1 activos")
})

test("filterAutomaticAlertRuleRows supports status, type and search", () => {
  const rows = buildAutomaticAlertRuleRows({
    rules,
    companies,
    assets,
  })
  const filteredRows = filterAutomaticAlertRuleRows({
    rows,
    searchTerm: "gps",
    selectedStatus: "disabled",
    selectedType: "no_signal",
  })

  assert.deepEqual(
    filteredRows.map((row) => row.id),
    ["rule-2"],
  )
})

test("sortAutomaticAlertRuleRows keeps enabled rules first and then newest", () => {
  const rows = buildAutomaticAlertRuleRows({
    rules,
    companies,
    assets,
  })

  assert.deepEqual(
    sortAutomaticAlertRuleRows(rows).map((row) => row.id),
    ["rule-1", "rule-3", "rule-2"],
  )
})

test("buildAutomaticAlertRuleSummary counts enabled, disabled and critical rules", () => {
  const rows = buildAutomaticAlertRuleRows({
    rules,
    companies,
    assets,
  })

  assert.deepEqual(buildAutomaticAlertRuleSummary(rows), {
    total: 3,
    enabled: 2,
    disabled: 1,
    critical: 1,
  })
})

test("getDefaultAutomaticAlertRulePayload uses the selected type preset", () => {
  const rule = getDefaultAutomaticAlertRulePayload({
    companyId: "company-1",
    type: "fuel",
  })

  assert.equal(rule.companyId, "company-1")
  assert.equal(rule.type, "fuel")
  assert.equal(rule.condition.field, "fuelVariation")
  assert.equal(rule.condition.unit, "%")
})

test("normalizeAutomaticAlertRule falls back to a safe enabled in-app rule", () => {
  const rule = normalizeAutomaticAlertRule({
    id: "rule-x",
    companyId: "company-1",
    type: "unknown",
  })

  assert.equal(rule.id, "rule-x")
  assert.equal(rule.type, "unknown")
  assert.equal(rule.enabled, true)
  assert.equal(rule.assetScope.type, "all")
  assert.equal(rule.description, "")
  assert.equal(rule.schedule.type, "always")
  assert.equal(rule.notificationChannels.inApp, true)
})

test("normalizeAutomaticAlertRule preserves geofence target selection", () => {
  const groupRule = normalizeAutomaticAlertRule({
    id: "rule-geofence-group",
    companyId: "company-1",
    type: "geofence",
    condition: {
      field: "geofenceEvent",
      operator: "=",
      value: "Salir",
      geofenceScope: "group",
      geofenceGroupId: "group-1",
      geofenceGroupName: "Bodegas",
    },
  })

  assert.equal(groupRule.condition.geofenceScope, "group")
  assert.equal(groupRule.condition.geofenceGroupId, "group-1")
  assert.equal(groupRule.condition.geofenceGroupName, "Bodegas")

  const specificRule = normalizeAutomaticAlertRule({
    id: "rule-geofence-specific",
    companyId: "company-1",
    type: "geofence",
    condition: {
      field: "geofenceEvent",
      operator: "=",
      value: "Ingresar",
      geofenceScope: "specific",
      geofenceIds: ["zone-1", "", "zone-2", "zone-1"],
      geofenceNames: ["Base norte", "Base sur"],
    },
  })

  assert.equal(specificRule.condition.geofenceScope, "specific")
  assert.deepEqual(specificRule.condition.geofenceIds, ["zone-1", "zone-2"])
  assert.deepEqual(specificRule.condition.geofenceNames, ["Base norte", "Base sur"])
})

test("getAutomaticAlertConditionLabel describes geofence scope", () => {
  assert.equal(
    getAutomaticAlertConditionLabel({
      type: "geofence",
      condition: {
        value: "Salir",
        geofenceScope: "group",
        geofenceGroupName: "Bodegas",
      },
    }),
    "Salir - Grupo Bodegas",
  )

  assert.equal(
    getAutomaticAlertConditionLabel({
      type: "geofence",
      condition: {
        value: "Ingresar",
        geofenceScope: "specific",
        geofenceIds: ["zone-1", "zone-2"],
      },
    }),
    "Ingresar - 2 geocercas",
  )
})

test("normalizeAutomaticAlertRule treats ignition as contact outside schedule", () => {
  const rule = normalizeAutomaticAlertRule({
    id: "rule-ignition",
    companyId: "company-1",
    type: "ignition",
    condition: {
      field: "schedule",
      operator: "=",
      value: "Fuera de horario",
    },
    schedule: {
      type: "always",
      from: "08:00",
      to: "18:00",
    },
  })

  assert.equal(rule.condition.field, "ignitionState")
  assert.equal(rule.condition.operator, "=")
  assert.equal(rule.condition.value, "Encendido")
  assert.equal(rule.condition.unit, "")
  assert.equal(rule.schedule.type, "custom")
  assert.equal(getAutomaticAlertConditionLabel(rule), "Contacto encendido fuera de horario")
})
