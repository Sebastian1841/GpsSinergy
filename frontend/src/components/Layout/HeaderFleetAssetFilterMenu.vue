<template>
  <div v-if="enabled" class="relative shrink-0">
    <button
      type="button"
      class="group flex h-10 w-[164px] cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-2.5 text-left text-white transition hover:border-[#ff6600]/50 hover:bg-white/[0.08] min-[1700px]:w-[178px]"
      :class="isOpen ? 'border-[#ff6600]/70 bg-white/[0.1]' : ''"
      @click.stop="toggleOpen"
    >
      <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/10">
        <svg viewBox="0 0 24 24" class="h-3.5 w-3.5 text-[#ff6600]" fill="none" aria-hidden="true">
          <path
            d="M4.5 7.5h15M7.5 12h9M10 16.5h4M6.5 7.5v9M17.5 7.5v9"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>

      <span class="min-w-0 flex-1">
        <span class="block truncate text-[11px] font-black text-white">
          {{ activeFilterLabel }}
        </span>
        <span class="mt-0.5 block text-[9px] font-black uppercase tracking-[0.1em] text-white/40">
          {{ activeFilterSubtitle }}
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
        class="absolute right-0 top-[46px] z-50 w-[440px] overflow-hidden rounded-xl border border-white/10 bg-[#1b2532]/95 text-white shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl max-[560px]:right-[-92px] max-[560px]:w-[calc(100vw-24px)]"
        @click.stop
        @pointerdown.stop
      >
        <div class="border-b border-white/10 p-2">
          <div class="flex items-center justify-between gap-2">
            <div class="min-w-0">
              <p class="text-[10px] font-black uppercase tracking-[0.14em] text-white/45">
                Filtros de flota
              </p>
              <p class="mt-0.5 text-[10px] font-bold text-white/65">
                {{ visibleAssetsCount }} activos autorizados
              </p>
            </div>

            <div class="grid shrink-0 grid-cols-2 rounded-lg border border-white/10 bg-white/[0.04] p-0.5">
              <button
                type="button"
                class="rounded-md px-2.5 py-1.5 text-[10px] font-black transition"
                :class="activeTab === 'cities' ? activeTabClass : inactiveTabClass"
                @click="activeTab = 'cities'"
              >
                Ciudades
              </button>

              <button
                type="button"
                class="rounded-md px-2.5 py-1.5 text-[10px] font-black transition"
                :class="activeTab === 'groups' ? activeTabClass : inactiveTabClass"
                @click="activeTab = 'groups'"
              >
                Grupos
              </button>
            </div>
          </div>
        </div>

        <section v-show="activeTab === 'cities'" class="p-2">
          <button
            type="button"
            class="grid w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-2 rounded-lg px-2.5 py-2 text-left transition hover:bg-white/10"
            :class="!selectedCityGroup ? 'bg-white/10' : ''"
            @click="handleSelectCity(null)"
          >
            <span
              class="h-2 w-2 rounded-full"
              :class="!selectedCityGroup ? 'bg-[#ff6600]' : 'bg-white/20'"
            ></span>

            <span class="min-w-0">
              <span class="block truncate text-[11px] font-black text-white">
                Todas las ciudades
              </span>
              <span class="mt-0.5 block text-[9px] font-semibold text-white/40">
                No cambia permisos, solo filtra la vista actual.
              </span>
            </span>
          </button>

          <input
            v-model="citySearch"
            type="search"
            autocomplete="off"
            placeholder="Buscar ciudad..."
            class="mt-2 h-8 w-full rounded-lg border border-white/10 bg-white/[0.06] px-2.5 text-[11px] font-bold text-white outline-none transition placeholder:text-white/35 focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/15"
          />

          <div class="mt-2 max-h-[292px] overflow-auto">
            <button
              v-for="group in filteredCityGroups"
              :key="group.id"
              type="button"
              class="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-lg px-2.5 py-2 text-left transition hover:bg-white/10"
              :class="normalizeId(selectedCityGroupId) === normalizeId(group.id) ? 'bg-white/10' : ''"
              @click="handleSelectCity(group.id)"
            >
              <span
                class="h-2 w-2 rounded-full"
                :class="
                  normalizeId(selectedCityGroupId) === normalizeId(group.id)
                    ? 'bg-[#ff6600]'
                    : 'bg-white/20'
                "
              ></span>

              <span class="min-w-0">
                <span class="block truncate text-[11px] font-black text-white">
                  {{ getCityGroupName(group) }}
                </span>
                <span class="mt-0.5 block text-[9px] font-semibold text-white/40">
                  {{ getGroupMeta(group) }}
                </span>
              </span>

              <span class="rounded bg-white/10 px-1.5 py-0.5 text-[8px] font-black text-white/45">
                Ciudad
              </span>
            </button>

            <div
              v-if="!filteredCityGroups.length"
              class="flex min-h-[112px] items-center justify-center rounded-lg border border-dashed border-white/10 px-3 py-5 text-center"
            >
              <p class="text-[11px] font-black text-white/70">Sin ciudades encontradas</p>
            </div>
          </div>
        </section>

        <section v-show="activeTab === 'groups'" class="p-2">
          <div v-if="groupFormVisible" class="rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="text-[10px] font-black uppercase tracking-[0.14em] text-[#ff6600]">
                  {{ editingVehicleGroup ? "Editar grupo" : "Nuevo grupo" }}
                </p>
                <p class="mt-1 text-[10px] font-semibold text-white/45">
                  Organiza vehiculos ya autorizados. No entrega permisos.
                </p>
              </div>

              <button
                type="button"
                class="rounded-lg border border-white/10 px-2 py-1 text-[10px] font-black text-white/55 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
                @click="closeGroupForm"
              >
                Cerrar
              </button>
            </div>

            <div class="mt-3 grid gap-2">
              <label class="grid gap-1">
                <span class="text-[9px] font-black uppercase tracking-[0.12em] text-white/45">
                  Nombre del grupo
                </span>
                <input
                  v-model="groupForm.name"
                  type="text"
                  class="h-9 rounded-lg border border-white/10 bg-[#111827] px-3 text-[12px] font-bold text-white outline-none transition placeholder:text-white/35 focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/15"
                  placeholder="Ej: Camiones, Zona norte..."
                />
              </label>

              <label class="grid gap-1">
                <span class="text-[9px] font-black uppercase tracking-[0.12em] text-white/45">
                  Vehiculos asociados
                </span>
                <input
                  v-model="assetSearch"
                  type="search"
                  class="h-8 rounded-lg border border-white/10 bg-[#111827] px-3 text-[11px] font-bold text-white outline-none transition placeholder:text-white/35 focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/15"
                  placeholder="Buscar patente o vehiculo..."
                />
              </label>

              <div class="flex flex-wrap items-center justify-between gap-2">
                <span class="text-[10px] font-bold text-white/45">
                  {{ groupForm.assetIds.length }} seleccionados
                </span>

                <div class="flex gap-1">
                  <button
                    type="button"
                    class="rounded-lg border border-white/10 px-2 py-1 text-[10px] font-black text-white/60 transition hover:bg-white/10 hover:text-white"
                    @click="selectAllFilteredAssets"
                  >
                    Seleccionar visibles
                  </button>
                  <button
                    type="button"
                    class="rounded-lg border border-white/10 px-2 py-1 text-[10px] font-black text-white/60 transition hover:bg-white/10 hover:text-white"
                    @click="clearSelectedAssets"
                  >
                    Limpiar
                  </button>
                </div>
              </div>

              <div class="max-h-[184px] overflow-auto rounded-lg border border-white/10 bg-[#111827]/70 p-1">
                <label
                  v-for="asset in filteredAvailableAssets"
                  :key="asset.id"
                  class="grid cursor-pointer grid-cols-[auto_minmax(0,1fr)] items-center gap-2 rounded-md px-2 py-1.5 transition hover:bg-white/10"
                >
                  <input
                    type="checkbox"
                    class="h-4 w-4 rounded border-white/20 bg-white/10 accent-[#ff6600]"
                    :checked="isAssetSelected(asset.id)"
                    @change="toggleAssetSelection(asset.id)"
                  />
                  <span class="min-w-0">
                    <span class="block truncate text-[11px] font-black text-white">
                      {{ getAssetLabel(asset) }}
                    </span>
                    <span class="block truncate text-[9px] font-semibold text-white/35">
                      {{ getAssetMeta(asset) }}
                    </span>
                  </span>
                </label>

                <div v-if="!filteredAvailableAssets.length" class="px-3 py-5 text-center">
                  <p class="text-[11px] font-black text-white/65">Sin activos para asignar</p>
                </div>
              </div>

              <button
                type="button"
                class="h-9 rounded-lg bg-[#ff6600] px-3 text-[11px] font-black text-white transition hover:bg-[#e65c00] disabled:cursor-not-allowed disabled:opacity-45"
                :disabled="!canSubmitGroupForm"
                @click="submitGroupForm"
              >
                {{ editingVehicleGroup ? "Guardar grupo" : "Crear grupo" }}
              </button>
            </div>
          </div>

          <div v-else>
            <div class="flex items-center justify-between gap-2">
              <button
                type="button"
                class="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)] items-center gap-2 rounded-lg px-2.5 py-2 text-left transition hover:bg-white/10"
                :class="!selectedVehicleGroup ? 'bg-white/10' : ''"
                @click="handleSelectVehicleGroup(null)"
              >
                <span
                  class="h-2 w-2 rounded-full"
                  :class="!selectedVehicleGroup ? 'bg-[#ff6600]' : 'bg-white/20'"
                ></span>

                <span class="min-w-0">
                  <span class="block truncate text-[11px] font-black text-white">
                    Todos los grupos
                  </span>
                  <span class="mt-0.5 block text-[9px] font-semibold text-white/40">
                    Todos los activos autorizados
                  </span>
                </span>
              </button>

              <button
                v-if="canManageGroups"
                type="button"
                class="shrink-0 rounded-lg bg-[#ff6600] px-3 py-2 text-[10px] font-black text-white transition hover:bg-[#e65c00]"
                @click="openCreateGroupForm"
              >
                + Crear
              </button>
            </div>

            <input
              v-model="groupSearch"
              type="search"
              autocomplete="off"
              placeholder="Buscar grupo..."
              class="mt-2 h-8 w-full rounded-lg border border-white/10 bg-white/[0.06] px-2.5 text-[11px] font-bold text-white outline-none transition placeholder:text-white/35 focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/15"
            />

            <div class="mt-2 max-h-[292px] overflow-auto">
              <div
                v-for="group in filteredVehicleGroups"
                :key="group.id"
                class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-lg px-2.5 py-2 transition hover:bg-white/10"
                :class="normalizeId(selectedVehicleGroupId) === normalizeId(group.id) ? 'bg-white/10' : ''"
              >
                <button
                  type="button"
                  class="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 text-left"
                  @click="handleSelectVehicleGroup(group.id)"
                >
                  <span
                    class="h-2 w-2 rounded-full"
                    :class="
                      normalizeId(selectedVehicleGroupId) === normalizeId(group.id)
                        ? 'bg-[#ff6600]'
                        : 'bg-white/20'
                    "
                  ></span>

                  <span class="min-w-0">
                    <span class="block truncate text-[11px] font-black text-white">
                      {{ group.name || "Grupo" }}
                    </span>
                    <span class="mt-0.5 block text-[9px] font-semibold text-white/40">
                      {{ getGroupMeta(group) }}
                    </span>
                  </span>

                  <span
                    class="rounded px-1.5 py-0.5 text-[8px] font-black"
                    :class="group.readonly ? 'bg-white/10 text-white/45' : 'bg-[#ff6600]/15 text-[#ffb580]'"
                  >
                    {{ group.readonly ? "Auto" : "Grupo" }}
                  </span>
                </button>

                <div v-if="canManageGroups && !group.readonly && group.managed" class="flex gap-1">
                  <button
                    type="button"
                    class="rounded-md border border-white/10 px-2 py-1 text-[9px] font-black text-white/55 transition hover:border-[#ff6600]/40 hover:text-white"
                    @click="openEditGroupForm(group)"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    class="rounded-md border border-rose-400/20 px-2 py-1 text-[9px] font-black text-rose-200 transition hover:bg-rose-500/15"
                    @click="handleDeleteGroup(group)"
                  >
                    Eliminar
                  </button>
                </div>
              </div>

              <div
                v-if="!filteredVehicleGroups.length"
                class="flex min-h-[112px] items-center justify-center rounded-lg border border-dashed border-white/10 px-3 py-5 text-center"
              >
                <div>
                  <p class="text-[11px] font-black text-white/70">Sin grupos disponibles</p>
                  <p class="mt-1 text-[9px] font-semibold text-white/35">
                    Crea grupos para ordenar la flota autorizada.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from "vue"

import { CITY_ASSET_GROUP_TYPE } from "../../utils/activos/assetCityUtils.js"
import { normalizeId } from "../../utils/idUtils.js"

const props = defineProps({
  availableAssets: {
    type: Array,
    default: () => [],
  },
  canManageGroups: {
    type: Boolean,
    default: false,
  },
  cityGroups: {
    type: Array,
    default: () => [],
  },
  enabled: {
    type: Boolean,
    default: false,
  },
  isOpen: {
    type: Boolean,
    default: false,
  },
  selectedCityGroupId: {
    type: [String, Number],
    default: null,
  },
  selectedVehicleGroupId: {
    type: [String, Number],
    default: null,
  },
  vehicleGroups: {
    type: Array,
    default: () => [],
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
  "select-city-group",
  "select-vehicle-group",
  "create-vehicle-group",
  "update-vehicle-group",
  "delete-vehicle-group",
])

const activeTab = ref("groups")
const citySearch = ref("")
const groupSearch = ref("")
const assetSearch = ref("")
const groupFormVisible = ref(false)
const editingVehicleGroup = ref(null)
const groupForm = reactive({
  name: "",
  assetIds: [],
})

const activeTabClass = "bg-[#ff6600] text-white shadow-[0_8px_18px_rgba(255,102,0,0.24)]"
const inactiveTabClass = "text-white/55 hover:bg-white/10 hover:text-white"

const normalizeSearch = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

const selectedCityGroup = computed(() => {
  return (
    props.cityGroups.find((group) => {
      return (
        group.type === CITY_ASSET_GROUP_TYPE &&
        normalizeId(group.id) === normalizeId(props.selectedCityGroupId)
      )
    }) || null
  )
})

const selectedVehicleGroup = computed(() => {
  return (
    props.vehicleGroups.find((group) => {
      return normalizeId(group.id) === normalizeId(props.selectedVehicleGroupId)
    }) || null
  )
})

const filteredCityGroups = computed(() => {
  const term = normalizeSearch(citySearch.value)
  const groups = props.cityGroups.filter((group) => group.type === CITY_ASSET_GROUP_TYPE)

  if (!term) return groups

  return groups.filter((group) => {
    return normalizeSearch([group.name, group.description].filter(Boolean).join(" ")).includes(term)
  })
})

const filteredVehicleGroups = computed(() => {
  const term = normalizeSearch(groupSearch.value)

  if (!term) return props.vehicleGroups

  return props.vehicleGroups.filter((group) => {
    return normalizeSearch([group.name, group.description].filter(Boolean).join(" ")).includes(term)
  })
})

const filteredAvailableAssets = computed(() => {
  const term = normalizeSearch(assetSearch.value)

  if (!term) return props.availableAssets

  return props.availableAssets.filter((asset) => {
    return normalizeSearch(
      [asset.patente, asset.vehiculo, asset.nombrePantalla, asset.name, asset.deviceId]
        .filter(Boolean)
        .join(" "),
    ).includes(term)
  })
})

const activeFilterLabel = computed(() => {
  if (selectedVehicleGroup.value && selectedCityGroup.value) return "Filtros activos"
  if (selectedVehicleGroup.value) return selectedVehicleGroup.value.name || "Grupo"
  if (selectedCityGroup.value) return getCityGroupName(selectedCityGroup.value)

  return "Filtros flota"
})

const activeFilterSubtitle = computed(() => {
  if (selectedVehicleGroup.value && selectedCityGroup.value) return "Grupo + ciudad"
  if (selectedVehicleGroup.value) return "Grupo"
  if (selectedCityGroup.value) return "Ciudad"

  return "Ciudad / grupos"
})

const canSubmitGroupForm = computed(() => {
  return props.canManageGroups && String(groupForm.name || "").trim()
})

watch(
  () => props.isOpen,
  (isOpen) => {
    if (!isOpen) return

    if (selectedCityGroup.value && !selectedVehicleGroup.value) {
      activeTab.value = "cities"
    } else {
      activeTab.value = "groups"
    }
  },
)

const toggleOpen = () => {
  emit(props.isOpen ? "close" : "open")
}

const handleSelectCity = (groupId) => {
  emit("select-city-group", groupId)
  emit("close")
}

const handleSelectVehicleGroup = (groupId) => {
  emit("select-vehicle-group", groupId)
  emit("close")
}

const openCreateGroupForm = () => {
  editingVehicleGroup.value = null
  groupForm.name = ""
  groupForm.assetIds = []
  assetSearch.value = ""
  groupFormVisible.value = true
}

const openEditGroupForm = (group) => {
  editingVehicleGroup.value = group
  groupForm.name = group?.name || ""
  groupForm.assetIds = [...(group?.assetIds || [])]
  assetSearch.value = ""
  groupFormVisible.value = true
}

const closeGroupForm = () => {
  groupFormVisible.value = false
  editingVehicleGroup.value = null
  groupForm.name = ""
  groupForm.assetIds = []
  assetSearch.value = ""
}

const submitGroupForm = () => {
  if (!canSubmitGroupForm.value) return

  if (editingVehicleGroup.value) {
    emit("update-vehicle-group", {
      id: editingVehicleGroup.value.id,
      changes: {
        name: groupForm.name,
        assetIds: groupForm.assetIds,
      },
    })
  } else {
    emit("create-vehicle-group", {
      name: groupForm.name,
      assetIds: groupForm.assetIds,
    })
  }

  closeGroupForm()
}

const handleDeleteGroup = (group) => {
  if (!props.canManageGroups || !group?.id || group.readonly) return

  const confirmed =
    typeof window === "undefined" ||
    window.confirm(`Eliminar el grupo "${group.name || "Grupo"}"?`)

  if (!confirmed) return

  emit("delete-vehicle-group", group.id)

  if (normalizeId(props.selectedVehicleGroupId) === normalizeId(group.id)) {
    emit("select-vehicle-group", null)
  }
}

const isAssetSelected = (assetId) => {
  return groupForm.assetIds.some((selectedAssetId) => {
    return normalizeId(selectedAssetId) === normalizeId(assetId)
  })
}

const toggleAssetSelection = (assetId) => {
  const normalizedAssetId = normalizeId(assetId)

  if (!normalizedAssetId) return

  if (isAssetSelected(normalizedAssetId)) {
    groupForm.assetIds = groupForm.assetIds.filter((selectedAssetId) => {
      return normalizeId(selectedAssetId) !== normalizedAssetId
    })
    return
  }

  groupForm.assetIds = [...groupForm.assetIds, normalizedAssetId]
}

const selectAllFilteredAssets = () => {
  groupForm.assetIds = [
    ...new Set([
      ...groupForm.assetIds.map((assetId) => normalizeId(assetId)).filter(Boolean),
      ...filteredAvailableAssets.value.map((asset) => normalizeId(asset?.id)).filter(Boolean),
    ]),
  ]
}

const clearSelectedAssets = () => {
  groupForm.assetIds = []
}

const getCityGroupName = (group) => {
  return String(group?.name || "").replace(/^Ciudad:\s*/i, "")
}

const getGroupMeta = (group) => {
  const assetCount = (group?.assetIds || []).length

  return `${assetCount} activos`
}

const getAssetLabel = (asset = {}) => {
  return asset.patente || asset.vehiculo || asset.nombrePantalla || asset.name || asset.id || "Activo"
}

const getAssetMeta = (asset = {}) => {
  return [asset.vehiculo, asset.modelo, asset.deviceId].filter(Boolean).join(" - ") || "Sin detalle"
}
</script>
