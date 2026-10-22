<template>
  <section class="drivers-tab" aria-label="Conductores y licencias">
    <p v-if="error" class="driver-error" role="alert">{{ error }}</p>
    <div class="drivers-list-header">
      <div class="driver-states" aria-label="Estado de las licencias">
        <button
          v-for="option in states"
          :key="option.key"
          type="button"
          :class="{ selected: status === option.key }"
          :data-state="option.key"
          :aria-pressed="status === option.key"
          @click="status = option.key"
        >
          <span class="driver-metric-label">{{ option.label }}</span>
          <strong>{{ counts[option.key] }}</strong>
        </button>
      </div>
      <div class="drivers-toolbar">
        <div ref="exportControl" class="driver-export-control" @keydown.esc.stop="closeExportMenu">
          <button
            type="button"
            :disabled="isExporting || !filtered.length || !canView"
            :aria-expanded="exportMenuOpen"
            @click="toggleExportMenu"
          >
            <SvgIcon name="download" />{{ isExporting ? "Exportando..." : "Exportar"
            }}<SvgIcon name="chevron-down" />
          </button>
          <div
            v-if="exportMenuOpen && canView"
            class="driver-export-menu"
            role="group"
            aria-label="Formato de exportacion"
          >
            <button type="button" @click="exportReport('excel')">
              <SvgIcon name="download" />Excel (.xlsx)
            </button>
            <button type="button" @click="exportReport('pdf')">
              <SvgIcon name="reporte" />PDF (.pdf)
            </button>
          </div>
        </div>
        <button v-if="canEdit" type="button" class="primary" @click="open('create')">
          <SvgIcon name="plus" />Agregar conductor
        </button>
      </div>
    </div>
    <div class="driver-filters">
      <label class="driver-search"
        ><span class="driver-search-label">Buscar conductor</span
        ><span class="driver-search-input"
          ><SvgIcon name="search" /><input
            v-model="search"
            type="search"
            placeholder="Buscar conductor o RUT..." /></span
      ></label>
      <label class="driver-license-filter"
        ><span class="driver-search-label">Clase de licencia</span
        ><select v-model="licenseClass" title="Clase de licencia">
          <option value="all">Clase de licencia: Todas</option>
          <option v-for="item in LICENSE_CLASSES" :key="item" :value="item">
            Clase de licencia: {{ item }}
          </option>
        </select></label
      >
      <button type="button" class="driver-clear-filters" @click="clearFilters">
        <SvgIcon name="filter-clear" />Limpiar filtros
      </button>
    </div>
    <div ref="tableViewport" class="driver-table-scroll">
      <table>
        <thead>
          <tr>
            <th
              v-for="column in sortableColumns"
              :key="column.key"
              :aria-sort="
                sortKey === column.key
                  ? sortDirection === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : 'none'
              "
            >
              <button type="button" class="driver-sort-button" @click="toggleSort(column.key)">
                {{ column.label
                }}<SvgIcon
                  name="chevron-down"
                  :class="{
                    'sort-active': sortKey === column.key,
                    'sort-up': sortKey === column.key && sortDirection === 'asc',
                  }"
                />
              </button>
            </th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in visible" :key="row.id">
            <td>
              <div class="driver-identity">
                <span class="driver-avatar" :data-tone="row.avatarTone" aria-hidden="true">{{
                  row.initials
                }}</span>
                <div>
                  <strong>{{ row.name }}</strong
                  ><small>{{ row.rut }}</small>
                </div>
              </div>
            </td>
            <td data-label="Clase de licencia">
              <span v-for="item in row.classes" :key="item" class="driver-class-tag">{{
                item
              }}</span>
            </td>
            <td data-label="Vencimiento">
              <strong>{{ row.expiryLabel }}</strong
              ><small :class="{ 'expired-text': row.state.key === 'expired' }">{{
                row.expiryMessage
              }}</small>
            </td>
            <td data-label="Estado">
              <span class="driver-state" :class="row.state.key">{{ row.state.label }}</span>
            </td>
            <td class="driver-row-actions">
              <button type="button" class="driver-view-button" @click="open('detail', row)">
                <SvgIcon name="reporte" />Ver licencia
              </button>
            </td>
          </tr>
          <tr v-if="!filtered.length">
            <td colspan="5" class="driver-empty">
              <SvgIcon name="user" />
              {{
                records.length
                  ? "No hay conductores para estos filtros."
                  : "Sin conductores registrados en esta empresa."
              }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <footer class="driver-pagination">
      <span
        >{{ filtered.length ? (page - 1) * pageSize + 1 : 0 }} a
        {{ Math.min(page * pageSize, filtered.length) }} de {{ filtered.length }} conductores</span
      >
      <div>
        <select v-model="pageSizeChoice" aria-label="Conductores por pagina">
          <option value="auto">Automático ({{ automaticPageSize }})</option>
          <option v-for="size in [5, 10, 20, 50]" :key="size" :value="size">
            {{ size }} por pagina
          </option>
        </select>
        <button
          type="button"
          title="Pagina anterior"
          aria-label="Pagina anterior"
          :disabled="page <= 1"
          @click="page--"
        >
          <SvgIcon name="chevron-left" /></button
        ><button
          v-for="number in pageNumbers"
          :key="number"
          type="button"
          class="driver-page-number"
          :class="{ selected: page === number }"
          :aria-label="'Pagina ' + number"
          :aria-current="page === number ? 'page' : undefined"
          @click="page = number"
        >
          {{ number }}</button
        ><button
          type="button"
          title="Pagina siguiente"
          aria-label="Pagina siguiente"
          :disabled="page >= pages"
          @click="page++"
        >
          <SvgIcon name="chevron-right" />
        </button>
      </div>
    </footer>

    <Teleport to="body">
      <dialog
        v-if="mode"
        ref="dialog"
        class="driver-dialog"
        :class="{
          'driver-create-dialog': mode === 'create',
          'driver-profile-dialog': mode === 'detail',
        }"
        aria-labelledby="driver-dialog-title"
        @cancel.self.prevent="mode === 'detail' && previewUrl ? closePhotoViewer() : close()"
      >
        <header :inert="mode === 'detail' && !!previewUrl">
          <div>
            <h2 id="driver-dialog-title">{{ titles[mode] }}</h2>
            <p>{{ mode === "create" ? companyName : selected?.name }}</p>
          </div>
          <button type="button" title="Cerrar" aria-label="Cerrar" :disabled="busy" @click="close">
            <SvgIcon name="close" />
          </button>
        </header>
        <form v-if="mode !== 'detail'" @submit.prevent="save">
          <div class="driver-dialog-body">
            <p v-if="dialogError" role="alert" class="driver-error">{{ dialogError }}</p>
            <template v-if="!renewalConfirmation">
              <div
                class="driver-editor-sections"
                :class="{ 'driver-renewal-sections': mode !== 'create' }"
              >
                <section v-if="mode !== 'renew'" class="driver-editor-section">
                  <div class="driver-section-heading">
                    <SvgIcon name="user" />
                    <div>
                      <h3>Información personal</h3>
                      <p>Datos básicos del conductor.</p>
                    </div>
                  </div>
                  <div class="driver-personal-fields">
                    <label
                      >Nombre completo<input
                        v-model="draft.name"
                        maxlength="100"
                        placeholder="Ej: Juan Pérez González"
                        required
                    /></label>
                    <label
                      >RUT<input
                        :value="draft.rut"
                        maxlength="12"
                        placeholder="Ej: 12.345.678-9"
                        required
                        @input="setRut"
                    /></label>
                    <label
                      >Telefono (opcional)<input
                        v-model="draft.phone"
                        type="tel"
                        maxlength="30"
                        placeholder="Ej: +56 9 1234 5678"
                    /></label>
                  </div>
                </section>
                <section v-if="mode !== 'edit'" class="driver-editor-section">
                  <div class="driver-section-heading">
                    <SvgIcon name="reporte" />
                    <div>
                      <h3>{{ isRenewal ? "Nueva licencia" : "Licencia de conducir" }}</h3>
                      <p>Información de la licencia del conductor.</p>
                    </div>
                  </div>
                  <label
                    >{{ isRenewal ? "Nuevo vencimiento" : "Fecha de vencimiento"
                    }}<input
                      v-model="draft.expiresAt"
                      type="date"
                      required
                      :min="isRenewal ? renewalMinDate : undefined"
                  /></label>
                  <fieldset class="driver-license-classes">
                    <legend>Clases de licencia</legend>
                    <div class="driver-class-grid">
                      <label
                        v-for="item in LICENSE_CLASSES"
                        :key="item"
                        class="driver-class"
                        :class="{ checked: draft.classes.includes(item) }"
                        ><input v-model="draft.classes" type="checkbox" :value="item" /><span>{{
                          item
                        }}</span></label
                      >
                    </div>
                  </fieldset>
                </section>
              </div>
              <section class="driver-editor-section driver-document-section">
                <div class="driver-section-heading">
                  <SvgIcon name="support-attachment" />
                  <div>
                    <h3>
                      {{
                        isRenewal
                          ? "Fotos de la nueva licencia (opcional)"
                          : "Documentos (opcional)"
                      }}
                    </h3>
                    <p>Adjunta imágenes de la licencia de conducir.</p>
                  </div>
                </div>
                <div class="driver-form-grid">
                  <label v-for="side in sides" :key="side.key"
                    >Licencia ({{ side.label.toLowerCase() }})<input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      @cancel.stop
                      @change="selectFile(side.key, $event)"
                    /><small v-if="files[side.key]">{{ files[side.key].name }}</small
                    ><img
                      v-if="filePreviews[side.key]"
                      class="driver-upload-preview"
                      :src="filePreviews[side.key]"
                      :alt="'Vista previa: ' + side.label.toLowerCase()"
                    /><button
                      v-else-if="!isRenewal && mode === 'edit' && selected?.photos?.[side.key]"
                      type="button"
                      @click="showPhoto(selected.photos[side.key])"
                    >
                      Ver foto guardada
                    </button></label
                  >
                </div>
              </section>
              <p v-if="isRenewal" class="driver-note">
                La licencia anterior y sus fotos se conservaran en el historial.
              </p>
              <img
                v-if="previewUrl"
                class="driver-photo"
                :src="previewUrl"
                alt="Fotografia de licencia"
              />
            </template>
            <section v-else class="renewal-confirmation" aria-label="Confirmar renovacion">
              <h3>Confirmar nueva licencia</h3>
              <dl class="driver-detail">
                <div>
                  <dt>Vencimiento anterior</dt>
                  <dd>{{ licenseDateLabel(selected.expiresAt) }}</dd>
                </div>
                <div>
                  <dt>Nuevo vencimiento</dt>
                  <dd>{{ licenseDateLabel(draft.expiresAt) }}</dd>
                </div>
                <div>
                  <dt>Clases anteriores</dt>
                  <dd>{{ selected.classes.join(", ") }}</dd>
                </div>
                <div>
                  <dt>Nuevas clases</dt>
                  <dd>{{ draft.classes.join(", ") }}</dd>
                </div>
              </dl>
              <p class="driver-note">La licencia anterior y sus fotos quedaran en el historial.</p>
            </section>
          </div>
          <footer>
            <button
              type="button"
              :disabled="busy"
              @click="renewalConfirmation ? (renewalConfirmation = false) : close()"
            >
              {{ renewalConfirmation ? "Volver" : "Cancelar" }}</button
            ><button type="submit" class="primary" :disabled="busy || !draft.classes.length">
              {{
                busy
                  ? "Guardando..."
                  : isRenewal
                    ? renewalConfirmation
                      ? "Confirmar renovacion"
                      : "Revisar renovacion"
                    : mode === "create"
                      ? "Guardar conductor"
                      : "Guardar cambios"
              }}
            </button>
          </footer>
        </form>
        <template v-else>
          <nav
            class="driver-history-tabs driver-detail-tabs"
            aria-label="Secciones del conductor"
            :inert="!!previewUrl"
          >
            <button
              v-for="tab in detailTabs"
              :key="tab.key"
              type="button"
              :class="{ selected: historySection === tab.key }"
              :aria-pressed="historySection === tab.key"
              @click="selectDetailTab(tab.key)"
            >
              <SvgIcon :name="tab.key === 'current' ? 'reporte' : 'maintenance-time'" />{{
                tab.label
              }}
            </button>
          </nav>
          <div class="driver-dialog-body" :inert="!!previewUrl">
            <p v-if="dialogError" role="alert" class="driver-error">{{ dialogError }}</p>
            <section v-if="historySection === 'current'" aria-label="Licencia actual">
              <dl class="driver-license-summary">
                <div>
                  <dt>Estado</dt>
                  <dd>
                    <span class="driver-summary-status" :class="selectedLicenseState.key">{{
                      selectedLicenseState.label
                    }}</span>
                  </dd>
                </div>
                <div>
                  <dt>Clase de licencia</dt>
                  <dd>
                    <span
                      v-for="item in selected.classes"
                      :key="item"
                      class="driver-profile-class"
                      >{{ item }}</span
                    >
                  </dd>
                </div>
                <div>
                  <dt><SvgIcon name="maintenance-calendar" />Vencimiento</dt>
                  <dd>{{ licenseDateLabel(selected.expiresAt) }}</dd>
                </div>
                <div>
                  <dt><SvgIcon name="maintenance-time" />{{ selectedExpirySummary.label }}</dt>
                  <dd>{{ selectedExpirySummary.value }}</dd>
                </div>
              </dl>
              <div class="driver-profile-columns" :class="{ 'driver-profile-readonly': !canEdit }">
                <section class="driver-profile-panel">
                  <h3 class="driver-profile-heading"><SvgIcon name="user" />Datos del conductor</h3>
                  <dl class="driver-profile-data">
                    <div>
                      <dt>RUT</dt>
                      <dd>{{ selected.rut }}</dd>
                    </div>
                    <div>
                      <dt>Teléfono</dt>
                      <dd>
                        <a
                          v-if="selected.phone"
                          :href="'tel:' + selected.phone.replace(/[^+0-9]/g, '')"
                          >{{ selected.phone }}</a
                        ><span v-else>No registrado</span>
                      </dd>
                    </div>
                  </dl>
                </section>
                <section v-if="canEdit" class="driver-profile-panel">
                  <h3 class="driver-profile-heading"><SvgIcon name="pencil" />Acciones</h3>
                  <div class="driver-profile-actions">
                    <button
                      v-if="['soon', 'expired'].includes(selectedLicenseState.key)"
                      type="button"
                      class="primary"
                      @click="open('renew', selected)"
                    >
                      <SvgIcon name="maintenance-time" />Renovar licencia
                    </button>
                    <button type="button" @click="open('edit', selected)">
                      <SvgIcon name="pencil" />Editar datos
                    </button>
                  </div>
                </section>
              </div>
              <section class="driver-profile-panel driver-profile-documents">
                <h3 class="driver-profile-heading">
                  <SvgIcon name="support-attachment" />Fotos de la licencia actual
                </h3>
                <div class="driver-profile-photos">
                  <template v-for="side in sides" :key="side.key">
                    <button
                      v-if="selected.photos?.[side.key]"
                      class="driver-profile-photo"
                      type="button"
                      :aria-label="'Ampliar licencia: ' + side.label.toLowerCase()"
                      @click="showPhoto(selected.photos[side.key], selected.photos, side.key)"
                    >
                      <img
                        v-if="photoThumbnails[side.key]?.url"
                        class="driver-license-thumbnail"
                        :src="photoThumbnails[side.key].url"
                        :alt="'Licencia: ' + side.label.toLowerCase()"
                      />
                      <span v-else class="driver-thumbnail-status">{{
                        photoThumbnails[side.key]?.error
                          ? "Imagen no disponible"
                          : "Cargando imagen..."
                      }}</span
                      ><strong>Licencia ({{ side.label.toLowerCase() }})</strong
                      ><span>Ampliar imagen</span>
                    </button>
                    <div v-else class="driver-profile-photo empty">
                      <SvgIcon name="support-attachment" /><strong
                        >Licencia ({{ side.label.toLowerCase() }})</strong
                      ><span>Sin imagen</span>
                    </div>
                  </template>
                </div>
              </section>
            </section>
            <template v-else>
              <h3 class="driver-history-title">
                Historial de renovaciones ({{ selected.history.length }})
              </h3>
              <p v-if="!selected.history.length">Sin renovaciones registradas.</p>
              <article
                v-for="entry in [...selected.history].reverse()"
                :key="entry.id"
                class="driver-license-history-row"
              >
                <dl class="driver-license-history-data">
                  <div class="driver-history-classes">
                    <dt>Licencia anterior</dt>
                    <dd>
                      <span
                        v-for="item in entry.classes"
                        :key="item"
                        class="driver-profile-class"
                        >{{ item }}</span
                      >
                    </dd>
                  </div>
                  <div>
                    <SvgIcon name="maintenance-calendar" />
                    <dt>Vencimiento</dt>
                    <dd>{{ licenseDateLabel(entry.expiresAt) }}</dd>
                  </div>
                  <div>
                    <SvgIcon name="maintenance-time" />
                    <dt>Renovada el</dt>
                    <dd>{{ licenseDateLabel(driverToday(entry.renewedAt)) }}</dd>
                  </div>
                  <div>
                    <SvgIcon name="user" />
                    <dt>Registrado por</dt>
                    <dd>{{ entry.renewedBy }}</dd>
                  </div>
                </dl>
                <div class="driver-license-history-actions">
                  <template v-for="side in sides" :key="side.key"
                    ><button
                      type="button"
                      :disabled="!entry.photos?.[side.key]"
                      :title="
                        entry.photos?.[side.key]
                          ? 'Ver ' + side.label.toLowerCase()
                          : 'Sin imagen del ' + side.label.toLowerCase()
                      "
                      @click="showPhoto(entry.photos[side.key], entry.photos, side.key)"
                    >
                      <SvgIcon name="reporte" />Ver {{ side.label.toLowerCase() }}
                    </button></template
                  >
                </div>
              </article>
            </template>
          </div>
          <footer :inert="!!previewUrl">
            <button type="button" @click="close">Cerrar</button>
          </footer>
        </template>
        <section
          v-if="mode === 'detail' && previewUrl"
          class="driver-photo-viewer"
          aria-label="Imagen de la licencia"
          @keydown.left.prevent="switchPhoto(-1)"
          @keydown.right.prevent="switchPhoto(1)"
        >
          <div class="driver-photo-viewer-toolbar">
            <strong>Licencia · {{ photoSide === "back" ? "Reverso" : "Frente" }}</strong>
            <button
              ref="photoViewerClose"
              type="button"
              aria-label="Cerrar imagen"
              title="Cerrar imagen"
              @click="closePhotoViewer"
            >
              <SvgIcon name="close" />
            </button>
          </div>
          <div class="driver-photo-viewer-image">
            <img
              :src="previewUrl"
              :alt="'Licencia: ' + (photoSide === 'back' ? 'reverso' : 'frente')"
            />
          </div>
          <div class="driver-photo-viewer-navigation">
            <button
              type="button"
              aria-label="Imagen anterior"
              title="Imagen anterior"
              :disabled="viewerPhotos.length < 2"
              @click="switchPhoto(-1)"
            >
              <SvgIcon name="chevron-left" />
            </button>
            <span>{{ photoSide === "back" ? "Reverso" : "Frente" }}</span>
            <button
              type="button"
              aria-label="Imagen siguiente"
              title="Imagen siguiente"
              :disabled="viewerPhotos.length < 2"
              @click="switchPhoto(1)"
            >
              <SvgIcon name="chevron-right" />
            </button>
          </div>
        </section>
      </dialog>
    </Teleport>
  </section>
