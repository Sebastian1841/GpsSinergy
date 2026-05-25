<template>
  <Teleport to="body">
    <div
      v-if="modelValue && activo"
      class="fixed inset-0 z-[2147483646] flex items-center justify-center bg-slate-950/45 p-4"
      @click.self="closeModal"
    >
      <div class="w-full max-w-2xl overflow-hidden rounded-2xl border border-[#d8dee8] bg-white shadow-2xl">
        <div class="flex items-start justify-between gap-4 border-b border-[#edf1f5] bg-[#f8fafc] px-5 py-4">
          <div class="min-w-0">
            <p class="text-[10px] font-black uppercase tracking-[0.16em] text-[#FF6600]">
              Editar activo
            </p>

            <h3 class="mt-1 truncate text-base font-black text-[#102372]">
              {{ form.vehiculo || "Activo sin nombre" }}
            </h3>

            <p class="mt-1 text-xs font-semibold text-slate-500">
              IMEI: {{ form.imei || "-" }}
            </p>
          </div>

          <button
            type="button"
            class="rounded-lg px-2 py-1 text-xl font-bold text-slate-400 transition hover:bg-white hover:text-[#FF6600]"
            @click="closeModal"
          >
            ×
          </button>
        </div>

        <div class="grid max-h-[70vh] gap-3 overflow-auto p-5 sm:grid-cols-2">
          <label class="flex flex-col gap-1 text-[11px] font-bold text-slate-600">
            Nombre visible
            <input
              v-model="form.vehiculo"
              class="h-9 rounded-lg border border-[#d8dee8] px-3 text-sm font-semibold outline-none focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10"
            />
          </label>

          <label class="flex flex-col gap-1 text-[11px] font-bold text-slate-600">
            Nombre interno
            <input
              v-model="form.name"
              class="h-9 rounded-lg border border-[#d8dee8] px-3 text-sm font-semibold outline-none focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10"
            />
          </label>

          <label class="flex flex-col gap-1 text-[11px] font-bold text-slate-600">
            IMEI
            <input
              v-model="form.imei"
              class="h-9 rounded-lg border border-[#d8dee8] px-3 text-sm font-semibold outline-none focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10"
            />
          </label>

          <label class="flex flex-col gap-1 text-[11px] font-bold text-slate-600">
            Protocolo
            <input
              v-model="form.protocol"
              class="h-9 rounded-lg border border-[#d8dee8] px-3 text-sm font-semibold outline-none focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10"
            />
          </label>

          <label class="flex flex-col gap-1 text-[11px] font-bold text-slate-600">
            Estado
            <select
              v-model="form.estado"
              class="h-9 rounded-lg border border-[#d8dee8] px-3 text-sm font-semibold outline-none focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10"
            >
              <option value="moving">Ruta</option>
              <option value="idle">Espera</option>
              <option value="stopped">Alerta</option>
              <option value="offline">Offline</option>
            </select>
          </label>

          <label class="flex flex-col gap-1 text-[11px] font-bold text-slate-600">
            Modelo GPS
            <input
              v-model="form.trackerModelLabel"
              class="h-9 rounded-lg border border-[#d8dee8] px-3 text-sm font-semibold outline-none focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10"
            />
          </label>

          <label class="flex flex-col gap-1 text-[11px] font-bold text-slate-600">
            Fabricante
            <input
              v-model="form.trackerManufacturer"
              class="h-9 rounded-lg border border-[#d8dee8] px-3 text-sm font-semibold outline-none focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10"
            />
          </label>

          <label class="flex flex-col gap-1 text-[11px] font-bold text-slate-600">
            Odómetro
            <input
              v-model="form.odometro"
              class="h-9 rounded-lg border border-[#d8dee8] px-3 text-sm font-semibold outline-none focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10"
            />
          </label>

          <label class="flex flex-col gap-1 text-[11px] font-bold text-slate-600">
            Horómetro diario
            <input
              v-model="form.horometroDiario"
              class="h-9 rounded-lg border border-[#d8dee8] px-3 text-sm font-semibold outline-none focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10"
            />
          </label>

          <label class="flex flex-col gap-1 text-[11px] font-bold text-slate-600">
            Horómetro total
            <input
              v-model="form.horometroTotal"
              class="h-9 rounded-lg border border-[#d8dee8] px-3 text-sm font-semibold outline-none focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10"
            />
          </label>

          <label class="flex flex-col gap-1 text-[11px] font-bold text-slate-600 sm:col-span-2">
            Dirección
            <input
              v-model="form.direccion"
              class="h-9 rounded-lg border border-[#d8dee8] px-3 text-sm font-semibold outline-none focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10"
            />
          </label>

          <label class="flex flex-col gap-1 text-[11px] font-bold text-slate-600 sm:col-span-2">
            Descripción
            <textarea
              v-model="form.descripcion"
              rows="3"
              class="rounded-lg border border-[#d8dee8] px-3 py-2 text-sm font-semibold outline-none focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10"
            ></textarea>
          </label>
        </div>

        <div class="flex justify-end gap-2 border-t border-[#edf1f5] bg-[#f8fafc] px-5 py-4">
          <button
            type="button"
            class="rounded-lg border border-[#d8dee8] bg-white px-4 py-2 text-xs font-black text-slate-600 transition hover:border-[#FF6600] hover:text-[#FF6600]"
            @click="closeModal"
          >
            Cancelar
          </button>

          <button
            type="button"
            class="rounded-lg bg-[#102372] px-4 py-2 text-xs font-black text-white transition hover:bg-[#0c1b59]"
            @click="saveChanges"
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { reactive, watch } from "vue"

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  activo: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits([
  "update:modelValue",
  "save",
])

