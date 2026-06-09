<template>
  <div class="min-h-0 flex-1 overflow-auto bg-[#f8fafc] p-3">
    <div class="flex min-h-full flex-col rounded-2xl border border-[#d8dee8] bg-white p-4">
      <div class="mb-4 flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="text-[10px] font-black uppercase tracking-[0.16em] text-[#FF6600]">
            Control territorial
          </p>

          <h3 class="mt-1 truncate text-[14px] font-black text-[#102372]">Geocercas</h3>

          <p class="mt-1 text-[11px] font-semibold leading-relaxed text-slate-500">
            Zonas y rutas creadas en el mapa. Puedes revisarlas y eliminarlas desde este panel.
          </p>
        </div>

        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#102372]/10 text-[#102372]"
        >
          <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" aria-hidden="true">
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
        v-if="!geofences.length"
        class="flex min-h-[180px] flex-col items-center justify-center rounded-xl border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-4 text-center"
      >
        <p class="text-[12px] font-black text-[#102372]">No hay geocercas creadas</p>

        <p class="mt-1 max-w-[280px] text-[11px] font-semibold leading-relaxed text-slate-500">
          Crea una geocerca desde las herramientas del mapa para verla en esta sección.
        </p>
      </div>

      <div
        v-else-if="!filteredGeofences.length"
        class="flex min-h-[160px] flex-col items-center justify-center rounded-xl border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-4 text-center"
      >
        <p class="text-[12px] font-black text-[#102372]">Sin resultados</p>

        <p class="mt-1 max-w-[280px] text-[11px] font-semibold leading-relaxed text-slate-500">
          No encontramos geocercas con ese criterio de búsqueda.
        </p>
      </div>

      <div v-else class="grid gap-2">
        <article
          v-for="geofence in filteredGeofences"
          :key="geofence.id"
          class="group rounded-xl border bg-white p-3 shadow-sm transition hover:border-[#FF6600] hover:bg-[#fff7ed]"
          :class="
            normalizeId(selectedGeofenceId) === normalizeId(geofence.id)
              ? 'border-[#FF6600] bg-[#fff7ed]'
              : 'border-[#d8dee8]'
          "
        >
          <button
            type="button"
            class="flex w-full cursor-pointer items-start gap-3 text-left"
            @click="$emit('select-geofence', geofence)"
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

          <div
            class="mt-3 flex items-center justify-between gap-2 rounded-lg bg-[#f8fafc] px-3 py-2"
          >
            <p class="min-w-0 truncate text-[10px] font-bold text-slate-500">
              {{ getGeofenceDescription(geofence) }}
            </p>

            <button
              v-if="canEditGeofences"
              type="button"
              class="shrink-0 cursor-pointer rounded-md bg-red-50 px-2 py-1 text-[10px] font-black text-red-600 transition hover:bg-red-100"
              @click.stop="$emit('delete-geofence', geofence)"
            >
              Eliminar
            </button>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  getGeofenceBadgeClass,
  getGeofenceBadgeLabel,
  getGeofenceColor,
  getGeofenceDescription,
  getGeofenceMeta,
} from "../../../utils/geofenceUtils.js"
import { normalizeId } from "../../../utils/idUtils.js"

defineProps({
  geofences: {
    type: Array,
    default: () => [],
  },
  filteredGeofences: {
    type: Array,
    default: () => [],
  },
  selectedGeofenceId: {
    type: [String, Number],
    default: null,
  },
  canEditGeofences: {
    type: Boolean,
    default: false,
  },
})

defineEmits(["select-geofence", "delete-geofence"])
</script>
