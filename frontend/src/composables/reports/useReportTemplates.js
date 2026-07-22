import { computed, ref, watch } from "vue"

import {
  mockReportTemplates,
  REPORT_TEMPLATE_STATUS,
  REPORT_TEMPLATE_TYPES,
  REQUIRED_REPORT_COLUMN_IDS,
  REQUIRED_REPORT_FILTER_IDS,
} from "../../data/mockReportTemplates.js"
import { readJsonStorage, writeJsonStorage } from "../../services/storage/browserStorage.js"
import { normalizeReportBehaviorOptions } from "../../utils/reports/config/reportBehaviorOptions.js"
import { normalizeReportOutputOptions } from "../../utils/reports/config/reportOutputOptions.js"
import { normalizeReportWidgets } from "../../utils/reports/config/reportWidgetUtils.js"
import {
  getActiveReportEventRulesSnapshot,
  normalizeReportEventRuleId,
  useReportEventRules,
} from "./useReportEventRules.js"

const REPORT_TEMPLATES_STORAGE_KEY = "sinergy-report-templates"
const REPORT_DELETED_TEMPLATE_IDS_STORAGE_KEY = "sinergy-report-deleted-template-ids"
const DEPRECATED_REPORT_TEMPLATE_IDS = new Set(["alerts-report"])
const DAILY_ITINERARY_TEMPLATE_ID = "daily-itinerary"

const isDeprecatedReportTemplate = (template = {}) => {
  return DEPRECATED_REPORT_TEMPLATE_IDS.has(String(template?.id || ""))
}

const withRequiredValues = (values, requiredValues) => {
  return Array.from(new Set([...requiredValues, ...(Array.isArray(values) ? values : [])]))
}

const getActiveEventRuleIds = () => {
  return new Set(
    getActiveReportEventRulesSnapshot()
      .filter((rule) => String(rule.id) !== "all")
      .map((rule) => String(rule.id)),
  )
}

const getActiveEventRulesSignature = (rules = []) => {
  return rules
    .filter((rule) => rule?.active !== false && String(rule?.id || "") !== "all")
    .map((rule) => normalizeReportEventRuleId(rule.id))
    .filter(Boolean)
    .sort()
    .join("|")
}

const getRawEventRuleIds = (template = {}) => {
  const sourceIds = Array.isArray(template.eventRuleIds)
    ? template.eventRuleIds
    : template.eventRuleId
      ? [template.eventRuleId]
      : []

  return Array.from(new Set(sourceIds.map(normalizeReportEventRuleId).filter(Boolean)))
}

export const normalizeReportTemplateStoredEventRuleIds = (template = {}) => {
  return getRawEventRuleIds(template).filter((ruleId) => ruleId !== "all")
}

export const normalizeReportTemplateEventRuleIds = (
  template = {},
  validEventRuleIds = getActiveEventRuleIds(),
) => {
  const cleanIds = normalizeReportTemplateStoredEventRuleIds(template)
  const validEventRuleIdSet =
    validEventRuleIds instanceof Set ? validEventRuleIds : new Set(validEventRuleIds || [])

  return cleanIds.filter((ruleId) => validEventRuleIdSet.has(ruleId))
}

export const hasRunnableReportTemplateRules = (
  template = {},
  validEventRuleIds = getActiveEventRuleIds(),
) => {
  return normalizeReportTemplateEventRuleIds(template, validEventRuleIds).length > 0
}

export const canDeleteReportTemplate = (template = {}) => {
  return Boolean(template?.id)
}

const cloneReportTemplate = (template) => {
  const eventRuleIds = normalizeReportTemplateStoredEventRuleIds(template)
  const widgets = normalizeReportWidgets(template.widgets)

  return {
    ...template,
    eventRuleIds,
    eventRuleId: eventRuleIds[0] || null,
    filters: withRequiredValues(template.filters, REQUIRED_REPORT_FILTER_IDS),
    columns: withRequiredValues(template.columns, REQUIRED_REPORT_COLUMN_IDS),
    widgets,
    behaviorOptions: normalizeReportBehaviorOptions(template.behaviorOptions),
    outputOptions: normalizeReportOutputOptions(template.outputOptions),
  }
}

