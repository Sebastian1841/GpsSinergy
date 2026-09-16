<template>
  <section class="rounded-lg border border-[#dfe6f0] bg-white p-2.5 shadow-sm">
    <div class="grid gap-2 md:grid-cols-2 xl:grid-cols-[minmax(300px,1fr)_150px_170px_170px_112px]">
      <label class="group relative min-w-0">
        <span
          class="pointer-events-none absolute left-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-[#102372] transition group-focus-within:text-[#ff6600]"
        >
          <SvgIcon name="search" class="h-4 w-4" />
        </span>

        <input
          :value="searchTerm"
          type="search"
          placeholder="Buscar alerta, activo, patente o empresa..."
          class="h-10 w-full rounded-lg border border-[#d8e0eb] bg-white pl-10 pr-3 text-[12px] font-bold text-[#172033] outline-none transition placeholder:text-[#7f93b3] hover:border-[#b9c5d6] focus:border-[#102372] focus:ring-2 focus:ring-[#102372]/10"
          @input="$emit('update:search-term', $event.target.value)"
        />
      </label>

      <label class="alarm-filter-field">
        <span>Estado</span>
        <select
          :value="selectedStatus"
          @change="$emit('update:selected-status', $event.target.value)"
        >
          <option v-for="option in statusOptions" :key="option.id" :value="option.id">
            {{ option.label }}
          </option>
        </select>
      </label>

      <label class="alarm-filter-field">
        <span>Empresa</span>
        <select
          :value="selectedCompanyId"
          @change="$emit('update:selected-company-id', $event.target.value)"
        >
          <option value="all">Todas</option>
          <option v-for="option in companyOptions" :key="option.id" :value="option.id">
            {{ option.label }}
          </option>
        </select>
      </label>

      <label class="alarm-filter-field">
        <span>Fecha</span>
        <select
          :value="selectedDateRange"
          @change="$emit('update:selected-date-range', $event.target.value)"
        >
          <option v-for="option in dateRangeOptions" :key="option.id" :value="option.id">
            {{ option.label }}
          </option>
        </select>
      </label>

      <button
        type="button"
        class="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#d8e0eb] bg-white px-3 text-[12px] font-black text-[#102372] transition hover:border-[#ff6600] hover:text-[#ff6600]"
        @click="$emit('clear-filters')"
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
  </section>
</template>

<script setup>
import SvgIcon from "../icons/SvgIcon.vue"

defineProps({
  searchTerm: {
    type: String,
    default: "",
  },
  selectedStatus: {
    type: String,
    default: "all",
  },
  selectedCompanyId: {
    type: String,
    default: "all",
  },
  selectedDateRange: {
    type: String,
    default: "all",
  },
  statusOptions: {
    type: Array,
    default: () => [],
  },
  companyOptions: {
    type: Array,
    default: () => [],
  },
  dateRangeOptions: {
    type: Array,
    default: () => [],
  },
})

defineEmits([
  "update:search-term",
  "update:selected-status",
  "update:selected-company-id",
  "update:selected-date-range",
  "clear-filters",
])
</script>

<style scoped>
.alarm-filter-field {
  display: flex;
  min-width: 0;
  height: 2.5rem;
  align-items: center;
  gap: 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid #d8e0eb;
  background: #ffffff;
  padding: 0 0.625rem;
}

.alarm-filter-field > span {
  flex-shrink: 0;
  font-size: 0.6875rem;
  font-weight: 900;
  color: #5f7396;
}

.alarm-filter-field > select {
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
