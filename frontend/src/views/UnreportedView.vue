<template>
  <section class="h-full min-h-0 overflow-auto bg-[#f5f8fc] p-4 sm:p-5 lg:overflow-hidden lg:p-6">
    <div class="flex min-h-full flex-col lg:h-full lg:min-h-0">
      <nav
        class="mb-3 flex shrink-0 items-end gap-1 border-b border-[#d8e0eb]"
        aria-label="Vistas de Sin reportar"
      >
        <button
          type="button"
          class="unreported-tab"
          :class="{ 'is-active': activeView === 'list' }"
          @click="activeView = 'list'"
        >
          Equipos sin reporte
        </button>
        <button
          type="button"
          class="unreported-tab"
          :class="{ 'is-active': activeView === 'charts' }"
          @click="activeView = 'charts'"
        >
          Graficos
        </button>
      </nav>

      <div class="grid min-h-0 flex-1 gap-4 lg:grid-cols-[315px_minmax(0,1fr)]">
        <aside
          class="unreported-filters min-h-0 rounded-lg border border-[#dbe3ee] bg-white shadow-sm"
        >
          <div class="flex items-center justify-between border-b border-[#e5eaf1] px-4 py-3">
            <h2 class="flex items-center gap-2 text-[16px] font-black text-[#102372]">
              <svg
                class="h-5 w-5 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M3 4h18l-7 8v6l-4 2v-8L3 4z" />
              </svg>
              Filtros
            </h2>
            <button type="button" class="module-button h-9 px-3" @click="clearFilters">
              Limpiar filtros
            </button>
          </div>
          <div class="unreported-filter-fields">
            <label class="filter-field"
              ><span>Buscar</span
              ><span class="relative">
                <SvgIcon
                  name="search"
                  class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                />
                <input
                  v-model="searchTerm"
                  class="filter-search"
                  type="search"
                  placeholder="Equipo, patente o IMEI"
                /> </span
            ></label>
            <label class="filter-field"
              ><span>Empresa</span
              ><select v-model="selectedCompany">
                <option value="all">Todas las empresas</option>
                <option v-for="company in companyOptions" :key="company" :value="company">
                  {{ company }}
                </option>
              </select></label
            >
            <fieldset
              v-if="equipmentSection === 'active' || activeView === 'charts'"
              class="filter-field"
            >
              <legend>Estado</legend>
              <div class="filter-status-grid">
                <button
                  v-for="option in statusOptions"
                  :key="option.key"
                  type="button"
                  class="status-filter"
                  :class="{ 'status-filter--active': activeStatus === option.key }"
                  @click="activeStatus = option.key"
                >
                  <span class="h-2 w-2 rounded-full" :class="option.dot" />{{ option.label }}
                </button>
              </div>
            </fieldset>
            <label
              v-if="equipmentSection === 'active' || activeView === 'charts'"
              class="filter-field"
              ><span>Tiempo sin reportar</span
              ><select v-model="selectedSilence">
                <option value="all">Cualquier tiempo</option>
                <option value="6h">Mas de 6 horas</option>
                <option value="24h">Mas de 24 horas</option>
              </select></label
            >
            <fieldset class="filter-field">
              <legend>
                {{
                  equipmentSection === "recovered" && activeView !== "charts"
                    ? "Fecha de recuperacion"
                    : "Fecha ultimo reporte"
                }}
              </legend>
              <div class="grid grid-cols-2 gap-2">
                <label class="filter-date-label"
                  >Desde<input v-model="startDate" type="date"
                /></label>
                <label class="filter-date-label"
                  >Hasta<input v-model="endDate" type="date"
                /></label>
              </div>
            </fieldset>
            <div class="filter-settings-grid">
              <label class="filter-field"
                ><span>Ordenar por</span
                ><select v-model="sortOrder">
                  <option value="oldest">Mas antiguo</option>
                  <option value="newest">Mas reciente</option>
                </select></label
              >
              <label class="filter-field"
                ><span>Umbral de desconexion</span
                ><select v-model.number="silenceThresholdHours">
                  <option :value="1">1 hora</option>
                  <option :value="6">6 horas</option>
                  <option :value="12">12 horas</option>
                  <option :value="24">24 horas</option>
                </select></label
              >
            </div>
            <button
              type="button"
              class="module-button module-button--primary w-full"
              :disabled="isExporting || !filteredRows.length"
              @click="exportExcel"
            >
              {{ isExporting ? "Exportando..." : "Exportar a Excel" }}
            </button>
            <p v-if="exportError" role="alert" class="text-[12px] text-red-600">
              {{ exportError }}
            </p>
            <button
              type="button"
              class="module-button flex w-full items-center justify-center gap-2"
              :disabled="isRefreshing"
              @click="refreshData"
            >
              <span
                v-if="isRefreshing"
                class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                aria-hidden="true"
              />
              {{ isRefreshing ? "Actualizando..." : "Actualizar" }}
            </button>
          </div>
        </aside>

        <main
          class="flex min-h-0 min-w-0 flex-col"
          :class="{ 'lg:overflow-y-auto': activeView === 'charts' }"
        >
          <p
            v-if="flowError"
            role="alert"
            class="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700"
          >
            {{ flowError }}
          </p>
          <p
            v-if="flowNotice"
            role="status"
            class="mb-3 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700"
          >
            {{ flowNotice }}
          </p>
          <section
            v-if="equipmentSection === 'active' || activeView === 'charts'"
            class="grid shrink-0 gap-3 sm:grid-cols-2 xl:grid-cols-4"
            aria-label="Resumen"
          >
            <button
              v-for="item in summaries"
              :key="item.label"
              type="button"
              class="relative flex min-h-[82px] cursor-pointer items-center justify-between overflow-hidden rounded-lg border bg-white px-5 pb-5 text-left shadow-sm"
              :class="[item.cardTone, activeStatus === item.key ? 'ring-2 ring-[#102372]/20' : '']"
              @click="activeStatus = activeStatus === item.key ? 'all' : item.key"
            >
              <div class="flex min-w-0 items-center gap-3">
                <span class="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-current/5"
                  ><SvgIcon :name="item.icon" :class="item.iconClass"
                /></span>
                <span class="min-w-0"
                  ><h2 class="text-[12px] font-black uppercase text-[#102372]">{{ item.label }}</h2>
                  <p class="mt-1 truncate text-[11px] font-medium text-slate-400">
                    {{ item.description }}
                  </p>
                </span>
              </div>
              <strong class="ml-4 text-[25px] font-black" :class="item.textTone">{{
                item.value
              }}</strong>
              <span class="absolute inset-x-4 bottom-3 h-1 rounded-full bg-current opacity-10" />
              <span
                class="absolute bottom-3 left-4 h-1 w-2/5 rounded-full bg-current"
                :class="item.textTone"
              />
            </button>
          </section>

          <nav
            v-if="activeView === 'list'"
            class="mt-3 flex shrink-0 flex-wrap gap-1 border-b border-[#d8e0eb]"
            aria-label="Seguimiento de equipos"
          >
            <button
              v-for="section in equipmentSections"
              :key="section.id"
              type="button"
              class="unreported-tab !h-10 !text-[12px]"
              :class="{ 'is-active': equipmentSection === section.id }"
              @click="equipmentSection = section.id"
            >
              {{ section.label }}
              <span class="ml-2 text-[11px]">{{ sectionCounts[section.id] }}</span>
            </button>
          </nav>
          <div v-if="activeView === 'list'" class="mt-3 min-h-0 flex-1 overflow-x-auto">
            <section
              class="flex h-full min-w-[1100px] flex-col overflow-hidden rounded-lg border border-[#dbe3ee] bg-white shadow-sm"
            >
              <div
                class="table-grid shrink-0 border-b border-[#dfe6ef] bg-[#f7f9fc] py-3 text-[10px] font-black uppercase text-slate-500"
              >
                <span>Equipo</span><span>Estado</span
                ><span>{{
                  equipmentSection === "recovered" ? "Interrupcion" : "Sin reportar"
                }}</span
                ><span>{{
                  equipmentSection === "recovered" ? "Recuperado" : "Ultimo reporte"
                }}</span
                ><span>Diagnostico GPS</span><span>Ubicacion</span
                ><span class="text-center">Acciones</span>
              </div>
              <div
                v-if="filteredRows.length"
                class="equipment-table-body min-h-0 flex-1 lg:overflow-y-auto"
              >
                <article
                  v-for="row in visibleRows"
                  :key="row.imei"
                  class="table-grid min-h-[80px] items-center border-b border-[#e5eaf1] py-3 last:border-b-0 hover:bg-[#fafcff]"
                >
                  <div class="min-w-0 pr-4">
                    <strong class="block truncate text-[12px] font-black text-[#102372]">{{
                      row.name
                    }}</strong
                    ><span class="mt-1 block truncate text-[10px] font-medium text-slate-400"
                      >Sin patente · {{ row.imei }}</span
                    >
                  </div>
                  <div>
                    <span
                      class="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[10px] font-black"
                      :class="row.badgeTone"
                      ><span class="h-2 w-2 rounded-full bg-current" />{{ row.status }}</span
                    >
                  </div>
                  <div class="min-w-0 pr-4">
                    <strong class="block text-[12px] font-black text-[#102372]">{{
                      row.duration
                    }}</strong>
                  </div>
                  <span class="truncate pr-3 text-[10px] font-medium text-slate-500">{{
                    equipmentSection === "recovered"
                      ? formatReportAt(row.recoveredAt)
                      : row.lastReport
                  }}</span>
                  <div class="min-w-0 pr-4">
                    <strong class="block text-[12px] font-black text-[#102372]">{{
                      row.diagnosis.reason
                    }}</strong>
                    <span class="mt-1 block text-[10px] font-medium text-slate-500">{{
                      row.diagnosis.evidence
                    }}</span>
                  </div>
                  <div class="min-w-0">
                    <span class="block truncate text-[11px] font-semibold text-[#29456f]">{{
                      row.location
                    }}</span>
                  </div>
                  <div class="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-2 py-2">
                    <button
                      type="button"
                      class="module-button !h-8 !text-[10px]"
                      :disabled="!lifecycle.allowed(row, equipmentContext)"
                      @click="openOperation(row)"
                    >
                      Notas ({{ row.notes?.length || 0 }})
                    </button>
                    <button
                      v-if="equipmentSection === 'active'"
                      type="button"
                      class="text-[10px] font-semibold text-blue-600 hover:underline"
                      :disabled="!lifecycle.allowed(row, equipmentContext)"
                      @click="simulateReport(row)"
                    >
                      Simular reporte (demo)
                    </button>
                  </div>
                </article>
              </div>
              <div
                v-else
                class="grid min-h-[120px] flex-1 place-items-center text-[12px] font-bold text-slate-400"
              >
                {{
                  equipmentSection === "recovered"
                    ? "No hay equipos recuperados"
                    : "No se encontraron equipos"
                }}
              </div>
              <footer
                class="mt-auto flex h-11 shrink-0 items-center justify-between border-t border-[#dfe6ef] px-4"
              >
                <span class="text-[10px] font-semibold text-slate-400"
                  >Mostrando {{ firstRow }} a {{ lastRow }} de
                  {{ filteredRows.length }} equipos</span
                >
                <div class="flex items-center gap-2">
                  <select
                    v-model.number="pageSize"
                    aria-label="Filas por pagina"
                    class="module-button h-8 px-2"
                  >
                    <option :value="5">5 por pagina</option>
                    <option :value="10">10 por pagina</option>
                    <option :value="20">20 por pagina</option>
                    <option :value="50">50 por pagina</option>
                  </select>
                  <button
                    type="button"
                    class="page-button"
                    aria-label="Pagina anterior"
                    :disabled="currentPage === 1"
                    @click="changePage(-1)"
                  >
                    <SvgIcon name="chevron-left" class="h-4 w-4" />
                  </button>
                  <span class="text-[11px] font-semibold text-[#102372]" aria-live="polite"
                    >{{ currentPage }} / {{ totalPages }}</span
                  >
                  <button
                    type="button"
                    class="page-button"
                    aria-label="Pagina siguiente"
                    :disabled="currentPage === totalPages"
                    @click="changePage(1)"
                  >
                    <SvgIcon name="chevron-right" class="h-4 w-4" />
                  </button>
                </div>
              </footer>
            </section>
          </div>
          <UnreportedCharts v-else class="mt-3" :rows="filteredRows" />
        </main>
      </div>
    </div>
  </section>
  <UnreportedOperationModal
    v-if="operationRow"
    :equipment="
      trackedRows.find(
        (row) => row.imei === operationRow.imei && row.company === operationRow.company,
      ) || operationRow
    "
    :error="flowError"
    @close="closeOperation"
    @confirm="confirmOperation"
    @edit="editEquipmentNote"
    @delete="deleteEquipmentNote"
  />
