<template>
  <aside class="flex h-full min-h-0 flex-col overflow-hidden bg-white">
    <!-- Navegación lateral -->
    <div class="shrink-0 border-b border-[#d8dee8] bg-white px-3 py-3">
      <div class="grid grid-cols-3 gap-1 rounded-xl border border-[#d8dee8] bg-[#f8fafc] p-1">
        <button
          v-for="section in menuSections"
          :key="section.key"
          type="button"
          class="group flex min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[10px] font-black transition"
          :class="localActiveSection === section.key
            ? 'bg-[#102372] text-white shadow-sm'
            : 'text-[#102372] hover:bg-white hover:text-[#FF6600]'"
          @click="setSection(section.key)"
        >
          <svg
            viewBox="0 0 24 24"
            class="h-3.5 w-3.5 shrink-0"
            fill="none"
            aria-hidden="true"
          >
            <path
              v-if="section.key === 'activos'"
              d="M4.75 16.5h14.5M6.75 16.5l1.15-5.75A2.25 2.25 0 0 1 10.1 9h3.8a2.25 2.25 0 0 1 2.2 1.75l1.15 5.75M7.25 16.5v1.25M16.75 16.5v1.25M9 12.25h6"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />

            <path
              v-else-if="section.key === 'itinerarios'"
              d="M6.5 6.75h.01M17.5 17.25h.01M8.75 6.75h3.1c2.35 0 4.25 1.9 4.25 4.25s-1.9 4.25-4.25 4.25H10.5M6.5 4.5a2.25 2.25 0 1 1 0 4.5 2.25 2.25 0 0 1 0-4.5ZM17.5 15a2.25 2.25 0 1 1 0 4.5 2.25 2.25 0 0 1 0-4.5Z"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />

            <path
              v-else
              d="M12 21s7-4.6 7-11.25A7 7 0 0 0 5 9.75C5 16.4 12 21 12 21ZM12 12.25a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>

          <span class="truncate">
            {{ section.label }}
          </span>

          <span
            v-if="section.count !== null"
            class="rounded-md px-1.5 py-0.5 text-[9px] font-black"
            :class="localActiveSection === section.key
              ? 'bg-white/15 text-white'
              : 'bg-[#102372]/10 text-[#102372] group-hover:bg-[#FF6600]/10 group-hover:text-[#FF6600]'"
          >
            {{ section.count }}
          </span>
        </button>
      </div>

      <!-- Buscador + acciones -->
      <div
        v-if="localActiveSection !== 'itinerarios'"
        class="mt-3 flex items-center gap-2"
      >
        <div class="relative min-w-0 flex-1">
          <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <svg
              viewBox="0 0 24 24"
              class="h-4 w-4"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="m20 20-4.35-4.35M18 10.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          </span>

          <input
            :value="search"
            type="text"
            :placeholder="searchPlaceholder"
            class="h-[36px] w-full rounded-lg border border-[#d8dee8] bg-white pl-9 pr-8 text-[12px] font-semibold text-[#172033] outline-none placeholder:text-slate-400 focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10"
            @input="$emit('update:search', $event.target.value)"
          />

          <button
            v-if="search"
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-base leading-none text-slate-400 transition hover:text-[#FF6600]"
            @click="$emit('update:search', '')"
          >
            ×
          </button>
        </div>

        <button
          v-if="localActiveSection === 'activos' && sortColumnKey"
          type="button"
          class="flex h-[36px] shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[#FF6600]/30 bg-[#fff7ed] px-3 text-[10px] font-black text-[#FF6600] transition hover:border-[#FF6600] hover:bg-white"
          title="Limpiar ordenamiento"
          @click="clearSort"
        >
          Limpiar orden
        </button>

        <button
          v-if="localActiveSection === 'activos'"
          type="button"
          class="flex h-[36px] shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[#102372]/20 bg-[#102372] px-3 text-[10px] font-black text-white shadow-sm transition hover:border-[#FF6600] hover:bg-[#0c1b59]"
          title="Agregar activo"
          @click="$emit('open-add-activo')"
        >
          <svg
            viewBox="0 0 24 24"
            class="h-4 w-4 shrink-0"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
            />
          </svg>

          <span class="whitespace-nowrap">
            Agregar activo
          </span>
        </button>

        <!-- Dropdown de columnas -->
        <div
          v-if="localActiveSection === 'activos'"
          class="relative shrink-0"
        >
          <button
            type="button"
            class="flex h-[36px] w-[36px] cursor-pointer items-center justify-center rounded-lg border bg-[#f8fafc] text-[#102372] transition hover:bg-white hover:text-[#FF6600]"
            :class="showColumns
              ? 'border-[#FF6600] bg-[#fff7ed] text-[#FF6600]'
              : 'border-[#d8dee8]'"
            title="Filtrar columnas visibles"
            @click.stop="toggleColumnsDropdown"
          >
            <svg
              viewBox="0 0 24 24"
              class="h-4 w-4"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M4.75 6.75h14.5L14 12.5v4.75l-4 1.75v-6.5L4.75 6.75Z"
                stroke="currentColor"
                stroke-width="2"
                stroke-linejoin="round"
              />
            </svg>
          </button>

          <div
            v-if="showColumns"
            class="absolute right-0 top-[42px] z-50 w-[270px] overflow-hidden rounded-xl border border-[#d8dee8] bg-white shadow-2xl"
            @click.stop
            @pointerdown.stop
          >
            <div class="border-b border-[#edf1f5] bg-[#f8fafc] px-3 py-2">
              <div class="flex items-center justify-between gap-2">
                <div class="min-w-0">
                  <p class="truncate text-[10px] font-black uppercase tracking-[0.12em] text-[#102372]">
                    Columnas visibles
                  </p>

                  <p class="mt-0.5 text-[10px] font-semibold text-slate-500">
                    {{ visibleColumns.length }} de {{ configurableColumns.length }} activas
                  </p>
                </div>

                <button
                  type="button"
                  class="cursor-pointer rounded-md px-2 py-1 text-[10px] font-black text-[#FF6600] transition hover:bg-white hover:text-[#102372]"
                  @click="resetColumns"
                >
                  Restaurar
                </button>
              </div>

              <div class="relative mt-2">
                <span class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg
                    viewBox="0 0 24 24"
                    class="h-3.5 w-3.5"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="m20 20-4.35-4.35M18 10.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                    />
                  </svg>
                </span>

                <input
                  v-model="columnSearch"
                  type="text"
                  placeholder="Buscar variable o columna..."
                  class="h-8 w-full rounded-lg border border-[#d8dee8] bg-white pl-8 pr-7 text-[11px] font-semibold text-[#172033] outline-none placeholder:text-slate-400 focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10"
                />

                <button
                  v-if="columnSearch"
                  type="button"
                  class="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer text-[14px] leading-none text-slate-400 transition hover:text-[#FF6600]"
                  @click="columnSearch = ''"
                >
                  ×
                </button>
              </div>
            </div>

            <div class="max-h-[250px] overflow-auto p-2">
              <label
                v-for="column in filteredConfigurableColumns"
                :key="column.key"
                class="flex cursor-pointer items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 text-[11px] font-bold text-slate-600 transition hover:border-[#FF6600]/30 hover:bg-[#fff7ed] hover:text-[#102372]"
                :class="column.locked ? 'opacity-80' : ''"
              >
                <input
                  v-model="visibleColumnKeys"
                  type="checkbox"
                  :value="column.key"
                  class="h-3.5 w-3.5 cursor-pointer accent-[#FF6600]"
                  :disabled="column.locked"
                />

                <span class="min-w-0 flex-1 truncate">
                  {{ column.label }}
                </span>

                <span
                  v-if="column.locked"
                  class="shrink-0 rounded-md bg-[#eef3ff] px-1.5 py-0.5 text-[9px] font-black text-[#102372]"
                >
                  fija
                </span>
              </label>

              <div
                v-if="!filteredConfigurableColumns.length"
                class="px-2 py-5 text-center"
              >
                <p class="text-[11px] font-black text-[#102372]">
                  Sin columnas encontradas
                </p>

                <p class="mt-1 text-[10px] font-semibold text-slate-500">
                  Prueba buscando por nombre de variable.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <FleetTable
      v-if="localActiveSection === 'activos'"
      :activos="sortedActivos"
      :visible-columns="visibleColumns"
      :selected-id="selectedId"
      :first-visible-column-key="firstVisibleColumnKey"
      :sort-column-key="sortColumnKey"
      :get-sort-icon="getSortIcon"
      :get-cell-value="getCellValue"
      @select="handleRowClick"
      @toggle-sort="handleToggleSort"
      @open-context-menu="handleTableContextMenu"
    />

    <div
      v-else-if="localActiveSection === 'itinerarios'"
      class="min-h-0 flex-1 overflow-hidden bg-[#f8fafc]"
    >
      <ItineraryPanel
        :activos="itineraryActivos"
        class="h-full min-h-0 rounded-none border-0 shadow-none"
        @route-selected="$emit('route-selected', $event)"
        @point-selected="$emit('point-selected', $event)"
        @clear-route="$emit('clear-route', $event)"
      />
    </div>

    <div
      v-else
      class="min-h-0 flex-1 overflow-auto bg-[#f8fafc] p-3"
    >
      <div class="flex min-h-full flex-col rounded-2xl border border-[#d8dee8] bg-white p-4">
        <div class="mb-4 flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-[10px] font-black uppercase tracking-[0.16em] text-[#FF6600]">
              Control territorial
            </p>

            <h3 class="mt-1 truncate text-[14px] font-black text-[#102372]">
              Geocercas
            </h3>

            <p class="mt-1 text-[11px] font-semibold leading-relaxed text-slate-500">
              Zonas y rutas creadas en el mapa. Puedes revisarlas y eliminarlas desde este panel.
            </p>
          </div>

          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#102372]/10 text-[#102372]">
            <svg
              viewBox="0 0 24 24"
              class="h-5 w-5"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M12 21s7-4.6 7-11.25A7 7 0 0 0 5 9.75C5 16.4 12 21 12 21ZM12 12.25a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
        </div>

        <div
          v-if="!geofenceItems.length"
          class="flex min-h-[180px] flex-col items-center justify-center rounded-xl border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-4 text-center"
        >
          <p class="text-[12px] font-black text-[#102372]">
            No hay geocercas creadas
          </p>

          <p class="mt-1 max-w-[280px] text-[11px] font-semibold leading-relaxed text-slate-500">
            Crea una geocerca desde las herramientas del mapa para verla en esta sección.
          </p>
        </div>

        <div
          v-else-if="!filteredGeofenceItems.length"
          class="flex min-h-[160px] flex-col items-center justify-center rounded-xl border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-4 text-center"
        >
          <p class="text-[12px] font-black text-[#102372]">
            Sin resultados
          </p>

          <p class="mt-1 max-w-[280px] text-[11px] font-semibold leading-relaxed text-slate-500">
            No encontramos geocercas con ese criterio de búsqueda.
          </p>
        </div>

        <div
          v-else
          class="grid gap-2"
        >
          <article
            v-for="geofence in filteredGeofenceItems"
            :key="geofence.id"
            class="group rounded-xl border bg-white p-3 shadow-sm transition hover:border-[#FF6600] hover:bg-[#fff7ed]"
            :class="normalizeId(selectedGeofenceId) === normalizeId(geofence.id)
              ? 'border-[#FF6600] bg-[#fff7ed]'
              : 'border-[#d8dee8]'"
          >
            <button
              type="button"
              class="flex w-full cursor-pointer items-start gap-3 text-left"
              @click="handleGeofenceSelect(geofence)"
            >
              <span
                class="mt-1 h-3 w-3 shrink-0 rounded-full border border-slate-200"
                :style="{ backgroundColor: getGeofenceColor(geofence) }"
              ></span>

              <span class="min-w-0 flex-1">
                <span class="flex items-start justify-between gap-2">
                  <span class="min-w-0">
                    <span class="block truncate text-[12px] font-black text-[#172033]">
                      {{ geofence.name }}
                    </span>

                    <span class="mt-1 block text-[10px] font-bold text-slate-500">
                      {{ getGeofenceMeta(geofence) }}
                    </span>
                  </span>

                  <span
                    class="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black"
                    :class="getGeofenceBadgeClass(geofence)"
                  >
                    {{ getGeofenceBadgeLabel(geofence) }}
                  </span>
                </span>
              </span>
            </button>

            <div class="mt-3 flex items-center justify-between gap-2 rounded-lg bg-[#f8fafc] px-3 py-2">
              <p class="min-w-0 truncate text-[10px] font-bold text-slate-500">
                {{ getGeofenceDescription(geofence) }}
              </p>

              <button
                type="button"
                class="shrink-0 cursor-pointer rounded-md bg-red-50 px-2 py-1 text-[10px] font-black text-red-600 transition hover:bg-red-100"
                @click.stop="confirmDeleteGeofence(geofence)"
              >
                Eliminar
              </button>
            </div>
          </article>
        </div>
      </div>
    </div>

    <div
      v-if="localActiveSection === 'activos'"
      class="shrink-0 border-t border-[#d8dee8] bg-[#f8fafc] px-3 py-2"
    >
      <button
        type="button"
        class="w-full cursor-pointer rounded-lg border border-[#d8dee8] bg-white px-3 py-2 text-[11px] font-black text-[#102372] transition hover:border-[#FF6600] hover:text-[#FF6600]"
        @click="$emit('select-filter', 'all')"
      >
        Ver todos los activos →
      </button>
    </div>

    <FleetContextMenu
      :is-open="deviceContextMenu.isOpen"
      :x="deviceContextMenu.x"
      :y="deviceContextMenu.y"
      :activo="deviceContextMenu.activo"
      @close="closeDeviceContextMenu"
      @action="handleDeviceAction"
    />
  </aside>
</template>

<script setup>
import { computed, ref, watch } from "vue"
import ItineraryPanel from "../itinerarios/ItineraryPanel.vue"
import FleetTable from "./FleetTable.vue"
import FleetContextMenu from "./FleetContextMenu.vue"
import { useFleetColumns } from "../../../composables/activos/fleet/useFleetColumns"
import { useFleetSorting } from "../../../composables/activos/fleet/useFleetSorting"
import {
  getGeofenceBadgeClass,
  getGeofenceBadgeLabel,
  getGeofenceColor,
  getGeofenceDescription,
  getGeofenceMeta,
} from "../../../utils/geofenceUtils.js"

const props = defineProps({
  activos: {
    type: Array,
    default: () => [],
  },
  allActivos: {
    type: Array,
    default: () => [],
  },
  geofences: {
    type: Array,
    default: () => [],
  },
  selectedGeofenceId: {
    type: [String, Number],
    default: null,
  },
  selectedId: {
    type: [Number, String],
    default: null,
  },
  search: {
    type: String,
    default: "",
  },
  activeFilter: {
    type: String,
    default: "all",
  },
  activeSection: {
    type: String,
    default: "activos",
  },
  columns: {
    type: Array,
    default: () => [
      { key: "estado", label: "Estado", width: "92px", locked: true },
      { key: "vehiculo", label: "Activo", width: "160px", locked: true },
      { key: "datosUlt", label: "Último", width: "92px" },
      { key: "trackerModelLabel", label: "Modelo GPS", width: "135px" },
      { key: "imei", label: "IMEI", width: "140px" },
      { key: "protocol", label: "Protocolo", width: "90px" },
      { key: "fechaIngreso", label: "Ingreso", width: "105px" },
      { key: "horometroDiario", label: "Hor. diario", width: "100px", align: "right" },
      { key: "horometroTotal", label: "Hor. total", width: "100px", align: "right" },
      { key: "odometro", label: "Odómetro", width: "110px", align: "right" },
    ],
  },
})

const emit = defineEmits([
  "select",
  "update:search",
  "select-filter",
  "update:active-section",
  "select-section",
  "route-selected",
  "point-selected",
  "clear-route",
  "open-add-activo",
  "device-action",
  "geofence-selected",
  "geofence-delete",
])

const showColumns = ref(false)
const localActiveSection = ref(props.activeSection || "activos")

const deviceContextMenu = ref({
  isOpen: false,
  x: 0,
  y: 0,
  activo: null,
})

const normalizeId = (value) => {
  return String(value ?? "")
}

const normalizeText = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
}

