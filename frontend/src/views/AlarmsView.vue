<template>
  <section class="h-full min-h-0 bg-[#f4f7fb] text-slate-900">
    <div class="grid h-full min-h-0 grid-rows-[auto_1fr]">
      <header class="inbox-header shrink-0 px-4 pb-3 pt-3 xl:px-5">
        <div class="inbox-heading">
          <h1 class="sr-only">Bandeja de alertas</h1>
          <div class="inbox-tabs" role="tablist" aria-label="Estado de atencion">
            <button
              v-for="tab in inboxTabs"
              :key="tab.id"
              type="button"
              role="tab"
              :aria-selected="inboxTab === tab.id"
              :class="{ selected: inboxTab === tab.id }"
              @click="inboxTab = tab.id"
            >
              {{ tab.label }}
            </button>
          </div>
          <RouterLink v-if="canViewRules" class="inbox-rules" :to="rulesPath"
            >Las reglas</RouterLink
          >
        </div>
        <dl class="inbox-metrics">
          <div>
            <dt>Sin iniciar</dt>
            <dd>{{ inboxSummary.unattended }}</dd>
          </div>
          <div>
            <dt>En curso</dt>
            <dd>{{ inboxSummary.inProgress }}</dd>
          </div>
          <div>
            <dt>Hoy</dt>
            <dd>{{ inboxSummary.today }}</dd>
          </div>
          <div class="inbox-oldest">
            <dt>Mas antigua</dt>
            <dd>
              {{ oldestLabel }}
            </dd>
          </div>
          <div title="Alertas con fecha limite de atencion vencida">
            <dt>Con atraso</dt>
            <dd>{{ inboxSummary.overdue }}</dd>
          </div>
        </dl>
        <AlarmFilters
          class="inbox-header-filters"
          hide-status
          :search-term="searchTerm"
          :selected-status="selectedStatus"
          :selected-company-id="selectedCompanyId"
          :selected-date-range="selectedDateRange"
          :status-options="statusFilterOptions"
          :company-options="companyOptions"
          :date-range-options="dateRangeOptions"
          @update:search-term="searchTerm = $event"
          @update:selected-status="selectedStatus = $event"
          @update:selected-company-id="selectedCompanyId = $event"
          @update:selected-date-range="selectedDateRange = $event"
          @clear-filters="clearFilters"
        />

        <div
          v-if="feedbackMessage"
          class="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-black text-emerald-700"
        >
          {{ feedbackMessage }}
        </div>

        <div
          v-if="!canManageAlarms"
          class="mt-3 rounded-lg border border-[#d8e0eb] bg-white px-3 py-2 text-[11px] font-bold text-slate-500"
        >
          Tienes permiso de lectura. Para resolver o reabrir alertas necesitas permiso de edicion.
        </div>
      </header>

      <main
        class="inbox-main min-h-0 overflow-hidden px-4 pb-4 xl:px-5"
        :class="{ 'inbox-showing-detail': selectedAlarm }"
      >
        <div class="inbox-layout grid h-full min-h-0 gap-3 xl:grid-cols-[minmax(0,1fr)_400px]">
          <section ref="listPane" class="inbox-list-pane flex min-h-0 flex-col gap-3">
            <div class="flex min-h-0 flex-1 flex-col gap-2">
              <div ref="selectionToolbar" class="inbox-selection">
                <span>{{ visibleRows.length }} grupos · {{ inboxEpisodeCount }} alertas</span>
                <div>
                  <button type="button" :disabled="!visibleRows.length" @click="selectAllGroups">
                    Seleccionar todos
                  </button>
                  <button
                    type="button"
                    :disabled="!selectedGroupKeys.length"
                    @click="selectedGroupKeys = []"
                  >
                    Quitar seleccion
                  </button>
                  <button
                    v-if="canManageAlarms"
                    type="button"
                    :disabled="!selectedGroupKeys.length"
                    @click="attendSelected"
                  >
                    Atender seleccion ({{ selectedGroupKeys.length }})
                  </button>
                </div>
              </div>
              <AlarmList
                :now="clockNow"
                :rows="pagedRows"
                :selected-alarm-id="selectedAlarmId"
                :selected-group-keys="selectedGroupKeys"
                @toggle-group="toggleGroup"
                @select-alarm="selectAlarm"
              />
              <div ref="paginationToolbar" class="inbox-pagination">
                <span
                  >{{ visibleRows.length ? (inboxPage - 1) * inboxPageSize + 1 : 0 }}-{{
                    Math.min(inboxPage * inboxPageSize, visibleRows.length)
                  }}
                  de {{ visibleRows.length }} grupos</span
                >
                <div>
                  <label class="inbox-page-size">
                    Por pagina
                    <select v-model="pageSizeChoice" aria-label="Grupos por pagina">
                      <option value="auto">Automatico</option>
                      <option v-for="size in [4, 10, 25, 50]" :key="size" :value="String(size)">
                        {{ size }}
                      </option>
                    </select>
                  </label>
                  <button
                    type="button"
                    aria-label="Pagina anterior"
                    :disabled="inboxPage <= 1"
                    @click="inboxPage--"
                  >
                    <SvgIcon name="chevron-left" /></button
                  ><span>{{ inboxPage }} / {{ inboxPageCount }}</span
                  ><button
                    type="button"
                    aria-label="Pagina siguiente"
                    :disabled="inboxPage >= inboxPageCount"
                    @click="inboxPage++"
                  >
                    <SvgIcon name="chevron-right" />
                  </button>
                </div>
              </div>
            </div>
          </section>

          <div class="min-h-0" :class="selectedAlarm ? 'inbox-detail-container' : 'hidden xl:flex'">
            <AlarmDetailPanel
              class="w-full"
              :alarm="selectedAlarm"
              :can-manage="canManageAlarms"
              :attention-count="attentionTargets.length"
              :attending="attentionMode !== ''"
              @begin-attention="beginAttention('single')"
              @cancel-attention="cancelAttention"
              @close="clearSelectedAlarm"
              @attend-alarm="handleAttention"
              @reopen-alarm="handleReopenAlarm"
            />
          </div>
        </div>
      </main>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from "vue"
