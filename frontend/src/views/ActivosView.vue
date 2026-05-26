<template>
  <section class="h-full min-h-0 overflow-hidden bg-[#eef2f7]">
    <div
      ref="layoutRef"
      class="grid h-full min-h-0 grid-cols-1 xl:grid-cols-[var(--fleet-grid)]"
      :style="{
        '--fleet-grid': `${leftPanelWidth}px 8px minmax(0, 1fr)`,
      }"
    >
      <div class="relative flex min-h-0 flex-col overflow-hidden bg-white">
        <FleetListPanel
          :activos="filteredActivos"
          :all-activos="normalizedActivos"
          :geofences="geofences"
          :selected-geofence-id="selectedGeofenceId"
          :selected-id="selectedId"
          :active-filter="statusFilter"
          :active-section="activeSidebarSection"
          :search="sidebarSearch"
          class="min-h-0 flex-1"
          @select="selectActivo"
          @select-filter="setStatusFilter"
          @update:search="setSidebarSearch"
          @update:active-section="setSidebarSection"
          @route-selected="handleItineraryRouteSelected"
          @point-selected="handleItineraryPointSelected"
          @clear-route="handleClearItineraryRoute"
          @open-add-activo="openAddActivoModal"
          @device-action="handleDeviceAction"
          @geofence-selected="handleSidebarGeofenceSelected"
          @geofence-delete="handleGeofenceDeleted"
        />
      </div>

      <div
        class="group hidden cursor-col-resize bg-[#d8dee8] transition hover:bg-[#FF6600] xl:block"
        @pointerdown="startFleetResize"
      >
        <div class="relative h-full w-full">
          <div
            class="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-[#b9c2d0] group-hover:bg-[#FF6600]"
          ></div>

          <div
            class="absolute left-1/2 top-1/2 flex h-12 w-3 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#cbd5e1] bg-white shadow-sm"
          >
            <span
              class="h-7 w-[2px] rounded-full bg-[#102372] group-hover:bg-[#FF6600]"
            ></span>
          </div>
        </div>
      </div>

      <div class="flex min-h-0 flex-col overflow-hidden bg-[#eef2f7]">
        <div class="relative grid min-h-0 flex-1 overflow-hidden p-3">
          <ActivosMapPanel
            :activos="filteredActivos"
            :all-activos="normalizedActivos"
            :selected-id="selectedId"
            :selected-geofence-id="selectedGeofenceId"
            :geofences="geofences"
            :itinerary-route="selectedItineraryRoute"
            :selected-itinerary-point="selectedItineraryPoint"
            :active-filter="statusFilter"
            class="min-h-0"
            @select="selectActivo"
            @select-filter="setStatusFilter"
            @geofence-created="handleGeofenceCreated"
            @geofence-updated="handleGeofenceUpdated"
            @geofence-deleted="handleGeofenceDeleted"
            @clear-geofence-selection="handleClearGeofenceSelection"
          />
        </div>
      </div>
    </div>

    <AddActivoModal
      v-model="showActivoModal"
      :mode="activoModalMode"
      :activo="editingActivo"
      @add-activo="handleAddActivo"
      @update-activo="handleUpdateActivo"
    />

    <FleetTerminalModal
      v-model="showTerminalModal"
      :activo="terminalActivo"
      :history="terminalHistory"
      @send-command="handleTerminalCommand"
    />
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref } from "vue"
import { mockActivos } from "../data/mockActivos"

import FleetListPanel from "../components/activos/fleet/FleetListPanel.vue"
import ActivosMapPanel from "../components/activos/map/ActivosMapPanel.vue"
import AddActivoModal from "../components/activos/fleet/AddActivoModal.vue"
import FleetTerminalModal from "../components/activos/fleet/FleetTerminalModal.vue"

import { useFleetTerminal } from "../composables/activos/fleet/useFleetTerminal"
import { useGeofences } from "../composables/activos/geocercas/useGeofences.js"

const selectedId = ref(mockActivos[0]?.id || null)
const selectedGeofenceId = ref(null)
const statusFilter = ref("all")
const activeSidebarSection = ref("activos")

const sectionSearch = ref({
  activos: "",
  itinerarios: "",
  geocercas: "",
})

const {
  geofences,
  createGeofence,
  updateGeofence,
  deleteGeofence,
} = useGeofences()

