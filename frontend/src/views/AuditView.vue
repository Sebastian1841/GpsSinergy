<template>
  <section class="flex h-full min-h-0 flex-col bg-slate-50 text-slate-900 antialiased">
    <main class="flex h-full min-h-0 flex-col gap-3 p-4 sm:p-5">
      <AuditSummaryHeader
        :current-company="currentCompany"
        :get-metric-dot-class="getMetricDotClass"
        :summary-metrics="summaryMetrics"
      />

      <AuditFilters
        :can-export="canExportAudit"
        :get-module-label="getModuleLabel"
        :get-status-label="getStatusLabel"
        :has-active-filters="hasActiveFilters"
        :has-records="filteredRecords.length > 0"
        :module-options="moduleOptions"
        :search-term="searchTerm"
        :selected-module="selectedModule"
        :selected-status="selectedStatus"
        :status-options="statusOptions"
        @clear-filters="clearFilters"
        @export="exportAuditCsv"
        @update:search-term="searchTerm = $event"
        @update:selected-module="selectedModule = $event"
        @update:selected-status="selectedStatus = $event"
      />

      <AuditActivityTable
        :filtered-count="filteredRecords.length"
        :format-time="formatTime"
        :get-action-label="getActionLabel"
        :get-module-label="getModuleLabel"
        :get-record-company-name="getRecordCompanyName"
        :get-status-class="getStatusClass"
        :get-status-dot-class="getStatusDotClass"
        :get-status-label="getStatusLabel"
        :grouped-records="groupedRecords"
        :has-active-filters="hasActiveFilters"
        :selected-record-id="selectedRecordId"
        :status-options="statusOptions"
        @clear-filters="clearFilters"
        @select-record="selectRecord"
      />
    </main>

    <AuditDetailModal
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
  </section>
</template>

<script setup>
import { computed, ref } from "vue"
import { useRoute } from "vue-router"

import AuditActivityTable from "../components/audit/AuditActivityTable.vue"
import AuditDetailModal from "../components/audit/AuditDetailModal.vue"
import AuditFilters from "../components/audit/AuditFilters.vue"
import AuditSummaryHeader from "../components/audit/AuditSummaryHeader.vue"
import { useAccessControl } from "../composables/auth/useAccessControl.js"
import { useAccessService } from "../services/access/useAccessService.js"
import { useAuditService } from "../services/audit/useAuditService.js"

const route = useRoute()
const { canAccessFunction } = useAccessControl()
const { companies } = useAccessService()
const { auditRecords } = useAuditService()

const searchTerm = ref("")
const selectedModule = ref("")
const selectedStatus = ref("")
const selectedRecordId = ref("")
const showDetailModal = ref(false)

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

const hasActiveFilters = computed(() => {
  return Boolean(searchTerm.value || selectedModule.value || selectedStatus.value)
})

const filteredRecords = computed(() => {
  const query = searchTerm.value.trim().toLowerCase()

  return visibleRecords.value.filter((record) => {
    if (selectedModule.value && record.module !== selectedModule.value) return false
    if (selectedStatus.value && record.status !== selectedStatus.value) return false

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
    ].some((value) => {
      return String(value || "")
        .toLowerCase()
        .includes(query)
    })
  })
})

const groupedRecords = computed(() => {
  const groupsByDate = new Map()

  filteredRecords.value.forEach((record) => {
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
})

const selectedRecord = computed(() => {
  return filteredRecords.value.find((record) => record.id === selectedRecordId.value) || null
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
      label: "Total",
      value: records.length,
    },
    {
      label: "Correctos",
      value: successCount,
    },
    {
      label: "Alertas",
      value: warningCount,
    },
    {
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
  selectedModule.value = ""
  selectedStatus.value = ""
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
  if (label === "Alertas") return "bg-amber-500"
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

const selectRecord = (recordId) => {
  selectedRecordId.value = recordId
  showDetailModal.value = true
}

const closeAuditDetailModal = () => {
  showDetailModal.value = false
}

const formatDateTime = (value) => {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return "-"

  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date)
}

const formatTime = (value) => {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return "-"

  return new Intl.DateTimeFormat("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

const formatDateGroup = (value) => {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return "Sin fecha"

  return new Intl.DateTimeFormat("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date)
}

const getDateKey = (value) => {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return "invalid"

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
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
</script>
