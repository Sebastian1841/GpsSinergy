import { ref } from "vue"

const createClosedContextMenu = () => ({
  isOpen: false,
  x: 0,
  y: 0,
  activo: null,
})

const resolveBoolean = (value) => {
  if (typeof value === "function") return Boolean(value())

  return Boolean(value?.value ?? value)
}

export function useFleetDeviceContextMenu({
  canManageAssets = false,
  closeColumns = () => {},
  onDeviceAction = () => {},
} = {}) {
  const deviceContextMenu = ref(createClosedContextMenu())

  const closeDeviceContextMenu = () => {
    deviceContextMenu.value = createClosedContextMenu()
  }

  const openDeviceContextMenu = (event, activo) => {
    if (!activo || !resolveBoolean(canManageAssets)) return

    event?.preventDefault?.()
    event?.stopPropagation?.()

    closeColumns()

    const menuWidth = 186
    const menuHeight = 118
    const padding = 8

    const viewportWidth =
      typeof window === "undefined" ? menuWidth + padding * 2 : window.innerWidth
    const viewportHeight =
      typeof window === "undefined" ? menuHeight + padding * 2 : window.innerHeight

    const rawX = event?.clientX || padding
    const rawY = event?.clientY || padding

    const x = Math.min(rawX, viewportWidth - menuWidth - padding)
    const y = Math.min(rawY, viewportHeight - menuHeight - padding)

    deviceContextMenu.value = {
      isOpen: true,
      x: Math.max(padding, x),
      y: Math.max(padding, y),
      activo,
    }
  }

  const handleTableContextMenu = ({ event, activo } = {}) => {
    openDeviceContextMenu(event, activo)
  }

  const handleDeviceAction = ({ action, activo } = {}) => {
    onDeviceAction({
      action,
      activo,
    })

    closeDeviceContextMenu()
  }

  return {
    deviceContextMenu,
    closeDeviceContextMenu,
    handleTableContextMenu,
    handleDeviceAction,
  }
}
