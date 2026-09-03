import { computed, ref, watch } from "vue"

import { normalizeText } from "../../utils/maintenance/maintenanceFormatUtils.js"

const getRouteQueryValue = (value) => {
  return Array.isArray(value) ? value[0] : value
}

export function useMaintenanceRouteTarget({
  activeTab,
  maintenanceItems,
  openMaintenanceModal,
  route,
  selectedVehicleId,
}) {
  const lastHandledRouteMaintenanceTarget = ref("")

  const getRouteMaintenanceTarget = () => {
    return {
      id: normalizeText(
        getRouteQueryValue(route.query.assetId) ||
          getRouteQueryValue(route.query.activoId) ||
          getRouteQueryValue(route.query.asset),
      ),
      open: normalizeText(getRouteQueryValue(route.query.open)),
      plate: normalizeText(
        getRouteQueryValue(route.query.patente) ||
          getRouteQueryValue(route.query.plate) ||
          getRouteQueryValue(route.query.ppu),
      ),
    }
  }

  const routeMaintenanceTargetSignature = computed(() => {
    const target = getRouteMaintenanceTarget()

    if (!target.id && !target.plate) return ""

    return `${target.id}:${target.plate}:${target.open}`
  })

  const findRouteMaintenanceVehicle = () => {
    const target = getRouteMaintenanceTarget()

    if (!target.id && !target.plate) return null

    return (
      maintenanceItems.value.find((vehicle) => {
        return (
          (target.id && normalizeText(vehicle.id) === target.id) ||
          (target.plate && normalizeText(vehicle.plate) === target.plate)
        )
      }) || null
    )
  }

  const openRouteMaintenanceTarget = () => {
    const signature = routeMaintenanceTargetSignature.value

    if (!signature || signature === lastHandledRouteMaintenanceTarget.value) return

    const target = getRouteMaintenanceTarget()
    const vehicle = findRouteMaintenanceVehicle()

    if (!vehicle) return

    lastHandledRouteMaintenanceTarget.value = signature
    selectedVehicleId.value = vehicle.id
    activeTab.value = "overview"

    if (target.open === "maintenance-detail" || target.open === "mantenciones") {
      openMaintenanceModal("maintenance-detail")
    }
  }

  watch(
    [routeMaintenanceTargetSignature, maintenanceItems],
    () => {
      openRouteMaintenanceTarget()
    },
    {
      immediate: true,
    },
  )

  return {
    openRouteMaintenanceTarget,
    routeMaintenanceTargetSignature,
  }
}
