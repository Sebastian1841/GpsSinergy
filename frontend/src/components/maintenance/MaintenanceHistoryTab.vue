<template>
  <section class="space-y-4">
    <MaintenanceVehicleHeaderCard
      :vehicle="selectedVehicle"
      @open-costs="emit('open-costs')"
      @open-orders="emit('open-orders')"
    />

    <div class="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
      <article class="rounded-xl border border-[#dfe5ed] bg-white p-4 shadow-sm">
        <h2 class="text-[14px] font-black text-[#102372]">Trazabilidad del ciclo</h2>
        <div class="mt-4 space-y-4">
          <div
            v-for="step in lifecycleSteps"
            :key="step.title"
            class="grid grid-cols-[28px_minmax(0,1fr)] gap-3"
          >
            <span
              class="flex h-7 w-7 items-center justify-center rounded-full"
              :class="step.done ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'"
            >
              <svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" aria-hidden="true">
                <path
                  d="M5 13l4 4L19 7"
                  stroke="currentColor"
                  stroke-width="2.4"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </span>
            <span class="min-w-0">
              <span class="block truncate text-[12px] font-black text-slate-700">
                {{ step.title }}
              </span>
              <span class="mt-0.5 block text-[10px] font-bold text-slate-500">
                {{ step.detail }}
              </span>
            </span>
          </div>
        </div>
      </article>

      <article class="rounded-xl border border-[#dfe5ed] bg-white shadow-sm">
        <header class="flex items-center justify-between gap-3 border-b border-[#edf1f5] px-4 py-3">
          <div>
            <h2 class="text-[14px] font-black text-[#102372]">Historial de mantenciones</h2>
            <p class="mt-0.5 text-[11px] font-bold text-slate-500">
              Responsable, taller, lectura y costo por servicio.
            </p>
          </div>
          <button
            type="button"
            class="hidden h-8 rounded-lg border border-[#dfe5ed] px-3 text-[11px] font-black text-[#102372] sm:block"
            @click="emit('open-export')"
          >
            Exportar historial
          </button>
        </header>

        <div class="overflow-x-auto">
          <table class="w-full min-w-[860px] text-left">
            <thead
              class="bg-[#f8fafc] text-[10px] font-black uppercase tracking-[0.08em] text-slate-400"
            >
              <tr>
                <th class="px-4 py-3">Fecha</th>
                <th class="px-4 py-3">Trabajo</th>
                <th class="px-4 py-3">Lectura</th>
                <th class="px-4 py-3">Responsable / taller</th>
                <th class="px-4 py-3">Costo</th>
                <th class="px-4 py-3">Documento</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#edf1f5]">
              <tr v-for="record in maintenanceHistory" :key="record.id" class="text-[12px]">
                <td class="px-4 py-3 font-bold text-slate-600">{{ record.date }}</td>
                <td class="px-4 py-3">
                  <span class="block font-black text-slate-700">{{ record.job }}</span>
                  <span class="mt-0.5 block text-[10px] font-bold text-slate-500">{{
                    record.type
                  }}</span>
                </td>
                <td class="px-4 py-3 font-bold text-slate-600">{{ record.reading }}</td>
                <td class="px-4 py-3 font-bold text-slate-600">{{ record.workshop }}</td>
                <td class="px-4 py-3 font-black text-[#102372]">{{ record.cost }}</td>
                <td class="px-4 py-3">
                  <span class="font-black text-blue-600">{{ record.invoice }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
import MaintenanceVehicleHeaderCard from "./MaintenanceVehicleHeaderCard.vue"

defineProps({
  lifecycleSteps: {
    type: Array,
    default: () => [],
  },
  maintenanceHistory: {
    type: Array,
    default: () => [],
  },
  selectedVehicle: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(["open-costs", "open-orders", "open-export"])
</script>