const customActivos = ref([])
const deletedActivoIds = ref([])
const editedActivos = ref({})

const showActivoModal = ref(false)
const activoModalMode = ref("create")
const editingActivo = ref(null)

const {
  showTerminalModal,
  terminalActivo,
  terminalHistory,
  openTerminalModal: openFleetTerminalModal,
  closeTerminalModal,
  handleTerminalCommand,
  removeTerminalHistory,
} = useFleetTerminal()

const selectedItineraryRoute = ref(null)
const selectedItineraryPoint = ref(null)

const leftPanelWidth = ref(380)

const layoutRef = ref(null)

let resizeMode = null
let animationFrame = null
let resizeFrame = null
let lastPointerEvent = null

const fallbackDrivers = [
  "Carlos Ramírez",
  "María Gómez",
  "Juan Pérez",
  "Ana Torres",
  "Luis Hidalgo",
  "Felipe Soto",
]

const emptyValue = (value) => {
  if (value === "" || value === null || value === undefined) return "-"

  return value
}

const formatKm = (value) => {
  if (value === "" || value === null || value === undefined) return "-"

  const numberValue = Number(value)

  if (!Number.isFinite(numberValue)) return String(value)

  return `${numberValue.toLocaleString("es-CL")} km`
}

const normalizeText = (value) => {
  return String(value || "").trim().toLowerCase()
}

const sidebarSearch = computed(() => {
  return sectionSearch.value[activeSidebarSection.value] || ""
})

const rawActivos = computed(() => {
  const deletedIds = new Set(deletedActivoIds.value.map((id) => String(id)))

  return [...customActivos.value, ...mockActivos]
    .filter((activo) => {
      return !deletedIds.has(String(activo.id))
    })
    .map((activo) => {
      const editedActivo = editedActivos.value[String(activo.id)]

      return editedActivo
        ? {
            ...activo,
            ...editedActivo,
          }
        : activo
    })
})

const normalizedActivos = computed(() => {
  return rawActivos.value.map((activo, index) => {
    const estado = activo.estado || "offline"
    const isCustomAsset = activo.source === "custom"

    return {
      ...activo,

      vehiculo:
        activo.vehiculo ||
        activo.nombrePantalla ||
        activo.displayName ||
        activo.name ||
        "-",

      name: activo.name || activo.vehiculo || "-",

      nombrePantalla:
        activo.nombrePantalla ||
        activo.displayName ||
        activo.vehiculo ||
        "-",

      conductor: isCustomAsset
        ? emptyValue(activo.conductor)
        : activo.conductor || fallbackDrivers[index % fallbackDrivers.length],

      velocidad:
        activo.velocidad ||
        (isCustomAsset
          ? "-"
          : estado === "moving"
            ? "62 km/h"
            : estado === "idle"
              ? "0 km/h"
              : "-"),

      combustible:
        activo.combustible ||
        activo.fuel ||
        (isCustomAsset ? "-" : estado === "offline" ? "-" : `${68 - index * 2}%`),

      odometro:
        activo.odometro ||
        activo.odometer ||
        (isCustomAsset ? "-" : `${(125430 + index * 1820).toLocaleString("es-CL")} km`),

      direccion:
        activo.direccion ||
        activo.ubicacion ||
        "Última ubicación registrada",

      ignicion:
        activo.ignicion ||
        (estado === "moving" || estado === "idle" ? "Encendida" : "Apagada"),

      ibutton: isCustomAsset
        ? emptyValue(activo.ibutton)
        : activo.ibutton || `iButton # ${String(index + 1).padStart(3, "0")}`,

      imei:
        activo.imei ||
        activo.deviceId ||
        activo.identificador ||
        `86812345${String(index + 1).padStart(4, "0")}`,

      protocol: activo.protocol || "-",

      trackerModel: activo.trackerModel || "-",
      trackerModelLabel: activo.trackerModelLabel || "-",
      trackerManufacturer: activo.trackerManufacturer || "-",

      descripcion: activo.descripcion || activo.description || "-",

      fechaIngreso: activo.fechaIngreso || activo.entryDate || "-",
      fechaBaja: activo.fechaBaja || activo.deactivationDate || "-",
      fechaSuspension: activo.fechaSuspension || activo.suspensionDate || "-",

      horometroDiario: emptyValue(activo.horometroDiario ?? activo.dailyHourmeter),
      horometroTotal: emptyValue(activo.horometroTotal ?? activo.totalHourmeter),
    }
  })
})

