import { ref } from "vue"

const STORAGE_KEY = "sinergy-fleet-layout"
const LEGACY_STORAGE_KEY = "sinergy-activos-fleet-state"
const DEFAULT_PANEL_WIDTH = 380

const normalizePanelWidth = (value) => {
  const width = Number(value)

  if (!Number.isFinite(width)) return DEFAULT_PANEL_WIDTH

  return Math.min(Math.max(width, 300), 900)
}

const readPanelWidth = () => {
  if (typeof window === "undefined") return DEFAULT_PANEL_WIDTH

  try {
    const currentState = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null")
    const legacyState = JSON.parse(window.localStorage.getItem(LEGACY_STORAGE_KEY) || "null")

    return normalizePanelWidth(currentState?.leftPanelWidth ?? legacyState?.leftPanelWidth)
  } catch {
    return DEFAULT_PANEL_WIDTH
  }
}

export function usePersistedFleetLayout() {
  const leftPanelWidth = ref(readPanelWidth())

  const persistPanelWidth = (width = leftPanelWidth.value) => {
    const normalizedWidth = normalizePanelWidth(width)

    leftPanelWidth.value = normalizedWidth

    if (typeof window === "undefined") return

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          leftPanelWidth: normalizedWidth,
          updatedAt: new Date().toISOString(),
        }),
      )
    } catch {
      // Layout persistence is optional.
    }
  }

  return {
    leftPanelWidth,
    persistPanelWidth,
  }
}
