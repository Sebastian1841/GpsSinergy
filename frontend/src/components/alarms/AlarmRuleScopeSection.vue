<template>
  <section class="alarm-modal-card">
    <div class="alarm-modal-card-title">
      <span class="alarm-step-number">2</span>
      <div class="min-w-0">
        <h3>Alcance</h3>
      </div>
    </div>

    <label class="alarm-form-field mt-3">
      <span>Empresa</span>
      <select
        v-model="draftModel.companyId"
        :disabled="!canManage || isCompanyLocked"
        @change="$emit('company-change')"
      >
        <option v-for="option in companyOptions" :key="option.id" :value="option.id">
          {{ option.label }}
        </option>
      </select>
    </label>

    <div class="mt-3 space-y-2">
      <p class="text-[11px] font-black text-[#102372]">Aplicar a</p>

      <label class="alarm-radio-row">
        <input
          type="radio"
          name="asset-scope"
          value="all"
          :checked="draftModel.assetScope.type === 'all'"
          :disabled="!canManage"
          @change="$emit('set-asset-scope', 'all')"
        />
        <span>Toda la flota</span>
      </label>

      <label class="alarm-radio-row">
        <input
          type="radio"
          name="asset-scope"
          value="specific"
          :checked="draftModel.assetScope.type === 'specific'"
          :disabled="!canManage"
          @change="$emit('set-asset-scope', 'specific')"
        />
        <span>Activos seleccionados</span>
      </label>

      <label class="alarm-radio-row">
        <input
          type="radio"
          name="asset-scope"
          value="asset-tags"
          :checked="draftModel.assetScope.type === 'asset-tags'"
          :disabled="!canManage || !assetTagOptions.length"
          @change="$emit('set-asset-scope', 'asset-tags')"
        />
        <span>Etiquetas de acceso</span>
      </label>
    </div>

    <div
      v-if="draftModel.assetScope.type === 'all'"
      class="mt-3 rounded-lg border border-[#cfe0ff] bg-[#eef5ff] px-3 py-2 text-[11px] font-semibold text-[#315078]"
    >
      Se aplicara a todos los activos autorizados de la empresa seleccionada.
    </div>

    <div v-if="draftModel.assetScope.type === 'specific'" class="mt-3 space-y-2">
      <div class="flex items-center gap-2">
        <input
          v-model="localAssetSearchTerm"
          type="search"
          class="h-9 min-w-0 flex-1 rounded-lg border border-[#cfd8e6] px-3 text-[12px] font-bold text-[#102372] outline-none focus:border-[#102372] focus:ring-2 focus:ring-[#102372]/10"
          placeholder="Buscar activo..."
        />

        <button
          type="button"
          class="alarm-mini-button"
          :disabled="!canManage"
          @click="$emit('select-all-assets')"
        >
          Todos
        </button>
      </div>

      <div class="max-h-36 space-y-1.5 overflow-y-auto pr-1">
        <label
          v-for="asset in visibleAssetsForDraftCompany"
          :key="asset.id"
          class="alarm-check-row"
        >
          <input
            type="checkbox"
            :checked="isDraftAssetSelected(asset.id)"
            :disabled="!canManage"
            @change="$emit('toggle-asset', asset.id)"
          />
          <span>{{ asset.label }}</span>
        </label>
      </div>

      <p v-if="hiddenFilteredAssetCount" class="text-[11px] font-bold text-[#5f7396]">
        Mostrando {{ visibleAssetsForDraftCompany.length }} de
        {{ filteredAssetsForDraftCompany.length }} activos. Usa el buscador para acotar.
      </p>
    </div>

    <div v-if="draftModel.assetScope.type === 'asset-tags'" class="mt-3 space-y-1.5">
      <label v-for="tag in assetTagOptions" :key="tag.id" class="alarm-check-row">
        <input
          type="checkbox"
          :checked="isDraftAssetTagSelected(tag.id)"
          :disabled="!canManage"
          @change="$emit('toggle-asset-tag', tag.id)"
        />
        <span>{{ tag.name }} - {{ tag.assetCount }} activos</span>
      </label>
    </div>

    <p class="mt-3 text-[11px] font-black text-[#102372]">
      {{ selectedDraftAssetCount }} de {{ assetsForDraftCompany.length }} activos cubiertos
    </p>
  </section>
