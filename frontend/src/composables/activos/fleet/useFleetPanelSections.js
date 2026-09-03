import { computed, watch } from "vue"

export function useFleetPanelSections({
  activeSection,
  allActivos,
  activos,
  assetTags,
  closeDeviceContextMenu,
  columnSearch,
  configurableColumns,
  emitSectionSelected,
  filteredConfigurableColumns,
  firstVisibleColumnKey,
  geofences,
  itineraryActivos,
  showColumns,
  sourceActiveSection,
  sortedActivos,
  visibleColumnKeys,
  visibleColumns,
  allowedSections,
}) {
  const isActivosSection = computed(() => activeSection.value === "activos")
  const isReportesSection = computed(() => activeSection.value === "reportes")
  const isItinerariosSection = computed(() => activeSection.value === "itinerarios")
  const isGeocercasSection = computed(() => activeSection.value === "geocercas")
  const isEtiquetasSection = computed(() => activeSection.value === "etiquetas")

  const menuSections = computed(() => {
    const allowedSectionSet = new Set(allowedSections.value)

    return [
      {
        key: "activos",
        label: "Activos",
        count: allActivos.value.length || activos.value.length,
      },
      {
        key: "reportes",
        label: "Reportes",
        count: null,
      },
      {
        key: "itinerarios",
        label: "Itinerarios",
        count: null,
      },
      {
        key: "geocercas",
        label: "Geocercas",
        count: geofences.value.length,
      },
      {
        key: "etiquetas",
        label: "Etiquetas",
        count: assetTags?.value?.length || 0,
      },
    ].filter((section) => allowedSectionSet.has(section.key))
  })

  const getFirstAvailableSection = () => {
    return menuSections.value[0]?.key || "activos"
  }

  const isSectionAllowed = (sectionKey) => {
    return menuSections.value.some((section) => section.key === sectionKey)
  }

  const applyActiveSection = (sectionKey, shouldEmit = false) => {
    const nextSection = isSectionAllowed(sectionKey) ? sectionKey : getFirstAvailableSection()

    if (activeSection.value === nextSection) return

    activeSection.value = nextSection

    if (nextSection !== "activos") {
      showColumns.value = false
      columnSearch.value = ""
      closeDeviceContextMenu()
    }

    if (shouldEmit) {
      emitSectionSelected(nextSection)
    }
  }

  const activeHeaderVisibleColumns = computed(() => {
    return isActivosSection.value ? visibleColumns.value : []
  })

  const activeHeaderConfigurableColumns = computed(() => {
    return isActivosSection.value ? configurableColumns.value : []
  })

  const activeHeaderFilteredConfigurableColumns = computed(() => {
    return isActivosSection.value ? filteredConfigurableColumns.value : []
  })

  const activeHeaderVisibleColumnKeys = computed(() => {
    return isActivosSection.value ? visibleColumnKeys.value : []
  })

  const activeTableVisibleColumns = computed(() => {
    return isActivosSection.value ? visibleColumns.value : []
  })

  const activeFirstVisibleColumnKey = computed(() => {
    return isActivosSection.value ? firstVisibleColumnKey.value : ""
  })

  const activeSortedActivos = computed(() => {
    return isActivosSection.value ? sortedActivos.value : []
  })

  const activeReportActivos = computed(() => {
    return isReportesSection.value ? activos.value : []
  })

  const activeReportAllActivos = computed(() => {
    return isReportesSection.value ? allActivos.value : []
  })

  const resolvedItineraryActivos = computed(() => {
    if (itineraryActivos.value.length) return itineraryActivos.value

    return allActivos.value.length ? allActivos.value : activos.value
  })

  const activeItineraryActivos = computed(() => {
    return isItinerariosSection.value ? resolvedItineraryActivos.value : []
  })

  const setSection = (section) => {
    closeDeviceContextMenu()
    applyActiveSection(section, true)
  }

  watch(
    menuSections,
    () => {
      if (isSectionAllowed(activeSection.value)) return

      applyActiveSection(getFirstAvailableSection(), true)
    },
    { immediate: true },
  )

  if (sourceActiveSection) {
    watch(sourceActiveSection, (nextSection) => {
      if (!nextSection || nextSection === activeSection.value) return

      applyActiveSection(nextSection, false)
    })
  }

  return {
    activeFirstVisibleColumnKey,
    activeHeaderConfigurableColumns,
    activeHeaderFilteredConfigurableColumns,
    activeHeaderVisibleColumnKeys,
    activeHeaderVisibleColumns,
    activeItineraryActivos,
    activeReportActivos,
    activeReportAllActivos,
    activeSortedActivos,
    activeTableVisibleColumns,
    isActivosSection,
    isEtiquetasSection,
    isGeocercasSection,
    isItinerariosSection,
    isReportesSection,
    menuSections,

    applyActiveSection,
    setSection,
  }
}
