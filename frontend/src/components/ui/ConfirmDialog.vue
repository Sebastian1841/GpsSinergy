<template>
  <Teleport to="body">
    <transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-120 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[2147483646] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-[2px]"
        @click.self="handleCancel"
      >
        <transition
          appear
          enter-active-class="transition duration-180 ease-out"
          enter-from-class="translate-y-2 scale-[0.98] opacity-0"
          enter-to-class="translate-y-0 scale-100 opacity-100"
          leave-active-class="transition duration-120 ease-in"
          leave-from-class="translate-y-0 scale-100 opacity-100"
          leave-to-class="translate-y-2 scale-[0.98] opacity-0"
        >
          <section
            class="w-full max-w-[430px] overflow-hidden rounded-2xl border border-white/80 bg-white shadow-[0_22px_70px_rgba(15,23,42,0.35)]"
            role="dialog"
            aria-modal="true"
          >
            <div class="flex h-1">
              <div class="w-2/3 bg-[#102372]"></div>
              <div class="w-1/3 bg-[#FF6600]"></div>
            </div>

            <div class="p-5">
              <div class="flex items-start gap-4">
                <div
                  class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                  :class="iconClass"
                >
                  <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" aria-hidden="true">
                    <path
                      d="M12 9v4.25M12 17h.01M10.35 4.9 2.95 17.7A1.55 1.55 0 0 0 4.3 20h15.4a1.55 1.55 0 0 0 1.35-2.3L13.65 4.9a1.52 1.52 0 0 0-2.64 0Z"
                      stroke="currentColor"
                      stroke-width="1.9"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </div>

                <div class="min-w-0 flex-1">
                  <p class="text-[10px] font-black uppercase tracking-[0.18em] text-[#FF6600]">
                    Confirmación
                  </p>

                  <h2 class="mt-1 text-[17px] font-black leading-tight text-[#172033]">
                    {{ title }}
                  </h2>

                  <p class="mt-2 text-[13px] font-semibold leading-relaxed text-slate-600">
                    {{ message }}
                  </p>

                  <p
                    v-if="detail"
                    class="mt-2 rounded-xl border border-slate-200 bg-[#f8fafc] px-3 py-2 text-[11px] font-semibold leading-relaxed text-slate-500"
                  >
                    {{ detail }}
                  </p>
                </div>
              </div>
            </div>

            <footer
              class="flex items-center justify-end gap-2 border-t border-slate-200 bg-[#f8fafc] px-5 py-4"
            >
              <button
                type="button"
                class="h-9 cursor-pointer rounded-lg border border-slate-200 bg-white px-4 text-[11px] font-black text-[#102372] transition hover:border-[#FF6600] hover:text-[#FF6600]"
                @click="handleCancel"
              >
                {{ cancelLabel }}
              </button>

              <button
                type="button"
                class="h-9 cursor-pointer rounded-lg px-4 text-[11px] font-black text-white shadow-sm transition"
                :class="confirmButtonClass"
                @click="handleConfirm"
              >
                {{ confirmLabel }}
              </button>
            </footer>
          </section>
        </transition>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { computed, onBeforeUnmount, watch } from "vue"

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: "Confirmar acción",
  },
  message: {
    type: String,
    default: "¿Seguro que deseas continuar?",
  },
  detail: {
    type: String,
    default: "",
  },
  confirmLabel: {
    type: String,
    default: "Confirmar",
  },
  cancelLabel: {
    type: String,
    default: "Cancelar",
  },
  variant: {
    type: String,
    default: "danger",
  },
})

const emit = defineEmits(["update:modelValue", "confirm", "cancel"])

const iconClass = computed(() => {
  if (props.variant === "warning") {
    return "bg-amber-50 text-amber-600"
  }

  if (props.variant === "primary") {
    return "bg-[#eef3ff] text-[#102372]"
  }

  return "bg-red-50 text-red-600"
})

const confirmButtonClass = computed(() => {
  if (props.variant === "warning") {
    return "bg-amber-500 hover:bg-amber-600"
  }

  if (props.variant === "primary") {
    return "bg-[#102372] hover:bg-[#0c1b59]"
  }

  return "bg-red-600 hover:bg-red-700"
})

const handleConfirm = () => {
  emit("confirm")
  emit("update:modelValue", false)
}

const handleCancel = () => {
  emit("cancel")
  emit("update:modelValue", false)
}

const handleKeydown = (event) => {
  if (event.key === "Escape" && props.modelValue) {
    handleCancel()
  }
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      window.addEventListener("keydown", handleKeydown)
      return
    }

    window.removeEventListener("keydown", handleKeydown)
  },
  {
    immediate: true,
  },
)

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeydown)
})
</script>
