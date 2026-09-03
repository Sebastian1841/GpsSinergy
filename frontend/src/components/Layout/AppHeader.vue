<template>
  <div class="contents">
    <header
      ref="headerRef"
      class="relative border-b border-white/10 bg-gradient-to-r from-[#182230] via-[#1f2937] to-[#182230] shadow-[0_8px_30px_rgba(0,0,0,0.18)]"
      :class="showAnyDropdown ? 'z-[780]' : 'z-30'"
    >
      <div
        class="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-[#ff6600]/70 to-transparent"
      ></div>

      <div
        class="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-4 lg:grid-cols-[minmax(240px,340px)_minmax(220px,1fr)_auto] 2xl:grid-cols-[minmax(340px,440px)_minmax(320px,560px)_auto]"
      >
        <div class="flex min-w-0 items-center gap-2 overflow-hidden sm:gap-3">
          <button
            class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white transition-all duration-200 hover:bg-white/10 active:scale-95"
            aria-label="Abrir menú"
            type="button"
            @click="emit('toggle-sidebar')"
          >
            <svg viewBox="0 0 24 24" class="h-6 w-6" fill="none" aria-hidden="true">
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          </button>

          <div
            class="relative flex h-[48px] w-[112px] shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm min-[390px]:w-[136px] sm:h-[52px] sm:w-[150px] xl:h-[56px] xl:w-[168px]"
          >
            <div
              class="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent"
            ></div>

            <iframe
              src="/logo-sinergy.html"
              title="Logo Sinergy"
              class="pointer-events-none relative h-full w-full border-0 bg-transparent"
              scrolling="no"
            />
          </div>

          <div class="hidden min-w-0 border-l border-white/10 pl-3 min-[520px]:block">
            <p class="text-[9px] font-black uppercase tracking-[0.18em] text-white/40">
              {{ activeContextLabel }}
            </p>
            <p
              class="mt-0.5 max-w-[140px] truncate text-[12px] font-black text-white sm:max-w-[190px] xl:max-w-[230px] xl:text-[13px]"
            >
              {{ activeContextName }}
            </p>
          </div>
        </div>

        <HeaderGlobalSearch
          :enabled="Boolean(currentUser)"
          :is-open="showGlobalSearchDropdown"
          :active-company-id="activeCompanyId"
          :audit-records="auditRecords"
          :can-access-function="canAccessFunction"
          :can-access-module="canAccessModule"
          :companies="headerCompanies"
          :get-accessible-company-entry-path="getAccessibleCompanyEntryPath"
          :report-types="reportTypes"
          :users="searchableUsers"
          :visible-assets="visibleAssets"
          :workspaces="workspaces"
          class="relative z-40 col-span-2 row-start-2 w-full min-w-0 lg:col-span-1 lg:col-start-2 lg:row-start-1 lg:max-w-[460px] lg:justify-self-center xl:max-w-[520px] 2xl:max-w-[560px]"
          @open="openGlobalSearchDropdown"
          @close="closeGlobalSearchDropdown"
          @before-open="raiseHeaderLayer"
          @before-close="raiseHeaderLayer"
          @after-close="releaseHeaderLayer"
        />

        <div
          class="col-start-2 row-start-1 flex min-w-0 shrink-0 items-center justify-end gap-1.5 justify-self-end sm:gap-2 lg:col-start-3"
        >
          <WorkspaceSelector
            class="hidden shrink-0 xl:block"
            :enabled="showWorkspacesControl"
            :is-open="showWorkspaceDropdown"
            :workspaces="workspaces"
            :active-workspace-id="activeWorkspaceId"
            :current-user-id="currentUserId"
            :has-unsaved-changes="hasUnsavedWorkspaceChanges"
            :users="workspaceUsers"
            @open="openWorkspaceDropdown"
            @close="closeWorkspaceDropdown"
            @before-open="raiseHeaderLayer"
            @before-close="raiseHeaderLayer"
            @after-close="releaseHeaderLayer"
            @select-workspace="handleSelectWorkspace"
            @create-workspace="handleCreateWorkspace"
            @rename-workspace="handleRenameWorkspace"
            @delete-workspace="handleDeleteWorkspace"
            @save-current-view="handleSaveCurrentWorkspace"
          />

          <HeaderFleetAssetFilterMenu
            class="hidden shrink-0 xl:block"
            :enabled="showPersonalViewsControl"
            :is-open="showPersonalViewsDropdown"
            :available-assets="headerVisibleAssets"
            :can-manage-groups="canManageVehicleAssetGroups"
            :city-groups="cityAssetGroups"
            :selected-city-group-id="selectedCityAssetGroupId"
            :selected-vehicle-group-id="selectedVehicleAssetGroupId"
            :vehicle-groups="vehicleAssetGroups"
            :visible-assets-count="headerVisibleAssets.length"
            @open="openPersonalViewsDropdown"
            @close="closePersonalViewsDropdown"
            @before-open="raiseHeaderLayer"
            @before-close="raiseHeaderLayer"
            @after-close="releaseHeaderLayer"
            @create-vehicle-group="handleCreateVehicleAssetGroup"
            @delete-vehicle-group="handleDeleteVehicleAssetGroup"
            @select-city-group="selectCityAssetGroup"
            @select-vehicle-group="selectVehicleAssetGroup"
            @update-vehicle-group="handleUpdateVehicleAssetGroup"
          />

          <div v-if="currentUser" class="relative z-40 shrink-0">
            <button
              class="group flex h-12 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-2 text-white backdrop-blur-sm transition-all duration-200 hover:border-white/20 hover:bg-white/[0.08] sm:px-2.5"
              aria-label="Abrir menú de usuario"
              type="button"
              @click="toggleDropdown"
            >
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#ff6600] to-[#ff8c42] text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.20)]"
              >
                {{ userInitial }}
              </div>

              <div class="hidden flex-col items-start leading-tight min-[1880px]:flex">
                <strong class="max-w-[150px] truncate text-sm font-semibold text-white">
                  {{ userName }}
                </strong>

                <div class="flex items-center gap-2">
                  <span
                    class="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(74,222,128,0.9)]"
                  ></span>
                  <span class="text-xs text-gray-300">
                    {{ userRole }}
                  </span>
                </div>
              </div>

              <span
                class="text-[10px] text-gray-300 transition-transform duration-200"
                :class="{ 'rotate-180': showDropdown }"
              >
                ▼
              </span>
            </button>

            <transition
              enter-active-class="transition duration-180 ease-out"
              enter-from-class="opacity-0 translate-y-1 scale-[0.98]"
              enter-to-class="opacity-100 translate-y-0 scale-100"
              leave-active-class="transition duration-140 ease-in"
              leave-from-class="opacity-100 translate-y-0 scale-100"
              leave-to-class="opacity-0 translate-y-1 scale-[0.98]"
              @before-enter="raiseHeaderLayer"
              @before-leave="raiseHeaderLayer"
              @after-leave="releaseHeaderLayer"
            >
              <div
                v-show="showDropdown"
                class="absolute right-0 z-50 mt-3 w-64 overflow-hidden rounded-2xl border border-white/10 bg-[#1b2532]/95 text-white shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl"
              >
                <div class="border-b border-white/10 bg-white/[0.03] px-4 py-3">
                  <p class="truncate text-sm font-semibold text-white">
                    {{ userName }}
                  </p>
                  <p class="mt-0.5 text-xs text-gray-400">
                    {{ userRole }}
                  </p>
                </div>

                <div class="p-2">
                  <button
                    class="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white transition-all duration-200 hover:bg-[#ff6600] hover:shadow-[0_8px_24px_rgba(255,102,0,0.28)]"
                    type="button"
                    @click="logout"
                  >
                    <div
                      class="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 transition-colors duration-200 group-hover:bg-white/15"
                    >
                      <SvgIcon name="logout" class="h-4 w-4" />
                    </div>

                    <div class="flex flex-col items-start leading-tight">
                      <span class="font-medium">Cerrar sesión</span>
                      <span class="text-[11px] text-gray-300 group-hover:text-white/90">
                        Salir del panel actual
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </transition>
          </div>

          <div
            v-else
            class="shrink-0 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-gray-300 backdrop-blur-sm"
          >
            Invitado
          </div>
        </div>

        <div
          v-if="currentUser && showSecondaryHeaderControls"
          class="col-span-2 row-start-3 flex min-w-0 flex-wrap items-center justify-end gap-2 pt-0.5 xl:hidden"
        >
          <WorkspaceSelector
            class="shrink-0"
            :enabled="showWorkspacesControl"
            :is-open="showWorkspaceDropdown"
            :workspaces="workspaces"
            :active-workspace-id="activeWorkspaceId"
            :current-user-id="currentUserId"
            :has-unsaved-changes="hasUnsavedWorkspaceChanges"
            :users="workspaceUsers"
            @open="openWorkspaceDropdown"
            @close="closeWorkspaceDropdown"
            @before-open="raiseHeaderLayer"
            @before-close="raiseHeaderLayer"
            @after-close="releaseHeaderLayer"
            @select-workspace="handleSelectWorkspace"
            @create-workspace="handleCreateWorkspace"
            @rename-workspace="handleRenameWorkspace"
            @delete-workspace="handleDeleteWorkspace"
            @save-current-view="handleSaveCurrentWorkspace"
          />

          <HeaderFleetAssetFilterMenu
            class="shrink-0"
            :enabled="showPersonalViewsControl"
            :is-open="showPersonalViewsDropdown"
            :available-assets="headerVisibleAssets"
            :can-manage-groups="canManageVehicleAssetGroups"
            :city-groups="cityAssetGroups"
            :selected-city-group-id="selectedCityAssetGroupId"
            :selected-vehicle-group-id="selectedVehicleAssetGroupId"
            :vehicle-groups="vehicleAssetGroups"
            :visible-assets-count="headerVisibleAssets.length"
            @open="openPersonalViewsDropdown"
            @close="closePersonalViewsDropdown"
            @before-open="raiseHeaderLayer"
            @before-close="raiseHeaderLayer"
            @after-close="releaseHeaderLayer"
            @create-vehicle-group="handleCreateVehicleAssetGroup"
            @delete-vehicle-group="handleDeleteVehicleAssetGroup"
            @select-city-group="selectCityAssetGroup"
            @select-vehicle-group="selectVehicleAssetGroup"
            @update-vehicle-group="handleUpdateVehicleAssetGroup"
          />
        </div>
      </div>
    </header>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useAccessControl } from "../../composables/auth/useAccessControl.js"