const form = reactive({
  estado: "offline",
  vehiculo: "",
  name: "",
  nombrePantalla: "",
  imei: "",
  protocol: "",
  trackerModelLabel: "",
  trackerManufacturer: "",
  descripcion: "",
  fechaIngreso: "",
  horometroDiario: "",
  horometroTotal: "",
  odometro: "",
  direccion: "",
})

const resetForm = () => {
  const activo = props.activo || {}

  form.estado = activo.estado || "offline"
  form.vehiculo = activo.vehiculo || ""
  form.name = activo.name || activo.vehiculo || ""
  form.nombrePantalla = activo.nombrePantalla || activo.vehiculo || activo.name || ""
  form.imei = activo.imei || ""
  form.protocol = activo.protocol || ""
  form.trackerModelLabel = activo.trackerModelLabel || ""
  form.trackerManufacturer = activo.trackerManufacturer || ""
  form.descripcion = activo.descripcion || ""
  form.fechaIngreso = activo.fechaIngreso || ""
  form.horometroDiario = activo.horometroDiario || ""
  form.horometroTotal = activo.horometroTotal || ""
  form.odometro = activo.odometro || ""
  form.direccion = activo.direccion || ""
}

const closeModal = () => {
  emit("update:modelValue", false)
}

const saveChanges = () => {
  if (!props.activo) return

  emit("save", {
    id: props.activo.id,
    data: {
      estado: form.estado || "offline",
      vehiculo: form.vehiculo || "Activo sin nombre",
      name: form.name || form.vehiculo || "Activo sin nombre",
      nombrePantalla: form.nombrePantalla || form.vehiculo || form.name || "Activo sin nombre",
      imei: form.imei || "-",
      protocol: form.protocol || "-",
      trackerModelLabel: form.trackerModelLabel || "-",
      trackerManufacturer: form.trackerManufacturer || "-",
      descripcion: form.descripcion || "-",
      fechaIngreso: form.fechaIngreso || "-",
      horometroDiario: form.horometroDiario || "-",
      horometroTotal: form.horometroTotal || "-",
      odometro: form.odometro || "-",
      direccion: form.direccion || "Última ubicación registrada",
    },
  })
}

watch(
  () => [props.modelValue, props.activo],
  () => {
    if (props.modelValue && props.activo) {
      resetForm()
    }
  },
  {
    immediate: true,
  },
)
</script>