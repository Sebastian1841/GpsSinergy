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
        :disabled="!canManageUserPermissions"
        class="mt-1 h-9 w-full rounded-lg border border-[#d8dee8] bg-white px-2 text-[11px] font-black text-[#102372] outline-none transition focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        :class="canManageUserPermissions ? 'cursor-pointer' : 'cursor-not-allowed'"
        @change="handleUpdateOperationalScope"
      >
        <option v-for="scope in mainScopes" :key="scope.id" :value="scope.id">
          {{ getScopeLabel(scope.id) }}
        </option>
      </select>
    </label>

    <div :class="canManageUserPermissions ? '' : 'pointer-events-none select-none opacity-60'">
      <UserAssetScopeSelector
        v-if="access.scope?.type === 'selected-assets'"
        :assets="scopeAssets"
        :selected-ids="access.scope?.assetIds || []"
        @toggle-asset="handleToggleScopeAsset"
      />

      <UserSucursalScopeSelector
        v-if="access.scope?.type === 'sucursal'"
        :sucursales="sucursales"
        :assets="scopeAssets"
        :selected-ids="access.scope?.sucursalIds || []"
        @toggle-sucursal="handleToggleScopeSucursal"
      />
    </div>

    <p
      v-if="!canManageUserPermissions"
      class="mt-3 rounded-lg border border-[#d8dee8] bg-white px-3 py-2 text-[10px] font-black text-slate-500"
    >
      Alcance en modo solo lectura
    </p>
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
  canManageUserPermissions: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  "update-operational-scope",
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

const handleUpdateOperationalScope = (event) => {
  if (!props.canManageUserPermissions) return

  emit("update-operational-scope", props.access.id, event.target.value)
}

const handleToggleScopeAsset = (assetId) => {
  if (!props.canManageUserPermissions) return

  emit("toggle-scope-asset", props.access.id, assetId)
}

const handleToggleScopeSucursal = (sucursalId) => {
  if (!props.canManageUserPermissions) return

  emit("toggle-scope-sucursal", props.access.id, sucursalId)
}
</script>
