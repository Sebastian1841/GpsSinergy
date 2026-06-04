<template>
  <section class="rounded-lg border border-[#d8dee8] bg-white">
    <div class="grid divide-y divide-[#edf1f5] sm:grid-cols-5 sm:divide-x sm:divide-y-0">
      <div class="px-3 py-3">
        <p class="text-[10px] font-black uppercase text-slate-400">Activos</p>
        <p class="mt-1 text-[20px] font-black text-[#102372]">
          {{ company.assetsCount || 0 }}
        </p>
      </div>

      <div class="px-3 py-3">
        <p class="text-[10px] font-black uppercase text-slate-400">Online</p>
        <p class="mt-1 text-[20px] font-black text-emerald-700">
          {{ company.activeAssetsCount || 0 }}
        </p>
      </div>

      <div class="px-3 py-3">
        <p class="text-[10px] font-black uppercase text-slate-400">Moviendo</p>
        <p class="mt-1 text-[20px] font-black text-[#102372]">
          {{ company.movingAssetsCount || 0 }}
        </p>
      </div>

      <div class="px-3 py-3">
        <p class="text-[10px] font-black uppercase text-slate-400">Alertas</p>
        <p class="mt-1 text-[20px] font-black text-red-600">
          {{ company.alertsCount || 0 }}
        </p>
      </div>

      <div class="px-3 py-3">
        <p class="text-[10px] font-black uppercase text-slate-400">Salud</p>
        <p class="mt-1 text-[20px] font-black text-[#102372]">{{ health }}%</p>
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  company: {
    type: Object,
    required: true,
  },
  health: {
    type: Number,
    default: 0,
  },
})
</script>
