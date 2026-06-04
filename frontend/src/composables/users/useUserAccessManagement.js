import { computed, ref, watch } from "vue"

import { useMockDatabase } from "../mock/useMockDatabase.js"
import { useDebouncedValue } from "../ui/useDebouncedValue.js"

import { userMatchesSearch } from "../../utils/users/userAccessUtils.js"

const DEFAULT_VISIBLE_USER_LIMIT = 50
const USER_LIMIT_INCREMENT = 50

const buildUniqueSequentialId = (prefix, items = []) => {
  const expression = new RegExp(`^${prefix}-(\\d+)$`)
  const highestId = items.reduce((highest, item) => {
    const match = String(item.id || "").match(expression)

    return match ? Math.max(highest, Number(match[1])) : highest
  }, 0)

  return `${prefix}-${String(highestId + 1).padStart(3, "0")}`
}

const createEmptyPermissions = () => {
  return {
    view: false,
    edit: false,
    admin: false,
  }
}

const createDefaultModuleAccess = (modules = []) => {
  return modules.map((module) => {
    return {
      moduleId: module.id,
      enabled: module.id === "assets",
    }
  })
}

const createDefaultFunctionAccess = (moduleFunctions = []) => {
  return moduleFunctions.map((moduleFunction) => {
    const isDefaultFunction = moduleFunction.id === "gps"

    return {
      functionId: moduleFunction.id,
      enabled: isDefaultFunction,
      permissions: {
        view: isDefaultFunction,
        edit: false,
        admin: false,
      },
    }
  })
}

const createDefaultAccess = ({ id, userId, applicationId, modules, moduleFunctions }) => {
  return {
    id,
    userId,
    applicationId,
    role: "viewer",
    status: "active",
    modules: createDefaultModuleAccess(modules),
    functions: createDefaultFunctionAccess(moduleFunctions),
    scope: {
      type: "sucursal",
      sucursalIds: [],
      assetIds: [],
      criticalAlerts: false,
      reports: false,
    },
  }
}

const normalizeAccess = ({ access, modules, moduleFunctions }) => {
  const legacyFunctionAccesses = access.functions || access.modules || []
  const legacyFunctionsById = new Map(
    legacyFunctionAccesses.map((item) => [item.functionId || item.moduleId, item]),
  )

  const normalizedFunctions = moduleFunctions.map((moduleFunction) => {
    const legacyFunction = legacyFunctionsById.get(moduleFunction.id)
    const isAdminUserFunction = access.role === "admin" && moduleFunction.moduleId === "users"

    return {
      functionId: moduleFunction.id,
      enabled: Boolean(legacyFunction?.enabled || isAdminUserFunction),
      permissions: {
        view: Boolean(legacyFunction?.permissions?.view || isAdminUserFunction),
        edit: Boolean(legacyFunction?.permissions?.edit || isAdminUserFunction),
        admin: Boolean(legacyFunction?.permissions?.admin || isAdminUserFunction),
      },
    }
  })

  const normalizedModules = modules.map((module) => {
    const hasEnabledFunction = normalizedFunctions.some((functionAccess) => {
      const moduleFunction = moduleFunctions.find((item) => item.id === functionAccess.functionId)

      return moduleFunction?.moduleId === module.id && functionAccess.enabled
    })

    return {
      moduleId: module.id,
      enabled: hasEnabledFunction,
    }
  })

  return {
    ...access,
    modules: normalizedModules,
    functions: normalizedFunctions,
  }
}

const createEmptyDraftUser = (initialApplicationId = null) => {
  return {
    id: null,
    name: "",
    username: "",
    password: "",
    email: "",
    status: "pending",
    initialApplicationId,
    initialRole: "viewer",
  }
}

