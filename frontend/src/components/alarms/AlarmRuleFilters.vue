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
        class="grid gap-2 md:grid-cols-2 xl:grid-cols-[minmax(280px,1fr)_150px_170px_150px_104px]"
      >
        <label class="group relative min-w-0">
          <span
            class="pointer-events-none absolute left-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center text-[#102372] transition group-focus-within:text-[#ff6600]"
          >
            <SvgIcon name="search" class="h-4 w-4" />
          </span>

          <input
            v-model="localSearchTerm"
            type="search"
            placeholder="Buscar alerta por nombre o tipo..."
            class="h-10 w-full rounded-lg border border-[#cfd8e6] bg-white pl-10 pr-3 text-[12px] font-bold text-[#172033] shadow-sm outline-none transition placeholder:text-[#7f93b3] hover:border-[#b9c5d6] focus:border-[#102372] focus:ring-2 focus:ring-[#102372]/10"
          />
        </label>

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
          type="button"
          class="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#d8e0eb] bg-white px-3 text-[12px] font-black text-[#102372] shadow-sm transition hover:border-[#ff6600] hover:text-[#ff6600]"
          @click="$emit('clear')"
        >
          <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" aria-hidden="true">
            <path
              d="M4 12a8 8 0 0 1 13.66-5.66M20 12a8 8 0 0 1-13.66 5.66M8 5H4V1M16 19h4v4"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          Limpiar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue"

import SvgIcon from "../icons/SvgIcon.vue"

const props = defineProps({
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
})

const emit = defineEmits([
  "clear",
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
