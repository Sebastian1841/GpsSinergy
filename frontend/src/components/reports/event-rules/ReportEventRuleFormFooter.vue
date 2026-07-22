<template>
  <footer class="shrink-0 border-t border-slate-200/80 bg-white px-3 py-3">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex gap-2">
        <button
          type="button"
          class="h-9 rounded-lg border border-[#d8dee8] bg-white px-4 text-[10px] font-black uppercase tracking-[0.08em] text-slate-500 transition hover:border-[#ff6600] hover:text-[#ff6600]"
          @click="emit('close')"
        >
          Cerrar
        </button>

        <button
          v-if="draft.source === 'custom' && draft.id"
          type="button"
          class="h-9 rounded-lg border border-red-200 bg-white px-4 text-[10px] font-black uppercase tracking-[0.08em] text-red-600 transition hover:bg-red-50"
          @click="emit('delete')"
        >
          Eliminar
        </button>
      </div>

      <button
        type="button"
        class="h-9 rounded-lg bg-[#ff6600] px-4 text-[10px] font-black uppercase tracking-[0.08em] text-white transition hover:bg-[#e65c00] disabled:cursor-not-allowed disabled:bg-slate-300"
        :disabled="!canSaveDraft"
        @click="emit('save')"
      >
        Guardar regla
      </button>
    </div>
  </footer>
</template>

<script setup>
defineProps({
  draft: {
    type: Object,
    required: true,
  },
  canSaveDraft: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(["close", "delete", "save"])
</script>
