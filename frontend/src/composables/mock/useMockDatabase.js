import { computed, ref, watch } from "vue"

import { mockDatabaseSeed } from "../../data/mockDatabase.js"

const STORAGE_KEY = "sinergy-mock-database"
const STORAGE_VERSION = 1
const PERSIST_DEBOUNCE_MS = 250

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

const normalizeUsers = (items = []) => {
  return items.map((user) => ({
    ...user,
    isPlatformAdmin: Boolean(user.isPlatformAdmin || user.id === "user-001"),
  }))
}

const readPersistedDatabase = () => {
  if (typeof window === "undefined") return null

  try {
    const payload = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null")

    if (payload?.version !== STORAGE_VERSION || !payload.data) return null

    return payload.data
  } catch {
    return null
  }
}

const persistedDatabase = readPersistedDatabase()

const companies = ref(cloneData(persistedDatabase?.companies || mockDatabaseSeed.companies))
const applicationDefinitions = ref(
  cloneData(persistedDatabase?.applicationDefinitions || mockDatabaseSeed.applicationDefinitions),
)
const assets = ref(cloneData(persistedDatabase?.assets || mockDatabaseSeed.assets))
const users = ref(normalizeUsers(cloneData(persistedDatabase?.users || mockDatabaseSeed.users)))
const accesses = ref(cloneData(persistedDatabase?.accesses || mockDatabaseSeed.accesses))

const reportTypes = ref(cloneData(mockDatabaseSeed.reportTypes))
const modules = ref(cloneData(mockDatabaseSeed.modules))
const moduleFunctions = ref(cloneData(mockDatabaseSeed.moduleFunctions))
const permissions = ref(cloneData(mockDatabaseSeed.permissions))
const scopes = ref(cloneData(mockDatabaseSeed.scopes))
const roles = ref(cloneData(mockDatabaseSeed.roles))

const persistDatabase = () => {
  if (typeof window === "undefined") return

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: STORAGE_VERSION,
        data: {
          companies: companies.value,
          applicationDefinitions: applicationDefinitions.value,
          assets: assets.value,
          users: users.value,
          accesses: accesses.value,
        },
        updatedAt: new Date().toISOString(),
      }),
    )
  } catch {
    // Persistence is optional for the frontend-only mock database.
  }
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

watch([companies, applicationDefinitions, assets, users, accesses], schedulePersistDatabase, {
  deep: true,
  flush: "post",
})

if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    if (persistTimeout !== null) {
      window.clearTimeout(persistTimeout)
      persistTimeout = null
    }

    persistDatabase()
  })
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

  companies.value.unshift({
    ...company,
    applicationId,
  })

  applicationDefinitions.value.unshift({
    id: applicationId,
    companyId,
    shortName: company.shortName || companyName.slice(0, 3).toUpperCase(),
    type: company.status === "internal" ? "Administracion interna" : "Empresa cliente",
  })

  return getCompany(companyId)
}

const createUser = (user) => {
  const identityExists = Boolean(
    usersById.value.has(normalizeKey(user.id)) ||
    usersByUsername.value.has(normalizeLowerKey(user.username)) ||
    usersByEmail.value.has(normalizeLowerKey(user.email)),
  )

  if (identityExists) return null

  users.value.unshift({
    ...user,
    isPlatformAdmin: Boolean(user.isPlatformAdmin),
  })

  return user
}

const updateUser = (userId, changes) => {
  const user = usersById.value.get(normalizeKey(userId))

  if (!user) return null

  Object.assign(user, changes)
  return user
}

const createAccess = (access) => {
  const userExists = usersById.value.has(normalizeKey(access.userId))
  const applicationExists = applicationDefinitionsById.value.has(normalizeKey(access.applicationId))
  const accessIdExists = accessesById.value.has(normalizeKey(access.id))
  const userApplicationAccessExists = accessesByUserApplicationKey.value.has(
    buildAccessUniqueKey({
      userId: access.userId,
      applicationId: access.applicationId,
    }),
  )

  if (!userExists || !applicationExists || accessIdExists || userApplicationAccessExists) {
    return null
  }

  accesses.value.unshift(access)
  return access
}

const deleteAccess = (accessId) => {
  const normalizedAccessId = normalizeKey(accessId)

  accesses.value = accesses.value.filter((access) => {
    return normalizeKey(access.id) !== normalizedAccessId
  })
}

const updateCompany = (companyId, changes) => {
  const company = getCompany(companyId)

  if (!company) return null

  Object.assign(company, changes)
  return company
}

const createAsset = (asset) => {
  assets.value.unshift(asset)
  return asset
}

const updateAsset = (assetId, changes) => {
  const normalizedAssetId = normalizeKey(assetId)
  let updatedAsset = null

  assets.value = assets.value.map((asset) => {
    if (normalizeKey(asset.id) !== normalizedAssetId) return asset

    updatedAsset = {
      ...asset,
      ...changes,
    }

    return updatedAsset
  })

  return updatedAsset
}

const deleteAsset = (assetId) => {
  const normalizedId = normalizeKey(assetId)

  assets.value = assets.value.filter((asset) => normalizeKey(asset.id) !== normalizedId)

  accesses.value.forEach((access) => {
    if (!access.scope) {
      access.scope = {}
    }

    access.scope.assetIds = (access.scope.assetIds || []).filter((id) => {
      return normalizeKey(id) !== normalizedId
    })
  })
}

const addSucursal = (companyId, sucursal) => {
  const company = getCompany(companyId)

  if (!company) return null

  company.sucursales = [...(company.sucursales || []), sucursal]
  return sucursal
}

const updateSucursal = (sucursalId, changes) => {
  const indexedSucursal = sucursalesById.value.get(normalizeKey(sucursalId))
  const sucursal = indexedSucursal?.sucursal

  if (!sucursal) return null

  Object.assign(sucursal, changes)
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
}

export function useMockDatabase() {
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
