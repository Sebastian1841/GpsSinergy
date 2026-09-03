<template>
  <article class="rounded-xl border border-[#dfe5ed] bg-white p-4 shadow-sm">
    <div class="flex items-center justify-between gap-3">
      <h2 class="text-[15px] font-black text-[#102372]">Proximas ordenes</h2>
      <span class="text-[10px] font-black text-blue-600">Ver todas</span>
    </div>

    <div class="mt-4 space-y-3">
      <div
        v-for="order in orders"
        :key="order.id"
        class="grid grid-cols-[44px_minmax(0,1fr)_auto] gap-3 rounded-lg border border-[#edf1f5] p-3"
      >
        <div class="text-center">
          <span class="block text-[18px] font-black leading-none text-blue-600">
            {{ order.day }}
          </span>
          <span class="mt-0.5 block text-[10px] font-black uppercase text-slate-400">
            {{ order.month }}
          </span>
        </div>

        <div class="min-w-0">
          <p class="truncate text-[12px] font-black text-[#102372]">
            {{ order.plate }}
          </p>
          <p class="mt-0.5 truncate text-[10px] font-bold text-slate-500">
            {{ order.job }}
          </p>
        </div>

        <span class="text-[10px] font-black text-slate-500">
          {{ order.time }}
        </span>
      </div>
    </div>
  </article>
</template>

<script setup>
defineProps({
  orders: {
    type: Array,
    default: () => [],
  },
})
</script>
