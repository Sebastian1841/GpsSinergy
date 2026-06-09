<template>
  <section class="min-h-0 overflow-hidden rounded-xl border border-[#d8dee8] bg-white shadow-sm">
    <div class="flex items-center justify-between border-b border-[#edf0f5] px-3 py-3">
      <div>
        <p class="text-[11px] font-black text-[#102372]">Eventos del recorrido</p>

        <p class="text-[10px] font-semibold text-slate-500">
          {{ rows.length }} registros GPS encontrados
        </p>
      </div>

      <span class="rounded-full bg-[#eef3ff] px-2 py-1 text-[10px] font-black text-[#102372]">
        Itinerario
      </span>
    </div>

    <div
      v-if="!rows.length"
      class="flex min-h-[220px] flex-col items-center justify-center p-6 text-center"
    >
      <p class="text-[13px] font-black text-[#172033]">Sin registros para mostrar</p>

      <p class="mt-1 max-w-[320px] text-[11px] font-semibold text-slate-500">
        Busca una patente o dispositivo y selecciona un rango de fechas.
      </p>
    </div>

    <div v-else class="max-h-[420px] overflow-auto">
      <table class="min-w-full border-collapse text-left text-[11px]">
        <thead class="sticky top-0 z-10 bg-[#102372] text-[10px] uppercase text-white">
          <tr>
            <th
              v-for="column in itineraryColumns"
              :key="column.key"
              class="border-b border-[#0c1b59] px-3 py-2 font-black"
              :class="column.headerClass"
            >
              <button
                type="button"
                class="inline-flex max-w-full cursor-pointer items-center gap-1.5 rounded-md px-1 py-1 text-white/90 transition hover:bg-white/10 hover:text-white"
                :title="`Ordenar por ${column.label}`"
                @click="toggleSort(column.key)"
              >
                <span class="truncate">
                  {{ column.label }}
                </span>

                <span
                  class="flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[9px] font-black"
                  :class="
                    sortColumnKey === column.key
                      ? 'border-[#FF6600] bg-[#FF6600] text-white'
                      : 'border-white/30 bg-white/10 text-white/70'
                  "
                >
                  {{ getSortIcon(column.key) }}
                </span>
              </button>
            </th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="(row, rowIndex) in sortedRows"
            :key="getRowKey(row, rowIndex)"
            class="cursor-pointer border-b border-[#edf0f5] transition hover:bg-[#fff7ed]"
            :class="selectedPointId === row.id ? 'bg-[#fff7ed]' : 'bg-white'"
            @click="$emit('select-point', row)"
          >
            <td class="whitespace-nowrap px-3 py-2 font-black text-[#172033]">
              {{ getRowTimeLabel(row) }}
            </td>

            <td class="whitespace-nowrap px-3 py-2">
              <span
                class="rounded-full px-2 py-0.5 text-[10px] font-black"
                :class="
                  row.status === 'moving'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-[#fff3eb] text-[#FF6600]'
                "
              >
                {{ row.status === "moving" ? "Movimiento" : "Detenido" }}
              </span>
            </td>

            <td class="whitespace-nowrap px-3 py-2 font-semibold text-slate-700">
              {{ row.speedLabel || `${row.speed || 0} km/h` }}
            </td>

            <td class="min-w-[220px] px-3 py-2 font-semibold text-slate-600">
              <p class="line-clamp-1">
                {{ row.address || "Sin dirección" }}
              </p>

              <p class="mt-0.5 text-[10px] font-bold text-slate-400">
                {{ row.event || "Reporte GPS" }}
              </p>
            </td>

            <td class="whitespace-nowrap px-3 py-2 font-black text-[#102372]">
              {{ row.accumulatedDistanceLabel || "0,0 km" }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from "vue"

const props = defineProps({
  rows: {
    type: Array,
    default: () => [],
  },
  selectedPointId: {
    type: [String, Number],
    default: null,
  },
})

defineEmits(["select-point"])

const textCollator = new Intl.Collator("es", {
  numeric: true,
  sensitivity: "base",
})

const itineraryColumns = [
  {
    key: "timestamp",
    label: "Hora",
  },
  {
    key: "status",
    label: "Estado",
  },
  {
    key: "speed",
    label: "Vel.",
  },
  {
    key: "address",
    label: "Dirección",
  },
  {
    key: "accumulatedDistanceKm",
    label: "Km acum.",
  },
]

const statusOrder = {
  moving: 1,
  stopped: 2,
  idle: 3,
  offline: 4,
}

const sortColumnKey = ref("timestamp")
const sortDirection = ref("desc")

const parseSortableNumber = (value) => {
  if (value === null || value === undefined) return null

  const match = String(value)
    .replace(",", ".")
    .match(/-?\d+(\.\d+)?/)

  if (!match) return null

  const parsedValue = Number(match[0])

  return Number.isFinite(parsedValue) ? parsedValue : null
}

const parseSortableDate = (value) => {
  const timestamp = new Date(value || 0).getTime()

  return Number.isNaN(timestamp) ? null : timestamp
}

const normalizeText = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
}

const getSortableValue = (row, columnKey) => {
  if (columnKey === "timestamp") {
    return parseSortableDate(row.timestamp || row.date || row.fecha)
  }

  if (columnKey === "status") {
    return statusOrder[row.status] || 99
  }

  if (columnKey === "speed") {
    return parseSortableNumber(row.speed ?? row.speedLabel)
  }

  if (columnKey === "accumulatedDistanceKm") {
    return parseSortableNumber(row.accumulatedDistanceKm ?? row.accumulatedDistanceLabel)
  }

  return normalizeText(row[columnKey])
}

const compareValues = (valueA, valueB) => {
  const emptyA = valueA === null || valueA === undefined || valueA === ""
  const emptyB = valueB === null || valueB === undefined || valueB === ""

  if (emptyA && emptyB) return 0
  if (emptyA) return 1
  if (emptyB) return -1

  if (typeof valueA === "number" && typeof valueB === "number") {
    return valueA - valueB
  }

  return textCollator.compare(String(valueA), String(valueB))
}

const toggleSort = (columnKey) => {
  if (sortColumnKey.value !== columnKey) {
    sortColumnKey.value = columnKey
    sortDirection.value = "asc"
    return
  }

  sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc"
}

const getSortIcon = (columnKey) => {
  if (sortColumnKey.value !== columnKey) return "-"

  return sortDirection.value === "asc" ? "^" : "v"
}

const formatTimeFromTimestamp = (timestamp) => {
  const date = new Date(timestamp || 0)

  if (Number.isNaN(date.getTime())) return "-"

  return date.toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

const getRowTimeLabel = (row) => {
  return row.timeLabel || formatTimeFromTimestamp(row.timestamp || row.date || row.fecha)
}

const getRowKey = (row, index) => {
  return [row.id, row.assetId, row.timestamp, row.lat, row.lng, row.speed, index]
    .map((value) => String(value ?? ""))
    .join("-")
}

const sortedRows = computed(() => {
  const directionMultiplier = sortDirection.value === "asc" ? 1 : -1
  const columnKey = sortColumnKey.value

  return props.rows
    .map((row, index) => {
      return {
        row,
        index,
        sortValue: getSortableValue(row, columnKey),
      }
    })
    .sort((itemA, itemB) => {
      const result = compareValues(itemA.sortValue, itemB.sortValue)

      if (result !== 0) {
        return result * directionMultiplier
      }

      return itemA.index - itemB.index
    })
    .map((item) => item.row)
})
</script>
