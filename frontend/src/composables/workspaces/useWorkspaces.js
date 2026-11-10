import { computed, ref, unref, watch } from "vue"

import { appendAuditLog } from "../../services/audit/useAuditService.js"
import {
  readJsonStorage,
  writeJsonStorage,
  writeJsonStorageBatch,
} from "../../services/storage/browserStorage.js"
import { normalizeId } from "../../utils/idUtils.js"

export const WORKSPACES_STORAGE_KEY = "sinergy-workspaces-v1"
export const ACTIVE_WORKSPACE_STORAGE_KEY = "sinergy-active-workspace-v1"

const DEFAULT_WORKSPACE_NAME = "Vista principal"

const workspaceRecords = ref(readJsonStorage(WORKSPACES_STORAGE_KEY, []))
const activeWorkspaceIdsByUser = ref(readJsonStorage(ACTIVE_WORKSPACE_STORAGE_KEY, {}))
const workspaceWriteError = ref("")

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === WORKSPACES_STORAGE_KEY) {
      workspaceRecords.value = readJsonStorage(WORKSPACES_STORAGE_KEY, [])
    }

    if (event.key === ACTIVE_WORKSPACE_STORAGE_KEY) {
      activeWorkspaceIdsByUser.value = readJsonStorage(ACTIVE_WORKSPACE_STORAGE_KEY, {})
    }
  })
}

const normalizeName = (value) => {
  return String(value || "").trim()
}

const normalizeRoutePath = (value) => {
  const routePath = String(value || "").trim()

  return routePath.startsWith("/") ? routePath : "/activos"
}

const clonePlainObject = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}

  try {
    return JSON.parse(JSON.stringify(value))
  } catch {
    return {}
  }
}

const buildDefaultWorkspaceId = (userId) => {
  return `workspace-${normalizeId(userId)}-main`
}

