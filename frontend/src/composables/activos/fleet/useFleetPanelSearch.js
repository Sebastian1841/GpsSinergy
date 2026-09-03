import { computed, onBeforeUnmount, ref, watch } from "vue"

const DEFAULT_SEARCH_EMIT_DELAY_MS = 220

const searchPlaceholders = {
  activos: "Buscar activo, IMEI, modelo GPS...",
  reportes: "Buscar reporte o activo...",
  itinerarios: "Buscar activo o itinerario...",
  geocercas: "Buscar geocerca o zona...",
  etiquetas: "Buscar etiqueta...",
}

export function useFleetPanelSearch({
  activeSection,
  emitSearch,
  search,
  searchEmitDelayMs = DEFAULT_SEARCH_EMIT_DELAY_MS,
}) {
  const localSearch = ref(search.value || "")

  let searchEmitTimer = null

  const searchPlaceholder = computed(() => {
    return searchPlaceholders[activeSection.value] || searchPlaceholders.activos
  })

  const clearSearchEmitTimer = () => {
    if (!searchEmitTimer) return

    window.clearTimeout(searchEmitTimer)
    searchEmitTimer = null
  }

  const scheduleSearchEmit = (value) => {
    clearSearchEmitTimer()

    searchEmitTimer = window.setTimeout(() => {
      searchEmitTimer = null
      emitSearch(value)
    }, searchEmitDelayMs)
  }

  const handleSearchInput = (event) => {
    const value = event.target.value

    localSearch.value = value
    scheduleSearchEmit(value)
  }

  const clearSearch = () => {
    clearSearchEmitTimer()
    localSearch.value = ""
    emitSearch("")
  }

  watch(search, (nextSearch) => {
    const normalizedSearch = nextSearch || ""

    if (normalizedSearch !== localSearch.value) {
      localSearch.value = normalizedSearch
    }
  })

  onBeforeUnmount(() => {
    clearSearchEmitTimer()
  })

  return {
    localSearch,
    searchPlaceholder,

    clearSearch,
    handleSearchInput,
  }
}
