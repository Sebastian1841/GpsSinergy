<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-[970] flex items-end justify-center bg-slate-950/55 p-2 sm:items-center sm:p-4"
      @click.self="closeModal"
    >
      <section
        class="flex max-h-[calc(100vh-16px)] w-full max-w-[1120px] flex-col overflow-hidden rounded-t-xl bg-white shadow-[0_24px_80px_rgba(15,23,42,0.34)] sm:max-h-[calc(100vh-32px)] sm:rounded-xl"
      >
        <header class="shrink-0 border-b border-white/10 bg-[#102372] px-4 py-3">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-[10px] font-black uppercase tracking-[0.16em] text-white/55">
                Itinerarios
              </p>

              <h2 class="mt-0.5 truncate text-[15px] font-black text-white">Comparador de rutas</h2>

              <p class="mt-1 line-clamp-1 text-[10px] font-semibold text-white/55">
                Ruta esperada contra recorrido real del activo.
              </p>
            </div>

            <button
              type="button"
              class="rounded-lg px-2 py-1 text-[18px] font-black leading-none text-white/65 transition hover:bg-white/10 hover:text-white"
              @click="closeModal"
            >
              x
            </button>
          </div>
        </header>

        <div class="shrink-0 border-b border-slate-200/80 bg-[#f6f8fb] p-3">
          <div class="grid gap-2 lg:grid-cols-[minmax(0,1fr)_minmax(220px,260px)_150px_auto]">
            <label class="block">
              <span class="text-[10px] font-black uppercase text-slate-400"> Activo </span>

              <select
                v-model="selectedAssetId"
                class="mt-1 h-9 w-full rounded-lg border border-[#d8dee8] bg-white px-3 text-[11px] font-bold text-[#102372] outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/10"
              >
                <option
                  v-for="asset in assetOptions"
                  :key="getAssetId(asset)"
                  :value="getAssetId(asset)"
                >
                  {{ getAssetLabel(asset) }}
                </option>
              </select>
            </label>

            <label class="block">
              <span class="text-[10px] font-black uppercase text-slate-400"> Ruta esperada </span>

              <select
                v-model="selectedRouteIdDraft"
                class="mt-1 h-9 w-full rounded-lg border border-[#d8dee8] bg-white px-3 text-[11px] font-bold text-[#102372] outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/10"
              >
                <option v-for="route in plannedRoutes" :key="route.id" :value="route.id">
                  {{ route.name }}{{ route.assetLabel ? ` - ${route.assetLabel}` : "" }}
                </option>
              </select>
            </label>

            <label class="block">
              <span class="text-[10px] font-black uppercase text-slate-400"> Tolerancia </span>

              <select
                v-model.number="toleranceMeters"
                class="mt-1 h-9 w-full rounded-lg border border-[#d8dee8] bg-white px-3 text-[11px] font-bold text-[#102372] outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/10"
              >
                <option :value="200">200 m</option>
                <option :value="300">300 m</option>
                <option :value="500">500 m</option>
                <option :value="750">750 m</option>
              </select>
            </label>

            <div class="flex items-end">
              <button
                type="button"
                class="h-9 w-full rounded-lg border border-[#d8dee8] bg-white px-3 text-[10px] font-black uppercase tracking-[0.08em] text-[#102372] transition hover:border-[#ff6600] hover:text-[#ff6600]"
                @click="handleOpenRouteConfigurator"
              >
                Configurar
              </button>
            </div>
          </div>
        </div>

        <main class="min-h-0 flex-1 overflow-auto bg-[#f6f8fb] p-3">
          <div class="grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div class="min-w-0 space-y-3">
              <p
                v-if="comparisonWarning"
                class="rounded-lg bg-[#fff7ed] px-3 py-2 text-[10px] font-black text-[#ff6600] ring-1 ring-[#ff6600]/20"
              >
                {{ comparisonWarning }}
              </p>

              <p
                v-if="deviationDocumentError"
                class="rounded-lg bg-red-50 px-3 py-2 text-[10px] font-black text-red-600 ring-1 ring-red-200"
              >
                {{ deviationDocumentError }}
              </p>

              <RouteComparisonMap
                :planned-points="mapPlannedPoints"
                :actual-points="mapActualPoints"
                :deviations="previewComparison.deviations"
                :summary="previewComparison.summary"
              />

              <div class="grid gap-2 sm:grid-cols-4">
                <div
                  v-for="metric in summaryMetrics"
                  :key="metric.label"
                  class="rounded-lg bg-white px-3 py-2 shadow-[0_1px_3px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70"
                >
                  <p class="text-[9px] font-black uppercase text-slate-400">
                    {{ metric.label }}
                  </p>

                  <p class="mt-1 text-[15px] font-black" :class="metric.valueClass">
                    {{ metric.value }}
                  </p>
                </div>
              </div>
            </div>

            <aside class="min-w-0 space-y-3">
              <div
                class="rounded-lg bg-white p-3 shadow-[0_1px_3px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70"
              >
                <p class="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                  Resumen
                </p>

                <h3 class="mt-1 truncate text-[13px] font-black text-[#102372]">
                  {{ selectedRoute?.name || "Ruta esperada" }}
                </h3>

                <p class="mt-1 text-[10px] font-semibold leading-relaxed text-slate-500">
                  {{ selectedRoute?.corridorLabel || "Corredor operativo" }}
                </p>

                <div class="mt-3 grid gap-2">
                  <div class="flex items-center justify-between gap-2 text-[10px] font-bold">
                    <span class="text-slate-500">Rango</span>

                    <span class="text-[#102372]">
                      {{ rangeLabel || "Vista actual" }}
                    </span>
                  </div>

                  <div class="flex items-center justify-between gap-2 text-[10px] font-bold">
                    <span class="text-slate-500">Fuente real</span>

                    <span class="text-[#102372]">
                      {{ actualSourceLabel }}
                    </span>
                  </div>

                  <div class="flex items-center justify-between gap-2 text-[10px] font-bold">
                    <span class="text-slate-500">Paradas esperadas</span>

                    <span class="text-[#102372]">
                      {{ selectedRouteStops.length }}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <div class="mb-2 flex items-center justify-between gap-2">
                  <p class="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                    Desvíos
                  </p>

                  <span
                    class="rounded-md bg-white px-2 py-1 text-[9px] font-black text-[#102372] ring-1 ring-slate-200/70"
                  >
                    {{ previewComparison.deviations.length }}
                  </span>
                </div>

                <RouteDeviationList :deviations="previewComparison.deviations" />
              </div>
            </aside>
          </div>
        </main>

        <footer class="shrink-0 border-t border-slate-200/80 bg-white px-4 py-3">
          <div class="flex items-center justify-between gap-2">
            <button
              type="button"
              class="h-9 rounded-lg border border-[#d8dee8] bg-white px-4 text-[10px] font-black uppercase tracking-[0.08em] text-slate-500 transition hover:border-[#ff6600] hover:text-[#ff6600]"
              @click="closeModal"
            >
              Cerrar
            </button>

            <button
              type="button"
              class="h-9 rounded-lg bg-[#ff6600] px-4 text-[10px] font-black uppercase tracking-[0.08em] text-white transition hover:bg-[#e65c00] disabled:cursor-not-allowed disabled:bg-slate-300"
              :disabled="isGeneratingDeviationDocument"
              @click="handleGenerateDeviationReport"
            >
              {{ isGeneratingDeviationDocument ? "Generando..." : "Generar informe" }}
            </button>
          </div>
        </footer>
      </section>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from "vue"

