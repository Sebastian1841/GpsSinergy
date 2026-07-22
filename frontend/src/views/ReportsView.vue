<template>
  <section class="h-full min-h-0 overflow-hidden bg-[#e8eef6] p-3 sm:p-4">
    <main
      class="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-[#d8dee8] bg-white"
    >
      <header class="shrink-0 border-b border-[#edf1f5] bg-white">
        <div
          class="grid gap-3 px-4 py-3 xl:grid-cols-[minmax(0,1fr)_minmax(360px,620px)] xl:items-center"
        >
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <p class="text-[10px] font-black uppercase tracking-[0.16em] text-[#ff6600]">
                Reportes
              </p>

              <span class="h-1.5 w-1.5 rounded-full bg-[#102372]"></span>

              <p class="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                Plantillas
              </p>
            </div>

            <h1 class="mt-1 text-[18px] font-black text-[#102372]">Biblioteca de reportes</h1>
          </div>

          <div class="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto_auto_auto] md:items-center">
            <label class="min-w-0">
              <span class="sr-only">Buscar reporte</span>

              <input
                v-model="reportSearch"
                type="search"
                class="h-9 w-full rounded-lg border border-[#d8dee8] bg-[#f8fafc] px-3 text-[12px] font-bold text-[#102372] outline-none placeholder:text-slate-400 focus:border-[#ff6600] focus:bg-white focus:ring-2 focus:ring-[#ff6600]/10"
                placeholder="Buscar reporte..."
              />
            </label>

            <button
              type="button"
              class="h-9 rounded-lg border border-[#d8dee8] bg-white px-4 text-[10px] font-black uppercase tracking-[0.08em] text-[#102372] transition hover:border-[#ff6600] hover:text-[#ff6600]"
              @click="openRulesModal"
            >
              Reglas
            </button>

            <button
              type="button"
              class="h-9 rounded-lg border border-[#d8dee8] bg-white px-4 text-[10px] font-black uppercase tracking-[0.08em] text-[#102372] transition hover:border-[#ff6600] hover:text-[#ff6600]"
              @click="openSchedulesModal"
            >
              Programados
            </button>

            <button
              type="button"
              class="h-9 rounded-lg bg-[#ff6600] px-4 text-[10px] font-black uppercase tracking-[0.08em] text-white transition hover:bg-[#e65c00]"
              @click="openCreateModal"
            >
              Nuevo
            </button>
          </div>
        </div>

        <div class="border-t border-[#edf1f5] bg-[#f8fafc] px-4 py-2">
          <div class="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div class="flex flex-wrap items-center gap-2">
              <span
                class="rounded-md border border-[#ffd8c2] bg-[#fff3eb] px-2 py-1 text-[10px] font-black text-[#ff6600]"
              >
                {{ reportStats.custom }} creados
              </span>

              <span
                class="rounded-md border border-[#cdd8f3] bg-[#eef3ff] px-2 py-1 text-[10px] font-black text-[#102372]"
              >
                {{ reportStats.defaults }} base
              </span>
            </div>

            <div
              class="grid grid-cols-3 rounded-lg border border-[#d8dee8] bg-white p-1 lg:w-[360px]"
            >
              <button
                v-for="filter in reportTypeFilters"
                :key="filter.id"
                type="button"
                class="h-8 rounded-md px-2 text-[9px] font-black uppercase tracking-[0.06em] transition"
                :class="
                  selectedReportType === filter.id
                    ? 'bg-[#102372] text-white'
                    : 'text-slate-500 hover:text-[#102372]'
                "
                @click="selectedReportType = filter.id"
              >
                {{ filter.label }}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div class="shrink-0 border-b border-[#edf1f5] bg-[#102372] px-4 py-2">
        <div
          class="grid grid-cols-[minmax(0,1fr)_84px] gap-3 md:grid-cols-[minmax(0,1fr)_180px_110px_84px]"
        >
          <p class="text-[10px] font-black uppercase tracking-[0.08em] text-white/70">Reporte</p>

          <p
            class="hidden text-[10px] font-black uppercase tracking-[0.08em] text-white/70 md:block"
          >
            Evento
          </p>

          <p
            class="hidden text-[10px] font-black uppercase tracking-[0.08em] text-white/70 md:block"
          >
            Estado
          </p>

          <p class="text-right text-[10px] font-black uppercase tracking-[0.08em] text-white/70">
            {{ filteredReportRows.length }} de {{ reportRows.length }}
          </p>
        </div>
      </div>

      <div class="min-h-0 flex-1 overflow-auto bg-[#f8fafc] p-3">
        <div v-if="visibleReportRows.length" class="grid gap-2">
          <article
            v-for="report in visibleReportRows"
            :key="report.id"
            class="grid gap-3 rounded-lg border border-[#d8dee8] bg-white px-3 py-3 shadow-sm transition hover:border-[#b8c5d8] md:grid-cols-[minmax(0,1fr)_180px_110px_84px] md:items-center"
          >
            <div class="min-w-0">
              <div class="flex min-w-0 items-start gap-3">
                <span
                  class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[11px] font-black text-white"
                  :class="report.iconClass"
                >
                  {{ report.eventInitial }}
                </span>

                <div class="min-w-0">
                  <div class="flex min-w-0 flex-wrap items-center gap-1.5">
                    <p class="truncate text-[12px] font-black text-[#172033]">
                      {{ report.name }}
                    </p>

                    <span
                      class="rounded-md px-2 py-0.5 text-[9px] font-black uppercase"
                      :class="report.typeClass"
                    >
                      {{ report.typeLabel }}
                    </span>
                  </div>

                  <p class="mt-0.5 line-clamp-1 text-[10px] font-semibold text-slate-500">
                    {{ report.description }}
                  </p>
                </div>
              </div>

              <div class="mt-2 flex flex-wrap gap-1.5 md:hidden">
                <span class="rounded-md px-2 py-1 text-[9px] font-black" :class="report.eventClass">
                  {{ report.eventRuleLabel }}
                </span>

                <span
                  class="rounded-md px-2 py-1 text-[9px] font-black uppercase"
                  :class="report.statusClass"
                >
                  {{ report.statusLabel }}
                </span>
              </div>
            </div>

            <div class="hidden min-w-0 md:block">
              <span class="rounded-md px-2 py-1 text-[9px] font-black" :class="report.eventClass">
                {{ report.eventRuleLabel }}
              </span>
            </div>

            <div class="hidden md:block">
              <span
                class="rounded-md px-2 py-1 text-[9px] font-black uppercase"
                :class="report.statusClass"
              >
                {{ report.statusLabel }}
              </span>
            </div>

            <div class="text-right">
              <button
                v-if="report.canEdit"
                type="button"
                class="rounded-lg border border-[#d8dee8] bg-white px-3 py-1.5 text-[10px] font-black text-[#102372] transition hover:border-[#ff6600] hover:text-[#ff6600]"
                @click="openEditModal(report.template)"
              >
                Editar
              </button>

              <span
                v-else
                class="rounded-md bg-[#eef2f7] px-2 py-1 text-[9px] font-black uppercase text-slate-500"
              >
                Base
              </span>
            </div>
          </article>
        </div>

        <div v-else class="flex min-h-[260px] items-center justify-center p-6 text-center">
          <div>
            <p class="text-[13px] font-black text-[#102372]">Sin reportes encontrados</p>

            <p class="mt-1 text-[11px] font-semibold text-slate-500">
              Limpia la busqueda o crea un nuevo reporte.
            </p>
          </div>
        </div>
      </div>

      <footer
        v-if="filteredReportRows.length > PAGE_SIZE"
        class="shrink-0 border-t border-[#edf1f5] bg-white px-4 py-2"
      >
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p class="text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">
            {{ pageStart }}-{{ pageEnd }} de {{ filteredReportRows.length }}
          </p>

          <div class="flex items-center justify-end gap-2">
            <button
              type="button"
              class="h-8 rounded-lg border border-[#d8dee8] bg-white px-3 text-[10px] font-black text-[#102372] transition hover:border-[#ff6600] hover:text-[#ff6600] disabled:cursor-not-allowed disabled:text-slate-300"
              :disabled="currentPage === 1"
              @click="goPreviousPage"
            >
              Anterior
            </button>

            <span class="rounded-lg bg-[#102372] px-3 py-2 text-[10px] font-black text-white">
              {{ currentPage }} / {{ totalPages }}
            </span>

            <button
              type="button"
              class="h-8 rounded-lg border border-[#d8dee8] bg-white px-3 text-[10px] font-black text-[#102372] transition hover:border-[#ff6600] hover:text-[#ff6600] disabled:cursor-not-allowed disabled:text-slate-300"
              :disabled="currentPage === totalPages"
              @click="goNextPage"
            >
              Siguiente
            </button>
          </div>
        </div>
      </footer>
    </main>

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
import { computed, defineAsyncComponent, ref, watch } from "vue"
import { useRoute } from "vue-router"

