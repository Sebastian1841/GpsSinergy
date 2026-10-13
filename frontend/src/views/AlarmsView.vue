<template>
  <section class="h-full min-h-0 bg-[#f4f7fb] text-slate-900">
    <div class="grid h-full min-h-0 grid-rows-[auto_1fr]">
      <header class="shrink-0 px-4 pb-3 pt-3 xl:px-5">
        <div class="flex flex-wrap items-end gap-1 border-b border-[#d8e0eb]">
          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="alarm-panel-tab"
              :class="activeAlarmPanel === 'config' ? 'is-active' : ''"
              @click="activeAlarmPanel = 'config'"
            >
              Configuracion de alertas
            </button>

            <button
              type="button"
              class="alarm-panel-tab"
              :class="activeAlarmPanel === 'history' ? 'is-active' : ''"
              @click="activeAlarmPanel = 'history'"
            >
              Historial de alertas
            </button>
          </div>
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
import { useAuditTrail } from "../composables/audit/useAuditTrail.js"
import { useAccessControl } from "../composables/auth/useAccessControl.js"
import { useGeofences } from "../composables/activos/geocercas/useGeofences.js"
import { useAuthSession } from "../composables/auth/useAuthSession.js"
import { useMockDatabase } from "../composables/mock/useMockDatabase.js"
import { useDebouncedValue } from "../composables/ui/useDebouncedValue.js"
import { useAlarmsService } from "../services/alarms/useAlarmsService.js"
import {
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
  position: relative;
  display: inline-flex;
  height: 3.25rem;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  padding: 0 1.25rem;
  font-size: 0.8125rem;
  font-weight: 900;
  color: #64748b;
  cursor: pointer;
  transition: color 0.15s ease;
}

.alarm-panel-tab:hover {
  color: #102372;
}

.alarm-panel-tab.is-active {
  color: #102372;
}

.alarm-panel-tab.is-active::after {
  position: absolute;
  right: 0;
  bottom: -1px;
  left: 0;
  height: 2px;
  background: #ff6600;
  content: "";
}
</style>
