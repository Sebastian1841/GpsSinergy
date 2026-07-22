<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-[950] flex items-end justify-center bg-slate-950/55 p-2 sm:items-center sm:p-4"
      @click.self="closeModal"
    >
      <section
        class="flex max-h-[calc(100vh-16px)] w-full max-w-[920px] flex-col overflow-hidden rounded-t-xl bg-white shadow-[0_24px_80px_rgba(15,23,42,0.34)] sm:max-h-[calc(100vh-32px)] sm:rounded-xl"
      >
        <header class="shrink-0 border-b border-white/10 bg-[#102372] px-4 py-3">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-[10px] font-black uppercase tracking-[0.16em] text-white/55">
                Reportes
              </p>

              <h2 class="mt-0.5 truncate text-[15px] font-black text-white">Programaciones</h2>
            </div>

            <button
              type="button"
              class="rounded-lg px-2 py-1 text-[18px] font-black leading-none text-white/65 transition hover:bg-white/10 hover:text-white"
              @click="closeModal"
            >
              x
            </button>
          </div>
        </header>

        <div
          class="grid shrink-0 gap-2 border-b border-slate-200/80 bg-[#f6f8fb] p-3 sm:grid-cols-[minmax(0,1fr)_auto]"
        >
          <div class="flex flex-wrap items-center gap-2">
            <span class="rounded-md bg-white px-2 py-1 text-[10px] font-black text-[#102372]">
              {{ activeCount }} activas
            </span>

            <span class="rounded-md bg-white px-2 py-1 text-[10px] font-black text-slate-500">
              {{ scopedSchedules.length }} total
            </span>
          </div>

          <button
            type="button"
            class="h-9 rounded-lg bg-[#ff6600] px-4 text-[10px] font-black uppercase tracking-[0.08em] text-white transition hover:bg-[#e65c00] disabled:cursor-not-allowed disabled:bg-slate-300"
            :disabled="!templates.length"
            @click="openCreateForm()"
          >
            Nueva
          </button>
        </div>

        <main class="min-h-0 flex-1 overflow-auto bg-[#f6f8fb] p-3">
          <div v-if="scopedSchedules.length" class="grid gap-2">
            <article
              v-for="schedule in scopedSchedules"
              :key="schedule.id"
              class="rounded-lg bg-white p-3 shadow-[0_1px_3px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70"
            >
              <div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_210px_150px] lg:items-center">
                <div class="min-w-0">
                  <div class="flex min-w-0 flex-wrap items-center gap-1.5">
                    <p class="truncate text-[12px] font-black text-[#102372]">
                      {{ schedule.name }}
                    </p>

                    <span
                      class="rounded-md px-2 py-0.5 text-[8px] font-black uppercase"
                      :class="
                        schedule.active
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      "
                    >
                      {{ schedule.active ? "Activa" : "Pausada" }}
                    </span>
                  </div>

                  <p class="mt-1 line-clamp-1 text-[10px] font-semibold text-slate-500">
                    {{ getTemplateLabel(schedule) }} / {{ getFrequencyLabel(schedule) }} /
                    {{ getFormatLabel(schedule.format) }}
                  </p>

                  <div class="mt-2 flex flex-wrap gap-1.5">
                    <span
                      class="rounded-md bg-[#eef3ff] px-2 py-1 text-[9px] font-black text-[#102372]"
                    >
                      {{ getRangeLabel(schedule.rangeType) }}
                    </span>

                    <span
                      class="rounded-md bg-[#fff3eb] px-2 py-1 text-[9px] font-black text-[#ff6600]"
                    >
                      {{ getGroupLabel(schedule.groupId) }}
                    </span>

                    <span
                      class="rounded-md bg-[#eef2f7] px-2 py-1 text-[9px] font-black text-slate-500"
                    >
                      {{ schedule.recipients.length || 0 }} destinatarios
                    </span>
                  </div>
                </div>

                <div class="rounded-lg bg-[#f6f8fb] px-3 py-2 ring-1 ring-inset ring-slate-200/70">
                  <p class="text-[9px] font-black uppercase text-slate-400">Proxima ejecucion</p>
                  <p class="mt-1 text-[11px] font-black text-[#102372]">
                    {{ getNextRunLabel(schedule) }}
                  </p>
                </div>

                <div class="flex justify-end gap-1.5">
                  <button
                    type="button"
                    class="h-8 rounded-lg border border-[#d8dee8] bg-white px-2.5 text-[9px] font-black uppercase tracking-[0.06em] text-[#102372] transition hover:border-[#ff6600] hover:text-[#ff6600]"
                    @click="toggleVisualSchedule(schedule.id)"
                  >
                    {{ schedule.active ? "Pausar" : "Activar" }}
                  </button>

                  <button
                    type="button"
                    class="h-8 rounded-lg border border-[#d8dee8] bg-white px-2.5 text-[9px] font-black uppercase tracking-[0.06em] text-[#102372] transition hover:border-[#ff6600] hover:text-[#ff6600]"
                    @click="openEditForm(schedule)"
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    class="h-8 rounded-lg border border-red-200 bg-white px-2.5 text-[9px] font-black uppercase tracking-[0.06em] text-red-600 transition hover:bg-red-50"
                    @click="deleteSchedule(schedule)"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </article>
          </div>

          <div
            v-else
            class="flex min-h-[260px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center shadow-[0_1px_3px_rgba(15,23,42,0.06)]"
          >
            <div>
              <p class="text-[13px] font-black text-[#102372]">Sin reportes programados</p>
              <p class="mt-1 max-w-[300px] text-[11px] font-semibold text-slate-500">
                Crea una programacion para dejar preparado el envio recurrente del reporte.
              </p>
            </div>
          </div>
        </main>

        <footer class="shrink-0 border-t border-slate-200/80 bg-white px-3 py-3">
          <button
            type="button"
            class="h-9 rounded-lg border border-[#d8dee8] bg-white px-4 text-[10px] font-black uppercase tracking-[0.08em] text-slate-500 transition hover:border-[#ff6600] hover:text-[#ff6600]"
            @click="closeModal"
          >
            Cerrar
          </button>
        </footer>
      </section>
    </div>
  </Teleport>

  <ReportScheduleFormModal
    v-model="isFormOpen"
    :schedule="editingSchedule"
    :template="selectedTemplateForForm"
    :templates="templates"
    :groups="groups"
    :company-id="companyId"
    @delete="handleFormDelete"
    @save="saveSchedule"
  />