import { useAuthSession } from "../../composables/auth/useAuthSession.js"
import { useAssetCityFilter } from "../../composables/activos/fleet/useAssetCityFilter.js"
import { useAssetVehicleGroupFilter } from "../../composables/activos/fleet/useAssetVehicleGroupFilter.js"
import { useAssetVehicleGroupManagement } from "../../composables/activos/fleet/useAssetVehicleGroupManagement.js"
import { useAppHeaderAccessScope } from "../../composables/layout/useAppHeaderAccessScope.js"
import { useWorkspaceViewState } from "../../composables/workspaces/useWorkspaceViewState.js"
import { useWorkspaces } from "../../composables/workspaces/useWorkspaces.js"
import { useAuditService } from "../../services/audit/useAuditService.js"
import { useCompaniesService } from "../../services/companies/useCompaniesService.js"
import { useReportsService } from "../../services/reports/useReportsService.js"
import { useUsersService } from "../../services/users/useUsersService.js"
import { createCityAssetGroups } from "../../utils/activos/assetCityUtils.js"
import {
  createVehicleAssetGroupId,
  createVehicleAssetGroups,
} from "../../utils/activos/assetVehicleGroupUtils.js"
import { getCompanyWorkspacePath } from "../../utils/companies/companyUtils.js"
import { normalizeId } from "../../utils/idUtils.js"
import HeaderFleetAssetFilterMenu from "./HeaderFleetAssetFilterMenu.vue"
import HeaderGlobalSearch from "./HeaderGlobalSearch.vue"
import WorkspaceSelector from "./WorkspaceSelector.vue"
import SvgIcon from "../icons/SvgIcon.vue"

