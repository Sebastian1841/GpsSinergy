<template>
  <section>
    <div class="flex items-center justify-between gap-3">
      <p class="text-[10px] font-black uppercase tracking-[0.12em] text-[#ff6600]">Expresiones</p>

      <select
        :value="selectedExpressionType"
        class="h-9 rounded-lg border border-[#d8dee8] bg-white px-3 text-[10px] font-black uppercase tracking-[0.04em] text-[#102372] outline-none transition hover:border-[#ff6600] focus:border-[#ff6600] disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="draft.id === 'all'"
        @change="emit('add-expression', $event.target.value)"
      >
        <option value="" disabled>Anadir expresion</option>

        <option
          v-for="expression in expressionOptions"
          :key="expression.id"
          :value="expression.id"
          :disabled="isExpressionOptionDisabled(expression.id)"
        >
          {{ expression.label }}
        </option>
      </select>
    </div>

    <div v-if="draft.id === 'all'" class="mt-3 rounded-lg bg-[#eef2f7] px-3 py-2">
      <p class="text-[11px] font-bold text-slate-500">
        Esta regla incluye todos los datos disponibles.
      </p>
    </div>

    <div v-else class="mt-3 grid gap-2">
      <div v-for="(condition, index) in draft.conditions" :key="condition._uiId">
        <div
          v-if="condition.expressionType === 'script'"
          class="overflow-hidden rounded-xl border border-[#243767] bg-[#091329] shadow-[0_10px_30px_rgba(15,35,80,0.16)]"
        >
          <header
            class="flex h-9 items-center justify-between border-b border-white/10 bg-[#102372] px-3"
          >
            <div class="flex items-center gap-2">
              <span class="h-2 w-2 rounded-full bg-[#ff6600]"></span>

              <p class="font-mono text-[10px] font-black uppercase tracking-[0.12em] text-white">
                Consola de script
              </p>
            </div>

            <span
              class="rounded-md border border-white/10 bg-white/5 px-2 py-1 font-mono text-[8px] font-bold uppercase tracking-[0.08em] text-slate-300"
            >
              Expresión {{ index + 1 }}
            </span>
          </header>

          <div
            class="bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:18px_18px] p-3"
          >
            <ReportEventRuleScriptConsole
              :condition="condition"
              :index="index"
              :get-expression-label="getExpressionLabel"
              :get-field-options-for-condition="getFieldOptionsForCondition"
              :get-operator-options-for-condition="getOperatorOptionsForCondition"
              :operator-needs-value="operatorNeedsValue"
              @remove-condition="handleRemoveCondition"
              @update-condition="handleUpdateCondition"
            />
          </div>
        </div>

        <ReportEventRuleExpressionCard
          v-else
          :condition="condition"
          :index="index"
          :get-expression-label="getExpressionLabel"
          :get-field-options-for-condition="getFieldOptionsForCondition"
          :get-operator-options-for-condition="getOperatorOptionsForCondition"
          :is-digital-expression="isDigitalExpression"
          :operator-needs-value="operatorNeedsValue"
          @remove-condition="handleRemoveCondition"
          @update-condition="handleUpdateCondition"
        />
      </div>

      <div v-if="!draft.conditions.length" class="rounded-lg bg-[#eef2f7] px-3 py-2">
        <p class="text-[11px] font-bold text-slate-500">Sin expresiones configuradas.</p>
      </div>
    </div>
  </section>
</template>

<script setup>
import ReportEventRuleExpressionCard from "./ReportEventRuleExpressionCard.vue"
import ReportEventRuleScriptConsole from "./ReportEventRuleScriptConsole.vue"

defineProps({
  draft: {
    type: Object,
    required: true,
  },
  selectedExpressionType: {
    type: String,
    default: "",
  },
  expressionOptions: {
    type: Array,
    default: () => [],
  },
  isExpressionOptionDisabled: {
    type: Function,
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

const emit = defineEmits(["add-expression", "remove-condition", "update-condition"])

const handleRemoveCondition = (index) => {
  emit("remove-condition", index)
}

const handleUpdateCondition = (index, field, value) => {
  emit("update-condition", index, field, value)
}
</script>
