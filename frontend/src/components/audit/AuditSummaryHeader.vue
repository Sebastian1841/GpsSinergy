<template>
  <header
    class="flex shrink-0 flex-col gap-4 border-b border-slate-200 pb-4 lg:flex-row lg:items-center lg:justify-between"
  >
    <div class="min-w-0">
      <h1 class="truncate text-xl font-bold tracking-tight text-[#102372]">Auditoria</h1>

      <p v-if="currentCompany" class="mt-0.5 truncate text-[11px] font-medium text-slate-400">
        {{ currentCompany.name }}
      </p>
    </div>

    <div class="flex flex-wrap items-center gap-x-6 gap-y-3">
      <div
        v-for="(metric, index) in summaryMetrics"
        :key="metric.label"
        class="flex items-center gap-6"
      >
        <div>
          <div class="flex items-center gap-1.5">
            <span
              v-if="metric.label !== 'Total'"
              class="h-1.5 w-1.5 rounded-full"
              :class="getMetricDotClass(metric.label)"
            ></span>

            <p class="text-[10px] font-medium text-slate-500">
              {{ metric.label }}
            </p>
          </div>

          <p class="mt-0.5 text-base font-bold leading-none text-[#102372]">
            {{ metric.value }}
          </p>
        </div>

        <span
          v-if="index < summaryMetrics.length - 1"
          class="hidden h-8 w-px bg-slate-200 sm:block"
        ></span>
      </div>
    </div>
  </header>
</template>

<script setup>
defineProps({
  currentCompany: {
    type: Object,
    default: null,
  },
  getMetricDotClass: {
    type: Function,
    required: true,
  },
  summaryMetrics: {
    type: Array,
    default: () => [],
  },
})
</script>