import { useAuditTrail } from "../composables/audit/useAuditTrail.js"
import { useReportEventRules } from "../composables/reports/useReportEventRules.js"
import { useReportTemplates } from "../composables/reports/useReportTemplates.js"
import { useReportsService } from "../services/reports/useReportsService.js"

import { REPORT_CATEGORIES } from "../data/mockReportTemplates.js"
import {
  REPORTS_VIEW_PAGE_SIZE,
  REPORTS_VIEW_TYPE_FILTERS,
  buildReportsViewEventRuleGroups,
  buildReportsViewRows,
  filterReportsViewRows,
  getReportsViewStats,
} from "../utils/reports/views/reportsViewUtils.js"

const ReportEventRulesModal = defineAsyncComponent(
  () => import("../components/reports/ReportEventRulesModal.vue"),
)

const ReportSchedulesModal = defineAsyncComponent(
  () => import("../components/reports/ReportSchedulesModal.vue"),
)

const ReportTemplateModal = defineAsyncComponent(
  () => import("../components/reports/ReportTemplateModal.vue"),
)

const PAGE_SIZE = REPORTS_VIEW_PAGE_SIZE
const reportTypeFilters = REPORTS_VIEW_TYPE_FILTERS

const route = useRoute()
const { reportTemplates, createReportTemplate, updateReportTemplate, deleteReportTemplate } =
  useReportTemplates()
const { reportEventRules } = useReportEventRules()
const { companyRecords } = useReportsService()

const reportSearch = ref("")
const selectedReportType = ref("all")
const currentPage = ref(1)
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

const currentCompanyId = computed(() => String(route.params.empresaId || ""))
const { recordAudit } = useAuditTrail({
  companyId: currentCompanyId,
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

const reportStats = computed(() => {
  return getReportsViewStats(reportTemplates.value)
})

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
    reportSearch: reportSearch.value,
    selectedReportType: selectedReportType.value,
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

watch([reportSearch, selectedReportType], () => {
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
  }
}
</script>
