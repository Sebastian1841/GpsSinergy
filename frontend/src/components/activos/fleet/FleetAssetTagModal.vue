<template>
  <Teleport to="body">
    <dialog
      v-if="open"
      ref="dialog"
      class="tag-modal"
      role="dialog"
      aria-labelledby="tag-modal-title"
      aria-describedby="tag-modal-description"
      @cancel.prevent="emit('close')"
      @click="closeOnBackdrop"
    >
      <header class="tag-modal-header">
        <div>
          <div class="tag-modal-title">
            <h2 id="tag-modal-title">{{ modalTitle }}</h2>
            <span>ETIQUETAS</span>
          </div>
          <p id="tag-modal-description">{{ modalDescription }}</p>
        </div>
        <button
          type="button"
          class="tag-modal-icon"
          aria-label="Cerrar"
          title="Cerrar"
          @click="emit('close')"
        >
          <SvgIcon name="close" />
        </button>
      </header>
      <main class="tag-modal-body">
        <p v-if="saveError" class="tag-modal-save-error" role="alert">{{ saveError }}</p>
        <label class="tag-modal-name"><span>Nombre de la etiqueta</span><input
            v-model="name"
            type="text"
            maxlength="80"
            placeholder="Ej. Faena Norte"
            autofocus
            @keydown.enter.prevent="save"
        /></label>
        <section class="tag-modal-assets" aria-labelledby="tag-assets-title">
          <div class="tag-modal-assets-heading">
            <div>
              <h3 id="tag-assets-title">Activos incluidos</h3>
              <p>Busca, filtra y selecciona los activos de la etiqueta.</p>
            </div>
            <span class="tag-selection-count"><strong>{{ selectedCount }}</strong>{{ selectionLabel }}</span>
          </div>
          <template v-if="assets.length">
            <label class="tag-modal-search"><SvgIcon name="search" /><input
                v-model="search"
                type="search"
                autocomplete="off"
                aria-label="Buscar activos de la etiqueta"
                placeholder="Buscar por nombre, patente, IMEI o modelo GPS..."
            /></label>
            <div class="tag-modal-tools">
              <div class="tag-filter-options" role="group" aria-label="Filtrar activos">
                <button
                  v-for="option in filterOptions"
                  :key="option.value"
                  type="button"
                  :class="{ selected: filter === option.value }"
                  :aria-pressed="filter === option.value"
                  @click="setFilter(option.value)"
                >
                  {{ option.label
                  }}<span v-if="option.value !== 'unselected'">{{
                    option.value === "selected" ? selectedCount : assets.length
                  }}</span>
                </button>
              </div>
              <div class="tag-selection-actions">
                <button v-if="selectedCount" type="button" @click="clearSelection">
                  Limpiar selección</button><button
                  type="button"
                  :disabled="!pageAssets.length"
                  @click="toggleCurrentPageSelection"
                >
                  <SvgIcon name="tables" />{{
                    currentPageFullySelected ? "Quitar página" : "Seleccionar página"
                  }}
                </button>
              </div>
            </div>
            <div class="tag-modal-table" role="table" aria-label="Activos disponibles">
              <div class="tag-modal-table-head" role="row">
                <div role="columnheader">
                  <input
                    type="checkbox"
                    :checked="currentPageFullySelected"
                    :indeterminate="partiallySelected"
                    :disabled="!pageAssets.length"
                    aria-label="Seleccionar activos de esta página"
                    @change="toggleCurrentPageSelection"
                  />
                </div>
                <span role="columnheader">ACTIVO</span><span role="columnheader">IDENTIFICACIÓN</span><span role="columnheader">TIPO</span>
              </div>
              <div class="tag-modal-rows" role="rowgroup">
                <label
                  v-for="activo in pageAssets"
                  :key="activo.id"
                  class="tag-modal-row"
                  role="row"
                  :class="{ selected: isSelected(activo.id) }"
                >
                  <span role="cell"><input
                      type="checkbox"
                      :checked="isSelected(activo.id)"
                      :aria-label="'Seleccionar ' + activo.displayName"
                      @change="toggleAsset(activo.id)"
                  /></span>
                  <strong role="cell">{{ activo.displayName }}</strong><span role="cell" class="tag-asset-identification">{{
                    activo.secondaryLabel || "Sin información"
                  }}</span><span role="cell"><span class="tag-asset-type">{{ activo.typeLabel || "Sin tipo" }}</span></span>
                </label>
                <div v-if="!pageAssets.length" class="tag-modal-empty">
                  <strong>{{ emptyTitle }}</strong>
                  <p>{{ emptyDescription }}</p>
                </div>
              </div>
            </div>
            <nav class="tag-modal-pagination" aria-label="Paginación de activos">
              <span>{{ firstVisibleAsset }}-{{ lastVisibleAsset }} de {{ filteredAssets.length }}</span>
              <div>
                <button
                  type="button"
                  class="tag-modal-icon"
                  :disabled="page <= 1"
                  aria-label="Página anterior"
                  @click="previousPage"
                >
                  <SvgIcon name="chevron-left" /></button><strong>{{ page }} / {{ totalPages }}</strong><button
                  type="button"
                  class="tag-modal-icon"
                  :disabled="page >= totalPages"
                  aria-label="Página siguiente"
                  @click="nextPage"
                >
                  <SvgIcon name="chevron-right" />
                </button>
              </div>
            </nav>
          </template>
          <div v-else class="tag-modal-empty">
            <strong>No hay activos disponibles</strong>
            <p>Actualmente no existen activos que puedan asignarse.</p>
          </div>
        </section>
      </main>
      <footer class="tag-modal-footer">
        <p><SvgIcon name="detail-info" />La selección se mantiene aunque cambies de página.</p>
        <div>
          <button type="button" @click="emit('close')">Cancelar</button><button type="button" class="tag-modal-save" :disabled="!name.trim()" @click="save">
            {{ saveLabel }}
          </button>
        </div>
      </footer>
    </dialog>
  </Teleport>
