<template>
  <section class="fuel-drop-settings" aria-label="Caida de nivel de combustible">
    <p class="fuel-drop-notice">
      El aviso se configura para cuando el nivel deja de bajar, no cuando empieza. La revision del
      episodio es cada 10 minutos: una caida breve se avisa en la siguiente revision; si sigue
      bajando, al terminar.
    </p>
    <label
      ><span>Nivel de la alerta</span>
      <select v-model="model.severity" :disabled="!canManage">
        <option value="low">Informativa</option>
        <option value="medium">Advertencia</option>
        <option v-if="model.severity === 'high'" value="high">Alta</option>
        <option value="critical">Critica</option>
      </select>
    </label>
    <p class="fuel-drop-help">
      Decide el color y la prioridad en la bandeja. Esta condicion no calcula una gravedad: el nivel
      elegido ordena los avisos.
    </p>
    <p class="fuel-drop-help">
      Solo aplica a equipos que reportan nivel de combustible, con el vehiculo detenido. El detector
      de episodios debe estar conectado para generar los avisos.
    </p>
    <section class="fuel-drop-preview">
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
import { computed } from "vue"
const props = defineProps({ draft: { type: Object, required: true }, canManage: Boolean })
const model = computed(() => props.draft)
</script>
<style scoped>
.fuel-drop-settings {
  display: grid;
  gap: 14px;
  color: #102372;
}
.fuel-drop-notice {
  padding: 12px 14px;
  border: 1px solid #f4d177;
  border-radius: 6px;
  background: #fffbeb;
  color: #944400;
  font-size: 13px;
  line-height: 1.6;
}
label > span {
  display: block;
  font-size: 13px;
  font-weight: 800;
  margin-bottom: 8px;
}
select {
  width: 220px;
  max-width: 100%;
  height: 42px;
  padding: 0 12px;
  border: 1px solid #cfd8e6;
  border-radius: 6px;
  background: white;
  color: #102372;
  font-size: 14px;
}
.fuel-drop-help {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: #49618a;
}
.fuel-drop-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-top: 1px solid #d8e0eb;
  padding-top: 14px;
}
.fuel-drop-preview strong {
  display: block;
  color: #c95000;
  font-size: 11px;
  text-transform: uppercase;
}
.fuel-drop-preview span {
  display: block;
  margin-top: 3px;
  font-size: 13px;
  font-weight: 800;
}
small {
  display: block;
  font-size: 12px;
  color: #49618a;
  margin-top: 5px;
}
button {
  flex-shrink: 0;
  padding: 10px 12px;
  border: 1px solid #cfd8e6;
  border-radius: 6px;
  font-size: 12px;
  color: #7f93b3;
  cursor: not-allowed;
}
@media (max-width: 650px) {
  .fuel-drop-preview {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
