<template>
  <section class="h-full min-h-0 overflow-hidden bg-[#f5f8fc]">
    <main class="flex h-full min-h-0 flex-col overflow-hidden px-4 py-3 sm:px-5 lg:px-6">
      <header
        class="grid shrink-0 gap-3 border-b border-[#d8dee8] pb-3 xl:grid-cols-[minmax(0,1fr)_minmax(480px,780px)] xl:items-end"
      >
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <p class="text-[11px] font-black uppercase tracking-[0.18em] text-[#ff6600]">
              Reportes
            </p>

            <span class="h-1.5 w-1.5 rounded-full bg-[#102372]"></span>

            <p class="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
              Plantillas
            </p>
          </div>

          <h1 class="mt-1.5 text-[22px] font-black leading-tight text-[#102372]">
            Biblioteca de reportes
          </h1>

          <p class="mt-0.5 max-w-[620px] text-[12px] font-semibold leading-5 text-slate-600">
            Explora y administra los reportes disponibles para tu empresa.
          </p>
        </div>

        <div class="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto_auto_auto] md:items-center">
          <label class="relative min-w-0">
            <span class="sr-only">Buscar reporte</span>

            <SvgIcon
              name="search"
              class="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
            />

            <input
              v-model="reportSearch"
              type="search"
              class="h-10 w-full rounded-lg border border-[#cfd8e6] bg-white pl-11 pr-4 text-[13px] font-bold text-[#102372] shadow-sm outline-none placeholder:text-slate-400 focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/10"
              placeholder="Buscar reporte..."
            />
          </label>

          <button
            type="button"
            class="h-10 rounded-lg border border-[#cfd8e6] bg-white px-6 text-[13px] font-black text-[#102372] shadow-sm transition hover:border-[#ff6600] hover:text-[#ff6600]"
            @click="openRulesModal"
          >
            Reglas
          </button>

          <button
            type="button"
            class="h-10 rounded-lg border border-[#cfd8e6] bg-white px-6 text-[13px] font-black text-[#102372] shadow-sm transition hover:border-[#ff6600] hover:text-[#ff6600]"
            @click="openSchedulesModal"
          >
            Programados
          </button>

          <button
            type="button"
            class="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#ff6600] px-7 text-[13px] font-black text-white shadow-sm transition hover:bg-[#e65c00]"
            @click="openCreateModal"
          >
            <SvgIcon name="plus" class="h-4 w-4" />
            Nuevo
          </button>
        </div>
      </header>

      <section
        class="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-[#d8dee8] bg-white shadow-sm"
      >
        <header class="shrink-0 border-b border-[#edf1f5] px-3 py-2.5">
          <div class="flex flex-col gap-2.5 xl:flex-row xl:items-center xl:justify-between">
            <nav class="flex min-w-0 flex-wrap items-center gap-2" aria-label="Tipo de reporte">
              <button
                v-for="filter in reportTypeFilters"
                :key="filter.id"
                type="button"
                class="h-8 rounded-none border-b-2 px-3 text-[13px] font-black transition"
                :class="
                  selectedReportType === filter.id
                    ? 'border-[#102372] text-[#102372]'
                    : 'border-transparent text-slate-500 hover:text-[#102372]'
                "
                @click="selectedReportType = filter.id"
              >
                {{ filter.label }}
              </button>
            </nav>

            <div class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] xl:w-[640px]">
              <label class="relative min-w-0">
                <span class="sr-only">Filtrar categoria</span>

                <select
                  v-model="selectedCategory"
                  class="h-9 w-full appearance-none rounded-lg border border-[#cfd8e6] bg-white px-4 pr-10 text-[12px] font-black text-[#102372] outline-none transition hover:border-[#ff6600] focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/10"
                >
                  <option
                    v-for="category in categoryFilterOptions"
                    :key="category.id"
                    :value="category.id"
                  >
                    {{ category.label }}
                  </option>
                </select>

                <svg
                  viewBox="0 0 24 24"
                  class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="m6 9 6 6 6-6"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </label>

              <label class="relative min-w-0">
                <span class="sr-only">Ordenar reportes</span>

                <select
                  v-model="selectedSort"
                  class="h-9 w-full appearance-none rounded-lg border border-[#cfd8e6] bg-white px-4 pr-10 text-[12px] font-black text-[#102372] outline-none transition hover:border-[#ff6600] focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/10"
                >
                  <option v-for="option in sortOptions" :key="option.id" :value="option.id">
                    {{ option.label }}
                  </option>
                </select>

                <svg
                  viewBox="0 0 24 24"
                  class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="m6 9 6 6 6-6"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </label>

              <div
                class="grid h-9 grid-cols-2 rounded-lg border border-[#cfd8e6] bg-[#f8fafc] p-1"
                aria-label="Vista de reportes"
              >
                <button
                  type="button"
                  class="flex h-7 w-10 items-center justify-center rounded-md transition"
                  :class="
                    viewMode === 'grid' ? 'bg-[#102372] text-white shadow-sm' : 'text-slate-500'
                  "
                  aria-label="Vista en tarjetas"
                  @click="viewMode = 'grid'"
                >
                  <svg viewBox="0 0 24 24" class="h-4 w-4" fill="currentColor" aria-hidden="true">
                    <path d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z" />
                  </svg>
                </button>

                <button
                  type="button"
                  class="flex h-7 w-10 items-center justify-center rounded-md transition"
                  :class="
                    viewMode === 'list' ? 'bg-[#102372] text-white shadow-sm' : 'text-slate-500'
                  "
                  aria-label="Vista en lista"
                  @click="viewMode = 'list'"
                >
                  <svg viewBox="0 0 24 24" class="h-4 w-4" fill="currentColor" aria-hidden="true">
                    <path
                      d="M5 6.5A1.5 1.5 0 1 1 2 6.5a1.5 1.5 0 0 1 3 0ZM7 5h15v3H7V5Zm-2 6.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM7 10h15v3H7v-3Zm-2 6.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM7 15h15v3H7v-3Z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </header>

        <div class="min-h-0 flex-1 overflow-auto p-2.5 sm:p-3">
          <div v-if="visibleReportRows.length && viewMode === 'grid'">
            <div class="grid content-start gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              <article
                v-for="report in visibleReportRows"
                :key="report.id"
                class="flex min-h-[118px] flex-col rounded-lg border border-[#d8dee8] bg-white p-3 shadow-sm transition hover:border-[#b8c5d8]"
              >
                <div class="flex min-w-0 items-start justify-between gap-3">
                  <span
                    class="rounded-md px-2 py-0.5 text-[9px] font-black uppercase"
                    :class="report.typeClass"
                  >
                    {{ report.typeLabel }}
                  </span>

                  <span
                    class="rounded-md bg-[#f3f6fb] px-2 py-0.5 text-[9px] font-black text-slate-500"
                  >
                    {{ report.categoryLabel }}
                  </span>
                </div>

                <div class="mt-2 min-w-0">
                  <h2 class="truncate text-[15px] font-black leading-5 text-[#102372]">
                    {{ report.name }}
                  </h2>

                  <p class="mt-1 truncate text-[11px] font-semibold leading-4 text-slate-600">
                    {{ report.description }}
                  </p>
                </div>

                <div class="mt-3 border-t border-[#d8dee8] pt-2.5">
                  <div class="flex min-w-0 flex-wrap items-center justify-between gap-2">
                    <div class="min-w-0">
                      <p class="text-[9px] font-black uppercase tracking-[0.06em] text-[#102372]">
                        Eventos
                      </p>

                      <span
                        class="mt-1 block max-w-[210px] truncate rounded-md px-2.5 py-1 text-[10px] font-black"
                        :class="report.eventClass"
                      >
                        {{ report.eventRuleLabel }}
                      </span>
                    </div>

                    <div class="flex shrink-0 items-center gap-2">
                      <span
                        class="rounded-md px-2.5 py-1 text-[9px] font-black uppercase"
                        :class="report.statusClass"
                      >
                        {{ report.statusLabel }}
                      </span>

                      <button
                        v-if="report.canEdit"
                        type="button"
                        class="rounded-lg px-2 py-1 text-[11px] font-black text-[#102372] transition hover:bg-[#eef3ff] hover:text-[#ff6600]"
                        @click.stop="openEditModal(report.template)"
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        class="rounded-lg bg-[#102372] px-2.5 py-1.5 text-[10px] font-black text-white transition hover:bg-[#0b1a58] disabled:cursor-not-allowed disabled:bg-slate-300"
                        :disabled="!canExecuteReport(report)"
                        :title="getExecuteReportTitle(report)"
                        @click.stop="openReportExecution(report)"
                      >
                        Ejecutar
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </div>

          <div
            v-else-if="visibleReportRows.length"
            class="overflow-hidden rounded-lg border border-[#d8dee8]"
          >
            <div
              class="grid min-w-[900px] grid-cols-[minmax(220px,1.35fr)_minmax(150px,0.8fr)_minmax(180px,1fr)_120px_150px] gap-3 border-b border-[#edf1f5] bg-[#f8fafc] px-4 py-3"
            >
              <p class="text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">
                Reporte
              </p>
              <p class="text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">
                Categoria
              </p>
              <p class="text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">
                Eventos
              </p>
              <p class="text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">
                Estado
              </p>
              <p
                class="text-right text-[10px] font-black uppercase tracking-[0.08em] text-slate-500"
              >
                Acciones
              </p>
            </div>

            <div class="min-w-[900px] divide-y divide-[#edf1f5] bg-white">
              <article
                v-for="report in visibleReportRows"
                :key="report.id"
                class="grid grid-cols-[minmax(220px,1.35fr)_minmax(150px,0.8fr)_minmax(180px,1fr)_120px_150px] items-center gap-3 px-4 py-3"
              >
                <div class="min-w-0">
                  <div class="flex min-w-0 items-center gap-2">
                    <span
                      class="rounded-md px-2 py-1 text-[10px] font-black uppercase"
                      :class="report.typeClass"
                    >
                      {{ report.typeLabel }}
                    </span>

                    <p class="truncate text-[13px] font-black text-[#102372]">{{ report.name }}</p>
                  </div>

                  <p class="mt-1 truncate text-[11px] font-semibold text-slate-500">
                    {{ report.description }}
                  </p>
                </div>

                <p class="truncate text-[12px] font-bold text-slate-600">
                  {{ report.categoryLabel }}
                </p>

                <div class="min-w-0">
                  <span
                    class="rounded-md px-2 py-1 text-[10px] font-black"
                    :class="report.eventClass"
                  >
                    {{ report.eventRuleLabel }}
                  </span>
                </div>

                <span
                  class="w-fit rounded-md px-2 py-1 text-[10px] font-black uppercase"
                  :class="report.statusClass"
                >
                  {{ report.statusLabel }}
                </span>

                <div class="flex justify-end gap-1.5">
                  <button
                    v-if="report.canEdit"
                    type="button"
                    class="rounded-lg px-2 py-1 text-[12px] font-black text-[#102372] transition hover:bg-[#eef3ff] hover:text-[#ff6600]"
                    @click="openEditModal(report.template)"
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    class="rounded-lg bg-[#102372] px-2.5 py-1 text-[11px] font-black text-white transition hover:bg-[#0b1a58] disabled:cursor-not-allowed disabled:bg-slate-300"
                    :disabled="!canExecuteReport(report)"
                    :title="getExecuteReportTitle(report)"
                    @click="openReportExecution(report)"
                  >
                    Ejecutar
                  </button>
                </div>
              </article>
            </div>
          </div>

          <div v-else class="flex min-h-[320px] items-center justify-center p-6 text-center">
            <div>
              <p class="text-[16px] font-black text-[#102372]">Sin reportes encontrados</p>

              <p class="mt-2 text-[13px] font-semibold text-slate-500">
                Limpia la busqueda o crea un nuevo reporte.
              </p>
            </div>
          </div>
        </div>

        <footer class="shrink-0 border-t border-[#edf1f5] bg-white px-4 py-2">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-center">
            <p class="text-center text-[13px] font-black text-slate-600 sm:mr-2">
              {{ pageStart }}-{{ pageEnd }} de {{ filteredReportRows.length }}
            </p>

            <div class="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                class="h-9 rounded-lg border border-[#d8dee8] bg-white px-4 text-[12px] font-black text-[#102372] transition hover:border-[#ff6600] hover:text-[#ff6600] disabled:cursor-not-allowed disabled:text-slate-300"
                :disabled="currentPage === 1"
                @click="goPreviousPage"
              >
                Anterior
              </button>

              <button
                v-for="page in pageNumbers"
                :key="page"
                type="button"
                class="h-9 min-w-9 rounded-lg border px-3 text-[12px] font-black transition"
                :class="
                  currentPage === page
                    ? 'border-[#102372] bg-[#102372] text-white shadow-sm'
                    : 'border-[#d8dee8] bg-white text-[#102372] hover:border-[#ff6600] hover:text-[#ff6600]'
                "
                @click="goToPage(page)"
              >
                {{ page }}
              </button>

              <button
                type="button"
                class="h-9 rounded-lg border border-[#d8dee8] bg-white px-4 text-[12px] font-black text-[#102372] transition hover:border-[#ff6600] hover:text-[#ff6600] disabled:cursor-not-allowed disabled:text-slate-300"
                :disabled="currentPage === totalPages"
                @click="goNextPage"
              >
                Siguiente
              </button>
            </div>
          </div>
        </footer>
      </section>
    </main>

    <ReportExecutionModal
      v-if="isExecutionModalOpen"
      v-model="isExecutionModalOpen"
      :template="executionTemplate"
      :assets="reportAssets"
      :companies="companyRecords"
      :geofences="geofences"
      :groups="eventRuleGroups"
    />

    <ReportTemplateModal
      v-if="isReportModalOpen"
      :open="isReportModalOpen"
      :template="editingTemplate"
      :categories="REPORT_CATEGORIES"
      @close="closeReportModal"
      @delete="deleteReport"
      @save="saveReport"
    />

    <ReportEventRulesModal
      v-if="isRulesModalOpen"
      v-model="isRulesModalOpen"
      :groups="eventRuleGroups"
    />

    <ReportSchedulesModal
      v-if="isSchedulesModalOpen"
      v-model="isSchedulesModalOpen"
      :templates="reportTemplates"
      :groups="eventRuleGroups"
      :company-id="currentCompanyId"
    />
  </section>
</template>

<script setup>
import { computed, defineAsyncComponent, onMounted, ref, watch } from "vue"
import { useRoute } from "vue-router"

import { useGeofences } from "../composables/activos/geocercas/useGeofences.js"
import { useAuditTrail } from "../composables/audit/useAuditTrail.js"
import { useAccessControl } from "../composables/auth/useAccessControl.js"
import { useReportEventRules } from "../composables/reports/useReportEventRules.js"
import { useReportTemplates } from "../composables/reports/useReportTemplates.js"
import { useDebouncedValue } from "../composables/ui/useDebouncedValue.js"
import { preloadWhenIdle } from "../composables/ui/useIdlePreload.js"
import { useReportsService } from "../services/reports/useReportsService.js"
import SvgIcon from "../components/icons/SvgIcon.vue"

import { REPORT_CATEGORIES } from "../data/mockReportTemplates.js"
import {
  REPORTS_VIEW_PAGE_SIZE,
  REPORTS_VIEW_TYPE_FILTERS,
  buildReportsViewEventRuleGroups,
  buildReportsViewRows,
  filterReportsViewRows,
} from "../utils/reports/views/reportsViewUtils.js"

const loadReportExecutionModal = () => import("../components/reports/ReportExecutionModal.vue")
const loadReportEventRulesModal = () => import("../components/reports/ReportEventRulesModal.vue")
const loadReportSchedulesModal = () => import("../components/reports/ReportSchedulesModal.vue")
const loadReportTemplateModal = () => import("../components/reports/ReportTemplateModal.vue")

const ReportExecutionModal = defineAsyncComponent(loadReportExecutionModal)
const ReportEventRulesModal = defineAsyncComponent(loadReportEventRulesModal)
const ReportSchedulesModal = defineAsyncComponent(loadReportSchedulesModal)
const ReportTemplateModal = defineAsyncComponent(loadReportTemplateModal)

const PAGE_SIZE = REPORTS_VIEW_PAGE_SIZE
const reportTypeFilters = REPORTS_VIEW_TYPE_FILTERS

const route = useRoute()
const currentCompanyId = computed(() => String(route.params.empresaId || ""))

const { visibleAssets } = useAccessControl()
const { reportTemplates, createReportTemplate, updateReportTemplate, deleteReportTemplate } =
  useReportTemplates()
const { reportEventRules } = useReportEventRules()
const { companyRecords } = useReportsService()
const { geofences } = useGeofences({
  companyId: currentCompanyId,
})

const reportSearch = ref("")
const selectedReportType = ref("all")
const selectedCategory = ref("all")
const selectedSort = ref("alphabetical-asc")
const viewMode = ref("grid")
const currentPage = ref(1)
const debouncedReportSearch = useDebouncedValue(reportSearch, 180)
const executionTemplate = ref(null)
const isExecutionModalOpen = ref(false)
const isReportModalOpen = ref(false)
const isRulesModalOpen = ref(false)
const isSchedulesModalOpen = ref(false)
const editingTemplateId = ref(null)

const categoryLabelById = computed(() => {
  return new Map(REPORT_CATEGORIES.map((category) => [category.id, category.label]))
})

const eventRuleLabelById = computed(() => {
  return new Map(reportEventRules.value.map((rule) => [String(rule.id), rule.label]))
})

const activeEventRuleIds = computed(() => {
  return new Set(
    reportEventRules.value
      .filter((rule) => rule.active !== false)
      .filter((rule) => String(rule.id) !== "all")
      .map((rule) => String(rule.id)),
  )
})

const { recordAudit } = useAuditTrail({
  companyId: currentCompanyId,
})

const reportAssets = computed(() => {
  const assets = visibleAssets.value || []

  if (!currentCompanyId.value) return assets

  return assets.filter((asset) => String(asset.companyId || "") === currentCompanyId.value)
})

const eventRuleGroups = computed(() => {
  return buildReportsViewEventRuleGroups({
    companyRecords: companyRecords.value,
    currentCompanyId: currentCompanyId.value,
  })
})

const editingTemplate = computed(() => {
  if (!editingTemplateId.value) return null

  return (
    reportTemplates.value.find(
      (template) => String(template.id) === String(editingTemplateId.value),
    ) || null
  )
})

const categoryFilterOptions = computed(() => {
  return [
    {
      id: "all",
      label: "Todas las categorias",
    },
    ...REPORT_CATEGORIES.map((category) => ({
      id: category.id,
      label: category.label,
    })),
  ]
})

const sortOptions = [
  {
    id: "alphabetical-asc",
    label: "Orden alfabetico (A-Z)",
  },
  {
    id: "alphabetical-desc",
    label: "Orden alfabetico (Z-A)",
  },
  {
    id: "default-first",
    label: "Base primero",
  },
  {
    id: "custom-first",
    label: "Creados primero",
  },
]

const reportRows = computed(() => {
  return buildReportsViewRows({
    reportTemplates: reportTemplates.value,
    activeEventRuleIds: activeEventRuleIds.value,
    categoryLabelById: categoryLabelById.value,
    eventRuleLabelById: eventRuleLabelById.value,
  })
})

const filteredReportRows = computed(() => {
  return filterReportsViewRows({
    reportRows: reportRows.value,
    reportSearch: debouncedReportSearch.value,
    selectedReportType: selectedReportType.value,
    selectedCategory: selectedCategory.value,
    selectedSort: selectedSort.value,
  })
})

const totalPages = computed(() => {
  return Math.max(Math.ceil(filteredReportRows.value.length / PAGE_SIZE), 1)
})

const pageStartIndex = computed(() => {
  return (currentPage.value - 1) * PAGE_SIZE
})

const visibleReportRows = computed(() => {
  return filteredReportRows.value.slice(pageStartIndex.value, pageStartIndex.value + PAGE_SIZE)
})

const pageStart = computed(() => {
  if (!filteredReportRows.value.length) return 0

  return pageStartIndex.value + 1
})

const pageEnd = computed(() => {
  return Math.min(
    pageStartIndex.value + visibleReportRows.value.length,
    filteredReportRows.value.length,
  )
})

const pageNumbers = computed(() => {
  const pages = []

  for (let page = 1; page <= totalPages.value; page += 1) {
    pages.push(page)
  }

  return pages
})

watch([debouncedReportSearch, selectedReportType, selectedCategory, selectedSort], () => {
  currentPage.value = 1
})

watch(totalPages, (nextTotalPages) => {
  if (currentPage.value > nextTotalPages) {
    currentPage.value = nextTotalPages
  }
})

function goPreviousPage() {
  currentPage.value = Math.max(currentPage.value - 1, 1)
}

function goNextPage() {
  currentPage.value = Math.min(currentPage.value + 1, totalPages.value)
}

function goToPage(page) {
  currentPage.value = Math.min(Math.max(Number(page) || 1, 1), totalPages.value)
}

const openCreateModal = () => {
  editingTemplateId.value = null
  isReportModalOpen.value = true
}

const openRulesModal = () => {
  isRulesModalOpen.value = true
}

const openSchedulesModal = () => {
  isSchedulesModalOpen.value = true
}

const canExecuteReport = (report) => {
  return Boolean(
    report?.template?.status === "active" &&
    report?.eventRuleIds?.length &&
    reportAssets.value.length,
  )
}

const getExecuteReportTitle = (report) => {
  if (!reportAssets.value.length) return "No hay activos disponibles para ejecutar este reporte"
  if (report?.template?.status !== "active") return "El reporte esta inactivo"
  if (!report?.eventRuleIds?.length) return "El reporte no tiene reglas activas"

  return "Ejecutar reporte"
}

const openReportExecution = (report) => {
  if (!canExecuteReport(report)) return

  const eventRuleIds = [...report.eventRuleIds]

  executionTemplate.value = {
    ...report.template,
    eventRuleIds,
    eventRuleId: eventRuleIds[0] || null,
  }
  isExecutionModalOpen.value = true
}

const openEditModal = (template) => {
  if (!template) return

  editingTemplateId.value = template.id
  isReportModalOpen.value = true
}

const closeReportModal = () => {
  isReportModalOpen.value = false
  editingTemplateId.value = null
}

const saveReport = ({ templateId, payload }) => {
  const isEditing = Boolean(templateId)
  const savedTemplate = isEditing
    ? updateReportTemplate(templateId, payload)
    : createReportTemplate(payload)

  if (savedTemplate) {
    recordAudit({
      module: "reportes",
      action: isEditing ? "report:template:update" : "report:template:create",
      entityType: "plantilla de reporte",
      entityName: savedTemplate.name || payload?.name || "Reporte",
      description: isEditing
        ? "Se actualizo una plantilla de reporte."
        : "Se creo una plantilla de reporte.",
      metadata: {
        templateId: savedTemplate.id,
      },
    })
  }

  closeReportModal()
}

const deleteReport = (templateId) => {
  const template = reportTemplates.value.find((reportTemplate) => {
    return String(reportTemplate.id) === String(templateId)
  })

  if (deleteReportTemplate(templateId)) {
    recordAudit({
      module: "reportes",
      action: "report:template:delete",
      entityType: "plantilla de reporte",
      entityName: template?.name || "Reporte",
      severity: "warning",
      description: "Se elimino una plantilla de reporte.",
      metadata: {
        templateId,
      },
    })

    closeReportModal()

    if (String(executionTemplate.value?.id) === String(templateId)) {
      isExecutionModalOpen.value = false
      executionTemplate.value = null
    }
  }
}

onMounted(() => {
  preloadWhenIdle([
    loadReportTemplateModal,
    loadReportExecutionModal,
    loadReportEventRulesModal,
    loadReportSchedulesModal,
  ])
})
</script>
