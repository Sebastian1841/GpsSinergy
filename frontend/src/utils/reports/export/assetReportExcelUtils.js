import { sortAssetReportRowsByVehicle } from "../execution/assetReportExecutionUtils.js"

const EXCEL_COLORS = {
  navy: "FF102372",
  orange: "FFFF6600",
  light: "FFF8FAFC",
  paleOrange: "FFFFF7ED",
  border: "FFD8DEE8",
  text: "FF172033",
  white: "FFFFFFFF",
}

const asText = (value, fallback = "-") => {
  const text = String(value ?? "").trim()
  return text || fallback
}

const normalizeSortText = (value) => {
  return String(value ?? "").trim()
}

const compareSortText = (firstValue, secondValue) => {
  const firstText = normalizeSortText(firstValue)
  const secondText = normalizeSortText(secondValue)

  if (!firstText && secondText) return 1
  if (firstText && !secondText) return -1

  return firstText.localeCompare(secondText, "es", {
    numeric: true,
    sensitivity: "base",
  })
}

const getReportRowDeviceId = (row = {}) => {
  return normalizeSortText(
    row.values?.patente ||
      row.values?.vehiculo ||
      row.values?.deviceId ||
      row.values?.dispositivo ||
      row.values?.imei ||
      row.report?.patente ||
      row.report?.patent ||
      row.report?.deviceId ||
      row.generatedEvent?.report?.deviceId ||
      row.asset?.patente ||
      row.asset?.patent ||
      row.asset?.deviceId ||
      row.asset?.imei,
  )
}

const getSortedReportRowsByDevice = (rows = []) => {
  return sortAssetReportRowsByVehicle(rows).sort((firstRow, secondRow) => {
    return compareSortText(getReportRowDeviceId(firstRow), getReportRowDeviceId(secondRow))
  })
}

const getExcelColumnName = (columnNumber) => {
  let currentNumber = columnNumber
  let columnName = ""

  while (currentNumber > 0) {
    const remainder = (currentNumber - 1) % 26
    columnName = String.fromCharCode(65 + remainder) + columnName
    currentNumber = Math.floor((currentNumber - 1) / 26)
  }

  return columnName
}

const applyExcelBorder = (cell) => {
  cell.border = {
    top: { style: "thin", color: { argb: EXCEL_COLORS.border } },
    left: { style: "thin", color: { argb: EXCEL_COLORS.border } },
    bottom: { style: "thin", color: { argb: EXCEL_COLORS.border } },
    right: { style: "thin", color: { argb: EXCEL_COLORS.border } },
  }
}

const styleExcelHeaderRow = (row, columnCount) => {
  row.height = 24

  for (let columnIndex = 1; columnIndex <= columnCount; columnIndex += 1) {
    const cell = row.getCell(columnIndex)

    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: EXCEL_COLORS.navy },
    }
    cell.font = {
      color: { argb: EXCEL_COLORS.white },
      bold: true,
      size: 10,
    }
    cell.alignment = {
      vertical: "middle",
      horizontal: "left",
      wrapText: true,
    }
    applyExcelBorder(cell)
  }
}

const styleExcelDataRows = (worksheet, startRow, endRow, columnCount) => {
  for (let rowNumber = startRow; rowNumber <= endRow; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber)
    row.height = 22

    for (let columnIndex = 1; columnIndex <= columnCount; columnIndex += 1) {
      const cell = row.getCell(columnIndex)

      if (rowNumber % 2 === 0) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: EXCEL_COLORS.light },
        }
      }

      cell.font = {
        color: { argb: EXCEL_COLORS.text },
        size: 10,
      }
      cell.alignment = {
        vertical: "middle",
        wrapText: true,
      }

      applyExcelBorder(cell)
    }
  }
}

const addExcelTitle = (worksheet, title, subtitle, lastColumn, generatedAt = "") => {
  worksheet.mergeCells(`A1:${lastColumn}2`)
  const titleCell = worksheet.getCell("A1")

  titleCell.value = title
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: EXCEL_COLORS.navy },
  }
  titleCell.font = {
    color: { argb: EXCEL_COLORS.white },
    bold: true,
    size: 20,
  }
  titleCell.alignment = {
    vertical: "middle",
    horizontal: "left",
    indent: 1,
  }
  titleCell.border = {
    left: {
      style: "thick",
      color: { argb: EXCEL_COLORS.orange },
    },
  }

  worksheet.getRow(1).height = 28
  worksheet.getRow(2).height = 16

  worksheet.mergeCells(`A3:${lastColumn}3`)
  const subtitleCell = worksheet.getCell("A3")

  subtitleCell.value = generatedAt ? `${subtitle} | Generado: ${generatedAt}` : subtitle
  subtitleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: EXCEL_COLORS.paleOrange },
  }
  subtitleCell.font = {
    color: { argb: EXCEL_COLORS.orange },
    bold: true,
    size: 10,
  }
  subtitleCell.alignment = {
    vertical: "middle",
    horizontal: "left",
    indent: 1,
  }
  subtitleCell.border = {
    bottom: {
      style: "medium",
      color: { argb: EXCEL_COLORS.orange },
    },
  }

  worksheet.getRow(3).height = 23
  worksheet.getRow(4).height = 9
}

