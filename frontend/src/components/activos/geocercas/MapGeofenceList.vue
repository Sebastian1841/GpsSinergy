<template>
  <div
    v-if="geofences.length"
    class="absolute bottom-3 left-3 z-[500] max-h-[210px] w-[250px] overflow-hidden rounded-xl border border-[#d8dee8] bg-white shadow-lg"
  >
    <div class="flex h-8 items-center justify-between border-b border-[#edf0f5] bg-[#102372] px-3">
      <span class="text-[10px] font-black text-white">
        Geocercas
      </span>

      <span class="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-black text-white">
        {{ geofences.length }}
      </span>
    </div>

    <div class="max-h-[172px] overflow-auto">
      <div
        v-for="geofence in geofences"
        :key="geofence.id"
        class="flex items-center justify-between gap-2 border-b border-[#edf0f5] px-3 py-2 last:border-b-0"
        :class="editingId === geofence.id ? 'bg-[#fff7ed]' : 'bg-white'"
      >
        <button
          type="button"
          class="min-w-0 flex-1 cursor-pointer text-left"
          title="Editar geocerca"
          @click="$emit('edit', geofence.id)"
        >
          <p class="truncate text-[11px] font-black text-[#172033]">
            {{ geofence.name }}
          </p>

          <p class="text-[10px] font-semibold text-slate-500">
            {{ geofence.type === "circle" ? `${geofence.radius} m` : `${geofence.coordinates.length} puntos` }}
          </p>
        </button>

        <button
          type="button"
          class="shrink-0 cursor-pointer rounded-md bg-[#eef3ff] px-2 py-1 text-[10px] font-black text-[#102372] transition hover:bg-[#dbe6ff]"
          @click="$emit('edit', geofence.id)"
        >
          Editar
        </button>

        <button
          type="button"
          class="shrink-0 cursor-pointer rounded-md bg-red-50 px-2 py-1 text-[10px] font-black text-red-600 transition hover:bg-red-100"
          title="Eliminar geocerca"
          @click="$emit('delete', geofence.id)"
        >
          ×
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  geofences: {
    type: Array,
    default: () => [],
  },
  editingId: {
    type: [String, Number],
    default: null,
  },
})

defineEmits(["edit", "delete"])
</script>