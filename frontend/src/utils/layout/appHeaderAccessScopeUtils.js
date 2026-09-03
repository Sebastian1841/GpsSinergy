import { normalizeId } from "../idUtils.js"

export const HEADER_USER_SEARCH_SCOPE_KEY = "headerSearchScope"

const toArray = (value) => {
  return Array.isArray(value) ? value : []
}

const getCompanyName = (company = {}) => {
  return company.name || company.shortName || company.id || "Empresa"
}

const buildApplicationCompanyIndex = (applications = []) => {
  return new Map(
    toArray(applications).map((application) => {
      return [normalizeId(application?.id), normalizeId(application?.companyId)]
    }),
  )
}

const buildCompanyIndex = (companies = []) => {
  return new Map(
    toArray(companies).map((company) => {
      return [normalizeId(company?.id), company]
    }),
  )
}

const getAccessCompanyId = (access = {}, applicationsById = new Map()) => {
  return normalizeId(
    access.companyId || applicationsById.get(normalizeId(access.applicationId)) || "",
  )
}

const buildViewableCompanyIds = ({
  companies = [],
  canAccessFunction,
  isPlatformAdmin = false,
}) => {
  const companyIds = toArray(companies)
    .map((company) => normalizeId(company?.id))
    .filter(Boolean)

  if (isPlatformAdmin) return new Set(companyIds)
  if (typeof canAccessFunction !== "function") return new Set()

  return new Set(
    companyIds.filter((companyId) => {
      return canAccessFunction("users-view", companyId, "view")
    }),
  )
}

const buildAccessesByUserId = (accesses = []) => {
  const accessesByUserId = new Map()

  toArray(accesses).forEach((access) => {
    const userId = normalizeId(access?.userId)

    if (!userId) return
    if (!accessesByUserId.has(userId)) accessesByUserId.set(userId, [])

    accessesByUserId.get(userId).push(access)
  })

  return accessesByUserId
}

const decorateUserWithScope = ({ user, companyIds, companiesById, fallbackPath = "" }) => {
  const companyNames = companyIds
    .map((companyId) => companiesById.get(companyId))
    .filter(Boolean)
    .map(getCompanyName)

  return {
    ...user,
    [HEADER_USER_SEARCH_SCOPE_KEY]: {
      companyIds,
      companyNames,
      fallbackPath,
    },
  }
}

export const buildScopedHeaderUsers = ({
  users = [],
  accesses = [],
  applications = [],
  companies = [],
  canAccessFunction,
  isPlatformAdmin = false,
} = {}) => {
  const userItems = toArray(users)
  const companiesById = buildCompanyIndex(companies)
  const applicationsById = buildApplicationCompanyIndex(applications)
  const viewableCompanyIds = buildViewableCompanyIds({
    companies,
    canAccessFunction,
    isPlatformAdmin,
  })

  if (!viewableCompanyIds.size) return []

  const accessesByUserId = buildAccessesByUserId(accesses)

  return userItems
    .map((user) => {
      const userId = normalizeId(user?.id)
      const userAccesses = accessesByUserId.get(userId) || []
      const companyIds = Array.from(
        new Set(
          userAccesses
            .map((access) => getAccessCompanyId(access, applicationsById))
            .filter((companyId) => companyId && viewableCompanyIds.has(companyId)),
        ),
      )

      if (companyIds.length) {
        return decorateUserWithScope({
          user,
          companyIds,
          companiesById,
        })
      }

      if (isPlatformAdmin) {
        return decorateUserWithScope({
          user,
          companyIds: [],
          companiesById,
          fallbackPath: "/usuarios",
        })
      }

      return null
    })
    .filter(Boolean)
}

export const filterActiveHeaderUsers = (users = []) => {
  return toArray(users).filter((user) => {
    return user?.status === "active"
  })
}