const getNestedValue = (row, path) => {
  return path.split(".").reduce((value, key) => value?.[key], row)
}

const getCellValue = (activo, column) => {
  if (typeof column.formatter === "function") {
    return column.formatter(activo)
  }

  const value = getNestedValue(activo, column.key)

  if (value === null || value === undefined || value === "") {
    return "-"
  }

  return String(value)
}

const {
  columnSearch,
  visibleColumnKeys,
  configurableColumns,
  filteredConfigurableColumns,
  visibleColumns,
  firstVisibleColumnKey,
  resetColumns,
} = useFleetColumns({
  columns: computed(() => props.columns),
  normalizeText,
})

const {
  sortColumnKey,
  sortedActivos,
  toggleSort,
  clearSort,
  getSortIcon,
} = useFleetSorting({
  activos: computed(() => props.activos),
  columns: computed(() => props.columns),
  getCellValue,
  normalizeText,
})

const menuSections = computed(() => [
  {
    key: "activos",
    label: "Activos",
    count: props.allActivos.length || props.activos.length,
  },
  {
    key: "itinerarios",
    label: "Itinerarios",
    count: null,
  },
  {
    key: "geocercas",
    label: "Geocercas",
    count: props.geofences.length,
  },
])

const itineraryActivos = computed(() => {
  return props.allActivos.length ? props.allActivos : props.activos
})

