import { REPORT_TEMPLATE_STATUS } from "../../../data/mockReportTemplates.js"
import {
  normalizeReportTemplateEventRuleIds,
  normalizeReportTemplateStoredEventRuleIds,
} from "../../../composables/reports/useReportTemplates.js"

export const REPORTS_VIEW_PAGE_SIZE = 8

export const REPORTS_VIEW_TYPE_FILTERS = [
  {
    id: "all",
    label: "Todos",
  },
  {
    id: "custom",
    label: "Creados",
  },
  {
    id: "default",
    label: "Base",
  },
]

const REPORTS_VIEW_EVENT_RULE_STYLES = {
  all: {
    iconClass: "bg-[#102372]",
    eventClass: "bg-[#eef3ff] text-[#102372]",
  },
  movement: {
    iconClass: "bg-emerald-600",
    eventClass: "bg-emerald-50 text-emerald-700",
  },
  stops: {
    iconClass: "bg-[#ff6600]",
    eventClass: "bg-[#fff3eb] text-[#ff6600]",
  },
  idle: {
    iconClass: "bg-amber-500",
    eventClass: "bg-amber-50 text-amber-700",
  },
  speeding: {
    iconClass: "bg-red-600",
    eventClass: "bg-red-50 text-red-700",
  },
  geofence: {
    iconClass: "bg-violet-600",
    eventClass: "bg-violet-50 text-violet-700",
  },
  alerts: {
    iconClass: "bg-rose-600",
    eventClass: "bg-rose-50 text-rose-700",
  },
  gpsSignal: {
    iconClass: "bg-sky-600",
    eventClass: "bg-sky-50 text-sky-700",
  },
  fuel: {
    iconClass: "bg-lime-600",
    eventClass: "bg-lime-50 text-lime-700",
  },
  can: {
    iconClass: "bg-cyan-600",
    eventClass: "bg-cyan-50 text-cyan-700",
  },
  engine: {
    iconClass: "bg-indigo-600",
    eventClass: "bg-indigo-50 text-indigo-700",
  },
  ignition: {
    iconClass: "bg-orange-600",
    eventClass: "bg-orange-50 text-orange-700",
  },
}

export const normalizeReportsViewSearch = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

export const buildReportsViewEventRuleGroups = ({ companyRecords = [], currentCompanyId = "" }) => {
  const companies = currentCompanyId
    ? companyRecords.filter((company) => String(company.id) === String(currentCompanyId))
    : companyRecords

  return companies.flatMap((company) => {
    return (company.sucursales || []).map((group) => ({
      ...group,
      id: String(group.id),
      companyId: company.id,
      companyName: company.name,
    }))
  })
}

export const getReportsViewStats = (reportTemplates = []) => {
  return {
    defaults: reportTemplates.filter((template) => template.isDefault).length,
    custom: reportTemplates.filter((template) => !template.isDefault).length,
  }
}

const getCategoryLabel = (categoryLabelById, categoryId) => {
  return categoryLabelById.get(categoryId) || "Sin categoria"
}

const getEventRuleLabels = (eventRuleLabelById, eventRuleIds = []) => {
  return eventRuleIds
    .map((eventRuleId) => eventRuleLabelById.get(String(eventRuleId)) || "")
    .filter(Boolean)
}

const getEventRuleSummary = (eventRuleLabels = []) => {
  if (!eventRuleLabels.length) return "Sin reglas"
  if (eventRuleLabels.length <= 2) return eventRuleLabels.join(" + ")

  return `${eventRuleLabels[0]} + ${eventRuleLabels.length - 1} mas`
}

const getInactiveRuleSummary = (eventRuleLabels = []) => {
  if (!eventRuleLabels.length) return "Sin reglas activas"
  if (eventRuleLabels.length === 1) return `${eventRuleLabels[0]} inactiva`

  return `${eventRuleLabels.length} reglas inactivas`
}

const getEventRuleStyle = (eventRuleId) => {
  return REPORTS_VIEW_EVENT_RULE_STYLES[eventRuleId] || REPORTS_VIEW_EVENT_RULE_STYLES.all
}

const getEventInitial = (eventRuleLabel) => {
  return String(eventRuleLabel || "R")
    .trim()
    .slice(0, 1)
    .toUpperCase()
}

const buildReportsViewRow = ({
  template,
  activeEventRuleIds,
  categoryLabelById,
  eventRuleLabelById,
}) => {
  const eventRuleIds = normalizeReportTemplateEventRuleIds(template, activeEventRuleIds)
  const storedEventRuleIds = normalizeReportTemplateStoredEventRuleIds(template)
  const eventRuleLabels = getEventRuleLabels(eventRuleLabelById, eventRuleIds)
  const storedEventRuleLabels = getEventRuleLabels(eventRuleLabelById, storedEventRuleIds)
  const eventRuleLabel = eventRuleIds.length
    ? getEventRuleSummary(eventRuleLabels)
    : getInactiveRuleSummary(storedEventRuleLabels)
  const categoryLabel = getCategoryLabel(categoryLabelById, template.category)
  const eventStyle = getEventRuleStyle(eventRuleIds[0] || storedEventRuleIds[0])
  const isActive = template.status === REPORT_TEMPLATE_STATUS.ACTIVE
  const description = template.description || "Sin descripcion"
  const canEdit = Boolean(template.id)

  return {
    id: template.id,
    template,
    name: template.name || "Reporte sin nombre",
    description,
    eventRuleIds,
    eventRuleLabels,
    eventRuleLabel,
    eventInitial: getEventInitial(eventRuleLabels[0] || storedEventRuleLabels[0] || eventRuleLabel),
    categoryLabel,
    canEdit,
    iconClass: eventStyle.iconClass,
    eventClass: eventStyle.eventClass,
    typeLabel: template.isDefault ? "Base" : "Creado",
    typeClass: template.isDefault
      ? "bg-[#eef3ff] text-[#102372]"
      : "bg-[#fff3eb] text-[#ff6600]",
    statusLabel: isActive ? "Activo" : "Inactivo",
    statusClass: isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500",
    searchText: normalizeReportsViewSearch(
      [
        template.name,
        description,
        eventRuleLabels.join(" "),
        storedEventRuleLabels.join(" "),
        categoryLabel,
        template.isDefault ? "base" : "creado",
        template.status,
      ].join(" "),
    ),
  }
}

export const buildReportsViewRows = ({
  reportTemplates = [],
  activeEventRuleIds,
  categoryLabelById,
  eventRuleLabelById,
}) => {
  return reportTemplates
    .map((template) => {
      return buildReportsViewRow({
        template,
        activeEventRuleIds,
        categoryLabelById,
        eventRuleLabelById,
      })
    })
    .filter(Boolean)
    .sort((firstReport, secondReport) => {
      const firstIsDefault = firstReport.template.isDefault ? 1 : 0
      const secondIsDefault = secondReport.template.isDefault ? 1 : 0

      if (firstIsDefault !== secondIsDefault) return firstIsDefault - secondIsDefault

      return firstReport.name.localeCompare(secondReport.name, "es")
    })
}

export const filterReportsViewRows = ({
  reportRows = [],
  reportSearch = "",
  selectedReportType = "all",
}) => {
  const term = normalizeReportsViewSearch(reportSearch)

  return reportRows.filter((report) => {
    if (selectedReportType === "custom" && report.template.isDefault) return false
    if (selectedReportType === "default" && !report.template.isDefault) return false
    if (!term) return true

    return report.searchText.includes(term)
  })
}
