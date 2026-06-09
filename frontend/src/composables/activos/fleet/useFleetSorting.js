import { computed, ref, unref } from "vue"

const defaultNormalizeText = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
}

const statusOrder = {
  moving: 1,
  idle: 2,
  stopped: 3,
  offline: 4,
}

const numericColumnKeys = new Set([
  "velocidad",
  "combustible",
  "odometro",
  "horometroDiario",
  "horometroTotal",
])

const dateColumnKeys = new Set([
  "datosUlt",
  "last_report",
  "lastReport",
  "fecha",
  "fechaIngreso",
  "fechaBaja",
  "fechaSuspension",
])

const textCollator = new Intl.Collator("es", {
  numeric: true,
  sensitivity: "base",
})

export function useFleetSorting({
  activos,
  columns,
  getCellValue,
  normalizeText = defaultNormalizeText,
} = {}) {
  const sortColumnKey = ref("")
  const sortDirection = ref("asc")

  const safeActivos = computed(() => {
    const value = unref(activos)

    return Array.isArray(value) ? value : []
  })

  const safeColumns = computed(() => {
    const value = unref(columns)

    return Array.isArray(value) ? value : []
  })

  const activeSortColumn = computed(() => {
    if (!sortColumnKey.value) return null

    return safeColumns.value.find((item) => item.key === sortColumnKey.value) || null
  })

  const parseSortableNumber = (value) => {
    if (value === null || value === undefined) return null

    const match = String(value)
      .replace(/\./g, "")
      .replace(",", ".")
      .match(/-?\d+(\.\d+)?/)

    if (!match) return null

    const parsedValue = Number(match[0])

    return Number.isFinite(parsedValue) ? parsedValue : null
  }

  const parseSortableDate = (value) => {
    if (!value) return null

    const rawValue = String(value).trim()

    if (/^\d{4}-\d{2}-\d{2}/.test(rawValue)) {
      const timestamp = new Date(rawValue).getTime()
      return Number.isNaN(timestamp) ? null : timestamp
    }

    if (/^\d{2}-\d{2}-\d{4}$/.test(rawValue)) {
      const [day, month, year] = rawValue.split("-")
      const timestamp = new Date(`${year}-${month}-${day}T00:00:00`).getTime()
      return Number.isNaN(timestamp) ? null : timestamp
    }

    if (/^\d{1,2}:\d{2}/.test(rawValue)) {
      const [hour, minute, second = "0"] = rawValue.split(":")
      return Number(hour) * 3600 + Number(minute) * 60 + Number(second)
    }

    const timestamp = new Date(rawValue).getTime()
    return Number.isNaN(timestamp) ? null : timestamp
  }

  const getSortableValue = (activo, column) => {
    if (!column?.key) return ""

    if (column.key === "estado") {
      return statusOrder[activo?.estado] || 99
    }

    const value =
      typeof getCellValue === "function" ? getCellValue(activo, column) : activo?.[column.key]

    if (numericColumnKeys.has(column.key)) {
      return parseSortableNumber(value)
    }

    if (dateColumnKeys.has(column.key)) {
      return parseSortableDate(value)
    }

    return normalizeText(value)
  }

  const compareValues = (valueA, valueB) => {
    const emptyA = valueA === null || valueA === undefined || valueA === ""
    const emptyB = valueB === null || valueB === undefined || valueB === ""

    if (emptyA && emptyB) return 0
    if (emptyA) return 1
    if (emptyB) return -1

    if (typeof valueA === "number" && typeof valueB === "number") {
      return valueA - valueB
    }

    return textCollator.compare(String(valueA), String(valueB))
  }

  const sortedActivos = computed(() => {
    const activosList = safeActivos.value
    const column = activeSortColumn.value

    if (!column) {
      return activosList
    }

    const directionMultiplier = sortDirection.value === "asc" ? 1 : -1

    return activosList
      .map((activo, index) => {
        return {
          activo,
          index,
          sortValue: getSortableValue(activo, column),
        }
      })
      .sort((itemA, itemB) => {
        const result = compareValues(itemA.sortValue, itemB.sortValue)

        if (result !== 0) {
          return result * directionMultiplier
        }

        return itemA.index - itemB.index
      })
      .map((item) => item.activo)
  })

  const toggleSort = (columnKey) => {
    if (sortColumnKey.value !== columnKey) {
      sortColumnKey.value = columnKey
      sortDirection.value = "asc"
      return
    }

    sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc"
  }

  const clearSort = () => {
    sortColumnKey.value = ""
    sortDirection.value = "asc"
  }

  const getSortIcon = (columnKey) => {
    if (sortColumnKey.value !== columnKey) return "↕"

    return sortDirection.value === "asc" ? "↑" : "↓"
  }

  return {
    sortColumnKey,
    sortDirection,
    sortedActivos,
    toggleSort,
    clearSort,
    getSortIcon,
    parseSortableNumber,
    parseSortableDate,
  }
}
