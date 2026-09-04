<template>
  <section class="overflow-hidden rounded-xl border border-[#dfe5ed] bg-white">
    <!-- TOOLBAR -->
    <header
      class="flex flex-col gap-3 border-b border-[#edf1f5] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <p class="text-[12px] font-black text-[#102372]">
          {{ totalCompanies }} {{ totalCompanies === 1 ? "empresa" : "empresas" }}
        </p>

        <p class="mt-0.5 text-[9px] font-semibold text-slate-400">
          Listado de empresas disponibles en la plataforma.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <span class="text-[9px] font-black uppercase tracking-[0.08em] text-slate-400">
          Ordenar por
        </span>

        <select
          :value="sortKey"
          class="h-8 cursor-pointer rounded-lg border border-[#d8dee8] bg-white px-2.5 text-[10px] font-bold text-[#102372] outline-none transition focus:border-[#102372]"
          @change="$emit('update:sort-key', $event.target.value)"
        >
          <option value="name">Nombre</option>
          <option value="status">Estado</option>
          <option value="assets">Activos</option>
          <option value="users">Usuarios</option>
          <option value="reports">Reportes base</option>
        </select>

        <button
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d8dee8] bg-white text-[#102372] transition hover:bg-[#f6f8fb]"
          :aria-label="sortDirection === 'asc' ? 'Orden descendente' : 'Orden ascendente'"
          @click="$emit('update:sort-direction', sortDirection === 'asc' ? 'desc' : 'asc')"
        >
          <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" aria-hidden="true">
            <path
              v-if="sortDirection === 'asc'"
              d="M8 18V5m0 0L4.5 8.5M8 5l3.5 3.5M16 6h4M16 11h3M16 16h2"
              stroke="currentColor"
              stroke-width="1.9"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              v-else
              d="M8 6v13m0 0-3.5-3.5M8 19l3.5-3.5M16 6h2M16 11h3M16 16h4"
              stroke="currentColor"
              stroke-width="1.9"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>

        <div class="flex overflow-hidden rounded-lg border border-[#d8dee8]">
          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center transition"
            :class="
              viewMode === 'table'
                ? 'bg-[#102372] text-white'
                : 'bg-white text-slate-400 hover:text-[#102372]'
            "
            aria-label="Vista tabla"
            @click="$emit('update:view-mode', 'table')"
          >
            <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" aria-hidden="true">
              <path
                d="M4 6h16M4 12h16M4 18h16"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          </button>

          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center border-l border-[#d8dee8] transition"
            :class="
              viewMode === 'grid'
                ? 'bg-[#102372] text-white'
                : 'bg-white text-slate-400 hover:text-[#102372]'
            "
            aria-label="Vista cuadrícula"
            @click="$emit('update:view-mode', 'grid')"
          >
            <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" aria-hidden="true">
              <path
                d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>

    <!-- TABLA -->
    <div v-if="companies.length && viewMode === 'table'" class="overflow-x-auto">
      <table class="w-full min-w-[920px] border-collapse">
        <thead>
          <tr class="border-b border-[#edf1f5] bg-[#f8fafc]">
            <th
              class="px-4 py-3 text-left text-[9px] font-black uppercase tracking-[0.08em] text-slate-400"
            >
              Empresa
            </th>

            <th
              class="px-4 py-3 text-left text-[9px] font-black uppercase tracking-[0.08em] text-slate-400"
            >
              RUT
            </th>

            <th
              class="px-4 py-3 text-left text-[9px] font-black uppercase tracking-[0.08em] text-slate-400"
            >
              Ubicación
            </th>

            <th
              class="px-4 py-3 text-left text-[9px] font-black uppercase tracking-[0.08em] text-slate-400"
            >
              Estado
            </th>

            <th
              class="px-4 py-3 text-center text-[9px] font-black uppercase tracking-[0.08em] text-slate-400"
            >
              Activos
            </th>

            <th
              class="px-4 py-3 text-center text-[9px] font-black uppercase tracking-[0.08em] text-slate-400"
            >
              Usuarios
            </th>

            <th
              class="px-4 py-3 text-center text-[9px] font-black uppercase tracking-[0.08em] text-slate-400"
            >
              Reportes base
            </th>

            <th
              class="w-[124px] px-4 py-3 text-center text-[9px] font-black uppercase tracking-[0.08em] text-slate-400"
            >
              Acciones
            </th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="company in companies"
            :key="company.id"
            class="cursor-pointer border-b border-[#f0f3f7] transition last:border-b-0 hover:bg-[#f9fbff]"
            :class="selectedCompanyId === company.id ? 'bg-[#f5f7ff]' : ''"
            @click="$emit('select-company', company.id)"
          >
            <!-- EMPRESA -->
            <td class="px-4 py-3.5">
              <div class="flex min-w-[180px] items-center gap-3">
                <div
                  class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-black text-white"
                  :class="getCompanyAvatarClass(company.status)"
                >
                  {{ getCompanyInitials(company.name) }}
                </div>

                <div class="min-w-0">
                  <p
                    class="max-w-[210px] truncate text-[11px] font-black"
                    :class="company.status === 'inactive' ? 'text-slate-500' : 'text-[#102372]'"
                  >
                    {{ company.name }}
                  </p>

                  <p class="mt-0.5 text-[9px] font-semibold text-slate-400">
                    {{ company.shortName || "Empresa" }}
                  </p>
                </div>
              </div>
            </td>

            <!-- RUT -->
            <td class="px-4 py-3.5 text-[10px] font-semibold text-slate-600">
              {{ company.rut || "Sin RUT" }}
            </td>

            <!-- UBICACION -->
            <td class="px-4 py-3.5">
              <div class="flex min-w-[150px] items-center gap-1.5 text-slate-500">
                <svg
                  viewBox="0 0 24 24"
                  class="h-3.5 w-3.5 shrink-0"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M12 21s7-4.6 7-11a7 7 0 1 0-14 0c0 6.4 7 11 7 11Z"
                    stroke="currentColor"
                    stroke-width="1.8"
                  />
                  <path
                    d="M12 10.5h.01"
                    stroke="currentColor"
                    stroke-width="3"
                    stroke-linecap="round"
                  />
                </svg>

                <span class="truncate text-[10px] font-semibold">
                  {{ locationLabel(company) }}
                </span>
              </div>
            </td>

            <!-- ESTADO -->
            <td class="px-4 py-3.5">
              <span
                class="inline-flex rounded-full px-2.5 py-1 text-[9px] font-black"
                :class="getStatusPillClass(company.status)"
              >
                {{ getStatusLabel(company.status) }}
              </span>
            </td>

            <!-- ACTIVOS -->
            <td class="px-4 py-3.5 text-center text-[11px] font-black text-[#102372]">
              {{ company.assetsCount || 0 }}
            </td>

            <!-- USUARIOS -->
            <td class="px-4 py-3.5 text-center text-[11px] font-black text-[#102372]">
              {{ company.usersCount || 0 }}
            </td>

            <!-- REPORTES -->
            <td class="px-4 py-3.5 text-center text-[11px] font-black text-[#102372]">
              {{ getEnabledReportsCount(company) }}
            </td>

            <!-- ACCIONES -->
            <td class="px-4 py-3.5">
              <div class="flex justify-center">
                <button
                  type="button"
                  class="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-[#d8dee8] bg-white px-3 text-[9px] font-black text-[#102372] transition hover:border-[#102372]/25 hover:bg-[#eef3ff]"
                  aria-label="Configurar empresa"
                  title="Configurar empresa"
                  @click.stop="$emit('configure-company', company.id)"
                >
                  <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" aria-hidden="true">
                    <path
                      d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 1.55V21a2 2 0 0 1-4 0v-.05A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 0 1 0-4h.05A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3a2 2 0 0 1 4 0v.05A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.55 1H21a2 2 0 0 1 0 4h-.05A1.7 1.7 0 0 0 19.4 15Z"
                      stroke="currentColor"
                      stroke-width="1.8"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                  Configurar
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- GRID OPCIONAL -->
    <div
      v-else-if="companies.length && viewMode === 'grid'"
      class="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3"
    >
      <article
        v-for="company in companies"
        :key="company.id"
        class="cursor-pointer rounded-xl border border-[#e3e9f2] bg-white p-4 transition hover:border-[#102372]/20 hover:bg-[#fbfcff]"
        :class="selectedCompanyId === company.id ? 'ring-2 ring-[#102372]/10' : ''"
        @click="$emit('select-company', company.id)"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex min-w-0 items-center gap-3">
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[11px] font-black text-white"
              :class="getCompanyAvatarClass(company.status)"
            >
              {{ getCompanyInitials(company.name) }}
            </div>

            <div class="min-w-0">
              <h3 class="truncate text-[11px] font-black text-[#102372]">
                {{ company.name }}
              </h3>

              <p class="mt-0.5 text-[9px] font-semibold text-slate-400">
                {{ company.rut || "Sin RUT" }}
              </p>
            </div>
          </div>

          <span
            class="shrink-0 rounded-full px-2 py-1 text-[8px] font-black"
            :class="getStatusPillClass(company.status)"
          >
            {{ getStatusLabel(company.status) }}
          </span>
        </div>

        <p class="mt-3 text-[9px] font-semibold text-slate-500">
          {{ locationLabel(company) }}
        </p>

        <div class="mt-4 grid grid-cols-3 border-t border-[#edf1f5] pt-3 text-center">
          <div>
            <p class="text-[12px] font-black text-[#102372]">
              {{ company.assetsCount || 0 }}
            </p>
            <p class="mt-0.5 text-[8px] font-bold text-slate-400">Activos</p>
          </div>

          <div class="border-x border-[#edf1f5]">
            <p class="text-[12px] font-black text-[#102372]">
              {{ company.usersCount || 0 }}
            </p>
            <p class="mt-0.5 text-[8px] font-bold text-slate-400">Usuarios</p>
          </div>

          <div>
            <p class="text-[12px] font-black text-[#102372]">
              {{ getEnabledReportsCount(company) }}
            </p>
            <p class="mt-0.5 text-[8px] font-bold text-slate-400">Reportes</p>
          </div>
        </div>

        <div class="mt-4 flex gap-2">
          <button
            type="button"
            class="h-8 flex-1 rounded-lg bg-[#102372] px-3 text-[9px] font-black text-white transition hover:bg-[#0c1b59]"
            @click.stop="$emit('enter-company', company)"
          >
            Abrir empresa
          </button>

          <button
            type="button"
            class="h-8 rounded-lg border border-[#d8dee8] px-3 text-[9px] font-black text-[#102372] transition hover:bg-[#f6f8fb]"
            @click.stop="$emit('configure-company', company.id)"
          >
            Configurar
          </button>
        </div>
      </article>
    </div>

    <!-- VACIO -->
    <div v-else class="flex min-h-[260px] flex-col items-center justify-center p-6 text-center">
      <p class="text-[13px] font-black text-[#102372]">Sin empresas encontradas</p>

      <p class="mt-1 text-[10px] font-semibold text-slate-400">
        Prueba ajustando los filtros aplicados.
      </p>

      <button
        type="button"
        class="mt-4 rounded-lg border border-[#d8dee8] bg-white px-4 py-2 text-[10px] font-black text-[#102372] transition hover:bg-[#f6f8fb]"
        @click="$emit('clear-filters')"
      >
        Limpiar filtros
      </button>
    </div>

    <!-- PAGINACION -->
    <footer
      v-if="totalCompanies"
      class="flex flex-col gap-3 border-t border-[#edf1f5] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <p class="text-[9px] font-semibold text-slate-400">
        Mostrando
        <span class="font-black text-slate-600"> {{ paginationFrom }}-{{ paginationTo }} </span>
        de
        <span class="font-black text-slate-600">
          {{ totalCompanies }}
        </span>
        empresas
      </p>

      <div class="flex items-center gap-1">
        <button
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d8dee8] text-slate-400 transition hover:text-[#102372] disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="currentPage <= 1"
          aria-label="Página anterior"
          @click="$emit('previous-page')"
        >
          <svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" aria-hidden="true">
            <path
              d="m14 7-5 5 5 5"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>

        <button
          v-for="page in visiblePages"
          :key="page"
          type="button"
          class="flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-[9px] font-black transition"
          :class="
            currentPage === page
              ? 'bg-[#102372] text-white'
              : 'border border-[#d8dee8] bg-white text-slate-500 hover:text-[#102372]'
          "
          @click="$emit('go-to-page', page)"
        >
          {{ page }}
        </button>

        <button
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d8dee8] text-slate-400 transition hover:text-[#102372] disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="currentPage >= totalPages"
          aria-label="Página siguiente"
          @click="$emit('next-page')"
        >
          <svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" aria-hidden="true">
            <path
              d="m10 7 5 5-5 5"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>
    </footer>
  </section>
</template>

<script setup>
import { computed } from "vue"

import { getCompanyInitials } from "../../utils/companies/companyUtils.js"

const props = defineProps({
  companies: {
    type: Array,
    default: () => [],
  },
  totalCompanies: {
    type: Number,
    default: 0,
  },
  selectedCompanyId: {
    type: String,
    default: "",
  },
  sortKey: {
    type: String,
    default: "name",
  },
  sortDirection: {
    type: String,
    default: "asc",
  },
  viewMode: {
    type: String,
    default: "table",
  },
  currentPage: {
    type: Number,
    default: 1,
  },
  totalPages: {
    type: Number,
    default: 1,
  },
  pageSize: {
    type: Number,
    default: 8,
  },
})

defineEmits([
  "configure-company",
  "enter-company",
  "select-company",
  "clear-filters",
  "update:sort-key",
  "update:sort-direction",
  "update:view-mode",
  "previous-page",
  "next-page",
  "go-to-page",
])

const getEnabledReportsCount = (company) => {
  return (company?.reports || []).filter((report) => report.enabled !== false).length
}

const locationLabel = (company) => {
  return [company.city, company.region].filter(Boolean).join(", ") || "Sin ubicación"
}

const getStatusLabel = (status) => {
  const labels = {
    active: "Activa",
    pending: "Suspendida",
    inactive: "Inactiva",
    internal: "Interna",
  }

  return labels[status] || "Sin estado"
}

const getCompanyAvatarClass = (status) => {
  if (status === "pending") return "bg-[#ff6600]"
  if (status === "inactive") return "bg-slate-500"
  if (status === "internal") return "bg-[#475569]"

  return "bg-[#102372]"
}

const getStatusPillClass = (status) => {
  if (status === "active") return "bg-emerald-50 text-emerald-700"
  if (status === "pending") return "bg-orange-50 text-[#ff6600]"
  if (status === "inactive") return "bg-slate-100 text-slate-500"
  if (status === "internal") return "bg-[#eef3ff] text-[#102372]"

  return "bg-slate-100 text-slate-500"
}

const paginationFrom = computed(() => {
  if (!props.totalCompanies) return 0

  return (props.currentPage - 1) * props.pageSize + 1
})

const paginationTo = computed(() => {
  return Math.min(props.currentPage * props.pageSize, props.totalCompanies)
})

const visiblePages = computed(() => {
  if (props.totalPages <= 5) {
    return Array.from({ length: props.totalPages }, (_, index) => index + 1)
  }

  const start = Math.min(Math.max(props.currentPage - 2, 1), props.totalPages - 4)

  return Array.from({ length: 5 }, (_, index) => start + index)
})
</script>