const getStoredArrayOrSeedArray = (storedValue, seedValue) => {
  return Array.isArray(storedValue) && storedValue.length ? storedValue : seedValue || []
}

const getTemplatePresetVersion = (template = {}) => {
  const version = Number(template?.presetVersion)

  return Number.isFinite(version) ? version : 0
}

const shouldRestoreDailyItineraryPreset = (template = {}, seedTemplate = {}) => {
  const templateId = String(seedTemplate?.id || template?.id || "")

  return (
    templateId === DAILY_ITINERARY_TEMPLATE_ID &&
    getTemplatePresetVersion(template) < getTemplatePresetVersion(seedTemplate)
  )
}

export const resolveReportTemplateWidgets = (template = {}, seedTemplate = {}) => {
  if (shouldRestoreDailyItineraryPreset(template, seedTemplate)) {
    return seedTemplate.widgets || []
  }

  return getStoredArrayOrSeedArray(template.widgets, seedTemplate.widgets)
}

export const mergeStoredDefaultTemplate = (template, seedTemplate) => {
  const shouldRestorePreset = shouldRestoreDailyItineraryPreset(template, seedTemplate)

  return cloneReportTemplate({
    ...seedTemplate,
    ...template,
    id: seedTemplate.id,
    type: REPORT_TEMPLATE_TYPES.DEFAULT,
    isDefault: true,
    status: template.status || seedTemplate.status,
    presetVersion: shouldRestorePreset
      ? seedTemplate.presetVersion
      : template.presetVersion || seedTemplate.presetVersion,
    eventRuleIds: shouldRestorePreset
      ? seedTemplate.eventRuleIds || []
      : getStoredArrayOrSeedArray(template.eventRuleIds, seedTemplate.eventRuleIds),
    eventRuleId: shouldRestorePreset
      ? seedTemplate.eventRuleId || seedTemplate.eventRuleIds?.[0] || null
      : template.eventRuleId || template.eventRuleIds?.[0] || seedTemplate.eventRuleId,
    filters: shouldRestorePreset
      ? seedTemplate.filters || []
      : getStoredArrayOrSeedArray(template.filters, seedTemplate.filters),
    columns: shouldRestorePreset
      ? seedTemplate.columns || []
      : getStoredArrayOrSeedArray(template.columns, seedTemplate.columns),
    widgets: resolveReportTemplateWidgets(template, seedTemplate),
    behaviorOptions: shouldRestorePreset
      ? seedTemplate.behaviorOptions || {}
      : {
          ...(seedTemplate.behaviorOptions || {}),
          ...(template.behaviorOptions || {}),
        },
    outputOptions: shouldRestorePreset
      ? seedTemplate.outputOptions || {}
      : {
          ...(seedTemplate.outputOptions || {}),
          ...(template.outputOptions || {}),
        },
    createdAt: template.createdAt || seedTemplate.createdAt,
    updatedAt: template.updatedAt || seedTemplate.updatedAt,
  })
}

