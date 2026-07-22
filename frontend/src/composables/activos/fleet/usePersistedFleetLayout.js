import { ref } from "vue"

import { readJsonStorage, writeJsonStorage } from "../../../services/storage/browserStorage.js"

const STORAGE_KEY = "sinergy-fleet-layout"
const LEGACY_STORAGE_KEY = "sinergy-activos-fleet-state"
const DEFAULT_PANEL_WIDTH = 380

const normalizePanelWidth = (value) => {
  const width = Number(value)

  if (!Number.isFinite(width)) return DEFAULT_PANEL_WIDTH

  return Math.min(Math.max(width, 300), 900)
}

const readPanelWidth = () => {
  const currentState = readJsonStorage(STORAGE_KEY, null)
  const legacyState = readJsonStorage(LEGACY_STORAGE_KEY, null)

  return normalizePanelWidth(currentState?.leftPanelWidth ?? legacyState?.leftPanelWidth)
}

export function usePersistedFleetLayout() {
  const leftPanelWidth = ref(readPanelWidth())

  const persistPanelWidth = (width = leftPanelWidth.value) => {
    const normalizedWidth = normalizePanelWidth(width)

    leftPanelWidth.value = normalizedWidth

    writeJsonStorage(STORAGE_KEY, {
      leftPanelWidth: normalizedWidth,
      updatedAt: new Date().toISOString(),
    })
  }

  return {
    leftPanelWidth,
    persistPanelWidth,
  }
}
