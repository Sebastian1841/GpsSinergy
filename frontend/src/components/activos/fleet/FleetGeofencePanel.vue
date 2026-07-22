<template>
  <div class="min-h-0 flex-1 overflow-auto bg-[#f6f8fb] p-3">
    <section
      class="flex min-h-full flex-col overflow-hidden rounded-xl border border-[#d8dee8] bg-white"
    >
      <!-- Encabezado -->
      <header class="flex items-center justify-between gap-3 border-b border-[#e8ecf2] px-4 py-3">
        <div class="flex min-w-0 items-center gap-3">
          <div
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#102372]/10 text-[#102372]"
          >
            <svg viewBox="0 0 24 24" class="h-4.5 w-4.5" fill="none" aria-hidden="true">
              <path
                d="M12 21s7-4.6 7-11.25A7 7 0 0 0 5 9.75C5 16.4 12 21 12 21Z"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              />

              <circle cx="12" cy="9.75" r="2.5" stroke="currentColor" stroke-width="1.8" />
            </svg>
          </div>

          <div class="min-w-0">
            <h3 class="truncate text-[13px] font-black text-[#102372]">Geocercas</h3>

            <p class="mt-0.5 truncate text-[10px] font-semibold text-slate-500">
              Zonas y rutas creadas en el mapa
            </p>
          </div>
        </div>

        <span
          class="flex h-7 min-w-7 shrink-0 items-center justify-center rounded-md bg-[#102372] px-2 text-[10px] font-black text-white"
        >
          {{ geofences.length }}
        </span>
      </header>

      <div class="border-b border-[#e8ecf2] bg-[#f8fafc] px-4 py-2.5">
        <label
          class="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-[#d8dee8] bg-white px-3 py-2 transition hover:border-[#FF6600]/60"
        >
          <span class="min-w-0">
            <span class="block truncate text-[10px] font-black text-[#102372]">
              Usar geocerca como direccion
            </span>

            <span class="mt-0.5 block text-[9px] font-semibold leading-snug text-slate-500">
              Reemplaza la direccion del activo por el grupo o nombre de la geocerca cuando esta
              dentro de una zona.
            </span>
          </span>

          <button
            type="button"
            class="relative h-6 w-11 shrink-0 rounded-full transition"
            :class="useGeofenceLocationAddress ? 'bg-[#FF6600]' : 'bg-slate-300'"
            :aria-pressed="useGeofenceLocationAddress ? 'true' : 'false'"
            @click.stop="emit('update:use-geofence-location-address', !useGeofenceLocationAddress)"
          >
            <span
              class="absolute top-1 h-4 w-4 rounded-full bg-white shadow transition"
              :class="useGeofenceLocationAddress ? 'left-6' : 'left-1'"
            ></span>
          </button>
        </label>
      </div>

      <!-- Sin geocercas -->
      <div
        v-if="!geofences.length"
        class="flex min-h-[220px] flex-1 flex-col items-center justify-center px-6 py-10 text-center"
      >
        <div
          class="flex h-11 w-11 items-center justify-center rounded-xl bg-[#102372]/[0.07] text-[#102372]"
        >
          <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" aria-hidden="true">
            <path
              d="M12 21s7-4.6 7-11.25A7 7 0 0 0 5 9.75C5 16.4 12 21 12 21Z"
              stroke="currentColor"
              stroke-width="1.7"
              stroke-linecap="round"
              stroke-linejoin="round"
            />

            <circle cx="12" cy="9.75" r="2.5" stroke="currentColor" stroke-width="1.7" />
          </svg>
        </div>

        <p class="mt-3 text-[12px] font-black text-[#102372]">No hay geocercas</p>

        <p class="mt-1 max-w-[250px] text-[10px] font-semibold leading-relaxed text-slate-500">
          Crea una zona o ruta desde las herramientas del mapa.
        </p>
      </div>

      <!-- Sin resultados -->
      <div
        v-else-if="!filteredGeofences.length"
        class="flex min-h-[220px] flex-1 flex-col items-center justify-center px-6 py-10 text-center"
      >
        <div
          class="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500"
        >
          <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" aria-hidden="true">
            <circle cx="10.5" cy="10.5" r="5.5" stroke="currentColor" stroke-width="1.7" />

            <path d="m15 15 4 4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
          </svg>
        </div>

        <p class="mt-3 text-[12px] font-black text-[#102372]">Sin resultados</p>

        <p class="mt-1 max-w-[250px] text-[10px] font-semibold leading-relaxed text-slate-500">
          No encontramos geocercas con ese criterio de búsqueda.
        </p>
      </div>

      <!-- Lista -->
      <div v-else class="divide-y divide-[#e8ecf2]">
        <article
          v-for="(geofence, index) in filteredGeofences"
          :key="getGeofenceRenderKey(geofence, index)"
          class="group relative transition"
          :class="
            normalizeId(selectedGeofenceId) === normalizeId(geofence.id)
              ? 'bg-[#fff8f3]'
              : 'bg-white hover:bg-[#f8fafc]'
          "
        >
          <span
            class="absolute inset-y-0 left-0 w-[3px]"
            :class="
              normalizeId(selectedGeofenceId) === normalizeId(geofence.id)
                ? 'bg-[#FF6600]'
                : 'bg-transparent'
            "
          ></span>

          <div class="flex items-center gap-3 px-4 py-3">
            <button
              type="button"
              class="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
              @click="$emit('select-geofence', geofence)"
            >
              <span
                class="h-3 w-3 shrink-0 rounded-full ring-4 ring-slate-100"
                :style="{ backgroundColor: getGeofenceColor(geofence) }"
              ></span>

              <span class="min-w-0 flex-1">
                <span class="flex items-center gap-2">
                  <span class="min-w-0 flex-1 truncate text-[11px] font-black text-[#172033]">
                    {{ geofence.name }}
                  </span>

                  <span
                    class="shrink-0 rounded-md px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide"
                    :class="getGeofenceBadgeClass(geofence)"
                  >
                    {{ getGeofenceBadgeLabel(geofence) }}
                  </span>
                </span>

                <span class="mt-1 block truncate text-[9px] font-semibold text-slate-500">
                  {{ getGeofenceDescription(geofence) }}
                </span>

                <span class="mt-0.5 block truncate text-[8px] font-bold text-slate-400">
                  {{ getGeofenceMeta(geofence) }}
                </span>
              </span>
            </button>

            <div v-if="canEditGeofences" class="flex shrink-0 items-center gap-1">
              <button
                type="button"
                class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-slate-400 transition hover:bg-[#102372]/10 hover:text-[#102372]"
                title="Editar geocerca"
                aria-label="Editar geocerca"
                @click.stop="$emit('edit-geofence', geofence)"
              >
                <svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" aria-hidden="true">
                  <path
                    d="m14.5 5.5 4 4M5 19l3.5-.75L18 7.75a1.4 1.4 0 0 0 0-2l-.75-.75a1.4 1.4 0 0 0-2 0L5.75 14.5 5 19Z"
                    stroke="currentColor"
                    stroke-width="1.7"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </button>

              <button
                type="button"
                class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                title="Eliminar geocerca"
                aria-label="Eliminar geocerca"
                @click.stop="$emit('delete-geofence', geofence)"
              >
                <svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" aria-hidden="true">
                  <path
                    d="M5 7h14M9 7V4.75h6V7M8.5 10.5v6M12 10.5v6M15.5 10.5v6M6.5 7l.75 13h9.5l.75-13"
                    stroke="currentColor"
                    stroke-width="1.7"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </article>
      </div>
    </section>
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
  useGeofenceLocationAddress: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits([
  "select-geofence",
  "edit-geofence",
  "delete-geofence",
  "update:use-geofence-location-address",
])

const getGeofenceRenderKey = (geofence, index) => {
  const coordinatesKey = Array.isArray(geofence?.coordinates)
    ? geofence.coordinates
        .map((point) => {
          return `${point?.lat ?? ""},${point?.lng ?? ""}`
        })
        .join("|")
    : `${geofence?.center?.lat ?? ""},${geofence?.center?.lng ?? ""},${geofence?.radius ?? ""}`

  return [
    normalizeId(geofence?.id) || "geofence",
    geofence?.companyId || "",
    geofence?.type || "",
    coordinatesKey,
    index,
  ].join("::")
}
</script>