const buildWorkspaceId = (userId) => {
  return `workspace-${normalizeId(userId)}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const persistWorkspaces = (records, activeIds = activeWorkspaceIdsByUser.value) => {
  workspaceWriteError.value = ""
  if (
    !writeJsonStorageBatch([
      [WORKSPACES_STORAGE_KEY, records],
      [ACTIVE_WORKSPACE_STORAGE_KEY, activeIds],
    ])
  ) {
    workspaceWriteError.value =
      "No se pudo guardar la vista. Conserva los cambios e intenta nuevamente."
    return false
  }
  workspaceRecords.value = records
  activeWorkspaceIdsByUser.value = activeIds
  return true
}

const persistActiveWorkspaces = (activeIds) => {
  workspaceWriteError.value = ""
  if (!writeJsonStorage(ACTIVE_WORKSPACE_STORAGE_KEY, activeIds)) {
    workspaceWriteError.value = "No se pudo guardar la seleccion de vista. Intenta nuevamente."
    return false
  }
  activeWorkspaceIdsByUser.value = activeIds
  return true
}

const getWorkspaceUpdatedAt = (workspace) => {
  return Date.parse(workspace?.updatedAt || workspace?.createdAt || "") || 0
}

const normalizeUserIds = (userIds = []) => {
  return Array.from(new Set((Array.isArray(userIds) ? userIds : []).map(normalizeId))).filter(
    Boolean,
  )
}

const isWorkspaceOwner = (workspace, userId) => {
  return normalizeId(workspace?.userId) === normalizeId(userId)
}

const isWorkspaceSharedWithUser = (workspace, userId) => {
  const normalizedUserId = normalizeId(userId)

  if (!normalizedUserId) return false

  return normalizeUserIds(workspace?.sharedWithUserIds).includes(normalizedUserId)
}

const toPersistedWorkspace = (workspace) => {
  const persistedWorkspace = {
    ...workspace,
  }

  delete persistedWorkspace.ownedByCurrentUser
  delete persistedWorkspace.sharedWithCurrentUser

  return persistedWorkspace
}

export function resetWorkspacesForTest() {
  workspaceRecords.value = []
  activeWorkspaceIdsByUser.value = {}
  workspaceWriteError.value = ""
}

export function useWorkspaces({
  userId,
  currentRoutePath,
  currentRouteName,
  currentCompanyId,
  currentAssetGroupId,
  currentViewSettings,
} = {}) {
  const resolvedUserId = computed(() => normalizeId(unref(userId)))

  const recordWorkspaceAudit = ({ workspace, action, severity = "info", description }) => {
    if (!workspace) return

    appendAuditLog({
      actorId: resolvedUserId.value || "system",
      actorName: resolvedUserId.value || "Usuario",
      companyId: normalizeId(workspace.companyId),
      module: "activos",
      action,
      entityType: "espacio de trabajo",
      entityName: workspace.name || "Vista guardada",
      status: "success",
      severity,
      description,
    })
  }

  const buildCurrentViewSnapshot = (overrides = {}) => {
    return {
      routePath: normalizeRoutePath(overrides.routePath ?? unref(currentRoutePath)),
      routeName: normalizeName(overrides.routeName ?? unref(currentRouteName)) || "Vista actual",
      companyId: normalizeId(overrides.companyId ?? unref(currentCompanyId)),
      assetGroupId: normalizeId(overrides.assetGroupId ?? unref(currentAssetGroupId)),
      viewSettings: clonePlainObject(overrides.viewSettings ?? unref(currentViewSettings)),
    }
  }

  const accessibleWorkspaces = computed(() => {
    const user = resolvedUserId.value

    if (!user || !Array.isArray(workspaceRecords.value)) return []

    return workspaceRecords.value
      .filter((workspace) => normalizeId(workspace?.userId) === user)
      .map((workspace) => ({
        sharedWithUserIds: [],
        ...workspace,
        ownedByCurrentUser: true,
        sharedWithCurrentUser: false,
      }))
  })

  const sharedWorkspaces = computed(() => {
    const user = resolvedUserId.value

    if (!user || !Array.isArray(workspaceRecords.value)) return []

    return workspaceRecords.value
      .filter((workspace) => {
        return !isWorkspaceOwner(workspace, user) && isWorkspaceSharedWithUser(workspace, user)
      })
      .map((workspace) => ({
        sharedWithUserIds: [],
        ...workspace,
        ownedByCurrentUser: false,
        sharedWithCurrentUser: true,
      }))
  })

  const userWorkspaces = computed(() => {
    return [...accessibleWorkspaces.value, ...sharedWorkspaces.value].sort(
      (firstWorkspace, secondWorkspace) => {
        return getWorkspaceUpdatedAt(secondWorkspace) - getWorkspaceUpdatedAt(firstWorkspace)
      },
    )
  })

  const setActiveWorkspaceId = (workspaceId = null) => {
    const user = resolvedUserId.value

    if (!user) return

    const nextActiveIds = {
      ...activeWorkspaceIdsByUser.value,
    }

    const normalizedWorkspaceId = normalizeId(workspaceId)

    if (normalizedWorkspaceId) {
      nextActiveIds[user] = normalizedWorkspaceId
    } else {
      delete nextActiveIds[user]
    }

    return persistActiveWorkspaces(nextActiveIds)
  }

  const activeWorkspaceId = computed(() => {
    const user = resolvedUserId.value

    if (!user) return null

    const storedWorkspaceId = normalizeId(activeWorkspaceIdsByUser.value[user])
    const storedWorkspace = userWorkspaces.value.find((workspace) => {
      return normalizeId(workspace.id) === storedWorkspaceId
    })

    return storedWorkspace?.id || userWorkspaces.value[0]?.id || null
  })

  const activeWorkspace = computed(() => {
    const activeId = normalizeId(activeWorkspaceId.value)

    return (
      userWorkspaces.value.find((workspace) => {
        return normalizeId(workspace.id) === activeId
      }) || null
    )
  })

  const resolveWorkspace = (workspaceId) => {
    const normalizedWorkspaceId = normalizeId(workspaceId)

    if (!normalizedWorkspaceId) return null

    return (
      userWorkspaces.value.find((workspace) => {
        return normalizeId(workspace.id) === normalizedWorkspaceId
      }) || null
    )
  }

  const resolveOwnedWorkspace = (workspaceId) => {
    const workspace = resolveWorkspace(workspaceId)

    if (!workspace || !isWorkspaceOwner(workspace, resolvedUserId.value)) return null

    return workspace
  }

  const ensureDefaultWorkspace = () => {
    const user = resolvedUserId.value

    if (!user) return null

    const existingWorkspace = accessibleWorkspaces.value[0]

    if (existingWorkspace) {
      if (!activeWorkspaceId.value) {
        setActiveWorkspaceId(existingWorkspace.id)
      }

      return existingWorkspace
    }

    const now = new Date().toISOString()
    const workspace = {
      id: buildDefaultWorkspaceId(user),
      userId: user,
      name: DEFAULT_WORKSPACE_NAME,
      sharedWithUserIds: [],
      ...buildCurrentViewSnapshot(),
      createdAt: now,
      updatedAt: now,
    }

    if (
      !persistWorkspaces([workspace, ...workspaceRecords.value], {
        ...activeWorkspaceIdsByUser.value,
        [user]: workspace.id,
      })
    )
      return null

    recordWorkspaceAudit({
      workspace,
      action: "workspace:create",
      description: "Se creo un espacio de trabajo.",
    })

    return workspace
  }

  const selectWorkspace = (workspaceId) => {
    const workspace = resolveWorkspace(workspaceId)

    if (!workspace) return null

    if (!setActiveWorkspaceId(workspace.id)) return null

    return workspace
  }

  const createWorkspace = ({ name, sharedWithUserIds = [], ...snapshotOverrides } = {}) => {
    const user = resolvedUserId.value
    const workspaceName = normalizeName(name)

    if (!user || !workspaceName) return null

    const now = new Date().toISOString()
    const workspace = {
      id: buildWorkspaceId(user),
      userId: user,
      name: workspaceName,
      sharedWithUserIds: normalizeUserIds(sharedWithUserIds).filter((sharedUserId) => {
        return sharedUserId !== user
      }),
      ...buildCurrentViewSnapshot(snapshotOverrides),
      createdAt: now,
      updatedAt: now,
    }

    if (
      !persistWorkspaces([workspace, ...workspaceRecords.value], {
        ...activeWorkspaceIdsByUser.value,
        [user]: workspace.id,
      })
    )
      return null

    recordWorkspaceAudit({
      workspace,
      action: "workspace:create",
      description: "Se creo un espacio de trabajo personalizado.",
    })

    return workspace
  }

  const renameWorkspace = (workspaceId, name, sharedWithUserIds) => {
    const workspace = resolveOwnedWorkspace(workspaceId)
    const workspaceName = normalizeName(name)

    if (!workspace || !workspaceName) return null

    const updatedWorkspace = toPersistedWorkspace({
      ...workspace,
      name: workspaceName,
      ...(sharedWithUserIds === undefined
        ? {}
        : {
            sharedWithUserIds: normalizeUserIds(sharedWithUserIds).filter(
              (id) => id !== resolvedUserId.value,
            ),
          }),
      updatedAt: new Date().toISOString(),
    })

    const nextRecords = workspaceRecords.value.map((storedWorkspace) => {
      return normalizeId(storedWorkspace.id) === normalizeId(workspace.id)
        ? updatedWorkspace
        : storedWorkspace
    })
    if (!persistWorkspaces(nextRecords)) return null

    recordWorkspaceAudit({
      workspace: updatedWorkspace,
      action: "workspace:rename",
      description: "Se renombro un espacio de trabajo.",
    })

    return updatedWorkspace
  }

  const saveCurrentWorkspaceView = (workspaceId = activeWorkspaceId.value) => {
    const workspace = resolveOwnedWorkspace(workspaceId)

    if (!workspace) return null

    const updatedWorkspace = toPersistedWorkspace({
      ...workspace,
      ...buildCurrentViewSnapshot(),
      updatedAt: new Date().toISOString(),
    })

    const nextRecords = workspaceRecords.value.map((storedWorkspace) => {
      return normalizeId(storedWorkspace.id) === normalizeId(workspace.id)
        ? updatedWorkspace
        : storedWorkspace
    })
    if (
      !persistWorkspaces(nextRecords, {
        ...activeWorkspaceIdsByUser.value,
        [resolvedUserId.value]: updatedWorkspace.id,
      })
    )
      return null

    recordWorkspaceAudit({
      workspace: updatedWorkspace,
      action: "workspace:update",
      description: "Se guardo la configuracion visual del espacio de trabajo.",
    })

    return updatedWorkspace
  }

  const deleteWorkspace = (workspaceId) => {
    const workspace = resolveOwnedWorkspace(workspaceId)

    const ownedWorkspaces = userWorkspaces.value.filter((item) => {
      return isWorkspaceOwner(item, resolvedUserId.value)
    })

    if (!workspace || ownedWorkspaces.length <= 1) return null

    const nextRecords = workspaceRecords.value.filter((storedWorkspace) => {
      return normalizeId(storedWorkspace.id) !== normalizeId(workspace.id)
    })

    const nextWorkspace =
      userWorkspaces.value.find((storedWorkspace) => {
        return normalizeId(storedWorkspace.id) !== normalizeId(workspace.id)
      }) || null

    const nextActive = { ...activeWorkspaceIdsByUser.value }
    if (normalizeId(activeWorkspaceId.value) === normalizeId(workspace.id))
      nextActive[resolvedUserId.value] = nextWorkspace?.id || null
    if (!persistWorkspaces(nextRecords, nextActive)) return null

    recordWorkspaceAudit({
      workspace,
      action: "workspace:delete",
      severity: "warning",
      description: "Se elimino un espacio de trabajo.",
    })

    return nextWorkspace
  }

  const shareWorkspace = (workspaceId, sharedWithUserIds = []) => {
    const workspace = resolveOwnedWorkspace(workspaceId)

    if (!workspace) return null

    const sharedUserIds = normalizeUserIds(sharedWithUserIds).filter((sharedUserId) => {
      return sharedUserId !== resolvedUserId.value
    })
    const updatedWorkspace = toPersistedWorkspace({
      ...workspace,
      sharedWithUserIds: sharedUserIds,
      updatedAt: new Date().toISOString(),
    })

    const nextRecords = workspaceRecords.value.map((storedWorkspace) => {
      return normalizeId(storedWorkspace.id) === normalizeId(workspace.id)
        ? updatedWorkspace
        : storedWorkspace
    })
    if (!persistWorkspaces(nextRecords)) return null

    recordWorkspaceAudit({
      workspace: updatedWorkspace,
      action: "workspace:share",
      severity: sharedUserIds.length ? "warning" : "info",
      description: sharedUserIds.length
        ? "Se compartio un espacio de trabajo con otros usuarios."
        : "Se quitaron usuarios compartidos del espacio de trabajo.",
    })

    return updatedWorkspace
  }

  watch(
    resolvedUserId,
    (user) => {
      if (!user) return

      ensureDefaultWorkspace()
    },
    {
      immediate: true,
    },
  )

  watch(userWorkspaces, (workspaces) => {
    if (!resolvedUserId.value || !workspaces.length) return

    const activeExists = workspaces.some((workspace) => {
      return normalizeId(workspace.id) === normalizeId(activeWorkspaceId.value)
    })

    if (!activeExists) {
      setActiveWorkspaceId(workspaces[0].id)
    }
  })

  return {
    workspaces: userWorkspaces,
    activeWorkspaceId,
    activeWorkspace,
    workspaceWriteError: computed(() => workspaceWriteError.value),

    selectWorkspace,
    createWorkspace,
    renameWorkspace,
    shareWorkspace,
    saveCurrentWorkspaceView,
    deleteWorkspace,
  }
}
