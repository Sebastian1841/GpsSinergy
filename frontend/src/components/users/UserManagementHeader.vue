<template>
  <header class="shrink-0 bg-[#f3f6fa] px-4 pb-3 pt-4 text-slate-900">
    <div class="flex items-center justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-[18px] font-black leading-tight text-[#102372]">
          Usuarios
        </h1>

        <p class="mt-1 text-[11px] font-semibold text-slate-500">
          Gestiona y administra los usuarios del sistema
        </p>
      </div>

      <button
        v-if="canCreateUsers"
        type="button"
        class="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#ff6600] px-4 text-[11px] font-black text-white shadow-[0_8px_20px_rgba(255,102,0,0.18)] transition hover:bg-[#e65c00] active:scale-[0.98]"
        @click="$emit('create-user')"
      >
        <span class="text-[18px] font-medium leading-none">
          +
        </span>

        Nuevo usuario
      </button>
    </div>
  </header>
</template>

<script setup>
defineProps({
  summaryItems: {
    type: Array,
    default: () => [],
  },
  selectedStatus: {
    type: String,
    default: "all",
  },
  canCreateUsers: {
    type: Boolean,
    default: false,
  },
})

defineEmits([
  "create-user",
  "select-status",
])
</script>