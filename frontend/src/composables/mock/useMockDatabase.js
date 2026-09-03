import { computed, ref } from "vue"

import { mockDatabaseSeed } from "../../data/mockDatabase.js"
import { readJsonStorage, writeJsonStorage } from "../../services/storage/browserStorage.js"
import { getAssetTypeOption } from "../../utils/activos/assetTypeOptions.js"
import { normalizeFleetAssetTagIds } from "../../utils/activos/fleetAssetFormUtils.js"
import { createCleanScope } from "../../utils/users/userAccessStateUtils.js"

const STORAGE_KEY = "sinergy-mock-database"
const STORAGE_VERSION = 1
const PERSIST_DEBOUNCE_MS = 250
const BEFORE_UNLOAD_HANDLER_KEY = "__sinergyMockDatabaseBeforeUnloadHandler"
const ACTIVE_ACCESS_SCOPE_TYPES = new Set(["all-assets", "selected-assets", "asset-tags"])

let persistTimeout = null

const cloneData = (value) => JSON.parse(JSON.stringify(value))

const normalizeKey = (value) => String(value ?? "")

const normalizeLowerKey = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase()
}

const buildAccessUniqueKey = ({ userId, applicationId }) => {
  return `${normalizeKey(userId)}::${normalizeKey(applicationId)}`
}

const emptyCompanyAssetStats = Object.freeze({
  assetsCount: 0,
  activeAssetsCount: 0,
  movingAssetsCount: 0,
  alertsCount: 0,
})

const mergeSeedById = (items = [], seedItems = []) => {
  const itemIds = new Set(items.map((item) => normalizeKey(item.id)))
  const missingSeedItems = seedItems.filter((item) => !itemIds.has(normalizeKey(item.id)))

  return [...items, ...cloneData(missingSeedItems)]
}

const buildCompanyReports = (enabled = true) => {
  return mockDatabaseSeed.reportTypes.map((reportType) => ({
    reportId: reportType.id,
    enabled,
  }))
}

const normalizeCompanyReports = () => buildCompanyReports(true)

const normalizeCompany = (company) => {
  const companyId = normalizeKey(company?.id)

  return {
    ...company,
    applicationId: company?.applicationId || `app-${companyId}`,
    reports: normalizeCompanyReports(company),
    sucursales: Array.isArray(company?.sucursales) ? company.sucursales : [],
    sucursalesHabilitadas:
      typeof company?.sucursalesHabilitadas === "boolean" ? company.sucursalesHabilitadas : true,
  }
}

const normalizeCompanies = (items = []) => {
  return items.map(normalizeCompany)
}

const normalizeApplicationDefinition = (application) => {
  const companyId = normalizeKey(application?.companyId)
  const applicationId = normalizeKey(application?.id || application?.applicationId)

  return {
    ...application,
    id: applicationId || `app-${companyId}`,
    companyId,
    shortName: application?.shortName || "APP",
    type: application?.type || "Empresa cliente",
  }
}

const normalizeApplicationDefinitions = (items = []) => {
  return mergeSeedById(items, mockDatabaseSeed.applicationDefinitions).map(
    normalizeApplicationDefinition,
  )
}

const findSeedApplicationByCompanyId = (companyId) => {
  return mockDatabaseSeed.applicationDefinitions.find((application) => {
    return normalizeKey(application.companyId) === normalizeKey(companyId)
  })
}

const findSeedApplicationById = (applicationId) => {
  return mockDatabaseSeed.applicationDefinitions.find((application) => {
    return normalizeKey(application.id) === normalizeKey(applicationId)
  })
}

const resolveAssetTypeOption = (asset, seedAsset) => {
  return getAssetTypeOption(
    asset?.assetType ||
      asset?.tipoActivo ||
      asset?.mapIcon ||
      asset?.markerIcon ||
      asset?.iconType ||
      seedAsset?.assetType ||
      seedAsset?.tipoActivo ||
      seedAsset?.mapIcon,
  )
}

const resolveAssetMapIcon = (asset, seedAsset, assetTypeOption) => {
  if (Object.hasOwn(asset || {}, "mapIcon")) {
    return asset.mapIcon || assetTypeOption?.mapIcon || "vehicle-3d"
  }

  if (seedAsset) return seedAsset.mapIcon || assetTypeOption?.mapIcon || "vehicle-3d"

  return assetTypeOption?.mapIcon || "vehicle-3d"
}

