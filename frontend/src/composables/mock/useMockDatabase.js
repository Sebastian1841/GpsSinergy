import { computed, ref, watch } from "vue"

import { mockDatabaseSeed } from "../../data/mockDatabase.js"

const STORAGE_KEY = "sinergy-mock-database"
const STORAGE_VERSION = 1
const PERSIST_DEBOUNCE_MS = 250

let persistTimeout = null

const cloneData = (value) => JSON.parse(JSON.stringify(value))

const normalizeKey = (value) => String(value ?? "")

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

const assetsByApplicationId = computed(() => {
  const groupedAssets = new Map()

  assets.value.forEach((asset) => {
    const applicationId = normalizeKey(asset.applicationId)

    if (!applicationId) return

    if (!groupedAssets.has(applicationId)) {
      groupedAssets.set(applicationId, [])
    }

    groupedAssets.get(applicationId).push(asset)
  })

  return groupedAssets
})

const assetsByCompanyId = computed(() => {
  const groupedAssets = new Map()

  assets.value.forEach((asset) => {
    const directCompanyId = normalizeKey(asset.companyId)
    const application = applicationDefinitionsById.value.get(normalizeKey(asset.applicationId))
    const fallbackCompanyId = normalizeKey(application?.companyId)
    const companyId = directCompanyId || fallbackCompanyId

    if (!companyId) return

    if (!groupedAssets.has(companyId)) {
      groupedAssets.set(companyId, [])
    }

    groupedAssets.get(companyId).push(asset)
  })

  return groupedAssets
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
      assetsCount: companyAssets.length,
      activeAssetsCount: companyAssets.filter((asset) => asset.estado !== "offline").length,
      movingAssetsCount: companyAssets.filter((asset) => asset.estado === "moving").length,
      alertsCount: companyAssets.filter((asset) => asset.choque && asset.choque !== "-").length,
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

const getCompanyRecord = (companyId) => {
  return (
    companyRecords.value.find((company) => normalizeKey(company.id) === normalizeKey(companyId)) ||
    null
  )
}

const getApplicationForCompany = (companyId) => {
  return applicationRecordsByCompanyId.value.get(normalizeKey(companyId)) || null
}

const getAssetsForCompany = (companyId) => {
  if (!companyId || companyId === "general") return assets.value

  return assetsByCompanyId.value.get(normalizeKey(companyId)) || []
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
  const identityExists = users.value.some((item) => {
    return (
      normalizeKey(item.id) === normalizeKey(user.id) ||
      String(item.username || "").toLowerCase() === String(user.username || "").toLowerCase() ||
      String(item.email || "").toLowerCase() === String(user.email || "").toLowerCase()
    )
  })

  if (identityExists) return null

  users.value.unshift({
    ...user,
    isPlatformAdmin: Boolean(user.isPlatformAdmin),
  })

  return user
}

const updateUser = (userId, changes) => {
  const user = users.value.find((item) => normalizeKey(item.id) === normalizeKey(userId))

  if (!user) return null

  Object.assign(user, changes)
  return user
}

const createAccess = (access) => {
  const userExists = users.value.some(
    (user) => normalizeKey(user.id) === normalizeKey(access.userId),
  )
  const applicationExists = applicationDefinitions.value.some((application) => {
    return normalizeKey(application.id) === normalizeKey(access.applicationId)
  })
  const alreadyExists = accesses.value.some((item) => {
    return (
      normalizeKey(item.id) === normalizeKey(access.id) ||
      (normalizeKey(item.userId) === normalizeKey(access.userId) &&
        normalizeKey(item.applicationId) === normalizeKey(access.applicationId))
    )
  })

  if (!userExists || !applicationExists || alreadyExists) return null

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
  const asset = assets.value.find((item) => normalizeKey(item.id) === normalizeKey(assetId))

  if (!asset) return null

  Object.assign(asset, changes)
  return asset
}

const deleteAsset = (assetId) => {
  const normalizedId = normalizeKey(assetId)

  assets.value = assets.value.filter((asset) => normalizeKey(asset.id) !== normalizedId)

  accesses.value.forEach((access) => {
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
  const normalizedSucursalId = normalizeKey(sucursalId)
  const company = companies.value.find((item) => {
    return item.sucursales?.some((sucursal) => normalizeKey(sucursal.id) === normalizedSucursalId)
  })
  const sucursal = company?.sucursales?.find((item) => {
    return normalizeKey(item.id) === normalizedSucursalId
  })

  if (!sucursal) return null

  Object.assign(sucursal, changes)
  return sucursal
}

const deleteSucursal = (sucursalId) => {
  const normalizedSucursalId = normalizeKey(sucursalId)
  const company = companies.value.find((item) => {
    return item.sucursales?.some((sucursal) => normalizeKey(sucursal.id) === normalizedSucursalId)
  })

  if (!company) return

  company.sucursales = company.sucursales.filter((sucursal) => {
    return normalizeKey(sucursal.id) !== normalizedSucursalId
  })

  assets.value.forEach((asset) => {
    if (normalizeKey(asset.sucursalId) === normalizedSucursalId) {
      asset.sucursalId = null
    }
  })

  accesses.value.forEach((access) => {
    access.scope.sucursalIds = (access.scope.sucursalIds || []).filter((id) => {
      return normalizeKey(id) !== normalizedSucursalId
    })
  })
}

const resetDatabase = () => {
  companies.value = cloneData(mockDatabaseSeed.companies)
  applicationDefinitions.value = cloneData(mockDatabaseSeed.applicationDefinitions)
  assets.value = cloneData(mockDatabaseSeed.assets)
  users.value = normalizeUsers(cloneData(mockDatabaseSeed.users))
  accesses.value = cloneData(mockDatabaseSeed.accesses)
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
    getCompanyRecord,
    getApplicationForCompany,
    getAssetsForCompany,
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
    resetDatabase,
  }
}
