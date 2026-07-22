<template>
  <section class="shrink-0">
    <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(280px,1fr)_200px_200px_auto_auto]">
      <label class="relative min-w-0 sm:col-span-2 lg:col-span-1">
        <span class="sr-only">Buscar registros</span>

        <svg
          class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>

        <input
          :value="searchTerm"
          class="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-xs font-medium text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#102372] focus:ring-2 focus:ring-[#102372]/10"
          type="search"
          placeholder="Buscar por usuario, accion o detalle..."
          @input="emit('update:search-term', $event.target.value)"
        />
      </label>

      <select
        :value="selectedModule"
        class="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition hover:border-slate-300 focus:border-[#102372] focus:ring-2 focus:ring-[#102372]/10"
        @change="emit('update:selected-module', $event.target.value)"
      >
        <option value="">Todos los modulos</option>

        <option v-for="module in moduleOptions" :key="module" :value="module">
          {{ getModuleLabel(module) }}
        </option>
      </select>

      <select
        :value="selectedStatus"
        class="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition hover:border-slate-300 focus:border-[#102372] focus:ring-2 focus:ring-[#102372]/10"
        @change="emit('update:selected-status', $event.target.value)"
      >
        <option value="">Todos los estados</option>

        <option v-for="status in statusOptions" :key="status" :value="status">
          {{ getStatusLabel(status) }}
        </option>
      </select>

      <button
        class="h-10 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        type="button"
        :disabled="!hasActiveFilters"
        @click="emit('clear-filters')"
      >
        Limpiar
      </button>

      <button
        class="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#ff6600] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#e65c00] disabled:cursor-not-allowed disabled:opacity-40"
        type="button"
        :disabled="!canExport || !hasRecords"
        @click="emit('export')"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>

        Exportar CSV
      </button>
    </div>
  </section>
</template>

<script setup>
defineProps({
  canExport: {
    type: Boolean,
    default: false,
  },
  getModuleLabel: {
    type: Function,
    required: true,
  },
  getStatusLabel: {
    type: Function,
    required: true,
  },
  hasActiveFilters: {
    type: Boolean,
    default: false,
  },
  hasRecords: {
    type: Boolean,
    default: false,
  },
  moduleOptions: {
    type: Array,
    default: () => [],
  },
  searchTerm: {
    type: String,
    default: "",
  },
  selectedModule: {
    type: String,
    default: "",
  },
  selectedStatus: {
    type: String,
    default: "",
  },
  statusOptions: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits([
  "clear-filters",
  "export",
  "update:search-term",
  "update:selected-module",
  "update:selected-status",
])
</script>
