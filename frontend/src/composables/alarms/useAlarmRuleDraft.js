import { computed } from "vue"

import {
  AUTOMATIC_ALERT_TYPE_PRESETS,
  getDefaultAutomaticAlertRulePayload,
  normalizeAutomaticAlertRule,
} from "../../utils/alarms/automaticAlertRuleUtils.js"
import { normalizeId } from "../../utils/idUtils.js"
import { normalizeAssetTagId } from "../../utils/users/userAssetTagUtils.js"
import { normalizeGeofenceScope } from "./useAlarmRuleGeofenceSelection.js"

export const cloneAlarmRuleDraft = (rule = {}) => {
  const normalizedRule = normalizeAutomaticAlertRule(rule)

  if (typeof structuredClone === "function") {
    return structuredClone(normalizedRule)
  }

  return JSON.parse(JSON.stringify(normalizedRule))
}

export const createInitialAlarmRuleDraft = (options = {}) => {
  return cloneAlarmRuleDraft(getDefaultAutomaticAlertRulePayload(options))
}

const normalizeDraftNumber = (value, fallback = 0) => {
  const number = Number(value)

  return Number.isFinite(number) ? number : fallback
}

const normalizeDraftText = (value, fallback = "") => {
  const text = String(value ?? "").trim()

  return text || fallback
}