const geofenceItems = computed(() => {
  return props.geofences || []
})

const filteredGeofenceItems = computed(() => {
  const term = normalizeText(props.search)

  if (!term) return geofenceItems.value

  return geofenceItems.value.filter((geofence) => {
    return (
      normalizeText(geofence.name).includes(term) ||
      normalizeText(geofence.type).includes(term) ||
      normalizeText(getGeofenceBadgeLabel(geofence)).includes(term) ||
      normalizeText(getGeofenceMeta(geofence)).includes(term)
    )
  })
})

const searchPlaceholder = computed(() => {
  const placeholders = {
    activos: "Buscar activo, IMEI, modelo GPS...",
    geocercas: "Buscar geocerca o zona...",
  }

  return placeholders[localActiveSection.value] || placeholders.activos
})

const confirmDeleteGeofence = (geofence) => {
  if (!geofence?.id) return

  const geofenceName = geofence.name || "esta geocerca"
  const confirmed = window.confirm(`¿Eliminar la geocerca "${geofenceName}"?`)

  if (!confirmed) return

  emit("geofence-delete", geofence.id)
}

const handleGeofenceSelect = (geofence) => {
  if (!geofence?.id) return

  emit("geofence-selected", geofence)
}

const closeDeviceContextMenu = () => {
  deviceContextMenu.value = {
    isOpen: false,
    x: 0,
    y: 0,
    activo: null,
  }
}

