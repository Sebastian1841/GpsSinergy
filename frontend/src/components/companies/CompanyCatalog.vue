<template>
  <section
    class="flex min-h-0 flex-col overflow-hidden rounded-lg border border-[#cfd7e3] bg-white shadow-sm"
  >
    <header class="shrink-0 border-b-2 border-[#FF6600] bg-[#102372] px-3 py-2">
      <div
        class="hidden grid-cols-[minmax(220px,1.4fr)_120px_150px_130px_150px_170px] items-center gap-3 text-[10px] font-black uppercase tracking-[0.04em] xl:grid"
      >
        <button
          v-for="option in sortOptions"
          :key="option.key"
          type="button"
          class="inline-flex items-center gap-1 text-left transition"
          :class="sortKey === option.key ? 'text-white' : 'text-white/65 hover:text-white'"
          @click="setSort(option.key)"
        >
          <span>{{ option.label }}</span>
          <svg
            viewBox="0 0 24 24"
            class="h-3 w-3 transition"
            :class="[
              sortKey === option.key ? 'opacity-100' : 'opacity-30',
              sortKey === option.key && sortDirection === 'desc' ? 'rotate-180' : '',
            ]"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="m7 14 5-5 5 5"
              stroke="currentColor"
              stroke-width="2.4"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
        <span class="text-right text-white/65">Acciones</span>
      </div>

      <div class="flex items-center justify-between xl:hidden">
        <h2 class="text-[13px] font-black text-white">Empresas registradas</h2>
        <span class="text-[10px] font-black text-white/65">
          {{ companies.length }} resultado{{ companies.length === 1 ? "" : "s" }}
        </span>
      </div>
    </header>

    <div class="min-h-0 flex-1 overflow-auto">
      <article
        v-for="company in sortedCompanies"
        :key="company.id"
        class="grid gap-3 border-b border-[#edf1f5] bg-white px-3 py-3 transition last:border-b-0 even:bg-[#fbfcfe] hover:bg-[#eef3ff]/60 xl:grid-cols-[minmax(220px,1.4fr)_120px_150px_130px_150px_170px] xl:items-center"
      >
        <div class="min-w-0">
          <h2 class="truncate text-[13px] font-black text-[#102372]">
            {{ company.name }}
          </h2>
          <p class="mt-0.5 truncate text-[10px] font-semibold text-slate-500">
            {{ company.rut }} - {{ company.city || "Sin ciudad" }}
          </p>
        </div>

        <div>
          <span
            class="inline-flex rounded-full px-2 py-1 text-[9px] font-black"
            :class="getCompanyStatusClass(company.status)"
          >
            {{ getCompanyStatusLabel(company.status) }}
          </span>
        </div>

        <div class="grid grid-cols-2 gap-1 xl:block">
          <p class="text-[12px] font-black text-[#172033]">
            {{ company.assetsCount || 0 }} activos
          </p>
          <p class="text-[10px] font-semibold text-emerald-700">
            {{ getCompanyHealth(company) }}% online
          </p>
        </div>

        <div>
          <span
            class="inline-flex rounded-full border border-[#dbe5ff] bg-[#eef3ff] px-2 py-1 text-[10px] font-black text-[#102372]"
          >
            {{ getEnabledReportsCount(company) }} habilitados
          </span>
        </div>

        <div class="min-w-0">
          <p class="truncate text-[10px] font-semibold text-slate-500">
            {{ company.lastTelemetryAt || "Sin telemetria" }}
          </p>
          <p
            class="mt-0.5 text-[10px] font-black"
            :class="company.alertsCount ? 'text-red-600' : 'text-slate-400'"
          >
            {{ company.alertsCount || 0 }} alertas
          </p>
        </div>

        <div class="grid grid-cols-2 gap-2 xl:flex xl:justify-end">
          <button
            type="button"
            class="inline-flex h-9 items-center justify-center rounded-lg bg-[#102372] px-3 text-[10px] font-black text-white transition hover:bg-[#0c1b59]"
            @click="$emit('enter-company', company)"
          >
            Entrar
          </button>

          <button
            type="button"
            class="h-9 rounded-lg border border-[#ffb27c] bg-white px-3 text-[10px] font-black text-[#FF6600] transition hover:bg-[#fff3eb]"
            @click="$emit('configure-company', company.id)"
          >
            Configurar
          </button>
        </div>
      </article>

      <div
        v-if="!sortedCompanies.length"
        class="m-3 flex min-h-[260px] flex-col items-center justify-center rounded-lg border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-5 text-center"
      >
        <p class="text-[13px] font-black text-[#102372]">Sin empresas encontradas</p>
        <button
          type="button"
          class="mt-3 rounded-lg border border-[#cfd7e3] bg-white px-3 py-2 text-[10px] font-black text-[#102372] hover:bg-[#f6f8fb]"
          @click="$emit('clear-filters')"
        >
          Limpiar filtros
        </button>
      </div>
    </div>

    <footer v-if="canShowMore" class="shrink-0 border-t border-[#edf1f5] bg-[#f8fafc] p-2">
      <button
        type="button"
        class="h-10 w-full rounded-lg border border-[#cfd7e3] bg-white text-[11px] font-black text-[#102372] transition hover:border-[#102372]/40 hover:bg-[#f6f8fb]"
        @click="$emit('show-more')"
      >
        Mostrar mas - quedan {{ visibleCompaniesRemaining }}
      </button>
    </footer>
  </section>
