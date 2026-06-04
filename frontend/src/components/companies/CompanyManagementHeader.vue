<template>
  <header class="shrink-0 border-b border-[#d8dee8] bg-white px-4 py-3">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div class="min-w-0">
        <h1 class="text-[18px] font-black leading-tight text-[#102372]">Empresas</h1>
        <p class="mt-0.5 text-[11px] font-semibold text-slate-500">
          {{ summaryText }}
        </p>
      </div>

      <button
        type="button"
        class="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#102372] px-4 text-[11px] font-black text-white transition hover:bg-[#0c1b59] active:scale-[0.98]"
        @click="$emit('create-company')"
      >
        <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" aria-hidden="true">
          <path
            d="M12 5v14M5 12h14"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
          />
        </svg>

        Nueva empresa
      </button>
    </div>
  </header>
</template>

<script setup>
import { computed } from "vue"

const props = defineProps({
  summaryItems: {
    type: Array,
    default: () => [],
  },
})

defineEmits(["create-company"])

const summaryText = computed(() => {
  const companies = props.summaryItems.find((item) => item.key === "all")?.value ?? 0
  const assets = props.summaryItems.find((item) => item.key === "assets")?.value ?? 0

  return `${companies} empresas - ${assets} activos totales`
})
</script>
