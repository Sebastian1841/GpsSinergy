import { nextTick, ref } from "vue"

const clamp = (value, min, max) => {
  return Math.min(Math.max(value, min), max)
}

export function useActivosLayout({ leftPanelWidth, persistPanelWidth }) {
  const layoutRef = ref(null)

  let resizeMode = null
  let animationFrame = null
  let resizeFrame = null
  let lastPointerEvent = null

  const refreshMapLayout = async (withTransition = false) => {
    await nextTick()

    if (animationFrame) {
      cancelAnimationFrame(animationFrame)
    }

    animationFrame = requestAnimationFrame(() => {
      window.dispatchEvent(new Event("resize"))
    })

    if (withTransition) {
      setTimeout(() => {
        window.dispatchEvent(new Event("resize"))
      }, 160)

      setTimeout(() => {
        window.dispatchEvent(new Event("resize"))
      }, 340)
    }
  }

  const resizeFleet = (event) => {
    if (!layoutRef.value) return

    const rect = layoutRef.value.getBoundingClientRect()
    const rawWidth = event.clientX - rect.left

    const minWidth = 300
    const maxWidth = Math.max(minWidth, rect.width - 360)

    leftPanelWidth.value = clamp(rawWidth, minWidth, maxWidth)
  }

  const scheduleDragResize = (event) => {
    lastPointerEvent = {
      clientX: event.clientX,
      clientY: event.clientY,
    }

    if (resizeFrame) return

    resizeFrame = requestAnimationFrame(() => {
      if (!lastPointerEvent) return

      if (resizeMode === "fleet") {
        resizeFleet(lastPointerEvent)
      }

      resizeFrame = null
    })
  }

  const stopResize = async () => {
    resizeMode = null
    lastPointerEvent = null

    document.body.style.cursor = ""
    document.body.style.userSelect = ""

    window.removeEventListener("pointermove", scheduleDragResize)
    window.removeEventListener("pointerup", stopResize)

    if (resizeFrame) {
      cancelAnimationFrame(resizeFrame)
      resizeFrame = null
    }

    persistPanelWidth(leftPanelWidth.value)

    await refreshMapLayout()
  }

  const startFleetResize = (event) => {
    resizeMode = "fleet"

    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"

    event.preventDefault()
    event.currentTarget.setPointerCapture?.(event.pointerId)

    window.addEventListener("pointermove", scheduleDragResize)
    window.addEventListener("pointerup", stopResize)
  }

  const cleanupLayout = () => {
    window.removeEventListener("pointermove", scheduleDragResize)
    window.removeEventListener("pointerup", stopResize)

    if (animationFrame) {
      cancelAnimationFrame(animationFrame)
      animationFrame = null
    }

    if (resizeFrame) {
      cancelAnimationFrame(resizeFrame)
      resizeFrame = null
    }

    resizeMode = null
    lastPointerEvent = null

    document.body.style.cursor = ""
    document.body.style.userSelect = ""
  }

  return {
    layoutRef,
    refreshMapLayout,
    startFleetResize,
    cleanupLayout,
  }
}
