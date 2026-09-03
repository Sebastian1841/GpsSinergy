<template>
  <section class="space-y-4">
    <MaintenanceVehicleHeaderCard
      :vehicle="selectedVehicle"
      @open-costs="emit('open-costs')"
      @open-orders="emit('open-orders')"
    />

    <div class="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
      <article class="rounded-xl border border-[#dfe5ed] bg-white p-4 shadow-sm">
        <h2 class="text-[14px] font-black text-[#102372]">Registrar nuevo costo</h2>
        <p class="mt-1 text-[11px] font-bold text-slate-500">
          Cierre financiero con respaldo documental.
        </p>

        <div class="mt-4 grid gap-3">
          <label v-for="field in costFormFields" :key="field.label" class="grid gap-1.5">
            <span class="text-[10px] font-black uppercase tracking-[0.08em] text-slate-400">
              {{ field.label }}
            </span>
            <input
              :placeholder="field.placeholder"
              class="h-9 rounded-lg border border-[#dfe5ed] px-3 text-[12px] font-bold outline-none focus:border-[#102372]"
              type="text"
            />
          </label>

          <div
            class="flex h-24 items-center justify-center rounded-lg border border-dashed border-[#cfd8e6] bg-[#f8fafc] text-center text-[11px] font-bold text-slate-500"
          >
            Arrastra factura aqui o selecciona archivo
          </div>

          <button
            type="button"
            class="h-10 rounded-lg bg-emerald-600 text-[12px] font-black text-white"
            @click="emit('open-cost-modal')"
          >
            Guardar y adjuntar factura
          </button>
        </div>
      </article>

      <section class="min-w-0 space-y-4">
        <div class="grid gap-2 sm:grid-cols-3">
          <article
            v-for="card in costSummary"
            :key="card.label"
            class="rounded-xl border border-[#dfe5ed] bg-white p-4 shadow-sm"
          >
            <p class="text-[10px] font-black uppercase tracking-[0.08em] text-slate-400">
              {{ card.label }}
            </p>
            <p class="mt-2 text-[22px] font-black text-[#102372]">{{ card.value }}</p>
            <p class="mt-1 text-[11px] font-bold text-slate-500">{{ card.detail }}</p>
          </article>
        </div>

        <article class="rounded-xl border border-[#dfe5ed] bg-white shadow-sm">
          <header
            class="flex items-center justify-between gap-3 border-b border-[#edf1f5] px-4 py-3"
          >
            <h2 class="text-[14px] font-black text-[#102372]">Costos y facturas</h2>
            <button
              type="button"
              class="h-8 rounded-lg border border-[#dfe5ed] px-3 text-[11px] font-black text-[#102372]"
              @click="emit('open-export')"
            >
              Exportar costos
            </button>
          </header>

          <div class="overflow-x-auto">
            <table class="w-full min-w-[820px] text-left">
              <thead
                class="bg-[#f8fafc] text-[10px] font-black uppercase tracking-[0.08em] text-slate-400"
              >
                <tr>
                  <th class="px-4 py-3">Fecha</th>
                  <th class="px-4 py-3">Tipo de costo</th>
                  <th class="px-4 py-3">Taller</th>
                  <th class="px-4 py-3">Factura</th>
                  <th class="px-4 py-3">Monto total</th>
                  <th class="px-4 py-3">Documento</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#edf1f5]">
                <tr v-for="cost in displayCostRows" :key="cost.id" class="text-[12px]">
                  <td class="px-4 py-3 font-bold text-slate-600">{{ cost.date }}</td>
                  <td class="px-4 py-3">
                    <span
                      class="rounded-full px-2.5 py-1 text-[10px] font-black"
                      :class="cost.className"
                    >
                      {{ cost.type }}
                    </span>
                  </td>
                  <td class="px-4 py-3 font-bold text-slate-600">{{ cost.workshop }}</td>
                  <td class="px-4 py-3 font-bold text-slate-600">{{ cost.invoice }}</td>
                  <td class="px-4 py-3 font-black text-[#102372]">{{ cost.total }}</td>
                  <td class="px-4 py-3 font-black text-blue-600">Ver</td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </div>
  </section>
</template>

<script setup>
import MaintenanceVehicleHeaderCard from "./MaintenanceVehicleHeaderCard.vue"

defineProps({
  costFormFields: {
    type: Array,
    default: () => [],
  },
  costSummary: {
    type: Array,
    default: () => [],
  },
  displayCostRows: {
    type: Array,
    default: () => [],
  },
  selectedVehicle: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(["open-costs", "open-orders", "open-cost-modal", "open-export"])
</script>
