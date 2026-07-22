<template>
  <section class="mt-3 overflow-hidden rounded-lg border border-[#d8dee8] bg-white">
    <header class="border-b border-[#edf1f5] bg-[#f8fafc] px-3 py-2">
      <div class="flex items-center justify-between gap-2">
        <p class="text-[10px] font-black uppercase text-slate-500">Grupos autorizados</p>
        <span class="text-[10px] font-black text-[#ff6600]">
          {{ selectedSucursalIds.size }} seleccionados
        </span>
      </div>
    </header>

    <div class="max-h-[190px] overflow-auto">
      <label
        v-for="sucursal in sucursales"
        :key="sucursal.id"
        class="flex cursor-pointer items-center gap-2 border-b border-[#edf1f5] px-3 py-2.5 last:border-b-0 hover:bg-[#f8fafc]"
        :class="sucursal.active === false ? 'opacity-55' : ''"
      >
        <input
          type="checkbox"
          class="h-4 w-4 cursor-pointer rounded border-[#d8dee8] accent-[#102372]"
          :checked="selectedSucursalIds.has(String(sucursal.id))"
          :disabled="sucursal.active === false"
          @change="$emit('toggle-sucursal', sucursal.id)"
        />

        <span class="min-w-0 flex-1">
          <span class="block truncate text-[11px] font-black text-[#172033]">
            {{ sucursal.name }}
          </span>
          <span class="mt-0.5 block text-[9px] font-semibold text-slate-500">
            {{ getAssetCount(sucursal.id) }} activos
            {{ sucursal.active === false ? " · Inactiva" : "" }}
          </span>
        </span>
      </label>

      <div v-if="!sucursales.length" class="px-3 py-5 text-center">
        <p class="text-[11px] font-black text-[#102372]">Sin grupos disponibles</p>
        <p class="mt-1 text-[9px] font-semibold text-slate-500">
          Crea grupos desde la empresa o desde la vista de activos.
        </p>
      </div>
    </div>

    <p
      v-if="sucursales.length && !selectedSucursalIds.size"
      class="border-t border-[#edf1f5] px-3 py-2 text-[9px] font-semibold text-[#ff6600]"
    >
      Selecciona al menos un grupo para aplicar este alcance.
    </p>
  </section>
</template>

<script setup>
import { computed } from "vue"

const props = defineProps({
  sucursales: {
    type: Array,
    default: () => [],
  },
  assets: {
    type: Array,
    default: () => [],
  },
  selectedIds: {
    type: Array,
    default: () => [],
  },
})

defineEmits(["toggle-sucursal"])

const selectedSucursalIds = computed(() => {
  return new Set(props.selectedIds.map((sucursalId) => String(sucursalId)))
})

const assetCountBySucursalId = computed(() => {
  const counts = new Map()

  props.assets.forEach((asset) => {
    const sucursalId = String(asset.sucursalId || "")

    if (!sucursalId) return

    counts.set(sucursalId, (counts.get(sucursalId) || 0) + 1)
  })

  return counts
})

const getAssetCount = (sucursalId) => {
  return assetCountBySucursalId.value.get(String(sucursalId)) || 0
}
</script>
