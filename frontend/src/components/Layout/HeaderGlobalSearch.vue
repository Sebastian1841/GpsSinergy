<template>
  <div v-if="enabled">
    <form class="relative" @submit.prevent="openFirstGlobalSearchResult">
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
        v-model="globalSearchQuery"
        type="search"
        autocomplete="off"
        :placeholder="globalSearchPlaceholder"
        class="h-10 w-full rounded-xl border border-white/10 bg-white/[0.06] pl-9 pr-20 text-sm font-semibold text-white outline-none transition placeholder:text-white/40 focus:border-[#ff6600] focus:bg-white/[0.09] focus:ring-2 focus:ring-[#ff6600]/20"
        @focus="openDropdown"
        @input="openDropdown"
      />

      <button
        v-if="globalSearchQuery"
        type="button"
        class="absolute right-[70px] top-1/2 -translate-y-1/2 rounded-md px-1.5 py-0.5 text-[15px] leading-none text-white/45 transition hover:bg-white/10 hover:text-white"
        aria-label="Limpiar busqueda"
        @click="clearGlobalSearch"
      >
        x
      </button>

      <button
        type="submit"
        class="absolute right-1.5 top-1/2 h-7 w-16 -translate-y-1/2 rounded-lg bg-[#ff6600] text-[10px] font-black text-white transition hover:bg-[#e65c00] disabled:cursor-not-allowed disabled:opacity-45"
        :disabled="!firstGlobalSearchResult"
      >
        Abrir
      </button>
    </form>

    <transition
      enter-active-class="transition duration-160 ease-out"
      enter-from-class="opacity-0 translate-y-1 scale-[0.98]"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-120 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-1 scale-[0.98]"
      @before-enter="emit('before-open')"
      @before-leave="emit('before-close')"
      @after-leave="emit('after-close')"
    >
      <div
        v-show="isOpen"
        class="absolute left-0 right-0 top-[46px] z-50 overflow-hidden rounded-xl border border-white/10 bg-[#1b2532]/95 text-white shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl"
        @click.stop
        @pointerdown.stop
      >
        <div class="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-2">
          <div class="min-w-0">
            <p class="text-[10px] font-black uppercase tracking-[0.16em] text-white/45">
              Busqueda global
            </p>
            <span class="text-[10px] font-black text-[#ff6600]">
              {{ globalSearchResults.length }} resultados
            </span>
          </div>

          <button
            type="button"
            class="shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-black text-white transition hover:brightness-95 active:scale-95"
            style="
              border: 1px solid #ff6600 !important;
              background-color: #ff6600 !important;
              color: #ffffff !important;
              box-shadow: 0 8px 20px rgba(255, 102, 0, 0.28);
            "
            @click="closeSearchPanel"
          >
            Cerrar
          </button>
        </div>

        <div class="border-b border-white/10 px-2 py-2">
          <div class="flex gap-1 overflow-x-auto">
            <button
              v-for="typeOption in globalSearchTypeOptions"
              :key="typeOption.value"
              type="button"
              class="shrink-0 rounded-lg border px-2.5 py-1 text-[10px] font-black transition"
              :class="
                globalSearchType === typeOption.value
                  ? 'border-[#ff6600] bg-[#ff6600] text-white shadow-[0_8px_18px_rgba(255,102,0,0.24)]'
                  : 'border-white/10 bg-white/[0.04] text-white/55 hover:border-white/20 hover:bg-white/[0.08] hover:text-white'
              "
              @click="selectGlobalSearchType(typeOption.value)"
            >
              {{ typeOption.label }}
            </button>
          </div>
        </div>

        <div class="max-h-[330px] overflow-auto p-2">
          <button
            v-for="result in displayedGlobalSearchResults"
            :key="result.id"
            type="button"
            class="group grid w-full grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-white/10"
            :class="isActiveCompany(result) ? 'bg-[#ff6600]/15' : ''"
            @click="openGlobalSearchResult(result)"
          >
            <span
              class="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-[10px] font-black text-white group-hover:bg-[#ff6600]"
            >
              {{ getGlobalSearchResultInitial(result) }}
            </span>

            <span class="min-w-0">
              <span class="block truncate text-[12px] font-black text-white">
                {{ result.title || result.name }}
              </span>
              <span class="mt-0.5 block truncate text-[10px] font-semibold text-white/50">
                {{ result.subtitle || result.meta || "Sin detalle" }}
              </span>
            </span>

            <span
              class="shrink-0 rounded-md border border-white/10 px-2 py-1 text-[9px] font-black text-white/65 group-hover:border-[#ff6600]/40 group-hover:text-white"
            >
              {{ result.typeLabel || getCompanyStatusLabel(result.status) }}
            </span>
          </button>

          <div v-if="!displayedGlobalSearchResults.length" class="px-3 py-7 text-center">
            <p class="text-[12px] font-black text-white">Sin resultados</p>
            <p class="mt-1 text-[10px] font-semibold text-white/45">
              {{ globalSearchEmptyMessage }}
            </p>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed } from "vue"
