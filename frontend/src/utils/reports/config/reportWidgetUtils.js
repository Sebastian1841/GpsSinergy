export const REPORT_WIDGET_IDS = {
  summaryCards: "summaryCards",
  table: "table",
  charts: "charts",
}

const DEFAULT_REPORT_WIDGET_IDS = [REPORT_WIDGET_IDS.summaryCards, REPORT_WIDGET_IDS.table]
const VALID_REPORT_WIDGET_IDS = new Set(Object.values(REPORT_WIDGET_IDS))
const LEGACY_CHART_WIDGET_IDS = new Set(["lineChart", "barChart", "donutChart"])

export const REPORT_WIDGET_LABELS = {
  [REPORT_WIDGET_IDS.summaryCards]: "Resumen",
  [REPORT_WIDGET_IDS.table]: "Tabla",
  [REPORT_WIDGET_IDS.charts]: "Graficos",
}

export const normalizeReportWidgets = (
  widgets = [],
  { fallback = DEFAULT_REPORT_WIDGET_IDS } = {},
) => {
  const normalizedWidgets = []
  const seenWidgetIds = new Set()
  const sourceWidgets = Array.isArray(widgets) ? widgets : []

  sourceWidgets.forEach((widgetId) => {
    const normalizedWidgetId = LEGACY_CHART_WIDGET_IDS.has(String(widgetId))
      ? REPORT_WIDGET_IDS.charts
      : String(widgetId)

    if (!VALID_REPORT_WIDGET_IDS.has(normalizedWidgetId) || seenWidgetIds.has(normalizedWidgetId)) {
      return
    }

    seenWidgetIds.add(normalizedWidgetId)
    normalizedWidgets.push(normalizedWidgetId)
  })

  if (normalizedWidgets.length || !fallback?.length) {
    return normalizedWidgets
  }

  return normalizeReportWidgets(fallback, { fallback: [] })
}

export const getReportWidgetLabel = (widgetId) => {
  return REPORT_WIDGET_LABELS[String(widgetId)] || String(widgetId || "")
}
