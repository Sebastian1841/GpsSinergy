import { ref, watch } from "vue"

const DEFAULT_STORAGE_KEY = "sinergy-activos-fleet-state"

const DEFAULT_STATE = {
  customActivos: [],
  deletedActivoIds: [],
  editedActivos: {},
  leftPanelWidth: 380,
}

const isBrowser = () => {
  return typeof window !== "undefined" && Boolean(window.localStorage)
}

const safeParseJson = (value) => {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

const normalizeArray = (value) => {
  return Array.isArray(value) ? value : []
}

const normalizeObject = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}

  return value
}

const normalizePanelWidth = (value) => {
  const width = Number(value)

  if (!Number.isFinite(width)) return DEFAULT_STATE.leftPanelWidth

  return Math.min(Math.max(width, 300), 900)
}

const readStorageItem = (storageKey) => {
  if (!isBrowser()) return null

  try {
    return window.localStorage.getItem(storageKey)
  } catch {
    return null
  }
}

const writeStorageItem = (storageKey, value) => {
  if (!isBrowser()) return false

  try {
    window.localStorage.setItem(storageKey, value)
    return true
  } catch {
    return false
  }
}

const removeStorageItem = (storageKey) => {
  if (!isBrowser()) return false

  try {
    window.localStorage.removeItem(storageKey)
    return true
  } catch {
    return false
  }
}

const readPersistedFleetState = (storageKey) => {
  const rawValue = readStorageItem(storageKey)
  const parsedValue = rawValue ? safeParseJson(rawValue) : null

  if (!parsedValue || typeof parsedValue !== "object") {
    return DEFAULT_STATE
  }

  return {
    customActivos: normalizeArray(parsedValue.customActivos),
    deletedActivoIds: normalizeArray(parsedValue.deletedActivoIds),
    editedActivos: normalizeObject(parsedValue.editedActivos),
    leftPanelWidth: normalizePanelWidth(parsedValue.leftPanelWidth),
  }
}

const writePersistedFleetState = (storageKey, state) => {
  return writeStorageItem(
    storageKey,
    JSON.stringify({
      customActivos: normalizeArray(state.customActivos),
      deletedActivoIds: normalizeArray(state.deletedActivoIds),
      editedActivos: normalizeObject(state.editedActivos),
      leftPanelWidth: normalizePanelWidth(state.leftPanelWidth),
      updatedAt: new Date().toISOString(),
    }),
  )
}

export function usePersistedFleetState({ storageKey = DEFAULT_STORAGE_KEY } = {}) {
  const persistedState = readPersistedFleetState(storageKey)

  const customActivos = ref(persistedState.customActivos)
  const deletedActivoIds = ref(persistedState.deletedActivoIds)
  const editedActivos = ref(persistedState.editedActivos)
  const leftPanelWidth = ref(persistedState.leftPanelWidth)

  const persistFleetState = () => {
    writePersistedFleetState(storageKey, {
      customActivos: customActivos.value,
      deletedActivoIds: deletedActivoIds.value,
      editedActivos: editedActivos.value,
      leftPanelWidth: leftPanelWidth.value,
    })
  }

  const resetPersistedFleetState = () => {
    customActivos.value = []
    deletedActivoIds.value = []
    editedActivos.value = {}
    leftPanelWidth.value = DEFAULT_STATE.leftPanelWidth

    removeStorageItem(storageKey)
  }

  watch([customActivos, deletedActivoIds, editedActivos, leftPanelWidth], persistFleetState)

  return {
    customActivos,
    deletedActivoIds,
    editedActivos,
    leftPanelWidth,
    resetPersistedFleetState,
  }
}