import { useRoute } from "vue-router"

import AlarmDetailPanel from "../components/alarms/AlarmDetailPanel.vue"
import AlarmFilters from "../components/alarms/AlarmFilters.vue"
import AlarmList from "../components/alarms/AlarmList.vue"
import SvgIcon from "../components/icons/SvgIcon.vue"
import { useAuditTrail } from "../composables/audit/useAuditTrail.js"
import { useAccessControl } from "../composables/auth/useAccessControl.js"
import { useAuthSession } from "../composables/auth/useAuthSession.js"
import { useDebouncedValue } from "../composables/ui/useDebouncedValue.js"
import { useAlarmsService } from "../services/alarms/useAlarmsService.js"
import {
  filterAlarmRows,
  getAuthorizedAlarmRows,
  sortAlarmRows,
} from "../utils/alarms/alarmUtils.js"
import { normalizeId } from "../utils/idUtils.js"
import { buildInboxSummary, groupInboxAlarms, matchesInboxTab } from "../utils/alarms/alarmInbox.js"
import {
  buildAttentionUpdate,
  getAttentionTargets,
  attentionTargetSignature,
} from "../utils/alarms/alarmAttention.js"

const route = useRoute()

const currentCompanyId = computed(() => {
  return normalizeId(route.params.empresaId || "")
})

const { currentUser } = useAuthSession()
const { alarms, reopenAlarm, updateAlarm } = useAlarmsService()

const { accessibleCompanies, visibleAssets, canAccessFunction, isPlatformAdmin } =
  useAccessControl()
const canViewRules = computed(
  () =>
    isPlatformAdmin.value ||
    (currentCompanyId.value &&
      canAccessFunction("configuration-alerts", currentCompanyId.value, "view")),
)

