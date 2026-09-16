<template>
  <span
    class="inline-flex max-w-full items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-black uppercase"
    :class="badgeClass"
  >
    <span class="h-1.5 w-1.5 shrink-0 rounded-full" :class="dotClass"></span>
    <span class="truncate">{{ label }}</span>
  </span>
</template>

<script setup>
import { computed } from "vue"

import { getAlarmSeverityLabel, getAlarmStatusLabel } from "../../utils/alarms/alarmUtils.js"

const props = defineProps({
  value: {
    type: String,
    default: "",
  },
  variant: {
    type: String,
    default: "status",
  },
})

const statusClasses = {
  open: {
    badge: "bg-[#fff3eb] text-[#ff6600]",
    dot: "bg-[#ff6600]",
  },
  resolved: {
    badge: "bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
  },
}

const severityClasses = {
  critical: {
    badge: "bg-red-50 text-red-700",
    dot: "bg-red-600",
  },
  high: {
    badge: "bg-[#fff3eb] text-[#ff6600]",
    dot: "bg-[#ff6600]",
  },
  medium: {
    badge: "bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
  },
  low: {
    badge: "bg-slate-100 text-slate-600",
    dot: "bg-slate-400",
  },
}

const currentClasses = computed(() => {
  const source = props.variant === "severity" ? severityClasses : statusClasses

  return (
    source[props.value] || {
      badge: "bg-slate-100 text-slate-600",
      dot: "bg-slate-400",
    }
  )
})

const badgeClass = computed(() => currentClasses.value.badge)
const dotClass = computed(() => currentClasses.value.dot)

const label = computed(() => {
  if (props.variant === "severity") return getAlarmSeverityLabel(props.value)

  return getAlarmStatusLabel(props.value)
})
</script>
