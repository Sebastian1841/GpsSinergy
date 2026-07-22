<template>
  <Teleport to="body">
    <div
      v-if="modelValue && !isPlannedRoutePanelHidden"
      class="pointer-events-none fixed bottom-4 right-4 top-[64px] z-[945] flex w-[calc(100vw-32px)] max-w-[430px]"
    >
      <section
        class="pointer-events-auto flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-slate-200/80"
      >
        <header class="shrink-0 border-b border-white/10 bg-[#102372] px-4 py-3">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-[10px] font-black uppercase tracking-[0.16em] text-white/55">
                Rutas esperadas
              </p>

              <h2 class="mt-0.5 truncate text-[15px] font-black text-white">Configurar rutas</h2>

              <p class="mt-1 line-clamp-1 text-[10px] font-semibold text-white/55">
                Define paradas, corredor y tolerancia para comparar itinerarios.
              </p>
            </div>

            <div class="flex shrink-0 items-center gap-1">
              <button
                type="button"
                class="h-7 rounded-lg border border-white/10 px-2 text-[9px] font-black uppercase tracking-[0.08em] text-white/70 transition hover:bg-white/10 hover:text-white"
                @click="handleHidePanel"
              >
                Ocultar
              </button>

              <button
                type="button"
                class="rounded-lg px-2 py-1 text-[18px] font-black leading-none text-white/65 transition hover:bg-white/10 hover:text-white"
                @click="closeModal"
              >
                x
              </button>
            </div>
          </div>
        </header>

        <main class="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f6f8fb]">
          <aside class="flex max-h-[180px] shrink-0 flex-col border-b border-slate-200/80 bg-white">
            <div class="shrink-0 border-b border-slate-200/80 p-3">
              <button
                type="button"
                class="h-9 w-full rounded-lg bg-[#102372] px-3 text-[10px] font-black uppercase tracking-[0.08em] text-white transition hover:bg-[#182f8c]"
                @click="handleCreateRoute"
              >
                Nueva ruta
              </button>
            </div>

            <div class="min-h-0 flex-1 overflow-auto p-2">
              <button
                v-for="route in draftRoutes"
                :key="route.id"
                type="button"
                class="mb-1 w-full rounded-lg px-3 py-2 text-left transition last:mb-0"
                :class="
                  route.id === activeRouteId
                    ? 'bg-[#102372] text-white'
                    : 'bg-[#f8fafc] text-[#102372] ring-1 ring-slate-200 hover:ring-[#ff6600]/40'
                "
                @click="selectRoute(route.id)"
              >
                <span class="block truncate text-[11px] font-black">{{ route.name }}</span>
                <span
                  class="mt-0.5 block truncate text-[9px] font-bold"
                  :class="route.id === activeRouteId ? 'text-white/60' : 'text-slate-500'"
                >
                  {{ route.stops.length }} paradas - {{ route.toleranceMeters }} m
                  <template v-if="route.assetLabel"> - {{ route.assetLabel }}</template>
                </span>
              </button>
            </div>
          </aside>

          <section v-if="activeRoute" class="min-h-0 flex-1 overflow-auto p-3">
            <div class="grid gap-3">
              <div
                class="rounded-lg bg-white p-3 shadow-[0_1px_3px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70"
              >
                <div class="grid gap-2 md:grid-cols-[minmax(0,1fr)_150px]">
                  <label class="block">
                    <span class="text-[10px] font-black uppercase text-slate-400">Nombre</span>
                    <input
                      v-model="activeRoute.name"
                      type="text"
                      class="mt-1 h-9 w-full rounded-lg border border-[#d8dee8] bg-white px-3 text-[11px] font-bold text-[#102372] outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/10"
                    />
                  </label>

                  <label class="block">
                    <span class="text-[10px] font-black uppercase text-slate-400">
                      Tolerancia
                    </span>
                    <select
                      v-model.number="activeRoute.toleranceMeters"
                      class="mt-1 h-9 w-full rounded-lg border border-[#d8dee8] bg-white px-3 text-[11px] font-bold text-[#102372] outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/10"
                    >
                      <option :value="200">200 m</option>
                      <option :value="300">300 m</option>
                      <option :value="500">500 m</option>
                      <option :value="750">750 m</option>
                    </select>
                  </label>
                </div>

                <label class="mt-2 block">
                  <span class="text-[10px] font-black uppercase text-slate-400">Corredor</span>
                  <input
                    v-model="activeRoute.corridorLabel"
                    type="text"
                    class="mt-1 h-9 w-full rounded-lg border border-[#d8dee8] bg-white px-3 text-[11px] font-bold text-[#102372] outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/10"
                  />
                </label>

                <div class="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    class="h-8 rounded-lg border border-[#d8dee8] bg-white px-3 text-[10px] font-black text-[#102372] transition hover:border-[#ff6600] hover:text-[#ff6600]"
                    @click="handleDuplicateRoute"
                  >
                    Duplicar
                  </button>

                  <button
                    type="button"
                    class="h-8 rounded-lg border border-[#fecaca] bg-white px-3 text-[10px] font-black text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                    :disabled="draftRoutes.length <= 1"
                    @click="handleDeleteRoute"
                  >
                    Eliminar
                  </button>
                </div>
              </div>

              <div
                class="rounded-lg bg-white p-3 shadow-[0_1px_3px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70"
              >
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p class="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                      Paradas esperadas
                    </p>
                    <p class="mt-0.5 text-[10px] font-semibold text-slate-500">
                      La ruta se dibuja siguiendo este orden.
                    </p>
                  </div>

                  <div class="flex flex-wrap gap-2">
                    <button
                      type="button"
                      class="h-8 rounded-lg border border-[#d8dee8] bg-white px-3 text-[10px] font-black text-[#102372] transition hover:border-[#ff6600] hover:text-[#ff6600] disabled:cursor-not-allowed disabled:opacity-40"
                      :disabled="!canCaptureCurrentRoute"
                      @click="handleCaptureCurrentRoute"
                    >
                      Usar recorrido actual
                    </button>

                    <button
                      type="button"
                      class="h-8 rounded-lg border border-[#d8dee8] bg-white px-3 text-[10px] font-black text-[#102372] transition hover:border-[#ff6600] hover:text-[#ff6600] disabled:cursor-not-allowed disabled:opacity-40"
                      @click="handleHidePanel"
                    >
                      Ocultar panel
                    </button>

                    <button
                      type="button"
                      class="h-8 rounded-lg px-3 text-[10px] font-black uppercase tracking-[0.08em] transition"
                      :class="
                        isActiveRouteEditingOnMap
                          ? 'bg-[#ff6600] text-white hover:bg-[#e65c00]'
                          : 'bg-[#102372] text-white hover:bg-[#182f8c]'
                      "
                      @click="handleToggleMapEditing"
                    >
                      {{ isActiveRouteEditingOnMap ? "Terminar mapa" : "Editar en mapa" }}
                    </button>
                  </div>
                </div>

                <div
                  class="mt-3 rounded-lg px-3 py-2 text-[10px] font-bold"
                  :class="
                    isActiveRouteEditingOnMap
                      ? 'bg-[#fff7ed] text-[#ff6600] ring-1 ring-[#ff6600]/25'
                      : 'bg-[#f8fafc] text-slate-500 ring-1 ring-slate-200'
                  "
                >
                  <template v-if="isActiveRouteEditingOnMap">
                    {{
                      plannedRouteMapNotice ||
                      "El mapa principal esta activo: haz click sobre calles habilitadas y arrastra los puntos para moverlos."
                    }}
                  </template>

                  <template v-else>
                    Usa Editar en mapa para marcar la ruta directamente sobre el mapa principal.
                  </template>
                </div>

                <div
                  class="mt-2 rounded-lg px-3 py-2 text-[10px] font-black ring-1"
                  :class="routeRoutingStatusClass"
                >
                  {{ routeRoutingStatusLabel }}
                </div>

                <div class="mt-3 grid gap-2">
                  <div
                    v-for="(stop, index) in activeRoute.stops"
                    :key="stop.id"
                    class="grid gap-2 rounded-lg p-2 ring-1 md:grid-cols-[32px_minmax(0,1fr)_auto]"
                    :class="
                      selectedStopId === stop.id
                        ? 'bg-[#fff7ed] ring-[#ff6600]/35'
                        : 'bg-[#f8fafc] ring-slate-200'
                    "
                    @click="handleSelectStop(stop.id)"
                  >
                    <div
                      class="flex h-8 items-center justify-center rounded-md bg-white text-[10px] font-black text-[#102372] ring-1 ring-slate-200"
                    >
                      {{ index + 1 }}
                    </div>

                    <input
                      v-model="stop.name"
                      type="text"
                      class="h-8 rounded-lg border border-[#d8dee8] bg-white px-3 text-[11px] font-bold text-[#102372] outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/10"
                      placeholder="Nombre de parada"
                    />

                    <div class="flex flex-wrap gap-1">
                      <button
                        type="button"
                        class="h-8 rounded-lg border border-[#d8dee8] bg-white px-2.5 text-[9px] font-black text-slate-500 transition hover:border-[#ff6600] hover:text-[#ff6600] disabled:cursor-not-allowed disabled:opacity-40"
                        :disabled="index === 0"
                        @click.stop="handleMoveStop(stop.id, -1)"
                      >
                        Arriba
                      </button>

                      <button
                        type="button"
                        class="h-8 rounded-lg border border-[#d8dee8] bg-white px-2.5 text-[9px] font-black text-slate-500 transition hover:border-[#ff6600] hover:text-[#ff6600] disabled:cursor-not-allowed disabled:opacity-40"
                        :disabled="index === activeRoute.stops.length - 1"
                        @click.stop="handleMoveStop(stop.id, 1)"
                      >
                        Abajo
                      </button>

                      <button
                        type="button"
                        class="h-8 rounded-lg border border-[#d8dee8] bg-white px-2.5 text-[9px] font-black text-slate-500 transition hover:border-red-300 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                        :disabled="activeRoute.stops.length <= 2"
                        @click.stop="handleRemoveStop(stop.id)"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                </div>

                <details
                  class="mt-3 rounded-lg bg-[#f8fafc] p-3 text-[10px] font-bold text-slate-500 ring-1 ring-slate-200"
                >
                  <summary class="cursor-pointer font-black uppercase text-[#102372]">
                    Coordenadas
                  </summary>

                  <div class="mt-3 grid gap-2">
                    <div
                      v-for="stop in activeRoute.stops"
                      :key="`${stop.id}-coordinates`"
                      class="grid gap-2 md:grid-cols-[minmax(0,1fr)_130px_130px]"
                    >
                      <p class="truncate py-2 text-[10px] font-black text-[#102372]">
                        {{ stop.name }}
                      </p>

                      <input
                        v-model.number="stop.lat"
                        type="number"
                        step="0.000001"
                        class="h-8 rounded-lg border border-[#d8dee8] bg-white px-2 text-[10px] font-bold text-[#102372] outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/10"
                        placeholder="Lat"
                        @change="handleRouteStopsChanged"
                      />

                      <input
                        v-model.number="stop.lng"
                        type="number"
                        step="0.000001"
                        class="h-8 rounded-lg border border-[#d8dee8] bg-white px-2 text-[10px] font-bold text-[#102372] outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/10"
                        placeholder="Lng"
                        @change="handleRouteStopsChanged"
                      />
                    </div>
                  </div>
                </details>

                <p
                  v-if="routeValidationMessage"
                  class="mt-3 rounded-lg bg-[#fff7ed] px-3 py-2 text-[10px] font-black text-[#ff6600]"
                >
                  {{ routeValidationMessage }}
                </p>
              </div>
            </div>
          </section>
        </main>

        <footer
          class="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-slate-200/80 bg-white px-4 py-3"
        >
          <p class="text-[10px] font-semibold text-slate-500">
            Esta configuracion queda guardada en este navegador.
          </p>

          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="h-9 rounded-lg border border-[#d8dee8] bg-white px-4 text-[10px] font-black uppercase tracking-[0.08em] text-slate-500 transition hover:border-[#ff6600] hover:text-[#ff6600]"
              @click="closeModal"
            >
              Cancelar
            </button>

            <button
              type="button"
              class="h-9 rounded-lg bg-[#ff6600] px-4 text-[10px] font-black uppercase tracking-[0.08em] text-white transition hover:bg-[#e65c00] disabled:cursor-not-allowed disabled:bg-slate-300"
              :disabled="!canSaveRoutes || routeRoutingStatus === 'calculating'"
              @click="handleSave"
            >
              Guardar cambios
            </button>
          </div>
        </footer>
      </section>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue"

import {
  clonePlannedRoutes,
  createEmptyPlannedRoute,
  createPlannedRouteFromPoints,
  normalizePlannedRoutes,
} from "../../../composables/activos/routes/usePlannedRouteCatalog.js"
import { usePlannedRouteMapEditor } from "../../../composables/activos/routes/usePlannedRouteMapEditor.js"
import {
  buildRoutingStopsSignature,
  calculateOsrmRoute,
} from "../../../services/routing/osrmRouteService.js"

const ROUTE_CALCULATION_DEBOUNCE_MS = 550

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  routes: {
    type: Array,
    default: () => [],
  },
  selectedRouteId: {
    type: String,
    default: "",
  },
  currentRoutePoints: {
    type: Array,
    default: () => [],
  },
  currentRouteAsset: {
    type: Object,
    default: null,
  },
  currentRouteLabel: {
    type: String,
    default: "",
  },
})

