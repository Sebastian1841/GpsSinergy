<template>
  <section
    class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white"
  >
    <header
      class="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-5 py-3.5"
    >
      <div class="flex items-center gap-2">
        <h2 class="text-sm font-bold text-[#102372]">Actividad</h2>

        <span class="text-xs font-medium text-slate-400">
          - {{ filteredCount }}
          {{ filteredCount === 1 ? "registro" : "registros" }}
        </span>
      </div>

      <div class="hidden items-center gap-4 sm:flex">
        <span
          v-for="status in statusOptions"
          :key="status"
          class="inline-flex items-center gap-1.5 text-[10px] font-medium text-slate-500"
        >
          <span class="h-1.5 w-1.5 rounded-full" :class="getStatusDotClass(status)"></span>

          {{ getStatusLabel(status) }}
        </span>
      </div>
    </header>

    <div v-if="filteredCount" class="min-h-0 flex-1 overflow-auto">
      <div class="min-w-[1050px]">
        <div
          class="sticky top-0 z-20 grid items-center gap-3 border-b border-slate-200 bg-white px-5 py-2.5"
          style="
            grid-template-columns:
              80px
              120px
              minmax(240px, 1.5fr)
              minmax(160px, 1fr)
              minmax(180px, 1fr)
              110px
              24px;
          "
        >
          <span class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Hora
          </span>

          <span class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Modulo
          </span>

          <span class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Accion
          </span>

          <span class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Responsable
          </span>

          <span class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Entidad
          </span>

          <span class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Estado
          </span>

          <span></span>
        </div>

        <section v-for="group in groupedRecords" :key="group.dateKey">
          <div
            class="sticky top-[37px] z-10 flex items-center gap-2.5 border-b border-slate-200 bg-slate-50 px-5 py-2"
          >
            <svg
              class="h-3.5 w-3.5 text-slate-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>

            <p class="text-xs font-semibold capitalize text-slate-700">
              {{ group.label }}
            </p>

            <span
              class="inline-flex min-w-6 items-center justify-center rounded-full bg-slate-200/70 px-2 py-0.5 text-[10px] font-semibold text-slate-500"
            >
              {{ group.records.length }}
            </span>
          </div>

          <button
            v-for="record in group.records"
            :key="record.id"
            class="grid w-full items-center gap-3 border-b border-slate-100 px-5 py-2.5 text-left transition last:border-b-0 hover:bg-slate-50"
            :class="{
              'bg-orange-50/50': selectedRecordId === record.id,
            }"
            style="
              grid-template-columns:
                80px
                120px
                minmax(240px, 1.5fr)
                minmax(160px, 1fr)
                minmax(180px, 1fr)
                110px
                24px;
            "
            type="button"
            @click="emit('select-record', record.id)"
          >
            <span class="font-mono text-[11px] font-medium text-slate-600">
              {{ formatTime(record.timestamp) }}
            </span>

            <span
              class="inline-flex w-fit rounded-md bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600"
            >
              {{ getModuleLabel(record.module) }}
            </span>

            <span class="min-w-0">
              <span class="block truncate text-xs font-semibold text-[#102372]">
                {{ getActionLabel(record.action) }}
              </span>

              <span class="mt-0.5 block truncate text-[10px] text-slate-400">
                {{ record.description || "Sin descripcion" }}
              </span>
            </span>

            <span class="min-w-0">
              <span class="block truncate text-xs font-medium text-slate-700">
                {{ record.actorName || "Sin usuario" }}
              </span>

              <span class="mt-0.5 block truncate text-[10px] text-slate-400">
                {{ getRecordCompanyName(record) || "Sin empresa" }}
              </span>
            </span>

            <span class="min-w-0">
              <span class="block truncate text-xs font-medium text-slate-700">
                {{ record.entityName || "Sin entidad" }}
              </span>

              <span class="mt-0.5 block truncate text-[10px] text-slate-400">
                {{ record.entityType || "Sin tipo" }}
              </span>
            </span>

            <span
              class="inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold"
              :class="getStatusClass(record.status)"
            >
              <span
                class="h-1.5 w-1.5 rounded-full"
                :class="getStatusDotClass(record.status)"
              ></span>

              {{ getStatusLabel(record.status) }}
            </span>

            <svg
              class="h-3.5 w-3.5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </section>
      </div>
    </div>

    <div v-else class="flex min-h-0 flex-1 items-center justify-center px-6 py-12 text-center">
      <div>
        <h3 class="text-sm font-semibold text-[#102372]">Sin registros</h3>

        <p class="mt-1 text-xs text-slate-500">
          No se encontraron eventos para los filtros seleccionados.
        </p>

        <button
          v-if="hasActiveFilters"
          class="mt-3 text-xs font-semibold text-[#ff6600] transition hover:text-[#e65c00]"
          type="button"
          @click="emit('clear-filters')"
        >
          Limpiar filtros
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  filteredCount: {
    type: Number,
    default: 0,
  },
  formatTime: {
    type: Function,
    required: true,
  },
  getActionLabel: {
    type: Function,
    required: true,
  },
  getModuleLabel: {
    type: Function,
    required: true,
  },
  getRecordCompanyName: {
    type: Function,
    required: true,
  },
  getStatusClass: {
    type: Function,
    required: true,
  },
  getStatusDotClass: {
    type: Function,
    required: true,
  },
  getStatusLabel: {
    type: Function,
    required: true,
  },
  groupedRecords: {
    type: Array,
    default: () => [],
  },
  hasActiveFilters: {
    type: Boolean,
    default: false,
  },
  selectedRecordId: {
    type: [String, Number],
    default: "",
  },
  statusOptions: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(["clear-filters", "select-record"])
</script>
