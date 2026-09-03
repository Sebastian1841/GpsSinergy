import { computed, unref } from "vue"

import { HEADER_USER_SEARCH_SCOPE_KEY } from "../../utils/layout/appHeaderAccessScopeUtils.js"
import { normalizeId } from "../../utils/idUtils.js"

const GLOBAL_SEARCH_RESULT_LIMIT = 36
const GLOBAL_SEARCH_GROUP_LIMIT = 8

const RESULT_GROUPS = [
  {
    key: "asset",
    label: "Activos",
  },
  {
    key: "company",
    label: "Empresas",
  },
  {
    key: "report",
    label: "Reportes",
  },
  {
    key: "workspace",
    label: "Espacios",
  },
  {
    key: "user",
    label: "Usuarios",
  },
  {
    key: "audit",
    label: "Auditoria",
  },
]

const normalizeSearchText = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

const toArray = (value) => {
  const resolvedValue = unref(value)

  return Array.isArray(resolvedValue) ? resolvedValue : []
}

const getCompanyName = (company) => {
  return company?.name || "Empresa"
}

const getAssetName = (asset) => {
  return (
    asset?.nombrePantalla ||
    asset?.displayName ||
    asset?.vehiculo ||
    asset?.vehicleName ||
    asset?.name ||
    asset?.patente ||
    asset?.patent ||
    asset?.id ||
    "Activo"
  )
}

const getAssetPlate = (asset) => {
  return asset?.patente || asset?.patent || asset?.licensePlate || asset?.ppu || ""
}

const getAssetCompanyId = (asset, fallbackCompanyId = "") => {
  return normalizeId(
    asset?.companyId ||
      asset?.empresaId ||
      asset?.company?.id ||
      asset?.empresa?.id ||
      fallbackCompanyId,
  )
}

const getUserName = (user) => {
  return user?.name || user?.username || user?.email || "Usuario"
}

const getWorkspaceName = (workspace) => {
  return workspace?.name || workspace?.routeName || "Espacio de trabajo"
}

const getAuditTitle = (record) => {
  return record?.entityName || record?.description || record?.action || "Registro de auditoria"
}

const getRecordCompany = (record, companyById) => {
  if (record?.companyId) {
    return companyById.get(String(record.companyId)) || null
  }

  return null
}

const createSearchResult = ({
  id,
  type,
  typeLabel,
  title,
  subtitle = "",
  meta = "",
  path,
  searchValues = [],
}) => {
  const searchableText = [typeLabel, title, subtitle, meta, ...searchValues]
    .filter(Boolean)
    .join(" ")

  return {
    id: `${type}:${id}`,
    sourceId: id,
    type,
    typeLabel,
    title: title || typeLabel,
    subtitle,
    meta,
    path,
    searchText: normalizeSearchText(searchableText),
  }
}

