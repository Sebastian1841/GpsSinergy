<template>
  <div class="absolute left-3 top-3 z-[500] flex flex-col overflow-hidden rounded-xl border border-[#d8dee8] bg-white shadow-lg">
    <button
      type="button"
      title="Crear geocerca circular"
      class="flex h-9 w-9 cursor-pointer items-center justify-center border-b border-[#edf0f5] text-[16px] font-black transition"
      :class="drawMode === 'circle'
        ? 'bg-[#FF6600] text-white'
        : 'bg-white text-[#102372] hover:bg-[#eef3ff]'"
      @click="$emit('start-circle')"
    >
      ◯
    </button>

    <button
      type="button"
      title="Crear geocerca poligonal"
      class="flex h-9 w-9 cursor-pointer items-center justify-center border-b border-[#edf0f5] text-[15px] font-black transition"
      :class="drawMode === 'polygon'
        ? 'bg-[#FF6600] text-white'
        : 'bg-white text-[#102372] hover:bg-[#eef3ff]'"
      @click="$emit('start-polygon')"
    >
      ⬠
    </button>

    <button
      v-if="drawMode === 'polygon'"
      type="button"
      title="Guardar polígono"
      class="flex h-9 w-9 items-center justify-center border-b border-[#edf0f5] text-[15px] font-black transition"
      :class="canSavePolygon
        ? 'cursor-pointer bg-[#102372] text-white hover:bg-[#0c1b59]'
        : 'cursor-not-allowed bg-slate-100 text-slate-400'"
      :disabled="!canSavePolygon"
      @click="$emit('save-polygon')"
    >
      ✓
    </button>

    <button
      v-if="drawMode === 'polygon'"
      type="button"
      title="Deshacer último punto"
      class="flex h-9 w-9 cursor-pointer items-center justify-center border-b border-[#edf0f5] text-[15px] font-black text-[#102372] transition hover:bg-[#eef3ff]"
      :class="!canUndoPolygon ? 'cursor-not-allowed opacity-40' : ''"
      :disabled="!canUndoPolygon"
      @click="$emit('undo-polygon')"
    >
      ↶
    </button>

    <button
      v-if="drawMode || isEditing"
      type="button"
      title="Cancelar"
      class="flex h-9 w-9 cursor-pointer items-center justify-center text-[17px] font-black text-red-600 transition hover:bg-red-50"
      @click="$emit('cancel')"
    >
      ×
    </button>
  </div>
</template>

<script setup>
defineProps({
  drawMode: {
    type: String,
    default: null,
  },
  canSavePolygon: {
    type: Boolean,
    default: false,
  },
  canUndoPolygon: {
    type: Boolean,
    default: false,
  },
  isEditing: {
    type: Boolean,
    default: false,
  },
})

defineEmits([
  "start-circle",
  "start-polygon",
  "save-polygon",
  "undo-polygon",
  "cancel",
])
</script>