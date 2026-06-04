<template>
  <section class="overflow-hidden rounded-lg border border-[#d9d9d9] bg-white">
    <header class="border-b border-[#d9d9d9] bg-[#102372] px-3 py-3">
      <div class="flex items-center justify-between gap-3">
        <div class="min-w-0">
          <h3 class="text-[13px] font-black text-white">Reportes disponibles</h3>
          <p class="mt-0.5 text-[10px] font-black text-white/60">
            {{ enabledReportsCount }} de {{ reportTypes.length }} habilitados
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
          <label
            v-for="reportType in group.items"
            :key="reportType.id"
            class="grid cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-3 transition hover:bg-[#eef2f7]"
          >
            <span class="min-w-0">
              <span class="block truncate text-[12px] font-black text-[#102372]">
                {{ reportType.name }}
              </span>
              <span class="mt-0.5 block truncate text-[10px] font-semibold text-[#102372]/60">
                {{ reportType.description }}
              </span>
            </span>

            <span
              class="flex h-6 w-11 items-center rounded-full p-1 transition"
              :class="
                getReportAccess(reportType.id)?.enabled
                  ? 'bg-[#FF6600]'
                  : 'bg-[#eef2f7] ring-1 ring-[#102372]/30'
              "
            >
              <span
                class="h-4 w-4 rounded-full bg-white shadow-sm transition"
                :class="getReportAccess(reportType.id)?.enabled ? 'translate-x-5' : 'translate-x-0'"
              ></span>
              <input
                type="checkbox"
                class="sr-only"
                :checked="getReportAccess(reportType.id)?.enabled"
                @change="$emit('toggle-report', reportType.id)"
              />
            </span>
          </label>
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

defineEmits(["toggle-report"])

const getReportAccess = (reportId) => {
  return props.company.reports?.find((reportAccess) => reportAccess.reportId === reportId)
}

const enabledReportsCount = computed(() => {
  return (props.company.reports || []).filter((reportAccess) => reportAccess.enabled).length
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
