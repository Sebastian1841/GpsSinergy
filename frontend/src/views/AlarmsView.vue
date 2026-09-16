<template>
  <section class="h-full min-h-0 bg-[#f4f7fb] text-slate-900">
    <div class="grid h-full min-h-0 grid-rows-[auto_1fr]">
      <header class="shrink-0 px-4 pb-3 pt-3 xl:px-5">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="alarm-panel-tab"
              :class="activeAlarmPanel === 'config' ? 'is-active' : ''"
              @click="activeAlarmPanel = 'config'"
            >
              <SvgIcon name="configuracion" class="h-4 w-4" />
              Configuracion de alertas
            </button>

            <button
              type="button"
              class="alarm-panel-tab"
              :class="activeAlarmPanel === 'history' ? 'is-active' : ''"
              @click="activeAlarmPanel = 'history'"
            >
              <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" aria-hidden="true">
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M12 7v5l3 2"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              Historial de alertas
            </button>
          </div>

          <button
            v-if="activeAlarmPanel === 'config'"
            type="button"
            class="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#ff6600] px-5 text-[12px] font-black text-white shadow-sm transition hover:bg-[#e65c00] disabled:cursor-not-allowed disabled:bg-slate-300"
            :disabled="!canManageAlarms"
            @click="openNewAutomaticAlert"
          >
            <SvgIcon name="plus" class="h-4 w-4" />
            Nueva alerta
          </button>

          <div v-else class="hidden lg:block"></div>
        </div>

        <div v-if="activeAlarmPanel === 'history'" class="mt-4">
          <AlarmSummaryHeader
            :items="summaryItems"
            :selected-status="selectedStatus"
            @select-summary="handleSummaryFilter"
          />
        </div>

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

      <main v-if="activeAlarmPanel === 'history'" class="min-h-0 overflow-hidden px-4 pb-4 xl:px-5">
        <div class="grid h-full min-h-0 gap-3 xl:grid-cols-[minmax(0,1fr)_400px]">
          <section class="grid min-h-0 grid-rows-[auto_1fr] gap-3">
            <AlarmFilters
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

            <AlarmList
              :rows="visibleRows"
              :selected-alarm-id="selectedAlarmId"
              @select-alarm="selectAlarm"
            />
          </section>

          <AlarmDetailPanel
            :alarm="selectedAlarm"
            :can-manage="canManageAlarms"
            @close="clearSelectedAlarm"
            @resolve-alarm="handleResolveAlarm"
            @reopen-alarm="handleReopenAlarm"
            @view-asset="viewAlarmOnItinerary"
          />
        </div>
      </main>

      <main v-else class="min-h-0 overflow-hidden px-4 pb-4 xl:px-5">
        <AlarmConfigPanel
          ref="configPanelRef"
          :company-id="currentCompanyId"
          :companies="companiesForScope"
          :assets="assetsForScope"
          :asset-tags="assetTags"
          :geofences="geofences"
          :geofence-groups="geofenceGroups"
          :can-manage="canManageAlarms"
        />
      </main>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"

import AlarmConfigPanel from "../components/alarms/AlarmConfigPanel.vue"
import AlarmDetailPanel from "../components/alarms/AlarmDetailPanel.vue"
import AlarmFilters from "../components/alarms/AlarmFilters.vue"
import AlarmList from "../components/alarms/AlarmList.vue"
import AlarmSummaryHeader from "../components/alarms/AlarmSummaryHeader.vue"
import SvgIcon from "../components/icons/SvgIcon.vue"
import { useAuditTrail } from "../composables/audit/useAuditTrail.js"
import { useAccessControl } from "../composables/auth/useAccessControl.js"
import { useGeofences } from "../composables/activos/geocercas/useGeofences.js"
import { useAuthSession } from "../composables/auth/useAuthSession.js"
import { useMockDatabase } from "../composables/mock/useMockDatabase.js"
import { useDebouncedValue } from "../composables/ui/useDebouncedValue.js"
import { useAlarmsService } from "../services/alarms/useAlarmsService.js"
import {
  buildAlarmSummary,
  filterAlarmRows,
  getAuthorizedAlarmRows,
  sortAlarmRows,
} from "../utils/alarms/alarmUtils.js"
import { normalizeId } from "../utils/idUtils.js"

const route = useRoute()
const router = useRouter()

const currentCompanyId = computed(() => {
  return normalizeId(route.params.empresaId || "")
})

const { currentUser } = useAuthSession()
const { alarms, resolveAlarm, reopenAlarm } = useAlarmsService()

