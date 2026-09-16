<template>
  <section class="alarm-modal-card alarm-modal-card-wide">
    <div class="alarm-modal-card-title">
      <span class="alarm-step-number">3</span>
      <div class="min-w-0">
        <h3>Configuracion de disparo</h3>
      </div>
    </div>

    <div class="alarm-trigger-grid">
      <section class="alarm-trigger-card">
        <div class="alarm-trigger-title">
          <span class="alarm-trigger-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path d="M4 15a8 8 0 0 1 16 0" />
              <path d="m12 15 4-5" />
              <path d="M8 15h8" />
            </svg>
          </span>
          <div class="min-w-0">
            <h4>Condiciones</h4>
            <p>Define cuando se activara la alerta.</p>
          </div>
        </div>

        <div class="min-w-0">
          <div v-if="currentAlertType === 'speeding'" class="mt-3 grid grid-cols-2 gap-2">
            <label class="alarm-form-field">
              <span>Velocidad superior a</span>
              <input
                v-model="draftModel.condition.value"
                type="number"
                min="1"
                :disabled="!canManage"
              />
            </label>

            <label class="alarm-form-field">
              <span>Durante</span>
              <div class="alarm-composite-input">
                <input
                  v-model="draftModel.condition.durationSeconds"
                  type="number"
                  min="0"
                  :disabled="!canManage"
                />
                <span>seg.</span>
              </div>
            </label>
          </div>

          <div v-else-if="currentAlertType === 'battery'" class="mt-3 grid grid-cols-2 gap-2">
            <label class="alarm-form-field">
              <span>Medicion</span>
              <select
                v-model="draftModel.condition.field"
                :disabled="!canManage"
                @change="$emit('apply-battery-condition-preset')"
              >
                <option
                  v-for="option in batteryConditionOptions"
                  :key="option.id"
                  :value="option.id"
                >
                  {{ option.label }}
                </option>
              </select>
            </label>

            <label class="alarm-form-field">
              <span>Menor a</span>
              <div class="alarm-composite-input">
                <input
                  v-model="draftModel.condition.value"
                  type="number"
                  step="0.1"
                  min="0"
                  :disabled="!canManage"
                />
                <span>{{ draftModel.condition.unit }}</span>
              </div>
            </label>
          </div>

          <div v-else-if="currentAlertType === 'no_signal'" class="mt-3">
            <label class="alarm-form-field">
              <span>Sin reporte por mas de</span>
              <div class="alarm-composite-input">
                <input
                  v-model="draftModel.condition.value"
                  type="number"
                  min="1"
                  :disabled="!canManage"
                />
                <span>min.</span>
              </div>
            </label>
          </div>

          <div v-else-if="currentAlertType === 'geofence'" class="mt-3 space-y-3">
            <label class="alarm-form-field">
              <span>Evento de geocerca</span>
              <select v-model="draftModel.condition.value" :disabled="!canManage">
                <option
                  v-for="option in geofenceEventOptions"
                  :key="option.id"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
            </label>

            <div class="space-y-2">
              <p class="text-[11px] font-black text-[#102372]">Aplicar a geocercas</p>

              <label class="alarm-radio-row">
                <input
                  v-model="draftModel.condition.geofenceScope"
                  type="radio"
                  name="geofence-scope"
                  value="all"
                  :disabled="!canManage"
                  @change="$emit('set-geofence-scope', 'all')"
                />
                <span>Todas las geocercas</span>
              </label>

              <label class="alarm-radio-row">
                <input
                  v-model="draftModel.condition.geofenceScope"
                  type="radio"
                  name="geofence-scope"
                  value="group"
                  :disabled="!canManage"
                  @change="$emit('set-geofence-scope', 'group')"
                />
                <span>Grupo de geocercas</span>
              </label>

              <label class="alarm-radio-row">
                <input
                  v-model="draftModel.condition.geofenceScope"
                  type="radio"
                  name="geofence-scope"
                  value="specific"
                  :disabled="!canManage"
                  @change="$emit('set-geofence-scope', 'specific')"
                />
                <span>Geocercas especificas</span>
              </label>
            </div>

            <label v-if="draftModel.condition.geofenceScope === 'group'" class="alarm-form-field">
              <span>Grupo</span>
              <select
                v-model="draftModel.condition.geofenceGroupId"
                :disabled="!canManage || !geofenceGroupOptions.length"
                @change="$emit('geofence-group-change')"
              >
                <option value="" disabled>Seleccionar grupo</option>
                <option v-for="group in geofenceGroupOptions" :key="group.id" :value="group.id">
                  {{ group.label }} ({{ group.count }})
                </option>
              </select>
            </label>

            <div
              v-if="draftModel.condition.geofenceScope === 'group' && !geofenceGroupOptions.length"
              class="rounded-lg border border-dashed border-[#cfd8e6] bg-[#f8fafc] px-3 py-3 text-[11px] font-bold text-[#5f7396]"
            >
              No hay grupos de geocercas disponibles para esta empresa.
            </div>

            <div
              v-if="draftModel.condition.geofenceScope === 'specific'"
              class="space-y-2 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-2"
            >
              <div class="flex items-center gap-2">
                <input
                  v-model="localGeofenceSearchTerm"
                  type="search"
                  class="h-9 min-w-0 flex-1 rounded-lg border border-[#cfd8e6] bg-white px-3 text-[12px] font-bold text-[#102372] outline-none focus:border-[#102372] focus:ring-2 focus:ring-[#102372]/10"
                  placeholder="Buscar geocerca..."
                />

                <button
                  type="button"
                  class="alarm-mini-button"
                  :disabled="!canManage || !geofenceOptionsForDraftCompany.length"
                  @click="$emit('select-all-geofences')"
                >
                  Todas
                </button>
              </div>

              <div
                v-if="!geofenceOptionsForDraftCompany.length"
                class="rounded-lg border border-dashed border-[#cfd8e6] bg-white px-3 py-3 text-[11px] font-bold text-[#5f7396]"
              >
                No hay geocercas disponibles para esta empresa.
              </div>

              <div v-else class="max-h-36 space-y-1.5 overflow-y-auto pr-1">
                <label
                  v-for="geofence in visibleGeofenceOptions"
                  :key="geofence.id"
                  class="alarm-check-row"
                >
                  <input
                    type="checkbox"
                    :checked="isDraftGeofenceSelected(geofence.id)"
                    :disabled="!canManage"
                    @change="$emit('toggle-geofence', geofence.id)"
                  />
                  <span>
                    {{ geofence.label }}
                    <small v-if="geofence.groupLabel">{{ geofence.groupLabel }}</small>
                  </span>
                </label>
              </div>

              <p v-if="hiddenFilteredGeofenceCount" class="text-[11px] font-bold text-[#5f7396]">
                Mostrando {{ visibleGeofenceOptions.length }} de
                {{ filteredGeofenceOptions.length }} geocercas. Usa el buscador para acotar.
              </p>

              <p class="text-[11px] font-black text-[#102372]">
                {{ selectedDraftGeofenceCount }} de
                {{ geofenceOptionsForDraftCompany.length }} geocercas seleccionadas
              </p>
            </div>

            <div
              v-if="
                draftModel.condition.geofenceScope === 'group' && selectedDraftGeofenceGroupLabel
              "
              class="rounded-lg border border-[#cfe0ff] bg-[#eef5ff] px-3 py-2 text-[11px] font-semibold text-[#315078]"
            >
              Se aplicara al grupo {{ selectedDraftGeofenceGroupLabel }}.
            </div>
          </div>

          <div v-else-if="currentAlertType === 'stop_time'" class="mt-3 grid grid-cols-2 gap-2">
            <label class="alarm-form-field">
              <span>Detenido por mas de</span>
              <div class="alarm-composite-input">
                <input
                  v-model="draftModel.condition.value"
                  type="number"
                  min="1"
                  :disabled="!canManage"
                />
                <span>min.</span>
              </div>
            </label>

            <label class="alarm-form-field">
              <span>Motor</span>
              <select v-model="draftModel.condition.engineState" :disabled="!canManage">
                <option v-for="option in engineStateOptions" :key="option.id" :value="option.id">
                  {{ option.label }}
                </option>
              </select>
            </label>
          </div>

          <div v-else-if="currentAlertType === 'ignition'" class="mt-3">
            <div class="rounded-lg border border-[#cfe0ff] bg-[#eef5ff] px-3 py-3">
              <p class="text-[12px] font-black text-[#102372]">Contacto encendido</p>
              <p class="mt-1 text-[11px] font-semibold leading-4 text-[#49618a]">
                Se activara cuando el activo encienda fuera del horario permitido.
              </p>
            </div>
          </div>

          <div v-else-if="currentAlertType === 'fuel'" class="mt-3 grid grid-cols-2 gap-2">
            <label class="alarm-form-field">
              <span>Baja igual o mayor a</span>
              <div class="alarm-composite-input">
                <input
                  v-model="localFuelDropAmount"
                  type="number"
                  step="0.1"
                  min="0"
                  :disabled="!canManage"
                />
                <select v-model="draftModel.condition.unit" :disabled="!canManage">
                  <option value="litros">litros</option>
                  <option value="%">%</option>
                </select>
              </div>
            </label>

            <label class="alarm-form-field">
              <span>Ventana</span>
              <div class="alarm-composite-input">
                <input
                  v-model="draftModel.condition.windowMinutes"
                  type="number"
                  min="1"
                  :disabled="!canManage"
                />
                <span>min.</span>
              </div>
            </label>
          </div>

          <div v-else class="mt-3 grid grid-cols-[1fr_90px] gap-2">
            <label class="alarm-form-field">
              <span>{{ currentTypePreset.fieldLabel }}</span>
              <input v-model="draftModel.condition.value" type="text" :disabled="!canManage" />
            </label>

            <label class="alarm-form-field">
              <span>Unidad</span>
              <input v-model="draftModel.condition.unit" type="text" :disabled="!canManage" />
            </label>
          </div>
        </div>
      </section>

      <section class="alarm-trigger-card">
        <div class="alarm-trigger-title">
          <span class="alarm-trigger-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <circle cx="12" cy="12" r="8" />
              <path d="M12 8v5l3 2" />
            </svg>
          </span>
          <div class="min-w-0">
            <h4>Horario</h4>
            <p>Define en que momento se evaluara la condicion.</p>
          </div>
        </div>

        <div class="min-w-0">
          <div class="mt-3 space-y-2">
            <label class="alarm-radio-row">
              <input
                v-model="draftModel.schedule.type"
                type="radio"
                name="schedule"
                value="always"
                :disabled="!canManage || currentAlertType === 'ignition'"
              />
              <span>Siempre</span>
            </label>

            <label class="alarm-radio-row">
              <input
                v-model="draftModel.schedule.type"
                type="radio"
                name="schedule"
                value="custom"
                :disabled="!canManage"
              />
              <span>
                {{
                  currentAlertType === "ignition" ? "Horario permitido" : "Horario personalizado"
                }}
              </span>
            </label>
          </div>

          <div v-if="draftModel.schedule.type === 'custom'" class="mt-3 grid grid-cols-2 gap-2">
            <label class="alarm-form-field">
              <span>Desde</span>
              <input v-model="draftModel.schedule.from" type="time" :disabled="!canManage" />
            </label>

            <label class="alarm-form-field">
              <span>Hasta</span>
              <input v-model="draftModel.schedule.to" type="time" :disabled="!canManage" />
            </label>
          </div>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup>
