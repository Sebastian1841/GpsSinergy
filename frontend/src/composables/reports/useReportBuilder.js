import { computed, ref, watch } from "vue"

import {
  mockReportTemplates,
  REPORT_AVAILABLE_COLUMNS,
  REPORT_AVAILABLE_WIDGETS,
  REPORT_TEMPLATE_STATUS,
  REPORT_TEMPLATE_TYPES,
  REPORT_TYPE_OPTIONS,
  REQUIRED_REPORT_COLUMN_IDS,
  REQUIRED_REPORT_FILTER_IDS,
} from "../../data/mockReportTemplates.js"
import { normalizeReportBehaviorOptions } from "../../utils/reports/config/reportBehaviorOptions.js"
import { normalizeReportOutputOptions } from "../../utils/reports/config/reportOutputOptions.js"
import { useReportEventRules } from "./useReportEventRules.js"
import { normalizeReportTemplateEventRuleIds } from "./useReportTemplates.js"
import { REPORT_WIDGET_IDS, normalizeReportWidgets } from "../../utils/reports/config/reportWidgetUtils.js"

const cloneList = (list) => {
  return Array.isArray(list) ? [...list] : []
}

const REPORT_COLUMN_ALIASES = {
  lastPosition: "address",
}

const normalizeColumnIds = (columns) => {
  return cloneList(columns).map((columnId) => REPORT_COLUMN_ALIASES[columnId] || columnId)
}

const withRequiredValues = (values, requiredValues) => {
  return Array.from(new Set([...requiredValues, ...cloneList(values)]))
}

const withRequiredColumns = (values) => {
  return withRequiredValues(normalizeColumnIds(values), REQUIRED_REPORT_COLUMN_IDS)
}

const getDefaultTemplateForReportType = (reportTypeId) => {
  const normalizedReportTypeId = String(reportTypeId || "")

  return mockReportTemplates.find((template) => {
    return String(template.reportTypeId || "") === normalizedReportTypeId
  })
}

export const createEmptyReportDraft = () => {
  return {
    id: null,
    name: "Nuevo reporte personalizado",
    category: "fleet",
    module: "assets",
    reportTypeId: null,
    eventRuleIds: [],
    eventRuleId: null,
    type: REPORT_TEMPLATE_TYPES.CUSTOM,
    status: REPORT_TEMPLATE_STATUS.ACTIVE,
    isDefault: false,
    presetVersion: null,
    description: "",
    filters: withRequiredValues([], REQUIRED_REPORT_FILTER_IDS),
    columns: withRequiredColumns(["patente", "vehiculo", "estado"]),
    widgets: [REPORT_WIDGET_IDS.summaryCards, REPORT_WIDGET_IDS.table],
    behaviorOptions: normalizeReportBehaviorOptions(),
    outputOptions: normalizeReportOutputOptions(),
  }
}

export const createReportDraftFromTemplate = (template = null) => {
  if (!template) {
    return createEmptyReportDraft()
  }

  const eventRuleIds = normalizeReportTemplateEventRuleIds(template)

  return {
    id: template.id || null,
    name: template.name || "Reporte sin nombre",
    category: template.category || "fleet",
    module: template.module || "assets",
    reportTypeId: template.reportTypeId || null,
    eventRuleIds,
    eventRuleId: eventRuleIds[0] || null,
    type: template.type || REPORT_TEMPLATE_TYPES.CUSTOM,
    status: template.status || REPORT_TEMPLATE_STATUS.ACTIVE,
    isDefault: Boolean(template.isDefault),
    presetVersion: template.presetVersion || null,
    description: template.description || "",
    filters: withRequiredValues(template.filters, REQUIRED_REPORT_FILTER_IDS),
    columns: withRequiredColumns(template.columns),
    widgets: normalizeReportWidgets(template.widgets),
    behaviorOptions: normalizeReportBehaviorOptions(template.behaviorOptions),
    outputOptions: normalizeReportOutputOptions(template.outputOptions),
  }
}

