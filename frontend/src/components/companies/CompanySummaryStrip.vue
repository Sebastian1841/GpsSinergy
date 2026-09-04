<template>
  <section
    class="grid overflow-hidden rounded-xl border border-[#dfe5ed] bg-white sm:grid-cols-2 lg:grid-cols-4"
  >
    <article
      v-for="(item, index) in summaryCards"
      :key="item.key"
      class="flex min-h-[82px] items-center px-5 py-4"
      :class="{
        'border-b border-[#edf1f5] sm:border-b-0': index < 2,
        'sm:border-l sm:border-[#edf1f5]': index % 2 !== 0,
        'lg:border-l lg:border-[#edf1f5]': index > 0,
      }"
    >
      <div class="min-w-0">
        <p class="text-[23px] font-black leading-none text-[#102372]">
          {{ item.value }}
        </p>

        <p class="mt-1 text-[12px] font-black leading-tight text-[#102372]">
          {{ item.label }}
        </p>

        <p class="mt-0.5 text-[10px] font-semibold text-slate-500">
          {{ item.description }}
        </p>
      </div>
    </article>
  </section>
</template>

<script setup>
import { computed } from "vue"

const props = defineProps({
  summaryItems: {
    type: Array,
    default: () => [],
  },
})

const summaryByKey = computed(() => {
  return new Map(
    props.summaryItems.map((item) => {
      return [item.key, item]
    }),
  )
})

const getSummaryValue = (key) => {
  return Number(summaryByKey.value.get(key)?.value) || 0
}

const getPercentage = (value, total) => {
  if (!total) return 0

  return Math.round((value / total) * 100)
}

const summaryCards = computed(() => {
  const total = getSummaryValue("all")
  const active = getSummaryValue("active")
  const pending = getSummaryValue("pending")
  const inactive = getSummaryValue("inactive") + getSummaryValue("internal")

  return [
    {
      key: "all",
      label: "Empresas",
      value: total,
      description: "Registradas en la plataforma",
    },
    {
      key: "active",
      label: "Activas",
      value: active,
      description: `${getPercentage(active, total)}% del total`,
    },
    {
      key: "pending",
      label: "Suspendidas",
      value: pending,
      description: `${getPercentage(pending, total)}% del total`,
    },
    {
      key: "inactive",
      label: "Inactivas",
      value: inactive,
      description: `${getPercentage(inactive, total)}% del total`,
    },
  ]
})
</script>
