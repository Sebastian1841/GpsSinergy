<template>
  <section>
    <div class="flex items-center justify-between gap-3">
      <p class="text-[10px] font-black uppercase tracking-[0.12em] text-[#ff6600]">
        Notificaciones
      </p>

      <select
        :value="selectedNotificationType"
        class="h-9 rounded-lg border border-[#d8dee8] bg-white px-3 text-[10px] font-black uppercase tracking-[0.04em] text-[#102372] outline-none transition hover:border-[#ff6600] focus:border-[#ff6600] disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="draft.id === 'all'"
        @change="emit('add-notification', $event.target.value)"
      >
        <option value="" disabled>Anadir notificacion</option>

        <option
          v-for="notification in notificationOptions"
          :key="notification.id"
          :value="notification.id"
        >
          {{ notification.label }}
        </option>
      </select>
    </div>

    <div v-if="draft.id === 'all'" class="mt-3 rounded-lg bg-[#eef2f7] px-3 py-2">
      <p class="text-[11px] font-bold text-slate-500">
        Esta regla no ejecuta notificaciones configurables.
      </p>
    </div>

    <div v-else class="mt-3 grid gap-2">
      <div
        v-for="(notification, index) in draft.notifications"
        :key="notification.id"
        class="rounded-lg border border-[#edf1f5] bg-[#f8fafc] p-2"
      >
        <div class="mb-2 flex items-center justify-between gap-2">
          <label class="flex min-w-0 items-center gap-2">
            <input
              type="checkbox"
              class="h-3.5 w-3.5 shrink-0 accent-[#ff6600]"
              :checked="notification.enabled"
              @change="emit('update-notification', index, 'enabled', $event.target.checked)"
            />

            <span
              class="min-w-0 truncate rounded-md bg-[#eef3ff] px-2 py-1 text-[10px] font-black text-[#102372]"
            >
              {{ getNotificationLabel(notification.type) }}
            </span>
          </label>

          <button
            type="button"
            class="h-8 rounded-lg border border-[#d8dee8] bg-white px-3 text-[10px] font-black text-slate-500 transition hover:border-red-300 hover:text-red-600"
            @click="emit('remove-notification', index)"
          >
            Quitar
          </button>
        </div>

        <div class="grid gap-2 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:items-center">
          <label class="min-w-0">
            <span class="text-[9px] font-black uppercase text-slate-400">
              {{ getNotificationTargetLabel(notification.type) }}
            </span>

            <input
              :value="notification.target"
              type="text"
              class="mt-1 h-9 w-full rounded-lg border border-[#d8dee8] bg-white px-2 text-[11px] font-bold text-[#102372] outline-none focus:border-[#ff6600]"
              placeholder="Destino"
              @input="emit('update-notification', index, 'target', $event.target.value)"
            />
          </label>

          <label class="min-w-0">
            <span class="text-[9px] font-black uppercase text-slate-400">
              {{ getNotificationMessageLabel(notification.type) }}
            </span>

            <input
              :value="notification.message"
              type="text"
              class="mt-1 h-9 w-full rounded-lg border border-[#d8dee8] bg-white px-2 text-[11px] font-bold text-[#102372] outline-none focus:border-[#ff6600]"
              placeholder="{regla} detectado en {patente}"
              @input="emit('update-notification', index, 'message', $event.target.value)"
            />
          </label>
        </div>
      </div>

      <div v-if="!draft.notifications.length" class="rounded-lg bg-[#eef2f7] px-3 py-2">
        <p class="text-[11px] font-bold text-slate-500">
          Sin notificaciones configuradas. La regla solo quedara disponible para reportes.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  draft: {
    type: Object,
    required: true,
  },
  selectedNotificationType: {
    type: String,
    default: "",
  },
  notificationOptions: {
    type: Array,
    default: () => [],
  },
  getNotificationLabel: {
    type: Function,
    required: true,
  },
  getNotificationTargetLabel: {
    type: Function,
    required: true,
  },
  getNotificationMessageLabel: {
    type: Function,
    required: true,
  },
})

const emit = defineEmits(["add-notification", "remove-notification", "update-notification"])
</script>
