<template>
  <section class="rounded-xl border border-[#d8dee8] bg-white p-3 shadow-sm">
    <div class="mb-3 flex min-w-0 items-start justify-between gap-3">
      <div class="min-w-0">
        <h3 class="truncate text-[12px] font-black text-[#102372]">{{ title }}</h3>

        <p class="mt-0.5 text-[10px] font-semibold text-slate-500">
          {{ rowCount }} {{ recordsLabel }}

          <span v-if="rowCount !== chartRows.length">
            - {{ chartRows.length }} puntos visibles
          </span>
        </p>
      </div>

      <div class="flex shrink-0 items-center gap-2">
        <span
          class="rounded-md bg-slate-100 px-2 py-1 text-[9px] font-black text-slate-500 ring-1 ring-slate-200"
        >
          {{ chartConfigs.length }}/{{ MAX_CHARTS }}
        </span>

        <button
          type="button"
          class="flex h-8 cursor-pointer items-center gap-1.5 rounded-md bg-[#102372] px-3 text-[9px] font-black text-white transition hover:bg-[#182f8c] disabled:cursor-not-allowed disabled:bg-slate-300"
          :disabled="chartConfigs.length >= MAX_CHARTS"
          @click="addChart"
        >
          <span class="text-[14px] leading-none">+</span>
          Agregar grafico
        </button>
      </div>
    </div>

    <div
      v-if="chartConfigs.length === 0"
      class="rounded-lg border border-dashed border-[#cbd5e1] bg-slate-50 px-3 py-4 text-center text-[10px] font-bold text-slate-500"
    >
      {{ emptyLabel }}
    </div>

    <div v-else-if="chartRows.length" class="grid min-w-0 gap-3 xl:grid-cols-2">
      <article
        v-for="(config, index) in chartConfigs"
        :key="config.id"
        class="min-w-0 rounded-xl border border-[#dbe4f0] bg-[#fbfdff] p-3"
        :class="chartConfigs.length === 1 ? 'xl:col-span-2' : ''"
      >
        <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div class="flex min-w-0 items-center gap-2">
            <span
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#102372]/10 text-[11px] font-black text-[#102372] ring-1 ring-[#102372]/10"
            >
              {{ index + 1 }}
            </span>

            <div class="min-w-0">
              <p class="truncate text-[11px] font-black text-[#102372]">
                {{ getChartTitle(config) }}
              </p>

              <p class="text-[9px] font-bold text-slate-400">
                {{ getChartTypeLabel(config.type) }}
              </p>
            </div>
          </div>

          <div class="flex min-w-0 items-center gap-1.5">
            <select
              v-model="config.type"
              class="h-8 rounded-md border border-[#cbd5e1] bg-white px-2 text-[9px] font-black text-[#102372] outline-none focus:border-[#FF6600]"
              :aria-label="`Tipo del grafico ${index + 1}`"
              @change="handleChartTypeChange(config)"
            >
              <option v-for="type in chartTypeOptions" :key="type.value" :value="type.value">
                {{ type.label }}
              </option>
            </select>

            <select
              v-model="config.variableKey"
              class="h-8 min-w-0 max-w-[180px] rounded-md border border-[#cbd5e1] bg-white px-2 text-[9px] font-black text-[#102372] outline-none focus:border-[#FF6600]"
              :aria-label="`Variable del grafico ${index + 1}`"
              @change="scheduleChartRender"
            >
              <option
                v-for="variable in getVariablesForType(config.type)"
                :key="variable.key"
                :value="variable.key"
              >
                {{ variable.label }}
              </option>
            </select>

            <button
              type="button"
              class="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-red-200 bg-white text-[11px] font-black text-red-600 transition hover:bg-red-50"
              :aria-label="`Quitar grafico ${index + 1}`"
              title="Quitar grafico"
              @click="removeChart(config.id)"
            >
              x
            </button>
          </div>
        </div>

        <div class="h-[240px] min-h-[240px]">
          <canvas
            :ref="(element) => setCanvasRef(config.id, element)"
            class="h-full w-full"
          ></canvas>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue"

const STATUS_SEGMENTS = [
  {
    key: "start_end",
    label: "Inicio / fin",
    color: "#6366f1",
  },
  {
    key: "stopped",
    label: "Parada",
    color: "#f97316",
  },
  {
    key: "inactive",
    label: "Sin operacion",
    color: "#94a3b8",
  },
  {
    key: "slow",
    label: "Baja velocidad",
    color: "#eab308",
  },
  {
    key: "normal",
    label: "Ruta normal",
    color: "#14b8a6",
  },
  {
    key: "fast",
    label: "Alta velocidad",
    color: "#ef4444",
  },
]

