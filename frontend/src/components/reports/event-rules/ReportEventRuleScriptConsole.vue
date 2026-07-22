<template>
  <div class="overflow-hidden rounded-lg border border-[#111827] bg-[#0f172a] shadow-sm">
    <div
      class="flex items-center justify-between gap-2 border-b border-white/10 bg-[#111827] px-3 py-2"
    >
      <div class="flex min-w-0 items-center gap-2">
        <span class="flex shrink-0 items-center gap-1.5" aria-hidden="true">
          <span class="h-2.5 w-2.5 rounded-full bg-[#ef4444]"></span>
          <span class="h-2.5 w-2.5 rounded-full bg-[#f59e0b]"></span>
          <span class="h-2.5 w-2.5 rounded-full bg-[#22c55e]"></span>
        </span>

        <span
          class="truncate font-mono text-[10px] font-black uppercase tracking-[0.14em] text-slate-200"
        >
          Script console
        </span>
      </div>

      <button
        type="button"
        class="h-7 rounded-md border border-white/10 bg-white/[0.04] px-2.5 text-[9px] font-black uppercase tracking-[0.06em] text-slate-300 transition hover:border-red-300/60 hover:text-red-200"
        @click="emit('remove-condition', index)"
      >
        Quitar
      </button>
    </div>

    <div class="grid gap-2 border-b border-white/10 px-3 py-2 md:grid-cols-[minmax(0,1fr)_180px]">
      <div class="flex min-w-0 items-center gap-2">
        <span
          class="rounded bg-white/[0.07] px-2 py-1 font-mono text-[10px] font-bold text-slate-300"
        >
          field
        </span>

        <span class="min-w-0 truncate font-mono text-[11px] font-bold text-[#93c5fd]">
          {{ scriptFieldLabel }}
        </span>
      </div>

      <select
        :value="condition.operator"
        class="h-8 rounded-md border border-white/10 bg-[#020617] px-2 font-mono text-[10px] font-bold text-slate-100 outline-none transition focus:border-[#ff6600]"
        @change="emit('update-condition', index, 'operator', $event.target.value)"
      >
        <option
          v-for="operator in getOperatorOptionsForCondition(condition)"
          :key="operator.id"
          :value="operator.id"
        >
          {{ operator.label }}
        </option>
      </select>
    </div>

    <div class="grid min-h-[150px] grid-cols-[42px_minmax(0,1fr)] bg-[#020617]">
      <div
        class="select-none border-r border-white/10 bg-white/[0.03] px-2 py-3 text-right font-mono text-[11px] leading-6 text-slate-500"
        aria-hidden="true"
      >
        <div v-for="line in lineNumbers" :key="line">{{ line }}</div>
      </div>

      <textarea
        v-if="operatorNeedsValue(condition.operator)"
        :value="condition.value"
        class="min-h-[150px] resize-y bg-transparent px-3 py-3 font-mono text-[12px] font-semibold leading-6 text-slate-100 outline-none placeholder:text-slate-500"
        spellcheck="false"
        placeholder="// resultado del script"
        @input="emit('update-condition', index, 'value', $event.target.value)"
      ></textarea>

      <div
        v-else
        class="flex min-h-[150px] items-center px-3 py-3 font-mono text-[12px] font-semibold text-slate-500"
      >
        <span>&gt; operador sin valor</span>
      </div>
    </div>

    <div class="flex items-center justify-between gap-2 border-t border-white/10 px-3 py-2">
      <span class="truncate font-mono text-[10px] font-bold text-slate-500">
        {{ statusLabel }}
      </span>

      <span
        class="rounded bg-[#ff6600]/15 px-2 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#fdba74]"
      >
        {{ getExpressionLabel(condition.expressionType) }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue"

const props = defineProps({
  condition: {
    type: Object,
    required: true,
  },
  index: {
    type: Number,
    required: true,
  },
  getExpressionLabel: {
    type: Function,
    required: true,
  },
  getFieldOptionsForCondition: {
    type: Function,
    required: true,
  },
  getOperatorOptionsForCondition: {
    type: Function,
    required: true,
  },
  operatorNeedsValue: {
    type: Function,
    required: true,
  },
})

const emit = defineEmits(["remove-condition", "update-condition"])

const scriptFieldLabel = computed(() => {
  return (
    props.getFieldOptionsForCondition(props.condition).find((field) => {
      return field.id === props.condition.field
    })?.label || "Script"
  )
})

const lineNumbers = computed(() => {
  const text = String(props.condition.value || "")
  const lineCount = Math.max(5, text.split(/\r?\n/).length)

  return Array.from({ length: lineCount }, (_, index) => index + 1)
})

const statusLabel = computed(() => {
  return props.operatorNeedsValue(props.condition.operator)
    ? "stdin: expression.value"
    : "stdin: no value"
})
</script>