const normalizeAsset = (asset) => {
  const seedAsset = mockDatabaseSeed.assets.find((item) => {
    return normalizeKey(item.id) === normalizeKey(asset?.id)
  })

  const seedApplicationByAssetApplication = findSeedApplicationById(
    asset?.applicationId || seedAsset?.applicationId,
  )
  const seedApplicationByAssetCompany = findSeedApplicationByCompanyId(
    asset?.companyId || seedAsset?.companyId,
  )

  const applicationId =
    asset?.applicationId || seedAsset?.applicationId || seedApplicationByAssetCompany?.id || ""

  const companyId =
    asset?.companyId ||
    seedAsset?.companyId ||
    seedApplicationByAssetApplication?.companyId ||
    seedApplicationByAssetCompany?.companyId ||
    ""

  const patente = asset?.patente || asset?.patent || seedAsset?.patente || seedAsset?.patent || ""

  const nombrePantalla =
    asset?.nombrePantalla ||
    asset?.nombre ||
    asset?.name ||
    asset?.vehiculo ||
    seedAsset?.nombrePantalla ||
    seedAsset?.nombre ||
    seedAsset?.name ||
    seedAsset?.vehiculo ||
    patente ||
    "Activo"

  const assetTypeOption = resolveAssetTypeOption(asset, seedAsset)
  const mapIcon = resolveAssetMapIcon(asset, seedAsset, assetTypeOption)

  const assetType =
    asset?.assetType || asset?.tipoActivo || seedAsset?.assetType || assetTypeOption.value

  const assetTypeLabel =
    asset?.assetTypeLabel ||
    asset?.tipoActivoLabel ||
    seedAsset?.assetTypeLabel ||
    assetTypeOption.label

  const tipoActivo =
    asset?.tipoActivo || asset?.assetType || seedAsset?.tipoActivo || assetTypeOption.value

  const tipoActivoLabel =
    asset?.tipoActivoLabel ||
    asset?.assetTypeLabel ||
    seedAsset?.tipoActivoLabel ||
    assetTypeOption.label

  const assetTagIds = normalizeFleetAssetTagIds(asset?.assetTagIds)

  return {
    ...asset,
    applicationId,
    companyId,
    patente,
    nombrePantalla,
    assetType,
    assetTypeLabel,
    tipoActivo,
    tipoActivoLabel,
    assetTagIds,
    mapIcon,
    markerIcon: asset?.markerIcon || mapIcon,
    iconType: asset?.iconType || mapIcon,
    estado: asset?.estado || asset?.status || seedAsset?.estado || "offline",
  }
}

const normalizeAssets = (items = []) => {
  return mergeSeedById(items, mockDatabaseSeed.assets).map(normalizeAsset)
}

const normalizeAssetTag = (tag = {}) => {
  return {
    ...tag,
    id: normalizeKey(tag.id),
    companyId: normalizeKey(tag.companyId),
    applicationId: normalizeKey(tag.applicationId),
    name: String(tag.name || "").trim(),
    active: tag.active !== false,
  }
}

const normalizeAssetTags = (items = []) => {
  return items.map(normalizeAssetTag).filter((tag) => tag.id && tag.name)
}

const normalizeUser = (user) => {
  return {
    ...user,
    isPlatformAdmin: Boolean(user.isPlatformAdmin || user.id === "user-001"),
  }
}

const normalizeUsers = (items = []) => {
  return mergeSeedById(items, mockDatabaseSeed.users).map(normalizeUser)
}

const hasLegacySucursalScopes = (items = []) => {
  return Array.isArray(items) && items.some((access) => access?.scope?.type === "sucursal")
}

const normalizeScopes = (items = []) => {
  return items.filter((scope) => ACTIVE_ACCESS_SCOPE_TYPES.has(normalizeKey(scope?.id)))
}

