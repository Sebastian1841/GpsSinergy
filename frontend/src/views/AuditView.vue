<template>
  <section class="flex h-full min-h-0 flex-col bg-[#f7f9fc] text-slate-900 antialiased">
    <main class="flex h-full min-h-0 flex-col gap-4 p-4 sm:p-5">
      <!-- CABECERA + CONTROLES -->
      <div class="grid shrink-0 gap-4 xl:grid-cols-[minmax(300px,1fr)_auto] xl:items-end">
        <AuditSummaryHeader
          :active-metric-key="activeSummaryMetricKey"
          :current-company="currentCompany"
          :get-metric-dot-class="getMetricDotClass"
          :summary-metrics="summaryMetrics"
          @select-metric="selectSummaryMetric"
        />

        <AuditFilters
          :can-export="canExportAudit"
          :action-options="actionOptions"
          :get-action-label="getActionLabel"
          :get-module-label="getModuleLabel"
          :get-status-label="getStatusLabel"
          :has-active-filters="hasActiveFilters"
          :has-records="filteredRecords.length > 0"
          :end-date="selectedEndDate"
          :module-options="moduleOptions"
          :search-term="searchTerm"
          :selected-action="selectedAction"
          :selected-module="selectedModule"
          :selected-status="selectedStatus"
          :start-date="selectedStartDate"
          :status-options="statusOptions"
          @clear-filters="clearFilters"
          @export="exportAuditCsv"
          @update:end-date="selectedEndDate = $event"
          @update:search-term="searchTerm = $event"
          @update:selected-action="selectedAction = $event"
          @update:selected-module="selectedModule = $event"
          @update:selected-status="updateSelectedStatus"
          @update:start-date="selectedStartDate = $event"
        />
      </div>

      <!-- CONTENEDOR PRINCIPAL -->
      <section
        class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#d8dee8] bg-white shadow-sm"
      >
        <!-- CATEGORÍAS -->
        <div class="shrink-0 border-b border-[#e6ebf2] bg-white px-3 py-3">
          <div class="flex min-w-0 gap-2 overflow-x-auto">
            <button
              v-for="category in categoryOptions"
              :key="category.key"
              type="button"
              class="flex h-11 min-w-[138px] flex-1 items-center justify-between gap-3 whitespace-nowrap rounded-lg border px-3 transition"
              :class="
                selectedCategory === category.key
                  ? 'border-[#102372] bg-[#f7f9ff] text-[#102372] shadow-sm'
                  : 'border-[#e1e6ee] bg-white text-slate-600 hover:border-[#c4ccd8] hover:bg-[#fafbfc]'
              "
              @click="selectCategory(category.key)"
            >
              <span class="flex min-w-0 items-center gap-2">
                <span
                  class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                  :class="getCategoryIconClass(category.key)"
                >
                  <!-- TODOS -->
                  <svg
                    v-if="category.key === 'all'"
                    class="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 5h14v14H5zM8 2v6M16 2v6M8 12h8M8 16h5"
                    />
                  </svg>

                  <!-- ALERTAS -->
                  <svg
                    v-else-if="category.key === 'alerts'"
                    class="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 9v4m0 4h.01M10.3 3.9L2.6 17.2A2 2 0 004.3 20h15.4a2 2 0 001.7-2.8L13.7 3.9a2 2 0 00-3.4 0z"
                    />
                  </svg>

                  <!-- FALLIDOS -->
                  <svg
                    v-else-if="category.key === 'failed'"
                    class="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 9l-6 6m0-6l6 6M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>

                  <!-- ACCESOS -->
                  <svg
                    v-else-if="category.key === 'access'"
                    class="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 10V7a6 6 0 0112 0v3m-14 0h16v10H4V10z"
                    />
                  </svg>

                  <!-- ETIQUETAS -->
                  <svg
                    v-else-if="category.key === 'tags'"
                    class="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M20 13l-7 7-9-9V4h7l9 9zM8 8h.01"
                    />
                  </svg>

                  <!-- USUARIOS -->
                  <svg
                    v-else
                    class="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2m7-10a4 4 0 100-8 4 4 0 000 8zm11 10v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
                    />
                  </svg>
                </span>

                <span class="truncate text-[11px] font-black">
                  {{ category.label }}
                </span>
              </span>

              <span
                class="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black"
                :class="
                  selectedCategory === category.key
                    ? 'bg-[#e8edff] text-[#102372]'
                    : 'bg-[#f1f4f8] text-slate-500'
                "
              >
                {{ category.value }}
              </span>
            </button>
          </div>
        </div>

        <!-- LISTADO + DETALLE -->
        <div
          class="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_400px] 2xl:grid-cols-[minmax(0,1fr)_430px]"
        >
          <!-- HISTORIAL -->
          <div class="flex min-h-0 min-w-0 border-[#e6ebf2] xl:border-r">
            <AuditActivityTable
              :filtered-count="filteredRecords.length"
              :format-time="formatTime"
              :get-action-label="getActionLabel"
              :get-module-label="getModuleLabel"
              :get-record-company-name="getRecordCompanyName"
              :get-status-class="getStatusClass"
              :get-status-dot-class="getStatusDotClass"
              :get-status-label="getStatusLabel"
              :grouped-records="visibleGroupedRecords"
              :has-active-filters="hasActiveFilters"
              :page="currentPage"
              :page-count="auditPageCount"
              :page-end="auditPageEnd"
              :page-start="auditPageStart"
              :selected-record-id="selectedRecordId"
              :status-options="statusOptions"
              @clear-filters="clearFilters"
              @next-page="goToNextAuditPage"
              @previous-page="goToPreviousAuditPage"
              @select-record="selectRecord"
            />
          </div>

          <!-- PANEL DERECHO -->
          <aside
            class="flex min-h-0 min-w-0 flex-col border-t border-[#e6ebf2] bg-white xl:border-t-0"
          >
            <AuditDetailModal
              v-if="showDetailModal && selectedRecord"
              :detail-sections="selectedRecordDetailSections"
              :format-date-time="formatDateTime"
              :get-action-label="getActionLabel"
              :get-module-label="getModuleLabel"
              :get-record-company-name="getRecordCompanyName"
              :get-severity-label="getSeverityLabel"
              :get-status-class="getStatusClass"
              :get-status-dot-class="getStatusDotClass"
              :get-status-label="getStatusLabel"
              :record="selectedRecord"
              :show="showDetailModal"
              @close="closeAuditDetailModal"
            />

            <div
              v-else
              class="flex min-h-[300px] flex-1 flex-col items-center justify-center px-8 py-10 text-center"
            >
              <div
                class="flex h-10 w-10 items-center justify-center rounded-full bg-[#f1f4f8] text-[14px] font-black text-[#102372]"
              >
                i
              </div>

              <h3 class="mt-3 text-[13px] font-black text-[#102372]">Detalle del evento</h3>

              <p class="mt-1 max-w-[240px] text-[10px] font-semibold leading-5 text-slate-500">
                Selecciona un evento para revisar toda la información del registro.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  </section>
