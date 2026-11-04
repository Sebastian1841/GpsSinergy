<template>
  <section ref="tagsRoot" class="configuration-tags" aria-label="Etiquetas">
    <div class="tags-toolbar">
      <div class="tags-company-context">
        <label v-if="!route.params.empresaId && isPlatformAdmin" class="tags-company">
          <SvgIcon name="empresas" />
          <span class="tags-company-label">Empresa</span>
          <select v-model="selectedCompanyId" aria-label="Empresa de las etiquetas">
            <option
              v-for="company in accessibleCompanies"
              :key="company.id"
              :value="String(company.id)"
            >
              {{ company.name }}
            </option>
          </select>
        </label>
        <strong v-else class="tags-company-name">{{ companyName }}</strong>
        <span class="tags-total">{{ fleet.length }} activos</span>
      </div>
      <div class="tags-toolbar-actions">
        <label class="tags-search tags-global-search" title="Filtra etiquetas y sus activos asignados"><span class="tags-search-scope">General</span><SvgIcon name="search" /><input
            v-model="globalSearch"
            type="search"
            aria-label="Buscar etiqueta o activo"
            placeholder="Buscar etiqueta o activo..."
        /></label>
        <button v-if="canManage" type="button" class="tags-primary" @click="openEditor()">
          <SvgIcon name="plus" />Nueva etiqueta
        </button>
      </div>
    </div>
    <p v-if="error" class="tags-error" role="alert">{{ error }}</p>
    <div class="tags-layout">
      <aside class="tags-list" aria-label="Listado de etiquetas">
        <header>
          <h1>
            Etiquetas <span>{{ tags.length }}</span>
          </h1>
          <label class="tags-search" title="Filtra solo el listado de etiquetas"><SvgIcon name="search" /><input
              v-model="tagSearch"
              type="search"
              aria-label="Buscar etiquetas"
              placeholder="Filtrar esta lista..."
          /></label>
        </header>
        <div class="tags-list-items">
          <button
            v-for="tag in pageTags"
            :key="tag.id"
            type="button"
            class="tag-option"
            :class="{ selected: String(tag.id) === selectedTagId }"
            :aria-pressed="String(tag.id) === selectedTagId"
            @click="selectedTagId = String(tag.id)"
          >
            <div>
              <div class="tag-name">
                <strong>{{ tag.name }}</strong><span class="tag-status" :class="{ inactive: tag.active === false }">{{
                  tag.active === false ? "Inactiva" : "Activa"
                }}</span>
              </div>
              <span class="tag-count">{{ assignedCount(tag) }}
                {{ assignedCount(tag) === 1 ? "activo asignado" : "activos asignados" }}</span>
            </div>
            <SvgIcon name="chevron-right" />
          </button>
          <p v-if="!pageTags.length" class="tags-empty">
            {{ tags.length ? "No se encontraron etiquetas." : "Aún no hay etiquetas." }}
          </p>
        </div>
        <footer class="tags-pagination">
          <span>Mostrando {{ filteredTags.length ? (tagPage - 1) * 8 + 1 : 0 }}-{{
              Math.min(tagPage * 8, filteredTags.length)
            }}
            de {{ filteredTags.length }}</span>
          <template v-if="tagPages > 1"><button
              type="button"
              :disabled="tagPage === 1"
              aria-label="Etiquetas anteriores"
              @click="tagPage--"
            >
              <SvgIcon name="chevron-left" /></button><button
              type="button"
              :disabled="tagPage >= tagPages"
              aria-label="Etiquetas siguientes"
              @click="tagPage++"
            >
              <SvgIcon name="chevron-right" /></button></template>
        </footer>
      </aside>
      <main class="tags-detail">
        <template v-if="selectedTag">
          <header class="tag-detail-header">
            <div>
              <div class="tag-name">
                <h2>{{ selectedTag.name }}</h2>
                <span class="tag-status" :class="{ inactive: selectedTag.active === false }">{{
                  selectedTag.active === false ? "Inactiva" : "Activa"
                }}</span>
              </div>
              <p>
                {{ assignedAssets.length }}
                {{ assignedAssets.length === 1 ? "activo asignado" : "activos asignados" }}
              </p>
            </div>
            <div v-if="canManage" class="tag-actions">
              <button type="button" @click="openEditor(selectedTag)">Editar</button><button type="button" class="danger" @click="deleteTag(selectedTag.id)">
                Eliminar
              </button>
            </div>
          </header>
          <section class="tag-assigned" aria-label="Activos asignados">
            <h2>Activos asignados <span class="tag-matching-count" aria-live="polite">{{ filteredAssets.length }} de {{ assignedAssets.length }}</span></h2>
            <label class="tags-search" title="Filtra solo los activos de la etiqueta seleccionada"><span class="tags-search-scope">Activos</span><SvgIcon name="search" /><input
                v-model="assetSearch"
                type="search"
                aria-label="Buscar activos asignados"
                placeholder="Buscar por patente, nombre o empresa..."
            /></label>
            <div class="tags-table-wrap">
              <table class="tags-assets-table">
                <thead>
                  <tr>
                    <th
                      v-for="column in [
                        { key: 'patente', label: 'Patente' },
                        { key: 'nombre', label: 'Nombre' },
                        { key: 'empresa', label: 'Empresa' },
                        { key: 'estado', label: 'Estado' },
                      ]"
                      :key="column.key"
                      scope="col"
                      :aria-sort="
                        sortKey === column.key
                          ? sortDirection === 1
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                      "
                    >
                      <button type="button" @click="sort(column.key)">
                        {{ column.label }}<SvgIcon name="chevron-down" />
                      </button>
                    </th>
                    <th scope="col"><span class="tags-sr-only">Acciones</span></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="asset in pageAssets" :key="asset.id">
                    <td>{{ assetPlate(asset) }}</td>
                    <td>{{ assetName(asset) }}</td>
                    <td>{{ companyName }}</td>
                    <td>
                      <span
                        class="asset-status"
                        :class="{ offline: (asset.estado || asset.status) === 'offline' }"
                        >{{ statusName(asset) }}</span>
                    </td>
                    <td>
                      <details class="tag-row-menu" @click="closeChosenMenu">
                        <summary :aria-label="'Acciones de ' + assetName(asset)" title="Acciones">
                          ...
                        </summary>
                        <div>
                          <RouterLink
                            :to="{
                              path: `/app/${asset.companyId}/activos`,
                              query: { activoId: asset.id, open: 'asset-detail' },
                            }"
                            >Ir a ficha</RouterLink><button v-if="canManage" type="button" @click="removeAssignment(asset)">
                            Quitar de etiqueta
                          </button>
                        </div>
                      </details>
                    </td>
                  </tr>
                  <tr v-if="!pageAssets.length">
                    <td colspan="5" class="tags-empty">
                      {{
                        assignedAssets.length
                          ? "No se encontraron activos."
                          : "Esta etiqueta no tiene activos asignados."
                      }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <footer v-if="assetPages > 1" class="tags-pagination">
              <span>{{ filteredAssets.length }} activos · Página {{ assetPage }} de
                {{ assetPages }}</span><button
                type="button"
                :disabled="assetPage === 1"
                aria-label="Activos anteriores"
                @click="assetPage--"
              >
                <SvgIcon name="chevron-left" /></button><button
                type="button"
                :disabled="assetPage >= assetPages"
                aria-label="Activos siguientes"
                @click="assetPage++"
              >
                <SvgIcon name="chevron-right" />
              </button>
            </footer>
          </section>
        </template>
        <section v-else class="tags-detail-empty">
          <SvgIcon name="fleet-tags" />
          <h2>{{ tags.length ? "Sin resultados" : "Aún no hay etiquetas" }}</h2>
          <button
            v-if="!tags.length && canManage"
            type="button"
            class="tags-primary"
            @click="openEditor()"
          >
            Nueva etiqueta
          </button>
        </section>
      </main>
    </div>
    <FleetAssetTagModal
      :open="editorOpen"
      :save-error="error"
      :mode="editingId ? 'edit' : 'create'"
      :tag-name="editorName"
      :assets="editorCatalog"
      :selected-asset-ids="editorAssetIds"
      @close="editorOpen = false"
      @save="saveEditor"
    />
  </section>
</template>
<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount } from "vue"
import { useRoute } from "vue-router"
import FleetAssetTagModal from "../components/activos/fleet/FleetAssetTagModal.vue"
import SvgIcon from "../components/icons/SvgIcon.vue"
import { useAccessControl } from "../composables/auth/useAccessControl.js"
import { useMockDatabase } from "../composables/mock/useMockDatabase.js"
import { useAuditTrail } from "../composables/audit/useAuditTrail.js"
import { normalizeFleetAssetTagIds } from "../utils/activos/fleetAssetFormUtils.js"
import { matchesTagAssetSearch } from "../utils/layout/tagSearch.js"

