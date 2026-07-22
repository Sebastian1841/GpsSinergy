<template>
  <div class="shrink-0 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-5">
    <div class="grid grid-cols-2 gap-2 md:grid-cols-4">
      <div
        v-for="metric in metrics"
        :key="metric.label"
        class="rounded-lg border border-slate-200 bg-white px-3 py-2"
      >
        <p class="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
          {{ metric.label }}
        </p>

        <p
          class="mt-1 text-[20px] font-black leading-none"
          :class="metric.orange ? 'text-[#FF6600]' : 'text-[#102372]'"
        >
          {{ metric.value }}
        </p>
      </div>
    </div>

    <div class="mt-3 grid gap-2 lg:grid-cols-[1fr_180px_auto] lg:items-center">
      <div class="relative">
        <input
          :value="searchTerm"
          type="search"
          placeholder="Buscar por patente, vehiculo, conductor o evento..."
          class="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#102372]"
          @input="$emit('update:searchTerm', $event.target.value.trim())"
        />
      </div>

      <select
        :value="datePreset"
        class="h-10 cursor-pointer rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-black text-slate-700 outline-none transition focus:border-[#102372]"
        @change="$emit('update:datePreset', $event.target.value)"
      >
        <option value="all">Todas las fechas</option>
        <option value="today">Hoy</option>
        <option value="7d">Ultimos 7 dias</option>
        <option value="30d">Ultimos 30 dias</option>
        <option value="custom">Personalizado</option>
      </select>

      <div class="flex gap-2">
        <template v-if="datePreset === 'custom'">
          <input
            :value="dateFrom"
            type="date"
            class="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-bold text-slate-700 outline-none transition focus:border-[#102372] lg:w-[140px]"
            @input="$emit('update:dateFrom', $event.target.value)"
          />

          <input
            :value="dateTo"
            type="date"
            class="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-bold text-slate-700 outline-none transition focus:border-[#102372] lg:w-[140px]"
            @input="$emit('update:dateTo', $event.target.value)"
          />
        </template>

        <button
          type="button"
          class="h-10 shrink-0 cursor-pointer rounded-lg border border-slate-200 bg-white px-4 text-[11px] font-black text-[#102372] transition hover:border-[#FF6600] hover:text-[#FF6600]"
          @pointerdown.stop
          @click.stop="$emit('clear-filters')"
        >
          Limpiar
        </button>
      </div>
    </div>

    <div class="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <p class="text-[10px] font-bold text-slate-400">
        {{ paginationStart }}-{{ paginationEnd }} de {{ totalItems }} registros
      </p>

      <div class="flex flex-wrap items-center gap-2">
        <label
          class="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.08em] text-slate-400"
        >
          Filas
          <select
            :value="pageSize"
            class="h-8 cursor-pointer rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-black text-slate-700 outline-none transition focus:border-[#102372]"
            @change="$emit('update:pageSize', Number($event.target.value))"
          >
            <option v-for="option in pageSizeOptions" :key="option" :value="option">
              {{ option }}
            </option>
          </select>
        </label>

        <div class="flex items-center gap-1">
          <button
            type="button"
            class="h-8 cursor-pointer rounded-lg border border-slate-200 bg-white px-3 text-[10px] font-black text-[#102372] transition hover:border-[#FF6600] hover:text-[#FF6600] disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="currentPage <= 1"
            @pointerdown.stop
            @click.stop="$emit('update:currentPage', currentPage - 1)"
          >
            Ant.
          </button>

          <span class="min-w-[72px] text-center text-[10px] font-black text-slate-500">
            {{ currentPage }} / {{ totalPages }}
          </span>

          <button
            type="button"
            class="h-8 cursor-pointer rounded-lg border border-slate-200 bg-white px-3 text-[10px] font-black text-[#102372] transition hover:border-[#FF6600] hover:text-[#FF6600] disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="currentPage >= totalPages"
            @pointerdown.stop
            @click.stop="$emit('update:currentPage', currentPage + 1)"
          >
            Sig.
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  metrics: {
    type: Array,
    default: () => [],
  },
  searchTerm: {
    type: String,
    default: "",
  },
  datePreset: {
    type: String,
    default: "all",
  },
  dateFrom: {
    type: String,
    default: "",
  },
  dateTo: {
    type: String,
    default: "",
  },
  paginationStart: {
    type: Number,
    default: 0,
  },
  paginationEnd: {
    type: Number,
    default: 0,
  },
  totalItems: {
    type: Number,
    default: 0,
  },
  currentPage: {
    type: Number,
    default: 1,
  },
  totalPages: {
    type: Number,
    default: 1,
  },
  pageSize: {
    type: Number,
    default: 50,
  },
  pageSizeOptions: {
    type: Array,
    default: () => [],
  },
})

defineEmits([
  "clear-filters",
  "update:currentPage",
  "update:dateFrom",
  "update:datePreset",
  "update:dateTo",
  "update:pageSize",
  "update:searchTerm",
])
</script>