</template>

<script setup>
import { computed, defineAsyncComponent, onMounted, ref, watch } from "vue"
import { useRoute } from "vue-router"

import AuditActivityTable from "../components/audit/AuditActivityTable.vue"
import AuditFilters from "../components/audit/AuditFilters.vue"
import AuditSummaryHeader from "../components/audit/AuditSummaryHeader.vue"
import { useAccessControl } from "../composables/auth/useAccessControl.js"
import { useDebouncedValue } from "../composables/ui/useDebouncedValue.js"
import { preloadWhenIdle } from "../composables/ui/useIdlePreload.js"
import { useAccessService } from "../services/access/useAccessService.js"
import { useAuditService } from "../services/audit/useAuditService.js"

const loadAuditDetailModal = () => import("../components/audit/AuditDetailModal.vue")

const AuditDetailModal = defineAsyncComponent(loadAuditDetailModal)

const route = useRoute()
const { canAccessFunction } = useAccessControl()
const { companies } = useAccessService()
const { auditRecords } = useAuditService()

const searchTerm = ref("")
const selectedAction = ref("")
const selectedModule = ref("")
const selectedStatus = ref("")
const selectedSeverity = ref("")
const selectedCategory = ref("all")
const selectedStartDate = ref("")
const selectedEndDate = ref("")
const selectedRecordId = ref("")
const showDetailModal = ref(false)
const currentPage = ref(1)

const debouncedSearchTerm = useDebouncedValue(searchTerm, 180)

