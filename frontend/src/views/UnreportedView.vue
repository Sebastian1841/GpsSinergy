<template>
  <section class="h-full min-h-0 overflow-hidden bg-[#f5f8fc] p-4 sm:p-5 lg:p-6">
    <div class="flex h-full min-h-0 flex-col">
      <h1 class="sr-only">Equipos sin reporte</h1>
      <p v-if="exportError" role="alert" class="mb-3 shrink-0 text-[12px] text-red-600">
        {{ exportError }}
      </p>

      <button
        type="button"
        class="module-button filters-toggle mb-3 self-start"
        :aria-expanded="filtersExpanded"
        aria-controls="unreported-filters"
        @click="filtersExpanded = !filtersExpanded"
      >
        {{ filtersExpanded ? "Ocultar filtros" : "Mostrar filtros" }}
      </button>
      <div
        class="unreported-workspace grid min-h-0 flex-1 gap-4 xl:grid-cols-[315px_minmax(0,1fr)]"
        :class="{ 'filters-open': filtersExpanded }"
      >
        <aside
          id="unreported-filters"
          :class="{ 'filters-expanded': filtersExpanded }"
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
            <button
              type="button"
              class="module-button flex h-10 items-center gap-2 px-3"
              @click="clearFilters"
            >
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
            <label v-if="equipmentSection === 'active'" class="filter-field"
              ><span>Sin reportar desde hace</span
              ><select v-model="selectedSilence">
                <option value="all">Cualquier tiempo</option>
                <option value="1d">1 dia o mas</option>
                <option value="3d">3 dias o mas</option>
                <option value="7d">7 dias o mas</option>
                <option value="15d">15 dias o mas</option>
                <option value="custom">Otro plazo...</option>
                <option value="unknown">Sin fecha conocida</option>
              </select></label
            >
            <label
              v-if="equipmentSection === 'active' && selectedSilence === 'custom'"
              class="filter-field"
            >
              <span>Minimo de dias sin reportar</span>
              <input
                v-model.number="customSilenceDays"
                type="number"
                min="1"
                max="3650"
                step="1"
                :aria-invalid="customSilenceError"
                aria-describedby="custom-silence-error"
              />
              <span v-if="customSilenceError" id="custom-silence-error" role="alert"
                >Ingresa dias completos entre 1 y 3650.</span
              >
            </label>
            <template v-if="equipmentSection === 'history'">
              <label class="filter-field"
                ><span>Fecha de desconexion</span
                ><select v-model="historyPeriod">
                  <option value="all">Todo el historial</option>
                  <option value="month">Ultimos 30 dias</option>
                  <option value="quarter">Ultimos 90 dias</option>
                  <option value="custom">Elegir fechas</option>
                </select></label
              >
              <template v-if="historyPeriod === 'custom'">
                <label class="filter-field"
                  ><span>Desde</span
                  ><input v-model="historyFrom" type="date" :max="historyTo || undefined"
                /></label>
                <label class="filter-field"
                  ><span>Hasta</span
                  ><input v-model="historyTo" type="date" :min="historyFrom || undefined"
                /></label>
                <p v-if="historyDateError" role="alert" class="text-[15px] text-red-700">
                  Desde debe ser anterior o igual a Hasta.
                </p>
              </template>
            </template>
            <details
              v-if="equipmentSection === 'history'"
              class="extra-filters history-extra-filters"
            >
              <summary>
                Mas filtros<span
                  v-if="
                    historySituation !== 'all' ||
                    historyDuration !== 'all' ||
                    historyReview !== 'all'
                  "
                >
                  · Aplicados</span
                >
              </summary>
              <div class="mt-4 grid gap-5">
                <label class="filter-field"
                  ><span>Motivo informado</span>
                  <select v-model="historySituation">
                    <option value="all">Todos los motivos</option>
                    <option value="none">Sin consulta</option>
                    <option
                      v-for="option in consultationSituations"
                      :key="option.value"
                      :value="option.value"
                    >
                      {{ option.label }}
                    </option>
                  </select>
                </label>
                <label class="filter-field"
                  ><span>Duracion de la desconexion</span>
                  <select v-model="historyDuration">
                    <option value="all">Cualquier duracion</option>
                    <option value="1d">Mas de 1 dia</option>
                    <option value="3d">Mas de 3 dias</option>
                    <option value="7d">Mas de 7 dias</option>
                    <option value="15d">Mas de 15 dias</option>
                  </select>
                </label>
                <label class="filter-field"
                  ><span>Requirio revision en terreno</span>
                  <select v-model="historyReview">
                    <option value="all">Todos</option>
                    <option value="yes">Si</option>
                    <option value="no">No, con consulta registrada</option>
                  </select>
                </label>
              </div>
            </details>
            <details v-if="equipmentSection === 'active'" class="extra-filters">
              <summary>
                Más filtros<span
                  v-if="selectedConsultation !== 'all' || selectedFollowUp !== 'all'"
                >
                  · Aplicados</span
                >
              </summary>
              <div class="mt-4 grid gap-5">
                <label v-if="equipmentSection === 'active'" class="filter-field">
                  <span>Ultima consulta</span>
                  <select v-model="selectedConsultation">
                    <option value="all">Todas las consultas</option>
                    <option value="none">Sin consultar</option>
                    <option
                      v-for="option in consultationSituations"
                      :key="option.value"
                      :value="option.value"
                    >
                      {{ option.label }}
                    </option>
                  </select>
                </label>
                <label v-if="equipmentSection === 'active'" class="filter-field">
                  <span>Revision en terreno</span>
                  <select v-model="selectedFollowUp">
                    <option value="all">Todos</option>
                    <option value="pending">Pendiente de confirmar</option>
                    <option value="field_review">Requiere visita</option>
                    <option value="no_visit">No necesita visita</option>
                  </select>
                </label>
              </div>
            </details>
          </div>
        </aside>

        <main class="flex min-h-0 min-w-0 flex-col">
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
          <nav
            class="flex shrink-0 flex-wrap items-end gap-1 border-b border-[#d8e0eb]"
            aria-label="Seguimiento de equipos"
          >
            <button
              v-for="section in equipmentSections"
              :key="section.id"
              type="button"
              class="unreported-tab !h-12 !text-[16px]"
              :class="{ 'is-active': equipmentSection === section.id }"
              @click="equipmentSection = section.id"
            >
              {{ section.label }}
              <span
                class="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-slate-100 px-1 text-[12px]"
                >{{ sectionCounts[section.id] }}</span
              >
            </button>
            <div class="ml-auto flex flex-wrap items-center justify-end gap-3 pb-2">
              <button
                type="button"
                class="module-button module-button--primary flex items-center justify-center gap-2"
                :disabled="isExporting || !filteredRows.length"
                @click="exportExcel"
              >
                <SvgIcon name="download" class="h-4 w-4" />
                {{ isExporting ? "Exportando..." : "Exportar a Excel" }}
              </button>
              <button
                type="button"
                class="module-button flex items-center justify-center gap-2"
                :disabled="isRefreshing"
                @click="refreshData"
              >
                <span
                  v-if="isRefreshing"
                  class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                  aria-hidden="true"
                />
                <span v-if="!isRefreshing" aria-hidden="true" class="text-[22px] leading-none"
                  >↻</span
                >
                {{ isRefreshing ? "Actualizando..." : "Actualizar" }}
              </button>
            </div>
          </nav>
          <div class="mt-3 min-h-0 min-w-0 flex-1">
            <UnreportedHistoryDetail
              v-if="selectedHistoryEquipment"
              :equipment="selectedHistoryEquipment"
              :demo="isDevelopment"
              @simulate-disconnection="simulateDisconnection(selectedHistoryEquipment)"
              class="h-full rounded-lg border border-[#dbe3ee] bg-white px-4"
              @back="selectedHistoryKey = ''"
            />
            <section
              v-else
              class="flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-[#dbe3ee] bg-white shadow-sm"
            >
              <div class="equipment-table-scroll min-h-0 flex-1 overflow-auto">
                <div
                  class="equipment-table-content"
                  :style="{ minWidth: tableMinimumWidth + 'px' }"
                >
                  <div
                    :style="tableGridStyle"
                    class="table-grid shrink-0 border-b border-[#dfe6ef] bg-[#f7f9fc] py-3 text-[14px] font-black uppercase text-slate-500"
                  >
                    <div
                      v-for="column in tableColumns"
                      :key="column.key"
                      role="columnheader"
                      :aria-sort="
                        column.key === 'actions'
                          ? undefined
                          : tableSort.key === column.key
                            ? tableSort.direction === 'asc'
                              ? 'ascending'
                              : 'descending'
                            : 'none'
                      "
                    >
                      <span v-if="column.key === 'actions'" class="block text-center"
                        >Acciones</span
                      >
                      <button
                        v-else
                        type="button"
                        class="table-sort-button"
                        :title="'Ordenar por ' + column.label"
                        :aria-label="'Ordenar por ' + column.label"
                        @click="toggleTableSort(column.key)"
                      >
                        {{ column.label }}
                        <SvgIcon
                          :name="
                            tableSort.key === column.key && tableSort.direction === 'asc'
                              ? 'chevron-up'
                              : 'chevron-down'
                          "
                          class="h-4 w-4 shrink-0"
                          :class="
                            tableSort.key === column.key ? 'text-[#102372]' : 'text-slate-400'
                          "
                        />
                      </button>
                    </div>
                  </div>
                  <div v-if="filteredRows.length" class="equipment-table-body">
                    <article
                      v-for="row in visibleRows"
                      :key="equipmentKey(row)"
                      :style="tableGridStyle"
                      class="table-grid min-h-[92px] items-center border-b border-[#e5eaf1] py-3 last:border-b-0 hover:bg-[#fafcff]"
                    >
                      <div class="flex min-w-0 items-center gap-3 pr-4">
                        <span
                          class="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[#edf0f5] text-[#29456f]"
                          aria-hidden="true"
                        >
                          <img
                            v-if="loadedVehicleImages.includes(getVehicleImage(row))"
                            :src="getVehicleImage(row)"
                            alt=""
                            width="48"
                            height="48"
                            class="h-12 w-12 object-contain"
                            loading="lazy"
                            decoding="async"
                            @error="markVehicleImageFailed(getVehicleImage(row))"
                          />
                          <SvgIcon v-else name="vehiculos" class="h-6 w-6" />
                        </span>
                        <div class="min-w-0">
                          <strong class="block truncate text-[16px] font-black text-[#102372]">{{
                            row.name
                          }}</strong
                          ><span
                            class="mt-1 block truncate text-[15px] font-semibold text-[#526b94]"
                            :title="row.company"
                            >{{ row.company }}</span
                          >
                          <span class="mt-1 block text-[12px] font-medium text-slate-400"
                            ><UnreportedCopyImei :imei="String(row.imei)"
                          /></span>
                          <span
                            v-if="row.workshopReminder"
                            class="mt-1 block text-[13px] font-bold text-amber-800"
                          >
                            {{ row.workshopReminder.label }} ·
                            {{ followUpDateLabel(row.workshopReminder.releaseDate) }}
                          </span>
                          <span
                            v-if="
                              equipmentSection === 'history' &&
                              row.mode === 'active' &&
                              !row.archived
                            "
                            class="mt-1 block text-[13px] font-bold text-red-700"
                            >Actualmente sin reportar</span
                          >
                        </div>
                      </div>
                      <div
                        v-if="visibleColumnKeys.includes('historyTotal')"
                        class="pr-3 text-[17px] font-bold text-[#102372]"
                      >
                        {{ row.completedCount }}
                        <p
                          v-if="row.completedCount !== row.totalCompletedCount"
                          class="mt-1 text-[13px] font-normal text-[#526b94]"
                        >
                          de {{ row.totalCompletedCount }} en total
                        </p>
                      </div>
                      <div
                        v-if="visibleColumnKeys.includes('historyLatest')"
                        class="pr-3 text-[15px] text-[#526b94]"
                      >
                        {{ formatReportAt(row.lastRecoveryAt) }}
                      </div>
                      <div v-if="visibleColumnKeys.includes('review')" class="min-w-0 pr-3">
                        <span
                          class="inline-flex rounded px-2 py-1 text-[12px] font-bold"
                          :class="
                            row.followUp === 'field_review'
                              ? 'bg-blue-50 text-blue-700'
                              : row.followUp === 'no_visit'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-800'
                          "
                          >{{
                            row.followUp === "field_review"
                              ? "Requiere visita"
                              : row.followUp === "no_visit"
                                ? "No necesita visita"
                                : "Pendiente de confirmar"
                          }}</span
                        >
                        <span
                          v-if="row.lastConsultation"
                          class="mt-1 block truncate text-[14px] text-slate-500"
                          :title="row.lastConsultation.author"
                          >{{ row.lastConsultation.author }}</span
                        >
                      </div>
                      <div v-if="visibleColumnKeys.includes('silence')" class="min-w-0 pr-4">
                        <strong
                          class="block text-[17px] font-black"
                          :class="
                            row.followUp === 'field_review' ? 'text-red-700' : 'text-[#102372]'
                          "
                          >{{ row.duration }}</strong
                        >
                      </div>
                      <div
                        v-if="visibleColumnKeys.includes('report')"
                        class="min-w-0 pr-3 text-[15px] text-[#526b94]"
                      >
                        <span class="block">{{ splitReportDate(row.lastReport)[0] }}</span>
                        <span class="mt-1 block">{{ splitReportDate(row.lastReport)[1] }}</span>
                      </div>
                      <div v-if="visibleColumnKeys.includes('consultation')" class="min-w-0 pr-4">
                        <strong class="block text-[15px] font-black text-[#102372]">{{
                          row.lastConsultation
                            ? situationLabel(row.lastConsultation.situation)
                            : "Sin consultar"
                        }}</strong>
                        <span
                          v-if="row.lastConsultation"
                          class="mt-1 block text-[15px] text-[#526b94]"
                          >{{ formatReportAt(row.lastConsultation.createdAt) }}
                          <span
                            v-if="row.lastConsultation.nextCallDate"
                            class="block mt-1 font-bold"
                            :class="
                              row.lastConsultation.nextCallDate <= localFollowUpDate(observedNow)
                                ? 'text-red-700'
                                : ''
                            "
                          >
                            {{
                              row.lastConsultation.nextCallDate <= localFollowUpDate(observedNow)
                                ? "Llamada pendiente"
                                : "Proxima llamada"
                            }}:
                            {{ followUpDateLabel(row.lastConsultation.nextCallDate) }}
                          </span>
                          <span v-if="row.lastConsultation.visitResult" class="block mt-1"
                            >Visita: {{ visitResultLabel(row.lastConsultation.visitResult) }}</span
                          >
                        </span>
                      </div>
                      <div class="flex flex-col items-center gap-1 py-2">
                        <button
                          type="button"
                          class="module-button row-action-button"
                          :disabled="!lifecycle.allowed(row, equipmentContext)"
                          @click="
                            equipmentSection === 'history'
                              ? (selectedHistoryKey = equipmentKey(row))
                              : openOperation(row)
                          "
                        >
                          {{
                            equipmentSection === "history" ? "Ver desconexiones" : "Revisar equipo"
                          }}
                        </button>
                      </div>
                    </article>
                  </div>
                  <div
                    v-else
                    class="grid min-h-[120px] flex-1 place-items-center text-[12px] font-bold text-slate-400"
                  >
                    {{
                      equipmentSection === "history"
                        ? "No hay equipos con desconexiones para esta busqueda"
                        : "No se encontraron equipos"
                    }}
                  </div>
                </div>
              </div>
              <footer
                class="table-pagination mt-auto flex min-h-14 shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[#dfe6ef] px-4 py-2"
              >
                <span class="text-[15px] font-medium text-[#526b94]"
                  >Mostrando {{ firstRow }} a {{ lastRow }} de
                  {{ filteredRows.length }} equipos</span
                >
                <div class="flex flex-wrap items-center gap-2">
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
                  <span class="text-[14px] font-semibold text-[#102372]" aria-live="polite"
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
    :company-contact="operationCompanyContact"
    :vehicle-image="getVehicleImage(operationRow)"
    :demo="isDevelopment"
    @close="closeOperation"
    @consultation="saveConsultation"
    @edit-consultation="editConsultation"
    @delete-consultation="deleteConsultation"
    @simulate="simulateReport(operationRow)"
  />
