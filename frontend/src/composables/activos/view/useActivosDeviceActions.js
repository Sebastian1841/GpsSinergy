import { ref, unref } from "vue"

import { normalizeId } from "../../../utils/idUtils.js"

const getActivoPlate = (activo = {}) => {
  return activo.patente || activo.patent || activo.plate || activo.ppu || ""
}

export function useActivosDeviceActions({
  activeCompanyId,
  canManageAssets,
  canViewItineraries,
  canViewMaintenance,
  handleClearItineraryRoute,
  handleDeviceActionBase,
  router,
  selectedId,
  setSidebarSection,
}) {
  const itineraryContextRequest = ref(null)
  const hasActiveDailySummary = ref(false)

  const selectActionActivo = (activo) => {
    if (activo?.id) {
      selectedId.value = activo.id
    }
  }

  const openActivoItinerary = ({ activo, range, rangeLabel } = {}) => {
    if (!unref(canViewItineraries) || !activo) return

    hasActiveDailySummary.value = false
    selectActionActivo(activo)
    setSidebarSection("itinerarios")

    itineraryContextRequest.value = {
      id: `${Date.now()}-${normalizeId(activo.id) || "activo"}`,
      activo,
      assetId: normalizeId(activo.id),
      plate: getActivoPlate(activo),
      range: range || "today",
      rangeLabel: rangeLabel || "",
    }
  }

  const openActivoDailySummary = ({
    activo,
    range,
    rangeLabel,
    keepRange = false,
    selectionMode = "replace",
  } = {}) => {
    if (!unref(canViewItineraries) || !activo) return

    hasActiveDailySummary.value = true
    selectActionActivo(activo)
    setSidebarSection("itinerarios")

    itineraryContextRequest.value = {
      id: `${Date.now()}-${normalizeId(activo.id) || "activo"}-resumen`,
      activo,
      assetId: normalizeId(activo.id),
      plate: getActivoPlate(activo),
      panelView: "resumen-dia",
      range: range || "today",
      rangeLabel: rangeLabel || "",
      keepRange,
      selectionMode,
    }
  }

  const openActivoMaintenance = ({ activo } = {}) => {
    const companyId = unref(activeCompanyId)

    if (!unref(canViewMaintenance) || !activo || !companyId) return

    selectActionActivo(activo)

    void router.push({
      name: "AppMaintenance",
      params: {
        empresaId: companyId,
      },
      query: {
        assetId: activo.id || "",
        open: "maintenance-detail",
        patente: getActivoPlate(activo),
      },
    })
  }

  const handleClearItineraryRouteState = () => {
    hasActiveDailySummary.value = false
    handleClearItineraryRoute()
  }

  const handleDeviceAction = (payload = {}) => {
    if (payload.action === "show-daily-summary") {
      openActivoDailySummary(payload)
      return
    }

    if (payload.action === "add-daily-summary") {
      if (!hasActiveDailySummary.value) return

      openActivoDailySummary({
        ...payload,
        keepRange: true,
        selectionMode: "append",
      })
      return
    }

    if (payload.action === "show-itinerary") {
      openActivoItinerary(payload)
      return
    }

    if (payload.action === "open-maintenance") {
      openActivoMaintenance(payload)
      return
    }

    if (!unref(canManageAssets)) return

    handleDeviceActionBase(payload)
  }

  return {
    hasActiveDailySummary,
    itineraryContextRequest,

    handleClearItineraryRouteState,
    handleDeviceAction,
    openActivoDailySummary,
    openActivoItinerary,
    openActivoMaintenance,
  }
}