const getValidSucursalIdsForAccess = ({
  access,
  companyItems = mockDatabaseSeed.companies,
  applicationItems = mockDatabaseSeed.applicationDefinitions,
} = {}) => {
  const applicationId = normalizeKey(access?.applicationId)

  const application = applicationItems.find((item) => {
    return normalizeKey(item?.id || item?.applicationId) === applicationId
  })

  const companyId = normalizeKey(application?.companyId)

  const company = companyItems.find((item) => {
    return normalizeKey(item?.id) === companyId
  })

  if (!company || !Array.isArray(company.sucursales)) return null

  return company.sucursales
    .filter((sucursal) => sucursal.active !== false)
    .map((sucursal) => normalizeKey(sucursal.id))
    .filter(Boolean)
}

const normalizeAccessScope = (
  scope = {},
  { applicationId = null, assetItems = [], validSucursalIds = null } = {},
) => {
  const normalizedScope = createCleanScope(scope, {
    assets: assetItems,
    applicationId,
    validSucursalIds,
  })

  return {
    ...scope,
    ...normalizedScope,
    assetTagIds: normalizeFleetAssetTagIds(normalizedScope.assetTagIds),
  }
}

const createDisabledModuleAccess = (moduleId) => ({
  moduleId,
  enabled: false,
})

const createDisabledFunctionAccess = (functionId) => ({
  functionId,
  enabled: false,
  permissions: {
    view: false,
    edit: false,
    admin: false,
  },
})

const createEnabledModuleAccess = (moduleId) => ({
  moduleId,
  enabled: true,
})

const createEnabledFunctionAccess = (functionId) => ({
  functionId,
  enabled: true,
  permissions: {
    view: true,
    edit: true,
    admin: true,
  },
})

const buildPlatformAdminAccessId = ({ userId, applicationId }) => {
  return `access-platform-admin-${normalizeKey(userId)}-${normalizeKey(applicationId)}`
}

const createPlatformAdminAccess = ({ userId, applicationId, id = null }) => {
  return {
    id:
      id ||
      buildPlatformAdminAccessId({
        userId,
        applicationId,
      }),
    userId: normalizeKey(userId),
    applicationId: normalizeKey(applicationId),
    role: "admin",
    status: "active",
    modules: mockDatabaseSeed.modules.map((module) => createEnabledModuleAccess(module.id)),
    functions: mockDatabaseSeed.moduleFunctions.map((moduleFunction) => {
      return createEnabledFunctionAccess(moduleFunction.id)
    }),
    scope: {
      type: "all-assets",
      sucursalIds: [],
      assetIds: [],
      assetTagIds: [],
    },
  }
}

const normalizeAccessModules = (items = []) => {
  const modulesById = new Map(
    items.map((moduleAccess) => [normalizeKey(moduleAccess.moduleId), moduleAccess]),
  )
  const seedModuleIds = new Set(mockDatabaseSeed.modules.map((module) => normalizeKey(module.id)))
  const normalizedSeedModules = mockDatabaseSeed.modules.map((module) => {
    return modulesById.get(normalizeKey(module.id)) || createDisabledModuleAccess(module.id)
  })
  const extraModules = items.filter((moduleAccess) => {
    return !seedModuleIds.has(normalizeKey(moduleAccess.moduleId))
  })

  return [...normalizedSeedModules, ...extraModules]
}

const normalizeAccessFunctions = (items = []) => {
  const functionsById = new Map(
    items.map((functionAccess) => [normalizeKey(functionAccess.functionId), functionAccess]),
  )
  const seedFunctionIds = new Set(
    mockDatabaseSeed.moduleFunctions.map((moduleFunction) => normalizeKey(moduleFunction.id)),
  )
  const normalizedSeedFunctions = mockDatabaseSeed.moduleFunctions.map((moduleFunction) => {
    return (
      functionsById.get(normalizeKey(moduleFunction.id)) ||
      createDisabledFunctionAccess(moduleFunction.id)
    )
  })
  const extraFunctions = items.filter((functionAccess) => {
    return !seedFunctionIds.has(normalizeKey(functionAccess.functionId))
  })

  return [...normalizedSeedFunctions, ...extraFunctions]
}

