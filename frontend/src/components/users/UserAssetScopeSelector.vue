<template>
  <section class="mt-3 rounded-lg border border-[#d8dee8] bg-white p-2">
    <div class="flex items-center justify-between gap-2">
      <p class="text-[10px] font-black uppercase text-slate-400">Activos autorizados</p>
      <span class="text-[10px] font-black text-[#ff6600]">
        {{ selectedAssetIds.size }} seleccionados
      </span>
    </div>

    <input
      v-model="searchTerm"
      type="text"
      placeholder="Buscar activo"
      class="mt-2 h-8 w-full rounded-lg border border-[#d8dee8] bg-[#f8fafc] px-2 text-[11px] font-semibold text-[#172033] outline-none transition placeholder:text-slate-400 focus:border-[#ff6600] focus:bg-white focus:ring-2 focus:ring-[#ff6600]/10"
    />

    <div class="mt-2 max-h-[190px] overflow-auto rounded-lg border border-[#edf1f5]">
      <label
        v-for="asset in visibleAssets"
        :key="asset.id"
        class="flex cursor-pointer items-center gap-2 border-b border-[#edf1f5] px-2 py-2 last:border-b-0 hover:bg-[#f8fafc]"
      >
        <input
          type="checkbox"
          class="h-4 w-4 cursor-pointer rounded border-[#d8dee8] accent-[#102372]"
          :checked="selectedAssetIds.has(String(asset.id))"
          @change="$emit('toggle-asset', asset.id)"
        />

        <span class="min-w-0 flex-1">
          <span class="block truncate text-[11px] font-black text-[#172033]">
            {{ getAssetName(asset) }}
          </span>

          <span class="mt-0.5 flex items-center gap-1 text-[9px] font-semibold text-slate-500">
            <span
              class="h-1.5 w-1.5 rounded-full"
              :class="getStatusDotClass(getAssetStatus(asset))"
            ></span>
            {{ getStatusLabel(getAssetStatus(asset)) }} · Último dato
            {{ getAssetLastReport(asset) }}
          </span>
        </span>
      </label>

      <div v-if="!filteredAssets.length" class="px-3 py-4 text-center">
        <p class="text-[11px] font-black text-[#102372]">Sin activos encontrados</p>
      </div>
    </div>

    <button
      v-if="canShowMoreAssets"
      type="button"
      class="mt-2 h-8 w-full rounded-lg border border-[#d8dee8] bg-white text-[10px] font-black text-[#102372] transition hover:border-[#102372]/40"
      @click="showMoreAssets"
    >
      Mostrar más activos · quedan {{ visibleAssetsRemaining }}
    </button>

    <p v-if="!selectedAssetIds.size" class="mt-2 text-[10px] font-semibold text-[#ff6600]">
      Selecciona al menos un activo para que este alcance tenga efecto.
    </p>
  </section>
</template>

<script setup>
import { computed, ref, watch } from "vue"

const DEFAULT_VISIBLE_ASSET_LIMIT = 80
const ASSET_LIMIT_INCREMENT = 80

const props = defineProps({
  assets: {
    type: Array,
    default: () => [],
  },
  selectedIds: {
    type: Array,
    default: () => [],
  },
})

defineEmits(["toggle-asset"])

const searchTerm = ref("")
const visibleAssetLimit = ref(DEFAULT_VISIBLE_ASSET_LIMIT)

const selectedAssetIds = computed(() => {
  return new Set(props.selectedIds.map((assetId) => String(assetId)))
})

const filteredAssets = computed(() => {
  const term = searchTerm.value.trim().toLowerCase()

  if (!term) return props.assets

  return props.assets.filter((asset) => {
    return [
      asset.id,
      asset.vehiculo,
      asset.name,
      asset.patent,
      asset.estado,
      asset.status,
      asset.datosUlt,
      asset.lastReport,
    ].some((value) =>
      String(value || "")
        .toLowerCase()
        .includes(term),
    )
  })
})

const visibleAssets = computed(() => {
  return filteredAssets.value.slice(0, visibleAssetLimit.value)
})

const visibleAssetsRemaining = computed(() => {
  return Math.max(filteredAssets.value.length - visibleAssets.value.length, 0)
})

const canShowMoreAssets = computed(() => {
  return visibleAssetsRemaining.value > 0
})

watch(searchTerm, () => {
  visibleAssetLimit.value = DEFAULT_VISIBLE_ASSET_LIMIT
})

const showMoreAssets = () => {
  visibleAssetLimit.value += ASSET_LIMIT_INCREMENT
}

const getAssetName = (asset) => {
  if (asset.vehiculo) return asset.vehiculo
  if (asset.name && asset.patent) return `${asset.name} · ${asset.patent}`
  if (asset.name) return asset.name
  if (asset.patent) return asset.patent

  return `Activo ${asset.id}`
}

const getAssetStatus = (asset) => {
  return asset.estado || asset.status || ""
}

const getAssetLastReport = (asset) => {
  return asset.datosUlt || asset.lastReport || "-"
}

const getStatusLabel = (status) => {
  const labels = {
    active: "Activo",
    inactive: "Inactivo",
    moving: "En movimiento",
    idle: "En espera",
    stopped: "Detenido",
    offline: "Sin conexión",
  }

  return labels[status] || "Sin estado"
}

const getStatusDotClass = (status) => {
  const classes = {
    active: "bg-emerald-500",
    inactive: "bg-slate-300",
    moving: "bg-emerald-500",
    idle: "bg-amber-400",
    stopped: "bg-[#ff6600]",
    offline: "bg-slate-300",
  }

  return classes[status] || "bg-slate-300"
}
</script>