</template>

<script setup>
import { computed, ref, watch } from "vue"

import { useAuditTrail } from "../../composables/audit/useAuditTrail.js"
import {
  getReportScheduleFormatLabel,
  getReportScheduleFrequencyLabel,
  getReportScheduleRangeLabel,
  getReportScheduleWeekdayLabel,
  normalizeScheduleRecipients,
} from "../../utils/reports/schedules/reportScheduleUtils.js"
import ReportScheduleFormModal from "./ReportScheduleFormModal.vue"

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  templates: {
    type: Array,
    default: () => [],
  },
  groups: {
    type: Array,
    default: () => [],
  },
  companyId: {
    type: [String, Number],
    default: "",
  },
  selectedTemplate: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(["update:modelValue"])
const { recordAudit } = useAuditTrail({
  companyId: computed(() => props.companyId),
})

const isFormOpen = ref(false)
const editingScheduleId = ref("")
const selectedTemplateForForm = ref(null)
const hasOpenedSelectedTemplate = ref(false)
const visualSchedules = ref([])

const scopedSchedules = computed(() => {
  const companyId = String(props.companyId || "")

  return visualSchedules.value.filter((schedule) => {
    return !companyId || !schedule.companyId || String(schedule.companyId) === companyId
  })
})

const activeCount = computed(() => {
  return scopedSchedules.value.filter((schedule) => schedule.active).length
})

const editingSchedule = computed(() => {
  if (!editingScheduleId.value) return null

  return (
    visualSchedules.value.find((schedule) => {
      return String(schedule.id) === String(editingScheduleId.value)
    }) || null
  )
})

const templatesById = computed(() => {
  return new Map(props.templates.map((template) => [String(template.id), template]))
})

const groupsById = computed(() => {
  return new Map(props.groups.map((group) => [String(group.id), group]))
})

watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) {
      isFormOpen.value = false
      editingScheduleId.value = ""
      selectedTemplateForForm.value = null
      hasOpenedSelectedTemplate.value = false
      return
    }

    if (props.selectedTemplate && !hasOpenedSelectedTemplate.value) {
      openCreateForm(props.selectedTemplate)
      hasOpenedSelectedTemplate.value = true
    }
  },
  {
    immediate: true,
  },
)

function closeModal() {
  emit("update:modelValue", false)
}

function openCreateForm(template = null) {
  editingScheduleId.value = ""
  selectedTemplateForForm.value = template || props.selectedTemplate || props.templates[0] || null
  isFormOpen.value = true
}

function openEditForm(schedule) {
  editingScheduleId.value = String(schedule.id || "")
  selectedTemplateForForm.value = templatesById.value.get(String(schedule.templateId)) || null
  isFormOpen.value = true
}

