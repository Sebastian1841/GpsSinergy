<template>
  <section class="overflow-hidden rounded-xl border border-[#102372]/15 bg-white shadow-sm">
    <!-- Header siempre visible -->
    <div class="flex h-[42px] items-center justify-between border-b border-[#d8dee8] bg-[#102372] px-4">
      <div class="flex h-full min-w-0 items-center gap-5 overflow-x-auto">
        <button
          v-for="tab in tabs"
          :key="tab"
          type="button"
          class="h-full shrink-0 cursor-pointer border-b-2 text-[12px] font-black transition"
          :class="currentTab === tab
            ? 'border-[#FF6600] text-white'
            : 'border-transparent text-white/60 hover:text-[#ff6600]'"
          @click="$emit('update:active-tab', tab)"
        >
          {{ tab }}
        </button>
      </div>

      <button
        type="button"
        class="ml-3 flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md border border-white/15 bg-white/10 text-[17px] font-black text-white transition hover:bg-[#FF6600]"
        title="Ocultar panel"
        @click="$emit('toggle-collapse')"
      >
        −
      </button>
    </div>

    <!-- Contenido -->
    <div
      v-if="!collapsed"
      class="grid h-[178px] grid-cols-1 gap-3 overflow-hidden bg-[#f8fafc] p-3 xl:grid-cols-[minmax(0,1fr)_280px]"
    >
      <div class="min-h-0 overflow-auto rounded-lg border border-[#d8dee8] bg-white p-3">
        <div class="space-y-3">
          <TimelineItem
            time="Ahora"
            :title="currentTitle"
            :description="currentDescription"
            badge="OK"
            badge-class="bg-emerald-50 text-black"
          />

          <TimelineItem
            time="15 min"
            title="Validación operacional"
            description="Estado calculado según posición y reporte."
            badge="Info"
            badge-class="bg-[#fff3eb] text-black"
          />

          <TimelineItem
            time="35 min"
            title="Ruta registrada"
            description="Movimiento histórico disponible para revisión."
            badge="Ruta"
            badge-class="bg-[#eef3ff] text-black"
          />
        </div>
      </div>

      <div class="rounded-lg border border-[#d8dee8] bg-[#f8fafc] p-3 text-black">
        <div class="flex items-center justify-between">
          <h3 class="text-[11px] font-black text-black">
            Resumen del día
          </h3>

          <button
            type="button"
            class="cursor-pointer rounded-md border border-[#d8dee8] bg-white px-2 py-1 text-[10px] font-bold text-black transition hover:border-[#102372]"
            @click="cycleRange"
          >
            {{ rangeLabel }}
          </button>
        </div>

        <div class="mt-3 space-y-2">
          <SummaryRow label="Distancia recorrida" :value="summary.distance" />
          <SummaryRow label="Tiempo en movimiento" :value="summary.movingTime" />
          <SummaryRow label="Consumo combustible" :value="summary.fuel" />
          <SummaryRow label="Rendimiento promedio" :value="summary.performance" />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, defineComponent, h, ref } from "vue"

const props = defineProps({
  activo: {
    type: Object,
    default: null,
  },
  activeTab: {
    type: String,
    default: "Línea de tiempo",
  },
  collapsed: {
    type: Boolean,
    default: false,
  },
})

defineEmits(["update:active-tab", "toggle-collapse"])

const ranges = ["Hoy", "Semana", "Mes"]
const rangeIndex = ref(0)

const tabs = ["Línea de tiempo", "Eventos", "Paradas", "Resumen de ruta"]

const currentTab = computed(() => props.activeTab)

const rangeLabel = computed(() => {
  return ranges[rangeIndex.value]
})

const currentTitle = computed(() => {
  if (currentTab.value === "Eventos") return "Eventos recientes"
  if (currentTab.value === "Paradas") return "Paradas detectadas"
  if (currentTab.value === "Resumen de ruta") return "Resumen de ruta activo"

  return "Último reporte recibido"
})

const currentDescription = computed(() => {
  const name = props.activo?.vehiculo || "Activo"

  if (currentTab.value === "Eventos") {
    return `${name} tiene eventos operacionales disponibles.`
  }

  if (currentTab.value === "Paradas") {
    return `${name} registra paradas recientes para revisión.`
  }

  if (currentTab.value === "Resumen de ruta") {
    return `${name} tiene ruta calculada en base a posición.`
  }

  return `${name} actualizado correctamente.`
})

const summary = computed(() => {
  if (rangeLabel.value === "Semana") {
    return {
      distance: "684 km",
      movingTime: "21 h",
      fuel: "496 L",
      performance: "3.5 km/L",
    }
  }

  if (rangeLabel.value === "Mes") {
    return {
      distance: "2.840 km",
      movingTime: "86 h",
      fuel: "1.980 L",
      performance: "3.4 km/L",
    }
  }

  return {
    distance: "128 km",
    movingTime: "3 h 45 min",
    fuel: "102 L",
    performance: "3.2 km/L",
  }
})

const cycleRange = () => {
  rangeIndex.value = (rangeIndex.value + 1) % ranges.length
}

const TimelineItem = defineComponent({
  props: {
    time: String,
    title: String,
    description: String,
    badge: String,
    badgeClass: String,
  },
  setup(props) {
    return () =>
      h("div", { class: "flex gap-3" }, [
        h("div", { class: "w-14 shrink-0 text-right" }, [
          h("p", { class: "text-[11px] font-black text-black" }, props.time),
        ]),

        h("div", { class: "relative flex flex-col items-center" }, [
          h("span", { class: "mt-1 h-2.5 w-2.5 rounded-full bg-[#FF6600]" }),
          h("span", { class: "mt-1 h-full w-px bg-[#d8dee8]" }),
        ]),

        h("div", { class: "min-w-0 flex-1" }, [
          h("div", { class: "flex items-center justify-between gap-2" }, [
            h("p", { class: "truncate text-[12px] font-black text-black" }, props.title),

            h(
              "span",
              {
                class: `shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${props.badgeClass}`,
              },
              props.badge,
            ),
          ]),

          h("p", { class: "mt-1 truncate text-[11px] font-semibold text-black" }, props.description),
        ]),
      ])
  },
})

const SummaryRow = defineComponent({
  props: {
    label: String,
    value: String,
  },
  setup(props) {
    return () =>
      h("div", { class: "flex items-center justify-between gap-3 text-[11px]" }, [
        h("span", { class: "text-black" }, props.label),
        h("strong", { class: "text-black" }, props.value),
      ])
  },
})
</script>