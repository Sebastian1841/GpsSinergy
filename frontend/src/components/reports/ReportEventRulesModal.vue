<template>
  <div>
    <Teleport to="body">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[930] flex items-end justify-center bg-slate-950/55 p-2 sm:items-center sm:p-4"
        @click.self="closeModal"
      >
        <section
          class="flex max-h-[calc(100vh-16px)] w-full max-w-[680px] flex-col overflow-hidden rounded-t-xl bg-white shadow-[0_24px_80px_rgba(15,23,42,0.34)] sm:max-h-[calc(100vh-32px)] sm:rounded-xl"
        >
          <header class="shrink-0 border-b border-white/10 bg-[#102372] px-4 py-3">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="text-[10px] font-black uppercase tracking-[0.16em] text-white/55">
                  Reportes
                </p>

                <h2 class="mt-0.5 truncate text-[15px] font-black text-white">Reglas de evento</h2>
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
            <label class="min-w-0">
              <span class="sr-only">Buscar regla</span>
              <input
                v-model="ruleSearch"
                type="search"
                class="h-9 w-full rounded-lg border border-[#d8dee8] bg-white px-3 text-[11px] font-bold text-[#102372] outline-none placeholder:text-slate-400 focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/10"
                placeholder="Buscar regla de evento..."
              />
            </label>

            <button
              type="button"
              class="h-9 rounded-lg bg-[#ff6600] px-4 text-[10px] font-black uppercase tracking-[0.08em] text-white transition hover:bg-[#e65c00]"
              @click="openCreateForm"
            >
              Nueva regla
            </button>
          </div>

          <div class="min-h-0 flex-1 overflow-auto bg-[#f6f8fb] p-3">
            <div v-if="filteredRules.length" class="grid gap-2">
              <article
                v-for="rule in filteredRules"
                :key="rule.id"
                class="rounded-lg bg-white p-3 shadow-[0_1px_3px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <div class="flex min-w-0 items-center gap-2">
                      <h3 class="truncate text-[12px] font-black text-[#102372]">
                        {{ rule.label }}
                      </h3>

                      <span
                        class="shrink-0 rounded-md px-2 py-0.5 text-[8px] font-black uppercase"
                        :class="
                          rule.source === 'custom'
                            ? 'bg-[#fff3eb] text-[#ff6600]'
                            : 'bg-[#eef2f7] text-slate-500'
                        "
                      >
                        {{ rule.source === "custom" ? "Propia" : "Base" }}
                      </span>

                      <span
                        v-if="getNotificationCount(rule)"
                        class="shrink-0 rounded-md bg-[#eef3ff] px-2 py-0.5 text-[8px] font-black uppercase text-[#102372]"
                      >
                        {{ getNotificationCount(rule) }} notif.
                      </span>
                    </div>

                    <p
                      class="mt-1 line-clamp-2 text-[11px] font-semibold leading-relaxed text-slate-500"
                    >
                      {{ rule.description || "Sin descripcion." }}
                    </p>

                    <p
                      class="mt-2 text-[10px] font-black uppercase tracking-[0.04em] text-slate-400"
                    >
                      {{ getRuleSummary(rule) }}
                    </p>
                  </div>

                  <div class="flex shrink-0 gap-1.5">
                    <button
                      type="button"
                      class="h-8 rounded-lg border border-[#d8dee8] bg-white px-3 text-[9px] font-black uppercase tracking-[0.06em] text-[#102372] transition hover:border-[#ff6600] hover:text-[#ff6600]"
                      @click="openEditForm(rule.id)"
                    >
                      Editar
                    </button>

                    <button
                      v-if="rule.source === 'custom'"
                      type="button"
                      class="h-8 rounded-lg border border-red-200 bg-white px-3 text-[9px] font-black uppercase tracking-[0.06em] text-red-600 transition hover:bg-red-50"
                      @click="deleteRule(rule)"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </article>
            </div>

            <div
              v-else
              class="rounded-lg border border-dashed border-[#cbd5e1] bg-white px-4 py-8 text-center"
            >
              <p class="text-[12px] font-black text-[#102372]">Sin reglas encontradas</p>
            </div>
          </div>

          <footer class="shrink-0 border-t border-[#edf1f5] bg-white px-3 py-3">
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

    <ReportEventRuleFormModal
      v-model="isFormModalOpen"
      :rule-id="selectedRuleId"
      :groups="groups"
    />
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue"

import { useAuditTrail } from "../../composables/audit/useAuditTrail.js"
import { useReportEventRules } from "../../composables/reports/useReportEventRules.js"
import ReportEventRuleFormModal from "./ReportEventRuleFormModal.vue"

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  groups: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(["update:modelValue"])

const { reportEventRules, deleteEventRule } = useReportEventRules()
const { recordAudit } = useAuditTrail()

const isFormModalOpen = ref(false)
const selectedRuleId = ref("")
const ruleSearch = ref("")

const filteredRules = computed(() => {
  const term = normalizeSearch(ruleSearch.value)
  const rules = reportEventRules.value.filter((rule) => String(rule.id) !== "all")

  if (!term) return rules

  return rules.filter((rule) => {
    return normalizeSearch([rule.label, rule.description, getRuleSummary(rule)].join(" ")).includes(
      term,
    )
  })
})

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) return

    isFormModalOpen.value = false
    selectedRuleId.value = ""
    ruleSearch.value = ""
  },
)

function normalizeSearch(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

function closeModal() {
  emit("update:modelValue", false)
}

function openCreateForm() {
  selectedRuleId.value = ""
  isFormModalOpen.value = true
}

function openEditForm(ruleId) {
  selectedRuleId.value = String(ruleId || "")
  isFormModalOpen.value = true
}

function deleteRule(rule) {
  if (!rule?.id || rule.source !== "custom") return

  if (!deleteEventRule(rule.id)) return

  recordAudit({
    module: "reportes",
    action: "event-rule:delete",
    entityType: "regla de evento",
    entityName: rule.label || "Regla de evento",
    severity: "warning",
    description: "Se elimino una regla de evento.",
    metadata: {
      ruleId: rule.id,
    },
  })
}

function getNotificationCount(rule = {}) {
  return Array.isArray(rule.notifications)
    ? rule.notifications.filter((notification) => notification.enabled !== false).length
    : 0
}

function getRuleSummary(rule) {
  const conditionCount = Array.isArray(rule.conditions) ? rule.conditions.length : 0
  const groupCount = Array.isArray(rule.groupIds) ? rule.groupIds.length : 0
  const notificationCount = getNotificationCount(rule)
  const usesCalendar = rule.schedule?.mode === "calendar"
  const usesDelay = rule.activation?.mode === "delayed"
  const scheduleLabel = usesCalendar ? " - calendario" : ""
  const activationLabel = usesDelay ? ` - retrasado ${rule.activation.delayMinutes || 1} min` : ""
  const notificationLabel = notificationCount ? ` - ${notificationCount} notif.` : " - sin notif."

  const conditionLabel = conditionCount
    ? `${conditionCount} expresion${conditionCount === 1 ? "" : "es"}`
    : "Sin expresiones"
  const groupLabel = groupCount ? `${groupCount} grupos` : "todos"

  return `${conditionLabel} - ${groupLabel}${notificationLabel}${scheduleLabel}${activationLabel}`
}
</script>