import RouteComparisonMap from "./RouteComparisonMap.vue"
import RouteDeviationList from "./RouteDeviationList.vue"
import { usePlannedRouteCatalog } from "../../../composables/activos/routes/usePlannedRouteCatalog.js"
import { useRouteDeviationDocument } from "../../../composables/activos/routes/useRouteDeviationDocument.js"
import { compareRouteAgainstPlan } from "../../../utils/activos/routeComparisonUtils.js"

const ROUTE_SELECTION_SAMPLE_LIMIT = 180
const PREVIEW_PLANNED_POINT_LIMIT = 260
const PREVIEW_ACTUAL_POINT_LIMIT = 320
const MAP_PLANNED_POINT_LIMIT = 220
const MAP_ACTUAL_POINT_LIMIT = 260

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  assets: {
    type: Array,
    default: () => [],
  },
  routeResult: {
    type: Object,
    default: null,
  },
  rangeLabel: {
    type: String,
    default: "",
  },
  selectedRouteId: {
    type: String,
    default: "",
  },
})

const emit = defineEmits(["update:modelValue", "open-route-configurator"])

const { plannedRoutes } = usePlannedRouteCatalog()

const {
  isGeneratingDeviationDocument,
  deviationDocumentError,
  clearDeviationDocumentError,
  generateRouteDeviationDocument,
} = useRouteDeviationDocument()

