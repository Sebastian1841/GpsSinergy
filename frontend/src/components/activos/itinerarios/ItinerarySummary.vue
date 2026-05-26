<template>
  <section class="grid grid-cols-2 gap-2 lg:grid-cols-4">
    <article
      v-for="item in summaryItems"
      :key="item.label"
      class="rounded-xl border border-[#d8dee8] bg-white p-3 shadow-sm"
    >
      <div class="flex items-center justify-between gap-2">
        <p class="truncate text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">
          {{ item.label }}
        </p>

        <span class="h-2.5 w-2.5 rounded-full" :class="item.dot"></span>
      </div>

      <p class="mt-2 truncate text-[20px] font-black leading-none" :class="item.valueClass">
        {{ item.value }}
      </p>

      <p class="mt-1 truncate text-[10px] font-semibold text-slate-500">
        {{ item.footer }}
      </p>
    </article>
  </section>
</template>

<script setup>
import { computed } from "vue"

const props = defineProps({
  summary: {
    type: Object,
    default: null,
  },
})

const summaryItems = computed(() => {
  const summary = props.summary || {}

  return [
    {
      label: "Distancia",
      value: summary.distanceLabel || "0 km",
      footer: "recorrido calculado",
      dot: "bg-[#102372]",
      valueClass: "text-[#102372]",
    },
    {
      label: "Movimiento",
      value: summary.movingLabel || "0 min",
      footer: "tiempo operativo",
      dot: "bg-emerald-500",
      valueClass: "text-emerald-600",
    },
    {
      label: "Detenido",
      value: summary.stoppedLabel || "0 min",
      footer: `${summary.stopsCount || 0} paradas`,
      dot: "bg-[#FF6600]",
      valueClass: "text-[#FF6600]",
    },
    {
      label: "Vel. promedio",
      value: summary.averageSpeedLabel || "0 km/h",
      footer: "solo en movimiento",
      dot: "bg-sky-500",
      valueClass: "text-sky-600",
    },
  ]
})
</script>
