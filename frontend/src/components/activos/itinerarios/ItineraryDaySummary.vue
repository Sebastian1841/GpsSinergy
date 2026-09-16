<template>
  <section class="space-y-2">
    <header class="overflow-hidden rounded-lg border border-[#cfd8e3] bg-white">
      <div
        class="flex items-center justify-between gap-2 border-b border-[#dfe5ed] bg-[#f8fafc] px-3 py-2"
      >
        <div class="min-w-0">
          <p class="text-[10px] font-black uppercase tracking-[0.12em] text-[#ff6600]">
            Resumen diario
          </p>

          <h3 class="mt-0.5 truncate text-[12px] font-black text-[#102372]">
            {{ selectedAssetsSummary || "Actividad por activo" }}
          </h3>
        </div>

        <span
          class="shrink-0 rounded-md bg-[#102372]/10 px-2 py-1 text-[10px] font-black text-[#102372]"
        >
          {{ rangeLabel }}
        </span>
      </div>

      <div class="flex flex-wrap items-center gap-1.5 px-3 py-2">
        <span
          v-for="asset in selectedAssets"
          :key="asset.id"
          class="inline-flex max-w-[150px] items-center gap-1 rounded border border-[#cfd8e3] bg-white px-2 py-1 text-[10px] font-semibold text-[#102372]"
          :title="getAssetLabel(asset)"
        >
          <span class="truncate">{{ getAssetLabel(asset) }}</span>
          <span class="text-slate-400">x</span>
        </span>

        <span
          v-if="!selectedAssets.length"
          class="rounded border border-dashed border-[#cfd8e3] bg-white px-2 py-1 text-[10px] font-semibold text-slate-500"
        >
          Sin activos seleccionados
        </span>
      </div>
    </header>

    <section class="grid grid-cols-2 gap-2 xl:grid-cols-4">
      <article
        v-for="metric in summaryMetrics"
        :key="metric.label"
        class="rounded-lg border border-[#d8dee8] bg-white p-3 shadow-sm"
      >
        <p class="text-[9px] font-black uppercase tracking-[0.1em] text-slate-500">
          {{ metric.label }}
        </p>

        <p class="mt-1 truncate text-[17px] font-black text-[#102372]">
          {{ metric.value }}
        </p>

        <p class="mt-0.5 truncate text-[10px] font-semibold text-slate-500">
          {{ metric.hint }}
        </p>
      </article>
    </section>

    <section class="grid gap-2 xl:grid-cols-[minmax(0,1.25fr)_260px]">
      <article class="rounded-lg border border-[#d8dee8] bg-white p-3 shadow-sm">
        <div class="mb-3 flex items-center justify-between gap-2">
          <div class="min-w-0">
            <h4 class="truncate text-[12px] font-black text-[#102372]">Ranking de recorrido</h4>

            <p class="mt-0.5 text-[10px] font-semibold text-slate-500">
              Comparacion visual por distancia recorrida.
            </p>
          </div>

          <span
            class="shrink-0 rounded-md bg-[#ff6600]/10 px-2 py-1 text-[10px] font-black text-[#ff6600]"
          >
            {{ chartRows.length }} activos
          </span>
        </div>

        <div v-if="chartRows.length">
          <div class="rounded-xl border border-[#dfe5ed] bg-white p-3">
            <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div class="min-w-0">
                <p class="text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">
                  Distancia recorrida por tiempo
                </p>

                <div
                  class="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-semibold text-slate-500"
                >
                  <span
                    v-for="row in chartRows.slice(0, 4)"
                    :key="`legend-${row.id}`"
                    class="inline-flex items-center gap-1.5"
                  >
                    <span
                      class="h-2 w-2 rounded-full"
                      :style="{ backgroundColor: getSeriesColor(row.seriesIndex) }"
                    ></span>
                    {{ row.assetLabel }}
                  </span>
                </div>
              </div>

              <div
                class="grid grid-cols-2 overflow-hidden rounded-lg border border-[#dfe5ed] bg-[#f8fafc] p-0.5"
              >
                <button
                  type="button"
                  class="h-7 cursor-pointer rounded-md px-2 text-[10px] font-black transition"
                  :class="
                    chartMode === 'accumulated'
                      ? 'bg-[#102372] text-white shadow-sm'
                      : 'text-[#102372] hover:bg-white'
                  "
                  @click="chartMode = 'accumulated'"
                >
                  Acumulada
                </button>

                <button
                  type="button"
                  class="h-7 cursor-pointer rounded-md px-2 text-[10px] font-black transition"
                  :class="
                    chartMode === 'segment'
                      ? 'bg-[#102372] text-white shadow-sm'
                      : 'text-[#102372] hover:bg-white'
                  "
                  @click="chartMode = 'segment'"
                >
                  Por tramo
                </button>
              </div>
            </div>

            <div class="h-[220px] sm:h-[260px]">
              <canvas ref="distanceChartCanvas" class="h-full w-full"></canvas>
            </div>
          </div>
        </div>

        <div
          v-else
          class="rounded-lg border border-dashed border-[#cfd8e3] bg-[#f8fafc] px-3 py-5 text-center text-[11px] font-semibold text-slate-500"
        >
          No hay distancia disponible para graficar.
        </div>
      </article>

      <aside class="rounded-lg border border-[#d8dee8] bg-white p-3 shadow-sm">
        <h4 class="text-[12px] font-black text-[#102372]">Jornada</h4>

        <dl class="mt-2 space-y-2">
          <div class="rounded-lg bg-[#f8fafc] px-3 py-2">
            <dt class="text-[9px] font-black uppercase tracking-[0.08em] text-slate-500">
              Primer inicio
            </dt>
            <dd class="mt-0.5 truncate text-[12px] font-black text-[#102372]">
              {{ earliestStartLabel }}
            </dd>
          </div>

          <div class="rounded-lg bg-[#f8fafc] px-3 py-2">
            <dt class="text-[9px] font-black uppercase tracking-[0.08em] text-slate-500">
              Ultimo cierre
            </dt>
            <dd class="mt-0.5 truncate text-[12px] font-black text-[#102372]">
              {{ latestEndLabel }}
            </dd>
          </div>
        </dl>
      </aside>
    </section>

    <section class="overflow-hidden rounded-lg border border-[#cfd8e3] bg-white shadow-sm">
      <div
        class="flex items-center justify-between gap-2 border-b border-[#dfe5ed] bg-[#102372] px-3 py-2"
      >
        <h4 class="text-[11px] font-black text-white">Detalle diario</h4>

        <span class="text-[10px] font-semibold text-white/70">
          {{ summaryRows.length }} {{ summaryRows.length === 1 ? "registro" : "registros" }}
        </span>
      </div>

      <div class="grid gap-2 p-2 md:hidden">
        <article
          v-for="summaryRow in summaryRows"
          :key="summaryRow.id"
          class="rounded-lg border border-[#d8dee8] bg-white p-3"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="truncate text-[12px] font-black text-[#102372]">
                {{ summaryRow.assetLabel }}
              </p>

              <p class="mt-0.5 text-[10px] font-semibold text-slate-500">
                {{ summaryRow.dateLabel }}
              </p>
            </div>

            <span
              class="shrink-0 rounded-md bg-[#102372]/10 px-2 py-1 text-[10px] font-black text-[#102372]"
            >
              {{ summaryRow.distanceLabel }}
            </span>
          </div>

          <dl class="mt-3 grid grid-cols-2 gap-2 border-t border-[#edf1f5] pt-3">
            <div>
              <dt class="text-[9px] font-black uppercase tracking-[0.08em] text-slate-400">
                Inicio
              </dt>
              <dd class="mt-0.5 text-[11px] font-bold text-slate-700">
                {{ summaryRow.startLabel }}
              </dd>
            </div>

            <div>
              <dt class="text-[9px] font-black uppercase tracking-[0.08em] text-slate-400">Fin</dt>
              <dd class="mt-0.5 text-[11px] font-bold text-slate-700">
                {{ summaryRow.endLabel }}
              </dd>
            </div>

            <div>
              <dt class="text-[9px] font-black uppercase tracking-[0.08em] text-slate-400">
                Movimiento
              </dt>
              <dd class="mt-0.5 text-[11px] font-bold text-slate-700">
                {{ summaryRow.movingLabel }}
              </dd>
            </div>

            <div>
              <dt class="text-[9px] font-black uppercase tracking-[0.08em] text-slate-400">GPS</dt>
              <dd class="mt-0.5 text-[11px] font-bold text-slate-700">
                {{ summaryRow.pointsLabel }}
              </dd>
            </div>
          </dl>
        </article>

        <div
          v-if="!summaryRows.length"
          class="px-3 py-8 text-center text-[11px] font-semibold text-slate-500"
        >
          No hay actividad para resumir en este rango.
        </div>
      </div>

      <div class="hidden overflow-auto md:block">
        <table class="min-w-full border-collapse text-left text-[10px]">
          <thead>
            <tr class="bg-[#f8fafc] text-[#102372]">
              <th class="border-b border-r border-[#dfe5ed] px-2 py-1.5 font-black">Activo</th>
              <th class="border-b border-r border-[#dfe5ed] px-2 py-1.5 font-black">Fecha</th>
              <th class="border-b border-r border-[#dfe5ed] px-2 py-1.5 font-black">Distancia</th>
              <th class="border-b border-r border-[#dfe5ed] px-2 py-1.5 font-black">Inicio</th>
              <th class="border-b border-r border-[#dfe5ed] px-2 py-1.5 font-black">Fin</th>
              <th class="border-b border-r border-[#dfe5ed] px-2 py-1.5 font-black">Movimiento</th>
              <th class="border-b border-[#dfe5ed] px-2 py-1.5 font-black">GPS</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="summaryRow in summaryRows" :key="summaryRow.id" class="hover:bg-[#fff7ed]">
              <td
                class="border-b border-r border-[#edf1f5] px-2 py-1.5 font-semibold text-[#102372]"
              >
                {{ summaryRow.assetLabel }}
              </td>
              <td class="border-b border-r border-[#edf1f5] px-2 py-1.5 text-slate-700">
                {{ summaryRow.dateLabel }}
              </td>
              <td class="border-b border-r border-[#edf1f5] px-2 py-1.5 font-black text-slate-700">
                {{ summaryRow.distanceLabel }}
              </td>
              <td class="border-b border-r border-[#edf1f5] px-2 py-1.5 text-slate-700">
                {{ summaryRow.startLabel }}
              </td>
              <td class="border-b border-r border-[#edf1f5] px-2 py-1.5 text-slate-700">
                {{ summaryRow.endLabel }}
              </td>
              <td class="border-b border-r border-[#edf1f5] px-2 py-1.5 text-slate-700">
                {{ summaryRow.movingLabel }}
              </td>
              <td class="border-b border-[#edf1f5] px-2 py-1.5 text-slate-700">
                {{ summaryRow.pointsLabel }}
              </td>
            </tr>

            <tr v-if="!summaryRows.length">
              <td
                colspan="7"
                class="px-3 py-8 text-center text-[11px] font-semibold text-slate-500"
              >
                No hay actividad para resumir en este rango.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue"

