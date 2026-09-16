import { computed, ref, unref, watch } from "vue"

import { useAuthSession } from "../auth/useAuthSession.js"
import { useUsersService } from "../../services/users/useUsersService.js"
import { useDebouncedValue } from "../ui/useDebouncedValue.js"
import { useUserAccessDrafts } from "./useUserAccessDrafts.js"

import { userMatchesSearch } from "../../utils/users/userAccessUtils.js"
import { normalizeAccess, normalizeUserAccessKey } from "../../utils/users/userAccessStateUtils.js"

const DEFAULT_USER_PAGE_SIZE = 8

export function useUserAccessManagement({ routeCompanyId = null, assetTags = null } = {}) {
  const { currentUser, isPlatformAdmin } = useAuthSession()

  const {
    users,
    accesses,
    companies,
    applications,
    modules,
    moduleFunctions,
    permissions,
    scopes,
    roles,
    assets,
    createUser: createDatabaseUser,
    updateUser: updateDatabaseUser,
    createAccess: createDatabaseAccess,
    deleteAccess: deleteDatabaseAccess,
  } = useUsersService()

  accesses.value = accesses.value.map((access) => {
    return normalizeAccess({
      access,
      modules: modules.value,
      moduleFunctions: moduleFunctions.value,
      assets: assets.value,
    })
  })

  const resolvedRouteCompanyId = computed(() => {
    return normalizeUserAccessKey(unref(routeCompanyId))
  })

  const resolvedAssetTags = computed(() => {
    const tags = unref(assetTags)

    return Array.isArray(tags) ? tags : []
  })

  const searchTerm = ref("")
  const selectedRole = ref("all")
  const selectedCompany = ref(resolvedRouteCompanyId.value || "all")
  const selectedStatus = ref("all")
  const selectedModule = ref("all")
  const userViewMode = ref("list")
  const userSortKey = ref("name")
  const userSortDirection = ref("asc")
  const currentPage = ref(1)
  const pageSize = ref(DEFAULT_USER_PAGE_SIZE)

  const debouncedSearchTerm = useDebouncedValue(searchTerm, 180)

  const selectedUserId = ref(users.value[0]?.id || null)

  const companyFilterLocked = computed(() => {
    return Boolean(resolvedRouteCompanyId.value)
  })

  const currentUserId = computed(() => {
    return normalizeUserAccessKey(currentUser.value?.id)
  })

  const applicationsById = computed(() => {
    return new Map(applications.value.map((application) => [application.id, application]))
  })

  const companiesById = computed(() => {
    return new Map(companies.value.map((company) => [company.id, company]))
  })

  const rolesById = computed(() => {
    return new Map(roles.value.map((role) => [role.id, role]))
  })

  const accessesByUserId = computed(() => {
    const groupedAccesses = new Map()

    accesses.value.forEach((access) => {
      if (!groupedAccesses.has(access.userId)) {
        groupedAccesses.set(access.userId, [])
      }

      groupedAccesses.get(access.userId).push(access)
    })

    return groupedAccesses
  })

  const getUserAccesses = (user = {}) => {
    return accessesByUserId.value.get(user.id) || []
  }

  const getAccessCompany = (access = {}) => {
    const application = applicationsById.value.get(access.applicationId)
    const companyId = application?.companyId || access.companyId || ""

    return companiesById.value.get(companyId) || null
  }

  const getUserPrimaryRoleLabel = (user = {}) => {
    const primaryAccess = getUserAccesses(user)[0]

    if (!primaryAccess?.role) return ""

    return rolesById.value.get(primaryAccess.role)?.name || primaryAccess.role
  }

  const getUserCompanySortLabel = (user = {}) => {
    const companyNames = new Set(
      getUserAccesses(user)
        .map((access) => getAccessCompany(access)?.name)
        .filter(Boolean),
    )

    if (companyNames.size === 0) return ""
    if (companyNames.size === 1) return [...companyNames][0]

    return `${companyNames.size} empresas`
  }

  const getUserSortValue = (user = {}) => {
    if (userSortKey.value === "status") return user.status || ""
    if (userSortKey.value === "role") return getUserPrimaryRoleLabel(user)
    if (userSortKey.value === "company") return getUserCompanySortLabel(user)
    if (userSortKey.value === "accesses") return getUserAccesses(user).length

    return user.name || user.email || user.username || ""
  }

  const selectedUser = computed(() => {
    return users.value.find((user) => user.id === selectedUserId.value) || users.value[0] || null
  })

  const selectedUserAccesses = computed(() => {
    if (!selectedUser.value) return []

    return accessesByUserId.value.get(selectedUser.value.id) || []
  })

  const filteredUsers = computed(() => {
    return users.value.filter((user) => {
      const userAccesses = accessesByUserId.value.get(user.id) || []

      const matchesSearch = userMatchesSearch({
        user,
        accesses: userAccesses,
        applications: applications.value,
        companies: companies.value,
        modules: modules.value,
        moduleFunctions: moduleFunctions.value,
        roles: roles.value,
        term: debouncedSearchTerm.value,
      })

      const matchesStatus = selectedStatus.value === "all" || user.status === selectedStatus.value

      const matchesRole =
        selectedRole.value === "all" ||
        userAccesses.some((access) => access.role === selectedRole.value)

      const matchesCompany =
        selectedCompany.value === "all" ||
        userAccesses.some((access) => {
          const application = applicationsById.value.get(access.applicationId)

          return application?.companyId === selectedCompany.value
        })

      const matchesModule =
        selectedModule.value === "all" ||
        userAccesses.some((access) => {
          return (access.modules || []).some((moduleAccess) => {
            return moduleAccess.moduleId === selectedModule.value && moduleAccess.enabled
          })
        })

      return matchesSearch && matchesStatus && matchesRole && matchesCompany && matchesModule
    })
  })

  const sortedUsers = computed(() => {
    return [...filteredUsers.value].sort((leftUser, rightUser) => {
      const leftValue = getUserSortValue(leftUser)
      const rightValue = getUserSortValue(rightUser)

      const result =
        typeof leftValue === "number" && typeof rightValue === "number"
          ? leftValue - rightValue
          : String(leftValue).localeCompare(String(rightValue), "es", {
              sensitivity: "base",
            })

      return userSortDirection.value === "desc" ? -result : result
    })
  })

  const totalPages = computed(() => {
    return Math.max(1, Math.ceil(sortedUsers.value.length / pageSize.value))
  })

  const paginatedUsers = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value

    return sortedUsers.value.slice(start, start + pageSize.value)
  })

  const summaryItems = computed(() => {
    return [
      {
        key: "all",
        label: "Usuarios",
        value: users.value.length,
        filter: "all",
        class: "text-[#102372]",
      },
      {
        key: "active",
        label: "Habilitados",
        value: users.value.filter((user) => user.status === "active").length,
        filter: "active",
        class: "text-emerald-600",
      },
      {
        key: "pending",
        label: "Pendientes",
        value: users.value.filter((user) => user.status === "pending").length,
        filter: "pending",
        class: "text-[#ff6600]",
      },
      {
        key: "inactive",
        label: "Inactivos",
        value: users.value.filter((user) => user.status === "inactive").length,
        filter: "inactive",
        class: "text-slate-500",
      },
      {
        key: "accesses",
        label: "Accesos",
        value: accesses.value.length,
        filter: "all",
        class: "text-slate-700",
      },
    ]
  })

  watch(
    [
      debouncedSearchTerm,
      selectedRole,
      selectedCompany,
      selectedStatus,
      selectedModule,
      userSortKey,
      userSortDirection,
    ],
    () => {
      currentPage.value = 1
    },
  )

  watch(totalPages, (pages) => {
    if (currentPage.value > pages) {
      currentPage.value = pages
    }
  })

  watch(
    resolvedRouteCompanyId,
    (companyId) => {
      if (companyId) {
        selectedCompany.value = companyId
        return
      }

      const currentCompanyExists = companies.value.some((company) => {
        return company.id === selectedCompany.value
      })

      if (!currentCompanyExists) {
        selectedCompany.value = "all"
      }
    },
    {
      immediate: true,
    },
  )

  const goToPage = (page) => {
    currentPage.value = Math.min(Math.max(Number(page) || 1, 1), totalPages.value)
  }

  const goToNextPage = () => {
    goToPage(currentPage.value + 1)
  }

  const goToPreviousPage = () => {
    goToPage(currentPage.value - 1)
  }

  const selectUser = (userId) => {
    selectedUserId.value = userId
  }

  const clearFilters = () => {
    searchTerm.value = ""
    selectedRole.value = "all"
    selectedCompany.value = resolvedRouteCompanyId.value || "all"
    selectedStatus.value = "all"
    selectedModule.value = "all"
    currentPage.value = 1
  }

  const {
    showEditorModal,
    editorMode,
    draftUser,
    selectedUserIsPlatformAdmin,
    openCreateUserModal,
    openEditUserModal,
    closeEditorModal,
    saveUserFromModal,
    toggleSelectedUserStatus,
    addApplicationAccess,
    removeApplicationAccess,
    updateAccessRole,
    toggleAccessStatus,
    toggleModuleAccess,
    toggleFunctionAccess,
    togglePermission,
    updateOperationalScope,
    toggleScopeAsset,
    toggleScopeAssetTag,
  } = useUserAccessDrafts({
    users,
    accesses,
    applications,
    modules,
    moduleFunctions,
    assets,
    assetTags: resolvedAssetTags,
    selectedUserId,
    selectedUser,
    selectedUserAccesses,
    applicationsById,
    currentUserId,
    isPlatformAdmin,
    createDatabaseUser,
    updateDatabaseUser,
    createDatabaseAccess,
    deleteDatabaseAccess,
  })

  return {
    users,
    accesses,
    companies,
    applications,
    modules,
    moduleFunctions,
    permissions,
    scopes,
    roles,
    assets,

    applicationsById,
    companiesById,
    accessesByUserId,

    searchTerm,
    selectedRole,
    selectedCompany,
    selectedStatus,
    selectedModule,
    userViewMode,
    userSortKey,
    userSortDirection,
    companyFilterLocked,

    currentPage,
    pageSize,
    totalPages,
    sortedUsers,
    paginatedUsers,

    selectedUserId,
    selectedUser,
    selectedUserAccesses,
    filteredUsers,
    summaryItems,

    showEditorModal,
    editorMode,
    draftUser,
    selectedUserIsPlatformAdmin,

    selectUser,
    clearFilters,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    openCreateUserModal,
    openEditUserModal,
    closeEditorModal,
    saveUserFromModal,

    toggleSelectedUserStatus,
    addApplicationAccess,
    removeApplicationAccess,
    updateAccessRole,
    toggleAccessStatus,
    toggleModuleAccess,
    toggleFunctionAccess,
    togglePermission,
    updateOperationalScope,
    toggleScopeAsset,
    toggleScopeAssetTag,
  }
}