const emit = defineEmits(["update:modelValue", "save", "select-route"])

const draftRoutes = ref([])
const activeRouteId = ref("")
const selectedStopId = ref("")
const routeRoutingStatus = ref("idle")
const routeRoutingMessage = ref("")

let routeCalculationTimer = null
let routeCalculationAbortController = null
let routeCalculationRequestId = 0
let lastAppliedDraftStopsSignature = ""

const {
  plannedRouteMapDraft,
  isPlannedRoutePanelHidden,
  plannedRouteMapNotice,
  startPlannedRouteMapEditing,
  stopPlannedRouteMapEditing,
  setPlannedRoutePanelHidden,
  selectPlannedRouteStop,
  updatePlannedRouteStops,
  updatePlannedRouteRoutePoints,
} = usePlannedRouteMapEditor()

const hasValidCoordinates = (point) => {
  return Number.isFinite(Number(point?.lat)) && Number.isFinite(Number(point?.lng))
}

const getCurrentGpsPoint = () => {
  const validRoutePoints = props.currentRoutePoints.filter(hasValidCoordinates)

  if (validRoutePoints.length) return validRoutePoints[validRoutePoints.length - 1]
  if (hasValidCoordinates(props.currentRouteAsset)) return props.currentRouteAsset

  return null
}