const AUDIT_PAGE_SIZE = 150

const moduleLabels = {
  activos: "Activos",
  auth: "Sesion",
  empresas: "Empresas",
  geocercas: "Geocercas",
  reportes: "Reportes",
  sistema: "Sistema",
  usuarios: "Usuarios",
}

const actionLabels = {
  "asset:create": "Activo creado",
  "asset:delete": "Activo eliminado",
  "asset:update": "Activo actualizado",
  "auth:login": "Inicio de sesion",
  "auth:logout": "Cierre de sesion",
  "auth:impersonation:start": "Inicio de suplantacion",
  "auth:impersonation:stop": "Fin de suplantacion",
  "branch:create": "Sucursal creada",
  "branch:delete": "Sucursal eliminada",
  "branch:rename": "Sucursal renombrada",
  "branch:status": "Estado de sucursal actualizado",
  "branch:toggle": "Sucursales actualizadas",
  "company:create": "Empresa creada",
  "company:status": "Estado de empresa actualizado",
  "company:update": "Empresa actualizada",
  "event-rule:create": "Regla de evento creada",
  "event-rule:delete": "Regla de evento eliminada",
  "event-rule:update": "Regla de evento actualizada",
  "geofence:create": "Geocerca creada",
  "geofence:delete": "Geocerca eliminada",
  "geofence:export": "Geocercas exportadas",
  "geofence-group:create": "Grupo de geocercas creado",
  "geofence-group:delete": "Grupo de geocercas eliminado",
  "geofence-group:rename": "Grupo de geocercas renombrado",
  "geofence:import": "Geocercas importadas",
  "geofence:update": "Geocerca actualizada",
  "permissions:update": "Permisos actualizados",
  "report:export:excel": "Reporte exportado a Excel",
  "report:export:pdf": "Reporte exportado a PDF",
  "report:generate": "Reporte generado",
  "report:schedule:create": "Programacion creada",
  "report:schedule:delete": "Programacion eliminada",
  "report:schedule:toggle": "Programacion actualizada",
  "report:schedule:update": "Programacion modificada",
  "report:template:create": "Plantilla creada",
  "report:template:delete": "Plantilla eliminada",
  "report:template:update": "Plantilla actualizada",
  "user:access:create": "Acceso creado",
  "user:access:delete": "Acceso eliminado",
  "user:access:update": "Acceso actualizado",
  "user:create": "Usuario creado",
  "user:status": "Estado de usuario actualizado",
  "user:update": "Usuario actualizado",
  "workspace:create": "Espacio creado",
  "workspace:delete": "Espacio eliminado",
  "workspace:rename": "Espacio renombrado",
  "workspace:share": "Espacio compartido",
  "workspace:update": "Espacio actualizado",
}

const statusLabels = {
  failed: "Fallido",
  pending: "Pendiente",
  success: "Correcto",
}

const severityLabels = {
  info: "Informativo",
  warning: "Atencion",
}

const currentCompanyId = computed(() => String(route.params.empresaId || ""))

const companiesById = computed(() => {
  return new Map(companies.value.map((company) => [String(company.id), company]))
})

const currentCompany = computed(() => {
  return companiesById.value.get(currentCompanyId.value) || null
})

const visibleRecords = computed(() => {
  if (!currentCompanyId.value) return auditRecords.value

  return auditRecords.value.filter((record) => {
    return !record.companyId || String(record.companyId) === currentCompanyId.value
  })
})

const moduleOptions = computed(() => {
  return [
    ...new Set(
      visibleRecords.value
        .map((record) => record.module)
        .filter(Boolean)
        .sort(),
    ),
  ]
})

const statusOptions = computed(() => {
  return [
    ...new Set(
      visibleRecords.value
        .map((record) => record.status)
        .filter(Boolean)
        .sort(),
    ),
  ]
})

const actionOptions = computed(() => {
  return [
    ...new Set(
      visibleRecords.value
        .map((record) => record.action)
        .filter(Boolean)
        .sort(),
    ),
  ]
})

