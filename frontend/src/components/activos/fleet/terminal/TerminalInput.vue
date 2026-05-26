<template>
  <form
    class="shrink-0 border-t border-[#d8dee8] bg-white px-3 py-3"
    @submit.prevent="$emit('submit-command')"
  >
    <div class="flex flex-col gap-2 md:flex-row md:items-center">
      <div class="relative min-w-0 flex-1">
        <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm font-black text-[#FF6600]">
          &gt;
        </span>

        <input
          data-terminal-input
          :value="modelValue"
          type="text"
          class="h-10 w-full rounded-lg border border-[#cbd5e1] bg-[#fbfcfe] pl-7 pr-3 font-mono text-xs font-bold text-[#102372] outline-none transition placeholder:text-slate-400 focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          placeholder="Escribe un comando..."
          :disabled="isSending"
          @input="$emit('update:modelValue', $event.target.value)"
        />
      </div>

      <button
        type="submit"
        class="h-10 shrink-0 cursor-pointer rounded-lg border border-[#FF6600] bg-[#FF6600] px-5 text-xs font-black text-white transition hover:bg-[#e85d00] disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-300"
        :disabled="isSending || !modelValue.trim()"
      >
        {{ isSending ? "Enviando" : "Enviar" }}
      </button>
    </div>
  </form>
</template>

<script setup>
defineProps({
  modelValue: {
    type: String,
    default: "",
  },
  isSending: {
    type: Boolean,
    default: false,
  },
})

defineEmits([
  "update:modelValue",
  "submit-command",
])
</script>