<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[2147483640] flex items-center justify-center bg-slate-950/55 p-4"
      @mousedown.self="emit('close')"
    >
      <div
        class="flex h-[min(88vh,760px)] w-full max-w-[860px] flex-col overflow-hidden rounded-2xl border border-[#d8dee8] bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <!-- HEADER -->
        <header
          class="flex shrink-0 items-start justify-between gap-4 border-b border-[#e7ebf0] px-5 py-4"
        >
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <h3 class="text-[15px] font-black text-[#102372]">
                {{ modalTitle }}
              </h3>

              <span
                class="rounded-full bg-[#fff1e8] px-2 py-0.5 text-[8px] font-black text-[#FF6600]"
              >
                ETIQUETAS
              </span>
            </div>

            <p class="mt-1 text-[10px] font-semibold text-slate-500">
              {{ modalDescription }}
            </p>
          </div>

          <button
            type="button"
            class="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-[21px] leading-none text-slate-400 hover:bg-slate-100 hover:text-[#102372]"
            aria-label="Cerrar"
            @click="emit('close')"
          >
            x
          </button>
        </header>

        <!-- CUERPO -->
        <main class="flex min-h-0 flex-1 flex-col p-5">
          <label class="shrink-0">
            <span class="text-[10px] font-black text-[#172033]"> Nombre de la etiqueta </span>

            <input
              v-model="name"
              type="text"
              maxlength="80"
              class="mt-2 h-10 w-full rounded-lg border border-[#cbd5e1] bg-white px-3 text-[11px] font-semibold text-[#172033] outline-none placeholder:text-slate-400 focus:border-[#102372] focus:ring-2 focus:ring-[#102372]/10"
              placeholder="Ej. Faena Norte"
            />
          </label>

          <section class="mt-5 flex min-h-0 flex-1 flex-col">
            <!-- TITULO ACTIVOS -->
            <div class="flex shrink-0 items-center justify-between gap-4">
              <div>
                <p class="text-[10px] font-black text-[#172033]">Activos incluidos</p>

                <p class="mt-0.5 text-[9px] font-semibold text-slate-500">
                  Busca, filtra y selecciona los activos de la etiqueta.
                </p>
              </div>

              <div class="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#eef3ff] px-2.5 py-1.5">
                <span class="text-[11px] font-black text-[#102372]">
                  {{ selectedCount }}
                </span>

                <span class="text-[8px] font-bold text-[#102372]/70">
                  {{ selectionLabel }}
                </span>
              </div>
            </div>

            <template v-if="assets.length">
              <!-- BUSCADOR -->
              <div class="relative mt-3 shrink-0">
                <svg
                  viewBox="0 0 24 24"
                  class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="m20 20-4.35-4.35M18 10.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                  />
                </svg>

                <input
                  v-model="search"
                  type="search"
                  autocomplete="off"
                  class="h-10 w-full rounded-lg border border-[#d8dee8] bg-white pl-9 pr-3 text-[10px] font-semibold text-[#172033] outline-none placeholder:text-slate-400 focus:border-[#102372] focus:ring-2 focus:ring-[#102372]/10"
                  placeholder="Buscar por nombre, patente, IMEI o modelo GPS..."
                />
              </div>

              <!-- FILTROS -->
              <div class="mt-3 flex shrink-0 flex-wrap items-center justify-between gap-2">
                <div
                  class="inline-flex flex-wrap rounded-lg border border-[#d8dee8] bg-[#f8fafc] p-1"
                >
                  <button
                    v-for="option in filterOptions"
                    :key="option.value"
                    type="button"
                    class="h-7 rounded-md px-3 text-[9px] font-black"
                    :class="
                      filter === option.value
                        ? 'bg-[#102372] text-white shadow-sm'
                        : 'text-slate-500 hover:text-[#102372]'
                    "
                    @click="setFilter(option.value)"
                  >
                    {{ option.label }}

                    <span v-if="option.value !== 'unselected'" class="ml-1 opacity-70">
                      {{ option.value === "selected" ? selectedCount : assets.length }}
                    </span>
                  </button>
                </div>

                <button
                  v-if="selectedCount"
                  type="button"
                  class="h-7 cursor-pointer px-2 text-[9px] font-black text-slate-500 hover:text-[#FF6600]"
                  @click="clearSelection"
                >
                  Limpiar seleccion
                </button>
              </div>

              <!-- RESUMEN -->
              <div class="mt-3 flex min-h-[28px] shrink-0 items-center justify-between gap-3">
                <p class="text-[9px] font-semibold text-slate-400">
                  {{ resultLabel }}
                </p>

                <button
                  v-if="pageAssets.length"
                  type="button"
                  class="cursor-pointer text-[9px] font-black text-[#102372] hover:text-[#FF6600]"
                  @click="toggleCurrentPageSelection"
                >
                  {{ currentPageFullySelected ? "Quitar pagina" : "Seleccionar pagina" }}
                </button>
              </div>

              <!-- TABLA -->
              <div
                class="mt-2 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#d8dee8] bg-white"
              >
                <!-- CABECERA -->
                <div
                  class="hidden min-h-[36px] shrink-0 grid-cols-[38px_minmax(180px,1.25fr)_minmax(220px,1fr)_110px] items-center gap-3 border-b border-[#d8dee8] bg-[#f8fafc] px-3 sm:grid"
                >
                  <span></span>

                  <span class="text-[8px] font-black uppercase tracking-[0.08em] text-slate-400">
                    Activo
                  </span>

                  <span class="text-[8px] font-black uppercase tracking-[0.08em] text-slate-400">
                    Identificacion
                  </span>

                  <span class="text-[8px] font-black uppercase tracking-[0.08em] text-slate-400">
                    Tipo
                  </span>
                </div>

                <!-- FILAS -->
                <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                  <label
                    v-for="activo in pageAssets"
                    :key="activo.id"
                    v-memo="[activo.id, isSelected(activo.id)]"
                    class="grid min-h-[52px] cursor-pointer grid-cols-[28px_minmax(0,1fr)] items-center gap-2 border-b border-[#edf1f5] px-3 py-2 transition last:border-b-0 hover:bg-[#f8fafc] sm:grid-cols-[38px_minmax(180px,1.25fr)_minmax(220px,1fr)_110px] sm:gap-3"
                    :class="isSelected(activo.id) ? 'bg-[#f4f6ff]' : 'bg-white'"
                  >
                    <!-- CHECKBOX -->
                    <div class="flex items-center justify-center">
                      <input
                        type="checkbox"
                        class="h-4 w-4 shrink-0 cursor-pointer rounded border-[#cbd5e1] accent-[#102372]"
                        :checked="isSelected(activo.id)"
                        @change="toggleAsset(activo.id)"
                      />
                    </div>

                    <!-- ACTIVO -->
                    <div class="min-w-0">
                      <p class="truncate text-[10px] font-black text-[#172033]">
                        {{ activo.displayName }}
                      </p>

                      <p
                        v-if="activo.secondaryLabel"
                        class="mt-0.5 truncate text-[8px] font-semibold text-slate-400 sm:hidden"
                      >
                        {{ activo.secondaryLabel }}
                      </p>
                    </div>

                    <!-- IDENTIFICACION -->
                    <div class="hidden min-w-0 sm:block">
                      <p
                        class="truncate text-[9px] font-semibold text-slate-500"
                        :title="activo.secondaryLabel"
                      >
                        {{ activo.secondaryLabel || "Sin informacion" }}
                      </p>
                    </div>

                    <!-- TIPO -->
                    <div class="hidden min-w-0 sm:flex">
                      <span
                        v-if="activo.typeLabel"
                        class="max-w-full truncate rounded-md bg-[#eef3ff] px-2 py-1 text-[8px] font-black text-[#102372]"
                        :title="activo.typeLabel"
                      >
                        {{ activo.typeLabel }}
                      </span>

                      <span v-else class="text-[9px] font-semibold text-slate-300"> - </span>
                    </div>
                  </label>

                  <!-- SIN RESULTADOS -->
                  <div
                    v-if="!pageAssets.length"
                    class="flex min-h-[180px] items-center justify-center px-4 py-8 text-center"
                  >
                    <div>
                      <p class="text-[10px] font-black text-[#102372]">
                        {{ emptyTitle }}
                      </p>

                      <p class="mt-1 text-[9px] font-semibold text-slate-500">
                        {{ emptyDescription }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- PAGINACIÓN -->
              <div
                v-if="filteredAssets.length"
                class="mt-3 flex min-h-[34px] shrink-0 items-center justify-between gap-3"
              >
                <p class="text-[9px] font-semibold text-slate-400">
                  {{ firstVisibleAsset }}-{{ lastVisibleAsset }} de {{ filteredAssets.length }}
                </p>

                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    class="flex h-7 w-7 items-center justify-center rounded-lg border border-[#d8dee8] bg-white text-[14px] font-bold text-[#102372] transition hover:border-[#102372] disabled:cursor-not-allowed disabled:opacity-30"
                    :disabled="page <= 1"
                    @click="previousPage"
                  >
                    &lt;
                  </button>

                  <span
                    class="flex h-7 min-w-[68px] items-center justify-center rounded-lg bg-[#eef3ff] px-2 text-[9px] font-black text-[#102372]"
                  >
                    {{ page }} / {{ totalPages }}
                  </span>

                  <button
                    type="button"
                    class="flex h-7 w-7 items-center justify-center rounded-lg border border-[#d8dee8] bg-white text-[14px] font-bold text-[#102372] transition hover:border-[#102372] disabled:cursor-not-allowed disabled:opacity-30"
                    :disabled="page >= totalPages"
                    @click="nextPage"
                  >
                    &gt;
                  </button>
                </div>
              </div>
            </template>

            <!-- SIN ACTIVOS -->
            <div
              v-else
              class="mt-3 flex min-h-[180px] items-center justify-center rounded-xl border border-dashed border-[#cbd5e1] bg-[#f8fafc] text-center"
            >
              <div>
                <p class="text-[10px] font-black text-[#102372]">No hay activos disponibles</p>

                <p class="mt-1 text-[9px] font-semibold text-slate-500">
                  Actualmente no existen activos que puedan asignarse.
                </p>
              </div>
            </div>
          </section>
        </main>

        <!-- FOOTER -->
        <footer
          class="flex min-h-[64px] shrink-0 items-center justify-between gap-3 border-t border-[#d8dee8] bg-[#f8fafc] px-5"
        >
          <p class="hidden text-[9px] font-semibold text-slate-400 sm:block">
            La seleccion se mantiene aunque cambies de pagina.
          </p>

          <div class="ml-auto flex items-center gap-2">
            <button
              type="button"
              class="h-9 rounded-lg border border-[#d8dee8] bg-white px-4 text-[10px] font-black text-[#102372] hover:border-[#102372]"
              @click="emit('close')"
            >
              Cancelar
            </button>

            <button
              type="button"
              class="h-9 rounded-lg bg-[#FF6600] px-4 text-[10px] font-black text-white hover:bg-[#e95d00] disabled:bg-slate-300"
              :disabled="!name.trim()"
              @click="save"
            >
              {{ saveLabel }}
            </button>
          </div>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from "vue"

import { useFleetAssetTagModal } from "../../../composables/activos/fleet/useFleetAssetTagModal.js"

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  mode: {
    type: String,
    default: "create",
  },
  tagName: {
    type: String,
    default: "",
  },
  assets: {
    type: Array,
    default: () => [],
  },
  selectedAssetIds: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(["close", "save"])

const filterOptions = [
  { value: "all", label: "Todos" },
  { value: "selected", label: "Seleccionados" },
  { value: "unselected", label: "No seleccionados" },
]

const {
  name,
  search,
  filter,
  page,
  selectedCount,
  filteredAssets,
  pageAssets,
  totalPages,
  firstVisibleAsset,
  lastVisibleAsset,
  currentPageFullySelected,
  isSelected,
  setFilter,
  toggleAsset,
  clearSelection,
  toggleCurrentPageSelection,
  previousPage,
  nextPage,
  save,
} = useFleetAssetTagModal({ props, emit })

const modalTitle = computed(() => {
  return props.mode === "create" ? "Nueva etiqueta" : "Editar etiqueta"
})

const modalDescription = computed(() => {
  return props.mode === "create"
    ? "Crea una etiqueta y asigna los activos que necesites."
    : "Modifica el nombre o los activos asociados."
})

const saveLabel = computed(() => {
  return props.mode === "create" ? "Crear etiqueta" : "Guardar cambios"
})

const selectionLabel = computed(() => {
  return selectedCount.value === 1 ? "seleccionado" : "seleccionados"
})

const resultLabel = computed(() => {
  const count = filteredAssets.value.length

  return `${count} ${count === 1 ? "activo encontrado" : "activos encontrados"}`
})

const emptyTitle = computed(() => {
  if (filter.value === "selected") {
    return "No hay activos seleccionados"
  }

  if (filter.value === "unselected") {
    return "No hay activos sin seleccionar"
  }

  return "Sin resultados"
})

const emptyDescription = computed(() => {
  if (search.value.trim()) {
    return "Prueba utilizando otro termino de busqueda."
  }

  if (filter.value === "selected") {
    return "Los activos que selecciones aparecerán aquí."
  }

  return "No hay activos disponibles en esta vista."
})
</script>