</template>

<script setup>
import {
  computed,
  nextTick,
  onActivated,
  onDeactivated,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue"
import SvgIcon from "../icons/SvgIcon.vue"
import { useAccessControl } from "../../composables/auth/useAccessControl.js"
import { useAuthSession } from "../../composables/auth/useAuthSession.js"
import { createDriverLicenseStore } from "../../services/maintenance/driverLicenseStore.js"
import { createDriverLicenseRepository } from "../../services/maintenance/driverLicenseRepository.js"
import {
  saveMaintenanceEvidenceFile,
  getMaintenanceEvidence,
  deleteMaintenanceEvidence,
} from "../../services/maintenance/maintenanceEvidenceStorage.js"
import {
  LICENSE_CLASSES,
  driverToday,
  licenseDateLabel,
  licenseState,
  normalizeDriverLicense,
  validateDriverRenewal,
} from "../../utils/maintenance/driverLicenseUtils.js"
import { formatCompanyRut } from "../../utils/companies/companyRut.js"
import {
  buildDriverLicenseList,
  filterDriverLicenseList,
  sortDriverLicenseList,
} from "../../utils/maintenance/driverLicenseList.js"
import { useDebouncedValue } from "../../composables/ui/useDebouncedValue.js"
import {
  seedDriverLicenseDemo,
  seedDriverHistoryPhotos,
} from "../../services/maintenance/driverLicenseDemo.js"

const props = defineProps({
  companyId: { type: String, required: true },
  companyName: { type: String, default: "" },
})
const { canAccessFunction } = useAccessControl()
const { currentUser } = useAuthSession()
const canView = computed(
  () => !!props.companyId && canAccessFunction("maintenance-view", props.companyId, "view"),
)
const canEdit = computed(
  () => canView.value && canAccessFunction("maintenance-plans", props.companyId, "edit"),
)
const error = ref(""),
  dialogError = ref(""),
  today = ref(driverToday())
let storage
try {
  storage = window.localStorage
} catch {
  /* Surface errors through the store. */
}
const store = createDriverLicenseStore({
  storage,
  repository: createDriverLicenseRepository({ companyId: props.companyId, legacyStorage: storage }),
  companyId: props.companyId,
  canView: () => canView.value,
  canEdit: () => active && canEdit.value,
  author: () => currentUser.value?.name || currentUser.value?.email || "Usuario",
})
const records = computed(() => (canView.value ? store.records.value : []))
const preparedList = computed(() => buildDriverLicenseList(records.value, today.value))
const rows = computed(() => preparedList.value.rows)
const counts = computed(() => preparedList.value.counts)
const states = [
  { key: "all", label: "Todos" },
  { key: "valid", label: "Vigentes" },
  { key: "soon", label: "Por vencer" },
  { key: "expired", label: "Vencidos" },
]
const search = ref(""),
  status = ref("all"),
  licenseClass = ref("all"),
  page = ref(1)
const pageSizeChoice = ref("auto")
const automaticPageSize = ref(5)
const pageSize = computed(() =>
  pageSizeChoice.value === "auto" ? automaticPageSize.value : Number(pageSizeChoice.value),
)
const tableViewport = ref(null)
let tableSizeObserver = null
let tableSizeFrame = 0
let measuredRowHeight = 58
let measuredTableWidth = 0
const updateAutomaticPageSize = () => {
  if (!active || !tableViewport.value || pageSizeChoice.value !== "auto") return
  if (window.innerWidth <= 600) {
    automaticPageSize.value = 5
    return
  }
  const viewport = tableViewport.value
  if (measuredTableWidth !== viewport.clientWidth) {
    measuredTableWidth = viewport.clientWidth
    measuredRowHeight = 58
  }
  const available =
    viewport.clientHeight - (viewport.querySelector("thead")?.getBoundingClientRect().height || 44)
  const rows = [...viewport.querySelectorAll("tbody tr")].filter(
    (row) => !row.querySelector(".driver-empty"),
  )
  measuredRowHeight = Math.max(
    measuredRowHeight,
    ...rows.map((row) => row.getBoundingClientRect().height),
  )
  const rowHeight = measuredRowHeight
  if (available > 0) automaticPageSize.value = Math.max(1, Math.floor(available / rowHeight))
}
const stopTableSizeObserver = () => {
  tableSizeObserver?.disconnect()
  tableSizeObserver = null
  cancelAnimationFrame(tableSizeFrame)
}
const observeTableSize = async () => {
  await nextTick()
  if (!alive || !active || !tableViewport.value) return
  stopTableSizeObserver()
  tableSizeObserver = new ResizeObserver(() => {
    cancelAnimationFrame(tableSizeFrame)
    tableSizeFrame = requestAnimationFrame(updateAutomaticPageSize)
  })
  tableSizeObserver.observe(tableViewport.value)
  const table = tableViewport.value.querySelector("table")
  if (table) tableSizeObserver.observe(table)
  updateAutomaticPageSize()
}
watch(pageSizeChoice, () => {
  void nextTick(updateAutomaticPageSize)
})
const delayedSearch = useDebouncedValue(search, 120)
const matched = computed(() =>
  filterDriverLicenseList(rows.value, delayedSearch.value, status.value, licenseClass.value),
)
const sortableColumns = [
  { key: "name", label: "Conductor" },
  { key: "classes", label: "Clase de licencia" },
  { key: "expiry", label: "Vencimiento" },
  { key: "status", label: "Estado" },
]
const sortKey = ref("expiry"),
  sortDirection = ref("asc")
const filtered = computed(() =>
  sortDriverLicenseList(matched.value, sortKey.value, sortDirection.value),
)
const toggleSort = (key) => {
  if (sortKey.value === key) sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc"
  else {
    sortKey.value = key
    sortDirection.value = "asc"
  }
}
const pages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize.value)))
const visible = computed(() =>
  filtered.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value),
)
const pageNumbers = computed(() => {
  const first = Math.max(1, Math.min(page.value - 2, pages.value - 4))
  return Array.from({ length: Math.min(5, pages.value) }, (_, index) => first + index)
})
watch([delayedSearch, status, licenseClass, pageSize, sortKey, sortDirection], () => {
  page.value = 1
})
watch(pages, (value) => {
  page.value = Math.min(page.value, value)
})
const clearFilters = () => {
  search.value = ""
  status.value = "all"
  licenseClass.value = "all"
  sortKey.value = "expiry"
  sortDirection.value = "asc"
}
const dialog = ref(null),
  mode = ref(""),
  selected = ref(null),
  busy = ref(false),
  previewUrl = ref("")