</template>

<script setup>
import { computed } from "vue"

const props = defineProps({
  draft: {
    type: Object,
    required: true,
  },
  canManage: {
    type: Boolean,
    default: false,
  },
  isCompanyLocked: {
    type: Boolean,
    default: false,
  },
  companyOptions: {
    type: Array,
    default: () => [],
  },
  assetTagOptions: {
    type: Array,
    default: () => [],
  },
  assetSearchTerm: {
    type: String,
    default: "",
  },
  visibleAssetsForDraftCompany: {
    type: Array,
    default: () => [],
  },
  filteredAssetsForDraftCompany: {
    type: Array,
    default: () => [],
  },
  hiddenFilteredAssetCount: {
    type: Number,
    default: 0,
  },
  selectedDraftAssetCount: {
    type: Number,
    default: 0,
  },
  assetsForDraftCompany: {
    type: Array,
    default: () => [],
  },
  isDraftAssetSelected: {
    type: Function,
    default: () => false,
  },
  isDraftAssetTagSelected: {
    type: Function,
    default: () => false,
  },
})

const emit = defineEmits([
  "company-change",
  "select-all-assets",
  "set-asset-scope",
  "toggle-asset",
  "toggle-asset-tag",
  "update:assetSearchTerm",
])

const draftModel = computed(() => props.draft)

const localAssetSearchTerm = computed({
  get: () => props.assetSearchTerm,
  set: (value) => emit("update:assetSearchTerm", value),
})
</script>

<style scoped>
.alarm-modal-card {
  min-width: 0;
  border-radius: 0.75rem;
  border: 1px solid #d8e0eb;
  background: #ffffff;
  padding: 1rem;
}

.alarm-modal-card-title {
  display: flex;
  min-width: 0;
  margin-bottom: 0.875rem;
  gap: 0.75rem;
  align-items: flex-start;
}

.alarm-modal-card-title h3 {
  font-size: 1rem;
  line-height: 1.2;
  font-weight: 900;
  color: #102372;
}

.alarm-step-number {
  display: inline-flex;
  width: 2.25rem;
  height: 2.25rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #102372;
  font-size: 1rem;
  font-weight: 900;
  color: #ffffff;
}

.alarm-form-field {
  display: block;
  min-width: 0;
}

.alarm-form-field > span {
  display: block;
  margin-bottom: 0.375rem;
  font-size: 0.6875rem;
  font-weight: 900;
  color: #315078;
}

.alarm-form-field select {
  width: 100%;
  height: 2.625rem;
  border-radius: 0.5rem;
  border: 1px solid #cfd8e6;
  background: #ffffff;
  padding: 0 0.75rem;
  font-size: 0.75rem;
  font-weight: 800;
  color: #102372;
  outline: none;
  transition:
    border-color 0.16s ease,
    box-shadow 0.16s ease;
}

.alarm-form-field select:focus {
  border-color: #102372;
  box-shadow: 0 0 0 2px rgb(16 35 114 / 0.1);
}

.alarm-form-field select:disabled {
  cursor: not-allowed;
  background: #f8fafc;
  color: #7f93b3;
}

.alarm-radio-row,
.alarm-check-row {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  font-weight: 800;
  color: #102372;
}

.alarm-radio-row input,
.alarm-check-row input {
  width: 0.9375rem;
  height: 0.9375rem;
  flex-shrink: 0;
  accent-color: #102372;
}

.alarm-check-row {
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  padding: 0.5rem 0.625rem;
}

.alarm-check-row > span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.alarm-mini-button {
  display: inline-flex;
  height: 2.25rem;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  border: 1px solid #cfd8e6;
  background: #ffffff;
  padding: 0 0.75rem;
  font-size: 0.75rem;
  font-weight: 900;
  color: #102372;
  transition:
    border-color 0.16s ease,
    color 0.16s ease,
    background-color 0.16s ease;
}

.alarm-mini-button:hover {
  border-color: #ff6600;
  color: #ff6600;
  background: #fff8f3;
}

.alarm-mini-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}
</style>
