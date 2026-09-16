<template>
  <section class="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#eef2f7]">
    <!-- BARRA COMPACTA DE FILTROS + RESUMEN -->
    <div
      class="flex shrink-0 flex-wrap items-center gap-2 border-b border-[#d8dee8] bg-[#f8fafc] px-3 py-2"
    >
      <label class="relative min-w-[135px] flex-1">
        <span
          class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-[0.04em] text-[#64748b]"
        >
          Estado
        </span>

        <select
          v-model="selectedStatus"
          class="h-9 w-full cursor-pointer appearance-none rounded-lg border border-[#d8dee8] bg-white pl-[62px] pr-8 text-[12px] font-black text-[#102372] outline-none transition hover:border-[#9eb3d1] focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/10"
        >
          <option value="active">Activas</option>
          <option value="resolved">Resueltas</option>
          <option value="all">Todas</option>
        </select>

        <svg
          viewBox="0 0 24 24"
          class="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#64748b]"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="m8 10 4 4 4-4"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </label>

      <label class="relative min-w-[145px] flex-1">
        <span
          class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-[0.04em] text-[#64748b]"
        >
          Tipo
        </span>

        <select
          v-model="selectedType"
          class="h-9 w-full cursor-pointer appearance-none rounded-lg border border-[#d8dee8] bg-white pl-[47px] pr-8 text-[12px] font-black text-[#102372] outline-none transition hover:border-[#9eb3d1] focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/10"
        >
          <option value="all">Todos</option>

          <option v-for="type in availableTypes" :key="type" :value="type">
            {{ type }}
          </option>
        </select>

        <svg
          viewBox="0 0 24 24"
          class="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#64748b]"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="m8 10 4 4 4-4"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </label>

      <button
        v-if="hasLocalFilters"
        type="button"
        class="inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-[#d8dee8] bg-white px-3 text-[11px] font-black text-[#49658f] transition hover:border-[#ff6600] hover:text-[#ff6600]"
        @click="clearFilters"
      >
        Limpiar
      </button>
    </div>

    <!-- RESUMEN COMPACTO -->
    <div
      class="flex shrink-0 items-center overflow-x-auto border-b border-[#d8dee8] bg-white px-3 py-2"
    >
      <div class="fleet-alert-summary-item">
        <span>Total</span>
        <strong>{{ summary.total }}</strong>
      </div>

      <span class="fleet-alert-summary-divider"></span>

      <div class="fleet-alert-summary-item">
        <span>Activas</span>
        <strong>{{ summary.active }}</strong>
      </div>

      <span class="fleet-alert-summary-divider"></span>

      <div class="fleet-alert-summary-item">
        <span>Críticas</span>
        <strong>{{ summary.critical }}</strong>
      </div>

      <span class="fleet-alert-summary-divider"></span>

      <div class="fleet-alert-summary-item">
        <span>Resueltas</span>
        <strong>{{ summary.resolved }}</strong>
      </div>
    </div>

    <!-- TABLA -->
    <div
      v-if="filteredAlertRows.length"
      class="flex min-h-0 flex-1 flex-col overflow-hidden bg-white"
    >
      <div class="min-h-0 flex-1 overflow-auto">
        <table class="w-full min-w-[680px] table-fixed border-collapse">
          <colgroup>
            <col class="w-[31%]" />
            <col class="w-[16%]" />
            <col class="w-[16%]" />
            <col class="w-[13%]" />
            <col class="w-[24%]" />
          </colgroup>

          <thead class="sticky top-0 z-10">
            <tr class="border-b border-[#d8dee8] bg-[#f4f7fb]">
              <th class="fleet-alert-th">Alerta</th>

              <th class="fleet-alert-th">Activo</th>

              <th class="fleet-alert-th">Tipo</th>

              <th class="fleet-alert-th">Fecha</th>

              <th class="fleet-alert-th text-right">Acción</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="alert in paginatedAlertRows"
              :key="alert.id"
              class="group h-[70px] border-b border-[#e7ebf1] transition last:border-b-0 hover:bg-[#f8fafc]"
            >
              <!-- ALERTA -->
              <td class="px-3 py-2 align-middle">
                <div class="flex min-w-0 items-start gap-2">
                  <span
                    class="mt-[5px] h-2.5 w-2.5 shrink-0 rounded-full"
                    :class="getStatusDotClass(alert)"
                  ></span>

                  <div class="min-w-0 flex-1">
                    <p
                      class="truncate text-[12px] font-black leading-5 text-[#102372]"
                      :title="alert.title || 'Alerta'"
                    >
                      {{ alert.title || "Alerta" }}
                    </p>

                    <p class="fleet-alert-reason mt-0.5" :title="getAlertReason(alert)">
                      <span>Motivo:</span>
                      {{ getAlertReason(alert) }}
                    </p>
                  </div>
                </div>
              </td>

              <!-- ACTIVO -->
              <td class="px-3 py-2 align-middle">
                <div class="min-w-0">
                  <p
                    class="truncate text-[10px] font-black leading-4 text-[#102372]"
                    :title="alert.assetPlate || '-'"
                  >
                    {{ alert.assetPlate || "-" }}
                  </p>

                  <p
                    class="truncate text-[10px] font-semibold leading-4 text-[#64748b]"
                    :title="alert.assetName || '-'"
                  >
                    {{ alert.assetName || "-" }}
                  </p>
                </div>
              </td>

              <!-- TIPO + UBICACIÓN -->
              <td class="px-3 py-2 align-middle">
                <div class="min-w-0">
                  <p
                    class="truncate text-[11px] font-bold leading-4 text-[#102372]"
                    :title="getTypeLabel(alert)"
                  >
                    {{ getTypeLabel(alert) }}
                  </p>

                  <p
                    class="flex min-w-0 items-center gap-1 truncate text-[10px] font-semibold leading-4 text-[#64748b]"
                    :title="getLocationText(alert)"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      class="h-3 w-3 shrink-0 text-[#8495af]"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M12 21s6-4.35 6-10.2a6 6 0 1 0-12 0C6 16.65 12 21 12 21Z"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linejoin="round"
                      />
                      <circle cx="12" cy="10.5" r="2" stroke="currentColor" stroke-width="1.8" />
                    </svg>

                    <span class="truncate">
                      {{ getLocationText(alert) }}
                    </span>
                  </p>
                </div>
              </td>

              <!-- FECHA + ESTADO -->
              <td class="px-3 py-2 align-middle">
                <div class="flex min-w-0 flex-col items-start gap-1">
                  <div class="min-w-0">
                    <p class="whitespace-nowrap text-[11px] font-black leading-4 text-[#102372]">
                      {{ formatDate(getAlertDate(alert)) }}
                    </p>

                    <p class="mt-0.5 whitespace-nowrap text-[10px] font-semibold text-[#64748b]">
                      {{ formatTime(getAlertDate(alert)) }}
                    </p>
                  </div>

                  <span
                    class="inline-flex rounded px-1.5 py-0.5 text-[10px] font-black uppercase leading-none"
                    :class="getStatusChipClass(alert)"
                  >
                    {{ getStatusLabel(alert) }}
                  </span>
                </div>
              </td>

              <!-- ACCIÓN -->
              <td class="px-3 py-2 text-right align-middle">
                <div class="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    class="inline-flex h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-[#102372] bg-white px-3 text-[10px] font-black text-[#102372] transition hover:border-[#ff6600] hover:text-[#ff6600]"
                    title="Ver recorrido"
                    @click="emit('view-alert-route', alert)"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      class="h-3.5 w-3.5 shrink-0"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M4 6.5 9 4l6 2.5 5-2.5v13.5L15 20l-6-2.5-5 2.5V6.5Z"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M9 4v13.5M15 6.5V20"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                      />
                    </svg>

                    <span>Recorrido</span>
                  </button>

                  <button
                    v-if="canManageAlerts && !isResolved(alert)"
                    type="button"
                    class="fleet-alert-action-primary"
                    title="Resolver alerta"
                    @click="handleResolveAlert(alert)"
                  >
                    Resolver
                  </button>

                  <button
                    v-else-if="canManageAlerts"
                    type="button"
                    class="fleet-alert-action-secondary"
                    title="Reabrir alerta"
                    @click="handleReopenAlert(alert)"
                  >
                    Reabrir
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- PAGINACIÓN -->
      <footer
        class="flex min-h-[42px] shrink-0 flex-wrap items-center justify-between gap-2 border-t border-[#d8dee8] bg-[#f8fafc] px-3 py-1.5"
      >
        <div class="flex min-w-0 items-center gap-3">
          <p class="whitespace-nowrap text-[10px] font-bold text-[#64748b]">
            <span class="font-black text-[#102372]">
              {{ paginationStart }}-{{ paginationEnd }}
            </span>
            de
            <span class="font-black text-[#102372]">
              {{ filteredAlertRows.length }}
            </span>
          </p>

          <span class="h-4 w-px bg-[#d8dee8]"></span>

          <label class="flex items-center gap-1.5">
            <span class="whitespace-nowrap text-[10px] font-bold text-[#64748b]"> Filas </span>

            <select
              v-model.number="pageSize"
              class="h-8 cursor-pointer rounded-md border border-[#d8dee8] bg-white px-2 text-[10px] font-black text-[#102372] outline-none focus:border-[#ff6600]"
            >
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
            </select>
          </label>
        </div>

        <div class="flex items-center gap-1">
          <button
            type="button"
            class="pagination-button"
            :disabled="currentPage === 1"
            aria-label="Página anterior"
            @click="previousPage"
          >
            <svg viewBox="0 0 24 24" class="h-3 w-3" fill="none" aria-hidden="true">
              <path
                d="m14 7-5 5 5 5"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>

          <button
            v-for="page in visiblePages"
            :key="page"
            type="button"
            class="pagination-button"
            :class="{
              'border-[#102372] bg-[#102372] text-white': page === currentPage,
            }"
            @click="currentPage = page"
          >
            {{ page }}
          </button>

          <button
            type="button"
            class="pagination-button"
            :disabled="currentPage === totalPages"
            aria-label="Página siguiente"
            @click="nextPage"
          >
            <svg viewBox="0 0 24 24" class="h-3 w-3" fill="none" aria-hidden="true">
              <path
                d="m10 7 5 5-5 5"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>
      </footer>
    </div>

    <!-- SIN RESULTADOS -->
    <div
      v-else
      class="flex min-h-0 flex-1 flex-col items-center justify-center bg-white px-5 text-center"
    >
      <div
        class="flex h-10 w-10 items-center justify-center rounded-full bg-[#f1f5f9] text-[#64748b]"
      >
        <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" aria-hidden="true">
          <path
            d="M12 4.5 4.75 18h14.5L12 4.5ZM12 9v4M12 16h.01"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>

      <p class="mt-3 text-[12px] font-black text-[#102372]">Sin alertas para mostrar</p>

      <p class="mt-1 max-w-sm text-[11px] font-semibold leading-5 text-[#64748b]">
        No hay alertas visibles para los activos autorizados o no coinciden con los filtros
        seleccionados.
      </p>

      <button
        v-if="hasLocalFilters"
        type="button"
        class="mt-3 h-8 rounded-lg border border-[#102372] bg-white px-3 text-[10px] font-black text-[#102372] transition hover:border-[#ff6600] hover:text-[#ff6600]"
        @click="clearFilters"
      >
        Limpiar filtros
      </button>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from "vue"

const props = defineProps({
  alertRows: {
    type: Array,
    default: () => [],
  },
  alertSummary: {
    type: Object,
    default: () => ({}),
  },
  canManageAlerts: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(["view-alert-route", "resolve-alert", "reopen-alert"])

const DEFAULT_STATUS_FILTER = "active"

const selectedStatus = ref(DEFAULT_STATUS_FILTER)
const selectedType = ref("all")

const currentPage = ref(1)
const pageSize = ref(10)

const dateFormatter = new Intl.DateTimeFormat("es-CL", {
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
})

const timeFormatter = new Intl.DateTimeFormat("es-CL", {
  hour: "numeric",
  minute: "2-digit",
})

const summary = computed(() => {
  return {
    total: Number(props.alertSummary.total || 0),
    active: Number(props.alertSummary.active || 0),
    critical: Number(props.alertSummary.critical || 0),
    resolved: Number(props.alertSummary.resolved || 0),
  }
})

const getAlertDate = (alert) => {
  return alert?.createdAt || alert?.triggeredAt || alert?.date || ""
}

const getTypeLabel = (alert) => {
  return alert?.typeLabel || alert?.type || "Sin tipo"
}

const getAlertReason = (alert) => {
  return alert?.triggerReason || alert?.description || getTypeLabel(alert)
}

const isResolved = (alert) => {
  return (
    String(alert?.status || "")
      .trim()
      .toLowerCase() === "resolved"
  )
}

const getStatusLabel = (alert) => {
  if (alert?.statusLabel) return alert.statusLabel

  return isResolved(alert) ? "Resuelta" : "Activa"
}

const getStatusDotClass = (alert) => {
  return isResolved(alert) ? "bg-[#16a34a]" : "bg-[#ef1b23]"
}

const getStatusChipClass = (alert) => {
  return isResolved(alert) ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
}

const getLocationText = (alert) => {
  const metadata = alert?.metadata || {}

  return (
    metadata.address ||
    metadata.location ||
    metadata.geofence ||
    metadata.route ||
    metadata.zone ||
    alert?.location ||
    alert?.address ||
    "Sin ubicación"
  )
}

const availableTypes = computed(() => {
  return [
    ...new Set(
      props.alertRows
        .map((alert) => getTypeLabel(alert))
        .filter((type) => type && type !== "Sin tipo"),
    ),
  ].sort((firstType, secondType) => {
    return firstType.localeCompare(secondType, "es", {
      sensitivity: "base",
    })
  })
})

const hasLocalFilters = computed(() => {
  return selectedStatus.value !== DEFAULT_STATUS_FILTER || selectedType.value !== "all"
})

const filteredAlertRows = computed(() => {
  const rows = props.alertRows.filter((alert) => {
    const matchesStatus =
      selectedStatus.value === "all" ||
      (selectedStatus.value === "resolved" && isResolved(alert)) ||
      (selectedStatus.value === "active" && !isResolved(alert))

    const matchesType = selectedType.value === "all" || getTypeLabel(alert) === selectedType.value

    return matchesStatus && matchesType
  })

  return [...rows].sort((firstAlert, secondAlert) => {
    const firstTimestamp = new Date(getAlertDate(firstAlert)).getTime()
    const secondTimestamp = new Date(getAlertDate(secondAlert)).getTime()

    const safeFirstTimestamp = Number.isFinite(firstTimestamp) ? firstTimestamp : 0

    const safeSecondTimestamp = Number.isFinite(secondTimestamp) ? secondTimestamp : 0

    return safeSecondTimestamp - safeFirstTimestamp
  })
})

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredAlertRows.value.length / pageSize.value))
})

