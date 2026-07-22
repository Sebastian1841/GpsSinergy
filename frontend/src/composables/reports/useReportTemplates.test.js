import assert from "node:assert/strict"
import test from "node:test"

import { mockReportTemplates } from "../../data/mockReportTemplates.js"
import {
  DEFAULT_REPORT_REVERSE_GEOCODE_EXPORT_LIMIT,
  REPORT_BEHAVIOR_OPTION_IDS,
} from "../../utils/reports/config/reportBehaviorOptions.js"
import { REPORT_OUTPUT_OPTION_IDS } from "../../utils/reports/config/reportOutputOptions.js"
import { REPORT_WIDGET_IDS } from "../../utils/reports/config/reportWidgetUtils.js"
import { createEmptyReportDraft } from "./useReportBuilder.js"
import { normalizeReportEventRuleId } from "./useReportEventRules.js"
import {
  canDeleteReportTemplate,
  hasRunnableReportTemplateRules,
  mergeStoredDefaultTemplate,
  normalizeReportTemplateEventRuleIds,
  normalizeReportTemplateStoredEventRuleIds,
  resolveReportTemplateWidgets,
  useReportTemplates,
} from "./useReportTemplates.js"

test("report templates keep associated event rules separate from runnable active rules", () => {
  const template = {
    eventRuleIds: ["movement", "all", "inactive-rule", "movement"],
  }

  assert.deepEqual(normalizeReportTemplateStoredEventRuleIds(template), [
    "movement",
    "inactive-rule",
  ])
  assert.deepEqual(normalizeReportTemplateEventRuleIds(template, new Set(["movement"])), [
    "movement",
  ])
  assert.equal(hasRunnableReportTemplateRules(template, new Set(["movement"])), true)
  assert.equal(hasRunnableReportTemplateRules(template, new Set(["speeding"])), false)
})

test("report event rule ids preserve system casing after edits", () => {
  assert.equal(normalizeReportEventRuleId("gpssignal"), "gpsSignal")
  assert.equal(normalizeReportEventRuleId("gps-signal"), "gpsSignal")
  assert.equal(normalizeReportEventRuleId("gpsSignal"), "gpsSignal")
})

test("report templates migrate old gps signal rule ids", () => {
  const template = {
    eventRuleIds: ["gpssignal"],
  }

  assert.deepEqual(normalizeReportTemplateStoredEventRuleIds(template), ["gpsSignal"])
  assert.deepEqual(normalizeReportTemplateEventRuleIds(template, new Set(["gpsSignal"])), [
    "gpsSignal",
  ])
  assert.equal(hasRunnableReportTemplateRules(template, new Set(["gpsSignal"])), true)
})

test("default report templates respect their configured widgets", () => {
  const { reportTemplates } = useReportTemplates()
  const tripTemplate = reportTemplates.value.find((template) => template.id === "daily-itinerary")
  const mileageTemplate = reportTemplates.value.find((template) => template.id === "fleet-summary")
  const idleTemplate = reportTemplates.value.find((template) => template.id === "idle-time-report")

  assert.ok(tripTemplate)
  assert.ok(mileageTemplate)
  assert.ok(idleTemplate)
  assert.equal(tripTemplate.widgets.includes(REPORT_WIDGET_IDS.charts), true)
  assert.equal(mileageTemplate.widgets.includes(REPORT_WIDGET_IDS.charts), false)
  assert.equal(idleTemplate.widgets.includes(REPORT_WIDGET_IDS.charts), true)
})

test("outdated stored trip report restores the full seed preset", () => {
  const tripTemplate = mockReportTemplates.find((template) => template.id === "daily-itinerary")
  const storedTemplate = {
    ...tripTemplate,
    presetVersion: 1,
    eventRuleIds: ["movement", "stops", "idle"],
    columns: ["fecha", "patente"],
    widgets: [REPORT_WIDGET_IDS.summaryCards, REPORT_WIDGET_IDS.table],
    outputOptions: {
      [REPORT_OUTPUT_OPTION_IDS.previewTripMap]: false,
      [REPORT_OUTPUT_OPTION_IDS.pdfTripMap]: false,
      [REPORT_OUTPUT_OPTION_IDS.excelTripMap]: false,
    },
  }

  assert.ok(tripTemplate)
  const mergedTemplate = mergeStoredDefaultTemplate(storedTemplate, tripTemplate)

  assert.deepEqual(mergedTemplate.columns, tripTemplate.columns)
  assert.deepEqual(mergedTemplate.widgets, tripTemplate.widgets)
  assert.deepEqual(mergedTemplate.eventRuleIds, tripTemplate.eventRuleIds)
  assert.equal(mergedTemplate.presetVersion, tripTemplate.presetVersion)
  assert.equal(mergedTemplate.outputOptions[REPORT_OUTPUT_OPTION_IDS.previewTripMap], true)
  assert.equal(mergedTemplate.outputOptions[REPORT_OUTPUT_OPTION_IDS.pdfTripMap], true)
  assert.equal(mergedTemplate.outputOptions[REPORT_OUTPUT_OPTION_IDS.excelTripMap], true)
})

test("current stored trip report keeps platform edits", () => {
  const tripTemplate = mockReportTemplates.find((template) => template.id === "daily-itinerary")
  const storedTemplate = {
    ...tripTemplate,
    columns: ["fecha", "patente", "tripStart", "tripEnd"],
    widgets: [REPORT_WIDGET_IDS.summaryCards, REPORT_WIDGET_IDS.table],
    outputOptions: {
      [REPORT_OUTPUT_OPTION_IDS.previewTripMap]: false,
    },
  }

  assert.ok(tripTemplate)
  const mergedTemplate = mergeStoredDefaultTemplate(storedTemplate, tripTemplate)

  assert.deepEqual(resolveReportTemplateWidgets(storedTemplate, tripTemplate), [
    REPORT_WIDGET_IDS.summaryCards,
    REPORT_WIDGET_IDS.table,
  ])
  assert.deepEqual(mergedTemplate.columns, ["fecha", "patente", "tripStart", "tripEnd"])
  assert.equal(mergedTemplate.outputOptions[REPORT_OUTPUT_OPTION_IDS.previewTripMap], false)
})