const CHART_VARIABLES = [
  {
    key: "gpsSatellites",
    label: "Satelites GPS",
    badge: "satelites por reporte",
    icon: "S",
    aliases: ["gpsSatellites", "satellites", "satelites", "gpsSats", "sats"],
    unit: "sat",
    decimals: 0,
    color: "#059669",
  },
  {
    key: "speed",
    label: "Velocidad",
    badge: "km/h por reporte",
    icon: "V",
    aliases: ["speed", "velocidad", "velocidad_kmh", "speedLabel"],
    unit: "km/h",
    decimals: 1,
    color: "#2563eb",
  },
  {
    key: "speedLimit",
    label: "Limite de velocidad",
    badge: "km/h configurados",
    icon: "L",
    aliases: ["speedLimit", "limiteVelocidad", "velocidadLimite"],
    unit: "km/h",
    decimals: 1,
    color: "#64748b",
  },
  {
    key: "speedingDelta",
    label: "Sobre limite",
    badge: "km/h sobre limite",
    icon: "X",
    aliases: ["speedingDelta", "speedOverLimit", "excesoVelocidad"],
    unit: "km/h",
    decimals: 1,
    color: "#dc2626",
  },
  {
    key: "durationMinutes",
    label: "Duracion",
    badge: "minutos por evento",
    icon: "T",
    aliases: ["durationMinutes", "duration", "duracion", "durationLabel"],
    unit: "min",
    decimals: 1,
    color: "#7c3aed",
  },
  {
    key: "ignition",
    label: "Encendido",
    badge: "1 encendido / 0 apagado",
    icon: "E",
    aliases: ["ignition", "ignicion", "contacto"],
    unit: "",
    decimals: 0,
    color: "#ff6600",
    maximum: 1,
  },
  {
    key: "gpsSignal",
    label: "Senal GPS",
    badge: "% por reporte",
    icon: "G",
    aliases: ["gpsSignal", "gpsSignalLabel"],
    unit: "%",
    decimals: 0,
    color: "#0891b2",
    maximum: 100,
  },
  {
    key: "fuelPercent",
    label: "Nivel de combustible",
    badge: "% por reporte",
    icon: "C",
    aliases: ["fuelPercent", "combustibleNivel", "combustible"],
    unit: "%",
    decimals: 1,
    color: "#d97706",
    maximum: 100,
  },
  {
    key: "accumulatedDistanceKm",
    label: "Distancia acumulada",
    badge: "km acumulados",
    icon: "D",
    aliases: ["accumulatedDistanceKm", "accumulatedDistanceLabel"],
    unit: "km",
    decimals: 1,
    color: "#4f46e5",
  },
  {
    key: "odometer",
    label: "Odometro",
    badge: "km por reporte",
    icon: "O",
    aliases: ["odometer", "odometro"],
    unit: "km",
    decimals: 1,
    color: "#7c3aed",
  },
  {
    key: "engineHours",
    label: "Horometro total",
    badge: "horas de motor",
    icon: "H",
    aliases: ["engineHours", "horometroTotal"],
    unit: "h",
    decimals: 1,
    color: "#0f766e",
  },
  {
    key: "engineHoursDaily",
    label: "Horometro diario",
    badge: "horas del dia",
    icon: "H",
    aliases: ["engineHoursDaily", "horometroDiario"],
    unit: "h",
    decimals: 1,
    color: "#14b8a6",
  },
  {
    key: "canRpm",
    label: "RPM del motor",
    badge: "rpm por reporte",
    icon: "R",
    aliases: ["canRpm", "rpm"],
    unit: "rpm",
    decimals: 0,
    color: "#dc2626",
  },
  {
    key: "canEngineTemp",
    label: "Temperatura del motor",
    badge: "grados por reporte",
    icon: "T",
    aliases: ["canEngineTemp", "temperaturaMotor"],
    unit: "C",
    decimals: 1,
    color: "#ea580c",
  },
  {
    key: "canBatteryVoltage",
    label: "Voltaje de bateria",
    badge: "voltios por reporte",
    icon: "B",
    aliases: ["canBatteryVoltage", "batteryVoltage", "voltajeBateria"],
    unit: "V",
    decimals: 1,
    color: "#0f766e",
  },
  {
    key: "canEngineLoad",
    label: "Carga del motor",
    badge: "% por reporte",
    icon: "M",
    aliases: ["canEngineLoad", "engineLoad"],
    unit: "%",
    decimals: 1,
    color: "#db2777",
    maximum: 100,
  },
  {
    key: "canThrottle",
    label: "Acelerador",
    badge: "% por reporte",
    icon: "A",
    aliases: ["canThrottle", "throttle"],
    unit: "%",
    decimals: 1,
    color: "#65a30d",
    maximum: 100,
  },
  {
    key: "canFuelRate",
    label: "Consumo instantaneo",
    badge: "litros por hora",
    icon: "L",
    aliases: ["canFuelRate", "fuelRate"],
    unit: "L/h",
    decimals: 1,
    color: "#ea580c",
  },
  {
    key: "canFuelUsed",
    label: "Combustible utilizado",
    badge: "litros acumulados",
    icon: "L",
    aliases: ["canFuelUsed", "fuelUsed"],
    unit: "L",
    decimals: 1,
    color: "#d97706",
  },
  {
    key: "canOilPressure",
    label: "Presion de aceite",
    badge: "psi por reporte",
    icon: "P",
    aliases: ["canOilPressure", "oilPressure"],
    unit: "psi",
    decimals: 1,
    color: "#4f46e5",
  },
  {
    key: "canAdBlueLevel",
    label: "Nivel de AdBlue",
    badge: "% por reporte",
    icon: "A",
    aliases: ["canAdBlueLevel", "adBlueLevel"],
    unit: "%",
    decimals: 1,
    color: "#0891b2",
    maximum: 100,
  },
  {
    key: "digitalInput1",
    label: "Entrada digital 1",
    badge: "1 activa / 0 inactiva",
    icon: "I",
    aliases: ["digitalInput1", "input1", "di1"],
    unit: "",
    decimals: 0,
    color: "#0f766e",
    maximum: 1,
  },
  {
    key: "digitalInput2",
    label: "Entrada digital 2",
    badge: "1 activa / 0 inactiva",
    icon: "I",
    aliases: ["digitalInput2", "input2", "di2"],
    unit: "",
    decimals: 0,
    color: "#7c3aed",
    maximum: 1,
  },
]

