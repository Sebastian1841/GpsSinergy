<template>
  <section class="license-notification-fields" aria-label="Notificaciones">
    <div class="notification-heading">
      <SvgIcon name="bell" />
      <div><h3>Avisos de vencimiento</h3><p>La anticipacion determina cuando la licencia aparece por vencer.</p></div>
      <span class="integration-status">Integracion pendiente</span>
    </div>
    <div class="notification-settings">
    <div><h4>Canales de envio (no disponibles)</h4>
    <fieldset disabled class="notification-channels">
    <div class="notification-channel">
      <label class="channel-toggle"><span>Email</span><input type="checkbox" :checked="modelValue.email.enabled" :disabled="disabled" @change="update('email', 'enabled', $event.target.checked)" /></label>
      <input v-if="modelValue.email.enabled" type="email" aria-label="Email para notificaciones" placeholder="correo@empresa.cl" maxlength="254" :value="modelValue.email.address" :disabled="disabled" required @input="update('email', 'address', $event.target.value)" />
    </div>
    <div class="notification-channel">
      <label class="channel-toggle"><span>WhatsApp</span><input type="checkbox" :checked="modelValue.whatsapp.enabled" :disabled="disabled" @change="update('whatsapp', 'enabled', $event.target.checked)" /></label>
      <input v-if="modelValue.whatsapp.enabled" type="tel" aria-label="WhatsApp para notificaciones" placeholder="+56912345678" maxlength="24" :value="modelValue.whatsapp.phone" :disabled="disabled" required @input="update('whatsapp', 'phone', $event.target.value)" />
    </div>
    </fieldset>
    </div>
    <div v-if="$slots.default" class="notification-advance"><slot /></div>
    </div>
    <p class="notification-info">Los canales estaran disponibles cuando se complete la integracion.</p>
  </section>
</template>
<script setup>
import SvgIcon from '../icons/SvgIcon.vue'
const props = defineProps({
  modelValue: { type: Object, required: true },
  disabled: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])
const update = (channel, field, value) => emit('update:modelValue', {
  ...props.modelValue,
  [channel]: { ...props.modelValue[channel], [field]: value },
})
</script>
<style scoped>
.license-notification-fields { grid-column: 1 / -1; min-width: 0; margin-top: 16px; padding: 16px 20px; border: 1px solid #dce3ee; border-radius: 8px; background: #fcfdff; color: #102372; font-size: 14px; }
.notification-heading { display: flex; align-items: center; gap: 16px; margin-bottom: 18px; }
.notification-heading > :deep(.svg-icon-wrapper) { display: inline-flex; align-items: center; justify-content: center; width: 42px; height: 42px; flex: 0 0 42px; border-radius: 8px; background: #e8eeff; color: #2151df; }
.notification-heading :deep(svg) { width: 22px; height: 22px; }
.notification-heading h3 { margin: 0 0 4px; font-size: 18px; }
.notification-heading p { margin: 0; color: #63748e; }
.notification-settings { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
h4 { margin: 0; font-size: 14px; }
.notification-advance { border-left: 1px solid #cfd9e8; padding-left: 32px; }
.notification-info { margin: 18px 0 0; padding: 8px 12px; border-radius: 5px; background: #e8eeff; font-size: 12px; }
.notification-channels { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; border: 0; padding: 0; margin: 0; min-width: 0; }
.integration-status { margin-left: auto; padding: 6px 10px; border-radius: 5px; background: #e8eeff; color: #63748e; font-size: 12px; font-weight: 400; }
.configured { margin-left: 8px; color: #178164; font-size: 11px; }
.notification-channel { margin-top: 16px; }
.channel-toggle { display: inline-flex; flex-direction: row-reverse; align-items: center; justify-content: flex-end; gap: 8px; cursor: pointer; font-weight: 600; }
input[type=checkbox] { width: 14px; height: 14px; margin: 0; accent-color: #102372; cursor: pointer; }
input:not([type=checkbox]) { width: 100%; min-width: 0; height: 36px; margin-top: 8px; padding: 8px 10px; border: 1px solid #cfd9e8; border-radius: 5px; background: #fff; color: #102372; font: inherit; }
input:focus-visible { outline: 2px solid #2967db; outline-offset: 2px; }
input:disabled { cursor: default; opacity: .6; }
@media (max-width: 600px) { .notification-channels { grid-template-columns: minmax(0, 1fr); gap: 0; } .integration-status { float: none; display: block; margin: 6px 0 0 14px; } }
@media (max-width: 600px) { .notification-settings { grid-template-columns: minmax(0, 1fr); gap: 18px; } .notification-advance { border-left: 0; padding-left: 0; } .notification-heading { flex-wrap: wrap; } }
</style>