const normalizeAccess = (
  access,
  {
    assetItems = mockDatabaseSeed.assets,
    companyItems = mockDatabaseSeed.companies,
    applicationItems = mockDatabaseSeed.applicationDefinitions,
  } = {},
) => {
  const validSucursalIds = getValidSucursalIdsForAccess({
    access,
    companyItems,
    applicationItems,
  })

  return {
    ...access,
    modules: normalizeAccessModules(Array.isArray(access?.modules) ? access.modules : []),
    functions: normalizeAccessFunctions(Array.isArray(access?.functions) ? access.functions : []),
    scope: normalizeAccessScope(access?.scope, {
      applicationId: access?.applicationId,
      assetItems,
      validSucursalIds,
    }),
  }
}

const normalizePlatformAdminAccess = (access, options = {}) => {
  return normalizeAccess(
    createPlatformAdminAccess({
      userId: access.userId,
      applicationId: access.applicationId,
      id: access.id,
    }),
    options,
  )
}

const ensurePlatformAdminAccesses = ({
  items = [],
  userItems = mockDatabaseSeed.users,
  applicationItems = mockDatabaseSeed.applicationDefinitions,
  assetItems = mockDatabaseSeed.assets,
  companyItems = mockDatabaseSeed.companies,
} = {}) => {
  const usersById = new Map(
    userItems.map((user) => {
      const normalizedUser = normalizeUser(user)

      return [normalizeKey(normalizedUser.id), normalizedUser]
    }),
  )
  const platformAdminUsers = Array.from(usersById.values()).filter((user) => {
    return user.isPlatformAdmin
  })
  const normalizeOptions = {
    assetItems,
    companyItems,
    applicationItems,
  }

  if (!platformAdminUsers.length) {
    return items.map((access) => normalizeAccess(access, normalizeOptions))
  }

  const normalizedAccesses = []
  const accessKeys = new Set()

  items.forEach((access) => {
    const accessUser = usersById.get(normalizeKey(access.userId))
    const normalizedAccess = accessUser?.isPlatformAdmin
      ? normalizePlatformAdminAccess(access, normalizeOptions)
      : normalizeAccess(access, normalizeOptions)

    normalizedAccesses.push(normalizedAccess)
    accessKeys.add(
      buildAccessUniqueKey({
        userId: normalizedAccess.userId,
        applicationId: normalizedAccess.applicationId,
      }),
    )
  })

  platformAdminUsers.forEach((user) => {
    applicationItems.forEach((application) => {
      const applicationId = normalizeKey(application.id || application.applicationId)

      if (!applicationId) return

      const accessKey = buildAccessUniqueKey({
        userId: user.id,
        applicationId,
      })

      if (accessKeys.has(accessKey)) return

      normalizedAccesses.push(
        normalizePlatformAdminAccess(
          createPlatformAdminAccess({
            userId: user.id,
            applicationId,
          }),
          normalizeOptions,
        ),
      )
      accessKeys.add(accessKey)
    })
  })

  return normalizedAccesses
}

const normalizeAccesses = (
  items = [],
  {
    userItems = mockDatabaseSeed.users,
    applicationItems = mockDatabaseSeed.applicationDefinitions,
    assetItems = mockDatabaseSeed.assets,
    companyItems = mockDatabaseSeed.companies,
  } = {},
) => {
  return ensurePlatformAdminAccesses({
    items: mergeSeedById(items, mockDatabaseSeed.accesses),
    userItems,
    applicationItems,
    assetItems,
    companyItems,
  })
}

const readPersistedDatabase = () => {
  const payload = readJsonStorage(STORAGE_KEY, null)

  if (payload?.version !== STORAGE_VERSION || !payload.data) return null

  return payload.data
}

const persistedDatabase = readPersistedDatabase()

const initialAccessItems = mergeSeedById(
  cloneData(persistedDatabase?.accesses || mockDatabaseSeed.accesses),
  mockDatabaseSeed.accesses,
)

let legacyAccessMigrationPending = hasLegacySucursalScopes(initialAccessItems)

const companies = ref(
  normalizeCompanies(cloneData(persistedDatabase?.companies || mockDatabaseSeed.companies)),
)

const applicationDefinitions = ref(
  normalizeApplicationDefinitions(
    cloneData(persistedDatabase?.applicationDefinitions || mockDatabaseSeed.applicationDefinitions),
  ),
)

const assetTags = ref(
  normalizeAssetTags(
    cloneData(
      Array.isArray(persistedDatabase?.assetTags)
        ? persistedDatabase.assetTags
        : mockDatabaseSeed.assetTags || [],
    ),
  ),
)