const STATUS_VARIABLE = {
  key: "status",
  label: "Estado operativo",
  badge: "distribucion de estados",
  icon: "E",
  unit: "",
  decimals: 0,
  color: "#14b8a6",
}

const MAX_CHARTS = 4
const MAX_VISIBLE_CHART_POINTS = 700

const POINT_TIME_FORMATTER = new Intl.DateTimeFormat("es-CL", {
  hour: "2-digit",
  minute: "2-digit",
})

const chartTypeOptions = [
  { value: "bar", label: "Barras" },
  { value: "line", label: "Linea" },
  { value: "doughnut", label: "Dona" },
]

const props = defineProps({
  title: {
    type: String,
    default: "Graficos del itinerario",
  },
  recordsLabel: {
    type: String,
    default: "registros GPS",
  },
  emptyLabel: {
    type: String,
    default: "No hay graficos agregados",
  },
  rows: {
    type: Array,
    default: () => [],
  },
  exportRows: {
    type: Array,
    default: null,
  },
  totalRecords: {
    type: Number,
    default: null,
  },
  revision: {
    type: Number,
    default: 0,
  },
  summary: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(["update:chart-count"])

const chartConfigs = ref([])
const canvasRefs = new Map()
const chartInstances = new Map()
const chartInstanceSignatures = new Map()

let chartIdSequence = 0
let renderFrameId = null
let renderRequestId = 0
let chartConstructor = null
let chartConstructorPromise = null

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

const getNumericValue = (value, fallback = 0) => {
  if (value === null || value === undefined || String(value).trim() === "") {
    return fallback
  }

  if (typeof value === "boolean") return value ? 1 : 0

  const stateValue = String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  if (
    ["on", "si", "yes", "true", "active", "activo", "activa", "encendido", "encendida"].includes(
      stateValue,
    )
  ) {
    return 1
  }

  if (
    ["off", "no", "false", "inactive", "inactivo", "inactiva", "apagado", "apagada"].includes(
      stateValue,
    )
  ) {
    return 0
  }

  const normalized = Number(
    String(value ?? "")
      .replace(",", ".")
      .replace(/[^\d.-]/g, ""),
  )

  return Number.isFinite(normalized) ? normalized : fallback
}

const getDurationMinutesValue = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null

  const textValue = String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  if (!textValue) return null

  const clockMatch = textValue.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/)

  if (clockMatch) {
    const firstValue = Number(clockMatch[1])
    const secondValue = Number(clockMatch[2])
    const thirdValue = Number(clockMatch[3] || 0)

    if (clockMatch[3]) return firstValue * 60 + secondValue + thirdValue / 60

    return firstValue + secondValue / 60
  }

  const hoursMatch = textValue.match(/(-?\d+(?:[.,]\d+)?)\s*(h|hr|hrs|hora|horas)\b/)
  const minutesMatch = textValue.match(/(-?\d+(?:[.,]\d+)?)\s*(m|min|mins|minuto|minutos)\b/)
  const secondsMatch = textValue.match(/(-?\d+(?:[.,]\d+)?)\s*(s|seg|segundo|segundos)\b/)

  if (hoursMatch || minutesMatch || secondsMatch) {
    const hours = getNumericValue(hoursMatch?.[1], 0)
    const minutes = getNumericValue(minutesMatch?.[1], 0)
    const seconds = getNumericValue(secondsMatch?.[1], 0)

    return hours * 60 + minutes + seconds / 60
  }

  const numericValue = getNumericValue(value, Number.NaN)

  return Number.isFinite(numericValue) ? numericValue : null
}

