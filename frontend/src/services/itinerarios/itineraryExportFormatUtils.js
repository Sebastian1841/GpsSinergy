export const asText = (value, fallback = "-") => {
  const text = String(value ?? "").trim()
  return text || fallback
}

export const getExcelColumnName = (columnNumber) => {
  let currentNumber = columnNumber
  let columnName = ""

  while (currentNumber > 0) {
    const remainder = (currentNumber - 1) % 26
    columnName = String.fromCharCode(65 + remainder) + columnName
    currentNumber = Math.floor((currentNumber - 1) / 26)
  }

  return columnName
}

export const getExcelColumnNumber = (columnName) => {
  return String(columnName || "")
    .toUpperCase()
    .split("")
    .reduce((total, character) => total * 26 + character.charCodeAt(0) - 64, 0)
}

export const normalizeSortText = (value) => {
  return String(value ?? "").trim()
}

export const compareSortText = (firstValue, secondValue) => {
  const firstText = normalizeSortText(firstValue)
  const secondText = normalizeSortText(secondValue)

  if (!firstText && secondText) return 1
  if (firstText && !secondText) return -1

  return firstText.localeCompare(secondText, "es", {
    numeric: true,
    sensitivity: "base",
  })
}

export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement("a")

  link.href = url
  link.download = filename
  link.click()

  window.setTimeout(() => {
    window.URL.revokeObjectURL(url)
  }, 1000)
}

export const parseExcelChartNumber = (value) => {
  const parsedValue = Number(
    String(value ?? "")
      .replace(",", ".")
      .replace(/[^\d.-]/g, ""),
  )

  return Number.isFinite(parsedValue) ? parsedValue : 0
}

export const compactExcelTimeLabel = (time) => {
  return String(time || "")
    .trim()
    .replace(/^(\d{1,2}:\d{2}):\d{2}/, "$1")
}
