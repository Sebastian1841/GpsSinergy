<template>
  <div v-if="enabled" class="relative shrink-0">
    <button
      type="button"
      class="group flex h-10 w-[150px] cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-2.5 text-left text-white transition hover:border-[#ff6600]/50 hover:bg-white/[0.08] min-[1700px]:w-[158px]"
      :class="isOpen ? 'border-[#ff6600]/70 bg-white/[0.1]' : ''"
      @click.stop="toggleOpen"
    >
      <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/10">
        <svg viewBox="0 0 24 24" class="h-3.5 w-3.5 text-[#ff6600]" fill="none" aria-hidden="true">
          <path
            d="M5 6.5h14M5 12h14M5 17.5h9"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
      </span>

      <span class="min-w-0 flex-1">
        <span class="block truncate text-[11px] font-black text-white">
          {{ activeGroupLabel }}
        </span>
        <span class="mt-0.5 block text-[9px] font-black uppercase tracking-[0.1em] text-white/40">
          {{ activeGroupSubtitle }}
        </span>
      </span>
    </button>

    <transition
      enter-active-class="transition duration-160 ease-out"
      enter-from-class="opacity-0 translate-y-1 scale-[0.98]"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-120 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-1 scale-[0.98]"
      @before-enter="$emit('before-open')"
      @before-leave="$emit('before-close')"
      @after-leave="$emit('after-close')"
    >
      <div
        v-show="isOpen"
        class="absolute right-0 top-[46px] z-50 w-[286px] overflow-hidden rounded-xl border border-white/10 bg-[#1b2532]/95 text-white shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl"
        @click.stop
        @pointerdown.stop
      >
        <div class="border-b border-white/10 p-1.5">
          <button
            type="button"
            class="grid w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-2 rounded-lg px-2.5 py-2 text-left transition hover:bg-white/10"
            :class="!selectedGroup ? 'bg-white/10' : ''"
            @click="handleSelectGroup(null)"
          >
            <span
              class="h-2 w-2 rounded-full"
              :class="!selectedGroup ? 'bg-[#ff6600]' : 'bg-white/20'"
            ></span>

            <span class="min-w-0">
              <span class="block truncate text-[11px] font-black text-white">Todos</span>
              <span class="mt-0.5 block text-[9px] font-semibold text-white/40">Sin filtro</span>
            </span>
          </button>

          <div
            class="mt-1 grid grid-cols-2 rounded-lg border border-white/10 bg-white/[0.04] p-0.5"
          >
            <button
              v-for="module in viewModules"
              :key="module.id"
              type="button"
              class="flex h-8 items-center justify-center gap-1.5 rounded-md text-[10px] font-black transition"
              :class="
                activeViewModule === module.id
                  ? 'bg-[#ff6600] text-white'
                  : 'text-white/55 hover:bg-white/10 hover:text-white'
              "
              @click="activeViewModule = module.id"
            >
              <span>{{ module.label }}</span>
              <span
                class="rounded bg-white/10 px-1.5 py-0.5 text-[8px]"
                :class="activeViewModule === module.id ? 'text-white' : 'text-white/45'"
              >
                {{ module.count }}
              </span>
            </button>
          </div>
        </div>

        <div class="max-h-[292px] overflow-auto p-1.5">
          <template v-if="activeViewModule === 'views'">
            <button
              v-for="group in personalGroups"
              :key="group.id"
              type="button"
              class="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-lg px-2.5 py-2 text-left transition hover:bg-white/10"
              :class="normalizeId(selectedGroupId) === normalizeId(group.id) ? 'bg-white/10' : ''"
              @click="handleSelectGroup(group.id)"
            >
              <span
                class="h-2 w-2 rounded-full"
                :class="
                  normalizeId(selectedGroupId) === normalizeId(group.id)
                    ? 'bg-[#ff6600]'
                    : 'bg-white/20'
                "
              ></span>

              <span class="min-w-0">
                <span class="block truncate text-[11px] font-black text-white">
                  {{ getGroupName(group) }}
                </span>
                <span class="mt-0.5 block text-[9px] font-semibold text-white/40">
                  {{ getGroupMeta(group) }}
                </span>
              </span>

              <span class="text-[10px] font-black text-white/25">></span>
            </button>

            <div
              v-if="!personalGroups.length"
              class="flex min-h-[112px] items-center justify-center rounded-lg border border-dashed border-white/10 px-3 py-5 text-center"
            >
              <p class="text-[11px] font-black text-white/70">Sin vistas personales</p>
            </div>
          </template>

          <template v-else>
            <div class="px-1 pb-1">
              <input
                v-model="citySearch"
                type="search"
                autocomplete="off"
                placeholder="Buscar ciudad..."
                class="h-8 w-full rounded-lg border border-white/10 bg-white/[0.06] px-2.5 text-[11px] font-bold text-white outline-none transition placeholder:text-white/35 focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/15"
              />
            </div>

            <button
              v-for="group in filteredCityGroups"
              :key="group.id"
              type="button"
              class="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-lg px-2.5 py-2 text-left transition hover:bg-white/10"
              :class="normalizeId(selectedGroupId) === normalizeId(group.id) ? 'bg-white/10' : ''"
              @click="handleSelectGroup(group.id)"
            >
              <span
                class="h-2 w-2 rounded-full"
                :class="
                  normalizeId(selectedGroupId) === normalizeId(group.id)
                    ? 'bg-[#ff6600]'
                    : 'bg-white/20'
                "
              ></span>

              <span class="min-w-0">
                <span class="block truncate text-[11px] font-black text-white">
                  {{ getGroupName(group) }}
                </span>
                <span class="mt-0.5 block text-[9px] font-semibold text-white/40">
                  {{ getGroupMeta(group) }}
                </span>
              </span>

              <span class="rounded bg-white/10 px-1.5 py-0.5 text-[8px] font-black text-white/45">
                GPS
              </span>
            </button>

            <div
              v-if="!filteredCityGroups.length"
              class="flex min-h-[112px] items-center justify-center rounded-lg border border-dashed border-white/10 px-3 py-5 text-center"
            >
              <p class="text-[11px] font-black text-white/70">Sin ciudades encontradas</p>
            </div>
          </template>
        </div>

        <div
          v-if="activeViewModule === 'views'"
          class="flex items-center justify-between border-t border-white/10 px-2 py-2"
        >
          <button
            type="button"
            class="rounded-md px-2 py-1.5 text-[10px] font-black text-[#ff6600] transition hover:bg-white/10"
            @click="handleCreateClick"
          >
            + Crear
          </button>

          <button
            type="button"
            class="rounded-md px-2 py-1.5 text-[10px] font-black text-white/60 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
            :disabled="!selectedGroup || selectedGroup.readonly"
            @click="handleEditClick"
          >
            Editar
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue"

