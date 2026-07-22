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
        <GeofenceHistoryHeader
          :modal-title="modalTitle"
          :modal-description="modalDescription"
          @start-drag="startDrag"
          @reset-frame="resetFrame"
          @close="closeModal"
        />

        <GeofenceHistoryControls
          v-model:search-term="searchTerm"
          v-model:date-preset="datePreset"
          v-model:date-from="dateFrom"
          v-model:date-to="dateTo"
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :metrics="metrics"
          :pagination-start="paginationStart"
          :pagination-end="paginationEnd"
          :total-items="totalItems"
          :total-pages="totalPages"
          :page-size-options="pageSizeOptions"
          @clear-filters="clearFilters"
        />

        <GeofenceHistoryTable
          :total-items="totalItems"
          :paginated-rows="paginatedRows"
          :empty-title="emptyTitle"
          :empty-description="emptyDescription"
          :has-active-filters="hasActiveFilters"
          :get-sort-icon="getSortIcon"
          @clear-filters="clearFilters"
          @toggle-sort="toggleSort"
        />

        <footer
          class="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:px-5"
        >
          <p class="hidden text-[10px] font-bold text-slate-400 sm:block">
            Doble clic en el encabezado para restaurar el tamano.
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

        <FloatingModalResizeHandles @start-resize="startResize" />
      </section>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, watch } from "vue"

import { useGeofenceHistoryRows } from "../../../composables/activos/geocercas/useGeofenceHistoryRows.js"
import { useFloatingModal } from "../../../composables/ui/useFloatingModal.js"
import FloatingModalResizeHandles from "../../ui/FloatingModalResizeHandles.vue"
import GeofenceHistoryControls from "./history/GeofenceHistoryControls.vue"
import GeofenceHistoryHeader from "./history/GeofenceHistoryHeader.vue"
import GeofenceHistoryTable from "./history/GeofenceHistoryTable.vue"

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

const {
  searchTerm,
  datePreset,
  dateFrom,
  dateTo,
  currentPage,
  pageSize,
  pageSizeOptions,
  normalizedRows,
  metrics,
  hasActiveFilters,
  totalItems,
  totalPages,
  paginationStart,
  paginationEnd,
  paginatedRows,
  toggleSort,
  getSortIcon,
  resetFiltersToDefault,
  clearFilters,
} = useGeofenceHistoryRows({
  events: computed(() => props.events),
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

  return "El historial puede abrirse aunque todavia no exista una geocerca seleccionada."
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
    return "No existen registros que coincidan con la busqueda o el filtro de fecha actual."
  }

  if (hasGeofence.value) {
    return "Cuando existan eventos asociados a esta geocerca, apareceran en este panel."
  }

  return "Crea una geocerca o selecciona una existente para revisar su historial."
})

const closeModal = () => {
  stopInteraction()
  emit("update:modelValue", false)
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