export const parseExcelChartNumber = (value) => {
  if (value === null || value === undefined || value === "") return 0
  if (typeof value === "boolean") return value ? 1 : 0

  const stateValue = String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  if (
    ["on", "si", "yes", "true", "active", "activo", "activa", "encendido", "encendida"].includes(
      stateValue,
    )
  ) {
    return 1
  }

  if (
    ["off", "no", "false", "inactive", "inactivo", "inactiva", "apagado", "apagada"].includes(
      stateValue,
    )
  ) {
    return 0
  }

  const match = String(value).match(/-?\d[\d.,]*/)

  if (!match) return 0

  const rawNumber = match[0]
  const hasComma = rawNumber.includes(",")
  const hasDot = rawNumber.includes(".")
  const normalizedNumber =
    hasComma && hasDot
      ? rawNumber.replace(/\./g, "").replace(",", ".")
      : hasComma
        ? rawNumber.replace(",", ".")
        : hasDot && (rawNumber.split(".").length > 2 || rawNumber.split(".").at(-1)?.length === 3)
          ? rawNumber.replace(/\./g, "")
          : rawNumber
  const parsedValue = Number(normalizedNumber)

  return Number.isFinite(parsedValue) ? parsedValue : 0
}

export const normalizeReportChartData = (charts = {}) => {
  if (charts.enabled === false || !charts.items?.length) return null

  const items = charts.items
    .map((item, index) => {
      const values = (item.values || []).map((value) => parseExcelChartNumber(value))
      const labels = (item.labels || []).map((label, labelIndex) => {
        return asText(label, `Dato ${labelIndex + 1}`)
      })

      if (!values.length) return null

      return {
        id: asText(item.id, `chart-${index + 1}`),
        type: ["bar", "line", "doughnut"].includes(item.type) ? item.type : "bar",
        key: asText(item.key, "speed"),
        label: asText(item.label, `Grafico ${index + 1}`),
        unit: asText(item.unit, ""),
        decimals: Math.max(0, parseExcelChartNumber(item.decimals)),
        color: item.color || "#2563eb",
        maximum: Number.isFinite(Number(item.maximum)) ? Number(item.maximum) : null,
        labels: values.map((_, valueIndex) => labels[valueIndex] || `Dato ${valueIndex + 1}`),
        values,
        colors: (item.colors || []).map((color) => color || "#64748b"),
      }
    })
    .filter(Boolean)

  return items.length ? { items } : null
}

export const getExcelColumnWidth = (column) => {
  const labelWidth = String(column?.label || "").length + 5

  if (column?.key === "ultimoDato") return 24
  if (column?.key === "vehiculo") return 28
  if (column?.key === "conductor") return 22

  return Math.min(34, Math.max(14, labelWidth))
}

export const buildReportDataWorksheet = (
  workbook,
  { template, reportColumns, reportRows, generatedAt = "" },
) => {
  const sortedReportRows = getSortedReportRowsByDevice(reportRows)
  const columnCount = Math.max(1, reportColumns.length)
  const lastColumn = getExcelColumnName(columnCount)
  const worksheet = workbook.addWorksheet("Datos reporte", {
    views: [{ showGridLines: false }],
    pageSetup: {
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    },
  })

  worksheet.columns = reportColumns.map((column) => ({
    key: column.key,
    width: getExcelColumnWidth(column),
  }))

  addExcelTitle(
    worksheet,
    `${template?.name || "Reporte de activos"} - datos`,
    `${reportRows.length} filas exportadas con todas las variables`,
    lastColumn,
    generatedAt,
  )

  const headerRow = worksheet.getRow(5)
  headerRow.values = reportColumns.map((column) => column.label)
  styleExcelHeaderRow(headerRow, reportColumns.length)

  sortedReportRows.forEach((reportRow) => {
    worksheet.addRow(reportColumns.map((column) => reportRow.values[column.key] ?? "-"))
  })

  if (sortedReportRows.length) {
    styleExcelDataRows(worksheet, 6, 5 + sortedReportRows.length, reportColumns.length)
  }

  worksheet.autoFilter = `A5:${lastColumn}5`

  return worksheet
}