const { recordAudit } = useAuditTrail({
  companyId: currentCompanyId,
})

const searchTerm = ref("")
const selectedStatus = ref("all")
const selectedCompanyId = ref("all")
const selectedDateRange = ref("all")
const selectedAlarmId = ref("")
const attentionMode = ref("")
const attentionSnapshot = ref(null)
const feedbackMessage = ref("")
const inboxTab = ref("unattended")
const inboxTabs = [
  { id: "unattended", label: "Sin iniciar" },
  { id: "in-progress", label: "En curso" },
  { id: "attended", label: "Atendidas" },
  { id: "all", label: "Todas" },
  { id: "historical", label: "Historicas" },
]
const selectedGroupKeys = ref([])
const inboxPage = ref(1)
const MAX_INBOX_PAGE_SIZE = 4
const automaticPageSize = ref(MAX_INBOX_PAGE_SIZE)
const pageSizeChoice = ref("auto")
const inboxPageSize = computed(() =>
  pageSizeChoice.value === "auto" ? automaticPageSize.value : Number(pageSizeChoice.value),
)
watch(pageSizeChoice, () => {
  inboxPage.value = 1
})
const listPane = ref(null)
const selectionToolbar = ref(null)
const paginationToolbar = ref(null)
let listSizeObserver
const fitInboxPage = () => {
  const pane = listPane.value
  if (!pane || !pane.clientHeight) return
  const rowHeight = parseFloat(getComputedStyle(pane).getPropertyValue("--inbox-row-height")) || 112
  // Reserve the table header, vertical padding and two gaps between the toolbars.
  const available =
    pane.clientHeight -
    (selectionToolbar.value?.offsetHeight || 0) -
    (paginationToolbar.value?.offsetHeight || 0) -
    36 -
    16 -
    16
  automaticPageSize.value = Math.max(
    1,
    Math.min(MAX_INBOX_PAGE_SIZE, Math.floor((available + 6) / (rowHeight + 6))),
  )
}
onMounted(() => {
  listSizeObserver = new ResizeObserver(fitInboxPage)
  for (const element of [listPane.value, selectionToolbar.value, paginationToolbar.value]) {
    if (element) listSizeObserver.observe(element)
  }
  fitInboxPage()
})
onUnmounted(() => listSizeObserver?.disconnect())
const clockNow = ref(Date.now())
const clockTimer = window.setInterval(() => {
  clockNow.value = Date.now()
}, 60000)
onUnmounted(() => {
  window.clearInterval(clockTimer)
  if (feedbackTimeoutId) window.clearTimeout(feedbackTimeoutId)
})
const rulesPath = computed(() =>
  currentCompanyId.value
    ? `/app/${currentCompanyId.value}/configuracion/alertas`
    : "/configuracion/alertas",
)

const debouncedSearchTerm = useDebouncedValue(searchTerm, 180)

const statusFilterOptions = [
  {
    id: "all",
    label: "Todos",
  },
  {
    id: "active",
    label: "Activas",
  },
  {
    id: "resolved",
    label: "Resueltas",
  },
]

const dateRangeOptions = [
  {
    id: "all",
    label: "Todas",
  },
  {
    id: "today",
    label: "Hoy",
  },
  {
    id: "yesterday",
    label: "Ayer",
  },
  {
    id: "last-7-days",
    label: "Ultimos 7 dias",
  },
]

let feedbackTimeoutId = null

const companiesForScope = computed(() => {
  return accessibleCompanies.value || []
})

const assetsForScope = computed(() => {
  const assets = visibleAssets.value || []

  if (!currentCompanyId.value) {
    return assets
  }

  return assets.filter((asset) => {
    return normalizeId(asset.companyId) === currentCompanyId.value
  })
})

const activeCompany = computed(() => {
  if (!currentCompanyId.value) {
    return null
  }

  return (
    companiesForScope.value.find((company) => {
      return normalizeId(company.id) === currentCompanyId.value
    }) || null
  )
})

