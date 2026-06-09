<template>
  <div
    v-if="modelValue && company"
    class="fixed inset-0 z-[770] flex items-center justify-center bg-[#102372]/45 p-2 sm:p-4"
    @click.self="$emit('close')"
  >
    <section
      class="flex h-[calc(100%-16px)] max-h-[680px] w-full max-w-[920px] flex-col overflow-hidden rounded-lg border border-[#102372] bg-white shadow-2xl sm:h-[calc(100%-32px)]"
    >
      <header class="shrink-0 bg-[#102372] px-4 py-3">
        <div class="flex items-start justify-between gap-3">
          <div class="flex min-w-0 items-center gap-3">
            <div
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#FF6600] text-[12px] font-black text-white"
            >
              {{ getCompanyInitials(company.name) }}
            </div>

            <div class="min-w-0">
              <div class="flex min-w-0 items-center gap-2">
                <h2 class="truncate text-[16px] font-black text-white">
                  {{ company.name }}
                </h2>
                <span
                  class="hidden shrink-0 rounded-full px-2 py-1 text-[9px] font-black sm:inline-flex"
                  :class="getCompanyStatusAccentClass(company.status)"
                >
                  {{ getCompanyStatusLabel(company.status) }}
                </span>
              </div>
              <p class="mt-0.5 truncate text-[10px] font-semibold text-white/65">
                {{ company.rut }} - {{ company.city || "Sin ciudad" }},
                {{ company.region || "Sin region" }}
              </p>
            </div>
          </div>

          <div class="flex shrink-0 items-center gap-2">
            <button
              type="button"
              class="hidden h-9 rounded-lg border border-white/35 bg-white/10 px-3 text-[10px] font-black text-white transition hover:bg-white/20 sm:inline-flex sm:items-center"
              @click="$emit('edit-company')"
            >
              Editar datos
            </button>

            <button
              type="button"
              class="hidden h-9 items-center justify-center rounded-lg bg-[#FF6600] px-3 text-[10px] font-black text-white transition hover:bg-[#e65c00] sm:inline-flex"
              @click="$emit('enter-company', company)"
            >
              Abrir empresa
            </button>

            <button
              type="button"
              class="h-9 w-9 rounded-lg border border-white/30 bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white"
              aria-label="Cerrar"
              @click="$emit('close')"
            >
              <svg viewBox="0 0 24 24" class="mx-auto h-4 w-4" fill="none" aria-hidden="true">
                <path
                  d="m7 7 10 10M17 7 7 17"
                  stroke="currentColor"
                  stroke-width="2.2"
                  stroke-linecap="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div class="grid min-h-0 flex-1 md:grid-cols-[190px_minmax(0,1fr)]">
        <aside
          class="flex shrink-0 gap-1 overflow-x-auto border-b border-[#d9d9d9] bg-white p-2 md:flex-col md:overflow-visible md:border-b-0 md:border-r md:p-3"
        >
          <button
            v-for="tab in tabs"
            :key="tab.id"
            type="button"
            class="flex h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-left text-[11px] font-black transition md:w-full"
            :class="
              activeTab === tab.id
                ? 'bg-[#fff3eb] text-[#102372] shadow-sm ring-1 ring-[#FF6600]'
                : 'text-[#102372] hover:bg-[#eef2f7]'
            "
            @click="activeTab = tab.id"
          >
            <svg viewBox="0 0 24 24" class="h-4 w-4 shrink-0" fill="none" aria-hidden="true">
              <path
                :d="tab.icon"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <span>{{ tab.label }}</span>
          </button>

          <div class="hidden min-h-3 flex-1 md:block"></div>

          <div class="hidden border-t border-[#d9d9d9] pt-3 md:block">
            <p class="text-[9px] font-black uppercase text-[#FF6600]">Ultima senal</p>
            <p class="mt-1 truncate text-[10px] font-black text-[#102372]">
              {{ company.lastTelemetryAt || "Sin telemetria" }}
            </p>

            <button
              type="button"
              class="mt-3 h-9 w-full rounded-lg border border-[#FF6600] bg-white text-[10px] font-black text-[#FF6600] transition hover:bg-[#fff3eb]"
              @click="$emit('toggle-company-status')"
            >
              {{ company.status === "active" ? "Suspender empresa" : "Activar empresa" }}
            </button>
          </div>
        </aside>

        <main class="min-h-0 overflow-auto bg-[#eef2f7] p-3 sm:p-4">
          <div v-if="activeTab === 'summary'" class="grid gap-4">
            <section>
              <div class="mb-2 flex items-end justify-between gap-3">
                <div>
                  <p class="text-[10px] font-black uppercase tracking-[0.1em] text-[#FF6600]">
                    Estado actual
                  </p>
                  <h3 class="mt-0.5 text-[15px] font-black text-[#102372]">Resumen operativo</h3>
                </div>

                <span
                  class="shrink-0 rounded-full px-2 py-1 text-[9px] font-black sm:hidden"
                  :class="getCompanyStatusAccentClass(company.status)"
                >
                  {{ getCompanyStatusLabel(company.status) }}
                </span>
              </div>

              <div
                class="grid overflow-hidden rounded-lg border border-[#d9d9d9] bg-white sm:grid-cols-4 sm:divide-x sm:divide-[#d9d9d9]"
              >
                <div
                  v-for="metric in operationalMetrics"
                  :key="metric.label"
                  class="border-b border-[#d9d9d9] px-3 py-3 last:border-b-0 sm:border-b-0"
                >
                  <p class="text-[9px] font-black uppercase text-[#FF6600]">
                    {{ metric.label }}
                  </p>
                  <p class="mt-1 text-[19px] font-black" :class="metric.className">
                    {{ metric.value }}
                  </p>
                </div>
              </div>
            </section>

            <section class="overflow-hidden rounded-lg border border-[#d9d9d9] bg-white">
              <header class="border-b border-[#d9d9d9] bg-[#eef2f7] px-3 py-2.5">
                <h3 class="text-[12px] font-black text-[#102372]">Informacion de la empresa</h3>
              </header>

              <dl class="grid md:grid-cols-2">
                <div
                  v-for="detail in companyDetails"
                  :key="detail.label"
                  class="grid grid-cols-[110px_minmax(0,1fr)] gap-3 border-b border-[#d9d9d9] px-3 py-3 odd:md:border-r"
                >
                  <dt class="text-[9px] font-black uppercase text-[#FF6600]">
                    {{ detail.label }}
                  </dt>
                  <dd class="min-w-0 truncate text-[11px] font-black text-[#102372]">
                    {{ detail.value }}
                  </dd>
                </div>
              </dl>
            </section>

            <div class="grid grid-cols-2 gap-2 sm:hidden">
              <button
                type="button"
                class="h-10 rounded-lg border border-[#102372] bg-white text-[10px] font-black text-[#102372]"
                @click="$emit('edit-company')"
              >
                Editar datos
              </button>
              <button
                type="button"
                class="inline-flex h-10 items-center justify-center rounded-lg bg-[#FF6600] text-[10px] font-black text-white"
                @click="$emit('enter-company', company)"
              >
                Abrir empresa
              </button>
            </div>
          </div>

          <CompanyReportPanel
            v-if="activeTab === 'reports'"
            :company="company"
            :report-types="reportTypes"
            @toggle-report="$emit('toggle-company-report', $event)"
          />

          <GestionSucursalesPanel
            v-if="activeTab === 'sucursales'"
            :company="company"
            @alternar-sucursales-habilitadas="$emit('alternar-sucursales-habilitadas')"
            @agregar-sucursal="$emit('agregar-sucursal', $event)"
            @actualizar-nombre-sucursal="handleActualizarNombreSucursal"
            @alternar-estado-sucursal="$emit('alternar-estado-sucursal', $event)"
            @eliminar-sucursal="$emit('eliminar-sucursal', $event)"
            @actualizar-sucursal-activo="$emit('actualizar-sucursal-activo', $event)"
          />
        </main>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue"