const categoryOptions = computed(() => {
  const records = visibleRecords.value

  return [
    {
      key: "all",
      label: "Todos",
      value: records.length,
    },
    {
      key: "alerts",
      label: "Acciones sensibles",
      value: records.filter((record) => record.severity === "warning").length,
    },
    {
      key: "failed",
      label: "Fallidos",
      value: records.filter((record) => record.status === "failed").length,
    },
    {
      key: "access",
      label: "Cambios de acceso",
      value: records.filter((record) => recordMatchesCategory(record, "access")).length,
    },
    {
      key: "tags",
      label: "Etiquetas",
      value: records.filter((record) => recordMatchesCategory(record, "tags")).length,
    },
    {
      key: "users",
      label: "Usuarios",
      value: records.filter((record) => recordMatchesCategory(record, "users")).length,
    },
  ]
})

const hasActiveFilters = computed(() => {
  return Boolean(
    searchTerm.value ||
    selectedAction.value ||
    selectedModule.value ||
    selectedStatus.value ||
    selectedSeverity.value ||
    selectedCategory.value !== "all" ||
    selectedStartDate.value ||
    selectedEndDate.value,
  )
})

const activeSummaryMetricKey = computed(() => {
  if (selectedCategory.value !== "all") return ""
  if (selectedSeverity.value === "warning") return "warning"
  if (selectedStatus.value === "success") return "success"
  if (selectedStatus.value === "failed") return "failed"
  if (!selectedStatus.value && !selectedSeverity.value) return "all"

  return ""
})

const filteredRecords = computed(() => {
  const query = debouncedSearchTerm.value.trim().toLowerCase()
  const startTime = parseDateInputTime(selectedStartDate.value)
  const endTime = parseDateInputTime(selectedEndDate.value, {
    endOfDay: true,
  })

  return visibleRecords.value.filter((record) => {
    if (!recordMatchesCategory(record, selectedCategory.value)) return false
    if (selectedAction.value && record.action !== selectedAction.value) return false
    if (selectedModule.value && record.module !== selectedModule.value) return false
    if (selectedStatus.value && record.status !== selectedStatus.value) return false
    if (selectedSeverity.value && record.severity !== selectedSeverity.value) return false

    if (startTime !== null || endTime !== null) {
      const recordTime = new Date(record.timestamp).getTime()

      if (Number.isNaN(recordTime)) return false
      if (startTime !== null && recordTime < startTime) return false
      if (endTime !== null && recordTime > endTime) return false
    }

    if (!query) return true

    return [
      record.actorName,
      record.action,
      getRecordCompanyName(record),
      record.description,
      record.entityName,
      record.entityType,
      record.module,
      record.status,
      ...getAuditRecordDateSearchValues(record),
    ].some((value) => {
      return String(value || "")
        .toLowerCase()
        .includes(query)
    })
  })
})

const auditPageCount = computed(() => {
  return Math.max(1, Math.ceil(filteredRecords.value.length / AUDIT_PAGE_SIZE))
})

const auditPageStart = computed(() => {
  if (!filteredRecords.value.length) return 0

  return (currentPage.value - 1) * AUDIT_PAGE_SIZE + 1
})

const auditPageEnd = computed(() => {
  return Math.min(currentPage.value * AUDIT_PAGE_SIZE, filteredRecords.value.length)
})

const visibleFilteredRecords = computed(() => {
  return filteredRecords.value.slice(auditPageStart.value - 1, auditPageEnd.value)
})

const visibleGroupedRecords = computed(() => {
  return groupAuditRecordsByDate(visibleFilteredRecords.value)
})

const selectedRecord = computed(() => {
  return (
    filteredRecords.value.find((record) => {
      return String(record.id) === String(selectedRecordId.value)
    }) || null
  )
})

const selectedRecordDetailSections = computed(() => {
  const record = selectedRecord.value

  if (!record) return []

  return [
    {
      title: "Responsable",
      details: [
        {
          label: "Usuario",
          value: record.actorName,
        },
        {
          label: "Empresa",
          value: getRecordCompanyName(record),
        },
      ],
    },
    {
      title: "Registro",
      details: [
        {
          label: "Tipo",
          value: record.entityType,
        },
        {
          label: "ID",
          value: record.id,
        },
      ],
    },
  ]
})

const summaryMetrics = computed(() => {
  const records = visibleRecords.value
  const successCount = records.filter((record) => record.status === "success").length
  const warningCount = records.filter((record) => record.severity === "warning").length
  const failedCount = records.filter((record) => record.status === "failed").length

  return [
    {
      key: "all",
      label: "Total",
      value: records.length,
    },
    {
      key: "success",
      label: "Correctos",
      value: successCount,
    },
    {
      key: "warning",
      label: "Acciones sensibles",
      value: warningCount,
    },
    {
      key: "failed",
      label: "Fallidos",
      value: failedCount,
    },
  ]
})

