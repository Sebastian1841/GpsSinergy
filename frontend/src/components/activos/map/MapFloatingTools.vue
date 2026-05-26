<template>
  <div @click.stop>
    <!-- Botón principal -->
    <button
      type="button"
      title="Herramientas"
      class="group absolute left-3 top-3 z-[540] flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-[#d8dee8] bg-white text-[18px] font-black text-[#102372] shadow-lg transition hover:border-[#FF6600] hover:bg-[#fff7ed] hover:text-[#FF6600]"
      :class="toolsMenuOpen ? 'border-[#FF6600] bg-[#fff7ed] text-[#FF6600]' : ''"
      @click.stop="toggleToolsMenu"
    >
      ☰

      <span
        class="pointer-events-none absolute left-[48px] top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-[#102372] px-2 py-1 text-[10px] font-black text-white shadow-lg group-hover:block"
      >
        Herramientas
      </span>
    </button>

    <!-- Menú flotante compacto -->
    <div
      v-if="toolsMenuOpen"
      class="absolute left-3 top-[58px] z-[540] flex flex-col gap-1 rounded-2xl border border-[#d8dee8] bg-white p-1.5 shadow-2xl"
      @click.stop
    >
      <button
        type="button"
        title="Geocerca"
        class="group relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-[16px] font-black transition"
        :class="
          geofenceMenuOpen
            ? 'bg-[#FF6600] text-white'
            : 'bg-white text-[#102372] hover:bg-[#fff7ed] hover:text-[#FF6600]'
        "
        @click.stop="toggleGeofenceMenu"
      >
        ⬟

        <span
          class="pointer-events-none absolute left-[46px] top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-[#102372] px-2 py-1 text-[10px] font-black text-white shadow-lg group-hover:block"
        >
          Geocerca
        </span>
      </button>

      <button
        type="button"
        :title="showKpis ? 'Ocultar KPIs' : 'Mostrar KPIs'"
        class="group relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-[15px] font-black transition"
        :class="
          showKpis
            ? 'bg-[#FF6600] text-white'
            : 'bg-white text-[#102372] hover:bg-[#fff7ed] hover:text-[#FF6600]'
        "
        @click.stop="$emit('toggle-kpis')"
      >
        ◫

        <span
          class="pointer-events-none absolute left-[46px] top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-[#102372] px-2 py-1 text-[10px] font-black text-white shadow-lg group-hover:block"
        >
          {{ showKpis ? "Ocultar KPIs" : "Mostrar KPIs" }}
        </span>
      </button>

      <button
        type="button"
        title="Capas"
        class="group relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-[15px] font-black transition"
        :class="
          layersMenuOpen
            ? 'bg-[#FF6600] text-white'
            : 'bg-white text-[#102372] hover:bg-[#fff7ed] hover:text-[#FF6600]'
        "
        @click.stop="toggleLayersMenu"
      >
        ▣

        <span
          class="pointer-events-none absolute left-[46px] top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-[#102372] px-2 py-1 text-[10px] font-black text-white shadow-lg group-hover:block"
        >
          Capas
        </span>
      </button>

      <button
        type="button"
        title="Rutas"
        class="group relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-white text-[15px] font-black text-[#102372] transition hover:bg-[#eef3ff]"
        @click.stop
      >
        ⤴

        <span
          class="pointer-events-none absolute left-[46px] top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-[#102372] px-2 py-1 text-[10px] font-black text-white shadow-lg group-hover:block"
        >
          Rutas
        </span>
      </button>

      <button
        type="button"
        title="Alertas"
        class="group relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-white text-[15px] font-black text-[#102372] transition hover:bg-[#eef3ff]"
        @click.stop
      >
        !

        <span
          class="pointer-events-none absolute left-[46px] top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-[#102372] px-2 py-1 text-[10px] font-black text-white shadow-lg group-hover:block"
        >
          Alertas
        </span>
      </button>

      <button
        type="button"
        title="Cerrar"
        class="group relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-red-50 text-[17px] font-black text-red-600 transition hover:bg-red-100"
        @click.stop="closeToolsMenu"
      >
        ×

        <span
          class="pointer-events-none absolute left-[46px] top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-[#102372] px-2 py-1 text-[10px] font-black text-white shadow-lg group-hover:block"
        >
          Cerrar
        </span>
      </button>
    </div>

    <!-- Dropdown compacto de geocerca -->
    <div
      v-if="toolsMenuOpen && geofenceMenuOpen"
      class="absolute left-[64px] top-[58px] z-[545] flex gap-1 rounded-2xl border border-[#d8dee8] bg-white p-1.5 shadow-2xl"
      @click.stop
    >
      <!-- Crear -->
      <div class="relative">
        <button
          type="button"
          title="Crear geocerca"
          class="group relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-[17px] font-black transition"
          :class="
            createGeofenceMenuOpen ||
            drawMode === 'circle' ||
            drawMode === 'polygon' ||
            drawMode === 'route'
              ? 'bg-[#FF6600] text-white'
              : 'bg-white text-[#102372] hover:bg-[#fff7ed] hover:text-[#FF6600]'
          "
          @click.stop="toggleCreateGeofenceMenu"
        >
          +

          <span
            class="pointer-events-none absolute left-1/2 top-[43px] hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-[#102372] px-2 py-1 text-[10px] font-black text-white shadow-lg group-hover:block"
          >
            Crear
          </span>
        </button>

        <!-- Submenú hacia abajo solo para crear -->
        <div
          v-if="createGeofenceMenuOpen"
          class="absolute left-0 top-[43px] z-[560] w-[132px] rounded-xl border border-[#d8dee8] bg-white p-1 shadow-2xl"
          @click.stop
        >
          <button
            type="button"
            title="Crear circular"
            class="flex w-full cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-[10px] font-black transition"
            :class="
              drawMode === 'circle'
                ? 'bg-[#FF6600] text-white'
                : 'text-[#102372] hover:bg-[#fff7ed] hover:text-[#FF6600]'
            "
            @click.stop="emitAndClose('create-circle')"
          >
            <span
              class="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white/70 text-[12px]"
            >
              ◯
            </span>
            <span class="truncate">Circular</span>
          </button>

          <button
            type="button"
            title="Crear ruta"
            class="mt-0.5 flex w-full cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-[10px] font-black transition"
            :class="
              drawMode === 'route'
                ? 'bg-[#FF6600] text-white'
                : 'text-[#102372] hover:bg-[#fff7ed] hover:text-[#FF6600]'
            "
            @click.stop="emitAndClose('create-route')"
          >
            <span
              class="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white/70 text-[12px]"
            >
              ⤴
            </span>
            <span class="truncate">Ruta</span>
          </button>

          <button
            type="button"
            title="Crear polígono"
            class="mt-0.5 flex w-full cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-[10px] font-black transition"
            :class="
              drawMode === 'polygon'
                ? 'bg-[#FF6600] text-white'
                : 'text-[#102372] hover:bg-[#fff7ed] hover:text-[#FF6600]'
            "
            @click.stop="emitAndClose('create-polygon')"
          >
            <span
              class="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white/70 text-[12px]"
            >
              ⬠
            </span>
            <span class="truncate">Polígono</span>
          </button>
        </div>
      </div>

      <button
        type="button"
        title="Editar geocercas"
        class="group relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-white text-[15px] font-black text-[#102372] transition hover:bg-[#eef3ff]"
        @click.stop="emitAndClose('open-edit-geofence-modal')"
      >
        ✎

        <span
          class="pointer-events-none absolute left-1/2 top-[43px] hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-[#102372] px-2 py-1 text-[10px] font-black text-white shadow-lg group-hover:block"
        >
          Editar
        </span>
      </button>

      <button
        type="button"
        title="Historial de geocercas"
        class="group relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-white text-[15px] font-black text-[#102372] transition hover:bg-[#eef3ff]"
        @click.stop="emitAndClose('open-geofence-history-selector')"
      >
        ◷

        <span
          class="pointer-events-none absolute left-1/2 top-[43px] hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-[#102372] px-2 py-1 text-[10px] font-black text-white shadow-lg group-hover:block"
        >
          Historial
        </span>
      </button>

      <button
        type="button"
        :title="showGeofences ? 'Ocultar geocercas' : 'Mostrar geocercas'"
        class="group relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-[15px] font-black transition"
        :class="
          showGeofences
            ? 'bg-[#eef3ff] text-[#102372] hover:bg-[#dbe6ff]'
            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
        "
        @click.stop="$emit('toggle-geofence-visibility')"
      >
        {{ showGeofences ? "◉" : "◎" }}

        <span
          class="pointer-events-none absolute left-1/2 top-[43px] hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-[#102372] px-2 py-1 text-[10px] font-black text-white shadow-lg group-hover:block"
        >
          {{ showGeofences ? "Ocultar" : "Mostrar" }}
        </span>
      </button>
    </div>

    <!-- Dropdown compacto de tipos de mapa -->
    <div
      v-if="toolsMenuOpen && layersMenuOpen"
      class="absolute left-[64px] top-[100px] z-[545] w-[205px] overflow-hidden rounded-2xl border border-[#d8dee8] bg-white shadow-2xl"
      @click.stop
    >
      <div class="border-b border-[#edf1f5] bg-[#f8fafc] px-3 py-2">
        <p class="text-[10px] font-black uppercase tracking-[0.12em] text-[#102372]">
          Tipo de mapa
        </p>
      </div>

      <div class="p-1.5">
        <button
          v-for="option in mapTypeOptions"
          :key="option.value"
          type="button"
          class="flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left text-[11px] font-black transition"
          :class="
            mapType === option.value
              ? 'bg-[#fff7ed] text-[#FF6600]'
              : 'text-[#102372] hover:bg-[#f8fafc] hover:text-[#FF6600]'
          "
          @click.stop="selectMapType(option.value)"
        >
          <span class="flex min-w-0 items-center gap-2">
            <span
              class="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg"
              :class="
                mapType === option.value
                  ? 'bg-[#FF6600]/10 text-[#FF6600]'
                  : 'bg-[#102372]/10 text-[#102372]'
              "
            >
              <SvgIcon :name="option.icon" class="h-4 w-4" />
            </span>

            <span class="truncate">
              {{ option.label }}
            </span>
          </span>

          <span v-if="mapType === option.value" class="text-[12px] font-black"> ✓ </span>
        </button>
      </div>
    </div>

    <!-- Acciones compactas de polígono -->
    <div
      v-if="drawMode === 'polygon'"
      class="absolute top-[58px] z-[535] flex gap-1 rounded-2xl border border-[#d8dee8] bg-white p-1.5 shadow-2xl"
      :class="toolsMenuOpen ? 'left-[114px]' : 'left-3'"
      @click.stop
    >
      <button
        type="button"
        title="Guardar polígono"
        class="group relative flex h-9 w-9 items-center justify-center rounded-xl text-[15px] font-black transition"
        :class="
          canSavePolygon
            ? 'cursor-pointer bg-[#102372] text-white hover:bg-[#0c1b59]'
            : 'cursor-not-allowed bg-slate-100 text-slate-400'
        "
        :disabled="!canSavePolygon"
        @click.stop="$emit('finish-polygon')"
      >
        ✓
      </button>

      <button
        type="button"
        title="Deshacer punto"
        class="group relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-[#d8dee8] bg-white text-[15px] font-black text-[#102372] transition hover:bg-[#eef3ff]"
        :disabled="draftPolygonPoints.length === 0"
        :class="draftPolygonPoints.length === 0 ? 'cursor-not-allowed opacity-40' : ''"
        @click.stop="$emit('undo-polygon-point')"
      >
        ↶
      </button>

      <button
        type="button"
        title="Cancelar"
        class="group relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-red-50 text-[17px] font-black text-red-600 transition hover:bg-red-100"
        @click.stop="emitAndClose('cancel')"
      >
        ×
      </button>
    </div>

    <!-- Acciones compactas de ruta -->
    <div
      v-if="drawMode === 'route'"
      class="absolute top-[58px] z-[535] flex gap-1 rounded-2xl border border-[#d8dee8] bg-white p-1.5 shadow-2xl"
      :class="toolsMenuOpen ? 'left-[114px]' : 'left-3'"
      @click.stop
    >
      <button
        type="button"
        title="Guardar ruta"
        class="group relative flex h-9 w-9 items-center justify-center rounded-xl text-[15px] font-black transition"
        :class="
          canSaveRoute
            ? 'cursor-pointer bg-[#102372] text-white hover:bg-[#0c1b59]'
            : 'cursor-not-allowed bg-slate-100 text-slate-400'
        "
        :disabled="!canSaveRoute"
        @click.stop="$emit('finish-route')"
      >
        ✓
      </button>

      <button
        type="button"
        title="Deshacer punto"
        class="group relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-[#d8dee8] bg-white text-[15px] font-black text-[#102372] transition hover:bg-[#eef3ff]"
        :disabled="draftRoutePoints.length === 0"
        :class="draftRoutePoints.length === 0 ? 'cursor-not-allowed opacity-40' : ''"
        @click.stop="$emit('undo-route-point')"
      >
        ↶
      </button>

      <button
        type="button"
        title="Cancelar"
        class="group relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-red-50 text-[17px] font-black text-red-600 transition hover:bg-red-100"
        @click.stop="emitAndClose('cancel')"
      >
        ×
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue"
import SvgIcon from "../../../components/icons/SvgIcon.vue"