const { accessibleCompanies, visibleAssets, canAccessFunction } = useAccessControl()
const { assetTags } = useMockDatabase()
const { geofences, geofenceGroups } = useGeofences({
  companyId: currentCompanyId,
})

const { recordAudit } = useAuditTrail({
  companyId: currentCompanyId,
})

const searchTerm = ref("")
const selectedStatus = ref("all")
const selectedCompanyId = ref("all")
const selectedDateRange = ref("all")
const selectedAlarmId = ref("")
const feedbackMessage = ref("")

const activeAlarmPanel = ref("config")
const configPanelRef = ref(null)

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
  return sortAlarmRows(filteredRows.value)
})

const summary = computed(() => {
  return buildAlarmSummary(authorizedRows.value)
})

const summaryItems = computed(() => {
  return [
    {
      key: "all",
      status: "all",
      label: "Todas",
      value: summary.value.total,
    },
    {
      key: "active",
      status: "active",
      label: "Activas",
      value: summary.value.active,
      tone: "danger",
    },
    {
      key: "resolved",
      status: "resolved",
      label: "Resueltas",
      value: summary.value.resolved,
      tone: "success",
    },
  ]
})

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
  selectedAlarmId.value = alarmId
}

const clearSelectedAlarm = () => {
  selectedAlarmId.value = ""
}

const clearFilters = () => {
  searchTerm.value = ""
  selectedStatus.value = "all"
  selectedCompanyId.value = "all"
  selectedDateRange.value = "all"
}

const openNewAutomaticAlert = () => {
  activeAlarmPanel.value = "config"
  configPanelRef.value?.startNewRule()
}

const handleSummaryFilter = (item = {}) => {
  selectedStatus.value = item.status || "all"
}

const handleResolveAlarm = (alarmId) => {
  if (!canManageAlarms.value) {
    return
  }

  const alarmBeforeUpdate = visibleRows.value.find((alarm) => {
    return alarm.id === alarmId
  })

  const updatedAlarm = resolveAlarm(alarmId, currentActorName.value)

  if (!updatedAlarm || !alarmBeforeUpdate) {
    return
  }

  recordAlarmAudit({
    alarm: alarmBeforeUpdate,
    action: "alarm:resolve",
    description: "Se resolvio una alerta operativa.",
  })

  showFeedback("Alerta resuelta.")
}

const handleReopenAlarm = (alarmId) => {
  if (!canManageAlarms.value) {
    return
  }

  const alarmBeforeUpdate = visibleRows.value.find((alarm) => {
    return alarm.id === alarmId
  })

  const updatedAlarm = reopenAlarm(alarmId)

  if (!updatedAlarm || !alarmBeforeUpdate) {
    return
  }

  recordAlarmAudit({
    alarm: alarmBeforeUpdate,
    action: "alarm:reopen",
    description: "Se reabrio una alerta operativa.",
    severity: "warning",
  })

  showFeedback("Alerta reabierta.")
}

const getAlarmDateInput = (alarm) => {
  const date = new Date(alarm?.createdAt || alarm?.triggeredAt || "")

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  return toDateInput(date)
}

const viewAlarmOnItinerary = async (alarm) => {
  if (!alarm?.companyId || !alarm?.assetId) {
    return
  }

  const alarmDate = getAlarmDateInput(alarm)

  await router.push({
    name: "AppActivos",
    params: {
      empresaId: alarm.companyId,
    },
    query: {
      section: "itinerarios",
      activoId: alarm.assetId,
      from: "alertas",
      alarmId: alarm.id,
      ...(alarmDate
        ? {
            date: alarmDate,
          }
        : {}),
    },
  })
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

    selectedAlarmId.value = rows[0]?.id || ""
  },
  {
    immediate: true,
  },
)
</script>

<style scoped>
.alarm-panel-tab {
  display: inline-flex;
  height: 2.75rem;
  min-width: 13.25rem;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  border-radius: 0.5rem;
  border: 1px solid #d8e0eb;
  background: #ffffff;
  padding: 0 1.125rem;
  font-size: 0.75rem;
  font-weight: 900;
  color: #102372;
  box-shadow: 0 1px 3px rgb(15 35 70 / 0.08);
  transition:
    border-color 0.16s ease,
    background-color 0.16s ease,
    color 0.16s ease,
    box-shadow 0.16s ease;
}

.alarm-panel-tab:hover {
  border-color: #9eb3d1;
  background: #f8fbff;
}

.alarm-panel-tab.is-active {
  border-color: #102372;
  background: #102372;
  color: #ffffff;
  box-shadow: 0 8px 18px rgb(16 35 114 / 0.16);
}
</style>
