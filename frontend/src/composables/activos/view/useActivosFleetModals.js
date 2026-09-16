import { defineAsyncComponent, ref, watch } from "vue"

const loadAddActivoModal = () => import("../../../components/activos/fleet/AddActivoModal.vue")
const loadFleetEditModal = () => import("../../../components/activos/fleet/FleetEditModal.vue")
const loadFleetTerminalModal = () =>
  import("../../../components/activos/fleet/FleetTerminalModal.vue")

export function useActivosFleetModals({ showActivoModal, showEditActivoModal, showTerminalModal }) {
  const AddActivoModal = defineAsyncComponent(loadAddActivoModal)
  const FleetEditModal = defineAsyncComponent(loadFleetEditModal)
  const FleetTerminalModal = defineAsyncComponent(loadFleetTerminalModal)

  const hasMountedActivoModal = ref(false)
  const hasMountedEditActivoModal = ref(false)
  const hasMountedTerminalModal = ref(false)

  watch(showActivoModal, (isOpen) => {
    if (isOpen) {
      hasMountedActivoModal.value = true
    }
  })

  watch(showEditActivoModal, (isOpen) => {
    if (isOpen) {
      hasMountedEditActivoModal.value = true
    }
  })

  watch(showTerminalModal, (isOpen) => {
    if (isOpen) {
      hasMountedTerminalModal.value = true
    }
  })

  return {
    AddActivoModal,
    FleetEditModal,
    FleetTerminalModal,
    hasMountedActivoModal,
    hasMountedEditActivoModal,
    hasMountedTerminalModal,
  }
}
