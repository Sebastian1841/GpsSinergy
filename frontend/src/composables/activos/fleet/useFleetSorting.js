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

  const parseSortableNumber = (value) => {
    if (value === null || value === undefined) return null

    const match = String(value)
      .replace(/\./g, "")
      .replace(",", ".")
      .match(/-?\d+(\.\d+)?/)

    return match ? Number(match[0]) : null
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
    if (column.key === "estado") {
      return statusOrder[activo.estado] || 99
    }

    const value = typeof getCellValue === "function"
      ? getCellValue(activo, column)
      : activo?.[column.key]

    if (["velocidad", "combustible", "odometro", "horometroDiario", "horometroTotal"].includes(column.key)) {
      return parseSortableNumber(value)
    }

    if (["datosUlt", "last_report", "lastReport", "fecha", "fechaIngreso", "fechaBaja", "fechaSuspension"].includes(column.key)) {
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

    return String(valueA).localeCompare(String(valueB), "es", {
      numeric: true,
      sensitivity: "base",
    })
  }

  const sortedActivos = computed(() => {
    if (!sortColumnKey.value) {
      return safeActivos.value
    }

    const column = safeColumns.value.find((item) => item.key === sortColumnKey.value)

    if (!column) {
      return safeActivos.value
    }

    return [...safeActivos.value].sort((activoA, activoB) => {
      const valueA = getSortableValue(activoA, column)
      const valueB = getSortableValue(activoB, column)
      const result = compareValues(valueA, valueB)

      return sortDirection.value === "asc" ? result : result * -1
    })
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