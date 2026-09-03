<template>
  <article class="rounded-xl border border-[#dfe5ed] bg-white p-4 shadow-sm">
    <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
      <div class="flex min-w-0 items-center gap-4">
        <div
          class="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-[#eef3ff] text-[18px] font-black text-[#102372]"
        >
          {{ vehicle.initials }}
        </div>

        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <h2 class="text-[22px] font-black text-[#102372]">
              {{ vehicle.plate }}
            </h2>
            <span
              class="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700"
            >
              Activo
            </span>
          </div>

          <p class="mt-1 text-[12px] font-bold text-slate-500">
            {{ vehicle.assetName }} - {{ vehicle.year }} - {{ vehicle.vin }}
          </p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div class="rounded-lg border border-[#edf1f5] p-3">
          <p class="text-[10px] font-black uppercase tracking-[0.08em] text-slate-400">Odometro</p>
          <p class="mt-1 text-[16px] font-black text-[#102372]">
            {{ vehicle.odometerLabel }}
          </p>
        </div>

        <div class="rounded-lg border border-[#edf1f5] p-3">
          <p class="text-[10px] font-black uppercase tracking-[0.08em] text-slate-400">Horometro</p>
          <p class="mt-1 text-[16px] font-black text-[#102372]">
            {{ vehicle.hourMeterLabel }}
          </p>
        </div>
      </div>
    </div>

    <div class="mt-4 flex flex-wrap gap-2 border-t border-[#edf1f5] pt-3">
      <button
        class="h-8 rounded-lg border border-[#dfe5ed] px-3 text-[11px] font-black text-[#102372]"
        type="button"
        @click="emit('open-orders')"
      >
        Ordenes de trabajo
      </button>
      <button
        class="h-8 rounded-lg bg-[#102372] px-3 text-[11px] font-black text-white"
        type="button"
        @click="emit('open-costs')"
      >
        Costos y facturas
      </button>
    </div>
  </article>
</template>

<script setup>
defineProps({
  vehicle: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(["open-costs", "open-orders"])
</script>
