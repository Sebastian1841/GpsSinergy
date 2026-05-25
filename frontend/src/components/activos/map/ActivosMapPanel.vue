<template>
  <section class="relative min-h-0 overflow-hidden rounded-xl border border-[#d8dee8] bg-[#dbe3ee] shadow-sm">
    <div ref="mapRef" class="absolute inset-0"></div>

    <!-- KPIs compactos dentro del mapa -->
    <div
      v-if="showKpis"
      class="pointer-events-none absolute bottom-3 left-3 z-[520]"
    >
      <TopStatsBar
        :activos="mapStatsActivos"
        :active-filter="activeFilter"
        class="pointer-events-auto"
        @select-filter="handleSelectFilter"
      />
    </div>

    <MapFloatingTools
      :show-kpis="showKpis"
      :show-geofences="showGeofences"
      :draw-mode="drawMode"
      :can-save-polygon="canSavePolygon"
      :draft-polygon-points="draftPolygonPoints"
      :map-type="mapType"
      :map-type-options="mapTypeOptions"
      @toggle-kpis="toggleKpis"
      @create-circle="handleCreateCircle"
      @create-polygon="handleCreatePolygon"
      @open-edit-geofence-modal="openEditGeofenceModal"
      @toggle-geofence-visibility="handleToggleGeofenceVisibility"
      @finish-polygon="finishPolygon"
      @undo-polygon-point="undoPolygonPoint"
      @cancel="handleCancel"
      @change-map-type="handleChangeMapType"
    />

    <!-- Indicador de capa activa -->
    <div class="pointer-events-none absolute right-3 top-3 z-[520]">
      <div class="flex items-center gap-1.5 rounded-xl border border-white/70 bg-white/90 px-2.5 py-1.5 text-[10px] font-black text-[#102372] shadow-lg backdrop-blur-md">
        <span class="h-1.5 w-1.5 rounded-full bg-[#FF6600]"></span>
        <span>{{ currentMapTypeOption.label }}</span>
      </div>
    </div>

    <!-- Ayuda contextual -->
    <div
      v-if="drawMode || editingDraft"
      class="absolute left-[68px] top-3 z-[500] max-w-[340px] rounded-xl border border-[#d8dee8] bg-white px-3 py-2 shadow-lg"
    >
      <p class="text-[11px] font-black text-[#102372]">
        {{ helperTitle }}
      </p>

      <p class="mt-0.5 text-[10px] font-semibold text-slate-500">
        {{ helperText }}
      </p>

      <div
        v-if="editingDraft?.type === 'polygon'"
        class="mt-2 flex flex-wrap gap-2"
      >
        <button
          type="button"
          class="cursor-pointer rounded-md bg-[#eef3ff] px-2 py-1 text-[10px] font-black text-[#102372] transition hover:bg-[#dbe6ff]"
          :class="editAddPoint ? 'bg-[#FF6600] text-white hover:bg-[#FF6600]' : ''"
          @click="editAddPoint = !editAddPoint"
        >
          + Punto
        </button>

        <button
          type="button"
          class="cursor-pointer rounded-md bg-red-50 px-2 py-1 text-[10px] font-black text-red-600 transition hover:bg-red-100"
          :disabled="editingDraft.coordinates.length <= 3"
          :class="editingDraft.coordinates.length <= 3 ? 'cursor-not-allowed opacity-50' : ''"
          @click="removeLastEditPoint"
        >
          Quitar último
        </button>

        <button
          type="button"
          class="cursor-pointer rounded-md bg-[#102372] px-2 py-1 text-[10px] font-black text-white transition hover:bg-[#0c1b59]"
          @click="handleStopEditing"
        >
          Listo
        </button>
      </div>

      <div
        v-if="editingDraft?.type === 'circle'"
        class="mt-2 flex gap-2"
      >
        <button
          type="button"
          class="cursor-pointer rounded-md bg-[#102372] px-2 py-1 text-[10px] font-black text-white transition hover:bg-[#0c1b59]"
          @click="handleStopEditing"
        >
          Listo
        </button>
      </div>
    </div>

    <!-- Modal responsive de selección de geocerca -->
    <div
      v-if="showGeofenceModal"
      class="absolute inset-0 z-[700] flex h-full items-end justify-center bg-slate-950/40 p-2 sm:items-center sm:p-4"
      @click.self="closeGeofenceModal"
    >
      <section
        class="flex max-h-[calc(100%-16px)] w-full flex-col overflow-hidden rounded-t-2xl border border-[#d8dee8] bg-white shadow-2xl sm:max-h-[calc(100%-32px)] sm:max-w-[760px] sm:rounded-2xl"
      >
        <header class="shrink-0 bg-[#102372] px-4 py-3 sm:px-5 sm:py-4">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-[10px] font-black uppercase tracking-[0.18em] text-white/60">
                Geocercas
              </p>

              <h2 class="mt-0.5 text-[14px] font-black leading-tight text-white sm:text-[15px]">
                Seleccionar geocerca para editar
              </h2>

              <p class="mt-1 text-[11px] font-semibold leading-snug text-white/60">
                Elige una geocerca y serás llevado al mapa para revisarla o modificarla.
              </p>
            </div>

            <button
              type="button"
              class="shrink-0 cursor-pointer rounded-lg px-2 py-1 text-[18px] font-black text-white/70 transition hover:bg-white/10 hover:text-white"
              @click="closeGeofenceModal"
            >
              ×
            </button>
          </div>
        </header>

        <div class="min-h-0 flex-1 overflow-auto p-3 sm:p-4">
          <div
            v-if="!geofenceItems.length"
            class="flex min-h-[180px] flex-col items-center justify-center rounded-xl border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-5 text-center"
          >
            <p class="text-[13px] font-black text-[#172033]">
              No hay geocercas creadas
            </p>

            <p class="mt-1 max-w-[320px] text-[11px] font-semibold text-slate-500">
              Crea una geocerca desde el menú Geocerca usando la opción circular o poligonal.
            </p>

            <button
              type="button"
              class="mt-4 cursor-pointer rounded-lg bg-[#102372] px-4 py-2 text-[11px] font-black text-white transition hover:bg-[#0c1b59]"
              @click="closeGeofenceModal"
            >
              Volver al mapa
            </button>
          </div>

          <div
            v-else
            class="grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            <article
              v-for="geofence in geofenceItems"
              :key="geofence.id"
              class="flex min-h-0 flex-col justify-between rounded-xl border border-[#d8dee8] bg-white p-3 shadow-sm transition hover:border-[#FF6600] sm:p-4"
              :class="selectedGeofenceId === geofence.id || editingDraft?.id === geofence.id
                ? 'border-[#FF6600] bg-[#fff7ed]'
                : ''"
            >
              <div class="min-w-0">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <h3 class="truncate text-[13px] font-black text-[#172033]">
                      {{ geofence.name }}
                    </h3>

                    <p class="mt-1 text-[11px] font-semibold text-slate-500">
                      {{ geofence.type === 'circle'
                        ? `Circular · ${geofence.radius} m`
                        : `Poligonal · ${geofence.coordinates.length} puntos`
                      }}
                    </p>
                  </div>

                  <span
                    class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black"
                    :class="geofence.type === 'circle'
                      ? 'bg-[#eef3ff] text-[#102372]'
                      : 'bg-[#fff3eb] text-[#FF6600]'"
                  >
                    {{ geofence.type === 'circle' ? 'Radio' : 'Polígono' }}
                  </span>
                </div>

                <div class="mt-3 rounded-lg bg-[#f8fafc] px-3 py-2">
                  <p class="text-[10px] font-bold text-slate-500">
                    {{ geofence.type === 'circle'
                      ? 'Permite editar centro y radio.'
                      : 'Permite editar puntos del perímetro.'
                    }}
                  </p>
                </div>
              </div>

              <div class="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  class="cursor-pointer rounded-lg bg-[#102372] px-3 py-2 text-[11px] font-black text-white transition hover:bg-[#0c1b59]"
                  @click="selectGeofenceToEdit(geofence.id)"
                >
                  Ir al mapa
                </button>

                <button
                  type="button"
                  class="cursor-pointer rounded-lg bg-red-50 px-3 py-2 text-[11px] font-black text-red-600 transition hover:bg-red-100"
                  @click="handleDeleteGeofence(geofence.id)"
                >
                  Eliminar
                </button>
              </div>
            </article>
          </div>
        </div>

        <footer class="shrink-0 border-t border-[#edf0f5] bg-[#f8fafc] px-3 py-3 sm:px-4">
          <button
            type="button"
            class="w-full cursor-pointer rounded-lg border border-[#d8dee8] bg-white px-4 py-2 text-[11px] font-black text-[#102372] transition hover:border-[#FF6600] hover:text-[#FF6600] sm:w-auto"
            @click="closeGeofenceModal"
          >
            Cerrar
          </button>
        </footer>
      </section>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from "vue"
import "leaflet/dist/leaflet.css"
import "../../../assets/styles/activos-map.css"

import MapFloatingTools from "./MapFloatingTools.vue"
import TopStatsBar from "./TopStatsBar.vue"
import { useActivosMap } from "../../../composables/activos/map/useActivosMap.js"

const props = defineProps({
  activos: {
    type: Array,
    default: () => [],
  },
  allActivos: {
    type: Array,
    default: () => [],
  },
  selectedId: {
    type: [Number, String],
    default: null,
  },
  activeFilter: {
    type: String,
    default: "all",
  },
  geofences: {
    type: Array,
    default: () => [],
  },
  itineraryRoute: {
    type: Object,
    default: null,
  },
  selectedItineraryPoint: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits([
  "select",
  "select-filter",
  "geofence-created",
  "geofence-updated",
  "geofence-deleted",
])

const mapRef = ref(null)
const showGeofenceModal = ref(false)
const selectedGeofenceId = ref(null)
const showGeofences = ref(true)
const showKpis = ref(true)
const mapType = ref("standard")

const mapTypeOptions = [
  {
    value: "standard",
    label: "Estándar",
    icon: "mapa",
  },
  {
    value: "satellite",
    label: "Satelital",
    icon: "satelital",
  },
  {
    value: "light",
    label: "Claro",
    icon: "claro",
  },
  {
    value: "voyager",
    label: "Urbano",
    icon: "urbano",
  },
  {
    value: "hot",
    label: "Simple",
    icon: "simple",
  },
]

const currentMapTypeOption = computed(() => {
  return mapTypeOptions.find((option) => option.value === mapType.value) || mapTypeOptions[0]
})

const mapStatsActivos = computed(() => {
  return props.allActivos.length ? props.allActivos : props.activos
})

const geofenceItems = computed(() => {
  return props.geofences || []
})

const visibleGeofences = computed(() => {
  const allGeofences = props.geofences || []

  if (showGeofences.value) {
    return allGeofences
  }

  if (selectedGeofenceId.value) {
    return allGeofences.filter((geofence) => {
      return geofence.id === selectedGeofenceId.value
    })
  }

  return []
})

const mapProps = {
  get activos() {
    return props.activos
  },
  get selectedId() {
    return props.selectedId
  },
  get geofences() {
    return visibleGeofences.value
  },
  get itineraryRoute() {
    return props.itineraryRoute
  },
  get selectedItineraryPoint() {
    return props.selectedItineraryPoint
  },
  get mapType() {
    return mapType.value
  },
}

const {
  drawMode,
  draftPolygonPoints,
  editingDraft,
  editAddPoint,
  canSavePolygon,
  helperTitle,
  helperText,

  startCircleDraw,
  startPolygonDraw,
  finishPolygon,
  undoPolygonPoint,
  cancelAll,

  startEditGeofence,
  stopEditing,
  removeLastEditPoint,
  deleteGeofence,
} = useActivosMap({
  props: mapProps,
  emit,
  mapRef,
})

const handleSelectFilter = (filter) => {
  emit("select-filter", filter)
}

const toggleKpis = () => {
  showKpis.value = !showKpis.value
}

const handleChangeMapType = (type) => {
  const exists = mapTypeOptions.some((option) => option.value === type)

  if (!exists) return

  mapType.value = type
}

const handleToggleGeofenceVisibility = () => {
  const nextValue = !showGeofences.value

  if (!nextValue) {
    if (editingDraft.value?.id) {
      selectedGeofenceId.value = editingDraft.value.id
    } else {
      selectedGeofenceId.value = null
    }
  }

  showGeofences.value = nextValue
}

const handleCreateCircle = () => {
  showGeofences.value = true
  showGeofenceModal.value = false
  selectedGeofenceId.value = null
  startCircleDraw()
}

const handleCreatePolygon = () => {
  showGeofences.value = true
  showGeofenceModal.value = false
  selectedGeofenceId.value = null
  startPolygonDraw()
}

const openEditGeofenceModal = () => {
  showGeofenceModal.value = true
}

const closeGeofenceModal = () => {
  showGeofenceModal.value = false
}

const selectGeofenceToEdit = (geofenceId) => {
  selectedGeofenceId.value = geofenceId
  showGeofenceModal.value = false
  startEditGeofence(geofenceId)
}

const handleStopEditing = () => {
  selectedGeofenceId.value = null
  stopEditing()
}

const handleCancel = () => {
  selectedGeofenceId.value = null
  cancelAll()
}

const handleDeleteGeofence = (geofenceId) => {
  if (selectedGeofenceId.value === geofenceId) {
    selectedGeofenceId.value = null
  }

  deleteGeofence(geofenceId)
}
</script>