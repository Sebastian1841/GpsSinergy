<template>
  <header class="shrink-0 bg-[#f6f8fb]">
    <section class="px-4 pb-4 pt-5 sm:px-8">
      <div
        class="flex flex-col gap-3 border-b border-[#dfe5ed] pb-4 lg:flex-row lg:items-start lg:justify-between"
      >
        <div class="min-w-0">
          <h1 class="text-[24px] font-black leading-tight text-[#102372] sm:text-[27px]">
            Gestion de empresas
          </h1>
          <p class="mt-1 text-[11px] font-bold text-slate-500">
            Administra y accede rapidamente a todas las empresas de la plataforma.
          </p>
        </div>

        <button
          type="button"
          class="inline-flex h-10 shrink-0 items-center justify-center gap-2.5 rounded-lg bg-[#ff6600] px-5 text-[12px] font-black text-white shadow-sm transition hover:bg-[#e65c00]"
          @click="$emit('create-company')"
        >
          <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" aria-hidden="true">
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
            />
          </svg>
          Nueva empresa
        </button>
      </div>

      <div
        class="grid gap-3 border-b border-[#dfe5ed] py-3 xl:grid-cols-[minmax(260px,420px)_minmax(0,1fr)_auto] xl:items-center"
      >
        <label class="group relative min-w-0">
          <span
            class="pointer-events-none absolute left-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md bg-[#eef3ff] text-[#102372] transition group-focus-within:bg-[#102372] group-focus-within:text-white"
          >
            <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" aria-hidden="true">
              <path
                d="m20 20-4.35-4.35M18 10.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          </span>

          <input
            v-model="searchModel"
            type="text"
            placeholder="Buscar empresa, RUT o ciudad..."
            class="h-10 w-full rounded-lg border border-[#cfd8e6] bg-white pl-11 pr-[86px] text-[12px] font-bold text-[#172033] shadow-sm outline-none transition placeholder:text-slate-400 hover:border-[#b9c5d6] focus:border-[#102372] focus:ring-2 focus:ring-[#102372]/10"
          />

          <button
            v-if="searchModel"
            type="button"
            class="absolute right-[54px] top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-[#102372]"
            aria-label="Limpiar busqueda"
            @click="searchModel = ''"
          >
            <svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" aria-hidden="true">
              <path
                d="M7 7l10 10M17 7 7 17"
                stroke="currentColor"
                stroke-width="2.4"
                stroke-linecap="round"
              />
            </svg>
          </button>

          <span
            class="pointer-events-none absolute right-2.5 top-1/2 hidden h-6 -translate-y-1/2 items-center rounded-md border border-[#dfe5ed] bg-[#f8fafc] px-2 text-[9px] font-black uppercase tracking-[0.08em] text-slate-400 sm:inline-flex"
          >
            Enter
          </span>
        </label>

        <div
          class="flex min-w-0 flex-col gap-2 rounded-xl border border-[#dfe5ed] bg-white p-1.5 shadow-sm sm:flex-row sm:items-center"
        >
          <span
            class="shrink-0 px-2 text-[9px] font-black uppercase tracking-[0.12em] text-slate-400"
          >
            Estado
          </span>

          <div class="grid min-w-0 flex-1 grid-cols-3 gap-1">
            <button
              v-for="filter in statusFilters"
              :key="filter.value"
              type="button"
              class="inline-flex h-8 min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 text-[10px] font-black transition"
              :class="
                selectedStatus === filter.value
                  ? 'bg-[#102372] text-white shadow-sm'
                  : 'text-[#102372] hover:bg-[#eef3ff]'
              "
              @click="$emit('select-status', filter.value)"
            >
              <span
                class="flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
                :class="selectedStatus === filter.value ? 'bg-white/12' : filter.iconClass"
              >
                <svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" aria-hidden="true">
                  <path
                    :d="filter.iconPath"
                    stroke="currentColor"
                    stroke-width="2.1"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </span>
              <span class="truncate">{{ filter.label }}</span>
            </button>
          </div>
        </div>

        <button
          type="button"
          class="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#dfe5ed] bg-white px-3 text-[11px] font-black text-slate-500 shadow-sm transition hover:border-[#102372]/25 hover:text-[#102372]"
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
          Limpiar filtros
        </button>
      </div>

      <div class="flex flex-wrap justify-center gap-2 pt-4">
        <article
          v-for="item in summaryCards"
          :key="item.key"
          class="flex h-[48px] min-w-[124px] items-center justify-center gap-2.5 rounded-lg border border-[#dfe5ed] bg-white px-4 shadow-sm"
        >
          <span
            class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
            :class="item.iconWrapClass"
          >
            <svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" aria-hidden="true">
              <path
                :d="item.iconPath"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </span>

          <span>
            <span class="block text-[16px] font-black leading-none text-[#102372]">
              {{ item.value }}
            </span>
            <span class="mt-0.5 block text-[9px] font-bold text-slate-500">
              {{ item.label }}
            </span>
          </span>
        </article>
      </div>
    </section>
  </header>
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
  summaryItems: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(["clear-filters", "create-company", "select-status", "update:search-term"])

const searchModel = computed({
  get: () => props.searchTerm,
  set: (value) => emit("update:search-term", value),
})

const statusFilters = [
  {
    value: "all",
    label: "Todas",
    iconClass: "bg-[#eef3ff] text-[#102372]",
    iconPath: "M5 5h5v5H5V5Zm9 0h5v5h-5V5ZM5 14h5v5H5v-5Zm9 0h5v5h-5v-5Z",
  },
  {
    value: "active",
    label: "Activas",
    iconClass: "bg-emerald-50 text-emerald-600",
    iconPath: "M9 12.5 11 14.5 15.5 9.5M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z",
  },
  {
    value: "inactive",
    label: "Suspendidas",
    iconClass: "bg-orange-50 text-[#ff6600]",
    iconPath: "M9 9h6v6H9V9Zm3 12a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z",
  },
]

const summaryByKey = computed(() => {
  return new Map(props.summaryItems.map((item) => [item.key, item]))
})

const getSummaryValue = (key) => {
  return summaryByKey.value.get(key)?.value ?? 0
}

const summaryCards = computed(() => [
  {
    key: "all",
    label: "empresas",
    value: getSummaryValue("all"),
    iconWrapClass: "bg-[#eef3ff] text-[#102372]",
    iconPath: "M4 20V8l8-4 8 4v12M8 20v-6h8v6M9 10h.01M15 10h.01",
  },
  {
    key: "active",
    label: "activas",
    value: getSummaryValue("active"),
    iconWrapClass: "bg-emerald-50 text-emerald-600",
    iconPath: "M12 12h.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z",
  },
  {
    key: "inactive",
    label: "suspendidas",
    value: getSummaryValue("inactive"),
    iconWrapClass: "bg-orange-50 text-[#ff6600]",
    iconPath: "M12 12h.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z",
  },
  {
    key: "internal",
    label: "inactiva",
    value: getSummaryValue("internal"),
    iconWrapClass: "bg-slate-100 text-slate-500",
    iconPath: "M12 12h.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z",
  },
])
</script>