const mergeStoredReportTemplates = (storedTemplates = []) => {
  const deletedTemplateIds = readDeletedReportTemplateIds()
  const seedTemplatesById = new Map(
    mockReportTemplates.map((template) => [String(template.id), template]),
  )
  const storedTemplateIds = new Set()

  const activeStoredTemplates = storedTemplates.filter((template) => {
    const templateId = String(template?.id || "")

    return !isDeprecatedReportTemplate(template) && !deletedTemplateIds.has(templateId)
  })

  const mergedTemplates = activeStoredTemplates.map((template) => {
    const templateId = String(template.id)
    const seedTemplate = seedTemplatesById.get(templateId)

    storedTemplateIds.add(templateId)

    if (!seedTemplate) {
      return cloneReportTemplate(template)
    }

    if (!seedTemplate.isDefault) {
      return cloneReportTemplate({
        ...seedTemplate,
        ...template,
        filters: getStoredArrayOrSeedArray(template.filters, seedTemplate.filters),
        columns: getStoredArrayOrSeedArray(template.columns, seedTemplate.columns),
        widgets: getStoredArrayOrSeedArray(template.widgets, seedTemplate.widgets),
        behaviorOptions: {
          ...(seedTemplate.behaviorOptions || {}),
          ...(template.behaviorOptions || {}),
        },
        outputOptions: {
          ...(seedTemplate.outputOptions || {}),
          ...(template.outputOptions || {}),
        },
      })
    }

    return mergeStoredDefaultTemplate(template, seedTemplate)
  })

  const missingSeedTemplates = mockReportTemplates.filter((template) => {
    const templateId = String(template.id)

    return !storedTemplateIds.has(templateId) && !deletedTemplateIds.has(templateId)
  })

  return [...mergedTemplates, ...missingSeedTemplates.map(cloneReportTemplate)].filter(
    (template) => normalizeReportTemplateStoredEventRuleIds(template).length > 0,
  )
}

const createReportId = (name = "reporte") => {
  const normalizedName = String(name)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  const suffix =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID().slice(0, 8)
      : String(Date.now()).slice(-8)

  return `${normalizedName || "reporte"}-${suffix}`
}

const readStoredReportTemplates = () => {
  const parsedTemplates = readJsonStorage(REPORT_TEMPLATES_STORAGE_KEY, null)

  return Array.isArray(parsedTemplates) ? parsedTemplates : null
}

const readDeletedReportTemplateIds = () => {
  const parsedTemplateIds = readJsonStorage(REPORT_DELETED_TEMPLATE_IDS_STORAGE_KEY, [])

  return new Set(Array.isArray(parsedTemplateIds) ? parsedTemplateIds.map(String) : [])
}

const persistDeletedReportTemplateIds = (templateIds) => {
  writeJsonStorage(REPORT_DELETED_TEMPLATE_IDS_STORAGE_KEY, Array.from(templateIds).map(String))
}

const persistReportTemplates = (templates) => {
  writeJsonStorage(REPORT_TEMPLATES_STORAGE_KEY, templates)
}

const getInitialReportTemplates = () => {
  const storedTemplates = readStoredReportTemplates()

  if (storedTemplates?.length) {
    return mergeStoredReportTemplates(storedTemplates)
  }

  return mockReportTemplates.map(cloneReportTemplate)
}

const reportTemplates = ref(getInitialReportTemplates())
let hasStartedEventRuleSync = false

const getTemplateCollectionSignature = (templates = []) => {
  return JSON.stringify(
    templates.map((template) => ({
      id: template.id,
      reportTypeId: template.reportTypeId,
      rawEventRuleIds: getRawEventRuleIds(template),
      eventRuleIds: normalizeReportTemplateEventRuleIds(template),
      name: template.name,
      category: template.category,
      module: template.module,
      type: template.type,
      status: template.status,
      isDefault: template.isDefault,
      filters: template.filters,
      columns: template.columns,
      widgets: template.widgets,
      behaviorOptions: template.behaviorOptions,
      outputOptions: template.outputOptions,
      presetVersion: template.presetVersion,
    })),
  )
}

const syncReportTemplatesWithSeed = () => {
  const mergedTemplates = mergeStoredReportTemplates(reportTemplates.value)

  if (
    getTemplateCollectionSignature(mergedTemplates) ===
    getTemplateCollectionSignature(reportTemplates.value)
  ) {
    return
  }

  reportTemplates.value = mergedTemplates
  persistReportTemplates(reportTemplates.value)
}

