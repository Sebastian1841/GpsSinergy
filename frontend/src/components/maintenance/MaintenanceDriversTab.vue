<template>
  <section class="drivers-tab" aria-label="Conductores y licencias">
    <p v-if="error" class="driver-error" role="alert">{{ error }}</p>
    <div class="drivers-controls">
    <div class="drivers-list-header">
      <div><h2 class="drivers-list-title"><SvgIcon name="reporte" />Licencias de conducir</h2><p class="drivers-list-subtitle">Control de vigencias y registro de renovaciones de las licencias de los conductores.</p></div>
      <div class="drivers-toolbar">
        <button v-if="canEdit" type="button" title="Agregar conductor" aria-label="Agregar conductor" @click="open('create')">
          <SvgIcon name="user" />Agregar conductor
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
      <label class="driver-status-filter"><span class="driver-search-label">Vencimiento</span>
        <select v-model="status" aria-label="Filtrar licencias por vencimiento">
          <option v-for="option in states" :key="option.key" :value="option.key">{{ option.label }} ({{ counts[option.key] }})</option>
        </select>
      </label>
      <label class="driver-license-filter"
        ><span class="driver-search-label">Clase de licencia</span
        ><select v-model="licenseClass" title="Clase de licencia">
          <option value="all">Todas las clases</option>
          <option v-for="item in LICENSE_CLASSES" :key="item" :value="item">
            {{ item }}
          </option>
        </select></label
      >
      <button type="button" class="driver-clear-filters" @click="clearFilters">
        <SvgIcon name="filter-clear" />Limpiar filtros
      </button>
      <div ref="exportControl" class="driver-export-control" @keydown.esc.stop="closeExportMenu">
        <button type="button" :disabled="isExporting || !filtered.length || !canView" :aria-expanded="exportMenuOpen" @click="toggleExportMenu">
          <SvgIcon name="download" />{{ isExporting ? 'Exportando...' : 'Exportar' }}<SvgIcon name="chevron-down" />
        </button>
        <div v-if="exportMenuOpen && canView" class="driver-export-menu" role="group" aria-label="Formato de exportacion">
          <button type="button" @click="exportReport('excel')"><SvgIcon name="download" />Excel (.xlsx)</button>
          <button type="button" @click="exportReport('pdf')"><SvgIcon name="reporte" />PDF (.pdf)</button>
        </div>
      </div>
    </div>
    </div>
    <div ref="tableViewport" class="driver-table-scroll">
      <table class="driver-license-table">
        <colgroup><col style="width: 16%" /><col style="width: 10%" /><col style="width: 5%" /><col style="width: 9%" /><col style="width: 8%" /><col style="width: 10%" /><col style="width: 9%" /><col style="width: 33%" /></colgroup>
        <thead>
          <tr>
            <template v-for="column in sortableColumns" :key="column.key">
            <th
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
            <th v-if="column.key === 'name'">RUT</th>
            <template v-if="column.key === 'expiry'">
              <th>Dias restantes</th>
              <th>Ultima renovacion</th>
            </template>
            </template>
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
                  <strong class="driver-name">{{ row.name }}</strong>
                </div>
              </div>
            </td>
            <td data-label="RUT">{{ row.rut }}</td>
            <td data-label="Clase de licencia">
              <span v-for="item in row.classes" :key="item" class="driver-class-tag">{{
                item
              }}</span>
            </td>
            <td data-label="Vencimiento">
              <strong>{{ row.expiryLabel }}</strong>
            </td>
            <td data-label="Dias restantes" :class="{ 'expired-text': row.state.key === 'expired' }">{{ row.state.days === null ? '-' : `${row.state.days} dias` }}</td>
            <td data-label="Ultima renovacion">{{ latestRenewalLabel(row) }}</td>
            <td data-label="Estado">
              <span class="driver-state" :class="row.state.key">{{ row.state.label }}</span>
            </td>
            <td class="driver-row-actions">
              <div class="driver-action-buttons">
              <button type="button" class="driver-view-button" :aria-label="'Ver licencia de ' + row.name" @click="open('detail', row)"><SvgIcon name="reporte" />Ver licencia</button>
              <button v-if="canEdit && row.state.key !== 'unknown'" type="button" class="driver-renew-button" @click="open('renew', row)">
                <SvgIcon name="maintenance-calendar" />Registrar renovacion
              </button>
              <button type="button" class="driver-history-button" @click="openHistory(row)"><SvgIcon name="maintenance-time" />Historial</button>
              </div>
            </td>
          </tr>
          <tr v-if="!filtered.length">
            <td colspan="8" class="driver-empty">
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
      <aside v-if="licenseAlerts.length && canView" class="driver-alert-toast" role="status" aria-live="polite">
        <SvgIcon name="maintenance-calendar" /><div><strong>Licencias de conducir</strong><p>{{ licenseAlerts.length }} {{ licenseAlerts.length === 1 ? 'licencia requiere' : 'licencias requieren' }} atencion</p><small v-for="alert in licenseAlerts.slice(0, 3)" :key="alert.key">{{ alert.name }}: {{ alert.days < 0 ? 'vencida' : alert.days === 0 ? 'vence hoy' : `vence en ${alert.days} dias` }}</small><button type="button" @click="reviewLicenseAlerts">Ver licencias que requieren atencion</button></div><button type="button" title="Cerrar aviso" aria-label="Cerrar aviso de licencias" @click="licenseAlerts = []"><SvgIcon name="close" /></button>
      </aside>
      <dialog
        v-if="mode"
        ref="dialog"
        class="driver-dialog"
        :class="{
          'driver-create-dialog': mode === 'create',
          'driver-current-dialog': mode === 'detail',
          'driver-reference-dialog': mode !== 'create',
          'driver-renew-dialog': mode === 'renew',
          'driver-renew-history-dialog': mode === 'detail' && historySection === 'renewals',
        }"
        aria-labelledby="driver-dialog-title"
        @cancel.self.prevent="mode === 'detail' && previewUrl ? closePhotoViewer() : close()"
      >
        <header :inert="mode === 'detail' && !!previewUrl">
          <SvgIcon v-if="mode !== 'create'" :name="mode === 'renew' ? 'maintenance-calendar' : 'reporte'" class="driver-reference-heading-icon" />
          <div>
            <h2 id="driver-dialog-title">{{ mode === 'detail' && historySection === 'renewals' ? 'Historial de renovaciones' : titles[mode] }}</h2>
            <p>{{ mode === 'renew' ? 'Actualiza la informacion de la licencia de conducir.' : mode === 'detail' && historySection === 'renewals' ? 'Registro de renovaciones de la licencia de conducir.' : mode === "create" ? companyName : selected?.name }}</p>
          </div>
          <button type="button" title="Cerrar" aria-label="Cerrar" :disabled="busy" @click="close">
            <SvgIcon name="close" />
          </button>
        </header>
        <div v-if="selected && (mode === 'renew' || (mode === 'detail' && historySection === 'renewals'))" class="driver-reference-summary" :inert="!!previewUrl">
          <SvgIcon name="user" />
          <div><strong>{{ selected.name }}</strong><small>RUT: {{ selected.rut }}</small></div>
          <div><small>Licencia actual: <strong>{{ selected.classes.join(', ') }}</strong></small><small>Vencimiento: {{ licenseDateLabel(selected.expiresAt) }}</small></div>
          <span class="driver-state" :class="selectedLicenseState.key">{{ selectedLicenseState.label }}</span>
        </div>
        <form v-if="mode === 'detail' && currentSection === 'management'" @submit.prevent="saveManagement">
          <div class="driver-dialog-body">
            <p v-if="dialogError" class="driver-error" role="alert">{{ dialogError }}</p>
            <p v-if="selectedNeedsFollowUp" class="driver-photo-warning" role="status">Fecha agendada pasada: {{ licenseDateLabel(driverManagementStatus(selected, today).appointmentDate) }}. Resultado pendiente.</p>
            <div class="driver-reference-form">
              <label>Seguimiento<select v-model="draft.result" required :disabled="busy || !canEdit"><option value="" disabled>Seleccionar seguimiento</option><option v-for="option in managementOptions" :key="option.value" :value="option.value">{{ option.label }}</option></select></label>
              <label v-if="draft.result === 'appointment'">Fecha agendada<input v-model="draft.appointmentDate" type="date" :min="today" required :disabled="busy || !canEdit" /></label>
              <label class="driver-reference-notes">Observacion (opcional)<textarea v-model="draft.observation" rows="2" maxlength="500" :disabled="busy || !canEdit" /></label>
            </div>
            <details v-if="selectedManagements.length" class="driver-management-history"><summary>Seguimientos registrados ({{ selectedManagements.length }})</summary><div v-for="entry in selectedManagements" :key="entry.id"><strong>{{ driverManagementLabel(entry.result) }}</strong><small>{{ licenseDateLabel(driverToday(entry.createdAt)) }} · {{ entry.author }}</small><small v-if="entry.appointmentDate">Fecha agendada: {{ licenseDateLabel(entry.appointmentDate) }}</small><p v-if="entry.observation">{{ entry.observation }}</p></div></details>
          </div>
          <footer><button type="button" :disabled="busy" @click="open('detail', selected)">Volver a licencia</button><button v-if="canEdit" type="submit" class="primary" :disabled="busy || !draft.result || !managementChanged">{{ busy ? 'Guardando...' : 'Guardar seguimiento' }}</button></footer>
        </form>
        <form v-else-if="mode !== 'detail' || isEditing" @submit.prevent="save">
          <div class="driver-dialog-body">
            <p v-if="dialogError" role="alert" class="driver-error">{{ dialogError }}</p>
            <template v-if="!renewalConfirmation">
              <div v-if="isRenewal" class="driver-reference-form">
                <label><span>Fecha de renovacion <span class="driver-required">*</span></span><input v-model="draft.renewedOn" type="date" :min="renewalDateMin" :max="today" required /></label>
                <label><span>Nueva fecha de vencimiento <span class="driver-required">*</span></span><input v-model="draft.expiresAt" type="date" :min="renewalMinDate" required /></label>
                <div class="driver-reference-class"><span>Clase de licencia <span class="driver-required">*</span></span>
                  <details class="driver-class-select"><summary>{{ draft.classes.join(', ') || 'Seleccionar clase' }}</summary><div class="driver-class-grid"><label v-for="item in LICENSE_CLASSES" :key="item" class="driver-class" :class="{ checked: draft.classes.includes(item) }"><input v-model="draft.classes" type="checkbox" :value="item" /><span>{{ item }}</span></label></div></details>
                </div>
                <section class="driver-renewal-photos" aria-labelledby="driver-renewal-photos-title">
                  <h3 id="driver-renewal-photos-title">Fotografias de la nueva licencia</h3>
                  <div class="driver-renewal-photo-grid">
                <div v-for="side in sides" :key="side.key" class="driver-renewal-photo-field">
                <label class="driver-renewal-photo-label">
                  <span class="driver-receipt-upload driver-renewal-photo-upload">
                    <img v-if="filePreviews[side.key]" :src="filePreviews[side.key]" :alt="'Nueva licencia: ' + side.label.toLowerCase()" />
                    <SvgIcon v-else name="reporte" />
                    <strong>{{ side.label }}</strong><small>{{ files[side.key]?.name || 'JPG, PNG o WebP (max. 5 MB)' }}</small>
                    <span class="driver-upload-command"><SvgIcon name="upload" />{{ files[side.key] ? 'Cambiar fotografia' : 'Subir fotografia' }}</span>
                    <input :key="files[side.key]?.name || 'empty'" type="file" accept="image/jpeg,image/png,image/webp" :aria-label="'Fotografia de la nueva licencia: ' + side.label.toLowerCase()" @cancel.stop @change="selectFile(side.key, $event)" />
                  </span>
                </label>
                <button v-if="files[side.key]" type="button" class="driver-photo-remove" :disabled="busy" :aria-label="'Quitar foto: ' + side.label.toLowerCase()" @click="removePhoto(side.key)"><SvgIcon name="trash" />Quitar fotografia</button>
                </div>
                  </div>
                </section>
                <details class="driver-renewal-additional"><summary>Informacion adicional (opcional)</summary>
                <label class="driver-renewal-receipt">Comprobante adicional (opcional)<span class="driver-receipt-upload driver-receipt-upload-bar"><SvgIcon name="reporte" /><span class="driver-receipt-copy">{{ files.receipt?.name || 'PDF, JPG o PNG (max. 5 MB)' }}</span><span class="driver-upload-command">{{ files.receipt ? 'Cambiar archivo' : 'Adjuntar archivo' }}</span><input type="file" accept="application/pdf,image/jpeg,image/png" @cancel.stop @change="selectReceipt" /></span></label>
                <label class="driver-reference-notes">Observaciones (opcional)<textarea v-model="draft.notes" maxlength="1000" rows="3" placeholder="Ej: Renovacion realizada en Direccion de Transito..." /></label>
                </details>
              </div>
              <template v-else>
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
                <section class="driver-editor-section">
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
                      :min="isRenewal ? renewalMinDate : isEditing ? renewalDateMin : undefined"
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
                  <template v-if="isEditing && licenseCorrectionNeeded">
                    <label>Motivo de la correccion<input v-model="draft.correctionReason" maxlength="500" required placeholder="Ej: Fecha ingresada incorrectamente" /></label>
                    <label class="driver-correction-confirm"><input v-model="draft.confirmCorrection" type="checkbox" required />Confirmo que es una correccion y no una renovacion.</label>
                  </template>
                  <p v-if="isEditing" class="driver-note">Corregir estos datos no registra una renovacion. El cambio queda en el historial.</p>
                </section>
              </div>
              <DriverLicenseNotificationsFields v-model="draft.notifications" :disabled="busy">
                <label>Anticipacion del aviso<div class="driver-notice-days"><input v-model="draft.warningDays" type="number" min="0" max="3650" step="1" required /><span>dias antes</span></div></label>
              </DriverLicenseNotificationsFields>
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
                      v-else-if="isEditing && selected?.photos?.[side.key]"
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
            </template>
            <section v-else class="renewal-confirmation" aria-label="Confirmar renovacion">
              <h3>Confirmar nueva licencia</h3>
              <dl class="driver-detail">
                <div><dt>Fecha de renovacion</dt><dd>{{ licenseDateLabel(draft.renewedOn) }}</dd></div>
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
              <p v-if="missingRenewalPhotos.length" class="driver-photo-warning" role="alert">Falta {{ missingRenewalPhotos.join(' y ') }} de la nueva licencia. Se guardara sin {{ missingRenewalPhotos.length === 1 ? 'esa foto' : 'esas fotos' }}; las anteriores quedaran solo en el historial.</p>
              <div class="driver-confirmed-photos"><span v-for="side in sides" :key="side.key">{{ side.label }}: {{ files[side.key]?.name || 'Sin fotografia nueva' }}</span></div>
            </section>
          </div>
          <footer>
            <button
              type="button"
              :disabled="busy"
              @click="renewalConfirmation ? (renewalConfirmation = false) : closeEditor()"
            >
              {{ renewalConfirmation ? "Volver" : editorFromDetail ? "Volver a licencia" : "Cancelar" }}</button
            ><button type="submit" class="primary" :disabled="busy || !draft.classes.length">
              {{
                busy
                  ? "Guardando..."
                  : isRenewal
                    ? renewalConfirmation
                      ? "Guardar con fotos pendientes"
                      : "Guardar renovacion"
                    : mode === "create"
                      ? "Guardar conductor"
                      : "Guardar cambios"
              }}
            </button>
          </footer>
        </form>
        <template v-else>
          <div class="driver-dialog-body" :inert="!!previewUrl">
            <p v-if="dialogError" role="alert" class="driver-error">{{ dialogError }}</p>
            <DriverCurrentLicense v-if="historySection === 'current'" :driver="selected" :state="selectedLicenseState" :expiry-summary="selectedExpirySummary" :expiry-date="licenseDateLabel(selected.expiresAt)" :management="driverManagementStatus(selected, today)" :appointment-date="licenseDateLabel(driverManagementStatus(selected, today).appointmentDate)" :thumbnails="photoThumbnails" :can-edit="canEdit"
              @renew="open('renew', selected)" @edit="open('edit', selected)" @manage="open('management', selected)" @history="selectDetailTab('renewals')" @photo="showPhoto(selected.photos[$event], selected.photos, $event)" />
            <template v-else>
              <details v-if="selected.corrections?.length" class="driver-management-history"><summary>Correcciones de datos ({{ selected.corrections.length }})</summary><div v-for="item in selected.corrections" :key="item.id"><strong>{{ licenseDateLabel(driverToday(item.createdAt)) }} · {{ item.author }}</strong><p>{{ item.reason }}</p><small>Anterior: {{ item.previous.classes.join(', ') }} · {{ licenseDateLabel(item.previous.expiresAt) }}</small><small>Corregido: {{ item.corrected.classes.join(', ') }} · {{ licenseDateLabel(item.corrected.expiresAt) }}</small></div></details>
              <h3 class="driver-history-title">
                Historial de renovaciones ({{ selected.history.length }})
              </h3>
              <p v-if="!selected.history.length">Sin renovaciones registradas.</p>
              <div v-else class="driver-history-table-wrap">
              <table class="driver-history-table">
                <thead><tr><th>Renovacion</th><th>Clase</th><th>Vencimiento</th><th>Registrado por</th><th>Documentos</th></tr></thead>
                <tbody>
              <tr
                v-for="entry in renewalHistory"
                :key="entry.id"
              >
                <td>{{ licenseDateLabel(driverToday(entry.renewedAt)) }}<small v-if="entry.notes">{{ entry.notes }}</small></td>
                <td>{{ entry.displayedLicense.classes.join(', ') }}<small v-if="entry.displayedLicense.isPrevious">Licencia anterior</small></td>
                <td>{{ licenseDateLabel(entry.displayedLicense.expiresAt) }}</td>
                <td>{{ entry.renewedBy }}</td>
                <td><div class="driver-license-history-actions">
                  <button v-if="entry.receipt" type="button" class="driver-receipt-link" @click="downloadReceipt(entry.receipt)"><SvgIcon name="reporte" />{{ entry.receipt.name }}<SvgIcon name="download" /></button>
                  <template v-if="entry.displayedLicense.photos?.front || entry.displayedLicense.photos?.back">
                  <template v-for="side in sides" :key="side.key"
                    ><button
                      type="button"
                      :disabled="!entry.displayedLicense.photos?.[side.key]"
                      :title="
                        entry.displayedLicense.photos?.[side.key]
                          ? 'Ver ' + side.label.toLowerCase()
                          : 'Sin imagen del ' + side.label.toLowerCase()
                      "
                      @click="showPhoto(entry.displayedLicense.photos[side.key], entry.displayedLicense.photos, side.key)"
                    >
                      <SvgIcon name="reporte" />Ver {{ side.label.toLowerCase() }}
                    </button></template
                  >
                  </template>
                  <span v-if="!entry.displayedLicense.photos?.front && !entry.displayedLicense.photos?.back" class="driver-history-no-photos">Sin fotos registradas</span>
                  <details v-if="!entry.displayedLicense.isPrevious" class="driver-previous-license">
                    <summary>Licencia anterior</summary>
                    <div><strong>{{ entry.classes.join(', ') }}</strong> · {{ licenseDateLabel(entry.expiresAt) }}</div>
                    <button v-for="side in sides.filter((item) => entry.photos?.[item.key])" :key="side.key" type="button" @click="showPhoto(entry.photos[side.key], entry.photos, side.key)"><SvgIcon name="reporte" />{{ side.label }}</button>
                    <small v-if="!entry.photos?.front && !entry.photos?.back">Sin fotos anteriores</small>
                  </details>
                  <details v-if="entry.managements.length" class="driver-management-history">
                    <summary>Seguimiento de la licencia anterior ({{ entry.managements.length }})</summary>
                    <div v-for="item in entry.managements" :key="item.id"><strong>{{ driverManagementLabel(item.result) }}</strong><small>{{ licenseDateLabel(driverToday(item.createdAt)) }} · {{ item.author }}</small><small v-if="item.appointmentDate">Fecha agendada: {{ licenseDateLabel(item.appointmentDate) }}</small><p v-if="item.observation">{{ item.observation }}</p></div>
                  </details>
                </div></td>
              </tr>
              </tbody></table></div>
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
import DriverLicenseNotificationsFields from './DriverLicenseNotificationsFields.vue'
import DriverCurrentLicense from './DriverCurrentLicense.vue'
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
  validateDriverRenewalDetails,
  validateDriverLicenseCorrection,
  DRIVER_MANAGEMENT_OPTIONS,
  driverManagementStatus,
  driverManagementLabel,
  currentDriverManagements,
  lastDriverRenewalDate,
} from "../../utils/maintenance/driverLicenseUtils.js"
import { normalizeDriverLicenseNotifications } from '../../utils/maintenance/driverLicenseNotifications.js'
import { getDriverRenewalLicense } from "../../utils/maintenance/driverLicenseHistory.js"
import { buildDriverLicenseAlerts, createDriverLicenseAlertTracker } from "../../services/maintenance/driverLicenseAlerts.js"
import { formatCompanyRut } from "../../utils/companies/companyRut.js"
import {
  buildDriverLicenseList,
  filterDriverLicenseList,
  sortDriverLicenseList,
  DRIVER_LICENSE_FILTERS,
  countDriverLicenseFilters,
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
const states = DRIVER_LICENSE_FILTERS
const search = ref(""),
  status = ref("all"),
  licenseClass = ref("all"),
  page = ref(1)
const managementOptions = DRIVER_MANAGEMENT_OPTIONS
const licenseAlerts = ref([])
const driversLoaded = ref(false)
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
  const available = Math.max(0, window.innerHeight - viewport.getBoundingClientRect().top - 100) -
    (viewport.querySelector("thead")?.getBoundingClientRect().height || 44)
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
const counts = computed(() => countDriverLicenseFilters(filterDriverLicenseList(rows.value, delayedSearch.value, 'all', licenseClass.value)))
const matched = computed(() =>
  filterDriverLicenseList(rows.value, delayedSearch.value, status.value, licenseClass.value),
)
const sortableColumns = [
  { key: "name", label: "Conductor" },
  { key: "classes", label: "Clase" },
  { key: "expiry", label: "Vencimiento" },
  { key: "status", label: "Vigencia" },
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
const selectedLicenseState = computed(() => licenseState(selected.value?.expiresAt, today.value, selected.value?.warningDays ?? 30))
const selectedManagements = computed(() => selected.value ? [...currentDriverManagements(selected.value)].reverse() : [])
const selectedNeedsFollowUp = computed(() => selected.value ? driverManagementStatus(selected.value, today.value).needsFollowUp : false)
const renewalDateMin = computed(() => lastDriverRenewalDate(selected.value) || undefined)
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
const currentSection = ref('view')
const isEditing = computed(() => mode.value === 'detail' && currentSection.value === 'edit')
const licenseCorrectionNeeded = computed(() => isEditing.value && selected.value && (draft.value.expiresAt !== selected.value.expiresAt || [...draft.value.classes].sort().join(',') !== [...selected.value.classes].sort().join(',')))
const renewalMinDate = computed(() => {
  const previous = selected.value?.expiresAt
  const next = previous
    ? new Date(Date.parse(previous) + 86400000).toISOString().slice(0, 10)
    : today.value
  return next > today.value ? next : today.value
})
const draft = ref({}),
  files = ref({})
const managementChanged = computed(() => {
  const latest = selected.value ? driverManagementStatus(selected.value, today.value).entry : null
  return !latest || latest.result !== draft.value.result || (latest.appointmentDate || '') !== (draft.value.result === 'appointment' ? draft.value.appointmentDate || '' : '') || !!String(draft.value.observation || '').trim()
})
const missingRenewalPhotos = computed(() => sides.filter((side) => !files.value[side.key]).map((side) => side.label.toLowerCase()))
const renewalHistory = computed(() => [...(selected.value?.history || [])].reverse().map((entry) => ({ ...entry, displayedLicense: getDriverRenewalLicense(entry, selected.value), managements: (selected.value?.managements || []).filter((item) => item.licenseId === entry.licenseId) })))
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
const editorFromDetail = ref(false)
const historySection = ref("current")
const selectDetailTab = (key) => {
  clearPreview()
  dialogError.value = ""
  historySection.value = key
}
const titles = {
  create: "Agregar conductor",
  renew: "Registrar renovacion",
  detail: "Licencia actual",
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
  if (!['create', 'detail', 'renew', 'edit', 'management'].includes(target)) return
  if (busy.value || !active || !canView.value || (!["detail", "management"].includes(target) && !canEdit.value)) return
  if (
    target === "renew" &&
    licenseState(row?.expiresAt, driverToday()).key === 'unknown'
  )
    return
  editorFromDetail.value = target === 'edit' || (target === 'renew' && mode.value === 'detail')
  currentSection.value = target === 'edit' || target === 'management' ? target : 'view'
  if (target === 'edit' || target === 'management') target = 'detail'
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
        renewedOn: driverToday(),
        notes: "",
        correctionReason: '',
        confirmCorrection: false,
        warningDays: row.warningDays ?? 30,
        result: canEdit.value && driverManagementStatus(row, today.value).needsFollowUp ? '' : driverManagementStatus(row, today.value).result,
        appointmentDate: canEdit.value && driverManagementStatus(row, today.value).needsFollowUp ? '' : driverManagementStatus(row, today.value).appointmentDate,
        observation: '',
        notifications: normalizeDriverLicenseNotifications(row.notifications),
      }
    : { name: "", rut: "", phone: "", classes: [], expiresAt: "", warningDays: 30, notifications: normalizeDriverLicenseNotifications() }
  mode.value = target
  await nextTick()
  if (alive && active && dialog.value && !dialog.value.open) dialog.value.showModal()
}
const setRut = (event) => {
  const value = formatCompanyRut(event.target.value)
  event.target.value = value
  draft.value.rut = value
}
const closeEditor = () => {
  if (editorFromDetail.value && selected.value) void open('detail', selected.value)
  else close()
}
const openHistory = async (row) => {
  await open('detail', row)
  if (mode.value === 'detail' && selected.value?.id === row.id) selectDetailTab('renewals')
}
const latestRenewalLabel = (row) => {
  const date = lastDriverRenewalDate(row)
  return date ? licenseDateLabel(date) : '-'
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
const removePhoto = (side) => {
  if (busy.value) return
  const next = { ...files.value }
  delete next[side]
  files.value = next
  renewalConfirmation.value = false
}
const selectReceipt = (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type) || file.size <= 0 || file.size > 5 * 1024 * 1024) {
    dialogError.value = 'Selecciona PDF, JPG o PNG de hasta 5 MB.'
    event.target.value = ''
    return
  }
  files.value = { ...files.value, receipt: file }
  dialogError.value = ''
}
const downloadReceipt = async (receipt) => {
  const revision = formRevision
  try {
    const blob = await getMaintenanceEvidence(receipt.storageId)
    if (!alive || !active || revision !== formRevision || !canView.value) return
    if (!blob) throw new Error('El comprobante no esta disponible.')
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = receipt.name
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  } catch (failure) {
    if (alive && active && revision === formRevision) dialogError.value = failure.message
  }
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
  const renewalDetails = { renewedOn: draft.value.renewedOn, notes: draft.value.notes }
  const returnToDetail = editorFromDetail.value
  const correction = licenseCorrectionNeeded.value ? { reason: draft.value.correctionReason } : null
  busy.value = true
  dialogError.value = ""
  const uploaded = []
  try {
    const payload = normalizeDriverLicense(draft.value)
    if (correction && !String(correction.reason || '').trim()) throw new Error('Indica el motivo de la correccion.')
    if (correction) validateDriverLicenseCorrection(payload.expiresAt, selected.value)
    if (renewal) {
      validateDriverRenewal(payload.expiresAt, selected.value, driverToday())
      validateDriverRenewalDetails(renewalDetails, payload.expiresAt, driverToday(), selected.value)
      if (missingRenewalPhotos.value.length && !renewalConfirmation.value) {
        renewalConfirmation.value = true
        return
      }
    }
    const fileSnapshot = { ...files.value }
    const photos = {}
    let receipt = null
    if (renewal && fileSnapshot.receipt) {
      receipt = await saveMaintenanceEvidenceFile(fileSnapshot.receipt)
      uploaded.push(receipt.storageId)
    }
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
      renewalDetails: renewal ? { ...renewalDetails, receipt } : {},
      correction,
    })
    uploaded.length = 0
    error.value = ""
    busy.value = false
    if (returnToDetail) {
      const updated = store.records.value.find((row) => row.id === selectedId)
      if (updated) await open('detail', updated)
      else close()
    } else close()
  } catch (failure) {
    if (alive) dialogError.value = failure.message
  } finally {
    await Promise.allSettled(uploaded.map(deleteMaintenanceEvidence))
    busy.value = false
  }
}
const saveManagement = async () => {
  if (busy.value || !canEdit.value || !selected.value) return
  const revision = formRevision
  const userId = currentUser.value?.id
  busy.value = true
  dialogError.value = ''
  try {
    await store.addManagement(selected.value.id, { result: draft.value.result, appointmentDate: draft.value.appointmentDate, observation: draft.value.observation })
    if (!alive || !active || revision !== formRevision || userId !== currentUser.value?.id) return
    busy.value = false
    const updated = store.records.value.find((row) => row.id === selected.value.id)
    if (updated) await open('detail', updated)
    else close()
  } catch (failure) {
    if (alive && active && revision === formRevision) dialogError.value = failure.message
  } finally {
    busy.value = false
  }
}
const refreshLicenseAlerts = () => {
  if (!alive || !active || !canView.value || !driversLoaded.value || !currentUser.value?.id) return
  try {
    const current = new Set(buildDriverLicenseAlerts(records.value, today.value).map((alert) => alert.key))
    licenseAlerts.value = licenseAlerts.value.filter((alert) => current.has(alert.key))
    const tracker = createDriverLicenseAlertTracker({ storage, companyId: props.companyId, userId: String(currentUser.value.id) })
    const fresh = tracker.unshown(records.value, today.value)
    if (fresh.length) {
      tracker.markShown(fresh)
      const shown = new Map([...licenseAlerts.value, ...fresh].map((alert) => [alert.driverId, alert]))
      licenseAlerts.value = [...shown.values()]
    }
  } catch (failure) {
    error.value = failure.message
  }
}
const reviewLicenseAlerts = () => {
  licenseAlerts.value = []
  clearFilters()
  status.value = 'attention'
  page.value = 1
}
watch([records, today, driversLoaded], refreshLicenseAlerts, { flush: 'post' })
watch(() => currentUser.value?.id, () => { licenseAlerts.value = []; refreshLicenseAlerts() })
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
  driversLoaded.value = false
  try {
    await store.load()
    driversLoaded.value = true
    if (import.meta.env.DEV && canEdit.value && /schuck|^transportes\s+san\s+pedro$/i.test(props.companyName.trim())) {
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
    driversLoaded.value = true
  } catch (failure) {
    error.value = failure.message
  }
}
watch(canView, (value) => {
  if (!value) {
    licenseAlerts.value = []
    formRevision++
    clearPreview()
    dialog.value?.close()
    mode.value = ""
  } else if (active) {
    void reload()
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
  licenseAlerts.value = []
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
.drivers-controls { flex-shrink: 0; padding: 20px 20px 16px; margin-bottom: 12px; border: 1px solid #d8e0eb; border-radius: 8px; background: #fff; }
.drivers-list-title { display: flex; align-items: center; gap: 10px; margin: 0; font-size: 18px; color: #102372; }
.drivers-list-title :deep(svg) { width: 24px; height: 24px; }
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
  font-size: 13px;
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
  gap: 6px;
  margin-top: 4px;
}
.driver-states button {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 0;
  border-bottom: 2px solid transparent;
  border-radius: 0;
  padding: 8px 12px;
  min-height: 40px;
  background: transparent;
}
.driver-states button:last-child {
  border-right: 0;
}
.driver-states .selected {
  border-bottom-color: #ff6600;
  background: transparent;
}
.driver-states .selected .driver-metric-label {
  color: #173aa5;
}
.driver-metric-label {
  color: #63748e;
  font-weight: 600;
  font-size: 12px;
}
.driver-states strong {
  font-size: 11px;
  line-height: 1.2;
  padding: 3px 6px;
  border-radius: 4px;
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
  grid-template-columns: minmax(240px, 1fr) minmax(170px, 210px) minmax(160px, 210px) auto auto;
  gap: 12px;
  margin: 12px 0 4px;
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
  flex: 0 1 auto;
  max-height: calc(100dvh - 340px);
  min-height: 0;
  display: flex;
  overflow: auto;
  border: 1px solid #dce3ee;
  border-radius: 6px;
  background: #fff;
}
.driver-history-table-wrap { overflow: auto; }
.driver-history-table { min-width: 660px; table-layout: auto; }
.driver-history-table th, .driver-history-table th:first-child, .driver-history-table th:last-child, .driver-history-table th:nth-child(n) { width: auto; text-align: left; }
.driver-history-table th { position: static; }
.driver-history-table td { font-size: 13px; }
.driver-history-table .driver-license-history-actions { display: flex; gap: 6px; flex-wrap: wrap; }
.driver-history-table .driver-license-history-actions button { min-height: 32px; padding: 4px 8px; font-size: 12px; }
table {
  width: 100%;
  table-layout: fixed;
  min-width: 1400px;
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
  width: 115px;
}
th:nth-child(3) {
  width: 80px;
}
th:nth-child(4) {
  width: 120px;
}
th:nth-child(5) { width: 140px; }
th:nth-child(6) { width: 125px; }
th:nth-child(7) { width: 110px; }
th:last-child {
  width: 360px;
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
  text-align: right;
}
.driver-action-buttons { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; min-width: 0; }
.driver-identity > div {
  min-width: 0;
  overflow-wrap: anywhere;
}
.driver-row-actions button {
  min-height: 34px;
  font-size: 13px;
}
.driver-row-actions .driver-renew-button { background: #fff; border-color: #cfd9e8; color: #102372; white-space: nowrap; }
.driver-row-actions .driver-renew-button:hover { background: #eef4ff; }
.driver-row-actions .driver-detail-icon { width: 34px; padding: 0; flex: 0 0 34px; }
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
@media (min-width: 900px) {
  .driver-dialog.driver-create-dialog header, .driver-dialog.driver-create-dialog footer { padding: 12px 22px; }
  .driver-create-dialog .driver-dialog-body { padding: 14px 22px; }
  .driver-create-dialog .driver-editor-section { padding: 14px 18px; }
  .driver-create-dialog .driver-section-heading { margin-bottom: 12px; gap: 12px; }
  .driver-create-dialog .driver-section-heading h3 { font-size: 16px; }
  .driver-create-dialog .driver-section-heading p { font-size: 12px; }
  .driver-create-dialog .driver-personal-fields { gap: 10px 14px; }
  .driver-create-dialog label { gap: 5px; font-size: 14px; }
  .driver-create-dialog input { min-height: 36px; padding: 6px 10px; }
  .driver-create-dialog .driver-license-classes { margin-top: 12px; }
  .driver-create-dialog .driver-license-classes legend { margin-bottom: 6px; font-size: 14px; }
  .driver-create-dialog .driver-class-grid { gap: 6px; }
  .driver-create-dialog .driver-class-grid label.driver-class { min-height: 36px; }
  .driver-create-dialog .driver-document-section { margin-top: 12px; }
  .driver-create-dialog .driver-document-section input[type="file"] { padding: 4px; }
  .driver-create-dialog .driver-document-section input::file-selector-button { padding: 5px 10px; }
  .driver-create-dialog :deep(.license-notification-fields) { margin-top: 12px; padding: 12px 18px; }
  .driver-create-dialog :deep(.notification-heading) { margin-bottom: 10px; gap: 12px; }
  .driver-create-dialog :deep(.notification-heading h3) { font-size: 16px; }
  .driver-create-dialog :deep(.notification-heading p) { font-size: 12px; }
  .driver-create-dialog :deep(.notification-channel) { margin-top: 8px; }
  .driver-create-dialog :deep(.notification-info) { margin-top: 10px; padding: 6px 10px; }
  .driver-create-dialog .driver-upload-preview { height: 72px; }
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
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}
.driver-personal-fields > label:first-child { grid-column: 1 / -1; }
.driver-notice-days { display: flex; align-items: center; gap: 16px; }
.driver-notice-days input { max-width: 220px; }
.driver-notice-days span { color: #63748e; white-space: nowrap; font-weight: 400; }
@media (max-width: 600px) {
  .driver-personal-fields { grid-template-columns: minmax(0, 1fr); }
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
  .driver-row-actions .driver-renew-button { flex: 1; margin-left: 0; }
  .driver-action-buttons { width: 100%; }
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
.drivers-list-subtitle { margin: 4px 0 0 34px; font-size: 12px; color: #52658c; }
.drivers-list-title :deep(.svg-icon-wrapper) { flex: 0 0 26px; width: 26px; height: 26px; }
.drivers-list-title :deep(svg) { width: 26px; height: 26px; }
.drivers-controls .driver-filters { margin-top: 20px; margin-bottom: 0; gap: 14px; }
.driver-license-table { min-width: 1320px; }
.driver-license-table th, .driver-license-table th:first-child, .driver-license-table th:nth-child(n), .driver-license-table th:last-child { width: auto; text-align: left; }
.driver-license-table th { height: 44px; white-space: nowrap; font-size: 12px; }
.driver-license-table th, .driver-license-table td { padding: 12px 18px; }
.driver-license-table td { height: 64px; font-size: 13px; }
.driver-license-table td:not(:first-child) { white-space: nowrap; }
.driver-license-table td[data-label="Clase de licencia"] { white-space: normal; }
.driver-license-table .driver-state { display: inline-flex; align-items: center; white-space: nowrap; font-size: 12px; }
.driver-license-table .driver-avatar { width: 28px; height: 28px; flex-basis: 28px; font-size: 11px; }
.driver-license-table .driver-identity { gap: 12px; }
.driver-license-table .driver-class-tag { border: 0; background: transparent; padding: 0; font-weight: 400; }
.driver-license-table .driver-action-buttons { flex-wrap: nowrap; justify-content: flex-start; gap: 12px; }
.driver-license-table .driver-action-buttons button { min-height: 34px; padding: 6px 10px; font-size: 12px; white-space: nowrap; }
.driver-license-table .driver-action-buttons button :deep(svg) { width: 15px; height: 15px; }
.driver-license-table .driver-name { font-size: 13px; font-weight: 700; overflow-wrap: anywhere; }
.drivers-controls .driver-filters { grid-template-columns: minmax(220px, 1fr) minmax(240px, 300px) minmax(150px, 180px) auto auto; }
.driver-renewal-additional { grid-column: 1 / -1; min-width: 0; border-top: 1px solid #d8e0eb; padding-top: 12px; }
.driver-renewal-additional > label { margin-top: 14px; }
.driver-management-history { margin-top: 20px; font-size: 12px; }
.driver-management-history summary { cursor: pointer; font-weight: 600; color: #52658c; }
.driver-management-history > div { padding: 12px 0; border-bottom: 1px solid #d8e0eb; }
.driver-management-history small { display: block; margin-top: 4px; color: #63748e; }
.driver-management-history p { margin: 6px 0 0; overflow-wrap: anywhere; }
.driver-alert-toast { position: fixed; z-index: 10000; top: 88px; left: 50%; transform: translateX(-50%); width: min(480px, calc(100vw - 32px)); display: flex; align-items: flex-start; gap: 12px; padding: 16px; border: 1px solid #d8e0eb; border-top: 3px solid #102372; border-radius: 8px; background: #fff; color: #102372; box-shadow: 0 8px 24px #10237220; }
.driver-alert-toast > .svg-icon-wrapper { flex: 0 0 22px; }
.driver-alert-toast :deep(svg) { width: 20px; height: 20px; }
.driver-alert-toast > div { flex: 1; min-width: 0; }
.driver-alert-toast strong { font-size: 13px; }
.driver-alert-toast p { margin: 6px 0; font-size: 13px; }
.driver-alert-toast small { display: block; margin: 4px 0; color: #63748e; font-size: 12px; overflow-wrap: anywhere; }
.driver-alert-toast button { min-height: 28px; padding: 0; border: 0; background: transparent; font-size: 12px; cursor: pointer; }
.driver-alert-toast > div button { margin-top: 6px; text-decoration: underline; }
.driver-alert-toast > button { flex: 0 0 24px; }
@media (max-width: 1200px) { .drivers-controls .driver-filters { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (max-width: 600px) {
  .drivers-controls .driver-filters { grid-template-columns: minmax(0, 1fr); }
  .drivers-controls { padding: 16px; }
  .drivers-controls .driver-filters { gap: 16px; }
  .drivers-tab, .drivers-controls, .drivers-list-header > div, .drivers-toolbar { min-width: 0; max-width: 100%; }
  .drivers-toolbar { width: 100%; }
  .drivers-toolbar > button { flex: 1 1 100%; }
  .drivers-list-title { flex-wrap: wrap; font-size: 17px; }
  .drivers-list-subtitle { margin-left: 0; }
  .driver-license-table { min-width: 0; }
  .driver-table-scroll .driver-license-table { display: block; width: 100%; }
  .driver-license-table colgroup { display: none; }
  .driver-license-table td:not(:first-child) { white-space: normal; }
  .driver-license-table .driver-action-buttons { flex-wrap: wrap; }
}
.driver-dialog.driver-reference-dialog { width: min(900px, calc(100vw - 32px)); border: 0; border-radius: 8px; background: #fff; box-shadow: 0 12px 40px #10237226; }
.driver-dialog.driver-renew-dialog, .driver-dialog.driver-current-dialog { width: min(800px, calc(100vw - 32px)); height: fit-content; }
.driver-dialog.driver-current-dialog header { padding: 22px 22px 14px; }
.driver-dialog.driver-current-dialog header h2 { font-size: 18px; }
.driver-dialog.driver-current-dialog header p { font-size: 12px; }
.driver-current-dialog .driver-dialog-body { flex: 0 1 auto; padding: 18px 22px; scrollbar-gutter: auto; }
.driver-correction-confirm { display: flex; align-items: center; gap: 8px; font-size: 12px; margin-top: 12px; }
.driver-correction-confirm input { width: 16px; height: 16px; min-height: 16px; flex-shrink: 0; }
.driver-dialog.driver-renew-history-dialog { height: fit-content; }
.driver-reference-dialog, .driver-reference-dialog form, .driver-reference-dialog .driver-dialog-body { min-width: 0; }
.driver-reference-dialog header { display: flex; align-items: flex-start; gap: 12px; padding: 22px 22px 14px; background: #fff; color: #102372; border: 0; }
.driver-reference-dialog header > div { flex: 1; min-width: 0; }
.driver-reference-dialog header h2 { margin: 0; font-size: 18px; color: #102372; }
.driver-reference-dialog header p { margin: 5px 0 0; color: #52658c; font-size: 12px; }
.driver-reference-dialog header > button { flex: 0 0 28px; min-height: 28px; width: 28px; padding: 4px; border: 0; background: transparent; color: #52658c; }
.driver-reference-heading-icon { flex: 0 0 30px; width: 30px; height: 30px; color: #102372; }
.driver-reference-heading-icon :deep(svg) { width: 30px; height: 30px; }
.driver-reference-summary { margin: 0 22px; padding: 14px; display: grid; grid-template-columns: 26px minmax(0, 1fr) minmax(150px, 1fr) auto; align-items: center; gap: 12px; border-radius: 6px; background: #f0f4fa; color: #102372; }
.driver-reference-summary > :deep(svg), .driver-reference-summary > :deep(.svg-icon-wrapper) { width: 26px; height: 26px; }
.driver-reference-summary strong { font-size: 13px; }
.driver-reference-summary small { display: block; margin-top: 4px; font-size: 11px; }
.driver-reference-summary .driver-state { white-space: nowrap; font-size: 11px; padding: 5px 8px; }
.driver-reference-dialog .driver-dialog-body { padding: 18px 22px; background: #fff; }
.driver-reference-form { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px 18px; }
.driver-reference-form label, .driver-reference-class { display: flex; flex-direction: column; gap: 7px; min-width: 0; color: #102372; font-size: 12px; font-weight: 600; }
.driver-reference-form input, .driver-reference-form textarea { width: 100%; min-width: 0; min-height: 36px; font-size: 13px; }
.driver-reference-form label { position: relative; }
.driver-required { color: #c12a37; }
.driver-reference-class > span { min-height: 14px; }
.driver-class-select { position: relative; }
.driver-class-select summary { min-height: 36px; padding: 8px 10px; border: 1px solid #cfd9e8; border-radius: 5px; cursor: pointer; font-size: 13px; }
.driver-class-select .driver-class-grid { position: absolute; top: 100%; left: 0; right: 0; z-index: 2; padding: 10px; background: #fff; border: 1px solid #cfd9e8; border-radius: 5px; box-shadow: 0 6px 18px #10237220; }
.driver-class-select .driver-class input { width: 14px; min-height: 14px; }
.driver-reference-notes { grid-column: 1 / -1; }
.driver-receipt-upload { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px; min-height: 94px; padding: 10px; border: 1px dashed #c5d3e8; border-radius: 5px; background: #f3f7fc; overflow-wrap: anywhere; text-align: center; }
.driver-receipt-upload :deep(svg) { width: 20px; height: 20px; }
.driver-receipt-upload small { font-size: 10px; color: #52658c; font-weight: 400; }
.driver-reference-form .driver-receipt-upload input { position: absolute; inset: 0; height: 100%; opacity: 0; cursor: pointer; }
.driver-receipt-upload:focus-within { outline: 2px solid #2967db; outline-offset: 2px; }
.driver-renewal-photo-upload img { width: 100%; height: 60px; object-fit: contain; }
.driver-renewal-photos, .driver-renewal-receipt { grid-column: 1 / -1; min-width: 0; }
.driver-renewal-photos h3 { margin: 2px 0 12px; font-size: 15px; color: #102372; }
.driver-renewal-photo-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
.driver-renewal-photo-upload { min-height: 132px; border-style: solid; gap: 7px; }
.driver-renewal-photo-upload > :deep(.svg-icon-wrapper), .driver-renewal-photo-upload > :deep(.svg-icon-wrapper svg) { width: 28px; height: 28px; }
.driver-renewal-photo-upload > strong { font-size: 14px; }
.driver-renewal-photo-field { min-width: 0; }
.driver-reference-form .driver-photo-remove { min-height: 28px; margin-top: 6px; padding: 4px 0; border: 0; background: transparent; font-size: 12px; color: #b42318; }
.driver-photo-remove :deep(svg) { width: 14px; height: 14px; }
.driver-photo-warning { margin: 14px 0 0; padding: 10px 12px; background: #fff4e6; border-left: 3px solid #ff6600; border-radius: 4px; color: #8a4a00; font-size: 12px; line-height: 1.5; }
.driver-confirmed-photos { display: grid; gap: 6px; margin-top: 12px; color: #52658c; font-size: 12px; overflow-wrap: anywhere; }
.driver-history-no-photos { font-size: 12px; color: #63748e; }
.driver-previous-license { flex-basis: 100%; margin-top: 6px; padding-top: 6px; border-top: 1px solid #d8e0eb; font-size: 12px; }
.driver-previous-license summary { cursor: pointer; color: #52658c; }
.driver-previous-license > div { margin: 8px 0; }
.driver-upload-command { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 6px 12px; border: 1px solid #c5d3e8; border-radius: 5px; background: #fff; font-size: 12px; font-weight: 600; color: #102372; }
.driver-receipt-upload-bar { flex-direction: row; justify-content: flex-start; min-height: 48px; gap: 12px; border-style: solid; text-align: left; }
.driver-receipt-copy { flex: 1; min-width: 0; font-size: 12px; font-weight: 400; }
.driver-receipt-upload-bar .driver-upload-command { flex-shrink: 0; }
.driver-renew-dialog .driver-reference-notes textarea { min-height: 64px; }
.driver-reference-dialog footer { border: 0; background: #fff; padding: 0 22px 20px; justify-content: flex-end; gap: 8px; }
.driver-reference-dialog footer button { min-height: 36px; min-width: 120px; font-size: 12px; border-radius: 5px; }
.driver-reference-dialog footer .primary { min-width: 180px; background: #102f83; border-color: #102f83; }
.driver-reference-dialog .driver-history-title { display: none; }
.driver-reference-dialog .driver-history-table td { height: 48px; }
.driver-reference-dialog .driver-receipt-link { border: 0; background: transparent; text-decoration: underline; overflow-wrap: anywhere; }
@media (max-width: 600px) {
  .driver-reference-summary { grid-template-columns: 24px minmax(0, 1fr); }
  .driver-reference-summary > div:nth-of-type(2) { grid-column: 2; }
  .driver-reference-summary .driver-state { grid-column: 2; justify-self: start; }
  .driver-reference-form { grid-template-columns: minmax(0, 1fr); }
  .driver-renewal-photo-grid { grid-template-columns: minmax(0, 1fr); }
  .driver-receipt-upload-bar { flex-wrap: wrap; }
  .driver-reference-dialog footer { flex-wrap: wrap; }
  .driver-reference-dialog footer button { flex: 1; min-width: 0; }
}
</style>
