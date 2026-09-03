import { sortAssetReportRowsByVehicle } from "../execution/assetReportExecutionUtils.js"

const EXCEL_COLORS = {
  navy: "FF102372",
  navySoft: "FFF1F4FF",
  orange: "FFFF6600",
  orangeSoft: "FFFFF7ED",
  surface: "FFFFFFFF",
  rowAlt: "FFF8FAFC",
  border: "FFE2E8F0",
  text: "FF172033",
  muted: "FF64748B",
  white: "FFFFFFFF",

  successFill: "FFECFDF5",
  successText: "FF047857",

  warningFill: "FFFFF7ED",
  warningText: "FFC2410C",

  dangerFill: "FFFFF1F2",
  dangerText: "FFBE123C",
}

const VEHICLE_COLUMN_KEYS = new Set([
  "vehiculo",
  "patente",
  "vehicle",
  "vehicleId",
  "deviceId",
  "dispositivo",
])

const STATUS_COLUMN_KEYS = new Set(["estado", "status", "resultado", "result"])

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

const normalizeColumnKey = (value) => {
  return String(value ?? "")
    .trim()
    .toLowerCase()
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

const applyExcelHeaderBorder = (cell) => {
  cell.border = {
    top: {
      style: "thin",
      color: { argb: EXCEL_COLORS.navy },
    },
    left: {
      style: "thin",
      color: { argb: EXCEL_COLORS.navy },
    },
    right: {
      style: "thin",
      color: { argb: EXCEL_COLORS.navy },
    },
    bottom: {
      style: "medium",
      color: { argb: EXCEL_COLORS.orange },
    },
  }
}

const applyExcelDataBorder = (cell) => {
  cell.border = {
    bottom: {
      style: "thin",
      color: { argb: EXCEL_COLORS.border },
    },
  }
}

const styleExcelHeaderRow = (row, columnCount) => {
  row.height = 30

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
      size: 11,
    }

    cell.alignment = {
      vertical: "middle",
      horizontal: "left",
      wrapText: true,
      indent: 1,
    }

    applyExcelHeaderBorder(cell)
  }
}

const getStatusStyle = (value) => {
  const normalizedValue = String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  if (
    ["correcto", "success", "exitoso", "completado", "completa", "ok"].includes(normalizedValue)
  ) {
    return {
      fill: EXCEL_COLORS.successFill,
      text: EXCEL_COLORS.successText,
    }
  }

  if (["alerta", "warning", "advertencia", "pendiente", "atencion"].includes(normalizedValue)) {
    return {
      fill: EXCEL_COLORS.warningFill,
      text: EXCEL_COLORS.warningText,
    }
  }

  if (["fallido", "failed", "error", "rechazado", "rechazada"].includes(normalizedValue)) {
    return {
      fill: EXCEL_COLORS.dangerFill,
      text: EXCEL_COLORS.dangerText,
    }
  }

  return null
}

const styleExcelDataRows = (worksheet, startRow, endRow, reportColumns) => {
  const columnCount = reportColumns.length

  for (let rowNumber = startRow; rowNumber <= endRow; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber)

    row.height = 25

    for (let columnIndex = 1; columnIndex <= columnCount; columnIndex += 1) {
      const cell = row.getCell(columnIndex)
      const column = reportColumns[columnIndex - 1]
      const columnKey = normalizeColumnKey(column?.key)

      const isVehicleColumn = VEHICLE_COLUMN_KEYS.has(columnKey)
      const isStatusColumn = STATUS_COLUMN_KEYS.has(columnKey)

      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: {
          argb: rowNumber % 2 === 0 ? EXCEL_COLORS.rowAlt : EXCEL_COLORS.surface,
        },
      }

      cell.font = {
        color: {
          argb: isVehicleColumn ? EXCEL_COLORS.navy : EXCEL_COLORS.text,
        },
        bold: isVehicleColumn,
        size: 10,
      }

      cell.alignment = {
        vertical: "middle",
        horizontal: typeof cell.value === "number" ? "right" : isStatusColumn ? "center" : "left",
        wrapText: true,
        indent: isVehicleColumn ? 1 : 0,
      }

      applyExcelDataBorder(cell)

      if (isStatusColumn) {
        const statusStyle = getStatusStyle(cell.value)

        if (statusStyle) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: statusStyle.fill },
          }

          cell.font = {
            color: { argb: statusStyle.text },
            bold: true,
            size: 10,
          }
        }
      }
    }
  }
}

const styleExcelTitleBackground = (worksheet, columnCount) => {
  for (let rowNumber = 1; rowNumber <= 2; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber)

    for (let columnIndex = 1; columnIndex <= columnCount; columnIndex += 1) {
      const cell = row.getCell(columnIndex)

      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: EXCEL_COLORS.white },
      }
    }
  }
}

const styleExcelMetadataRow = (worksheet, columnCount) => {
  const row = worksheet.getRow(3)

  for (let columnIndex = 1; columnIndex <= columnCount; columnIndex += 1) {
    const cell = row.getCell(columnIndex)

    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: EXCEL_COLORS.white },
    }

    cell.border = {
      bottom: {
        style: "medium",
        color: { argb: EXCEL_COLORS.orange },
      },
    }
  }
}

