import { computed, ref } from "vue"

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
import { normalizeAssetTagId } from "../../utils/users/userAssetTagUtils.js"

export function useUserAccessDrafts({
  users,
  accesses,
  applications,
  modules,
  moduleFunctions,
  assets,
  assetTags,
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

  const selectedUserIsPlatformAdmin = computed(() => {
    return Boolean(selectedUser.value?.isPlatformAdmin)
  })

  const isCurrentUserRecord = (user) => {
    return Boolean(currentUserId.value) && normalizeUserAccessKey(user?.id) === currentUserId.value
  }

  const isCurrentUserAccess = (access) => {
    return (
      Boolean(currentUserId.value) && normalizeUserAccessKey(access?.userId) === currentUserId.value
    )
  }

  const isPlatformAdminUserRecord = (user) => {
    return Boolean(user?.isPlatformAdmin)
  }

  const isPlatformAdminAccess = (access) => {
    const accessUserId = normalizeUserAccessKey(access?.userId)

    if (!accessUserId) return false

    return users.value.some((user) => {
      return normalizeUserAccessKey(user.id) === accessUserId && isPlatformAdminUserRecord(user)
    })
  }

  const getAccessById = (accessId) => {
    return (
      accesses.value.find((access) => {
        return normalizeUserAccessKey(access.id) === normalizeUserAccessKey(accessId)
      }) || null
    )
  }

  const canMutateAccess = (accessId) => {
    const access = getAccessById(accessId)

    return Boolean(access && !isPlatformAdminAccess(access))
  }

  const getModuleFunction = (functionId) => {
    return moduleFunctions.value.find((item) => {
      return normalizeUserAccessKey(item.id) === normalizeUserAccessKey(functionId)
    })
  }

  const getAccessAssetTags = (access) => {
    const applicationId = normalizeUserAccessKey(access?.applicationId)

    if (!applicationId) return []

    const application = applicationsById.value.get(applicationId)
    const companyId = normalizeUserAccessKey(application?.companyId)

    return (assetTags?.value || []).filter((tag) => {
      if (tag.active === false) return false

      const tagApplicationId = normalizeUserAccessKey(tag.applicationId)
      const tagCompanyId = normalizeUserAccessKey(tag.companyId)

      return (
        (tagApplicationId && tagApplicationId === applicationId) ||
        (companyId && tagCompanyId === companyId)
      )
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
    const nextStatus = isPlatformAdminUserRecord(user) ? "active" : draftUser.value.status

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
    if (primaryAccess && !isPlatformAdminUserRecord(user)) {
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
    if (isPlatformAdminUserRecord(selectedUser.value)) return
    if (!isPlatformAdmin.value && isCurrentUserRecord(selectedUser.value)) return

    selectedUser.value.status = selectedUser.value.status === "active" ? "inactive" : "active"
  }

  const addApplicationAccess = (applicationId) => {
    if (!selectedUser.value || !applicationId) return
    if (selectedUserIsPlatformAdmin.value) return

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
    if (!canMutateAccess(accessId)) return
    if (!canRemoveSelfAccess(accessId)) return

    deleteDatabaseAccess(accessId)
  }

  const updateAccessRole = (accessId, roleId) => {
    const access = getAccessById(accessId)

    if (!access) return
    if (isPlatformAdminAccess(access)) return

    access.role = roleId
  }

  const toggleAccessStatus = (accessId) => {
    const access = getAccessById(accessId)

    if (!access) return
    if (isPlatformAdminAccess(access)) return
    if (!canApplySelfAccessChange(accessId, applyToggleAccessStatus)) return

    applyToggleAccessStatus(access)
  }

  const toggleModuleAccess = (accessId, moduleId) => {
    const access = getAccessById(accessId)

    if (!access) return
    if (isPlatformAdminAccess(access)) return
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
    const access = getAccessById(accessId)

    if (!access) return
    if (isPlatformAdminAccess(access)) return
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
    const access = getAccessById(accessId)
    const functionAccess = access?.functions?.find((item) => item.functionId === functionId)

    if (!functionAccess || !functionAccess.enabled) return
    if (isPlatformAdminAccess(access)) return
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
    const access = getAccessById(accessId)
    const allowedScopeTypes = new Set(["all-assets", "selected-assets", "asset-tags"])
    const nextScopeType = allowedScopeTypes.has(scopeType) ? scopeType : "selected-assets"

    if (!access) return
    if (isPlatformAdminAccess(access)) return

    access.scope = createCleanScope(access.scope)
    access.scope.type = nextScopeType

    if (nextScopeType === "all-assets") {
      access.scope.sucursalIds = []
      access.scope.assetIds = []
      access.scope.assetTagIds = []
    }

    if (nextScopeType === "selected-assets") {
      access.scope.sucursalIds = []
      access.scope.assetTagIds = []
    }

    if (nextScopeType === "asset-tags") {
      access.scope.sucursalIds = []
      access.scope.assetIds = []

      const validTagIds = new Set(
        getAccessAssetTags(access)
          .map((tag) => normalizeAssetTagId(tag.id))
          .filter(Boolean),
      )

      access.scope.assetTagIds = (access.scope.assetTagIds || [])
        .map(normalizeAssetTagId)
        .filter((tagId) => validTagIds.has(tagId))
    }
  }

  const toggleScopeAsset = (accessId, assetId) => {
    const access = getAccessById(accessId)
    const asset = assets.value.find((item) => String(item.id) === String(assetId))

    if (!access || !asset) return
    if (isPlatformAdminAccess(access)) return
    if (String(asset.applicationId) !== String(access.applicationId)) return

    access.scope = createCleanScope(access.scope)

    if (access.scope.assetIds.includes(assetId)) {
      access.scope.assetIds = access.scope.assetIds.filter((id) => id !== assetId)
      return
    }

    access.scope.sucursalIds = []
    access.scope.assetTagIds = []
    access.scope.assetIds = [...access.scope.assetIds, assetId]
    access.scope.type = "selected-assets"
  }

  const toggleScopeAssetTag = (accessId, tagId) => {
    const access = getAccessById(accessId)
    const normalizedTagId = normalizeAssetTagId(tagId)

    if (!access || !normalizedTagId) return
    if (isPlatformAdminAccess(access)) return

    const tagExists = getAccessAssetTags(access).some((tag) => {
      return normalizeAssetTagId(tag.id) === normalizedTagId
    })

    if (!tagExists) return

    access.scope = createCleanScope(access.scope)

    const isSelected = access.scope.assetTagIds.some((id) => {
      return normalizeAssetTagId(id) === normalizedTagId
    })

    access.scope.assetTagIds = isSelected
      ? access.scope.assetTagIds.filter((id) => normalizeAssetTagId(id) !== normalizedTagId)
      : [...access.scope.assetTagIds, normalizedTagId]

    access.scope.sucursalIds = []
    access.scope.assetIds = []
    access.scope.type = "asset-tags"
  }

  return {
    showEditorModal,
    editorMode,
    draftUser,
    selectedUserIsPlatformAdmin,

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
    toggleScopeAssetTag,
  }
}
