<template>
  <header
    ref="headerRef"
    class="relative border-b border-white/10 bg-gradient-to-r from-[#182230] via-[#1f2937] to-[#182230] shadow-[0_8px_30px_rgba(0,0,0,0.18)]"
    :class="showAnyDropdown ? 'z-[780]' : 'z-30'"
  >
    <div
      class="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-[#ff6600]/70 to-transparent"
    ></div>

    <div class="flex items-center justify-between gap-4 px-4 py-2.5">
      <div class="flex min-w-0 items-center gap-3">
        <button
          class="inline-flex h-10 w-10 items-center justify-center rounded-xl text-white transition-all duration-200 hover:bg-white/10 active:scale-95"
          aria-label="Abrir menú"
          type="button"
          @click="emit('toggle-sidebar')"
        >
          <span class="text-2xl leading-none">☰</span>
        </button>

        <div
          class="relative flex h-[56px] w-[168px] shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm"
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

        <div class="hidden min-w-0 border-l border-white/10 pl-3 sm:block">
          <p class="text-[9px] font-black uppercase tracking-[0.18em] text-white/40">
            {{ activeContextLabel }}
          </p>
          <p class="mt-0.5 max-w-[220px] truncate text-[13px] font-black text-white">
            {{ activeContextName }}
          </p>
        </div>
      </div>

      <div
        v-if="currentUser"
        class="relative z-40 hidden min-w-[260px] max-w-[560px] flex-1 md:block"
      >
        <form class="relative" @submit.prevent="enterFirstCompanyResult">
          <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/45">
            <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" aria-hidden="true">
              <path
                d="m20 20-4.35-4.35M18 10.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          </span>

          <input
            v-model="companySearch"
            type="search"
            autocomplete="off"
            placeholder="Buscar empresa para entrar..."
            class="h-10 w-full rounded-xl border border-white/10 bg-white/[0.06] pl-9 pr-24 text-sm font-semibold text-white outline-none transition placeholder:text-white/40 focus:border-[#ff6600] focus:bg-white/[0.09] focus:ring-2 focus:ring-[#ff6600]/20"
            @focus="openCompanyDropdown"
            @input="openCompanyDropdown"
          />

          <button
            v-if="companySearch"
            type="button"
            class="absolute right-[72px] top-1/2 -translate-y-1/2 rounded-md px-1.5 py-0.5 text-[15px] leading-none text-white/45 transition hover:bg-white/10 hover:text-white"
            aria-label="Limpiar busqueda"
            @click="clearCompanySearch"
          >
            ×
          </button>

          <button
            type="submit"
            class="absolute right-1.5 top-1/2 h-7 -translate-y-1/2 rounded-lg bg-[#ff6600] px-3 text-[10px] font-black text-white transition hover:bg-[#e65c00] disabled:cursor-not-allowed disabled:opacity-45"
            :disabled="!filteredHeaderCompanies.length"
          >
            Entrar
          </button>
        </form>

        <transition
          enter-active-class="transition duration-160 ease-out"
          enter-from-class="opacity-0 translate-y-1 scale-[0.98]"
          enter-to-class="opacity-100 translate-y-0 scale-100"
          leave-active-class="transition duration-120 ease-in"
          leave-from-class="opacity-100 translate-y-0 scale-100"
          leave-to-class="opacity-0 translate-y-1 scale-[0.98]"
          @before-enter="raiseHeaderLayer"
          @before-leave="raiseHeaderLayer"
          @after-leave="releaseHeaderLayer"
        >
          <div
            v-show="showCompanyDropdown"
            class="absolute left-0 right-0 top-[46px] z-50 overflow-hidden rounded-xl border border-white/10 bg-[#1b2532]/95 text-white shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl"
            @click.stop
            @pointerdown.stop
          >
            <div class="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-2">
              <p class="text-[10px] font-black uppercase tracking-[0.16em] text-white/45">
                Empresas
              </p>
              <span class="text-[10px] font-black text-[#ff6600]">
                {{ filteredHeaderCompanies.length }} mostradas
              </span>
            </div>

            <div class="max-h-[330px] overflow-auto p-2">
              <button
                v-for="company in filteredHeaderCompanies"
                :key="company.id"
                type="button"
                class="group grid w-full grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-white/10"
                :class="isActiveCompany(company) ? 'bg-[#ff6600]/15' : ''"
                @click="enterCompany(company)"
              >
                <span
                  class="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-[10px] font-black text-white group-hover:bg-[#ff6600]"
                >
                  {{ getCompanyInitials(company.name) }}
                </span>

                <span class="min-w-0">
                  <span class="block truncate text-[12px] font-black text-white">
                    {{ company.name }}
                  </span>
                  <span class="mt-0.5 block truncate text-[10px] font-semibold text-white/50">
                    {{ company.rut || "Sin RUT" }} · {{ company.assetsCount || 0 }} activos
                  </span>
                </span>

                <span
                  class="shrink-0 rounded-md border border-white/10 px-2 py-1 text-[9px] font-black text-white/65 group-hover:border-[#ff6600]/40 group-hover:text-white"
                >
                  {{ getCompanyStatusLabel(company.status) }}
                </span>
              </button>

              <div v-if="!filteredHeaderCompanies.length" class="px-3 py-7 text-center">
                <p class="text-[12px] font-black text-white">Sin empresas encontradas</p>
                <p class="mt-1 text-[10px] font-semibold text-white/45">
                  Prueba por nombre, RUT, ciudad o sucursal.
                </p>
              </div>
            </div>
          </div>
        </transition>
      </div>

      <HeaderPersonalAssetGroupsMenu
        class="hidden md:block"
        :enabled="showPersonalViewsControl"
        :is-open="showPersonalViewsDropdown"
        :groups="personalAssetGroups"
        :selected-group-id="selectedPersonalAssetGroupId"
        :visible-assets-count="headerVisibleAssets.length"
        @open="openPersonalViewsDropdown"
        @close="closePersonalViewsDropdown"
        @before-open="raiseHeaderLayer"
        @before-close="raiseHeaderLayer"
        @after-close="releaseHeaderLayer"
        @select-group="selectPersonalAssetGroup"
        @open-create-modal="openCreatePersonalViewModal"
        @open-edit-modal="openEditPersonalViewModal"
      />

      <div v-if="currentUser" class="relative z-40 shrink-0">
        <button
          class="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-white backdrop-blur-sm transition-all duration-200 hover:border-white/20 hover:bg-white/[0.08]"
          aria-label="Abrir menú de usuario"
          type="button"
          @click="toggleDropdown"
        >
          <div
            class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#ff6600] to-[#ff8c42] text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.20)]"
          >
            {{ userInitial }}
          </div>

          <div class="flex flex-col items-start leading-tight">
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
        class="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-gray-300 backdrop-blur-sm"
      >
        Invitado
      </div>
    </div>
  </header>

  <PersonalAssetGroupModal
    v-model="showPersonalViewModal"
    :mode="personalViewModalMode"
    :group="editingPersonalAssetGroup"
    :assets="headerVisibleAssets"
    @create-group="handleCreatePersonalAssetGroup"
    @update-group="handleUpdatePersonalAssetGroup"
    @delete-group="handleDeletePersonalAssetGroup"
  />
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useAccessControl } from "../../composables/auth/useAccessControl.js"
import { useAuthSession } from "../../composables/auth/useAuthSession.js"
import { usePersonalAssetGroups } from "../../composables/activos/fleet/usePersonalAssetGroups.js"
import { useMockDatabase } from "../../composables/mock/useMockDatabase.js"
import {
  getCompanyInitials,
  getCompanyStatusLabel,
  getCompanyWorkspacePath,
} from "../../utils/companies/companyUtils.js"
import { normalizeId } from "../../utils/idUtils.js"
import HeaderPersonalAssetGroupsMenu from "./HeaderPersonalAssetGroupsMenu.vue"
import PersonalAssetGroupModal from "./PersonalAssetGroupModal.vue"
import SvgIcon from "../icons/SvgIcon.vue"