const emit = defineEmits(["toggle-sidebar"])

const router = useRouter()
const route = useRoute()
const { currentUser, currentRole, logout: logoutSession } = useAuthSession()
const { accessibleCompanies, visibleAssets, isPlatformAdmin, canAccessModule, canAccessFunction } =
  useAccessControl()
const { auditRecords } = useAuditService()
const { companyRecords } = useCompaniesService()
const { reportTypes } = useReportsService()
const { users, accesses, applications } = useUsersService()
const { currentWorkspaceViewState, requestWorkspaceViewRestore } = useWorkspaceViewState()

const showDropdown = ref(false)
const showGlobalSearchDropdown = ref(false)
const showPersonalViewsDropdown = ref(false)
const showWorkspaceDropdown = ref(false)
const headerLayerRaised = ref(false)
const headerRef = ref(null)

let lastAutoRestoredWorkspaceKey = ""

onMounted(() => {
  document.addEventListener("click", handleClickOutside)
  document.addEventListener("keydown", handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside)
  document.removeEventListener("keydown", handleKeydown)
})

const userName = computed(() => {
  return currentUser.value?.name || currentUser.value?.username || "Invitado"
})

const userInitial = computed(() => {
  return userName.value.charAt(0).toUpperCase()
})

const userRole = computed(() => {
  return currentRole.value?.name || "Sin rol asignado"
})

