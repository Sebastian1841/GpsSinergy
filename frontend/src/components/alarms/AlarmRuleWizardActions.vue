<template>
  <section class="wizard-rule-actions" aria-label="Acciones de la regla">
    <h3>Acciones</h3>
    <label class="unavailable"
      ><input type="checkbox" disabled /><span
        ><strong>Registrar el episodio para los informes</strong
        ><small
          >No disponible: falta conectar los episodios de esta regla con el motor de
          informes.</small
        ></span
      ></label
    >
    <label
      ><input
        v-model="model.notificationChannels.inApp"
        type="checkbox"
        :disabled="!canManage"
      /><span><strong>Avisar en la plataforma</strong></span></label
    >
    <label class="unavailable"
      ><input type="checkbox" :checked="draft.notificationChannels.email" disabled /><span
        ><strong>Avisar por correo</strong
        ><small>No disponible: falta configurar el proveedor de correo.</small></span
      ></label
    >
    <label class="historical unavailable"
      ><input type="checkbox" disabled /><span
        ><strong>Aplicar tambien a datos anteriores</strong
        ><small
          >No disponible: requiere una regla guardada y un evaluador historico conectado.</small
        ></span
      ></label
    >
    <div class="actions-preview">
      <div><strong>Antes de activar</strong><span>Cuantos avisos habria dado</span></div>
      <button type="button" disabled title="Requiere el evaluador historico de episodios">
        Probar sobre 30 dias
      </button>
    </div>
  </section>
</template>
<script setup>
import { computed } from "vue"
const props = defineProps({ draft: { type: Object, required: true }, canManage: Boolean })
const model = computed(() => props.draft)
</script>
<style scoped>
.wizard-rule-actions {
  display: grid;
  gap: 14px;
  color: #102372;
}
h3 {
  font-size: 13px;
  font-weight: 800;
  margin: 0;
}
label {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 13px;
}
label input {
  width: 16px;
  height: 16px;
  margin-top: 2px;
  flex-shrink: 0;
  accent-color: #ff6600;
}
strong {
  font-size: 12px;
  font-weight: 800;
}
small {
  display: block;
  font-size: 11px;
  line-height: 1.5;
  color: #7f93b3;
  margin-top: 4px;
}
.unavailable {
  color: #7f93b3;
  cursor: not-allowed;
}
.historical {
  padding: 14px;
  border: 1px solid #d8e0eb;
  background: #f8fafc;
  border-radius: 6px;
  margin-top: 4px;
}
.actions-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-top: 1px solid #d8e0eb;
  padding-top: 16px;
}
.actions-preview strong {
  display: block;
  color: #c95000;
  text-transform: uppercase;
  font-size: 11px;
}
.actions-preview span {
  display: block;
  font-size: 13px;
  font-weight: 800;
  margin-top: 4px;
}
button {
  flex-shrink: 0;
  border: 1px solid #cfd8e6;
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 12px;
  color: #7f93b3;
  cursor: not-allowed;
}
@media (max-width: 600px) {
  .actions-preview {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
