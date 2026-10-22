<template>
  <div
    v-if="modelValue"
    class="company-editor-overlay fixed inset-0 z-[780] flex items-center justify-center p-2 sm:p-4"
    @click.self="$emit('close')"
  >
    <section
      role="dialog"
      aria-modal="true"
      aria-labelledby="company-editor-title"
      class="company-editor-dialog flex max-h-[calc(100%-16px)] w-full max-w-[800px] flex-col overflow-hidden rounded-lg bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)] sm:max-h-[calc(100%-32px)]"
    >
      <header class="company-editor-heading shrink-0 border-b border-[#dce3ee] px-6 py-5">
        <div class="flex items-start justify-between gap-3">
          <div class="flex min-w-0 items-center gap-3">
            <div
              class="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-[#edf2ff] text-[#1460df]"
            >
              <SvgIcon name="empresa" class="h-7 w-7" />
            </div>

            <div class="min-w-0">
              <h2 id="company-editor-title" class="text-[24px] font-bold text-[#10234c]">
                {{ mode === "edit" ? draftCompany.name || "Editar empresa" : "Nueva empresa" }}
              </h2>
              <p class="mt-1 text-[14px] text-[#52658c]">
                {{
                  mode === "edit"
                    ? draftCompany.rut || "Sin RUT"
                    : "Datos principales de la empresa"
                }}
              </p>
            </div>
          </div>

          <button
            type="button"
            class="h-10 w-10 shrink-0 rounded-md border border-[#dce3ee] bg-white text-[#102372] hover:bg-[#f5f6f8]"
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
      </header>

      <div class="company-editor-body min-h-0 flex-1 overflow-auto bg-white p-4">
        <div class="grid gap-4 md:grid-cols-2">
          <section class="overflow-hidden rounded-lg border border-[#d9d9d9] bg-white">
            <header class="border-b border-[#102372] bg-[#102372] px-3 py-2">
              <h3><SvgIcon name="empresa" />Empresa</h3>
              <p>Informacion basica de la empresa</p>
            </header>

            <div class="grid gap-2.5 p-2.5 sm:grid-cols-2">
              <label class="grid gap-1 sm:col-span-2">
                <span class="text-[9px] font-black uppercase text-[#FF6600]"> Nombre empresa </span>
                <input
                  :value="draftCompany.name"
                  type="text"
                  placeholder="Nombre legal o comercial"
                  class="company-editor-field"
                  @input="updateField('name', $event.target.value)"
                />
              </label>

              <label class="grid gap-1">
                <span class="text-[9px] font-black uppercase text-[#FF6600]">RUT</span>
                <input
                  :value="formatCompanyRut(draftCompany.rut)"
                  type="text"
                  maxlength="12"
                  autocapitalize="characters"
                  spellcheck="false"
                  placeholder="76.000.000-0"
                  class="company-editor-field"
                  @input="updateField('rut', $event.target.value, $event.target)"
                />
              </label>

              <label class="grid gap-1">
                <span class="text-[9px] font-black uppercase text-[#FF6600]">
                  Estado operativo
                </span>
                <select
                  :value="draftCompany.status"
                  class="company-editor-field cursor-pointer font-black"
                  @change="updateField('status', $event.target.value)"
                >
                  <option value="active">Activa</option>
                  <option value="pending">Pendiente</option>
                  <option value="inactive">Suspendida</option>
                  <option value="internal">Interna</option>
                </select>
              </label>
            </div>
          </section>

          <section class="overflow-hidden rounded-lg border border-[#d9d9d9] bg-white">
            <header class="border-b border-[#102372] bg-[#102372] px-3 py-2">
              <h3><SvgIcon name="user" />Contacto principal</h3>
              <p>Persona de contacto en la empresa</p>
            </header>

            <div class="grid gap-2.5 p-2.5">
              <label class="grid gap-1">
                <span class="text-[9px] font-black uppercase text-[#FF6600]">
                  Nombre contacto
                </span>
                <input
                  :value="draftCompany.contactName"
                  type="text"
                  placeholder="Nombre del responsable"
                  class="company-editor-field"
                  @input="updateField('contactName', $event.target.value)"
                />
              </label>

              <label class="grid gap-1">
                <span class="text-[9px] font-black uppercase text-[#FF6600]"> Telefono </span>
                <input
                  :value="draftCompany.contactPhone"
                  type="text"
                  placeholder="+56 9 0000 0000"
                  class="company-editor-field"
                  @input="updateField('contactPhone', $event.target.value)"
                />
              </label>

              <label class="grid gap-1">
                <span class="text-[9px] font-black uppercase text-[#FF6600]">
                  Correo contacto
                </span>
                <input
                  :value="draftCompany.contactEmail"
                  type="email"
                  placeholder="contacto@empresa.cl"
                  class="company-editor-field"
                  @input="updateField('contactEmail', $event.target.value)"
                />
              </label>
            </div>
          </section>

          <section
            class="overflow-hidden rounded-lg border border-[#d9d9d9] bg-white md:col-span-2"
          >
            <header class="border-b border-[#102372] bg-[#102372] px-3 py-2">
              <h3>Ubicacion</h3>
              <p>Ciudad y region de la empresa</p>
            </header>

            <div class="grid gap-2.5 p-2.5 sm:grid-cols-2">
              <label class="grid gap-1">
                <span class="text-[9px] font-black uppercase text-[#FF6600]">Ciudad</span>
                <input
                  :value="draftCompany.city"
                  type="text"
                  placeholder="Santiago"
                  class="company-editor-field"
                  @input="updateField('city', $event.target.value)"
                />
              </label>

              <label class="grid gap-1">
                <span class="text-[9px] font-black uppercase text-[#FF6600]">Region</span>
                <input
                  :value="draftCompany.region"
                  type="text"
                  placeholder="Metropolitana"
                  class="company-editor-field"
                  @input="updateField('region', $event.target.value)"
                />
              </label>
            </div>
          </section>
        </div>
      </div>

      <footer class="shrink-0 border-t border-[#d9d9d9] bg-white px-3 py-2.5">
        <div class="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            class="h-10 rounded-md border border-[#102372] bg-white px-5 text-[14px] font-bold text-[#102372] hover:bg-[#f5f6f8]"
            @click="$emit('close')"
          >
            Cancelar
          </button>

          <button
            type="button"
            class="h-10 rounded-md bg-[#2158d9] px-5 text-[14px] font-bold text-white hover:bg-[#1948b8] disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="!draftCompany.name?.trim() || !draftCompany.rut?.trim()"
            @click="$emit('save')"
          >
            {{ mode === "edit" ? "Guardar cambios" : "Crear empresa" }}
          </button>
        </div>
      </footer>
    </section>
  </div>
</template>

<script setup>
import SvgIcon from "../icons/SvgIcon.vue"
import { formatCompanyRut } from "../../utils/companies/companyRut.js"

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  mode: {
    type: String,
    default: "create",
  },
  draftCompany: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(["update:draftCompany", "close", "save"])

const updateField = (field, value, input) => {
  if (field === "rut") {
    value = formatCompanyRut(value)
    if (input) input.value = value
  }
  emit("update:draftCompany", {
    ...props.draftCompany,
    [field]: value,
  })
}
</script>

<style scoped>
.company-editor-overlay {
  background: rgb(0 0 0 / 40%);
}
.company-editor-dialog {
  max-height: calc(100dvh - 32px);
  color: #10234c;
}
.company-editor-body section {
  border-color: #dce3ee;
}
.company-editor-body section > header {
  background: #fff;
  border-color: #e5e9f0;
  padding: 14px 18px;
}
.company-editor-body section > header h3 {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #10234c;
  font-size: 16px;
  font-weight: 700;
  text-transform: none;
}
.company-editor-body section > header h3 :deep(svg) {
  width: 22px;
  height: 22px;
  color: #1460df;
}
.company-editor-body section > header p {
  margin-top: 4px;
  font-size: 13px;
  color: #52658c;
}
.company-editor-body section > div {
  padding: 18px;
  gap: 18px 14px;
}
.company-editor-body label {
  min-width: 0;
}
.company-editor-body label > span {
  color: #102372;
  font-size: 12px;
}
@media (max-width: 767px) {
  .company-editor-body label {
    grid-column: auto;
  }
}
.company-editor-field {
  height: 2.5rem;
  width: 100%;
  min-width: 0;
  border: 1px solid #d9d9d9;
  border-radius: 0.5rem;
  background: #ffffff;
  padding: 0 0.75rem;
  color: #102372;
  font-size: 0.875rem;
  font-weight: 600;
  outline: none;
  transition:
    border-color 150ms ease,
    box-shadow 150ms ease,
    background-color 150ms ease;
}

.company-editor-field::placeholder {
  color: rgb(16 35 114 / 35%);
}

.company-editor-field:focus {
  border-color: #2158d9;
  box-shadow: 0 0 0 2px rgb(33 88 217 / 12%);
}
</style>