const getRowTimestamp = (row) => {
  const date = new Date(row?.timestamp || row?.date || row?.fecha || "")

  return Number.isNaN(date.getTime()) ? 0 : date.getTime()
}

const sortRowsByTimestamp = (sourceRows = []) => {
  const rows = Array.isArray(sourceRows) ? sourceRows : []

  if (rows.length < 2) return rows

  const timestampedRows = rows.map((row, index) => ({
    index,
    row,
    timestamp: getRowTimestamp(row),
  }))

  const alreadySorted = timestampedRows.every((item, index) => {
    if (index === 0) return true

    return timestampedRows[index - 1].timestamp <= item.timestamp
  })

  if (alreadySorted) return rows

  return timestampedRows
    .sort((first, second) => {
      return first.timestamp - second.timestamp || first.index - second.index
    })
    .map((item) => item.row)
}

const sortedRows = computed(() => {
  return sortRowsByTimestamp(props.rows)
})

const sampleRows = (rows, limit = MAX_VISIBLE_CHART_POINTS) => {
  if (!Array.isArray(rows) || rows.length === 0) return []
  if (rows.length <= limit) return rows
  if (limit <= 1) return [rows[0]]

  const sampledRows = []
  const lastIndex = rows.length - 1
  const step = lastIndex / (limit - 1)

  for (let index = 0; index < limit; index += 1) {
    const sourceIndex = Math.min(lastIndex, Math.round(index * step))

    sampledRows.push(rows[sourceIndex])
  }

  return sampledRows
}

const rowCount = computed(() => {
  const totalRecords = Number(props.totalRecords)

  if (Number.isFinite(totalRecords) && totalRecords >= 0) {
    return totalRecords
  }

  return props.rows.length
})

const chartRows = computed(() => {
  return sampleRows(sortedRows.value)
})

const createStatusCounts = () => {
  return STATUS_SEGMENTS.reduce((counts, segment) => {
    counts[segment.key] = 0

    return counts
  }, {})
}

const getStatusSegmentKey = (row) => {
  const speed = getNumericValue(row?.speed ?? row?.speedLabel)
  const event = String(row?.event || "").toLowerCase()

  if (event.includes("inicio") || event.includes("fin")) return "start_end"
  if (event.includes("sin")) return "inactive"
  if (event.includes("parada")) return "stopped"
  if (speed <= 0) return "stopped"
  if (speed >= 52) return "fast"
  if (speed >= 38) return "normal"

  return "slow"
}

const getActiveStatusSegments = (sourceRows = []) => {
  const counts = sourceRows.reduce((statusCounts, row) => {
    const statusKey = getStatusSegmentKey(row)

    statusCounts[statusKey] += 1

    return statusCounts
  }, createStatusCounts())

  return STATUS_SEGMENTS.map((segment) => ({
    ...segment,
    count: counts[segment.key] || 0,
  })).filter((segment) => segment.count > 0)
}

const getPointLabel = (row) => {
  const assetLabel = row?.assetPatente || row?.assetDisplayName || ""

  if (row?.timeLabel) {
    return assetLabel ? `${row.timeLabel} ${assetLabel}` : row.timeLabel
  }

  const timestamp = getRowTimestamp(row)

  if (!timestamp) return assetLabel || "-"

  const timeLabel = POINT_TIME_FORMATTER.format(new Date(timestamp))

  return assetLabel ? `${timeLabel} ${assetLabel}` : timeLabel
}

