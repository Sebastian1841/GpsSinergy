<template>
  <section class="rounded-lg border border-[#d8dee8] bg-white p-3">
    <div class="grid gap-2 md:grid-cols-[minmax(0,1fr)_180px_auto]">
      <label class="relative block">
        <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" aria-hidden="true">
            <path
              d="m20 20-4.35-4.35M18 10.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </span>

        <input
          v-model="searchModel"
          type="text"
          placeholder="Buscar empresa, ciudad o RUT"
          class="h-10 w-full rounded-lg border border-[#d8dee8] bg-[#f8fafc] pl-9 pr-3 text-[12px] font-semibold text-[#172033] outline-none transition placeholder:text-slate-400 focus:border-[#102372] focus:bg-white focus:ring-2 focus:ring-[#102372]/10"
        />
      </label>

      <select
        v-model="statusModel"
        class="h-10 min-w-0 cursor-pointer rounded-lg border border-[#d8dee8] bg-white px-2 text-[11px] font-black text-[#102372] outline-none transition focus:border-[#102372] focus:ring-2 focus:ring-[#102372]/10"
      >
        <option value="all">Todos los estados</option>
        <option value="active">Activas</option>
        <option value="pending">Pendientes</option>
        <option value="inactive">Suspendidas</option>
        <option value="internal">Internas</option>
      </select>

      <button
        type="button"
        class="h-10 rounded-lg border border-[#cfd7e3] bg-white px-3 text-[10px] font-black text-[#102372] transition hover:border-[#102372]/40 hover:bg-[#f6f8fb]"
        @click="$emit('clear-filters')"
      >
        Limpiar
      </button>
    </div>
  </section>
</template>

<script setup>
import { computed } from "vue"

const props = defineProps({
  searchTerm: {
    type: String,
    default: "",
  },
  selectedStatus: {
    type: String,
    default: "all",
  },
})

const emit = defineEmits(["update:searchTerm", "update:selectedStatus", "clear-filters"])

const searchModel = computed({
  get: () => props.searchTerm,
  set: (value) => emit("update:searchTerm", value),
})

const statusModel = computed({
  get: () => props.selectedStatus,
  set: (value) => emit("update:selectedStatus", value),
})
</script>
