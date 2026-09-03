<template>
  <section
    class="users-management-readable h-full min-h-0 overflow-hidden bg-[#f3f6fa] text-slate-900"
  >
    <div class="grid h-full min-h-0 grid-rows-[auto_1fr]">
      <UserManagementHeader
        :summary-items="summaryItems"
        :can-create-users="canCreateUsersForRoute"
        :selected-status="selectedStatus"
        @create-user="handleOpenCreateUserModal"
        @select-status="selectedStatus = $event"
      />

      <!-- VISTA PRINCIPAL -->
      <div class="min-h-0 overflow-hidden px-4 pb-4">
        <div class="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-3 overflow-hidden">
          <UserFiltersBar
            :search-term="searchTerm"
            :selected-role="selectedRole"
            :selected-company="selectedCompany"
            :selected-status="selectedStatus"
            :selected-module="selectedModule"
            :company-filter-locked="companyFilterLocked"
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
            :applications="applications"
            :companies="companies"
            :roles="roles"
            :selected-company="selectedCompany"
            :selected-user-id="selectedUserId"
            :visible-users-remaining="visibleUsersRemaining"
            :can-show-more="canShowMoreUsers"
            @select-user="handleSelectUser"
            @clear-filters="clearFilters"
            @show-more="showMoreUsers"
          />
        </div>
      </div>
    </div>

    <!-- DRAWER DETALLE USUARIO -->
    <Teleport to="body">
      <div
        v-if="showUserDrawer"
        class="users-management-readable fixed inset-0 z-[2147483000]"
        role="dialog"
        aria-modal="true"
      >
        <!-- FONDO -->
        <button
          type="button"
          class="absolute inset-0 cursor-default bg-slate-950/30"
          aria-label="Cerrar detalle de usuario"
          @click="closeUserDrawer"
        ></button>

        <!-- PANEL -->
        <aside
          class="absolute inset-y-0 right-0 flex w-full max-w-[920px] flex-col bg-[#f3f6fa] shadow-[-16px_0_50px_rgba(15,23,42,0.18)]"
        >
          <!-- CABECERA DRAWER -->
          <div
            class="flex min-h-[58px] shrink-0 items-center justify-between border-b border-[#d8dee8] bg-white px-4"
          >
            <div class="min-w-0">
              <p class="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
                Gestión de usuario
              </p>

              <p class="mt-0.5 truncate text-[11px] font-black text-[#102372]">
                {{ selectedUserDrawerName }}
              </p>
            </div>

            <button
              type="button"
              class="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[#d8dee8] bg-white text-[20px] font-light leading-none text-slate-400 transition hover:border-[#102372] hover:text-[#102372]"
              aria-label="Cerrar"
              @click="closeUserDrawer"
            >
              ×
            </button>
          </div>

          <!-- DETALLE ACTUAL -->
          <div class="min-h-0 flex-1 overflow-hidden p-3">
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
              :asset-tags="assetTags"
              :can-impersonate="canImpersonateSelectedUser"
              :can-edit-users="canEditUsersForRoute"
              :can-manage-user-permissions="canManageSelectedUserPermissionsForRoute"
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
              @toggle-scope-asset-tag="handleToggleScopeAssetTag"
            />
          </div>
        </aside>
      </div>
    </Teleport>

    <UserEditorModal
      v-if="showEditorModal"
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
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"

import UserAccessDetail from "../components/users/UserAccessDetail.vue"
import UserFiltersBar from "../components/users/UserFiltersBar.vue"
import UserListPanel from "../components/users/UserListPanel.vue"
import UserManagementHeader from "../components/users/UserManagementHeader.vue"

import { useAccessControl } from "../composables/auth/useAccessControl.js"
import { useAuthSession } from "../composables/auth/useAuthSession.js"
import { useAuditTrail } from "../composables/audit/useAuditTrail.js"
import { useMockDatabase } from "../composables/mock/useMockDatabase.js"
import { preloadWhenIdle } from "../composables/ui/useIdlePreload.js"
import { useUserAccessManagement } from "../composables/users/useUserAccessManagement.js"

const loadUserEditorModal = () => import("../components/users/UserEditorModal.vue")

