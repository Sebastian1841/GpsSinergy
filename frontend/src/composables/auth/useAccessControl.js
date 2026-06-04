import { computed } from "vue"

import { useAuthSession } from "./useAuthSession.js"
import { useMockDatabase } from "../mock/useMockDatabase.js"

const normalizeKey = (value) => String(value ?? "")

const isCompanyAvailable = (company) => {
  return company?.status === "active" || company?.status === "internal"
}

export function useAccessControl() {
  const { currentAccesses, isPlatformAdmin } = useAuthSession()
  const { companies, applications, assets, moduleFunctions } = useMockDatabase()

  const applicationsById = computed(() => {
    return new Map(
      applications.value.map((application) => [normalizeKey(application.id), application]),
    )
  })

  const companiesById = computed(() => {
    return new Map(companies.value.map((company) => [normalizeKey(company.id), company]))
  })

  const moduleFunctionsById = computed(() => {
    return new Map(moduleFunctions.value.map((item) => [normalizeKey(item.id), item]))
  })

  const activeAccesses = computed(() => {
    return currentAccesses.value.filter((access) => {
      const application = applicationsById.value.get(normalizeKey(access.applicationId))
      const company = companiesById.value.get(normalizeKey(application?.companyId))

      return application && company && isCompanyAvailable(company)
    })
  })

  const getAccessCompanyId = (access) => {
    return applicationsById.value.get(normalizeKey(access?.applicationId))?.companyId || null
  }

  const accessesByCompanyId = computed(() => {
    const groupedAccesses = new Map()

    activeAccesses.value.forEach((access) => {
      const companyId = normalizeKey(getAccessCompanyId(access))

      if (!companyId) return
      if (!groupedAccesses.has(companyId)) groupedAccesses.set(companyId, [])

      groupedAccesses.get(companyId).push(access)
    })

    return groupedAccesses
  })

  const scopeIndexesByAccessId = computed(() => {
    return new Map(
      activeAccesses.value.map((access) => [
        normalizeKey(access.id),
        {
          sucursalIds: new Set((access.scope?.sucursalIds || []).map(normalizeKey)),
          assetIds: new Set((access.scope?.assetIds || []).map(normalizeKey)),
        },
      ]),
    )
  })

  const getAccessesForCompany = (companyId) => {
    if (!companyId) return activeAccesses.value

    return accessesByCompanyId.value.get(normalizeKey(companyId)) || []
  }

  const accessHasModule = (access, moduleId) => {
    const explicitModuleAccess = access?.modules?.find((item) => {
      return normalizeKey(item.moduleId) === normalizeKey(moduleId)
    })

    if (explicitModuleAccess) return Boolean(explicitModuleAccess.enabled)

    return (access?.functions || []).some((functionAccess) => {
      const moduleFunction = moduleFunctionsById.value.get(normalizeKey(functionAccess.functionId))

      return moduleFunction?.moduleId === moduleId && functionAccess.enabled
    })
  }

  const accessHasFunction = (access, functionId, permission = "view") => {
    const functionAccess = access?.functions?.find((item) => {
      return normalizeKey(item.functionId) === normalizeKey(functionId)
    })
    const moduleId = moduleFunctionsById.value.get(normalizeKey(functionId))?.moduleId
    const moduleAccess = access?.modules?.find((item) => {
      return normalizeKey(item.moduleId) === normalizeKey(moduleId)
    })

    if (!functionAccess?.enabled) return false
    if (moduleAccess && !moduleAccess.enabled) return false
    if (!permission) return true

    return Boolean(functionAccess.permissions?.[permission])
  }

  const canAccessModule = (moduleId, companyId = null) => {
    if (isPlatformAdmin.value) return true

    return getAccessesForCompany(companyId).some((access) => {
      return accessHasModule(access, moduleId)
    })
  }

  const canAccessFunction = (functionId, companyId = null, permission = "view") => {
    if (isPlatformAdmin.value) return true

    return getAccessesForCompany(companyId).some((access) => {
      return accessHasFunction(access, functionId, permission)
    })
  }

  const accessibleCompanyIds = computed(() => {
    if (isPlatformAdmin.value) {
      return new Set(companies.value.map((company) => normalizeKey(company.id)))
    }

    return new Set(
      activeAccesses.value
        .filter((access) => accessHasModule(access, "assets"))
        .map((access) => normalizeKey(getAccessCompanyId(access)))
        .filter(Boolean),
    )
  })

  const accessibleCompanies = computed(() => {
    return companies.value.filter((company) => {
      return accessibleCompanyIds.value.has(normalizeKey(company.id))
    })
  })

  const canAccessCompany = (companyId) => {
    return accessibleCompanyIds.value.has(normalizeKey(companyId))
  }

  const accessAllowsAsset = (access, asset) => {
    const scope = access?.scope || {}

    if (scope.type === "all-assets") return true

    if (scope.type === "sucursal") {
      const company = companiesById.value.get(normalizeKey(asset.companyId))
      const activeSucursalIds = new Set(
        (company?.sucursales || [])
          .filter((sucursal) => sucursal.active !== false)
          .map((sucursal) => normalizeKey(sucursal.id)),
      )
      const sucursalIds = scopeIndexesByAccessId.value.get(normalizeKey(access.id))?.sucursalIds

      return (
        activeSucursalIds.has(normalizeKey(asset.sucursalId)) &&
        sucursalIds?.has(normalizeKey(asset.sucursalId))
      )
    }

    if (scope.type === "selected-assets") {
      const assetIds = scopeIndexesByAccessId.value.get(normalizeKey(access.id))?.assetIds

      return assetIds?.has(normalizeKey(asset.id))
    }

    return false
  }

  const visibleAssets = computed(() => {
    if (isPlatformAdmin.value) return assets.value

    return assets.value.filter((asset) => {
      return getAccessesForCompany(asset.companyId).some((access) => {
        return accessHasModule(access, "assets") && accessAllowsAsset(access, asset)
      })
    })
  })

  const getVisibleAssetsForCompany = (companyId) => {
    return visibleAssets.value.filter((asset) => {
      return normalizeKey(asset.companyId) === normalizeKey(companyId)
    })
  }

  const firstAccessibleCompanyId = computed(() => {
    return accessibleCompanies.value[0]?.id || null
  })

  return {
    isPlatformAdmin,
    activeAccesses,
    accessibleCompanyIds,
    accessibleCompanies,
    visibleAssets,
    firstAccessibleCompanyId,
    getAccessesForCompany,
    getVisibleAssetsForCompany,
    canAccessCompany,
    canAccessModule,
    canAccessFunction,
  }
}