</template>

<script setup>
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref, watch } from "vue"
import SvgIcon from "../components/icons/SvgIcon.vue"
import UnreportedCharts from "../components/unreported/UnreportedCharts.vue"
import { useUnreportedPagination } from "../composables/unreported/useUnreportedPagination.js"
import { useAuthSession } from "../composables/auth/useAuthSession.js"
import { useAccessControl } from "../composables/auth/useAccessControl.js"
import {
  equipmentKey,
  useUnreportedLifecycleStore,
  parseUnreportedTimestamp,
} from "../services/unreported/unreportedLifecycleStore.js"
import { readStorageValue, writeStorageValue } from "../services/storage/browserStorage.js"
import {
  parseUnreportedPower,
  describeUnreportedDiagnosis,
} from "../utils/unreported/unreportedDiagnosis.js"

const UnreportedOperationModal = defineAsyncComponent(
  () => import("../components/unreported/UnreportedOperationModal.vue"),
)
const { currentUser } = useAuthSession()
const { accessibleCompanies } = useAccessControl()
const equipmentContext = computed(() => ({
  user: currentUser.value,
  companies: accessibleCompanies.value.map((company) => company.name),
}))
const activeView = ref("list")
const equipmentSection = ref("active")
const equipmentSections = [
  { id: "active", label: "Sin reportar" },
  { id: "recovered", label: "Recuperados" },
]
const lifecycle = useUnreportedLifecycleStore()
const cachedThreshold = Number(readStorageValue("sinergy-unreported-threshold-hours"))
const silenceThresholdHours = ref([1, 6, 12, 24].includes(cachedThreshold) ? cachedThreshold : 6)
const observedNow = ref(Date.now())
const operationRow = ref(null),
  flowError = ref(""),
  flowNotice = ref("")
