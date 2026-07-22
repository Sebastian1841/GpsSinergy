import { defineAsyncComponent, ref, watch } from "vue"

const loadGeofenceSelectorModal = () =>
  import("../../../../components/activos/geocercas/GeofenceSelectorModal.vue")
const loadGeofenceHistoryModal = () =>
  import("../../../../components/activos/geocercas/GeofenceHistoryModal.vue")

export function useMapPanelGeofenceModals({ showGeofenceModal, showGeofenceHistoryModal }) {
  const GeofenceSelectorModal = defineAsyncComponent(loadGeofenceSelectorModal)
  const GeofenceHistoryModal = defineAsyncComponent(loadGeofenceHistoryModal)

  const hasMountedGeofenceModal = ref(false)
  const hasMountedGeofenceHistoryModal = ref(false)

  watch(showGeofenceModal, (isOpen) => {
    if (isOpen) {
      hasMountedGeofenceModal.value = true
    }
  })

  watch(showGeofenceHistoryModal, (isOpen) => {
    if (isOpen) {
      hasMountedGeofenceHistoryModal.value = true
    }
  })

  const preloadGeofenceModals = () => {
    if (typeof window === "undefined") return

    const preload = () => {
      void Promise.allSettled([loadGeofenceSelectorModal(), loadGeofenceHistoryModal()])
    }

    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(preload, { timeout: 2500 })
      return
    }

    window.setTimeout(preload, 800)
  }

  return {
    GeofenceHistoryModal,
    GeofenceSelectorModal,
    hasMountedGeofenceHistoryModal,
    hasMountedGeofenceModal,
    preloadGeofenceModals,
  }
}
