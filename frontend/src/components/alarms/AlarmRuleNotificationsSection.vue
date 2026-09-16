<template>
  <section class="alarm-modal-card alarm-modal-card-wide">
    <div class="alarm-modal-card-title">
      <span class="alarm-step-number">4</span>
      <div class="min-w-0">
        <h3>Notificaciones</h3>
        <p>Selecciona como recibiras las alertas.</p>
      </div>
    </div>

    <div class="alarm-notification-grid">
      <label
        class="alarm-notification-card"
        :class="{ 'is-selected': draftModel.notificationChannels.inApp }"
      >
        <input
          v-model="draftModel.notificationChannels.inApp"
          type="checkbox"
          :disabled="!canManage"
        />
        <span class="alarm-notification-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <rect x="4" y="5" width="16" height="11" rx="1.5" />
            <path d="M9 20h6" />
            <path d="M12 16v4" />
          </svg>
        </span>
        <span class="min-w-0">
          <strong>Notificacion en plataforma</strong>
          <small>Recibe las alertas dentro del sistema.</small>
        </span>
      </label>

      <label
        class="alarm-notification-card"
        :class="{ 'is-selected': draftModel.notificationChannels.email }"
      >
        <input
          v-model="draftModel.notificationChannels.email"
          type="checkbox"
          :disabled="!canManage"
        />
        <span class="alarm-notification-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m4 7 8 6 8-6" />
          </svg>
        </span>
        <span class="min-w-0">
          <strong>Correo electronico</strong>
          <small>Recibe las alertas en tu correo.</small>
        </span>
      </label>
    </div>
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
})

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

.alarm-modal-card-wide {
  grid-column: 1 / -1;
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

.alarm-modal-card-title p {
  margin-top: 0.2rem;
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.25;
  color: #49618a;
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

.alarm-notification-grid {
  display: grid;
  min-width: 0;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.alarm-notification-card {
  display: grid;
  min-width: 0;
  grid-template-columns: auto auto minmax(0, 1fr);
  align-items: center;
  gap: 0.875rem;
  border-radius: 0.625rem;
  border: 1px solid #d8e0eb;
  background: #ffffff;
  padding: 0.875rem 1rem;
  color: #102372;
  cursor: pointer;
  transition:
    border-color 0.16s ease,
    background 0.16s ease,
    box-shadow 0.16s ease;
}

.alarm-notification-card.is-selected {
  border-color: #8bbcff;
  background: #eef5ff;
  box-shadow: inset 0 0 0 1px rgb(37 99 235 / 0.08);
}

.alarm-notification-card input {
  width: 1.125rem;
  height: 1.125rem;
  accent-color: #2563eb;
}

.alarm-notification-icon {
  display: inline-flex;
  width: 1.875rem;
  height: 1.875rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  color: #102372;
}

.alarm-notification-icon svg {
  width: 1.25rem;
  height: 1.25rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.alarm-notification-card strong,
.alarm-notification-card small {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.alarm-notification-card strong {
  font-size: 0.8125rem;
  font-weight: 900;
}

.alarm-notification-card small {
  margin-top: 0.125rem;
  font-size: 0.6875rem;
  font-weight: 700;
  color: #5f7396;
}

@media (max-width: 767px) {
  .alarm-notification-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
