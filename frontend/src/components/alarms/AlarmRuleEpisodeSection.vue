<template>
  <section class="episode-settings" aria-label="Condicion del episodio">
    <h3>{{ option.label }}</h3>
    <div class="episode-fields">
      <template v-if="draft.type === 'idle'">
        <label
          ><span>Duracion minima del ralenti (minutos)</span
          ><input v-model="model.condition.value" type="number" min="1" :disabled="!canManage"
        /></label>
        <p>Motor encendido y vehiculo detenido.</p>
      </template>
      <template v-else-if="draft.type === 'temperature'">
        <label class="full"
          ><span>Identificador de la senal de la sonda</span
          ><input
            v-model="model.condition.field"
            type="text"
            placeholder="Ej: temperature"
            :disabled="!canManage"
        /></label>
        <label
          ><span>Minimo permitido (C)</span
          ><input v-model="model.condition.lower" type="number" step="0.1" :disabled="!canManage"
        /></label>
        <label
          ><span>Maximo permitido (C)</span
          ><input v-model="model.condition.upper" type="number" step="0.1" :disabled="!canManage"
        /></label>
      </template>
      <template v-else-if="draft.type === 'fuel_load'">
        <label
          ><span>Subida igual o mayor a</span
          ><input
            v-model="model.condition.value"
            type="number"
            min="0.1"
            step="0.1"
            :disabled="!canManage"
        /></label>
        <label
          ><span>Unidad</span
          ><select v-model="model.condition.unit" :disabled="!canManage">
            <option value="%">%</option>
            <option value="litros">Litros</option>
          </select></label
        >
        <label
          ><span>Ventana de medicion (minutos)</span
          ><input
            v-model="model.condition.windowMinutes"
            type="number"
            min="1"
            :disabled="!canManage"
        /></label>
        <p>Solo para equipos que reportan nivel de combustible, con el vehiculo detenido.</p>
      </template>
      <template v-else-if="draft.type === 'door_open'">
        <label
          ><span>Entrada digital de la puerta</span
          ><select v-model="model.condition.field" :disabled="!canManage">
            <option value="digitalInput1">Entrada digital 1</option>
            <option value="digitalInput2">Entrada digital 2</option>
          </select></label
        >
        <label
          ><span>Valor que indica puerta abierta</span
          ><select v-model="model.condition.value" :disabled="!canManage">
            <option :value="1">1 - Activa</option>
            <option :value="0">0 - Inactiva</option>
          </select></label
        >
      </template>
      <label v-else-if="draft.type === 'ignition_event'"
        ><span>Avisar cuando el motor</span
        ><select v-model="model.condition.value" :disabled="!canManage">
          <option value="Encendido">Se enciende</option>
          <option value="Apagado">Se apaga</option>
        </select></label
      >
      <template v-else-if="draft.type === 'signal'">
        <label
          ><span>Origen del valor</span
          ><select v-model="model.condition.source" :disabled="!canManage">
            <option value="measured">Senal medida</option>
            <option value="calculated">Variable calculada</option>
          </select></label
        >
        <label
          ><span>Identificador de la senal o variable</span
          ><input
            v-model="model.condition.field"
            type="text"
            placeholder="Ej: batteryVoltage"
            :disabled="!canManage"
        /></label>
        <label
          ><span>Comparacion</span
          ><select v-model="model.condition.operator" :disabled="!canManage">
            <option v-for="operator in operators" :key="operator" :value="operator">
              {{ operator }}
            </option>
          </select></label
        >
        <label
          ><span>Valor del umbral</span
          ><input v-model="model.condition.value" type="number" step="any" :disabled="!canManage"
        /></label>
        <label
          ><span>Unidad opcional</span
          ><input
            v-model="model.condition.unit"
            type="text"
            placeholder="Ej: V, C, %"
            :disabled="!canManage"
        /></label>
      </template>
      <label v-if="['temperature', 'door_open', 'ignition_event', 'signal'].includes(draft.type)"
        ><span>Duracion minima (segundos)</span
        ><input
          v-model="model.condition.durationSeconds"
          type="number"
          min="0"
          :disabled="!canManage"
      /></label>
    </div>
    <p class="episode-note">
      La condicion se guarda en la regla. Su deteccion requiere que el equipo envie la senal y que
      exista un detector de episodios conectado.
    </p>
  </section>
</template>
<script setup>
import { computed } from "vue"
import { CONFIGURATION_ALERT_TYPES } from "../../utils/alarms/configurationAlertTypes.js"
const props = defineProps({ draft: { type: Object, required: true }, canManage: Boolean })
const model = computed(() => props.draft)
const option = computed(
  () => CONFIGURATION_ALERT_TYPES.find((option) => option.id === props.draft.type) || {},
)
const operators = [">", ">=", "<", "<=", "=", "!="]
</script>
<style scoped>
.episode-settings {
  display: grid;
  gap: 14px;
  color: #102372;
}
h3 {
  font-size: 16px;
  font-weight: 800;
}
.episode-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
label {
  min-width: 0;
}
label > span {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 800;
}
input,
select {
  width: 100%;
  min-width: 0;
  height: 42px;
  padding: 0 12px;
  border: 1px solid #cfd8e6;
  border-radius: 6px;
  color: #102372;
  background: white;
  font-size: 14px;
}
p {
  font-size: 12px;
  color: #49618a;
  line-height: 1.5;
  align-self: center;
}
.full {
  grid-column: 1/-1;
}
.episode-note {
  padding: 12px;
  background: #f3f6fb;
  border-left: 3px solid #cfd8e6;
}
@media (max-width: 650px) {
  .episode-fields {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
