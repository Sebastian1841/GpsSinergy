import { computed, ref, watch } from "vue"

import { useAuthSession } from "../auth/useAuthSession.js"
import { useUsersService } from "../../services/users/useUsersService.js"
import { useDebouncedValue } from "../ui/useDebouncedValue.js"
import { useUserAccessDrafts } from "./useUserAccessDrafts.js"

import { userMatchesSearch } from "../../utils/users/userAccessUtils.js"
import {
  DEFAULT_VISIBLE_USER_LIMIT,
  USER_LIMIT_INCREMENT,
  normalizeAccess,
  normalizeUserAccessKey,
} from "../../utils/users/userAccessStateUtils.js"

export function useUserAccessManagement() {
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
    })
  })

  const searchTerm = ref("")
  const selectedRole = ref("all")
  const selectedCompany = ref("all")
  const selectedStatus = ref("all")
  const selectedModule = ref("all")

  const debouncedSearchTerm = useDebouncedValue(searchTerm, 180)

  const visibleUserLimit = ref(DEFAULT_VISIBLE_USER_LIMIT)
  const selectedUserId = ref(users.value[0]?.id || null)

  const currentUserId = computed(() => {
    return normalizeUserAccessKey(currentUser.value?.id)
  })

  const applicationsById = computed(() => {
    return new Map(applications.value.map((application) => [application.id, application]))
  })

  const companiesById = computed(() => {
    return new Map(companies.value.map((company) => [company.id, company]))
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

  const visibleUsers = computed(() => {
    return filteredUsers.value.slice(0, visibleUserLimit.value)
  })

  const visibleUsersRemaining = computed(() => {
    return Math.max(filteredUsers.value.length - visibleUsers.value.length, 0)
  })

  const canShowMoreUsers = computed(() => {
    return visibleUsersRemaining.value > 0
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
        key: "accesses",
        label: "Accesos",
        value: accesses.value.length,
        filter: "all",
        class: "text-slate-700",
      },
    ]
  })

  watch(
    [debouncedSearchTerm, selectedRole, selectedCompany, selectedStatus, selectedModule],
    () => {
      visibleUserLimit.value = DEFAULT_VISIBLE_USER_LIMIT
    },
  )

  const showMoreUsers = () => {
    visibleUserLimit.value += USER_LIMIT_INCREMENT
  }

  const selectUser = (userId) => {
    selectedUserId.value = userId
  }

  const clearFilters = () => {
    searchTerm.value = ""
    selectedRole.value = "all"
    selectedCompany.value = "all"
    selectedStatus.value = "all"
    selectedModule.value = "all"
    visibleUserLimit.value = DEFAULT_VISIBLE_USER_LIMIT
  }

  const {
    showEditorModal,
    editorMode,
    draftUser,
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
    toggleScopeSucursal,
  } = useUserAccessDrafts({
    users,
    accesses,
    applications,
    modules,
    moduleFunctions,
    assets,
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

    visibleUserLimit,
    visibleUsers,
    visibleUsersRemaining,
    canShowMoreUsers,

    selectedUserId,
    selectedUser,
    selectedUserAccesses,
    filteredUsers,
    summaryItems,

    showEditorModal,
    editorMode,
    draftUser,

    selectUser,
    clearFilters,
    showMoreUsers,

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
    toggleScopeSucursal,
  }
}
