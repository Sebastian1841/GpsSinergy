import { computed, ref } from "vue"

import { mockDatabaseSeed } from "../../data/mockDatabase.js"
import { readJsonStorage, writeJsonStorage } from "../../services/storage/browserStorage.js"
import { getAssetTypeOption } from "../../utils/activos/assetTypeOptions.js"

const STORAGE_KEY = "sinergy-mock-database"
const STORAGE_VERSION = 1
const PERSIST_DEBOUNCE_MS = 250
const BEFORE_UNLOAD_HANDLER_KEY = "__sinergyMockDatabaseBeforeUnloadHandler"

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

  return {
    ...asset,
    applicationId,
    companyId,
    patente,
    nombrePantalla,
    assetType:
      asset?.assetType || asset?.tipoActivo || seedAsset?.assetType || assetTypeOption.value,
    assetTypeLabel:
      asset?.assetTypeLabel ||
      asset?.tipoActivoLabel ||
      seedAsset?.assetTypeLabel ||
      assetTypeOption.label,
    tipoActivo:
      asset?.tipoActivo || asset?.assetType || seedAsset?.tipoActivo || assetTypeOption.value,
    tipoActivoLabel:
      asset?.tipoActivoLabel ||
      asset?.assetTypeLabel ||
      seedAsset?.tipoActivoLabel ||
      assetTypeOption.label,
    mapIcon,
    markerIcon: asset?.markerIcon || mapIcon,
    iconType: asset?.iconType || mapIcon,
    estado: asset?.estado || asset?.status || seedAsset?.estado || "offline",
  }
}

const normalizeAssets = (items = []) => {
  return mergeSeedById(items, mockDatabaseSeed.assets).map(normalizeAsset)
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

const normalizeAccessScope = (scope = {}) => {
  return {
    ...scope,
    type: scope?.type || "all",
    assetIds: Array.isArray(scope?.assetIds) ? scope.assetIds : [],
    sucursalIds: Array.isArray(scope?.sucursalIds) ? scope.sucursalIds : [],
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

const normalizeAccess = (access) => {
  return {
    ...access,
    modules: normalizeAccessModules(Array.isArray(access?.modules) ? access.modules : []),
    functions: normalizeAccessFunctions(Array.isArray(access?.functions) ? access.functions : []),
    scope: normalizeAccessScope(access?.scope),
  }
}

const normalizeAccesses = (items = []) => {
  return mergeSeedById(items, mockDatabaseSeed.accesses).map(normalizeAccess)
}

const readPersistedDatabase = () => {
  const payload = readJsonStorage(STORAGE_KEY, null)

  if (payload?.version !== STORAGE_VERSION || !payload.data) return null

  return payload.data
}

const persistedDatabase = readPersistedDatabase()

const companies = ref(
  normalizeCompanies(cloneData(persistedDatabase?.companies || mockDatabaseSeed.companies)),
)
const applicationDefinitions = ref(
  normalizeApplicationDefinitions(
    cloneData(persistedDatabase?.applicationDefinitions || mockDatabaseSeed.applicationDefinitions),
  ),
)
const assets = ref(normalizeAssets(cloneData(persistedDatabase?.assets || mockDatabaseSeed.assets)))
const users = ref(normalizeUsers(cloneData(persistedDatabase?.users || mockDatabaseSeed.users)))
const accesses = ref(
  normalizeAccesses(cloneData(persistedDatabase?.accesses || mockDatabaseSeed.accesses)),
)

const reportTypes = ref(cloneData(mockDatabaseSeed.reportTypes))
const modules = ref(cloneData(mockDatabaseSeed.modules))
const moduleFunctions = ref(cloneData(mockDatabaseSeed.moduleFunctions))
const permissions = ref(cloneData(mockDatabaseSeed.permissions))
const scopes = ref(cloneData(mockDatabaseSeed.scopes))
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

const sucursalesById = computed(() => {
  const index = new Map()

  companies.value.forEach((company) => {
    ;(company.sucursales || []).forEach((sucursal) => {
      const sucursalId = normalizeKey(sucursal.id)

      if (!sucursalId) return

      index.set(sucursalId, {
        company,
        sucursal,
      })
    })
  })

  return index
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
  schedulePersistDatabase()

  return nextUser
}

const updateUser = (userId, changes) => {
  const user = usersById.value.get(normalizeKey(userId))

  if (!user) return null

  Object.assign(user, normalizeUser({ ...user, ...changes }))
  schedulePersistDatabase()

  return user
}

const createAccess = (access) => {
  const nextAccess = normalizeAccess(access)
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

const addSucursal = (companyId, sucursal) => {
  const company = getCompany(companyId)

  if (!company) return null

  company.sucursales = [...(company.sucursales || []), sucursal]
  schedulePersistDatabase()

  return sucursal
}

const updateSucursal = (sucursalId, changes) => {
  const indexedSucursal = sucursalesById.value.get(normalizeKey(sucursalId))
  const sucursal = indexedSucursal?.sucursal

  if (!sucursal) return null

  Object.assign(sucursal, changes)
  schedulePersistDatabase()

  return sucursal
}

const deleteSucursal = (sucursalId) => {
  const normalizedSucursalId = normalizeKey(sucursalId)
  const indexedSucursal = sucursalesById.value.get(normalizedSucursalId)
  const company = indexedSucursal?.company

  if (!company) return

  company.sucursales = (company.sucursales || []).filter((sucursal) => {
    return normalizeKey(sucursal.id) !== normalizedSucursalId
  })

  assets.value.forEach((asset) => {
    if (normalizeKey(asset.sucursalId) === normalizedSucursalId) {
      asset.sucursalId = null
    }
  })

  accesses.value.forEach((access) => {
    if (!access.scope) {
      access.scope = {}
    }

    access.scope.sucursalIds = (access.scope.sucursalIds || []).filter((id) => {
      return normalizeKey(id) !== normalizedSucursalId
    })
  })

  schedulePersistDatabase()
}

export function useMockDatabase() {
  syncCompaniesWithSeed()

  return {
    companies,
    companyRecords,
    applications,
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
    createAsset,
    updateAsset,
    deleteAsset,
    addSucursal,
    updateSucursal,
    deleteSucursal,
  }
}
