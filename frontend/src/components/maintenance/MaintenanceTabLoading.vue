<template>
  <div class="maintenance-tab-loading" role="status" aria-live="polite">
    <span>Cargando...</span>
    <div></div>
    <div></div>
    <div></div>
  </div>
</template>
<style scoped>
.maintenance-tab-loading {
  padding: 24px;
  color: #536988;
  font-size: 15px;
}
.maintenance-tab-loading div {
  height: 52px;
  margin-top: 14px;
  border-bottom: 1px solid #dce3ee;
  background: #f2f5f8;
  border-radius: 4px;
}
</style>
