<template>
  <Teleport to="body">
    <div
      v-if="modalType"
      class="maintenance-action-modal fixed inset-0 z-[3000] flex items-end justify-center bg-slate-950/55 p-2"
      :class="
        modalType === 'maintenance-type' ? 'sm:items-center sm:p-4' : 'sm:items-center sm:p-4'
      "
      role="dialog"
      aria-modal="true"
      @click.self="emit('close')"
      @keydown.esc="emit('close')"
    >
      <section
        class="flex max-h-[calc(100vh-16px)] w-full flex-col overflow-hidden rounded-t-xl border border-[#dfe5ed] bg-white shadow-[0_26px_90px_rgba(15,23,42,0.35)] sm:max-h-[calc(100vh-32px)] sm:rounded-xl"
        :class="
          isStartConfirmation
            ? 'work-order-transition-shell max-w-[900px]'
            : modalType === 'maintenance'
            ? 'maintenance-create-shell max-w-[900px]'
            : modalType === 'maintenance-type'
              ? 'maintenance-types-modal-shell max-w-[900px]'
              : modalType === 'create-order'
                ? 'work-order-create-shell max-w-[900px]'
                : modalType === 'close-order'
                  ? 'work-order-close-shell max-w-[900px]'
                  : modalType === 'cost'
                    ? 'work-order-cost-shell max-w-[900px]'
                    : modalType === 'order-detail'
                      ? 'order-detail-shell max-w-[900px]'
                      : modalType === 'reprogram-order'
                          ? 'work-order-planning-shell max-w-[900px]'
                          : 'max-w-[900px]'
        "
      >
        <header
          class="shrink-0 border-b px-5 py-4"
          :class="
            modalType === 'maintenance-type'
              ? 'maintenance-types-modal-header'
              : isBlueHeader
                ? `border-[#0b2d63] bg-[#0b2d63] ${
                    modalType === 'maintenance-type' ? 'maintenance-types-modal-header' : ''
                  }`
                : 'border-[#edf1f5]'
          "
        >
          <div class="flex items-start justify-between gap-4">
            <div
              v-if="modalType !== 'order-detail'"
              class="min-w-0 flex-1"
            >
              <p
                v-if="
                  modalType !== 'maintenance-type' &&
                  modalType !== 'close-order' && !isStartConfirmation
                "
                class="text-[10px] font-black uppercase tracking-[0.16em]"
                :class="isBlueHeader ? 'text-blue-200' : 'text-[#41557b]'"
              >
                {{ modalType === "maintenance" ? "Mantenciones" : modalKicker }}
              </p>

              <h2
                class="mt-1 truncate text-[16px] font-black"
                :class="[
                  isBlueHeader ? 'text-white' : 'text-[#102372]',
                  modalType === 'maintenance-type' ? '!mt-0' : '',
                ]"
              >
                {{
                  modalType === "maintenance"
                    ? draft.editMode
                      ? "Editar plan de mantención"
                      : "Nuevo plan de mantención"
                    : modalType === "maintenance-type"
                      ? "Tipos de mantención"
                      : isStartConfirmation ? `${draft.transitionLabel} en ${draft.orderId}?` : modalType === 'assign-order' && draft.transitionLabel ? draft.transitionLabel : modalTitle
                }}
              </h2>
              <div v-if="modalType === 'reprogram-order'" class="work-order-planning-identity">
                <strong>{{ draft.orderId }}</strong><span>·</span><strong>{{ draft.plate }}</strong>
                <span class="work-order-planning-job">{{ draft.job }}</span>
              </div>

              <p
                v-if="modalType === 'maintenance-type'"
                class="maintenance-types-description"
              >
                Administra los tipos de mantencion que se pueden asignar a los vehiculos.
              </p>

              <p
                v-if="
                  modalType === 'close-order' || (!isStartConfirmation && !isBlueHeader && modalType !== 'create-order' && modalType !== 'maintenance-type')
                "
                class="mt-1 text-[12px] font-bold leading-5"
                :class="modalType === 'close-order' ? 'text-blue-100' : 'text-slate-500'"
              >
                {{ modalDescription }}
              </p>
            </div>

            <div v-if="modalType === 'order-detail'" class="order-detail-header-main">
              <h2>Orden {{ draft.orderId }}</h2>
              <div class="order-detail-header-summary">
                <div>
                  <span>Activo</span><strong>{{ draft.plate }}</strong>
                </div>
                <div>
                  <span>Tipo de mantencion</span><strong>{{ draft.job }}</strong>
                </div>
                <div>
                  <span>Estado</span>
                  <strong
                    class="order-detail-status-pill"
                    :class="draft.status === 'cancelled' ? 'is-cancelled' : draft.status === 'finished' ? 'is-closed' : 'is-open'"
                  >
                    {{ getOrderStatusLabel(draft.status) }}
                  </strong>
                </div>
                <div>
                  <span>{{
                    draft.status === "cancelled" ? "OT cancelada el" : draft.status === "finished" ? "OT cerrada el" : "Fecha limite de ejecucion"
                  }}</span>
                  <strong>{{
                    formatDetailDate(draft.status === 'cancelled' ? draft.cancelledAt : draft.status === 'finished' ? draft.closedAt : draft.scheduledDate)
                  }}</strong>
                </div>
              </div>
            </div>

            <button
              class="maintenance-modal-close"
              :class="isBlueHeader ? '!border-transparent !bg-transparent !text-white' : ''"
              type="button"
              aria-label="Cerrar modal"
              @click="emit('close')"
            >
              <SvgIcon v-if="modalType === 'maintenance-type' || modalType === 'reprogram-order'" name="close" />
              <template v-else>x</template>
            </button>
          </div>
        </header>

        <div
          class="min-h-0 overflow-auto bg-[#f6f8fb]"
          :class="
            modalType === 'maintenance-type'
              ? 'p-0'
              : modalType === 'maintenance'
                ? 'p-0'
                : modalType === 'create-order' ? 'p-0'
                : 'p-4'
          "
        >
          <div
            v-if="modalActionMessage"
            :role="modalType === 'reprogram-order' ? 'alert' : 'status'"
            class="mb-3 rounded-lg border px-3 py-2 text-[12px] font-black"
            :class="
              modalType === 'reprogram-order'
                ? 'border-rose-200 bg-rose-50 text-rose-700'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
            "
          >
            {{
              modalActionMessage ||
              `Mantenciones configuradas para ${selectedVehicle.plate}. Selecciona una para revisar su detalle.`
            }}
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <template v-if="modalType === 'maintenance' && maintenanceWizardStep === 1">
              <section class="maintenance-create-picker sm:col-span-2">
                <aside class="maintenance-create-sidebar">
                  <div class="active">
                    <b>1</b
                    ><span
                      ><strong>Tipo de mantencion</strong><small>Selecciona el tipo</small></span
                    >
                  </div>
                  <i></i>
                  <div>
                    <b>2</b
                    ><span><strong>Configuracion</strong><small>Define los parametros</small></span>
                  </div>
                  <i></i>
                  <div>
                    <b>3</b
                    ><span><strong>Confirmar</strong><small>Revisa y crea el plan</small></span>
                  </div>
                </aside>
                <div class="maintenance-create-main">
                  <p>Paso 1 de 3</p>
                  <h3>Tipo de mantencion</h3>
                  <h4>Selecciona el tipo de mantencion que deseas crear.</h4>
                  <label class="maintenance-modal-field mb-4">
                    <span>Vehiculo</span>
                    <select v-model="draft.vehicleId" @change="emit('sync-maintenance-vehicle-draft')">
                      <option value="" disabled>Selecciona un vehiculo</option>
                      <option v-for="vehicle in maintenanceItems" :key="vehicle.id" :value="vehicle.id">{{ vehicle.plate }} - {{ vehicle.assetName }}</option>
                    </select>
                  </label>
                  <div class="maintenance-create-types">
                    <button
                      v-for="type in maintenanceTypes"
                      :key="type"
                      type="button"
                      :class="{ active: draft.type === type && !isCreateMaintenanceTypeDisabled(type) }"
                      :aria-disabled="isCreateMaintenanceTypeDisabled(type)"
                      :disabled="isCreateMaintenanceTypeDisabled(type)"
                      @click="selectMaintenanceType(type)"
                    >
                      <span
                        ><strong>{{ type }}</strong
                        ><small v-if="draft.vehicleId && isCreateMaintenanceTypeDisabled(type)">Ya configurada</small
                        ><small v-else>{{ getMaintenanceTypeCriterionLabel(type) }}</small
                        ></span
                      >
                      <i></i>
                    </button>
                  </div>
                </div>
              </section>
            </template>

            <template v-else-if="modalType === 'maintenance' && maintenanceWizardStep === 3">
              <section class="maintenance-confirm-layout sm:col-span-2">
                <aside class="maintenance-create-sidebar">
                  <div>
                    <b>1</b
                    ><span
                      ><strong>Tipo de mantencion</strong><small>Selecciona el tipo</small></span
                    >
                  </div>
                  <i class="done"></i>
                  <div>
                    <b>2</b
                    ><span><strong>Configuracion</strong><small>Define los parametros</small></span>
                  </div>
                  <i class="done"></i>
                  <div class="active">
                    <b>3</b
                    ><span><strong>Confirmar</strong><small>Revisa y crea el plan</small></span>
                  </div>
                </aside>
                <div class="maintenance-confirm-main">
                  <p>Paso 3 de 3</p>
                  <h3>Confirmar</h3>
                  <h4>
                    Revisa la informacion y
                    {{ draft.editMode ? "guarda los cambios del" : "crea el" }} plan de mantencion.
                  </h4>
                  <section class="maintenance-confirm-section">
                    <h5>Informacion general</h5>
                    <div class="maintenance-confirm-general">
                      <div>
                        <span>Tipo de mantencion</span><strong>{{ draft.type || draft.originalType || draft.name }}</strong>
                      </div>
                      <div>
                        <span>Nombre del plan</span><strong>{{ draft.name }}</strong>
                      </div>
                      <div>
                        <span>Vehiculo</span><strong>{{ selectedDraftVehicleLabel }}</strong>
                      </div>
                    </div>
                  </section>
                  <section class="maintenance-confirm-section">
                    <h5>Parametros</h5>
                    <dl class="maintenance-confirm-parameters">
                      <div>
                        <dt>Criterio</dt>
                        <dd>{{ draft.readingSourceLabel }}</dd>
                      </div>
                      <div>
                        <dt>{{ maintenanceIntervalLabel }}</dt>
                        <dd>{{ draft.readingSourceLabel === 'Fecha/Hora' ? String(maintenanceScheduleValue).split('-').reverse().join('-') : maintenanceScheduleValue }} {{ draft.readingSourceLabel === 'Fecha/Hora' ? '' : maintenanceValueUnit }}</dd>
                      </div>
                      <div>
                        <dt>{{ maintenanceAlertLabel }}</dt>
                        <dd>{{ draft.alertValue }} {{ maintenanceValueUnit }}</dd>
                      </div>
                      <div v-if="maintenanceThresholdSummary" class="maintenance-warning-threshold">
                        <dt>Umbral restante</dt>
                        <dd>{{ maintenanceThresholdSummary }}</dd>
                      </div>
                      <div v-if="draft.readingSourceLabel !== 'Odometro'">
                        <dt>{{ maintenanceLastReadingLabel }}</dt>
                        <dd>{{ maintenanceLastReadingDisplay }}</dd>
                      </div>
                      <div>
                        <dt>Notas</dt>
                        <dd>{{ draft.notes || "Sin notas" }}</dd>
                      </div>
                    </dl>
                  </section>
                </div>
              </section>
            </template>

            <template v-else-if="modalType === 'maintenance' && maintenanceWizardStep === 2">
              <section class="maintenance-config-layout sm:col-span-2">
                <aside class="maintenance-create-sidebar">
                  <div>
                    <b>1</b
                    ><span
                      ><strong>Tipo de mantencion</strong><small>Selecciona el tipo</small></span
                    >
                  </div>
                  <i class="done"></i>
                  <div class="active">
                    <b>2</b
                    ><span><strong>Configuracion</strong><small>Define los parametros</small></span>
                  </div>
                  <i></i>
                  <div>
                    <b>3</b
                    ><span><strong>Confirmar</strong><small>Revisa y crea el plan</small></span>
                  </div>
                </aside>
                <div class="maintenance-config-main">
                  <p>Paso 2 de 3</p>
                  <h3>Configuracion</h3>
                  <h4>Define los parametros de la mantencion seleccionada.</h4>
                  <div class="maintenance-config-type">
                    <span><SvgIcon name="maintenance-calendar" /></span>
                    <div>
                      <small>Tipo seleccionado</small><strong>{{ draft.type || draft.originalType || draft.name }}</strong>
                    </div>
                    <button type="button" @click="maintenanceWizardStep = 1">Cambiar tipo</button>
                  </div>
                  <div class="maintenance-config-form">
                    <label
                      ><span>Criterio</span
                      ><select v-model="draft.readingSourceLabel" @change="prefillMaintenanceGpsReading">
                        <option
                          v-for="source in maintenanceReadingSources"
                          :key="source"
                          :value="source"
                        >
                          {{ source }}
                        </option>
                      </select></label
                    >
                    <label v-if="draft.readingSourceLabel !== 'Fecha/Hora'"><span>Fecha de inicio del plan</span><input v-model="draft.startDate" type="date" :max="maintenanceToday" @change="syncMaintenanceHistoricalReading" /></label>
                    <label v-else><span>Fecha de inicio del plan</span><input v-model="draft.lastReading" type="date" /></label>
                    <div v-if="draft.readingSourceLabel !== 'Fecha/Hora'" class="maintenance-gps-reading" role="status">
                      <div><span>{{ maintenanceDisplayedReadingTitle }}</span><small class="maintenance-reference-time">{{ maintenanceReferenceTimestamp }}</small></div>
                      <strong>{{ maintenanceDisplayedReading }}</strong>
                    </div>
                    <label
                      ><span>{{
                        draft.readingSourceLabel === "Fecha/Hora"
                          ? "Fecha de la proxima mantencion"
                          : draft.readingSourceLabel === "Horometro"
                            ? "Proxima mantencion a las (horas)"
                            : "Proxima mantencion a los (km)"
                      }}<b class="text-rose-600"> *</b></span
                      ><input v-model="maintenanceScheduleValue" :type="draft.readingSourceLabel === 'Fecha/Hora' ? 'date' : 'number'" :min="draft.readingSourceLabel === 'Fecha/Hora' ? draft.lastReading : 0" required :aria-invalid="!isMaintenanceTargetValid"
                    /><small v-if="!isMaintenanceTargetValid" class="text-[11px] text-rose-600">Ingresa {{ draft.readingSourceLabel === 'Fecha/Hora' ? 'la fecha' : draft.readingSourceLabel === 'Horometro' ? 'las horas' : 'el kilometraje' }} de la proxima mantencion.</small></label>
                    <label
                      ><span>{{
                        draft.readingSourceLabel === "Fecha/Hora"
                          ? "Avisar con (dias)"
                          : draft.readingSourceLabel === "Horometro"
                            ? "Avisar con (horas)"
                            : "Avisar con (km)"
                      }}</span
                      ><input v-model="draft.alertValue" type="number" min="0"
                    /></label>
                  </div>
                  <details class="maintenance-config-extra">
                    <summary>Notas <small>(opcional)</small></summary>
                    <label class="maintenance-config-notes"><textarea v-model="draft.notes" maxlength="500" rows="2" placeholder="Informacion adicional de esta mantencion"></textarea><small>{{ String(draft.notes || "").length }} / 500</small></label>
                  </details>
                </div>
              </section>
            </template>

            <template v-else-if="modalType === 'edit-maintenance'">
              <section class="sm:col-span-2">
                <p class="mb-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">
                  Partir de un tipo conocido
                </p>
                <div class="flex flex-wrap gap-1.5">
                  <button
                    v-for="type in maintenanceTypes"
                    :key="type"
                    type="button"
                    class="rounded-md border px-2.5 py-1.5 text-[10px] font-black transition"
                    :class="
                      draft.type === type
                        ? 'border-[#102372] bg-[#eef3ff] text-[#102372]'
                        : 'border-[#cfd8e6] bg-white text-[#102372]'
                    "
                    @click="selectMaintenanceType(type)"
                  >
                    {{ type }}
                  </button>
                </div>
              </section>

              <label class="maintenance-modal-field sm:col-span-2">
                <span>Activo</span>
                <select v-model="draft.vehicleId" @change="emit('sync-maintenance-vehicle-draft')">
                  <option value="" disabled>Elegi un activo</option>
                  <option
                    v-for="maintenanceVehicle in maintenanceItems"
                    :key="maintenanceVehicle.id"
                    :value="maintenanceVehicle.id"
                  >
                    {{ maintenanceVehicle.plate }} - {{ maintenanceVehicle.assetName }}
                  </option>
                </select>
              </label>

              <div
                v-if="false"
                class="sm:col-span-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-black text-amber-700"
              >
                Este vehiculo ya tiene una mantencion de este tipo. Selecciona otro tipo si
                necesitas agregar una mantencion distinta.
              </div>

              <label class="maintenance-modal-field sm:col-span-2">
                <span>Nombre del plan</span>
                <input :value="draft.name" type="text" readonly title="Se completa con el tipo de mantencion seleccionado" />
              </label>

              <label class="maintenance-modal-field">
                <span>Criterio</span>
                <select v-model="draft.readingSourceLabel">
                  <option v-for="source in maintenanceReadingSources" :key="source" :value="source">
                    {{
                      source === "Odometro"
                        ? "Por odometro"
                        : source === "Horometro"
                          ? "Por horometro"
                          : source
                    }}
                  </option>
                </select>
              </label>

              <label class="maintenance-modal-field">
                <span>{{
                  draft.readingSourceLabel === "Fecha/Hora"
                    ? "Fecha de la proxima mantencion"
                    : draft.readingSourceLabel === "Horometro"
                      ? "Proxima mantencion a las (horas)"
                      : "Proxima mantencion a los (km)"
                }}</span>
                <input v-model="maintenanceScheduleValue" :type="draft.readingSourceLabel === 'Fecha/Hora' ? 'date' : 'number'" :min="draft.readingSourceLabel === 'Fecha/Hora' ? draft.lastReading : 0" required />
              </label>

              <label class="maintenance-modal-field">
                <span>{{
                  draft.readingSourceLabel === "Fecha/Hora"
                    ? "Avisar con (dias)"
                    : draft.readingSourceLabel === "Horometro"
                      ? "Avisar con (horas)"
                      : "Avisar con (km)"
                }}</span>
                <input v-model="draft.alertValue" type="number" min="0" />
              </label>

              <label v-if="draft.readingSourceLabel === 'Fecha/Hora'" class="maintenance-modal-field">
                <span>{{ maintenanceLastReadingLabel }}</span>
                <input
                  v-model="draft.lastReading"
                  :type="draft.readingSourceLabel === 'Fecha/Hora' ? 'date' : 'number'"
                  min="0"
                />
              </label>

              <section v-if="draft.readingSourceLabel !== 'Fecha/Hora'" class="maintenance-start-reading sm:col-span-2">
                <label><span>Fecha de inicio del plan</span><input v-model="draft.startDate" type="date" :max="maintenanceToday" @change="syncMaintenanceHistoricalReading" /></label>
                <div role="status"><small>{{ maintenanceReferenceTimestamp }}</small></div>
              </section>
              <div v-if="draft.readingSourceLabel !== 'Fecha/Hora'" class="maintenance-gps-reading sm:col-span-2" role="status">
                <span>{{ maintenanceDisplayedReadingTitle }}</span>
                <strong>{{ maintenanceDisplayedReading }}</strong>
              </div>

              <label class="maintenance-modal-field sm:col-span-2">
                <span>Notas</span>
                <textarea v-model="draft.notes" rows="2" />
              </label>
            </template>

            <template v-else-if="modalType === 'maintenance-type'">
              <section class="maintenance-types-catalog sm:col-span-2" @click="closeTypeMenuOutside">
                <div class="maintenance-types-toolbar">
                  <label class="maintenance-types-search"
                    ><SvgIcon name="search" /><input
                      v-model="maintenanceTypeSearch"
                      type="search"
                      placeholder="Buscar tipo de mantencion..."
                  /></label>
                  <label class="maintenance-types-select-filter">
                    <span>Criterio</span>
                    <select
                      v-model="maintenanceTypeCriterionFilter"
                      aria-label="Filtrar por criterio"
                    >
                      <option value="all">Todos</option>
                      <option
                        v-for="criterion in maintenanceTypeCriterionOptions"
                        :key="criterion.value"
                        :value="criterion.value"
                      >
                        {{ criterion.label }}
                      </option>
                    </select>
                  </label>
                  <label class="maintenance-types-select-filter">
                    <span>Origen</span>
                    <select v-model="maintenanceTypeOriginFilter" aria-label="Filtrar por origen">
                      <option value="all">Todos</option>
                      <option value="factory">De fabrica</option>
                      <option value="custom">Personalizado</option>
                    </select>
                  </label>
                  <button
                    type="button"
                    class="maintenance-type-new-button"
                    @click="startNewMaintenanceType"
                  >
                    <SvgIcon name="plus" /> Nuevo tipo
                  </button>
                </div>
                <p class="maintenance-types-count">{{ filteredMaintenanceTypes.length }} tipos de mantencion</p>
                <div class="maintenance-types-table">
                  <div class="maintenance-types-table-header">
                    <button type="button" class="maintenance-types-sort" @click="toggleTypeSort">Nombre <SvgIcon name="chevron-down" :class="{ ascending: maintenanceTypeSortDirection === 1 }" /></button><span>Criterio</span><span>Origen</span
                    ><span>Acciones</span>
                  </div>
                  <div
                    v-if="typeCatalogMode === 'new' || typeCatalogMode === 'edit'"
                    class="maintenance-types-new-row"
                  >
                    <input
                      v-model="draft.name"
                      type="text"
                      placeholder="Nombre del tipo"
                      @keydown.enter.prevent="submitCatalogRow"
                    />
                    <select v-model="draft.readingSourceLabel">
                      <option
                        v-for="criterion in maintenanceTypeCriterionOptions"
                        :key="criterion.value"
                        :value="criterion.value"
                      >
                        {{ criterion.label }}
                      </option>
                    </select>
                    <span class="maintenance-type-origin" :class="{ custom: typeCatalogMode === 'new' || maintenanceTypeOrigins[selectedMaintenanceType] === 'custom' }">{{ typeCatalogMode === 'new' || maintenanceTypeOrigins[selectedMaintenanceType] === 'custom' ? 'Personalizado' : 'De fabrica' }}</span>
                    <div class="maintenance-types-new-actions">
                      <SvgIcon name="chevron-right" />
                      <button
                        type="button"
                        class="confirm"
                        title="Guardar"
                        :disabled="isCatalogSaveDisabled"
                        @click="submitCatalogRow"
                      >
                        <SvgIcon name="check" />
                      </button>
                      <button type="button" title="Cancelar" @click="cancelNewMaintenanceType">
                        <SvgIcon name="close" />
                      </button>
                    </div>
                  </div>
                  <div
                    v-for="(type, index) in pagedMaintenanceTypes"
                    :key="type"
                    class="maintenance-types-row"
                  >
                    <strong>{{ type }}</strong>
                    <span
                      class="maintenance-type-criterion"
                      :class="getMaintenanceTypeCriterionClass(type)"
                    >
                      <SvgIcon :name="getMaintenanceTypeReadingSource(type) === 'Odometro' ? 'maintenance-odometer' : getMaintenanceTypeReadingSource(type) === 'Horometro' ? 'maintenance-hours' : 'maintenance-time'" />
                      {{ getMaintenanceTypeCriterionLabel(type) }}
                    </span>
                    <span class="maintenance-type-origin" :class="{ custom: maintenanceTypeOrigins[type] === 'custom' }">{{ maintenanceTypeOrigins[type] === 'custom' ? 'Personalizado' : 'De fabrica' }}</span>
                    <div class="maintenance-type-row-actions">
                      <button
                        type="button"
                        class="maintenance-type-menu-trigger"
                        title="Mas acciones"
                        aria-label="Mas acciones"
                        @click.stop="toggleTypeMenu(type)"
                      >
                        ⋮
                      </button>
                      <div v-if="openTypeMenu === type" class="maintenance-type-menu" :class="{ 'menu-up': index >= pagedMaintenanceTypes.length - 2 }">
                        <button type="button" @click="startEditMaintenanceType(type)">
                          <SvgIcon name="pencil" /> Editar
                        </button>
                        <button type="button" class="danger" @click="deleteMaintenanceType(type)">
                          <SvgIcon name="trash" /> Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                  <div v-if="!filteredMaintenanceTypes.length" class="maintenance-types-empty">
                    No hay tipos que coincidan con los filtros.
                  </div>
                </div>
                <footer class="maintenance-types-pagination">
                  <span>Mostrando {{ filteredMaintenanceTypes.length ? (maintenanceTypePage - 1) * maintenanceTypePageSize + 1 : 0 }} a {{ Math.min(maintenanceTypePage * maintenanceTypePageSize, filteredMaintenanceTypes.length) }} de {{ filteredMaintenanceTypes.length }} tipos de mantencion</span>
                  <nav aria-label="Paginas de tipos de mantencion">
                    <button type="button" title="Pagina anterior" :disabled="maintenanceTypePage === 1" @click="maintenanceTypePage--"><SvgIcon name="chevron-left" /></button>
                    <button v-for="page in maintenanceTypePageCount" :key="page" type="button" :class="{ active: maintenanceTypePage === page }" :aria-current="maintenanceTypePage === page ? 'page' : undefined" @click="maintenanceTypePage = page">{{ page }}</button>
                    <button type="button" title="Pagina siguiente" :disabled="maintenanceTypePage === maintenanceTypePageCount" @click="maintenanceTypePage++"><SvgIcon name="chevron-right" /></button>
                  </nav>
                  <select v-model.number="maintenanceTypePageSize" aria-label="Tipos por pagina"><option :value="10">10 por pagina</option><option :value="20">20 por pagina</option><option :value="50">50 por pagina</option></select>
                </footer>
              </section>
              <section
                v-if="false"
                class="sm:col-span-2 grid min-h-[440px] grid-cols-[300px_minmax(0,1fr)] bg-white"
              >
                <aside class="border-r border-[#d8e0eb] bg-[#f7f9fc] p-2.5">
                  <button
                    type="button"
                    class="h-9 w-full rounded-md bg-[#ff6600] text-[10px] font-black uppercase text-white"
                    @click="startNewMaintenanceType"
                  >
                    Tipo nuevo
                  </button>
                  <p class="my-3 text-[9px] font-bold leading-4 text-slate-500">
                    Arrastra para cambiar el orden, o selecciona un tipo para revisar su
                    configuracion.
                  </p>
                  <div class="space-y-1.5">
                    <button
                      v-for="(type, index) in maintenanceTypes"
                      :key="type"
                      type="button"
                      class="flex w-full items-center gap-2 rounded-md border bg-white px-2.5 py-2 text-left transition"
                      :class="
                        selectedMaintenanceType === type
                          ? 'border-[#102372] ring-1 ring-[#102372]/10'
                          : 'border-[#d8e0eb]'
                      "
                      @click="selectTypeFromCatalog(type)"
                    >
                      <span class="text-slate-300">⠿</span>
                      <span class="min-w-0 flex-1"
                        ><strong class="block truncate text-[11px] font-black text-[#102372]">{{
                          type
                        }}</strong
                        ><small class="mt-0.5 block text-[9px] font-bold text-slate-500"
                          >{{ typeIntervalLabel(type, index) }} ·
                          {{ typeVehicleCount(type) }} equipos</small
                        ></span
                      >
                      <span
                        class="rounded bg-slate-100 px-1.5 py-1 text-[8px] font-black uppercase text-slate-600"
                        >De fabrica</span
                      >
                    </button>
                  </div>
                </aside>

                <div class="grid min-h-[440px] place-items-center p-8">
                  <div
                    v-if="typeCatalogMode === 'empty'"
                    class="max-w-[330px] text-center text-[12px] font-bold leading-5 text-[#345284]"
                  >
                    Elegi un tipo para ver o cambiar sus intervalos, o crea uno nuevo para tu
                    empresa.
                  </div>
                  <div v-else class="w-full max-w-[430px] space-y-4">
                    <div>
                      <p class="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
                        {{ typeCatalogMode === "new" ? "Nuevo tipo" : "Tipo de mantencion" }}
                      </p>
                      <h3 class="mt-1 text-[18px] font-black text-[#102372]">
                        {{ typeCatalogMode === "new" ? "Crear tipo" : selectedMaintenanceType }}
                      </h3>
                    </div>
                    <label class="maintenance-modal-field"
                      ><span>Nombre del tipo</span
                      ><input
                        v-model="draft.name"
                        type="text"
                        :readonly="typeCatalogMode === 'detail'"
                        placeholder="Ej: Lubricacion, Neumaticos, Bateria"
                        @keydown.enter.prevent="typeCatalogMode === 'new' && emit('submit')"
                    /></label>
                    <div>
                      <p class="maintenance-type-create-label">Criterio de control</p>
                      <div class="maintenance-type-criteria">
                        <button
                          v-for="criterion in maintenanceTypeCriterionOptions"
                          :key="criterion.value"
                          type="button"
                          :disabled="typeCatalogMode === 'detail'"
                          :class="{ active: draft.readingSourceLabel === criterion.value }"
                          @click="draft.readingSourceLabel = criterion.value"
                        >
                          <span>{{ criterion.label }}</span
                          ><small>{{ criterion.description }}</small>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </template>


            <template v-else-if="modalType === 'delete-maintenance'">
              <section class="sm:col-span-2 rounded-xl border border-rose-200 bg-rose-50 p-4">
                <p class="text-[10px] font-black uppercase tracking-[0.12em] text-rose-600">
                  Confirmar eliminacion
                </p>

                <h3 class="mt-2 text-[18px] font-black text-[#102372]">
                  {{ draft.name }}
                </h3>

                <p class="mt-2 text-[12px] font-bold leading-5 text-slate-600">
                  Esta mantencion se quitara del vehiculo
                  {{ draft.plate || "seleccionado" }}. Las OT ya creadas se mantienen como historial
                  operativo.
                </p>
              </section>
            </template>

            <template v-else-if="modalType === 'renew-maintenance'">
              <section class="sm:col-span-2 rounded-xl border border-violet-200 bg-violet-50 p-4">
                <p class="text-[10px] font-black uppercase tracking-[0.12em] text-violet-700">
                  Confirmar renovacion
                </p>
                <h3 class="mt-2 text-[18px] font-black text-[#102372]">{{ draft.name }}</h3>
                <p class="mt-2 text-[12px] font-bold text-[#102372]">
                  Estas seguro de renovar esta mantencion?
                </p>
                <p class="mt-2 text-[12px] font-bold leading-5 text-slate-600">
                  La OT {{ draft.orderId }} ya esta cerrada y su ejecucion esta registrada. El
                  siguiente vencimiento se calcula desde esa ejecucion con el intervalo actual.
                </p>
                <dl class="mt-3 grid gap-2 text-[11px] sm:grid-cols-2">
                  <div>
                    <dt class="font-bold text-slate-500">Ultima ejecucion</dt>
                    <dd class="font-black text-[#102372]">{{ draft.lastReading }}</dd>
                  </div>
                  <div>
                    <dt class="font-bold text-slate-500">Proximo vencimiento propuesto</dt>
                    <dd class="font-black text-[#102372]">{{ draft.nextLabel }}</dd>
                  </div>
                  <div>
                    <dt class="font-bold text-slate-500">Intervalo actual</dt>
                    <dd class="font-black text-[#102372]">{{ draft.intervalLabel }}</dd>
                  </div>
                </dl>
              </section>
            </template>

            <template v-else-if="modalType === 'create-order'">
              <section class="order-wizard-layout sm:col-span-2">
                <aside class="maintenance-create-sidebar" aria-label="Pasos de nueva OT">
                  <template v-for="(step, index) in orderWizardSteps" :key="step.title">
                    <div :class="{ active: orderWizardStep === index + 1 }" :aria-current="orderWizardStep === index + 1 ? 'step' : undefined">
                      <b>{{ index + 1 }}</b><span><strong>{{ step.title }}</strong><small>{{ step.description }}</small></span>
                    </div>
                    <i v-if="index < 2"></i>
                  </template>
                </aside>
                <div class="order-wizard-main">
                  <p class="order-wizard-position">Paso {{ orderWizardStep }} de 3</p>
                  <h3 ref="orderWizardHeading" tabindex="-1">{{ orderWizardSteps[orderWizardStep - 1].title }}</h3>
                  <template v-if="orderWizardStep === 1">
                    <dl v-if="orderCreationContext" class="order-wizard-context">
                      <div><dt>Vehiculo</dt><dd>{{ draftVehicleLabel }}</dd></div>
                      <div><dt>Mantencion</dt><dd>{{ draftPlanLabel }}</dd></div>
                    </dl>
                    <div class="order-wizard-fields">
                      <template v-if="!orderCreationContext">
                        <label><span>Vehiculo *</span><select v-model="draft.vehicleId" required @change="emit('sync-order-vehicle-draft')">
                          <option value="" disabled>Selecciona un vehiculo</option>
                          <option v-for="vehicle in maintenanceItems" :key="vehicle.id" :value="vehicle.id">{{ vehicle.plate }} - {{ vehicle.assetName }}</option>
                        </select></label>
                        <label><span>Mantencion *</span><select v-model="draft.maintenancePlanId" required @change="emit('sync-order-maintenance-plan-draft')">
                          <option value="" disabled>{{ modalVehicleMaintenancePlans.length ? 'Selecciona un plan' : 'Sin planes configurados' }}</option>
                          <option v-for="plan in modalVehicleMaintenancePlans" :key="plan.id" :value="plan.id">{{ plan.name }}</option>
                        </select></label>
                      </template>
                      <label class="order-wizard-wide"><span>Titulo del trabajo *</span><input v-model="draft.job" type="text" required /></label>
                      <fieldset class="work-order-priority order-wizard-wide">
                        <legend>Prioridad *</legend>
                        <div><button v-for="priority in orderPriorityOptions" :key="priority" type="button" :class="{ active: draft.priority === priority }" :aria-pressed="draft.priority === priority" @click="draft.priority = priority">{{ priority }}</button></div>
                      </fieldset>
                    </div>
                  </template>
                  <div v-else-if="orderWizardStep === 2" class="order-wizard-fields">
                    <label><span>Fecha planificada *</span><input v-model="draft.plannedStartDate" type="date" required /></label>
                    <label><span>Fecha limite (opcional)</span><input v-model="draft.scheduledDate" type="date" :min="draft.plannedStartDate || undefined" /></label>
                    <label><span>Responsable *</span><input v-model="draft.owner" type="text" required /></label>
                    <label><span>Taller / proveedor *</span><input v-model="draft.workshop" type="text" required /></label>
                  </div>
                  <template v-else>
                    <dl class="order-wizard-summary">
                      <div><dt>Vehiculo</dt><dd>{{ draftVehicleLabel }}</dd></div>
                      <div><dt>Mantencion</dt><dd>{{ draftPlanLabel }}</dd></div>
                      <div class="order-wizard-wide"><dt>Trabajo</dt><dd>{{ draft.job }}</dd></div>
                      <div><dt>Prioridad</dt><dd>{{ draft.priority }}</dd></div>
                      <div><dt>Estado inicial</dt><dd>Programada</dd></div>
                      <div><dt>Fecha planificada</dt><dd>{{ draft.plannedStartDate.split('-').reverse().join('-') }}</dd></div>
                      <div><dt>Fecha limite</dt><dd>{{ draft.scheduledDate ? draft.scheduledDate.split('-').reverse().join('-') : 'Sin fecha limite' }}</dd></div>
                      <div><dt>Responsable</dt><dd>{{ draft.owner }}</dd></div>
                      <div><dt>Taller / proveedor</dt><dd>{{ draft.workshop }}</dd></div>
                    </dl>
                    <details class="order-wizard-optional">
                      <summary>Presupuesto estimado <small>(opcional)</small><strong>{{ formattedCreateOrderTotal }}</strong></summary>
                      <div class="order-wizard-fields">
                        <label><span>Mano de obra ($)</span><input v-model="draft.estimatedLabor" type="text" inputmode="numeric" /></label>
                        <label><span>Repuestos ($)</span><input v-model="draft.estimatedParts" type="text" inputmode="numeric" /></label>
                        <label><span>Otros costos ($)</span><input v-model="draft.estimatedOther" type="text" inputmode="numeric" /></label>
                      </div>
                    </details>
                    <details class="order-wizard-optional">
                      <summary>Descripcion y observaciones <small>(opcional)</small></summary>
                      <div class="order-wizard-fields">
                        <label class="order-wizard-wide"><span>Descripcion</span><textarea v-model="draft.description" maxlength="500" rows="3"></textarea></label>
                        <label class="order-wizard-wide"><span>Observaciones</span><textarea v-model="draft.observations" maxlength="500" rows="3"></textarea></label>
                      </div>
                    </details>
                  </template>
                  <p v-if="orderWizardError" class="order-wizard-error" role="status">{{ orderWizardError }}</p>
                </div>
              </section>
            </template>

            <template v-else-if="modalType === 'edit-order'">
              <label class="maintenance-modal-field sm:col-span-2">
                <span>Activo</span>
                <select v-model="draft.vehicleId" @change="emit('sync-order-vehicle-draft')">
                  <option value="" disabled>Elegi un activo</option>
                  <option
                    v-for="maintenanceVehicle in maintenanceItems"
                    :key="maintenanceVehicle.id"
                    :value="maintenanceVehicle.id"
                  >
                    {{ maintenanceVehicle.plate }} - {{ maintenanceVehicle.assetName }}
                  </option>
                </select>
              </label>

              <label class="maintenance-modal-field sm:col-span-2">
                <span>Titulo</span>
                <input v-model="draft.job" type="text" />
              </label>

              <label class="maintenance-modal-field sm:col-span-2">
                <span>Descripcion</span>
                <textarea v-model="draft.description" rows="2"></textarea>
              </label>

              <label class="maintenance-modal-field">
                <span>Prioridad</span>
                <select v-model="draft.priority">
                  <option
                    v-for="priority in orderPriorityOptions"
                    :key="priority"
                    :value="priority"
                  >
                    {{ priority }}
                  </option>
                </select>
              </label>

              <label class="maintenance-modal-field">
                <span>Fecha límite de ejecución</span>
                <input v-model="draft.scheduledDate" type="date" />
              </label>

              <label class="maintenance-modal-field">
                <span>Asignada a</span>
                <input v-model="draft.owner" type="text" />
              </label>

              <label class="maintenance-modal-field">
                <span>Taller</span>
                <input v-model="draft.workshop" type="text" />
              </label>

              <p class="sm:col-span-2 text-[9px] font-medium text-slate-500">
                El odometro y el horometro de apertura los toma el sistema de la telemetria al crear
                la orden.
              </p>
            </template>

            <template v-else-if="modalType === 'reprogram-order'">
              <section class="work-order-planning-form sm:col-span-2">
                <fieldset>
                  <legend><SvgIcon name="maintenance-calendar" />Fechas</legend>
                  <label><span>Inicio planificado</span><input v-model="draft.plannedStartDate" type="date" :max="draft.scheduledDate || undefined" /></label>
                  <label><span>Fecha limite de ejecucion</span><input v-model="draft.scheduledDate" type="date" :min="draft.plannedStartDate || undefined" required /></label>
                  <label><span>Hora limite</span><input v-model="draft.scheduledTime" type="time" /></label>
                </fieldset>
                <fieldset>
                  <legend><SvgIcon name="user" />Asignacion</legend>
                  <label><span>Responsable</span><input v-model="draft.owner" type="text" required /></label>
                  <label><span>Taller / proveedor</span><input v-model="draft.workshop" type="text" required /></label>
                  <label><span>Prioridad</span><select v-model="draft.priority"><option v-for="priority in orderPriorityOptions" :key="priority" :value="priority">{{ priority }}</option></select></label>
                </fieldset>
              </section>
            </template>

            <template v-else-if="isStartConfirmation">
              <section class="work-order-transition-summary sm:col-span-2">
                <strong>{{ draft.plate || selectedVehicle?.plate }} · {{ draft.job }}</strong>
                <dl>
                  <div><dt>Responsable</dt><dd>{{ draft.owner || 'Sin asignar' }}</dd></div>
                  <div><dt>Taller / proveedor</dt><dd>{{ draft.workshop || 'Sin asignar' }}</dd></div>
                </dl>
              </section>
            </template>
            <template v-else-if="modalType === 'assign-order'">
              <label class="maintenance-modal-field">
                <span>Responsable</span>
                <input v-model="draft.owner" type="text" />
              </label>
              <label class="maintenance-modal-field">
                <span>Taller / proveedor</span>
                <input v-model="draft.workshop" type="text" />
              </label>
              <label class="maintenance-modal-field">
                <span>Prioridad</span>
                <select v-model="draft.priority">
                  <option
                    v-for="priority in orderPriorityOptions"
                    :key="priority"
                    :value="priority"
                  >
                    {{ priority }}
                  </option>
                </select>
              </label>
              <label class="maintenance-modal-field">
                <span>Estado</span>
                <input v-if="draft.transitionLabel" :value="getOrderStatusLabel(draft.status)" type="text" readonly />
                <select v-else v-model="draft.status">
                  <option value="scheduled">Programada</option>
                  <option value="in-progress">En proceso</option>
                  <option value="waiting">En espera</option>
                </select>
              </label>
              <label
                v-if="draft.status === 'waiting'"
                class="maintenance-modal-field sm:col-span-2"
              >
                <span>Motivo de espera</span>
                <textarea
                  v-model="draft.waitingReason"
                  rows="3"
                  placeholder="Indica por que la orden no puede continuar"
                  required
                ></textarea>
              </label>
            </template>

            <template v-else-if="modalType === 'cancel-order'">
              <label class="maintenance-modal-field sm:col-span-2">
                <span>Motivo de cancelacion</span>
                <textarea v-model="draft.cancelReason" rows="4"></textarea>
              </label>
              <label class="maintenance-modal-field">
                <span>Notificacion</span>
                <select v-model="draft.notify">
                  <option value="No notificar">No notificar</option>
                  <option value="Aviso interno">Aviso interno</option>
                </select>
              </label>
            </template>

            <template v-else-if="modalType === 'close-order'">
              <section class="work-order-close-form sm:col-span-2">
                <aside class="work-order-close-summary">
                  <h3>Resumen de la mantencion</h3>
                  <dl>
                    <div>
                      <dt>Trabajo</dt>
                      <dd>{{ draft.job }}</dd>
                    </div>
                    <div>
                      <dt>Activo</dt>
                      <dd>{{ draft.plate }}</dd>
                      <small>{{ draft.assetName }}</small>
                    </div>
                    <div>
                      <dt>Responsable</dt>
                      <dd>{{ draft.closedBy }}</dd>
                    </div>
                    <div>
                      <dt>Lectura final</dt>
                      <dd>{{ draft.closingReading }}</dd>
                    </div>
                    <div>
                      <dt>Costo total</dt>
                      <dd>$ {{ draft.totalCost || "0" }}</dd>
                    </div>
                    <div>
                      <dt>Factura</dt>
                      <dd>{{ draft.invoice || "Sin factura" }}</dd>
                    </div>
                  </dl>
                </aside>
                <div class="work-order-close-fields">
                  <label class="full"
                    ><span>Trabajo realizado</span
                    ><textarea
                      v-model="draft.workPerformed"
                      maxlength="500"
                      rows="3"
                      required
                    ></textarea
                    ><small>{{ String(draft.workPerformed || "").length }}/500</small></label
                  >
                  <label
                    ><span>Responsable del cierre <b>*</b></span
                    ><input v-model="draft.closedBy" type="text" required
                  /></label>
                  <label
                    ><span>Lectura final <b>*</b></span
                    ><input
                      v-model="draft.closingReading"
                      type="text"
                      placeholder="Ej: 35.450 km"
                      required
                  /></label>
                  <label
                    ><span>Mano de obra</span>
                    <div class="close-money">
                      <b>$</b
                      ><input v-model="draft.laborCost" type="text" inputmode="numeric" /></div
                  ></label>
                  <label><span>Factura</span><input v-model="draft.invoice" type="text" /></label>
                  <label
                    ><span>Costo de repuestos</span>
                    <div class="close-money">
                      <b>$</b
                      ><input v-model="draft.partsCost" type="text" inputmode="numeric" /></div
                  ></label>
                  <label
                    ><span>Otros costos</span>
                    <div class="close-money">
                      <b>$</b
                      ><input v-model="draft.otherCost" type="text" inputmode="numeric" /></div
                  ></label>
                  <label class="full"
                    ><span>Repuestos utilizados</span><input v-model="draft.parts" type="text"
                  /></label>
                  <label
                    ><span>Proximo ciclo</span><input v-model="draft.nextCycle" type="text"
                  /></label>
                  <label class="full"
                    ><span>Observaciones</span
                    ><textarea v-model="draft.observations" maxlength="500" rows="3"></textarea
                    ><small>{{ String(draft.observations || "").length }}/500</small></label
                  >
                  <section class="maintenance-evidence full">
                    <div>
                      <strong>Evidencias y documentos</strong
                      ><small
                        >Fotografias, facturas o comprobantes. Maximo 3 archivos de 750 KB.</small
                      >
                    </div>
                    <label class="maintenance-evidence-picker"
                      ><input
                        type="file"
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                        multiple
                        @change="addEvidenceFiles"
                        :disabled="isUploadingEvidence"
                      />Adjuntar archivos</label
                    >
                    <p v-if="evidenceError" class="maintenance-evidence-error">
                      {{ evidenceError }}
                    </p>
                    <ul v-if="draft.evidence?.length" class="maintenance-evidence-list">
                      <li v-for="(file, index) in draft.evidence" :key="`${file.name}-${index}`">
                        <span
                          ><strong>{{ file.name }}</strong
                          ><small>{{ formatFileSize(file.size) }}</small></span
                        ><button type="button" @click="removeEvidenceFile(index)">Quitar</button>
                      </li>
                    </ul>
                  </section>
                  <section class="automatic-data-summary close-summary full">
                    <header>
                      <SvgIcon name="check" />
                      <div>
                        <h3>Generado automaticamente</h3>
                        <small>Se registrara al confirmar el cierre.</small>
                      </div>
                    </header>
                    <dl>
                      <div>
                        <dt>Estado final</dt>
                        <dd>Cerrada</dd>
                      </div>
                      <div>
                        <dt>Cerrada por</dt>
                        <dd>{{ draft.closedBy || "Usuario actual" }}</dd>
                      </div>
                      <div>
                        <dt>Lectura registrada</dt>
                        <dd>{{ draft.closingReading || "Pendiente" }}</dd>
                      </div>
                      <div>
                        <dt>Proximo vencimiento</dt>
                        <dd>{{ automaticNextCycleLabel }}</dd>
                      </div>
                    </dl>
                  </section>
                </div>
              </section>
            </template>

            <template v-else-if="modalType === 'cost'">
              <section class="work-order-cost-form sm:col-span-2">
                <div class="work-order-cost-context">
                  <div>
                    <span>OT</span><strong>{{ draft.orderId }}</strong>
                  </div>
                  <div>
                    <span>Servicio</span><strong>{{ draft.job }}</strong>
                  </div>
                  <div>
                    <span>Activo</span><strong>{{ draft.plate }}</strong>
                  </div>
                  <div>
                    <span>Taller</span><strong>{{ draft.workshop }}</strong>
                  </div>
                  <div>
                    <span>Estado</span
                    ><strong class="cost-status">{{ getOrderStatusLabel(draft.status) }}</strong>
                  </div>
                </div>
                <section class="work-order-cost-section">
                  <header>
                    <h3>Documento y contexto</h3>
                    <p>Completa la informacion del costo asociado a esta orden de trabajo.</p>
                  </header>
                  <div class="work-order-cost-grid">
                    <label
                      ><span>Tipo de costo</span
                      ><select v-model="draft.type">
                        <option>Mantencion preventiva</option>
                        <option>Reparacion</option>
                        <option>Repuestos</option>
                        <option>Otro</option>
                      </select></label
                    >
                    <label><span>Fecha</span><input v-model="draft.date" type="date" /></label>
                    <label><span>Taller</span><input v-model="draft.workshop" type="text" /></label>
                    <label
                      ><span>Factura / Documento</span><input v-model="draft.invoice" type="text"
                    /></label>
                  </div>
                </section>
                <section class="work-order-cost-section">
                  <header>
                    <h3>Desglose del costo</h3>
                    <p>Ingresa los montos que componen este costo.</p>
                  </header>
                  <div class="work-order-cost-grid three">
                    <label
                      ><span>Mano de obra</span>
                      <div class="money-field">
                        <b>$</b><input v-model="draft.labor" type="text" inputmode="numeric" /></div
                    ></label>
                    <label
                      ><span>Repuestos</span>
                      <div class="money-field">
                        <b>$</b><input v-model="draft.parts" type="text" inputmode="numeric" /></div
                    ></label>
                    <label
                      ><span>Otros costos</span>
                      <div class="money-field">
                        <b>$</b><input v-model="draft.other" type="text" inputmode="numeric" /></div
                    ></label>
                  </div>
                </section>
                <section class="work-order-cost-section observations">
                  <header>
                    <h3>Observaciones <small>(opcional)</small></h3>
                    <p>Agrega informacion adicional sobre este costo.</p>
                  </header>
                  <textarea
                    v-model="draft.observations"
                    rows="2"
                    placeholder="Escribe una observacion..."
                  ></textarea>
                </section>
              </section>
            </template>

            <template v-else-if="modalType === 'order-detail'">
              <section class="order-detail-view sm:col-span-2">
                <div v-if="!['finished', 'cancelled'].includes(draft.status)" class="order-detail-management">
                  <strong>Gestion de la OT</strong>
                  <button type="button" @click="emit('manage-work-order', draft.orderId, 'reprogram-order')">Editar planificacion</button>
                  <button v-if="draft.status === 'in-progress'" type="button" @click="emit('manage-work-order', draft.orderId, 'assign-order', 'waiting')">Poner en espera</button>
                </div>
                <div class="order-detail-columns">
                  <div class="order-detail-left">
                    <section class="order-detail-general">
                      <h3>Trabajo y asignacion</h3>
                      <dl>
                        <dt>Responsable</dt>
                        <dd>{{ draft.owner }}</dd>
                        <dt>Taller</dt>
                        <dd>{{ draft.workshop }}</dd>
                        <dt>Prioridad</dt>
                        <dd>{{ draft.priority }}</dd>
                        <dt v-if="draft.plannedStartDate && draft.plannedStartDate !== draft.scheduledDate">Inicio planificado</dt>
                        <dd v-if="draft.plannedStartDate && draft.plannedStartDate !== draft.scheduledDate">
                          {{ formatDetailDate(draft.plannedStartDate) }}
                        </dd>
                        <dt v-if="draft.startedAt || draft.openingReading">Lectura al iniciar</dt>
                        <dd v-if="draft.startedAt || draft.openingReading">{{ draft.openingReading || "Sin registro" }}</dd>
                        <dt v-if="draft.status === 'finished'">Lectura final</dt>
                        <dd v-if="draft.status === 'finished'">
                          {{ draft.closingReading || "Sin registro" }}
                        </dd>
                        <dt>Descripcion registrada</dt>
                        <dd>{{ draft.description || "Sin descripcion" }}</dd>
                      </dl>
                    </section>
                    <section v-if="draft.evidence?.length" class="order-detail-evidence">
                      <h3>Evidencias y documentos</h3>
                      <ul>
                        <li v-for="(file, index) in draft.evidence" :key="`${file.name}-${index}`">
                          <span
                            ><strong>{{ file.name }}</strong
                            ><small>{{ formatFileSize(file.size) }}</small></span
                          >
                          <a href="#" @click.prevent="downloadEvidence(file)">Descargar</a>
                        </li>
                      </ul>
                    </section>
                    <p v-if="evidenceError" class="maintenance-evidence-error">{{ evidenceError }}</p>
                    <section v-if="['finished', 'cancelled'].includes(draft.status)" class="order-detail-result">
                      <h3>
                        {{
                          draft.status === "cancelled"
                            ? "Detalle de cancelacion"
                            : "Detalle de cierre"
                        }}
                      </h3>
                      <dl>
                        <dt>{{ draft.status === "cancelled" ? "Motivo" : "Resultado" }}</dt>
                        <dd>
                          {{
                            draft.status === "cancelled"
                              ? draft.cancellationReason ||
                                draft.description ||
                                "Sin razon registrada"
                              : draft.workPerformed || "Sin detalle registrado"
                          }}
                        </dd>
                        <dt>
                          {{ draft.status === "cancelled" ? "Cancelada por" : "Cerrada por" }}
                        </dt>
                        <dd>
                          {{ draft.cancelledBy || draft.closedBy || draft.owner || "Sin registro" }}
                        </dd>
                        <dt>Fecha y hora</dt>
                        <dd>
                          {{
                            formatDetailDate(
                              draft.status === 'cancelled' ? draft.cancelledAt : draft.closedAt,
                            )
                          }}
                        </dd>
                        <dt>Observacion</dt>
                        <dd>
                          {{
                            draft.observations || "Sin observaciones registradas."
                          }}
                        </dd>
                      </dl>
                    </section>
                  </div>
                  <div class="order-detail-right">
                    <section class="order-detail-costs">
                      <div class="order-detail-cost-heading">
                        <h3>Costos</h3>
                        <button v-if="!['finished', 'cancelled'].includes(draft.status)" type="button" @click="emit('manage-work-order-cost', draft.orderId)">Agregar costos</button>
                      </div>
                      <dl>
                        <dt>Presupuesto estimado</dt><dd>{{ draft.estimatedCost || '$ 0' }}</dd>
                        <dt>Mano de obra</dt><dd>{{ draft.laborCost || '$ 0' }}</dd>
                        <dt>Repuestos</dt><dd>{{ draft.partsCost || '$ 0' }}</dd>
                        <dt>Otros costos</dt><dd>{{ draft.otherCost || '$ 0' }}</dd>
                        <dt class="order-cost-total">Total real registrado</dt><dd class="order-cost-total">{{ draft.actualCost || '$ 0' }}</dd>
                      </dl>
                    </section>
                    <section class="order-detail-trace">
                      <h3>Trazabilidad de la orden</h3>
                      <ol>
                        <li
                          v-for="event in orderTraceEvents"
                          :key="event.key"
                          :class="event.className"
                        >
                          <strong>{{ event.action }}</strong
                          ><span>{{ formatDetailDate(event.at) }}</span>
                          <small v-if="event.user">{{ event.user }}</small>
                          <p v-if="event.detail">{{ event.detail }}</p>
                        </li>
                      </ol>
                    </section>
                    <p v-if="!orderTraceEvents.length" class="order-detail-empty-history">Sin movimientos registrados.</p>
                  </div>
                </div>
              </section>
            </template>

            <template v-else-if="modalType === 'export'">
              <label class="maintenance-modal-field">
                <span>Formato</span>
                <select v-model="draft.format">
                  <option value="Excel">Excel</option>
                  <option value="PDF">PDF</option>
                  <option value="CSV">CSV</option>
                </select>
              </label>
              <label class="maintenance-modal-field">
                <span>Rango</span>
                <select v-model="draft.range">
                  <option value="Vista actual">Vista actual</option>
                  <option value="Mes actual">Mes actual</option>
                  <option value="Historico completo">Historico completo</option>
                </select>
              </label>
              <label class="maintenance-modal-field">
                <span>Costos</span>
                <select v-model="draft.includeCosts">
                  <option value="Incluir costos">Incluir costos</option>
                  <option value="Sin costos">Sin costos</option>
                </select>
              </label>
              <label class="maintenance-modal-field">
                <span>Documentos</span>
                <select v-model="draft.includeDocuments">
                  <option value="Resumen">Resumen</option>
                  <option value="Con facturas">Con facturas</option>
                </select>
              </label>
            </template>
          </div>
        </div>

        <footer
          v-if="modalType !== 'maintenance-type'"
          class="flex shrink-0 flex-col gap-2 border-t border-[#edf1f5] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-end"
          :class="modalType === 'maintenance' ? 'maintenance-create-footer' : ''"
        >
          <span v-if="orderExportError" class="mr-auto text-[11px] font-bold text-rose-600">
            {{ orderExportError }}
          </span>
          <button
            v-if="modalType === 'order-detail' && fleetOrderContext"
            type="button"
            class="mr-auto inline-flex min-h-9 items-center rounded-lg border border-[#dfe5ed] px-4 text-[12px] font-bold text-[#102372]"
            @click="emit('return-to-fleet-plan')"
          >
            Volver al plan en Flota
          </button>
          <button
            v-if="modalType === 'order-detail' && draft.status === 'finished'"
            class="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#102372] px-4 text-[12px] font-black text-[#102372] transition hover:bg-blue-50 disabled:cursor-wait disabled:opacity-70"
            type="button"
            :disabled="isExportingOrder"
            @click="exportCurrentWorkOrder"
          >
            <span
              v-if="isExportingOrder"
              class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#102372]/25 border-t-[#102372]"
              aria-hidden="true"
            ></span>
            {{ isExportingOrder ? "Generando..." : "Exportar OT" }}
          </button>
          <button
            v-if="modalType === 'order-detail' && !['finished', 'cancelled'].includes(draft.status)"
            type="button"
            class="order-detail-cancel"
            @click="emit('manage-work-order', draft.orderId, 'cancel-order')"
          >Cancelar OT</button>
          <button
            class="h-9 rounded-lg border border-[#dfe5ed] px-4 text-[12px] font-black text-slate-500 transition hover:border-slate-400"
            type="button"
            @click="
              modalType === 'create-order' && orderWizardStep > 1
                ? orderWizardStep--
                : modalType === 'maintenance' && maintenanceWizardStep > 1
                ? maintenanceWizardStep--
                : emit('close')
            "
          >
            {{
              modalType === "order-detail"
                ? "Cerrar"
                : (modalType === 'create-order' && orderWizardStep > 1) || (modalType === "maintenance" && maintenanceWizardStep > 1)
                  ? "Volver"
                  : "Cancelar"
            }}
          </button>
          <button
            v-if="modalType === 'renew-maintenance'"
            class="h-9 rounded-lg border border-[#102372] px-4 text-[12px] font-black text-[#102372]"
            type="button"
            @click="emit('edit-before-renewal')"
          >
            Editar antes
          </button>
          <button v-if="modalType === 'maintenance' && draft.editMode && editingMaintenancePlan && !isBaseMaintenancePlan(editingMaintenancePlan)" type="button" class="h-9 rounded-md border border-rose-200 px-3 text-[12px] text-rose-700" @click="emit('open-delete-maintenance-plan', editingMaintenancePlan)">Eliminar plan</button>
          <button
            v-if="modalType !== 'order-detail'"
            class="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#ff6600] px-4 text-[12px] font-black leading-none text-white transition hover:bg-[#e65c00] disabled:cursor-not-allowed disabled:bg-orange-300"
            type="button"
            :disabled="
              isUploadingEvidence ||
              ((modalType === 'maintenance' && maintenanceWizardStep > 1 || modalType === 'edit-maintenance') && !isMaintenanceTargetValid) ||
              (modalType === 'create-order' && Boolean(orderWizardError)) ||
              (modalType === 'assign-order' &&
                draft.status === 'waiting' &&
                !String(draft.waitingReason || '').trim()) ||
              (modalType === 'close-order' &&
                (!String(draft.workPerformed || '').trim() ||
                  !String(draft.closedBy || '').trim() ||
                  !String(draft.closingReading || '').trim())) ||
              (modalType === 'maintenance' &&
                ((maintenanceWizardStep === 1 &&
                  (!draft.vehicleId || isCreateMaintenanceTypeDisabled(draft.type || draft.name))) ||
                  (maintenanceWizardStep > 1 &&
                    (!draft.vehicleId ||
                      (!draft.editMode &&
                        isMaintenanceTemplateUsed(draft.vehicleId, draft.type || draft.name))))))
            "
            @click="modalType === 'create-order' ? handleOrderWizardPrimary() : modalType === 'maintenance' ? handleMaintenanceWizardPrimary() : emit('submit')"
          >
            {{
              modalType === 'create-order' ? orderWizardStep < 3 ? 'Siguiente' : 'Crear OT' : modalType === "maintenance"
                ? maintenanceWizardStep < 3
                  ? "Siguiente"
                  : draft.editMode
                    ? "Guardar cambios"
                    : "Crear plan"
                : modalType === 'assign-order' && draft.transitionLabel ? draft.transitionLabel : modalPrimaryAction
            }}
            <SvgIcon
              v-if="modalType === 'maintenance' && maintenanceWizardStep < 3 || modalType === 'create-order' && orderWizardStep < 3"
              name="arrow-right"
              class="inline-flex h-4 w-4 shrink-0 items-center justify-center [&_svg]:h-4 [&_svg]:w-4"
            />
          </button>
        </footer>
      </section>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue"