export function useAlarmRuleDraft({
  batteryConditionOptions,
  draft,
  fallbackCompanyId,
  getSelectedGeofenceNames,
  selectedDraftAssetIds,
  selectedDraftGeofenceGroup,
  selectedDraftGeofenceIds,
}) {
  const currentTypePreset = computed(() => {
    return (
      AUTOMATIC_ALERT_TYPE_PRESETS[normalizeId(draft.value.type)] ||
      AUTOMATIC_ALERT_TYPE_PRESETS.speeding
    )
  })

  const currentAlertType = computed(() => normalizeId(draft.value.type))

  const createDraft = () => {
    return createInitialAlarmRuleDraft({
      companyId: fallbackCompanyId.value,
    })
  }

  const createConditionFromType = (type = currentAlertType.value) => {
    const normalizedType = normalizeId(type)
    const preset =
      AUTOMATIC_ALERT_TYPE_PRESETS[normalizedType] || AUTOMATIC_ALERT_TYPE_PRESETS.speeding
    const condition = {
      field: preset.field,
      operator: preset.operator,
      value: preset.value,
      unit: preset.unit,
    }

    if (normalizedType === "speeding") {
      return {
        ...condition,
        durationSeconds: 0,
      }
    }

    if (normalizedType === "battery") {
      return {
        ...condition,
        field: "batteryVoltage",
        operator: "<",
        value: 11.8,
        unit: "V",
      }
    }

    if (normalizedType === "geofence") {
      return {
        ...condition,
        field: "geofenceEvent",
        operator: "=",
        value: "Salir",
        unit: "",
        geofenceName: "",
        geofenceScope: "all",
        geofenceGroupId: "",
        geofenceGroupName: "",
        geofenceIds: [],
        geofenceNames: [],
      }
    }

    if (normalizedType === "stop_time") {
      return {
        ...condition,
        engineState: "any",
      }
    }

    if (normalizedType === "ignition") {
      return {
        ...condition,
        field: "ignitionState",
        operator: "=",
        value: "Encendido",
        unit: "",
      }
    }

    if (normalizedType === "fuel") {
      return {
        ...condition,
        value: -Math.abs(normalizeDraftNumber(condition.value, 15)),
        windowMinutes: 15,
      }
    }

    return condition
  }

  const fuelDropAmount = computed({
    get() {
      return Math.abs(
        normalizeDraftNumber(draft.value.condition.value, currentTypePreset.value.value),
      )
    },
    set(value) {
      draft.value.condition.value = -Math.abs(normalizeDraftNumber(value, 0))
    },
  })

  const normalizedCooldownMinutes = computed(() => {
    const minutes = Number(draft.value.cooldownMinutes)

    return Number.isFinite(minutes) && minutes >= 0 ? minutes : 15
  })

  const isDraftValid = computed(() => {
    const hasName = String(draft.value.name || "").trim().length > 0
    const hasCompany = Boolean(normalizeId(draft.value.companyId))
    const hasConditionValue =
      draft.value.condition.value !== null &&
      draft.value.condition.value !== undefined &&
      String(draft.value.condition.value).trim() !== ""
    const hasAssets =
      draft.value.assetScope.type === "specific"
        ? selectedDraftAssetIds.value.length > 0
        : draft.value.assetScope.type === "asset-tags"
          ? draft.value.assetScope.assetTagIds.length > 0 && selectedDraftAssetIds.value.length > 0
          : true
    const geofenceScope = normalizeGeofenceScope(draft.value.condition.geofenceScope)
    const hasGeofenceTarget =
      currentAlertType.value !== "geofence" ||
      geofenceScope === "all" ||
      (geofenceScope === "group" && Boolean(selectedDraftGeofenceGroup.value)) ||
      (geofenceScope === "specific" && selectedDraftGeofenceIds.value.length > 0)

    return hasName && hasCompany && hasConditionValue && hasAssets && hasGeofenceTarget
  })

  const applyTypePreset = () => {
    draft.value.condition = createConditionFromType(draft.value.type)

    if (currentAlertType.value === "ignition") {
      draft.value.schedule = {
        ...draft.value.schedule,
        type: "custom",
      }
    }
  }

  const applyBatteryConditionPreset = () => {
    const selectedMetric =
      batteryConditionOptions.find((option) => option.id === draft.value.condition.field) ||
      batteryConditionOptions[0]

    draft.value.condition = {
      ...draft.value.condition,
      field: selectedMetric.id,
      operator: "<",
      value: selectedMetric.value,
      unit: selectedMetric.unit,
    }
  }

  const getDraftConditionPayload = () => {
    const condition = draft.value.condition || {}

    if (currentAlertType.value === "speeding") {
      return {
        field: "speed",
        operator: ">",
        value: Math.max(1, normalizeDraftNumber(condition.value, 80)),
        unit: "km/h",
        durationSeconds: Math.max(0, normalizeDraftNumber(condition.durationSeconds, 0)),
      }
    }

    if (currentAlertType.value === "battery") {
      const selectedMetric =
        batteryConditionOptions.find((option) => option.id === condition.field) ||
        batteryConditionOptions[0]

      return {
        field: selectedMetric.id,
        operator: "<",
        value: Math.max(0, normalizeDraftNumber(condition.value, selectedMetric.value)),
        unit: selectedMetric.unit,
      }
    }

    if (currentAlertType.value === "no_signal") {
      return {
        field: "offlineMinutes",
        operator: ">=",
        value: Math.max(1, normalizeDraftNumber(condition.value, 30)),
        unit: "min",
      }
    }

    if (currentAlertType.value === "geofence") {
      const geofenceScope = normalizeGeofenceScope(condition.geofenceScope)
      const geofenceIds = geofenceScope === "specific" ? selectedDraftGeofenceIds.value : []
      const geofenceNames = getSelectedGeofenceNames(geofenceIds)
      const selectedGroup = geofenceScope === "group" ? selectedDraftGeofenceGroup.value : null
      const geofenceName =
        geofenceScope === "group"
          ? selectedGroup?.label || ""
          : geofenceScope === "specific"
            ? geofenceNames.length === 1
              ? geofenceNames[0]
              : geofenceNames.length
                ? `${geofenceNames.length} geocercas`
                : ""
            : ""

      return {
        field: "geofenceEvent",
        operator: "=",
        value: normalizeDraftText(condition.value, "Salir"),
        unit: "",
        geofenceScope,
        geofenceGroupId: selectedGroup?.id || "",
        geofenceGroupName: selectedGroup?.label || "",
        geofenceIds,
        geofenceNames,
        geofenceName,
      }
    }

    if (currentAlertType.value === "stop_time") {
      return {
        field: "stopMinutes",
        operator: ">=",
        value: Math.max(1, normalizeDraftNumber(condition.value, 30)),
        unit: "min",
        engineState: ["on", "off"].includes(normalizeId(condition.engineState))
          ? normalizeId(condition.engineState)
          : "any",
      }
    }

    if (currentAlertType.value === "ignition") {
      return {
        field: "ignitionState",
        operator: "=",
        value: "Encendido",
        unit: "",
      }
    }

    if (currentAlertType.value === "fuel") {
      return {
        field: "fuelVariation",
        operator: "<=",
        value: -Math.abs(normalizeDraftNumber(condition.value, 15)),
        unit: condition.unit === "%" ? "%" : "litros",
        windowMinutes: Math.max(1, normalizeDraftNumber(condition.windowMinutes, 15)),
      }
    }

    const preset = currentTypePreset.value

    return {
      field: normalizeDraftText(condition.field, preset.field),
      operator: normalizeDraftText(condition.operator, preset.operator),
      value: normalizeDraftText(condition.value, preset.value),
      unit: normalizeDraftText(condition.unit, preset.unit),
    }
  }

  const getDraftPayload = () => {
    const assetScope =
      draft.value.assetScope.type === "specific"
        ? {
            type: "specific",
            assetIds: selectedDraftAssetIds.value,
            assetTagIds: [],
          }
        : draft.value.assetScope.type === "asset-tags"
          ? {
              type: "asset-tags",
              assetIds: [],
              assetTagIds: (draft.value.assetScope.assetTagIds || []).map(normalizeAssetTagId),
            }
          : {
              type: "all",
              assetIds: [],
              assetTagIds: [],
            }

    return {
      companyId: normalizeId(draft.value.companyId),
      name: String(draft.value.name || "").trim(),
      description: String(draft.value.description || "").trim(),
      type: normalizeId(draft.value.type),
      severity: normalizeId(draft.value.severity),
      enabled: Boolean(draft.value.enabled),
      condition: getDraftConditionPayload(),
      assetScope,
      schedule: {
        type:
          currentAlertType.value === "ignition" || draft.value.schedule.type === "custom"
            ? "custom"
            : "always",
        from: draft.value.schedule.from,
        to: draft.value.schedule.to,
        days: draft.value.schedule.days,
      },
      cooldownMinutes: normalizedCooldownMinutes.value,
      notificationChannels: {
        inApp: Boolean(draft.value.notificationChannels.inApp),
        email: Boolean(draft.value.notificationChannels.email),
        whatsapp: false,
      },
    }
  }

  return {
    applyBatteryConditionPreset,
    applyTypePreset,
    cloneDraft: cloneAlarmRuleDraft,
    createConditionFromType,
    createDraft,
    currentAlertType,
    currentTypePreset,
    fuelDropAmount,
    getDraftPayload,
    isDraftValid,
    normalizedCooldownMinutes,
  }
}