const route = useRoute()
const tagsRoot = ref(null)
const closeOutsideMenus = (event) => {
  for (const menu of tagsRoot.value?.querySelectorAll(".tag-row-menu[open]") || []) {
    if (!menu.contains(event.target)) menu.open = false
  }
}
const closeChosenMenu = (event) => {
  if (event.target.closest("a, button")) event.currentTarget.open = false
}
const closeMenusOnEscape = (event) => {
  if (event.key !== "Escape") return
  for (const menu of tagsRoot.value?.querySelectorAll(".tag-row-menu[open]") || []) {
    menu.open = false
    menu.querySelector("summary")?.focus()
  }
}
onMounted(() => {
  document.addEventListener("pointerdown", closeOutsideMenus)
  document.addEventListener("keydown", closeMenusOnEscape)
})
onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", closeOutsideMenus)
  document.removeEventListener("keydown", closeMenusOnEscape)
})
const { isPlatformAdmin, accessibleCompanies, visibleAssets, canAccessFunction, canAccessCompany } =
  useAccessControl()
const { assetTags, commitAssetTagConfiguration } = useMockDatabase()
const selectedCompanyId = ref("")
const assetCounts = computed(() => {
  const counts = new Map()
  for (const asset of visibleAssets.value) {
    const id = String(asset.companyId)
    counts.set(id, (counts.get(id) || 0) + 1)
  }
  return counts
})
watch(
  accessibleCompanies,
  (companies) => {
    if (!companies.some((company) => String(company.id) === selectedCompanyId.value))
      selectedCompanyId.value = String(
        companies.find((company) => assetCounts.value.has(String(company.id)))?.id ||
          companies[0]?.id ||
          "",
      )
  },
  { immediate: true },
)
const companyId = computed(() => String(route.params.empresaId || selectedCompanyId.value || ""))
const { recordAudit } = useAuditTrail({ companyId })
const fleet = computed(() =>
  visibleAssets.value.filter((asset) => String(asset.companyId) === companyId.value),
)
const tags = computed(() =>
  assetTags.value.filter((tag) => String(tag.companyId) === companyId.value),
)
const canManage = computed(() =>
  Boolean(
    companyId.value &&
    canAccessCompany(companyId.value) &&
    (isPlatformAdmin.value ||
      (canAccessFunction("configuration-tags", companyId.value, "edit") &&
        canAccessFunction("gps", companyId.value, "edit"))),
  ),
)
const error = ref("")
watch(companyId, () => {
  error.value = ""
})
const guard = () => {
  if (!canManage.value) {
    error.value = "No tienes permiso para modificar estas etiquetas."
    return false
  }
  error.value = ""
  return true
}
const findTag = (id) => tags.value.find((tag) => String(tag.id) === String(id))
const commitTag = (action, options) => {
  if (!guard()) return null
  try {
    return commitAssetTagConfiguration({
      ...options, action, companyId: companyId.value,
      editableAssetIds: fleet.value.map(asset => String(asset.id)),
      canEdit: () => canManage.value,
    })
  } catch (cause) {
    error.value = cause.message
    return null
  }
}
const audit = (action, tag) =>
  recordAudit({
    module: "activos",
    action: `asset-tag:${action}`,
    entityType: "asset-tag",
    entityName: tag.name,
    metadata: { assetTagId: tag.id },
    description: `Etiqueta de activos: ${action}.`,
  })
