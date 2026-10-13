<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-[2147483646] flex items-center justify-center bg-slate-950/50 px-4"
      @click.self="handleCancel"
    >
      <section
        class="w-full max-w-[460px] overflow-hidden rounded-lg bg-white shadow-[0_20px_55px_rgba(15,23,42,0.3)]"
        role="dialog"
        aria-modal="true"
      >
        <header class="flex items-center justify-between bg-[#102372] px-5 py-4 text-white">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.16em] text-blue-200">
              Confirmacion
            </p>
            <h2 class="mt-1 text-[17px] font-black">{{ title }}</h2>
          </div>
          <button
            type="button"
            class="grid h-8 w-8 cursor-pointer place-items-center rounded-md text-[18px] font-black hover:bg-white/10"
            aria-label="Cerrar"
            @click="handleCancel"
          >
            x
          </button>
        </header>

        <div class="px-5 py-5">
          <p class="text-[14px] font-bold leading-6 text-[#102372]">{{ message }}</p>
          <p v-if="detail" class="mt-2 text-[12px] font-semibold leading-5 text-slate-500">
            {{ detail }}
          </p>
        </div>

        <footer class="flex items-center justify-end gap-2 border-t border-[#d8e0eb] px-5 py-4">
          <button
            type="button"
            class="h-10 cursor-pointer rounded-md border border-[#cfd8e6] bg-white px-5 text-[12px] font-black text-[#102372]"
            @click="handleCancel"
          >
            {{ cancelLabel }}
          </button>
          <button
            type="button"
            class="h-10 cursor-pointer rounded-md px-5 text-[12px] font-black text-white"
            :class="confirmButtonClass"
            @click="handleConfirm"
          >
            {{ confirmLabel }}
          </button>
        </footer>
      </section>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, onBeforeUnmount, watch } from "vue"

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: "Confirmar accion" },
  message: { type: String, default: "Seguro que deseas continuar?" },
  detail: { type: String, default: "" },
  confirmLabel: { type: String, default: "Confirmar" },
  cancelLabel: { type: String, default: "Cancelar" },
  variant: { type: String, default: "danger" },
})

const emit = defineEmits(["update:modelValue", "confirm", "cancel"])

const confirmButtonClass = computed(() => {
  if (props.variant === "warning") return "bg-amber-500 hover:bg-amber-600"
  if (props.variant === "primary") return "bg-[#102372] hover:bg-[#0c1b59]"
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
  if (event.key === "Escape" && props.modelValue) handleCancel()
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
  { immediate: true },
)

onBeforeUnmount(() => window.removeEventListener("keydown", handleKeydown))
</script>
