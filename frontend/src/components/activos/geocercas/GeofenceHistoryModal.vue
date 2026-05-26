<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-[2147483646] bg-slate-950/35"
      @click.self="closeModal"
    >
      <section
        ref="modalRef"
        class="fixed flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.28)]"
        :class="isInteracting ? 'select-none' : ''"
        :style="modalFrameStyle"
        @click.stop
      >
        <header
          class="shrink-0 touch-none cursor-move border-b border-slate-200 bg-white"
          @pointerdown="startDrag"
          @dblclick="resetFrame"
        >
          <div class="flex h-1">
            <div class="w-2/3 bg-[#102372]"></div>
            <div class="w-1/3 bg-[#FF6600]"></div>
          </div>

          <div class="flex items-start justify-between gap-4 px-4 py-4 sm:px-5">
            <div class="min-w-0">
              <p class="text-[10px] font-black uppercase tracking-[0.18em] text-[#102372]">
                Historial de geocerca
              </p>

              <h2 class="mt-1 truncate text-[18px] font-black leading-tight text-slate-900">
                {{ modalTitle }}
              </h2>

              <p class="mt-1 max-w-[720px] text-[11px] font-semibold leading-relaxed text-slate-500">
                {{ modalDescription }}
              </p>
            </div>

            <button
              type="button"
              class="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-lg text-[20px] font-black text-slate-400 transition hover:bg-slate-100 hover:text-[#102372]"
              @pointerdown.stop
              @click.stop="closeModal"
            >
              ×
            </button>
          </div>
        </header>

        <div class="shrink-0 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-5">
          <div class="grid grid-cols-2 gap-2 md:grid-cols-4">
            <div
              v-for="metric in metrics"
              :key="metric.label"
              class="rounded-lg border border-slate-200 bg-white px-3 py-2"
            >
              <p class="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                {{ metric.label }}
              </p>

              <p
                class="mt-1 text-[20px] font-black leading-none"
                :class="metric.orange ? 'text-[#FF6600]' : 'text-[#102372]'"
              >
                {{ metric.value }}
              </p>
            </div>
          </div>

          <div class="mt-3 grid gap-2 lg:grid-cols-[1fr_180px_auto] lg:items-center">
            <div class="relative">
              <input
                v-model.trim="searchTerm"
                type="search"
                placeholder="Buscar por patente, vehículo, conductor o evento..."
                class="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#102372]"
              />
            </div>

            <select
              v-model="datePreset"
              class="h-10 cursor-pointer rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-black text-slate-700 outline-none transition focus:border-[#102372]"
            >
              <option value="all">Todas las fechas</option>
              <option value="today">Hoy</option>
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
              <option value="custom">Personalizado</option>
            </select>

            <div class="flex gap-2">
              <template v-if="datePreset === 'custom'">
                <input
                  v-model="dateFrom"
                  type="date"
                  class="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-bold text-slate-700 outline-none transition focus:border-[#102372] lg:w-[140px]"
                />

                <input
                  v-model="dateTo"
                  type="date"
                  class="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-bold text-slate-700 outline-none transition focus:border-[#102372] lg:w-[140px]"
                />
              </template>

              <button
                type="button"
                class="h-10 shrink-0 cursor-pointer rounded-lg border border-slate-200 bg-white px-4 text-[11px] font-black text-[#102372] transition hover:border-[#FF6600] hover:text-[#FF6600]"
                @pointerdown.stop
                @click.stop="clearFilters"
              >
                Limpiar
              </button>
            </div>
          </div>

          <p class="mt-2 text-[10px] font-bold text-slate-400">
            {{ sortedRows.length }} de {{ normalizedRows.length }} registros visibles
          </p>
        </div>

        <div class="min-h-0 flex-1 overflow-auto p-4 sm:p-5">
          <div
            v-if="!sortedRows.length"
            class="flex min-h-[230px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center"
          >
            <div class="mb-3 grid h-10 w-10 place-items-center rounded-lg bg-[#102372] text-[17px] font-black text-white">
              G
            </div>

            <p class="text-[13px] font-black text-slate-800">
              {{ emptyTitle }}
            </p>

            <p class="mt-1 max-w-[430px] text-[11px] font-semibold leading-relaxed text-slate-500">
              {{ emptyDescription }}
            </p>

            <button
              v-if="hasActiveFilters"
              type="button"
              class="mt-4 cursor-pointer rounded-lg bg-[#102372] px-4 py-2 text-[11px] font-black text-white transition hover:bg-[#0b1a58]"
              @pointerdown.stop
              @click.stop="clearFilters"
            >
              Quitar filtros
            </button>
          </div>

          <div
            v-else
            class="overflow-hidden rounded-xl border border-slate-200"
          >
            <div class="hidden grid-cols-[1.2fr_0.8fr_0.8fr_0.55fr_0.55fr] gap-3 border-b border-slate-200 bg-[#102372] px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] text-white/70 md:grid">
              <button
                type="button"
                class="flex cursor-pointer items-center gap-1 text-left transition hover:text-white"
                @click.stop="toggleSort('vehicle')"
              >
                Vehículo
                <span class="text-[9px]">{{ getSortIcon("vehicle") }}</span>
              </button>

              <button
                type="button"
                class="flex cursor-pointer items-center gap-1 text-left transition hover:text-white"
                @click.stop="toggleSort('event')"
              >
                Evento
                <span class="text-[9px]">{{ getSortIcon("event") }}</span>
              </button>

              <button
                type="button"
                class="flex cursor-pointer items-center gap-1 text-left transition hover:text-white"
                @click.stop="toggleSort('date')"
              >
                Fecha
                <span class="text-[9px]">{{ getSortIcon("date") }}</span>
              </button>

              <button
                type="button"
                class="flex cursor-pointer items-center gap-1 text-left transition hover:text-white"
                @click.stop="toggleSort('speed')"
              >
                Velocidad
                <span class="text-[9px]">{{ getSortIcon("speed") }}</span>
              </button>

              <button
                type="button"
                class="flex cursor-pointer items-center gap-1 text-left transition hover:text-white"
                @click.stop="toggleSort('duration')"
              >
                Tiempo
                <span class="text-[9px]">{{ getSortIcon("duration") }}</span>
              </button>
            </div>

            <div
              v-for="row in sortedRows"
              :key="row.key"
              class="grid gap-2 border-b border-slate-100 bg-white px-4 py-3 last:border-b-0 hover:bg-slate-50 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.55fr_0.55fr] md:items-center"
            >
              <div class="min-w-0">
                <p class="truncate text-[12px] font-black text-slate-900">
                  {{ row.event.patent || row.event.vehicle || "Sin patente" }}
                </p>

                <p class="truncate text-[10px] font-semibold text-slate-500">
                  {{ row.event.vehicle || "Vehículo" }} · {{ row.event.driver || "Sin conductor" }}
                </p>
              </div>

              <div>
                <span
                  class="inline-flex rounded-md px-2 py-1 text-[10px] font-black"
                  :class="getEventClass(row.event.eventType)"
                >
                  {{ row.event.eventLabel || row.eventLabel }}
                </span>
              </div>

              <p class="text-[11px] font-bold text-slate-600">
                {{ row.displayDate }}
              </p>

              <p class="text-[11px] font-bold text-slate-600">
                {{ row.event.speed ?? "-" }} km/h
              </p>

              <p class="text-[11px] font-bold text-slate-600">
                {{ row.event.duration || "-" }}
              </p>
            </div>
          </div>
        </div>

        <footer class="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:px-5">
          <p class="hidden text-[10px] font-bold text-slate-400 sm:block">
            Doble clic en el encabezado para restaurar el tamaño.
          </p>

          <button
            type="button"
            class="w-full cursor-pointer rounded-lg bg-[#102372] px-4 py-2 text-[11px] font-black text-white transition hover:bg-[#0b1a58] sm:w-auto"
            @pointerdown.stop
            @click.stop="closeModal"
          >
            Cerrar
          </button>
        </footer>

        <div
          class="absolute left-6 right-6 top-0 z-30 h-3 touch-none cursor-ns-resize"
          @pointerdown.stop="startResize($event, 'n')"
        ></div>

        <div
          class="absolute bottom-0 left-6 right-6 z-30 h-3 touch-none cursor-ns-resize"
          @pointerdown.stop="startResize($event, 's')"
        ></div>

        <div
          class="absolute bottom-6 left-0 top-6 z-30 w-3 touch-none cursor-ew-resize"
          @pointerdown.stop="startResize($event, 'w')"
        ></div>

        <div
          class="absolute bottom-6 right-0 top-6 z-30 w-3 touch-none cursor-ew-resize"
          @pointerdown.stop="startResize($event, 'e')"
        ></div>

        <div
          class="absolute left-0 top-0 z-40 h-7 w-7 touch-none cursor-nwse-resize"
          @pointerdown.stop="startResize($event, 'nw')"
        ></div>

        <div
          class="absolute right-0 top-0 z-40 h-7 w-7 touch-none cursor-nesw-resize"
          @pointerdown.stop="startResize($event, 'ne')"
        ></div>

        <div
          class="absolute bottom-0 left-0 z-40 h-7 w-7 touch-none cursor-nesw-resize"
          @pointerdown.stop="startResize($event, 'sw')"
        ></div>

        <div
          class="absolute bottom-0 right-0 z-40 h-7 w-7 touch-none cursor-nwse-resize"
          @pointerdown.stop="startResize($event, 'se')"
        >
          <div class="absolute bottom-2 right-2 h-3 w-3 rounded-sm border-b-2 border-r-2 border-slate-400"></div>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue"