const canExportAudit = computed(() => {
  return canAccessFunction("audit-export", currentCompanyId.value || null, "view")
})

const clearFilters = () => {
  searchTerm.value = ""
  selectedAction.value = ""
  selectedModule.value = ""
  selectedStatus.value = ""
  selectedSeverity.value = ""
  selectedCategory.value = "all"
  selectedStartDate.value = ""
  selectedEndDate.value = ""
  currentPage.value = 1
}

const updateSelectedStatus = (status) => {
  selectedStatus.value = status
  selectedSeverity.value = ""
  currentPage.value = 1
}

const selectCategory = (categoryKey) => {
  selectedCategory.value = categoryKey
  selectedRecordId.value = ""
  showDetailModal.value = false
  currentPage.value = 1
}

const selectSummaryMetric = (metricKey) => {
  currentPage.value = 1
  selectedCategory.value = "all"

  if (metricKey === "success") {
    selectedStatus.value = selectedStatus.value === "success" ? "" : "success"
    selectedSeverity.value = ""
    return
  }

  if (metricKey === "failed") {
    selectedStatus.value = selectedStatus.value === "failed" ? "" : "failed"
    selectedSeverity.value = ""
    return
  }

  if (metricKey === "warning") {
    selectedSeverity.value = selectedSeverity.value === "warning" ? "" : "warning"
    selectedStatus.value = ""
    return
  }

  selectedStatus.value = ""
  selectedSeverity.value = ""
}

const goToPreviousAuditPage = () => {
  currentPage.value = Math.max(1, currentPage.value - 1)
}

const goToNextAuditPage = () => {
  currentPage.value = Math.min(auditPageCount.value, currentPage.value + 1)
}

const getModuleLabel = (module) => {
  return moduleLabels[module] || module || "Sin modulo"
}

const getActionLabel = (action) => {
  return actionLabels[action] || action || "Accion sin nombre"
}

const getStatusLabel = (status) => {
  return statusLabels[status] || status || "Sin estado"
}

const getSeverityLabel = (severity) => {
  return severityLabels[severity] || severity || "Sin dato"
}

const getRecordCompanyName = (record) => {
  if (record.companyId) {
    return companiesById.value.get(String(record.companyId))?.name || record.companyName
  }

  return record.companyName
}

const getMetricDotClass = (label) => {
  if (label === "Correctos") return "bg-emerald-500"
  if (label === "Acciones sensibles") return "bg-amber-500"
  if (label === "Fallidos") return "bg-rose-500"

  return "bg-slate-400"
}

const getStatusClass = (status) => {
  if (status === "failed") return "bg-rose-50 text-rose-700"
  if (status === "pending") return "bg-amber-50 text-amber-700"

  return "bg-emerald-50 text-emerald-700"
}

const getStatusDotClass = (status) => {
  if (status === "failed") return "bg-rose-500"
  if (status === "pending") return "bg-amber-500"

  return "bg-emerald-500"
}

const getCategoryIconClass = (categoryKey) => {
  if (categoryKey === "alerts") return "bg-orange-50 text-[#ff6600]"
  if (categoryKey === "failed") return "bg-rose-50 text-rose-500"
  if (categoryKey === "access") return "bg-slate-100 text-slate-500"
  if (categoryKey === "tags") return "bg-violet-50 text-violet-500"
  if (categoryKey === "users") return "bg-sky-50 text-sky-500"

  return "bg-[#eef1ff] text-[#102372]"
}

const selectRecord = (recordId) => {
  selectedRecordId.value = recordId
  showDetailModal.value = true
}

const closeAuditDetailModal = () => {
  showDetailModal.value = false
  selectedRecordId.value = ""
}