const canManageAlarms = computed(() => {
  const companyId = currentCompanyId.value || null

  return (
    canAccessFunction("alarms", companyId, "edit") ||
    canAccessFunction("alarms", companyId, "admin")
  )
})

const companyOptions = computed(() => {
  if (currentCompanyId.value) {
    return activeCompany.value
      ? [
          {
            id: normalizeId(activeCompany.value.id),
            label: activeCompany.value.name,
          },
        ]
      : []
  }

  return companiesForScope.value
    .map((company) => ({
      id: normalizeId(company.id),
      label: company.name || company.shortName || "Empresa",
    }))
    .filter((company) => company.id)
    .sort((left, right) => {
      return left.label.localeCompare(right.label)
    })
})

const authorizedRows = computed(() => {
  return getAuthorizedAlarmRows({
    alarms: alarms.value,
    visibleAssets: assetsForScope.value,
    companies: companiesForScope.value,
    companyId: currentCompanyId.value,
  })
})

const toDateInput = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

const selectedDateFilters = computed(() => {
  const today = new Date()
  const todayInput = toDateInput(today)

  if (selectedDateRange.value === "today") {
    return {
      dateFrom: todayInput,
      dateTo: todayInput,
    }
  }

  if (selectedDateRange.value === "yesterday") {
    const yesterday = new Date(today)

    yesterday.setDate(today.getDate() - 1)

    const yesterdayInput = toDateInput(yesterday)

    return {
      dateFrom: yesterdayInput,
      dateTo: yesterdayInput,
    }
  }

  if (selectedDateRange.value === "last-7-days") {
    const fromDate = new Date(today)

    fromDate.setDate(today.getDate() - 6)

    return {
      dateFrom: toDateInput(fromDate),
      dateTo: todayInput,
    }
  }

  return {
    dateFrom: "",
    dateTo: "",
  }
})

const filteredRows = computed(() => {
  const companyFilteredRows =
    selectedCompanyId.value === "all"
      ? authorizedRows.value
      : authorizedRows.value.filter((alarm) => {
          return alarm.companyId === normalizeId(selectedCompanyId.value)
        })

  return filterAlarmRows({
    rows: companyFilteredRows,
    searchTerm: debouncedSearchTerm.value,
    selectedStatus: selectedStatus.value,
    dateFrom: selectedDateFilters.value.dateFrom,
    dateTo: selectedDateFilters.value.dateTo,
  })
})

const visibleRows = computed(() => {
  return groupInboxAlarms(
    sortAlarmRows(filteredRows.value.filter((alarm) => matchesInboxTab(alarm, inboxTab.value))),
  )
})
const inboxSummary = computed(() =>
  buildInboxSummary(
    authorizedRows.value.filter(
      (alarm) => selectedCompanyId.value === "all" || alarm.companyId === selectedCompanyId.value,
    ),
    clockNow.value,
  ),
)
const oldestLabel = computed(() => {
  const minutes = inboxSummary.value.oldestMinutes
  if (minutes === null) return "-"
  if (minutes < 60) return `${minutes} min`
  if (minutes < 1440) return `${Math.floor(minutes / 60)} h`
  return `${Math.floor(minutes / 1440)} dias`
})
const inboxEpisodeCount = computed(() =>
  visibleRows.value.reduce((sum, group) => sum + group.groupMembers.length, 0),
)
const inboxPageCount = computed(() =>
  Math.max(1, Math.ceil(visibleRows.value.length / inboxPageSize.value)),
)
const pagedRows = computed(() =>
  visibleRows.value.slice(
    (inboxPage.value - 1) * inboxPageSize.value,
    inboxPage.value * inboxPageSize.value,
  ),
)
watch([inboxTab, debouncedSearchTerm, selectedCompanyId, selectedDateRange], () => {
  cancelAttention()
  inboxPage.value = 1
  selectedGroupKeys.value = []
})
watch(inboxPageCount, (count) => {
  inboxPage.value = Math.min(inboxPage.value, count)
})
watch(visibleRows, (groups) => {
  const keys = new Set(groups.map((group) => group.groupKey))
  selectedGroupKeys.value = selectedGroupKeys.value.filter((key) => keys.has(key))
})
const toggleGroup = (key) => {
  selectedGroupKeys.value = selectedGroupKeys.value.includes(key)
    ? selectedGroupKeys.value.filter((item) => item !== key)
    : [...selectedGroupKeys.value, key]
}
const selectAllGroups = () => {
  selectedGroupKeys.value = visibleRows.value.map((group) => group.groupKey)
}
const attendSelected = () => {
  const group = visibleRows.value.find((item) => selectedGroupKeys.value.includes(item.groupKey))
  if (group && canManageAlarms.value) {
    selectedAlarmId.value = group.id
    beginAttention("bulk")
  }
}