import { useFloatingModal } from "../../../composables/activos/fleet/terminal/useFloatingModal.js"

const DEFAULT_DATE_PRESET = "all"

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  geofence: {
    type: Object,
    default: null,
  },
  events: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(["update:modelValue"])

const {
  modalRef,
  modalFrameStyle,
  isInteracting,
  resetFrame,
  keepFrameInsideViewport,
  startDrag,
  startResize,
  stopInteraction,
} = useFloatingModal({
  defaultWidth: 920,
  defaultHeight: 620,
  minWidth: 520,
  minHeight: 360,
  margin: 12,
})

const searchTerm = ref("")
const datePreset = ref(DEFAULT_DATE_PRESET)
const dateFrom = ref("")
const dateTo = ref("")

const sortKey = ref("date")
const sortDirection = ref("desc")

const safeEvents = computed(() => {
  return Array.isArray(props.events) ? props.events : []
})

const hasGeofence = computed(() => {
  return Boolean(props.geofence)
})

const modalTitle = computed(() => {
  return props.geofence?.name || "Historial de geocercas"
})

const modalDescription = computed(() => {
  if (hasGeofence.value) {
    return "Consulta los movimientos registrados dentro de la zona seleccionada."
  }

  return "El historial puede abrirse aunque todavía no exista una geocerca seleccionada."
})

