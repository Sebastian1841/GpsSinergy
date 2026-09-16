<template>
  <section class="min-h-0 overflow-hidden rounded-lg border border-[#d8e0eb] bg-white shadow-sm">
    <div
      class="grid h-10 items-center border-b border-[#e2e8f0] bg-[#f8fbff] px-4 text-[10px] font-black uppercase tracking-[0.08em] text-[#5f7396] md:grid-cols-[minmax(220px,1.15fr)_140px_minmax(120px,0.8fr)_minmax(180px,1fr)_160px_168px]"
    >
      <span>Alerta</span>
      <span class="hidden md:block">Tipo</span>
      <span class="hidden md:block">Condicion</span>
      <span class="hidden md:block">Aplicado a</span>
      <span class="hidden md:block">Estado</span>
      <span class="hidden text-right md:block">Acciones</span>
    </div>

    <div class="min-h-0 overflow-y-auto">
      <article
        v-for="rule in rows"
        :key="rule.id"
        class="alarm-rule-row"
        :class="selectedRuleId === rule.id && !isCreatingRule ? 'is-selected' : ''"
        @click="$emit('select-rule', rule.id)"
      >
        <div class="flex min-w-0 items-center gap-3">
          <span class="alarm-rule-icon" :class="getTypeTone(rule.type)">
            <SvgIcon :name="getTypeIcon(rule.type)" class="h-4 w-4" />
          </span>

          <span class="min-w-0">
            <span class="block truncate text-[12px] font-black text-[#102372]">
              {{ rule.name }}
            </span>
            <span class="mt-0.5 block truncate text-[10px] font-bold uppercase text-[#8aa0bd]">
              {{ rule.severityLabel }}
            </span>
          </span>
        </div>

        <div class="hidden min-w-0 text-[12px] font-semibold text-[#315078] md:block">
          {{ rule.typeLabel }}
        </div>

        <div class="hidden min-w-0 text-[12px] font-black text-[#102372] md:block">
          {{ rule.conditionLabel }}
        </div>

        <div class="hidden min-w-0 md:block">
          <p class="truncate text-[12px] font-black text-[#102372]">{{ rule.companyName }}</p>
          <p class="mt-0.5 truncate text-[10px] font-semibold text-[#5f7396]">
            {{ rule.targetLabel }}
          </p>
        </div>

        <div class="hidden min-w-0 items-center justify-between gap-2 md:flex">
          <span
            class="inline-flex w-[104px] items-center justify-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-black"
            :class="rule.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'"
          >
            <span
              class="h-2 w-2 rounded-full"
              :class="rule.enabled ? 'bg-[#10b981]' : 'bg-[#94a3b8]'"
            ></span>
            {{ rule.enabled ? "Activa" : "Desactivada" }}
          </span>

          <button
            type="button"
            class="alarm-switch"
            :class="rule.enabled ? 'is-on' : ''"
            :aria-label="rule.enabled ? 'Desactivar alerta' : 'Activar alerta'"
            :disabled="!canManage"
            @click.stop="$emit('toggle-rule', rule.id)"
          >
            <span></span>
          </button>
        </div>

        <div class="flex items-center justify-end gap-2">
          <button
            type="button"
            class="alarm-row-action"
            @click.stop="$emit('select-rule', rule.id)"
          >
            <SvgIcon name="pencil" class="h-4 w-4" />
            Editar
          </button>

          <button
            type="button"
            class="alarm-row-icon-action"
            :disabled="!canManage"
            aria-label="Eliminar regla"
            @click.stop="$emit('delete-rule', rule.id)"
          >
            <SvgIcon name="trash" class="h-4 w-4" />
          </button>
        </div>
      </article>

      <div
        v-if="!rows.length"
        class="flex min-h-[18rem] flex-col items-center justify-center rounded-lg border border-dashed border-[#cfd8e6] bg-[#f8fafc] px-5 text-center"
      >
        <p class="text-[15px] font-black text-[#102372]">Sin reglas para mostrar</p>
        <p class="mt-1 max-w-sm text-[11px] font-semibold leading-5 text-slate-500">
          Ajusta los filtros o crea una nueva regla automatica.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup>
