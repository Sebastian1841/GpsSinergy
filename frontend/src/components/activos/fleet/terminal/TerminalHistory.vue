<template>
  <div
    ref="bodyRef"
    class="min-h-0 flex-1 overflow-auto bg-[#fbfcfe] font-mono text-[11px]"
    @click="$emit('focus-input')"
  >
    <div
      v-if="!logs.length"
      class="flex h-full min-h-[280px] items-center justify-center"
    >
      <div class="rounded-xl border border-dashed border-[#cbd5e1] bg-white px-6 py-6 text-center">
        <p class="text-sm font-black text-[#102372]">
          Consola sin actividad
        </p>

        <p class="mt-1 text-xs font-semibold text-slate-500">
          Escribe un comando para iniciar la comunicación con el rastreador.
        </p>
      </div>
    </div>

    <div
      v-else
      class="min-w-[900px]"
    >
      <div class="sticky top-0 z-10 grid grid-cols-[72px_76px_70px_minmax(0,1fr)] border-b border-[#d8dee8] bg-[#eef3ff] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.08em] text-[#102372]">
        <span>Hora</span>
        <span>Fecha</span>
        <span>Tipo</span>
        <span>Dato recibido</span>
      </div>

      <div
        v-for="log in logs"
        :key="log.id"
        class="grid grid-cols-[72px_76px_70px_minmax(0,1fr)] border-b border-[#edf1f5] px-3 py-1.5 leading-[17px] transition hover:bg-white"
      >
        <span class="font-bold text-slate-500">
          {{ log.time }}
        </span>

        <span class="font-semibold text-slate-400">
          {{ log.date }}
        </span>

        <span
          class="w-fit rounded px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.04em]"
          :class="log.badgeClass"
        >
          {{ log.source }}
        </span>

        <div class="min-w-0">
          <template v-if="log.reportItems?.length">
            <div class="flex flex-wrap gap-1">
              <span
                v-for="item in log.reportItems"
                :key="`${log.id}-${item.label}`"
                class="inline-flex max-w-full items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-black leading-4"
                :class="item.className"
              >
                <span class="opacity-70">{{ item.label }}:</span>
                <span class="truncate">{{ item.value }}</span>
              </span>
            </div>
          </template>

          <template v-else>
            <span
              class="whitespace-pre-wrap break-words font-semibold"
              :class="log.textClass"
            >
              <span
                v-if="log.type === 'client'"
                class="mr-1 font-black text-[#FF6600]"
              >
                &gt;
              </span>

              {{ log.message }}
            </span>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue"

defineProps({
  logs: {
    type: Array,
    default: () => [],
  },
})

defineEmits([
  "focus-input",
])

const bodyRef = ref(null)

const scrollToBottom = () => {
  if (!bodyRef.value) return

  bodyRef.value.scrollTop = bodyRef.value.scrollHeight
}

defineExpose({
  scrollToBottom,
})
</script>