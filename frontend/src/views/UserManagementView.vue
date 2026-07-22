<template>
  <section class="h-full min-h-0 bg-[#eef2f7]">
    <div class="grid h-full min-h-0 grid-rows-[auto_1fr]">
      <UserManagementHeader
        :summary-items="summaryItems"
        :can-create-users="canCreateUsersForRoute"
        @create-user="handleOpenCreateUserModal"
      />

      <div
        class="grid min-h-0 grid-cols-1 gap-3 overflow-hidden p-3 xl:grid-cols-[320px_minmax(0,1fr)]"
      >
        <aside class="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-3 overflow-hidden">
          <UserFiltersBar
            :search-term="searchTerm"
            :selected-role="selectedRole"
            :selected-company="selectedCompany"
            :selected-status="selectedStatus"
            :selected-module="selectedModule"
            :roles="roles"
            :companies="companies"
            :modules="modules"
            @update:search-term="searchTerm = $event"
            @update:selected-role="selectedRole = $event"
            @update:selected-company="selectedCompany = $event"
            @update:selected-status="selectedStatus = $event"
            @update:selected-module="selectedModule = $event"
            @clear-filters="clearFilters"
          />

          <UserListPanel
            :users="visibleUsers"
            :accesses="accesses"
            :selected-user-id="selectedUserId"
            :visible-users-remaining="visibleUsersRemaining"
            :can-show-more="canShowMoreUsers"
            @select-user="selectUser"
            @clear-filters="clearFilters"
            @show-more="showMoreUsers"
          />
        </aside>

        <main class="min-h-0 overflow-hidden">
          <UserAccessDetail
            :user="selectedUser"
            :accesses="selectedUserAccesses"
            :applications="applications"
            :companies="companies"
            :modules="modules"
            :module-functions="moduleFunctions"
            :permissions="permissions"
            :scopes="scopes"
            :roles="roles"
            :assets="assets"
            :can-impersonate="canImpersonateSelectedUser"
            :can-edit-users="canEditUsersForRoute"
            :can-manage-user-permissions="canManageUserPermissionsForRoute"
            @impersonate-user="handleImpersonateSelectedUser"
            @edit-user="handleOpenEditUserModal"
            @toggle-user-status="handleToggleSelectedUserStatus"
            @add-application-access="handleAddApplicationAccess"
            @update-access-role="handleUpdateAccessRole"
            @toggle-access-status="handleToggleAccessStatus"
            @remove-application-access="handleRemoveApplicationAccess"
            @toggle-module-access="handleToggleModuleAccess"
            @toggle-function-access="handleToggleFunctionAccess"
            @toggle-permission="handleTogglePermission"
            @update-operational-scope="handleUpdateOperationalScope"
            @toggle-scope-asset="handleToggleScopeAsset"
            @toggle-scope-sucursal="handleToggleScopeSucursal"
          />
        </main>
      </div>
    </div>

    <UserEditorModal
      :model-value="showEditorModal"
      :mode="editorMode"
      :draft-user="draftUser"
      :roles="roles"
      :applications="applications"
      @update:draft-user="updateDraftUser"
      @close="closeEditorModal"
      @save="handleSaveUserFromModal"
    />
  </section>
</template>

<script setup>
import { computed } from "vue"
import { useRoute, useRouter } from "vue-router"

import UserAccessDetail from "../components/users/UserAccessDetail.vue"
import UserEditorModal from "../components/users/UserEditorModal.vue"
import UserFiltersBar from "../components/users/UserFiltersBar.vue"
import UserListPanel from "../components/users/UserListPanel.vue"
import UserManagementHeader from "../components/users/UserManagementHeader.vue"

import { useAuditTrail } from "../composables/audit/useAuditTrail.js"
import { useUserAccessManagement } from "../composables/users/useUserAccessManagement.js"
import { useAccessControl } from "../composables/auth/useAccessControl.js"
import { useAuthSession } from "../composables/auth/useAuthSession.js"

const route = useRoute()
const router = useRouter()
const { canImpersonateUser, startImpersonation, defaultAuthenticatedRoute } = useAuthSession()
const { canAccessFunction } = useAccessControl()

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

  searchTerm,
  selectedRole,
  selectedCompany,
  selectedStatus,
  selectedModule,

  selectedUserId,
  selectedUser,
  selectedUserAccesses,
  visibleUsers,
  visibleUsersRemaining,
  canShowMoreUsers,
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
} = useUserAccessManagement()

const routeCompanyId = computed(() => {
  return route.params.empresaId || null
})
const { recordAudit } = useAuditTrail({
  companyId: routeCompanyId,
})

const getUserAuditName = (user = {}) => {
  return user.name || user.username || user.email || user.id || "Usuario"
}

