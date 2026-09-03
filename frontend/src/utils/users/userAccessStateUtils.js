export const DEFAULT_VISIBLE_USER_LIMIT = 50
export const USER_LIMIT_INCREMENT = 50

export const USERS_MODULE_ID = "users"
export const USER_VIEW_FUNCTION_ID = "users-view"
export const USER_PERMISSIONS_FUNCTION_ID = "users-permissions"

const ACTIVE_SCOPE_TYPES = new Set(["all-assets", "selected-assets", "asset-tags"])

export const normalizeUserAccessKey = (value) => String(value ?? "")

const normalizeIdList = (values = []) => {
  return Array.from(
    new Set(
      (Array.isArray(values) ? values : [])
        .map((value) => normalizeUserAccessKey(value).trim())
        .filter(Boolean),
    ),
  )
}

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

export const getLegacySucursalAssetIds = ({
  scope = {},
  assets = [],
  applicationId = null,
  validSucursalIds = null,
} = {}) => {
  if (scope.type !== "sucursal" || !Array.isArray(assets)) return []

  const selectedSucursalIds = new Set(normalizeIdList(scope.sucursalIds))

  if (!selectedSucursalIds.size) return []

  const normalizedApplicationId = normalizeUserAccessKey(applicationId).trim()
  const validSucursalIdSet = Array.isArray(validSucursalIds)
    ? new Set(normalizeIdList(validSucursalIds))
    : null

  return normalizeIdList(
    assets
      .filter((asset) => {
        if (
          normalizedApplicationId &&
          normalizeUserAccessKey(asset?.applicationId).trim() !== normalizedApplicationId
        ) {
          return false
        }

        const sucursalId = normalizeUserAccessKey(asset?.sucursalId).trim()

        if (!selectedSucursalIds.has(sucursalId)) return false
        if (validSucursalIdSet && !validSucursalIdSet.has(sucursalId)) return false

        return true
      })
      .map((asset) => asset?.id),
  )
}

export const migrateLegacySucursalScopeToAssets = ({
  scope = {},
  assets = [],
  applicationId = null,
  validSucursalIds = null,
} = {}) => {
  if (scope.type !== "sucursal") return null

  const legacyAssetIds = getLegacySucursalAssetIds({
    scope,
    assets,
    applicationId,
    validSucursalIds,
  })

  return {
    type: "selected-assets",
    sucursalIds: [],
    assetIds: normalizeIdList([...(scope.assetIds || []), ...legacyAssetIds]),
    assetTagIds: [],
  }
}

export const createCleanScope = (
  scope = {},
  { assets = null, applicationId = null, validSucursalIds = null } = {},
) => {
  const assetTagIds = Array.isArray(scope.assetTagIds)
    ? scope.assetTagIds
    : Array.isArray(scope.tagIds)
      ? scope.tagIds
      : []

  const scopeType = String(scope.type || "all-assets")

  if (scopeType === "sucursal") {
    if (Array.isArray(assets)) {
      return migrateLegacySucursalScopeToAssets({
        scope,
        assets,
        applicationId,
        validSucursalIds,
      })
    }

    return {
      type: "selected-assets",
      sucursalIds: [],
      assetIds: normalizeIdList(scope.assetIds),
      assetTagIds: [],
    }
  }

  return {
    type: ACTIVE_SCOPE_TYPES.has(scopeType) ? scopeType : "all-assets",
    sucursalIds: normalizeIdList(scope.sucursalIds),
    assetIds: normalizeIdList(scope.assetIds),
    assetTagIds: normalizeIdList(assetTagIds),
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

export const normalizeAccess = ({
  access,
  modules,
  moduleFunctions,
  assets = null,
  validSucursalIds = null,
}) => {
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
      const moduleFunction = moduleFunctions.find((item) => {
        return item.id === functionAccess.functionId
      })

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
    scope: createCleanScope(access.scope, {
      assets,
      applicationId: access.applicationId,
      validSucursalIds,
    }),
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