const emit = defineEmits(["toggle-sidebar"])

const HEADER_COMPANY_RESULT_LIMIT = 50
const HEADER_COMPANY_SEARCH_DEBOUNCE_MS = 150

const router = useRouter()
const route = useRoute()
const { currentUser, currentRole, logout: logoutSession } = useAuthSession()
const { accessibleCompanies, visibleAssets, canAccessFunction } = useAccessControl()
const { companyRecords } = useMockDatabase()

const showDropdown = ref(false)
const showCompanyDropdown = ref(false)
const showPersonalViewsDropdown = ref(false)
const showPersonalViewModal = ref(false)
const personalViewModalMode = ref("create")
const editingPersonalAssetGroupId = ref(null)
const headerLayerRaised = ref(false)
const companySearch = ref("")
const debouncedCompanySearch = ref("")
const headerRef = ref(null)

let companySearchTimer = null

watch(companySearch, (value) => {
  if (companySearchTimer) {
    clearTimeout(companySearchTimer)
  }

  companySearchTimer = setTimeout(() => {
    debouncedCompanySearch.value = value
  }, HEADER_COMPANY_SEARCH_DEBOUNCE_MS)
})

onMounted(() => {
  document.addEventListener("click", handleClickOutside)
  document.addEventListener("keydown", handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside)
  document.removeEventListener("keydown", handleKeydown)

  if (companySearchTimer) {
    clearTimeout(companySearchTimer)
  }
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
    showCompanyDropdown.value ||
    showPersonalViewsDropdown.value ||
    headerLayerRaised.value
  )
})