const getAccessApplication = (access = {}) => {
  return applications.value.find((application) => {
    return String(application.id) === String(access.applicationId)
  })
}

const getAccessCompanyId = (access = {}) => {
  return getAccessApplication(access)?.companyId || routeCompanyId.value || ""
}

const recordUserAudit = ({ action, user, description, severity = "info", metadata = {} }) => {
  if (!user) return

  recordAudit({
    companyId: routeCompanyId.value || "",
    module: "usuarios",
    action,
    entityType: "usuario",
    entityName: getUserAuditName(user),
    severity,
    description,
    metadata: {
      userId: user.id,
      ...metadata,
    },
  })
}

const recordAccessAudit = ({ access, description, metadata = {} }) => {
  if (!access) return

  const user = users.value.find((item) => {
    return String(item.id) === String(access.userId)
  })

  recordAudit({
    companyId: getAccessCompanyId(access),
    module: "usuarios",
    action: "permissions:update",
    entityType: "acceso de usuario",
    entityName: getUserAuditName(user) || "Usuario",
    severity: "warning",
    description,
    metadata: {
      accessId: access.id,
      userId: access.userId,
      applicationId: access.applicationId,
      ...metadata,
    },
  })
}

const canCreateUsersForRoute = computed(() => {
  return canAccessFunction("users-create", routeCompanyId.value, "edit")
})

const canEditUsersForRoute = computed(() => {
  return canAccessFunction("users-edit", routeCompanyId.value, "edit")
})

const canManageUserPermissionsForRoute = computed(() => {
  return canAccessFunction("users-permissions", routeCompanyId.value, "admin")
})

const canImpersonateSelectedUser = computed(() => {
  return canImpersonateUser(selectedUser.value?.id)
})

const handleOpenCreateUserModal = () => {
  if (!canCreateUsersForRoute.value) return

  openCreateUserModal()
}

const handleOpenEditUserModal = () => {
  if (!canEditUsersForRoute.value) return

  openEditUserModal()
}

const handleSaveUserFromModal = () => {
  if (editorMode.value === "create" && !canCreateUsersForRoute.value) return
  if (editorMode.value === "edit" && !canEditUsersForRoute.value) return

  const mode = editorMode.value
  const draftSnapshot = {
    ...draftUser.value,
  }
  const previousUsersCount = users.value.length
  const previousUserSignature =
    mode === "edit"
      ? JSON.stringify(
          users.value.find((user) => {
            return String(user.id) === String(draftSnapshot.id)
          }) || null,
        )
      : ""

  saveUserFromModal()

  const savedUser =
    mode === "create"
      ? users.value.find((user) => {
          return (
            String(user.username || "") === String(draftSnapshot.username || "") ||
            String(user.email || "") === String(draftSnapshot.email || "")
          )
        })
      : users.value.find((user) => String(user.id) === String(draftSnapshot.id))

  if (!savedUser) return

  if (mode === "create" && users.value.length > previousUsersCount) {
    recordUserAudit({
      action: "user:create",
      user: savedUser,
      description: "Se creo un usuario.",
    })
    return
  }

  if (mode === "edit" && previousUserSignature !== JSON.stringify(savedUser)) {
    recordUserAudit({
      action: "user:update",
      user: savedUser,
      description: "Se actualizo la ficha de un usuario.",
      metadata: {
        changedFields: Object.keys(draftSnapshot).filter((key) => key !== "password"),
      },
    })
  }
}

const handleToggleSelectedUserStatus = () => {
  if (!canEditUsersForRoute.value) return
  const user = selectedUser.value
  const previousStatus = user?.status

  toggleSelectedUserStatus()

  if (!user || previousStatus === user.status) return

  recordUserAudit({
    action: "user:status",
    user,
    severity: "warning",
    description: "Se cambio el estado de un usuario.",
    metadata: {
      previousStatus,
      nextStatus: user.status,
    },
  })
}

const handleAddApplicationAccess = (applicationId) => {
  if (!canManageUserPermissionsForRoute.value) return
  const previousAccessesCount = accesses.value.length

  addApplicationAccess(applicationId)

  if (accesses.value.length <= previousAccessesCount) return

  const access = accesses.value.find((item) => {
    return (
      String(item.userId) === String(selectedUser.value?.id) &&
      String(item.applicationId) === String(applicationId)
    )
  })

  recordAccessAudit({
    access,
    description: "Se agrego acceso de aplicacion a un usuario.",
  })
}

const handleRemoveApplicationAccess = (accessId) => {
  if (!canManageUserPermissionsForRoute.value) return
  const access = accesses.value.find((item) => String(item.id) === String(accessId))

  removeApplicationAccess(accessId)

  const stillExists = accesses.value.some((item) => String(item.id) === String(accessId))

  if (stillExists) return

  recordAccessAudit({
    access,
    description: "Se elimino acceso de aplicacion a un usuario.",
  })
}