const getVariableRawValue = (row, variable) => {
  for (const alias of variable.aliases) {
    const value = row?.[alias]

    if (value !== null && value !== undefined && String(value).trim() !== "") {
      return value
    }
  }

  return null
}

const getVariableValue = (row, variable) => {
  const rawValue = getVariableRawValue(row, variable)

  if (rawValue === null) return null

  if (variable.key === "durationMinutes") {
    return getDurationMinutesValue(rawValue)
  }

  const value = getNumericValue(rawValue, Number.NaN)

  return Number.isFinite(value) ? value : null
}

const availableVariables = computed(() => {
  const detectedVariableKeys = new Set()

  for (const row of chartRows.value) {
    for (const variable of CHART_VARIABLES) {
      if (detectedVariableKeys.has(variable.key)) continue

      if (getVariableValue(row, variable) !== null) {
        detectedVariableKeys.add(variable.key)
      }
    }

    if (detectedVariableKeys.size === CHART_VARIABLES.length) {
      break
    }
  }

  return CHART_VARIABLES.filter((variable) => {
    return detectedVariableKeys.has(variable.key)
  })
})

const getVariablesForType = (type) => {
  return type === "doughnut" ? [STATUS_VARIABLE] : availableVariables.value
}

const getVariableForConfig = (config) => {
  const variables = getVariablesForType(config.type)

  return (
    variables.find((variable) => variable.key === config.variableKey) ||
    variables[0] ||
    CHART_VARIABLES[0]
  )
}

const updateSignatureHash = (currentHash, value) => {
  const textValue = String(value ?? "")
  let nextHash = currentHash

  for (let index = 0; index < textValue.length; index += 1) {
    nextHash ^= textValue.charCodeAt(index)
    nextHash = Math.imul(nextHash, 16777619)
  }

  return nextHash >>> 0
}

const getChartDataSignature = (config, sourceRows = chartRows.value) => {
  let signatureHash = 2166136261

  signatureHash = updateSignatureHash(signatureHash, config.type)
  signatureHash = updateSignatureHash(signatureHash, config.variableKey)
  signatureHash = updateSignatureHash(signatureHash, sourceRows.length)

  if (config.type === "doughnut") {
    getActiveStatusSegments(sourceRows).forEach((segment) => {
      signatureHash = updateSignatureHash(signatureHash, segment.key)
      signatureHash = updateSignatureHash(signatureHash, segment.count)
    })

    return `${sourceRows.length}:${signatureHash}`
  }

  const variable = getVariableForConfig(config)

  sourceRows.forEach((row) => {
    signatureHash = updateSignatureHash(signatureHash, getRowTimestamp(row))
    signatureHash = updateSignatureHash(signatureHash, getSeriesLabel(row))
    signatureHash = updateSignatureHash(signatureHash, getRowAddress(row))
    signatureHash = updateSignatureHash(signatureHash, getVariableValue(row, variable))
  })

  return `${sourceRows.length}:${signatureHash}`
}

const chartRenderSignature = computed(() => {
  let signatureHash = 2166136261

  signatureHash = updateSignatureHash(signatureHash, chartRows.value.length)

  chartConfigs.value.forEach((config) => {
    signatureHash = updateSignatureHash(signatureHash, config.id)
    signatureHash = updateSignatureHash(signatureHash, getChartDataSignature(config))
  })

  return `${chartRows.value.length}:${signatureHash}`
})

const normalizeChartConfig = (config) => {
  const variables = getVariablesForType(config.type)

  if (variables.some((variable) => variable.key === config.variableKey)) {
    return false
  }

  config.variableKey = variables[0]?.key || "speed"

  return true
}

const handleChartTypeChange = (config) => {
  normalizeChartConfig(config)
  scheduleChartRender()
}

const getChartTitle = (config) => {
  return getVariableForConfig(config).label
}

const getChartTypeLabel = (type) => {
  return chartTypeOptions.find((option) => option.value === type)?.label || "Grafico"
}

const createChartConfig = () => {
  chartIdSequence += 1

  const existingKeys = new Set(chartConfigs.value.map((config) => config.variableKey))

  const nextVariable =
    availableVariables.value.find((variable) => {
      return !existingKeys.has(variable.key)
    }) ||
    availableVariables.value[0] ||
    CHART_VARIABLES[0]

  return {
    id: `chart-${chartIdSequence}`,
    type: "bar",
    variableKey: nextVariable.key,
  }
}