import { computed } from "vue"

const props = defineProps({
  draft: {
    type: Object,
    required: true,
  },
  canManage: {
    type: Boolean,
    default: false,
  },
  currentAlertType: {
    type: String,
    default: "",
  },
  currentTypePreset: {
    type: Object,
    default: () => ({}),
  },
  batteryConditionOptions: {
    type: Array,
    default: () => [],
  },
  geofenceEventOptions: {
    type: Array,
    default: () => [],
  },
  geofenceGroupOptions: {
    type: Array,
    default: () => [],
  },
  geofenceOptionsForDraftCompany: {
    type: Array,
    default: () => [],
  },
  filteredGeofenceOptions: {
    type: Array,
    default: () => [],
  },
  visibleGeofenceOptions: {
    type: Array,
    default: () => [],
  },
  hiddenFilteredGeofenceCount: {
    type: Number,
    default: 0,
  },
  selectedDraftGeofenceCount: {
    type: Number,
    default: 0,
  },
  selectedDraftGeofenceGroupLabel: {
    type: String,
    default: "",
  },
  engineStateOptions: {
    type: Array,
    default: () => [],
  },
  geofenceSearchTerm: {
    type: String,
    default: "",
  },
  fuelDropAmount: {
    type: [Number, String],
    default: 0,
  },
  isDraftGeofenceSelected: {
    type: Function,
    default: () => false,
  },
})

