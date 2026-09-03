<template>
  <section class="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_360px]">
    <article class="rounded-xl border border-[#dfe5ed] bg-white shadow-sm">
      <header class="flex items-center justify-between gap-3 border-b border-[#edf1f5] px-4 py-3">
        <button class="maintenance-icon-button" type="button">
          <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" aria-hidden="true">
            <path
              d="M15 6l-6 6 6 6"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </button>
        <h2 class="text-[15px] font-black text-[#102372]">Agosto 2026</h2>
        <button class="maintenance-icon-button" type="button">
          <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" aria-hidden="true">
            <path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>
      </header>

      <div
        class="grid grid-cols-7 border-b border-[#edf1f5] bg-[#f8fafc] text-center text-[10px] font-black uppercase tracking-[0.08em] text-slate-400"
      >
        <span v-for="day in weekDays" :key="day" class="px-2 py-2">{{ day }}</span>
      </div>

      <div class="grid grid-cols-7">
        <div
          v-for="day in calendarDays"
          :key="day.key"
          class="min-h-[96px] border-b border-r border-[#edf1f5] p-2 last:border-r-0"
          :class="day.outside ? 'bg-[#fbfcfe] text-slate-300' : 'bg-white'"
        >
          <span class="text-[11px] font-black">{{ day.number }}</span>
          <div class="mt-2 space-y-1">
            <button
              v-for="event in day.events"
              :key="event.id"
              type="button"
              class="block w-full truncate rounded-md px-2 py-1 text-left text-[10px] font-black"
              :class="getOrderStatusClass(event.status)"
            >
              {{ event.time }} {{ event.id }}
            </button>
          </div>
        </div>
      </div>
    </article>

    <aside class="space-y-4">
      <MaintenanceUpcomingOrdersPanel :orders="upcomingOrders" />
      <article class="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <p class="text-[12px] font-black text-blue-800">Nota funcional</p>
        <p class="mt-1 text-[11px] font-bold leading-5 text-blue-700">
          El calendario queda como apoyo visual. La gestion principal sigue viviendo en la lista de
          ordenes de trabajo.
        </p>
      </article>
    </aside>
  </section>
</template>

<script setup>
import MaintenanceUpcomingOrdersPanel from "./MaintenanceUpcomingOrdersPanel.vue"

defineProps({
  calendarDays: {
    type: Array,
    default: () => [],
  },
  getOrderStatusClass: {
    type: Function,
    required: true,
  },
  upcomingOrders: {
    type: Array,
    default: () => [],
  },
  weekDays: {
    type: Array,
    default: () => [],
  },
})
</script>