const addExcelTitle = (
  worksheet,
  title,
  subtitle,
  lastColumn,
  generatedAt = "",
  columnCount = 1,
) => {
  worksheet.mergeCells(`A1:${lastColumn}2`)

  styleExcelTitleBackground(worksheet, columnCount)

  const titleCell = worksheet.getCell("A1")

  titleCell.value = title

  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: EXCEL_COLORS.white },
  }

  titleCell.font = {
    color: { argb: EXCEL_COLORS.navy },
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
  worksheet.getRow(2).height = 18

  styleExcelMetadataRow(worksheet, columnCount)

  if (columnCount >= 4 && generatedAt) {
    const subtitleEndColumnNumber = Math.max(2, Math.floor(columnCount * 0.65))

    const subtitleEndColumn = getExcelColumnName(subtitleEndColumnNumber)

    const generatedStartColumn = getExcelColumnName(subtitleEndColumnNumber + 1)

    worksheet.mergeCells(`A3:${subtitleEndColumn}3`)
    worksheet.mergeCells(`${generatedStartColumn}3:${lastColumn}3`)

    const subtitleCell = worksheet.getCell("A3")

    subtitleCell.value = subtitle
    subtitleCell.font = {
      color: { argb: EXCEL_COLORS.navy },
      bold: true,
      size: 10,
    }

    subtitleCell.alignment = {
      vertical: "middle",
      horizontal: "left",
      indent: 1,
    }

    const generatedCell = worksheet.getCell(`${generatedStartColumn}3`)

    generatedCell.value = `Generado: ${generatedAt}`

    generatedCell.font = {
      color: { argb: EXCEL_COLORS.muted },
      bold: true,
      size: 9,
    }

    generatedCell.alignment = {
      vertical: "middle",
      horizontal: "right",
      indent: 1,
    }
  } else {
    worksheet.mergeCells(`A3:${lastColumn}3`)

    const subtitleCell = worksheet.getCell("A3")

    subtitleCell.value = generatedAt ? `${subtitle}  •  Generado: ${generatedAt}` : subtitle

    subtitleCell.font = {
      color: { argb: EXCEL_COLORS.navy },
      bold: true,
      size: 10,
    }

    subtitleCell.alignment = {
      vertical: "middle",
      horizontal: "left",
      indent: 1,
    }
  }

  worksheet.getRow(3).height = 25
  worksheet.getRow(4).height = 10
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
      const values = (item.values || []).map((value) => {
        return parseExcelChartNumber(value)
      })

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
        labels: values.map((_, valueIndex) => {
          return labels[valueIndex] || `Dato ${valueIndex + 1}`
        }),
        values,
        colors: (item.colors || []).map((color) => {
          return color || "#64748b"
        }),
      }
    })
    .filter(Boolean)

  return items.length ? { items } : null
}

export const getExcelColumnWidth = (column) => {
  const labelWidth = String(column?.label || "").length + 5

  if (column?.key === "ultimoDato") return 26
  if (column?.key === "vehiculo") return 24
  if (column?.key === "conductor") return 24

  return Math.min(36, Math.max(14, labelWidth))
}

export const buildReportDataWorksheet = (
  workbook,
  { template, reportColumns, reportRows, generatedAt = "" },
) => {
  const sortedReportRows = getSortedReportRowsByDevice(reportRows)

  const columnCount = Math.max(1, reportColumns.length)
  const lastColumn = getExcelColumnName(columnCount)

  const worksheet = workbook.addWorksheet("Datos reporte", {
    views: [
      {
        state: "frozen",
        ySplit: 5,
        activeCell: "A6",
        showGridLines: false,
      },
    ],
    pageSetup: {
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: {
        left: 0.3,
        right: 0.3,
        top: 0.5,
        bottom: 0.5,
        header: 0.2,
        footer: 0.2,
      },
    },
  })

  worksheet.properties.defaultRowHeight = 20

  worksheet.columns = reportColumns.map((column) => ({
    key: column.key,
    width: getExcelColumnWidth(column),
  }))

  addExcelTitle(
    worksheet,
    template?.name || "Reporte de activos",
    `${reportRows.length} ${
      reportRows.length === 1 ? "registro exportado" : "registros exportados"
    }`,
    lastColumn,
    generatedAt,
    columnCount,
  )

  const headerRow = worksheet.getRow(5)

  headerRow.values = reportColumns.map((column) => {
    return column.label
  })

  styleExcelHeaderRow(headerRow, reportColumns.length)

  sortedReportRows.forEach((reportRow) => {
    worksheet.addRow(
      reportColumns.map((column) => {
        return reportRow.values[column.key] ?? "-"
      }),
    )
  })

  if (sortedReportRows.length) {
    styleExcelDataRows(worksheet, 6, 5 + sortedReportRows.length, reportColumns)
  }

  worksheet.autoFilter = `A5:${lastColumn}5`

  worksheet.pageSetup.printTitlesRow = "1:5"
  worksheet.pageSetup.printArea = `A1:${lastColumn}${Math.max(5, 5 + sortedReportRows.length)}`

  worksheet.headerFooter = {
    oddFooter: '&L&"Arial"&9Sinergy GPS&C&"Arial"&9Página &P de &N&R&"Arial"&9Reporte generado',
  }

  return worksheet
}
