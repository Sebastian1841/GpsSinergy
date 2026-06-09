<template>
  <div class="relative shrink-0">
    <button
      type="button"
      class="flex h-[36px] w-[36px] cursor-pointer items-center justify-center rounded-lg border bg-[#f8fafc] text-[#102372] transition hover:bg-white hover:text-[#FF6600]"
      :class="isOpen ? 'border-[#FF6600] bg-[#fff7ed] text-[#FF6600]' : 'border-[#d8dee8]'"
      :title="buttonTitle"
      @click.stop="$emit('toggle')"
    >
      <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" aria-hidden="true">
        <path
          d="M4.75 6.75h14.5L14 12.5v4.75l-4 1.75v-6.5L4.75 6.75Z"
          stroke="currentColor"
          stroke-width="2"
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <div
      v-if="isOpen"
      class="absolute right-0 top-[42px] z-50 w-[270px] overflow-hidden rounded-xl border border-[#d8dee8] bg-white shadow-2xl"
      @click.stop
      @pointerdown.stop
    >
      <div class="border-b border-[#edf1f5] bg-[#f8fafc] px-3 py-2">
        <div class="flex items-center justify-between gap-2">
          <div class="min-w-0">
            <p class="truncate text-[10px] font-black uppercase tracking-[0.12em] text-[#102372]">
              {{ title }}
            </p>

            <p class="mt-0.5 text-[10px] font-semibold text-slate-500">
              {{ visibleColumns.length }} de {{ configurableColumns.length }} activas
            </p>
          </div>

          <button
            type="button"
            class="cursor-pointer rounded-md px-2 py-1 text-[10px] font-black text-[#FF6600] transition hover:bg-white hover:text-[#102372]"
            @click="$emit('reset')"
          >
            Restaurar
          </button>
        </div>

        <div class="relative mt-2">
          <span
            class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
          >
            <svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" aria-hidden="true">
              <path
                d="m20 20-4.35-4.35M18 10.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          </span>

          <input
            :value="search"
            type="text"
            placeholder="Buscar variable o columna..."
            class="h-8 w-full rounded-lg border border-[#d8dee8] bg-white pl-8 pr-7 text-[11px] font-semibold text-[#172033] outline-none placeholder:text-slate-400 focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10"
            @input="$emit('update-search', $event.target.value)"
          />

          <button
            v-if="search"
            type="button"
            class="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer text-[14px] leading-none text-slate-400 transition hover:text-[#FF6600]"
            @click="$emit('update-search', '')"
          >
            &times;
          </button>
        </div>
      </div>

      <div class="max-h-[250px] overflow-auto p-2">
        <label
          v-for="column in filteredConfigurableColumns"
          :key="column.key"
          class="flex cursor-pointer items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 text-[11px] font-bold text-slate-600 transition hover:border-[#FF6600]/30 hover:bg-[#fff7ed] hover:text-[#102372]"
          :class="column.locked ? 'opacity-80' : ''"
        >
          <input
            :checked="visibleColumnKeys.includes(column.key)"
            type="checkbox"
            :value="column.key"
            class="h-3.5 w-3.5 cursor-pointer accent-[#FF6600]"
            :disabled="column.locked"
            @change="$emit('toggle-column', column.key)"
          />

          <span class="min-w-0 flex-1 truncate">
            {{ column.label }}
          </span>

          <span
            v-if="column.locked"
            class="shrink-0 rounded-md bg-[#eef3ff] px-1.5 py-0.5 text-[9px] font-black text-[#102372]"
          >
            fija
          </span>
        </label>

        <div v-if="!filteredConfigurableColumns.length" class="px-2 py-5 text-center">
          <p class="text-[11px] font-black text-[#102372]">Sin columnas encontradas</p>

          <p class="mt-1 text-[10px] font-semibold text-slate-500">
            Prueba buscando por nombre de variable.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  visibleColumns: {
    type: Array,
    default: () => [],
  },
  configurableColumns: {
    type: Array,
    default: () => [],
  },
  filteredConfigurableColumns: {
    type: Array,
    default: () => [],
  },
  visibleColumnKeys: {
    type: Array,
    default: () => [],
  },
  search: {
    type: String,
    default: "",
  },
  title: {
    type: String,
    default: "Columnas visibles",
  },
  buttonTitle: {
    type: String,
    default: "Filtrar columnas visibles",
  },
})

defineEmits(["toggle", "reset", "update-search", "toggle-column"])
</script>
