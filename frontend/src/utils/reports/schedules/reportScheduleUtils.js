export const REPORT_SCHEDULE_FREQUENCIES = [
  { id: "daily", label: "Diario" },
  { id: "weekly", label: "Semanal" },
  { id: "monthly", label: "Mensual" },
]

export const REPORT_SCHEDULE_RANGE_OPTIONS = [
  { id: "previous-day", label: "Dia anterior" },
  { id: "last-7-days", label: "Ultimos 7 dias" },
  { id: "last-30-days", label: "Ultimos 30 dias" },
  { id: "current-month", label: "Mes actual" },
]

export const REPORT_SCHEDULE_FORMAT_OPTIONS = [
  { id: "pdf", label: "PDF" },
  { id: "excel", label: "Excel" },
  { id: "both", label: "PDF + Excel" },
]

export const REPORT_SCHEDULE_WEEKDAY_OPTIONS = [
  { id: 1, label: "Lun" },
  { id: 2, label: "Mar" },
  { id: 3, label: "Mie" },
  { id: 4, label: "Jue" },
  { id: 5, label: "Vie" },
  { id: 6, label: "Sab" },
  { id: 0, label: "Dom" },
]

export const REPORT_SCHEDULE_QUICK_PRESETS = [
  {
    id: "speed-weekly",
    label: "Velocidad semanal",
    detail: "Lun 08:00 / 7 dias / PDF + Excel",
    reportTypeIds: ["speed"],
    eventRuleIds: ["speeding"],
    keywords: ["velocidad", "exceso", "speed"],
    values: {
      frequency: "weekly",
      time: "08:00",
      weekday: 1,
      monthDay: 1,
      rangeType: "last-7-days",
      format: "both",
    },
  },
  {
    id: "idle-daily",
    label: "Ralenti diario",
    detail: "Cada dia 07:30 / dia anterior / PDF",
    reportTypeIds: ["idle-time"],
    eventRuleIds: ["idle"],
    keywords: ["ralenti", "idle"],
    values: {
      frequency: "daily",
      time: "07:30",
      weekday: 1,
      monthDay: 1,
      rangeType: "previous-day",
      format: "pdf",
    },
  },
  {
    id: "geofence-monthly",
    label: "Geocercas mensual",
    detail: "Dia 1 / mes actual / Excel",
    reportTypeIds: ["geofences"],
    eventRuleIds: ["geofence"],
    keywords: ["geocerca", "geofence"],
    values: {
      frequency: "monthly",
      time: "09:00",
      weekday: 1,
      monthDay: 1,
      rangeType: "current-month",
      format: "excel",
    },
  },
  {
    id: "fuel-weekly",
    label: "Combustible semanal",
    detail: "Vie 08:30 / 7 dias / Excel",
    reportTypeIds: ["fuel"],
    eventRuleIds: ["fuel"],
    keywords: ["combustible", "fuel"],
    values: {
      frequency: "weekly",
      time: "08:30",
      weekday: 5,
      monthDay: 1,
      rangeType: "last-7-days",
      format: "excel",
    },
  },
]

export const normalizeScheduleRecipients = (value = []) => {
  const values = Array.isArray(value) ? value : String(value || "").split(/[,\n;]/g)

  return Array.from(new Set(values.map((item) => String(item || "").trim()).filter(Boolean)))
}

export const getReportScheduleOptionLabel = (options, optionId, fallback = "-") => {
  return options.find((option) => String(option.id) === String(optionId))?.label || fallback
}

export const getReportScheduleFrequencyLabel = (frequency) => {
  return getReportScheduleOptionLabel(REPORT_SCHEDULE_FREQUENCIES, frequency, "Diario")
}

export const getReportScheduleRangeLabel = (rangeType) => {
  return getReportScheduleOptionLabel(REPORT_SCHEDULE_RANGE_OPTIONS, rangeType, "Dia anterior")
}

export const getReportScheduleFormatLabel = (format) => {
  return getReportScheduleOptionLabel(REPORT_SCHEDULE_FORMAT_OPTIONS, format, "PDF")
}

export const getReportScheduleWeekdayLabel = (weekday) => {
  return getReportScheduleOptionLabel(REPORT_SCHEDULE_WEEKDAY_OPTIONS, Number(weekday), "Lun")
}