import SvgIcon from "../icons/SvgIcon.vue"

defineProps({
  rows: {
    type: Array,
    default: () => [],
  },
  selectedRuleId: {
    type: String,
    default: "",
  },
  isCreatingRule: {
    type: Boolean,
    default: false,
  },
  canManage: {
    type: Boolean,
    default: false,
  },
})

defineEmits(["delete-rule", "select-rule", "toggle-rule"])

const getTypeIcon = (type) => {
  if (type === "speeding") return "alertas"
  if (type === "battery") return "dispositivos"
  if (type === "no_signal") return "bell"
  if (type === "geofence") return "mapa"
  if (type === "fuel") return "fuentes"

  return "configuracion"
}

const getTypeTone = (type) => {
  if (type === "speeding") return "is-danger"
  if (type === "battery") return "is-warning"
  if (type === "geofence") return "is-purple"
  if (type === "fuel") return "is-red"

  return "is-blue"
}
</script>

<style scoped>
.alarm-rule-row {
  display: grid;
  min-width: 0;
  cursor: pointer;
  grid-template-columns:
    minmax(220px, 1.15fr) 140px minmax(120px, 0.8fr) minmax(180px, 1fr)
    160px 168px;
  align-items: center;
  gap: 0.75rem;
  min-height: 4.375rem;
  border-bottom: 1px solid #e2e8f0;
  background: #ffffff;
  padding: 0.625rem 1rem;
  transition:
    background-color 0.16s ease,
    box-shadow 0.16s ease;
}

.alarm-rule-row:hover,
.alarm-rule-row.is-selected {
  background: #f8fbff;
}

.alarm-rule-row.is-selected {
  box-shadow: inset 3px 0 0 #102372;
}

.alarm-rule-icon {
  display: inline-flex;
  width: 2.125rem;
  height: 2.125rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
}

.alarm-rule-icon.is-warning {
  color: #ff8a00;
  background: #fff7e8;
}

.alarm-rule-icon.is-danger {
  color: #ef1b23;
  background: #fff0f0;
}

.alarm-rule-icon.is-purple {
  color: #7c3aed;
  background: #f3edff;
}

.alarm-rule-icon.is-red {
  color: #ef1b23;
  background: #fff0f0;
}

.alarm-rule-icon.is-blue {
  color: #2563eb;
  background: #eef5ff;
}

.alarm-switch {
  appearance: none;
  position: relative;
  width: 2.375rem;
  height: 1.25rem;
  flex-shrink: 0;
  cursor: pointer;
  overflow: hidden;
  border: 0;
  border-radius: 999px;
  background: #cbd5e1;
  padding: 0;
  transition: background-color 0.12s ease-out;
}

.alarm-switch > span {
  position: absolute;
  top: 0.1875rem;
  left: 0.1875rem;
  width: 0.875rem;
  height: 0.875rem;
  border-radius: 999px;
  background: #ffffff;
  box-shadow: 0 1px 2px rgb(15 23 42 / 0.18);
  transition: transform 0.12s ease-out;
}

.alarm-switch.is-on {
  background: #10b981;
}

.alarm-switch.is-on > span {
  transform: translateX(1.125rem);
}

.alarm-switch:focus-visible {
  outline: 2px solid rgb(16 35 114 / 0.28);
  outline-offset: 2px;
}

.alarm-row-action,
.alarm-row-icon-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  border: 1px solid #cfd8e6;
  background: #ffffff;
  font-weight: 900;
  color: #102372;
  transition:
    border-color 0.16s ease,
    color 0.16s ease,
    background-color 0.16s ease;
}

.alarm-row-action {
  height: 2.25rem;
  gap: 0.375rem;
  padding: 0 0.75rem;
  font-size: 0.75rem;
}

.alarm-row-icon-action {
  width: 2.25rem;
  height: 2.25rem;
}

.alarm-row-action:hover,
.alarm-row-icon-action:hover {
  border-color: #ff6600;
  color: #ff6600;
  background: #fff8f3;
}

.alarm-row-icon-action:disabled,
.alarm-switch:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

@media (max-width: 767px) {
  .alarm-rule-row {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
