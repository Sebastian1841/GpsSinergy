<template>
  <div class="space-y-2">
    <div
      v-if="feedbackMessage"
      class="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-black text-emerald-700"
    >
      {{ feedbackMessage }}
    </div>

    <div class="rounded-lg border border-[#d8e0eb] bg-white p-2.5 shadow-sm">
      <div
        class="alarm-rule-filter-grid"
        :class="{ 'has-inbox': inboxTo, 'integrated-clear': integratedClear }"
      >
        <div class="alarm-rule-search group relative min-w-0">
          <span
            class="pointer-events-none absolute left-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center text-[#102372] transition group-focus-within:text-[#ff6600]"
          >
            <SvgIcon name="search" class="h-4 w-4" />
          </span>

          <input
            v-model="localSearchTerm"
            type="search"
            aria-label="Buscar alerta por nombre o tipo"
            placeholder="Buscar alerta por nombre o tipo..."
            class="h-10 w-full rounded-lg border border-[#cfd8e6] bg-white pl-10 pr-3 text-[12px] font-bold text-[#172033] shadow-sm outline-none transition placeholder:text-[#7f93b3] hover:border-[#b9c5d6] focus:border-[#102372] focus:ring-2 focus:ring-[#102372]/10"
            :class="{ 'has-clear-button': integratedClear }"
          />
          <button
            v-if="integratedClear"
            type="button"
            class="alarm-search-clear"
            aria-label="Limpiar búsqueda y filtros"
            title="Limpiar búsqueda y filtros"
            @click="$emit('clear')"
          >
            <SvgIcon name="filter-clear" />Limpiar
          </button>
        </div>

        <label class="alarm-config-filter">
          <span>Tipo</span>
          <select v-model="localSelectedType">
            <option value="all">Todos</option>
            <option v-for="option in typeOptions" :key="option.id" :value="option.id">
              {{ option.label }}
            </option>
          </select>
        </label>

        <label class="alarm-config-filter">
          <span>Empresa</span>
          <select v-model="localSelectedCompanyId" :disabled="isCompanyLocked">
            <option value="all">Todas</option>
            <option v-for="option in companyOptions" :key="option.id" :value="option.id">
              {{ option.label }}
            </option>
          </select>
        </label>

        <label class="alarm-config-filter">
          <span>Estado</span>
          <select v-model="localSelectedStatus">
            <option value="all">Todos</option>
            <option value="enabled">Activas</option>
            <option value="disabled">Desactivadas</option>
          </select>
        </label>

        <button
          v-if="!integratedClear"
          type="button"
          class="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#d8e0eb] bg-white px-3 text-[12px] font-black text-[#102372] shadow-sm transition hover:border-[#ff6600] hover:text-[#ff6600]"
          @click="$emit('clear')"
        >
          <SvgIcon name="filter-clear" class="h-[18px] w-[18px]" />
          Limpiar
        </button>

        <RouterLink
          v-if="inboxTo"
          :to="{ path: inboxTo, query: { panel: 'history' } }"
          class="alarm-inbox-link"
          >Ver la bandeja</RouterLink>

        <button
          type="button"
          class="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#ff6600] px-4 text-[12px] font-black text-white shadow-sm transition-colors hover:bg-[#e65c00] disabled:cursor-not-allowed disabled:bg-slate-300"
          :disabled="!canManage"
          @click="$emit('create')"
        >
          <SvgIcon name="plus" class="h-4 w-4" />
          Nueva alerta
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue"

import SvgIcon from "../icons/SvgIcon.vue"

const props = defineProps({
  integratedClear: { type: Boolean, default: false },
  inboxTo: { type: String, default: "" },
  feedbackMessage: {
    type: String,
    default: "",
  },
  searchTerm: {
    type: String,
    default: "",
  },
  selectedType: {
    type: String,
    default: "all",
  },
  selectedCompanyId: {
    type: String,
    default: "all",
  },
  selectedStatus: {
    type: String,
    default: "all",
  },
  typeOptions: {
    type: Array,
    default: () => [],
  },
  companyOptions: {
    type: Array,
    default: () => [],
  },
  isCompanyLocked: {
    type: Boolean,
    default: false,
  },
  canManage: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  "clear",
  "create",
  "update:searchTerm",
  "update:selectedType",
  "update:selectedCompanyId",
  "update:selectedStatus",
])

const localSearchTerm = computed({
  get: () => props.searchTerm,
  set: (value) => emit("update:searchTerm", value),
})

const localSelectedType = computed({
  get: () => props.selectedType,
  set: (value) => emit("update:selectedType", value),
})

const localSelectedCompanyId = computed({
  get: () => props.selectedCompanyId,
  set: (value) => emit("update:selectedCompanyId", value),
})

const localSelectedStatus = computed({
  get: () => props.selectedStatus,
  set: (value) => emit("update:selectedStatus", value),
})
</script>

<style scoped>
.alarm-rule-search input.has-clear-button {
  padding-right: 100px;
}
.alarm-search-clear {
  position: absolute;
  right: 5px;
  top: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 30px;
  padding: 0 10px;
  border: 0;
  border-left: 1px solid #d8e0eb;
  background: transparent;
  color: #102372;
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
}
.alarm-search-clear :deep(.svg-icon-wrapper) {
  width: 16px;
  height: 16px;
}
.alarm-search-clear:focus-visible {
  outline: 2px solid #ff6600;
  outline-offset: 1px;
}
@media (min-width: 1280px) {
  .alarm-rule-filter-grid.integrated-clear {
    grid-template-columns: minmax(240px, 1fr) 150px 170px 150px 140px;
  }
  .alarm-rule-filter-grid.has-inbox.integrated-clear {
    grid-template-columns: minmax(240px, 1fr) 140px 160px 140px 130px 140px;
  }
}
.alarm-rule-filter-grid {
  display: grid;
  gap: 8px;
  grid-template-columns: minmax(0, 1fr);
}
.alarm-inbox-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  padding: 0 12px;
  border: 1px solid #d8e0eb;
  border-radius: 8px;
  background: white;
  color: #102372;
  font-size: 12px;
  font-weight: 800;
  text-decoration: none;
  white-space: nowrap;
  box-shadow: 0 1px 2px #0f172a0d;
}
.alarm-inbox-link:focus-visible {
  outline: 2px solid #ff6600;
  outline-offset: 2px;
}
@media (min-width: 768px) {
  .alarm-rule-filter-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (min-width: 1280px) {
  .alarm-rule-filter-grid {
    grid-template-columns: minmax(200px, 1fr) 150px 170px 150px 104px 140px;
  }
  .alarm-rule-filter-grid.has-inbox {
    grid-template-columns: minmax(180px, 1fr) 140px 160px 140px 104px 130px 140px;
  }
}
.alarm-config-filter {
  display: flex;
  min-width: 0;
  height: 2.5rem;
  align-items: center;
  gap: 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid #cfd8e6;
  background: #ffffff;
  padding: 0 0.625rem;
  box-shadow: 0 1px 2px rgb(15 23 42 / 0.05);
}

.alarm-config-filter > span {
  flex-shrink: 0;
  font-size: 0.6875rem;
  font-weight: 900;
  color: #5f7396;
}

.alarm-config-filter > select {
  min-width: 0;
  flex: 1;
  border: 0;
  background: transparent;
  font-size: 0.75rem;
  font-weight: 900;
  color: #102372;
  outline: none;
}
</style>