const selectedAssetId = ref("")
const selectedRouteIdDraft = ref("")
const toleranceMeters = ref(300)

const normalizeId = (value) => {
  return String(value ?? "").trim()
}

const getAssetId = (asset) => {
  if (asset && typeof asset !== "object") {
    return normalizeId(asset)
  }

  return normalizeId(asset?.id || asset?.activoId || asset?.deviceId || asset?.patente)
}

const getRouteAssetId = (route) => {
  return getAssetId(route?.asset) || normalizeId(route?.id)
}

const getRowAssetId = (row) => {
  return normalizeId(row?.assetId || row?.asset?.id || row?.asset?.activoId || row?.activoId)
}

const getPlannedRouteAssetId = (route) => {
  return normalizeId(route?.assetId || route?.routeAssetId || getAssetId(route?.asset))
}

const hasRouteId = (routeId) => {
  return plannedRoutes.value.some((route) => route.id === routeId)
}

const getRoutePlanPoints = (route) => {
  const routePoints = Array.isArray(route?.routePoints) ? route.routePoints : []

  if (routePoints.length >= 2) return routePoints

  return Array.isArray(route?.stops) ? route.stops : []
}

const sampleRouteSelectionPoints = (points = []) => {
  if (points.length <= ROUTE_SELECTION_SAMPLE_LIMIT) return points

  const lastIndex = points.length - 1
  const step = lastIndex / (ROUTE_SELECTION_SAMPLE_LIMIT - 1)

  return Array.from({ length: ROUTE_SELECTION_SAMPLE_LIMIT }, (_item, index) => {
    return points[Math.round(index * step)]
  })
}

const sampleMapPoints = (points = [], limit = MAP_ACTUAL_POINT_LIMIT) => {
  if (points.length <= limit) return points
  if (limit <= 2) return [points[0], points[points.length - 1]]

  const lastIndex = points.length - 1
  const step = lastIndex / (limit - 1)

  return Array.from({ length: limit }, (_item, index) => {
    return points[Math.round(index * step)]
  })
}

const getActualRouteRowsForAssetId = (assetId) => {
  if (!props.routeResult || !assetId) return []

  const routeItems = Array.isArray(props.routeResult.routes) ? props.routeResult.routes : []

  const selectedRouteItem = routeItems.find((route) => {
    return getRouteAssetId(route) === assetId
  })

  if (selectedRouteItem?.rows?.length) {
    return selectedRouteItem.rows
  }

  const rows = Array.isArray(props.routeResult.rows) ? props.routeResult.rows : []
  const rowsHaveAssetIds = rows.some((row) => getRowAssetId(row))

  if (rowsHaveAssetIds) {
    return rows.filter((row) => getRowAssetId(row) === assetId)
  }

  return getRouteAssetId(props.routeResult) === assetId ? rows : []
}

const getBestRouteIdForAssetId = (assetId) => {
  const normalizedAssetId = normalizeId(assetId)

  if (!normalizedAssetId) return ""

  const linkedRoute = plannedRoutes.value.find((route) => {
    return getPlannedRouteAssetId(route) === normalizedAssetId
  })

  if (linkedRoute) return linkedRoute.id

  const actualRows = getActualRouteRowsForAssetId(normalizedAssetId)

  if (actualRows.length < 2) return ""

  const sampledActualRows = sampleRouteSelectionPoints(actualRows)

  return plannedRoutes.value.reduce(
    (bestRoute, route) => {
      const plannedPoints = sampleMapPoints(getRoutePlanPoints(route), PREVIEW_PLANNED_POINT_LIMIT)

      if (plannedPoints.length < 2) return bestRoute

      const result = compareRouteAgainstPlan({
        plannedPoints,
        actualPoints: sampledActualRows,
        toleranceMeters: route.toleranceMeters || toleranceMeters.value || 300,
      })
      const summary = result.summary
      const score =
        Number(summary.averageDeviationMeters || 0) +
        Number(summary.maxDeviationMeters || 0) * 0.25 +
        Number(summary.offRouteShare || 0) * 20

      return score < bestRoute.score ? { id: route.id, score } : bestRoute
    },
    {
      id: "",
      score: Number.POSITIVE_INFINITY,
    },
  ).id
}

