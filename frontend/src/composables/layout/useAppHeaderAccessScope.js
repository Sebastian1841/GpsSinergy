import { computed, unref } from "vue"

import {
  buildScopedHeaderUsers,
  filterActiveHeaderUsers,
} from "../../utils/layout/appHeaderAccessScopeUtils.js"

const toArray = (value) => {
  const resolvedValue = unref(value)

  return Array.isArray(resolvedValue) ? resolvedValue : []
}

const normalizeHeaderId = (value) => {
  return String(value ?? "")
}

export function useAppHeaderAccessScope({
  activeCompanyId,
  accessibleCompanies,
  companyRecords,
  visibleAssets,
  users,
  accesses,
  applications,
  canAccessFunction,
  isPlatformAdmin,
}) {
  const accessibleCompanyIds = computed(() => {
    return new Set(
      toArray(accessibleCompanies)
        .map((company) => normalizeHeaderId(company?.id))
        .filter(Boolean),
    )
  })

  const headerCompanies = computed(() => {
    return toArray(companyRecords)
      .filter((company) => accessibleCompanyIds.value.has(normalizeHeaderId(company?.id)))
      .sort((firstCompany, secondCompany) => {
        return String(firstCompany.name || "").localeCompare(String(secondCompany.name || ""), "es")
      })
  })

  const headerVisibleAssets = computed(() => {
    const companyId = normalizeHeaderId(unref(activeCompanyId))

    if (!companyId) return []

    return toArray(visibleAssets).filter((asset) => {
      return normalizeHeaderId(asset?.companyId) === companyId
    })
  })

  const searchableUsers = computed(() => {
    return buildScopedHeaderUsers({
      users: toArray(users),
      accesses: toArray(accesses),
      applications: toArray(applications),
      companies: headerCompanies.value,
      canAccessFunction,
      isPlatformAdmin: Boolean(unref(isPlatformAdmin)),
    })
  })

  const workspaceUsers = computed(() => {
    return filterActiveHeaderUsers(searchableUsers.value)
  })

  return {
    accessibleCompanyIds,
    headerCompanies,
    headerVisibleAssets,
    searchableUsers,
    workspaceUsers,
  }
}
