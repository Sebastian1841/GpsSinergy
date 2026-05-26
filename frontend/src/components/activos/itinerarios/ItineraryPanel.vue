<template>
  <section class="flex h-full min-h-0 flex-col overflow-hidden bg-[#f8fafc]">
    <!-- Filtros compartidos -->
    <header class="shrink-0 border-b border-[#d8dee8] bg-white p-2">
      <!-- Menú interno: solo cambia el contenido inferior -->
      <div class="mb-2 grid grid-cols-2 gap-1 rounded-lg border border-[#d8dee8] bg-[#f8fafc] p-1">
        <button
          type="button"
          class="flex h-8 min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded-md px-2 text-[10px] font-black transition"
          :class="
            activePanelView === 'itinerarios'
              ? 'bg-[#102372] text-white shadow-sm'
              : 'text-[#102372] hover:bg-white hover:text-[#FF6600]'
          "
          @click="activePanelView = 'itinerarios'"
        >
          <span class="truncate">Itinerarios</span>

          <span
            class="rounded px-1.5 py-0.5 text-[9px] font-black"
            :class="
              activePanelView === 'itinerarios'
                ? 'bg-white/15 text-white'
                : 'bg-[#102372]/10 text-[#102372]'
            "
          >
            {{ filteredAssets.length }}
          </span>

          <span
            v-if="selectedAssetIds.length"
            class="rounded px-1.5 py-0.5 text-[9px] font-black"
            :class="
              activePanelView === 'itinerarios'
                ? 'bg-[#FF6600] text-white'
                : 'bg-[#FF6600]/10 text-[#FF6600]'
            "
          >
            {{ selectedAssetIds.length }} sel.
          </span>
        </button>

        <button
          type="button"
          class="flex h-8 min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded-md px-2 text-[10px] font-black transition"
          :class="
            activePanelView === 'resumen-dia'
              ? 'bg-[#102372] text-white shadow-sm'
              : 'text-[#102372] hover:bg-white hover:text-[#FF6600]'
          "
          @click="activePanelView = 'resumen-dia'"
        >
          <span class="truncate">Resumen del día</span>

          <span
            v-if="routeResult?.rows?.length"
            class="rounded px-1.5 py-0.5 text-[9px] font-black"
            :class="
              activePanelView === 'resumen-dia'
                ? 'bg-white/15 text-white'
                : 'bg-[#102372]/10 text-[#102372]'
            "
          >
            {{ routeResult.rows.length }}
          </span>
        </button>
      </div>

      <div class="space-y-2">
        <!-- Buscador + selector de dispositivos + acciones -->
        <section class="relative">
          <div class="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-1.5">
            <div
              class="flex h-8 min-w-0 overflow-hidden rounded-lg border border-[#d8dee8] bg-white transition focus-within:border-[#FF6600] focus-within:ring-2 focus-within:ring-[#FF6600]/15"
            >
              <div class="relative min-w-0 flex-1">
                <span
                  class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-slate-400"
                >
                  ⌕
                </span>

                <input
                  v-model="searchTerm"
                  type="text"
                  placeholder="Buscar patente, dispositivo o conductor..."
                  class="h-full w-full bg-transparent pl-8 pr-7 text-[11px] font-semibold text-[#172033] outline-none placeholder:text-slate-400"
                  @focus="openDeviceDropdown"
                  @click="openDeviceDropdown"
                  @input="openDeviceDropdown"
                />

                <button
                  v-if="searchTerm"
                  type="button"
                  class="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer text-base leading-none text-slate-400 transition hover:text-[#FF6600]"
                  @click="clearSearchTerm"
                >
                  ×
                </button>
              </div>

              <div class="my-1.5 w-px shrink-0 bg-[#edf1f5]"></div>

              <button
                type="button"
                class="flex h-full w-[124px] shrink-0 cursor-pointer items-center justify-between gap-1.5 px-2 text-left transition hover:bg-[#fff7ed]"
                :title="selectedAssetsSummary"
                @click="showDeviceList = !showDeviceList"
              >
                <span
                  class="min-w-0 truncate text-[9.5px] font-black uppercase tracking-[0.06em] text-slate-500"
                >
                  {{ selectedAssetsSummary }}
                </span>

                <span
                  class="shrink-0 text-[11px] font-black text-[#102372] transition"
                  :class="showDeviceList ? 'rotate-180' : ''"
                >
                  ▾
                </span>
              </button>
            </div>

            <button
              type="button"
              class="h-8 shrink-0 cursor-pointer rounded-lg bg-[#102372] px-3 text-[10px] font-black text-white transition hover:bg-[#0c1b59]"
              @click="searchItinerary"
            >
              Buscar
            </button>

            <button
              type="button"
              class="h-8 shrink-0 cursor-pointer rounded-lg border border-[#d8dee8] bg-white px-3 text-[10px] font-black text-[#102372] transition hover:border-[#FF6600] hover:text-[#FF6600]"
              @click="clearResult"
            >
              Limpiar
            </button>
          </div>

          <div
            v-if="showDeviceList"
            class="absolute left-0 right-0 top-[36px] z-30 overflow-hidden rounded-lg border border-[#d8dee8] bg-white shadow-xl"
          >
            <div
              class="flex items-center justify-between gap-2 border-b border-[#edf1f5] bg-[#f8fafc] px-2 py-1.5"
            >
              <p class="truncate text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">
                Selección de dispositivos
              </p>

              <div class="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  class="h-7 cursor-pointer rounded-md px-2 text-[10px] font-black text-[#102372] transition hover:bg-[#102372]/10"
                  @click="selectAllVisibleAssets"
                >
                  Todos
                </button>

                <button
                  type="button"
                  class="h-7 cursor-pointer rounded-md px-2 text-[10px] font-black text-slate-500 transition hover:bg-slate-100 hover:text-[#FF6600]"
                  @click="clearSelectedAssets"
                >
                  Quitar
                </button>
              </div>
            </div>

            <div class="max-h-[180px] overflow-auto">
              <button
                v-for="asset in filteredAssets"
                :key="asset.id"
                type="button"
                class="grid w-full cursor-pointer grid-cols-[20px_minmax(0,1fr)_auto] items-center gap-2 border-b border-[#edf1f5] px-2 py-1.5 text-left transition last:border-b-0 hover:bg-[#f8fafc]"
                :class="isAssetSelected(asset.id) ? 'bg-[#fff7ed]' : 'bg-white'"
                @click="toggleAsset(asset)"
              >
                <span
                  class="flex h-4 w-4 items-center justify-center rounded border text-[10px] font-black transition"
                  :class="
                    isAssetSelected(asset.id)
                      ? 'border-[#FF6600] bg-[#FF6600] text-white'
                      : 'border-[#cbd5e1] bg-white text-transparent'
                  "
                >
                  ✓
                </span>

                <span class="min-w-0">
                  <span class="flex min-w-0 items-center gap-1.5">
                    <span
                      class="h-2 w-2 shrink-0 rounded-full"
                      :class="statusDotClass(asset.estado)"
                    ></span>

                    <span class="truncate text-[11px] font-black text-[#102372]">
                      {{ asset.patente }}
                    </span>
                  </span>

                  <span class="block truncate text-[10px] font-semibold text-slate-500">
                    {{ asset.deviceId }} · {{ asset.conductor || "Sin conductor" }}
                  </span>
                </span>

                <span
                  class="shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-black ring-1"
                  :class="statusChipClass(asset.estado)"
                >
                  {{ statusLabel(asset.estado) }}
                </span>
              </button>

              <div v-if="!filteredAssets.length" class="px-3 py-4 text-center">
                <p class="text-[11px] font-black text-[#102372]">Sin dispositivos</p>

                <p class="mt-1 text-[10px] font-semibold text-slate-500">No hay coincidencias.</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Fechas compartidas -->
        <div class="grid grid-cols-4 gap-1 rounded-lg border border-[#d8dee8] bg-[#f8fafc] p-1">
          <button
            v-for="option in rangeOptions"
            :key="option.value"
            type="button"
            class="cursor-pointer rounded-md px-2 py-1.5 text-[10px] font-black transition"
            :class="
              dateRange === option.value
                ? 'bg-[#102372] text-white shadow-sm'
                : 'text-[#102372] hover:bg-white hover:text-[#FF6600]'
            "
            @click="setDateRange(option.value)"
          >
            {{ option.label }}
          </button>
        </div>

        <div v-if="dateRange === 'custom'" class="grid grid-cols-2 gap-2">
          <input
            v-model="fromDate"
            type="date"
            class="h-8 rounded-lg border border-[#d8dee8] bg-white px-2 text-[11px] font-semibold text-[#172033] outline-none transition focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/15"
          />

          <input
            v-model="toDate"
            type="date"
            class="h-8 rounded-lg border border-[#d8dee8] bg-white px-2 text-[11px] font-semibold text-[#172033] outline-none transition focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/15"
          />
        </div>

        <div
          v-if="formError"
          class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-bold text-red-700"
        >
          {{ formError }}
        </div>
      </div>
    </header>

    <!-- Contenido variable -->
    <main class="min-h-0 flex-1 overflow-auto p-2">
      <div v-if="routeResult && activePanelView === 'itinerarios'" class="space-y-2">
        <ItinerarySummary :summary="routeResult.summary" />

        <div
          v-if="!routeResult.rows.length"
          class="rounded-lg border border-dashed border-[#cbd5e1] bg-white px-3 py-4 text-center"
        >
          <p class="text-[11px] font-black text-[#102372]">Sin puntos GPS para este rango</p>

          <p class="mt-1 text-[10px] font-semibold text-slate-500">
            Cambia la fecha o selecciona otro dispositivo.
          </p>
        </div>

        <ItineraryTable
          v-else
          :rows="routeResult.rows"
          :selected-point-id="selectedPointId"
          @select-point="selectPoint"
        />
      </div>

      <ItineraryDaySummary
        v-else-if="routeResult && activePanelView === 'resumen-dia'"
        :summary="routeResult.summary"
        :rows="routeResult.rows"
        :selected-assets="selectedAssets"
        :selected-assets-summary="selectedAssetsSummary"
        :range-label="activeRangeLabel"
      />

      <div
        v-else
        class="flex min-h-[180px] flex-col items-center justify-center rounded-lg border border-dashed border-[#cbd5e1] bg-white p-4 text-center"
      >
        <h3 class="text-[12px] font-black text-[#102372]">
          {{ activePanelView === "resumen-dia" ? "Sin resumen cargado" : "Sin recorrido cargado" }}
        </h3>

        <p class="mt-1 max-w-[230px] text-[10px] font-semibold leading-relaxed text-slate-500">
          Los filtros son compartidos. Selecciona dispositivos y presiona buscar.
        </p>

        <button
          type="button"
          class="mt-3 h-8 cursor-pointer rounded-lg bg-[#102372] px-4 text-[10px] font-black text-white transition hover:bg-[#0c1b59]"
          @click="searchItinerary"
        >
          {{ activePanelView === "resumen-dia" ? "Buscar resumen" : "Buscar recorrido" }}
        </button>
      </div>
    </main>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue"

import ItineraryDaySummary from "./ItineraryDaySummary.vue"
import ItinerarySummary from "./ItinerarySummary.vue"
import ItineraryTable from "./ItineraryTable.vue"

import {
  addDays,
  buildItineraryResult,
  filterItineraryPoints,
  getLatestItineraryDate,
  mockItineraryAssets,
} from "../../../data/mockItineraryData"

const props = defineProps({
  activos: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(["route-selected", "point-selected", "clear-route"])

const latestDate = getLatestItineraryDate()

const rangeOptions = [
  {
    value: "today",
    label: "Hoy",
  },
  {
    value: "yesterday",
    label: "Ayer",
  },
  {
    value: "week",
    label: "7 días",
  },
  {
    value: "custom",
    label: "Fecha",
  },
]

const activePanelView = ref("itinerarios")
const searchTerm = ref("")
const selectedAssetIds = ref([])
const showDeviceList = ref(false)
const dateRange = ref("today")
const fromDate = ref(latestDate)
const toDate = ref(latestDate)
const routeResult = ref(null)
const selectedPointId = ref(null)
const formError = ref("")

const getFirstDefined = (...values) => {
  return values.find((value) => {
    return value !== undefined && value !== null && value !== ""
  })
}

const normalizeText = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
}

const activeRangeLabel = computed(() => {
  if (dateRange.value === "custom") {
    return `${fromDate.value || "-"} / ${toDate.value || "-"}`
  }

  return rangeOptions.find((option) => option.value === dateRange.value)?.label || "Hoy"
})

const normalizedAssets = computed(() => {
  const fromProps = props.activos.map((activo) => ({
    id: activo.id,
    patente: activo.vehiculo || activo.patente || activo.name || `Activo ${activo.id}`,
    deviceId: activo.imei || activo.deviceId || activo.identificador || "Sin dispositivo",
    conductor: activo.conductor || activo.ibutton_name || activo.ibuttonName || "Sin conductor",
    estado: activo.estado || "offline",

    // Ubicación actual del dispositivo
    lat: getFirstDefined(activo.lat, activo.latitude, activo.latitud),
    lng: getFirstDefined(activo.lng, activo.lon, activo.longitude, activo.longitud),
    speed: getFirstDefined(activo.speed, activo.velocidad, activo.velocidad_kmh, 0),
    direccion: getFirstDefined(activo.direccion, activo.address, activo.direccion_actual),
    lastReport: getFirstDefined(
      activo.last_report,
      activo.lastReport,
      activo.timestamp,
      activo.updated_at,
      activo.datosUlt,
    ),
    odometer: getFirstDefined(activo.odometer, activo.odometro, activo.kilometraje),
  }))

  return mockItineraryAssets.map((itineraryAsset) => {
    const matchingCurrentAsset = fromProps.find((activo) => {
      const samePatente = normalizeText(activo.patente) === normalizeText(itineraryAsset.patente)

      const sameDevice = normalizeText(activo.deviceId) === normalizeText(itineraryAsset.deviceId)

      return samePatente || sameDevice
    })

    if (!matchingCurrentAsset) {
      return itineraryAsset
    }

    return {
      ...itineraryAsset,

      // Mantiene el ID del itinerario para que filterItineraryPoints siga funcionando
      id: itineraryAsset.id,

      // Guarda el ID real del activo del mapa
      activoId: matchingCurrentAsset.id,

      // Mantiene datos descriptivos del itinerario
      patente: itineraryAsset.patente,
      deviceId: itineraryAsset.deviceId,
      conductor: itineraryAsset.conductor,

      // Toma estado y ubicación actual desde activos
      estado: matchingCurrentAsset.estado || itineraryAsset.estado,
      lat: matchingCurrentAsset.lat,
      lng: matchingCurrentAsset.lng,
      speed: matchingCurrentAsset.speed,
      direccion: matchingCurrentAsset.direccion || itineraryAsset.direccion,
      lastReport: matchingCurrentAsset.lastReport || itineraryAsset.last_report,
      odometer: matchingCurrentAsset.odometer,
    }
  })
})

const filteredAssets = computed(() => {
  const term = searchTerm.value.trim().toLowerCase()

  if (!term) return normalizedAssets.value

  return normalizedAssets.value.filter((asset) => {
    return (
      asset.patente?.toLowerCase().includes(term) ||
      asset.deviceId?.toLowerCase().includes(term) ||
      asset.conductor?.toLowerCase().includes(term)
    )
  })
})

const selectedAssets = computed(() => {
  const selected = new Set(selectedAssetIds.value)

  return normalizedAssets.value.filter((asset) => selected.has(asset.id))
})

const selectedAssetsSummary = computed(() => {
  if (!selectedAssets.value.length) {
    return "Seleccionar dispositivos"
  }

  if (selectedAssets.value.length === 1) {
    const asset = selectedAssets.value[0]
    return `${asset.patente} · ${asset.deviceId}`
  }

  const labels = selectedAssets.value
    .slice(0, 2)
    .map((asset) => asset.patente)
    .join(", ")

  const remaining = selectedAssets.value.length - 2

  return remaining > 0 ? `${labels} +${remaining} más` : labels
})

const primarySelectedAsset = computed(() => {
  return selectedAssets.value[0] || filteredAssets.value[0] || null
})

const isAssetSelected = (assetId) => {
  return selectedAssetIds.value.includes(assetId)
}

const openDeviceDropdown = () => {
  showDeviceList.value = true
}

const clearSearchTerm = () => {
  searchTerm.value = ""
  showDeviceList.value = true
}

const toggleAsset = (asset) => {
  formError.value = ""

  if (isAssetSelected(asset.id)) {
    selectedAssetIds.value = selectedAssetIds.value.filter((id) => id !== asset.id)
    return
  }

  selectedAssetIds.value = [...selectedAssetIds.value, asset.id]
}

const selectAllVisibleAssets = () => {
  const ids = filteredAssets.value.map((asset) => asset.id)
  selectedAssetIds.value = [...new Set([...selectedAssetIds.value, ...ids])]
  formError.value = ""
}

const clearSelectedAssets = () => {
  selectedAssetIds.value = []
  formError.value = ""
}

const setDateRange = (range) => {
  dateRange.value = range
  applyDateRange()
}

const applyDateRange = () => {
  if (dateRange.value === "custom") return

  if (dateRange.value === "today") {
    fromDate.value = latestDate
    toDate.value = latestDate
    return
  }

  if (dateRange.value === "yesterday") {
    const yesterday = addDays(latestDate, -1)
    fromDate.value = yesterday
    toDate.value = yesterday
    return
  }

  if (dateRange.value === "week") {
    fromDate.value = addDays(latestDate, -6)
    toDate.value = latestDate
  }
}

const validateSearch = () => {
  formError.value = ""

  if (!selectedAssetIds.value.length && !filteredAssets.value.length) {
    formError.value = "Selecciona al menos un dispositivo disponible."
    return false
  }

  if (!fromDate.value || !toDate.value) {
    formError.value = "Selecciona una fecha de inicio y término."
    return false
  }

  if (fromDate.value > toDate.value) {
    formError.value = "La fecha inicial no puede ser mayor que la fecha final."
    return false
  }

  return true
}

const parseNumberFromLabel = (label) => {
  if (!label) return 0

  const value = String(label)
    .replace(",", ".")
    .match(/[\d.]+/)

  return value ? Number(value[0]) || 0 : 0
}

const parseMinutesFromLabel = (label) => {
  if (!label) return 0

  const text = String(label).toLowerCase()
  const hours = text.match(/(\d+(?:[.,]\d+)?)\s*h/)
  const minutes = text.match(/(\d+(?:[.,]\d+)?)\s*min/)

  const parsedHours = hours ? Number(hours[1].replace(",", ".")) || 0 : 0
  const parsedMinutes = minutes ? Number(minutes[1].replace(",", ".")) || 0 : 0

  if (!hours && !minutes) {
    return parseNumberFromLabel(text)
  }

  return parsedHours * 60 + parsedMinutes
}

const formatDistance = (value) => {
  return `${value.toFixed(1).replace(".", ",")} km`
}

const formatMinutes = (value) => {
  const total = Math.round(value)
  const hours = Math.floor(total / 60)
  const minutes = total % 60

  if (hours <= 0) return `${minutes} min`
  if (minutes <= 0) return `${hours} h`

  return `${hours} h ${minutes} min`
}

const getCurrentReferenceDate = () => {
  return latestDate
}

const hasValidAssetLocation = (asset) => {
  const lat = Number(asset?.lat)
  const lng = Number(asset?.lng)

  return Number.isFinite(lat) && Number.isFinite(lng)
}

const isCurrentDateInsideRange = () => {
  const currentDate = getCurrentReferenceDate()

  return fromDate.value <= currentDate && currentDate <= toDate.value
}

const shouldAppendCurrentLocation = (asset) => {
  return isCurrentDateInsideRange() && hasValidAssetLocation(asset)
}

const getCurrentLocationTimestamp = (asset) => {
  const currentDate = getCurrentReferenceDate()
  const fallbackTimestamp = `${currentDate}T23:59:59`

  if (!asset?.lastReport) return fallbackTimestamp

  const lastReportDate = new Date(asset.lastReport)

  if (Number.isNaN(lastReportDate.getTime())) {
    return fallbackTimestamp
  }

  const assetReportDay = String(asset.lastReport).slice(0, 10)

  if (assetReportDay < currentDate) {
    return fallbackTimestamp
  }

  return asset.lastReport
}

const buildCurrentLocationPoint = (asset) => {
  return {
    id: `${asset.id}-current-location`,
    assetId: asset.id,
    timestamp: getCurrentLocationTimestamp(asset),
    lat: Number(asset.lat),
    lng: Number(asset.lng),
    speed: Number(asset.speed) || 0,
    address: asset.direccion || "Ubicación actual",
    event: "Ubicación actual",
    odometer: asset.odometer || null,
    isCurrentLocation: true,
  }
}

const areSameCoordinates = (pointA, pointB) => {
  if (!pointA || !pointB) return false

  const latA = Number(pointA.lat)
  const lngA = Number(pointA.lng)
  const latB = Number(pointB.lat)
  const lngB = Number(pointB.lng)

  if (![latA, lngA, latB, lngB].every(Number.isFinite)) return false

  return Math.abs(latA - latB) < 0.000001 && Math.abs(lngA - lngB) < 0.000001
}

const appendCurrentLocationIfNeeded = ({ asset, points }) => {
  if (!shouldAppendCurrentLocation(asset)) return points

  const currentPoint = buildCurrentLocationPoint(asset)
  const lastPoint = points[points.length - 1]

  if (areSameCoordinates(lastPoint, currentPoint)) {
    return [
      ...points.slice(0, -1),
      {
        ...lastPoint,
        ...currentPoint,
      },
    ]
  }

  return [...points, currentPoint]
}

const getRoutePointsForAsset = (asset) => {
  const historicalPoints = filterItineraryPoints({
    assetId: asset.id,
    fromDate: fromDate.value,
    toDate: toDate.value,
  })

  return appendCurrentLocationIfNeeded({
    asset,
    points: historicalPoints,
  })
}

const buildMultipleRouteResult = (assets) => {
  const routes = assets.map((asset) => {
    const points = getRoutePointsForAsset(asset)

    return buildItineraryResult({
      asset,
      points,
    })
  })

  const rows = routes
    .flatMap((route) => {
      return route.rows.map((row) => ({
        ...row,
        id: `${route.asset.id}-${row.id}`,
        assetId: route.asset.id,
        assetPatente: route.asset.patente,
        assetDeviceId: route.asset.deviceId,
      }))
    })
    .sort((a, b) => {
      const dateA = new Date(a.timestamp || a.date || a.fecha || 0).getTime()
      const dateB = new Date(b.timestamp || b.date || b.fecha || 0).getTime()

      return dateA - dateB
    })

  const totalDistance = routes.reduce((total, route) => {
    return total + parseNumberFromLabel(route.summary?.distanceLabel)
  }, 0)

  const totalMovingMinutes = routes.reduce((total, route) => {
    return total + parseMinutesFromLabel(route.summary?.movingLabel)
  }, 0)

  const primaryAsset = assets[0]

  if (assets.length === 1) {
    return routes[0]
  }

  return {
    id: `multi-${assets.map((asset) => asset.id).join("-")}`,
    asset: {
      ...primaryAsset,
      id: primaryAsset.id,
      patente: `${assets.length} dispositivos`,
      deviceId: "Selección múltiple",
      conductor: `${assets.length} rutas combinadas`,
      estado: "moving",
    },
    assets,
    routes,
    rows,
    summary: {
      ...(routes[0]?.summary || {}),
      distanceLabel: formatDistance(totalDistance),
      movingLabel: formatMinutes(totalMovingMinutes),
      pointsCount: rows.length,
      assetsCount: assets.length,
    },
  }
}

const searchItinerary = () => {
  applyDateRange()

  if (!selectedAssetIds.value.length && filteredAssets.value.length) {
    selectedAssetIds.value = [filteredAssets.value[0].id]
  }

  if (!validateSearch()) {
    routeResult.value = null
    selectedPointId.value = null
    emit("clear-route")
    return
  }

  const assets = selectedAssets.value.length
    ? selectedAssets.value
    : [primarySelectedAsset.value].filter(Boolean)

  routeResult.value = buildMultipleRouteResult(assets)
  selectedPointId.value = null
  showDeviceList.value = false
  emitRouteToMap()
}

const emitRouteToMap = () => {
  if (!routeResult.value) return

  emit("route-selected", routeResult.value)
}

const selectPoint = (point) => {
  selectedPointId.value = point.id

  emit("point-selected", {
    point,
    route: routeResult.value,
  })
}

const clearResult = () => {
  routeResult.value = null
  selectedPointId.value = null
  formError.value = ""
  emit("clear-route")
}

const statusLabel = (estado) => {
  const labels = {
    moving: "Ruta",
    idle: "Espera",
    stopped: "Alerta",
    offline: "Offline",
  }

  return labels[estado] || "Sin estado"
}

const statusDotClass = (estado) => {
  const classes = {
    moving: "bg-emerald-500",
    idle: "bg-sky-500",
    stopped: "bg-red-500",
    offline: "bg-slate-400",
  }

  return classes[estado] || "bg-slate-400"
}

const statusChipClass = (estado) => {
  const classes = {
    moving: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    idle: "bg-sky-50 text-sky-700 ring-sky-200",
    stopped: "bg-red-50 text-red-700 ring-red-200",
    offline: "bg-slate-100 text-slate-500 ring-slate-200",
  }

  return classes[estado] || "bg-slate-100 text-slate-500 ring-slate-200"
}

watch(dateRange, () => {
  applyDateRange()
})

watch(
  filteredAssets,
  (assets) => {
    if (!assets.length) {
      selectedAssetIds.value = []
      return
    }

    const availableIds = new Set(normalizedAssets.value.map((asset) => asset.id))
    selectedAssetIds.value = selectedAssetIds.value.filter((id) => availableIds.has(id))

    if (!selectedAssetIds.value.length) {
      selectedAssetIds.value = [assets[0].id]
    }
  },
  { immediate: true },
)

onMounted(() => {
  applyDateRange()
})
</script>