export function useUserAccessManagement() {
  const {
    users,
    accesses,
    companies,
    applications,
    modules,
    moduleFunctions,
    permissions,
    scopes,
    roles,
    assets,
    createUser: createDatabaseUser,
    updateUser: updateDatabaseUser,
    createAccess: createDatabaseAccess,
    deleteAccess: deleteDatabaseAccess,
  } = useMockDatabase()

  accesses.value = accesses.value.map((access) => {
    return normalizeAccess({
      access,
      modules: modules.value,
      moduleFunctions: moduleFunctions.value,
    })
  })

  const searchTerm = ref("")
  const selectedRole = ref("all")
  const selectedCompany = ref("all")
  const selectedStatus = ref("all")
  const selectedModule = ref("all")

  const debouncedSearchTerm = useDebouncedValue(searchTerm, 180)

  const visibleUserLimit = ref(DEFAULT_VISIBLE_USER_LIMIT)
  const selectedUserId = ref(users.value[0]?.id || null)

  const showEditorModal = ref(false)
  const editorMode = ref("create")

  const draftUser = ref(createEmptyDraftUser(applications.value[0]?.id || null))

  const applicationsById = computed(() => {
    return new Map(applications.value.map((application) => [application.id, application]))
  })

  const companiesById = computed(() => {
    return new Map(companies.value.map((company) => [company.id, company]))
  })

  const accessesByUserId = computed(() => {
    const groupedAccesses = new Map()

    accesses.value.forEach((access) => {
      if (!groupedAccesses.has(access.userId)) {
        groupedAccesses.set(access.userId, [])
      }

      groupedAccesses.get(access.userId).push(access)
    })

    return groupedAccesses
  })

  const selectedUser = computed(() => {
    return users.value.find((user) => user.id === selectedUserId.value) || users.value[0] || null
  })

  const selectedUserAccesses = computed(() => {
    if (!selectedUser.value) return []

    return accessesByUserId.value.get(selectedUser.value.id) || []
  })

  const filteredUsers = computed(() => {
    return users.value.filter((user) => {
      const userAccesses = accessesByUserId.value.get(user.id) || []

      const matchesSearch = userMatchesSearch({
        user,
        accesses: userAccesses,
        applications: applications.value,
        companies: companies.value,
        modules: modules.value,
        moduleFunctions: moduleFunctions.value,
        roles: roles.value,
        term: debouncedSearchTerm.value,
      })

      const matchesStatus = selectedStatus.value === "all" || user.status === selectedStatus.value

      const matchesRole =
        selectedRole.value === "all" ||
        userAccesses.some((access) => access.role === selectedRole.value)

      const matchesCompany =
        selectedCompany.value === "all" ||
        userAccesses.some((access) => {
          const application = applicationsById.value.get(access.applicationId)

          return application?.companyId === selectedCompany.value
        })

      const matchesModule =
        selectedModule.value === "all" ||
        userAccesses.some((access) => {
          return (access.modules || []).some((moduleAccess) => {
            return moduleAccess.moduleId === selectedModule.value && moduleAccess.enabled
          })
        })

      return matchesSearch && matchesStatus && matchesRole && matchesCompany && matchesModule
    })
  })

  const visibleUsers = computed(() => {
    return filteredUsers.value.slice(0, visibleUserLimit.value)
  })

  const visibleUsersRemaining = computed(() => {
    return Math.max(filteredUsers.value.length - visibleUsers.value.length, 0)
  })

  const canShowMoreUsers = computed(() => {
    return visibleUsersRemaining.value > 0
  })

  const summaryItems = computed(() => {
    return [
      {
        key: "all",
        label: "Usuarios",
        value: users.value.length,
        filter: "all",
        class: "text-[#102372]",
      },
      {
        key: "active",
        label: "Habilitados",
        value: users.value.filter((user) => user.status === "active").length,
        filter: "active",
        class: "text-emerald-600",
      },
      {
        key: "pending",
        label: "Pendientes",
        value: users.value.filter((user) => user.status === "pending").length,
        filter: "pending",
        class: "text-[#ff6600]",
      },
      {
        key: "accesses",
        label: "Accesos",
        value: accesses.value.length,
        filter: "all",
        class: "text-slate-700",
      },
    ]
  })

  watch(
    [debouncedSearchTerm, selectedRole, selectedCompany, selectedStatus, selectedModule],
    () => {
      visibleUserLimit.value = DEFAULT_VISIBLE_USER_LIMIT
    },
  )

  const showMoreUsers = () => {
    visibleUserLimit.value += USER_LIMIT_INCREMENT
  }

  const selectUser = (userId) => {
    selectedUserId.value = userId
  }

  const clearFilters = () => {
    searchTerm.value = ""
    selectedRole.value = "all"
    selectedCompany.value = "all"
    selectedStatus.value = "all"
    selectedModule.value = "all"
    visibleUserLimit.value = DEFAULT_VISIBLE_USER_LIMIT
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

    draftUser.value = {
      id: selectedUser.value.id,
      name: selectedUser.value.name,
      username: selectedUser.value.username || "",
      password: "",
      email: selectedUser.value.email,
      status: selectedUser.value.status,
      initialApplicationId:
        selectedUserAccesses.value[0]?.applicationId || applications.value[0]?.id,
      initialRole: selectedUserAccesses.value[0]?.role || "viewer",
    }

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

    const identityAlreadyExists = users.value.some((user) => {
      return (
        user.username?.trim().toLowerCase() === username.toLowerCase() ||
        user.email?.trim().toLowerCase() === email.toLowerCase()
      )
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
    if (user.isPlatformAdmin) return

    const nextUsername = draftUser.value.username.trim()
    const nextEmail = draftUser.value.email.trim()
    const identityAlreadyExists = users.value.some((item) => {
      return (
        item.id !== user.id &&
        (item.username?.trim().toLowerCase() === nextUsername.toLowerCase() ||
          item.email?.trim().toLowerCase() === nextEmail.toLowerCase())
      )
    })

    if (identityAlreadyExists) return

    updateDatabaseUser(user.id, {
      name: draftUser.value.name.trim(),
      username: nextUsername,
      email: nextEmail,
      status: draftUser.value.status,
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
    if (selectedUser.value.isPlatformAdmin) return

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

    access.status = access.status === "active" ? "inactive" : "active"
  }

  const toggleModuleAccess = (accessId, moduleId) => {
    const access = accesses.value.find((item) => item.id === accessId)
    const moduleAccess = access?.modules?.find((item) => item.moduleId === moduleId)

    if (!moduleAccess) return

    moduleAccess.enabled = !moduleAccess.enabled

    if (!moduleAccess.enabled) {
      access.functions = (access.functions || []).map((functionAccess) => {
        const moduleFunction = moduleFunctions.value.find(
          (item) => item.id === functionAccess.functionId,
        )

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
      const moduleFunction = moduleFunctions.value.find(
        (item) => item.id === functionAccess.functionId,
      )

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

  const toggleFunctionAccess = (accessId, functionId) => {
    const access = accesses.value.find((item) => item.id === accessId)
    const functionAccess = access?.functions?.find((item) => item.functionId === functionId)
    const moduleFunction = moduleFunctions.value.find((item) => item.id === functionId)

    if (!access || !functionAccess || !moduleFunction) return

    functionAccess.enabled = !functionAccess.enabled

    const parentModuleAccess = access.modules?.find(
      (item) => item.moduleId === moduleFunction.moduleId,
    )

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

  const togglePermission = (accessId, functionId, permissionId) => {
    const access = accesses.value.find((item) => item.id === accessId)
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

  const updateOperationalScope = (accessId, scopeType) => {
    const access = accesses.value.find((item) => item.id === accessId)

    if (!access) return

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

  const toggleScopeOption = (accessId, optionKey) => {
    const access = accesses.value.find((item) => item.id === accessId)

    if (!access) return

    if (optionKey === "critical-alerts") {
      access.scope.criticalAlerts = !access.scope.criticalAlerts
    }

    if (optionKey === "reports") {
      access.scope.reports = !access.scope.reports
    }
  }

  const toggleScopeAsset = (accessId, assetId) => {
    const access = accesses.value.find((item) => item.id === accessId)
    const asset = assets.value.find((item) => String(item.id) === String(assetId))

    if (!access || !asset) return
    if (String(asset.applicationId) !== String(access.applicationId)) return

    if (!Array.isArray(access.scope.assetIds)) {
      access.scope.assetIds = []
    }

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

    if (!Array.isArray(access.scope.sucursalIds)) {
      access.scope.sucursalIds = []
    }

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
    users,
    accesses,
    companies,
    applications,
    modules,
    moduleFunctions,
    permissions,
    scopes,
    roles,
    assets,

    applicationsById,
    companiesById,
    accessesByUserId,

    searchTerm,
    selectedRole,
    selectedCompany,
    selectedStatus,
    selectedModule,

    visibleUserLimit,
    visibleUsers,
    visibleUsersRemaining,
    canShowMoreUsers,

    selectedUserId,
    selectedUser,
    selectedUserAccesses,
    filteredUsers,
    summaryItems,

    showEditorModal,
    editorMode,
    draftUser,

    selectUser,
    clearFilters,
    showMoreUsers,

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
    toggleScopeOption,
    toggleScopeAsset,
    toggleScopeSucursal,
  }
}
