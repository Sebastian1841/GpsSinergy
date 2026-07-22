<template>
  <div class="shrink-0 border-b border-[#d8dee8] bg-white px-3 py-3">
    <div class="rounded-xl border border-[#d8dee8] bg-[#f8fafc] px-1 pt-1">
      <div
        class="fleet-tabs-scrollbar flex min-w-0 flex-nowrap items-end gap-1 overflow-x-auto overflow-y-hidden"
        @wheel.prevent="handleTabsWheel"
      >
        <button
          v-for="section in orderedSections"
          :key="section.key"
          type="button"
          draggable="true"
          class="group flex h-9 min-w-[72px] max-w-[150px] flex-1 basis-0 shrink cursor-grab items-center justify-center gap-1.5 overflow-hidden rounded-t-lg border border-b-0 px-2 text-[10px] font-black transition active:cursor-grabbing"
          :class="[
            activeSection === section.key
              ? 'translate-y-px border-[#102372] bg-[#102372] text-white shadow-sm'
              : 'border-transparent bg-transparent text-[#102372] hover:bg-white hover:text-[#FF6600]',
            dragOverSectionKey === section.key && draggedSectionKey !== section.key
              ? 'ring-2 ring-[#FF6600]/30'
              : '',
          ]"
          @click="selectSection(section.key)"
          @dragstart="startTabReorder($event, section.key)"
          @dragover="dragOverTab($event, section.key)"
          @drop="dropTab($event, section.key)"
          @dragend="endTabReorder"
        >
          <svg viewBox="0 0 24 24" class="h-3.5 w-3.5 shrink-0" fill="none" aria-hidden="true">
            <path
              v-if="section.key === 'activos'"
              d="M4.75 16.5h14.5M6.75 16.5l1.15-5.75A2.25 2.25 0 0 1 10.1 9h3.8a2.25 2.25 0 0 1 2.2 1.75l1.15 5.75M7.25 16.5v1.25M16.75 16.5v1.25M9 12.25h6"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />

            <path
              v-else-if="section.key === 'reportes'"
              d="M4 19V5m0 14h16M8 15v-4m4 4V7m4 8V9"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />

            <path
              v-else-if="section.key === 'itinerarios'"
              d="M6.5 6.75h.01M17.5 17.25h.01M8.75 6.75h3.1c2.35 0 4.25 1.9 4.25 4.25s-1.9 4.25-4.25 4.25H10.5M6.5 4.5a2.25 2.25 0 1 1 0 4.5 2.25 2.25 0 0 1 0-4.5ZM17.5 15a2.25 2.25 0 1 1 0 4.5 2.25 2.25 0 0 1 0-4.5Z"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />

            <path
              v-else-if="section.key === 'geocercas'"
              d="M12 21s7-4.6 7-11.25A7 7 0 0 0 5 9.75C5 16.4 12 21 12 21ZM12 12.25a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />

            <path
              v-else
              d="M4 20V8l8-4 8 4v12M8 20v-6h8v6M9 10h.01M15 10h.01"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>

          <span class="min-w-0 truncate whitespace-nowrap">
            {{ section.label }}
          </span>

          <span
            v-if="section.count !== null"
            class="shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-black"
            :class="
              activeSection === section.key
                ? 'bg-white/15 text-white'
                : 'bg-[#102372]/10 text-[#102372] group-hover:bg-[#FF6600]/10 group-hover:text-[#FF6600]'
            "
          >
            {{ section.count }}
          </span>
        </button>
      </div>
    </div>

    <div v-if="showSearchActions" class="mt-3 flex items-center gap-2">
      <div class="relative min-w-0 flex-1">
        <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
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
          :value="search"
          type="text"
          :placeholder="searchPlaceholder"
          class="h-[36px] w-full rounded-lg border border-[#d8dee8] bg-white pl-9 pr-8 text-[12px] font-semibold text-[#172033] outline-none placeholder:text-slate-400 focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10"
          @input="$emit('search-input', $event)"
        />

        <button
          v-if="search"
          type="button"
          class="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-base leading-none text-slate-400 transition hover:text-[#FF6600]"
          @click="$emit('clear-search')"
        >
          &times;
        </button>
      </div>

      <button
        v-if="activeSection === 'activos' && sortColumnKey"
        type="button"
        class="flex h-[36px] shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[#FF6600]/30 bg-[#fff7ed] px-3 text-[10px] font-black text-[#FF6600] transition hover:border-[#FF6600] hover:bg-white"
        title="Limpiar ordenamiento"
        @click="$emit('clear-sort')"
      >
        Limpiar orden
      </button>

      <button
        v-if="activeSection === 'activos' && canCreateAssets"
        type="button"
        class="flex h-[36px] shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[#102372]/20 bg-[#102372] px-3 text-[10px] font-black text-white shadow-sm transition hover:border-[#FF6600] hover:bg-[#0c1b59]"
        title="Agregar activo"
        @click="$emit('open-add-activo')"
      >
        <svg viewBox="0 0 24 24" class="h-4 w-4 shrink-0" fill="none" aria-hidden="true">
          <path
            d="M12 5v14M5 12h14"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
          />
        </svg>

        <span class="whitespace-nowrap"> Agregar activo </span>
      </button>

      <ColumnVisibilityMenu
        v-if="activeSection === 'activos'"
        :is-open="showColumns"
        :visible-columns="visibleColumns"
        :configurable-columns="configurableColumns"
        :filtered-configurable-columns="filteredConfigurableColumns"
        :visible-column-keys="visibleColumnKeys"
        :search="columnSearch"
        @toggle="$emit('toggle-columns')"
        @reset="$emit('reset-columns')"
        @update-search="$emit('update-column-search', $event)"
        @toggle-column="$emit('toggle-column-key', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue"