const assets = ref(normalizeAssets(cloneData(persistedDatabase?.assets || mockDatabaseSeed.assets)))

const users = ref(normalizeUsers(cloneData(persistedDatabase?.users || mockDatabaseSeed.users)))

const accesses = ref(
  normalizeAccesses(initialAccessItems, {
    userItems: users.value,
    applicationItems: applicationDefinitions.value,
    assetItems: assets.value,
    companyItems: companies.value,
  }),
)

const reportTypes = ref(cloneData(mockDatabaseSeed.reportTypes))
const modules = ref(cloneData(mockDatabaseSeed.modules))
const moduleFunctions = ref(cloneData(mockDatabaseSeed.moduleFunctions))
const permissions = ref(cloneData(mockDatabaseSeed.permissions))
const scopes = ref(normalizeScopes(cloneData(mockDatabaseSeed.scopes)))
const roles = ref(cloneData(mockDatabaseSeed.roles))

const getCompanyReportsSignature = (items = []) => {
  return JSON.stringify(
    items.map((company) => ({
      id: company.id,
      reports: company.reports,
      sucursalesHabilitadas: company.sucursalesHabilitadas,
    })),
  )
}

const syncCompaniesWithSeed = () => {
  const previousSignature = getCompanyReportsSignature(companies.value)

  companies.value = normalizeCompanies(companies.value)

  if (previousSignature !== getCompanyReportsSignature(companies.value)) {
    schedulePersistDatabase()
  }
}

const persistDatabase = () => {
  writeJsonStorage(STORAGE_KEY, {
    version: STORAGE_VERSION,
    data: {
      companies: companies.value,
      applicationDefinitions: applicationDefinitions.value,
      assetTags: assetTags.value,
      assets: assets.value,
      users: users.value,
      accesses: accesses.value,
    },
    updatedAt: new Date().toISOString(),
  })
}

const schedulePersistDatabase = () => {
  if (typeof window === "undefined") return

  if (persistTimeout !== null) {
    window.clearTimeout(persistTimeout)
  }

  persistTimeout = window.setTimeout(() => {
    persistTimeout = null
    persistDatabase()
  }, PERSIST_DEBOUNCE_MS)
}

const getAccessesSignature = (items = []) => {
  return JSON.stringify(
    items.map((access) => ({
      id: access.id,
      userId: access.userId,
      applicationId: access.applicationId,
      role: access.role,
      status: access.status,
      modules: access.modules,
      functions: access.functions,
      scope: access.scope,
    })),
  )
}

const syncPlatformAdminAccesses = () => {
  const previousSignature = getAccessesSignature(accesses.value)

  accesses.value = normalizeAccesses(accesses.value, {
    userItems: users.value,
    applicationItems: applicationDefinitions.value,
    assetItems: assets.value,
    companyItems: companies.value,
  })

  if (previousSignature !== getAccessesSignature(accesses.value)) {
    schedulePersistDatabase()
  }
}

const handleBeforeUnloadPersist = () => {
  if (persistTimeout !== null) {
    window.clearTimeout(persistTimeout)
    persistTimeout = null
  }

  persistDatabase()
}

if (typeof window !== "undefined") {
  const previousHandler = window[BEFORE_UNLOAD_HANDLER_KEY]

  if (typeof previousHandler === "function") {
    window.removeEventListener("beforeunload", previousHandler)
  }

  window[BEFORE_UNLOAD_HANDLER_KEY] = handleBeforeUnloadPersist
  window.addEventListener("beforeunload", handleBeforeUnloadPersist)
}

const companiesById = computed(() => {
  return new Map(companies.value.map((company) => [normalizeKey(company.id), company]))
})

const usersById = computed(() => {
  return new Map(users.value.map((user) => [normalizeKey(user.id), user]))
})

const usersByUsername = computed(() => {
  return new Map(
    users.value
      .map((user) => [normalizeLowerKey(user.username), user])
      .filter(([username]) => Boolean(username)),
  )
})

const usersByEmail = computed(() => {
  return new Map(
    users.value
      .map((user) => [normalizeLowerKey(user.email), user])
      .filter(([email]) => Boolean(email)),
  )
})