const emit = defineEmits([
  "apply-battery-condition-preset",
  "geofence-group-change",
  "select-all-geofences",
  "set-geofence-scope",
  "toggle-geofence",
  "update:fuelDropAmount",
  "update:geofenceSearchTerm",
])

const draftModel = computed(() => props.draft)

const localGeofenceSearchTerm = computed({
  get: () => props.geofenceSearchTerm,
  set: (value) => emit("update:geofenceSearchTerm", value),
})

const localFuelDropAmount = computed({
  get: () => props.fuelDropAmount,
  set: (value) => emit("update:fuelDropAmount", value),
})
</script>

<style scoped>
.alarm-modal-card {
  min-width: 0;
  border-radius: 0.75rem;
  border: 1px solid #d8e0eb;
  background: #ffffff;
  padding: 1rem;
}

.alarm-modal-card-wide {
  grid-column: 1 / -1;
}

.alarm-modal-card-title,
.alarm-trigger-title {
  display: flex;
  min-width: 0;
  gap: 0.75rem;
  align-items: flex-start;
}

.alarm-modal-card-title {
  margin-bottom: 0.875rem;
}

.alarm-modal-card-title h3,
.alarm-trigger-title h4 {
  font-size: 1rem;
  line-height: 1.2;
  font-weight: 900;
  color: #102372;
}

