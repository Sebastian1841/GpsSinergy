<template>
  <div>
    <Teleport to="body">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[930] flex items-end justify-center bg-slate-950/60 p-2 sm:items-center sm:p-5"
        @click.self="closeModal"
      >
        <section
          class="flex max-h-[calc(100vh-16px)] w-full max-w-[1120px] flex-col overflow-hidden rounded-t-xl bg-white shadow-[0_28px_90px_rgba(15,23,42,0.38)] sm:max-h-[88vh] sm:rounded-xl"
        >
          <header
            class="relative shrink-0 overflow-hidden border-b-2 border-[#ff6600] bg-[#102372] px-6 py-3.5 sm:px-8"
          >
            <div
              class="pointer-events-none absolute inset-y-0 right-[18%] hidden w-40 -skew-x-[28deg] bg-white/[0.025] sm:block"
            ></div>
            <div
              class="pointer-events-none absolute inset-y-0 right-[7%] hidden w-24 -skew-x-[28deg] bg-white/[0.035] sm:block"
            ></div>

            <div class="relative z-10 flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <span class="h-0.5 w-5 rounded-full bg-[#ff6600]"></span>
                  <p class="text-[9px] font-black uppercase tracking-[0.16em] text-white/65">
                    Reportes
                  </p>
                </div>

                <h2
                  class="mt-1 truncate text-[19px] font-black leading-tight text-white sm:text-[21px]"
                >
                  Reglas de evento
                </h2>

                <p class="mt-1 text-[10px] font-semibold text-white/70 sm:text-[11px]">
                  Gestiona las reglas utilizadas en la generación de reportes y alertas.
                </p>
              </div>

              <button
                type="button"
                class="flex h-9 w-9 items-center justify-center rounded-lg text-white/65 transition hover:bg-white/10 hover:text-white"
                aria-label="Cerrar reglas de evento"
                @click="closeModal"
              >
                <svg viewBox="0 0 24 24" class="h-6 w-6" fill="none" aria-hidden="true">
                  <path
                    d="M6 6l12 12M18 6 6 18"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                  />
                </svg>
              </button>
            </div>
          </header>

          <div
            class="grid shrink-0 items-center gap-3 border-b border-slate-200/80 bg-[#f6f8fb] px-5 py-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_180px_auto]"
          >
            <label class="relative min-w-0">
              <span class="sr-only">Buscar regla</span>
              <svg
                viewBox="0 0 24 24"
                class="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="m20 20-4.35-4.35M18 10.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
              <input
                v-model="ruleSearch"
                type="search"
                class="h-10 w-full rounded-lg border border-[#cfd8e6] bg-white pl-11 pr-4 text-[11px] font-semibold text-[#102372] outline-none placeholder:text-slate-400 focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/10"
                placeholder="Buscar regla de evento..."
              />
            </label>

            <button
              type="button"
              class="h-10 rounded-lg bg-[#ff6600] px-5 text-[11px] font-black text-white shadow-sm transition hover:bg-[#e65c00]"
              @click="openCreateForm"
            >
              Nueva regla
            </button>

            <p class="text-center text-[10px] font-black text-slate-500 lg:min-w-[70px]">
              {{ filteredRules.length }}
              {{ filteredRules.length === 1 ? "regla" : "reglas" }}
            </p>
          </div>

          <div class="min-h-0 flex-1 overflow-auto bg-[#f6f8fb] p-4 sm:p-6">
            <div v-if="filteredRules.length" class="grid gap-3 lg:grid-cols-2 lg:gap-4">
              <article
                v-for="rule in filteredRules"
                :key="rule.id"
                class="flex min-h-[138px] flex-col rounded-lg border border-[#dfe5ed] bg-white p-5 shadow-[0_4px_18px_rgba(15,35,114,0.04)]"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <div class="flex min-w-0 items-center gap-2">
                      <h3 class="truncate text-[15px] font-black text-[#102372]">
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
                      class="mt-1.5 line-clamp-2 text-[11px] font-semibold leading-relaxed text-slate-500"
                    >
                      {{ rule.description || "Sin descripcion." }}
                    </p>
                  </div>

                  <div class="flex shrink-0 gap-1.5">
                    <button
                      type="button"
                      class="h-8 rounded-lg border border-[#cfd8e6] bg-white px-4 text-[10px] font-black text-[#102372] transition hover:border-[#ff6600] hover:text-[#ff6600]"
                      @click="openEditForm(rule.id)"
                    >
                      Editar
                    </button>

                    <button
                      v-if="rule.source === 'custom'"
                      type="button"
                      class="h-8 rounded-lg border border-red-200 bg-white px-3 text-[9px] font-black text-red-600 transition hover:bg-red-50"
                      @click="deleteRule(rule)"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>

                <p
                  class="mt-auto border-t border-[#e8edf3] pt-3 text-[9px] font-black uppercase tracking-[0.08em] text-slate-500"
                >
                  {{ getRuleSummary(rule) }}
                </p>
              </article>
            </div>

            <div
              v-else
              class="rounded-lg border border-dashed border-[#cbd5e1] bg-white px-4 py-8 text-center"
            >
              <p class="text-[12px] font-black text-[#102372]">Sin reglas encontradas</p>
            </div>
          </div>

          <footer
            class="flex shrink-0 flex-col gap-3 border-t border-[#edf1f5] bg-white px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6"
          >
            <button
              type="button"
              class="h-9 rounded-lg border border-[#cfd8e6] bg-white px-5 text-[10px] font-black text-[#102372] transition hover:border-[#ff6600] hover:text-[#ff6600]"
              @click="closeModal"
            >
              Cerrar
            </button>

            <div
              class="flex max-w-[360px] items-start gap-2.5 rounded-lg bg-[#f6f8fb] px-3 py-2.5 text-[9px] font-semibold leading-relaxed text-slate-500"
            >
              <span
                class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#102372] text-[11px] font-black text-[#102372]"
              >
                i
              </span>
              <span>Las reglas de evento se aplican en la generación de reportes y alertas.</span>
            </div>
          </footer>
        </section>
      </div>
    </Teleport>

    <ReportEventRuleFormModal
      v-if="isFormModalOpen"
      v-model="isFormModalOpen"
      :rule-id="selectedRuleId"
      :groups="groups"
    />
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent, ref, watch } from "vue"

import { useAuditTrail } from "../../composables/audit/useAuditTrail.js"
import { useReportEventRules } from "../../composables/reports/useReportEventRules.js"
import { preloadWhenIdle } from "../../composables/ui/useIdlePreload.js"

const loadReportEventRuleFormModal = () => import("./ReportEventRuleFormModal.vue")
const ReportEventRuleFormModal = defineAsyncComponent(loadReportEventRuleFormModal)

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
    if (isOpen) {
      preloadWhenIdle([loadReportEventRuleFormModal], {
        delay: 800,
        timeout: 2500,
      })
      return
    }

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

function getRuleVehicleGroupIds(rule = {}) {
  return Array.isArray(rule.vehicleGroupIds) ? rule.vehicleGroupIds : rule.groupIds || []
}

function getRuleSummary(rule) {
  const conditionCount = Array.isArray(rule.conditions) ? rule.conditions.length : 0
  const groupCount = getRuleVehicleGroupIds(rule).length
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