const normalizeText = (value) => {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

const getEventLabel = (type) => {
  const labels = {
    entry: "Entrada",
    exit: "Salida",
    pass: "Paso",
    deviation: "Desvío",
  }

  return labels[type] || "Evento"
}

const parseLocalDateInput = (value, endOfDay = false) => {
  if (!value) return null

  const date = new Date(`${value}T00:00:00`)

  if (Number.isNaN(date.getTime())) return null

  if (endOfDay) {
    date.setHours(23, 59, 59, 999)
  }

  return date.getTime()
}

const parseEventDate = (value) => {
  if (!value) return null

  const direct = new Date(value)

  if (!Number.isNaN(direct.getTime())) {
    return direct.getTime()
  }

  const normalized = String(value).trim()
  const match = normalized.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})(?:\s+(\d{1,2}):(\d{2}))?/,
  )

  if (!match) return null

  const [, day, month, year, hour = "0", minute = "0"] = match
  const fullYear = year.length === 2 ? `20${year}` : year

  const parsed = new Date(
    Number(fullYear),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
  )

  if (Number.isNaN(parsed.getTime())) return null

  return parsed.getTime()
}

const formatEventDate = (rawDate, time) => {
  if (!rawDate) return "Sin fecha"
  if (!time) return rawDate

  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(time))
}