defineProps({
  showKpis: {
    type: Boolean,
    default: true,
  },
  showGeofences: {
    type: Boolean,
    default: true,
  },
  drawMode: {
    type: String,
    default: null,
  },
  canSavePolygon: {
    type: Boolean,
    default: false,
  },
  canSaveRoute: {
    type: Boolean,
    default: false,
  },
  draftPolygonPoints: {
    type: Array,
    default: () => [],
  },
  draftRoutePoints: {
    type: Array,
    default: () => [],
  },
  mapType: {
    type: String,
    default: "standard",
  },
  mapTypeOptions: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits([
  "toggle-kpis",
  "create-circle",
  "create-polygon",
  "create-route",
  "open-edit-geofence-modal",
  "open-geofence-history-selector",
  "toggle-geofence-visibility",
  "finish-polygon",
  "finish-route",
  "undo-polygon-point",
  "undo-route-point",
  "cancel",
  "change-map-type",
])

const toolsMenuOpen = ref(false)
const geofenceMenuOpen = ref(false)
const createGeofenceMenuOpen = ref(false)
const layersMenuOpen = ref(false)

const toggleToolsMenu = () => {
  toolsMenuOpen.value = !toolsMenuOpen.value

  if (!toolsMenuOpen.value) {
    geofenceMenuOpen.value = false
    createGeofenceMenuOpen.value = false
    layersMenuOpen.value = false
  }
}

const toggleGeofenceMenu = () => {
  geofenceMenuOpen.value = !geofenceMenuOpen.value
  createGeofenceMenuOpen.value = false

  if (geofenceMenuOpen.value) {
    layersMenuOpen.value = false
  }
}

const toggleCreateGeofenceMenu = () => {
  createGeofenceMenuOpen.value = !createGeofenceMenuOpen.value
}

const toggleLayersMenu = () => {
  layersMenuOpen.value = !layersMenuOpen.value

  if (layersMenuOpen.value) {
    geofenceMenuOpen.value = false
    createGeofenceMenuOpen.value = false
  }
}

const closeToolsMenu = () => {
  toolsMenuOpen.value = false
  geofenceMenuOpen.value = false
  createGeofenceMenuOpen.value = false
  layersMenuOpen.value = false
}

const selectMapType = (type) => {
  emit("change-map-type", type)
  layersMenuOpen.value = false
}

const emitAndClose = (eventName) => {
  emit(eventName)
  closeToolsMenu()
}
</script>
