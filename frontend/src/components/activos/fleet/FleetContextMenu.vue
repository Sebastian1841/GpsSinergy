<template>
  <Teleport to="body">
    <div
      v-if="isOpen && activo"
      ref="contextMenuRef"
      class="fixed z-[2147483647] w-[186px] overflow-hidden rounded-md border border-[#d8dee8] bg-white py-1 shadow-[0_12px_30px_rgba(15,23,42,0.22)]"
      :style="menuStyle"
      @click.stop
      @pointerdown.stop
      @contextmenu.prevent.stop
    >
      <button
        v-for="action in deviceActionItems"
        :key="action.key"
        type="button"
        class="group flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left text-[12px] font-semibold transition"
        :class="[
          action.separator ? 'mt-1 border-t border-[#edf1f5] pt-2' : '',
          action.danger
            ? 'text-red-600 hover:bg-red-50'
            : 'text-[#172033] hover:bg-[#eef3ff]',
        ]"
        @click="handleDeviceAction(action)"
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
      </button>
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
})

const emit = defineEmits([
  "close",
  "action",
])

const contextMenuRef = ref(null)

const deviceActionItems = [
  {
    key: "edit-device",
    label: "Editar",
    icon: "edit",
  },
  {
    key: "open-terminal",
    label: "Terminal",
    icon: "terminal",
  },
  {
    key: "delete-device",
    label: "Eliminar activo",
    icon: "trash",
    danger: true,
    separator: true,
  },
]

const menuStyle = computed(() => {
  return {
    left: `${props.x}px`,
    top: `${props.y}px`,
  }
})

const handleDeviceAction = (action) => {
  if (!props.activo) return

  emit("action", {
    action: action.key,
    activo: props.activo,
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