const matchesStatusFilter = (activo) => {
  if (statusFilter.value === "all") return true
  if (statusFilter.value === "online") return activo.estado !== "offline"
  if (statusFilter.value === "alerts") return activo.estado === "stopped"

  return activo.estado === statusFilter.value
}

const filteredActivos = computed(() => {
  const term = normalizeText(sectionSearch.value.activos)

  return normalizedActivos.value.filter((activo) => {
    const matchesText =
      !term ||
      normalizeText(activo.vehiculo).includes(term) ||
      normalizeText(activo.name).includes(term) ||
      normalizeText(activo.nombrePantalla).includes(term) ||
      normalizeText(activo.trackerModelLabel).includes(term) ||
      normalizeText(activo.trackerManufacturer).includes(term) ||
      normalizeText(activo.protocol).includes(term) ||
      normalizeText(activo.imei).includes(term) ||
      normalizeText(activo.estado).includes(term) ||
      normalizeText(activo.datosUlt).includes(term) ||
      normalizeText(activo.fechaIngreso).includes(term) ||
      normalizeText(activo.descripcion).includes(term)

    return matchesText && matchesStatusFilter(activo)
  })
})

const createActivoId = () => {
  const ids = [...customActivos.value, ...mockActivos]
    .map((activo) => Number(activo.id))
    .filter((id) => Number.isFinite(id))

  return Math.max(0, ...ids) + 1
}

const getCurrentTimeLabel = () => {
  return new Date().toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
}

const buildActivoDataFromForm = (form = {}, fallbackActivo = {}) => {
  const displayName =
    form.displayName ||
    form.vehiculo ||
    form.nombrePantalla ||
    form.name ||
    fallbackActivo.vehiculo ||
    fallbackActivo.nombrePantalla ||
    fallbackActivo.name ||
    "Activo sin nombre"

  const name =
    form.name ||
    fallbackActivo.name ||
    displayName

  const odometerFromForm = form.odometer ?? form.odometro

  return {
    estado: form.estado || fallbackActivo.estado || "offline",

    vehiculo: displayName,
    name,
    nombrePantalla:
      form.displayName ||
      form.nombrePantalla ||
      fallbackActivo.nombrePantalla ||
      displayName,

    trackerModel: form.trackerModel || fallbackActivo.trackerModel || "-",
    trackerModelLabel:
      form.trackerModelLabel ||
      fallbackActivo.trackerModelLabel ||
      form.trackerModel ||
      "-",
    trackerManufacturer:
      form.trackerManufacturer ||
      fallbackActivo.trackerManufacturer ||
      "-",

    imei: form.imei || fallbackActivo.imei || "-",
    protocol: form.protocol || fallbackActivo.protocol || "tcp",

    descripcion:
      form.description ||
      form.descripcion ||
      fallbackActivo.descripcion ||
      "-",

    fechaIngreso:
      form.entryDate ||
      form.fechaIngreso ||
      fallbackActivo.fechaIngreso ||
      "-",

    fechaBaja:
      form.deactivationDate ||
      form.fechaBaja ||
      fallbackActivo.fechaBaja ||
      "-",

    fechaSuspension:
      form.suspensionDate ||
      form.fechaSuspension ||
      fallbackActivo.fechaSuspension ||
      "-",

    horometroDiario: emptyValue(
      form.dailyHourmeter ??
      form.horometroDiario ??
      fallbackActivo.horometroDiario,
    ),

    horometroTotal: emptyValue(
      form.totalHourmeter ??
      form.horometroTotal ??
      fallbackActivo.horometroTotal,
    ),

    odometro:
      form.odometer !== undefined && form.odometer !== null && form.odometer !== ""
        ? formatKm(form.odometer)
        : emptyValue(odometerFromForm ?? fallbackActivo.odometro),

    direccion:
      form.direccion ||
      form.ubicacion ||
      fallbackActivo.direccion ||
      "Última ubicación registrada",
  }
}

const openAddActivoModal = () => {
  activeSidebarSection.value = "activos"
  activoModalMode.value = "create"
  editingActivo.value = null
  showActivoModal.value = true
}

