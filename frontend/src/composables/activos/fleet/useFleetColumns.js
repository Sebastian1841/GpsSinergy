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

export function useFleetColumns({ columns, normalizeText = defaultNormalizeText } = {}) {
  const columnSearch = ref("")
  const visibleColumnKeys = ref([])

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

  const configurableColumns = computed(() => safeColumns.value)

  const filteredConfigurableColumns = computed(() => {
    const term = normalizeText(columnSearch.value)

    if (!term) return configurableColumns.value

    return configurableColumns.value.filter((column) => {
      return normalizeText(`${column.label} ${column.key}`).includes(term)
    })
  })

  const visibleColumns = computed(() => {
    const selected = new Set(visibleColumnKeys.value)

    return safeColumns.value.filter((column) => {
      return column.locked || selected.has(column.key)
    })
  })

  const firstVisibleColumnKey = computed(() => {
    return visibleColumns.value[0]?.key || ""
  })

  const resetColumns = () => {
    visibleColumnKeys.value = [...defaultColumnKeys.value]
    columnSearch.value = ""
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
  }
}