const searchTerm = ref("")
const activeStatus = ref("all")
const sortOrder = ref("oldest")
const selectedCompany = ref("all")
const startDate = ref("")
const endDate = ref("")
const selectedSilence = ref("all")
const isRefreshing = ref(false)
const isExporting = ref(false)
const exportError = ref("")
const exportExcel = async () => {
  if (isExporting.value || !filteredRows.value.length) return
  exportError.value = ""
  isExporting.value = true
  const exportRows = filteredRows.value.map((row) => ({
    ...row,
    recoveredAt: row.recoveredAt ? formatReportAt(row.recoveredAt) : "",
    faultAt: row.faultAt ? formatReportAt(row.faultAt) : "",
    interruption: durationLabel(row.outageDurationMs),
    disconnectionReason: row.diagnosis.reason,
    diagnosticEvidence: row.diagnosis.evidence,
  }))
  try {
    const { exportUnreportedExcel } =
      await import("../services/unreported/unreportedExcelExportService.js")
    await exportUnreportedExcel(exportRows)
  } catch {
    exportError.value = "No fue posible exportar los equipos. Intenta nuevamente."
  } finally {
    isExporting.value = false
  }
}
const summaryDefinitions = [
  {
    key: "Corte de alimentacion",
    label: "Corte de alimentacion",
    description: "El ultimo dato fue 0 V de alimentacion externa",
    value: 6,
    cardTone: "border-red-200 text-red-600",
    textTone: "text-red-600",
    icon: "power-cut",
    iconClass: "h-5 w-5",
  },
  {
    key: "Requiere revision",
    label: "Requiere revision",
    description: "Mudo mas del umbral",
    value: 3,
    cardTone: "border-orange-200 text-[#ff6600]",
    textTone: "text-[#ff6600]",
    icon: "alertas",
    iconClass: "h-6 w-6",
  },
  {
    key: "Sin conexion",
    label: "Sin conexion",
    description: "Sin comunicacion actual",
    value: 0,
    cardTone: "border-blue-200 text-blue-600",
    textTone: "text-blue-600",
    icon: "unreported",
    iconClass: "h-6 w-6",
  },
  {
    key: "Nunca reporto",
    label: "Nunca reporto",
    description: "Sin un solo paquete",
    value: 2,
    cardTone: "border-slate-200 text-slate-500",
    textTone: "text-slate-500",
    icon: "shield",
    iconClass: "h-6 w-6",
  },
]
const sourceRows = [
  [
    "Equipo prueba 1",
    "865124072520507",
    "14 dias",
    "10-09-2026 18:07:15",
    "Alim. 0,0 V · Bat. 7,63 V de 10,07 V habituales",
    "Sin posicion conocida",
    "Corte de alimentacion",
  ],
  [
    "863719067362203",
    "863719067362203",
    "2 dias 14 h",
    "22-09-2026 19:19:14",
    "Alim. 0,0 V · Bat. 3,41 V de 4,15 V habituales",
    "Joaquin Prieto 300, Gorbea",
    "Corte de alimentacion",
  ],
  [
    "866948061373067",
    "866948061373067",
    "2 dias 12 h",
    "22-09-2026 20:51:41",
    "Alim. 0,0 V · Bat. 3,47 V de 4,14 V habituales",
    "Bernardo O'Higgins, Gorbea",
    "Corte de alimentacion",
  ],
  [
    "PK1324 SIMPLE",
    "866948060110833",
    "14 horas",
    "24-09-2026 19:24:09",
    "Alim. 0,0 V · Bat. 3,46 V de 4,15 V habituales",
    "Toma Felipe Camiroaga, Vina del Mar",
    "Corte de alimentacion",
  ],
  [
    "VPKH43 - 426 - PUERTA",
    "863719066350787",
    "13 horas",
    "24-09-2026 20:15:10",
    "Alim. 0,0 V · Bat. 3,28 V de 4,15 V habituales",
    "Arzobispo Subercaseaux 4237, Santiago",
    "Corte de alimentacion",
  ],
  [
    "JXRZ10 - CAN",
    "866948060209221",
    "6 horas",
    "25-09-2026 02:44:41",
    "Alim. 0,0 V · Bat. 3,53 V de 4,15 V habituales",
    "Ruta V-819, Puerto Montt",
    "Corte de alimentacion",
  ],
  [
    "KXSG70 - CAN",
    "863719067634510",
    "1 dia 22 h",
    "23-09-2026 11:05:05",
    "Alim. 28,13 V · Bat. 4,12 V de 4,15 V habituales",
    "Freire",
    "Requiere revision",
  ],
  [
    "DCXJ29 - VARILLA",
    "860396052829678",
    "18 horas",
    "24-09-2026 14:57:49",
    "Alim. 12,82 V · Bat. 10,24 V de 10,80 V habituales",
    "Osorno",
    "Requiere revision",
  ],
  [
    "PHLG30 - CAN",
    "860396052397393",
    "20 horas",
    "24-09-2026 13:28:21",
    "Alim. 12,70 V · Bat. 10,08 V de 10,80 V habituales",
    "Purranque",
    "Requiere revision",
  ],
]
const companies = ["Transportes San Pedro", "Forestal Los Robles", "Constructora Norte"]
const sourceEquipment = sourceRows.map(
  ([name, imei, duration, lastReport, power, location, status], index) => ({
    name,
    imei,
    duration,
    lastReport,
    power,
    ...parseUnreportedPower(power),
    location,
    status,
    company: companies[index % companies.length],
    badgeTone:
      status === "Corte de alimentacion" ? "bg-red-50 text-red-600" : "bg-orange-50 text-[#ff6600]",
  }),
)
sourceEquipment[8] = {
  ...sourceEquipment[8],
  status: "Nunca reporto",
  duration: "—",
  lastReport: "Sin reporte",
  power: "Sin datos",
  externalVoltage: null,
  internalVoltage: null,
  location: "Sin posicion conocida",
  badgeTone: "bg-slate-100 text-slate-600",
}
const authorizedEquipment = computed(() =>
  sourceEquipment.filter((row) => lifecycle.allowed(row, equipmentContext.value)),
)
const companyOptions = computed(() => [
  ...new Set(authorizedEquipment.value.map((row) => row.company)),
])
const formatReportAt = (value) => {
  const date = new Date(value)
  return value && !Number.isNaN(date.getTime())
    ? new Intl.DateTimeFormat("es-CL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "America/Santiago",
      }).format(date)
    : "Sin registro"
}
const durationLabel = (milliseconds) => {
  if (!Number.isFinite(milliseconds)) return "Sin registro"
  const hours = Math.floor(milliseconds / 3600000)
  return hours >= 24
    ? `${Math.floor(hours / 24)} dias ${hours % 24} h`
    : hours
      ? `${hours} h`
      : "Menos de 1 h"
}
const trackedRows = computed(() =>
  authorizedEquipment.value.map((row) => {
    const record = lifecycle.records.value[equipmentKey(row)] || {
      mode: "active",
      lastSeenAt: parseUnreportedTimestamp(row.lastReport),
    }
    const elapsed = record.lastSeenAt
      ? Math.max(0, observedNow.value - Date.parse(record.lastSeenAt))
      : null
    const telemetry = record.telemetry ||
      row.telemetry || {
        reportedAt: parseUnreportedTimestamp(row.lastReport),
        externalVoltage: row.externalVoltage,
        internalVoltage: row.internalVoltage,
        previousExternalVoltage: row.previousExternalVoltage,
        simStatus: row.simStatus,
        mobileRegistered: row.mobileRegistered,
        mobileRegistration: row.mobileRegistration,
        mobileSignalDbm: row.mobileSignalDbm,
        gpsFixValid: row.gpsFixValid,
        gpsFix: row.gpsFix,
        satellites: row.satellites,
      }
    const status =
      record.mode === "recovered" ? "Reportando" : record.recoveredAt ? "Sin conexion" : row.status
    return {
      ...row,
      ...record,
      status,
      diagnosis: describeUnreportedDiagnosis({
        ...telemetry,
        mode: record.mode,
        lastReportAt: record.lastSeenAt,
        sensorReportedAt: telemetry.reportedAt,
      }),
      duration: durationLabel(record.mode === "recovered" ? record.outageDurationMs : elapsed),
      elapsedHours: elapsed === null ? null : elapsed / 3600000,
      lastReport: record.lastSeenAt ? formatReportAt(record.lastSeenAt) : "Sin reporte",
      filterDate: record.mode === "recovered" ? record.recoveredAt : record.lastSeenAt,
      badgeTone:
        record.mode === "recovered"
          ? "bg-emerald-50 text-emerald-700"
          : status === "Sin conexion"
            ? "bg-blue-50 text-blue-600"
            : row.badgeTone,
    }
  }),
)
const sectionCounts = computed(() =>
  Object.fromEntries(
    equipmentSections.map((section) => [
      section.id,
      trackedRows.value.filter((row) => row.mode === section.id).length,
    ]),
  ),
)
const summaries = computed(() =>
  summaryDefinitions.map((item) => ({
    ...item,
    value: trackedRows.value.filter((row) => row.mode === "active" && row.status === item.key)
      .length,
  })),
)
const observeReports = () => {
  observedNow.value = Date.now()
  try {
    lifecycle.observe(
      authorizedEquipment.value,
      equipmentContext.value,
      silenceThresholdHours.value,
    )
  } catch (error) {
    flowError.value = error.message
  }
}
watch([authorizedEquipment, silenceThresholdHours], observeReports, { immediate: true })
watch(silenceThresholdHours, (value) => {
  if (!writeStorageValue("sinergy-unreported-threshold-hours", value))
    flowError.value = "No se pudo guardar el umbral."
})
watch([equipmentSection, activeView], () => {
  activeStatus.value = "all"
  selectedSilence.value = "all"
  startDate.value = ""
  endDate.value = ""
})
watch(
  () => currentUser.value?.id,
  () => {
    operationRow.value = null
    flowError.value = ""
    flowNotice.value = ""
  },
)
let monitorTimer, noticeTimer
onMounted(() => {
  monitorTimer = window.setInterval(observeReports, 60000)
})
onBeforeUnmount(() => {
  clearInterval(monitorTimer)
  clearTimeout(noticeTimer)
})
watch(flowNotice, (value) => {
  clearTimeout(noticeTimer)
  if (value)
    noticeTimer = setTimeout(() => {
      flowNotice.value = ""
    }, 6000)
})
const openOperation = (row) => {
  flowError.value = ""
  flowNotice.value = ""
  operationRow.value = row
}
const closeOperation = () => {
  operationRow.value = null
  flowError.value = ""
}
watch(equipmentContext, (context) => {
  if (operationRow.value && !lifecycle.allowed(operationRow.value, context)) closeOperation()
  if (selectedCompany.value !== "all" && !context.companies.includes(selectedCompany.value))
    selectedCompany.value = "all"
})
const confirmOperation = (reason) => {
  const row = operationRow.value
  try {
    lifecycle.addNote(row, reason, equipmentContext.value, silenceThresholdHours.value)
    flowError.value = ""
    flowNotice.value = "Nota guardada. El equipo permanece en seguimiento."
  } catch (error) {
    flowError.value = error.message
  }
}
const editEquipmentNote = ({ id, text }) => {
  try {
    lifecycle.editNote(operationRow.value, id, text, equipmentContext.value)
    flowError.value = ""
  } catch (error) {
    flowError.value = error.message
  }
}
const deleteEquipmentNote = (id) => {
  try {
    lifecycle.deleteNote(operationRow.value, id, equipmentContext.value)
    flowError.value = ""
  } catch (error) {
    flowError.value = error.message
  }
}
const simulateReport = (row) => {
  try {
    lifecycle.receiveReport(
      row,
      equipmentContext.value,
      new Date().toISOString(),
      silenceThresholdHours.value,
    )
    observeReports()
    equipmentSection.value = "recovered"
    flowError.value = ""
    flowNotice.value = "Reporte de demostracion recibido. No es telemetria real."
  } catch (error) {
    flowError.value = error.message
  }
}
const statusOptions = [
  { key: "all", label: "Todos", dot: "bg-blue-600" },
  { key: "Corte de alimentacion", label: "Corte de alimentacion", dot: "bg-red-600" },
  { key: "Requiere revision", label: "Requiere revision", dot: "bg-[#ff6600]" },
  { key: "Sin conexion", label: "Sin conexion", dot: "bg-blue-600" },
  { key: "Nunca reporto", label: "Nunca reporto", dot: "bg-slate-500" },
]
const getReportDate = (value) => {
  const match = String(value).match(/^(\d{2})-(\d{2})-(\d{4})/)
  return match ? `${match[3]}-${match[2]}-${match[1]}` : ""
}
const clearFilters = () => {
  searchTerm.value = ""
  selectedCompany.value = "all"
  startDate.value = ""
  endDate.value = ""
  selectedSilence.value = "all"
  activeStatus.value = "all"
  sortOrder.value = "oldest"
}
const refreshData = async () => {
  if (isRefreshing.value) return

  isRefreshing.value = true
  try {
    await new Promise((resolve) => window.setTimeout(resolve, 800))
    observeReports()
  } finally {
    isRefreshing.value = false
  }
}
const filteredRows = computed(() => {
  const query = searchTerm.value.trim().toLocaleLowerCase("es")
  const matches = trackedRows.value.filter((row) => {
    if (row.mode !== (activeView.value === "charts" ? "active" : equipmentSection.value))
      return false
    const matchesSearch =
      !query || [row.name, row.imei].some((value) => value.toLocaleLowerCase("es").includes(query))
    const reportDate = row.filterDate
      ? new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Santiago" }).format(
          new Date(row.filterDate),
        )
      : getReportDate(row.lastReport)
    const matchesCompany = selectedCompany.value === "all" || row.company === selectedCompany.value
    const matchesStart = !startDate.value || (reportDate && reportDate >= startDate.value)
    const matchesEnd = !endDate.value || (reportDate && reportDate <= endDate.value)
    const hours = row.elapsedHours ?? 0
    const matchesSilence =
      selectedSilence.value === "all" || (selectedSilence.value === "6h" ? hours >= 6 : hours >= 24)
    return (
      matchesSearch &&
      matchesCompany &&
      matchesStart &&
      matchesEnd &&
      matchesSilence &&
      (activeStatus.value === "all" || row.status === activeStatus.value)
    )
  })
  return [...matches].sort(
    (a, b) =>
      (sortOrder.value === "newest" ? -1 : 1) *
      ((Date.parse(a.filterDate) || 0) - (Date.parse(b.filterDate) || 0)),
  )
})
const { pageSize, currentPage, totalPages, visibleRows, firstRow, lastRow, changePage } =
  useUnreportedPagination(filteredRows, [
    searchTerm,
    selectedCompany,
    startDate,
    endDate,
    selectedSilence,
    activeStatus,
    sortOrder,
    equipmentSection,
    activeView,
  ])