const getEventDateValue = (event) => {
  return event.date || event.timestamp || event.createdAt || event.created_at || null
}

const normalizedRows = computed(() => {
  return safeEvents.value.map((event, index) => {
    const rawDate = getEventDateValue(event)
    const time = parseEventDate(rawDate)
    const eventLabel = getEventLabel(event.eventType)
    const displayDate = formatEventDate(rawDate, time)

    const searchText = normalizeText([
      event.patent,
      event.vehicle,
      event.driver,
      event.eventLabel,
      eventLabel,
      displayDate,
      event.speed,
      event.duration,
    ].join(" "))

    return {
      key: event.id || `${event.patent || event.vehicle || "event"}-${rawDate || index}`,
      index,
      event,
      eventLabel,
      displayDate,
      searchText,
      time,
    }
  })
})

const activeDateRange = computed(() => {
  const now = new Date()

  if (datePreset.value === "all") {
    return {
      start: null,
      end: null,
    }
  }

  const end = new Date(now)
  end.setHours(23, 59, 59, 999)

  const start = new Date(now)
  start.setHours(0, 0, 0, 0)

  if (datePreset.value === "today") {
    return {
      start: start.getTime(),
      end: end.getTime(),
    }
  }

  if (datePreset.value === "7d") {
    start.setDate(start.getDate() - 6)

    return {
      start: start.getTime(),
      end: end.getTime(),
    }
  }

  if (datePreset.value === "30d") {
    start.setDate(start.getDate() - 29)

    return {
      start: start.getTime(),
      end: end.getTime(),
    }
  }

  return {
    start: parseLocalDateInput(dateFrom.value),
    end: parseLocalDateInput(dateTo.value, true),
  }
})

const searchNeedle = computed(() => {
  return normalizeText(searchTerm.value)
})

const filteredRows = computed(() => {
  const needle = searchNeedle.value
  const { start, end } = activeDateRange.value

  return normalizedRows.value.filter((row) => {
    if (needle && !row.searchText.includes(needle)) {
      return false
    }

    if (!start && !end) {
      return true
    }

    if (!row.time) {
      return false
    }

    if (start && row.time < start) {
      return false
    }

    if (end && row.time > end) {
      return false
    }

    return true
  })
})

const getDurationSeconds = (value) => {
  if (typeof value === "number") return value

  const text = normalizeText(value).replace(",", ".")

  if (!text) return 0

  const clockMatch = text.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/)

  if (clockMatch) {
    const [, hours, minutes, seconds = "0"] = clockMatch

    return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds)
  }

  const hours = Number(text.match(/(\d+(?:\.\d+)?)\s*h/)?.[1] || 0)
  const minutes = Number(text.match(/(\d+(?:\.\d+)?)\s*m/)?.[1] || 0)
  const seconds = Number(text.match(/(\d+(?:\.\d+)?)\s*s/)?.[1] || 0)

  if (hours || minutes || seconds) {
    return hours * 3600 + minutes * 60 + seconds
  }

  const numericValue = Number.parseFloat(text)

  return Number.isNaN(numericValue) ? 0 : numericValue
}

const getNumericValue = (value) => {
  const number = Number(String(value ?? "").replace(",", "."))

  return Number.isNaN(number) ? 0 : number
}

const getSortValue = (row) => {
  if (sortKey.value === "vehicle") {
    return normalizeText(row.event.patent || row.event.vehicle || "")
  }

  if (sortKey.value === "event") {
    return normalizeText(row.event.eventLabel || row.eventLabel)
  }

  if (sortKey.value === "date") {
    return row.time || 0
  }

  if (sortKey.value === "speed") {
    return getNumericValue(row.event.speed)
  }

  if (sortKey.value === "duration") {
    return getDurationSeconds(row.event.duration)
  }

  return ""
}

