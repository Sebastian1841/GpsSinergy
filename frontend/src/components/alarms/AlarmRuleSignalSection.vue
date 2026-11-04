<template>
  <section class="signal-settings" aria-label="Condicion de senal o variable">
    <fieldset class="signal-presets">
      <legend>Empezar de una condicion ya medida</legend>
      <label
        v-for="preset in SIGNAL_RULE_PRESETS"
        :key="preset.id"
        :class="{ selected: selectedPreset(preset), unavailable: preset.disabled }"
      >
        <input
          type="radio"
          name="signal-rule-preset"
          :checked="selectedPreset(preset)"
          :disabled="!canManage || preset.disabled"
          @change="applySignalRulePreset(model, preset.id)"
        />
        <span
          ><strong>{{ preset.label }}</strong
          ><small v-if="preset.disabled" class="coming-soon">Próximamente</small
          ><small>{{ preset.description }}</small></span
        >
      </label>
    </fieldset>
    <div class="signal-workspace">
      <div class="signal-editor">
        <label class="full"
          ><span>Que senal o variable</span
          ><input
            :value="fieldName"
            type="text"
            readonly
            aria-readonly="true"
            :disabled="!canManage"
        /></label>
        <label
          ><span>Condicion</span
          ><select v-model="model.condition.operator" :disabled="!canManage">
            <option v-for="operator in operators" :key="operator.id" :value="operator.id">
              {{ operator.label }}
            </option>
          </select></label
        >
        <label
          ><span>Valor{{ draft.condition.unit ? " (" + draft.condition.unit + ")" : "" }}</span
          ><input v-model="model.condition.value" type="number" step="any" :disabled="!canManage"
        /></label>
        <label v-if="hasExitMargin" class="full"
          ><span
            >Margen de salida{{
              draft.condition.unit ? " (" + draft.condition.unit + ")" : ""
            }}</span
          ><input
            v-model="model.condition.exitMargin"
            type="number"
            min="0"
            step="any"
            :disabled="!canManage"
        /></label>
        <p class="full signal-reason">
          Dispara mientras {{ displaySignalField(draft.condition.field) }} {{ operatorLabel }}
          {{ draft.condition.value }}{{ draft.condition.unit ? " " + draft.condition.unit : "" }}.
          <template v-if="hasExitMargin"
            >Cierra cuando se aleja {{ draft.condition.exitMargin ?? 0 }}
            {{ draft.condition.unit }} del umbral en sentido contrario.</template
          >
        </p>
        <label
          ><span>Duracion minima (segundos)</span
          ><input
            v-model="model.condition.durationSeconds"
            type="number"
            min="0"
            :disabled="!canManage"
        /></label>
        <label
          ><span>Origen</span
          ><select v-model="model.condition.source" :disabled="!canManage">
            <option value="measured">Senal medida</option>
            <option value="calculated">Variable calculada</option>
          </select></label
        >
        <label
          ><span>Unidad opcional</span
          ><input v-model="model.condition.unit" type="text" :disabled="!canManage"
        /></label>
        <p
          v-if="
            draft.condition.field === 'digitalInput1' || draft.condition.field === 'digitalInput2'
          "
          class="full signal-note"
        >
          Para puerta abierta, verifica la entrada digital y su polaridad en la ficha de cada
          equipo. Guardar esta condicion no conecta un detector de apertura.
        </p>
      </div>
      <aside class="signal-values">
        <h3>Variables disponibles</h3>
        <small>Ultimo reporte disponible</small>
        <label
          ><span>Vehiculo</span
          ><select v-model="selectedAssetId">
            <option value="">Elegir un vehiculo</option>
            <option v-for="asset in assets" :key="asset.id" :value="String(asset.id)">
              {{ asset.label || asset.nombrePantalla || asset.name || asset.patente || asset.id }}
            </option>
          </select></label
        >
        <p v-if="!selectedAsset">
          Selecciona un activo para ver los valores recibidos. Elegir una senal la inserta en el
          editor.
        </p>
        <p v-else-if="!signals.length">
          Este activo no tiene valores de senal disponibles en el reporte cargado.
        </p>
        <div v-else class="signal-values-list">
          <button
            v-for="signal in signals"
            :key="signal.id"
            type="button"
            :disabled="!canManage"
            @click="chooseSignal(signal)"
          >
            <span>{{ signal.name }}</span
            ><strong>{{ signal.value }} {{ signal.unit }}</strong>
          </button>
        </div>
      </aside>
    </div>
    <label class="signal-level"
      ><span>Nivel de la alerta</span
      ><select v-model="model.severity" :disabled="!canManage">
        <option value="low">Informativa</option>
        <option value="medium">Advertencia</option>
        <option v-if="model.severity === 'high'" value="high">Alta</option>
        <option value="critical">Critica</option>
      </select></label
    >
    <p class="signal-note">
      El nivel elegido decide el color y la prioridad en la bandeja; esta condicion no calcula una
      gravedad.
    </p>
    <section class="signal-preview">
      <div>
        <strong>Antes de activar</strong><span>Cuantos avisos habria dado</span
        ><small>Prueba historica no disponible: falta el evaluador de episodios.</small>
      </div>
      <button type="button" disabled title="Requiere el evaluador historico de episodios">
        Probar sobre 30 dias
      </button>
    </section>
  </section>