import GestionSucursalesPanel from "../activos/sucursales/GestionSucursalesPanel.vue"
import CompanyReportPanel from "./CompanyReportPanel.vue"

import {
  getCompanyInitials,
  getCompanyStatusLabel,
  getEnabledCompanyReports,
} from "../../utils/companies/companyUtils.js"

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  company: {
    type: Object,
    default: null,
  },
  reportTypes: {
    type: Array,
    default: () => [],
  },
  getCompanyHealth: {
    type: Function,
    required: true,
  },
})

const emit = defineEmits([
  "close",
  "edit-company",
  "toggle-company-status",
  "toggle-company-report",
  "alternar-sucursales-habilitadas",
  "agregar-sucursal",
  "actualizar-nombre-sucursal",
  "alternar-estado-sucursal",
  "eliminar-sucursal",
  "actualizar-sucursal-activo",
  "enter-company",
])

const activeTab = ref("summary")

const tabs = [
  {
    id: "summary",
    label: "Resumen",
    icon: "M4 13h6V4H4v9Zm10 7h6v-9h-6v9ZM4 20h6v-3H4v3Zm10-13h6V4h-6v3Z",
  },
  {
    id: "reports",
    label: "Reportes",
    icon: "M6 20V10m6 10V4m6 16v-7",
  },
  {
    id: "sucursales",
    label: "Sucursales",
    icon: "M4 20V8l8-4 8 4v12M8 20v-6h8v6M9 10h.01M15 10h.01",
  },
]

const operationalMetrics = computed(() => [
  {
    label: "Activos",
    value: props.company?.assetsCount || 0,
    className: "text-[#102372]",
  },
  {
    label: "En linea",
    value: props.company?.activeAssetsCount || 0,
    className: "text-[#FF6600]",
  },
  {
    label: "Moviendo",
    value: props.company?.movingAssetsCount || 0,
    className: "text-[#102372]",
  },
  {
    label: "Salud",
    value: `${props.getCompanyHealth(props.company)}%`,
    className: "text-[#102372]",
  },
])

const getCompanyStatusAccentClass = (status) => {
  return status === "active"
    ? "bg-[#fff3eb] text-[#FF6600]"
    : "bg-white text-[#102372] ring-1 ring-white/40"
}

const companyDetails = computed(() => [
  {
    label: "Contacto",
    value: props.company?.contactName || "Sin contacto",
  },
  {
    label: "Correo",
    value: props.company?.contactEmail || "Sin correo",
  },
  {
    label: "Telefono",
    value: props.company?.contactPhone || "Sin telefono",
  },
  {
    label: "Ubicacion",
    value: `${props.company?.city || "-"} - ${props.company?.region || "-"}`,
  },
  {
    label: "Cuenta",
    value: `${props.company?.usersCount || 0} usuarios - ${
      props.company?.sucursales?.length || 0
    } sucursales`,
  },
  {
    label: "Reportes",
    value: `${getEnabledCompanyReports(props.company).length} habilitados`,
  },
])

watch(
  () => [props.modelValue, props.company?.id],
  ([isOpen]) => {
    if (isOpen) activeTab.value = "summary"
  },
)

const handleActualizarNombreSucursal = (sucursalId, nombreSucursal) => {
  emit("actualizar-nombre-sucursal", sucursalId, nombreSucursal)
}
</script>
