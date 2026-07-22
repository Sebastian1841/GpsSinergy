import assert from "node:assert/strict"
import test from "node:test"

import { REPORT_WIDGET_IDS, normalizeReportWidgets } from "./reportWidgetUtils.js"

test("report widgets collapse legacy chart widgets into one charts option", () => {
  assert.deepEqual(
    normalizeReportWidgets(["summaryCards", "lineChart", "barChart", "donutChart", "table"]),
    [REPORT_WIDGET_IDS.summaryCards, REPORT_WIDGET_IDS.charts, REPORT_WIDGET_IDS.table],
  )
})

test("report widgets ignore unknown values and preserve empty selections", () => {
  assert.deepEqual(normalizeReportWidgets(["unknown", "charts"], { fallback: [] }), [
    REPORT_WIDGET_IDS.charts,
  ])
  assert.deepEqual(normalizeReportWidgets([], { fallback: [] }), [])
})