</template>

<script setup>
import { computed, ref } from "vue"

import { getCompanyStatusClass, getCompanyStatusLabel } from "../../utils/companies/companyUtils.js"

const props = defineProps({
  companies: {
    type: Array,
    default: () => [],
  },
  visibleCompaniesRemaining: {
    type: Number,
    default: 0,
  },
  canShowMore: {
    type: Boolean,
    default: false,
  },
  getCompanyHealth: {
    type: Function,
    required: true,
  },
})

defineEmits(["configure-company", "clear-filters", "show-more", "enter-company"])

const sortOptions = [
  { key: "name", label: "Empresa" },
  { key: "status", label: "Estado" },
  { key: "fleet", label: "Flota" },
  { key: "reports", label: "Reportes" },
  { key: "signal", label: "Ultima senal" },
]

const sortKey = ref("name")
const sortDirection = ref("asc")

const setSort = (key) => {
  if (sortKey.value === key) {
    sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc"
    return
  }

  sortKey.value = key
  sortDirection.value = key === "fleet" || key === "reports" ? "desc" : "asc"
}

const getEnabledReportsCount = (company) => {
  return (company.reports || []).filter((reportAccess) => reportAccess.enabled).length
}

const getSignalSortValue = (company) => {
  const signal = (company.lastTelemetryAt || "").toLowerCase()
  const value = Number(signal.match(/\d+/)?.[0])

  if (!Number.isFinite(value)) return Number.MAX_SAFE_INTEGER
  if (signal.includes("hora")) return value * 60
  if (signal.includes("dia")) return value * 1440

  return value
}

const getSortValue = (company) => {
  if (sortKey.value === "status") return getCompanyStatusLabel(company.status)
  if (sortKey.value === "fleet") return Number(company.assetsCount) || 0
  if (sortKey.value === "reports") return getEnabledReportsCount(company)
  if (sortKey.value === "signal") return getSignalSortValue(company)

  return company.name || ""
}

const sortedCompanies = computed(() => {
  const direction = sortDirection.value === "asc" ? 1 : -1

  return [...props.companies].sort((firstCompany, secondCompany) => {
    const firstValue = getSortValue(firstCompany)
    const secondValue = getSortValue(secondCompany)

    if (typeof firstValue === "number" && typeof secondValue === "number") {
      return (firstValue - secondValue) * direction
    }

    return String(firstValue).localeCompare(String(secondValue), "es") * direction
  })
})
</script>