import { validateMaintenanceOrderStep } from '../../utils/maintenance/maintenanceOrderWizard.js'
import { maintenanceDay } from '../../utils/maintenance/maintenanceHistoricalReading.js'
import { maintenanceRemainingThreshold } from '../../utils/maintenance/maintenanceRemainingThreshold.js'
import { maintenanceTargetDate, maintenanceDateInterval } from '../../utils/maintenance/maintenanceDateTarget.js'

const historyExportMenu = ref(null)
const historyExportBusy = ref(false)
const historyExportError = ref("")
const closeHistoryExportMenu = event => {
  if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false
}
const exportVehicleHistory = async format => {
  if (historyExportBusy.value || !filteredVehicleHistory.value.length) return
  historyExportMenu.value.open = false
  historyExportBusy.value = true
  historyExportError.value = ""
  const orders = filteredVehicleHistory.value.map(order => ({ ...order }))
  const vehicle = { ...props.selectedVehicle }
  try {
    const { exportMaintenanceHistory } = await import("../../services/maintenance/maintenanceHistoryExportService.js")
    await exportMaintenanceHistory(orders, vehicle, format, { reportWidthPx: Math.max(1000, Math.min(2560, (window.screen?.availWidth || window.innerWidth) - 24)) })
  } catch {
    historyExportError.value = "No se pudo generar el archivo. Intenta nuevamente."
  } finally {
    historyExportBusy.value = false
  }
}

