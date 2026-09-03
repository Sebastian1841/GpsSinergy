<template>
  <section class="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
    <!-- REGISTROS -->
    <div v-if="filteredCount" class="min-h-0 flex-1 overflow-auto bg-white">
      <section
        v-for="group in groupedRecords"
        :key="group.dateKey"
        class="border-b border-[#e5eaf1] last:border-b-0"
      >
        <!-- FECHA -->
        <button
          type="button"
          class="flex h-[52px] w-full items-center gap-3 bg-white px-5 text-left transition hover:bg-[#fafbfc]"
          @click="toggleGroup(group.dateKey)"
        >
          <svg
            class="h-4 w-4 shrink-0 text-[#102372] transition-transform duration-150"
            :class="isGroupExpanded(group.dateKey) ? 'rotate-0' : '-rotate-90'"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 9l6 6 6-6"
            />
          </svg>

          <span class="min-w-0 flex-1 truncate text-[13px] font-black capitalize text-[#102372]">
            {{ group.label }}
          </span>

          <span
            class="shrink-0 rounded-full bg-[#f1f4f8] px-2.5 py-1 text-[10px] font-black text-slate-500"
          >
            {{ group.records.length }}
            {{ group.records.length === 1 ? "evento" : "eventos" }}
          </span>
        </button>

        <!-- EVENTOS -->
        <div v-if="isGroupExpanded(group.dateKey)" class="border-t border-[#e8edf3]">
          <button
            v-for="record in group.records"
            :key="record.id"
            type="button"
            class="group relative grid w-full grid-cols-[20px_76px_minmax(0,1fr)_24px] items-center gap-3 border-b border-[#edf1f5] px-5 py-3.5 text-left transition last:border-b-0 hover:bg-[#f8fafc] lg:grid-cols-[20px_82px_minmax(260px,1fr)_170px_115px_110px_24px]"
            :class="
              String(selectedRecordId) === String(record.id)
                ? 'bg-[#f6f8ff] shadow-[inset_3px_0_0_#102372]'
                : 'bg-white'
            "
            @click="emit('select-record', record.id)"
          >
            <!-- PUNTO -->
            <span class="flex items-center justify-center">
              <span
                class="h-2 w-2 rounded-full"
                :class="
                  String(selectedRecordId) === String(record.id) ? 'bg-[#102372]' : 'bg-[#d6dee9]'
                "
              ></span>
            </span>

            <!-- HORA -->
            <span class="font-mono text-[11px] font-semibold text-slate-500">
              {{ formatTime(record.timestamp) }}
            </span>

            <!-- ACCIÓN / ENTIDAD -->
            <span class="min-w-0">
              <span class="block truncate text-[13px] font-black text-[#102372]">
                {{ getActionLabel(record.action) }}
              </span>

              <span
                class="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] font-semibold text-slate-400"
              >
                <span class="truncate">
                  Entidad:
                  <strong class="font-bold text-slate-500">
                    {{ record.entityName || "-" }}
                  </strong>
                </span>

                <span class="text-slate-300">•</span>

                <span class="truncate">
                  Tipo:
                  <strong class="font-bold text-slate-500">
                    {{ record.entityType || "-" }}
                  </strong>
                </span>
              </span>

              <!-- MOBILE -->
              <span class="mt-2 flex flex-wrap items-center gap-2 lg:hidden">
                <span class="text-[10px] font-bold text-slate-500">
                  {{ record.actorName || "Sin usuario" }}
                </span>

                <span
                  class="rounded-md bg-[#eef1ff] px-2 py-0.5 text-[10px] font-black text-[#102372]"
                >
                  {{ getModuleLabel(record.module) }}
                </span>

                <span
                  class="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-black"
                  :class="getStatusClass(record.status)"
                >
                  <span
                    class="h-1.5 w-1.5 rounded-full"
                    :class="getStatusDotClass(record.status)"
                  ></span>

                  {{ getStatusLabel(record.status) }}
                </span>
              </span>
            </span>

            <!-- RESPONSABLE -->
            <span class="hidden min-w-0 items-center gap-2.5 lg:flex">
              <span
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eef2f8] text-[10px] font-black text-[#102372]"
              >
                {{ getInitials(record.actorName) }}
              </span>

              <span class="min-w-0">
                <span class="block truncate text-[12px] font-black text-[#172033]">
                  {{ record.actorName || "Sin usuario" }}
                </span>

                <span class="mt-0.5 block truncate text-[10px] font-semibold text-slate-400">
                  {{ getRecordCompanyName(record) || "Sin empresa" }}
                </span>
              </span>
            </span>

            <!-- MÓDULO -->
            <span class="hidden lg:block">
              <span
                class="inline-flex rounded-md bg-[#eef1ff] px-2.5 py-1 text-[10px] font-black text-[#102372]"
              >
                {{ getModuleLabel(record.module) }}
              </span>
            </span>

            <!-- ESTADO -->
            <span class="hidden lg:block">
              <span
                class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-black"
                :class="getStatusClass(record.status)"
              >
                <span
                  class="h-1.5 w-1.5 rounded-full"
                  :class="getStatusDotClass(record.status)"
                ></span>

                {{ getStatusLabel(record.status) }}
              </span>
            </span>

            <!-- FLECHA -->
            <span
              class="flex items-center justify-end text-[20px] font-light text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#102372]"
            >
              ›
            </span>
          </button>
        </div>
      </section>
    </div>

    <!-- SIN REGISTROS -->
    <div
      v-else
      class="flex min-h-0 flex-1 items-center justify-center bg-white px-6 py-12 text-center"
    >
      <div>
        <h3 class="text-[14px] font-black text-[#102372]">Sin registros</h3>

        <p class="mt-1 text-[12px] font-semibold text-slate-500">
          No se encontraron eventos para los filtros seleccionados.
        </p>

        <button
          v-if="hasActiveFilters"
          type="button"
          class="mt-3 text-[12px] font-black text-[#ff6600] transition hover:text-[#e65c00]"
          @click="emit('clear-filters')"
        >
          Limpiar filtros
        </button>
      </div>
    </div>

    <!-- PAGINACIÓN -->
    <footer
      v-if="filteredCount && pageCount > 1"
      class="flex shrink-0 items-center justify-between gap-3 border-t border-[#e5eaf1] bg-white px-5 py-3"
    >
      <p class="text-[11px] font-semibold text-slate-400">
        Mostrando {{ pageStart }}-{{ pageEnd }} de {{ filteredCount }}
      </p>

      <div class="flex items-center gap-2">
        <button
          type="button"
          class="h-8 rounded-lg border border-[#d8dee8] bg-white px-3 text-[11px] font-black text-[#102372] transition hover:border-[#102372] disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="page <= 1"
          @click="emit('previous-page')"
        >
          Anterior
        </button>

        <span class="px-1 text-[11px] font-black text-slate-500">
          {{ page }} / {{ pageCount }}
        </span>

        <button
          type="button"
          class="h-8 rounded-lg border border-[#d8dee8] bg-white px-3 text-[11px] font-black text-[#102372] transition hover:border-[#102372] disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="page >= pageCount"
          @click="emit('next-page')"
        >
          Siguiente
        </button>
      </div>
    </footer>
  </section>
</template>

<script setup>
import { ref, watch } from "vue"

const props = defineProps({
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
  page: {
    type: Number,
    default: 1,
  },
  pageCount: {
    type: Number,
    default: 1,
  },
  pageEnd: {
    type: Number,
    default: 0,
  },
  pageStart: {
    type: Number,
    default: 0,
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

const emit = defineEmits(["clear-filters", "next-page", "previous-page", "select-record"])

const expandedGroups = ref(new Set())

const syncExpandedGroups = () => {
  const availableKeys = props.groupedRecords.map((group) => {
    return String(group.dateKey)
  })

  const nextExpanded = new Set(
    [...expandedGroups.value].filter((key) => {
      return availableKeys.includes(String(key))
    }),
  )

  if (!nextExpanded.size && availableKeys.length) {
    nextExpanded.add(availableKeys[0])
  }

  expandedGroups.value = nextExpanded
}

const toggleGroup = (dateKey) => {
  const key = String(dateKey)
  const nextExpanded = new Set(expandedGroups.value)

  if (nextExpanded.has(key)) {
    nextExpanded.delete(key)
  } else {
    nextExpanded.add(key)
  }

  expandedGroups.value = nextExpanded
}

const isGroupExpanded = (dateKey) => {
  return expandedGroups.value.has(String(dateKey))
}

const getInitials = (name) => {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (!parts.length) return "?"

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase()
  }

  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase()
}

watch(() => props.groupedRecords.map((group) => String(group.dateKey)), syncExpandedGroups, {
  immediate: true,
})
</script>
