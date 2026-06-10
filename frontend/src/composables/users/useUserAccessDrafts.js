import { ref } from "vue"

import {
  USER_PERMISSIONS_FUNCTION_ID,
  USER_VIEW_FUNCTION_ID,
  USERS_MODULE_ID,
  buildUniqueSequentialId,
  clonePlainObject,
  createCleanScope,
  createDefaultAccess,
  createDraftUserFromSelected,
  createEmptyDraftUser,
  createEmptyPermissions,
  normalizeUserAccessKey,
  userIdentityAlreadyExists,
} from "../../utils/users/userAccessStateUtils.js"

export function useUserAccessDrafts({
  users,
  accesses,
  applications,
  modules,
  moduleFunctions,
  assets,
  selectedUserId,
  selectedUser,
  selectedUserAccesses,
  applicationsById,
  currentUserId,
  isPlatformAdmin,
  createDatabaseUser,
  updateDatabaseUser,
  createDatabaseAccess,
  deleteDatabaseAccess,
}) {
  const showEditorModal = ref(false)
  const editorMode = ref("create")
  const draftUser = ref(createEmptyDraftUser(applications.value[0]?.id || null))

  const isCurrentUserRecord = (user) => {
    return Boolean(currentUserId.value) && normalizeUserAccessKey(user?.id) === currentUserId.value
  }

  const isCurrentUserAccess = (access) => {
    return (
      Boolean(currentUserId.value) && normalizeUserAccessKey(access?.userId) === currentUserId.value
    )
  }

  const getModuleFunction = (functionId) => {
    return moduleFunctions.value.find((item) => {
      return normalizeUserAccessKey(item.id) === normalizeUserAccessKey(functionId)
    })
  }

  const accessHasModuleEnabled = (access, moduleId) => {
    const moduleAccess = access?.modules?.find((item) => {
      return normalizeUserAccessKey(item.moduleId) === normalizeUserAccessKey(moduleId)
    })

    if (moduleAccess) return Boolean(moduleAccess.enabled)

    return (access?.functions || []).some((functionAccess) => {
      const moduleFunction = getModuleFunction(functionAccess.functionId)

      return moduleFunction?.moduleId === moduleId && functionAccess.enabled
    })
  }

  const accessHasFunctionPermission = (access, functionId, permissionId = "view") => {
    if (!access || access.status !== "active") return false
    if (!accessHasModuleEnabled(access, USERS_MODULE_ID)) return false

    const functionAccess = (access.functions || []).find((item) => {
      return normalizeUserAccessKey(item.functionId) === normalizeUserAccessKey(functionId)
    })

    if (!functionAccess?.enabled) return false
    if (!permissionId) return true

    return Boolean(functionAccess.permissions?.[permissionId])
  }

  const hasSafeSelfUserManagementAccess = (candidateAccesses = accesses.value) => {
    if (isPlatformAdmin.value) return true
    if (!currentUserId.value) return true

    const selfAccesses = candidateAccesses.filter((access) => {
      return isCurrentUserAccess(access)
    })

    const hasUsersView = selfAccesses.some((access) => {
      return accessHasFunctionPermission(access, USER_VIEW_FUNCTION_ID, "view")
    })

    const hasUsersPermissions = selfAccesses.some((access) => {
      return accessHasFunctionPermission(access, USER_PERMISSIONS_FUNCTION_ID, "admin")
    })

    return hasUsersView && hasUsersPermissions
  }

  const canApplySelfAccessChange = (accessId, applyChange) => {
    const targetAccess = accesses.value.find((access) => access.id === accessId)

    if (!targetAccess) return false
    if (!isCurrentUserAccess(targetAccess)) return true

    const candidateAccesses = accesses.value.map((access) => {
      if (access.id !== accessId) return access

      const clonedAccess = clonePlainObject(access)
      applyChange(clonedAccess)

      return clonedAccess
    })

    return hasSafeSelfUserManagementAccess(candidateAccesses)
  }

  const canRemoveSelfAccess = (accessId) => {
    const targetAccess = accesses.value.find((access) => access.id === accessId)

    if (!targetAccess) return false
    if (!isCurrentUserAccess(targetAccess)) return true

    const candidateAccesses = accesses.value.filter((access) => access.id !== accessId)

    return hasSafeSelfUserManagementAccess(candidateAccesses)
  }

  const applyToggleAccessStatus = (access) => {
    access.status = access.status === "active" ? "inactive" : "active"
  }

  const applyToggleModuleAccess = (access, moduleId) => {
    const moduleAccess = access?.modules?.find((item) => item.moduleId === moduleId)

    if (!moduleAccess) return

    moduleAccess.enabled = !moduleAccess.enabled

    if (!moduleAccess.enabled) {
      access.functions = (access.functions || []).map((functionAccess) => {
        const moduleFunction = moduleFunctions.value.find((item) => {
          return item.id === functionAccess.functionId
        })

        if (moduleFunction?.moduleId !== moduleId) return functionAccess

        return {
          ...functionAccess,
          enabled: false,
          permissions: createEmptyPermissions(),
        }
      })
      return
    }

    const enabledModuleFunctions = (access.functions || []).filter((functionAccess) => {
      const moduleFunction = moduleFunctions.value.find((item) => {
        return item.id === functionAccess.functionId
      })

      return moduleFunction?.moduleId === moduleId && functionAccess.enabled
    })

    if (enabledModuleFunctions.length) return

    const firstFunction = moduleFunctions.value.find((moduleFunction) => {
      return moduleFunction.moduleId === moduleId
    })

    if (!firstFunction) return

    const functionAccess = access.functions?.find((item) => item.functionId === firstFunction.id)
    if (!functionAccess) return

    functionAccess.enabled = true
    functionAccess.permissions.view = true
  }

  const applyToggleFunctionAccess = (access, functionId) => {
    const functionAccess = access?.functions?.find((item) => item.functionId === functionId)
    const moduleFunction = moduleFunctions.value.find((item) => item.id === functionId)

    if (!access || !functionAccess || !moduleFunction) return

    functionAccess.enabled = !functionAccess.enabled

    const parentModuleAccess = access.modules?.find((item) => {
      return item.moduleId === moduleFunction.moduleId
    })

    if (functionAccess.enabled) {
      if (parentModuleAccess) parentModuleAccess.enabled = true

      if (!Object.values(functionAccess.permissions || {}).some(Boolean)) {
        functionAccess.permissions.view = true
      }
      return
    }

    functionAccess.permissions = createEmptyPermissions()

    const hasEnabledFunctions = (access.functions || []).some((item) => {
      const itemFunction = moduleFunctions.value.find((moduleFunctionItem) => {
        return moduleFunctionItem.id === item.functionId
      })

      return itemFunction?.moduleId === moduleFunction.moduleId && item.enabled
    })

    if (parentModuleAccess && !hasEnabledFunctions) {
      parentModuleAccess.enabled = false
    }
  }

  const applyTogglePermission = (access, functionId, permissionId) => {
    const functionAccess = access?.functions?.find((item) => item.functionId === functionId)

    if (!functionAccess || !functionAccess.enabled) return

    functionAccess.permissions[permissionId] = !functionAccess.permissions[permissionId]

    if (permissionId === "edit" && functionAccess.permissions.edit) {
      functionAccess.permissions.view = true
    }

    if (permissionId === "admin" && functionAccess.permissions.admin) {
      functionAccess.permissions.view = true
      functionAccess.permissions.edit = true
    }

    if (permissionId === "view" && !functionAccess.permissions.view) {
      functionAccess.permissions.edit = false
      functionAccess.permissions.admin = false
    }
  }

  const resetDraftUser = () => {
    draftUser.value = createEmptyDraftUser(applications.value[0]?.id || null)
  }

  const openCreateUserModal = () => {
    editorMode.value = "create"
    resetDraftUser()
    showEditorModal.value = true
  }

  const openEditUserModal = () => {
    if (!selectedUser.value) return

    editorMode.value = "edit"
    draftUser.value = createDraftUserFromSelected({
      selectedUser: selectedUser.value,
      selectedUserAccesses: selectedUserAccesses.value,
      fallbackApplicationId: applications.value[0]?.id,
    })
    showEditorModal.value = true
  }

  const closeEditorModal = () => {
    showEditorModal.value = false
  }

  const createUser = () => {
    const name = draftUser.value.name.trim()
    const username = draftUser.value.username.trim()
    const password = draftUser.value.password.trim()
    const email = draftUser.value.email.trim()

    const identityAlreadyExists = userIdentityAlreadyExists({
      users: users.value,
      username,
      email,
    })

    if (!name || !username || !password || !email || identityAlreadyExists) return

    const userId = buildUniqueSequentialId("user", users.value)
    const accessId = buildUniqueSequentialId("access", accesses.value)

    createDatabaseUser({
      id: userId,
      name,
      username,
      password,
      email,
      status: draftUser.value.status,
      lastAccess: "-",
    })

    if (draftUser.value.initialApplicationId) {
      const access = createDefaultAccess({
        id: accessId,
        userId,
        applicationId: draftUser.value.initialApplicationId,
        modules: modules.value,
        moduleFunctions: moduleFunctions.value,
      })

      access.role = draftUser.value.initialRole

      createDatabaseAccess(access)
    }

    selectedUserId.value = userId
    closeEditorModal()
  }

  const updateUser = () => {
    if (!draftUser.value.id) return

    const user = users.value.find((item) => item.id === draftUser.value.id)

    if (!user) return

    const nextUsername = draftUser.value.username.trim()
    const nextEmail = draftUser.value.email.trim()
    const nextStatus = draftUser.value.status

    if (!isPlatformAdmin.value && isCurrentUserRecord(user) && nextStatus !== "active") return

    const identityAlreadyExists = userIdentityAlreadyExists({
      users: users.value,
      username: nextUsername,
      email: nextEmail,
      excludeUserId: user.id,
    })

    if (identityAlreadyExists) return

    updateDatabaseUser(user.id, {
      name: draftUser.value.name.trim(),
      username: nextUsername,
      email: nextEmail,
      status: nextStatus,
      ...(draftUser.value.password.trim()
        ? {
            password: draftUser.value.password.trim(),
          }
        : {}),
    })

    const primaryAccess = selectedUserAccesses.value[0]
    if (primaryAccess) {
      primaryAccess.role = draftUser.value.initialRole
    }

    closeEditorModal()
  }

  const saveUserFromModal = () => {
    if (editorMode.value === "edit") {
      updateUser()
      return
    }

    createUser()
  }

  const toggleSelectedUserStatus = () => {
    if (!selectedUser.value) return
    if (!isPlatformAdmin.value && isCurrentUserRecord(selectedUser.value)) return

    selectedUser.value.status = selectedUser.value.status === "active" ? "inactive" : "active"
  }

  const addApplicationAccess = (applicationId) => {
    if (!selectedUser.value || !applicationId) return

    const alreadyExists = accesses.value.some((access) => {
      return access.userId === selectedUser.value.id && access.applicationId === applicationId
    })

    if (alreadyExists) return

    const accessId = buildUniqueSequentialId("access", accesses.value)

    createDatabaseAccess(
      createDefaultAccess({
        id: accessId,
        userId: selectedUser.value.id,
        applicationId,
        modules: modules.value,
        moduleFunctions: moduleFunctions.value,
      }),
    )
  }

  const removeApplicationAccess = (accessId) => {
    if (!canRemoveSelfAccess(accessId)) return

    deleteDatabaseAccess(accessId)
  }

  const updateAccessRole = (accessId, roleId) => {
    const access = accesses.value.find((item) => item.id === accessId)

    if (!access) return

    access.role = roleId
  }

  const toggleAccessStatus = (accessId) => {
    const access = accesses.value.find((item) => item.id === accessId)

    if (!access) return
    if (!canApplySelfAccessChange(accessId, applyToggleAccessStatus)) return

    applyToggleAccessStatus(access)
  }

  const toggleModuleAccess = (accessId, moduleId) => {
    const access = accesses.value.find((item) => item.id === accessId)

    if (!access) return
    if (
      !canApplySelfAccessChange(accessId, (nextAccess) => {
        applyToggleModuleAccess(nextAccess, moduleId)
      })
    ) {
      return
    }

    applyToggleModuleAccess(access, moduleId)
  }

  const toggleFunctionAccess = (accessId, functionId) => {
    const access = accesses.value.find((item) => item.id === accessId)

    if (!access) return
    if (
      !canApplySelfAccessChange(accessId, (nextAccess) => {
        applyToggleFunctionAccess(nextAccess, functionId)
      })
    ) {
      return
    }

    applyToggleFunctionAccess(access, functionId)
  }

  const togglePermission = (accessId, functionId, permissionId) => {
    const access = accesses.value.find((item) => item.id === accessId)
    const functionAccess = access?.functions?.find((item) => item.functionId === functionId)

    if (!functionAccess || !functionAccess.enabled) return
    if (
      !canApplySelfAccessChange(accessId, (nextAccess) => {
        applyTogglePermission(nextAccess, functionId, permissionId)
      })
    ) {
      return
    }

    applyTogglePermission(access, functionId, permissionId)
  }

  const updateOperationalScope = (accessId, scopeType) => {
    const access = accesses.value.find((item) => item.id === accessId)

    if (!access) return

    access.scope = createCleanScope(access.scope)
    access.scope.type = scopeType

    if (scopeType === "all-assets") {
      access.scope.sucursalIds = []
      access.scope.assetIds = []
    }

    if (scopeType === "sucursal") {
      access.scope.assetIds = []

      const application = applicationsById.value.get(access.applicationId)
      const activeSucursales = (application?.sucursales || []).filter((sucursal) => {
        return sucursal.active !== false
      })
      const validSucursalIds = new Set(activeSucursales.map((sucursal) => String(sucursal.id)))
      const selectedSucursalIds = (access.scope.sucursalIds || []).filter((sucursalId) => {
        return validSucursalIds.has(String(sucursalId))
      })

      access.scope.sucursalIds =
        selectedSucursalIds.length || !activeSucursales.length
          ? selectedSucursalIds
          : [activeSucursales[0].id]
    }

    if (scopeType === "selected-assets") {
      access.scope.sucursalIds = []
    }
  }

  const toggleScopeAsset = (accessId, assetId) => {
    const access = accesses.value.find((item) => item.id === accessId)
    const asset = assets.value.find((item) => String(item.id) === String(assetId))

    if (!access || !asset) return
    if (String(asset.applicationId) !== String(access.applicationId)) return

    access.scope = createCleanScope(access.scope)

    if (access.scope.assetIds.includes(assetId)) {
      access.scope.assetIds = access.scope.assetIds.filter((id) => id !== assetId)
      return
    }

    access.scope.assetIds = [...access.scope.assetIds, assetId]
    access.scope.type = "selected-assets"
  }

  const toggleScopeSucursal = (accessId, sucursalId) => {
    const access = accesses.value.find((item) => item.id === accessId)
    const application = applicationsById.value.get(access?.applicationId)
    const sucursal = application?.sucursales?.find((item) => {
      return String(item.id) === String(sucursalId)
    })

    if (!access || !sucursal || sucursal.active === false) return

    access.scope = createCleanScope(access.scope)

    const isSelected = access.scope.sucursalIds.some((id) => {
      return String(id) === String(sucursalId)
    })

    access.scope.sucursalIds = isSelected
      ? access.scope.sucursalIds.filter((id) => String(id) !== String(sucursalId))
      : [...access.scope.sucursalIds, sucursal.id]

    access.scope.assetIds = []
    access.scope.type = "sucursal"
  }

  return {
    showEditorModal,
    editorMode,
    draftUser,

    openCreateUserModal,
    openEditUserModal,
    closeEditorModal,
    saveUserFromModal,

    toggleSelectedUserStatus,
    addApplicationAccess,
    removeApplicationAccess,
    updateAccessRole,
    toggleAccessStatus,
    toggleModuleAccess,
    toggleFunctionAccess,
    togglePermission,
    updateOperationalScope,
    toggleScopeAsset,
    toggleScopeSucursal,
  }
}
