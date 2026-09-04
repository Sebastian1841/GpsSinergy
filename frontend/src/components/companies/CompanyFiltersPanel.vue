<template>
  <aside
    class="flex min-h-[420px] flex-col self-stretch overflow-hidden rounded-xl border border-[#dfe5ed] bg-white"
  >
    <header class="border-b border-[#edf1f5] px-4 py-3.5">
      <h2 class="text-[12px] font-black text-[#102372]">Filtros</h2>

      <p class="mt-0.5 text-[9px] font-semibold text-slate-400">Refina el listado de empresas.</p>
    </header>

    <div class="flex flex-1 flex-col p-4">
      <div class="space-y-5">
        <!-- BUSQUEDA -->
        <div>
          <label
            for="company-filter-search"
            class="mb-1.5 block text-[9px] font-black uppercase tracking-[0.08em] text-slate-500"
          >
            Buscar
          </label>

          <div class="relative">
            <svg
              viewBox="0 0 24 24"
              class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="m20 20-4.35-4.35M18 10.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>

            <input
              id="company-filter-search"
              :value="searchTerm"
              type="text"
              placeholder="Nombre, RUT o ciudad..."
              class="h-9 w-full rounded-lg border border-[#d8dee8] bg-white pl-9 pr-8 text-[10px] font-semibold text-[#172033] outline-none transition placeholder:text-slate-400 focus:border-[#102372] focus:ring-2 focus:ring-[#102372]/5"
              @input="$emit('update:search-term', $event.target.value)"
            />

            <button
              v-if="searchTerm"
              type="button"
              class="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded text-slate-400 transition hover:bg-slate-100 hover:text-[#102372]"
              aria-label="Limpiar búsqueda"
              @click="$emit('update:search-term', '')"
            >
              <svg viewBox="0 0 24 24" class="h-3 w-3" fill="none" aria-hidden="true">
                <path
                  d="M7 7l10 10M17 7 7 17"
                  stroke="currentColor"
                  stroke-width="2.3"
                  stroke-linecap="round"
                />
              </svg>
            </button>
          </div>
        </div>

        <!-- ESTADO -->
        <div>
          <p class="mb-2 text-[9px] font-black uppercase tracking-[0.08em] text-slate-500">
            Estado
          </p>

          <div class="space-y-1">
            <button
              v-for="status in statusOptions"
              :key="status.id"
              type="button"
              class="flex h-9 w-full items-center justify-between rounded-lg px-2.5 text-left transition"
              :class="
                selectedStatus === status.id
                  ? 'bg-[#eef3ff] text-[#102372]'
                  : 'text-slate-600 hover:bg-slate-50'
              "
              @click="$emit('update:selected-status', status.id)"
            >
              <span class="flex min-w-0 items-center gap-2.5">
                <span
                  class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border"
                  :class="selectedStatus === status.id ? 'border-[#102372]' : 'border-[#cbd5e1]'"
                >
                  <span
                    v-if="selectedStatus === status.id"
                    class="h-2 w-2 rounded-full bg-[#102372]"
                  />
                </span>

                <span class="truncate text-[10px] font-bold">
                  {{ status.label }}
                </span>
              </span>

              <span
                class="ml-2 min-w-[24px] rounded-md bg-[#f5f7fa] px-1.5 py-0.5 text-center text-[9px] font-black text-slate-500"
              >
                {{ status.count }}
              </span>
            </button>
          </div>
        </div>

        <!-- REGION -->
        <div>
          <label
            for="company-region-filter"
            class="mb-1.5 block text-[9px] font-black uppercase tracking-[0.08em] text-slate-500"
          >
            Región
          </label>

          <select
            id="company-region-filter"
            :value="selectedRegion"
            class="h-9 w-full cursor-pointer rounded-lg border border-[#d8dee8] bg-white px-2.5 text-[10px] font-bold text-[#172033] outline-none transition focus:border-[#102372] focus:ring-2 focus:ring-[#102372]/5"
            @change="$emit('update:selected-region', $event.target.value)"
          >
            <option value="all">Todas las regiones</option>

            <option v-for="region in regionOptions" :key="region" :value="region">
              {{ region }}
            </option>
          </select>
        </div>

        <!-- CIUDAD -->
        <div>
          <label
            for="company-city-filter"
            class="mb-1.5 block text-[9px] font-black uppercase tracking-[0.08em] text-slate-500"
          >
            Ciudad
          </label>

          <select
            id="company-city-filter"
            :value="selectedCity"
            class="h-9 w-full cursor-pointer rounded-lg border border-[#d8dee8] bg-white px-2.5 text-[10px] font-bold text-[#172033] outline-none transition focus:border-[#102372] focus:ring-2 focus:ring-[#102372]/5"
            @change="$emit('update:selected-city', $event.target.value)"
          >
            <option value="all">Todas las ciudades</option>

            <option v-for="city in cityOptions" :key="city" :value="city">
              {{ city }}
            </option>
          </select>
        </div>
      </div>

      <!-- LIMPIAR -->
      <button
        type="button"
        class="mt-auto flex h-9 w-full items-center justify-center rounded-lg border border-[#d8dee8] bg-white text-[10px] font-black text-slate-500 transition hover:border-[#102372]/30 hover:bg-[#f8faff] hover:text-[#102372]"
        @click="$emit('clear-filters')"
      >
        Limpiar filtros
      </button>
    </div>
  </aside>
</template>

<script setup>
import { computed } from "vue"

const props = defineProps({
  searchTerm: {
    type: String,
    default: "",
  },
  selectedStatus: {
    type: String,
    default: "all",
  },
  selectedRegion: {
    type: String,
    default: "all",
  },
  selectedCity: {
    type: String,
    default: "all",
  },
  regionOptions: {
    type: Array,
    default: () => [],
  },
  cityOptions: {
    type: Array,
    default: () => [],
  },
  summaryItems: {
    type: Array,
    default: () => [],
  },
})

defineEmits([
  "update:search-term",
  "update:selected-status",
  "update:selected-region",
  "update:selected-city",
  "clear-filters",
])

const summaryByKey = computed(() => {
  return new Map(
    props.summaryItems.map((item) => {
      return [item.key, item]
    }),
  )
})

const getSummaryValue = (key) => {
  return summaryByKey.value.get(key)?.value ?? 0
}

const statusOptions = computed(() => {
  return [
    {
      id: "all",
      label: "Todas",
      count: getSummaryValue("all"),
    },
    {
      id: "active",
      label: "Activas",
      count: getSummaryValue("active"),
    },
    {
      id: "pending",
      label: "Suspendidas",
      count: getSummaryValue("pending"),
    },
    {
      id: "inactive",
      label: "Inactivas",
      count: getSummaryValue("inactive") + getSummaryValue("internal"),
    },
  ]
})
</script>