export const useGlobalSearch = ({
  activeCompanyId,
  auditRecords,
  canAccessFunction,
  canAccessModule,
  companies,
  getAccessibleCompanyEntryPath,
  reportTypes,
  users,
  visibleAssets,
  workspaces,
  query,
  typeFilter,
}) => {
  const normalizedQuery = computed(() => normalizeSearchText(unref(query)))
  const normalizedTypeFilter = computed(() => {
    const value = String(unref(typeFilter) || "all")

    return RESULT_GROUPS.some((group) => group.key === value) ? value : "all"
  })

  const companyItems = computed(() => {
    return toArray(companies)
  })

  const companyById = computed(() => {
    return new Map(
      companyItems.value.map((company) => {
        return [String(company.id), company]
      }),
    )
  })

  const activeCompany = computed(() => {
    return companyById.value.get(String(unref(activeCompanyId) || "")) || null
  })

  const canUseFunction = (functionId, companyId, permission = "view") => {
    if (typeof canAccessFunction !== "function") return false

    return canAccessFunction(functionId, companyId || null, permission)
  }

  const canUseModule = (moduleId, companyId) => {
    if (typeof canAccessModule !== "function") return false

    return canAccessModule(moduleId, companyId || null)
  }

  const getFirstCompanyWithFunctionPath = (functionId, routeName) => {
    const activeId = normalizeId(unref(activeCompanyId))

    if (activeId && canUseFunction(functionId, activeId, "view")) {
      return `/app/${activeId}/${routeName}`
    }

    const targetCompany = companyItems.value.find((company) => {
      return canUseFunction(functionId, company.id, "view")
    })

    return targetCompany ? `/app/${targetCompany.id}/${routeName}` : ""
  }

  const getReportsPath = () => {
    return getFirstCompanyWithFunctionPath("reports", "reportes")
  }

  const getUserScope = (user) => {
    return user?.[HEADER_USER_SEARCH_SCOPE_KEY] || {}
  }

  const getUserCompanyIds = (user) => {
    const companyIds = getUserScope(user).companyIds

    return Array.isArray(companyIds) ? companyIds.map(normalizeId).filter(Boolean) : []
  }

  const getUserCompanyNames = (user) => {
    const companyNames = getUserScope(user).companyNames

    return Array.isArray(companyNames) ? companyNames.filter(Boolean) : []
  }

  const getUserPath = (user) => {
    const userCompanyIds = getUserCompanyIds(user)
    const activeId = normalizeId(unref(activeCompanyId))

    if (activeId && userCompanyIds.includes(activeId) && canUseFunction("users-view", activeId)) {
      return `/app/${activeId}/usuarios`
    }

    const targetCompanyId = userCompanyIds.find((companyId) => {
      return canUseFunction("users-view", companyId)
    })

    if (targetCompanyId) return `/app/${targetCompanyId}/usuarios`

    return getUserScope(user).fallbackPath || ""
  }

  const getAuditPath = (record) => {
    const companyId = normalizeId(record?.companyId)

    if (companyId && canUseFunction("audit-view", companyId, "view")) {
      return `/app/${companyId}/auditoria`
    }

    if (!companyId && canUseFunction("audit-view", null, "view")) {
      return "/auditoria"
    }

    return ""
  }

  const companyResults = computed(() => {
    return companyItems.value.map((company) => {
      return createSearchResult({
        id: company.id,
        type: "company",
        typeLabel: "Empresa",
        title: getCompanyName(company),
        subtitle: [company.rut || "Sin RUT", `${company.assetsCount || 0} activos`].join(" - "),
        meta: company.city || company.region || "",
        path:
          typeof getAccessibleCompanyEntryPath === "function"
            ? getAccessibleCompanyEntryPath(company)
            : `/app/${company.id}/activos`,
        searchValues: [
          company.rut,
          company.city,
          company.region,
          company.contactName,
          company.contactEmail,
        ],
      })
    })
  })

  const assetResults = computed(() => {
    const activeCompanyFallbackId = normalizeId(unref(activeCompanyId))

    return toArray(visibleAssets)
      .map((asset) => {
        const companyId = getAssetCompanyId(asset, activeCompanyFallbackId)

        if (!companyId || !canUseModule("assets", companyId)) return null

        const company = companyById.value.get(String(companyId))
        const plate = getAssetPlate(asset)
        const assetId = normalizeId(asset?.id || asset?.assetId || asset?.deviceId || plate)

        return createSearchResult({
          id: `${companyId}:${assetId || getAssetName(asset)}`,
          type: "asset",
          typeLabel: "Activo",
          title: getAssetName(asset),
          subtitle: [plate || "Sin patente", getCompanyName(company)].join(" - "),
          meta: asset.estado || asset.status || asset.assetTypeLabel || asset.tipoActivoLabel || "",
          path: assetId
            ? `/app/${companyId}/activos?activoId=${encodeURIComponent(assetId)}`
            : `/app/${companyId}/activos`,
          searchValues: [
            plate,
            asset.deviceId,
            asset.imei,
            asset.conductor,
            asset.driver,
            asset.direccion,
            asset.address,
            asset.tipoActivoLabel,
            asset.assetTypeLabel,
            asset.estado,
            company?.rut,
            company?.name,
          ],
        })
      })
      .filter(Boolean)
  })

  const reportResults = computed(() => {
    const path = getReportsPath()

    if (!path) return []

    const activeCompanyName = getCompanyName(activeCompany.value)

    return toArray(reportTypes).map((reportType) => {
      return createSearchResult({
        id: reportType.id,
        type: "report",
        typeLabel: "Reporte",
        title: reportType.name || "Reporte",
        subtitle: activeCompany.value ? activeCompanyName : "Biblioteca de reportes",
        meta: reportType.description || "",
        path,
        searchValues: [reportType.id, reportType.category, reportType.description],
      })
    })
  })

  const userResults = computed(() => {
    return toArray(users)
      .map((user) => {
        const path = getUserPath(user)

        if (!path) return null

        const companyNames = getUserCompanyNames(user)

        return createSearchResult({
          id: user.id,
          type: "user",
          typeLabel: "Usuario",
          title: getUserName(user),
          subtitle: [user.email || user.username || "Sin correo", companyNames.join(", ")]
            .filter(Boolean)
            .join(" - "),
          meta: user.status === "active" ? "Activo" : "Inactivo",
          path,
          searchValues: [user.username, user.roleId, user.email, ...companyNames],
        })
      })
      .filter(Boolean)
  })

  const auditResults = computed(() => {
    return toArray(auditRecords)
      .map((record) => {
        const path = getAuditPath(record)

        if (!path) return null

        const company = getRecordCompany(record, companyById.value)

        return createSearchResult({
          id: record.id,
          type: "audit",
          typeLabel: "Auditoria",
          title: getAuditTitle(record),
          subtitle: [
            record.actorName || "Sistema",
            company ? getCompanyName(company) : record.companyName,
          ]
            .filter(Boolean)
            .join(" - "),
          meta: record.action || record.module || "",
          path,
          searchValues: [
            record.description,
            record.entityType,
            record.module,
            record.status,
            record.severity,
            record.companyName,
          ],
        })
      })
      .filter(Boolean)
  })

  const workspaceResults = computed(() => {
    return toArray(workspaces).map((workspace) => {
      const company = workspace.companyId
        ? companyById.value.get(String(workspace.companyId)) || activeCompany.value
        : activeCompany.value

      return createSearchResult({
        id: workspace.id,
        type: "workspace",
        typeLabel: "Espacio",
        title: getWorkspaceName(workspace),
        subtitle: [workspace.routeName || "Vista guardada", company ? getCompanyName(company) : ""]
          .filter(Boolean)
          .join(" - "),
        meta: workspace.shared ? "Compartido" : "Personal",
        path: workspace.routePath || (company ? `/app/${company.id}/activos` : "/activos"),
        searchValues: [workspace.module, workspace.routePath, workspace.ownerUserId],
      })
    })
  })

  const allSearchResults = computed(() => {
    return [
      ...assetResults.value,
      ...companyResults.value,
      ...reportResults.value,
      ...workspaceResults.value,
      ...userResults.value,
      ...auditResults.value,
    ]
  })

  const scopedSearchResults = computed(() => {
    if (normalizedTypeFilter.value === "all") {
      return allSearchResults.value
    }

    return allSearchResults.value.filter((result) => {
      return result.type === normalizedTypeFilter.value
    })
  })

  const globalSearchResults = computed(() => {
    const term = normalizedQuery.value

    if (!term) {
      if (normalizedTypeFilter.value !== "all") return scopedSearchResults.value

      return [
        ...assetResults.value.slice(0, 8),
        ...companyResults.value.slice(0, 6),
        ...reportResults.value.slice(0, 6),
        ...workspaceResults.value.slice(0, 6),
        ...userResults.value.slice(0, 4),
        ...auditResults.value.slice(0, 6),
      ].slice(0, GLOBAL_SEARCH_RESULT_LIMIT)
    }

    const filteredResults = scopedSearchResults.value.filter((result) => {
      return result.searchText.includes(term)
    })

    if (normalizedTypeFilter.value !== "all") return filteredResults

    return filteredResults.slice(0, GLOBAL_SEARCH_RESULT_LIMIT)
  })

  const globalSearchGroups = computed(() => {
    return RESULT_GROUPS.map((group) => {
      const results = globalSearchResults.value
        .filter((result) => result.type === group.key)
        .slice(0, GLOBAL_SEARCH_GROUP_LIMIT)

      return {
        ...group,
        results,
      }
    }).filter((group) => group.results.length)
  })

  const firstGlobalSearchResult = computed(() => {
    return globalSearchResults.value[0] || null
  })

  return {
    firstGlobalSearchResult,
    globalSearchGroups,
    globalSearchResults,
    normalizedTypeFilter,
    normalizedQuery,
  }
}
