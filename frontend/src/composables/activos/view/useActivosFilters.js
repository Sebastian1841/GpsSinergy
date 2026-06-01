import { computed, ref } from "vue"

export function useActivosFilters({ onLeaveItinerarios, onFilterChanged, refreshMapLayout }) {
  const statusFilter = ref("all")
  const activeSidebarSection = ref("activos")

  const sectionSearch = ref({
    activos: "",
    itinerarios: "",
    geocercas: "",
  })

  const normalizeText = (value) => {
    return String(value || "")
      .trim()
      .toLowerCase()
  }

  const sidebarSearch = computed(() => {
    return sectionSearch.value[activeSidebarSection.value] || ""
  })

  const matchesStatusFilter = (activo) => {
    if (statusFilter.value === "all") return true
    if (statusFilter.value === "online") return activo.estado !== "offline"
    if (statusFilter.value === "alerts") return activo.estado === "stopped"

    return activo.estado === statusFilter.value
  }

  const filterActivosByCurrentState = (activos = []) => {
    const term = normalizeText(sectionSearch.value.activos)

    return activos.filter((activo) => {
      const matchesText =
        !term ||
        normalizeText(activo.vehiculo).includes(term) ||
        normalizeText(activo.name).includes(term) ||
        normalizeText(activo.nombrePantalla).includes(term) ||
        normalizeText(activo.trackerModelLabel).includes(term) ||
        normalizeText(activo.trackerManufacturer).includes(term) ||
        normalizeText(activo.protocol).includes(term) ||
        normalizeText(activo.imei).includes(term) ||
        normalizeText(activo.estado).includes(term) ||
        normalizeText(activo.datosUlt).includes(term) ||
        normalizeText(activo.fechaIngreso).includes(term) ||
        normalizeText(activo.descripcion).includes(term)

      return matchesText && matchesStatusFilter(activo)
    })
  }

  const setSidebarSearch = (value) => {
    const section = activeSidebarSection.value || "activos"

    sectionSearch.value = {
      ...sectionSearch.value,
      [section]: value,
    }
  }

  const setSidebarSection = async (section) => {
    const allowedSections = ["activos", "itinerarios", "geocercas"]
    const nextSection = allowedSections.includes(section) ? section : "activos"

    activeSidebarSection.value = nextSection

    if (nextSection !== "itinerarios") {
      onLeaveItinerarios?.()
    }

    await refreshMapLayout(true)
  }

  const setStatusFilter = async (filter) => {
    activeSidebarSection.value = "activos"

    onLeaveItinerarios?.()

    statusFilter.value = filter

    await onFilterChanged?.(filter)
    await refreshMapLayout(true)
  }

  return {
    statusFilter,
    activeSidebarSection,
    sectionSearch,
    sidebarSearch,

    normalizeText,
    matchesStatusFilter,
    filterActivosByCurrentState,

    setSidebarSearch,
    setSidebarSection,
    setStatusFilter,
  }
}
