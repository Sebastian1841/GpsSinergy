import { ref } from "vue"

const currentWorkspaceViewState = ref(null)
const pendingWorkspaceViewRestore = ref(null)

const clonePlainObject = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}

  try {
    return JSON.parse(JSON.stringify(value))
  } catch {
    return {}
  }
}

export const publishWorkspaceViewState = (viewState = {}) => {
  currentWorkspaceViewState.value = {
    ...viewState,
    settings: clonePlainObject(viewState.settings),
    updatedAt: new Date().toISOString(),
  }
}

export const requestWorkspaceViewRestore = ({ workspaceId, routePath, settings } = {}) => {
  pendingWorkspaceViewRestore.value = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    workspaceId,
    routePath,
    settings: clonePlainObject(settings),
  }
}

export function useWorkspaceViewState() {
  return {
    currentWorkspaceViewState,
    pendingWorkspaceViewRestore,
    publishWorkspaceViewState,
    requestWorkspaceViewRestore,
  }
}
