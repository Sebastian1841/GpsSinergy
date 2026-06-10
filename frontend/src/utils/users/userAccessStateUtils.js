export const DEFAULT_VISIBLE_USER_LIMIT = 50
export const USER_LIMIT_INCREMENT = 50

export const USERS_MODULE_ID = "users"
export const USER_VIEW_FUNCTION_ID = "users-view"
export const USER_PERMISSIONS_FUNCTION_ID = "users-permissions"

export const normalizeUserAccessKey = (value) => String(value ?? "")

export const clonePlainObject = (value) => {
  return JSON.parse(JSON.stringify(value))
}

export const buildUniqueSequentialId = (prefix, items = []) => {
  const expression = new RegExp(`^${prefix}-(\\d+)$`)
  const highestId = items.reduce((highest, item) => {
    const match = String(item.id || "").match(expression)

    return match ? Math.max(highest, Number(match[1])) : highest
  }, 0)

  return `${prefix}-${String(highestId + 1).padStart(3, "0")}`
}

export const createEmptyPermissions = () => {
  return {
    view: false,
    edit: false,
    admin: false,
  }
}

export const createCleanScope = (scope = {}) => {
  return {
    type: scope.type || "sucursal",
    sucursalIds: Array.isArray(scope.sucursalIds) ? scope.sucursalIds : [],
    assetIds: Array.isArray(scope.assetIds) ? scope.assetIds : [],
  }
}

export const createDefaultModuleAccess = (modules = []) => {
  return modules.map((module) => {
    return {
      moduleId: module.id,
      enabled: module.id === "assets",
    }
  })
}

export const createDefaultFunctionAccess = (moduleFunctions = []) => {
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

export const createDefaultAccess = ({ id, userId, applicationId, modules, moduleFunctions }) => {
  return {
    id,
    userId,
    applicationId,
    role: "viewer",
    status: "active",
    modules: createDefaultModuleAccess(modules),
    functions: createDefaultFunctionAccess(moduleFunctions),
    scope: createCleanScope(),
  }
}

export const normalizeAccess = ({ access, modules, moduleFunctions }) => {
  const legacyFunctionAccesses = access.functions || access.modules || []
  const legacyFunctionsById = new Map(
    legacyFunctionAccesses.map((item) => [item.functionId || item.moduleId, item]),
  )

  const normalizedFunctions = moduleFunctions.map((moduleFunction) => {
    const legacyFunction = legacyFunctionsById.get(moduleFunction.id)
    const isAdminUserFunction =
      access.role === "admin" && moduleFunction.moduleId === USERS_MODULE_ID

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
    scope: createCleanScope(access.scope),
  }
}

export const createEmptyDraftUser = (initialApplicationId = null) => {
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

export const createDraftUserFromSelected = ({
  selectedUser,
  selectedUserAccesses,
  fallbackApplicationId,
}) => {
  return {
    id: selectedUser.id,
    name: selectedUser.name,
    username: selectedUser.username || "",
    password: "",
    email: selectedUser.email,
    status: selectedUser.status,
    initialApplicationId: selectedUserAccesses[0]?.applicationId || fallbackApplicationId,
    initialRole: selectedUserAccesses[0]?.role || "viewer",
  }
}

export const userIdentityAlreadyExists = ({ users, username, email, excludeUserId = null }) => {
  const normalizedUsername = username.trim().toLowerCase()
  const normalizedEmail = email.trim().toLowerCase()

  return users.some((user) => {
    if (excludeUserId && user.id === excludeUserId) return false

    return (
      user.username?.trim().toLowerCase() === normalizedUsername ||
      user.email?.trim().toLowerCase() === normalizedEmail
    )
  })
}