const handleUpdateAccessRole = (accessId, roleId) => {
  if (!canManageUserPermissionsForRoute.value) return
  const access = accesses.value.find((item) => String(item.id) === String(accessId))
  const previousRole = access?.role

  updateAccessRole(accessId, roleId)

  if (!access || previousRole === access.role) return

  recordAccessAudit({
    access,
    description: "Se cambio el rol de un acceso de usuario.",
    metadata: {
      previousRole,
      nextRole: access.role,
    },
  })
}

const handleToggleAccessStatus = (accessId) => {
  if (!canManageUserPermissionsForRoute.value) return
  const access = accesses.value.find((item) => String(item.id) === String(accessId))
  const previousStatus = access?.status

  toggleAccessStatus(accessId)

  if (!access || previousStatus === access.status) return

  recordAccessAudit({
    access,
    description: "Se cambio el estado de un acceso de usuario.",
    metadata: {
      previousStatus,
      nextStatus: access.status,
    },
  })
}

const handleToggleModuleAccess = (accessId, moduleId) => {
  if (!canManageUserPermissionsForRoute.value) return
  const access = accesses.value.find((item) => String(item.id) === String(accessId))
  const previousSignature = JSON.stringify(access || {})

  toggleModuleAccess(accessId, moduleId)

  if (!access || previousSignature === JSON.stringify(access)) return

  recordAccessAudit({
    access,
    description: "Se modifico acceso a modulo de un usuario.",
    metadata: {
      moduleId,
    },
  })
}

const handleToggleFunctionAccess = (accessId, functionId) => {
  if (!canManageUserPermissionsForRoute.value) return
  const access = accesses.value.find((item) => String(item.id) === String(accessId))
  const previousSignature = JSON.stringify(access || {})

  toggleFunctionAccess(accessId, functionId)

  if (!access || previousSignature === JSON.stringify(access)) return

  recordAccessAudit({
    access,
    description: "Se modifico acceso a funcion de un usuario.",
    metadata: {
      functionId,
    },
  })
}

const handleTogglePermission = (accessId, functionId, permissionId) => {
  if (!canManageUserPermissionsForRoute.value) return
  const access = accesses.value.find((item) => String(item.id) === String(accessId))
  const previousSignature = JSON.stringify(access || {})

  togglePermission(accessId, functionId, permissionId)

  if (!access || previousSignature === JSON.stringify(access)) return

  recordAccessAudit({
    access,
    description: "Se modifico un permiso de usuario.",
    metadata: {
      functionId,
      permissionId,
    },
  })
}

const handleUpdateOperationalScope = (accessId, scopeType) => {
  if (!canManageUserPermissionsForRoute.value) return
  const access = accesses.value.find((item) => String(item.id) === String(accessId))
  const previousSignature = JSON.stringify(access || {})

  updateOperationalScope(accessId, scopeType)

  if (!access || previousSignature === JSON.stringify(access)) return

  recordAccessAudit({
    access,
    description: "Se modifico el alcance operacional de un usuario.",
    metadata: {
      scopeType,
    },
  })
}

const handleToggleScopeAsset = (accessId, assetId) => {
  if (!canManageUserPermissionsForRoute.value) return
  const access = accesses.value.find((item) => String(item.id) === String(accessId))
  const previousSignature = JSON.stringify(access || {})

  toggleScopeAsset(accessId, assetId)

  if (!access || previousSignature === JSON.stringify(access)) return

  recordAccessAudit({
    access,
    description: "Se modificaron los activos del alcance de un usuario.",
    metadata: {
      assetId,
    },
  })
}

const handleToggleScopeSucursal = (accessId, sucursalId) => {
  if (!canManageUserPermissionsForRoute.value) return
  const access = accesses.value.find((item) => String(item.id) === String(accessId))
  const previousSignature = JSON.stringify(access || {})

  toggleScopeSucursal(accessId, sucursalId)

  if (!access || previousSignature === JSON.stringify(access)) return

  recordAccessAudit({
    access,
    description: "Se modificaron las sucursales del alcance de un usuario.",
    metadata: {
      branchId: sucursalId,
    },
  })
}

const handleImpersonateSelectedUser = async () => {
  if (!selectedUser.value) return

  const result = startImpersonation(selectedUser.value.id, route.fullPath)

  if (!result.ok) return

  await router.replace(defaultAuthenticatedRoute.value)
}

const updateDraftUser = (nextDraftUser) => {
  draftUser.value = nextDraftUser
}
</script>