function saveSchedule(payload) {
  const isEditing = Boolean(editingScheduleId.value)
  const nextSchedule = createVisualSchedule({
    ...payload,
    companyId: payload.companyId || props.companyId,
  })
  let savedSchedule = nextSchedule

  if (editingScheduleId.value) {
    visualSchedules.value = visualSchedules.value.map((schedule) => {
      if (String(schedule.id) !== String(editingScheduleId.value)) return schedule

      savedSchedule = {
        ...schedule,
        ...nextSchedule,
        id: schedule.id,
      }

      return savedSchedule
    })
  } else {
    visualSchedules.value = [nextSchedule, ...visualSchedules.value]
  }

  recordAudit({
    companyId: savedSchedule.companyId || props.companyId,
    module: "reportes",
    action: isEditing ? "report:schedule:update" : "report:schedule:create",
    entityType: "programacion de reporte",
    entityName: savedSchedule.name || "Programacion",
    description: isEditing
      ? "Se modifico una programacion de reporte."
      : "Se creo una programacion de reporte.",
    metadata: {
      scheduleId: savedSchedule.id,
      templateId: savedSchedule.templateId,
    },
  })

  isFormOpen.value = false
  editingScheduleId.value = ""
  selectedTemplateForForm.value = null
}

function deleteSchedule(schedule) {
  if (!schedule?.id) return

  const confirmed =
    typeof window === "undefined" || window.confirm(`Eliminar la programacion "${schedule.name}"?`)

  if (!confirmed) return

  visualSchedules.value = visualSchedules.value.filter((item) => {
    return String(item.id) !== String(schedule.id)
  })

  recordAudit({
    companyId: schedule.companyId || props.companyId,
    module: "reportes",
    action: "report:schedule:delete",
    entityType: "programacion de reporte",
    entityName: schedule.name || "Programacion",
    severity: "warning",
    description: "Se elimino una programacion de reporte.",
    metadata: {
      scheduleId: schedule.id,
      templateId: schedule.templateId,
    },
  })
}

function handleFormDelete(scheduleId) {
  const schedule = visualSchedules.value.find((item) => {
    return String(item.id) === String(scheduleId)
  })

  visualSchedules.value = visualSchedules.value.filter((schedule) => {
    return String(schedule.id) !== String(scheduleId)
  })

  if (schedule) {
    recordAudit({
      companyId: schedule.companyId || props.companyId,
      module: "reportes",
      action: "report:schedule:delete",
      entityType: "programacion de reporte",
      entityName: schedule.name || "Programacion",
      severity: "warning",
      description: "Se elimino una programacion de reporte.",
      metadata: {
        scheduleId: schedule.id,
        templateId: schedule.templateId,
      },
    })
  }

  isFormOpen.value = false
  editingScheduleId.value = ""
}

function toggleVisualSchedule(scheduleId) {
  let updatedSchedule = null

  visualSchedules.value = visualSchedules.value.map((schedule) => {
    if (String(schedule.id) !== String(scheduleId)) return schedule

    updatedSchedule = {
      ...schedule,
      active: !schedule.active,
    }

    return updatedSchedule
  })

  if (!updatedSchedule) return

  recordAudit({
    companyId: updatedSchedule.companyId || props.companyId,
    module: "reportes",
    action: "report:schedule:toggle",
    entityType: "programacion de reporte",
    entityName: updatedSchedule.name || "Programacion",
    description: updatedSchedule.active
      ? "Se activo una programacion de reporte."
      : "Se pauso una programacion de reporte.",
    metadata: {
      scheduleId: updatedSchedule.id,
      templateId: updatedSchedule.templateId,
    },
  })
}

function getTemplateLabel(schedule) {
  return templatesById.value.get(String(schedule.templateId))?.name || schedule.templateName
}

function getGroupLabel(groupId) {
  if (!groupId) return "Todos los grupos"

  return groupsById.value.get(String(groupId))?.name || "Grupo"
}

function getFrequencyLabel(schedule) {
  if (schedule.frequency === "weekly") {
    return `${getReportScheduleFrequencyLabel(schedule.frequency)} / ${getReportScheduleWeekdayLabel(
      schedule.weekday,
    )} ${schedule.time}`
  }

  if (schedule.frequency === "monthly") {
    return `${getReportScheduleFrequencyLabel(schedule.frequency)} / dia ${schedule.monthDay} ${schedule.time}`
  }

  return `${getReportScheduleFrequencyLabel(schedule.frequency)} / ${schedule.time}`
}

function getRangeLabel(rangeType) {
  return getReportScheduleRangeLabel(rangeType)
}

function getFormatLabel(format) {
  return getReportScheduleFormatLabel(format)
}

function getNextRunLabel(schedule) {
  if (!schedule.active) return "Pausada"

  if (schedule.frequency === "weekly") {
    return `${getReportScheduleWeekdayLabel(schedule.weekday)} ${schedule.time}`
  }

  if (schedule.frequency === "monthly") {
    return `Dia ${schedule.monthDay} / ${schedule.time}`
  }

  return `Cada dia / ${schedule.time}`
}

function createVisualSchedule(payload) {
  return {
    ...payload,
    id: payload.id || `visual-schedule-${Date.now()}`,
    recipients: normalizeScheduleRecipients(payload.recipients),
    active: payload.active !== false,
  }
}
</script>