const showAnyDropdown = computed(() => {
  return (
    showDropdown.value ||
    showGlobalSearchDropdown.value ||
    showPersonalViewsDropdown.value ||
    showWorkspaceDropdown.value ||
    headerLayerRaised.value
  )
})

const activeCompanyId = computed(() => {
  return String(route.params.empresaId || "")
})

const currentUserId = computed(() => {
  return currentUser.value?.id || ""
})

const isActivosContext = computed(() => {
  return route.name === "Activos" || route.name === "AppActivos"
})

const { headerCompanies, headerVisibleAssets, searchableUsers, workspaceUsers } =
  useAppHeaderAccessScope({
    activeCompanyId,
    accessibleCompanies,
    companyRecords,
    visibleAssets,
    users,
    accesses,
    applications,
    canAccessFunction,
    isPlatformAdmin,
  })

const showPersonalViewsControl = computed(() => {
  return Boolean(
    currentUser.value &&
    isActivosContext.value &&
    activeCompanyId.value &&
    canAccessFunction("gps", activeCompanyId.value, "view"),
  )
})

const showWorkspacesControl = computed(() => {
  return Boolean(currentUser.value)
})

const showSecondaryHeaderControls = computed(() => {
  return showWorkspacesControl.value || showPersonalViewsControl.value
})

const cityAssetGroups = computed(() => {
  return createCityAssetGroups(headerVisibleAssets.value)
})

const { selectedCityAssetGroupId, selectCityAssetGroup } = useAssetCityFilter({
  userId: currentUserId,
  companyId: activeCompanyId,
  availableActivos: headerVisibleAssets,
  cityGroups: cityAssetGroups,
})