const UserEditorModal = defineAsyncComponent(loadUserEditorModal)

const route = useRoute()
const router = useRouter()

const { canImpersonateUser, startImpersonation, defaultAuthenticatedRoute } = useAuthSession()

const { canAccessFunction } = useAccessControl()
const { assetTags } = useMockDatabase()

const showUserDrawer = ref(false)

const routeCompanyId = computed(() => {
  return route.params.empresaId || null
})

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
  companyFilterLocked,

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
  selectedUserIsPlatformAdmin,

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
  toggleScopeAssetTag,
} = useUserAccessManagement({
  routeCompanyId,
  assetTags,
})

const { recordAudit } = useAuditTrail({
  companyId: routeCompanyId,
})

const selectedUserDrawerName = computed(() => {
  return (
    selectedUser.value?.name ||
    selectedUser.value?.username ||
    selectedUser.value?.email ||
    "Detalle del usuario"
  )
})

const lockBodyScroll = () => {
  if (typeof document === "undefined") return

  document.body.style.overflow = "hidden"
}

const unlockBodyScroll = () => {
  if (typeof document === "undefined") return

  document.body.style.overflow = ""
}

const openUserDrawer = () => {
  if (!selectedUser.value) return

  showUserDrawer.value = true
}

const closeUserDrawer = () => {
  showUserDrawer.value = false
}

const handleSelectUser = (userId) => {
  selectUser(userId)

  if (!selectedUser.value) return

  openUserDrawer()
}

const handleDrawerKeydown = (event) => {
  if (event.key === "Escape" && showUserDrawer.value && !showEditorModal.value) {
    closeUserDrawer()
  }
}

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

const canManageSelectedUserPermissionsForRoute = computed(() => {
  return canManageUserPermissionsForRoute.value && !selectedUserIsPlatformAdmin.value
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
  if (editorMode.value === "create" && !canCreateUsersForRoute.value) {
    return
  }

  if (editorMode.value === "edit" && !canEditUsersForRoute.value) {
    return
  }

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
      : users.value.find((user) => {
          return String(user.id) === String(draftSnapshot.id)
        })

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
        changedFields: Object.keys(draftSnapshot).filter((key) => {
          return key !== "password"
        }),
      },
    })
  }
}

const handleToggleSelectedUserStatus = () => {
  if (!canEditUsersForRoute.value) return
  if (selectedUserIsPlatformAdmin.value) return

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
  if (!canManageSelectedUserPermissionsForRoute.value) return

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
  if (!canManageSelectedUserPermissionsForRoute.value) return

  const access = accesses.value.find((item) => {
    return String(item.id) === String(accessId)
  })

  removeApplicationAccess(accessId)

  const stillExists = accesses.value.some((item) => {
    return String(item.id) === String(accessId)
  })

  if (stillExists) return

  recordAccessAudit({
    access,
    description: "Se elimino acceso de aplicacion a un usuario.",
  })
}

const handleUpdateAccessRole = (accessId, roleId) => {
  if (!canManageSelectedUserPermissionsForRoute.value) return

  const access = accesses.value.find((item) => {
    return String(item.id) === String(accessId)
  })

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
  if (!canManageSelectedUserPermissionsForRoute.value) return

  const access = accesses.value.find((item) => {
    return String(item.id) === String(accessId)
  })

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
  if (!canManageSelectedUserPermissionsForRoute.value) return

  const access = accesses.value.find((item) => {
    return String(item.id) === String(accessId)
  })

  const previousSignature = JSON.stringify(access || {})

  toggleModuleAccess(accessId, moduleId)

  if (!access || previousSignature === JSON.stringify(access)) {
    return
  }

  recordAccessAudit({
    access,
    description: "Se modifico acceso a modulo de un usuario.",
    metadata: {
      moduleId,
    },
  })
}

const handleToggleFunctionAccess = (accessId, functionId) => {
  if (!canManageSelectedUserPermissionsForRoute.value) return

  const access = accesses.value.find((item) => {
    return String(item.id) === String(accessId)
  })

  const previousSignature = JSON.stringify(access || {})

  toggleFunctionAccess(accessId, functionId)

  if (!access || previousSignature === JSON.stringify(access)) {
    return
  }

  recordAccessAudit({
    access,
    description: "Se modifico acceso a funcion de un usuario.",
    metadata: {
      functionId,
    },
  })
}