const getCurrentRouteReferencePoints = () => {
  const validRoutePoints = props.currentRoutePoints.filter(hasValidCoordinates)

  if (validRoutePoints.length) return validRoutePoints

  const currentGpsPoint = getCurrentGpsPoint()

  return currentGpsPoint ? [currentGpsPoint] : []
}

const syncDraftRoutes = () => {
  const routes = clonePlannedRoutes(props.routes)

  draftRoutes.value = routes.length
    ? routes
    : [
        createEmptyPlannedRoute({
          centerPoint: getCurrentGpsPoint(),
          asset: props.currentRouteAsset,
        }),
      ]
  activeRouteId.value =
    draftRoutes.value.find((route) => route.id === props.selectedRouteId)?.id ||
    draftRoutes.value[0]?.id ||
    ""
  selectedStopId.value =
    draftRoutes.value.find((route) => route.id === activeRouteId.value)?.stops[0]?.id || ""
}

const activeRouteIndex = computed(() => {
  return draftRoutes.value.findIndex((route) => route.id === activeRouteId.value)
})

const activeRoute = computed(() => {
  return draftRoutes.value[activeRouteIndex.value] || null
})

const isActiveRouteEditingOnMap = computed(() => {
  return Boolean(
    activeRoute.value &&
    plannedRouteMapDraft.value &&
    plannedRouteMapDraft.value.routeId === activeRoute.value.id,
  )
})