const props = defineProps({
  route: {
    type: Object,
    default: null,
  },
  rows: {
    type: Array,
    default: () => [],
  },
  selectedAssets: {
    type: Array,
    default: () => [],
  },
  selectedAssetsSummary: {
    type: String,
    default: "",
  },
  rangeLabel: {
    type: String,
    default: "Hoy",
  },
  fromDate: {
    type: String,
    default: "",
  },
  toDate: {
    type: String,
    default: "",
  },
})

const distanceChartCanvas = ref(null)
const chartMode = ref("accumulated")

let distanceChart = null
let chartConstructor = null
let chartConstructorPromise = null
let renderFrameId = null

const getChartConstructor = async () => {
  if (chartConstructor) return chartConstructor

  if (!chartConstructorPromise) {
    chartConstructorPromise = import("chart.js/auto").then((module) => {
      chartConstructor = module.default || module.Chart

      return chartConstructor
    })
  }

  return chartConstructorPromise
}

const getAssetLabel = (asset = {}) => {
  return asset.displayName || asset.nombre || asset.patente || asset.deviceId || "Activo"
}

const getRowTimestamp = (row = {}) => {
  return row.timestamp || row.date || row.fecha || row.time || row.hora || null
}

const getDateOnly = (value) => {
  if (!value) return ""

  const text = String(value).trim()
  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})/)

  if (isoMatch) return isoMatch[0]

  const localMatch = text.match(/^(\d{2})-(\d{2})-(\d{4})/)

  if (localMatch) {
    return `${localMatch[3]}-${localMatch[2]}-${localMatch[1]}`
  }

  const date = new Date(text)

  if (Number.isNaN(date.getTime())) return ""

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

