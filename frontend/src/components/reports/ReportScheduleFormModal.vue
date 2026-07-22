<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-[960] flex items-end justify-center bg-slate-950/55 p-2 sm:items-center sm:p-4"
      @click.self="closeModal"
    >
      <section
        class="flex max-h-[calc(100vh-16px)] w-full max-w-[720px] flex-col overflow-hidden rounded-t-xl bg-white shadow-[0_24px_80px_rgba(15,23,42,0.34)] sm:max-h-[calc(100vh-32px)] sm:rounded-xl"
      >
        <header class="shrink-0 border-b border-white/10 bg-[#102372] px-4 py-3">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-[10px] font-black uppercase tracking-[0.16em] text-white/55">
                Reporte programado
              </p>

              <h2 class="mt-0.5 truncate text-[15px] font-black text-white">
                {{ schedule?.id ? "Editar programacion" : "Nueva programacion" }}
              </h2>
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

        <main class="min-h-0 flex-1 overflow-auto bg-[#f6f8fb] p-3">
          <div
            class="grid gap-3 rounded-lg bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70"
          >
            <div class="rounded-lg bg-[#f6f8fb] p-2 ring-1 ring-inset ring-slate-200/70">
              <div class="mb-2 flex items-center justify-between gap-2">
                <span class="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                  Plantillas rapidas
                </span>

                <span class="text-[9px] font-black uppercase text-slate-400">
                  {{ REPORT_SCHEDULE_QUICK_PRESETS.length }}
                </span>
              </div>

              <div class="grid gap-2 md:grid-cols-2">
                <button
                  v-for="preset in REPORT_SCHEDULE_QUICK_PRESETS"
                  :key="preset.id"
                  type="button"
                  class="rounded-lg px-3 py-2 text-left transition"
                  :class="
                    activeQuickPresetId === preset.id
                      ? 'bg-[#102372] text-white shadow-sm'
                      : 'bg-white text-[#102372] ring-1 ring-inset ring-slate-200/80 hover:ring-[#ff6600]/50'
                  "
                  :disabled="!templates.length"
                  @click="applyQuickPreset(preset)"
                >
                  <span class="block text-[10px] font-black uppercase tracking-[0.04em]">
                    {{ preset.label }}
                  </span>

                  <span
                    class="mt-1 block truncate text-[9px] font-bold"
                    :class="activeQuickPresetId === preset.id ? 'text-white/65' : 'text-slate-400'"
                  >
                    {{ preset.detail }}
                  </span>
                </button>
              </div>
            </div>

            <div class="grid gap-3 md:grid-cols-2">
              <label class="block">
                <span class="text-[10px] font-black uppercase text-slate-400">Nombre</span>
                <input
                  v-model="draft.name"
                  type="text"
                  class="mt-1 h-9 w-full rounded-lg border border-[#d8dee8] bg-white px-3 text-[12px] font-bold text-[#102372] outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/10"
                />
              </label>

              <label class="block">
                <span class="text-[10px] font-black uppercase text-slate-400">Reporte</span>
                <select
                  v-model="draft.templateId"
                  class="mt-1 h-9 w-full rounded-lg border border-[#d8dee8] bg-white px-3 text-[12px] font-bold text-[#102372] outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/10"
                  @change="syncTemplateName"
                >
                  <option value="" disabled>Selecciona reporte</option>
                  <option v-for="item in templates" :key="item.id" :value="String(item.id)">
                    {{ item.name }}
                  </option>
                </select>
              </label>
            </div>

            <div class="grid gap-3 md:grid-cols-[1fr_120px_1fr]">
              <label class="block">
                <span class="text-[10px] font-black uppercase text-slate-400">Frecuencia</span>
                <select
                  v-model="draft.frequency"
                  class="mt-1 h-9 w-full rounded-lg border border-[#d8dee8] bg-white px-3 text-[12px] font-bold text-[#102372] outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/10"
                >
                  <option
                    v-for="frequency in REPORT_SCHEDULE_FREQUENCIES"
                    :key="frequency.id"
                    :value="frequency.id"
                  >
                    {{ frequency.label }}
                  </option>
                </select>
              </label>

              <label class="block">
                <span class="text-[10px] font-black uppercase text-slate-400">Hora</span>
                <input
                  v-model="draft.time"
                  type="time"
                  class="mt-1 h-9 w-full rounded-lg border border-[#d8dee8] bg-white px-3 text-[12px] font-bold text-[#102372] outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/10"
                />
              </label>

              <label v-if="draft.frequency === 'weekly'" class="block">
                <span class="text-[10px] font-black uppercase text-slate-400">Dia</span>
                <select
                  v-model.number="draft.weekday"
                  class="mt-1 h-9 w-full rounded-lg border border-[#d8dee8] bg-white px-3 text-[12px] font-bold text-[#102372] outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/10"
                >
                  <option
                    v-for="weekday in REPORT_SCHEDULE_WEEKDAY_OPTIONS"
                    :key="weekday.id"
                    :value="weekday.id"
                  >
                    {{ weekday.label }}
                  </option>
                </select>
              </label>

              <label v-else-if="draft.frequency === 'monthly'" class="block">
                <span class="text-[10px] font-black uppercase text-slate-400">Dia del mes</span>
                <input
                  v-model.number="draft.monthDay"
                  type="number"
                  min="1"
                  max="31"
                  class="mt-1 h-9 w-full rounded-lg border border-[#d8dee8] bg-white px-3 text-[12px] font-bold text-[#102372] outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/10"
                />
              </label>

              <div
                v-else
                class="rounded-lg bg-[#f6f8fb] px-3 py-2 ring-1 ring-inset ring-slate-200/70"
              >
                <p class="text-[10px] font-black uppercase text-slate-400">Ejecucion</p>
                <p class="mt-1 text-[12px] font-black text-[#102372]">Todos los dias</p>
              </div>
            </div>

            <div class="grid gap-3 md:grid-cols-3">
              <label class="block">
                <span class="text-[10px] font-black uppercase text-slate-400">Rango</span>
                <select
                  v-model="draft.rangeType"
                  class="mt-1 h-9 w-full rounded-lg border border-[#d8dee8] bg-white px-3 text-[12px] font-bold text-[#102372] outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/10"
                >
                  <option
                    v-for="range in REPORT_SCHEDULE_RANGE_OPTIONS"
                    :key="range.id"
                    :value="range.id"
                  >
                    {{ range.label }}
                  </option>
                </select>
              </label>

              <label class="block">
                <span class="text-[10px] font-black uppercase text-slate-400">Formato</span>
                <select
                  v-model="draft.format"
                  class="mt-1 h-9 w-full rounded-lg border border-[#d8dee8] bg-white px-3 text-[12px] font-bold text-[#102372] outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/10"
                >
                  <option
                    v-for="format in REPORT_SCHEDULE_FORMAT_OPTIONS"
                    :key="format.id"
                    :value="format.id"
                  >
                    {{ format.label }}
                  </option>
                </select>
              </label>

              <label class="block">
                <span class="text-[10px] font-black uppercase text-slate-400">Grupo</span>
                <select
                  v-model="draft.groupId"
                  class="mt-1 h-9 w-full rounded-lg border border-[#d8dee8] bg-white px-3 text-[12px] font-bold text-[#102372] outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/10"
                >
                  <option value="">Todos los grupos</option>
                  <option v-for="group in groups" :key="group.id" :value="String(group.id)">
                    {{ group.name }}
                  </option>
                </select>
              </label>
            </div>

            <label class="block">
              <span class="text-[10px] font-black uppercase text-slate-400">Destinatarios</span>
              <textarea
                v-model="recipientsText"
                rows="3"
                class="mt-1 w-full resize-none rounded-lg border border-[#d8dee8] bg-white px-3 py-2 text-[12px] font-bold text-[#102372] outline-none placeholder:text-slate-400 focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/10"
                placeholder="operaciones@empresa.cl, supervisor@empresa.cl"
              ></textarea>
            </label>

            <label
              class="flex items-center gap-2 rounded-lg bg-[#f6f8fb] px-3 py-2 ring-1 ring-inset ring-slate-200/70"
            >
              <input v-model="draft.active" type="checkbox" class="h-4 w-4 accent-[#ff6600]" />
              <span class="text-[11px] font-black text-[#102372]">Programacion activa</span>
            </label>
          </div>
        </main>

        <footer
          class="flex shrink-0 items-center justify-between gap-2 border-t border-slate-200/80 bg-white px-4 py-3"
        >
          <button
            v-if="schedule?.id"
            type="button"
            class="h-9 rounded-lg border border-red-200 bg-white px-4 text-[10px] font-black uppercase tracking-[0.08em] text-red-600 transition hover:bg-red-50"
            @click="emit('delete', schedule.id)"
          >
            Eliminar
          </button>

          <span v-else></span>

          <div class="flex items-center gap-2">
            <button
              type="button"
              class="h-9 rounded-lg border border-[#d8dee8] bg-white px-4 text-[10px] font-black uppercase tracking-[0.08em] text-slate-500 transition hover:border-[#ff6600] hover:text-[#ff6600]"
              @click="closeModal"
            >
              Cancelar
            </button>

            <button
              type="button"
              class="h-9 rounded-lg bg-[#ff6600] px-4 text-[10px] font-black uppercase tracking-[0.08em] text-white transition hover:bg-[#e65c00] disabled:cursor-not-allowed disabled:bg-slate-300"
              :disabled="!canSave"
              @click="saveDraft"
            >
              Guardar
            </button>
          </div>
        </footer>
      </section>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from "vue"