const plannedRouteMapDraftStopsSignature = computed(() => {
  const draft = plannedRouteMapDraft.value

  if (!draft) return ""

  return [
    draft.routeId,
    draft.selectedStopId,
    ...(draft.stops || []).map((stop) => [stop.id, stop.name, stop.lat, stop.lng].join(":")),
  ].join("|")
})

const canCaptureCurrentRoute = computed(() => {
  return props.currentRoutePoints.filter(hasValidCoordinates).length >= 2
})

const activeRouteHasStreetRoute = computed(() => {
  return (activeRoute.value?.routePoints || []).filter(hasValidCoordinates).length >= 2
})

const routeRoutingStatusLabel = computed(() => {
  if (routeRoutingStatus.value === "calculating") return "Calculando ruta por calles..."
  if (routeRoutingStatus.value === "error") return routeRoutingMessage.value

  if (activeRouteHasStreetRoute.value) {
    if (activeRoute.value?.routingProvider === "captured") {
      return "Ruta capturada desde el recorrido actual"
    }

    const distanceKm = Number(activeRoute.value?.routingDistanceMeters || 0) / 1000

    if (distanceKm > 0) {
      return `Ruta por calles lista - ${distanceKm.toFixed(1)} km`
    }

    return "Ruta por calles lista"
  }

  return "Se calculara por calles al editar las paradas."
})

