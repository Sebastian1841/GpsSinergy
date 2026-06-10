import { nextTick, onBeforeUnmount, onMounted, ref } from "vue"

export function useMapPanelFullscreen(panelRef) {
  const isFullscreen = ref(false)

  const refreshFullscreenLayout = async () => {
    await nextTick()

    requestAnimationFrame(() => {
      window.dispatchEvent(new Event("resize"))

      requestAnimationFrame(() => {
        window.dispatchEvent(new Event("resize"))
      })
    })

    setTimeout(() => {
      window.dispatchEvent(new Event("resize"))
    }, 220)

    setTimeout(() => {
      window.dispatchEvent(new Event("resize"))
    }, 420)
  }

  const requestNativeFullscreen = async () => {
    if (!panelRef.value) return

    if (panelRef.value.requestFullscreen) {
      await panelRef.value.requestFullscreen({
        navigationUI: "hide",
      })
      return
    }

    if (panelRef.value.webkitRequestFullscreen) {
      panelRef.value.webkitRequestFullscreen()
    }
  }

  const exitNativeFullscreen = async () => {
    if (document.fullscreenElement && document.exitFullscreen) {
      await document.exitFullscreen()
      return
    }

    if (document.webkitFullscreenElement && document.webkitExitFullscreen) {
      document.webkitExitFullscreen()
    }
  }

  const enterFullscreen = async () => {
    isFullscreen.value = true

    try {
      await requestNativeFullscreen()
    } catch {
      // Si el navegador bloquea fullscreen nativo, queda el modo visual fixed.
    }

    await refreshFullscreenLayout()
  }

  const exitFullscreen = async () => {
    try {
      await exitNativeFullscreen()
    } catch {
      // Si el navegador ya salio de fullscreen, solo se sincroniza el estado visual.
    }

    isFullscreen.value = false

    await refreshFullscreenLayout()
  }

  const toggleFullscreen = async () => {
    if (isFullscreen.value || document.fullscreenElement === panelRef.value) {
      await exitFullscreen()
      return
    }

    await enterFullscreen()
  }

  const handleFullscreenChange = async () => {
    const panelIsFullscreen =
      document.fullscreenElement === panelRef.value ||
      document.webkitFullscreenElement === panelRef.value

    isFullscreen.value = panelIsFullscreen

    await refreshFullscreenLayout()
  }

  const handleFullscreenKeydown = async (event) => {
    if (event.key !== "Escape") return
    if (!isFullscreen.value) return

    await exitFullscreen()
  }

  onMounted(() => {
    window.addEventListener("keydown", handleFullscreenKeydown)
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange)
  })

  onBeforeUnmount(() => {
    window.removeEventListener("keydown", handleFullscreenKeydown)
    document.removeEventListener("fullscreenchange", handleFullscreenChange)
    document.removeEventListener("webkitfullscreenchange", handleFullscreenChange)

    if (document.fullscreenElement === panelRef.value) {
      document.exitFullscreen()
    }

    if (document.webkitFullscreenElement === panelRef.value && document.webkitExitFullscreen) {
      document.webkitExitFullscreen()
    }
  })

  return {
    isFullscreen,
    toggleFullscreen,
  }
}
