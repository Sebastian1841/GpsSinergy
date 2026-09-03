<template>
  <section class="pb-2">
    <div>
      <div v-if="sortedCompanies.length" class="grid gap-3 xl:grid-cols-2">
        <article
          v-for="company in sortedCompanies"
          :key="company.id"
          class="grid min-h-[126px] cursor-pointer overflow-hidden rounded-lg border bg-white shadow-[0_10px_28px_rgba(15,35,114,0.055)] transition hover:border-[#ff6600]/25 hover:shadow-[0_16px_34px_rgba(15,35,114,0.085)] lg:grid-cols-[minmax(0,1fr)_158px]"
          :class="
            selectedCompanyId === company.id
              ? 'border-[#102372]/30 ring-2 ring-[#102372]/10'
              : 'border-[#edf1f7]'
          "
          @click="$emit('select-company', company.id)"
        >
          <div class="grid min-w-0 grid-rows-[auto_1fr]">
            <div class="flex min-w-0 items-start justify-between gap-3 px-4 py-4">
              <div class="flex min-w-0 items-start gap-3">
                <div
                  class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[15px] font-black text-white"
                  :class="getCompanyAvatarClass(company.status)"
                >
                  {{ getCompanyInitials(company.name) }}
                </div>

                <div class="min-w-0">
                  <h3
                    class="truncate text-[14px] font-black leading-tight"
                    :class="company.status === 'inactive' ? 'text-slate-500' : 'text-[#102372]'"
                  >
                    {{ company.name }}
                  </h3>
                  <p class="mt-1 truncate text-[10px] font-bold text-slate-500">
                    {{ company.rut || "Sin RUT" }}
                  </p>
                  <p
                    class="mt-1 flex min-w-0 items-center gap-1.5 truncate text-[10px] font-bold text-slate-500"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      class="h-3 w-3 shrink-0"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M12 21s7-4.6 7-11a7 7 0 1 0-14 0c0 6.4 7 11 7 11Z"
                        stroke="currentColor"
                        stroke-width="2"
                      />
                      <path
                        d="M12 10.5h.01"
                        stroke="currentColor"
                        stroke-width="3"
                        stroke-linecap="round"
                      />
                    </svg>
                    <span class="truncate">{{ locationLabel(company) }}</span>
                  </p>
                </div>
              </div>

              <span
                class="inline-flex shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black"
                :class="getStatusPillClass(company.status)"
              >
                {{ getCompanyStatusLabel(company.status) }}
              </span>
            </div>

            <div class="grid grid-cols-3 divide-x divide-[#edf1f5] border-t border-[#edf1f5]">
              <div
                v-for="metric in getCompanyMetrics(company)"
                :key="metric.label"
                class="flex items-center gap-2 px-4 py-2.5"
              >
                <span class="text-[#102372]" :class="metric.accentClass">
                  <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" aria-hidden="true">
                    <path
                      :d="metric.iconPath"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </span>
                <span class="min-w-0">
                  <span
                    class="block text-[12px] font-black leading-none"
                    :class="metric.valueClass"
                  >
                    {{ metric.value }}
                  </span>
                  <span class="mt-0.5 block truncate text-[9px] font-bold text-slate-500">
                    {{ metric.label }}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <aside class="grid border-t border-[#edf1f5] px-4 py-4 lg:border-l lg:border-t-0">
            <div class="grid content-start gap-2">
              <button
                type="button"
                class="inline-flex h-8 items-center justify-center gap-2 rounded-lg px-3 text-[10px] font-black text-white transition"
                :class="
                  company.status === 'inactive'
                    ? 'bg-slate-500 hover:bg-slate-600'
                    : getPrimaryActionClass(company.status)
                "
                @click.stop="$emit('enter-company', company)"
              >
                <svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" aria-hidden="true">
                  <path
                    d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"
                    stroke="currentColor"
                    stroke-width="2.2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                Abrir empresa
              </button>

              <button
                type="button"
                class="inline-flex h-8 items-center justify-center gap-2 rounded-lg border border-[#e3e9f2] bg-white px-3 text-[10px] font-black text-[#102372] transition hover:border-[#cfd8e6] hover:bg-[#f6f8fb]"
                @click.stop="$emit('configure-company', company.id)"
              >
                <svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" aria-hidden="true">
                  <path
                    d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 1.55V21a2 2 0 0 1-4 0v-.05A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 0 1 0-4h.05A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3a2 2 0 0 1 4 0v.05A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.55 1H21a2 2 0 0 1 0 4h-.05A1.7 1.7 0 0 0 19.4 15Z"
                    stroke="currentColor"
                    stroke-width="1.8"
                  />
                </svg>
                Configurar
              </button>

              <button
                type="button"
                class="inline-flex h-8 items-center justify-center gap-2 rounded-lg px-3 text-[10px] font-black text-[#102372] transition hover:bg-[#f6f8fb]"
                @click.stop="$emit('configure-company', company.id)"
              >
                <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" aria-hidden="true">
                  <path
                    d="M12 5h.01M12 12h.01M12 19h.01"
                    stroke="currentColor"
                    stroke-width="3"
                    stroke-linecap="round"
                  />
                </svg>
                Mas acciones
              </button>
            </div>
          </aside>
        </article>
      </div>

      <div
        v-else
        class="flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-dashed border-[#cbd5e1] bg-white p-5 text-center"
      >
        <p class="text-[13px] font-black text-[#102372]">Sin empresas encontradas</p>
        <button
          type="button"
          class="mt-3 rounded-lg border border-[#e3e9f2] bg-white px-3 py-2 text-[10px] font-black text-[#102372] hover:border-[#cfd8e6] hover:bg-[#f6f8fb]"
          @click="$emit('clear-filters')"
        >
          Limpiar filtros
        </button>
      </div>
    </div>

    <footer v-if="canShowMore" class="shrink-0 pt-3">
      <button
        type="button"
        class="h-10 w-full rounded-lg border border-[#e3e9f2] bg-white text-[11px] font-black text-[#102372] transition hover:border-[#102372]/25 hover:bg-[#f6f8fb]"
        @click="$emit('show-more')"
      >
        Mostrar mas - quedan {{ visibleCompaniesRemaining }}
      </button>
    </footer>
  </section>