const routeRoutingStatusClass = computed(() => {
  if (routeRoutingStatus.value === "calculating") {
    return "bg-[#eef2ff] text-[#102372] ring-[#102372]/15"
  }

  if (routeRoutingStatus.value === "error") {
    return "bg-[#fff7ed] text-[#ff6600] ring-[#ff6600]/25"
  }

  if (activeRouteHasStreetRoute.value) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200"
  }

  return "bg-[#f8fafc] text-slate-500 ring-slate-200"
})

const routeValidationMessage = computed(() => {
  const invalidRoute = draftRoutes.value.find((route) => {
    return (
      !String(route.name || "").trim() ||
      route.stops.length < 2 ||
      route.stops.some((stop) => !hasValidCoordinates(stop))
    )
  })

  if (!invalidRoute) return ""

  if (!String(invalidRoute.name || "").trim()) {
    return "Cada ruta necesita un nombre."
  }

  if (invalidRoute.stops.length < 2) {
    return "Cada ruta necesita al menos origen y destino."
  }

  return "Todas las paradas deben tener latitud y longitud validas."
})

const canSaveRoutes = computed(() => {
  return draftRoutes.value.length > 0 && !routeValidationMessage.value
})

const getRouteStopsSnapshot = (route) => {
  return (route?.stops || []).filter(hasValidCoordinates).map((stop) => ({
    lat: Number(stop.lat),
    lng: Number(stop.lng),
  }))
}

const syncActiveRouteRoutePointsToMap = () => {
  if (!activeRoute.value || !isActiveRouteEditingOnMap.value) return

  updatePlannedRouteRoutePoints(activeRoute.value.routePoints || [])
}

const clearRouteCalculationTimer = () => {
  if (!routeCalculationTimer) return

  window.clearTimeout(routeCalculationTimer)
  routeCalculationTimer = null
}

const abortRouteCalculation = () => {
  if (!routeCalculationAbortController) return

  routeCalculationAbortController.abort()
  routeCalculationAbortController = null
}

const resetActiveRouteStreetRoute = () => {
  if (!activeRoute.value) return

  activeRoute.value.routePoints = []
  activeRoute.value.routingStopsSignature = ""
  activeRoute.value.routingProvider = ""
  activeRoute.value.routingDistanceMeters = 0
  activeRoute.value.routingDurationSeconds = 0
  syncActiveRouteRoutePointsToMap()
}

const runActiveRouteCalculation = async ({ routeId, stops, stopsSignature, requestId }) => {
  abortRouteCalculation()

  const abortController = new AbortController()

  routeCalculationAbortController = abortController
  routeRoutingStatus.value = "calculating"
  routeRoutingMessage.value = ""

  try {
    const result = await calculateOsrmRoute({
      points: stops,
      signal: abortController.signal,
    })

    if (requestId !== routeCalculationRequestId || activeRoute.value?.id !== routeId) return

    activeRoute.value.routePoints = result.points
    activeRoute.value.routingStopsSignature = stopsSignature
    activeRoute.value.routingProvider = result.provider
    activeRoute.value.routingDistanceMeters = result.distanceMeters
    activeRoute.value.routingDurationSeconds = result.durationSeconds
    routeRoutingStatus.value = "ready"
    routeRoutingMessage.value = ""
    syncActiveRouteRoutePointsToMap()
  } catch (error) {
    if (error?.name === "AbortError") return
    if (requestId !== routeCalculationRequestId || activeRoute.value?.id !== routeId) return

    resetActiveRouteStreetRoute()
    routeRoutingStatus.value = "error"
    routeRoutingMessage.value = error?.message || "No se pudo calcular la ruta por calles."
  } finally {
    if (routeCalculationAbortController === abortController) {
      routeCalculationAbortController = null
    }
  }
}