const isRowInsideActiveRange = (row = {}) => {
  const date = getDateOnly(getRowTimestamp(row))

  if (!date) return false
  if (props.fromDate && date < props.fromDate) return false
  if (props.toDate && date > props.toDate) return false

  return true
}

const getSortedRows = (rows = []) => {
  return [...rows].sort((firstRow, secondRow) => {
    const firstTime = new Date(getRowTimestamp(firstRow) || 0).getTime()
    const secondTime = new Date(getRowTimestamp(secondRow) || 0).getTime()

    return firstTime - secondTime
  })
}

const parseDistanceKm = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) return value

  const text = String(value || "")
    .trim()
    .toLowerCase()
    .replace(",", ".")
  const match = text.match(/-?\d+(?:\.\d+)?/)

  if (!match) return 0

  const number = Number(match[0])

  if (!Number.isFinite(number)) return 0

  return text.includes(" m") && !text.includes("km") ? number / 1000 : number
}

const formatKm = (value) => {
  if (!Number.isFinite(value) || value <= 0) return "0 km"

  return `${value.toFixed(value >= 10 ? 0 : 1).replace(".", ",")} km`
}

const formatDate = (value) => {
  if (!value) return "-"

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return String(value)

  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const year = date.getFullYear()

  return `${day}-${month}-${year}`
}

