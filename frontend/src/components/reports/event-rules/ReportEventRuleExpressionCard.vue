<template>
  <div class="rounded-lg border border-[#edf1f5] bg-[#f8fafc] p-2">
    <div class="mb-2 flex items-center justify-between gap-2">
      <span
        class="min-w-0 truncate rounded-md bg-[#eef3ff] px-2 py-1 text-[10px] font-black text-[#102372]"
      >
        {{ getExpressionLabel(condition.expressionType) }}
      </span>

      <button
        type="button"
        class="h-8 rounded-lg border border-[#d8dee8] bg-white px-3 text-[10px] font-black text-slate-500 transition hover:border-red-300 hover:text-red-600"
        @click="emit('remove-condition', index)"
      >
        Quitar
      </button>
    </div>

    <div class="grid gap-2 md:grid-cols-[minmax(0,1fr)_150px_minmax(120px,0.7fr)] md:items-center">
      <select
        :value="condition.field"
        class="h-9 rounded-lg border border-[#d8dee8] bg-white px-2 text-[11px] font-bold text-[#102372] outline-none focus:border-[#ff6600]"
        @change="emit('update-condition', index, 'field', $event.target.value)"
      >
        <option
          v-for="field in getFieldOptionsForCondition(condition)"
          :key="field.id"
          :value="field.id"
        >
          {{ field.label }}
        </option>
      </select>

      <select
        :value="condition.operator"
        class="h-9 rounded-lg border border-[#d8dee8] bg-white px-2 text-[11px] font-bold text-[#102372] outline-none focus:border-[#ff6600]"
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

      <select
        v-if="isDigitalExpression(condition)"
        :value="condition.value"
        class="h-9 rounded-lg border border-[#d8dee8] bg-white px-2 text-[11px] font-bold text-[#102372] outline-none focus:border-[#ff6600] disabled:bg-[#eef2f7] disabled:text-slate-400"
        :disabled="!operatorNeedsValue(condition.operator)"
        @change="emit('update-condition', index, 'value', $event.target.value)"
      >
        <option value="true">true / 1</option>
        <option value="false">false / 0</option>
      </select>

      <input
        v-else
        :value="condition.value"
        type="text"
        class="h-9 rounded-lg border border-[#d8dee8] bg-white px-2 text-[11px] font-bold text-[#102372] outline-none focus:border-[#ff6600] disabled:bg-[#eef2f7] disabled:text-slate-400"
        :disabled="!operatorNeedsValue(condition.operator)"
        placeholder="Valor"
        @input="emit('update-condition', index, 'value', $event.target.value)"
      />
    </div>
  </div>
</template>

<script setup>
defineProps({
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
  isDigitalExpression: {
    type: Function,
    required: true,
  },
  operatorNeedsValue: {
    type: Function,
    required: true,
  },
})

const emit = defineEmits(["remove-condition", "update-condition"])
</script>
