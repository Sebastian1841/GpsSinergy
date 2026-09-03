<template>
  <header class="shrink-0">
    <div class="flex flex-wrap items-center gap-2.5">
      <button
        v-for="metric in displayedMetrics"
        :key="metric.key"
        type="button"
        class="group inline-flex h-9 items-center gap-2 rounded-full border px-3.5 transition"
        :class="getMetricContainerClass(metric.key)"
        :aria-pressed="activeMetricKey === metric.key"
        @click="emit('select-metric', metric.key)"
      >
        <span
          class="h-2 w-2 shrink-0 rounded-full"
          :class="getMetricAccentClass(metric.key)"
        ></span>

        <span class="text-[13px] font-black">
          {{ metric.value }}
        </span>

        <span class="text-[12px] font-semibold opacity-75">
          {{ getMetricLabel(metric) }}
        </span>
      </button>
    </div>
  </header>
</template>

<script setup>
import { computed } from "vue"

const props = defineProps({
  activeMetricKey: {
    type: String,
    default: "all",
  },
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

const emit = defineEmits(["select-metric"])

const displayedMetrics = computed(() => {
  const allowedKeys = ["all", "warning", "failed"]

  return allowedKeys
    .map((key) => {
      return props.summaryMetrics.find((metric) => metric.key === key)
    })
    .filter(Boolean)
})

const getMetricLabel = (metric) => {
  if (metric.key === "all") {
    return Number(metric.value) === 1 ? "evento" : "eventos"
  }

  if (metric.key === "warning") {
    return Number(metric.value) === 1 ? "alerta" : "alertas"
  }

  if (metric.key === "failed") {
    return Number(metric.value) === 1 ? "fallido" : "fallidos"
  }

  return metric.label
}

const getMetricAccentClass = (metricKey) => {
  if (metricKey === "warning") {
    return "bg-[#ff6600]"
  }

  if (metricKey === "failed") {
    return "bg-rose-500"
  }

  return "bg-[#102372]"
}

const getMetricContainerClass = (metricKey) => {
  const isActive = props.activeMetricKey === metricKey

  if (metricKey === "warning") {
    return isActive
      ? "border-orange-200 bg-orange-50 text-[#d95700]"
      : "border-orange-100 bg-orange-50/50 text-[#d95700] hover:border-orange-200 hover:bg-orange-50"
  }

  if (metricKey === "failed") {
    return isActive
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : "border-rose-100 bg-rose-50/50 text-rose-700 hover:border-rose-200 hover:bg-rose-50"
  }

  return isActive
    ? "border-[#cbd4f4] bg-[#f1f4ff] text-[#102372]"
    : "border-[#dfe5ef] bg-white text-[#102372] hover:border-[#cbd4f4] hover:bg-[#f7f9ff]"
}
</script>
