<template>
  <section class="flex h-full min-h-0 flex-col overflow-hidden bg-[#f6f8fb]">
    <!-- Encabezado -->
    <header class="shrink-0 border-b border-[#d8dee8] bg-white px-4 py-3">
      <div class="flex items-center justify-between gap-4">
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <h3 class="truncate text-[14px] font-black text-[#102372]">Reportes</h3>

            <span class="rounded-md bg-[#eef2ff] px-2 py-0.5 text-[9px] font-black text-[#102372]">
              {{ visibleTemplates.length }}
            </span>
          </div>

          <p class="mt-0.5 truncate text-[10px] font-semibold text-slate-500">
            Genera información operativa de {{ reportAssets.length }} activos
          </p>
        </div>

        <div class="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            class="flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-[#d8dee8] bg-white px-2.5 text-[9px] font-black text-[#102372] transition hover:border-[#102372] hover:bg-[#f8fafc]"
            @click="openRulesModal"
          >
            <svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" aria-hidden="true">
              <path
                d="M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M10 14v6"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
              />
            </svg>

            Reglas
          </button>

          <button
            type="button"
            class="flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-[#d8dee8] bg-white px-2.5 text-[9px] font-black text-[#102372] transition hover:border-[#102372] hover:bg-[#f8fafc]"
            @click="openSchedulesModal()"
          >
            <svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" aria-hidden="true">
              <path
                d="M7 3v3M17 3v3M4.5 9h15M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>

            Programados
          </button>

          <button
            type="button"
            class="flex h-8 cursor-pointer items-center gap-1.5 rounded-lg bg-[#FF6600] px-2.5 text-[9px] font-black text-white transition hover:bg-[#e65c00]"
            @click="openCreateReportModal"
          >
            <svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" aria-hidden="true">
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>

            Nuevo
          </button>
        </div>
      </div>
    </header>

    <!-- Filtros -->
    <div
      class="flex shrink-0 items-center justify-between gap-3 border-b border-[#e5eaf1] bg-white px-4 py-2.5"
    >
      <div class="flex min-w-0 items-center gap-2">
        <label
          for="report-category"
          class="shrink-0 text-[9px] font-black uppercase tracking-[0.08em] text-slate-400"
        >
          Categoría
        </label>

        <div class="relative min-w-0">
          <select
            id="report-category"
            v-model="selectedCategory"
            class="h-8 min-w-[145px] cursor-pointer appearance-none rounded-lg border border-[#d8dee8] bg-[#f8fafc] py-0 pl-3 pr-8 text-[10px] font-black text-[#102372] outline-none transition hover:border-[#aeb8c8] focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10"
          >
            <option v-for="category in categoryOptions" :key="category.id" :value="category.id">
              {{ category.label }}
            </option>
          </select>

          <svg
            viewBox="0 0 24 24"
            class="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="m7 9 5 5 5-5"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
      </div>

      <p class="shrink-0 text-[9px] font-bold text-slate-400">
        {{ visibleTemplates.length }}
        {{ visibleTemplates.length === 1 ? "resultado" : "resultados" }}
      </p>
    </div>

    <!-- Lista -->
    <main class="min-h-0 flex-1 overflow-auto p-3">
      <div
        v-if="visibleTemplates.length"
        class="overflow-hidden rounded-xl border border-[#d8dee8] bg-white"
      >
        <div
          class="hidden grid-cols-[minmax(0,1.5fr)_120px_minmax(150px,0.8fr)_220px] items-center gap-3 border-b border-[#d8dee8] bg-[#f8fafc] px-3 py-2 lg:grid"
        >
          <p class="text-[8px] font-black uppercase tracking-[0.1em] text-slate-400">Reporte</p>

          <p class="text-[8px] font-black uppercase tracking-[0.1em] text-slate-400">Categoría</p>

          <p class="text-[8px] font-black uppercase tracking-[0.1em] text-slate-400">
            Reglas asociadas
          </p>

          <p class="text-right text-[8px] font-black uppercase tracking-[0.1em] text-slate-400">
            Acciones
          </p>
        </div>

        <article
          v-for="template in visibleTemplates"
          :key="template.id"
          class="group border-b border-[#edf1f5] px-3 py-3 transition last:border-b-0 hover:bg-[#f8fafc]"
        >
          <div
            class="grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_120px_minmax(150px,0.8fr)_220px] lg:items-center"
          >
            <!-- Información principal -->
            <div class="flex min-w-0 items-start gap-3">
              <div
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eef2ff] text-[#102372] transition group-hover:bg-[#102372] group-hover:text-white"
              >
                <svg viewBox="0 0 24 24" class="h-[17px] w-[17px]" fill="none" aria-hidden="true">
                  <path
                    d="M6.5 4h8l3 3v13h-11V4Z"
                    stroke="currentColor"
                    stroke-width="1.7"
                    stroke-linejoin="round"
                  />

                  <path
                    d="M14.5 4v3h3M9.5 11h5M9.5 14.5h5M9.5 18h3"
                    stroke="currentColor"
                    stroke-width="1.7"
                    stroke-linecap="round"
                  />
                </svg>
              </div>

              <div class="min-w-0">
                <div class="flex min-w-0 items-center gap-2">
                  <p class="min-w-0 truncate text-[11px] font-black text-[#172033]">
                    {{ template.name }}
                  </p>

                  <span
                    v-if="template.type === 'custom'"
                    class="shrink-0 rounded-md bg-[#fff3e8] px-1.5 py-0.5 text-[7px] font-black uppercase tracking-wide text-[#FF6600]"
                  >
                    Personalizado
                  </span>
                </div>

                <p
                  class="mt-1 line-clamp-2 text-[9px] font-semibold leading-relaxed text-slate-500"
                >
                  {{ template.description || "Reporte operativo de activos." }}
                </p>
              </div>
            </div>

            <!-- Categoría -->
            <div class="flex items-center lg:block">
              <span
                class="rounded-md border border-[#d8dee8] bg-[#f8fafc] px-2 py-1 text-[8px] font-black uppercase tracking-wide text-slate-500"
              >
                {{ getCategoryLabel(template.category) }}
              </span>
            </div>

            <!-- Reglas -->
            <div class="flex min-w-0 items-center gap-2">
              <span
                class="h-1.5 w-1.5 shrink-0 rounded-full"
                :class="
                  getTemplateEventRuleIds(template).length ? 'bg-emerald-500' : 'bg-slate-300'
                "
              ></span>

              <p
                class="min-w-0 truncate text-[9px] font-bold text-slate-500"
                :title="getTemplateRuleSummary(template)"
              >
                {{ getTemplateRuleSummary(template) }}
              </p>
            </div>

            <!-- Acciones -->
            <div class="flex items-center justify-end gap-1.5">
              <button
                type="button"
                class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-transparent text-slate-400 transition hover:border-[#d8dee8] hover:bg-white hover:text-[#102372] disabled:cursor-not-allowed disabled:opacity-30"
                :disabled="!template.id"
                title="Editar reporte"
                aria-label="Editar reporte"
                @click="openEditReportModal(template)"
              >
                <svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" aria-hidden="true">
                  <path
                    d="m14.5 5.5 4 4M5 19l3.5-.75L18 7.75a1.4 1.4 0 0 0 0-2l-.75-.75a1.4 1.4 0 0 0-2 0L5.75 14.5 5 19Z"
                    stroke="currentColor"
                    stroke-width="1.7"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </button>

              <button
                type="button"
                class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-transparent text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                :disabled="!canDeleteTemplate(template)"
                title="Eliminar reporte"
                aria-label="Eliminar reporte"
                @click="deleteTemplate(template)"
              >
                <svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" aria-hidden="true">
                  <path
                    d="M5 7h14M10 11v6M14 11v6M9 7l.5-2h5l.5 2M7 7l1 13h8l1-13"
                    stroke="currentColor"
                    stroke-width="1.7"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </button>

              <button
                type="button"
                class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-transparent text-slate-400 transition hover:border-[#d8dee8] hover:bg-white hover:text-[#102372] disabled:cursor-not-allowed disabled:opacity-30"
                :disabled="!canScheduleTemplate(template)"
                title="Programar reporte"
                aria-label="Programar reporte"
                @click="openSchedulesModal(template)"
              >
                <svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" aria-hidden="true">
                  <path
                    d="M7 3v3M17 3v3M5 9h14M7 13h4M7 17h3M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
                    stroke="currentColor"
                    stroke-width="1.7"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </button>

              <button
                type="button"
                class="flex h-8 cursor-pointer items-center gap-1.5 rounded-lg bg-[#102372] px-3 text-[9px] font-black text-white transition hover:bg-[#0b1a58] disabled:cursor-not-allowed disabled:bg-slate-300"
                :disabled="!canExecuteTemplate(template)"
                @click="openReportExecution(template)"
              >
                Ejecutar

                <svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" aria-hidden="true">
                  <path
                    d="m9 5 7 7-7 7"
                    stroke="currentColor"
                    stroke-width="1.9"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </article>
      </div>

      <!-- Estado vacío -->
      <div
        v-else
        class="flex min-h-[240px] h-full flex-col items-center justify-center rounded-xl border border-dashed border-[#cbd5e1] bg-white px-6 py-10 text-center"
      >
        <div
          class="flex h-11 w-11 items-center justify-center rounded-xl bg-[#102372]/[0.07] text-[#102372]"
        >
          <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" aria-hidden="true">
            <path
              d="M6.5 4h8l3 3v13h-11V4Z"
              stroke="currentColor"
              stroke-width="1.7"
              stroke-linejoin="round"
            />

            <path
              d="M14.5 4v3h3M9.5 11h5M9.5 14.5h3"
              stroke="currentColor"
              stroke-width="1.7"
              stroke-linecap="round"
            />
          </svg>
        </div>

        <p class="mt-3 text-[12px] font-black text-[#102372]">Sin reportes disponibles</p>

        <p class="mt-1.5 max-w-[250px] text-[10px] font-semibold leading-relaxed text-slate-500">
          Cambia la categoría o revisa los reportes habilitados para esta empresa.
        </p>
      </div>
    </main>

    <ReportExecutionModal
      v-if="isExecutionModalOpen"
      v-model="isExecutionModalOpen"
      :template="executionTemplate"
      :assets="reportAssets"
      :companies="companyRecords"
      :geofences="geofences"
      :groups="reportGroups"
    />

    <ReportTemplateModal
      v-if="isReportTemplateModalOpen"
      :open="isReportTemplateModalOpen"
      :template="editingTemplate"
      :categories="REPORT_CATEGORIES"
      @close="closeReportTemplateModal"
      @delete="deleteTemplateById"
      @save="saveReportTemplate"
    />

    <ReportEventRulesModal
      v-if="isRulesModalOpen"
      v-model="isRulesModalOpen"
      :groups="reportGroups"
    />

    <ReportSchedulesModal
      v-if="isSchedulesModalOpen"
      v-model="isSchedulesModalOpen"
      :templates="availableTemplates"
      :groups="reportGroups"
      :company-id="currentCompanyId"
      :selected-template="scheduleTemplate"
    />
  </section>
</template>

<script setup>
import { computed, defineAsyncComponent, ref, watch } from "vue"

import { useAuditTrail } from "../../../composables/audit/useAuditTrail.js"
import { useReportEventRules } from "../../../composables/reports/useReportEventRules.js"
import {
  canDeleteReportTemplate,
  normalizeReportTemplateEventRuleIds,
  normalizeReportTemplateStoredEventRuleIds,
  useReportTemplates,
} from "../../../composables/reports/useReportTemplates.js"
import { useReportsService } from "../../../services/reports/useReportsService.js"

import { REPORT_CATEGORIES, REPORT_TEMPLATE_TYPES } from "../../../data/mockReportTemplates.js"

const ReportExecutionModal = defineAsyncComponent(
  () => import("../../reports/ReportExecutionModal.vue"),
)

const ReportEventRulesModal = defineAsyncComponent(
  () => import("../../reports/ReportEventRulesModal.vue"),
)

const ReportSchedulesModal = defineAsyncComponent(
  () => import("../../reports/ReportSchedulesModal.vue"),
)

const ReportTemplateModal = defineAsyncComponent(
  () => import("../../reports/ReportTemplateModal.vue"),
)

const CATEGORY_ALL_ID = "all"

const REPORT_ORDER = [
  "mileage",
  "route-history",
  "speed",
  "stops",
  "idle-time",
  "gps-signal",
  "geofences",
  "fuel",
  "can",
  "engine-hours",
  "ignition",
]

const props = defineProps({
  activos: {
    type: Array,
    default: () => [],
  },
  allActivos: {
    type: Array,
    default: () => [],
  },
  companyId: {
    type: [String, Number],
    default: "",
  },
  geofences: {
    type: Array,
    default: () => [],
  },
  search: {
    type: String,
    default: "",
  },
})

const { reportTemplates, createReportTemplate, updateReportTemplate, deleteReportTemplate } =
  useReportTemplates()

const { reportEventRules } = useReportEventRules()
const { companyRecords } = useReportsService()

const selectedCategory = ref(CATEGORY_ALL_ID)
const executionTemplate = ref(null)
const isExecutionModalOpen = ref(false)
const isReportTemplateModalOpen = ref(false)
const isRulesModalOpen = ref(false)
const isSchedulesModalOpen = ref(false)
const editingTemplateId = ref(null)
const scheduleTemplate = ref(null)

const reportAssets = computed(() => {
  return props.allActivos.length ? props.allActivos : props.activos
})

const normalizeText = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

const currentCompanyId = computed(() => {
  return String(props.companyId || reportAssets.value[0]?.companyId || "")
})

const { recordAudit } = useAuditTrail({
  companyId: currentCompanyId,
})

const currentCompany = computed(() => {
  if (!currentCompanyId.value) return null

  return (
    companyRecords.value.find((company) => String(company.id) === currentCompanyId.value) || null
  )
})

const reportGroups = computed(() => {
  return (currentCompany.value?.sucursales || []).map((group) => ({
    ...group,
    id: String(group.id),
    companyId: currentCompany.value?.id || currentCompanyId.value,
    companyName: currentCompany.value?.name || "",
  }))
})

const eventRulesById = computed(() => {
  return new Map(reportEventRules.value.map((rule) => [String(rule.id), rule]))
})

const activeEventRuleIds = computed(() => {
  return new Set(
    reportEventRules.value
      .filter((rule) => rule.active !== false)
      .filter((rule) => String(rule.id) !== "all")
      .map((rule) => String(rule.id)),
  )
})

const editingTemplate = computed(() => {
  if (!editingTemplateId.value) return null

  return (
    reportTemplates.value.find((template) => {
      return String(template.id) === String(editingTemplateId.value)
    }) || null
  )
})

const availableTemplates = computed(() => {
  return reportTemplates.value.filter((template) => {
    if (template.module !== "assets") return false

    return (
      template.isDefault === true ||
      template.type === REPORT_TEMPLATE_TYPES.DEFAULT ||
      template.type === REPORT_TEMPLATE_TYPES.CUSTOM
    )
  })
})

const categoryOptions = computed(() => {
  const categories = REPORT_CATEGORIES.filter((category) => {
    return availableTemplates.value.some((template) => template.category === category.id)
  })

  return [
    {
      id: CATEGORY_ALL_ID,
      label: "Todos",
    },
    ...categories,
  ]
})

const visibleTemplates = computed(() => {
  const searchTerm = normalizeText(props.search)

  return availableTemplates.value
    .filter((template) => {
      const matchesCategory =
        selectedCategory.value === CATEGORY_ALL_ID || template.category === selectedCategory.value

      const searchableText = normalizeText(
        [
          template.name,
          template.description,
          template.reportTypeId,
          getCategoryLabel(template.category),
          getTemplateRuleSummary(template),
        ].join(" "),
      )

      return matchesCategory && (!searchTerm || searchableText.includes(searchTerm))
    })
    .sort((firstTemplate, secondTemplate) => {
      const firstIndex = REPORT_ORDER.indexOf(firstTemplate.reportTypeId)
      const secondIndex = REPORT_ORDER.indexOf(secondTemplate.reportTypeId)

      const resolvedFirstIndex = firstIndex >= 0 ? firstIndex : REPORT_ORDER.length

      const resolvedSecondIndex = secondIndex >= 0 ? secondIndex : REPORT_ORDER.length

      if (resolvedFirstIndex !== resolvedSecondIndex) {
        return resolvedFirstIndex - resolvedSecondIndex
      }

      return String(firstTemplate.name).localeCompare(String(secondTemplate.name), "es")
    })
})

const getCategoryLabel = (categoryId) => {
  return REPORT_CATEGORIES.find((category) => category.id === categoryId)?.label || "Reporte"
}

const getTemplateEventRuleIds = (template = {}) => {
  return normalizeReportTemplateEventRuleIds(template, activeEventRuleIds.value)
}

const getTemplateStoredEventRuleIds = (template = {}) => {
  return normalizeReportTemplateStoredEventRuleIds(template)
}

const getRunnableTemplate = (template = {}) => {
  const eventRuleIds = getTemplateEventRuleIds(template)

  return {
    ...template,
    eventRuleIds,
    eventRuleId: eventRuleIds[0] || null,
  }
}

const getTemplateRuleSummary = (template = {}) => {
  const eventRuleIds = getTemplateEventRuleIds(template)

  const labels = eventRuleIds
    .map((ruleId) => eventRulesById.value.get(String(ruleId))?.label)
    .filter(Boolean)

  if (!labels.length) {
    const storedLabels = getTemplateStoredEventRuleIds(template)
      .map((ruleId) => eventRulesById.value.get(String(ruleId))?.label)
      .filter(Boolean)

    if (!storedLabels.length) return "Sin reglas activas"
    if (storedLabels.length === 1) return `${storedLabels[0]} inactiva`

    return `${storedLabels.length} reglas inactivas`
  }

  if (labels.length <= 2) return labels.join(" + ")

  return `${labels[0]} + ${labels.length - 1} reglas`
}

const canExecuteTemplate = (template) => {
  return (
    template?.status === "active" &&
    getTemplateEventRuleIds(template).length > 0 &&
    reportAssets.value.length > 0
  )
}

const canScheduleTemplate = (template) => {
  return template?.status === "active" && getTemplateEventRuleIds(template).length > 0
}

const canDeleteTemplate = (template) => {
  return canDeleteReportTemplate(template)
}

const recordReportTemplateAudit = ({ action, description, severity = "info", template }) => {
  recordAudit({
    module: "reportes",
    action,
    entityType: "plantilla de reporte",
    entityName: template?.name || "Reporte",
    severity,
    description,
    metadata: {
      templateId: template?.id || "",
      reportTypeId: template?.reportTypeId || "",
      category: template?.category || "",
    },
  })
}

watch(
  categoryOptions,
  (categories) => {
    const categoryStillExists = categories.some(
      (category) => category.id === selectedCategory.value,
    )

    if (!categoryStillExists) {
      selectedCategory.value = CATEGORY_ALL_ID
    }
  },
  {
    immediate: true,
  },
)

const openReportExecution = (template) => {
  if (!canExecuteTemplate(template)) return

  executionTemplate.value = getRunnableTemplate(template)
  isExecutionModalOpen.value = true
}

const openRulesModal = () => {
  isRulesModalOpen.value = true
}

const openSchedulesModal = (template = null) => {
  scheduleTemplate.value = template
  isSchedulesModalOpen.value = true
}

const openCreateReportModal = () => {
  editingTemplateId.value = null
  isReportTemplateModalOpen.value = true
}

const openEditReportModal = (template) => {
  if (!template?.id) return

  editingTemplateId.value = template.id
  isReportTemplateModalOpen.value = true
}

const closeReportTemplateModal = () => {
  isReportTemplateModalOpen.value = false
  editingTemplateId.value = null
}

const deleteTemplate = (template) => {
  if (!canDeleteTemplate(template)) return

  const reportName = template.name || "este reporte"
  const confirmed =
    typeof window === "undefined" ||
    window.confirm(`Eliminar el reporte "${reportName}"? Esta accion no se puede deshacer.`)

  if (!confirmed) return

  const deleted = deleteReportTemplate(template.id)

  if (!deleted) return

  if (String(editingTemplateId.value) === String(template.id)) {
    closeReportTemplateModal()
  }

  if (String(executionTemplate.value?.id) === String(template.id)) {
    isExecutionModalOpen.value = false
    executionTemplate.value = null
  }

  recordReportTemplateAudit({
    action: "report:template:delete",
    description: "Se elimino una plantilla de reporte desde el panel de flota.",
    severity: "warning",
    template,
  })
}

const deleteTemplateById = (templateId) => {
  const template = reportTemplates.value.find((item) => String(item.id) === String(templateId))

  deleteTemplate(template)
}

const saveReportTemplate = ({ templateId, payload }) => {
  const isEditing = Boolean(templateId)
  const savedTemplate = templateId
    ? updateReportTemplate(templateId, payload)
    : createReportTemplate(payload)

  if (savedTemplate) {
    selectedCategory.value = savedTemplate.category || CATEGORY_ALL_ID
    recordReportTemplateAudit({
      action: isEditing ? "report:template:update" : "report:template:create",
      description: isEditing
        ? "Se actualizo una plantilla de reporte desde el panel de flota."
        : "Se creo una plantilla de reporte desde el panel de flota.",
      template: savedTemplate,
    })
  }

  closeReportTemplateModal()
}
</script>