const addChart = () => {
  if (chartConfigs.value.length >= MAX_CHARTS) return

  chartConfigs.value.push(createChartConfig())
  scheduleChartRender()
}

const removeChart = (chartId) => {
  const chartIndex = chartConfigs.value.findIndex((config) => {
    return config.id === chartId
  })

  if (chartIndex < 0) return

  chartConfigs.value.splice(chartIndex, 1)
  destroyChartById(chartId)
  scheduleChartRender()
}

const getSeriesLabel = (row) => {
  const pointLabel = getPointLabel(row)

  return row?.dateLabel ? `${row.dateLabel} ${pointLabel}` : pointLabel
}

const getRowAddress = (row) => {
  const address = row?.address || row?.direccion || row?.lastPosition || row?.resolvedAddress

  return String(address || "").trim()
}

const getSeriesForConfig = (config, sourceRows = chartRows.value) => {
  if (config.type === "doughnut") {
    const statusSegments = getActiveStatusSegments(sourceRows)

    return {
      labels: statusSegments.map((segment) => segment.label),
      values: statusSegments.map((segment) => segment.count),
      colors: statusSegments.map((segment) => segment.color),
    }
  }

  const variable = getVariableForConfig(config)

  const points = sourceRows
    .map((row) => ({
      label: getSeriesLabel(row),
      value: getVariableValue(row, variable),
      address: getRowAddress(row),
    }))
    .filter((point) => point.value !== null)

  return {
    labels: points.map((point) => point.label),
    values: points.map((point) => point.value),
    addresses: points.map((point) => point.address),
  }
}

const setCanvasRef = (chartId, element) => {
  if (element) {
    canvasRefs.set(chartId, element)
    return
  }

  canvasRefs.delete(chartId)
}

const destroyChart = (chart) => {
  if (chart) {
    chart.destroy()
  }
}

const destroyChartById = (chartId) => {
  const chart = chartInstances.get(chartId)

  if (!chart) return

  destroyChart(chart)
  chartInstances.delete(chartId)
  chartInstanceSignatures.delete(chartId)
}

const destroyCharts = () => {
  chartInstances.forEach(destroyChart)
  chartInstances.clear()
  chartInstanceSignatures.clear()
}

const removeUnusedCharts = (activeChartIds) => {
  Array.from(chartInstances.keys()).forEach((chartId) => {
    if (!activeChartIds.has(chartId)) {
      destroyChartById(chartId)
    }
  })
}

const getColorWithAlpha = (hexColor, alpha) => {
  const hex = hexColor.replace("#", "")
  const red = parseInt(hex.slice(0, 2), 16)
  const green = parseInt(hex.slice(2, 4), 16)
  const blue = parseInt(hex.slice(4, 6), 16)

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

const getChartColor = (variable, value) => {
  if (variable.key !== "gpsSatellites") return variable.color

  if (value >= 8) return "#059669"
  if (value >= 4) return "#d97706"

  return "#dc2626"
}

const formatVariableValue = (value, variable) => {
  const decimals = variable.decimals ?? 1

  const formattedValue = Number(value).toLocaleString("es-CL", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return variable.unit ? `${formattedValue} ${variable.unit}` : formattedValue
}

const getBaseOptions = (labelFormatter) => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    normalized: true,
    resizeDelay: 120,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "#0f172a",
        padding: 10,
        titleFont: {
          size: 11,
          weight: "bold",
        },
        bodyFont: {
          size: 10,
          weight: "bold",
        },
        callbacks: {
          label: labelFormatter,
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
          font: {
            size: 10,
            weight: "bold",
          },
          maxRotation: 0,
          maxTicksLimit: 6,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(148, 163, 184, 0.2)",
        },
        ticks: {
          color: "#64748b",
          font: {
            size: 10,
            weight: "bold",
          },
          maxTicksLimit: 5,
        },
      },
    },
  }
}