const createTag = ({ name, assetIds }) => {
  const tag = commitTag("create", { name, assetIds })
  if (!tag) return false
  audit("create", tag)
  selectedTagId.value = String(tag.id)
  return true
}
const updateTag = ({ id, changes, assetIds }) => {
  if (!guard() || !findTag(id)) {
    if (!error.value) error.value = "La etiqueta ya no esta disponible."
    return false
  }
  const tag = commitTag("update", { tagId: id, name: changes?.name, assetIds })
  if (!tag) return false
  audit("update", tag)
  return true
}
const deleteTag = (id) => {
  if (!guard()) return
  const tag = findTag(id)
  if (!tag || !window.confirm(`¿Eliminar la etiqueta "${tag.name}"? Se quitará de los activos asignados.`)) return
  const deleted = commitTag("delete", { tagId: id })
  if (deleted) audit("delete", deleted)
}

const globalSearch = ref("")
const tagSearch = ref("")
const assetSearch = ref("")
const selectedTagId = ref("")
const tagPage = ref(1)
const assetPage = ref(1)
const sortKey = ref("patente")
const sortDirection = ref(1)
const editorOpen = ref(false)
const editingId = ref("")
const editorName = ref("")
const editorAssetIds = ref([])
const editorCatalog = ref([])
const editorCompanyId = ref("")
const companyName = computed(
  () =>
    accessibleCompanies.value.find((company) => String(company.id) === companyId.value)?.name || "",
)
const assetName = (asset) =>
  asset.nombrePantalla ||
  asset.displayName ||
  asset.name ||
  asset.vehiculo ||
  asset.patente ||
  String(asset.id)
