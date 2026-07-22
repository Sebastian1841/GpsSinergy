<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-[2147483644] bg-slate-950/40"
      @click.self="closeModal"
    >
      <section
        ref="modalRef"
        class="fixed flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.32)]"
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
                Geocercas
              </p>

              <h2 class="mt-1 truncate text-[18px] font-black leading-tight text-slate-900">
                Seleccionar geocerca
              </h2>

              <p
                class="mt-1 max-w-[720px] text-[11px] font-semibold leading-relaxed text-slate-500"
              >
                {{
                  canEdit
                    ? "Edita una geocerca o revisa el historial de vehículos asociados."
                    : "Revisa el historial de vehículos asociados."
                }}
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

        <div class="min-h-0 flex-1 overflow-auto p-3 sm:p-4">
          <div
            v-if="!geofenceItems.length"
            class="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-5 text-center"
          >
            <p class="text-[13px] font-black text-[#172033]">No hay geocercas creadas</p>

            <p class="mt-1 max-w-[320px] text-[11px] font-semibold text-slate-500">
              Crea una geocerca desde el menú Geocerca usando la opción circular, poligonal o ruta.
            </p>

            <button
              type="button"
              class="mt-4 cursor-pointer rounded-lg bg-[#102372] px-4 py-2 text-[11px] font-black text-white transition hover:bg-[#0c1b59]"
              @pointerdown.stop
              @click.stop="closeModal"
            >
              Volver al mapa
            </button>
          </div>

          <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <article
              v-for="(geofence, index) in geofenceItems"
              :key="getGeofenceRenderKey(geofence, index)"
              class="flex min-h-0 flex-col justify-between rounded-xl border border-[#d8dee8] bg-white p-3 shadow-sm transition hover:border-[#FF6600] sm:p-4"
              :class="
                selectedGeofenceId === geofence.id || editingDraft?.id === geofence.id
                  ? 'border-[#FF6600] bg-[#fff7ed]'
                  : ''
              "
            >
              <div class="min-w-0">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <div class="flex min-w-0 items-center gap-2">
                      <span
                        class="h-3 w-3 shrink-0 rounded-full border border-slate-200"
                        :style="{ backgroundColor: getGeofenceColor(geofence) }"
                      ></span>

                      <h3 class="truncate text-[13px] font-black text-[#172033]">
                        {{ geofence.name }}
                      </h3>
                    </div>

                    <p class="mt-1 text-[11px] font-semibold text-slate-500">
                      {{ getGeofenceMeta(geofence) }}
                    </p>
                  </div>

                  <span
                    class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black"
                    :class="getGeofenceBadgeClass(geofence)"
                  >
                    {{ getGeofenceBadgeLabel(geofence) }}
                  </span>
                </div>

                <div class="mt-3 rounded-lg bg-[#f8fafc] px-3 py-2">
                  <p class="text-[10px] font-bold text-slate-500">
                    {{ getGeofenceDescription(geofence) }}
                  </p>
                </div>
              </div>

              <div
                class="mt-3 grid grid-cols-1 gap-2"
                :class="canEdit ? 'sm:grid-cols-3' : 'sm:grid-cols-1'"
              >
                <button
                  v-if="canEdit"
                  type="button"
                  class="cursor-pointer rounded-lg bg-[#102372] px-3 py-2 text-[11px] font-black text-white transition hover:bg-[#0c1b59]"
                  @pointerdown.stop
                  @click="$emit('select-edit', geofence.id)"
                >
                  Ir al mapa
                </button>

                <button
                  type="button"
                  class="cursor-pointer rounded-lg bg-[#eef3ff] px-3 py-2 text-[11px] font-black text-[#102372] transition hover:bg-[#dbe6ff]"
                  @pointerdown.stop
                  @click="$emit('open-history', geofence)"
                >
                  Historial
                </button>

                <button
                  v-if="canEdit"
                  type="button"
                  class="cursor-pointer rounded-lg bg-red-50 px-3 py-2 text-[11px] font-black text-red-600 transition hover:bg-red-100"
                  @pointerdown.stop
                  @click="confirmDeleteGeofence(geofence)"
                >
                  Eliminar
                </button>
              </div>
            </article>
          </div>
        </div>

        <footer
          class="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:px-5"
        >
          <p class="hidden text-[10px] font-bold text-slate-400 sm:block">
            Puedes mover y redimensionar este modal. Doble clic en el encabezado para restaurar.
          </p>

          <button
            type="button"
            class="cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2 text-[11px] font-black text-[#102372] transition hover:border-[#FF6600] hover:text-[#FF6600]"
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
          <div
            class="absolute bottom-2 right-2 h-3 w-3 rounded-sm border-b-2 border-r-2 border-slate-400"
          ></div>
        </div>
      </section>
    </div>

    <ConfirmDialog
      v-model="confirmDialog.isOpen"
      :title="confirmDialog.title"
      :message="confirmDialog.message"
      :detail="confirmDialog.detail"
      :confirm-label="confirmDialog.confirmLabel"
      :cancel-label="confirmDialog.cancelLabel"
      :variant="confirmDialog.variant"
      @confirm="confirmAction"
      @cancel="cancelAction"
    />
  </Teleport>
</template>

<script setup>
import { nextTick, onBeforeUnmount, watch } from "vue"

import ConfirmDialog from "../../ui/ConfirmDialog.vue"
import { useFloatingModal } from "../../../composables/ui/useFloatingModal.js"
import { useConfirmDialog } from "../../../composables/ui/useConfirmDialog.js"
import {
  getGeofenceBadgeClass,
  getGeofenceBadgeLabel,
  getGeofenceColor,
  getGeofenceDescription,
  getGeofenceMeta,
} from "../../../utils/geofenceUtils.js"
import { normalizeId } from "../../../utils/idUtils.js"

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  geofenceItems: {
    type: Array,
    default: () => [],
  },
  selectedGeofenceId: {
    type: [String, Number],
    default: null,
  },
  editingDraft: {
    type: Object,
    default: null,
  },
  canEdit: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(["update:modelValue", "select-edit", "open-history", "delete-geofence"])

const { confirmDialog, openConfirmDialog, confirmAction, cancelAction } = useConfirmDialog()

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
  defaultWidth: 760,
  defaultHeight: 560,
  minWidth: 360,
  minHeight: 360,
  margin: 12,
})

const closeModal = () => {
  stopInteraction()
  emit("update:modelValue", false)
}

const getGeofenceRenderKey = (geofence, index) => {
  return normalizeId(geofence?.id) || `geofence-${index}`
}

const confirmDeleteGeofence = async (geofence) => {
  if (!geofence?.id) return

  const geofenceName = geofence.name || "esta geocerca"

  const confirmed = await openConfirmDialog({
    title: "Eliminar geocerca",
    message: `¿Seguro que deseas eliminar "${geofenceName}"?`,
    detail: "Esta acción quitará la geocerca del mapa y de la lista lateral.",
    confirmLabel: "Eliminar",
    cancelLabel: "Cancelar",
    variant: "danger",
  })

  if (!confirmed) return

  emit("delete-geofence", geofence.id)
}

const handleKeydown = (event) => {
  if (confirmDialog.isOpen) return

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
