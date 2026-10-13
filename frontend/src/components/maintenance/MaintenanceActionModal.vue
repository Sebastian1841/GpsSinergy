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
          modalType === 'maintenance'
            ? 'maintenance-create-shell max-w-[900px]'
            : modalType === 'maintenance-type'
              ? 'maintenance-types-modal-shell max-w-[1192px]'
              : modalType === 'create-order'
                ? 'work-order-create-shell max-w-[1240px]'
                : modalType === 'close-order'
                  ? 'work-order-close-shell max-w-[1180px]'
                  : modalType === 'cost'
                    ? 'work-order-cost-shell max-w-[900px]'
                    : modalType === 'order-detail'
                      ? 'order-detail-shell max-w-[1280px]'
                      : modalType === 'maintenance-detail'
                        ? 'maintenance-detail-shell max-w-[1080px]'
                        : 'max-w-[760px]'
        "
      >
        <header
          class="shrink-0 border-b px-5 py-4"
          :class="
            modalType === 'maintenance-type'
              ? 'maintenance-types-modal-header'
              : modalType === 'maintenance-detail'
              ? 'border-[#edf1f5]'
              : isBlueHeader
                ? `border-[#0b2d63] bg-[#0b2d63] ${
                    modalType === 'maintenance-type' ? 'maintenance-types-modal-header' : ''
                  }`
                : 'border-[#edf1f5]'
          "
        >
          <div class="flex items-start justify-between gap-4">
            <h2
              v-if="modalType === 'maintenance-detail'"
              class="text-[20px] font-black text-[#102372]"
            >
              Mantenciones del vehiculo
            </h2>
            <div
              v-if="modalType !== 'maintenance-detail' && modalType !== 'order-detail'"
              class="min-w-0 flex-1"
            >
              <p
                v-if="
                  modalType !== 'maintenance-type' &&
                  modalType !== 'create-order' &&
                  modalType !== 'close-order'
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
                      : modalTitle
                }}
              </h2>

              <p
                v-if="modalType === 'maintenance-type'"
                class="maintenance-types-description"
              >
                Administra los tipos de mantencion que se pueden asignar a los vehiculos.
              </p>

              <p
                v-if="
                  modalType === 'close-order' || (!isBlueHeader && modalType !== 'create-order' && modalType !== 'maintenance-type')
                "
                class="mt-1 text-[12px] font-bold leading-5"
                :class="modalType === 'close-order' ? 'text-blue-100' : 'text-slate-500'"
              >
                {{ modalDescription }}
              </p>
            </div>

            <div v-if="modalType === 'order-detail'" class="order-detail-header-main">
              <h2>Detalles de OT</h2>
              <div class="order-detail-header-summary">
                <div>
                  <span>OT</span><strong>{{ draft.orderId }}</strong>
                </div>
                <div>
                  <span>Activo</span><strong>{{ draft.plate }}</strong>
                </div>
                <div>
                  <span>Tipo de mantencion</span><strong>{{ draft.job }}</strong>
                </div>
                <div>
                  <span>Prioridad</span><strong>{{ draft.priority }}</strong>
                </div>
                <div>
                  <span>Estado</span>
                  <strong
                    class="order-detail-status-pill"
                    :class="draft.status === 'cancelled' ? 'is-cancelled' : 'is-closed'"
                  >
                    {{ getOrderStatusLabel(draft.status) }}
                  </strong>
                </div>
                <div>
                  <span>{{
                    draft.status === "cancelled" ? "OT cancelada el" : "OT cerrada el"
                  }}</span>
                  <strong>{{
                    formatDetailDate(draft.cancelledAt || draft.closedAt || draft.scheduledDate)
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
              <SvgIcon v-if="modalType === 'maintenance-type'" name="close" />
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
                : modalType === 'maintenance-detail'
                  ? 'p-4'
                  : 'p-4'
          "
        >
          <div
            v-if="modalActionMessage"
            class="mb-3 rounded-lg border px-3 py-2 text-[12px] font-black"
            :class="
              modalType === 'maintenance-detail'
                ? 'border-amber-300 bg-amber-50 text-amber-800'
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
                  <div class="maintenance-create-types">
                    <button
                      v-for="type in maintenanceTypes"
                      :key="type"
                      type="button"
                      :class="{ active: draft.type === type }"
                      :disabled="isCreateMaintenanceTypeDisabled(type)"
                      @click="selectMaintenanceType(type)"
                    >
                      <span
                        ><strong>{{ type }}</strong
                        ><small v-if="isCreateMaintenanceTypeDisabled(type)">Ya configurada</small
                        ><small v-else
                          >{{ getMaintenanceTypeCriterionLabel(type) }} ·
                          {{ getMaintenanceTypeInterval(type) }}</small
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
                        <span>Tipo de mantencion</span><strong>{{ draft.name }}</strong>
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
                        <dd>{{ draft.intervalValue }} {{ maintenanceValueUnit }}</dd>
                      </div>
                      <div>
                        <dt>{{ maintenanceAlertLabel }}</dt>
                        <dd>{{ draft.alertValue }} {{ maintenanceValueUnit }}</dd>
                      </div>
                      <div>
                        <dt>Ultima vez</dt>
                        <dd>{{ maintenanceLastReadingDisplay }}</dd>
                      </div>
                      <div>
                        <dt>Lectura anotada a mano</dt>
                        <dd>{{ draft.manualReading ? "Si" : "No" }}</dd>
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
                      <small>Tipo de mantencion</small><strong>{{ draft.name }}</strong>
                    </div>
                    <button type="button" @click="maintenanceWizardStep = 1">Cambiar tipo</button>
                  </div>
                  <div class="maintenance-config-form">
                    <label><span>Nombre</span><input v-model="draft.name" type="text" /></label>
                    <label
                      ><span>Criterio</span
                      ><select v-model="draft.readingSourceLabel">
                        <option
                          v-for="source in maintenanceReadingSources"
                          :key="source"
                          :value="source"
                        >
                          {{ source }}
                        </option>
                      </select></label
                    >
                    <label
                      ><span>{{
                        draft.readingSourceLabel === "Fecha/Hora"
                          ? "Cada (dias)"
                          : draft.readingSourceLabel === "Horometro"
                            ? "Cada (horas)"
                            : "Cada (km)"
                      }}</span
                      ><input v-model="draft.intervalValue" type="number" min="0"
                    /></label>
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
                    <label
                      ><span>Ultima vez</span
                      ><input
                        v-model="draft.lastReading"
                        :type="draft.readingSourceLabel === 'Fecha/Hora' ? 'date' : 'number'"
                        min="0"
                    /></label>
                  </div>
                  <label class="maintenance-config-manual"
                    ><input v-model="draft.manualReading" type="checkbox" /><span
                      ><strong>Lectura anotada a mano</strong
                      ><small
                        >Para equipos que no reportan odometro. Sin esto, el plan queda sin lectura
                        hasta que el equipo informe.</small
                      ></span
                    ></label
                  >
                  <label class="maintenance-config-notes"
                    ><span>Notas</span
                    ><textarea
                      v-model="draft.notes"
                      maxlength="500"
                      placeholder="Agrega informacion adicional sobre esta mantencion..."
                    /><small>{{ String(draft.notes || "").length }} / 500</small></label
                  >
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
                <span>Nombre</span>
                <input v-model="draft.name" type="text" placeholder="Cambio de aceite" />
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
                    ? "Cada (dias)"
                    : draft.readingSourceLabel === "Horometro"
                      ? "Cada (horas)"
                      : "Cada (km)"
                }}</span>
                <input v-model="draft.intervalValue" type="number" min="0" />
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

              <label class="maintenance-modal-field">
                <span>{{
                  draft.readingSourceLabel === "Fecha/Hora"
                    ? "Ultima vez"
                    : draft.readingSourceLabel === "Horometro"
                      ? "Ultima vez a las (horas)"
                      : "Ultima vez a los (km)"
                }}</span>
                <input
                  v-model="draft.lastReading"
                  :type="draft.readingSourceLabel === 'Fecha/Hora' ? 'date' : 'number'"
                  min="0"
                />
              </label>

              <label
                class="sm:col-span-2 flex items-start gap-2 rounded-lg border border-[#d8e0eb] bg-white p-3 text-[#102372]"
              >
                <input v-model="draft.manualReading" type="checkbox" class="mt-0.5 h-4 w-4" />
                <span
                  ><strong class="block text-[11px] font-black">Lectura anotada a mano</strong
                  ><small class="mt-0.5 block text-[9px] font-medium text-slate-500"
                    >Para equipos que no reportan odometro. Sin esto, el plan queda sin lectura
                    hasta que el equipo informe.</small
                  ></span
                >
              </label>

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

            <template v-else-if="modalType === 'maintenance-detail'">
              <section class="maintenance-vehicle-strip sm:col-span-2">
                <div class="maintenance-vehicle-identity">
                  <span class="maintenance-vehicle-image"
                    ><img :src="selectedVehicleImage" alt=""
                  /></span>
                  <div class="min-w-0">
                    <h3>{{ selectedVehicle.plate }}</h3>
                    <span>{{ selectedVehicle.assetName }}</span>
                  </div>
                </div>

                <div class="maintenance-current-mileage">
                  <SvgIcon name="distancia" />
                  <div>
                    <span>Kilometraje actual</span
                    ><strong>{{ selectedVehicle.odometerLabel }}</strong>
                  </div>
                </div>

                <div class="maintenance-vehicle-strip-actions">
                  <details v-if="vehicleDetailTab === 'Historial'" ref="historyExportMenu" class="relative" @keydown.esc.prevent="historyExportMenu.open = false" @focusout="closeHistoryExportMenu">
                    <summary class="flex h-10 cursor-pointer list-none items-center gap-2 rounded border border-[#cbd8ef] bg-white px-3 text-[12px] font-bold text-[#102372] hover:bg-slate-50">
                      <SvgIcon name="download" class="h-4 w-4" />{{ historyExportBusy ? 'Generando...' : 'Exportar historial' }}<SvgIcon name="chevron-down" class="h-4 w-4" />
                    </summary>
                    <div class="absolute right-0 top-full z-30 mt-1 w-40 overflow-hidden rounded border border-[#cbd8ef] bg-white shadow-lg">
                      <button v-for="format in ['excel', 'pdf']" :key="format" type="button" class="block w-full px-4 py-3 text-left text-[12px] font-bold text-[#102372] hover:bg-slate-50 disabled:opacity-50" :disabled="historyExportBusy || !filteredVehicleHistory.length" @click="exportVehicleHistory(format)">{{ format === 'excel' ? 'Excel (.xlsx)' : 'PDF' }}</button>
                    </div>
                  </details>
                  <button
                    v-if="vehicleDetailTab === 'Planes'"
                    type="button"
                    @click="emit('open-maintenance-modal', 'maintenance', 'maintenance-detail')"
                  >
                    Agregar mantencion
                  </button>

                  <button
                    v-if="vehicleDetailTab === 'Planes'"
                    type="button"
                    class="secondary"
                    @click="
                      emit('open-maintenance-modal', 'maintenance-type', 'maintenance-detail')
                    "
                  >
                    Nuevo tipo
                  </button>
                </div>
              </section>

              <div
                class="sm:col-span-2 flex gap-4 border-b border-slate-200"
                role="tablist"
                aria-label="Detalle del vehiculo"
              >
                <button
                  v-for="tab in ['Planes', 'Historial']"
                  :key="tab"
                  type="button"
                  role="tab"
                  :aria-selected="vehicleDetailTab === tab"
                  class="border-b-2 px-3 py-2 text-[12px] font-bold"
                  :class="
                    vehicleDetailTab === tab
                      ? 'border-orange-500 text-[#102372]'
                      : 'border-transparent text-slate-500'
                  "
                  @click="vehicleDetailTab = tab"
                >
                  {{ tab }}
                </button>
              </div>

              <section v-if="vehicleDetailTab === 'Historial'" class="sm:col-span-2">
                <div class="mb-3 flex flex-wrap items-end gap-3">
                  <label class="maintenance-modal-field">
                    <span>Mantencion</span>
                    <select v-model="vehicleHistoryType">
                      <option value="all">Todas</option>
                      <option v-for="type in vehicleHistoryTypes" :key="type" :value="type">
                        {{ type }}
                      </option>
                    </select>
                  </label>
                  <label class="maintenance-modal-field"
                    ><span>Desde</span><input v-model="vehicleHistoryFrom" type="date"
                  /></label>
                  <label class="maintenance-modal-field"
                    ><span>Hasta</span><input v-model="vehicleHistoryTo" type="date"
                  /></label>
                  <div class="ml-auto flex min-h-10 flex-wrap items-center justify-end gap-3">
                    <span class="text-[11px] text-slate-500">{{ filteredVehicleHistory.length }} ejecuciones</span>
                  </div>
                </div>
                <p v-if="historyExportError" role="alert" class="mb-3 text-[12px] text-rose-600">{{ historyExportError }}</p>
                <div class="max-h-[min(330px,40dvh)] overflow-auto border border-slate-200 rounded">
                  <table class="w-full min-w-[820px] text-left text-[12px]">
                    <thead class="sticky top-0 z-10 bg-slate-50 text-slate-600">
                      <tr>
                        <th
                          v-for="column in historyColumns"
                          :key="column.key"
                          class="p-3"
                          :aria-sort="
                            historySort.key === column.key
                              ? historySort.direction === 1
                                ? 'ascending'
                                : 'descending'
                              : 'none'
                          "
                        >
                          <button
                            type="button"
                            class="flex items-center gap-1 font-bold text-left"
                            @click="sortHistory(column.key)"
                          >
                            {{ column.label }}
                            <SvgIcon
                              name="chevron-down"
                              :class="{ 'rotate-180': historySort.key === column.key && historySort.direction === 1 }"
                              class="h-3 w-3"
                            />
                          </button>
                        </th>
                        <th class="p-3">Accion</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="order in displayedVehicleHistory"
                        :key="order.id"
                        class="border-t border-slate-200"
                      >
                        <td class="p-3">{{ formatHistoryDate(order.closedAt) }}</td>
                        <td class="p-3 font-bold">{{ order.job }}</td>
                        <td class="p-3">{{ order.id }}</td>
                        <td class="p-3">{{ order.closingReading || "Sin registro" }}</td>
                        <td class="p-3">{{ order.closedBy || order.owner || "Sin registro" }}</td>
                        <td class="p-3 whitespace-nowrap">
                          {{ order.actualCost || "Sin registro" }}
                        </td>
                        <td class="p-3">
                          <button
                            type="button"
                            class="rounded border border-slate-300 px-3 py-1 font-bold text-[#102372]"
                            @click="emit('open-order-in-table', order.id)"
                          >
                            Ver OT
                          </button>
                        </td>
                      </tr>
                      <tr v-if="!filteredVehicleHistory.length">
                        <td colspan="7" class="p-6 text-center text-slate-500">
                          {{
                            vehicleHistoryOrders.length
                              ? "No hay ejecuciones para estos filtros."
                              : "Este vehiculo aun no tiene OT finalizadas."
                          }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <footer class="maintenance-history-pagination">
                  <span>Mostrando {{ filteredVehicleHistory.length ? (vehicleHistoryPage - 1) * vehicleHistoryPageSize + 1 : 0 }} a {{ Math.min(vehicleHistoryPage * vehicleHistoryPageSize, filteredVehicleHistory.length) }} de {{ filteredVehicleHistory.length }} ejecuciones</span>
                  <div>
                    <select v-model.number="vehicleHistoryPageSize" aria-label="Ejecuciones por pagina">
                      <option :value="10">10 por pagina</option>
                      <option :value="20">20 por pagina</option>
                      <option :value="50">50 por pagina</option>
                    </select>
                    <button type="button" title="Pagina anterior" :disabled="vehicleHistoryPage === 1" @click="vehicleHistoryPage--"><SvgIcon name="chevron-left" /></button>
                    <span>{{ vehicleHistoryPage }} / {{ vehicleHistoryPageCount }}</span>
                    <button type="button" title="Pagina siguiente" :disabled="vehicleHistoryPage === vehicleHistoryPageCount" @click="vehicleHistoryPage++"><SvgIcon name="chevron-right" /></button>
                  </div>
                </footer>
              </section>

              <div
                v-if="vehicleDetailTab === 'Planes' && primaryMaintenancePlan"
                class="vehicle-maintenance-grid sm:col-span-2"
              >
                <article class="vehicle-maintenance-card">
                  <header class="vehicle-maintenance-card-header">
                    <div>
                      <h4>{{ primaryMaintenancePlan.name }}</h4>
                      <p>Control de mantencion del vehiculo segun su intervalo configurado.</p>
                    </div>
                    <div class="maintenance-plan-badges">
                      <span
                        v-if="primaryMaintenancePlan.orderState === 'active'"
                        class="maintenance-plan-order-badge"
                      >
                        Con OT activa
                      </span>
                      <span :class="getMaintenancePlanPillClass(primaryMaintenancePlan.status)">
                        {{
                          primaryMaintenancePlan.readingSourceLabel ||
                          getStatusLabel(primaryMaintenancePlan.status)
                        }}
                      </span>
                    </div>
                  </header>

                  <div class="maintenance-progress">
                    <div>
                      <span>Progreso del intervalo</span
                      ><strong
                        >{{ primaryMaintenancePlan.actualLabel }} /
                        {{ primaryMaintenancePlan.intervalLabel }}</strong
                      >
                    </div>
                    <span
                      ><i
                        :style="{ width: `${getMaintenancePlanProgress(primaryMaintenancePlan)}%` }"
                      ></i
                    ></span>
                  </div>

                  <dl class="vehicle-maintenance-details">
                    <div
                      v-for="detail in getMaintenancePlanDetails(primaryMaintenancePlan)"
                      :key="detail.label"
                    >
                      <dt>{{ detail.label }}</dt>
                      <dd>{{ detail.value }}</dd>
                    </div>
                  </dl>

                  <div class="vehicle-maintenance-contact">
                    <div>
                      <span>Email contacto</span>
                      <strong>{{ primaryMaintenancePlan.email || "N/A" }}</strong>
                    </div>

                    <div>
                      <span>Origen</span>
                      <strong>{{
                        primaryMaintenancePlan.source === "base" ? "Base visual" : "Configurada"
                      }}</strong>
                    </div>
                  </div>

                  <section class="border-t border-slate-200 px-4 py-3 text-[12px]">
                    <dl class="grid gap-3 sm:grid-cols-2">
                      <div class="min-w-0">
                        <dt class="font-bold text-slate-500">Última ejecución</dt>
                        <dd class="mt-1 break-words text-[#102372]">
                          {{ planClosureLabel }}
                          <button
                            v-if="latestClosedPlanOrder"
                            type="button"
                            class="ml-1 font-bold underline"
                            @click="emit('open-order-in-table', latestClosedPlanOrder.id)"
                          >
                            {{ latestClosedPlanOrder.id }} · Finalizada
                          </button>
                        </dd>
                      </div>
                      <div class="min-w-0">
                        <dt class="font-bold text-slate-500">Próximo ciclo</dt>
                        <dd class="mt-1 break-words text-[#102372]">{{ planNextDueLabel }}</dd>
                      </div>
                    </dl>
                  </section>

                  <footer class="vehicle-maintenance-footer">
                    <span
                      class="vehicle-maintenance-status"
                      :class="getMaintenancePlanStatusClass(primaryMaintenancePlan.status)"
                    >
                      <span class="vehicle-maintenance-status-icon">
                        <SvgIcon :name="getSummaryMetricIcon(primaryMaintenancePlan.status)" />
                      </span>
                      <span
                        ><strong>{{ getStatusLabel(primaryMaintenancePlan.status) }}</strong
                        ><small>{{
                          getMaintenancePlanStatusMessage(primaryMaintenancePlan.status)
                        }}</small></span
                      >
                    </span>

                    <div class="vehicle-maintenance-actions">
                      <button
                        v-if="primaryMaintenancePlan.orderState === 'pending-renewal'"
                        type="button"
                        @click="
                          emit('renew-maintenance', selectedVehicle.id, primaryMaintenancePlan.id)
                        "
                      >
                        Renovar plan
                      </button>

                      <button
                        v-else-if="activePlanOrder"
                        type="button"
                        @click="emit('open-order-in-table', activePlanOrder.id)"
                      >
                        {{
                          ["in-progress", "waiting"].includes(activePlanOrder.status)
                            ? "Continuar OT"
                            : "Ver OT"
                        }}
                      </button>

                      <button
                        v-else-if="primaryMaintenancePlan.status === 'unconfigured'"
                        type="button"
                        @click="emit('open-edit-maintenance-plan', primaryMaintenancePlan)"
                      >
                        Configurar plan
                      </button>

                      <button
                        v-else-if="['due', 'overdue'].includes(primaryMaintenancePlan.status)"
                        type="button"
                        @click="
                          emit('create-work-order-from-maintenance-plan', primaryMaintenancePlan)
                        "
                      >
                        Crear OT
                      </button>
                      <span v-else class="text-[11px] font-bold text-slate-500">Sin acción</span>

                      <button
                        type="button"
                        class="secondary"
                        @click="emit('open-edit-maintenance-plan', primaryMaintenancePlan)"
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        class="danger"
                        :disabled="isBaseMaintenancePlan(primaryMaintenancePlan)"
                        @click="emit('open-delete-maintenance-plan', primaryMaintenancePlan)"
                      >
                        Eliminar
                      </button>
                    </div>
                  </footer>
                </article>

                <aside class="vehicle-maintenance-add-card">
                  <header>
                    <h4>Otras mantenciones</h4>
                    <p>Mantenciones adicionales configuradas para este vehiculo.</p>
                  </header>
                  <div class="additional-maintenance-filters">
                    <label>
                      <SvgIcon name="search" />
                      <input
                        v-model="maintenancePlanSearch"
                        type="search"
                        placeholder="Buscar mantencion..."
                      />
                    </label>
                    <div>
                      <button
                        v-for="filter in maintenancePlanStatusFilters"
                        :key="filter.value"
                        type="button"
                        :class="{ active: maintenancePlanStatus === filter.value }"
                        @click="maintenancePlanStatus = filter.value"
                      >
                        {{ filter.label }}
                      </button>
                    </div>
                  </div>
                  <div
                    v-if="filteredAdditionalMaintenancePlans.length"
                    class="additional-maintenance-list"
                  >
                    <button
                      v-for="plan in filteredAdditionalMaintenancePlans"
                      :key="plan.id"
                      type="button"
                      @click="selectedMaintenancePlanId = plan.id"
                    >
                      <SvgIcon name="llave" /><span
                        ><strong>{{ plan.name }}</strong
                        ><small>{{ getStatusLabel(plan.status) }}</small></span
                      >
                    </button>
                  </div>
                  <div v-else class="additional-maintenance-empty">
                    <span><SvgIcon name="reporte" /></span>
                    <strong>{{ additionalMaintenanceEmptyTitle }}</strong>
                    <p>
                      {{ additionalMaintenanceEmptyDescription }}
                    </p>
                  </div>
                  <button
                    class="add-maintenance-button"
                    type="button"
                    @click="emit('open-maintenance-modal', 'maintenance', 'maintenance-detail')"
                  >
                    <SvgIcon name="plus" /> Agregar nuevo plan
                  </button>
                  <button
                    class="view-types-button"
                    type="button"
                    @click="
                      emit('open-maintenance-modal', 'maintenance-type', 'maintenance-detail')
                    "
                  >
                    Ver tipos de mantencion disponibles
                  </button>
                </aside>
              </div>
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
              <section class="work-order-create-form sm:col-span-2">
                <div class="work-order-create-main">
                  <section class="work-order-create-section">
                    <header>
                      <h3>Informacion principal</h3>
                      <small>Define el activo y el tipo de mantencion.</small>
                    </header>
                    <div class="work-order-create-grid">
                      <label
                        ><span>Activo <b>*</b></span
                        ><select
                          v-model="draft.vehicleId"
                          @change="emit('sync-order-vehicle-draft')"
                        >
                          <option
                            v-for="maintenanceVehicle in maintenanceItems"
                            :key="maintenanceVehicle.id"
                            :value="maintenanceVehicle.id"
                          >
                            {{ maintenanceVehicle.plate }} - {{ maintenanceVehicle.assetName }}
                          </option>
                        </select></label
                      >
                      <label
                        ><span>Tipo de mantencion <b>*</b></span
                        ><select
                          v-model="draft.maintenancePlanId"
                          @change="emit('sync-order-maintenance-plan-draft')"
                        >
                          <option v-if="!modalVehicleMaintenancePlans.length" value="" disabled>
                            Este vehiculo no tiene mantenciones configuradas
                          </option>
                          <option
                            v-for="plan in modalVehicleMaintenancePlans"
                            :key="plan.id"
                            :value="plan.id"
                          >
                            {{ plan.name }} - {{ plan.intervalLabel }}
                          </option>
                        </select></label
                      >
                      <label
                        ><span>Titulo <b>*</b></span
                        ><input v-model="draft.job" type="text"
                      /></label>
                      <fieldset class="work-order-priority">
                        <legend>Prioridad <b>*</b></legend>
                        <div>
                          <button
                            v-for="priority in orderPriorityOptions"
                            :key="priority"
                            type="button"
                            :class="{ active: draft.priority === priority }"
                            @click="draft.priority = priority"
                          >
                            {{ priority }}
                          </button>
                        </div>
                      </fieldset>
                    </div>
                  </section>
                  <section class="work-order-create-section">
                    <header>
                      <h3>Programacion</h3>
                      <small>Define cuando se espera iniciar y la fecha maxima de ejecucion.</small>
                    </header>
                    <div class="work-order-create-grid">
                      <label
                        ><span>Fecha planificada <b>*</b></span
                        ><input v-model="draft.plannedStartDate" type="date"
                      /></label>
                      <label
                        ><span>Fecha limite de ejecucion <small>(opcional)</small></span
                        ><input v-model="draft.scheduledDate" type="date"
                      /></label>
                    </div>
                  </section>
                  <section class="work-order-create-section">
                    <header>
                      <h3>Responsables</h3>
                      <small>Indica quien sera responsable de la orden.</small>
                    </header>
                    <div class="work-order-create-grid">
                      <label
                        ><span>Asignada a <b>*</b></span
                        ><input v-model="draft.owner" type="text"
                      /></label>
                      <label
                        ><span>Taller <b>*</b></span
                        ><input v-model="draft.workshop" type="text"
                      /></label>
                    </div>
                  </section>
                  <section class="work-order-create-section">
                    <header>
                      <h3>Descripcion</h3>
                      <small>Agrega una descripcion detallada de la orden.</small>
                    </header>
                    <label class="work-order-description">
                      <textarea v-model="draft.description" maxlength="500" rows="4"></textarea
                      ><small>{{ String(draft.description || "").length }}/500</small></label
                    >
                  </section>
                </div>
                <aside class="work-order-create-aside">
                  <section class="work-order-create-section work-order-cost-estimate">
                    <header>
                      <h3>Costos estimados <small>(opcional)</small></h3>
                      <small>Define los costos asociados a la orden.</small>
                    </header>
                    <div class="work-order-cost-inputs">
                      <label
                        ><span>Mano de obra</span>
                        <div>
                          <b>$</b
                          ><input
                            v-model="draft.estimatedLabor"
                            type="text"
                            inputmode="numeric"
                          /></div
                      ></label>
                      <label
                        ><span>Repuestos</span>
                        <div>
                          <b>$</b
                          ><input
                            v-model="draft.estimatedParts"
                            type="text"
                            inputmode="numeric"
                          /></div
                      ></label>
                      <label
                        ><span>Otros costos</span>
                        <div>
                          <b>$</b
                          ><input
                            v-model="draft.estimatedOther"
                            type="text"
                            inputmode="numeric"
                          /></div
                      ></label>
                    </div>
                    <div class="work-order-estimated-total">
                      <strong>Total estimado</strong><b>{{ formattedCreateOrderTotal }}</b>
                    </div>
                  </section>
                  <section class="work-order-create-section work-order-additional">
                    <header>
                      <h3>Observaciones <small>(opcional)</small></h3>
                      <small>Agrega informacion adicional sobre la orden.</small>
                    </header>
                    <label class="work-order-description">
                      <textarea
                        v-model="draft.observations"
                        maxlength="500"
                        rows="4"
                        placeholder="Observaciones adicionales sobre la orden de trabajo..."
                      ></textarea
                      ><small>{{ String(draft.observations || "").length }}/500</small></label
                    >
                  </section>
                  <section class="automatic-data-summary">
                    <header>
                      <SvgIcon name="check" />
                      <div>
                        <h3>Generado automaticamente</h3>
                        <small>Se registrara al crear la orden.</small>
                      </div>
                    </header>
                    <dl>
                      <div>
                        <dt>OT</dt>
                        <dd>{{ draft.orderId || "Al confirmar" }}</dd>
                      </div>
                      <div>
                        <dt>Estado inicial</dt>
                        <dd>Programada</dd>
                      </div>
                      <div>
                        <dt>Activo y plan</dt>
                        <dd>{{ draftVehicleLabel }} · {{ draftPlanLabel }}</dd>
                      </div>
                      <div>
                        <dt>Lectura de apertura</dt>
                        <dd>{{ draftOpeningReading }}</dd>
                      </div>
                    </dl>
                  </section>
                </aside>
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
              <label class="maintenance-modal-field">
                <span>Fecha límite de ejecución</span>
                <input v-model="draft.scheduledDate" type="text" />
              </label>
              <label class="maintenance-modal-field">
                <span>Hora</span>
                <input v-model="draft.scheduledTime" type="text" />
              </label>
              <label class="maintenance-modal-field">
                <span>Taller</span>
                <input v-model="draft.workshop" type="text" />
              </label>
              <label class="maintenance-modal-field">
                <span>Responsable</span>
                <input v-model="draft.owner" type="text" />
              </label>
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
                <select v-model="draft.status">
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
                <div class="order-detail-columns">
                  <div class="order-detail-left">
                    <section class="order-detail-costs">
                      <h3>Informacion general</h3>
                      <dl>
                        <dt>Responsable</dt>
                        <dd>{{ draft.owner }}</dd>
                        <dt>Taller</dt>
                        <dd>{{ draft.workshop }}</dd>
                        <dt>Prioridad</dt>
                        <dd>{{ draft.priority }}</dd>
                        <dt>Fecha límite de ejecución</dt>
                        <dd>{{ formatDetailDate(draft.scheduledDate) }}</dd>
                        <dt v-if="draft.plannedStartDate">Fecha planificada</dt>
                        <dd v-if="draft.plannedStartDate">
                          {{ formatDetailDate(draft.plannedStartDate) }}
                        </dd>
                        <dt>Lectura inicial</dt>
                        <dd>{{ draft.openingReading || "Sin registro" }}</dd>
                        <dt v-if="draft.status === 'finished'">Lectura final</dt>
                        <dd v-if="draft.status === 'finished'">
                          {{ draft.closingReading || "Sin registro" }}
                        </dd>
                        <dt>Descripcion</dt>
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
                    <section>
                      <h3>Costos</h3>
                      <dl>
                        <dt>Mano de obra</dt>
                        <dd>{{ draft.laborCost || "$ 0" }}</dd>
                        <dt>Repuestos</dt>
                        <dd>{{ draft.partsCost || "$ 0" }}</dd>
                        <dt>Otros costos</dt>
                        <dd>{{ draft.otherCost || "$ 0" }}</dd>
                        <dt>Total estimado</dt>
                        <dd>{{ draft.actualCost || draft.estimatedCost || "$ 0" }}</dd>
                      </dl>
                    </section>
                    <section class="order-detail-result">
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
                              draft.cancelledAt || draft.closedAt || draft.scheduledDate,
                            )
                          }}
                        </dd>
                        <dt>Observacion</dt>
                        <dd>
                          {{
                            draft.observations || "Cierre completado sin observaciones adicionales."
                          }}
                        </dd>
                      </dl>
                    </section>
                  </div>
                  <div class="order-detail-right">
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
                        </li>
                      </ol>
                    </section>
                    <section class="order-detail-comments">
                      <h3>Opiniones / Comentarios</h3>
                      <div class="order-detail-comment-head">
                        <span>Fecha y hora</span><span>Usuario</span><span>Comentario</span>
                      </div>
                      <div
                        v-for="comment in orderCommentEvents"
                        :key="comment.key"
                        class="order-detail-comment-row"
                      >
                        <span>{{ formatDetailDate(comment.at) }}</span
                        ><strong>{{ comment.user }}</strong>
                        <p>{{ comment.detail }}</p>
                      </div>
                    </section>
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
            class="h-9 rounded-lg border border-[#dfe5ed] px-4 text-[12px] font-black text-slate-500 transition hover:border-slate-400"
            type="button"
            @click="
              modalType === 'maintenance' && maintenanceWizardStep > 1
                ? maintenanceWizardStep--
                : emit('close')
            "
          >
            {{
              modalType === "order-detail" || modalType === "maintenance-detail"
                ? "Cerrar"
                : modalType === "maintenance" && maintenanceWizardStep > 1
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
          <button
            v-if="modalType !== 'order-detail' && modalType !== 'maintenance-detail'"
            class="h-9 rounded-lg bg-[#ff6600] px-4 text-[12px] font-black text-white transition hover:bg-[#e65c00] disabled:cursor-not-allowed disabled:bg-orange-300"
            type="button"
            :disabled="
              isUploadingEvidence ||
              (modalType === 'create-order' &&
                (!draft.vehicleId ||
                  !draft.maintenancePlanId ||
                  !String(draft.job || '').trim() ||
                  !draft.plannedStartDate ||
                  !String(draft.owner || '').trim() ||
                  !String(draft.workshop || '').trim())) ||
              (modalType === 'assign-order' &&
                draft.status === 'waiting' &&
                !String(draft.waitingReason || '').trim()) ||
              (modalType === 'close-order' &&
                (!String(draft.workPerformed || '').trim() ||
                  !String(draft.closedBy || '').trim() ||
                  !String(draft.closingReading || '').trim())) ||
              (modalType === 'maintenance' &&
                ((maintenanceWizardStep === 1 &&
                  isCreateMaintenanceTypeDisabled(draft.type || draft.name)) ||
                  (maintenanceWizardStep > 1 &&
                    (!draft.vehicleId ||
                      (!draft.editMode &&
                        isMaintenanceTemplateUsed(draft.vehicleId, draft.type || draft.name))))))
            "
            @click="modalType === 'maintenance' ? handleMaintenanceWizardPrimary() : emit('submit')"
          >
            {{
              modalType === "maintenance"
                ? maintenanceWizardStep < 3
                  ? "Siguiente"
                  : draft.editMode
                    ? "Guardar cambios"
                    : "Crear plan"
                : modalPrimaryAction
            }}
            <SvgIcon
              v-if="modalType === 'maintenance' && maintenanceWizardStep < 3"
              name="arrow-right"
              class="ml-2 inline-block h-4 w-4"
            />
          </button>
        </footer>
      </section>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue"

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

const formatDetailDate = (value) => {
  if (!value) return "Sin registro"
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("es-CL")
}

const props = defineProps({
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
const draftVehicle = computed(
  () =>
    props.maintenanceItems.find(
      (vehicle) => String(vehicle.id) === String(draft.value.vehicleId),
    ) || props.selectedVehicle,
)
const draftPlan = computed(() =>
  props.modalVehicleMaintenancePlans.find(
    (plan) => String(plan.id) === String(draft.value.maintenancePlanId),
  ),
)
const draftVehicleLabel = computed(() => draftVehicle.value?.plate || "Activo seleccionado")
const draftPlanLabel = computed(
  () => draftPlan.value?.name || draft.value.job || "Plan seleccionado",
)
const draftOpeningReading = computed(() => {
  if (draft.value.readingSourceLabel === "Horometro") {
    return draftVehicle.value?.hourMeterLabel || "Sin lectura"
  }
  if (draft.value.readingSourceLabel === "Fecha/Hora") return "Fecha del sistema"
  return draftVehicle.value?.odometerLabel || "Sin lectura"
})
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
const orderTraceEvents = computed(() => {
  const events = (draft.value.audit || []).map((event, index) => ({
    action: event.action || "Actualizacion",
    at: event.at,
    className: getTraceEventClass(event.action),
    detail: event.detail || getTraceEventDetail(event.action, event.user),
    key: `${event.action}-${event.at || index}-${index}`,
    user: event.user || draft.value.owner || "Usuario actual",
  }))
  const hasAction = (term) =>
    events.some((event) => event.action.toLowerCase().includes(term.toLowerCase()))
  const insertBeforeTerminal = (event) => {
    const terminalIndex = events.findIndex((item) =>
      ["cerrada", "cancelada"].some((term) => item.action.toLowerCase().includes(term)),
    )
    events.splice(terminalIndex === -1 ? events.length : terminalIndex, 0, event)
  }

  if (!hasAction("creada")) {
    events.unshift({
      action: "OT creada",
      at: draft.value.createdAt || draft.value.scheduledDate,
      className: "",
      detail: `Orden creada para ${draft.value.job}.`,
      key: "created-fallback",
    })
  }
  if (!hasAction("programada") && !hasAction("reprogramada")) {
    events.splice(1, 0, {
      action: "Programada",
      at: draft.value.scheduledDate,
      className: "",
      detail: "Fecha de ejecucion programada.",
      key: "scheduled-fallback",
    })
  }
  if (["waiting", "in-progress", "finished"].includes(draft.value.status) && !hasAction("espera")) {
    insertBeforeTerminal({
      action: "En espera",
      at: "",
      className: "is-missing",
      detail: "Este paso no fue registrado en la orden.",
      key: "waiting-missing",
    })
  }
  if (["in-progress", "finished"].includes(draft.value.status) && !hasAction("iniciado")) {
    insertBeforeTerminal({
      action: "En ejecucion",
      at: draft.value.startedAt || "",
      className: draft.value.startedAt ? "is-progress" : "is-missing",
      detail: draft.value.startedAt
        ? "Trabajo iniciado."
        : "Este paso no fue registrado en la orden.",
      key: "progress-missing",
    })
  }
  if (draft.value.status === "cancelled" && !hasAction("cancelada")) {
    events.push({
      action: "Cancelada",
      at: draft.value.cancelledAt || draft.value.scheduledDate,
      className: "is-cancelled",
      detail: draft.value.cancellationReason || draft.value.description || "Sin razon registrada",
      key: "cancelled-fallback",
    })
  }
  if (draft.value.status === "finished" && !hasAction("cerrada")) {
    events.push({
      action: "Cerrada",
      at: draft.value.closedAt || draft.value.scheduledDate,
      className: "is-closed",
      detail: draft.value.workPerformed || draft.value.description || "Orden finalizada",
      key: "closed-fallback",
      user: draft.value.closedBy || "Usuario actual",
    })
  }
  return events
})
const orderCommentEvents = computed(() =>
  orderTraceEvents.value.filter(
    (event) =>
      event.className !== "is-missing" &&
      ["iniciado", "espera", "cerrada", "cancelada"].some((term) =>
        event.action.toLowerCase().includes(term),
      ),
  ),
)

function getTraceEventClass(action = "") {
  const normalizedAction = action.toLowerCase()
  if (normalizedAction.includes("cancelada")) return "is-cancelled"
  if (normalizedAction.includes("cerrada")) return "is-closed"
  if (normalizedAction.includes("iniciado") || normalizedAction.includes("ejecucion")) {
    return "is-progress"
  }
  if (normalizedAction.includes("espera")) return "is-waiting"
  return ""
}

function getTraceEventDetail(action = "", user = "") {
  const normalizedAction = action.toLowerCase()
  if (normalizedAction.includes("creada")) return `Orden creada para ${draft.value.job}.`
  if (normalizedAction.includes("programada")) return "Fecha de ejecucion programada."
  if (normalizedAction.includes("espera"))
    return `Orden puesta en espera${user ? ` por ${user}` : ""}.`
  if (normalizedAction.includes("iniciado")) return `Trabajo iniciado${user ? ` por ${user}` : ""}.`
  return user ? `Actualizacion realizada por ${user}.` : "Estado de la orden actualizado."
}
const typeCatalogMode = ref("empty")
const selectedMaintenanceType = ref("")
const selectedMaintenancePlanId = ref("")
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
const maintenanceIntervalLabel = computed(() => `Cada (${maintenanceValueUnit.value})`)
const maintenanceAlertLabel = computed(() => `Avisar con (${maintenanceValueUnit.value})`)
const maintenanceLastReadingDisplay = computed(() => {
  const value = String(draft.value.lastReading || "-")
  if (draft.value.readingSourceLabel !== "Fecha/Hora" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value
  }
  const [year, month, day] = value.split("-")
  return `${day} - ${month} - ${year}`
})
const isCreateMaintenanceTypeDisabled = (type) => {
  const vehicleId = draft.value.vehicleId || props.selectedVehicle?.id
  if (!vehicleId || !type) return false

  const normalize = (value) =>
    String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase()
  if (draft.value.editMode && normalize(type) === normalize(draft.value.originalType)) return false
  const plans = draft.value.vehicleId
    ? props.modalVehicleMaintenancePlans
    : props.selectedVehicleMaintenancePlans
  const exists = plans.some(
    (plan) => normalize(plan.name) === normalize(type) || normalize(plan.type) === normalize(type),
  )

  return exists || props.isMaintenanceTemplateUsed(vehicleId, type)
}
const isBlueHeader = computed(() =>
  ["maintenance", "close-order"].includes(props.modalType),
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
    if (modalType === "maintenance-detail") {
      vehicleDetailTab.value = "Planes"
      vehicleHistoryType.value = "all"
      vehicleHistoryFrom.value = ""
      vehicleHistoryTo.value = ""
      selectedMaintenancePlanId.value = props.selectedVehicleMaintenancePlans[0]?.id || ""
      maintenancePlanSearch.value = ""
      maintenancePlanStatus.value = "all"
    }
  },
)
const selectMaintenanceType = (type) => {
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
  if (maintenanceWizardStep.value < 3) {
    maintenanceWizardStep.value += 1
    return
  }
  emit("submit")
}
</script>