const findCompanyById = (companies = [], companyId) => {
  const normalizedCompanyId = normalizeId(companyId)

  if (!normalizedCompanyId) return null

  return (
    companies.find((company) => {
      return normalizeId(company?.id) === normalizedCompanyId
    }) || null
  )
}

const activeHeaderCompany = computed(() => {
  if (!activeCompanyId.value) return null

  return (
    findCompanyById(companyRecords.value, activeCompanyId.value) ||
    findCompanyById(accessibleCompanies.value, activeCompanyId.value)
  )
})

const {
  managedVehicleGroups,
  createVehicleAssetGroup,
  updateVehicleAssetGroup,
  deleteVehicleAssetGroup,
} = useAssetVehicleGroupManagement({
  contextId: activeCompanyId,
  availableActivos: headerVisibleAssets,
})

const vehicleAssetGroups = computed(() => {
  return createVehicleAssetGroups({
    assets: headerVisibleAssets.value,
    groups: managedVehicleGroups.value,
  })
})

const { selectedVehicleAssetGroupId, selectVehicleAssetGroup } = useAssetVehicleGroupFilter({
  userId: currentUserId,
  contextId: activeCompanyId,
  availableActivos: headerVisibleAssets,
  vehicleGroups: vehicleAssetGroups,
})

const canManageVehicleAssetGroups = computed(() => {
  return Boolean(
    showPersonalViewsControl.value &&
    (canAccessFunction("gps", activeCompanyId.value, "edit") ||
      canAccessFunction("gps", activeCompanyId.value, "admin")),
  )
})

const handleCreateVehicleAssetGroup = (payload) => {
  if (!canManageVehicleAssetGroups.value) return

  const createdGroup = createVehicleAssetGroup(payload)

  if (createdGroup?.id) {
    selectVehicleAssetGroup(createVehicleAssetGroupId(createdGroup.id))
  }
}

const handleUpdateVehicleAssetGroup = ({ id, changes } = {}) => {
  if (!canManageVehicleAssetGroups.value) return

  updateVehicleAssetGroup(id, changes)
}

const handleDeleteVehicleAssetGroup = (groupId) => {
  if (!canManageVehicleAssetGroups.value) return

  const deleted = deleteVehicleAssetGroup(groupId)

  if (deleted && normalizeId(selectedVehicleAssetGroupId.value) === normalizeId(groupId)) {
    selectVehicleAssetGroup(null)
  }
}

const activeContextLabel = computed(() => {
  return activeCompanyId.value ? "Empresa actual" : "Vista actual"
})

const activeContextName = computed(() => {
  if (activeCompanyId.value) {
    return activeHeaderCompany.value?.name || activeCompanyId.value
  }

  if (route.name === "CompanyManagement" || route.name === "AppCompanyManagement") {
    return "Gestión de empresas"
  }
  if (route.name === "UserManagement" || route.name === "AppUserManagement") {
    return "Gestión de usuarios"
  }

  if (route.name === "Audit" || route.name === "AppAudit") {
    return "Auditoria"
  }

  if (route.name === "Maintenance" || route.name === "AppMaintenance") {
    return "Mantenciones"
  }

  return "Selecciona una empresa"
})

const activeWorkspaceViewState = computed(() => {
  const viewState = currentWorkspaceViewState.value

  if (!viewState || viewState.routePath !== route.fullPath) return null

  return viewState
})

const currentWorkspaceRoutePath = computed(() => {
  return route.fullPath || route.path || "/activos"
})

const currentWorkspaceRouteName = computed(() => {
  return activeWorkspaceViewState.value?.routeName || activeContextName.value || "Vista actual"
})

const currentWorkspaceViewSettings = computed(() => {
  return {
    selectedCityAssetGroupId: selectedCityAssetGroupId.value || null,
    selectedVehicleAssetGroupId: selectedVehicleAssetGroupId.value || null,
    ...(activeWorkspaceViewState.value?.settings || {}),
  }
})