import SvgIcon from "../icons/SvgIcon.vue"
import vehicleBlueCar from "../../assets/map/vehicle-blue-car.png"
import vehicleBlueTruck from "../../assets/map/vehicle-blue-truck.png"
import { getMaintenanceEvidence, saveMaintenanceEvidenceFile } from "../../services/maintenance/maintenanceEvidenceStorage.js"
import { createMaintenanceEvidenceSession } from "../../services/maintenance/maintenanceEvidenceSession.js"
import { useMaintenanceTypeCatalog } from "../../composables/maintenance/useMaintenanceTypeCatalog.js"
import { useMaintenanceVehicleHistory } from "../../composables/maintenance/useMaintenanceVehicleHistory.js"

import { formatOrderDetailDate as formatDetailDate, getOrderDetailEvents } from "../../utils/maintenance/maintenanceOrderDetail.js"

const props = defineProps({
  orderCreationContext: { type: Object, default: null },
  fleetOrderContext: { type: Object, default: null },
  cleanupEvidence: { type: Function, required: true },
  maintenanceTypeOrigins: { type: Object, default: () => ({}) },
  maintenanceTypeReadingSources: { type: Object, default: () => ({}) },
  getMaintenancePlanDetails: {
    type: Function,
    required: true,
  },
  getMaintenancePlanPillClass: {
    type: Function,
    required: true,
  },
  getMaintenancePlanStatusClass: {
    type: Function,
    required: true,
  },
  getMaintenancePlanStatusMessage: {
    type: Function,
    required: true,
  },
  getOrderStatusLabel: {
    type: Function,
    required: true,
  },
  getStatusLabel: {
    type: Function,
    required: true,
  },
  getSummaryMetricIcon: {
    type: Function,
    required: true,
  },
  isBaseMaintenancePlan: {
    type: Function,
    required: true,
  },
  isMaintenanceTemplateUsed: {
    type: Function,
    required: true,
  },
  getMaintenanceReadingAtDate: { type: Function, default: () => null },
  maintenanceItems: {
    type: Array,
    default: () => [],
  },
  maintenanceReadingSources: {
    type: Array,
    default: () => [],
  },
  maintenanceTypeCriterionOptions: {
    type: Array,
    default: () => [],
  },
  maintenanceTypes: {
    type: Array,
    default: () => [],
  },
  workOrders: {
    type: Array,
    default: () => [],
  },
  modalActionMessage: {
    type: String,
    default: "",
  },
  modalDescription: {
    type: String,
    default: "",
  },
  modalDraft: {
    type: Object,
    default: () => ({}),
  },
  modalKicker: {
    type: String,
    default: "",
  },
  modalPrimaryAction: {
    type: String,
    default: "Guardar",
  },
  modalTitle: {
    type: String,
    default: "",
  },
  modalType: {
    type: String,
    default: "",
  },
  modalVehicleMaintenancePlans: {
    type: Array,
    default: () => [],
  },
  orderPriorityOptions: {
    type: Array,
    default: () => [],
  },
  orderStatusFilters: {
    type: Array,
    default: () => [],
  },
  selectedVehicle: {
    type: Object,
    required: true,
  },
  selectedVehicleMaintenancePlans: {
    type: Array,
    default: () => [],
  },
  statusFilters: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits([
  "manage-work-order",
  "manage-work-order-cost",
  "return-to-fleet-plan",
  "close",
  "create-work-order-from-maintenance-plan",
  "open-delete-maintenance-plan",
  "edit-before-renewal",
  "renew-maintenance",
  "open-edit-maintenance-plan",
  "open-maintenance-modal",
  "open-order-in-table",
  "delete-maintenance-type",
  "update-maintenance-type",
  "submit",
  "sync-maintenance-type-draft",
  "sync-maintenance-vehicle-draft",
  "sync-order-maintenance-plan-draft",
  "sync-order-vehicle-draft",
])

const draft = computed(() => props.modalDraft || {})
const draftVehicle = computed(() => props.maintenanceItems.find((vehicle) => String(vehicle.id) === String(draft.value.vehicleId)) || props.selectedVehicle)
const draftPlan = computed(() => props.modalVehicleMaintenancePlans.find((plan) => String(plan.id) === String(draft.value.maintenancePlanId)))
const draftVehicleLabel = computed(() => draftVehicle.value?.plate || 'Activo seleccionado')
const draftPlanLabel = computed(() => draftPlan.value?.name || draft.value.job || 'Plan seleccionado')
const draftOpeningReading = computed(() => {
  if (draft.value.readingSourceLabel === 'Horometro') return draftVehicle.value?.hourMeterLabel || 'Sin lectura'
  if (draft.value.readingSourceLabel === 'Fecha/Hora') return 'Fecha del sistema'
  return draftVehicle.value?.odometerLabel || 'Sin lectura'
})
const editingMaintenancePlan = computed(() => props.modalVehicleMaintenancePlans.find((plan) => String(plan.id) === String(draft.value.planId)))
const isStartConfirmation = computed(() => props.modalType === "assign-order" &&
  draft.value.status === "in-progress" && Boolean(draft.value.transitionLabel))
const parseCreateOrderCost = (value) => Number(String(value || "0").replace(/[^0-9]/g, "")) || 0
const createOrderEstimatedTotal = computed(
  () =>
    parseCreateOrderCost(draft.value.estimatedLabor) +
    parseCreateOrderCost(draft.value.estimatedParts) +
    parseCreateOrderCost(draft.value.estimatedOther),
)
const formattedCreateOrderTotal = computed(
  () => `$ ${createOrderEstimatedTotal.value.toLocaleString("es-CL")}`,
)
const closeOrderCostTotal = computed(
  () =>
    parseCreateOrderCost(draft.value.laborCost) +
    parseCreateOrderCost(draft.value.partsCost) +
    parseCreateOrderCost(draft.value.otherCost),
)
watch(
  closeOrderCostTotal,
  (total) => {
    if (props.modalType === "close-order") draft.value.totalCost = String(total)
  },
  { immediate: true },
)
const automaticNextCycleLabel = computed(() =>
  String(draft.value.nextCycle || "")
    .toLowerCase()
    .includes("generar")
    ? "Se calculara desde el plan"
    : "No se generara",
)
const evidenceError = ref("")
const isUploadingEvidence = ref(false)
let evidenceSessionClosed = false
const evidenceSession = createMaintenanceEvidenceSession({
  saveFile: saveMaintenanceEvidenceFile,
  cleanupFiles: (ids) => props.cleanupEvidence(ids),
  onCleanupError: () => {
    evidenceError.value = "No fue posible limpiar uno de los adjuntos descartados."
  },
})
onBeforeUnmount(() => {
  evidenceSessionClosed = true
  void evidenceSession.dispose()
})
const formatFileSize = (size = 0) =>
  size < 1024 * 1024
    ? `${Math.max(1, Math.round(size / 1024))} KB`
    : `${(size / 1024 / 1024).toFixed(1)} MB`
const downloadEvidence = async (file) => {
  evidenceError.value = ""
  let objectUrl
  try {
    let href = file.dataUrl
    if (!href) {
      const blob = await getMaintenanceEvidence(file.storageId)
      if (!blob) throw new Error("Documento no encontrado.")
      objectUrl = URL.createObjectURL(blob)
      href = objectUrl
    }
    const link = document.createElement("a")
    link.href = href
    link.download = file.name
    document.body.appendChild(link)
    link.click()
    link.remove()
  } catch {
    evidenceError.value = "No fue posible recuperar el documento del almacenamiento local."
  } finally {
    if (objectUrl) setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
  }
}
const addEvidenceFiles = async (event) => {
  if (isUploadingEvidence.value) return
  evidenceError.value = ""
  const currentFiles = [...(draft.value.evidence || [])]
  const selectedFiles = [...(event.target.files || [])]

  if (currentFiles.length + selectedFiles.length > 3) {
    evidenceError.value = "Puedes adjuntar un maximo de 3 archivos."
    event.target.value = ""
    return
  }
  if (selectedFiles.some((file) => file.size > 750 * 1024)) {
    evidenceError.value = "Cada archivo debe pesar como maximo 750 KB."
    event.target.value = ""
    return
  }

  isUploadingEvidence.value = true
  try {
    const newFiles = await evidenceSession.upload(selectedFiles)
    if (evidenceSessionClosed) return
    draft.value.evidence = [...(draft.value.evidence || []), ...newFiles]
  } catch {
    evidenceError.value = "No fue posible guardar los archivos seleccionados en el almacenamiento local."
  } finally {
    isUploadingEvidence.value = false
    event.target.value = ""
  }
}
const removeEvidenceFile = (index) => {
  const removed = draft.value.evidence?.[index]
  draft.value.evidence = (draft.value.evidence || []).filter((_, fileIndex) => fileIndex !== index)
  evidenceError.value = ""
  if (removed?.storageId) void evidenceSession.release([removed.storageId])
}
const isExportingOrder = ref(false)
const orderExportError = ref("")
const exportCurrentWorkOrder = async () => {
  if (isExportingOrder.value) return
  orderExportError.value = ""
  isExportingOrder.value = true
  try {
    const { exportWorkOrderPdf } = await import("../../services/maintenance/workOrderExportService.js")
    await exportWorkOrderPdf(draft.value, props.getOrderStatusLabel)
  } catch (error) {
    console.error("Error al exportar OT", error)
    orderExportError.value = `No se pudo exportar: ${error?.message || "error desconocido"}`
  } finally {
    isExportingOrder.value = false
  }
}
const orderTraceEvents = computed(() => getOrderDetailEvents(draft.value).map((event) => ({
  ...event, className: getTraceEventClass(event.action),
})))

function getTraceEventClass(action = "") {
  const normalizedAction = action.toLowerCase()
  if (normalizedAction.includes("cancelada")) return "is-cancelled"
  if (normalizedAction.includes("cerrada")) return "is-closed"
  if (normalizedAction.includes("iniciado") || normalizedAction.includes("reanudado") || normalizedAction.includes("ejecucion")) {
    return "is-progress"
  }
  if (normalizedAction.includes("espera")) return "is-waiting"
  return ""
}

const typeCatalogMode = ref("empty")
const selectedMaintenanceType = ref("")
const selectedMaintenancePlanId = ref(props.modalDraft?.planId || "")
const vehicleDetailTab = ref("Planes")
const {
  type: vehicleHistoryType,
  from: vehicleHistoryFrom,
  to: vehicleHistoryTo,
  sort: historySort,
  page: vehicleHistoryPage,
  pageSize: vehicleHistoryPageSize,
  pageCount: vehicleHistoryPageCount,
  historyOrders: vehicleHistoryOrders,
  types: vehicleHistoryTypes,
  filteredOrders: filteredVehicleHistory,
  displayed: displayedVehicleHistory,
  sortBy: sortHistory,
} = useMaintenanceVehicleHistory({
  orders: () => props.workOrders,
  vehicleId: () => props.selectedVehicle.id,
})
const historyColumns = [
  { key: "closedAt", label: "Fecha de ejecucion" },
  { key: "job", label: "Mantencion" },
  { key: "id", label: "OT" },
  { key: "closingReading", label: "Lectura de cierre" },
  { key: "owner", label: "Responsable" },
  { key: "actualCost", label: "Costo real" },
]
const formatHistoryDate = (value) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? "Sin fecha registrada"
    : date.toLocaleDateString("es-CL", { timeZone: "America/Santiago" })
}
const maintenanceTypeSearch = ref("")
const maintenanceTypeCriterionFilter = ref("all")
const openTypeMenu = ref("")
const maintenanceWizardStep = ref(1)
const orderWizardStep = ref(1)
const orderWizardHeading = ref(null)
const orderWizardSteps = [
  { title: 'Trabajo', description: 'Vehiculo y mantencion' },
  { title: 'Programacion', description: 'Fecha y responsables' },
  { title: 'Confirmar', description: 'Revisa y crea la OT' },
]
const orderWizardError = computed(() => validateMaintenanceOrderStep(draft.value, orderWizardStep.value))
const handleOrderWizardPrimary = () => {
  if (orderWizardError.value) return
  if (orderWizardStep.value < 3) orderWizardStep.value++
  else emit('submit')
}
watch(orderWizardStep, async () => {
  await nextTick()
  if (props.modalType !== 'create-order') return
  orderWizardHeading.value?.focus({ preventScroll: true })
  const body = orderWizardHeading.value?.closest('.maintenance-action-modal > section')?.children[1]
  if (body) body.scrollTop = 0
})
const maintenancePlanSearch = ref("")
const maintenancePlanStatus = ref("all")
const maintenancePlanStatusFilters = [
  { label: "Todas", value: "all" },
  { label: "Sin renovar", value: "renewal-pending" },
  { label: "Al dia", value: "current" },
  { label: "Proximas", value: "due" },
  { label: "Vencidas", value: "overdue" },
]
const getMaintenanceTypeReadingSource = (type) => {
  if (props.maintenanceTypeReadingSources[type]) return props.maintenanceTypeReadingSources[type]
  if (type === "Revision tecnica" || type === "Permiso de circulacion") return "Fecha/Hora"
  if (type === "Filtro de combustible") return "Horometro"
  return "Odometro"
}
const getMaintenanceTypeCriterionLabel = (type) => {
  const source = getMaintenanceTypeReadingSource(type)
  return (
    props.maintenanceTypeCriterionOptions.find((criterion) => criterion.value === source)?.label ||
    source
  )
}
const getMaintenanceTypeCriterionClass = (type) => {
  const source = getMaintenanceTypeReadingSource(type)
  if (source === "Odometro") return "is-warning"
  if (source === "Horometro") return "is-hours"
  return "is-primary"
}
const {
  originFilter: maintenanceTypeOriginFilter,
  page: maintenanceTypePage,
  pageSize: maintenanceTypePageSize,
  direction: maintenanceTypeSortDirection,
  filtered: filteredMaintenanceTypes,
  pageCount: maintenanceTypePageCount,
  displayed: pagedMaintenanceTypes,
  toggleSort: toggleTypeSort,
} = useMaintenanceTypeCatalog({
  types: () => props.maintenanceTypes,
  origins: () => props.maintenanceTypeOrigins,
  readingSource: getMaintenanceTypeReadingSource,
  search: maintenanceTypeSearch,
  criterion: maintenanceTypeCriterionFilter,
  mode: typeCatalogMode,
  selected: selectedMaintenanceType,
})
const closeTypeMenuOutside = (event) => {
  if (!event.target.closest('.maintenance-type-row-actions')) openTypeMenu.value = ""
}
watch([maintenanceTypeSearch, maintenanceTypeCriterionFilter, maintenanceTypeOriginFilter, maintenanceTypePageSize], () => {
  openTypeMenu.value = ""
})
watch(() => props.maintenanceTypes.length, (length, previous) => {
  if (length > previous && typeCatalogMode.value === 'new') cancelNewMaintenanceType()
})
const getMaintenanceTypeInterval = (type) => {
  if (type === "Revision tecnica" || type === "Permiso de circulacion") return "Cada 365 dias"
  if (type === "Filtro de combustible") return "Cada 450 h"
  if (type === "Revision de frenos") return "Cada 15.000 km"
  if (type === "Cambio de neumaticos") return "Cada 40.000 km"
  return "Cada 10.000 km"
}
const selectedDraftVehicleLabel = computed(() => {
  const vehicle = props.maintenanceItems.find((item) => item.id === draft.value.vehicleId)
  return vehicle ? `${vehicle.plate} - ${vehicle.assetName}` : "Sin seleccionar"
})
const maintenanceValueUnit = computed(() =>
  draft.value.readingSourceLabel === "Fecha/Hora"
    ? "dias"
    : draft.value.readingSourceLabel === "Horometro"
      ? "horas"
      : "km",
)
const maintenanceIntervalLabel = computed(() => draft.value.readingSourceLabel === 'Fecha/Hora' ? 'Fecha de la proxima mantencion' : draft.value.readingSourceLabel === 'Horometro' ? 'Proxima mantencion a las (horas)' : 'Proxima mantencion a los (km)')
const maintenanceScheduleValue = computed({
  get: () => draft.value.readingSourceLabel !== 'Fecha/Hora'
    ? (draft.value.intervalValue === '' ? '' : Number(draft.value.lastReading || 0) + Number(draft.value.intervalValue || 0))
    : maintenanceTargetDate(draft.value.lastReading, draft.value.intervalValue),
  set: (value) => {
    draft.value.intervalValue = draft.value.readingSourceLabel === 'Fecha/Hora'
      ? maintenanceDateInterval(draft.value.lastReading, value)
      : value !== '' ? String(Number(value) - Number(draft.value.lastReading || 0)) : ''
  },
})
const isMaintenanceTargetValid = computed(() => draft.value.readingSourceLabel === 'Fecha/Hora' ? Boolean(maintenanceScheduleValue.value) : (
  String(draft.value.intervalValue ?? '').trim() !== '' &&
  Number.isFinite(Number(draft.value.intervalValue)) && Number(draft.value.intervalValue) > 0 &&
  Number.isFinite(Number(maintenanceScheduleValue.value)) && Number(maintenanceScheduleValue.value) > 0
))
const maintenanceGpsReading = computed(() => {
  const vehicle = props.maintenanceItems.find((item) => String(item.id) === String(draft.value.vehicleId))
  const value = draft.value.readingSourceLabel === 'Horometro' ? vehicle?.hourMeterHours : vehicle?.odometer
  return value == null || !Number.isFinite(Number(value)) ? 'Sin lectura disponible' : `${new Intl.NumberFormat('es-CL').format(Number(value))} ${maintenanceValueUnit.value}`
})
const maintenanceToday = maintenanceDay()
const isHistoricalMaintenanceReading = computed(() => Boolean(draft.value.startDate && draft.value.startDate !== maintenanceToday))
const maintenanceDisplayedReadingTitle = computed(() => isHistoricalMaintenanceReading.value
  ? `Lectura GPS del ${String(draft.value.startDate || '').split('-').reverse().join('-')}`
  : 'Lectura actual del GPS')
const maintenanceDisplayedReading = computed(() => !isHistoricalMaintenanceReading.value
  ? maintenanceGpsReading.value
  : String(draft.value.lastReading ?? '').trim() === '' ? 'Sin lectura para esta fecha'
    : `${new Intl.NumberFormat('es-CL').format(Number(draft.value.lastReading))} ${maintenanceValueUnit.value}`)
const maintenanceReferenceTimestamp = computed(() => draft.value.referenceReadingAt
  ? `Ultima lectura registrada del dia: ${new Intl.DateTimeFormat('es-CL', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Santiago' }).format(new Date(draft.value.referenceReadingAt))}`
  : draft.value.startDate === maintenanceToday ? 'Lectura actual disponible del vehiculo' : 'Sin registro historico verificable disponible')
const syncMaintenanceHistoricalReading = () => {
  const target = draft.value.readingSourceLabel !== 'Fecha/Hora' ? maintenanceScheduleValue.value : null
  const reading = props.getMaintenanceReadingAtDate(draft.value.vehicleId, draft.value.startDate, draft.value.readingSourceLabel)
  draft.value.lastReading = reading == null ? '' : String(reading.value)
  draft.value.referenceReadingAt = reading?.at || null
  if (target !== null) maintenanceScheduleValue.value = target
}
const prefillMaintenanceGpsReading = () => {
  if (draft.value.editMode) return
  if (draft.value.readingSourceLabel === 'Fecha/Hora') {
    draft.value.lastReading = maintenanceToday
    draft.value.intervalValue = ''
    return
  }
  if (!draft.value.startDate) draft.value.startDate = maintenanceToday
  syncMaintenanceHistoricalReading()
  draft.value.intervalValue = ''
}
const maintenanceAlertLabel = computed(() => `Avisar con (${maintenanceValueUnit.value})`)
const maintenanceThresholdSummary = computed(() => {
  const vehicle = props.maintenanceItems.find((item) => String(item.id) === String(draft.value.vehicleId))
  const current = draft.value.readingSourceLabel === 'Horometro' ? vehicle?.hourMeterHours : vehicle?.odometer
  return maintenanceRemainingThreshold(draft.value, current)
})
const maintenanceLastReadingLabel = computed(() =>
  draft.value.readingSourceLabel === "Fecha/Hora"
    ? "Fecha de la ultima mantencion"
    : draft.value.readingSourceLabel === "Horometro"
      ? "Horometro de la ultima mantencion (horas)"
      : "Kilometraje de la ultima mantencion (km)",
)
const maintenanceLastReadingDisplay = computed(() => {
  const value = String(draft.value.lastReading || "-")
  if (draft.value.readingSourceLabel !== "Fecha/Hora" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value
  }
  const [year, month, day] = value.split("-")
  return `${day} - ${month} - ${year}`
})
const isCreateMaintenanceTypeDisabled = (type) => {
  const vehicleId = draft.value.vehicleId
  if (!vehicleId || !type || !props.maintenanceItems.some((vehicle) => String(vehicle.id) === String(vehicleId))) return true

  const normalize = (value) =>
    String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase()
  if (props.modalType === 'edit-maintenance' && normalize(type) === normalize(draft.value.originalType)) return false
  const plans = draft.value.vehicleId
    ? props.modalVehicleMaintenancePlans
    : props.selectedVehicleMaintenancePlans
  const exists = plans.some(
    (plan) => normalize(plan.name) === normalize(type) || normalize(plan.type) === normalize(type),
  )

  return exists || props.isMaintenanceTemplateUsed(vehicleId, type)
}
const isBlueHeader = computed(() =>
  ["maintenance", "create-order", "close-order"].includes(props.modalType),
)
const selectedVehicleImage = computed(() =>
  String(props.selectedVehicle?.assetName || "")
    .toLowerCase()
    .includes("camion")
    ? vehicleBlueTruck
    : vehicleBlueCar,
)
const primaryMaintenancePlan = computed(() => {
  return (
    props.selectedVehicleMaintenancePlans.find(
      (plan) => plan.id === selectedMaintenancePlanId.value,
    ) ||
    props.selectedVehicleMaintenancePlans[0] ||
    null
  )
})
const normalizePlanLink = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
const relatedPlanOrders = computed(() => {
  const plan = primaryMaintenancePlan.value
  if (!plan) return []

  return props.workOrders
    .filter((order) => {
      const sameVehicle = String(order.vehicleId) === String(plan.vehicleId)
      const samePlan = String(order.maintenancePlanId || "") === String(plan.id)
      const sameMaintenance =
        normalizePlanLink(order.job) === normalizePlanLink(plan.name || plan.type)
      return sameVehicle && (samePlan || sameMaintenance)
    })
    .sort((first, second) => {
      const firstDate = new Date(first.closedAt || first.createdAt || first.scheduledDate || 0)
      const secondDate = new Date(second.closedAt || second.createdAt || second.scheduledDate || 0)
      return secondDate - firstDate
    })
})
const activePlanOrder = computed(() =>
  relatedPlanOrders.value.find((order) =>
    ["scheduled", "in-progress", "waiting"].includes(order.status),
  ),
)
const latestClosedPlanOrder = computed(() =>
  relatedPlanOrders.value.find((order) => order.status === "finished"),
)
const relatedPlanOrder = computed(
  () => activePlanOrder.value || latestClosedPlanOrder.value || relatedPlanOrders.value[0] || null,
)
const planExecutionLabel = computed(() => {
  const order = relatedPlanOrder.value
  if (!order) return "Pendiente"
  if (order.status === "scheduled") return "Programada; pendiente de iniciar"
  if (order.status === "in-progress") return "Trabajo en proceso"
  if (order.status === "waiting") return "Ejecución en espera"
  if (order.status === "finished") return "Trabajo finalizado"
  if (order.status === "cancelled") return "Ejecución cancelada"
  return "Pendiente"
})
const planClosureLabel = computed(() => {
  const order = latestClosedPlanOrder.value
  if (!order) return "Sin cierre registrado"
  const reading = order.closingReading ? ` · ${order.closingReading}` : ""
  return `${formatDetailDate(order.closedAt || order.scheduledDate)}${reading}`
})
const planNextDueLabel = computed(() =>
  activePlanOrder.value
    ? "Se actualizará al cerrar la OT"
    : primaryMaintenancePlan.value?.nextLabel ||
      primaryMaintenancePlan.value?.remainingLabel ||
      "Sin cálculo disponible",
)
const additionalMaintenancePlans = computed(() =>
  props.selectedVehicleMaintenancePlans.filter(
    (plan) => plan.id !== primaryMaintenancePlan.value?.id,
  ),
)
const filteredAdditionalMaintenancePlans = computed(() => {
  const query = maintenancePlanSearch.value.trim().toLocaleLowerCase("es")

  return additionalMaintenancePlans.value.filter((plan) => {
    const matchesSearch =
      !query ||
      String(plan.name || "")
        .toLocaleLowerCase("es")
        .includes(query)
    const matchesStatus =
      maintenancePlanStatus.value === "all" || plan.status === maintenancePlanStatus.value
    return matchesSearch && matchesStatus
  })
})
const additionalMaintenanceEmptyTitle = computed(() =>
  additionalMaintenancePlans.value.length
    ? "No hay mantenciones para estos filtros"
    : "No hay otras mantenciones configuradas",
)
const additionalMaintenanceEmptyDescription = computed(() =>
  additionalMaintenancePlans.value.length
    ? "Cambia la busqueda o selecciona otro estado para ver resultados."
    : "Puedes agregar nuevas mantenciones al vehiculo para llevar un mejor control de sus servicios.",
)
const getMaintenancePlanProgress = (plan) => {
  const toNumber = (value) => Number(String(value || "").replace(/[^0-9]/g, "")) || 0
  const current = toNumber(plan?.actualLabel)
  const interval = toNumber(plan?.intervalLabel)
  return interval ? Math.min(Math.round((current / interval) * 100), 100) : 0
}

const startNewMaintenanceType = () => {
  openTypeMenu.value = ""
  selectedMaintenanceType.value = ""
  typeCatalogMode.value = "new"
  draft.value.name = ""
  draft.value.readingSourceLabel = "Odometro"
}
const startEditMaintenanceType = (type) => {
  selectedMaintenanceType.value = type
  typeCatalogMode.value = "edit"
  draft.value.name = type
  draft.value.readingSourceLabel = getMaintenanceTypeReadingSource(type)
  openTypeMenu.value = ""
}
const isCatalogSaveDisabled = computed(
  () =>
    !String(draft.value.name || "").trim() || !String(draft.value.readingSourceLabel || "").trim() ||
    props.maintenanceTypes.some((type) => type !== selectedMaintenanceType.value && type.trim().toLowerCase() === String(draft.value.name || '').trim().toLowerCase()),
)
const submitCatalogRow = () => {
  if (isCatalogSaveDisabled.value) return

  if (typeCatalogMode.value === "edit") {
    emit("update-maintenance-type", {
      currentName: selectedMaintenanceType.value,
      name: draft.value.name,
      readingSourceLabel: draft.value.readingSourceLabel,
    })
    typeCatalogMode.value = "empty"
    selectedMaintenanceType.value = ""
    draft.value.name = ""
    return
  }
  emit("submit")
}
const toggleTypeMenu = (type) => {
  openTypeMenu.value = openTypeMenu.value === type ? "" : type
}
const deleteMaintenanceType = (type) => {
  emit("delete-maintenance-type", type)
  openTypeMenu.value = ""
}
const cancelNewMaintenanceType = () => {
  typeCatalogMode.value = "empty"
  draft.value.name = ""
}
const selectTypeFromCatalog = (type) => {
  selectedMaintenanceType.value = type
  typeCatalogMode.value = "detail"
  draft.value.name = type
  draft.value.readingSourceLabel =
    type === "Permiso de circulacion" || type === "Revision tecnica"
      ? "Fecha/Hora"
      : type === "Filtro de combustible"
        ? "Horometro"
        : "Odometro"
}
const typeIntervalLabel = (type, index) => {
  if (type === "Revision tecnica" || type === "Permiso de circulacion") return "Cada 365 dias"
  if (type === "Revision de frenos") return "Cada 15.000 km"
  if (type === "Cambio de aceite y filtros") return "Cada 10.000 km"
  if (type === "Filtro de combustible") return "Cada 450 h"
  return `Intervalo ${index + 1}`
}
const typeVehicleCount = (type) =>
  props.maintenanceItems.filter((item) => item.type === type || item.nextJob === type).length

watch(
  () => props.modalType,
  (modalType) => {
    if (modalType === 'create-order') orderWizardStep.value = 1
    if (modalType === "maintenance") {
      maintenanceWizardStep.value = 1
    }
    if (modalType === "maintenance-type") {
      typeCatalogMode.value = "empty"
      selectedMaintenanceType.value = ""
      maintenanceTypeSearch.value = ""
      maintenanceTypeCriterionFilter.value = "all"
      openTypeMenu.value = ""
      draft.value.name = ""
      draft.value.readingSourceLabel = "Odometro"
    }
  },
)
const selectMaintenanceType = (type) => {
  if (props.modalType === 'maintenance' && isCreateMaintenanceTypeDisabled(type)) return
  if (draft.value.editMode && type === draft.value.originalType) {
    draft.value.type = type
    draft.value.name = type
    return
  }
  draft.value.type = type
  draft.value.name = type
  emit("sync-maintenance-type-draft")
}
const handleMaintenanceWizardPrimary = () => {
  if (maintenanceWizardStep.value > 1 && !isMaintenanceTargetValid.value) return
  if (maintenanceWizardStep.value < 3) {
    maintenanceWizardStep.value += 1
    return
  }
  emit("submit")
}
</script>
