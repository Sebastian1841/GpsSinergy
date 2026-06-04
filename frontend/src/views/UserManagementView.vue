<template>
  <section class="h-full min-h-0 bg-[#eef2f7]">
    <div class="grid h-full min-h-0 grid-rows-[auto_1fr]">
      <UserManagementHeader :summary-items="summaryItems" @create-user="openCreateUserModal" />

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
            @impersonate-user="handleImpersonateSelectedUser"
            @edit-user="openEditUserModal"
            @toggle-user-status="toggleSelectedUserStatus"
            @add-application-access="addApplicationAccess"
            @update-access-role="updateAccessRole"
            @toggle-access-status="toggleAccessStatus"
            @remove-application-access="removeApplicationAccess"
            @toggle-module-access="toggleModuleAccess"
            @toggle-function-access="toggleFunctionAccess"
            @toggle-permission="togglePermission"
            @update-operational-scope="updateOperationalScope"
            @toggle-scope-option="toggleScopeOption"
            @toggle-scope-asset="toggleScopeAsset"
            @toggle-scope-sucursal="toggleScopeSucursal"
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
      @save="saveUserFromModal"
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
import { useAuthSession } from "../composables/auth/useAuthSession.js"

const route = useRoute()
const router = useRouter()
const { canImpersonateUser, startImpersonation, defaultAuthenticatedRoute } = useAuthSession()

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
  toggleScopeOption,
  toggleScopeAsset,
  toggleScopeSucursal,
} = useUserAccessManagement()

const canImpersonateSelectedUser = computed(() => {
  return canImpersonateUser(selectedUser.value?.id)
})

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
