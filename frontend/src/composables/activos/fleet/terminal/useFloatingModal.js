import { computed, onBeforeUnmount, ref } from "vue"

export function useFloatingModal({
  defaultWidth = 1080,
  defaultHeight = 640,
  minWidth = 720,
  minHeight = 430,
  margin = 12,
} = {}) {
  const modalRef = ref(null)
  const isDragging = ref(false)
  const isResizing = ref(false)

  const frame = ref({
    left: 0,
    top: 0,
    width: defaultWidth,
    height: defaultHeight,
  })

  let session = null
  let pointer = null
  let rafId = 0

  const isInteracting = computed(() => {
    return isDragging.value || isResizing.value
  })

  const modalFrameStyle = computed(() => ({
    left: `${frame.value.left}px`,
    top: `${frame.value.top}px`,
    width: `${frame.value.width}px`,
    height: `${frame.value.height}px`,
    minWidth: `${minWidth}px`,
    minHeight: `${minHeight}px`,
    maxWidth: `calc(100vw - ${margin * 2}px)`,
    maxHeight: `calc(100vh - ${margin * 2}px)`,
    transform: "translateZ(0)",
    backfaceVisibility: "hidden",
    contain: "layout paint",
  }))

  const clamp = (value, min, max) => {
    if (max < min) return min
    return Math.min(Math.max(value, min), max)
  }

  const getViewport = () => ({
    width: window.innerWidth,
    height: window.innerHeight,
  })

  const getDomFrame = () => {
    const rect = modalRef.value?.getBoundingClientRect()

    if (!rect) return frame.value

    return {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    }
  }

  const constrainFrame = (nextFrame, viewport = getViewport()) => {
    const maxWidth = Math.max(minWidth, viewport.width - margin * 2)
    const maxHeight = Math.max(minHeight, viewport.height - margin * 2)

    const width = clamp(nextFrame.width, minWidth, maxWidth)
    const height = clamp(nextFrame.height, minHeight, maxHeight)

    return {
      width,
      height,
      left: clamp(nextFrame.left, margin, viewport.width - width - margin),
      top: clamp(nextFrame.top, margin, viewport.height - height - margin),
    }
  }

  const createCenteredFrame = () => {
    const viewport = getViewport()
    const maxWidth = Math.max(minWidth, viewport.width - margin * 2)
    const maxHeight = Math.max(minHeight, viewport.height - margin * 2)

    const width = clamp(defaultWidth, minWidth, maxWidth)
    const height = clamp(defaultHeight, minHeight, maxHeight)

    return {
      width,
      height,
      left: Math.round((viewport.width - width) / 2),
      top: Math.round((viewport.height - height) / 2),
    }
  }

  const writeFrameToDom = (nextFrame, commit = false) => {
    const safeFrame = constrainFrame(nextFrame)

    if (modalRef.value) {
      modalRef.value.style.left = `${safeFrame.left}px`
      modalRef.value.style.top = `${safeFrame.top}px`
      modalRef.value.style.width = `${safeFrame.width}px`
      modalRef.value.style.height = `${safeFrame.height}px`
      modalRef.value.style.transform = "translateZ(0)"
    }

    if (commit) {
      frame.value = safeFrame
    }

    return safeFrame
  }

  const resetFrame = () => {
    writeFrameToDom(createCenteredFrame(), true)
  }

  const keepFrameInsideViewport = () => {
    writeFrameToDom(getDomFrame(), true)
  }

  const setBodyState = (cursor = "") => {
    document.documentElement.style.cursor = cursor
    document.body.style.cursor = cursor
    document.body.style.userSelect = cursor ? "none" : ""
  }

  const getResizeCursor = (direction) => {
    if (direction === "n" || direction === "s") return "ns-resize"
    if (direction === "e" || direction === "w") return "ew-resize"
    if (direction === "ne" || direction === "sw") return "nesw-resize"

    return "nwse-resize"
  }

  const prepareModalForInteraction = (type) => {
    if (!modalRef.value) return

    modalRef.value.style.transition = "none"
    modalRef.value.style.backfaceVisibility = "hidden"
    modalRef.value.style.transformOrigin = "top left"
    modalRef.value.style.willChange = type === "drag"
      ? "transform"
      : "left, top, width, height"

    if (type === "drag") {
      modalRef.value.style.boxShadow = "0 14px 36px rgba(2,6,23,0.34)"
    }
  }

  const cleanModalAfterInteraction = () => {
    if (!modalRef.value) return

    modalRef.value.style.transition = ""
    modalRef.value.style.willChange = ""
    modalRef.value.style.transformOrigin = ""
    modalRef.value.style.boxShadow = ""
    modalRef.value.style.transform = "translateZ(0)"
  }

  const startDrag = (event) => {
    if (event.button !== 0) return
    if (event.target?.closest?.("[data-no-drag]")) return

    startInteraction(event, {
      type: "drag",
      direction: "",
      cursor: "move",
    })
  }

  const startResize = (event, direction) => {
    if (event.button !== 0) return

    startInteraction(event, {
      type: "resize",
      direction,
      cursor: getResizeCursor(direction),
    })
  }

  const startInteraction = (event, config) => {
    const startFrame = getDomFrame()
    const viewport = getViewport()

    session = {
      ...config,
      viewport,
      startFrame,
      startX: event.clientX,
      startY: event.clientY,
      maxDragLeft: viewport.width - startFrame.width - margin,
      maxDragTop: viewport.height - startFrame.height - margin,
    }

    pointer = {
      x: event.clientX,
      y: event.clientY,
    }

    isDragging.value = config.type === "drag"
    isResizing.value = config.type === "resize"

    setBodyState(config.cursor)
    prepareModalForInteraction(config.type)

    window.addEventListener("pointermove", scheduleInteraction, { passive: false })
    window.addEventListener("pointerup", stopInteraction)
    window.addEventListener("pointercancel", stopInteraction)

    event.preventDefault()
  }

  const scheduleInteraction = (event) => {
    pointer = {
      x: event.clientX,
      y: event.clientY,
    }

    if (!rafId) {
      rafId = requestAnimationFrame(updateInteraction)
    }

    event.preventDefault()
  }

  const getNextFrame = () => {
    if (!session || !pointer) return frame.value

    const deltaX = pointer.x - session.startX
    const deltaY = pointer.y - session.startY
    const start = session.startFrame

    if (session.type === "drag") {
      return {
        ...start,
        left: clamp(start.left + deltaX, margin, session.maxDragLeft),
        top: clamp(start.top + deltaY, margin, session.maxDragTop),
      }
    }

    let left = start.left
    let top = start.top
    let width = start.width
    let height = start.height

    if (session.direction.includes("e")) {
      width = clamp(
        start.width + deltaX,
        minWidth,
        session.viewport.width - start.left - margin,
      )
    }

    if (session.direction.includes("s")) {
      height = clamp(
        start.height + deltaY,
        minHeight,
        session.viewport.height - start.top - margin,
      )
    }

    if (session.direction.includes("w")) {
      const right = start.left + start.width

      left = clamp(
        start.left + deltaX,
        margin,
        right - minWidth,
      )

      width = right - left
    }

    if (session.direction.includes("n")) {
      const bottom = start.top + start.height

      top = clamp(
        start.top + deltaY,
        margin,
        bottom - minHeight,
      )

      height = bottom - top
    }

    return constrainFrame({
      left,
      top,
      width,
      height,
    }, session.viewport)
  }

  const updateInteraction = () => {
    rafId = 0

    if (!session || !modalRef.value) return

    const nextFrame = getNextFrame()

    if (session.type === "drag") {
      const moveX = nextFrame.left - session.startFrame.left
      const moveY = nextFrame.top - session.startFrame.top

      modalRef.value.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`
      return
    }

    writeFrameToDom(nextFrame, false)
  }

  const stopInteraction = () => {
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = 0
    }

    if (session) {
      writeFrameToDom(getNextFrame(), true)
    }

    cleanModalAfterInteraction()

    session = null
    pointer = null
    isDragging.value = false
    isResizing.value = false
    setBodyState("")

    window.removeEventListener("pointermove", scheduleInteraction)
    window.removeEventListener("pointerup", stopInteraction)
    window.removeEventListener("pointercancel", stopInteraction)
  }

  onBeforeUnmount(() => {
    stopInteraction()
  })

  return {
    modalRef,
    modalFrameStyle,
    isDragging,
    isResizing,
    isInteracting,
    resetFrame,
    keepFrameInsideViewport,
    startDrag,
    startResize,
    stopInteraction,
  }
}