.alarm-trigger-title p {
  margin-top: 0.2rem;
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.25;
  color: #49618a;
}

.alarm-trigger-grid {
  display: grid;
  min-width: 0;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.alarm-trigger-card {
  min-width: 0;
  border-radius: 0.625rem;
  border: 1px solid #d8e0eb;
  background: #ffffff;
  padding: 1rem;
}

.alarm-trigger-icon {
  display: inline-flex;
  width: 2.25rem;
  height: 2.25rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 0.625rem;
  background: #eef5ff;
  color: #102372;
}

.alarm-trigger-icon svg {
  width: 1.25rem;
  height: 1.25rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.alarm-step-number {
  display: inline-flex;
  width: 2.25rem;
  height: 2.25rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #102372;
  font-size: 1rem;
  font-weight: 900;
  color: #ffffff;
}

.alarm-form-field {
  display: block;
  min-width: 0;
}

.alarm-form-field > span {
  display: block;
  margin-bottom: 0.375rem;
  font-size: 0.6875rem;
  font-weight: 900;
  color: #315078;
}

.alarm-form-field input,
.alarm-form-field select {
  width: 100%;
  height: 2.625rem;
  border-radius: 0.5rem;
  border: 1px solid #cfd8e6;
  background: #ffffff;
  padding: 0 0.75rem;
  font-size: 0.75rem;
  font-weight: 800;
  color: #102372;
  outline: none;
  transition:
    border-color 0.16s ease,
    box-shadow 0.16s ease;
}

.alarm-form-field input:focus,
.alarm-form-field select:focus {
  border-color: #102372;
  box-shadow: 0 0 0 2px rgb(16 35 114 / 0.1);
}

.alarm-form-field input:disabled,
.alarm-form-field select:disabled {
  cursor: not-allowed;
  background: #f8fafc;
  color: #7f93b3;
}

.alarm-composite-input {
  display: grid;
  min-width: 0;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  overflow: hidden;
  border-radius: 0.5rem;
  border: 1px solid #cfd8e6;
  background: #ffffff;
  transition:
    border-color 0.16s ease,
    box-shadow 0.16s ease;
}

.alarm-composite-input:focus-within {
  border-color: #102372;
  box-shadow: 0 0 0 2px rgb(16 35 114 / 0.1);
}

.alarm-composite-input input,
.alarm-composite-input select {
  height: 2.25rem;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}

.alarm-composite-input input:focus,
.alarm-composite-input select:focus {
  box-shadow: none;
}

.alarm-composite-input select,
.alarm-composite-input > span {
  min-width: 3.25rem;
  border-left: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #5f7396;
  font-size: 0.6875rem;
  font-weight: 900;
}

.alarm-composite-input > span {
  display: inline-flex;
  height: 2.25rem;
  align-items: center;
  justify-content: center;
  padding: 0 0.625rem;
}

.alarm-radio-row,
.alarm-check-row {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  font-weight: 800;
  color: #102372;
}

.alarm-radio-row input,
.alarm-check-row input {
  width: 0.9375rem;
  height: 0.9375rem;
  flex-shrink: 0;
  accent-color: #102372;
}

.alarm-check-row {
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  padding: 0.5rem 0.625rem;
}

.alarm-check-row > span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.alarm-check-row small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.625rem;
  font-weight: 800;
  line-height: 1.2;
  color: #7f93b3;
}

.alarm-mini-button {
  display: inline-flex;
  height: 2.25rem;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  border: 1px solid #cfd8e6;
  background: #ffffff;
  padding: 0 0.75rem;
  font-size: 0.75rem;
  font-weight: 900;
  color: #102372;
  transition:
    border-color 0.16s ease,
    color 0.16s ease,
    background-color 0.16s ease;
}

.alarm-mini-button:hover {
  border-color: #ff6600;
  color: #ff6600;
  background: #fff8f3;
}

.alarm-mini-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

@media (max-width: 767px) {
  .alarm-trigger-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