const selectedLicenseState = computed(() => licenseState(selected.value?.expiresAt, today.value))
const selectedExpirySummary = computed(() => {
  const days = selectedLicenseState.value.days
  if (days === null) return { label: "Vigencia", value: "Sin fecha" }
  if (days === 0) return { label: "Vencimiento", value: "Hoy" }
  return {
    label: days < 0 ? "Venció hace" : "Vence en",
    value: `${Math.abs(days)} ${Math.abs(days) === 1 ? "día" : "días"}`,
  }
})
const isRenewal = computed(() => mode.value === "renew")
const renewalMinDate = computed(() => {
  const previous = selected.value?.expiresAt
  const next = previous
    ? new Date(Date.parse(previous) + 86400000).toISOString().slice(0, 10)
    : today.value
  return next > today.value ? next : today.value
})
const draft = ref({}),
  files = ref({})
const filePreviews = ref({})
watch(files, (selectedFiles, _previous, onCleanup) => {
  const urls = {}
  for (const side of ["front", "back"]) {
    if (selectedFiles[side]) urls[side] = URL.createObjectURL(selectedFiles[side])
  }
  filePreviews.value = urls
  onCleanup(() => Object.values(urls).forEach((url) => URL.revokeObjectURL(url)))
})
const renewalConfirmation = ref(false)
const historySection = ref("current")
const detailTabs = computed(() => [
  { key: "current", label: "Licencia actual" },
  { key: "renewals", label: `Licencias anteriores (${selected.value?.history?.length || 0})` },
])
const selectDetailTab = (key) => {
  clearPreview()
  dialogError.value = ""
  historySection.value = key
}
const titles = {
  create: "Agregar conductor",
  edit: "Editar datos del conductor",
  renew: "Renovar licencia",
  detail: "Conductor y licencia",
}
const sides = [
  { key: "front", label: "Frente" },
  { key: "back", label: "Reverso" },
]
let alive = true,
  photoRequest = 0,
  timer
