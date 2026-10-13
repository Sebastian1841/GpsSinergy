<template>
  <section class="h-full min-h-0 overflow-auto bg-[#f5f8fc] p-4 sm:p-5 lg:p-6">
    <div class="flex min-h-full flex-col">
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
        <aside class="rounded-lg border border-[#dbe3ee] bg-white shadow-sm">
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
          <div class="space-y-4 p-4">
            <label class="filter-field"><span>Buscar</span><input v-model="searchTerm" type="search" placeholder="Equipo, patente o IMEI" /></label>
            <label class="filter-field"><span>Empresa</span><select v-model="selectedCompany">
                <option value="all">Todas las empresas</option>
                <option v-for="company in companyOptions" :key="company" :value="company">
                  {{ company }}
                </option>
              </select></label>
            <fieldset class="filter-field">
              <legend>Estado</legend>
              <div class="flex flex-wrap gap-2">
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
            <label class="filter-field"><span>Tiempo sin reportar</span><select v-model="selectedSilence">
                <option value="all">Cualquier tiempo</option>
                <option value="6h">Mas de 6 horas</option>
                <option value="24h">Mas de 24 horas</option>
              </select></label>
            <fieldset class="filter-field">
              <legend>Fecha ultimo reporte</legend>
              <div class="grid grid-cols-2 gap-2">
                <input v-model="startDate" type="date" aria-label="Desde" /><input
                  v-model="endDate"
                  type="date"
                  aria-label="Hasta"
                />
              </div>
            </fieldset>
            <label class="filter-field"><span>Ordenar por</span><select v-model="sortOrder">
                <option value="oldest">Mas antiguo</option>
                <option value="newest">Mas reciente</option>
              </select></label>
            <button type="button" class="module-button module-button--primary w-full" :disabled="isExporting || !filteredRows.length" @click="exportExcel">
              {{ isExporting ? "Exportando..." : "Exportar a Excel" }}
            </button>
            <p v-if="exportError" role="alert" class="text-[12px] text-red-600">{{ exportError }}</p>
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

        <main class="flex min-w-0 flex-col">
          <section class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumen">
            <button
              v-for="item in summaries"
              :key="item.label"
              type="button"
              class="relative flex min-h-[82px] cursor-pointer items-center justify-between overflow-hidden rounded-lg border bg-white px-5 pb-5 text-left shadow-sm"
              :class="[item.cardTone, activeStatus === item.key ? 'ring-2 ring-[#102372]/20' : '']"
              @click="activeStatus = activeStatus === item.key ? 'all' : item.key"
            >
              <div class="flex min-w-0 items-center gap-3">
                <span class="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-current/5"><SvgIcon :name="item.icon" :class="item.iconClass" /></span>
                <span class="min-w-0"><h2 class="text-[12px] font-black uppercase text-[#102372]">{{ item.label }}</h2>
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

          <div v-if="activeView === 'list'" class="mt-3 min-h-0 flex-1 overflow-x-auto">
            <section
              class="flex h-full min-w-[1040px] flex-col overflow-hidden rounded-lg border border-[#dbe3ee] bg-white shadow-sm"
            >
              <div
                class="table-grid border-b border-[#dfe6ef] bg-[#f7f9fc] py-3 text-[10px] font-black uppercase text-slate-500"
              >
                <span>Equipo</span><span>Estado</span><span>Sin reportar</span><span>Ultimo reporte</span><span>Al cortarse</span><span>Ubicacion</span>
              </div>
              <div v-if="filteredRows.length">
                <article
                  v-for="row in visibleRows"
                  :key="row.imei"
                  class="table-grid min-h-[58px] items-center border-b border-[#e5eaf1] last:border-b-0 hover:bg-[#fafcff]"
                >
                  <div class="min-w-0 pr-4">
                    <strong class="block truncate text-[12px] font-black text-[#102372]">{{
                      row.name
                    }}</strong><span class="mt-1 block truncate text-[10px] font-medium text-slate-400">Sin patente · {{ row.imei }}</span>
                  </div>
                  <div>
                    <span
                      class="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[10px] font-black"
                      :class="row.badgeTone"
                      ><span class="h-2 w-2 rounded-full bg-current" />{{ row.status }}</span>
                  </div>
                  <div class="min-w-0 pr-4">
                    <strong class="block text-[12px] font-black text-[#102372]">{{
                      row.duration
                    }}</strong>
                  </div>
                  <span class="truncate pr-3 text-[10px] font-medium text-slate-500">{{
                    row.lastReport
                  }}</span>
                  <div class="min-w-0 pr-4">
                    <strong class="block text-[12px] font-black text-[#102372]">Motor apagado</strong><span class="mt-1 block truncate text-[10px] font-medium text-slate-400">{{
                      row.power
                    }}</span>
                  </div>
                  <div class="min-w-0">
                    <span class="block truncate text-[11px] font-semibold text-[#29456f]">{{
                      row.location
                    }}</span>
                  </div>
                </article>
              </div>
              <div
                v-else
                class="grid min-h-[260px] place-items-center text-[12px] font-bold text-slate-400"
              >
                No se encontraron equipos
              </div>
              <footer
                class="mt-auto flex h-11 shrink-0 items-center justify-between border-t border-[#dfe6ef] px-4"
              >
                <span class="text-[10px] font-semibold text-slate-400">Mostrando {{ firstRow }} a {{ lastRow }} de
                  {{ filteredRows.length }} equipos</span>
                <div class="flex items-center gap-2">
                  <select v-model.number="pageSize" aria-label="Filas por pagina" class="module-button h-8 px-2">
                    <option :value="10">10 por pagina</option>
                    <option :value="20">20 por pagina</option>
                    <option :value="50">50 por pagina</option>
                  </select>
                  <button type="button" class="page-button" aria-label="Pagina anterior" :disabled="currentPage === 1" @click="changePage(-1)">
                    <SvgIcon name="chevron-left" class="h-4 w-4" />
                  </button>
                  <span class="text-[11px] font-semibold text-[#102372]" aria-live="polite">{{ currentPage }} / {{ totalPages }}</span>
                  <button type="button" class="page-button" aria-label="Pagina siguiente" :disabled="currentPage === totalPages" @click="changePage(1)">
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
</template>