const paginatedAlertRows = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value
  const endIndex = startIndex + pageSize.value

  return filteredAlertRows.value.slice(startIndex, endIndex)
})

const paginationStart = computed(() => {
  if (!filteredAlertRows.value.length) return 0

  return (currentPage.value - 1) * pageSize.value + 1
})

const paginationEnd = computed(() => {
  return Math.min(currentPage.value * pageSize.value, filteredAlertRows.value.length)
})

const visiblePages = computed(() => {
  const pageCount = totalPages.value

  if (pageCount <= 5) {
    return Array.from({ length: pageCount }, (_, index) => index + 1)
  }

  const startPage = Math.max(1, Math.min(currentPage.value - 2, pageCount - 4))

  return Array.from({ length: 5 }, (_, index) => startPage + index)
})

const formatDate = (value) => {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return "-"

  return dateFormatter.format(date)
}

const formatTime = (value) => {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return "-"

  return timeFormatter.format(date)
}

const clearFilters = () => {
  selectedStatus.value = DEFAULT_STATUS_FILTER
  selectedType.value = "all"
  currentPage.value = 1
}

const handleResolveAlert = (alert) => {
  selectedStatus.value = DEFAULT_STATUS_FILTER
  emit("resolve-alert", alert)
}

const handleReopenAlert = (alert) => {
  emit("reopen-alert", alert)
}