</template>

<script setup>
import {
  computed,
  defineAsyncComponent,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue"
import SvgIcon from "../components/icons/SvgIcon.vue"
import { workshopReminder } from "../utils/unreported/unreportedWorkshop.js"
import UnreportedCopyImei from "../components/unreported/UnreportedCopyImei.vue"
import UnreportedHistoryDetail from "../components/unreported/UnreportedHistoryDetail.vue"
import { useCompaniesService } from "../services/companies/useCompaniesService.js"
import { resolveUnreportedCompanyContact } from "../utils/unreported/unreportedCompanyContact.js"
import {
  groupHistoryEquipment,
  countHistoryEquipment,
  filterHistoryEquipment,
} from "../utils/unreported/unreportedHistorySearch.js"
import { buildUnreportedEquipment } from "../services/unreported/unreportedAssetsSource.js"
import { compareUnreportedColumn } from "../utils/unreported/unreportedSorting.js"
import { knownEquipmentWithHistory } from "../utils/unreported/unreportedHistory.js"
import { useActivosService } from "../services/activos/useActivosService.js"
import { getAssetImageMarkerVariant } from "../composables/activos/map/assetMarkers/assetMarkerIcons.js"
import {
  buildUnreportedAssetImageIndex,
  unreportedAssetImageKey,
} from "../utils/unreported/unreportedAssetImages.js"
import { useUnreportedPagination } from "../composables/unreported/useUnreportedPagination.js"
import { useAuthSession } from "../composables/auth/useAuthSession.js"
import { useAccessControl } from "../composables/auth/useAccessControl.js"
import {
  equipmentKey,
  useUnreportedLifecycleStore,
  parseUnreportedTimestamp,
} from "../services/unreported/unreportedLifecycleStore.js"
import { readStorageValue, writeStorageValue } from "../services/storage/browserStorage.js"
import { describeUnreportedDiagnosis } from "../utils/unreported/unreportedDiagnosis.js"
import {
  connectivityLabel,
  followUpLabel,
  consultationSituations,
  currentConsultations,
  localFollowUpDate,
  followUpDateLabel,
  visitResultLabel,
  matchesSilenceDays,
  matchesConsultation,
  compareUnreportedPriority,
} from "../utils/unreported/unreportedFlow.js"
const situationLabel = (value) =>
  consultationSituations.find((option) => option.value === value)?.label || "Sin confirmar"

const UnreportedOperationModal = defineAsyncComponent(
  () => import("../components/unreported/UnreportedOperationModal.vue"),
)
const { currentUser } = useAuthSession()
const { accessibleCompanies, visibleAssets, isPlatformAdmin } = useAccessControl()
const equipmentContext = computed(() => ({
  user: currentUser.value,
  companies: accessibleCompanies.value.map((company) => company.name),
}))
const { companyRecords } = useCompaniesService()
const operationCompanyContact = computed(() => {
  const company = operationRow.value?.company
  if (!company || !equipmentContext.value.companies.includes(company))
    return { name: "", phone: "", href: "" }
  return resolveUnreportedCompanyContact(companyRecords.value, company)
})
const tableSort = ref({ key: "", direction: "asc" })
const toggleTableSort = (key) => {
  const current = tableSort.value
  tableSort.value =
    current.key !== key
      ? { key, direction: "asc" }
      : current.direction === "asc"
        ? { key, direction: "desc" }
        : { key: "", direction: "asc" }
}
const equipmentSection = ref("active")
const equipmentSections = [
  { id: "active", label: "Equipos sin reportar" },
  { id: "history", label: "Historial de desconexiones" },
]
const lifecycle = useUnreportedLifecycleStore()
const cachedThreshold = Number(readStorageValue("sinergy-unreported-threshold-hours"))
const silenceThresholdHours = ref([1, 6, 12, 24].includes(cachedThreshold) ? cachedThreshold : 6)
const observedNow = ref(Date.now())
const operationRow = ref(null),
  flowError = ref(""),
  flowNotice = ref("")
const searchTerm = ref("")
const filtersExpanded = ref(false)
const historyPeriod = ref("all")
const historySituation = ref("all")
const historyDuration = ref("all")
const historyReview = ref("all")
const historyEpisodeFilters = computed(() => ({
  situation: historySituation.value,
  duration: historyDuration.value,
  review: historyReview.value,
}))
const historyFrom = ref("")
const historyTo = ref("")
const selectedHistoryKey = ref("")
const historyDateError = computed(
  () =>
    historyPeriod.value === "custom" &&
    historyFrom.value &&
    historyTo.value &&
    historyFrom.value > historyTo.value,
)
const historyRange = computed(() => {
  if (historyPeriod.value === "custom") return { from: historyFrom.value, to: historyTo.value }
  if (historyPeriod.value === "all") return { from: "", to: "" }
  const date = new Date(observedNow.value)
  const local = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date)
  const parts = Object.fromEntries(local.map((item) => [item.type, item.value]))
  const end = `${parts.year}-${parts.month}-${parts.day}`
  const start = new Date(end + "T12:00:00Z")
  start.setUTCDate(start.getUTCDate() - (historyPeriod.value === "month" ? 30 : 90))
  return { from: start.toISOString().slice(0, 10), to: end }
})
const activeTableColumns = [
  { key: "equipment", label: "Equipo / empresa", locked: true, width: 240, track: "1.35fr" },
  { key: "review", label: "Revision en terreno", width: 190, track: "1.1fr" },
  { key: "silence", label: "Tiempo sin reportar", width: 160, track: "0.85fr" },
  { key: "report", label: "Ultimo reporte", width: 160, track: "0.9fr" },
  { key: "consultation", label: "Ultima consulta", width: 180, track: "1fr" },
  { key: "actions", label: "Acciones", locked: true, width: 160, track: "160px" },
]
const historyTableColumns = [
  { key: "equipment", label: "Equipo / empresa", width: 280, track: "1.6fr" },
  { key: "historyTotal", label: "Desconexiones terminadas", width: 190, track: "1fr" },
  { key: "historyLatest", label: "Volvio a reportar", width: 210, track: "1fr" },
  { key: "actions", label: "Acciones", width: 200, track: "200px" },
]
const tableColumns = computed(() =>
  equipmentSection.value === "history" ? historyTableColumns : activeTableColumns,
)
const visibleColumnKeys = computed(() => tableColumns.value.map((column) => column.key))
const tableGridStyle = computed(() => ({
  gridTemplateColumns: tableColumns.value
    .map((column) =>
      column.track.endsWith("fr") ? `minmax(${column.width}px, ${column.track})` : column.track,
    )
    .join(" "),
}))
const tableMinimumWidth = computed(() =>
  tableColumns.value.reduce(
    (total, column) => total + column.width,
    32 + (tableColumns.value.length - 1) * 12,
  ),
)
const splitReportDate = (value) => String(value || "").split(/,\s*/)