const setSection = (section) => {
  closeDeviceContextMenu()

  localActiveSection.value = section

  if (section !== "activos") {
    showColumns.value = false
    columnSearch.value = ""
  }

  emit("update:active-section", section)
  emit("select-section", section)
}

const toggleColumnsDropdown = () => {
  closeDeviceContextMenu()
  showColumns.value = !showColumns.value
}

const handleRowClick = (activo) => {
  closeDeviceContextMenu()
  emit("select", activo.id)
}

const handleToggleSort = (columnKey) => {
  closeDeviceContextMenu()
  toggleSort(columnKey)
}

const openDeviceContextMenu = (event, activo) => {
  if (!activo) return

  event.preventDefault?.()
  event.stopPropagation?.()

  showColumns.value = false

  const menuWidth = 186
  const menuHeight = 118
  const padding = 8

  const viewportWidth = window.innerWidth || document.documentElement.clientWidth
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight

  const rawX = event.clientX || padding
  const rawY = event.clientY || padding

  const x = Math.min(rawX, viewportWidth - menuWidth - padding)
  const y = Math.min(rawY, viewportHeight - menuHeight - padding)

  deviceContextMenu.value = {
    isOpen: true,
    x: Math.max(padding, x),
    y: Math.max(padding, y),
    activo,
  }
}

const handleTableContextMenu = ({ event, activo }) => {
  openDeviceContextMenu(event, activo)
}

const handleDeviceAction = ({ action, activo }) => {
  emit("device-action", {
    action,
    activo,
  })

  closeDeviceContextMenu()
}

watch(
  () => props.activeSection,
  (nextSection) => {
    localActiveSection.value = nextSection || "activos"

    if (nextSection !== "activos") {
      showColumns.value = false
      columnSearch.value = ""
      closeDeviceContextMenu()
    }
  },
)
</script>