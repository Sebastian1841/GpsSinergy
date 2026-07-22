<template>
  <section>
    <div class="flex items-center justify-between gap-3">
      <p class="text-[10px] font-black uppercase tracking-[0.12em] text-[#ff6600]">Vigencia</p>

      <span class="rounded-md bg-[#eef2f7] px-2 py-1 text-[10px] font-black text-[#102372]">
        {{ scheduleScopeLabel }}
      </span>
    </div>

    <div class="mt-3 rounded-lg border border-[#edf1f5] bg-[#f8fafc] p-2">
      <div class="grid grid-cols-2 gap-2">
        <button
          type="button"
          class="h-9 rounded-lg border px-3 text-[10px] font-black uppercase tracking-[0.06em] transition disabled:cursor-not-allowed disabled:opacity-40"
          :class="
            draft.schedule.mode === 'always'
              ? 'border-[#102372] bg-[#102372] text-white'
              : 'border-[#d8dee8] bg-white text-[#102372] hover:border-[#ff6600] hover:text-[#ff6600]'
          "
          :disabled="draft.id === 'all'"
          @click="emit('update-schedule-field', 'mode', 'always')"
        >
          Siempre
        </button>

        <button
          type="button"
          class="h-9 rounded-lg border px-3 text-[10px] font-black uppercase tracking-[0.06em] transition disabled:cursor-not-allowed disabled:opacity-40"
          :class="
            draft.schedule.mode === 'calendar'
              ? 'border-[#ff6600] bg-[#ff6600] text-white'
              : 'border-[#d8dee8] bg-white text-[#102372] hover:border-[#ff6600] hover:text-[#ff6600]'
          "
          :disabled="draft.id === 'all'"
          @click="emit('update-schedule-field', 'mode', 'calendar')"
        >
          Calendario
        </button>
      </div>

      <div
        v-if="draft.schedule.mode === 'calendar'"
        class="mt-3 grid gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
      >
        <div class="grid grid-cols-2 gap-2">
          <label>
            <span class="text-[10px] font-black uppercase text-slate-400"> Hora inicio </span>
            <input
              :value="draft.schedule.timeFrom"
              type="time"
              class="mt-1 h-9 w-full rounded-lg border border-[#d8dee8] bg-white px-2 text-[11px] font-bold text-[#102372] outline-none focus:border-[#ff6600]"
              :disabled="draft.id === 'all'"
              @input="emit('update-schedule-field', 'timeFrom', $event.target.value)"
            />
          </label>

          <label>
            <span class="text-[10px] font-black uppercase text-slate-400"> Hora fin </span>
            <input
              :value="draft.schedule.timeTo"
              type="time"
              class="mt-1 h-9 w-full rounded-lg border border-[#d8dee8] bg-white px-2 text-[11px] font-bold text-[#102372] outline-none focus:border-[#ff6600]"
              :disabled="draft.id === 'all'"
              @input="emit('update-schedule-field', 'timeTo', $event.target.value)"
            />
          </label>
        </div>

        <div>
          <p class="text-[10px] font-black uppercase text-slate-400">Dias activos</p>

          <div class="mt-1 grid grid-cols-7 gap-1">
            <button
              v-for="weekday in weekdayOptions"
              :key="weekday.id"
              type="button"
              class="h-9 rounded-lg border text-[10px] font-black transition disabled:cursor-not-allowed disabled:opacity-40"
              :class="
                isWeekdaySelected(weekday.id)
                  ? 'border-[#102372] bg-[#102372] text-white'
                  : 'border-[#d8dee8] bg-white text-[#102372] hover:border-[#ff6600] hover:text-[#ff6600]'
              "
              :disabled="draft.id === 'all'"
              @click="emit('toggle-weekday', weekday.id)"
            >
              {{ weekday.label }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const props = defineProps({
  draft: {
    type: Object,
    required: true,
  },
  scheduleScopeLabel: {
    type: String,
    default: "",
  },
  weekdayOptions: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(["update-schedule-field", "toggle-weekday"])

const isWeekdaySelected = (weekdayId) => {
  return props.draft.schedule.weekdays.includes(Number(weekdayId))
}
</script>
