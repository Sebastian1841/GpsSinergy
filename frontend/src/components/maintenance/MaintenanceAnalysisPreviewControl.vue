<template>
  <div class="analysis-preview-control">
    <label><input type="checkbox" :checked="modelValue" @change="$emit('update:modelValue', $event.target.checked)" />Datos de muestra</label>
    <span v-if="modelValue">Vista previa · datos ficticios</span>
  </div>
</template>
<script setup>
defineProps({ modelValue: Boolean })
defineEmits(['update:modelValue'])
</script>
<style scoped>
.analysis-preview-control { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; color: #102372; font-size: 12px; }
label { display: inline-flex; align-items: center; gap: 7px; cursor: pointer; }
input { width: 14px; height: 14px; margin: 0; accent-color: #102372; cursor: pointer; }
span { color: #9a5100; }
</style>