test("default report templates can be deleted", () => {
  const defaultTemplate = mockReportTemplates.find((template) => template.isDefault)

  assert.ok(defaultTemplate)
  assert.equal(canDeleteReportTemplate(defaultTemplate), true)
})

test("new custom report drafts start without charts to keep previews lightweight", () => {
  const draft = createEmptyReportDraft()

  assert.equal(draft.widgets.includes(REPORT_WIDGET_IDS.charts), false)
})

test("new report drafts start with platform output options enabled", () => {
  const draft = createEmptyReportDraft()

  assert.equal(draft.outputOptions[REPORT_OUTPUT_OPTION_IDS.excelExport], true)
  assert.equal(draft.outputOptions[REPORT_OUTPUT_OPTION_IDS.pdfExport], true)
  assert.equal(draft.outputOptions[REPORT_OUTPUT_OPTION_IDS.previewTripMap], true)
})

test("new report drafts start with platform behavior options enabled", () => {
  const draft = createEmptyReportDraft()

  assert.equal(draft.behaviorOptions[REPORT_BEHAVIOR_OPTION_IDS.resolveAddresses], true)
  assert.equal(draft.behaviorOptions[REPORT_BEHAVIOR_OPTION_IDS.resolveTripEndpoints], true)
  assert.equal(
    draft.behaviorOptions[REPORT_BEHAVIOR_OPTION_IDS.reverseGeocodeExportLimit],
    DEFAULT_REPORT_REVERSE_GEOCODE_EXPORT_LIMIT,
  )
})

test("default report templates keep editable output options", () => {
  const { reportTemplates } = useReportTemplates()
  const tripReport = reportTemplates.value.find((template) => template.id === "daily-itinerary")

  assert.ok(tripReport)
  assert.equal(tripReport.outputOptions[REPORT_OUTPUT_OPTION_IDS.excelExport], true)
  assert.equal(tripReport.outputOptions[REPORT_OUTPUT_OPTION_IDS.pdfTripMap], true)
  assert.equal(tripReport.outputOptions[REPORT_OUTPUT_OPTION_IDS.excelTripMap], true)
})

test("default report templates keep editable behavior options", () => {
  const { reportTemplates } = useReportTemplates()
  const tripReport = reportTemplates.value.find((template) => template.id === "daily-itinerary")

  assert.ok(tripReport)
  assert.equal(
    tripReport.behaviorOptions[REPORT_BEHAVIOR_OPTION_IDS.routeTripIncludeStopEvents],
    true,
  )
  assert.equal(
    tripReport.behaviorOptions[REPORT_BEHAVIOR_OPTION_IDS.routeTripIncludeIdleEvents],
    true,
  )
  assert.equal(
    tripReport.behaviorOptions[REPORT_BEHAVIOR_OPTION_IDS.reverseGeocodeExportLimit],
    DEFAULT_REPORT_REVERSE_GEOCODE_EXPORT_LIMIT,
  )
})

test("default trip report is composed by movement, stop, idle and trip-end rules", () => {
  const tripReport = mockReportTemplates.find((template) => template.id === "daily-itinerary")

  assert.ok(tripReport)
  assert.deepEqual(tripReport.eventRuleIds, ["movement", "stops", "idle", "tripEnd"])
})

test("default idle-time report is based on the ralenti event rule", () => {
  const idleReport = mockReportTemplates.find((template) => template.id === "idle-time-report")

  assert.ok(idleReport)
  assert.equal(idleReport.reportTypeId, "idle-time")
  assert.deepEqual(idleReport.eventRuleIds, ["idle"])
  assert.deepEqual(idleReport.widgets, ["summaryCards", "table", "charts"])

  for (const columnId of ["fecha", "timestamp", "patente", "duracion", "address"]) {
    assert.ok(idleReport.columns.includes(columnId), `missing ${columnId}`)
  }
})

test("default geofence report includes address", () => {
  const geofenceReport = mockReportTemplates.find((template) => template.id === "geofence-events")

  assert.ok(geofenceReport)
  assert.equal(geofenceReport.reportTypeId, "geofences")

  for (const columnId of [
    "fecha",
    "timestamp",
    "patente",
    "vehiculo",
    "geocerca",
    "evento",
    "duracion",
    "address",
  ]) {
    assert.ok(geofenceReport.columns.includes(columnId), `missing ${columnId}`)
  }
})

test("default gps signal report includes satellites", () => {
  const gpsSignalReport = mockReportTemplates.find(
    (template) => template.id === "gps-signal-report",
  )

  assert.ok(gpsSignalReport)
  assert.equal(gpsSignalReport.reportTypeId, "gps-signal")
  assert.deepEqual(gpsSignalReport.eventRuleIds, ["gpsSignal"])
  assert.ok(gpsSignalReport.columns.includes("gpsSatellites"))
})

test("default alerts report is not part of the base catalog", () => {
  const { reportTemplates } = useReportTemplates()

  assert.equal(
    mockReportTemplates.some((template) => template.id === "alerts-report"),
    false,
  )
  assert.equal(
    reportTemplates.value.some((template) => template.id === "alerts-report"),
    false,
  )
})