const accessesById = computed(() => {
  return new Map(accesses.value.map((access) => [normalizeKey(access.id), access]))
})

const accessesByUserApplicationKey = computed(() => {
  return new Map(
    accesses.value.map((access) => [
      buildAccessUniqueKey({
        userId: access.userId,
        applicationId: access.applicationId,
      }),
      access,
    ]),
  )
})

const applicationDefinitionsById = computed(() => {
  return new Map(
    applicationDefinitions.value.map((application) => [normalizeKey(application.id), application]),
  )
})

const applicationDefinitionsByCompanyId = computed(() => {
  return new Map(
    applicationDefinitions.value.map((application) => [
      normalizeKey(application.companyId),
      application,
    ]),
  )
})

const assetIndexes = computed(() => {
  const byId = new Map()
  const byApplicationId = new Map()
  const byCompanyId = new Map()
  const statsByCompanyId = new Map()

  const ensureGroupedList = (map, key) => {
    if (!map.has(key)) {
      map.set(key, [])
    }

    return map.get(key)
  }

  const ensureCompanyStats = (companyId) => {
    if (!statsByCompanyId.has(companyId)) {
      statsByCompanyId.set(companyId, {
        assetsCount: 0,
        activeAssetsCount: 0,
        movingAssetsCount: 0,
        alertsCount: 0,
      })
    }

    return statsByCompanyId.get(companyId)
  }

  assets.value.forEach((asset) => {
    const assetId = normalizeKey(asset.id)
    const applicationId = normalizeKey(asset.applicationId)

    if (assetId) {
      byId.set(assetId, asset)
    }

    if (applicationId) {
      ensureGroupedList(byApplicationId, applicationId).push(asset)
    }

    const directCompanyId = normalizeKey(asset.companyId)
    const application = applicationDefinitionsById.value.get(applicationId)
    const fallbackCompanyId = normalizeKey(application?.companyId)
    const companyId = directCompanyId || fallbackCompanyId

    if (!companyId) return

    ensureGroupedList(byCompanyId, companyId).push(asset)

    const stats = ensureCompanyStats(companyId)

    stats.assetsCount += 1

    if (asset.estado !== "offline") {
      stats.activeAssetsCount += 1
    }

    if (asset.estado === "moving") {
      stats.movingAssetsCount += 1
    }

    if (asset.choque && asset.choque !== "-") {
      stats.alertsCount += 1
    }
  })

  return {
    byId,
    byApplicationId,
    byCompanyId,
    statsByCompanyId,
  }
})

const assetsByApplicationId = computed(() => {
  return assetIndexes.value.byApplicationId
})

const assetsByCompanyId = computed(() => {
  return assetIndexes.value.byCompanyId
})

const assetStatsByCompanyId = computed(() => {
  return assetIndexes.value.statsByCompanyId
})

const userIdsByApplicationId = computed(() => {
  const groupedUserIds = new Map()

  accesses.value.forEach((access) => {
    const applicationId = normalizeKey(access.applicationId)
    const userId = normalizeKey(access.userId)

    if (!applicationId || !userId) return

    if (!groupedUserIds.has(applicationId)) {
      groupedUserIds.set(applicationId, new Set())
    }

    groupedUserIds.get(applicationId).add(userId)
  })

  return groupedUserIds
})

const applications = computed(() => {
  return applicationDefinitions.value.map((application) => {
    const company = companiesById.value.get(normalizeKey(application.companyId))
    const applicationAssets = assetsByApplicationId.value.get(normalizeKey(application.id)) || []

    return {
      ...application,
      name: company?.name || "Empresa sin nombre",
      status: company?.status || "inactive",
      sucursales: company?.sucursales || [],
      assetsCount: applicationAssets.length,
    }
  })
})