const selectedAlarm = computed(() => {
  if (!selectedAlarmId.value) {
    return null
  }

  return (
    visibleRows.value.find((alarm) => {
      return alarm.id === selectedAlarmId.value
    }) || null
  )
})

const currentActorName = computed(() => {
  return currentUser.value?.name || currentUser.value?.username || "Usuario"
})

const showFeedback = (message) => {
  feedbackMessage.value = message

  if (feedbackTimeoutId) {
    window.clearTimeout(feedbackTimeoutId)
  }

  feedbackTimeoutId = window.setTimeout(() => {
    feedbackMessage.value = ""
    feedbackTimeoutId = null
  }, 2400)
}

const recordAlarmAudit = ({ alarm, action, description, severity = "info" }) => {
  if (!alarm) {
    return
  }

  recordAudit({
    companyId: alarm.companyId,
    companyName: alarm.companyName,
    module: "alertas",
    action,
    entityType: "alerta",
    entityName: alarm.title,
    severity,
    description,
    metadata: {
      alarmId: alarm.id,
      assetId: alarm.assetId,
      assetPlate: alarm.assetPlate,
      alarmType: alarm.type,
      alarmSeverity: alarm.severity,
    },
  })
}

const selectAlarm = (alarmId) => {
  cancelAttention()
  selectedAlarmId.value = alarmId
}

const clearSelectedAlarm = () => {
  cancelAttention()
  selectedAlarmId.value = ""
}

const clearFilters = () => {
  searchTerm.value = ""
  selectedStatus.value = "all"
  selectedCompanyId.value = "all"
  selectedDateRange.value = "all"
}

const attentionTargets = computed(() =>
  getAttentionTargets({
    groups: visibleRows.value,
    selectedAlarmId: selectedAlarmId.value,
    mode: attentionMode.value,
    selectedGroupKeys: selectedGroupKeys.value,
  }),
)
const cancelAttention = () => {
  attentionMode.value = ""
  attentionSnapshot.value = null
}
const selectionSignature = () => JSON.stringify([...selectedGroupKeys.value].sort())
const beginAttention = (mode) => {
  if (!canManageAlarms.value) return
  const targets = getAttentionTargets({
    groups: visibleRows.value,
    selectedAlarmId: selectedAlarmId.value,
    mode,
    selectedGroupKeys: selectedGroupKeys.value,
  })
  if (!targets.length) return
  attentionSnapshot.value = {
    targets: attentionTargetSignature(targets),
    selection: selectionSignature(),
  }
  attentionMode.value = mode
}
const attentionIsUnchanged = () =>
  attentionSnapshot.value &&
  attentionTargetSignature(attentionTargets.value) === attentionSnapshot.value.targets &&
  (attentionMode.value !== "bulk" || selectionSignature() === attentionSnapshot.value.selection)
watch([() => attentionTargetSignature(attentionTargets.value), () => selectionSignature()], () => {
  if (attentionMode.value && !attentionIsUnchanged()) {
    cancelAttention()
    showFeedback("La seleccion cambio. Vuelve a presionar Atender para confirmar las alertas.")
  }
})

