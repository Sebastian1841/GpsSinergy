<template>
  <div
    v-if="modalType"
    class="fixed inset-0 z-[950] flex items-end justify-center bg-slate-950/55 p-2 sm:items-center sm:p-4"
    role="dialog"
    aria-modal="true"
    @click.self="emit('close')"
    @keydown.esc="emit('close')"
  >
    <section
      class="flex max-h-[calc(100vh-16px)] w-full max-w-[760px] flex-col overflow-hidden rounded-t-2xl border border-[#dfe5ed] bg-white shadow-[0_26px_90px_rgba(15,23,42,0.35)] sm:max-h-[calc(100vh-32px)] sm:rounded-2xl"
    >
      <header class="shrink-0 border-b border-[#edf1f5] px-5 py-4">
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <p class="text-[10px] font-black uppercase tracking-[0.16em] text-[#ff6600]">
              {{ modalKicker }}
            </p>

            <h2 class="mt-1 truncate text-[20px] font-black text-[#102372]">
              {{ modalTitle }}
            </h2>

            <p class="mt-1 text-[12px] font-bold leading-5 text-slate-500">
              {{ modalDescription }}
            </p>
          </div>

          <button
            class="maintenance-modal-close"
            type="button"
            aria-label="Cerrar modal"
            @click="emit('close')"
          >
            x
          </button>
        </div>
      </header>

      <div class="min-h-0 overflow-auto bg-[#f6f8fb] p-4">
        <div
          v-if="modalActionMessage"
          class="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] font-black text-emerald-700"
        >
          {{ modalActionMessage }}
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <template v-if="modalType === 'maintenance' || modalType === 'edit-maintenance'">
            <section class="maintenance-type-panel sm:col-span-2">
              <div class="maintenance-type-header">
                <div>
                  <p>Tipo de mantencion</p>
                  <h3>Selecciona uno de los tipos creados</h3>
                </div>
              </div>

              <div class="maintenance-type-builder">
                <label class="maintenance-modal-field">
                  <span>Tipo / nombre de mantencion</span>
                  <select v-model="draft.type" @change="emit('sync-maintenance-type-draft')">
                    <option v-for="type in maintenanceTypes" :key="type" :value="type">
                      {{ type }}
                    </option>
                  </select>
                </label>
              </div>
            </section>

            <label class="maintenance-modal-field sm:col-span-2">
              <span>Vehiculo</span>
              <select v-model="draft.vehicleId" @change="emit('sync-maintenance-vehicle-draft')">
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
              v-if="
                modalType === 'maintenance' &&
                isMaintenanceTemplateUsed(draft.vehicleId, draft.name)
              "
              class="sm:col-span-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-black text-amber-700"
            >
              Este vehiculo ya tiene una mantencion de este tipo. Selecciona otro tipo si necesitas
              agregar una mantencion distinta.
            </div>

            <label class="maintenance-modal-field">
              <span>Criterio de lectura</span>
              <select v-model="draft.readingSourceLabel" disabled>
                <option v-for="source in maintenanceReadingSources" :key="source" :value="source">
                  {{ source }}
                </option>
              </select>
            </label>

            <label class="maintenance-modal-field">
              <span>{{
                draft.readingSourceLabel === "Fecha/Hora" ? "Fecha ultima" : "Ultimo registro"
              }}</span>
              <input
                v-model="draft.lastReading"
                :type="draft.readingSourceLabel === 'Fecha/Hora' ? 'date' : 'text'"
              />
            </label>

            <label class="maintenance-modal-field">
              <span>Intervalo</span>
              <input v-model="draft.intervalValue" type="text" />
            </label>

            <label class="maintenance-modal-field">
              <span>Alerta previa</span>
              <input v-model="draft.alertValue" type="text" />
            </label>

            <label class="maintenance-modal-field">
              <span>Estado calculado</span>
              <select v-model="draft.status">
                <option v-for="filter in statusFilters" :key="filter.value" :value="filter.value">
                  {{ filter.label }}
                </option>
              </select>
            </label>

            <label class="maintenance-modal-field">
              <span>Email de alerta</span>
              <input v-model="draft.email" type="email" />
            </label>

            <label class="maintenance-modal-field">
              <span>WhatsApp</span>
              <input v-model="draft.whatsapp" type="tel" />
            </label>
          </template>

          <template v-else-if="modalType === 'maintenance-type'">
            <section class="maintenance-type-create sm:col-span-2">
              <label class="maintenance-modal-field">
                <span>Nombre del tipo</span>
                <input
                  v-model="draft.name"
                  type="text"
                  placeholder="Ej: Lubricacion, Neumaticos, Bateria"
                  @keydown.enter.prevent="emit('submit')"
                />
              </label>

              <div>
                <p class="maintenance-type-create-label">Criterio de control</p>

                <div class="maintenance-type-criteria">
                  <button
                    v-for="criterion in maintenanceTypeCriterionOptions"
                    :key="criterion.value"
                    type="button"
                    :class="{ active: draft.readingSourceLabel === criterion.value }"
                    @click="draft.readingSourceLabel = criterion.value"
                  >
                    <span>{{ criterion.label }}</span>
                    <small>{{ criterion.description }}</small>
                  </button>
                </div>
              </div>
            </section>
          </template>

          <template v-else-if="modalType === 'maintenance-detail'">
            <section class="maintenance-vehicle-strip sm:col-span-2">
              <div class="min-w-0">
                <p>Vehiculo seleccionado</p>
                <h3>{{ selectedVehicle.plate }}</h3>
                <span>{{ selectedVehicle.assetName }} / {{ selectedVehicle.odometerLabel }}</span>
              </div>

              <div class="maintenance-vehicle-strip-actions">
                <button type="button" @click="emit('open-maintenance-modal', 'maintenance')">
                  Agregar mantencion
                </button>

                <button
                  type="button"
                  class="secondary"
                  @click="emit('open-maintenance-modal', 'maintenance-type', 'maintenance-detail')"
                >
                  Nuevo tipo
                </button>
              </div>
            </section>

            <div class="vehicle-maintenance-grid sm:col-span-2">
              <article
                v-for="plan in selectedVehicleMaintenancePlans"
                :key="plan.id"
                class="vehicle-maintenance-card"
              >
                <header class="vehicle-maintenance-card-header">
                  <h4>{{ plan.name }}</h4>
                  <span :class="getMaintenancePlanPillClass(plan.status)">
                    {{ plan.readingSourceLabel || getStatusLabel(plan.status) }}
                  </span>
                </header>

                <dl class="vehicle-maintenance-details">
                  <div v-for="detail in getMaintenancePlanDetails(plan)" :key="detail.label">
                    <dt>{{ detail.label }}</dt>
                    <dd>{{ detail.value }}</dd>
                  </div>
                </dl>

                <div class="vehicle-maintenance-contact">
                  <div>
                    <span>Email contacto</span>
                    <strong>{{ plan.email || "N/A" }}</strong>
                  </div>

                  <div>
                    <span>Origen</span>
                    <strong>{{ plan.source === "base" ? "Base visual" : "Configurada" }}</strong>
                  </div>
                </div>

                <footer class="vehicle-maintenance-footer">
                  <span
                    class="vehicle-maintenance-status"
                    :class="getMaintenancePlanStatusClass(plan.status)"
                  >
                    <span class="vehicle-maintenance-status-icon">
                      <SvgIcon :name="getSummaryMetricIcon(plan.status)" />
                    </span>
                    {{ getMaintenancePlanStatusMessage(plan.status) }}
                  </span>

                  <div class="vehicle-maintenance-actions">
                    <button
                      type="button"
                      @click="emit('create-work-order-from-maintenance-plan', plan)"
                    >
                      Crear OT
                    </button>

                    <button
                      type="button"
                      class="secondary"
                      @click="emit('open-edit-maintenance-plan', plan)"
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      class="danger"
                      :disabled="isBaseMaintenancePlan(plan)"
                      @click="emit('open-delete-maintenance-plan', plan)"
                    >
                      Eliminar
                    </button>
                  </div>
                </footer>
              </article>

              <button
                class="vehicle-maintenance-add-card"
                type="button"
                @click="emit('open-maintenance-modal', 'maintenance')"
              >
                <span>+</span>
                <strong>Nueva mantencion</strong>
                <small>Agregar otro plan al vehiculo</small>
              </button>
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

          <template v-else-if="modalType === 'order' || modalType === 'edit-order'">
            <label class="maintenance-modal-field sm:col-span-2">
              <span>Vehiculo</span>
              <select v-model="draft.vehicleId" @change="emit('sync-order-vehicle-draft')">
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
              <span>Mantencion origen</span>
              <select
                v-model="draft.maintenancePlanId"
                @change="emit('sync-order-maintenance-plan-draft')"
              >
                <option value="">Sin mantencion asociada</option>
                <option
                  v-for="plan in modalVehicleMaintenancePlans"
                  :key="plan.id"
                  :value="plan.id"
                >
                  {{ plan.name }} - {{ getStatusLabel(plan.status) }} - {{ plan.summaryLabel }}
                </option>
              </select>
            </label>

            <label class="maintenance-modal-field">
              <span>Trabajo</span>
              <input v-model="draft.job" type="text" />
            </label>

            <label class="maintenance-modal-field">
              <span>Tipo</span>
              <select v-model="draft.type">
                <option v-for="type in maintenanceTypes" :key="type" :value="type">
                  {{ type }}
                </option>
              </select>
            </label>

            <label class="maintenance-modal-field">
              <span>Taller</span>
              <input v-model="draft.workshop" type="text" />
            </label>

            <label class="maintenance-modal-field">
              <span>Responsable</span>
              <input v-model="draft.owner" type="text" />
            </label>

            <label class="maintenance-modal-field">
              <span>Fecha</span>
              <input v-model="draft.scheduledDate" type="text" />
            </label>

            <label class="maintenance-modal-field">
              <span>Hora</span>
              <input v-model="draft.scheduledTime" type="text" />
            </label>

            <label class="maintenance-modal-field">
              <span>Prioridad</span>
              <select v-model="draft.priority">
                <option v-for="priority in orderPriorityOptions" :key="priority" :value="priority">
                  {{ priority }}
                </option>
              </select>
            </label>

            <label class="maintenance-modal-field">
              <span>Costo estimado</span>
              <input v-model="draft.estimatedCost" type="text" />
            </label>

            <label class="maintenance-modal-field sm:col-span-2">
              <span>Descripcion</span>
              <textarea v-model="draft.description" rows="3"></textarea>
            </label>
          </template>

          <template v-else-if="modalType === 'reprogram-order'">
            <label class="maintenance-modal-field">
              <span>Fecha programada</span>
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
                <option v-for="priority in orderPriorityOptions" :key="priority" :value="priority">
                  {{ priority }}
                </option>
              </select>
            </label>
            <label class="maintenance-modal-field">
              <span>Estado</span>
              <select v-model="draft.status">
                <option
                  v-for="filter in orderStatusFilters"
                  :key="filter.value"
                  :value="filter.value"
                >
                  {{ filter.label }}
                </option>
              </select>
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
            <label class="maintenance-modal-field sm:col-span-2">
              <span>Trabajo realizado</span>
              <textarea v-model="draft.workPerformed" rows="3"></textarea>
            </label>
            <label class="maintenance-modal-field">
              <span>Costo total</span>
              <input v-model="draft.totalCost" type="text" />
            </label>
            <label class="maintenance-modal-field">
              <span>Factura</span>
              <input v-model="draft.invoice" type="text" />
            </label>
            <label class="maintenance-modal-field">
              <span>Repuestos</span>
              <input v-model="draft.parts" type="text" />
            </label>
            <label class="maintenance-modal-field">
              <span>Proximo ciclo</span>
              <input v-model="draft.nextCycle" type="text" />
            </label>
            <label class="maintenance-modal-field sm:col-span-2">
              <span>Observaciones</span>
              <textarea v-model="draft.observations" rows="3"></textarea>
            </label>
          </template>

          <template v-else-if="modalType === 'cost'">
            <label class="maintenance-modal-field">
              <span>Tipo de costo</span>
              <input v-model="draft.type" type="text" />
            </label>
            <label class="maintenance-modal-field">
              <span>Fecha</span>
              <input v-model="draft.date" type="text" />
            </label>
            <label class="maintenance-modal-field">
              <span>Taller</span>
              <input v-model="draft.workshop" type="text" />
            </label>
            <label class="maintenance-modal-field">
              <span>Factura</span>
              <input v-model="draft.invoice" type="text" />
            </label>
            <label class="maintenance-modal-field">
              <span>Monto total</span>
              <input v-model="draft.total" type="text" />
            </label>
            <label class="maintenance-modal-field">
              <span>Repuestos</span>
              <input v-model="draft.parts" type="text" />
            </label>
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
        class="flex shrink-0 flex-col gap-2 border-t border-[#edf1f5] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-end"
      >
        <button
          class="h-9 rounded-lg border border-[#dfe5ed] px-4 text-[12px] font-black text-slate-500 transition hover:border-slate-400"
          type="button"
          @click="emit('close')"
        >
          Cancelar
        </button>
        <button
          class="h-9 rounded-lg bg-[#ff6600] px-4 text-[12px] font-black text-white transition hover:bg-[#e65c00]"
          type="button"
          @click="emit('submit')"
        >
          {{ modalPrimaryAction }}
        </button>
      </footer>
    </section>
  </div>
</template>

<script setup>
import { computed } from "vue"

import SvgIcon from "../icons/SvgIcon.vue"

const props = defineProps({
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
  "open-edit-maintenance-plan",
  "open-maintenance-modal",
  "submit",
  "sync-maintenance-type-draft",
  "sync-maintenance-vehicle-draft",
  "sync-order-maintenance-plan-draft",
  "sync-order-vehicle-draft",
])

const draft = computed(() => props.modalDraft || {})
</script>
