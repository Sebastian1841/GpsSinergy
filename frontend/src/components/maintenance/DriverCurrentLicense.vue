<template>
  <section class="current-license" aria-label="Licencia actual">
    <div class="license-identity"><span>RUT <strong>{{ driver.rut }}</strong></span><span>Clase <strong>{{ driver.classes.join(', ') }}</strong></span><span class="license-status" :class="state.key">{{ state.label }}</span></div>
    <dl class="license-dates">
      <div><dt>Fecha de vencimiento</dt><dd>{{ expiryDate }}</dd></div>
      <div><dt>{{ expirySummary.label }}</dt><dd :class="{ overdue: state.key === 'expired' }">{{ expirySummary.value }}</dd></div>
      <div><dt>Anticipacion del aviso</dt><dd>{{ driver.warningDays ?? 30 }} dias</dd></div>
    </dl>
    <div class="license-contact"><span>Telefono</span><a v-if="driver.phone" :href="'tel:' + driver.phone.replace(/[^+0-9]/g, '')">{{ driver.phone }}</a><strong v-else>No registrado</strong></div>
    <section class="license-followup">
      <div><h3>Seguimiento de renovacion</h3><strong>{{ management.label }}</strong><small v-if="management.appointmentDate">Fecha agendada: {{ appointmentDate }}</small></div>
      <button type="button" @click="$emit('manage')"><SvgIcon :name="canEdit ? 'pencil' : 'maintenance-time'" />{{ canEdit ? 'Actualizar seguimiento' : 'Ver seguimiento' }}</button>
    </section>
    <section class="license-documents">
      <h3>Fotografias de la licencia actual</h3>
      <div class="license-photo-grid">
        <template v-for="side in sides" :key="side.key">
          <button v-if="driver.photos?.[side.key]" type="button" class="license-photo" :aria-label="'Ampliar licencia: ' + side.label" @click="$emit('photo', side.key)">
            <img v-if="thumbnails[side.key]?.url" :src="thumbnails[side.key].url" :alt="'Licencia: ' + side.label" />
            <span v-else>{{ thumbnails[side.key]?.error ? 'Imagen no disponible' : 'Cargando imagen...' }}</span>
            <strong>{{ side.label }}</strong><small>Ampliar imagen</small>
          </button>
          <div v-else class="license-photo empty"><SvgIcon name="reporte" /><strong>{{ side.label }}</strong><small>Foto pendiente</small></div>
        </template>
      </div>
    </section>
    <div class="license-actions">
      <button type="button" @click="$emit('history')"><SvgIcon name="maintenance-time" />Historial</button>
      <button v-if="canEdit" type="button" @click="$emit('edit')"><SvgIcon name="pencil" />Editar datos y fotos</button>
      <button v-if="canEdit && state.key !== 'unknown'" type="button" class="primary" @click="$emit('renew')"><SvgIcon name="maintenance-calendar" />Renovar licencia</button>
    </div>
  </section>
</template>
<script setup>
import SvgIcon from '../icons/SvgIcon.vue'
defineProps({ driver: { type: Object, required: true }, state: { type: Object, required: true }, expirySummary: { type: Object, required: true }, expiryDate: { type: String, required: true }, management: { type: Object, required: true }, appointmentDate: { type: String, default: '' }, thumbnails: { type: Object, default: () => ({}) }, canEdit: Boolean })
defineEmits(['manage', 'photo', 'history', 'edit', 'renew'])
const sides = [{ key: 'front', label: 'Frente' }, { key: 'back', label: 'Reverso' }]
</script>
<style scoped>
.current-license { color: #102372; font-size: 13px; min-width: 0; }
.license-identity { display: flex; align-items: center; flex-wrap: wrap; gap: 20px; padding-bottom: 16px; }
.license-identity strong { margin-left: 8px; }
.license-status { margin-left: auto; padding: 5px 9px; border-radius: 4px; font-size: 12px; font-weight: 700; background: #eef2f7; }
.license-status.expired { color: #c22236; background: #fff0f2; }
.license-status.soon { color: #a35400; background: #fff3df; }
.license-status.valid { color: #008263; background: #dff6ed; }
.license-dates { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin: 0; padding: 16px; border-radius: 6px; background: #f0f4fa; }
dt { color: #52658c; margin-bottom: 8px; font-size: 12px; }
dd { margin: 0; font-size: 16px; font-weight: 700; overflow-wrap: anywhere; }
.overdue { color: #c22236; }
.license-contact { display: flex; gap: 16px; padding: 14px 0; border-bottom: 1px solid #d8e0eb; }
.license-contact span { color: #52658c; }
.license-contact a { color: inherit; }
.license-followup { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 16px 0; border-bottom: 1px solid #d8e0eb; }
h3 { font-size: 13px; margin: 0 0 10px; }
.license-followup small { display: block; color: #63748e; margin-top: 5px; }
.license-documents { padding: 16px 0; }
.license-photo-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.license-photo { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; min-height: 120px; padding: 10px; border: 1px solid #cfd9e8; border-radius: 5px; background: #f3f7fc; color: inherit; }
.license-photo img { height: 80px; max-width: 100%; object-fit: contain; }
.license-photo small, .license-photo > span { color: #63748e; font-size: 11px; }
.license-photo :deep(svg) { width: 24px; height: 24px; }
.license-actions { display: flex; justify-content: flex-end; flex-wrap: wrap; gap: 8px; padding-top: 12px; border-top: 1px solid #d8e0eb; }
button { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 8px 12px; min-height: 36px; border: 1px solid #cfd9e8; border-radius: 5px; background: #fff; color: inherit; font: inherit; font-weight: 600; cursor: pointer; }
button :deep(svg) { width: 16px; height: 16px; }
button.primary { background: #102f83; border-color: #102f83; color: #fff; }
button:focus-visible { outline: 2px solid #2967db; outline-offset: 2px; }
@media (max-width: 600px) { .license-dates { grid-template-columns: minmax(0, 1fr); } .license-followup { align-items: flex-start; flex-direction: column; } .license-actions button { flex: 1 1 auto; } }
</style>