const accessibleCompanyIds = computed(() => {
  return new Set(accessibleCompanies.value.map((company) => String(company.id)))
})

const headerCompanies = computed(() => {
  return companyRecords.value
    .filter((company) => accessibleCompanyIds.value.has(String(company.id)))
    .sort((firstCompany, secondCompany) => {
      return String(firstCompany.name || "").localeCompare(String(secondCompany.name || ""), "es")
    })
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

const headerVisibleAssets = computed(() => {
  if (!activeCompanyId.value) return []

  return visibleAssets.value.filter((asset) => {
    return String(asset.companyId) === activeCompanyId.value
  })
})

const showPersonalViewsControl = computed(() => {
  return Boolean(
    currentUser.value &&
    isActivosContext.value &&
    activeCompanyId.value &&
    canAccessFunction("gps", activeCompanyId.value, "view"),
  )
})

const {
  personalAssetGroups,
  selectedPersonalAssetGroupId,
  selectPersonalAssetGroup,
  createPersonalAssetGroup,
  renamePersonalAssetGroup,
  setPersonalAssetGroupAssets,
  deletePersonalAssetGroup,
} = usePersonalAssetGroups({
  userId: currentUserId,
  companyId: activeCompanyId,
  availableActivos: headerVisibleAssets,
})

const editingPersonalAssetGroup = computed(() => {
  const groupId = normalizeId(editingPersonalAssetGroupId.value)

  if (!groupId) return null

  return (
    personalAssetGroups.value.find((group) => {
      return normalizeId(group.id) === groupId
    }) || null
  )
})

const activeHeaderCompany = computed(() => {
  if (!activeCompanyId.value) return null

  return companyRecords.value.find((company) => {
    return String(company.id) === activeCompanyId.value
  })
})

const activeContextLabel = computed(() => {
  return activeHeaderCompany.value ? "Empresa actual" : "Vista actual"
})

const activeContextName = computed(() => {
  if (activeHeaderCompany.value) return activeHeaderCompany.value.name
  if (route.name === "CompanyManagement" || route.name === "AppCompanyManagement") {
    return "Gestion de empresas"
  }
  if (route.name === "UserManagement" || route.name === "AppUserManagement") {
    return "Gestion de usuarios"
  }

  return "Selecciona una empresa"
})

const normalizeCompanySearch = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

const getCompanySearchText = (company) => {
  return normalizeCompanySearch(
    [
      company.name,
      company.rut,
      company.city,
      company.region,
      company.contactName,
      company.contactEmail,
      ...(company.sucursales || []).map((sucursal) => sucursal.name),
    ]
      .filter(Boolean)
      .join(" "),
  )
}

const filteredHeaderCompanies = computed(() => {
  const term = normalizeCompanySearch(debouncedCompanySearch.value)
  const results = []

  for (const company of headerCompanies.value) {
    if (!term || getCompanySearchText(company).includes(term)) {
      results.push(company)
    }

    if (results.length >= HEADER_COMPANY_RESULT_LIMIT) {
      break
    }
  }

  return results
})

const toggleDropdown = () => {
  raiseHeaderLayer()
  showCompanyDropdown.value = false
  showPersonalViewsDropdown.value = false
  showDropdown.value = !showDropdown.value
}

const openCompanyDropdown = () => {
  raiseHeaderLayer()
  showDropdown.value = false
  showPersonalViewsDropdown.value = false
  showCompanyDropdown.value = true
}

const closeCompanyDropdown = () => {
  showCompanyDropdown.value = false
}

const closeUserDropdown = () => {
  showDropdown.value = false
}

const openPersonalViewsDropdown = () => {
  raiseHeaderLayer()
  showDropdown.value = false
  showCompanyDropdown.value = false
  showPersonalViewsDropdown.value = true
}

const closePersonalViewsDropdown = () => {
  showPersonalViewsDropdown.value = false
}

const closeAllDropdowns = () => {
  closeCompanyDropdown()
  closeUserDropdown()
  closePersonalViewsDropdown()
}

watch(showPersonalViewsControl, (enabled) => {
  if (!enabled) {
    closePersonalViewsDropdown()
    showPersonalViewModal.value = false
  }
})

const raiseHeaderLayer = () => {
  headerLayerRaised.value = true
}

const releaseHeaderLayer = () => {
  if (showDropdown.value || showCompanyDropdown.value || showPersonalViewsDropdown.value) return

  headerLayerRaised.value = false
}

const clearCompanySearch = () => {
  if (companySearchTimer) {
    clearTimeout(companySearchTimer)
  }

  companySearch.value = ""
  debouncedCompanySearch.value = ""
  openCompanyDropdown()
}

const enterCompany = (company) => {
  if (!company?.id) return

  closeAllDropdowns()
  router.push(getCompanyWorkspacePath(company))
}

const enterFirstCompanyResult = () => {
  const firstCompany = filteredHeaderCompanies.value[0]

  if (firstCompany) {
    enterCompany(firstCompany)
  }
}

const isActiveCompany = (company) => {
  return String(route.params.empresaId || "") === String(company?.id || "")
}

const openCreatePersonalViewModal = () => {
  closeAllDropdowns()
  personalViewModalMode.value = "create"
  editingPersonalAssetGroupId.value = null
  showPersonalViewModal.value = true
}

const openEditPersonalViewModal = (groupId = selectedPersonalAssetGroupId.value) => {
  const normalizedGroupId = normalizeId(groupId)
  const groupExists = personalAssetGroups.value.some((group) => {
    return normalizeId(group.id) === normalizedGroupId
  })

  if (!groupExists) return

  closeAllDropdowns()
  personalViewModalMode.value = "edit"
  editingPersonalAssetGroupId.value = normalizedGroupId
  showPersonalViewModal.value = true
}

const handleCreatePersonalAssetGroup = ({ name, assetIds }) => {
  const group = createPersonalAssetGroup(name, assetIds)

  if (group?.id) {
    selectPersonalAssetGroup(group.id)
  }
}

const handleUpdatePersonalAssetGroup = ({ groupId, name, assetIds }) => {
  renamePersonalAssetGroup(groupId, name)
  setPersonalAssetGroupAssets(groupId, assetIds)
  selectPersonalAssetGroup(groupId)
}

const handleDeletePersonalAssetGroup = (groupId) => {
  deletePersonalAssetGroup(groupId)

  if (normalizeId(editingPersonalAssetGroupId.value) === normalizeId(groupId)) {
    editingPersonalAssetGroupId.value = null
  }
}

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