const scheduleActiveRouteCalculation = ({ immediate = false } = {}) => {
  clearRouteCalculationTimer()

  const route = activeRoute.value
  const stops = getRouteStopsSnapshot(route)

  if (!route || stops.length < 2) {
    routeRoutingStatus.value = "idle"
    routeRoutingMessage.value = ""
    resetActiveRouteStreetRoute()
    return
  }

  const stopsSignature = buildRoutingStopsSignature(stops)

  if (route.routingStopsSignature === stopsSignature && activeRouteHasStreetRoute.value) {
    routeRoutingStatus.value = "ready"
    routeRoutingMessage.value = ""
    syncActiveRouteRoutePointsToMap()
    return
  }

  const requestId = (routeCalculationRequestId += 1)

  routeCalculationTimer = window.setTimeout(
    () => {
      routeCalculationTimer = null
      runActiveRouteCalculation({
        routeId: route.id,
        stops,
        stopsSignature,
        requestId,
      })
    },
    immediate ? 0 : ROUTE_CALCULATION_DEBOUNCE_MS,
  )
}

const selectRoute = (routeId) => {
  stopPlannedRouteMapEditing()
  activeRouteId.value = routeId
  selectedStopId.value = draftRoutes.value.find((route) => route.id === routeId)?.stops[0]?.id || ""
  startActiveRouteMapEditing()
  scheduleActiveRouteCalculation()
}

const handleSelectStop = (stopId) => {
  selectedStopId.value = stopId

  if (isActiveRouteEditingOnMap.value) {
    selectPlannedRouteStop(stopId)
  }
}

const syncActiveRouteStopsToMap = () => {
  if (!activeRoute.value || !isActiveRouteEditingOnMap.value) return

  updatePlannedRouteStops(activeRoute.value.stops)
  selectPlannedRouteStop(selectedStopId.value)
}

const handleRouteStopsChanged = () => {
  syncActiveRouteStopsToMap()
  scheduleActiveRouteCalculation()
}

const startActiveRouteMapEditing = ({ focusPoint = null } = {}) => {
  if (!activeRoute.value) return

  startPlannedRouteMapEditing({
    routeId: activeRoute.value.id,
    routeName: activeRoute.value.name,
    stops: activeRoute.value.stops,
    referencePoints: getCurrentRouteReferencePoints(),
    routePoints: activeRoute.value.routePoints,
    focusPoint,
  })
  selectPlannedRouteStop(selectedStopId.value || activeRoute.value.stops[0]?.id || "")
  syncActiveRouteRoutePointsToMap()
}

const handleToggleMapEditing = () => {
  if (!activeRoute.value) return

  if (isActiveRouteEditingOnMap.value) {
    stopPlannedRouteMapEditing()
    return
  }

  startActiveRouteMapEditing()
}

const handleHidePanel = () => {
  if (!isActiveRouteEditingOnMap.value) {
    startActiveRouteMapEditing()
  }

  setPlannedRoutePanelHidden(true)
}

const handleCreateRoute = () => {
  stopPlannedRouteMapEditing()

  const route = createEmptyPlannedRoute({
    centerPoint: getCurrentGpsPoint(),
    asset: props.currentRouteAsset,
  })

  draftRoutes.value.push(route)
  activeRouteId.value = route.id
  selectedStopId.value = route.stops[0]?.id || ""
  startActiveRouteMapEditing({
    focusPoint: getCurrentGpsPoint(),
  })
  scheduleActiveRouteCalculation()
}

const handleDuplicateRoute = () => {
  if (!activeRoute.value) return

  stopPlannedRouteMapEditing()

  const route = createPlannedRouteFromPoints({
    points: activeRoute.value.stops,
    name: `${activeRoute.value.name} copia`,
    corridorLabel: activeRoute.value.corridorLabel,
    toleranceMeters: activeRoute.value.toleranceMeters,
    assetId: activeRoute.value.assetId,
    assetLabel: activeRoute.value.assetLabel,
  })

  draftRoutes.value.push(route)
  activeRouteId.value = route.id
  selectedStopId.value = route.stops[0]?.id || ""
  startActiveRouteMapEditing()
  scheduleActiveRouteCalculation()
}

const handleDeleteRoute = () => {
  if (!activeRoute.value || draftRoutes.value.length <= 1) return

  stopPlannedRouteMapEditing()

  draftRoutes.value = draftRoutes.value.filter((route) => route.id !== activeRoute.value.id)
  activeRouteId.value = draftRoutes.value[0]?.id || ""
  selectedStopId.value = draftRoutes.value[0]?.stops[0]?.id || ""
  startActiveRouteMapEditing()
  scheduleActiveRouteCalculation()
}

