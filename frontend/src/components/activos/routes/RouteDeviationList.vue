<template>
  <div class="grid gap-2">
    <article
      v-for="deviation in deviations"
      :key="deviation.id"
      class="rounded-lg bg-white p-3 shadow-[0_1px_3px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <p class="text-[11px] font-black text-[#102372]">{{ deviation.label }}</p>

            <span
              class="rounded-md px-2 py-0.5 text-[8px] font-black uppercase"
              :class="severityClass(deviation.severity)"
            >
              {{ severityLabel(deviation.severity) }}
            </span>
          </div>

          <p class="mt-1 text-[10px] font-semibold text-slate-500">
            {{ deviation.startTime }} a {{ deviation.endTime }} / {{ deviation.pointsCount }}
            puntos
          </p>
        </div>

        <div class="shrink-0 text-right">
          <p class="text-[12px] font-black text-[#ff6600]">{{ deviation.maxDistanceLabel }}</p>
          <p class="mt-0.5 text-[9px] font-bold text-slate-400">{{ deviation.durationLabel }}</p>
        </div>
      </div>
    </article>

    <div
      v-if="!deviations.length"
      class="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-center"
    >
      <p class="text-[11px] font-black text-[#102372]">Sin desvios detectados</p>
      <p class="mt-1 text-[10px] font-semibold text-slate-500">
        La ruta real se mantiene dentro de la tolerancia configurada.
      </p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  deviations: {
    type: Array,
    default: () => [],
  },
})

const severityLabel = (severity) => {
  if (severity === "critical") return "Critico"
  if (severity === "warning") return "Medio"

  return "Leve"
}

const severityClass = (severity) => {
  if (severity === "critical") return "bg-red-50 text-red-700"
  if (severity === "warning") return "bg-[#fff3eb] text-[#ff6600]"

  return "bg-emerald-50 text-emerald-700"
}
</script>