</template>
<script setup>
import { computed, ref, watch, nextTick } from "vue"
import SvgIcon from "../../icons/SvgIcon.vue"

import { useFleetAssetTagModal } from "../../../composables/activos/fleet/useFleetAssetTagModal.js"

const props = defineProps({
  saveError: { type: String, default: "" },
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

const dialog = ref(null)
const partiallySelected = computed(
  () => !currentPageFullySelected.value && pageAssets.value.some((asset) => isSelected(asset.id)),
)
watch(
  () => props.open,
  async (open) => {
    if (!open) return
    await nextTick()
    if (dialog.value && !dialog.value.open) dialog.value.showModal()
  },
  { immediate: true },
)
const closeOnBackdrop = (event) => {
  if (event.target !== dialog.value) return
  const rect = dialog.value.getBoundingClientRect()
  if (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  )
    emit("close")
}
</script>
<style scoped>
.tag-modal {
  width: min(1100px, calc(100vw - 40px));
  height: min(940px, calc(100dvh - 48px));
  max-height: calc(100dvh - 48px);
  max-width: calc(100vw - 40px);
  padding: 0;
  margin: auto;
  border: 1px solid #d8dee8;
  border-radius: 8px;
  background: white;
  color: #102372;
  box-shadow: 0 20px 70px #0f172a40;
  overflow: hidden;
  font-size: 14px;
}
.tag-modal[open] {
  display: flex;
  flex-direction: column;
}
.tag-modal::backdrop {
  background: rgb(15 23 42 / 55%);
  backdrop-filter: blur(2px);
}
.tag-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 26px 28px 22px;
  border-bottom: 1px solid #dbe3ef;
  flex-shrink: 0;
}
.tag-modal-title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}
.tag-modal-title h2 {
  margin: 0;
  font-size: 25px;
  font-weight: 800;
  line-height: 1.3;
}
.tag-modal-title > span {
  padding: 4px 10px;
  border-radius: 6px;
  background: #fff0e5;
  color: #ff6600;
  font-size: 12px;
  font-weight: 800;
}
.tag-modal p {
  margin: 6px 0 0;
  color: #647da7;
  line-height: 1.5;
}
.tag-modal button {
  font: inherit;
  cursor: pointer;
}
.tag-modal-icon {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  padding: 0;
  border: 1px solid #d8e1f0;
  border-radius: 6px;
  background: white;
  color: #102372;
  flex-shrink: 0;
}
.tag-modal-header .tag-modal-icon {
  border-color: transparent;
  color: #7185a6;
}
.tag-modal-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding: 24px 28px 14px;
  overflow: auto;
}
.tag-modal-name {
  display: block;
  flex-shrink: 0;
  font-weight: 800;
  font-size: 16px;
}
.tag-modal-name input {
  display: block;
  width: 100%;
  height: 48px;
  margin-top: 10px;
  padding: 0 18px;
  border: 1px solid #cad6eb;
  border-radius: 7px;
  background: white;
  color: #102372;
  font: inherit;
  font-size: 14px;
  font-weight: 400;
}
.tag-modal-assets {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  margin-top: 22px;
  padding-top: 20px;
  border-top: 1px solid #dbe3ef;
}
.tag-modal-assets-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-shrink: 0;
}
.tag-modal-assets-heading h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
}
.tag-selection-count {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-radius: 6px;
  background: #edf2ff;
  color: #4c6490;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}
.tag-selection-count strong {
  font-size: 17px;
  color: #102372;
}
.tag-modal-search {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 48px;
  margin-top: 20px;
  padding: 0 16px;
  border: 1px solid #cad6eb;
  border-radius: 7px;
  color: #7185a6;
  flex-shrink: 0;
}
.tag-modal-search input {
  width: 100%;
  min-width: 0;
  padding: 10px 0;
  border: 0;
  background: transparent;
  outline: none;
  font: inherit;
  color: #102372;
}
.tag-modal-search:focus-within {
  outline: 2px solid #567bd3;
  outline-offset: 1px;
}
.tag-modal-tools {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 16px 0;
  flex-shrink: 0;
}
.tag-filter-options {
  display: flex;
  padding: 3px;
  border: 1px solid #d8e1f0;
  border-radius: 7px;
  background: #f7f9fd;
}
.tag-filter-options button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 40px;
  padding: 8px 18px;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: #5c729b;
  font-size: 13px;
  font-weight: 700;
}
.tag-filter-options button.selected {
  background: #102372;
  color: white;
}
.tag-filter-options button span {
  padding: 2px 8px;
  border-radius: 6px;
  background: #e6ebf4;
  color: #53688d;
}
.tag-filter-options button.selected span {
  background: #ffffff22;
  color: white;
}
.tag-selection-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.tag-selection-actions button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  border: 0;
  background: transparent;
  color: #102372;
  font-size: 12px;
  font-weight: 700;
}
.tag-modal-table {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 140px;
  overflow: hidden;
  border: 1px solid #d2dced;
  border-radius: 7px;
}
.tag-modal-table-head,
.tag-modal-row {
  display: grid;
  grid-template-columns: 38px minmax(0, 1.1fr) minmax(0, 1fr) 170px;
  align-items: center;
  gap: 14px;
  padding: 12px 22px;
}
.tag-modal-table-head {
  min-height: 48px;
  flex-shrink: 0;
  background: #f4f7fb;
  border-bottom: 1px solid #d8e1f0;
  font-size: 12px;
  font-weight: 800;
  color: #7185a6;
}
.tag-modal-rows {
  min-height: 0;
  flex: 1;
  overflow: auto;
  overscroll-behavior: contain;
}
.tag-modal-row {
  min-height: 56px;
  border-bottom: 1px solid #e4eaf4;
  cursor: pointer;
  font-size: 13px;
}
.tag-modal-row:last-child {
  border-bottom: 0;
}
.tag-modal-row:hover {
  background: #f7f9fe;
}
.tag-modal-row.selected {
  background: #f0f4ff;
}
.tag-modal-row strong {
  font-weight: 800;
  overflow-wrap: anywhere;
}
.tag-asset-identification {
  color: #647da7;
  overflow-wrap: anywhere;
}
.tag-asset-type {
  display: inline-block;
  max-width: 100%;
  padding: 5px 12px;
  border-radius: 6px;
  background: #edf2ff;
  font-size: 11px;
  font-weight: 700;
  overflow-wrap: anywhere;
}
.tag-modal input[type="checkbox"] {
  width: 20px;
  height: 20px;
  accent-color: #102372;
  cursor: pointer;
  vertical-align: middle;
}
.tag-modal-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-top: 12px;
  color: #7185a6;
  flex-shrink: 0;
  font-size: 13px;
}
.tag-modal-pagination > div {
  display: flex;
  align-items: center;
  gap: 8px;
}
.tag-modal-pagination strong {
  display: grid;
  place-items: center;
  min-width: 96px;
  min-height: 38px;
  border-radius: 6px;
  background: #edf2ff;
  color: #102372;
  font-size: 14px;
}
.tag-modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 18px 28px;
  border-top: 1px solid #dbe3ef;
  flex-shrink: 0;
}
.tag-modal-footer p {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  font-size: 13px;
}
.tag-modal-footer p :deep(.svg-icon-wrapper) {
  flex-shrink: 0;
}
.tag-modal-footer > div {
  display: flex;
  gap: 12px;
}
.tag-modal-footer button {
  min-height: 46px;
  padding: 0 26px;
  border: 1px solid #d2dced;
  border-radius: 7px;
  background: white;
  color: #102372;
  font-size: 14px;
  font-weight: 800;
  white-space: nowrap;
}
.tag-modal-footer button.tag-modal-save {
  border-color: #ff6600;
  background: #ff6600;
  color: white;
}
.tag-modal button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.tag-modal input:focus-visible,
.tag-modal button:focus-visible {
  outline: 2px solid #567bd3;
  outline-offset: 2px;
}
.tag-modal-empty {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 140px;
  padding: 20px;
  text-align: center;
}
@media (max-height: 760px) and (min-width: 701px) {
  .tag-modal-header {
    padding: 16px 24px;
  }
  .tag-modal-body {
    padding: 14px 24px 12px;
  }
  .tag-modal-assets {
    margin-top: 14px;
    padding-top: 12px;
  }
  .tag-modal-search {
    margin-top: 12px;
    min-height: 40px;
  }
  .tag-modal-name input {
    height: 40px;
  }
  .tag-modal-tools {
    margin: 10px 0;
  }
  .tag-modal-footer {
    padding: 12px 24px;
  }
  .tag-modal-title h2 {
    font-size: 22px;
  }
}
@media (max-width: 700px) {
  .tag-modal {
    width: calc(100vw - 20px);
    max-width: calc(100vw - 20px);
    height: calc(100dvh - 24px);
    max-height: calc(100dvh - 24px);
  }
  .tag-modal-header {
    padding: 18px 16px;
  }
  .tag-modal-title {
    gap: 8px;
  }
  .tag-modal-title h2 {
    font-size: 21px;
  }
  .tag-modal-body {
    padding: 16px;
    overflow: auto;
  }
  .tag-modal-name {
    font-size: 14px;
  }
  .tag-modal-assets {
    flex: none;
    min-height: 0;
    margin-top: 16px;
    padding-top: 16px;
  }
  .tag-modal-assets-heading {
    align-items: flex-start;
  }
  .tag-modal-assets-heading h3 {
    font-size: 16px;
  }
  .tag-modal-assets-heading p {
    font-size: 12px;
  }
  .tag-selection-count {
    padding: 8px;
    font-size: 11px;
  }
  .tag-modal-tools {
    flex-wrap: wrap;
  }
  .tag-filter-options {
    width: 100%;
  }
  .tag-filter-options button {
    flex: 1;
    gap: 5px;
    padding: 8px;
    font-size: 11px;
  }
  .tag-selection-actions {
    width: 100%;
    justify-content: space-between;
  }
  .tag-modal-table {
    flex: none;
    height: 280px;
  }
  .tag-modal-table-head,
  .tag-modal-row {
    grid-template-columns: 26px minmax(0, 1fr);
    gap: 8px;
    padding: 10px;
  }
  .tag-modal-table-head > :nth-child(n + 3) {
    display: none;
  }
  .tag-modal-row > :nth-child(3),
  .tag-modal-row > :nth-child(4) {
    grid-column: 2;
    font-size: 11px;
  }
  .tag-modal-footer {
    padding: 12px 16px;
  }
  .tag-modal-footer p {
    display: none;
  }
  .tag-modal-footer > div {
    width: 100%;
  }
  .tag-modal-footer button {
    flex: 1;
    padding: 0 14px;
  }
  .tag-modal-pagination strong {
    min-width: 66px;
  }
  .tag-modal p {
    font-size: 12px;
  }
}
.tag-modal p.tag-modal-save-error { margin: 0 0 14px; padding: 10px 12px; border: 1px solid #f0b6bf; border-radius: 5px; background: #fff0f1; color: #a31f32; flex-shrink: 0; }
</style>