const handleRemoveStop = (stopId) => {
  if (!activeRoute.value || activeRoute.value.stops.length <= 2) return

  activeRoute.value.stops = activeRoute.value.stops.filter((stop) => stop.id !== stopId)

  if (selectedStopId.value === stopId) {
    selectedStopId.value = activeRoute.value.stops[0]?.id || ""
  }

  syncActiveRouteStopsToMap()
  scheduleActiveRouteCalculation()
}

const handleMoveStop = (stopId, direction) => {
  if (!activeRoute.value) return

  const currentIndex = activeRoute.value.stops.findIndex((stop) => stop.id === stopId)
  const nextIndex = currentIndex + direction

  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= activeRoute.value.stops.length) return

  const stops = [...activeRoute.value.stops]
  const [stop] = stops.splice(currentIndex, 1)

  stops.splice(nextIndex, 0, stop)
  activeRoute.value.stops = stops
  selectedStopId.value = stopId
  syncActiveRouteStopsToMap()
  scheduleActiveRouteCalculation()
}

const handleCaptureCurrentRoute = () => {
  if (!activeRoute.value || !canCaptureCurrentRoute.value) return

  const capturedRoute = createPlannedRouteFromPoints({
    points: props.currentRoutePoints,
    name: activeRoute.value.name || "Ruta desde itinerario",
    corridorLabel: props.currentRouteLabel || activeRoute.value.corridorLabel,
    toleranceMeters: activeRoute.value.toleranceMeters,
    includeRoutePoints: true,
    asset: props.currentRouteAsset,
    assetId: activeRoute.value.assetId,
    assetLabel: activeRoute.value.assetLabel,
  })

  activeRoute.value.name = capturedRoute.name
  activeRoute.value.corridorLabel = capturedRoute.corridorLabel
  activeRoute.value.stops = capturedRoute.stops
  activeRoute.value.assetId = capturedRoute.assetId
  activeRoute.value.assetLabel = capturedRoute.assetLabel
  activeRoute.value.routePoints = capturedRoute.routePoints
  activeRoute.value.routingStopsSignature = capturedRoute.routingStopsSignature
  activeRoute.value.routingProvider = capturedRoute.routingProvider
  activeRoute.value.routingDistanceMeters = capturedRoute.routingDistanceMeters
  activeRoute.value.routingDurationSeconds = capturedRoute.routingDurationSeconds
  selectedStopId.value = capturedRoute.stops[0]?.id || ""
  syncActiveRouteStopsToMap()
  syncActiveRouteRoutePointsToMap()
  scheduleActiveRouteCalculation({
    immediate: true,
  })
}

const handleSave = () => {
  if (!canSaveRoutes.value) return

  const normalizedRoutes = normalizePlannedRoutes(draftRoutes.value)

  emit("save", normalizedRoutes)
  emit("select-route", activeRouteId.value)
  stopPlannedRouteMapEditing()
  closeModal()
}

const closeModal = () => {
  clearRouteCalculationTimer()
  abortRouteCalculation()
  stopPlannedRouteMapEditing()
  emit("update:modelValue", false)
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) return

    const hadStoredRoutes = clonePlannedRoutes(props.routes).length > 0

    syncDraftRoutes()
    startActiveRouteMapEditing({
      focusPoint: hadStoredRoutes ? null : getCurrentGpsPoint(),
    })
    scheduleActiveRouteCalculation({
      immediate: true,
    })
  },
  {
    immediate: true,
  },
)

watch(plannedRouteMapDraftStopsSignature, (draftStopsSignature) => {
  const draft = plannedRouteMapDraft.value

  if (!draft || !activeRoute.value || draft.routeId !== activeRoute.value.id) return

  if (draftStopsSignature === lastAppliedDraftStopsSignature) return

  lastAppliedDraftStopsSignature = draftStopsSignature
  activeRoute.value.stops = draft.stops.map((stop) => ({ ...stop }))
  selectedStopId.value = draft.selectedStopId || draft.stops[0]?.id || ""
  scheduleActiveRouteCalculation()
})

onBeforeUnmount(() => {
  clearRouteCalculationTimer()
  abortRouteCalculation()
})
</script>