const assetPlate = (asset) => asset.patente || asset.patent || asset.plate || "Sin patente"
const normalizeSearch = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
const statusLabels = {
  moving: "En movimiento",
  stopped: "Detenido",
  idle: "Ralentí",
  offline: "Sin conexión",
  online: "En línea",
}
const statusName = (asset) =>
  statusLabels[asset.estado || asset.status] || asset.estado || asset.status || "Sin estado"
const tagAssets = computed(() => {
  const index = new Map()
  for (const asset of fleet.value)
    for (const id of normalizeFleetAssetTagIds(asset.assetTagIds)) {
      if (!index.has(id)) index.set(id, [])
      index.get(id).push(asset)
    }
  return index
})
const assignedCount = (tag) => tagAssets.value.get(String(tag.id))?.length || 0
const filteredTags = computed(() => {
  const global = normalizeSearch(globalSearch.value)
  const local = normalizeSearch(tagSearch.value)
  return tags.value.filter((tag) => {
    const name = normalizeSearch(tag.name)
    return (
      (!local || name.includes(local)) &&
      (!global ||
        name.includes(global) ||
        (tagAssets.value.get(String(tag.id)) || []).some((asset) =>
          normalizeSearch(
            [assetName(asset), assetPlate(asset), companyName.value].join(" "),
          ).includes(global),
        ))
    )
  })
})
const tagPages = computed(() => Math.max(1, Math.ceil(filteredTags.value.length / 8)))
const pageTags = computed(() =>
  filteredTags.value.slice((tagPage.value - 1) * 8, tagPage.value * 8),
)
const selectedTag = computed(() => findTag(selectedTagId.value))
const assignedAssets = computed(() => tagAssets.value.get(selectedTagId.value) || [])
const filteredAssets = computed(() => {
  const items = assignedAssets.value.filter(
    (asset) => matchesTagAssetSearch(
      [assetPlate(asset), assetName(asset), companyName.value].join(" "),
      { tagName: selectedTag.value?.name, globalQuery: globalSearch.value, localQuery: assetSearch.value },
    ),
  )
  const value = (asset) =>
    sortKey.value === "nombre"
      ? assetName(asset)
      : sortKey.value === "empresa"
        ? companyName.value
        : sortKey.value === "estado"
          ? statusName(asset)
          : assetPlate(asset)
  return [...items].sort(
    (a, b) => value(a).localeCompare(value(b), "es", { numeric: true }) * sortDirection.value,
  )
})
const assetPages = computed(() => Math.max(1, Math.ceil(filteredAssets.value.length / 10)))
const pageAssets = computed(() =>
  filteredAssets.value.slice((assetPage.value - 1) * 10, assetPage.value * 10),
)
watch([globalSearch, tagSearch], () => {
  tagPage.value = 1
})
watch(
  filteredTags,
  (items) => {
    if (!items.some((tag) => String(tag.id) === selectedTagId.value))
      selectedTagId.value = String(items[0]?.id || "")
    tagPage.value = Math.min(tagPage.value, tagPages.value)
  },
  { immediate: true },
)
watch([selectedTagId, assetSearch, globalSearch], () => {
  assetPage.value = 1
})
watch(globalSearch, () => { assetSearch.value = "" })
watch(assetPages, (pages) => {
  assetPage.value = Math.min(assetPage.value, pages)
})
watch(companyId, () => {
  globalSearch.value = ""
  tagSearch.value = ""
  assetSearch.value = ""
  editorOpen.value = false
})
const sort = (key) => {
  if (sortKey.value === key) sortDirection.value *= -1
  else {
    sortKey.value = key
    sortDirection.value = 1
  }
}
const openEditor = (tag = null) => {
  if (!guard()) return
  error.value = ""
  editorCompanyId.value = companyId.value
  editingId.value = tag ? String(tag.id) : ""
  editorName.value = tag?.name || ""
  editorCatalog.value = fleet.value.map((asset) => ({
    id: String(asset.id),
    displayName: assetName(asset),
    secondaryLabel: [assetPlate(asset), asset.imei].filter(Boolean).join(" · "),
    typeLabel: asset.assetTypeLabel || asset.tipoActivoLabel || "",
    searchText: normalizeSearch([assetName(asset), assetPlate(asset), asset.imei].join(" ")),
  }))
  editorAssetIds.value = tag
    ? (tagAssets.value.get(String(tag.id)) || []).map((asset) => String(asset.id))
    : []
  editorOpen.value = true
}
const saveEditor = (payload) => {
  if (!guard() || editorCompanyId.value !== companyId.value) return
  const saved = editingId.value
    ? updateTag({ id: editingId.value, changes: { name: payload.name }, assetIds: payload.assetIds })
    : createTag(payload)
  if (saved) editorOpen.value = false
}
const removeAssignment = (asset) => {
  if (!guard() || !selectedTag.value) return
  if (!window.confirm(`¿Quitar "${assetName(asset)}" de la etiqueta "${selectedTag.value.name}"?`))
    return
  const tag = commitTag("unassign", { tagId: selectedTagId.value, assetId: String(asset.id) })
  if (tag) audit("update", tag)
}
</script>
<style scoped>
.configuration-tags {
  display: flex;
  flex-direction: column;
  gap: 14px;
  height: 100%;
  min-height: 0;
  min-width: 0;
  width: 100%;
  padding: 14px 12px;
  background: #f4f7fb;
  color: #102372;
  font-size: 13px;
}
.tags-toolbar {
  display: grid;
  grid-template-columns: minmax(250px, 26%) minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  min-height: 44px;
  flex-shrink: 0;
  padding: 10px 12px;
  border: 1px solid #d8dee8;
  border-radius: 8px;
  background: white;
}
.tags-company-context {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  min-height: 40px;
  padding: 0;
  border: 0;
  background: transparent;
}
.tags-toolbar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  min-height: 40px;
  padding: 0;
}
.tags-company {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
  font-size: 13px;
  font-weight: 700;
}
.tags-company select {
  width: 100%;
  min-width: 0;
  max-width: 100%;
  height: 40px;
  padding: 0 12px;
  border: 1px solid #d8dee8;
  border-radius: 6px;
  background: white;
  color: #102372;
  font: inherit;
}
.tags-total {
  padding: 4px 8px;
  background: #f0f4fb;
  border: 0;
  border-radius: 4px;
  font-size: 11px;
  white-space: nowrap;
}
.tags-search {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 40px;
  padding: 0 12px;
  border: 1px solid #d2dced;
  border-radius: 6px;
  background: white;
  color: #7a8eaf;
}
.tags-search :deep(.svg-icon-wrapper) {
  flex-shrink: 0;
  width: 17px;
  height: 17px;
}
.tags-search input {
  width: 100%;
  min-width: 0;
  border: 0;
  padding: 10px 0;
  background: transparent;
  color: #102372;
  font: inherit;
  outline: none;
}
.tags-search-scope {
  flex-shrink: 0;
  padding-right: 10px;
  border-right: 1px solid #e6ebf2;
  color: #526585;
  font-size: 11px;
  font-weight: 600;
}
.tags-search:focus-within {
  outline: 2px solid #476aca;
  outline-offset: 1px;
}
.tags-global-search {
  flex: 1;
  width: auto;
}
button {
  cursor: pointer;
}
button:focus-visible,
a:focus-visible,
summary:focus-visible,
select:focus-visible {
  outline: 2px solid #ff6600;
  outline-offset: 2px;
}
.tags-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 42px;
  padding: 0 18px;
  border: 1px solid #ff6600;
  border-radius: 6px;
  background: #ff6600;
  color: white;
  font-size: 13px;
  font-weight: 800;
  white-space: nowrap;
}
.tags-layout {
  display: grid;
  grid-template-columns: minmax(250px, 26%) minmax(0, 1fr);
  gap: 12px;
  min-height: 0;
  min-width: 0;
  flex: 1;
}
.tags-list {
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: white;
  border: 1px solid #dce4ef;
  border-radius: 6px;
}
.tags-list header {
  padding: 16px;
  border-bottom: 1px solid #edf1f5;
}
.tags-list h1 {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 0 16px;
  font-size: 18px;
  font-weight: 800;
}
.tags-list h1 > span {
  padding: 2px 10px;
  background: #edf1f6;
  border-radius: 8px;
  color: #536788;
  font-size: 12px;
}
.tags-list-items {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 0 10px;
}
.tag-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  min-height: 68px;
  padding: 12px 14px;
  border: 0;
  border-bottom: 1px solid #e5ebf4;
  border-left: 3px solid transparent;
  background: white;
  color: #102372;
  text-align: left;
  font: inherit;
}
.tag-option.selected {
  border-left-color: #527aff;
  background: #edf3ff;
  border-radius: 5px;
}
.tag-option:hover {
  background: #f5f8ff;
}
.tag-option > div {
  min-width: 0;
}
.tag-name {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  min-width: 0;
}
.tag-name strong,
.tag-name h2 {
  overflow-wrap: anywhere;
}
.tag-count {
  display: block;
  margin-top: 6px;
  font-size: 12px;
}
.tag-status {
  display: inline-block;
  flex-shrink: 0;
  padding: 3px 12px;
  background: #e4f8ed;
  border-radius: 6px;
  color: #008457;
  font-size: 11px;
  font-weight: 700;
}
.tag-status.inactive {
  background: #edf1f6;
  color: #64748b;
}
.tags-detail {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-width: 0;
  min-height: 0;
  border: 1px solid #d8dee8;
  border-radius: 6px;
  background: white;
}
.tag-detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 16px 20px;
  background: white;
  border: 0;
  border-bottom: 1px solid #edf1f5;
  border-radius: 6px 6px 0 0;
  min-height: 76px;
}
.tag-detail-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
}
.tag-detail-header p {
  margin: 5px 0 0;
  color: #7185a6;
  font-size: 12px;
}
.tag-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.tag-actions button {
  min-height: 38px;
  padding: 0 18px;
  border: 1px solid #d2dced;
  border-radius: 6px;
  background: white;
  color: #102372;
  font-size: 12px;
  font-weight: 700;
}
.tag-actions button.danger {
  border-color: #fecdd3;
  color: #d60024;
}
.tag-assigned {
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow: auto;
  background: white;
  border: 0;
  border-radius: 0 0 6px 6px;
  padding: 16px 20px;
}
.tag-assigned > h2 {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 800;
}
.tags-table-wrap {
  width: 100%;
  min-width: 0;
  max-width: 100%;
  margin-top: 16px;
  border: 0;
  border-top: 1px solid #e2e9f3;
  border-bottom: 1px solid #e2e9f3;
  border-radius: 0;
}
.tags-assets-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}
.tags-assets-table th {
  background: #f1f5fa;
  text-align: left;
  color: #455778;
  font-size: 12px;
}
.tags-assets-table th:nth-child(1) {
  width: 17%;
}
.tags-assets-table th:nth-child(2) {
  width: 32%;
}
.tags-assets-table th:nth-child(3) {
  width: 27%;
}
.tags-assets-table th:nth-child(4) {
  width: 18%;
}
.tags-assets-table th:last-child {
  width: 6%;
}
.tags-assets-table th button {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-weight: 700;
  text-align: left;
}
.tags-assets-table th :deep(.svg-icon-wrapper) {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}
.tags-assets-table td,
.tags-assets-table th {
  padding: 8px 16px;
  overflow-wrap: anywhere;
}
.tags-assets-table td {
  height: 55px;
  border-top: 1px solid #e5ebf4;
  font-size: 13px;
}
.asset-status {
  display: inline-block;
  padding: 5px 10px;
  border: 1px solid #c9f0dd;
  border-radius: 5px;
  background: #eafbf1;
  color: #087b55;
  font-size: 11px;
  font-weight: 700;
}
.asset-status.offline {
  background: #f2f4f8;
  color: #64748b;
  border-color: #e2e8f0;
}
.tag-row-menu {
  position: relative;
}
.tag-row-menu summary {
  list-style: none;
  min-width: 24px;
  text-align: center;
  font-size: 18px;
  font-weight: 800;
  cursor: pointer;
}
.tag-row-menu summary::-webkit-details-marker {
  display: none;
}
.tag-row-menu > div {
  position: absolute;
  right: 0;
  top: 28px;
  z-index: 2;
  width: 160px;
  background: white;
  border: 1px solid #d8e1f0;
  border-radius: 6px;
  box-shadow: 0 8px 20px #10237215;
  padding: 4px;
}
.tag-row-menu a,
.tag-row-menu button {
  display: block;
  width: 100%;
  padding: 10px;
  border: 0;
  background: white;
  color: #102372;
  text-decoration: none;
  text-align: left;
  font-size: 12px;
}
.tag-row-menu a:hover,
.tag-row-menu button:hover {
  background: #f0f4fb;
}
.tags-pagination {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 16px 20px;
  border-top: 1px solid #e5ebf4;
  color: #7185a6;
  font-size: 12px;
  flex-shrink: 0;
}
.tags-pagination span {
  flex: 1;
}
.tags-pagination button {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border: 1px solid #d8e1f0;
  border-radius: 5px;
  background: white;
  color: #102372;
}
.tags-pagination button:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.tags-empty {
  padding: 24px 12px;
  color: #7185a6;
  text-align: center;
}
.tags-detail-empty {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  border: 0;
  border-radius: 6px;
  background: white;
  color: #7185a6;
}
.tags-detail-empty h2 {
  font-size: 17px;
}
.tags-error {
  margin: 0;
  color: #be123c;
  font-size: 12px;
}
.tag-matching-count {margin-left:10px;color:#7185a6;font-size:12px;font-weight:500;white-space:nowrap}
.tags-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}
@media (max-width: 1500px) {
  .tags-company-label { display: none; }
}
@media (max-width: 1100px) {
  .tags-toolbar {
    grid-template-columns: 240px minmax(0, 1fr);
    gap: 10px;
  }
  .tags-global-search {
    flex: 1;
    width: auto;
    min-width: 180px;
  }
  .tags-company select {
    width: 100%;
  }
  .tags-company-context {
    flex-wrap: wrap;
    padding: 10px;
    gap: 8px;
  }
  .tags-company-context .tags-company {
    flex-basis: 100%;
  }
  .tags-toolbar-actions {
    padding: 10px;
    gap: 10px;
  }
  .tags-layout {
    grid-template-columns: 240px minmax(0, 1fr);
  }
  .tag-name {
    gap: 6px;
  }
  .tags-assets-table td,
  .tags-assets-table th {
    padding: 8px;
  }
  .tag-detail-header {
    padding: 16px;
  }
  .tag-assigned {
    padding: 16px;
  }
  .tag-actions button {
    padding: 0 12px;
  }
}
@media (max-width: 760px) {
  .tags-toolbar {
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }
  .tags-company-context {
    min-height: 60px;
    flex-wrap: nowrap;
  }
  .tags-toolbar-actions {
    min-height: 60px;
    flex-wrap: wrap;
    padding: 0 0 10px;
  }
  .configuration-tags {
    overflow: auto;
    height: 100%;
    padding: 10px;
  }
  .tags-layout {
    display: flex;
    flex-direction: column;
    flex: none;
  }
  .tags-list {
    max-height: 340px;
    flex-shrink: 0;
  }
  .tags-list-items {
    max-height: 210px;
    flex: 1;
  }
  .tags-list header {
    padding: 14px;
  }
  .tags-list h1 {
    margin-bottom: 10px;
  }
  .tag-option {
    min-height: 64px;
    padding: 12px;
  }
  .tags-detail {
    min-height: 400px;
  }
  .tags-global-search {
    order: 3;
    flex-basis: 100%;
  }
  .tags-primary {
    margin-left: auto;
  }
  .tag-detail-header {
    flex-wrap: wrap;
  }
  .tag-detail-header h2 {
    font-size: 18px;
  }
  .tags-total {
    font-size: 12px;
  }
  .tags-table-wrap {
    overflow: auto;
  }
  .tags-assets-table {
    display: block;
    min-width: 0;
  }
  .tags-assets-table thead {
    display: none;
  }
  .tags-assets-table tbody {
    display: block;
  }
  .tags-assets-table tbody tr {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    padding: 8px;
    border-bottom: 1px solid #e5ebf4;
  }
  .tags-assets-table td {
    display: block;
    height: auto;
    min-width: 0;
    border: 0;
    padding: 8px;
  }
  .tags-assets-table td::before {
    display: block;
    margin-bottom: 4px;
    color: #7185a6;
    font-size: 11px;
  }
  .tags-assets-table td:nth-child(1)::before {
    content: "Patente";
  }
  .tags-assets-table td:nth-child(2)::before {
    content: "Nombre";
  }
  .tags-assets-table td:nth-child(3)::before {
    content: "Empresa";
  }
  .tags-assets-table td:nth-child(4)::before {
    content: "Estado";
  }
  .tags-assets-table td:last-child {
    grid-column: 1 / -1;
  }
  .tags-company {
    flex: 1;
  }
  .tags-company select {
    width: 100%;
  }
  .tags-pagination {
    padding: 12px;
  }
}
</style>