import ColumnVisibilityMenu from "../../ui/ColumnVisibilityMenu.vue"

const props = defineProps({
  activeSection: {
    type: String,
    required: true,
  },
  sections: {
    type: Array,
    default: () => [],
  },
  search: {
    type: String,
    default: "",
  },
  searchPlaceholder: {
    type: String,
    default: "",
  },
  sortColumnKey: {
    type: String,
    default: null,
  },
  canCreateAssets: {
    type: Boolean,
    default: false,
  },
  showColumns: {
    type: Boolean,
    default: false,
  },
  visibleColumns: {
    type: Array,
    default: () => [],
  },
  configurableColumns: {
    type: Array,
    default: () => [],
  },
  filteredConfigurableColumns: {
    type: Array,
    default: () => [],
  },
  visibleColumnKeys: {
    type: Array,
    default: () => [],
  },
  columnSearch: {
    type: String,
    default: "",
  },
})

const emit = defineEmits([
  "set-section",
  "search-input",
  "clear-search",
  "clear-sort",
  "open-add-activo",
  "toggle-columns",
  "reset-columns",
  "update-column-search",
  "toggle-column-key",
])

const sectionOrder = ref([])
const draggedSectionKey = ref(null)
const dragOverSectionKey = ref(null)
const hasReorderedTabs = ref(false)

watch(
  () => props.sections.map((section) => section.key).join("|"),
  () => {
    const sectionKeys = props.sections.map((section) => section.key)

    sectionOrder.value = [
      ...sectionOrder.value.filter((key) => sectionKeys.includes(key)),
      ...sectionKeys.filter((key) => !sectionOrder.value.includes(key)),
    ]
  },
  { immediate: true },
)

const orderedSections = computed(() => {
  const sectionMap = new Map(props.sections.map((section) => [section.key, section]))

  return sectionOrder.value.map((key) => sectionMap.get(key)).filter(Boolean)
})

const showSearchActions = computed(() => {
  return !["itinerarios", "sucursales"].includes(props.activeSection)
})

const reorderSections = (fromKey, toKey) => {
  if (!fromKey || !toKey || fromKey === toKey) return false

  const nextOrder = [...sectionOrder.value]
  const fromIndex = nextOrder.indexOf(fromKey)
  const toIndex = nextOrder.indexOf(toKey)

  if (fromIndex < 0 || toIndex < 0) return false

  nextOrder.splice(fromIndex, 1)
  nextOrder.splice(toIndex, 0, fromKey)

  sectionOrder.value = nextOrder

  return true
}

const startTabReorder = (event, sectionKey) => {
  draggedSectionKey.value = sectionKey
  dragOverSectionKey.value = null
  hasReorderedTabs.value = false

  event.dataTransfer.effectAllowed = "move"
  event.dataTransfer.setData("text/plain", sectionKey)
}

const dragOverTab = (event, sectionKey) => {
  if (!draggedSectionKey.value || draggedSectionKey.value === sectionKey) return

  event.preventDefault()

  dragOverSectionKey.value = sectionKey
  event.dataTransfer.dropEffect = "move"
}

const dropTab = (event, sectionKey) => {
  event.preventDefault()

  const fromKey = event.dataTransfer.getData("text/plain") || draggedSectionKey.value
  const wasReordered = reorderSections(fromKey, sectionKey)

  hasReorderedTabs.value = wasReordered

  endTabReorder()
}

const endTabReorder = () => {
  draggedSectionKey.value = null
  dragOverSectionKey.value = null

  window.setTimeout(() => {
    hasReorderedTabs.value = false
  }, 120)
}

const selectSection = (sectionKey) => {
  if (hasReorderedTabs.value) return

  emit("set-section", sectionKey)
}

const handleTabsWheel = (event) => {
  const scroller = event.currentTarget

  if (!scroller) return

  scroller.scrollLeft += event.deltaY || event.deltaX
}
</script>

<style scoped>
.fleet-tabs-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.fleet-tabs-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>
