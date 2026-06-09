import { computed, ref, unref, watch } from "vue"

const defaultNormalizeText = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
}

const buildColumnsSignature = (columns = []) => {
  if (!Array.isArray(columns)) return ""

  return columns
    .map((column) => {
      return [
        column.key,
        column.label,
        column.width,
        column.align,
        column.locked,
        column.defaultVisible,
      ]
        .map((value) => String(value ?? ""))
        .join(":")
    })
    .join("|")
}

const clampColumnWidth = (value, fallback = 110) => {
  const numberValue = Number(value)

  if (!Number.isFinite(numberValue)) return fallback

  return Math.min(Math.max(numberValue, 72), 420)
}

const parseColumnWidth = (value, fallback = 110) => {
  if (typeof value === "number") return clampColumnWidth(value, fallback)

  const match = String(value || "").match(/-?\d+(\.\d+)?/)
  const parsedValue = match ? Number(match[0]) : fallback

  return clampColumnWidth(parsedValue, fallback)
}

export function useFleetColumns({ columns, normalizeText = defaultNormalizeText } = {}) {
  const columnSearch = ref("")
  const visibleColumnKeys = ref([])
  const columnOrderKeys = ref([])
  const columnWidthsByKey = ref({})

  const safeColumns = computed(() => {
    const value = unref(columns)

    return Array.isArray(value) ? value : []
  })

  const columnsSignature = computed(() => {
    return buildColumnsSignature(safeColumns.value)
  })

  const defaultColumnKeys = computed(() => {
    return safeColumns.value
      .filter((column) => column.defaultVisible !== false)
      .map((column) => column.key)
  })

  const orderedColumns = computed(() => {
    const columnsByKey = new Map(safeColumns.value.map((column) => [column.key, column]))
    const orderedKeys = columnOrderKeys.value.filter((key) => columnsByKey.has(key))
    const missingKeys = safeColumns.value
      .map((column) => column.key)
      .filter((key) => !orderedKeys.includes(key))

    return [...orderedKeys, ...missingKeys].map((key) => columnsByKey.get(key))
  })

  const configurableColumns = computed(() => orderedColumns.value)

  const filteredConfigurableColumns = computed(() => {
    const term = normalizeText(columnSearch.value)

    if (!term) return configurableColumns.value

    return configurableColumns.value.filter((column) => {
      return normalizeText(`${column.label} ${column.key}`).includes(term)
    })
  })

  const visibleColumns = computed(() => {
    const selected = new Set(visibleColumnKeys.value)

    return orderedColumns.value
      .filter((column) => {
        return column.locked || selected.has(column.key)
      })
      .map((column) => ({
        ...column,
        width: `${columnWidthsByKey.value[column.key] || parseColumnWidth(column.width)}px`,
      }))
  })

  const firstVisibleColumnKey = computed(() => {
    return visibleColumns.value[0]?.key || ""
  })

  const resetColumns = () => {
    visibleColumnKeys.value = [...defaultColumnKeys.value]
    columnOrderKeys.value = safeColumns.value.map((column) => column.key)
    columnWidthsByKey.value = {}
    columnSearch.value = ""
  }

  const setColumnWidth = (columnKey, width) => {
    const column = safeColumns.value.find((item) => item.key === columnKey)

    if (!column) return

    columnWidthsByKey.value = {
      ...columnWidthsByKey.value,
      [columnKey]: clampColumnWidth(width, parseColumnWidth(column.width)),
    }
  }

  const moveColumn = (sourceColumnKey, targetColumnKey) => {
    if (!sourceColumnKey || !targetColumnKey || sourceColumnKey === targetColumnKey) return

    const safeKeys = safeColumns.value.map((column) => column.key)
    const nextOrder = columnOrderKeys.value.filter((key) => safeKeys.includes(key))

    safeKeys.forEach((key) => {
      if (!nextOrder.includes(key)) {
        nextOrder.push(key)
      }
    })

    const sourceIndex = nextOrder.indexOf(sourceColumnKey)
    const targetIndex = nextOrder.indexOf(targetColumnKey)

    if (sourceIndex < 0 || targetIndex < 0) return

    const [sourceKey] = nextOrder.splice(sourceIndex, 1)
    const adjustedTargetIndex = nextOrder.indexOf(targetColumnKey)

    nextOrder.splice(adjustedTargetIndex, 0, sourceKey)
    columnOrderKeys.value = nextOrder
  }

  watch(
    columnsSignature,
    () => {
      resetColumns()
    },
    {
      immediate: true,
    },
  )

  return {
    columnSearch,
    visibleColumnKeys,
    defaultColumnKeys,
    configurableColumns,
    filteredConfigurableColumns,
    visibleColumns,
    firstVisibleColumnKey,
    resetColumns,
    setColumnWidth,
    moveColumn,
  }
}