const getPreferredSelectedRouteId = ({ preferRouteId = "" } = {}) => {
  const preferredRouteId = normalizeId(preferRouteId)

  if (preferredRouteId && hasRouteId(preferredRouteId)) return preferredRouteId

  const bestRouteId = getBestRouteIdForAssetId(selectedAssetNormalizedId.value)

  if (bestRouteId) return bestRouteId

  if (hasRouteId(props.selectedRouteId)) return props.selectedRouteId
  if (hasRouteId(selectedRouteIdDraft.value)) return selectedRouteIdDraft.value

  return plannedRoutes.value[0]?.id || ""
}

const assetOptions = computed(() => {
  const options = [...props.assets]
  const routeAsset = props.routeResult?.asset
  const routeAssetId = getAssetId(routeAsset)

  if (
    routeAssetId &&
    !options.some((asset) => {
      return getAssetId(asset) === routeAssetId
    })
  ) {
    options.unshift(routeAsset)
  }

  return options
})

const selectedRoute = computed(() => {
  return (
    plannedRoutes.value.find((route) => route.id === selectedRouteIdDraft.value) ||
    plannedRoutes.value[0] ||
    null
  )
})

const selectedRouteStops = computed(() => selectedRoute.value?.stops || [])

const selectedRoutePlanPoints = computed(() => {
  return getRoutePlanPoints(selectedRoute.value)
})

const hasSelectedRoute = computed(() => {
  return plannedRoutes.value.some((route) => route.id === selectedRouteIdDraft.value)
})

const selectedAsset = computed(() => {
  const normalizedSelectedAssetId = normalizeId(selectedAssetId.value)

  return (
    assetOptions.value.find((asset) => getAssetId(asset) === normalizedSelectedAssetId) ||
    assetOptions.value[0] ||
    null
  )
})

const selectedAssetNormalizedId = computed(() => {
  return normalizeId(selectedAssetId.value) || getAssetId(selectedAsset.value)
})

const actualRouteRowsForSelectedAsset = computed(() => {
  return getActualRouteRowsForAssetId(selectedAssetNormalizedId.value)
})

const hasCurrentRouteForSelectedAsset = computed(() => {
  return actualRouteRowsForSelectedAsset.value.length > 0
})

const actualPoints = computed(() => {
  if (props.routeResult) {
    return actualRouteRowsForSelectedAsset.value
  }

  return selectedRoute.value?.actualPoints || []
})

const previewPlannedPoints = computed(() => {
  return sampleMapPoints(selectedRoutePlanPoints.value, PREVIEW_PLANNED_POINT_LIMIT)
})

const previewActualPoints = computed(() => {
  return sampleMapPoints(actualPoints.value, PREVIEW_ACTUAL_POINT_LIMIT)
})

const previewComparison = computed(() => {
  return compareRouteAgainstPlan({
    plannedPoints: previewPlannedPoints.value,
    actualPoints: previewActualPoints.value,
    toleranceMeters: toleranceMeters.value,
  })
})

const mapPlannedPoints = computed(() => {
  return sampleMapPoints(previewComparison.value.plannedPoints, MAP_PLANNED_POINT_LIMIT)
})

const mapActualPoints = computed(() => {
  return sampleMapPoints(previewComparison.value.actualPoints, MAP_ACTUAL_POINT_LIMIT)
})

const actualSourceLabel = computed(() => {
  if (hasCurrentRouteForSelectedAsset.value) {
    return `Recorrido buscado (${actualPoints.value.length} puntos)`
  }

  if (props.routeResult) return "Sin recorrido para este activo"
  if (selectedRoute.value?.actualPoints?.length) return "Mock operativo"

  return "Sin recorrido cargado"
})