let active = true
let formRevision = 0
const photoThumbnails = ref({})
const photoSet = ref({})
const photoSide = ref("front")
const photoViewerClose = ref(null)
const viewerPhotos = computed(() => sides.filter((side) => photoSet.value?.[side.key]))
let photoReturnFocus = null
watch([mode, selected, canView], async ([currentMode, row, permitted], _old, onCleanup) => {
  let cancelled = false
  const urls = []
  photoThumbnails.value = {}
  onCleanup(() => {
    cancelled = true
    urls.forEach((url) => URL.revokeObjectURL(url))
  })
  if (currentMode !== "detail" || !row || !permitted) return
  await Promise.all(
    sides.map(async (side) => {
      const photo = row.photos?.[side.key]
      if (!photo) return
      try {
        const blob = await getMaintenanceEvidence(photo.storageId)
        if (cancelled || !alive || !active || !canView.value) return
        if (!blob || !["image/jpeg", "image/png", "image/webp"].includes(blob.type))
          throw new Error("missing")
        const url = URL.createObjectURL(blob)
        urls.push(url)
        photoThumbnails.value = { ...photoThumbnails.value, [side.key]: { url } }
      } catch {
        if (!cancelled)
          photoThumbnails.value = { ...photoThumbnails.value, [side.key]: { error: true } }
      }
    }),
  )
})
const closePhotoViewer = async () => {
  clearPreview()
  await nextTick()
  if (photoReturnFocus?.isConnected) photoReturnFocus.focus()
  photoReturnFocus = null
}
const switchPhoto = (direction) => {
  const photos = viewerPhotos.value
  if (photos.length < 2) return
  const index = photos.findIndex((side) => side.key === photoSide.value)
  const next = photos[(index + direction + photos.length) % photos.length]
  void showPhoto(photoSet.value[next.key], photoSet.value, next.key)
}
const clearPreview = () => {
  photoRequest++
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = ""
}
const close = () => {
  if (busy.value) return
  formRevision++
  clearPreview()
  dialog.value?.close()
  mode.value = ""
  files.value = {}
}
const open = async (target, row = null) => {
  if (busy.value || !active || !canView.value || (target !== "detail" && !canEdit.value)) return
  if (
    target === "renew" &&
    !["soon", "expired"].includes(licenseState(row?.expiresAt, driverToday()).key)
  )
    return
  formRevision++
  clearPreview()
  dialogError.value = ""
  files.value = {}
  selected.value = row
  renewalConfirmation.value = false
  historySection.value = "current"
  draft.value = row
    ? {
        name: row.name,
        rut: row.rut,
        phone: row.phone,
        classes: [...row.classes],
        expiresAt: target === "renew" ? "" : row.expiresAt,
      }
    : { name: "", rut: "", phone: "", classes: [], expiresAt: "" }
  mode.value = target
  await nextTick()
  if (alive && active && dialog.value && !dialog.value.open) dialog.value.showModal()
}
const setRut = (event) => {
  const value = formatCompanyRut(event.target.value)
  event.target.value = value
  draft.value.rut = value
}
const selectFile = (side, event) => {
  const file = event.target.files?.[0]
  if (!file) return
  if (
    !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    file.size <= 0 ||
    file.size > 5 * 1024 * 1024
  ) {
    dialogError.value = "Selecciona JPG, PNG o WebP de hasta 5 MB."
    event.target.value = ""
    return
  }
  files.value = { ...files.value, [side]: file }
  dialogError.value = ""
  clearPreview()
}
const showPhoto = async (photo, photos = null, side = "front") => {
  if (mode.value === "detail" && !previewUrl.value) photoReturnFocus = document.activeElement
  clearPreview()
  const request = photoRequest
  try {
    if (!canView.value) throw new Error("Sin permiso para ver esta licencia.")
    const blob = await getMaintenanceEvidence(photo.storageId)
    if (!alive || !active || request !== photoRequest || !canView.value || !mode.value) return
    if (!blob || !["image/jpeg", "image/png", "image/webp"].includes(blob.type))
      throw new Error("La foto no esta disponible en este navegador.")
    previewUrl.value = URL.createObjectURL(blob)
    photoSet.value = photos || { [side]: photo }
    photoSide.value = side
    if (mode.value === "detail") {
      await nextTick()
      photoViewerClose.value?.focus()
    }
  } catch (failure) {
    if (alive) dialogError.value = failure.message
  }
}
const save = async () => {
  if (busy.value) return
  const revision = formRevision
  const savingUserId = currentUser.value?.id
  const renewal = isRenewal.value
  const selectedId = selected.value?.id || null
  busy.value = true
  dialogError.value = ""
  const uploaded = []
  try {
    const payload = normalizeDriverLicense(draft.value)
    if (renewal) {
      validateDriverRenewal(payload.expiresAt, selected.value, driverToday())
      if (!renewalConfirmation.value) {
        renewalConfirmation.value = true
        return
      }
    }
    const fileSnapshot = { ...files.value }
    const photos = {}
    for (const side of sides)
      if (fileSnapshot[side.key]) {
        const photo = await saveMaintenanceEvidenceFile(fileSnapshot[side.key])
        photos[side.key] = photo
        uploaded.push(photo.storageId)
      }
    if (!alive || !active || revision !== formRevision || savingUserId !== currentUser.value?.id)
      throw new Error("Se cerro el formulario.")
    await store.save(payload, {
      id: selectedId,
      renewal,
      photos,
    })
    uploaded.length = 0
    error.value = ""
    busy.value = false
    close()
  } catch (failure) {
    if (alive) dialogError.value = failure.message
  } finally {
    await Promise.allSettled(uploaded.map(deleteMaintenanceEvidence))
    busy.value = false
  }
}
let demoPhotoTask = null
const isExporting = ref(false)
const exportMenuOpen = ref(false)
const exportControl = ref(null)
const closeExportMenu = () => {
  exportMenuOpen.value = false
}
const toggleExportMenu = async () => {
  exportMenuOpen.value = !exportMenuOpen.value
  if (exportMenuOpen.value) {
    await nextTick()
    exportControl.value?.querySelector(".driver-export-menu button")?.focus()
  }
}
const dismissExportMenu = (event) => {
  if (!exportControl.value?.contains(event.target)) closeExportMenu()
}
onMounted(() => document.addEventListener("pointerdown", dismissExportMenu))
onBeforeUnmount(() => document.removeEventListener("pointerdown", dismissExportMenu))
const exportReport = async (format) => {
  if (isExporting.value || !canView.value || !filtered.value.length) return
  closeExportMenu()
  isExporting.value = true
  error.value = ""
  const userId = currentUser.value?.id
  const rows = filtered.value.map((row) => ({
    ...row,
    classes: [...row.classes],
    history: (row.history || []).map((entry) => ({ ...entry, classes: [...entry.classes] })),
  }))
  try {
    const exporter =
      format === "pdf"
        ? (await import("../../services/maintenance/driverLicensePdfExport.js"))
            .exportDriverLicensesPdf
        : (await import("../../services/maintenance/driverLicenseExcelExport.js"))
            .exportDriverLicenses
    await exporter(rows, {
      companyName: props.companyName,
      today: today.value,
      reportWidthPx: document.documentElement.clientWidth - 32,
      filters: [
        states.find((item) => item.key === status.value)?.label || "Todos",
        licenseClass.value === "all" ? "Todas las clases" : `Clase ${licenseClass.value}`,
        delayedSearch.value ? `Busqueda: ${delayedSearch.value}` : "",
      ]
        .filter(Boolean)
        .join(" · "),
      shouldDownload: () => alive && active && canView.value && currentUser.value?.id === userId,
    })
  } catch (failure) {
    if (alive && active) error.value = `No se pudo exportar: ${failure.message}`
  } finally {
    isExporting.value = false
  }
}
const reload = async () => {
  try {
    await store.load()
    if (import.meta.env.DEV && canEdit.value && /schuck/i.test(props.companyName)) {
      await seedDriverLicenseDemo(store, today.value, () => alive && active && canEdit.value)
      if (!alive || !active) return
      if (!demoPhotoTask) {
        demoPhotoTask = seedDriverHistoryPhotos(store, () => alive && active && canEdit.value)
        try {
          await demoPhotoTask
        } finally {
          demoPhotoTask = null
        }
        if (!alive || !active) return
        if (mode.value === "detail" && selected.value)
          selected.value =
            store.records.value.find((row) => row.id === selected.value.id) || selected.value
      }
    }
    error.value = ""
  } catch (failure) {
    error.value = failure.message
  }
}
watch(canView, (value) => {
  if (!value) {
    formRevision++
    clearPreview()
    dialog.value?.close()
    mode.value = ""
  }
})
const activate = () => {
  active = true
  today.value = driverToday()
  reload()
  void observeTableSize()
  clearInterval(timer)
  timer = window.setInterval(() => {
    today.value = driverToday()
  }, 60000)
}
onMounted(activate)
onActivated(() => {
  if (!active) activate()
})
onDeactivated(() => {
  closeExportMenu()
  stopTableSizeObserver()
  formRevision++
  active = false
  clearInterval(timer)
  clearPreview()
  dialog.value?.close()
  mode.value = ""
  files.value = {}
})
onBeforeUnmount(() => {
  stopTableSizeObserver()
  formRevision++
  alive = false
  clearInterval(timer)
  clearPreview()
  dialog.value?.close()
})
</script>