export function useReportBuilder() {
  const { activeEventRules } = useReportEventRules()
  const reportDraft = ref(createEmptyReportDraft())

  const availableEventRules = computed(() => {
    return activeEventRules.value.filter((rule) => String(rule.id) !== "all")
  })
  const availableEventRuleIds = computed(() => {
    return new Set(availableEventRules.value.map((rule) => String(rule.id)))
  })
  const availableEventRuleIdsSignature = computed(() => {
    return Array.from(availableEventRuleIds.value).sort().join("|")
  })
  const availableReportTypes = computed(() => REPORT_TYPE_OPTIONS)
  const availableColumns = computed(() => REPORT_AVAILABLE_COLUMNS)
  const availableWidgets = computed(() => REPORT_AVAILABLE_WIDGETS)

  const selectedColumnsCount = computed(() => {
    return reportDraft.value.columns.length
  })

  const normalizeDraftEventRuleIds = (source = reportDraft.value) => {
    return normalizeReportTemplateEventRuleIds(source, availableEventRuleIds.value)
  }

  const normalizeDraft = (draft) => {
    const eventRuleIds = normalizeDraftEventRuleIds(draft)

    return {
      ...draft,
      eventRuleIds,
      eventRuleId: eventRuleIds[0] || null,
    }
  }

  const setReportDraft = (template = null) => {
    reportDraft.value = normalizeDraft(createReportDraftFromTemplate(template))
  }

  watch(availableEventRuleIdsSignature, () => {
    reportDraft.value = normalizeDraft(reportDraft.value)
  })

  const updateDraftField = (field, value) => {
    reportDraft.value = {
      ...reportDraft.value,
      [field]: value,
    }
  }

  const updateDraftOutputOption = (optionId, value) => {
    reportDraft.value = {
      ...reportDraft.value,
      outputOptions: normalizeReportOutputOptions({
        ...reportDraft.value.outputOptions,
        [optionId]: value,
      }),
    }
  }

  const updateDraftBehaviorOption = (optionId, value) => {
    reportDraft.value = {
      ...reportDraft.value,
      behaviorOptions: normalizeReportBehaviorOptions({
        ...reportDraft.value.behaviorOptions,
        [optionId]: value,
      }),
    }
  }

  const updateDraftReportType = (reportTypeId) => {
    const defaultTemplate = getDefaultTemplateForReportType(reportTypeId)
    const eventRuleIds = defaultTemplate
      ? normalizeDraftEventRuleIds(defaultTemplate)
      : normalizeDraftEventRuleIds(reportDraft.value)
    const nextWidgets = defaultTemplate
      ? normalizeReportWidgets(defaultTemplate.widgets, { fallback: reportDraft.value.widgets })
      : reportDraft.value.widgets

    reportDraft.value = {
      ...reportDraft.value,
      reportTypeId: reportTypeId || null,
      category: defaultTemplate?.category || reportDraft.value.category,
      presetVersion: defaultTemplate?.presetVersion || null,
      eventRuleIds,
      eventRuleId: eventRuleIds[0] || null,
      columns: defaultTemplate
        ? withRequiredColumns(defaultTemplate.columns)
        : reportDraft.value.columns,
      widgets: nextWidgets,
      behaviorOptions: normalizeReportBehaviorOptions({
        ...(defaultTemplate?.behaviorOptions || {}),
        ...reportDraft.value.behaviorOptions,
      }),
      outputOptions: normalizeReportOutputOptions({
        ...(defaultTemplate?.outputOptions || {}),
        ...reportDraft.value.outputOptions,
      }),
    }
  }

  const toggleDraftListValue = (field, value) => {
    const currentValues = cloneList(reportDraft.value[field])
    const valueIndex = currentValues.indexOf(value)
    const requiredValues =
      field === "filters"
        ? REQUIRED_REPORT_FILTER_IDS
        : field === "columns"
          ? REQUIRED_REPORT_COLUMN_IDS
          : []

    if (requiredValues.includes(value) && valueIndex >= 0) return

    if (valueIndex >= 0) {
      currentValues.splice(valueIndex, 1)
    } else {
      currentValues.push(value)
    }

    const nextValues = field === "columns" ? normalizeColumnIds(currentValues) : currentValues

    reportDraft.value = {
      ...reportDraft.value,
      [field]: withRequiredValues(nextValues, requiredValues),
    }
  }

  const getReportPayload = () => {
    const eventRuleIds = normalizeDraftEventRuleIds(reportDraft.value)

    return {
      name: reportDraft.value.name,
      category: reportDraft.value.category,
      module: reportDraft.value.module,
      reportTypeId: reportDraft.value.reportTypeId,
      eventRuleIds,
      eventRuleId: eventRuleIds[0] || null,
      type: reportDraft.value.type,
      status: reportDraft.value.status,
      isDefault: reportDraft.value.isDefault,
      presetVersion: reportDraft.value.presetVersion || null,
      description: reportDraft.value.description,
      filters: withRequiredValues(reportDraft.value.filters, REQUIRED_REPORT_FILTER_IDS),
      columns: withRequiredColumns(reportDraft.value.columns),
      widgets: normalizeReportWidgets(reportDraft.value.widgets, { fallback: [] }),
      behaviorOptions: normalizeReportBehaviorOptions(reportDraft.value.behaviorOptions),
      outputOptions: normalizeReportOutputOptions(reportDraft.value.outputOptions),
    }
  }

  const canSaveDraft = computed(() => {
    return Boolean(
      String(reportDraft.value.name || "").trim() &&
      normalizeDraftEventRuleIds(reportDraft.value).length &&
      reportDraft.value.columns.length &&
      reportDraft.value.widgets.length,
    )
  })

  return {
    reportDraft,
    availableReportTypes,
    availableEventRules,
    availableColumns,
    availableWidgets,
    canSaveDraft,
    selectedColumnsCount,

    setReportDraft,
    updateDraftField,
    updateDraftReportType,
    updateDraftBehaviorOption,
    updateDraftOutputOption,
    toggleDraftListValue,
    getReportPayload,
  }
}
