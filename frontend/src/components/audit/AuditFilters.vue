<template>
  <section class="relative shrink-0">
    <div class="flex flex-wrap items-center justify-end gap-2">
      <!-- BUSCADOR -->
      <label
        class="flex h-12 min-w-[230px] flex-1 items-center gap-2.5 rounded-lg border border-[#d8dee8] bg-white px-3 shadow-sm transition focus-within:border-[#102372] sm:max-w-[290px]"
      >
        <svg
          class="h-4 w-4 shrink-0 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-4.35-4.35m1.85-5.4a7.25 7.25 0 11-14.5 0 7.25 7.25 0 0114.5 0z"
          />
        </svg>

        <input
          :value="searchTerm"
          type="search"
          class="min-w-0 flex-1 border-0 bg-transparent text-[13px] font-semibold text-[#172033] outline-none placeholder:text-slate-400"
          placeholder="Buscar en auditoría..."
          @input="emit('update:search-term', $event.target.value)"
        />
      </label>

      <!-- FECHAS -->
      <div
        class="flex h-12 min-w-[290px] items-center gap-2 rounded-lg border border-[#d8dee8] bg-white px-3 shadow-sm"
      >
        <svg
          class="h-4 w-4 shrink-0 text-[#102372]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 7V3m8 4V3M5 11h14M6 5h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2z"
          />
        </svg>

        <input
          :value="startDate"
          class="audit-date-input"
          type="date"
          aria-label="Fecha desde"
          @input="emit('update:start-date', $event.target.value)"
        />

        <span class="shrink-0 text-[12px] font-bold text-slate-300">
          -
        </span>

        <input
          :value="endDate"
          class="audit-date-input"
          type="date"
          aria-label="Fecha hasta"
          @input="emit('update:end-date', $event.target.value)"
        />
      </div>

      <!-- FILTROS -->
      <div class="relative">
        <button
          type="button"
          class="relative inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-[#d8dee8] bg-white px-4 text-[12px] font-black text-[#102372] shadow-sm transition hover:border-[#102372] hover:bg-[#f8fafc]"
          :class="
            showAdvancedFilters
              ? 'border-[#102372] bg-[#f7f9ff]'
              : ''
          "
          @click="showAdvancedFilters = !showAdvancedFilters"
        >
          <svg
            class="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 4h18l-7 8v6l-4 2v-8L3 4z"
            />
          </svg>

          Filtros

          <span
            v-if="hasAdvancedFilters"
            class="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#ff6600]"
          ></span>
        </button>

        <!-- PANEL DE FILTROS -->
        <div
          v-if="showAdvancedFilters"
          class="absolute right-0 top-[calc(100%+8px)] z-50 w-[320px] rounded-xl border border-[#d8dee8] bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.14)]"
        >
          <div class="flex items-center justify-between gap-3">
            <div>
              <h3 class="text-[14px] font-black text-[#102372]">
                Filtros
              </h3>

              <p class="mt-0.5 text-[11px] font-semibold text-slate-400">
                Refina los eventos mostrados.
              </p>
            </div>

            <button
              v-if="hasActiveFilters"
              type="button"
              class="text-[11px] font-black text-[#ff6600] transition hover:text-[#e65c00]"
              @click="handleClearFilters"
            >
              Limpiar
            </button>
          </div>

          <div class="mt-4 grid gap-3">
            <!-- ACCIÓN -->
            <label>
              <span class="filter-label">
                Acción
              </span>

              <select
                :value="selectedAction"
                class="filter-select"
                @change="emit('update:selected-action', $event.target.value)"
              >
                <option value="">
                  Todas las acciones
                </option>

                <option
                  v-for="action in actionOptions"
                  :key="action"
                  :value="action"
                >
                  {{ getActionLabel(action) }}
                </option>
              </select>
            </label>

            <!-- MÓDULO -->
            <label>
              <span class="filter-label">
                Módulo
              </span>

              <select
                :value="selectedModule"
                class="filter-select"
                @change="emit('update:selected-module', $event.target.value)"
              >
                <option value="">
                  Todos los módulos
                </option>

                <option
                  v-for="module in moduleOptions"
                  :key="module"
                  :value="module"
                >
                  {{ getModuleLabel(module) }}
                </option>
              </select>
            </label>

            <!-- ESTADO -->
            <label>
              <span class="filter-label">
                Estado
              </span>

              <select
                :value="selectedStatus"
                class="filter-select"
                @change="emit('update:selected-status', $event.target.value)"
              >
                <option value="">
                  Todos los estados
                </option>

                <option
                  v-for="status in statusOptions"
                  :key="status"
                  :value="status"
                >
                  {{ getStatusLabel(status) }}
                </option>
              </select>
            </label>
          </div>
        </div>
      </div>

      <!-- EXPORTAR -->
      <button
        type="button"
        class="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#ff6600] px-5 text-[12px] font-black text-white shadow-[0_8px_18px_rgba(255,102,0,0.2)] transition hover:bg-[#e65c00] disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="!canExport || !hasRecords"
        @click="emit('export')"
      >
        <svg
          class="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 3v12m0 0l-4-4m4 4l4-4M5 17v2a2 2 0 002 2h10a2 2 0 002-2v-2"
          />
        </svg>

        Exportar
      </button>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from "vue"

const props = defineProps({
  actionOptions: {
    type: Array,
    default: () => [],
  },
  canExport: {
    type: Boolean,
    default: false,
  },
  getActionLabel: {
    type: Function,
    required: true,
  },
  getModuleLabel: {
    type: Function,
    required: true,
  },
  getStatusLabel: {
    type: Function,
    required: true,
  },
  endDate: {
    type: String,
    default: "",
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
  selectedAction: {
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
  startDate: {
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
  "update:end-date",
  "update:search-term",
  "update:selected-action",
  "update:selected-module",
  "update:selected-status",
  "update:start-date",
])

const showAdvancedFilters = ref(false)

const hasAdvancedFilters = computed(() => {
  return Boolean(
    props.selectedAction ||
      props.selectedModule ||
      props.selectedStatus,
  )
})

const handleClearFilters = () => {
  emit("clear-filters")
}
</script>

<style scoped>
.audit-date-input {
  min-width: 0;
  width: 116px;
  border: 0;
  background: transparent;
  color: #334155;
  font-size: 12px;
  font-weight: 700;
  outline: none;
}

.filter-label {
  display: block;
  margin-bottom: 6px;
  color: #64748b;
  font-size: 11px;
  font-weight: 800;
}

.filter-select {
  width: 100%;
  height: 40px;
  border: 1px solid #d8dee8;
  border-radius: 8px;
  background: #ffffff;
  padding: 0 10px;
  color: #172033;
  font-size: 12px;
  font-weight: 700;
  outline: none;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.filter-select:focus {
  border-color: #102372;
  box-shadow: 0 0 0 2px rgba(16, 35, 114, 0.08);
}
</style>