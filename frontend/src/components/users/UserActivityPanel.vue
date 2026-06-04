<template>
  <aside class="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#d8dee8] bg-white">
    <div class="border-b border-[#edf1f5] bg-[#f8fafc] px-4 py-3">
      <div class="flex items-center justify-between gap-3">
        <div class="min-w-0">
          <h3 class="text-[13px] font-black text-[#102372]">Actividad reciente</h3>
          <p class="mt-0.5 text-[10px] font-semibold text-slate-500">
            Últimos eventos del usuario.
          </p>
        </div>

        <span
          class="rounded-full bg-white px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-slate-400"
        >
          Auditoría
        </span>
      </div>
    </div>

    <div class="min-h-0 flex-1 overflow-auto p-3">
      <div
        v-for="event in events"
        :key="event.id"
        class="mb-2 rounded-xl border border-[#edf1f5] bg-white px-3 py-2 shadow-sm last:mb-0"
      >
        <div class="flex gap-2">
          <span class="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#ff6600]"></span>

          <div class="min-w-0">
            <p class="text-[11px] font-black text-[#172033]">{{ event.title }}</p>
            <p class="mt-0.5 text-[10px] font-semibold text-slate-500">{{ event.detail }}</p>
            <p class="mt-2 text-[9px] font-black uppercase tracking-[0.12em] text-[#ff6600]">
              {{ event.time }}
            </p>
          </div>
        </div>
      </div>

      <div
        v-if="!events.length"
        class="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-4 text-center"
      >
        <p class="text-[12px] font-black text-[#102372]">Sin actividad</p>
        <p class="mt-1 text-[10px] font-semibold text-slate-500">
          Los eventos del usuario aparecerán aquí.
        </p>
      </div>
    </div>
  </aside>
</template>

<script setup>
defineProps({
  events: {
    type: Array,
    default: () => [],
  },
})
</script>
