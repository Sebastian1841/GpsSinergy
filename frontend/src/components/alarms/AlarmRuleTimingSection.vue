<template>
  <section class="rule-timing" aria-label="Ruido y vigencia">
    <div class="timing-columns">
      <section class="timing-schedule">
        <header>
          <SvgIcon name="alarm-after-hours" />
          <div>
            <h3>Horario de vigencia</h3>
            <p>
              {{
                draft.type === "ignition"
                  ? "Horario permitido de encendido."
                  : "Periodo en que se aplica la regla."
              }}
            </p>
          </div>
        </header>
        <div class="schedule-modes">
          <label :class="{ selected: draft.schedule.type === 'always' }"
            ><input
              v-model="model.schedule.type"
              type="radio"
              name="wizard-schedule-mode"
              value="always"
              :disabled="!canManage || draft.type === 'ignition'"
            /><span>Siempre<small>Las 24 horas</small></span></label
          >
          <label :class="{ selected: draft.schedule.type === 'custom' }"
            ><input
              v-model="model.schedule.type"
              type="radio"
              name="wizard-schedule-mode"
              value="custom"
              :disabled="!canManage"
            /><span>Personalizado<small>Definir una franja</small></span></label
          >
        </div>
        <div class="schedule-hours">
          <label
            ><span>Desde</span
            ><input
              v-model="model.schedule.from"
              type="time"
              :disabled="!canManage || draft.schedule.type !== 'custom'"
          /></label>
          <span class="hours-separator" aria-hidden="true">a</span>
          <label
            ><span>Hasta</span
            ><input
              v-model="model.schedule.to"
              type="time"
              :disabled="!canManage || draft.schedule.type !== 'custom'"
          /></label>
        </div>
        <p class="timing-note">
          {{
            draft.schedule.type === "always"
              ? "La regla no tiene restriccion horaria."
              : overnight
                ? "La franja cruza la medianoche y termina al dia siguiente."
                : "La regla usa la franja horaria seleccionada."
          }}
        </p>
      </section>
      <section class="timing-noise">
        <header>
          <SvgIcon name="alarm-no-signal" />
          <div>
            <h3>Control de avisos</h3>
            <p>Intervalo entre avisos del mismo activo.</p>
          </div>
        </header>
        <label class="timing-number"
          ><span>No repetir antes de</span>
          <div>
            <input
              v-model="model.cooldownMinutes"
              type="number"
              min="0"
              :disabled="!canManage"
            /><span>minutos</span>
          </div></label
        >
        <p class="timing-note">
          {{
            Number(draft.cooldownMinutes) === 0
              ? "Sin silencio: no se aplica un intervalo entre avisos."
              : "Se conserva un silencio de " + draft.cooldownMinutes + " minutos para cada activo."
          }}
        </p>
        <label v-if="draft.type === 'speeding'" class="timing-number"
          ><span>Duracion minima del exceso</span>
          <div>
            <input
              v-model="model.condition.durationSeconds"
              type="number"
              min="0"
              :disabled="!canManage"
            /><span>segundos</span>
          </div></label
        >
      </section>
    </div>
    <section class="timing-week">
      <header>
        <h3>Dias de vigencia</h3>
        <span>{{ daySummary }}</span>
      </header>
      <fieldset class="timing-days">
        <legend class="sr-only">Seleccionar dias de vigencia</legend>
        <label
          v-for="day in days"
          :key="day.id"
          :class="{ selected: draft.schedule.days.includes(day.id) }"
          ><input
            v-model="model.schedule.days"
            type="checkbox"
            :value="day.id"
            :disabled="!canManage"
          /><span>{{ day.label }}</span></label
        >
      </fieldset>
      <p class="timing-note">Sin dias seleccionados: todos los dias.</p>
    </section>
  </section>