const normalizeTemplatePayload = (payload = {}) => {
  const now = new Date().toISOString()
  const eventRuleIds = normalizeReportTemplateStoredEventRuleIds(payload)

  return {
    id: payload.id || createReportId(payload.name),
    name: payload.name || "Nuevo reporte",
    category: payload.category || "fleet",
    module: payload.module || "assets",
    reportTypeId: payload.reportTypeId || null,
    eventRuleIds,
    eventRuleId: eventRuleIds[0] || null,
    type: payload.type || REPORT_TEMPLATE_TYPES.CUSTOM,
    status: payload.status || REPORT_TEMPLATE_STATUS.ACTIVE,
    isDefault: Boolean(payload.isDefault),
    description: payload.description || "",
    filters: withRequiredValues(payload.filters, REQUIRED_REPORT_FILTER_IDS),
    columns: withRequiredValues(payload.columns, REQUIRED_REPORT_COLUMN_IDS),
    widgets: normalizeReportWidgets(payload.widgets, { fallback: ["table"] }),
    behaviorOptions: normalizeReportBehaviorOptions(payload.behaviorOptions),
    outputOptions: normalizeReportOutputOptions(payload.outputOptions),
    presetVersion: payload.presetVersion || null,
    createdAt: payload.createdAt || now,
    updatedAt: now,
  }
}

const startEventRuleTemplateSync = () => {
  if (hasStartedEventRuleSync) return

  hasStartedEventRuleSync = true

  const { reportEventRules } = useReportEventRules()
  const activeEventRulesSignature = computed(() => {
    return getActiveEventRulesSignature(reportEventRules.value)
  })

  watch(activeEventRulesSignature, () => {
    syncReportTemplatesWithSeed()
  })
}

export function useReportTemplates() {
  syncReportTemplatesWithSeed()
  startEventRuleTemplateSync()

  const templates = computed(() => reportTemplates.value)

  const setReportTemplates = (templatesList) => {
    reportTemplates.value = templatesList
      .filter((template) => !isDeprecatedReportTemplate(template))
      .map(cloneReportTemplate)
      .filter((template) => normalizeReportTemplateStoredEventRuleIds(template).length > 0)
    persistReportTemplates(reportTemplates.value)
  }

  const createReportTemplate = (payload = {}) => {
    const nextTemplate = normalizeTemplatePayload({
      ...payload,
      type: payload.type || REPORT_TEMPLATE_TYPES.CUSTOM,
      isDefault: false,
    })

    if (!nextTemplate.eventRuleIds.length) return null

    setReportTemplates([nextTemplate, ...reportTemplates.value])

    return nextTemplate
  }

  const updateReportTemplate = (templateId, changes = {}) => {
    let updatedTemplate = null

    const nextTemplates = reportTemplates.value.map((template) => {
      if (String(template.id) !== String(templateId)) {
        return template
      }

      const nextTemplate = normalizeTemplatePayload({
        ...template,
        ...changes,
        id: template.id,
        type: template.isDefault ? REPORT_TEMPLATE_TYPES.DEFAULT : changes.type || template.type,
        isDefault: template.isDefault,
        createdAt: template.createdAt,
      })

      if (!nextTemplate.eventRuleIds.length) return template

      updatedTemplate = nextTemplate

      return nextTemplate
    })

    setReportTemplates(nextTemplates)

    return updatedTemplate
  }

  const deleteReportTemplate = (templateId) => {
    const targetTemplate = reportTemplates.value.find((template) => {
      return String(template.id) === String(templateId)
    })

    if (!canDeleteReportTemplate(targetTemplate)) return false

    if (targetTemplate.isDefault || targetTemplate.type === REPORT_TEMPLATE_TYPES.DEFAULT) {
      const deletedTemplateIds = readDeletedReportTemplateIds()

      deletedTemplateIds.add(String(targetTemplate.id))
      persistDeletedReportTemplateIds(deletedTemplateIds)
    }

    setReportTemplates(
      reportTemplates.value.filter((template) => {
        return String(template.id) !== String(templateId)
      }),
    )

    return true
  }

  return {
    reportTemplates: templates,
    createReportTemplate,
    updateReportTemplate,
    deleteReportTemplate,
  }
}
