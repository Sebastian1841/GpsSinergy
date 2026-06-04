<template>
  <section class="rounded-lg border border-[#d8dee8] bg-[#f8fafc] p-3">
    <h4 class="text-[12px] font-black text-[#102372]">Flota visible</h4>
    <p class="mt-1 text-[10px] font-semibold text-slate-500">
      Define qué vehículos puede ver este usuario dentro de la empresa.
    </p>

    <label class="mt-2 block">
      <span class="text-[10px] font-black uppercase text-slate-400">Vehículos permitidos</span>
      <select
        :value="access.scope?.type"
        class="mt-1 h-9 w-full cursor-pointer rounded-lg border border-[#d8dee8] bg-white px-2 text-[11px] font-black text-[#102372] outline-none transition focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/10"
        @change="$emit('update-operational-scope', access.id, $event.target.value)"
      >
        <option v-for="scope in mainScopes" :key="scope.id" :value="scope.id">
          {{ getScopeLabel(scope.id) }}
        </option>
      </select>
    </label>

    <UserAssetScopeSelector
      v-if="access.scope?.type === 'selected-assets'"
      :assets="scopeAssets"
      :selected-ids="access.scope?.assetIds || []"
      @toggle-asset="$emit('toggle-scope-asset', access.id, $event)"
    />

    <UserSucursalScopeSelector
      v-if="access.scope?.type === 'sucursal'"
      :sucursales="sucursales"
      :assets="scopeAssets"
      :selected-ids="access.scope?.sucursalIds || []"
      @toggle-sucursal="$emit('toggle-scope-sucursal', access.id, $event)"
    />

    <div class="mt-3 grid gap-2">
      <button
        type="button"
        class="flex items-center justify-between gap-3 rounded-lg border bg-white px-3 py-2 text-left transition"
        :class="access.scope?.criticalAlerts ? 'border-[#102372]' : 'border-[#d8dee8]'"
        @click="$emit('toggle-scope-option', access.id, 'critical-alerts')"
      >
        <span class="text-[11px] font-black text-[#172033]">Puede ver alertas críticas</span>
        <span
          class="h-2.5 w-2.5 rounded-full"
          :class="access.scope?.criticalAlerts ? 'bg-[#ff6600]' : 'bg-slate-300'"
        ></span>
      </button>

      <button
        type="button"
        class="flex items-center justify-between gap-3 rounded-lg border bg-white px-3 py-2 text-left transition"
        :class="access.scope?.reports ? 'border-[#102372]' : 'border-[#d8dee8]'"
        @click="$emit('toggle-scope-option', access.id, 'reports')"
      >
        <span class="text-[11px] font-black text-[#172033]">Puede ver reportes</span>
        <span
          class="h-2.5 w-2.5 rounded-full"
          :class="access.scope?.reports ? 'bg-[#ff6600]' : 'bg-slate-300'"
        ></span>
      </button>
    </div>
  </section>
</template>

<script setup>
import { computed } from "vue"

import UserAssetScopeSelector from "./UserAssetScopeSelector.vue"
import UserSucursalScopeSelector from "./UserSucursalScopeSelector.vue"

const props = defineProps({
  access: {
    type: Object,
    required: true,
  },
  scopes: {
    type: Array,
    default: () => [],
  },
  assets: {
    type: Array,
    default: () => [],
  },
  sucursales: {
    type: Array,
    default: () => [],
  },
})

defineEmits([
  "update-operational-scope",
  "toggle-scope-option",
  "toggle-scope-asset",
  "toggle-scope-sucursal",
])

const mainScopes = computed(() => {
  return props.scopes.filter((scope) => {
    return ["all-assets", "sucursal", "selected-assets"].includes(scope.id)
  })
})

const scopeAssets = computed(() => {
  return props.assets.filter((asset) => {
    return asset.applicationId === props.access.applicationId
  })
})

const getScopeLabel = (scopeId) => {
  const labels = {
    "all-assets": "Toda la flota",
    sucursal: "Sucursales seleccionadas",
    "selected-assets": "Solo activos seleccionados",
  }

  return labels[scopeId] || "Sin definir"
}
</script>
