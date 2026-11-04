<template>
  <section class="alarm-modal-card" :class="{ 'wizard-scope': wizard }">
    <div v-if="!wizard" class="alarm-modal-card-title">
      <span class="alarm-step-number">2</span>
      <div class="min-w-0">
        <h3>Alcance</h3>
      </div>
    </div>

    <label v-if="!wizard && !draft.platformScope" class="alarm-form-field mt-3">
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

    <div v-if="!wizard" class="mt-3 space-y-2">
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

    <fieldset v-else class="scope-segments">
      <legend class="sr-only">Alcance de la regla</legend>
      <label :class="{ selected: draft.assetScope.type === 'all' }"
        ><input
          type="radio"
          name="wizard-asset-scope"
          value="all"
          :checked="draft.assetScope.type === 'all'"
          :disabled="!canManage"
          @change="$emit('set-asset-scope', 'all')"
        /><span>Toda la flota</span></label
      >
      <label :class="{ selected: draft.assetScope.type === 'specific' }"
        ><input
          type="radio"
          name="wizard-asset-scope"
          value="specific"
          :checked="draft.assetScope.type === 'specific'"
          :disabled="!canManage"
          @change="$emit('set-asset-scope', 'specific')"
        /><span>Una lista de vehiculos</span></label
      >
    </fieldset>

    <div
      v-if="draftModel.assetScope.type === 'all'"
      class="mt-3 rounded-lg border border-[#cfe0ff] bg-[#eef5ff] px-3 py-2 text-[11px] font-semibold text-[#315078]"
    >
      {{
        draft.platformScope
          ? "Se aplicara a todos los vehiculos autorizados de la plataforma."
          : "Se aplicara a todos los activos autorizados de la empresa actual."
      }}
    </div>

    <div
      v-if="draftModel.assetScope.type === 'specific'"
      class="mt-3 space-y-2"
      :class="{ 'scope-picker': wizard }"
    >
      <div class="flex items-center gap-2" :class="{ 'scope-list-toolbar': wizard }">
        <div class="scope-search-field" :class="{ 'scope-search-field-wizard': wizard }">
          <label v-if="wizard" class="scope-search-label" for="wizard-scope-search"
            >Buscar vehiculo</label
          >
          <input
            :id="wizard ? 'wizard-scope-search' : undefined"
            v-model="localAssetSearchTerm"
            type="search"
            class="h-9 min-w-0 flex-1 rounded-lg border border-[#cfd8e6] px-3 text-[12px] font-bold text-[#102372] outline-none focus:border-[#102372] focus:ring-2 focus:ring-[#102372]/10"
            :placeholder="wizard ? 'Buscar por patente o nombre...' : 'Buscar activo...'"
          />
        </div>

        <AlarmRuleCompanyCombobox
          v-if="wizard && !isCompanyLocked"
          v-model="localAssetCompanyFilter"
          class="scope-company-filter"
          :options="companyOptions"
        />

        <button
          v-if="!wizard"
          type="button"
          class="alarm-mini-button"
          :disabled="!canManage"
          @click="$emit('select-all-assets')"
        >
          Todos
        </button>
      </div>

      <div v-if="wizard" class="scope-selection-toolbar">
        <div class="scope-bulk-actions">
          <button
            type="button"
            :disabled="!canManage || !filteredAssetsForDraftCompany.length"
            title="Seleccionar todos los vehiculos que coinciden con los filtros"
            @click="$emit('select-all-assets')"
          >
            <SvgIcon name="check" />Seleccionar todos
          </button>
          <button
            type="button"
            :disabled="!canManage || !selectedDraftAssetCount"
            title="Quitar todos los seleccionados, incluidos los ocultos por filtros"
            @click="$emit('clear-assets')"
          >
            <SvgIcon name="close" />Quitar seleccion
          </button>
        </div>
      </div>
      <div
        class="max-h-36 space-y-1.5 overflow-y-auto pr-1"
        :class="{ 'scope-vehicle-list': wizard }"
      >
        <p v-if="wizard && !visibleAssetsForDraftCompany.length" class="scope-empty">
          {{
            assetsForDraftCompany.length
              ? "No hay vehiculos que coincidan con los filtros."
              : "No hay vehiculos disponibles en esta empresa."
          }}
        </p>
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
          <template v-if="wizard">
            <span class="scope-plate">{{ asset.patente || asset.plate || "Sin patente" }}</span>
            <span class="scope-name">{{ asset.name || asset.label }}</span>
          </template>
          <span v-else>{{ asset.label }}</span>
        </label>
      </div>

      <p v-if="wizard" class="scope-count" aria-live="polite">
        {{ selectedDraftAssetCount }} seleccionados de {{ assetsForDraftCompany.length }} vehiculos
      </p>
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

    <p
      v-if="!wizard || draft.assetScope.type === 'all'"
      class="mt-3 text-[11px] font-black text-[#102372]"
    >
      {{ selectedDraftAssetCount }} de {{ assetsForDraftCompany.length }} activos cubiertos
    </p>
  </section>
</template>

<script setup>
import { computed } from "vue"
import AlarmRuleCompanyCombobox from "./AlarmRuleCompanyCombobox.vue"
import SvgIcon from "../icons/SvgIcon.vue"