const companyRecords = computed(() => {
  return companies.value.map((company) => {
    const companyId = normalizeKey(company.id)
    const companyAssets = assetsByCompanyId.value.get(companyId) || []
    const companyAssetStats = assetStatsByCompanyId.value.get(companyId) || emptyCompanyAssetStats

    const application =
      applicationDefinitionsByCompanyId.value.get(companyId) ||
      applicationDefinitionsById.value.get(normalizeKey(company.applicationId))

    const applicationId = application?.id || company.applicationId

    const companyUserIds =
      userIdsByApplicationId.value.get(normalizeKey(applicationId)) || new Set()

    return {
      ...company,
      applicationId,
      assets: companyAssets,
      assetsCount: companyAssetStats.assetsCount,
      activeAssetsCount: companyAssetStats.activeAssetsCount,
      movingAssetsCount: companyAssetStats.movingAssetsCount,
      alertsCount: companyAssetStats.alertsCount,
      usersCount: companyUserIds.size,
    }
  })
})

const applicationRecordsByCompanyId = computed(() => {
  return new Map(
    applications.value.map((application) => [normalizeKey(application.companyId), application]),
  )
})

const getCompany = (companyId) => {
  return companiesById.value.get(normalizeKey(companyId)) || null
}

const getApplicationForCompany = (companyId) => {
  return applicationRecordsByCompanyId.value.get(normalizeKey(companyId)) || null
}

const createCompany = (company) => {
  const companyId = company.id
  const applicationId = company.applicationId || `app-${companyId}`
  const companyName = String(company.name || "Empresa")

  companies.value.unshift(
    normalizeCompany({
      ...company,
      applicationId,
      reports: company.reports || buildCompanyReports(true),
    }),
  )

  applicationDefinitions.value.unshift(
    normalizeApplicationDefinition({
      id: applicationId,
      companyId,
      shortName: company.shortName || companyName.slice(0, 3).toUpperCase(),
      type: company.status === "internal" ? "Administracion interna" : "Empresa cliente",
    }),
  )

  syncPlatformAdminAccesses()
  schedulePersistDatabase()

  return getCompany(companyId)
}

const createUser = (user) => {
  const identityExists = Boolean(
    usersById.value.has(normalizeKey(user.id)) ||
    usersByUsername.value.has(normalizeLowerKey(user.username)) ||
    usersByEmail.value.has(normalizeLowerKey(user.email)),
  )

  if (identityExists) return null

  const nextUser = normalizeUser(user)

  users.value.unshift(nextUser)

  if (nextUser.isPlatformAdmin) {
    syncPlatformAdminAccesses()
  }

  schedulePersistDatabase()

  return nextUser
}

const updateUser = (userId, changes) => {
  const user = usersById.value.get(normalizeKey(userId))

  if (!user) return null

  Object.assign(user, normalizeUser({ ...user, ...changes }))

  if (user.isPlatformAdmin) {
    syncPlatformAdminAccesses()
  }

  schedulePersistDatabase()

  return user
}

const createAccess = (access) => {
  const nextAccess = normalizeAccess(access, {
    assetItems: assets.value,
    companyItems: companies.value,
    applicationItems: applicationDefinitions.value,
  })

  const userExists = usersById.value.has(normalizeKey(nextAccess.userId))

  const applicationExists = applicationDefinitionsById.value.has(
    normalizeKey(nextAccess.applicationId),
  )

  const accessIdExists = accessesById.value.has(normalizeKey(nextAccess.id))

  const userApplicationAccessExists = accessesByUserApplicationKey.value.has(
    buildAccessUniqueKey({
      userId: nextAccess.userId,
      applicationId: nextAccess.applicationId,
    }),
  )

  if (!userExists || !applicationExists || accessIdExists || userApplicationAccessExists) {
    return null
  }

  accesses.value.unshift(nextAccess)
  schedulePersistDatabase()

  return nextAccess
}

const deleteAccess = (accessId) => {
  const normalizedAccessId = normalizeKey(accessId)
  const previousLength = accesses.value.length

  accesses.value = accesses.value.filter((access) => {
    return normalizeKey(access.id) !== normalizedAccessId
  })

  if (accesses.value.length !== previousLength) {
    schedulePersistDatabase()
  }
}

const updateCompany = (companyId, changes) => {
  const company = getCompany(companyId)

  if (!company) return null

  Object.assign(company, normalizeCompany({ ...company, ...changes }))
  schedulePersistDatabase()

  return company
}

