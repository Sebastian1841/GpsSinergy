<template>
  <section
    v-if="show && record"
    class="flex h-full min-h-0 w-full flex-col bg-white"
    aria-labelledby="audit-detail-title"
  >
    <!-- CABECERA -->
    <header
      class="flex shrink-0 items-center justify-between gap-4 border-b border-[#e6ebf2] px-5 py-4"
    >
      <h2 id="audit-detail-title" class="text-[16px] font-black text-[#102372]">
        Detalle del evento
      </h2>

      <button
        type="button"
        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-[#f3f6fa] hover:text-[#102372]"
        aria-label="Cerrar detalle"
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

    <!-- CONTENIDO -->
    <div class="min-h-0 flex-1 overflow-auto px-5 py-4">
      <dl class="grid gap-4">
        <!-- ACCIÓN -->
        <div class="detail-row">
          <dt class="detail-label">Acción</dt>

          <dd class="detail-value font-black text-[#102372]">
            {{ getActionLabel(record.action) }}
          </dd>
        </div>

        <!-- DESCRIPCIÓN -->
        <div class="detail-row">
          <dt class="detail-label">Descripción</dt>

          <dd class="detail-value leading-5">
            {{ record.description || "Sin descripción disponible." }}
          </dd>
        </div>

        <!-- RESPONSABLE -->
        <div class="detail-row">
          <dt class="detail-label">Usuario responsable</dt>

          <dd class="min-w-0">
            <div class="flex min-w-0 items-center gap-2.5">
              <span
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eef2f8] text-[11px] font-black text-[#102372]"
              >
                {{ getActorInitial(record.actorName) }}
              </span>

              <span class="min-w-0">
                <span class="block truncate text-[12px] font-black text-[#172033]">
                  {{ record.actorName || "Sin usuario" }}
                </span>

                <span class="mt-0.5 block truncate text-[11px] font-semibold text-slate-400">
                  {{ getRecordCompanyName(record) || "Sin empresa" }}
                </span>
              </span>
            </div>
          </dd>
        </div>

        <!-- ENTIDAD -->
        <div class="detail-row">
          <dt class="detail-label">Entidad</dt>

          <dd class="min-w-0">
            <p class="truncate text-[12px] font-black text-[#172033]">
              {{ record.entityName || "Sin entidad" }}
            </p>

            <p class="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-[10px] font-semibold text-slate-400">
              <span v-if="record.entityId"> ID: {{ record.entityId }} </span>

              <span v-if="record.entityType"> Tipo: {{ record.entityType }} </span>
            </p>
          </dd>
        </div>

        <!-- MÓDULO -->
        <div class="detail-row">
          <dt class="detail-label">Módulo</dt>

          <dd>
            <span
              class="inline-flex rounded-md bg-[#eef1ff] px-2.5 py-1 text-[11px] font-black text-[#102372]"
            >
              {{ getModuleLabel(record.module) }}
            </span>
          </dd>
        </div>

        <!-- IP -->
        <div class="detail-row">
          <dt class="detail-label">IP</dt>

          <dd class="detail-value">
            {{ recordIp }}
          </dd>
        </div>

        <!-- FECHA -->
        <div class="detail-row">
          <dt class="detail-label">Fecha y hora</dt>

          <dd class="detail-value">
            {{ formatDateTime(record.timestamp) }}
          </dd>
        </div>

        <!-- RESULTADO -->
        <div class="detail-row">
          <dt class="detail-label">Resultado</dt>

          <dd>
            <span
              class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-black"
              :class="getStatusClass(record.status)"
            >
              <span
                class="h-1.5 w-1.5 rounded-full"
                :class="getStatusDotClass(record.status)"
              ></span>

              {{ getStatusLabel(record.status) }}
            </span>
          </dd>
        </div>
      </dl>

      <!-- ANTES / DESPUÉS -->
      <section v-if="beforeEntries.length || afterEntries.length" class="mt-6">
        <h3 class="text-[14px] font-black text-[#102372]">Antes / Después</h3>

        <div class="mt-3 grid grid-cols-2 gap-3">
          <!-- ANTES -->
          <article class="min-w-0 rounded-xl border border-[#dfe5ed] bg-[#fafbfc] p-3">
            <p class="text-[11px] font-black text-[#ff6600]">Antes</p>

            <dl v-if="beforeEntries.length" class="mt-3 grid gap-3">
              <div v-for="entry in beforeEntries" :key="`before-${entry.label}`" class="min-w-0">
                <dt class="change-label">
                  {{ entry.label }}
                </dt>

                <dd class="change-value">
                  {{ entry.value }}
                </dd>
              </div>
            </dl>

            <p v-else class="mt-3 text-[11px] font-semibold text-slate-400">—</p>
          </article>

          <!-- DESPUÉS -->
          <article class="min-w-0 rounded-xl border border-[#dfe5ed] bg-[#fafbfc] p-3">
            <p class="text-[11px] font-black text-emerald-600">Después</p>

            <dl v-if="afterEntries.length" class="mt-3 grid gap-3">
              <div v-for="entry in afterEntries" :key="`after-${entry.label}`" class="min-w-0">
                <dt class="change-label">
                  {{ entry.label }}
                </dt>

                <dd class="change-value">
                  {{ entry.value }}
                </dd>
              </div>
            </dl>

            <p v-else class="mt-3 text-[11px] font-semibold text-slate-400">—</p>
          </article>
        </div>
      </section>

      <!-- DATOS ADICIONALES -->
      <section v-if="additionalDetails.length" class="mt-6 border-t border-[#edf1f5] pt-4">
        <h3 class="text-[13px] font-black text-[#102372]">Información adicional</h3>

        <dl class="mt-3 grid gap-3">
          <div
            v-for="detail in additionalDetails"
            :key="`${detail.section}-${detail.label}`"
            class="detail-row"
          >
            <dt class="detail-label">
              {{ detail.label }}
            </dt>

            <dd class="detail-value">
              {{ detail.value || "-" }}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  </section>
</template>

<script setup>
import { computed } from "vue"

const props = defineProps({
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

const recordIp = computed(() => {
  return (
    props.record?.ip ||
    props.record?.ipAddress ||
    props.record?.actorIp ||
    props.record?.metadata?.ip ||
    props.record?.context?.ip ||
    "-"
  )
})

const beforeEntries = computed(() => {
  return buildChangeEntries(
    props.record?.before ??
      props.record?.previous ??
      props.record?.oldValue ??
      props.record?.changes?.before ??
      props.record?.metadata?.before,
  )
})

const afterEntries = computed(() => {
  return buildChangeEntries(
    props.record?.after ??
      props.record?.next ??
      props.record?.newValue ??
      props.record?.changes?.after ??
      props.record?.metadata?.after,
  )
})

const additionalDetails = computed(() => {
  const excludedLabels = new Set(["Usuario", "Empresa", "Tipo"])

  return props.detailSections.flatMap((section) => {
    return section.details
      .filter((detail) => {
        return !excludedLabels.has(detail.label)
      })
      .map((detail) => {
        return {
          section: section.title,
          label: detail.label,
          value: detail.value,
        }
      })
  })
})

const getActorInitial = (name) => {
  const normalizedName = String(name || "").trim()

  if (!normalizedName) return "?"

  return normalizedName.charAt(0).toUpperCase()
}

const buildChangeEntries = (value) => {
  if (value === undefined || value === null) {
    return []
  }

  if (Array.isArray(value)) {
    return value.map((entry, index) => {
      return {
        label: `Valor ${index + 1}`,
        value: formatValue(entry),
      }
    })
  }

  if (typeof value === "object") {
    return Object.entries(value).map(([key, entryValue]) => {
      return {
        label: formatLabel(key),
        value: formatValue(entryValue),
      }
    })
  }

  return [
    {
      label: "Valor",
      value: formatValue(value),
    },
  ]
}

const formatLabel = (value) => {
  const labels = {
    active: "Estado",
    description: "Descripción",
    email: "Correo",
    name: "Nombre",
    role: "Rol",
    status: "Estado",
    username: "Usuario",
  }

  if (labels[value]) {
    return labels[value]
  }

  const normalized = String(value || "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()

  if (!normalized) return "Dato"

  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

const formatValue = (value) => {
  if (value === undefined || value === null) {
    return "—"
  }

  if (typeof value === "boolean") {
    return value ? "Sí" : "No"
  }

  if (Array.isArray(value)) {
    return value.length ? value.map(formatValue).join(", ") : "—"
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value)
    } catch {
      return "—"
    }
  }

  return String(value)
}
</script>

<style scoped>
.detail-row {
  display: grid;
  grid-template-columns: 118px minmax(0, 1fr);
  gap: 14px;
  align-items: start;
}

.detail-label {
  padding-top: 1px;
  font-size: 11px;
  font-weight: 800;
  line-height: 1.45;
  color: #526985;
}

.detail-value {
  min-width: 0;
  overflow-wrap: anywhere;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.55;
  color: #172033;
}

.change-label {
  font-size: 10px;
  font-weight: 700;
  color: #64748b;
}

.change-value {
  margin-top: 3px;
  overflow-wrap: anywhere;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.5;
  color: #334155;
}

@media (max-width: 420px) {
  .detail-row {
    grid-template-columns: 1fr;
    gap: 4px;
  }
}
</style>