import {
  REPORT_SCHEDULE_FORMAT_OPTIONS,
  REPORT_SCHEDULE_FREQUENCIES,
  REPORT_SCHEDULE_QUICK_PRESETS,
  REPORT_SCHEDULE_RANGE_OPTIONS,
  REPORT_SCHEDULE_WEEKDAY_OPTIONS,
  normalizeScheduleRecipients,
} from "../../utils/reports/schedules/reportScheduleUtils.js"

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  schedule: {
    type: Object,
    default: null,
  },
  template: {
    type: Object,
    default: null,
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
})

const emit = defineEmits(["update:modelValue", "save", "delete"])

const draft = ref(createDraft())
const recipientsText = ref("")

const selectedTemplate = computed(() => {
  return (
    props.templates.find((template) => String(template.id) === String(draft.value.templateId)) ||
    props.template ||
    null
  )
})

const canSave = computed(() => {
  return Boolean(String(draft.value.name || "").trim() && draft.value.templateId)
})

const activeQuickPresetId = computed(() => {
  const activePreset = REPORT_SCHEDULE_QUICK_PRESETS.find((preset) => {
    return Object.entries(preset.values || {}).every(([key, value]) => {
      return String(draft.value[key]) === String(value)
    })
  })

  return activePreset?.id || ""
})

watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) return

    hydrateDraft()
  },
  {
    immediate: true,
  },
)

watch(
  () => [props.schedule?.id, props.template?.id, props.companyId],
  () => {
    if (!props.modelValue) return

    hydrateDraft()
  },
)

function createDraft() {
  return {
    id: null,
    name: "",
    templateId: "",
    templateName: "",
    companyId: "",
    groupId: "",
    frequency: "daily",
    time: "08:00",
    weekday: 1,
    monthDay: 1,
    rangeType: "previous-day",
    format: "pdf",
    recipients: [],
    active: true,
  }
}

function hydrateDraft() {
  const source = props.schedule || {}
  const template = props.template || props.templates[0] || null
  const templateId = source.templateId || template?.id || ""
  const templateName = source.templateName || template?.name || ""

  draft.value = {
    ...createDraft(),
    ...source,
    templateId: String(templateId),
    templateName,
    companyId: String(source.companyId || props.companyId || ""),
    name: source.name || `Programacion ${templateName || "reporte"}`,
  }

  recipientsText.value = (source.recipients || []).join(", ")
}

function closeModal() {
  emit("update:modelValue", false)
}

function syncTemplateName() {
  const template = selectedTemplate.value

  if (!template) return

  draft.value = {
    ...draft.value,
    templateName: template.name || "Reporte",
    name:
      draft.value.name && !draft.value.name.startsWith("Programacion ")
        ? draft.value.name
        : `Programacion ${template.name || "reporte"}`,
  }
}

function applyQuickPreset(preset) {
  const template =
    findTemplateForPreset(preset) || selectedTemplate.value || props.templates[0] || null
  const templateName = template?.name || draft.value.templateName || "reporte"

  draft.value = {
    ...draft.value,
    ...preset.values,
    templateId: template?.id ? String(template.id) : draft.value.templateId,
    templateName,
    name: `Programacion ${preset.label}`,
  }
}

function findTemplateForPreset(preset) {
  return (
    props.templates
      .map((template) => ({
        template,
        score: getTemplatePresetScore(template, preset),
      }))
      .filter((item) => item.score > 0)
      .sort((firstItem, secondItem) => secondItem.score - firstItem.score)[0]?.template || null
  )
}

function getTemplatePresetScore(template, preset) {
  const reportTypeId = normalizePresetText(template?.reportTypeId)
  const templateText = normalizePresetText(
    [template?.id, template?.name, template?.description, template?.category].join(" "),
  )
  const eventRuleIds = Array.isArray(template?.eventRuleIds)
    ? template.eventRuleIds
    : template?.eventRuleId
      ? [template.eventRuleId]
      : []
  const eventRuleSet = new Set(eventRuleIds.map(normalizePresetText))
  let score = 0

  if ((preset.reportTypeIds || []).map(normalizePresetText).includes(reportTypeId)) {
    score += 10
  }

  for (const ruleId of preset.eventRuleIds || []) {
    if (eventRuleSet.has(normalizePresetText(ruleId))) {
      score += 5
    }
  }

  for (const keyword of preset.keywords || []) {
    if (templateText.includes(normalizePresetText(keyword))) {
      score += 2
    }
  }

  return score
}

function normalizePresetText(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

function saveDraft() {
  if (!canSave.value) return

  emit("save", {
    ...draft.value,
    templateName: selectedTemplate.value?.name || draft.value.templateName,
    recipients: normalizeScheduleRecipients(recipientsText.value),
  })
}
</script>