const comparisonWarning = computed(() => {
  if (selectedRoutePlanPoints.value.length < 2) {
    return "La ruta esperada necesita al menos dos puntos para comparar."
  }

  if (props.routeResult && !hasCurrentRouteForSelectedAsset.value) {
    return "El recorrido buscado no tiene puntos para el activo seleccionado."
  }

  if (!actualPoints.value.length) {
    return "No hay recorrido real cargado para comparar desviaciones."
  }

  return ""
})

const summaryMetrics = computed(() => {
  const summary = previewComparison.value.summary

  return [
    {
      label: "Cumplimiento",
      value: summary.complianceLabel,
      valueClass: summary.compliance < 80 ? "text-[#ff6600]" : "text-emerald-600",
    },
    {
      label: "Fuera de ruta",
      value: `${summary.offRoutePointsCount || 0} pts`,
      valueClass:
        Number(summary.offRoutePointsCount || 0) > 0 ? "text-red-600" : "text-emerald-600",
    },
    {
      label: "Máx. desvío",
      value: summary.maxDeviationLabel,
      valueClass: Number(summary.maxDeviationMeters || 0) > 0 ? "text-red-600" : "text-emerald-600",
    },
    {
      label: "Promedio",
      value: summary.averageDeviationLabel,
      valueClass:
        Number(summary.averageDeviationMeters || 0) > 0 ? "text-[#ff6600]" : "text-emerald-600",
    },
  ]
})

watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) return

    clearDeviationDocumentError()

    selectedAssetId.value = getAssetId(props.routeResult?.asset || assetOptions.value[0])

    selectedRouteIdDraft.value = getPreferredSelectedRouteId()
    toleranceMeters.value = selectedRoute.value?.toleranceMeters || 300
  },
)

watch(
  () => props.selectedRouteId,
  () => {
    clearDeviationDocumentError()
    selectedRouteIdDraft.value = getPreferredSelectedRouteId({
      preferRouteId: props.selectedRouteId,
    })
    toleranceMeters.value = selectedRoute.value?.toleranceMeters || 300
  },
)

watch(selectedAssetId, () => {
  clearDeviationDocumentError()

  const preferredRouteId = getPreferredSelectedRouteId()

  if (preferredRouteId && preferredRouteId !== selectedRouteIdDraft.value) {
    selectedRouteIdDraft.value = preferredRouteId
  }
})

watch(selectedRouteIdDraft, () => {
  clearDeviationDocumentError()
  toleranceMeters.value = selectedRoute.value?.toleranceMeters || 300
})

watch(toleranceMeters, () => {
  clearDeviationDocumentError()
})

watch(plannedRoutes, () => {
  if (!hasSelectedRoute.value) {
    selectedRouteIdDraft.value = getPreferredSelectedRouteId()
  }

  toleranceMeters.value = selectedRoute.value?.toleranceMeters || 300
})

const getAssetLabel = (asset) => {
  const name =
    asset?.displayName || asset?.nombrePantalla || asset?.name || asset?.deviceId || "Activo"

  const plate = asset?.patente || asset?.plate || asset?.licensePlate || ""

  if (!plate) return name

  if (String(name).toLowerCase().includes(String(plate).toLowerCase())) {
    return name
  }

  return `${name} · ${plate}`
}

const handleOpenRouteConfigurator = () => {
  emit("open-route-configurator", {
    routeId: selectedRouteIdDraft.value,
    assetId: selectedAssetNormalizedId.value,
    asset: selectedAsset.value,
  })
  closeModal()
}

const handleGenerateDeviationReport = () => {
  const fullComparison = compareRouteAgainstPlan({
    plannedPoints: selectedRoutePlanPoints.value,
    actualPoints: actualPoints.value,
    toleranceMeters: toleranceMeters.value,
  })

  generateRouteDeviationDocument({
    asset: selectedAsset.value,
    route: selectedRoute.value,
    rangeLabel: props.rangeLabel,
    toleranceMeters: toleranceMeters.value,
    comparison: fullComparison,
  })
}

const closeModal = () => {
  clearDeviationDocumentError()
  emit("update:modelValue", false)
}
</script>