const handleTogglePermission = (accessId, functionId, permissionId) => {
  if (!canManageSelectedUserPermissionsForRoute.value) return

  const access = accesses.value.find((item) => {
    return String(item.id) === String(accessId)
  })

  const previousSignature = JSON.stringify(access || {})

  togglePermission(accessId, functionId, permissionId)

  if (!access || previousSignature === JSON.stringify(access)) {
    return
  }

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
  if (!canManageSelectedUserPermissionsForRoute.value) return

  const access = accesses.value.find((item) => {
    return String(item.id) === String(accessId)
  })

  const previousSignature = JSON.stringify(access || {})

  updateOperationalScope(accessId, scopeType)

  if (!access || previousSignature === JSON.stringify(access)) {
    return
  }

  recordAccessAudit({
    access,
    description: "Se modifico el alcance operacional de un usuario.",
    metadata: {
      scopeType,
    },
  })
}

const handleToggleScopeAsset = (accessId, assetId) => {
  if (!canManageSelectedUserPermissionsForRoute.value) return

  const access = accesses.value.find((item) => {
    return String(item.id) === String(accessId)
  })

  const previousSignature = JSON.stringify(access || {})

  toggleScopeAsset(accessId, assetId)

  if (!access || previousSignature === JSON.stringify(access)) {
    return
  }

  recordAccessAudit({
    access,
    description: "Se modificaron los activos del alcance de un usuario.",
    metadata: {
      assetId,
    },
  })
}

const handleToggleScopeAssetTag = (accessId, tagId) => {
  if (!canManageSelectedUserPermissionsForRoute.value) return

  const access = accesses.value.find((item) => {
    return String(item.id) === String(accessId)
  })

  const previousSignature = JSON.stringify(access || {})

  toggleScopeAssetTag(accessId, tagId)

  if (!access || previousSignature === JSON.stringify(access)) {
    return
  }

  recordAccessAudit({
    access,
    description: "Se modificaron las etiquetas del alcance de un usuario.",
    metadata: {
      tagId,
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

watch(showUserDrawer, (isOpen) => {
  if (isOpen) {
    lockBodyScroll()
    return
  }

  unlockBodyScroll()
})

onMounted(() => {
  preloadWhenIdle([loadUserEditorModal])

  if (typeof window !== "undefined") {
    window.addEventListener("keydown", handleDrawerKeydown)
  }
})

onBeforeUnmount(() => {
  unlockBodyScroll()

  if (typeof window !== "undefined") {
    window.removeEventListener("keydown", handleDrawerKeydown)
  }
})
</script>

<style scoped>
.users-management-readable :deep(.text-\[8px\]) {
  font-size: 10px !important;
  line-height: 1rem !important;
}

.users-management-readable :deep(.text-\[9px\]) {
  font-size: 11px !important;
  line-height: 1rem !important;
}

.users-management-readable :deep(.text-\[10px\]) {
  font-size: 12px !important;
  line-height: 1.1rem !important;
}

.users-management-readable :deep(.text-\[11px\]),
.users-management-readable :deep(.text-xs) {
  font-size: 13px !important;
  line-height: 1.25rem !important;
}

.users-management-readable :deep(.text-\[12px\]) {
  font-size: 14px !important;
  line-height: 1.35rem !important;
}

.users-management-readable :deep(.text-\[13px\]),
.users-management-readable :deep(.text-sm) {
  font-size: 15px !important;
  line-height: 1.45rem !important;
}

.users-management-readable :deep(.text-\[14px\]) {
  font-size: 16px !important;
  line-height: 1.45rem !important;
}

.users-management-readable :deep(.text-\[15px\]) {
  font-size: 17px !important;
  line-height: 1.5rem !important;
}

.users-management-readable :deep(.text-\[17px\]) {
  font-size: 19px !important;
  line-height: 1.55rem !important;
}

.users-management-readable :deep(.text-\[18px\]) {
  font-size: 20px !important;
  line-height: 1.7rem !important;
}
</style>