const getCartesianOptions = (variable, type, series = {}) => {
  const options = getBaseOptions((context) => {
    const lines = [`${variable.label}: ${formatVariableValue(context.parsed.y, variable)}`]
    const address = series.addresses?.[context.dataIndex]

    if (address) {
      lines.push(`Direccion: ${address}`)
    }

    return lines
  })

  options.scales.x.ticks.maxRotation = type === "bar" ? 38 : 0
  options.scales.x.ticks.minRotation = type === "bar" ? 38 : 0
  options.scales.x.ticks.maxTicksLimit = type === "bar" ? 12 : 8

  options.scales.x.grid = {
    color: "rgba(148, 163, 184, 0.1)",
  }

  options.scales.y.grid = {
    color: "rgba(148, 163, 184, 0.16)",
  }

  options.scales.y.border = {
    color: "rgba(148, 163, 184, 0.28)",
  }

  options.scales.y.ticks.precision = variable.decimals === 0 ? 0 : undefined

  if (Number.isFinite(variable.maximum)) {
    options.scales.y.max = variable.maximum
  }

  if (variable.unit === "%") {
    options.scales.y.ticks.callback = (value) => `${value}%`
  }

  options.scales.x.border = {
    color: "rgba(148, 163, 184, 0.24)",
  }

  return options
}

const getDoughnutOptions = (values) => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    cutout: "68%",
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          boxWidth: 10,
          boxHeight: 10,
          color: "#475569",
          font: {
            size: 10,
            weight: "bold",
          },
        },
      },
      tooltip: {
        backgroundColor: "#0f172a",
        padding: 10,
        titleFont: {
          size: 11,
          weight: "bold",
        },
        bodyFont: {
          size: 10,
          weight: "bold",
        },
        callbacks: {
          label: (context) => {
            const total = values.reduce((sum, value) => sum + value, 0)
            const value = context.parsed || 0
            const percentage = total ? Math.round((value / total) * 100) : 0

            return `${context.label}: ${value} (${percentage}%)`
          },
        },
      },
    },
  }
}

const getChartDefinition = (config, sourceRows = chartRows.value) => {
  const variable = getVariableForConfig(config)
  const series = getSeriesForConfig(config, sourceRows)

  if (config.type === "doughnut") {
    return {
      type: "doughnut",
      data: {
        labels: series.labels,
        datasets: [
          {
            data: series.values,
            backgroundColor: series.colors.map((color) => {
              return getColorWithAlpha(color, 0.88)
            }),
            borderColor: "#ffffff",
            borderWidth: 3,
            hoverOffset: 3,
            hoverBackgroundColor: series.colors,
          },
        ],
      },
      options: getDoughnutOptions(series.values),
    }
  }

  if (config.type === "line") {
    return {
      type: "line",
      data: {
        labels: series.labels,
        datasets: [
          {
            label: variable.label,
            data: series.values,
            borderColor: variable.color,
            backgroundColor: getColorWithAlpha(variable.color, 0.12),
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 4,
            tension: 0.32,
            fill: true,
          },
        ],
      },
      options: getCartesianOptions(variable, config.type, series),
    }
  }

  const borderColors = series.values.map((value) => {
    return getChartColor(variable, value)
  })

  return {
    type: "bar",
    data: {
      labels: series.labels,
      datasets: [
        {
          label: variable.label,
          data: series.values,
          backgroundColor: borderColors.map((color) => {
            return getColorWithAlpha(color, 0.13)
          }),
          borderColor: borderColors,
          borderRadius: 6,
          borderSkipped: false,
          borderWidth: 2,
          hoverBackgroundColor: borderColors.map((color) => {
            return getColorWithAlpha(color, 0.22)
          }),
          maxBarThickness: 22,
        },
      ],
    },
    options: getCartesianOptions(variable, config.type, series),
  }
}

const upsertChart = (ChartConstructor, config, canvas) => {
  const signature = getChartDataSignature(config)
  const currentChart = chartInstances.get(config.id)
  const hasSameCanvas = currentChart && currentChart.canvas === canvas

  if (hasSameCanvas && chartInstanceSignatures.get(config.id) === signature) {
    return
  }

  const definition = getChartDefinition(config)

  const canReuseChart = hasSameCanvas && currentChart.config.type === definition.type

  if (canReuseChart) {
    currentChart.data = definition.data
    currentChart.options = definition.options
    currentChart.update("none")
    chartInstanceSignatures.set(config.id, signature)
    return
  }

  destroyChartById(config.id)

  chartInstances.set(config.id, new ChartConstructor(canvas, definition))
  chartInstanceSignatures.set(config.id, signature)
}

const renderCharts = async (requestId = renderRequestId) => {
  if (!chartConfigs.value.length || !chartRows.value.length) {
    destroyCharts()
    return
  }

  const ChartConstructor = await getChartConstructor()

  if (requestId !== renderRequestId) return

  const activeChartIds = new Set()

  chartConfigs.value.forEach((config) => {
    const canvas = canvasRefs.get(config.id)

    if (!canvas) return

    activeChartIds.add(config.id)
    upsertChart(ChartConstructor, config, canvas)
  })

  removeUnusedCharts(activeChartIds)
}

