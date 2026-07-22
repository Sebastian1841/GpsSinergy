<template>
  <section>
    <div class="flex items-center justify-between gap-3">
      <p class="text-[10px] font-black uppercase tracking-[0.12em] text-[#ff6600]">Activacion</p>

      <span class="rounded-md bg-[#eef2f7] px-2 py-1 text-[10px] font-black text-[#102372]">
        {{ activationScopeLabel }}
      </span>
    </div>

    <div class="mt-3 rounded-lg border border-[#edf1f5] bg-[#f8fafc] p-2">
      <div class="grid grid-cols-2 gap-2">
        <button
          type="button"
          class="h-9 rounded-lg border px-3 text-[10px] font-black uppercase tracking-[0.06em] transition disabled:cursor-not-allowed disabled:opacity-40"
          :class="
            draft.activation.mode === 'immediate'
              ? 'border-[#102372] bg-[#102372] text-white'
              : 'border-[#d8dee8] bg-white text-[#102372] hover:border-[#ff6600] hover:text-[#ff6600]'
          "
          :disabled="draft.id === 'all'"
          @click="emit('update-activation-field', 'mode', 'immediate')"
        >
          Evento inmediato
        </button>

        <button
          type="button"
          class="h-9 rounded-lg border px-3 text-[10px] font-black uppercase tracking-[0.06em] transition disabled:cursor-not-allowed disabled:opacity-40"
          :class="
            draft.activation.mode === 'delayed'
              ? 'border-[#ff6600] bg-[#ff6600] text-white'
              : 'border-[#d8dee8] bg-white text-[#102372] hover:border-[#ff6600] hover:text-[#ff6600]'
          "
          :disabled="draft.id === 'all'"
          @click="emit('update-activation-field', 'mode', 'delayed')"
        >
          Evento retrasado
        </button>
      </div>

      <div
        v-if="draft.activation.mode === 'delayed'"
        class="mt-3 grid gap-3 lg:grid-cols-[180px_minmax(0,1fr)] lg:items-end"
      >
        <label>
          <span class="text-[10px] font-black uppercase text-slate-400"> Retraso minimo </span>

          <div class="mt-1 flex items-center gap-2">
            <input
              :value="draft.activation.delayMinutes"
              type="number"
              min="1"
              step="1"
              class="h-9 w-full rounded-lg border border-[#d8dee8] bg-white px-2 text-[11px] font-bold text-[#102372] outline-none focus:border-[#ff6600]"
              :disabled="draft.id === 'all'"
              @input="emit('update-activation-field', 'delayMinutes', $event.target.value)"
            />

            <span class="text-[10px] font-black text-slate-400">min</span>
          </div>
        </label>

        <label
          class="flex min-h-9 items-center gap-2 rounded-lg border border-[#edf1f5] bg-white px-3 py-2"
        >
          <input
            type="checkbox"
            class="h-3.5 w-3.5 accent-[#ff6600]"
            :checked="draft.activation.autoExecuteAfterDelay"
            :disabled="draft.id === 'all'"
            @change="
              emit('update-activation-field', 'autoExecuteAfterDelay', $event.target.checked)
            "
          />

          <span class="text-[11px] font-bold text-[#102372]">
            Ejecutar automaticamente despues del retraso
          </span>
        </label>
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  draft: {
    type: Object,
    required: true,
  },
  activationScopeLabel: {
    type: String,
    default: "",
  },
})

const emit = defineEmits(["update-activation-field"])
</script>