const sortComparableValue = (value) => {
  if (Array.isArray(value)) {
    return value.map(sortComparableValue)
  }

  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((sortedValue, key) => {
        return {
          ...sortedValue,
          [key]: sortComparableValue(value[key]),
        }
      }, {})
  }

  return value ?? null
}

const stringifyComparableValue = (value) => {
  return JSON.stringify(sortComparableValue(value))
}

const {
  workspaces,
  activeWorkspaceId,
  activeWorkspace,
  selectWorkspace,
  createWorkspace,
  renameWorkspace,
  shareWorkspace,
  saveCurrentWorkspaceView,
  deleteWorkspace,
} = useWorkspaces({
  userId: currentUserId,
  currentRoutePath: currentWorkspaceRoutePath,
  currentRouteName: currentWorkspaceRouteName,
  currentCompanyId: activeCompanyId,
  currentAssetGroupId: selectedCityAssetGroupId,
  currentViewSettings: currentWorkspaceViewSettings,
})

const getAccessibleCompanyEntryPath = (company) => {
  if (canAccessModule("assets", company.id)) return getCompanyWorkspacePath(company)
  if (canAccessFunction("reports", company.id, "view")) return `/app/${company.id}/reportes`
  if (canAccessFunction("maintenance-view", company.id, "view")) {
    return `/app/${company.id}/mantenciones`
  }
  if (canAccessFunction("audit-view", company.id, "view")) return `/app/${company.id}/auditoria`
  if (canAccessFunction("users-view", company.id, "view")) return `/app/${company.id}/usuarios`

  return getCompanyWorkspacePath(company)
}

const toggleDropdown = () => {
  raiseHeaderLayer()
  showGlobalSearchDropdown.value = false
  showPersonalViewsDropdown.value = false
  showWorkspaceDropdown.value = false
  showDropdown.value = !showDropdown.value
}

function openGlobalSearchDropdown() {
  raiseHeaderLayer()
  showDropdown.value = false
  showPersonalViewsDropdown.value = false
  showWorkspaceDropdown.value = false
  showGlobalSearchDropdown.value = true
}

const closeGlobalSearchDropdown = () => {
  showGlobalSearchDropdown.value = false
}

const closeUserDropdown = () => {
  showDropdown.value = false
}

const openWorkspaceDropdown = () => {
  raiseHeaderLayer()
  showDropdown.value = false
  showGlobalSearchDropdown.value = false
  showPersonalViewsDropdown.value = false
  showWorkspaceDropdown.value = true
}

const closeWorkspaceDropdown = () => {
  showWorkspaceDropdown.value = false
}

const openPersonalViewsDropdown = () => {
  raiseHeaderLayer()
  showDropdown.value = false
  showGlobalSearchDropdown.value = false
  showWorkspaceDropdown.value = false
  showPersonalViewsDropdown.value = true
}

const closePersonalViewsDropdown = () => {
  showPersonalViewsDropdown.value = false
}

const closeAllDropdowns = () => {
  closeGlobalSearchDropdown()
  closeUserDropdown()
  closePersonalViewsDropdown()
  closeWorkspaceDropdown()
}

watch(showPersonalViewsControl, (enabled) => {
  if (!enabled) {
    closePersonalViewsDropdown()
  }
})

const raiseHeaderLayer = () => {
  headerLayerRaised.value = true
}

const releaseHeaderLayer = () => {
  if (
    showDropdown.value ||
    showGlobalSearchDropdown.value ||
    showPersonalViewsDropdown.value ||
    showWorkspaceDropdown.value
  ) {
    return
  }

  headerLayerRaised.value = false
}

const applyWorkspaceAssetGroup = (workspace) => {
  if (!isActivosContext.value) return

  const workspaceCompanyId = normalizeId(workspace?.companyId)
  const currentCompanyId = normalizeId(activeCompanyId.value)

  if (workspaceCompanyId && workspaceCompanyId !== currentCompanyId) return

  selectCityAssetGroup(
    workspace?.viewSettings?.selectedCityAssetGroupId || workspace?.assetGroupId || null,
  )
  selectVehicleAssetGroup(workspace?.viewSettings?.selectedVehicleAssetGroupId || null)
}