const props = defineProps({
  assetCompanyFilter: { type: String, default: "all" },
  wizard: { type: Boolean, default: false },
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
  "update:assetCompanyFilter",
  "company-change",
  "select-all-assets",
  "clear-assets",
  "set-asset-scope",
  "toggle-asset",
  "toggle-asset-tag",
  "update:assetSearchTerm",
])

const draftModel = computed(() => props.draft)
const localAssetCompanyFilter = computed({
  get: () => props.assetCompanyFilter,
  set: (value) => emit("update:assetCompanyFilter", value),
})

const localAssetSearchTerm = computed({
  get: () => props.assetSearchTerm,
  set: (value) => emit("update:assetSearchTerm", value),
})
</script>

<style scoped>
.scope-selection-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  padding: 8px 0;
}
.scope-picker {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
}
.scope-picker > * {
  margin-top: 0;
}
.scope-picker .scope-list-toolbar {
  min-width: 0;
}
.scope-picker .scope-selection-toolbar {
  padding: 0;
}
.scope-picker .scope-count {
  grid-column: 1 / -1;
}
.scope-picker .scope-selection-toolbar > .scope-count {
  display: none;
}
.scope-picker .scope-vehicle-list,
.scope-picker > p {
  grid-column: 1 / -1;
}
.scope-picker .scope-search-label,
.scope-picker :deep(.company-combobox > label) {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
.scope-picker .scope-company-filter {
  flex-basis: 200px;
}
.scope-picker .scope-bulk-actions button {
  height: 40px;
}
@media (max-width: 900px) {
  .scope-picker {
    grid-template-columns: minmax(0, 1fr);
  }
  .scope-picker .scope-selection-toolbar {
    justify-content: flex-end;
  }
}
.scope-bulk-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.scope-bulk-actions button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 34px;
  padding: 0 10px;
  border: 1px solid #cfd8e6;
  border-radius: 6px;
  background: white;
  color: #102372;
  font-size: 12px;
  font-weight: 700;
}
.scope-bulk-actions button:hover:not(:disabled) {
  background: #eef3ff;
  border-color: #102372;
}
.scope-bulk-actions button:disabled {
  color: #91a1ba;
  cursor: not-allowed;
}
.scope-bulk-actions :deep(.svg-icon-wrapper) {
  width: 15px;
  height: 15px;
}
@media (max-width: 600px) {
  .scope-bulk-actions {
    width: 100%;
  }
  .scope-bulk-actions button {
    flex: 1;
  }
}
.scope-list-toolbar {
  align-items: flex-end;
}
.scope-search-field {
  flex: 1;
  min-width: 0;
}
.scope-search-field input {
  width: 100%;
}
.scope-search-label {
  display: block;
  margin-bottom: 6px;
  font-size: 11px;
  font-weight: 800;
  color: #49618a;
}
.scope-search-field-wizard input {
  height: 40px;
  font-size: 13px;
  font-weight: 500;
}
.scope-company-filter {
  display: block;
  flex: 0 1 240px;
  min-width: 150px;
}
.scope-company-filter > span {
  display: block;
  margin-bottom: 6px;
  font-size: 11px;
  font-weight: 800;
  color: #49618a;
}
.scope-company-filter select {
  width: 100%;
  height: 40px;
  border: 1px solid #cfd8e6;
  border-radius: 6px;
  padding: 0 10px;
  background: white;
  color: #102372;
  font-size: 12px;
}
@media (max-width: 600px) {
  .scope-list-toolbar {
    flex-wrap: wrap;
  }
  .scope-list-toolbar > .scope-search-field {
    flex-basis: 100%;
  }
  .scope-company-filter {
    flex: 1 1 100%;
  }
}
.wizard-scope {
  border: 0;
  padding: 0;
  border-radius: 0;
}
.scope-segments {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  flex-wrap: wrap;
}
.scope-segments label {
  display: flex;
  gap: 8px;
  align-items: center;
  min-height: 40px;
  padding: 0 14px;
  border: 1px solid #cfd8e6;
  border-radius: 6px;
  color: #102372;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}
.scope-segments label.selected {
  background: #102372;
  color: white;
  border-color: #102372;
}
.scope-segments input {
  accent-color: #ff6600;
}
.scope-count {
  color: #49618a;
  font-size: 13px;
  font-weight: 600;
  margin: 0;
}
.wizard-scope .scope-vehicle-list {
  max-height: 264px;
  overflow: auto;
  border: 1px solid #d8e0eb;
  border-radius: 6px;
  padding: 0;
}
.wizard-scope .alarm-check-row {
  display: grid;
  grid-template-columns: 18px 110px minmax(0, 1fr);
  gap: 14px;
  background: white;
  border: 0;
  border-bottom: 1px solid #e8edf4;
  border-radius: 0;
  min-height: 44px;
  margin: 0;
  padding: 10px 14px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
}
.wizard-scope .alarm-check-row:hover {
  background: #f7f9fc;
}
.wizard-scope .alarm-check-row:has(input:checked) {
  background: #eef3ff;
}
.wizard-scope .scope-plate {
  font-weight: 700;
}
.wizard-scope .scope-name {
  color: #49618a;
}
@media (max-width: 600px) {
  .wizard-scope .alarm-check-row {
    grid-template-columns: 18px 80px minmax(0, 1fr);
    gap: 10px;
    padding: 10px;
  }
}
.wizard-scope .alarm-check-row > span {
  white-space: normal;
  overflow-wrap: anywhere;
}
.scope-empty {
  color: #49618a;
  font-size: 12px;
  padding: 12px;
}
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