function recordMatchesCategory(record, categoryKey) {
  if (!categoryKey || categoryKey === "all") return true

  const action = String(record?.action || "").toLowerCase()
  const module = String(record?.module || "").toLowerCase()
  const entityType = String(record?.entityType || "").toLowerCase()
  const entityName = String(record?.entityName || "").toLowerCase()
  const description = String(record?.description || "").toLowerCase()

  if (categoryKey === "alerts") {
    return record?.severity === "warning"
  }

  if (categoryKey === "failed") {
    return record?.status === "failed"
  }

  if (categoryKey === "access") {
    return (
      action.startsWith("user:access") ||
      action === "permissions:update" ||
      action.includes("access") ||
      action.includes("permission") ||
      action.includes("impersonation")
    )
  }

  if (categoryKey === "tags") {
    return (
      action.includes("tag") ||
      entityType.includes("tag") ||
      entityType.includes("etiqueta") ||
      entityName.includes("etiqueta") ||
      description.includes("etiqueta")
    )
  }

  if (categoryKey === "users") {
    return module === "usuarios" || action.startsWith("user:")
  }

  return true
}

function groupAuditRecordsByDate(records = []) {
  const groupsByDate = new Map()

  records.forEach((record) => {
    const dateKey = getDateKey(record.timestamp)
    const currentGroup = groupsByDate.get(dateKey) || {
      dateKey,
      label: formatDateGroup(record.timestamp),
      records: [],
    }

    currentGroup.records.push(record)
    groupsByDate.set(dateKey, currentGroup)
  })

  return Array.from(groupsByDate.values())
}

function formatDateTime(value) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return "-"

  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date)
}

function formatTime(value) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return "-"

  return new Intl.DateTimeFormat("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function formatDateGroup(value) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return "Sin fecha"

  return new Intl.DateTimeFormat("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date)
}

function getDateKey(value) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return "invalid"

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function getAuditRecordDateSearchValues(record) {
  const date = new Date(record.timestamp)

  if (Number.isNaN(date.getTime())) return []

  const year = date.getFullYear()
  const shortYear = String(year).slice(-2)
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return [
    getDateKey(record.timestamp),
    `${day}/${month}/${year}`,
    `${day}-${month}-${year}`,
    `${day}/${month}/${shortYear}`,
    `${day}-${month}-${shortYear}`,
    formatDateGroup(record.timestamp),
    formatDateTime(record.timestamp),
    formatTime(record.timestamp),
  ]
}

function parseDateInputTime(value, { endOfDay = false } = {}) {
  if (!value) return null

  const [year, month, day] = String(value).split("-").map(Number)

  if (!year || !month || !day) return null

  const date = new Date(
    year,
    month - 1,
    day,
    endOfDay ? 23 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 999 : 0,
  )

  return Number.isNaN(date.getTime()) ? null : date.getTime()
}

const escapeCsvValue = (value) => {
  return `"${String(value ?? "").replace(/"/g, '""')}"`
}

const exportAuditCsv = () => {
  if (!canExportAudit.value || !filteredRecords.value.length || typeof window === "undefined") {
    return
  }

  const header = ["Fecha", "Usuario", "Empresa", "Modulo", "Accion", "Entidad", "Estado", "Detalle"]

  const rows = filteredRecords.value.map((record) => [
    formatDateTime(record.timestamp),
    record.actorName,
    getRecordCompanyName(record),
    getModuleLabel(record.module),
    getActionLabel(record.action),
    record.entityName,
    getStatusLabel(record.status),
    record.description,
  ])

  const csvContent = [header, ...rows].map((row) => row.map(escapeCsvValue).join(";")).join("\n")

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8",
  })

  const url = window.URL.createObjectURL(blob)
  const link = document.createElement("a")

  link.href = url
  link.download = "auditoria-sinergy.csv"
  link.click()

  window.URL.revokeObjectURL(url)
}

watch(
  [
    debouncedSearchTerm,
    selectedAction,
    selectedModule,
    selectedStatus,
    selectedSeverity,
    selectedCategory,
    selectedStartDate,
    selectedEndDate,
  ],
  () => {
    currentPage.value = 1
  },
)

watch(auditPageCount, (pageCount) => {
  if (currentPage.value > pageCount) {
    currentPage.value = pageCount
  }
})

watch(filteredRecords, (records) => {
  if (
    selectedRecordId.value &&
    !records.some((record) => String(record.id) === String(selectedRecordId.value))
  ) {
    selectedRecordId.value = ""
    showDetailModal.value = false
  }
})

onMounted(() => {
  preloadWhenIdle([loadAuditDetailModal])
})
</script>
