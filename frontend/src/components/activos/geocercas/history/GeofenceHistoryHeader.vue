<template>
  <header
    class="shrink-0 touch-none cursor-move border-b border-slate-200 bg-white"
    @pointerdown="$emit('start-drag', $event)"
    @dblclick="$emit('reset-frame')"
  >
    <div class="flex h-1">
      <div class="w-2/3 bg-[#102372]"></div>
      <div class="w-1/3 bg-[#FF6600]"></div>
    </div>

    <div class="flex items-start justify-between gap-4 px-4 py-4 sm:px-5">
      <div class="min-w-0">
        <p class="text-[10px] font-black uppercase tracking-[0.18em] text-[#102372]">
          Historial de geocerca
        </p>

        <h2 class="mt-1 truncate text-[18px] font-black leading-tight text-slate-900">
          {{ modalTitle }}
        </h2>

        <p class="mt-1 max-w-[720px] text-[11px] font-semibold leading-relaxed text-slate-500">
          {{ modalDescription }}
        </p>
      </div>

      <button
        type="button"
        class="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-lg text-[20px] font-black text-slate-400 transition hover:bg-slate-100 hover:text-[#102372]"
        @pointerdown.stop
        @click.stop="$emit('close')"
      >
        &times;
      </button>
    </div>
  </header>
</template>

<script setup>
defineProps({
  modalTitle: {
    type: String,
    required: true,
  },
  modalDescription: {
    type: String,
    required: true,
  },
})

defineEmits(["close", "reset-frame", "start-drag"])
</script>
