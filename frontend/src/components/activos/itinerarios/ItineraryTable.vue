<template>
  <section class="min-h-0 overflow-hidden rounded-xl border border-[#d8dee8] bg-white shadow-sm">
    <div class="flex items-center justify-between border-b border-[#edf0f5] px-3 py-3">
      <div>
        <p class="text-[11px] font-black text-[#102372]">
          Eventos del recorrido
        </p>

        <p class="text-[10px] font-semibold text-slate-500">
          {{ rows.length }} registros GPS encontrados
        </p>
      </div>

      <span class="rounded-full bg-[#eef3ff] px-2 py-1 text-[10px] font-black text-[#102372]">
        Itinerario
      </span>
    </div>

    <div
      v-if="!rows.length"
      class="flex min-h-[220px] flex-col items-center justify-center p-6 text-center"
    >
      <p class="text-[13px] font-black text-[#172033]">
        Sin registros para mostrar
      </p>

      <p class="mt-1 max-w-[320px] text-[11px] font-semibold text-slate-500">
        Busca una patente o dispositivo y selecciona un rango de fechas.
      </p>
    </div>

    <div
      v-else
      class="max-h-[420px] overflow-auto"
    >
      <table class="min-w-full border-collapse text-left text-[11px]">
        <thead class="sticky top-0 z-10 bg-[#f8fafc] text-[10px] uppercase tracking-[0.08em] text-slate-500">
          <tr>
            <th class="border-b border-[#edf0f5] px-3 py-2 font-black">Hora</th>
            <th class="border-b border-[#edf0f5] px-3 py-2 font-black">Estado</th>
            <th class="border-b border-[#edf0f5] px-3 py-2 font-black">Vel.</th>
            <th class="border-b border-[#edf0f5] px-3 py-2 font-black">Dirección</th>
            <th class="border-b border-[#edf0f5] px-3 py-2 font-black">Km acum.</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="row in rows"
            :key="row.id"
            class="cursor-pointer border-b border-[#edf0f5] transition hover:bg-[#fff7ed]"
            :class="selectedPointId === row.id ? 'bg-[#fff7ed]' : 'bg-white'"
            @click="$emit('select-point', row)"
          >
            <td class="whitespace-nowrap px-3 py-2 font-black text-[#172033]">
              {{ row.timeLabel }}
            </td>

            <td class="whitespace-nowrap px-3 py-2">
              <span
                class="rounded-full px-2 py-0.5 text-[10px] font-black"
                :class="row.status === 'moving'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-[#fff3eb] text-[#FF6600]'"
              >
                {{ row.status === 'moving' ? 'Movimiento' : 'Detenido' }}
              </span>
            </td>

            <td class="whitespace-nowrap px-3 py-2 font-semibold text-slate-700">
              {{ row.speedLabel }}
            </td>

            <td class="min-w-[220px] px-3 py-2 font-semibold text-slate-600">
              <p class="line-clamp-1">
                {{ row.address }}
              </p>

              <p class="mt-0.5 text-[10px] font-bold text-slate-400">
                {{ row.event }}
              </p>
            </td>

            <td class="whitespace-nowrap px-3 py-2 font-black text-[#102372]">
              {{ row.accumulatedDistanceLabel }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
defineProps({
  rows: {
    type: Array,
    default: () => [],
  },
  selectedPointId: {
    type: [String, Number],
    default: null,
  },
})

defineEmits(["select-point"])
</script>