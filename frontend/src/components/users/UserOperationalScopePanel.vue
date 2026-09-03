<template>
  <section class="overflow-hidden rounded-xl border border-[#d8dee8] bg-white">
    <!-- CABECERA -->
    <header class="border-b border-[#edf1f5] px-4 py-3">
      <h4 class="text-[12px] font-black text-[#102372]">Que activos puede ver?</h4>

      <p class="mt-0.5 text-[9px] font-semibold text-slate-500">
        Define el alcance de este usuario dentro de la empresa.
      </p>
    </header>

    <!-- TIPO DE ALCANCE -->
    <div class="p-4">
      <select
        :value="visibleScopeType"
        :disabled="!canManageUserPermissions"
        class="h-10 w-full rounded-lg border border-[#d8dee8] bg-white px-3 text-[10px] font-black text-[#102372] outline-none transition focus:border-[#102372] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        :class="canManageUserPermissions ? 'cursor-pointer' : 'cursor-not-allowed'"
        aria-label="Alcance de activos"
        @change="handleUpdateOperationalScope"
      >
        <option v-for="scope in mainScopes" :key="scope.id" :value="scope.id">
          {{ getScopeLabel(scope.id) }}
        </option>
      </select>

      <!-- CONFIGURACION DEL ALCANCE -->
      <div
        class="mt-3"
        :class="canManageUserPermissions ? '' : 'pointer-events-none select-none opacity-60'"
      >
        <!-- TODA LA FLOTA -->
        <div
          v-if="visibleScopeType === 'all-assets'"
          class="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-3"
        >
          <p class="text-[10px] font-black text-emerald-700">Toda la flota</p>

          <p class="mt-0.5 text-[9px] font-semibold text-emerald-700/80">
            El usuario podra ver todos los activos disponibles en esta empresa.
          </p>
        </div>

        <!-- ACTIVOS -->
        <UserAssetScopeSelector
          v-else-if="visibleScopeType === 'selected-assets'"
          :assets="scopeAssets"
          :selected-ids="selectedAssetIds"
          @toggle-asset="handleToggleScopeAsset"
        />

        <!-- ETIQUETAS -->
        <UserAssetTagScopeSelector
          v-else-if="visibleScopeType === 'asset-tags'"
          :tags="assetTagOptions"
          :selected-ids="access.scope?.assetTagIds || []"
          @toggle-tag="handleToggleScopeAssetTag"
        />
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from "vue"

import UserAssetScopeSelector from "./UserAssetScopeSelector.vue"
import UserAssetTagScopeSelector from "./UserAssetTagScopeSelector.vue"

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
  assetTags: {
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
  "toggle-scope-asset-tag",
])

const allowedScopeIds = ["all-assets", "selected-assets", "asset-tags"]

const mainScopes = computed(() => {
  return props.scopes.filter((scope) => {
    return allowedScopeIds.includes(scope.id)
  })
})

const scopeAssets = computed(() => {
  return props.assets.filter((asset) => {
    return String(asset.applicationId) === String(props.access.applicationId)
  })
})

const visibleScopeType = computed(() => {
  return allowedScopeIds.includes(props.access.scope?.type)
    ? props.access.scope.type
    : "selected-assets"
})

const selectedAssetIds = computed(() => {
  if (props.access.scope?.type !== "sucursal") {
    return props.access.scope?.assetIds || []
  }

  const legacySucursalIds = new Set(
    (props.access.scope?.sucursalIds || []).map((sucursalId) => String(sucursalId)),
  )

  return scopeAssets.value
    .filter((asset) => legacySucursalIds.has(String(asset.sucursalId || "")))
    .map((asset) => asset.id)
})

const assetTagOptions = computed(() => {
  return props.assetTags.filter((tag) => {
    return String(tag.applicationId) === String(props.access.applicationId) && tag.active !== false
  })
})

const getScopeLabel = (scopeId) => {
  const labels = {
    "all-assets": "Toda la flota",
    "selected-assets": "Activos especificos",
    "asset-tags": "Etiquetas de acceso",
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

const handleToggleScopeAssetTag = (tagId) => {
  if (!props.canManageUserPermissions) return

  emit("toggle-scope-asset-tag", props.access.id, tagId)
}
</script>