const canPersistWorkspace = (workspace) => {
  return normalizeId(workspace?.userId) === normalizeId(currentUserId.value)
}

const buildWorkspaceComparisonSnapshot = (workspace = {}) => {
  return {
    routePath: workspace.routePath || "",
    routeName: workspace.routeName || "",
    companyId: normalizeId(workspace.companyId),
    assetGroupId: normalizeId(workspace.assetGroupId),
    viewSettings: workspace.viewSettings || {},
  }
}

const currentWorkspaceComparisonSnapshot = computed(() => {
  return {
    routePath: currentWorkspaceRoutePath.value,
    routeName: currentWorkspaceRouteName.value,
    companyId: normalizeId(activeCompanyId.value),
    assetGroupId: normalizeId(selectedCityAssetGroupId.value),
    viewSettings: currentWorkspaceViewSettings.value,
  }
})

const hasUnsavedWorkspaceChanges = computed(() => {
  if (!activeWorkspaceViewState.value) return false
  if (!canPersistWorkspace(activeWorkspace.value)) return false

  return (
    stringifyComparableValue(buildWorkspaceComparisonSnapshot(activeWorkspace.value)) !==
    stringifyComparableValue(currentWorkspaceComparisonSnapshot.value)
  )
})

const requestRestoreForWorkspace = (workspace) => {
  if (!workspace?.id) return

  requestWorkspaceViewRestore({
    workspaceId: workspace.id,
    routePath: workspace.routePath || route.fullPath,
    settings: workspace.viewSettings,
  })
}

const handleSelectWorkspace = async (workspaceId) => {
  const workspace = selectWorkspace(workspaceId)

  if (!workspace) return

  closeAllDropdowns()

  const targetPath = workspace.routePath || "/activos"

  if (targetPath && targetPath !== route.fullPath) {
    try {
      await router.push(targetPath)
    } catch {
      return
    }
  }

  applyWorkspaceAssetGroup(workspace)
  requestRestoreForWorkspace(workspace)
}

const handleCreateWorkspace = ({ name, sharedWithUserIds = [] }) => {
  createWorkspace({
    name,
    sharedWithUserIds,
  })
}

const handleRenameWorkspace = ({ workspaceId, name, sharedWithUserIds = [] }) => {
  renameWorkspace(workspaceId, name)
  shareWorkspace(workspaceId, sharedWithUserIds)
}

const handleDeleteWorkspace = (workspaceId) => {
  deleteWorkspace(workspaceId)
}

const handleSaveCurrentWorkspace = () => {
  saveCurrentWorkspaceView()
}

watch(
  () => [activeWorkspaceId.value, route.fullPath],
  () => {
    const workspace = activeWorkspace.value

    if (!workspace?.viewSettings) return

    const targetPath = workspace.routePath || ""

    if (targetPath && targetPath !== route.fullPath) return

    const restoreKey = `${normalizeId(workspace.id)}:${route.fullPath}`

    if (restoreKey === lastAutoRestoredWorkspaceKey) return

    lastAutoRestoredWorkspaceKey = restoreKey
    applyWorkspaceAssetGroup(workspace)
    requestRestoreForWorkspace(workspace)
  },
  {
    immediate: true,
  },
)

const handleClickOutside = (event) => {
  if (!headerRef.value) return

  if (!headerRef.value.contains(event.target)) {
    closeAllDropdowns()
  }
}

const handleKeydown = (event) => {
  if (event.key === "Escape") {
    closeAllDropdowns()
  }
}

const logout = () => {
  logoutSession()
  closeAllDropdowns()
  router.replace("/login")
}
</script>
