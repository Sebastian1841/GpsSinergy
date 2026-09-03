<template>
  <Teleport to="body">
    <div
      v-if="isOpen && activo"
      ref="contextMenuRef"
      class="fixed z-[2147483647] w-[268px] overflow-visible rounded-md border border-[#d8dee8] bg-white py-1 shadow-[0_12px_30px_rgba(15,23,42,0.22)]"
      :style="menuStyle"
      @click.stop
      @pointerdown.stop
      @contextmenu.prevent.stop
      @mouseleave="activeSubmenuKey = ''"
    >
      <div
        v-for="action in visibleDeviceActionItems"
        :key="action.key"
        class="relative"
        @mouseenter="setActiveSubmenu(action)"
      >
        <button
          type="button"
          class="group flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left text-[12px] font-semibold transition"
          :class="[
            action.separator ? 'mt-1 border-t border-[#edf1f5] pt-2' : '',
            action.danger ? 'text-red-600 hover:bg-red-50' : 'text-[#172033] hover:bg-[#eef3ff]',
          ]"
          @click="handlePrimaryDeviceAction(action)"
          @focus="setActiveSubmenu(action)"
        >
          <span
            class="flex h-5 w-5 shrink-0 items-center justify-center"
            :class="action.danger ? 'text-red-500' : 'text-[#102372]'"
          >
            <svg
              v-if="action.icon === 'edit'"
              viewBox="0 0 24 24"
              class="h-4 w-4"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M4.75 19.25h3.4L18.6 8.8a2.15 2.15 0 0 0 0-3.05l-.35-.35a2.15 2.15 0 0 0-3.05 0L4.75 15.85v3.4Z"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="m13.75 6.85 3.4 3.4"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
              />
            </svg>

            <svg
              v-else-if="action.icon === 'terminal'"
              viewBox="0 0 24 24"
              class="h-4 w-4"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M4.75 6.75A2 2 0 0 1 6.75 4.75h10.5a2 2 0 0 1 2 2v10.5a2 2 0 0 1-2 2H6.75a2 2 0 0 1-2-2V6.75Z"
                stroke="currentColor"
                stroke-width="1.8"
              />
              <path
                d="m8 9 2.5 2.5L8 14M12.5 14h3.5"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>

            <svg
              v-else-if="action.icon === 'summary'"
              viewBox="0 0 24 24"
              class="h-4 w-4"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M7.25 5.75h9.5a2 2 0 0 1 2 2v9.5a2 2 0 0 1-2 2h-9.5a2 2 0 0 1-2-2v-9.5a2 2 0 0 1 2-2Z"
                stroke="currentColor"
                stroke-width="1.8"
              />
              <path
                d="M8.5 4.25v3M15.5 4.25v3M8.5 11.25h7M8.5 14.25h4.25"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
              />
            </svg>

            <svg
              v-else-if="action.icon === 'itinerary'"
              viewBox="0 0 24 24"
              class="h-4 w-4"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M6.5 18.25c2.25-4.1 8.75-.4 11-4.5 1.2-2.2-.35-4.75-2.75-4.75-2.2 0-3.28 1.85-4.75 4.25-1.2 1.95-2.45 3-4 3"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M6.25 7.75a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM17.75 20.25a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
                stroke="currentColor"
                stroke-width="1.8"
              />
            </svg>

            <svg
              v-else-if="action.icon === 'maintenance'"
              viewBox="0 0 24 24"
              class="h-4 w-4"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M14.25 6.25a3.5 3.5 0 0 0 3.5 3.5c.53 0 1.03-.12 1.48-.33l-3.02 3.02a3 3 0 0 1-4.24 0l-.42-.42-5.3 5.3a1.75 1.75 0 0 1-2.47-2.47l5.3-5.3-.42-.42a3 3 0 0 1 0-4.24l3.02-3.02c-.21.45-.33.95-.33 1.48Z"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="m5.05 16.95.01.01"
                stroke="currentColor"
                stroke-width="2.4"
                stroke-linecap="round"
              />
            </svg>

            <svg
              v-else-if="action.icon === 'trash'"
              viewBox="0 0 24 24"
              class="h-4 w-4"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M6.75 8.25h10.5M9.75 8.25v-1.5a1 1 0 0 1 1-1h2.5a1 1 0 0 1 1 1v1.5M9.25 10.75v5.5M12 10.75v5.5M14.75 10.75v5.5M8 8.25l.65 10a1.5 1.5 0 0 0 1.5 1.4h3.7a1.5 1.5 0 0 0 1.5-1.4l.65-10"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </span>

          <span class="min-w-0 flex-1 truncate">
            {{ action.label }}
          </span>

          <span v-if="action.children" class="text-[14px] leading-none text-slate-400">
            &rsaquo;
          </span>
        </button>

        <div
          v-if="action.children && activeSubmenuKey === action.key"
          class="absolute left-full top-0 z-[2147483647] ml-1 w-[156px] overflow-hidden rounded-md border border-[#d8dee8] bg-white py-1 shadow-[0_12px_30px_rgba(15,23,42,0.18)]"
        >
          <button
            v-for="child in action.children"
            :key="child.key"
            type="button"
            class="flex w-full cursor-pointer items-center px-3 py-1.5 text-left text-[12px] font-semibold text-[#172033] transition hover:bg-[#eef3ff] hover:text-[#102372]"
            @click="handleDeviceAction(child, action)"
          >
            {{ child.label }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue"

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  x: {
    type: Number,
    default: 0,
  },
  y: {
    type: Number,
    default: 0,
  },
  activo: {
    type: Object,
    default: null,
  },
  canManageAssets: {
    type: Boolean,
    default: false,
  },
  canViewItineraries: {
    type: Boolean,
    default: false,
  },
  canViewMaintenance: {
    type: Boolean,
    default: false,
  },
  hasActiveDailySummary: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(["close", "action"])

const contextMenuRef = ref(null)
const activeSubmenuKey = ref("")

const deviceActionItems = [
  {
    key: "edit-device",
    label: "Editar",
    icon: "edit",
    requiresManageAssets: true,
  },
  {
    key: "show-daily-summary",
    label: "Mostrar resumen diario (solo este)",
    icon: "summary",
    requiresItineraryView: true,
    children: [
      {
        key: "show-daily-summary-today",
        label: "Hoy",
        range: "today",
      },
      {
        key: "show-daily-summary-yesterday",
        label: "Ayer",
        range: "yesterday",
      },
      {
        key: "show-daily-summary-this-week",
        label: "Esta semana",
        range: "week",
      },
      {
        key: "show-daily-summary-last-week",
        label: "Ultima semana",
        range: "last-week",
      },
      {
        key: "show-daily-summary-this-month",
        label: "Este mes",
        range: "month",
      },
      {
        key: "show-daily-summary-last-month",
        label: "Ultimo mes",
        range: "last-month",
      },
    ],
  },
  {
    key: "add-daily-summary",
    label: "Agregar a resumen diario",
    icon: "summary",
    requiresItineraryView: true,
    requiresActiveDailySummary: true,
  },
  {
    key: "show-itinerary",
    label: "Mostrar itinerario",
    icon: "itinerary",
    requiresItineraryView: true,
    children: [
      {
        key: "show-itinerary-today",
        label: "Hoy",
        range: "today",
      },
      {
        key: "show-itinerary-yesterday",
        label: "Ayer",
        range: "yesterday",
      },
      {
        key: "show-itinerary-this-week",
        label: "Esta semana",
        range: "week",
      },
      {
        key: "show-itinerary-last-week",
        label: "Ultima semana",
        range: "last-week",
      },
    ],
  },
  {
    key: "open-terminal",
    label: "Terminal",
    icon: "terminal",
    requiresManageAssets: true,
  },
  {
    key: "open-maintenance",
    label: "Mantenciones",
    icon: "maintenance",
    requiresMaintenanceView: true,
  },
  {
    key: "delete-device",
    label: "Eliminar activo",
    icon: "trash",
    danger: true,
    requiresManageAssets: true,
    separator: true,
  },
]

const visibleDeviceActionItems = computed(() => {
  return deviceActionItems.filter((action) => {
    if (action.requiresManageAssets && !props.canManageAssets) return false
    if (action.requiresItineraryView && !props.canViewItineraries) return false
    if (action.requiresMaintenanceView && !props.canViewMaintenance) return false
    if (action.requiresActiveDailySummary && !props.hasActiveDailySummary) return false

    return true
  })
})

const menuStyle = computed(() => {
  return {
    left: `${props.x}px`,
    top: `${props.y}px`,
  }
})

const setActiveSubmenu = (action) => {
  activeSubmenuKey.value = action.children ? action.key : ""
}

const handlePrimaryDeviceAction = (action) => {
  if (action.children) {
    activeSubmenuKey.value = action.key
    return
  }

  handleDeviceAction(action)
}

const handleDeviceAction = (action, parentAction = null) => {
  if (!props.activo) return

  emit("action", {
    action: parentAction?.key || action.key,
    activo: props.activo,
    range: action.range || "",
    rangeLabel: action.label || "",
  })
}

const handleGlobalPointerDown = (event) => {
  if (!props.isOpen) return

  if (contextMenuRef.value?.contains(event.target)) return

  emit("close")
}

const handleGlobalKeyDown = (event) => {
  if (event.key !== "Escape") return

  emit("close")
}

const handleWindowScroll = () => {
  if (!props.isOpen) return

  emit("close")
}

onMounted(() => {
  document.addEventListener("pointerdown", handleGlobalPointerDown, true)
  window.addEventListener("scroll", handleWindowScroll, true)
  window.addEventListener("keydown", handleGlobalKeyDown)
})

onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", handleGlobalPointerDown, true)
  window.removeEventListener("scroll", handleWindowScroll, true)
  window.removeEventListener("keydown", handleGlobalKeyDown)
})
</script>
