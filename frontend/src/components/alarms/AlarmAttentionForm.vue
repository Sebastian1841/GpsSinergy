<template>
  <form class="attention-form" @submit.prevent="submit">
    <h3>Atender {{ count }} {{ count === 1 ? "alerta" : "alertas" }}</h3>
    <fieldset>
      <legend>Que se hizo</legend>
      <div class="attention-options">
        <label
          v-for="option in ATTENTION_ACTIONS"
          :key="option.id"
          :class="{ selected: action === option.id }"
        >
          <input v-model="action" type="radio" :name="groupName" :value="option.id" required />
          <span
            >{{ option.label
            }}<small>{{ option.resolved ? "Queda atendida" : "Queda en curso" }}</small></span
          >
        </label>
      </div>
    </fieldset>
    <label class="attention-note"
      >Que paso
      <textarea
        v-model="note"
        rows="2"
        maxlength="2000"
        placeholder="Agrega una nota (opcional)..."
      />
    </label>
    <button type="submit" class="attention-confirm" :disabled="!action">
      {{ action ? "Registrar atencion" : "Elige que se hizo" }}
    </button>
    <button type="button" class="attention-cancel" @click="$emit('cancel')">Cancelar</button>
  </form>
</template>
<script setup>
import { ref, useId } from "vue"
import { ATTENTION_ACTIONS } from "../../utils/alarms/alarmAttention.js"
defineProps({ count: { type: Number, required: true } })
const emit = defineEmits(["save", "cancel"])
const action = ref("")
const note = ref("")
const groupName = useId()
const submit = () => {
  if (!ATTENTION_ACTIONS.some((choice) => choice.id === action.value)) return
  emit("save", { action: action.value, note: note.value })
  action.value = ""
  note.value = ""
}
</script>
<style scoped>
.attention-form {
  display: grid;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid #dfe6f0;
}
h3 {
  color: #102372;
  font-size: 14px;
  font-weight: 700;
}
fieldset {
  border: 0;
  padding: 0;
  min-width: 0;
}
legend,
.attention-note {
  font-size: 12px;
  font-weight: 600;
  color: #49658f;
}
legend {
  margin-bottom: 6px;
}
.attention-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
.attention-options label {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  padding: 10px;
  border: 1px solid #cfd8e6;
  border-radius: 6px;
  cursor: pointer;
  color: #102372;
  font-size: 12px;
  font-weight: 700;
  overflow-wrap: anywhere;
}
.attention-options label.selected {
  border-color: #102372;
  background: #eef3ff;
}
input {
  margin-top: 2px;
  accent-color: #102372;
  flex-shrink: 0;
}
small {
  display: block;
  margin-top: 4px;
  font-size: 11px;
  font-weight: 400;
  color: #5f7396;
}
textarea {
  display: block;
  width: 100%;
  margin-top: 6px;
  padding: 9px;
  border: 1px solid #cfd8e6;
  border-radius: 6px;
  resize: vertical;
  color: #102372;
  font-size: 13px;
  font-weight: 400;
}
button {
  min-height: 36px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
}
.attention-confirm {
  background: #ff6600;
  color: white;
}
.attention-confirm:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.attention-cancel {
  border: 1px solid #cfd8e6;
  color: #102372;
  background: white;
}
</style>