<script setup>
import { computed, ref } from "vue"
import SvgIcon from "../components/icons/SvgIcon.vue"
import UnreportedCharts from "../components/unreported/UnreportedCharts.vue"
import { useUnreportedPagination } from "../composables/unreported/useUnreportedPagination.js"

const activeView = ref("list")
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
  const exportRows = filteredRows.value.map(row => ({ ...row }))
  try {
    const { exportUnreportedExcel } = await import("../services/unreported/unreportedExcelExportService.js")
    await exportUnreportedExcel(exportRows)
  } catch {
    exportError.value = "No fue posible exportar los equipos. Intenta nuevamente."
  } finally {
    isExporting.value = false
  }
}
const summaries = [
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
    description: "Mudo menos del umbral",
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
const rows = sourceRows.map(
  ([name, imei, duration, lastReport, power, location, status], index) => ({
    name,
    imei,
    duration,
    lastReport,
    power,
    location,
    status,
    company: companies[index % companies.length],
    badgeTone:
      status === "Corte de alimentacion" ? "bg-red-50 text-red-600" : "bg-orange-50 text-[#ff6600]",
  }),
)
rows[8] = {
  ...rows[8],
  status: "Nunca reporto",
  duration: "—",
  lastReport: "Sin reporte",
  power: "Sin datos",
  location: "Sin posicion conocida",
  badgeTone: "bg-slate-100 text-slate-600",
}
const companyOptions = companies
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
  await new Promise((resolve) => window.setTimeout(resolve, 800))
  isRefreshing.value = false
}
const filteredRows = computed(() => {
  const query = searchTerm.value.trim().toLocaleLowerCase("es")
  const matches = rows.filter((row) => {
    const matchesSearch =
      !query || [row.name, row.imei].some((value) => value.toLocaleLowerCase("es").includes(query))
    const reportDate = getReportDate(row.lastReport)
    const matchesCompany = selectedCompany.value === "all" || row.company === selectedCompany.value
    const matchesStart = !startDate.value || (reportDate && reportDate >= startDate.value)
    const matchesEnd = !endDate.value || (reportDate && reportDate <= endDate.value)
    const hours = row.duration.includes("dia")
      ? Number.parseInt(row.duration) * 24
      : Number.parseInt(row.duration) || 0
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
  return sortOrder.value === "newest" ? [...matches].reverse() : matches
})
const { pageSize, currentPage, totalPages, visibleRows, firstRow, lastRow, changePage } = useUnreportedPagination(
  filteredRows,
  [searchTerm, selectedCompany, startDate, endDate, selectedSilence, activeStatus, sortOrder],
)
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
  grid-template-columns: 1.05fr 0.82fr 0.62fr 0.82fr 1.25fr 1.05fr;
  padding-right: 1rem;
  padding-left: 1rem;
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
