<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 z-[780] flex items-center justify-center bg-[#102372]/45 p-2 sm:p-4"
    @click.self="$emit('close')"
  >
    <section
      class="flex max-h-[calc(100%-16px)] w-full max-w-[760px] flex-col overflow-hidden rounded-lg border border-[#102372] bg-white shadow-2xl sm:max-h-[calc(100%-32px)]"
    >
      <header class="shrink-0 bg-[#102372] px-4 py-2.5">
        <div class="flex items-start justify-between gap-3">
          <div class="flex min-w-0 items-center gap-3">
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#FF6600] text-white"
            >
              <svg
                v-if="mode === 'create'"
                viewBox="0 0 24 24"
                class="h-4 w-4"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M12 5v14M5 12h14"
                  stroke="currentColor"
                  stroke-width="2.4"
                  stroke-linecap="round"
                />
              </svg>
              <span v-else class="text-[12px] font-black">{{ companyInitials }}</span>
            </div>

            <div class="min-w-0">
              <p class="text-[10px] font-black uppercase tracking-[0.16em] text-white/55">
                {{ mode === "edit" ? "Configuracion general" : "Registro de empresa" }}
              </p>
              <h2 class="mt-0.5 truncate text-[16px] font-black text-white">
                {{ mode === "edit" ? draftCompany.name || "Editar empresa" : "Nueva empresa" }}
              </h2>
              <p class="mt-0.5 truncate text-[10px] font-semibold text-white/65">
                {{
                  mode === "edit" ? draftCompany.rut || "Sin RUT" : "Datos iniciales del entorno"
                }}
              </p>
            </div>
          </div>

          <button
            type="button"
            class="h-9 w-9 shrink-0 rounded-lg border border-white/30 bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white"
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

      <div class="min-h-0 flex-1 overflow-auto bg-[#eef2f7] p-2.5 sm:p-3">
        <div class="grid gap-2.5 lg:grid-cols-2">
          <section class="overflow-hidden rounded-lg border border-[#d9d9d9] bg-white">
            <header class="border-b border-[#102372] bg-[#102372] px-3 py-2">
              <h3 class="text-[11px] font-black uppercase text-white">Identificacion</h3>
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
                  :value="draftCompany.rut"
                  type="text"
                  placeholder="76.000.000-0"
                  class="company-editor-field"
                  @input="updateField('rut', $event.target.value)"
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
              <h3 class="text-[11px] font-black uppercase text-white">Contacto</h3>
            </header>

            <div class="grid gap-2.5 p-2.5 sm:grid-cols-2">
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

              <label class="grid gap-1 sm:col-span-2">
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
            class="overflow-hidden rounded-lg border border-[#d9d9d9] bg-white lg:col-span-2"
          >
            <header class="border-b border-[#102372] bg-[#102372] px-3 py-2">
              <h3 class="text-[11px] font-black uppercase text-white">Ubicacion</h3>
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
            class="h-9 rounded-lg border border-[#102372] bg-white px-4 text-[10px] font-black text-[#102372] transition hover:bg-[#eef2f7]"
            @click="$emit('close')"
          >
            Cancelar
          </button>

          <button
            type="button"
            class="h-9 rounded-lg bg-[#FF6600] px-5 text-[10px] font-black text-white transition hover:bg-[#e65c00] disabled:cursor-not-allowed disabled:opacity-40"
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
import { computed } from "vue"

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

const companyInitials = computed(() => {
  return (props.draftCompany.name || "Empresa")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
})

const updateField = (field, value) => {
  emit("update:draftCompany", {
    ...props.draftCompany,
    [field]: value,
  })
}
</script>

<style scoped>
.company-editor-field {
  height: 2.25rem;
  min-width: 0;
  border: 1px solid #d9d9d9;
  border-radius: 0.5rem;
  background: #ffffff;
  padding: 0 0.75rem;
  color: #102372;
  font-size: 0.75rem;
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
  border-color: #ff6600;
  box-shadow: 0 0 0 2px rgb(255 102 0 / 12%);
}
</style>