<style scoped>
.drivers-tab {
  color: #10234c;
  font-size: 15px;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.drivers-list-header,
.driver-filters,
.driver-pagination {
  flex-shrink: 0;
}
.drivers-toolbar,
.driver-filters,
.driver-pagination,
.driver-pagination > div {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.drivers-toolbar {
  justify-content: flex-end;
  margin-bottom: 0;
}
.driver-export-control {
  position: relative;
}
.driver-export-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 6px);
  z-index: 4;
  width: 190px;
  padding: 6px;
  background: #fff;
  border: 1px solid #d5deea;
  border-radius: 6px;
  box-shadow: 0 6px 20px #14274720;
}
.drivers-toolbar .driver-export-menu button {
  width: 100%;
  border: 0;
  box-shadow: none;
  justify-content: flex-start;
  font-size: 14px;
  padding: 8px 12px;
}
.drivers-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}
.drivers-list-header .drivers-toolbar {
  margin-left: auto;
  padding-bottom: 4px;
}
h2 {
  font-size: 21px;
  font-weight: 700;
}
h3 {
  font-size: 17px;
  font-weight: 700;
  margin: 20px 0 12px;
}
h2 span {
  font-size: 15px;
  color: #63748e;
  margin-left: 8px;
}
button,
input,
select,
textarea {
  border: 1px solid #cfd9e8;
  background: #fff;
  border-radius: 5px;
  min-height: 42px;
  padding: 8px 12px;
  font: inherit;
  color: inherit;
}
button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  border-radius: 8px;
  color: #102372;
  font-weight: 800;
}
.drivers-toolbar button,
.driver-clear-filters,
.driver-view-button {
  box-shadow: 0 2px 6px rgb(15 35 80 / 6%);
  border-color: #d5deea;
}
.drivers-toolbar button {
  min-height: 40px;
  padding: 0 20px;
  font-size: 16px;
  font-weight: 900;
}
button:hover {
  background: #eff4fc;
}
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
button :deep(svg) {
  width: 18px;
  height: 18px;
}
button.primary {
  background: #102372;
  color: #fff;
  border-color: #102372;
}
button:focus-visible,
input:focus-visible,
select:focus-visible {
  outline: 2px solid #2967db;
  outline-offset: 2px;
}
.driver-states {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 2px;
}
.driver-states button {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 12px;
  border: 0;
  border: 1px solid transparent;
  border-bottom: 0;
  border-radius: 7px 7px 0 0;
  padding: 9px 20px;
  min-height: 46px;
  background: transparent;
}
.driver-states button:last-child {
  border-right: 0;
}
.driver-states .selected {
  border-color: #dce5f4;
  background: #f1f5ff;
}
.driver-states .selected .driver-metric-label {
  color: #173aa5;
}
.driver-metric-label {
  color: #63748e;
  font-weight: 600;
  font-size: 14px;
}
.driver-states strong {
  font-size: 14px;
  line-height: 1.2;
  padding: 4px 10px;
  border-radius: 16px;
  background: #e4e9fb;
  color: #173aa5;
}
.driver-states [data-state="expired"] strong {
  color: #c12a37;
  background: #ffe0e4;
}
.driver-states [data-state="soon"] strong {
  color: #ab5c0b;
  background: #ffedcb;
}
.driver-states [data-state="valid"] strong {
  color: #178164;
  background: #d9f3e7;
}
.driver-search-input {
  position: relative;
  display: block;
}
.driver-search-input input {
  padding-left: 40px;
}
.driver-search-input :deep(svg) {
  width: 18px;
  height: 18px;
}
.driver-search-input :deep(.svg-icon-wrapper) {
  position: absolute;
  width: 18px;
  height: 18px;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #63748e;
  pointer-events: none;
}
.driver-identity {
  display: flex;
  align-items: center;
  gap: 12px;
}
.driver-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 36px;
  width: 36px;
  height: 36px;
  background: #edf1f7;
  color: #405678;
  border-radius: 50%;
  font-size: 13px;
  font-weight: 700;
}
.driver-avatar[data-tone="0"] {
  background: #deecff;
  color: #1654c2;
}
.driver-avatar[data-tone="1"] {
  background: #e8e2ff;
  color: #5134b5;
}
.driver-avatar[data-tone="2"] {
  background: #f9e0ee;
  color: #a12b64;
}
.driver-avatar[data-tone="3"] {
  background: #ffedcd;
  color: #98600d;
}
.driver-avatar[data-tone="4"] {
  background: #d7f1e7;
  color: #17674f;
}
.driver-avatar[data-tone="5"] {
  background: #ffe1e1;
  color: #aa303a;
}
.driver-class-tag {
  display: inline-block;
  margin: 3px 6px 3px 0;
  padding: 3px 7px;
  border: 1px solid #dce3ee;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 700;
  background: #fafbfd;
}
.driver-muted {
  color: #7c899e;
  font-size: 14px;
}
.expired-text {
  color: #b91c1c;
}
.driver-view-button {
  white-space: nowrap;
}
.driver-view-button :deep(svg) {
  width: 15px;
  height: 15px;
}
.driver-table-scroll tbody tr:hover {
  background: #f8fafc;
}
.driver-empty :deep(svg) {
  width: 28px;
  height: 28px;
  margin: 0 auto 10px;
}
@media (max-width: 600px) {
  .driver-states {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .driver-states button {
    min-height: 42px;
    padding: 8px 10px;
  }
  .driver-states button:nth-child(-n + 2) {
    border-top: 0;
    border-bottom-width: 0;
  }
  .driver-states button:nth-child(n + 3) {
    border-top: 0;
  }
}
.driver-filters {
  display: grid;
  grid-template-columns: minmax(240px, 1fr) minmax(220px, 260px) auto;
  gap: 18px;
  margin: 0 0 12px;
  padding: 8px 12px;
  background: #fff;
  border: 1px solid #e0e7f1;
  border-radius: 0 6px 6px 6px;
  align-items: center;
}
.driver-search-label {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
.driver-clear-filters {
  background: #fff;
  white-space: nowrap;
  justify-self: end;
  min-height: 38px;
}
.driver-filters input,
.driver-filters select {
  min-height: 38px;
  padding-top: 6px;
  padding-bottom: 6px;
}
.driver-filters label {
  font-size: 14px;
  color: #526b94;
  font-weight: 800;
  gap: 4px;
}
label {
  display: grid;
  gap: 7px;
  min-width: 0;
  font-weight: 600;
}
input,
select {
  width: 100%;
  min-width: 0;
  font-weight: 400;
}
.driver-filters label:first-child {
  width: 100%;
  max-width: 100%;
}
.driver-table-scroll {
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  overflow: auto;
  border: 1px solid #dce3ee;
  border-radius: 6px;
  background: #fff;
}
table {
  width: 100%;
  table-layout: fixed;
  min-width: 950px;
  border-collapse: separate;
  border-spacing: 0;
  align-self: flex-start;
}
thead tr {
  height: 44px;
}
thead {
  height: 44px;
}
thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  height: 44px;
  padding-top: 0;
  padding-bottom: 0;
}
th {
  text-align: left;
  font-size: 13px;
  background: #f1f4f8;
  color: #536988;
}
th,
td {
  padding: 8px 16px;
  border-bottom: 1px solid #e3e9f2;
  vertical-align: middle;
}
td {
  height: 58px;
  padding-top: 8px;
  padding-bottom: 8px;
}
th:first-child {
  width: auto;
}
th:nth-child(2) {
  width: 14%;
}
th:nth-child(3) {
  width: 20%;
}
th:nth-child(4) {
  width: 15%;
}
th:last-child {
  width: 170px;
  text-align: right;
}
td strong {
  font-size: 14px;
}
.driver-sort-button {
  border: 0;
  padding: 4px 0;
  min-height: 26px;
  background: transparent;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}
.driver-sort-button :deep(svg) {
  width: 12px;
  height: 12px;
  opacity: 0.45;
}
.driver-sort-button :deep(.sort-active) {
  opacity: 1;
}
.sort-up {
  transform: rotate(180deg);
}
.driver-row-actions {
  white-space: nowrap;
  text-align: right;
}
.driver-identity > div {
  min-width: 0;
  overflow-wrap: anywhere;
}
.driver-row-actions button {
  min-height: 34px;
  font-size: 13px;
}
.driver-update-button {
  margin-left: 8px;
}
td small {
  display: block;
  color: #63748e;
  margin-top: 5px;
  font-size: 13px;
}
.driver-state {
  padding: 5px 9px;
  border-radius: 4px;
  font-weight: 700;
}
.driver-state::before {
  content: "";
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
  margin-right: 6px;
  vertical-align: middle;
}
.expired {
  color: #b91c1c;
  background: #fff0f0;
}
.soon {
  color: #9a4a00;
  background: #fff3df;
}
.valid {
  color: #126047;
  background: #e9f8f1;
}
.driver-empty {
  text-align: center;
  color: #63748e;
  height: 100px;
}
.driver-pagination {
  justify-content: space-between;
  margin-top: 0;
  padding: 10px 14px;
  background: white;
  border: 1px solid #dce3ee;
  border-top: 0;
  border-radius: 0 0 6px 6px;
}
.driver-pagination button {
  min-height: 34px;
  padding: 6px 10px;
}
.driver-page-number.selected {
  background: #173aa5;
  color: white;
  border-color: #173aa5;
}
@media (max-width: 1000px) {
  .driver-filters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }
}
.driver-pagination select {
  width: auto;
  min-width: 140px;
}
.driver-error {
  padding: 12px;
  margin: 8px 0;
  background: #fff0f0;
  color: #b91c1c;
  border-radius: 4px;
}
.driver-dialog {
  position: fixed;
  inset: 0;
  margin: auto;
  width: min(800px, calc(100vw - 32px));
  max-height: calc(100dvh - 32px);
  padding: 0;
  border: 1px solid #dce3ee;
  border-radius: 8px;
  color: #10234c;
  background: #fff;
}
.driver-dialog[open] {
  display: flex;
  flex-direction: column;
}
.driver-dialog.driver-create-dialog {
  width: min(1120px, calc(100vw - 32px));
}
.driver-dialog.driver-profile-dialog {
  width: min(1120px, calc(100vw - 32px));
  height: min(800px, calc(100dvh - 32px));
  overflow: hidden;
}
.driver-profile-dialog header {
  padding: 22px 28px;
}
.driver-profile-dialog header h2 {
  font-size: 26px;
}
.driver-profile-dialog header p {
  font-size: 18px;
}
.driver-profile-dialog .driver-dialog-body {
  flex: 1;
  scrollbar-gutter: stable;
  padding: 24px 28px;
}
.driver-profile-dialog .driver-detail-tabs {
  margin: 0 28px;
  padding: 0;
  gap: 16px;
}
.driver-profile-dialog .driver-detail-tabs button {
  min-height: 60px;
  border: 0;
  border-bottom: 3px solid transparent;
  border-radius: 0;
  background: transparent;
  padding: 12px 18px;
  color: #63748e;
  font-size: 18px;
}
.driver-profile-dialog .driver-detail-tabs button.selected {
  border-bottom-color: #ff6600;
  color: #102372;
}
.driver-profile-columns {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  gap: 24px;
}
.driver-profile-columns.driver-profile-readonly {
  grid-template-columns: minmax(0, 1fr);
}
.driver-license-summary {
  display: grid;
  grid-template-columns: 1fr 0.8fr 1.1fr 1fr;
  padding: 14px 20px;
  gap: 20px;
  margin-bottom: 16px;
  background: #f7f9fc;
  border-top: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
}
.driver-license-summary > div {
  min-width: 0;
}
.driver-license-summary > div + div {
  border-left: 1px solid #dce3ee;
  padding-left: 20px;
}
.driver-license-summary dt {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #526b94;
  font-size: 14px;
  margin-bottom: 10px;
}
.driver-license-summary dt :deep(svg) {
  width: 18px;
  height: 18px;
}
.driver-license-summary dd {
  margin: 0;
  font-size: 21px;
  font-weight: 800;
  overflow-wrap: anywhere;
}
.driver-summary-status {
  display: inline-block;
  border-radius: 6px;
  padding: 5px 10px;
  font-size: 18px;
}
.driver-profile-actions {
  display: grid;
  gap: 10px;
  padding: 16px;
}
.driver-profile-actions button {
  width: 100%;
  min-height: 40px;
}
.driver-profile-columns .driver-profile-heading,
.driver-profile-documents .driver-profile-heading {
  padding: 14px 20px;
}
.driver-profile-columns .driver-profile-data > div {
  padding: 14px 0;
}
.driver-profile-documents .driver-profile-photos {
  padding: 14px;
}
.driver-profile-documents .driver-profile-photo {
  min-height: 110px;
}
.driver-profile-documents .driver-license-thumbnail {
  height: 120px;
}
@media (max-width: 700px) {
  .driver-license-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
    padding: 16px;
  }
  .driver-license-summary > div + div {
    padding-left: 0;
    border-left: 0;
  }
  .driver-license-summary dd {
    font-size: 18px;
  }
}
.driver-profile-panel {
  border: 1px solid #dce3ee;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 2px #1427470c;
}
.driver-profile-heading {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 0;
  padding: 18px 22px;
  font-size: 19px;
  background: #f7f9fc;
}
.driver-profile-heading :deep(svg) {
  width: 24px;
  height: 24px;
}
.driver-profile-data {
  padding: 0 22px 14px;
}
.driver-profile-data > div {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
  gap: 12px;
  padding: 18px 0;
}
.driver-profile-data > div + div {
  border-top: 1px solid #e3e9f2;
}
.driver-profile-data dt {
  font-size: 15px;
}
.driver-profile-data dd {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  overflow-wrap: anywhere;
}
.driver-profile-data dd > span:only-child:not(.driver-profile-expiry):not(.driver-profile-class) {
  color: #7182a3;
}
.driver-profile-class {
  display: inline-block;
  padding: 2px 12px;
  border-radius: 6px;
  background: #deecff;
  color: #102372;
  margin: 0 4px 4px 0;
}
.driver-profile-expiry {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.driver-profile-state {
  font-size: 13px;
  padding: 3px 9px;
  border-radius: 6px;
}
.driver-profile-documents {
  margin-top: 22px;
}
.driver-profile-photos {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px;
  padding: 20px;
}
.driver-profile-photo {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 8px;
  min-height: 132px;
  width: 100%;
  padding: 16px;
  border: 1px dashed #cad5e7;
  border-radius: 8px;
  background: #fbfcfe;
  text-align: center;
}
.driver-profile-photo :deep(svg) {
  width: 28px;
  height: 28px;
}
.driver-profile-photo span {
  color: #63748e;
  font-size: 14px;
  font-weight: 400;
}
.driver-profile-photo:not(.empty) {
  padding: 0 0 12px;
  overflow: hidden;
  border-style: solid;
}
.driver-license-thumbnail {
  width: 100%;
  height: 150px;
  object-fit: contain;
  background: #eef1f5;
}
.driver-thumbnail-status {
  display: flex;
  min-height: 150px;
  align-items: center;
  justify-content: center;
}
.driver-photo-viewer {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}
.driver-photo-viewer-toolbar,
.driver-photo-viewer-navigation {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 20px;
  flex-shrink: 0;
}
.driver-photo-viewer-navigation {
  justify-content: center;
  border-top: 1px solid #dce3ee;
}
.driver-photo-viewer-image {
  flex: 1;
  min-height: 0;
  padding: 16px;
  background: #eef1f5;
  display: flex;
  align-items: center;
  justify-content: center;
}
.driver-photo-viewer-image img {
  max-width: 100%;
  max-height: 100%;
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.driver-profile-documents > .driver-photo {
  width: calc(100% - 40px);
  margin: 0 20px 20px;
}
.driver-profile-dialog footer {
  padding: 18px 28px;
}
@media (max-width: 800px) {
  .driver-profile-columns {
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
  }
  .driver-profile-dialog .driver-detail-tabs button {
    font-size: 15px;
    padding: 10px 8px;
  }
}
@media (max-width: 600px) {
  .driver-profile-photos {
    grid-template-columns: minmax(0, 1fr);
    gap: 14px;
  }
  .driver-profile-dialog .driver-dialog-body {
    padding: 16px;
  }
  .driver-profile-dialog .driver-detail-tabs {
    margin: 0 16px;
    gap: 4px;
  }
  .driver-profile-dialog header h2 {
    font-size: 22px;
  }
}
.driver-editor-sections {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.driver-editor-sections.driver-renewal-sections {
  grid-template-columns: minmax(0, 1fr);
}
.driver-editor-section {
  min-width: 0;
  border: 1px solid #dce3ee;
  border-radius: 8px;
  padding: 20px;
  background: #fcfdff;
}
.driver-section-heading {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 22px;
}
.driver-section-heading > :deep(.svg-icon-wrapper) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 42px;
  height: 42px;
  border-radius: 8px;
  color: #2151df;
  background: #e8eeff;
}
.driver-section-heading :deep(svg) {
  width: 22px;
  height: 22px;
}
.driver-section-heading h3 {
  margin: 0 0 4px;
  font-size: 18px;
}
.driver-section-heading p {
  color: #7182a3;
  font-size: 14px;
}
.driver-personal-fields {
  display: grid;
  gap: 18px;
}
.driver-document-section {
  margin-top: 18px;
}
.driver-upload-preview {
  display: block;
  width: 100%;
  height: 180px;
  object-fit: contain;
  border: 1px solid #dce3ee;
  border-radius: 6px;
  background: #f4f7fb;
  margin-top: 6px;
}
.driver-license-classes {
  border: 0;
  padding: 0;
  margin: 20px 0 0;
}
.driver-license-classes legend {
  margin-bottom: 10px;
}
.driver-class-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
}
.driver-class-grid label.driver-class {
  position: relative;
  justify-content: center;
  min-height: 46px;
  margin: 0;
  border: 1px solid #cfd9e8;
  border-radius: 6px;
  background: white;
  cursor: pointer;
}
.driver-class-grid .driver-class input {
  position: absolute;
  opacity: 0;
  width: 100%;
  height: 100%;
  inset: 0;
  cursor: pointer;
}
.driver-class-grid .driver-class.checked {
  background: #2151df;
  border-color: #2151df;
  color: white;
}
.driver-class-grid .driver-class.checked span::before {
  content: "\2713";
  margin-right: 6px;
}
.driver-class-grid .driver-class:focus-within {
  outline: 2px solid #2967db;
  outline-offset: 2px;
}
.driver-document-section input[type="file"] {
  border-style: dashed;
  font-size: 13px;
  padding: 6px;
}
.driver-document-section input::file-selector-button {
  border: 1px solid #cfd9e8;
  border-radius: 5px;
  background: white;
  color: #102372;
  padding: 8px 12px;
  margin-right: 12px;
  cursor: pointer;
}
.driver-dialog::backdrop {
  background: #0007;
}
.driver-dialog header,
.driver-dialog footer {
  padding: 18px 22px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid #dce3ee;
  flex-wrap: wrap;
  flex-shrink: 0;
}
.driver-dialog header p {
  margin-top: 4px;
  color: #63748e;
}
.driver-dialog form {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}
.driver-dialog-body {
  padding: 22px;
  overflow-y: auto;
  min-height: 0;
}
.driver-dialog footer {
  border-top: 1px solid #dce3ee;
  border-bottom: 0;
}
.driver-form-grid,
.driver-detail {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}
fieldset {
  margin: 22px 0;
  padding: 14px;
  border: 1px solid #dce3ee;
  border-radius: 5px;
}
legend {
  font-weight: 700;
}
label.driver-class {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 4px 16px 4px 0;
  min-height: 32px;
}
.driver-class input {
  width: 18px;
  min-height: 18px;
  height: 18px;
}
.driver-detail dt {
  color: #63748e;
  margin-bottom: 6px;
}
.driver-detail dd {
  font-weight: 600;
  margin: 0;
  overflow-wrap: anywhere;
}
.driver-photo-actions {
  display: flex;
  gap: 12px;
  margin: 20px 0;
  flex-wrap: wrap;
}
.driver-photo {
  display: block;
  width: 100%;
  max-height: 320px;
  object-fit: contain;
  margin: 18px 0;
}
.driver-renewal {
  border-top: 1px solid #dce3ee;
  padding: 14px 0;
}
summary {
  cursor: pointer;
  font-weight: 600;
}
.driver-renewal p {
  margin: 12px 0;
}
.driver-renewal button {
  margin-right: 8px;
}
.driver-note {
  margin-top: 18px;
  color: #63748e;
}
.driver-detail-heading {
  margin: 0 0 14px;
  font-size: 17px;
}
.driver-detail + .driver-detail-heading {
  margin-top: 22px;
}
.driver-detail a {
  text-decoration: underline;
  color: #173aa5;
}
.expiry-message {
  display: block;
  margin-top: 6px;
  color: #63748e;
  font-size: 14px;
  font-weight: 400;
}
.driver-history-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 22px 0 16px;
  border-bottom: 1px solid #dce3ee;
  padding-bottom: 12px;
}
.driver-history-tabs .selected {
  border-color: #173aa5;
  background: #edf3ff;
}
.driver-detail-tabs {
  flex-shrink: 0;
  margin: 0;
  padding: 14px 22px;
}
.driver-history-title {
  margin: 8px 0 20px;
  font-size: 20px;
}
.driver-license-history-row {
  display: flex;
  align-items: center;
  gap: 20px;
  border: 1px solid #d5deea;
  border-radius: 8px;
  padding: 22px;
  margin-bottom: 18px;
}
.driver-license-history-row:last-child {
  margin-bottom: 0;
}
.driver-license-history-data {
  display: grid;
  grid-template-columns: 0.8fr 1.1fr 1.1fr 1.5fr;
  gap: 20px;
  flex: 1;
  min-width: 0;
}
.driver-license-history-data > div {
  position: relative;
  min-width: 0;
  padding-left: 30px;
}
.driver-license-history-data > div.driver-history-classes {
  padding-left: 0;
  padding-right: 14px;
  border-right: 1px solid #dce3ee;
}
.driver-license-history-data :deep(.svg-icon-wrapper) {
  position: absolute;
  left: 0;
  top: 3px;
  color: #102372;
}
.driver-license-history-data :deep(svg) {
  width: 20px;
  height: 20px;
}
.driver-license-history-data dt {
  font-size: 13px;
  color: #526b94;
  margin-bottom: 6px;
}
.driver-license-history-data dd {
  margin: 0;
  font-size: 14px;
  font-weight: 800;
  overflow-wrap: anywhere;
}
.driver-license-history-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding-left: 20px;
  border-left: 1px solid #dce3ee;
}
.driver-license-history-actions button {
  white-space: nowrap;
  font-size: 14px;
  min-height: 42px;
}
@media (max-width: 1000px) {
  .driver-license-history-row {
    flex-wrap: wrap;
  }
  .driver-license-history-data {
    flex-basis: 100%;
  }
  .driver-license-history-actions {
    padding-left: 0;
    border: 0;
  }
}
@media (max-width: 600px) {
  .driver-license-history-data {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
  }
  .driver-license-history-row {
    padding: 16px;
  }
  .driver-license-history-actions {
    width: 100%;
  }
  .driver-license-history-actions button {
    flex: 1;
  }
}
.driver-renewal small {
  color: #63748e;
}
textarea {
  width: 100%;
  resize: vertical;
  min-height: 100px;
}
@media (max-width: 600px) {
  .driver-editor-sections {
    grid-template-columns: minmax(0, 1fr);
  }
  .driver-editor-section {
    padding: 16px;
  }
  .drivers-tab {
    height: auto;
    min-height: auto;
  }
  .driver-table-scroll {
    display: block;
    flex: 1 0 auto;
  }
  .driver-filters {
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
  }
  .driver-clear-filters {
    justify-self: stretch;
  }
  .driver-table-scroll table {
    min-width: 0;
    table-layout: auto;
  }
  .driver-table-scroll thead {
    display: none;
  }
  .driver-table-scroll tbody {
    display: block;
  }
  .driver-table-scroll tr {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
    padding: 16px;
    border-bottom: 1px solid #dce3ee;
  }
  .driver-table-scroll td {
    display: block;
    height: auto;
    border: 0;
    padding: 0;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .driver-table-scroll td:first-child,
  .driver-table-scroll td:last-child {
    grid-column: 1 / -1;
  }
  .driver-table-scroll td[data-label]::before {
    content: attr(data-label);
    display: block;
    color: #63748e;
    font-size: 12px;
    margin-bottom: 6px;
  }
  .driver-view-button {
    flex: 1;
    width: auto;
  }
  .driver-table-scroll td.driver-row-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    white-space: normal;
  }
  .driver-row-actions .driver-update-button {
    flex: 1;
    margin-left: 0;
  }
  .driver-form-grid,
  .driver-detail {
    grid-template-columns: minmax(0, 1fr);
  }
  .driver-dialog header,
  .driver-dialog footer,
  .driver-dialog-body {
    padding: 16px;
  }
}
</style>