const handleAddActivo = async (form) => {
  const baseData = buildActivoDataFromForm(form, {
    estado: "offline",
    direccion: "Ubicación pendiente de reporte GPS",
  })

  const newActivo = {
    id: createActivoId(),
    source: "custom",

    ...baseData,

    datosUlt:
      baseData.fechaIngreso && baseData.fechaIngreso !== "-"
        ? baseData.fechaIngreso
        : getCurrentTimeLabel(),

    choque: "-",

    conductor: "-",
    velocidad: "-",
    combustible: "-",
    ibutton: "-",

    lat: -33.4489 + customActivos.value.length * 0.002,
    lng: -70.6693 + customActivos.value.length * 0.002,
  }

  customActivos.value = [newActivo, ...customActivos.value]

  sectionSearch.value = {
    ...sectionSearch.value,
    activos: "",
  }

  statusFilter.value = "all"
  activeSidebarSection.value = "activos"
  selectedId.value = newActivo.id

  showActivoModal.value = false
  activoModalMode.value = "create"
  editingActivo.value = null

  await refreshMapLayout(true)
}

const openEditActivoModal = (activo) => {
  if (!activo) return

  selectedId.value = activo.id
  activoModalMode.value = "edit"
  editingActivo.value = activo
  showActivoModal.value = true
}

const handleUpdateActivo = async (payload) => {
  const id = payload?.id ?? editingActivo.value?.id

  if (id === null || id === undefined) return

  const baseActivo = normalizedActivos.value.find((activo) => {
    return String(activo.id) === String(id)
  }) || editingActivo.value || {}

  const form = payload?.data || payload?.form || payload || {}

  const data = buildActivoDataFromForm(form, baseActivo)

  editedActivos.value = {
    ...editedActivos.value,
    [String(id)]: data,
  }

  selectedId.value = id
  showActivoModal.value = false
  activoModalMode.value = "create"
  editingActivo.value = null

  await refreshMapLayout(true)
}

const openTerminalModal = (activo) => {
  if (!activo) return

  selectedId.value = activo.id
  openFleetTerminalModal(activo)
}

const deleteActivo = async (activo) => {
  const confirmed = window.confirm(`¿Eliminar el activo "${activo.vehiculo || activo.name || activo.id}"?`)

  if (!confirmed) return

  customActivos.value = customActivos.value.filter((item) => {
    return String(item.id) !== String(activo.id)
  })

  if (!deletedActivoIds.value.some((id) => String(id) === String(activo.id))) {
    deletedActivoIds.value = [...deletedActivoIds.value, activo.id]
  }

  const {
    [String(activo.id)]: _removedEditedActivo,
    ...nextEditedActivos
  } = editedActivos.value

  editedActivos.value = nextEditedActivos

  removeTerminalHistory(activo)

  if (String(selectedId.value) === String(activo.id)) {
    const nextActivo = filteredActivos.value.find((item) => {
      return String(item.id) !== String(activo.id)
    })

    selectedId.value = nextActivo?.id || null
  }

  if (String(editingActivo.value?.id) === String(activo.id)) {
    showActivoModal.value = false
    activoModalMode.value = "create"
    editingActivo.value = null
  }

  if (String(terminalActivo.value?.id) === String(activo.id)) {
    closeTerminalModal()
  }

  await refreshMapLayout(true)
}

const handleDeviceAction = async ({ action, activo }) => {
  if (!activo) return

  selectedId.value = activo.id

  if (action === "edit-device") {
    openEditActivoModal(activo)
    return
  }

  if (action === "open-terminal") {
    openTerminalModal(activo)
    return
  }

  if (action === "delete-device") {
    await deleteActivo(activo)
  }
}

const clearSelectedItinerary = () => {
  selectedItineraryRoute.value = null
  selectedItineraryPoint.value = null
}

const setSidebarSearch = (value) => {
  const section = activeSidebarSection.value || "activos"

  sectionSearch.value = {
    ...sectionSearch.value,
    [section]: value,
  }
}

const setSidebarSection = async (section) => {
  const allowedSections = ["activos", "itinerarios", "geocercas"]
  const nextSection = allowedSections.includes(section) ? section : "activos"

  activeSidebarSection.value = nextSection

  if (nextSection !== "itinerarios") {
    clearSelectedItinerary()
  }

  await refreshMapLayout(true)
}