const requestRenderFrame = (callback) => {
  if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
    return window.requestAnimationFrame(callback)
  }

  return globalThis.setTimeout(callback, 0)
}

const cancelRenderFrame = (frameId) => {
  if (typeof window !== "undefined" && typeof window.cancelAnimationFrame === "function") {
    window.cancelAnimationFrame(frameId)
    return
  }

  globalThis.clearTimeout(frameId)
}

const scheduleChartRender = () => {
  renderRequestId += 1

  const currentRequestId = renderRequestId

  if (renderFrameId !== null) {
    cancelRenderFrame(renderFrameId)
  }

  renderFrameId = requestRenderFrame(async () => {
    renderFrameId = null

    await nextTick()

    if (currentRequestId !== renderRequestId) return

    await renderCharts(currentRequestId)
  })
}

watch([chartRenderSignature, () => props.revision], scheduleChartRender, {
  immediate: true,
})

watch(
  availableVariables,
  () => {
    let hasConfigChanges = false

    chartConfigs.value.forEach((config) => {
      hasConfigChanges = normalizeChartConfig(config) || hasConfigChanges
    })

    if (hasConfigChanges) {
      scheduleChartRender()
    }
  },
  {
    immediate: true,
  },
)

watch(
  () => chartConfigs.value.length,
  (chartCount) => {
    emit("update:chart-count", chartCount)
  },
  {
    immediate: true,
  },
)

const getChartImage = (chart) => {
  return chart?.toBase64Image?.("image/png", 1) || ""
}

const createExportChartImage = async (config, sourceRows) => {
  if (typeof document === "undefined") return ""

  const ChartConstructor = await getChartConstructor()
  const canvas = document.createElement("canvas")

  canvas.width = 1400
  canvas.height = 560

  const definition = getChartDefinition(config, sourceRows)

  const exportDefinition = {
    ...definition,
    options: {
      ...definition.options,
      responsive: false,
      maintainAspectRatio: false,
      animation: false,
      devicePixelRatio: 1,
    },
  }

  let exportChart = null

  try {
    exportChart = new ChartConstructor(canvas, exportDefinition)
    exportChart.resize(1400, 560)
    exportChart.update("none")

    return exportChart.toBase64Image("image/png", 1)
  } finally {
    exportChart?.destroy()
  }
}

const resolveExportRows = ({ fullData = true, rows: providedRows } = {}) => {
  if (!fullData) {
    return chartRows.value
  }

  if (Array.isArray(providedRows)) {
    return sortRowsByTimestamp(providedRows)
  }

  if (Array.isArray(props.exportRows)) {
    return sortRowsByTimestamp(props.exportRows)
  }

  return sortedRows.value
}

const getExportCharts = async ({ includeImages = true, fullData = true, rows } = {}) => {
  const sourceRows = resolveExportRows({
    fullData,
    rows,
  })
  const visualRows = sampleRows(sourceRows)

  const shouldRenderFullExportImage =
    includeImages && fullData && sourceRows.length > visualRows.length

  const items = []

  for (const config of chartConfigs.value) {
    const variable = getVariableForConfig(config)
    const series = getSeriesForConfig(config, visualRows)

    let image = ""

    if (includeImages) {
      image = shouldRenderFullExportImage
        ? await createExportChartImage(config, visualRows)
        : getChartImage(chartInstances.get(config.id))
    }

    items.push({
      id: config.id,
      type: config.type,
      key: variable.key,
      label: variable.label,
      unit: variable.unit,
      decimals: variable.decimals,
      color: variable.color,
      maximum: variable.maximum,
      labels: series.labels,
      values: series.values,
      colors: series.colors || [],
      totalPoints: sourceRows.length,
      visiblePoints: visualRows.length,
      image,
    })
  }

  return {
    enabled: items.length > 0,
    items,
  }
}

const getChartCount = () => {
  return chartConfigs.value.length
}

const hasCharts = () => {
  return chartConfigs.value.length > 0
}

defineExpose({
  getExportCharts,
  getChartCount,
  hasCharts,
})

onBeforeUnmount(() => {
  renderRequestId += 1

  if (renderFrameId !== null) {
    cancelRenderFrame(renderFrameId)
    renderFrameId = null
  }

  destroyCharts()
})
</script>