const sortedRows = computed(() => {
  const direction = sortDirection.value === "asc" ? 1 : -1

  return [...filteredRows.value].sort((a, b) => {
    const firstValue = getSortValue(a)
    const secondValue = getSortValue(b)

    if (typeof firstValue === "number" && typeof secondValue === "number") {
      const result = firstValue - secondValue

      return result === 0 ? a.index - b.index : result * direction
    }

    const result = String(firstValue).localeCompare(String(secondValue), "es", {
      numeric: true,
      sensitivity: "base",
    })

    return result === 0 ? a.index - b.index : result * direction
  })
})

const getDefaultSortDirection = (key) => {
  if (["date", "speed", "duration"].includes(key)) {
    return "desc"
  }

  return "asc"
}

const toggleSort = (key) => {
  if (sortKey.value === key) {
    sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc"
    return
  }

  sortKey.value = key
  sortDirection.value = getDefaultSortDirection(key)
}

const getSortIcon = (key) => {
  if (sortKey.value !== key) return "↕"

  return sortDirection.value === "asc" ? "↑" : "↓"
}

const uniqueVehicles = computed(() => {
  return new Set(
    filteredRows.value
      .map((row) => row.event.patent || row.event.vehicle)
      .filter(Boolean),
  ).size
})

const entryCount = computed(() => {
  return filteredRows.value.filter((row) => row.event.eventType === "entry").length
})

const exitCount = computed(() => {
  return filteredRows.value.filter((row) => row.event.eventType === "exit").length
})

const metrics = computed(() => [
  {
    label: "Eventos",
    value: filteredRows.value.length,
    orange: false,
  },
  {
    label: "Vehículos",
    value: uniqueVehicles.value,
    orange: false,
  },
  {
    label: "Entradas",
    value: entryCount.value,
    orange: true,
  },
  {
    label: "Salidas",
    value: exitCount.value,
    orange: true,
  },
])

const hasActiveFilters = computed(() => {
  return Boolean(searchTerm.value) || datePreset.value !== DEFAULT_DATE_PRESET
})

const emptyTitle = computed(() => {
  if (normalizedRows.value.length && hasActiveFilters.value) {
    return "No hay resultados"
  }

  if (hasGeofence.value) {
    return "Sin historial disponible"
  }

  return "No hay geocerca seleccionada"
})

const emptyDescription = computed(() => {
  if (normalizedRows.value.length && hasActiveFilters.value) {
    return "No existen registros que coincidan con la búsqueda o el filtro de fecha actual."
  }

  if (hasGeofence.value) {
    return "Cuando existan eventos asociados a esta geocerca, aparecerán en este panel."
  }

  return "Crea una geocerca o selecciona una existente para revisar su historial."
})

const resetFiltersToDefault = () => {
  searchTerm.value = ""
  datePreset.value = DEFAULT_DATE_PRESET
  dateFrom.value = ""
  dateTo.value = ""
  sortKey.value = "date"
  sortDirection.value = "desc"
}

const clearFilters = () => {
  resetFiltersToDefault()
}

const closeModal = () => {
  stopInteraction()
  emit("update:modelValue", false)
}

const getEventClass = (type) => {
  const classes = {
    entry: "bg-emerald-50 text-emerald-700",
    exit: "bg-orange-50 text-[#FF6600]",
    pass: "bg-blue-50 text-[#102372]",
    deviation: "bg-red-50 text-red-600",
  }

  return classes[type] || "bg-slate-100 text-slate-600"
}

const handleKeydown = (event) => {
  if (event.key === "Escape" && props.modelValue) {
    closeModal()
  }
}

watch(
  () => props.modelValue,
  async (isOpen) => {
    if (!isOpen) {
      stopInteraction()
      window.removeEventListener("resize", keepFrameInsideViewport)
      window.removeEventListener("keydown", handleKeydown)
      return
    }

    resetFiltersToDefault()

    await nextTick()

    resetFrame()

    window.removeEventListener("resize", keepFrameInsideViewport)
    window.addEventListener("resize", keepFrameInsideViewport)

    window.removeEventListener("keydown", handleKeydown)
    window.addEventListener("keydown", handleKeydown)
  },
  {
    immediate: true,
  },
)

onBeforeUnmount(() => {
  stopInteraction()
  window.removeEventListener("resize", keepFrameInsideViewport)
  window.removeEventListener("keydown", handleKeydown)
})
</script>