</template>

<script setup>
import { computed, ref } from "vue"

import { getCompanyInitials, getCompanyStatusLabel } from "../../utils/companies/companyUtils.js"

const props = defineProps({
  companies: {
    type: Array,
    default: () => [],
  },
  selectedCompanyId: {
    type: String,
    default: "",
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

defineEmits(["configure-company", "clear-filters", "show-more", "enter-company", "select-company"])

const sortKey = ref("name")
const sortDirection = ref("asc")

const getEnabledReportsCount = (company) => {
  return (company.reports || []).filter((reportAccess) => reportAccess.enabled).length
}

const getCompanyMetrics = (company) => {
  const isMuted = company.status === "inactive"
  const valueClass = isMuted ? "text-slate-500" : "text-[#102372]"
  const accentClass =
    company.status === "pending" ? "text-[#ff6600]" : isMuted ? "text-slate-500" : "text-[#102372]"

  return [
    {
      label: "Activos",
      value: company.assetsCount || 0,
      valueClass,
      accentClass,
      iconPath:
        "M3 17h2l1.6-5.6A2 2 0 0 1 8.5 10h7a2 2 0 0 1 1.9 1.4L19 17h2M7 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM8 10V7a4 4 0 0 1 8 0v3",
    },
    {
      label: "Usuarios",
      value: company.usersCount || 0,
      valueClass,
      accentClass,
      iconPath:
        "M16 21v-2a4 4 0 0 0-8 0v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
    },
    {
      label: "Reportes base",
      value: getEnabledReportsCount(company),
      valueClass,
      accentClass,
      iconPath: "M4 19V5M4 19h16M8 15l3-3 3 2 5-7",
    },
  ]
}

const getCompanyAvatarClass = (status) => {
  if (status === "pending") return "bg-[#ff6600]"
  if (status === "inactive") return "bg-slate-500"

  return "bg-[#102372]"
}

const getStatusPillClass = (status) => {
  if (status === "active") return "bg-emerald-50 text-emerald-700"
  if (status === "pending") return "bg-[#fff3eb] text-[#ff6600]"
  if (status === "inactive") return "bg-slate-100 text-slate-500"

  return "bg-[#eef3ff] text-[#102372]"
}

const getPrimaryActionClass = (status) => {
  if (status === "pending") return "bg-[#ff6600] hover:bg-[#e65c00]"

  return "bg-[#102372] hover:bg-[#0c1b59]"
}

const locationLabel = (company) => {
  return [company.city, company.region].filter(Boolean).join(", ") || "Sin ubicacion"
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