const handleAttention = ({ id, action, note } = {}) => {
  if (!canManageAlarms.value || !attentionMode.value || selectedAlarmId.value !== id) return
  if (!attentionIsUnchanged()) {
    cancelAttention()
    showFeedback("La seleccion cambio. No se guardo la atencion.")
    return
  }
  const targets = [...attentionTargets.value]
  const now = new Date().toISOString()
  let registered = 0
  for (const alarm of targets) {
    const changes = buildAttentionUpdate(alarm, {
      action,
      note,
      actor: currentActorName.value,
      at: now,
    })
    if (!changes) continue
    updateAlarm(alarm.id, changes)
    registered++
    recordAlarmAudit({
      alarm,
      action: "alarm:attention",
      description: `${changes.metadata.attention.label}${changes.metadata.attention.note ? ": " + changes.metadata.attention.note : ""}`,
    })
  }
  if (!registered) return
  cancelAttention()
  selectedGroupKeys.value = []
  selectedAlarmId.value = ""
  showFeedback(`Atencion registrada en ${registered} ${registered === 1 ? "alerta" : "alertas"}.`)
}

const handleReopenAlarm = (alarmId) => {
  if (!canManageAlarms.value) {
    return
  }

  const alarmBeforeUpdate = visibleRows.value.find((alarm) => {
    return alarm.id === alarmId
  })

  if (!alarmBeforeUpdate) return
  for (const alarm of alarmBeforeUpdate.groupMembers) {
    updateAlarm(alarm.id, {
      metadata: {
        ...alarm.metadata,
        attention: null,
        attentionHistory: [
          ...(Array.isArray(alarm.metadata?.attentionHistory)
            ? alarm.metadata.attentionHistory
            : []),
          {
            action: "reopened",
            label: "Reabierta",
            actor: currentActorName.value,
            at: new Date().toISOString(),
          },
        ],
      },
    })
    reopenAlarm(alarm.id)
    recordAlarmAudit({
      alarm,
      action: "alarm:reopen",
      description: "Se reabrio una alerta operativa.",
      severity: "warning",
    })
  }

  showFeedback("Alerta reabierta.")
}

watch(
  visibleRows,
  (rows) => {
    if (
      selectedAlarmId.value &&
      rows.some((alarm) => {
        return alarm.id === selectedAlarmId.value
      })
    ) {
      return
    }

    selectedAlarmId.value = ""
  },
  {
    immediate: true,
  },
)
</script>