</template>
<script setup>
import { computed, ref, watch } from "vue"
import {
  SIGNAL_RULE_PRESETS,
  applySignalRulePreset,
  availableAssetSignals,
  displaySignalField,
} from "../../utils/alarms/signalRulePresets.js"
const props = defineProps({
  draft: { type: Object, required: true },
  assets: { type: Array, default: () => [] },
  canManage: Boolean,
})
const model = computed(() => props.draft)
const selectedAssetId = ref("")
const selectedAsset = computed(() =>
  props.assets.find((asset) => String(asset.id) === selectedAssetId.value),
)
const signals = computed(() => availableAssetSignals(selectedAsset.value))
watch(
  () => props.assets,
  () => {
    if (!selectedAsset.value) selectedAssetId.value = ""
  },
  { deep: false },
)
const fieldName = computed(() => displaySignalField(props.draft.condition.field))
const operators = [
  { id: "=", label: "Igual a" },
  { id: "!=", label: "Distinto de" },
  { id: ">", label: "Mayor que" },
  { id: ">=", label: "Mayor o igual" },
  { id: "<", label: "Menor que" },
  { id: "<=", label: "Menor o igual" },
]
const operatorLabel = computed(
  () =>
    operators.find((option) => option.id === props.draft.condition.operator)?.label.toLowerCase() ||
    "",
)
const hasExitMargin = computed(() =>
  [">", ">=", "<", "<="].includes(props.draft.condition.operator),
)
const selectedPreset = (preset) =>
  props.draft.condition.presetId === preset.id &&
  ["field", "operator", "unit", "durationSeconds"].every(
    (key) => String(props.draft.condition[key]) === String(preset[key]),
  ) &&
  Number(props.draft.condition.value) === preset.value &&
  Number(props.draft.condition.exitMargin ?? 0) === (preset.exitMargin ?? 0)
const chooseSignal = (signal) =>
  Object.assign(model.value.condition, {
    field: signal.id,
    unit: signal.unit,
    source: "measured",
    presetId: "",
  })
</script>
<style scoped>
.signal-settings {
  display: grid;
  gap: 18px;
  color: #102372;
}
legend {
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 800;
}
.signal-presets {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
.signal-presets label {
  display: flex;
  gap: 10px;
  padding: 10px;
  border: 1px solid #d8e0eb;
  border-radius: 6px;
  cursor: pointer;
}
.signal-presets label.selected {
  border-color: #102372;
  background: #eef3ff;
}
.signal-presets label.unavailable {
  cursor: not-allowed;
  color: #7f93b3;
  background: #f8fafc;
}
.signal-presets .coming-soon {
  display: inline-block;
  padding: 2px 6px;
  background: #fff4e8;
  color: #ad5500;
  border-radius: 4px;
}
.signal-presets input {
  margin-top: 4px;
  accent-color: #102372;
  flex-shrink: 0;
}
.signal-presets strong {
  font-size: 12px;
}
.signal-presets small {
  display: block;
  font-size: 11px;
  line-height: 1.5;
  color: #49618a;
  margin-top: 4px;
}
.signal-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 16px;
  align-items: start;
}
.signal-editor {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  min-width: 0;
}
.full {
  grid-column: 1/-1;
}
label {
  min-width: 0;
}
label > span {
  display: block;
  font-size: 12px;
  font-weight: 800;
  margin-bottom: 7px;
}
.signal-editor input,
.signal-editor select,
.signal-values select {
  width: 100%;
  min-width: 0;
  height: 40px;
  padding: 0 10px;
  border: 1px solid #cfd8e6;
  border-radius: 6px;
  background: white;
  color: #102372;
  font-size: 13px;
}
.signal-reason,
.signal-note,
.signal-values p {
  font-size: 12px;
  line-height: 1.5;
  color: #49618a;
  margin: 0;
}
.signal-editor input[readonly] { background:#eef3ff; border-color:#102372; cursor:default; font-weight:700; }
.signal-note {
  padding: 10px;
  border-left: 3px solid #ff9900;
  background: #fff8ed;
}
.signal-values {
  border: 1px solid #d8e0eb;
  border-radius: 6px;
  padding: 12px;
  display: grid;
  gap: 12px;
}
h3 {
  font-size: 14px;
  font-weight: 800;
}
.signal-values > small {
  font-size: 11px;
  color: #49618a;
}
.signal-values-list {
  max-height: 240px;
  overflow: auto;
  display: grid;
  gap: 4px;
}
.signal-values-list button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-align: left;
  gap: 8px;
  padding: 8px;
  background: #f3f6fb;
  font-size: 11px;
  overflow-wrap: anywhere;
}
.signal-values-list button:hover {
  background: #e8efff;
}
.signal-level select {
  width: 220px;
  max-width: 100%;
  height: 40px;
  padding: 0 10px;
  border: 1px solid #cfd8e6;
  border-radius: 6px;
  background: white;
  color: #102372;
  font-size: 13px;
}
.signal-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-top: 1px solid #d8e0eb;
  padding-top: 14px;
}
.signal-preview strong {
  display: block;
  color: #c95000;
  font-size: 11px;
  text-transform: uppercase;
}
.signal-preview span {
  display: block;
  margin-top: 3px;
  font-size: 13px;
  font-weight: 800;
}
.signal-preview small {
  display: block;
  font-size: 12px;
  color: #49618a;
  margin-top: 5px;
}
.signal-preview > button {
  flex-shrink: 0;
  padding: 10px 12px;
  border: 1px solid #cfd8e6;
  border-radius: 6px;
  font-size: 12px;
  color: #7f93b3;
  cursor: not-allowed;
}
@media (max-width: 600px) {
  .signal-preview {
    flex-direction: column;
    align-items: flex-start;
  }
}
@media (max-width: 800px) {
  .signal-workspace {
    grid-template-columns: minmax(0, 1fr);
  }
}
@media (max-width: 600px) {
  .signal-presets,
  .signal-editor {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
