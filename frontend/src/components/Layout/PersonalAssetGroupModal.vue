<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 z-[920] flex items-end justify-center bg-slate-950/30 p-2 sm:items-center"
    @click.self="closeModal"
  >
    <section
      class="flex max-h-[calc(100%-16px)] w-full max-w-[480px] flex-col overflow-hidden rounded-xl border border-[#d8dee8] bg-white shadow-2xl"
    >
      <header class="shrink-0 border-b border-[#edf1f5] px-4 py-3">
        <div class="flex items-center justify-between gap-3">
          <h2 class="min-w-0 truncate text-[14px] font-black text-[#102372]">
            {{ modalTitle }}
          </h2>

          <button
            type="button"
            class="shrink-0 rounded-md px-2 py-1 text-[18px] font-black leading-none text-slate-400 transition hover:bg-slate-100 hover:text-[#102372]"
            @click="closeModal"
          >
            x
          </button>
        </div>
      </header>

      <div class="grid shrink-0 gap-2 border-b border-[#edf1f5] p-3">
        <input
          v-model="groupName"
          type="text"
          placeholder="Nombre de la vista"
          class="h-9 w-full rounded-lg border border-[#d8dee8] bg-white px-3 text-[12px] font-semibold text-[#172033] outline-none placeholder:text-slate-400 focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/10"
        />

        <div class="relative">
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
            v-model="assetSearch"
            type="text"
            placeholder="Buscar activo..."
            class="h-9 w-full rounded-lg border border-[#d8dee8] bg-white pl-9 pr-9 text-[12px] font-semibold text-[#172033] outline-none placeholder:text-slate-400 focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/10"
          />

          <button
            v-if="assetSearch"
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-base leading-none text-slate-400 transition hover:text-[#ff6600]"
            @click="assetSearch = ''"
          >
            x
          </button>
        </div>

        <div class="flex items-center justify-between gap-2 px-1">
          <p class="text-[10px] font-black text-slate-400">
            {{ selectedAssetIds.length }} seleccionados
          </p>

          <div class="flex items-center gap-1">
            <button
              type="button"
              class="rounded-md px-2 py-1 text-[10px] font-black text-[#102372] transition hover:bg-[#f8fafc] hover:text-[#ff6600]"
              @click="selectAllFilteredAssets"
            >
              Seleccionar
            </button>

            <button
              type="button"
              class="rounded-md px-2 py-1 text-[10px] font-black text-slate-500 transition hover:bg-[#f8fafc] hover:text-[#ff6600]"
              @click="clearSelectedAssets"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      <div class="min-h-0 flex-1 overflow-auto p-3">
        <div
          v-if="!filteredAssets.length"
          class="flex min-h-[150px] items-center justify-center rounded-lg border border-dashed border-[#cbd5e1] bg-[#f8fafc] text-center"
        >
          <p class="text-[12px] font-black text-[#102372]">Sin activos disponibles</p>
        </div>

        <div v-else class="max-h-[260px] overflow-auto rounded-lg border border-[#d8dee8]">
          <label
            v-for="asset in filteredAssets"
            :key="asset.id"
            class="grid cursor-pointer grid-cols-[auto_minmax(0,1fr)] items-center gap-3 border-b border-[#edf1f5] bg-white px-3 py-2 transition last:border-b-0 hover:bg-[#f8fafc]"
          >
            <input
              type="checkbox"
              class="h-3.5 w-3.5 cursor-pointer accent-[#ff6600]"
              :checked="selectedAssetIdSet.has(normalizeId(asset.id))"
              @change="toggleAsset(asset.id)"
            />

            <span class="min-w-0">
              <span class="block truncate text-[12px] font-black text-[#172033]">
                {{ getAssetLabel(asset) }}
              </span>
              <span class="mt-0.5 block truncate text-[10px] font-semibold text-slate-500">
                {{ asset.imei || "Sin IMEI" }}
              </span>
            </span>
          </label>
        </div>
      </div>

      <footer
        class="flex shrink-0 items-center justify-between gap-2 border-t border-[#edf1f5] px-4 py-3"
      >
        <button
          v-if="isEditMode"
          type="button"
          class="h-9 rounded-lg px-2 text-[11px] font-black text-red-600 transition hover:bg-red-50"
          @click="handleDelete"
        >
          Eliminar
        </button>
        <span v-else></span>

        <div class="flex gap-2">
          <button
            type="button"
            class="h-9 rounded-lg px-3 text-[11px] font-black text-slate-500 transition hover:bg-[#f8fafc] hover:text-[#102372]"
            @click="closeModal"
          >
            Cancelar
          </button>

          <button
            type="button"
            class="h-9 rounded-lg bg-[#102372] px-4 text-[11px] font-black text-white transition hover:bg-[#0c1b59] disabled:cursor-not-allowed disabled:bg-slate-300"
            :disabled="!canSave"
            @click="handleSave"
          >
            Guardar
          </button>
        </div>
      </footer>
    </section>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue"

import { normalizeId } from "../../utils/idUtils.js"

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  mode: {
    type: String,
    default: "create",
  },
  group: {
    type: Object,
    default: null,
  },
  assets: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(["update:modelValue", "create-group", "update-group", "delete-group"])

const groupName = ref("")
const assetSearch = ref("")
const selectedAssetIds = ref([])

const isEditMode = computed(() => {
  return props.mode === "edit" && props.group?.id
})

const modalTitle = computed(() => {
  return isEditMode.value ? "Editar vista" : "Crear vista"
})

const selectedAssetIdSet = computed(() => {
  return new Set(selectedAssetIds.value.map(normalizeId))
})

const canSave = computed(() => {
  return groupName.value.trim().length > 0
})

const normalizeText = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

const getAssetLabel = (asset) => {
  return (
    asset.vehiculo ||
    asset.nombrePantalla ||
    asset.displayName ||
    asset.name ||
    asset.patente ||
    asset.patent ||
    `Activo ${asset.id}`
  )
}

const getAssetSearchText = (asset) => {
  return normalizeText(
    [
      getAssetLabel(asset),
      asset.imei,
      asset.estado,
      asset.trackerModelLabel,
      asset.protocol,
      asset.sucursalName,
    ]
      .filter(Boolean)
      .join(" "),
  )
}

const filteredAssets = computed(() => {
  const term = normalizeText(assetSearch.value)

  if (!term) return props.assets

  return props.assets.filter((asset) => {
    return getAssetSearchText(asset).includes(term)
  })
})

const closeModal = () => {
  emit("update:modelValue", false)
}

const toggleAsset = (assetId) => {
  const normalizedAssetId = normalizeId(assetId)
  const nextAssetIds = new Set(selectedAssetIds.value.map(normalizeId))

  if (nextAssetIds.has(normalizedAssetId)) {
    nextAssetIds.delete(normalizedAssetId)
  } else {
    nextAssetIds.add(normalizedAssetId)
  }

  selectedAssetIds.value = Array.from(nextAssetIds)
}

const selectAllFilteredAssets = () => {
  const nextAssetIds = new Set(selectedAssetIds.value.map(normalizeId))

  filteredAssets.value.forEach((asset) => {
    const assetId = normalizeId(asset.id)

    if (assetId) nextAssetIds.add(assetId)
  })

  selectedAssetIds.value = Array.from(nextAssetIds)
}

const clearSelectedAssets = () => {
  selectedAssetIds.value = []
}

const handleSave = () => {
  if (!canSave.value) return

  const payload = {
    name: groupName.value.trim(),
    assetIds: selectedAssetIds.value,
  }

  if (isEditMode.value) {
    emit("update-group", {
      ...payload,
      groupId: props.group.id,
    })
  } else {
    emit("create-group", payload)
  }

  closeModal()
}

const handleDelete = () => {
  if (!isEditMode.value) return

  const confirmed = window.confirm(`Eliminar la vista "${props.group.name}"?`)

  if (!confirmed) return

  emit("delete-group", props.group.id)
  closeModal()
}

watch(
  () => [props.modelValue, props.mode, props.group?.id],
  () => {
    if (!props.modelValue) return

    groupName.value = isEditMode.value ? props.group?.name || "" : ""
    assetSearch.value = ""
    selectedAssetIds.value = isEditMode.value ? [...(props.group?.assetIds || [])] : []
  },
  {
    immediate: true,
  },
)

watch(
  () => props.assets,
  (assets) => {
    const availableAssetIds = new Set((assets || []).map((asset) => normalizeId(asset.id)))

    selectedAssetIds.value = selectedAssetIds.value.filter((assetId) => {
      return availableAssetIds.has(normalizeId(assetId))
    })
  },
)
</script>