import { useRouter } from "vue-router"

import {
  globalSearchTypeOptions,
  useAppHeaderGlobalSearchState,
} from "../../composables/layout/useAppHeaderGlobalSearchState.js"
import { useGlobalSearch } from "../../composables/search/useGlobalSearch.js"
import { getCompanyInitials, getCompanyStatusLabel } from "../../utils/companies/companyUtils.js"

const props = defineProps({
  enabled: {
    type: Boolean,
    default: false,
  },
  isOpen: {
    type: Boolean,
    default: false,
  },
  activeCompanyId: {
    type: [String, Number],
    default: "",
  },
  auditRecords: {
    type: Array,
    default: () => [],
  },
  canAccessFunction: {
    type: Function,
    default: null,
  },
  canAccessModule: {
    type: Function,
    default: null,
  },
  companies: {
    type: Array,
    default: () => [],
  },
  getAccessibleCompanyEntryPath: {
    type: Function,
    default: null,
  },
  reportTypes: {
    type: Array,
    default: () => [],
  },
  users: {
    type: Array,
    default: () => [],
  },
  visibleAssets: {
    type: Array,
    default: () => [],
  },
  workspaces: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(["open", "close", "before-open", "before-close", "after-close"])

const router = useRouter()

const openDropdown = () => {
  emit("open")
}

const {
  globalSearchType,
  globalSearchQuery,
  debouncedGlobalSearchQuery,
  globalSearchPlaceholder,
  globalSearchEmptyMessage,
  selectGlobalSearchType,
  clearGlobalSearch,
} = useAppHeaderGlobalSearchState({
  openDropdown,
})

const activeCompanyId = computed(() => props.activeCompanyId)
const auditRecords = computed(() => props.auditRecords)
const companies = computed(() => props.companies)
const reportTypes = computed(() => props.reportTypes)
const users = computed(() => props.users)
const visibleAssets = computed(() => props.visibleAssets)
const workspaces = computed(() => props.workspaces)

const canAccessFunction = (...args) => {
  return typeof props.canAccessFunction === "function" ? props.canAccessFunction(...args) : false
}

const canAccessModule = (...args) => {
  return typeof props.canAccessModule === "function" ? props.canAccessModule(...args) : false
}

const getAccessibleCompanyEntryPath = (...args) => {
  return typeof props.getAccessibleCompanyEntryPath === "function"
    ? props.getAccessibleCompanyEntryPath(...args)
    : ""
}

const { firstGlobalSearchResult, globalSearchResults } = useGlobalSearch({
  activeCompanyId,
  auditRecords,
  canAccessFunction,
  canAccessModule,
  companies,
  getAccessibleCompanyEntryPath,
  query: debouncedGlobalSearchQuery,
  reportTypes,
  typeFilter: globalSearchType,
  users,
  visibleAssets,
  workspaces,
})

const displayedGlobalSearchResults = computed(() => {
  return globalSearchResults.value
})

const closeSearchPanel = () => {
  emit("close")

  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }
}

const getGlobalSearchResultInitial = (result) => {
  if (result?.type === "company") {
    return getCompanyInitials(result.title || result.name)
  }

  return String(result?.typeLabel || result?.title || "?")
    .charAt(0)
    .toUpperCase()
}

const openGlobalSearchResult = (result) => {
  if (!result?.path) return

  emit("close")
  router.push(result.path)
}

const openFirstGlobalSearchResult = () => {
  const firstResult = firstGlobalSearchResult.value

  if (firstResult) {
    openGlobalSearchResult(firstResult)
  }
}

const isActiveCompany = (result) => {
  if (result?.type !== "company") return false

  return String(props.activeCompanyId || "") === String(result?.sourceId || result?.id || "")
}
</script>
