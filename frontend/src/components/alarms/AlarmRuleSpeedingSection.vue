<template>
  <section class="speeding-settings" aria-label="Opciones de exceso de velocidad">
    <fieldset>
      <legend>Contra que limite</legend>
      <div class="speeding-options limits-options">
        <label :class="{ selected: draft.condition.limitSource === 'vehicle-type' }">
          <input
            v-model="draftModel.condition.limitSource"
            type="radio"
            name="speed-limit-source"
            value="vehicle-type"
            :disabled="!canManage"
          />
          <span
            ><strong>El limite de cada tipo de vehiculo</strong
            ><small>{{ limitsSummary }}</small></span
          >
        </label>
        <label :class="{ selected: draft.condition.limitSource === 'custom' }">
          <input
            v-model="draftModel.condition.limitSource"
            type="radio"
            name="speed-limit-source"
            value="custom"
            :disabled="!canManage"
          />
          <span
            ><strong>Un limite propio de esta regla</strong
            ><small>El mismo numero para todos los vehiculos del alcance.</small></span
          >
        </label>
      </div>
    </fieldset>
    <p v-if="limitsError" class="limits-error" role="alert">{{ limitsError }}</p>
    <label v-if="draft.condition.limitSource === 'custom'" class="speeding-custom-limit">
      <span>Limite de velocidad</span>
      <div>
        <input
          v-model="draftModel.condition.value"
          type="number"
          min="1"
          max="300"
          step="1"
          :disabled="!canManage"
        /><span>km/h</span>
      </div>
    </label>
    <p v-else class="speeding-help">
      Usa Configuracion → Limites de la empresa de cada vehiculo. Un vehiculo sin tipo no se evalua.
    </p>
    <fieldset>
      <legend>Avisar solo desde</legend>
      <div class="speeding-options severity-options">
        <label
          v-for="level in SPEEDING_LEVELS"
          :key="level.id"
          :class="{ selected: draft.condition.minimumExcessSeverity === level.id }"
        >
          <input
            v-model="draftModel.condition.minimumExcessSeverity"
            type="radio"
            name="minimum-excess-severity"
            :value="level.id"
            :disabled="!canManage"
          />
          <span
            ><strong>{{ level.label }}</strong
            ><small>{{ level.range }}</small></span
          >
        </label>
      </div>
    </fieldset>
    <p class="speeding-help">{{ minimumExplanation }}</p>
    <section class="speeding-severity">
      <h3>Nivel de la alerta</h3>
      <p>Sale de la gravedad de cada exceso, no se elige aca.</p>
      <div>
        <span v-for="level in SPEEDING_LEVELS" :key="level.id" :class="level.id"
          >{{ level.label }} ({{ level.range.toLowerCase() }}) →
          <strong>{{ level.severity }}</strong></span
        >
      </div>
    </section>
    <p class="speeding-help">
      El exceso termina cuando la velocidad baja al menos 5 km/h del limite (histeresis de salida).
    </p>
    <section class="speeding-preview">
      <div>
        <strong>Antes de activar</strong><span>Cuantos avisos habria dado</span
        ><small>La prueba historica de episodios aun no esta disponible en este proyecto.</small>
      </div>
      <button type="button" disabled title="Requiere el evaluador historico de episodios">
        Probar sobre 30 dias
      </button>
    </section>
  </section>
</template>

<script setup>
import { computed, ref, watch } from "vue"
import { SPEEDING_LEVELS } from "../../utils/alarms/speedingRule.js"
import { LIMIT_TYPES, readLimitsConfiguration } from "../../utils/layout/limitsConfiguration.js"
import { readStorageValue } from "../../services/storage/browserStorage.js"

const props = defineProps({ draft: { type: Object, required: true }, canManage: Boolean })
const draftModel = computed(() => props.draft)
const limitsError = ref("")
const limitsSummary = ref("")
watch(
  () => props.draft.companyId,
  (companyId) => {
    try {
      if (props.draft.platformScope) {
        limitsSummary.value = "Segun la empresa y el tipo de cada vehiculo."
        limitsError.value = ""
        return
      }
      const platform = readLimitsConfiguration(readStorageValue)
      const own = companyId ? readLimitsConfiguration(readStorageValue, companyId) : platform
      limitsSummary.value =
        LIMIT_TYPES.filter((type) => ["bus", "car", "pickup", "trailer", "truck"].includes(type.id))
          .map(
            (type) =>
              `${type.label}: ${own.speed[type.id] ?? platform.speed[type.id] ?? type.speed}`,
          )
          .join(" · ") + " km/h"
      limitsError.value = ""
    } catch (error) {
      limitsSummary.value = "No se pudieron leer los limites."
      limitsError.value = error.message
    }
  },
  { immediate: true },
)
const minimumExplanation = computed(
  () =>
    ({
      mild: "Avisa de todos los excesos, de cualquier tamano.",
      moderate: "Avisa solo cuando el exceso supera los 10 km/h sobre el limite.",
      severe: "Avisa solo cuando el exceso supera los 20 km/h sobre el limite.",
    })[props.draft.condition.minimumExcessSeverity],
)
</script>

<style scoped>
.speeding-settings {
  display: grid;
  gap: 14px;
  color: #102372;
}
fieldset {
  min-width: 0;
}
legend,
.speeding-severity h3 {
  font-size: 13px;
  font-weight: 800;
  margin-bottom: 8px;
}
.speeding-options {
  display: grid;
  gap: 8px;
}
.limits-options {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.severity-options {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.speeding-options label {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-width: 0;
  padding: 12px;
  border: 1px solid #d8e0eb;
  border-radius: 6px;
  cursor: pointer;
}
.speeding-options label.selected {
  border-color: #102372;
  background: #eef3ff;
}
input[type="radio"] {
  accent-color: #102372;
  margin-top: 3px;
  flex-shrink: 0;
}
strong {
  font-size: 13px;
}
small {
  display: block;
  margin-top: 5px;
  font-size: 12px;
  line-height: 1.5;
  color: #49618a;
}
.speeding-help {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: #49618a;
}
.speeding-custom-limit {
  font-size: 13px;
  font-weight: 800;
}
.speeding-custom-limit > div {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
}
.speeding-custom-limit input {
  width: 180px;
  height: 42px;
  border: 1px solid #cfd8e6;
  border-radius: 6px;
  padding: 0 12px;
  font-size: 14px;
}
.speeding-severity p {
  font-size: 13px;
  margin-bottom: 10px;
}
.speeding-severity > div {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.speeding-severity > div > span {
  padding: 7px 10px;
  background: #f3f6fb;
  border-radius: 4px;
  font-size: 11px;
}
.mild strong {
  color: #2563eb;
}
.moderate strong {
  color: #ad5500;
}
.severe strong {
  color: #c02626;
}
.speeding-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-top: 1px solid #d8e0eb;
  padding-top: 14px;
}
.speeding-preview strong {
  display: block;
  color: #c95000;
  font-size: 11px;
  text-transform: uppercase;
}
.speeding-preview span {
  display: block;
  margin-top: 3px;
  font-size: 13px;
  font-weight: 800;
}
.speeding-preview button {
  padding: 10px 12px;
  border: 1px solid #cfd8e6;
  border-radius: 6px;
  font-size: 12px;
  flex-shrink: 0;
  color: #7f93b3;
  cursor: not-allowed;
}
.limits-error {
  color: #c02626;
  font-size: 12px;
}
@media (max-width: 650px) {
  .limits-options,
  .severity-options {
    grid-template-columns: minmax(0, 1fr);
  }
  .speeding-preview {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