</template>
<script setup>
import { computed } from "vue"
import SvgIcon from "../icons/SvgIcon.vue"
const props = defineProps({ draft: { type: Object, required: true }, canManage: Boolean })
const model = computed(() => props.draft)
const days = [
  { id: "monday", label: "Lunes" },
  { id: "tuesday", label: "Martes" },
  { id: "wednesday", label: "Miercoles" },
  { id: "thursday", label: "Jueves" },
  { id: "friday", label: "Viernes" },
  { id: "saturday", label: "Sabado" },
  { id: "sunday", label: "Domingo" },
]
const selectedDays = computed(() =>
  days.filter((day) => props.draft.schedule.days.includes(day.id)),
)
const daySummary = computed(() =>
  selectedDays.value.length === 0 || selectedDays.value.length === 7
    ? "Todos los dias"
    : selectedDays.value.map((day) => day.label).join(", "),
)
const overnight = computed(
  () =>
    props.draft.schedule.type === "custom" && props.draft.schedule.from > props.draft.schedule.to,
)
</script>
<style scoped>
.rule-timing {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  gap: 18px;
  color: #102372;
}
.timing-columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 28px;
  flex: 1;
  min-height: 220px;
}
.timing-schedule,
.timing-noise {
  min-width: 0;
}
.timing-noise {
  border-left: 1px solid #d8e0eb;
  padding-left: 28px;
}
.timing-columns header {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 14px;
}
.timing-columns header :deep(.svg-icon-wrapper) {
  width: 36px;
  height: 36px;
  padding: 8px;
  background: #eef3ff;
  border-radius: 6px;
  flex-shrink: 0;
}
.timing-columns header :deep(svg) {
  transform: none;
  width: 20px;
  height: 20px;
}
h3 {
  font-size: 16px;
  font-weight: 800;
  margin: 0;
}
header p,
.timing-note {
  font-size: 12px;
  line-height: 1.5;
  color: #49618a;
  margin: 5px 0 0;
}
.schedule-modes {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
.schedule-modes label {
  display: flex;
  gap: 10px;
  align-items: center;
  border: 1px solid #cfd8e6;
  border-radius: 6px;
  padding: 12px;
  min-height: 66px;
  cursor: pointer;
}
.schedule-modes label.selected {
  background: #eef3ff;
  border-color: #102372;
}
.schedule-modes span {
  font-size: 13px;
  font-weight: 800;
}
.schedule-modes small {
  display: block;
  font-size: 11px;
  font-weight: 400;
  color: #49618a;
  margin-top: 3px;
}
input[type="radio"],
input[type="checkbox"] {
  accent-color: #102372;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}
.schedule-hours {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: end;
  gap: 12px;
  margin-top: 18px;
}
label {
  min-width: 0;
}
.schedule-hours label > span,
.timing-number > span {
  display: block;
  font-size: 12px;
  font-weight: 800;
  margin-bottom: 8px;
}
.schedule-hours input,
.timing-number input {
  width: 100%;
  min-width: 0;
  height: 46px;
  border: 1px solid #cfd8e6;
  border-radius: 6px;
  padding: 0 12px;
  background: white;
  color: #102372;
  font-size: 15px;
}
.schedule-hours input:disabled {
  background: #f4f6fa;
  color: #91a1ba;
}
.hours-separator {
  padding-bottom: 14px;
  font-size: 12px;
  color: #49618a;
}
.timing-number {
  display: block;
  margin-top: 18px;
}
.timing-number > div {
  display: flex;
  border: 1px solid #cfd8e6;
  border-radius: 6px;
  overflow: hidden;
}
.timing-number input {
  border: 0;
  border-radius: 0;
}
.timing-number > div > span {
  display: grid;
  place-items: center;
  padding: 0 16px;
  background: #f4f6fa;
  border-left: 1px solid #d8e0eb;
  font-size: 12px;
  color: #49618a;
}
.timing-week {
  border-top: 1px solid #d8e0eb;
  padding-top: 14px;
}
.timing-week > header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}
.timing-week header > span {
  font-size: 12px;
  color: #49618a;
  text-align: right;
  max-width: 65%;
}
.timing-days {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 8px;
  min-width: 0;
}
.timing-days label {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 46px;
  padding: 10px 4px;
  border: 1px solid #cfd8e6;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
}
.timing-days label.selected {
  background: #eef3ff;
  border-color: #102372;
  font-weight: 800;
}
@media (max-width: 750px) {
  .timing-columns {
    grid-template-columns: minmax(0, 1fr);
    gap: 22px;
    flex: none;
  }
  .timing-noise {
    border-left: 0;
    padding-left: 0;
    border-top: 1px solid #d8e0eb;
    padding-top: 20px;
  }
  .timing-days {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  .timing-days label {
    flex-direction: column;
  }
  .timing-week > header {
    flex-direction: column;
    gap: 7px;
  }
  .timing-week header > span {
    max-width: 100%;
    text-align: left;
  }
  .rule-timing {
    flex: none;
  }
}
</style>