const activeStatus = ref("all")
const selectedFollowUp = ref("all")
const selectedConsultation = ref("all")
const isDevelopment = import.meta.env.DEV
const loadedVehicleImages = ref([])
const { activos: imageAssets } = useActivosService()
const vehicleImageIndex = computed(() =>
  buildUnreportedAssetImageIndex(
    imageAssets.value,
    companyRecords.value.filter((company) =>
      equipmentContext.value.companies.includes(company.name),
    ),
  ),
)
const getVehicleImage = (row) => {
  const asset = vehicleImageIndex.value.get(unreportedAssetImageKey(row.company, row.imei))
  return getAssetImageMarkerVariant(asset || {})?.url || ""
}
const vehicleImageSources = computed(() => [
  ...new Set(
    [{}, ...vehicleImageIndex.value.values()]
      .filter(Boolean)
      .map((asset) => getAssetImageMarkerVariant(asset)?.url)
      .filter(Boolean),
  ),
])
const markVehicleImageFailed = (source) => {
  loadedVehicleImages.value = loadedVehicleImages.value.filter((image) => image !== source)
}
let imagesMounted = false
const selectedCompany = ref("all")
const selectedSilence = ref("all")
const customSilenceDays = ref(1)
const customSilenceError = computed(
  () =>
    !Number.isInteger(customSilenceDays.value) ||
    customSilenceDays.value < 1 ||
    customSilenceDays.value > 3650,
)
const isRefreshing = ref(false)
const isExporting = ref(false)
const exportError = ref("")
const exportExcel = async () => {
  if (isExporting.value || !filteredRows.value.length) return
  exportError.value = ""
  isExporting.value = true
  try {
    const exportHistory = equipmentSection.value === "history"
    const equipmentToExport =
      exportHistory && selectedHistoryEquipment.value
        ? [selectedHistoryEquipment.value]
        : filteredRows.value
    const exportContext = {
      history: exportHistory,
      observedAt: new Date(observedNow.value).toISOString(),
      reportWidthPx:
        typeof window === "undefined"
          ? 1800
          : Math.max(1800, window.screen?.availWidth || window.innerWidth),
      filterDescription: [
        selectedCompany.value === "all" ? "Todas las empresas" : selectedCompany.value,
        ...(exportHistory && historyRange.value.from ? [`Desde: ${historyRange.value.from}`] : []),
        ...(exportHistory && historyRange.value.to ? [`Hasta: ${historyRange.value.to}`] : []),
        ...(exportHistory && historySituation.value !== "all"
          ? [
              `Motivo: ${historySituation.value === "none" ? "Sin consulta" : situationLabel(historySituation.value)}`,
            ]
          : []),
        ...(exportHistory && historyDuration.value !== "all"
          ? [`Duracion: mas de ${historyDuration.value.replace("d", "")} dias`]
          : []),
        ...(exportHistory && historyReview.value !== "all"
          ? [
              `Revision en terreno: ${historyReview.value === "yes" ? "Si" : "No se solicito, con consulta"}`,
            ]
          : []),
        ...(searchTerm.value.trim() ? [`Busqueda: ${searchTerm.value.trim()}`] : []),
        ...(!exportHistory && selectedSilence.value !== "all"
          ? [
              selectedSilence.value === "unknown"
                ? "Sin fecha conocida"
                : `Sin reportar: ${selectedSilence.value === "custom" ? customSilenceDays.value : selectedSilence.value.replace("d", "")} dias o mas`,
            ]
          : []),
      ].join(" | "),
    }
    const { prepareUnreportedExcelRows, exportUnreportedExcel } =
      await import("../services/unreported/unreportedExcelWorkerClient.js")
    const exportRows = prepareUnreportedExcelRows(equipmentToExport, { history: exportHistory })
    await exportUnreportedExcel(exportRows, exportContext)
  } catch {
    exportError.value = "No fue posible exportar los equipos. Intenta nuevamente."
  } finally {
    isExporting.value = false
  }
}
const sourceEquipment = computed(() =>
  buildUnreportedEquipment(visibleAssets.value, accessibleCompanies.value),
)
const authorizedEquipment = computed(() =>
  knownEquipmentWithHistory(sourceEquipment.value, lifecycle.records.value).filter(
    (row) =>
      lifecycle.allowed(row, equipmentContext.value) && (!row.archived || isPlatformAdmin.value),
  ),
)
const isUnreportedEquipment = (row) =>
  row.mode === "active" &&
  !row.archived &&
  !(row.hasUndatedReport && !row.lastSeenAt && row.sourceStatus !== "offline")