const formatTime = (value) => {
  if (!value) return "-"

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return String(value)

  return date.toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

const formatMinutes = (value) => {
  const totalMinutes = Math.round(Number(value) || 0)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours <= 0) return `${minutes} min`
  if (minutes <= 0) return `${hours} h`

  return `${hours} h ${minutes} min`
}

const getTimestampValue = (value) => {
  const timestamp = new Date(value || 0).getTime()

  return Number.isNaN(timestamp) ? null : timestamp
}

const getSeriesColor = (index = 0) => {
  const colors = ["#ff6600", "#102372", "#16a34a", "#0ea5e9", "#7c3aed", "#dc2626"]

  return colors[index % colors.length]
}

const getColorWithAlpha = (hexColor, alpha) => {
  const cleanHex = hexColor.replace("#", "")
  const red = parseInt(cleanHex.slice(0, 2), 16)
  const green = parseInt(cleanHex.slice(2, 4), 16)
  const blue = parseInt(cleanHex.slice(4, 6), 16)

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

const getRowDistanceKm = (row = {}) => {
  return Number(row.accumulatedDistanceKm) || parseDistanceKm(row.accumulatedDistanceLabel)
}

const getRowSpeed = (row = {}) => {
  return Number(row.speed ?? row.velocidad_kmh) || parseDistanceKm(row.speedLabel ?? row.velocidad)
}

const getPointDistanceKm = (pointA, pointB) => {
  const latA = Number(pointA?.lat)
  const lngA = Number(pointA?.lng)
  const latB = Number(pointB?.lat)
  const lngB = Number(pointB?.lng)

  if (![latA, lngA, latB, lngB].every(Number.isFinite)) return 0

  const earthRadiusKm = 6371
  const toRad = (value) => (value * Math.PI) / 180
  const diffLat = toRad(latB - latA)
  const diffLng = toRad(lngB - lngA)
  const startLat = toRad(latA)
  const endLat = toRad(latB)
  const haversine =
    Math.sin(diffLat / 2) * Math.sin(diffLat / 2) +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(diffLng / 2) * Math.sin(diffLng / 2)

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
}

const buildAccumulatedRows = (rows = []) => {
  let accumulatedDistanceKm = 0

  return getSortedRows(rows).map((row, index, sortedRows) => {
    const previousRow = sortedRows[index - 1]

    if (previousRow) {
      accumulatedDistanceKm += getPointDistanceKm(previousRow, row)
    }

    return {
      ...row,
      accumulatedDistanceKm,
      accumulatedDistanceLabel: formatKm(accumulatedDistanceKm),
    }
  })
}

const calculateMovingMinutes = (rows = []) => {
  return rows.reduce((total, row, index) => {
    const nextRow = rows[index + 1]

    if (!nextRow) return total

    const currentTime = getTimestampValue(getRowTimestamp(row))
    const nextTime = getTimestampValue(getRowTimestamp(nextRow))

    if (currentTime === null || nextTime === null) return total

    const diffMinutes = Math.max(0, (nextTime - currentTime) / 60000)

    return getRowSpeed(row) > 0 || getRowSpeed(nextRow) > 0 ? total + diffMinutes : total
  }, 0)
}

const buildSummaryRow = (route, fallbackIndex = 0) => {
  const sortedRows = getSortedRows(route?.rows || route?.points || [])

  if (!sortedRows.length) return null

  const firstRow = sortedRows[0] || null
  const lastRow = sortedRows[sortedRows.length - 1] || null
  const asset = route?.asset || props.selectedAssets[fallbackIndex] || {}
  const distanceKm = Number(lastRow?.accumulatedDistanceKm) || 0
  const pointsCount = route?.summary?.pointsCount || sortedRows.length
  const movingMinutes = calculateMovingMinutes(sortedRows)
  const firstTimestamp = getRowTimestamp(firstRow)
  const lastTimestamp = getRowTimestamp(lastRow)

  return {
    id: route?.id || asset.id || `summary-${fallbackIndex}`,
    assetLabel: getAssetLabel(asset),
    dateLabel: formatDate(firstTimestamp),
    distanceKm,
    distanceLabel: formatKm(distanceKm),
    startLabel: formatTime(firstTimestamp),
    endLabel: formatTime(lastTimestamp),
    movingLabel: formatMinutes(movingMinutes),
    pointsCount,
    pointsLabel: `${pointsCount} pts`,
    startTime: getTimestampValue(firstTimestamp),
    endTime: getTimestampValue(lastTimestamp),
    seriesIndex: fallbackIndex,
  }
}

const sourceRoutes = computed(() => {
  const routes = Array.isArray(props.route?.routes) ? props.route.routes : []

  if (routes.length) return routes
  if (props.route) return [props.route]
  if (!props.rows.length) return []

  return [
    {
      id: "summary-current",
      asset: props.selectedAssets[0],
      rows: props.rows,
      summary: {},
    },
  ]
})

const chartSourceRoutes = computed(() => {
  return sourceRoutes.value
    .map((route) => {
      const activeRows = buildAccumulatedRows(
        (route?.rows || route?.points || []).filter(isRowInsideActiveRange),
      )

      return {
        ...route,
        rows: activeRows,
        points: activeRows,
        summary: {},
      }
    })
    .filter((route) => route.rows.length)
})

const summaryRows = computed(() => {
  return chartSourceRoutes.value
    .map((route, index) => buildSummaryRow(route, index))
    .filter(Boolean)
})

const totalDistanceKm = computed(() => {
  return summaryRows.value.reduce((total, row) => total + row.distanceKm, 0)
})

const totalPoints = computed(() => {
  return summaryRows.value.reduce((total, row) => total + row.pointsCount, 0)
})

const chartRows = computed(() => {
  return [...summaryRows.value]
    .sort((firstRow, secondRow) => secondRow.distanceKm - firstRow.distanceKm)
    .map((row) => {
      const share = totalDistanceKm.value > 0 ? (row.distanceKm / totalDistanceKm.value) * 100 : 0

      return {
        ...row,
        distanceShareLabel: `${Math.max(0, Math.min(100, share)).toFixed(0)}%`,
      }
    })
})

const chartSignature = computed(() => {
  const routeSignature = chartSourceRoutes.value
    .map((row) => {
      const rowSignature = (row?.rows || [])
        .map((item) => `${item.id || ""}:${getRowTimestamp(item) || ""}`)
        .join(",")

      return `${row.id}:${rowSignature}`
    })
    .join("|")

  return `${chartMode.value}:${props.fromDate}:${props.toDate}:${routeSignature}`
})

const destroyDistanceChart = () => {
  distanceChart?.destroy?.()
  distanceChart = null
}

const buildDistanceSeries = () => {
  const timestampKeys = new Set()
  const series = chartSourceRoutes.value.map((route, routeIndex) => {
    const sortedRows = getSortedRows(route?.rows || route?.points || [])
    const valuesByTimestamp = new Map()

    sortedRows.forEach((row, rowIndex) => {
      const timestamp = getTimestampValue(getRowTimestamp(row))

      if (timestamp === null) return

      const currentDistance = getRowDistanceKm(row)
      const previousDistance = rowIndex > 0 ? getRowDistanceKm(sortedRows[rowIndex - 1]) : 0
      const value =
        chartMode.value === "segment"
          ? Math.max(0, currentDistance - previousDistance)
          : currentDistance

      timestampKeys.add(timestamp)
      valuesByTimestamp.set(timestamp, value)
    })

    return {
      id: route?.id || `series-${routeIndex}`,
      label: getAssetLabel(route?.asset || props.selectedAssets[routeIndex]),
      color: getSeriesColor(routeIndex),
      valuesByTimestamp,
    }
  })

  const timestamps = [...timestampKeys].sort((firstTimestamp, secondTimestamp) => {
    return firstTimestamp - secondTimestamp
  })

  return {
    labels: timestamps.map((timestamp) => formatTime(timestamp)),
    datasets: series.map((item, index) => {
      const color = item.color

      return {
        label: item.label,
        data: timestamps.map((timestamp) => item.valuesByTimestamp.get(timestamp) ?? null),
        borderColor: color,
        backgroundColor:
          index === 0 ? getColorWithAlpha(color, 0.14) : getColorWithAlpha(color, 0.04),
        borderWidth: index === 0 ? 3 : 2,
        cubicInterpolationMode: "monotone",
        fill: index === 0,
        pointBackgroundColor: color,
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 3.5,
        pointHoverRadius: 5,
        tension: 0.34,
        spanGaps: true,
      }
    }),
  }
}

const buildChartDefinition = () => {
  const series = buildDistanceSeries()

  return {
    type: "line",
    data: series,
    options: {
      animation: false,
      maintainAspectRatio: false,
      responsive: true,
      interaction: {
        intersect: false,
        mode: "index",
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = Number(context.parsed.y) || 0

              return `${context.dataset.label}: ${formatKm(value)}`
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: "#64748b",
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 6,
            font: {
              size: 10,
              weight: "700",
            },
          },
          title: {
            display: true,
            text: "Hora del dia",
            color: "#64748b",
            font: {
              size: 10,
              weight: "800",
            },
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: "rgba(16, 35, 114, 0.08)",
          },
          ticks: {
            color: "#64748b",
            font: {
              size: 10,
              weight: "700",
            },
            callback: (value) => {
              return formatKm(Number(value))
            },
          },
          title: {
            display: true,
            text:
              chartMode.value === "segment"
                ? "Distancia por tramo (km)"
                : "Distancia acumulada (km)",
            color: "#64748b",
            font: {
              size: 10,
              weight: "800",
            },
          },
        },
      },
    },
  }
}

