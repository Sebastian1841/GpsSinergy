<template>
  <div
    v-if="show && record"
    class="fixed inset-0 z-[940] flex items-end justify-center bg-slate-950/50 p-2 sm:items-center sm:p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="audit-detail-title"
    tabindex="-1"
    @click.self="emit('close')"
    @keydown.esc="emit('close')"
  >
    <section
      class="flex max-h-[calc(100vh-16px)] w-full max-w-2xl flex-col overflow-hidden rounded-t-xl border border-slate-200 bg-white shadow-2xl sm:max-h-[calc(100vh-32px)] sm:rounded-xl"
    >
      <header
        class="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-4"
      >
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <span
              class="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600"
            >
              {{ getModuleLabel(record.module) }}
            </span>

            <span
              class="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-semibold"
              :class="getStatusClass(record.status)"
            >
              <span
                class="h-1.5 w-1.5 rounded-full"
                :class="getStatusDotClass(record.status)"
              ></span>

              {{ getStatusLabel(record.status) }}
            </span>

            <span
              v-if="record.severity === 'warning'"
              class="rounded-md bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700"
            >
              {{ getSeverityLabel(record.severity) }}
            </span>
          </div>

          <h2
            id="audit-detail-title"
            class="mt-3 truncate text-lg font-bold tracking-tight text-[#102372]"
          >
            {{ getActionLabel(record.action) }}
          </h2>

          <p class="mt-1 text-xs text-slate-400">
            {{ formatDateTime(record.timestamp) }}
          </p>
        </div>

        <button
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          type="button"
          aria-label="Cerrar modal"
          @click="emit('close')"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </header>

      <div class="min-h-0 flex-1 overflow-auto">
        <section class="border-b border-slate-200 px-5 py-4">
          <p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Descripcion
          </p>

          <p class="mt-2 text-xs leading-5 text-slate-600">
            {{ record.description || "Sin descripcion disponible." }}
          </p>
        </section>

        <section class="grid border-b border-slate-200 sm:grid-cols-2">
          <div class="border-b border-slate-200 px-5 py-4 sm:border-b-0 sm:border-r">
            <p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Responsable
            </p>

            <p class="mt-2 truncate text-sm font-semibold text-slate-800">
              {{ record.actorName || "Sin usuario" }}
            </p>

            <p class="mt-1 truncate text-xs text-slate-500">
              {{ getRecordCompanyName(record) || "Sin empresa" }}
            </p>
          </div>

          <div class="px-5 py-4">
            <p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Entidad afectada
            </p>

            <p class="mt-2 truncate text-sm font-semibold text-slate-800">
              {{ record.entityName || "Sin entidad" }}
            </p>

            <p class="mt-1 truncate text-xs text-slate-500">
              {{ record.entityType || "Sin tipo" }}
            </p>
          </div>
        </section>

        <section class="px-5 py-4">
          <p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Informacion del registro
          </p>

          <dl class="mt-3 divide-y divide-slate-100">
            <div v-for="section in detailSections" :key="section.title">
              <div
                v-for="detail in section.details"
                :key="`${section.title}-${detail.label}`"
                class="grid grid-cols-[120px_minmax(0,1fr)] gap-4 py-3 first:pt-0 last:pb-0"
              >
                <dt class="text-xs font-medium text-slate-400">
                  {{ detail.label }}
                </dt>

                <dd class="break-words text-right text-xs font-semibold text-slate-700">
                  {{ detail.value || "-" }}
                </dd>
              </div>
            </div>

            <div class="grid grid-cols-[120px_minmax(0,1fr)] gap-4 py-3 first:pt-0 last:pb-0">
              <dt class="text-xs font-medium text-slate-400">Accion</dt>

              <dd class="break-words text-right font-mono text-xs font-semibold text-slate-700">
                {{ record.action || "-" }}
              </dd>
            </div>

            <div class="grid grid-cols-[120px_minmax(0,1fr)] gap-4 py-3 first:pt-0 last:pb-0">
              <dt class="text-xs font-medium text-slate-400">Modulo</dt>

              <dd class="break-words text-right text-xs font-semibold text-slate-700">
                {{ getModuleLabel(record.module) }}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <footer
        class="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3"
      >
        <span class="font-mono text-[10px] text-slate-400"> ID: {{ record.id }} </span>

        <button
          class="h-8 rounded-lg bg-[#102372] px-4 text-xs font-semibold text-white transition hover:bg-[#0b1f55]"
          type="button"
          @click="emit('close')"
        >
          Cerrar
        </button>
      </footer>
    </section>
  </div>
</template>

<script setup>
defineProps({
  detailSections: {
    type: Array,
    default: () => [],
  },
  formatDateTime: {
    type: Function,
    required: true,
  },
  getActionLabel: {
    type: Function,
    required: true,
  },
  getModuleLabel: {
    type: Function,
    required: true,
  },
  getRecordCompanyName: {
    type: Function,
    required: true,
  },
  getSeverityLabel: {
    type: Function,
    required: true,
  },
  getStatusClass: {
    type: Function,
    required: true,
  },
  getStatusDotClass: {
    type: Function,
    required: true,
  },
  getStatusLabel: {
    type: Function,
    required: true,
  },
  record: {
    type: Object,
    default: null,
  },
  show: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(["close"])
</script>