</script>

<style scoped>
.unreported-tab {
  position: relative;
  display: inline-flex;
  height: 3rem;
  cursor: pointer;
  align-items: center;
  border: 0;
  background: transparent;
  padding: 0 1.25rem;
  color: #64748b;
  font-size: 0.8125rem;
  font-weight: 900;
}
.unreported-tab:hover,
.unreported-tab.is-active {
  color: #102372;
}
.unreported-tab.is-active::after {
  position: absolute;
  right: 0;
  bottom: -1px;
  left: 0;
  height: 2px;
  background: #ff6600;
  content: "";
}
.module-button {
  height: 2.5rem;
  cursor: pointer;
  border: 1px solid #d5deea;
  border-radius: 0.5rem;
  background: #fff;
  padding: 0 1.25rem;
  color: #102372;
  font-size: 0.75rem;
  font-weight: 900;
  box-shadow: 0 2px 6px rgb(15 35 80 / 6%);
}
.module-button--primary {
  border-color: #102372;
  background: #102372;
  color: #fff;
}
.filter-field {
  display: grid;
  gap: 0.4rem;
  color: #64748b;
  font-size: 0.68rem;
  font-weight: 900;
  text-transform: uppercase;
}
.filter-status-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.375rem;
}
.filter-status-grid .status-filter {
  justify-content: center;
  gap: 0.375rem;
  padding-inline: 0.25rem;
  font-size: 0.68rem;
  white-space: nowrap;
}
.filter-status-grid .status-filter:last-child {
  grid-column: 1 / -1;
}
.filter-date-label {
  display: grid;
  gap: 0.25rem;
  font-weight: 500;
  text-transform: none;
}
.unreported-filters .filter-field input.filter-search {
  padding-left: 2rem;
}
.filter-settings-grid {
  display: grid;
  grid-template-columns: 0.8fr 1fr;
  align-items: end;
  gap: 0.75rem;
}
.filter-settings-grid .filter-field > span {
  font-size: 0.625rem;
  white-space: nowrap;
}
.filter-status-grid .status-filter--active {
  background: #eaf2ff;
}
.unreported-filter-fields {
  display: grid;
  align-content: start;
  gap: 0.875rem;
  padding: 1rem;
}
.unreported-filters fieldset.filter-field > legend {
  margin-bottom: 0.375rem;
}
.filter-status-grid .status-filter > span {
  flex-shrink: 0;
}
@media (min-width: 1024px) {
  .unreported-filters .filter-field {
    gap: 0.375rem;
  }
  .unreported-filters .filter-field input,
  .unreported-filters .filter-field select,
  .unreported-filter-fields > .module-button {
    height: 2.25rem;
  }
  .unreported-filters .status-filter {
    min-height: 2rem;
    padding-block: 0.25rem;
    font-size: 0.68rem;
  }
}
.filter-field input,
.filter-field select {
  width: 100%;
  height: 2.5rem;
  border: 1px solid #d5deea;
  border-radius: 0.5rem;
  background: #fff;
  padding: 0 0.7rem;
  color: #102372;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: none;
  outline: none;
}
.page-button {
  display: grid;
  width: 2rem;
  height: 2rem;
  cursor: pointer;
  place-items: center;
  border: 1px solid #dbe3ee;
  border-radius: 0.5rem;
  color: #94a3b8;
  font-weight: 900;
}
.page-button:disabled {
  cursor: default;
  opacity: 0.45;
}
.page-button--active {
  border-color: #ff6600;
  color: #ff6600;
}
.table-grid {
  display: grid;
  grid-template-columns: 1.05fr 0.82fr 0.62fr 0.82fr 1.25fr 1.05fr 190px;
  padding-right: 1rem;
  padding-left: 1rem;
}
.equipment-table-body {
  display: grid;
  grid-auto-rows: minmax(min-content, 1fr);
  scrollbar-gutter: stable;
}
.status-filter {
  display: inline-flex;
  min-height: 2.25rem;
  cursor: pointer;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid #dbe3ee;
  border-radius: 0.5rem;
  padding: 0.4rem 0.75rem;
  color: #29456f;
  font-size: 0.72rem;
  font-weight: 800;
}
.status-filter--active {
  border-color: #2563eb;
  color: #102372;
  box-shadow: 0 0 0 1px rgb(37 99 235 / 15%);
}
.filter-button {
  display: inline-flex;
  height: 2.25rem;
  cursor: pointer;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid #e1e7f0;
  border-radius: 0.55rem;
  padding: 0 0.9rem;
  color: #29456f;
  font-size: 0.7rem;
  font-weight: 800;
}
.filter-button strong {
  border-radius: 999px;
  background: #f0f3f8;
  padding: 0.15rem 0.45rem;
}
.filter-button--active {
  border-color: #102372;
  background: #102372;
  color: #fff;
}
.action-button {
  width: 2.1rem;
  height: 2.1rem;
  cursor: pointer;
  border: 1px solid #d8e1ed;
  border-radius: 0.5rem;
  color: #102372;
  font-size: 1.25rem;
  line-height: 1;
}
</style>