const previousPage = () => {
  currentPage.value = Math.max(1, currentPage.value - 1)
}

const nextPage = () => {
  currentPage.value = Math.min(totalPages.value, currentPage.value + 1)
}

watch([selectedStatus, selectedType, pageSize], () => {
  currentPage.value = 1
})

watch(totalPages, (nextTotalPages) => {
  if (currentPage.value > nextTotalPages) {
    currentPage.value = nextTotalPages
  }
})

watch(
  () => props.alertRows.length,
  () => {
    if (currentPage.value > totalPages.value) {
      currentPage.value = totalPages.value
    }
  },
)
</script>

<style scoped>
.fleet-alert-summary-item {
  display: flex;
  min-width: 0;
  flex: 1 1 0%;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0 0.5rem;
  white-space: nowrap;
}

.fleet-alert-summary-item span {
  overflow: hidden;
  font-size: 10px;
  font-weight: 900;
  text-overflow: ellipsis;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
}

.fleet-alert-summary-item strong {
  font-size: 16px;
  line-height: 1;
  font-weight: 900;
  color: #102372;
}

.fleet-alert-summary-divider {
  display: block;
  width: 1px;
  height: 18px;
  flex: 0 0 auto;
  background: #d8dee8;
}

.fleet-alert-th {
  padding: 0.625rem 0.75rem;
  text-align: left;
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #5f7396;
}

