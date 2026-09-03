import { computed, onBeforeUnmount, ref, watch } from "vue"

const HEADER_GLOBAL_SEARCH_DEBOUNCE_MS = 150

export const globalSearchTypeOptions = [
  {
    value: "all",
    label: "Todo",
    placeholder: "Buscar activo, empresa, usuario o reporte...",
    emptyMessage: "Prueba por patente, empresa, usuario, reporte o actividad.",
  },
  {
    value: "company",
    label: "Empresas",
    placeholder: "Buscar empresa por nombre, RUT o ciudad...",
    emptyMessage: "No encontramos empresas para ese criterio.",
  },
  {
    value: "asset",
    label: "Activos",
    placeholder: "Buscar activo por patente, IMEI o modelo...",
    emptyMessage: "No encontramos activos para ese criterio.",
  },
  {
    value: "report",
    label: "Reportes",
    placeholder: "Buscar reporte por nombre o categoria...",
    emptyMessage: "No encontramos reportes para ese criterio.",
  },
  {
    value: "user",
    label: "Usuarios",
    placeholder: "Buscar usuario por nombre, correo o rol...",
    emptyMessage: "No encontramos usuarios para ese criterio.",
  },
  {
    value: "workspace",
    label: "Espacios",
    placeholder: "Buscar espacio de trabajo...",
    emptyMessage: "No encontramos espacios de trabajo para ese criterio.",
  },
  {
    value: "audit",
    label: "Auditoria",
    placeholder: "Buscar eventos de auditoria...",
    emptyMessage: "No encontramos eventos de auditoria para ese criterio.",
  },
]

export function useAppHeaderGlobalSearchState({ openDropdown } = {}) {
  const globalSearchType = ref("all")
  const globalSearchQuery = ref("")
  const debouncedGlobalSearchQuery = ref("")

  let globalSearchTimer = null

  watch(globalSearchQuery, (value) => {
    if (globalSearchTimer) {
      clearTimeout(globalSearchTimer)
    }

    globalSearchTimer = setTimeout(() => {
      debouncedGlobalSearchQuery.value = value
    }, HEADER_GLOBAL_SEARCH_DEBOUNCE_MS)
  })

  onBeforeUnmount(() => {
    if (globalSearchTimer) {
      clearTimeout(globalSearchTimer)
    }
  })

  const selectedGlobalSearchTypeOption = computed(() => {
    return (
      globalSearchTypeOptions.find((option) => option.value === globalSearchType.value) ||
      globalSearchTypeOptions[0]
    )
  })

  const globalSearchPlaceholder = computed(() => {
    return selectedGlobalSearchTypeOption.value.placeholder
  })

  const globalSearchEmptyMessage = computed(() => {
    return selectedGlobalSearchTypeOption.value.emptyMessage
  })

  const selectGlobalSearchType = (type) => {
    globalSearchType.value = type
    openDropdown?.()
  }

  const clearGlobalSearch = () => {
    if (globalSearchTimer) {
      clearTimeout(globalSearchTimer)
    }

    globalSearchQuery.value = ""
    debouncedGlobalSearchQuery.value = ""
    openDropdown?.()
  }

  return {
    globalSearchType,
    globalSearchQuery,
    debouncedGlobalSearchQuery,
    globalSearchPlaceholder,
    globalSearchEmptyMessage,
    globalSearchTypeOptions,
    selectGlobalSearchType,
    clearGlobalSearch,
  }
}