import { CITY_ASSET_GROUP_TYPE } from "../../utils/activos/assetCityUtils.js"
import { normalizeId } from "../../utils/idUtils.js"

const props = defineProps({
  enabled: {
    type: Boolean,
    default: false,
  },
  isOpen: {
    type: Boolean,
    default: false,
  },
  groups: {
    type: Array,
    default: () => [],
  },
  selectedGroupId: {
    type: [String, Number],
    default: null,
  },
  visibleAssetsCount: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits([
  "open",
  "close",
  "before-open",
  "before-close",
  "after-close",
  "select-group",
  "open-create-modal",
  "open-edit-modal",
])

const activeViewModule = ref("views")
const citySearch = ref("")

const selectedGroup = computed(() => {
  return (
    props.groups.find((group) => {
      return normalizeId(group.id) === normalizeId(props.selectedGroupId)
    }) || null
  )
})

const personalGroups = computed(() => {
  return props.groups.filter((group) => group.type !== CITY_ASSET_GROUP_TYPE)
})

const cityGroups = computed(() => {
  return props.groups.filter((group) => group.type === CITY_ASSET_GROUP_TYPE)
})

const viewModules = computed(() => [
  {
    id: "views",
    label: "Vistas",
    count: personalGroups.value.length,
  },
  {
    id: "cities",
    label: "Ciudades",
    count: cityGroups.value.length,
  },
])

const normalizeSearch = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

const filteredCityGroups = computed(() => {
  const term = normalizeSearch(citySearch.value)

  if (!term) return cityGroups.value

  return cityGroups.value.filter((group) => {
    return normalizeSearch([group.name, group.description].filter(Boolean).join(" ")).includes(term)
  })
})

const activeGroupLabel = computed(() => {
  if (!selectedGroup.value) return "Todos los visibles"

  return getGroupName(selectedGroup.value)
})

const activeGroupSubtitle = computed(() => {
  if (selectedGroup.value?.type === CITY_ASSET_GROUP_TYPE) return "Por ciudad"

  return "Mis vistas"
})

watch(
  () => props.isOpen,
  (isOpen) => {
    if (!isOpen) return

    activeViewModule.value =
      selectedGroup.value?.type === CITY_ASSET_GROUP_TYPE ? "cities" : "views"
  },
)

const toggleOpen = () => {
  emit(props.isOpen ? "close" : "open")
}

const handleSelectGroup = (groupId) => {
  emit("select-group", groupId)
  emit("close")
}

const handleCreateClick = () => {
  emit("close")
  emit("open-create-modal")
}

const handleEditClick = () => {
  if (!selectedGroup.value || selectedGroup.value.readonly) return

  emit("close")
  emit("open-edit-modal", selectedGroup.value.id)
}

const getGroupAssetCount = (group) => {
  return (group.assetIds || []).length
}

const getGroupName = (group) => {
  if (group.type === CITY_ASSET_GROUP_TYPE) {
    return String(group.name || "").replace(/^Ciudad:\s*/i, "")
  }

  return group.name
}

const getGroupMeta = (group) => {
  const assetCount = getGroupAssetCount(group)

  if (group.type === CITY_ASSET_GROUP_TYPE) {
    return `${assetCount} activos por GPS`
  }

  return `${assetCount} activos`
}
</script>
