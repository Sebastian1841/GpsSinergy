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

import { useUserAccessManagement } from "../composables/users/useUserAccessManagement.js"
import { useAccessControl } from "../composables/auth/useAccessControl.js"
import { useAuthSession } from "../composables/auth/useAuthSession.js"

const route = useRoute()
const router = useRouter()
const { canImpersonateUser, startImpersonation, defaultAuthenticatedRoute } = useAuthSession()
const { canAccessFunction } = useAccessControl()

const {
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

  saveUserFromModal()
}

const handleToggleSelectedUserStatus = () => {
  if (!canEditUsersForRoute.value) return

  toggleSelectedUserStatus()
}

const handleAddApplicationAccess = (applicationId) => {
  if (!canManageUserPermissionsForRoute.value) return

  addApplicationAccess(applicationId)
}

const handleRemoveApplicationAccess = (accessId) => {
  if (!canManageUserPermissionsForRoute.value) return

  removeApplicationAccess(accessId)
}

const handleUpdateAccessRole = (accessId, roleId) => {
  if (!canManageUserPermissionsForRoute.value) return

  updateAccessRole(accessId, roleId)
}

const handleToggleAccessStatus = (accessId) => {
  if (!canManageUserPermissionsForRoute.value) return

  toggleAccessStatus(accessId)
}

const handleToggleModuleAccess = (accessId, moduleId) => {
  if (!canManageUserPermissionsForRoute.value) return

  toggleModuleAccess(accessId, moduleId)
}

const handleToggleFunctionAccess = (accessId, functionId) => {
  if (!canManageUserPermissionsForRoute.value) return

  toggleFunctionAccess(accessId, functionId)
}

const handleTogglePermission = (accessId, functionId, permissionId) => {
  if (!canManageUserPermissionsForRoute.value) return

  togglePermission(accessId, functionId, permissionId)
}

const handleUpdateOperationalScope = (accessId, scopeType) => {
  if (!canManageUserPermissionsForRoute.value) return

  updateOperationalScope(accessId, scopeType)
}

const handleToggleScopeAsset = (accessId, assetId) => {
  if (!canManageUserPermissionsForRoute.value) return

  toggleScopeAsset(accessId, assetId)
}

const handleToggleScopeSucursal = (accessId, sucursalId) => {
  if (!canManageUserPermissionsForRoute.value) return

  toggleScopeSucursal(accessId, sucursalId)
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