const createAssetTag = (tag = {}) => {
  const companyId = normalizeKey(tag.companyId)

  const application =
    applicationDefinitionsById.value.get(normalizeKey(tag.applicationId)) ||
    applicationDefinitionsByCompanyId.value.get(companyId)

  const nextAssetTag = normalizeAssetTag({
    ...tag,
    id: tag.id || `asset-tag-${Date.now()}`,
    companyId: companyId || application?.companyId || "",
    applicationId: tag.applicationId || application?.id || "",
  })

  if (!nextAssetTag.id || !nextAssetTag.name) return null

  const tagIdExists = assetTags.value.some((item) => {
    return normalizeKey(item.id) === normalizeKey(nextAssetTag.id)
  })

  if (tagIdExists) return null

  assetTags.value.unshift(nextAssetTag)
  schedulePersistDatabase()

  return nextAssetTag
}

const updateAssetTag = (assetTagId, changes = {}) => {
  const normalizedAssetTagId = normalizeKey(assetTagId)
  let updatedAssetTag = null

  assetTags.value = assetTags.value.map((assetTag) => {
    if (normalizeKey(assetTag.id) !== normalizedAssetTagId) return assetTag

    const nextAssetTag = normalizeAssetTag({
      ...assetTag,
      ...changes,
      id: assetTag.id,
    })

    if (!nextAssetTag.name) return assetTag

    updatedAssetTag = nextAssetTag

    return nextAssetTag
  })

  if (updatedAssetTag) {
    schedulePersistDatabase()
  }

  return updatedAssetTag
}

const deleteAssetTag = (assetTagId) => {
  const normalizedAssetTagId = normalizeKey(assetTagId)
  const previousLength = assetTags.value.length

  assetTags.value = assetTags.value.filter((assetTag) => {
    return normalizeKey(assetTag.id) !== normalizedAssetTagId
  })

  if (assetTags.value.length === previousLength) return

  assets.value.forEach((asset) => {
    asset.assetTagIds = normalizeFleetAssetTagIds(asset.assetTagIds).filter((id) => {
      return normalizeKey(id) !== normalizedAssetTagId
    })
  })

  accesses.value.forEach((access) => {
    if (!access.scope) {
      access.scope = {}
    }

    access.scope.assetTagIds = normalizeFleetAssetTagIds(access.scope.assetTagIds).filter((id) => {
      return normalizeKey(id) !== normalizedAssetTagId
    })
  })

  schedulePersistDatabase()
}

const createAsset = (asset) => {
  const nextAsset = normalizeAsset(asset)

  assets.value.unshift(nextAsset)
  schedulePersistDatabase()

  return nextAsset
}

const updateAsset = (assetId, changes) => {
  const normalizedAssetId = normalizeKey(assetId)
  let updatedAsset = null

  assets.value = assets.value.map((asset) => {
    if (normalizeKey(asset.id) !== normalizedAssetId) return asset

    updatedAsset = normalizeAsset({
      ...asset,
      ...changes,
    })

    return updatedAsset
  })

  if (updatedAsset) {
    schedulePersistDatabase()
  }

  return updatedAsset
}

const deleteAsset = (assetId) => {
  const normalizedId = normalizeKey(assetId)
  const previousAssetsLength = assets.value.length

  assets.value = assets.value.filter((asset) => normalizeKey(asset.id) !== normalizedId)

  accesses.value.forEach((access) => {
    if (!access.scope) {
      access.scope = {}
    }

    access.scope.assetIds = (access.scope.assetIds || []).filter((id) => {
      return normalizeKey(id) !== normalizedId
    })
  })

  if (assets.value.length !== previousAssetsLength) {
    schedulePersistDatabase()
  }
}

export function useMockDatabase() {
  syncCompaniesWithSeed()
  syncPlatformAdminAccesses()

  if (legacyAccessMigrationPending) {
    legacyAccessMigrationPending = false
    schedulePersistDatabase()
  }

  return {
    companies,
    companyRecords,
    applications,
    assetTags,
    assets,
    users,
    accesses,
    reportTypes,
    modules,
    moduleFunctions,
    permissions,
    scopes,
    roles,

    getCompany,
    getApplicationForCompany,
    createCompany,
    updateCompany,
    createUser,
    updateUser,
    createAccess,
    deleteAccess,
    createAssetTag,
    updateAssetTag,
    deleteAssetTag,
    createAsset,
    updateAsset,
    deleteAsset,
  }
}