const renderDistanceChart = async () => {
  if (!distanceChartCanvas.value || !chartRows.value.length) {
    destroyDistanceChart()
    return
  }

  const ChartConstructor = await getChartConstructor()
  const definition = buildChartDefinition()

  if (distanceChart && distanceChart.config.type === definition.type) {
    distanceChart.data = definition.data
    distanceChart.options = definition.options
    distanceChart.update("none")
    return
  }

  destroyDistanceChart()
  distanceChart = new ChartConstructor(distanceChartCanvas.value, definition)
}

const scheduleDistanceChartRender = () => {
  if (renderFrameId !== null && typeof window !== "undefined") {
    window.cancelAnimationFrame(renderFrameId)
  }

  if (typeof window === "undefined") return

  renderFrameId = window.requestAnimationFrame(async () => {
    renderFrameId = null
    await nextTick()
    await renderDistanceChart()
  })
}

const earliestStartLabel = computed(() => {
  const row = summaryRows.value
    .filter((item) => item.startTime !== null)
    .sort((firstRow, secondRow) => firstRow.startTime - secondRow.startTime)[0]

  return row ? `${row.startLabel} - ${row.assetLabel}` : "-"
})

const latestEndLabel = computed(() => {
  const row = summaryRows.value
    .filter((item) => item.endTime !== null)
    .sort((firstRow, secondRow) => secondRow.endTime - firstRow.endTime)[0]

  return row ? `${row.endLabel} - ${row.assetLabel}` : "-"
})

const summaryMetrics = computed(() => {
  const assetsCount = summaryRows.value.length

  return [
    {
      label: "Activos",
      value: assetsCount,
      hint: assetsCount === 1 ? "1 activo resumido" : `${assetsCount} activos resumidos`,
    },
    {
      label: "Distancia total",
      value: formatKm(totalDistanceKm.value),
      hint: "Suma del rango",
    },
    {
      label: "Inicio",
      value: earliestStartLabel.value.split(" - ")[0] || "-",
      hint: earliestStartLabel.value.split(" - ")[1] || "Sin datos",
    },
    {
      label: "Registros GPS",
      value: totalPoints.value,
      hint: "Puntos considerados",
    },
  ]
})

watch(chartSignature, scheduleDistanceChartRender, {
  immediate: true,
})

onBeforeUnmount(() => {
  if (renderFrameId !== null && typeof window !== "undefined") {
    window.cancelAnimationFrame(renderFrameId)
  }

  destroyDistanceChart()
})
</script>