const handleGeofenceCreated = async (geofence) => {
  createGeofence(geofence)

  selectedGeofenceId.value = geofence?.id || null

  await refreshMapLayout(true)
}

const handleGeofenceUpdated = (updatedGeofence) => {
  updateGeofence(updatedGeofence)
}

const handleGeofenceDeleted = async (geofenceId) => {
  deleteGeofence(geofenceId)

  if (String(selectedGeofenceId.value) === String(geofenceId)) {
    selectedGeofenceId.value = null
  }

  await refreshMapLayout(true)
}

const handleClearGeofenceSelection = () => {
  selectedGeofenceId.value = null
}

const handleSidebarGeofenceSelected = async (geofence) => {
  if (!geofence?.id) return

  selectedGeofenceId.value = geofence.id
  activeSidebarSection.value = "geocercas"

  await refreshMapLayout(true)
}

const handleItineraryRouteSelected = async (route) => {
  selectedItineraryRoute.value = route
  selectedItineraryPoint.value = null
  activeSidebarSection.value = "itinerarios"

  const routeAssetId = route?.asset?.activoId || route?.asset?.id

  if (routeAssetId) {
    selectedId.value = routeAssetId
  }

  await refreshMapLayout(true)
}

const handleItineraryPointSelected = async (payload) => {
  selectedItineraryPoint.value = payload?.point || payload || null
  activeSidebarSection.value = "itinerarios"

  await refreshMapLayout()
}

const handleClearItineraryRoute = async () => {
  clearSelectedItinerary()

  await refreshMapLayout(true)
}

const clamp = (value, min, max) => {
  return Math.min(Math.max(value, min), max)
}

const refreshMapLayout = async (withTransition = false) => {
  await nextTick()

  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
  }

  animationFrame = requestAnimationFrame(() => {
    window.dispatchEvent(new Event("resize"))
  })

  if (withTransition) {
    setTimeout(() => {
      window.dispatchEvent(new Event("resize"))
    }, 160)

    setTimeout(() => {
      window.dispatchEvent(new Event("resize"))
    }, 340)
  }
}

const scheduleDragResize = (event) => {
  lastPointerEvent = {
    clientX: event.clientX,
    clientY: event.clientY,
  }

  if (resizeFrame) return

  resizeFrame = requestAnimationFrame(() => {
    if (!lastPointerEvent) return

    if (resizeMode === "fleet") {
      resizeFleet(lastPointerEvent)
    }

    resizeFrame = null
  })
}

const startFleetResize = (event) => {
  resizeMode = "fleet"

  document.body.style.cursor = "col-resize"
  document.body.style.userSelect = "none"

  event.preventDefault()
  event.currentTarget.setPointerCapture?.(event.pointerId)

  window.addEventListener("pointermove", scheduleDragResize)
  window.addEventListener("pointerup", stopResize)
}

const resizeFleet = (event) => {
  if (!layoutRef.value) return

  const rect = layoutRef.value.getBoundingClientRect()
  const rawWidth = event.clientX - rect.left

  const minWidth = 300
  const maxWidth = Math.max(minWidth, rect.width - 360)

  leftPanelWidth.value = clamp(rawWidth, minWidth, maxWidth)
}

const stopResize = async () => {
  resizeMode = null
  lastPointerEvent = null

  document.body.style.cursor = ""
  document.body.style.userSelect = ""

  window.removeEventListener("pointermove", scheduleDragResize)
  window.removeEventListener("pointerup", stopResize)

  if (resizeFrame) {
    cancelAnimationFrame(resizeFrame)
    resizeFrame = null
  }

  await refreshMapLayout()
}

const selectActivo = async (id) => {
  selectedId.value = id
  await refreshMapLayout(true)
}

const setStatusFilter = async (filter) => {
  activeSidebarSection.value = "activos"
  clearSelectedItinerary()

  statusFilter.value = filter

  const nextActivo = filteredActivos.value[0]
  selectedId.value = nextActivo?.id || null

  await refreshMapLayout(true)
}

onBeforeUnmount(() => {
  window.removeEventListener("pointermove", scheduleDragResize)
  window.removeEventListener("pointerup", stopResize)

  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
  }

  if (resizeFrame) {
    cancelAnimationFrame(resizeFrame)
  }

  document.body.style.cursor = ""
  document.body.style.userSelect = ""
})
</script>