const companyOptions = computed(() => [
  ...new Set(
    (equipmentSection.value === "active"
      ? trackedRows.value.filter(isUnreportedEquipment)
      : authorizedEquipment.value
    ).map((row) => row.company),
  ),
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
    const status = row.archived
      ? "Sin dato actual"
      : row.hasUndatedReport && !record.lastSeenAt
        ? "Fecha de reporte desconocida"
        : connectivityLabel(record)
    return {
      ...row,
      ...record,
      status,
      telemetry,
      followUp: ["field_review", "no_visit"].includes(record.followUp)
        ? record.followUp
        : "pending",
      followUpLabel: followUpLabel(record),
      lastConsultation: currentConsultations(record).at(-1),
      workshopReminder: workshopReminder(record, observedNow.value),
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
      badgeTone: row.archived
        ? "bg-slate-100 text-slate-600"
        : ["recovered", "reporting"].includes(record.mode)
          ? "bg-emerald-50 text-emerald-700"
          : status === "Nunca reporto"
            ? "bg-slate-100 text-slate-600"
            : "bg-red-50 text-red-600",
    }
  }),
)
const historySourceRows = computed(() => [
  ...authorizedEquipment.value.map((row) => {
    const record = lifecycle.records.value[equipmentKey(row)] || {}
    return {
      ...row,
      ...record,
      status: row.archived
        ? "Sin dato actual"
        : row.hasUndatedReport && !record.lastSeenAt
          ? "Fecha de reporte desconocida"
          : connectivityLabel(record),
      lastConsultation: record.consultations?.at(-1),
    }
  }),
])
const historyRows = computed(() => {
  if (equipmentSection.value !== "history") return []
  const candidates = filterHistoryEquipment(
    historySourceRows.value,
    searchTerm.value,
    selectedCompany.value,
  )
  return groupHistoryEquipment(
    candidates,
    historyRange.value.from,
    historyRange.value.to,
    historyEpisodeFilters.value,
  ).map((row) => ({
    ...row,
    lastReport: row.lastSeenAt
      ? formatReportAt(row.lastSeenAt)
      : row.demo
        ? row.lastReport
        : "Sin reporte",
  }))
})
watch(companyOptions, (companies) => {
  if (selectedCompany.value !== "all" && !companies.includes(selectedCompany.value))
    selectedCompany.value = "all"
})
const sectionCounts = computed(() => ({
  active: trackedRows.value.filter(
    (row) =>
      isUnreportedEquipment(row) &&
      (selectedCompany.value === "all" || row.company === selectedCompany.value),
  ).length,
  history: countHistoryEquipment(
    filterHistoryEquipment(historySourceRows.value, "", selectedCompany.value),
    historyRange.value.from,
    historyRange.value.to,
    historyEpisodeFilters.value,
  ),
}))
const observeReports = () => {
  observedNow.value = Date.now()
  try {
    lifecycle.observe(
      authorizedEquipment.value.filter(
        (row) => !(row.hasUndatedReport && !row.lastReport && row.sourceStatus !== "offline"),
      ),
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
watch(
  equipmentSection,
  () => {
    selectedHistoryKey.value = ""
    tableSort.value = { key: "", direction: "asc" }
    activeStatus.value = "all"
    selectedFollowUp.value = "all"
    selectedConsultation.value = "all"
    selectedSilence.value = "all"
  },
  { flush: "sync" },
)
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
  imagesMounted = true
  watch(
    vehicleImageSources,
    (sources) => {
      for (const source of sources) {
        if (loadedVehicleImages.value.includes(source)) continue
        const preview = new Image()
        preview.onload = async () => {
          try {
            if (typeof preview.decode === "function") await preview.decode()
          } catch {
            // A loaded image may still render when decoding is unsupported.
          }
          if (imagesMounted) loadedVehicleImages.value = [...loadedVehicleImages.value, source]
        }
        preview.src = source
      }
    },
    { immediate: true },
  )
  monitorTimer = window.setInterval(observeReports, 60000)
})
onBeforeUnmount(() => {
  imagesMounted = false
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
const simulateDisconnection = (row) => {
  try {
    lifecycle.simulateDisconnection(row, equipmentContext.value, silenceThresholdHours.value)
    clearFilters()
    selectedCompany.value = row.company
    searchTerm.value = String(row.imei)
    equipmentSection.value = "active"
    selectedHistoryKey.value = ""
    flowError.value = ""
    flowNotice.value = "Nueva desconexion simulada. La anterior sigue guardada en el historial."
  } catch (error) {
    flowError.value = error.message
  }
}
const simulateReport = async (row) => {
  flowError.value = ""
  try {
    const received = lifecycle.receiveReport(
      row,
      equipmentContext.value,
      new Date().toISOString(),
      silenceThresholdHours.value,
    )
    if (!received) {
      flowError.value = "El reporte simulado no es posterior al ultimo reporte guardado."
      return
    }
    observeReports()
    if (flowError.value) return
    searchTerm.value = String(row.imei)
    selectedCompany.value = row.company
    historyPeriod.value = "all"
    historySituation.value = "all"
    historyDuration.value = "all"
    historyReview.value = "all"
    historyFrom.value = ""
    historyTo.value = ""
    equipmentSection.value = "history"
    tableSort.value = { key: "", direction: "asc" }
    await nextTick()
    selectedHistoryKey.value = equipmentKey(row)
    flowError.value = ""
    flowNotice.value =
      "Reporte simulado guardado. Abre la fila para ver el detalle. No es telemetria real."
  } catch (error) {
    flowError.value = error.message
  }
}
const saveConsultation = (data) => {
  try {
    lifecycle.addConsultation(operationRow.value, data, equipmentContext.value)
    flowError.value = ""
  } catch (error) {
    flowError.value = error.message
  }
}
const editConsultation = (data) => {
  try {
    lifecycle.editConsultation(operationRow.value, data.id, data, equipmentContext.value)
    flowError.value = ""
  } catch (error) {
    flowError.value = error.message
  }
}
const deleteConsultation = (id) => {
  try {
    lifecycle.deleteConsultation(operationRow.value, id, equipmentContext.value)
    flowError.value = ""
  } catch (error) {
    flowError.value = error.message
  }
}
const clearFilters = () => {
  customSilenceDays.value = 1
  historySituation.value = "all"
  historyDuration.value = "all"
  historyReview.value = "all"
  historyPeriod.value = "all"
  historyFrom.value = ""
  historyTo.value = ""
  tableSort.value = { key: "", direction: "asc" }
  searchTerm.value = ""
  selectedCompany.value = "all"
  selectedSilence.value = "all"
  activeStatus.value = "all"
  selectedFollowUp.value = "all"
  selectedConsultation.value = "all"
}
const refreshData = async () => {
  if (isRefreshing.value) return

  isRefreshing.value = true
  flowError.value = ""
  flowNotice.value = ""
  try {
    await nextTick()
    observeReports()
    if (!flowError.value) flowNotice.value = "Listado actualizado."
  } finally {
    isRefreshing.value = false
  }
}
const filteredRows = computed(() => {
  const isHistory = equipmentSection.value === "history"
  const matches = isHistory
    ? historyRows.value
    : filterHistoryEquipment(trackedRows.value, searchTerm.value, selectedCompany.value).filter(
        (row) =>
          isUnreportedEquipment(row) &&
          matchesSilenceDays(row, selectedSilence.value, customSilenceDays.value) &&
          matchesConsultation(row, selectedConsultation.value) &&
          (selectedFollowUp.value === "all" || row.followUp === selectedFollowUp.value) &&
          (activeStatus.value === "all" || row.status === activeStatus.value),
      )
  if (tableSort.value.key)
    return [...matches].sort(
      (a, b) =>
        (!isHistory ? Number(!!b.workshopReminder) - Number(!!a.workshopReminder) : 0) ||
        compareUnreportedColumn(a, b, tableSort.value.key, tableSort.value.direction),
    )
  return [...matches].sort(
    equipmentSection.value === "history"
      ? (a, b) => compareUnreportedColumn(a, b, "historyLatest", "desc")
      : compareUnreportedPriority,
  )
})
const selectedHistoryEquipment = computed(() =>
  equipmentSection.value === "history"
    ? filteredRows.value.find((row) => equipmentKey(row) === selectedHistoryKey.value) || null
    : null,
)
const { pageSize, currentPage, totalPages, visibleRows, firstRow, lastRow, changePage } =
  useUnreportedPagination(filteredRows, [
    searchTerm,
    selectedCompany,
    selectedSilence,
    customSilenceDays,
    activeStatus,
    selectedFollowUp,
    selectedConsultation,
    equipmentSection,
    tableSort,
    historyPeriod,
    historySituation,
    historyDuration,
    historyReview,
    historyFrom,
    historyTo,
  ])
watch(
  [
    searchTerm,
    selectedCompany,
    historyPeriod,
    historyFrom,
    historyTo,
    historySituation,
    historyDuration,
    historyReview,
  ],
  () => {
    selectedHistoryKey.value = ""
  },
  { flush: "sync" },
)
</script>

<style scoped>
.table-sort-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 36px;
  width: 100%;
  text-align: left;
  font: inherit;
  color: inherit;
  cursor: pointer;
}
.table-sort-button:hover {
  color: #102372;
}
.table-sort-button:focus-visible {
  outline: 3px solid #2563eb;
  outline-offset: 2px;
  border-radius: 4px;
}

.extra-filters summary {
  cursor: pointer;
  color: #102372;
  font-size: 16px;
  font-weight: 700;
  padding-block: 10px;
}

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
  font-size: 16px;
  font-weight: 900;
  box-shadow: 0 2px 6px rgb(15 35 80 / 6%);
}
.module-button--primary {
  border-color: #102372;
  background: #102372;
  color: #fff;
}
.module-button.row-action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 44px;
  padding: 0 12px;
  white-space: nowrap;
  line-height: 1.25;
  font-size: 15px;
  font-weight: 700;
}
.filter-field {
  display: grid;
  gap: 0.4rem;
  color: #64748b;
  font-size: 14px;
  font-weight: 700;
  text-transform: none;
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
  gap: 22px;
  padding: 1rem;
}
@media (min-width: 1024px) and (max-height: 700px) {
  .unreported-filter-fields {
    gap: 10px;
    padding-block: 12px;
  }
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
    height: 44px;
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
  font-size: 16px;
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
  grid-template-columns: 1.35fr 1.1fr 0.85fr 0.9fr 1fr 160px;
  padding-right: 1rem;
  padding-left: 1rem;
}
.equipment-table-body {
  display: block;
}
.equipment-table-body > article {
  height: auto;
  min-height: 92px;
}
.table-grid > div {
  min-width: 0;
}
.filters-toggle {
  display: none;
}
@media (max-width: 1279px) {
  .filters-toggle {
    display: inline-flex;
    align-items: center;
  }
  .unreported-filters {
    display: none;
  }
  .unreported-filters.filters-expanded {
    display: block;
    max-height: 35vh;
    overflow: auto;
  }
  .unreported-workspace {
    grid-template-rows: minmax(0, 1fr);
  }
  .unreported-workspace.filters-open {
    grid-template-rows: auto minmax(0, 1fr);
  }
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

.module-button:focus-visible,
.page-button:focus-visible,
.unreported-tab:focus-visible,
.filter-field input:focus-visible,
.filter-field select:focus-visible,
summary:focus-visible {
  outline: 3px solid #2563eb;
  outline-offset: 3px;
}
.module-button {
  min-height: 44px;
}
.unreported-tab {
  min-height: 48px;
}
.table-grid strong,
.table-grid span {
  overflow-wrap: anywhere;
}
.table-grid .truncate {
  white-space: normal;
  overflow: visible;
  text-overflow: clip;
}
.table-grid {
  column-gap: 12px;
}
</style>
