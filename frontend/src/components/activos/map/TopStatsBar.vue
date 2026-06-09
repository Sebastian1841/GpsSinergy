<template>
  <div class="flex flex-col gap-1.5">
    <button
      v-for="item in stats"
      :key="item.label"
      type="button"
      :title="`${item.label}: ${item.value}`"
      class="group relative flex h-[48px] w-[48px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 bg-white text-center shadow-[0_12px_28px_rgba(15,23,42,0.34)] transition hover:-translate-y-[1px] hover:scale-[1.03] hover:bg-white hover:shadow-[0_16px_36px_rgba(15,23,42,0.42)]"
      :class="
        activeFilter === item.filter
          ? 'border-[#FF6600] ring-4 ring-[#FF6600]/25 shadow-[0_0_0_1px_rgba(255,102,0,0.35),0_16px_36px_rgba(15,23,42,0.42)]'
          : 'border-white ring-2 ring-slate-900/20'
      "
      @click="$emit('select-filter', item.filter)"
    >
      <span
        class="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full shadow-[0_0_0_2px_rgba(255,255,255,1),0_2px_8px_rgba(15,23,42,0.35)]"
        :class="item.dot"
      ></span>

      <strong
        class="text-[17px] font-black leading-none drop-shadow-[0_1px_0_rgba(255,255,255,1)]"
        :class="item.valueClass"
      >
        {{ item.value }}
      </strong>

      <span
        class="mt-1 max-w-[42px] truncate text-[7.5px] font-black uppercase leading-none tracking-[0.05em] text-slate-800"
      >
        {{ item.shortLabel }}
      </span>
    </button>
  </div>
</template>

<script setup>
import { computed } from "vue"

const props = defineProps({
  activos: {
    type: Array,
    default: () => [],
  },
  activeFilter: {
    type: String,
    default: "all",
  },
})

defineEmits(["select-filter"])

const statsCount = computed(() => {
  const result = {
    online: 0,
    moving: 0,
    stopped: 0,
    idle: 0,
    offline: 0,
  }

  props.activos.forEach((activo) => {
    const estado = activo?.estado || "offline"

    if (estado === "offline") {
      result.offline += 1
      return
    }

    result.online += 1

    if (estado === "moving") {
      result.moving += 1
      return
    }

    if (estado === "stopped") {
      result.stopped += 1
      return
    }

    if (estado === "idle") {
      result.idle += 1
    }
  })

  return result
})

const stats = computed(() => [
  {
    label: "Activos en línea",
    shortLabel: "Online",
    value: statsCount.value.online,
    dot: "bg-emerald-500",
    valueClass: "text-[#102372]",
    filter: "online",
  },
  {
    label: "En ruta",
    shortLabel: "Ruta",
    value: statsCount.value.moving,
    dot: "bg-emerald-500",
    valueClass: "text-emerald-600",
    filter: "moving",
  },
  {
    label: "Detenidos",
    shortLabel: "Stop",
    value: statsCount.value.stopped,
    dot: "bg-red-500",
    valueClass: "text-red-500",
    filter: "stopped",
  },
  {
    label: "En espera",
    shortLabel: "Espera",
    value: statsCount.value.idle,
    dot: "bg-sky-500",
    valueClass: "text-sky-600",
    filter: "idle",
  },
  {
    label: "Offline",
    shortLabel: "Offline",
    value: statsCount.value.offline,
    dot: "bg-slate-500",
    valueClass: "text-slate-700",
    filter: "offline",
  },
])
</script>