<style scoped>
.inbox-list-pane {
  --inbox-row-height: 112px;
}
@media (max-width: 767px) {
  .inbox-list-pane {
    --inbox-row-height: 240px;
  }
}
.inbox-heading,
.inbox-selection,
.inbox-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.inbox-heading {
  padding-bottom: 0;
  margin-bottom: 14px;
  border-bottom: 1px solid #e4eaf2;
  gap: 16px;
}
.inbox-header {
  padding-top: 8px;
  padding-bottom: 16px;
  margin-bottom: 16px;
  border-bottom: 1px solid #d8e0eb;
  background: #ffffff;
}
.inbox-header-filters {
  padding: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
}
.inbox-header-filters :deep(> div) {
  grid-template-columns: minmax(0, 1fr) 190px 190px 110px;
  gap: 10px;
}
.inbox-header-filters :deep(input[type="search"]),
.inbox-header-filters :deep(.alarm-filter-field),
.inbox-header-filters :deep(button) {
  height: 40px;
  border-radius: 6px;
  background: white;
  font-size: 13px;
}
.inbox-header-filters :deep(button) {
  border-color: #d8e0eb;
}
.inbox-header-filters :deep(.alarm-filter-field) {
  padding: 0 12px;
}
.inbox-header-filters :deep(input[type="search"]),
.inbox-header-filters :deep(select) {
  font-weight: 500;
}
.inbox-detail-container {
  display: flex;
  min-height: 0;
}
@media (max-width: 1279px) {
  .inbox-showing-detail {
    overflow-y: auto;
  }
  .inbox-showing-detail .inbox-layout {
    display: block;
    height: auto;
    min-height: 100%;
  }
  .inbox-showing-detail .inbox-list-pane {
    display: none;
  }
  .inbox-detail-container {
    position: static;
    min-width: 0;
  }
  .inbox-detail-container :deep(aside > main) {
    overflow: visible;
  }
  .inbox-detail-container :deep(aside > footer) {
    margin-top: 20px;
  }
}
.inbox-metrics {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0;
  width: 100%;
  margin-bottom: 16px;
}
.inbox-metrics > div {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
  padding: 0 20px;
  border-right: 1px solid #e4eaf2;
}
.inbox-metrics > div:first-child {
  padding-left: 0;
}
.inbox-metrics > div:last-child {
  border-right: 0;
}
.inbox-metrics dt {
  font-size: 12px;
  color: #5f7396;
  font-weight: 500;
}
.inbox-metrics dd {
  margin: 3px 0 0;
  font-size: 22px;
  color: #102372;
  font-weight: 700;
}
.inbox-oldest dd {
  color: #c95000;
}
.inbox-tabs {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  padding: 0;
}
.inbox-tabs button {
  min-height: 44px;
  padding: 0 2px;
  border-bottom: 2px solid transparent;
  font-size: 13px;
  font-weight: 700;
  color: #5f7396;
}
.inbox-tabs button.selected {
  border-bottom-color: #ff6600;
  color: #102372;
}
.inbox-rules {
  color: #102372;
  font-size: 12px;
  font-weight: 700;
  padding: 8px 14px;
  border: 1px solid #d8e0eb;
  border-radius: 6px;
  text-align: center;
  flex-shrink: 0;
}
.inbox-selection,
.inbox-pagination {
  color: #49658f;
  font-size: 12px;
}
.inbox-selection > div,
.inbox-pagination > div {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}
.inbox-selection button,
.inbox-pagination button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  border: 1px solid #d8e0eb;
  border-radius: 6px;
  padding: 0 10px;
  background: white;
  color: #102372;
  font-size: 12px;
  font-weight: 600;
}
.inbox-selection button:disabled,
.inbox-pagination button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.inbox-selection button:hover:not(:disabled),
.inbox-pagination button:hover:not(:disabled) {
  border-color: #102372;
  background: #eef3ff;
}
.inbox-pagination :deep(svg) {
  width: 16px;
  height: 16px;
}
.inbox-page-size {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #49658f;
}
.inbox-page-size select {
  min-width: 90px;
  height: 32px;
  border: 1px solid #d8e0eb;
  border-radius: 6px;
  background: white;
  padding: 0 8px;
  color: #102372;
  font-size: 12px;
}
@media (max-width: 1199px) {
  .inbox-metrics {
    width: 100%;
  }
  .inbox-header-filters :deep(> div) {
    grid-template-columns: minmax(0, 1fr) 160px 160px 110px;
  }
}
@media (max-width: 767px) {
  .inbox-header {
    padding-top: 12px;
    padding-bottom: 12px;
    margin-bottom: 12px;
  }
  .inbox-heading {
    gap: 10px;
    padding-bottom: 12px;
  }
  .inbox-tabs {
    gap: 14px;
    width: 100%;
    justify-content: space-between;
  }
  .inbox-tabs button {
    padding: 0;
    font-size: 12px;
    min-height: 34px;
  }
  .inbox-metrics {
    gap: 0;
  }
  .inbox-metrics > div {
    padding: 0 7px;
  }
  .inbox-metrics dt {
    font-size: 10px;
  }
  .inbox-metrics dd {
    font-size: 18px;
  }
  .inbox-oldest dd {
    font-size: 16px;
    white-space: nowrap;
  }
  .inbox-rules {
    margin-left: auto;
    padding: 7px 12px;
  }
  .inbox-header-filters :deep(> div) {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 8px;
  }
  .inbox-header-filters :deep(> div > label:first-child) {
    grid-column: 1 / -1;
  }
  .inbox-header-filters :deep(> div > button) {
    grid-column: 1 / -1;
  }
}
</style>