.fleet-alert-reason {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  font-size: 10.5px;
  font-weight: 700;
  line-height: 1.4;
  color: #49658f;
}

.fleet-alert-reason span {
  font-weight: 900;
  color: #102372;
}

.fleet-alert-action-primary,
.fleet-alert-action-secondary {
  display: inline-flex;
  height: 2rem;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  border-radius: 0.5rem;
  padding: 0 0.75rem;
  font-size: 10px;
  font-weight: 900;
  transition:
    border-color 150ms ease,
    background-color 150ms ease,
    color 150ms ease;
}

.fleet-alert-action-primary {
  border: 1px solid #ff6600;
  background: #ff6600;
  color: #ffffff;
}

.fleet-alert-action-primary:hover {
  border-color: #e65c00;
  background: #e65c00;
}

.fleet-alert-action-secondary {
  border: 1px solid #d8dee8;
  background: #ffffff;
  color: #102372;
}

.fleet-alert-action-secondary:hover {
  border-color: #ff6600;
  color: #ff6600;
}

.pagination-button {
  display: inline-flex;
  height: 1.625rem;
  min-width: 1.625rem;
  align-items: center;
  justify-content: center;
  border: 1px solid #d8dee8;
  border-radius: 0.375rem;
  background: #ffffff;
  padding: 0 0.3rem;
  font-size: 10px;
  font-weight: 900;
  color: #102372;
  transition:
    border-color 150ms ease,
    background-color 150ms ease,
    color 150ms ease;
}

.pagination-button:hover:not(:disabled) {
  border-color: #ff6600;
  color: #ff6600;
}

.pagination-button:disabled {
  cursor: not-allowed;
  opacity: 0.35;
}
</style>
