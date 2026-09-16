<template>
  <section class="alarm-modal-card">
    <div class="alarm-modal-card-title">
      <span class="alarm-step-number">1</span>
      <div class="min-w-0">
        <h3>Informacion general</h3>
      </div>
    </div>

    <label class="alarm-form-field mt-3">
      <span>Nombre de la alerta</span>
      <input
        v-model="draftModel.name"
        type="text"
        :disabled="!canManage"
        placeholder="Ej: Exceso de velocidad camiones"
      />
    </label>

    <label class="alarm-form-field mt-3">
      <span>Tipo de alerta</span>
      <select v-model="draftModel.type" :disabled="!canManage" @change="$emit('apply-type-preset')">
        <option v-for="option in typeOptions" :key="option.id" :value="option.id">
          {{ option.label }}
        </option>
      </select>
    </label>

    <label class="alarm-form-field mt-3">
      <span>Descripcion opcional</span>
      <textarea
        v-model="draftModel.description"
        :disabled="!canManage"
        rows="3"
        placeholder="Describe el proposito de esta alerta..."
      ></textarea>
    </label>
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
  typeOptions: {
    type: Array,
    default: () => [],
  },
})

defineEmits(["apply-type-preset"])

const draftModel = computed(() => props.draft)
</script>

<style scoped>
.alarm-modal-card {
  min-width: 0;
  border-radius: 0.75rem;
  border: 1px solid #d8e0eb;
  background: #ffffff;
  padding: 1rem;
}

.alarm-modal-card-title {
  display: flex;
  min-width: 0;
  margin-bottom: 0.875rem;
  gap: 0.75rem;
  align-items: flex-start;
}

.alarm-modal-card-title h3 {
  font-size: 1rem;
  line-height: 1.2;
  font-weight: 900;
  color: #102372;
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
.alarm-form-field select,
.alarm-form-field textarea {
  width: 100%;
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

.alarm-form-field input,
.alarm-form-field select {
  height: 2.625rem;
}

.alarm-form-field textarea {
  min-height: 5.25rem;
  padding-top: 0.625rem;
  resize: vertical;
}

.alarm-form-field input:focus,
.alarm-form-field select:focus,
.alarm-form-field textarea:focus {
  border-color: #102372;
  box-shadow: 0 0 0 2px rgb(16 35 114 / 0.1);
}

.alarm-form-field input:disabled,
.alarm-form-field select:disabled,
.alarm-form-field textarea:disabled {
  cursor: not-allowed;
  background: #f8fafc;
  color: #7f93b3;
}
</style>
