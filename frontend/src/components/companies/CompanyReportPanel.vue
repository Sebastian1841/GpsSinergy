<template>
  <section class="overflow-hidden rounded-lg border border-[#d9d9d9] bg-white">
    <header class="border-b border-[#d9d9d9] bg-[#102372] px-3 py-3">
      <div class="flex items-center justify-between gap-3">
        <div class="min-w-0">
          <h3 class="text-[13px] font-black text-white">Reportes base</h3>
          <p class="mt-0.5 text-[10px] font-black text-white/60">
            {{ reportTypes.length }} incluidos para todas las empresas
          </p>
        </div>
      </div>
    </header>

    <div class="grid gap-0 divide-y divide-[#d9d9d9]">
      <section v-for="group in groupedReportTypes" :key="group.category">
        <div class="bg-[#fff3eb] px-3 py-2">
          <p class="text-[10px] font-black uppercase text-[#FF6600]">
            {{ group.category }}
          </p>
        </div>

        <div class="grid divide-y divide-[#d9d9d9]">
          <div
            v-for="reportType in group.items"
            :key="reportType.id"
            class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-3 transition hover:bg-[#eef2f7]"
          >
            <span class="min-w-0">
              <span class="block truncate text-[12px] font-black text-[#102372]">
                {{ reportType.name }}
              </span>
              <span class="mt-0.5 block truncate text-[10px] font-semibold text-[#102372]/60">
                {{ reportType.description }}
              </span>
            </span>

            <span class="rounded-md bg-[#fff3eb] px-2 py-1 text-[8px] font-black text-[#FF6600]">
              Incluido
            </span>
          </div>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup>
import { computed } from "vue"

const props = defineProps({
  company: {
    type: Object,
    required: true,
  },
  reportTypes: {
    type: Array,
    default: () => [],
  },
})

const groupedReportTypes = computed(() => {
  const groups = new Map()

  props.reportTypes.forEach((reportType) => {
    const category = reportType.category || "Otros"

    if (!groups.has(category)) {
      groups.set(category, [])
    }

    groups.get(category).push(reportType)
  })

  return Array.from(groups, ([category, items]) => ({ category, items }))
})
</script>
