<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 z-[950] flex items-end justify-center bg-slate-950/45 p-2 sm:items-center sm:p-4"
    @click.self="closeModal"
  >
    <section class="flex max-h-[calc(100%-16px)] w-full max-w-[920px] flex-col overflow-hidden rounded-t-2xl border border-[#d8dee8] bg-white shadow-2xl sm:max-h-[calc(100%-32px)] sm:rounded-2xl">
      <!-- Header corporativo -->
      <header class="shrink-0 bg-[#102372] px-4 py-3 sm:px-5">
        <div class="flex items-center justify-between gap-3">
          <div class="min-w-0">
            <p class="text-[10px] font-black uppercase tracking-[0.18em] text-[#FF6600]">
              {{ isEditMode ? "Edición de activo" : "Alta de activo" }}
            </p>

            <h2 class="mt-0.5 truncate text-[16px] font-black text-white">
              {{ isEditMode ? "Modificar activo GPS" : "Registrar activo GPS" }}
            </h2>

            <p
              v-if="isEditMode"
              class="mt-1 truncate text-[11px] font-semibold text-white/65"
            >
              {{ form.displayName || form.name || "Activo seleccionado" }}

              <span v-if="form.imei">
                · IMEI {{ form.imei }}
              </span>
            </p>
          </div>

          <button
            type="button"
            class="shrink-0 cursor-pointer rounded-lg px-2 py-1 text-[20px] font-black text-white/65 transition hover:bg-white/10 hover:text-white"
            @click="closeModal"
          >
            ×
          </button>
        </div>

        <div class="mt-3 h-1 overflow-hidden rounded-full bg-white/15">
          <div
            class="h-full rounded-full bg-[#FF6600] transition-all duration-300"
            :style="{ width: progressWidth }"
          ></div>
        </div>
      </header>

      <form
        class="min-h-0 flex-1 overflow-auto bg-[#eef2f7] p-3 sm:p-4"
        @submit.prevent="submitForm"
      >
        <div class="grid grid-cols-1 gap-3 lg:grid-cols-[215px_minmax(0,1fr)]">
          <!-- Navegación lateral -->
          <aside class="rounded-2xl border border-[#d8dee8] bg-white p-2 shadow-sm">
            <div class="rounded-xl bg-[#f8fafc] p-1">
              <button
                v-for="(step, index) in steps"
                :key="step.key"
                type="button"
                class="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left transition"
                :class="currentStep === index
                  ? 'bg-[#102372] text-white shadow-sm'
                  : 'text-[#102372] hover:bg-white hover:text-[#FF6600]'"
                @click="goToStep(index)"
              >
                <span
                  class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[11px] font-black"
                  :class="currentStep === index
                    ? 'bg-[#FF6600] text-white'
                    : isStepCompleted(index)
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-[#eef3ff] text-[#102372]'"
                >
                  {{ index + 1 }}
                </span>

                <span class="min-w-0 flex-1">
                  <span class="block truncate text-[11px] font-black">
                    {{ step.label }}
                  </span>

                  <span
                    class="mt-0.5 block truncate text-[10px] font-semibold"
                    :class="currentStep === index ? 'text-white/65' : 'text-slate-500'"
                  >
                    {{ step.helper }}
                  </span>
                </span>
              </button>
            </div>

            <div class="mt-2 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3">
              <p class="text-[10px] font-black uppercase tracking-[0.12em] text-[#102372]">
                Requeridos
              </p>

              <div class="mt-2 space-y-1.5">
                <div
                  v-for="item in requiredStatus"
                  :key="item.label"
                  class="flex items-center justify-between gap-2 text-[10px] font-bold"
                >
                  <span class="truncate text-slate-500">
                    {{ item.label }}
                  </span>

                  <span
                    class="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black"
                    :class="item.done
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-slate-100 text-slate-400'"
                  >
                    {{ item.done ? "OK" : "Pend." }}
                  </span>
                </div>
              </div>
            </div>

            <div
              v-if="isEditMode"
              class="mt-2 rounded-xl border border-[#FF6600]/20 bg-[#fff7ed] p-3"
            >
              <p class="text-[10px] font-black uppercase tracking-[0.12em] text-[#FF6600]">
                Modo edición
              </p>

              <p class="mt-1 text-[10px] font-semibold leading-relaxed text-slate-600">
                Los cambios se aplicarán sobre el activo seleccionado.
              </p>
            </div>
          </aside>

          <!-- Contenido principal -->
          <section class="overflow-hidden rounded-2xl border border-[#d8dee8] bg-white shadow-sm">
            <div class="border-b border-[#edf1f5] bg-[#f8fafc] px-4 py-4">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="text-[10px] font-black uppercase tracking-[0.14em] text-[#FF6600]">
                    {{ currentStepConfig.eyebrow }}
                  </p>

                  <h3 class="mt-1 text-[15px] font-black text-[#102372]">
                    {{ currentStepConfig.title }}
                  </h3>
                </div>

                <span class="shrink-0 rounded-full bg-[#102372]/10 px-2.5 py-1 text-[10px] font-black text-[#102372]">
                  {{ currentStep + 1 }} / {{ steps.length }}
                </span>
              </div>
            </div>

            <div class="p-4">
              <!-- Módulo 1: Activo -->
              <div
                v-if="currentStep === 0"
                class="grid grid-cols-1 gap-3 sm:grid-cols-2"
              >
                <label class="flex flex-col gap-1">
                  <span class="text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">
                    Nombre interno *
                  </span>

                  <input
                    v-model="form.name"
                    type="text"
                    class="h-10 rounded-lg border border-[#cbd5e1] bg-white px-3 text-[12px] font-semibold text-[#172033] outline-none transition placeholder:text-slate-400 focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10"
                    placeholder="GPS CAMIONETA JAC"
                  />
                </label>

                <label class="flex flex-col gap-1">
                  <span class="text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">
                    Nombre en pantalla *
                  </span>

                  <input
                    v-model="form.displayName"
                    type="text"
                    class="h-10 rounded-lg border border-[#cbd5e1] bg-white px-3 text-[12px] font-semibold text-[#172033] outline-none transition placeholder:text-slate-400 focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10"
                    placeholder="CAMIONETA JAC"
                  />
                </label>

                <label class="flex flex-col gap-1 sm:col-span-2">
                  <span class="text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">
                    Descripción
                  </span>

                  <textarea
                    v-model="form.description"
                    rows="4"
                    class="resize-none rounded-lg border border-[#cbd5e1] bg-white px-3 py-2 text-[12px] font-semibold text-[#172033] outline-none transition placeholder:text-slate-400 focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10"
                    placeholder="Referencia interna, cliente, instalación u observaciones."
                  ></textarea>
                </label>
              </div>

              <!-- Módulo 2: Dispositivo -->
              <div
                v-else-if="currentStep === 1"
                class="grid grid-cols-1 gap-3 sm:grid-cols-2"
              >
                <label class="flex flex-col gap-1 sm:col-span-2">
                  <span class="text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">
                    Modelo GPS *
                  </span>

                  <select
                    v-model="form.trackerModel"
                    class="h-10 cursor-pointer rounded-lg border border-[#cbd5e1] bg-white px-3 text-[12px] font-black text-[#172033] outline-none transition focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10"
                  >
                    <option value="">
                      Seleccionar modelo GPS
                    </option>

                    <option
                      v-for="option in trackerModelOptions"
                      :key="option.value"
                      :value="option.value"
                    >
                      {{ option.manufacturer }} {{ option.label }}
                    </option>
                  </select>

                  <span class="text-[10px] font-semibold text-slate-400">
                    {{ selectedTrackerModel?.description || "Selecciona el modelo para habilitar el IMEI." }}
                  </span>
                </label>

                <label class="flex flex-col gap-1">
                  <span class="text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">
                    IMEI *
                  </span>

                  <input
                    v-model="form.imei"
                    type="text"
                    inputmode="numeric"
                    :disabled="!form.trackerModel && !isEditMode"
                    class="h-10 rounded-lg border border-[#cbd5e1] bg-white px-3 text-[12px] font-semibold text-[#172033] outline-none transition placeholder:text-slate-400 focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    :placeholder="form.trackerModel || isEditMode ? '867123456789012' : 'Selecciona un modelo'"
                  />
                </label>

                <label class="flex flex-col gap-1">
                  <span class="text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">
                    Protocolo
                  </span>

                  <input
                    v-model="form.protocol"
                    type="text"
                    disabled
                    class="h-10 cursor-not-allowed rounded-lg border border-[#cbd5e1] bg-[#eef3ff] px-3 text-[12px] font-black uppercase text-[#102372] outline-none"
                  />
                </label>

                <div class="rounded-xl border border-[#d8dee8] bg-[#f8fafc] p-3 sm:col-span-2">
                  <div class="flex items-center justify-between gap-3">
                    <p class="text-[11px] font-black text-[#102372]">
                      Comunicación
                    </p>

                    <span class="rounded-full bg-[#102372] px-2.5 py-1 text-[10px] font-black text-white">
                      {{ form.protocol?.toUpperCase() || "TCP" }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Módulo 3: Fechas -->
              <div
                v-else-if="currentStep === 2"
                class="grid grid-cols-1 gap-3 sm:grid-cols-3"
              >
                <label class="flex flex-col gap-1">
                  <span class="text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">
                    Ingreso
                  </span>

                  <input
                    v-model="form.entryDate"
                    type="date"
                    class="h-10 rounded-lg border border-[#cbd5e1] bg-white px-3 text-[12px] font-semibold text-[#172033] outline-none transition focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10"
                  />
                </label>

                <label class="flex flex-col gap-1">
                  <span class="text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">
                    Baja
                  </span>

                  <input
                    v-model="form.deactivationDate"
                    type="date"
                    class="h-10 rounded-lg border border-[#cbd5e1] bg-white px-3 text-[12px] font-semibold text-[#172033] outline-none transition focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10"
                  />
                </label>

                <label class="flex flex-col gap-1">
                  <span class="text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">
                    Suspensión
                  </span>

                  <input
                    v-model="form.suspensionDate"
                    type="date"
                    class="h-10 rounded-lg border border-[#cbd5e1] bg-white px-3 text-[12px] font-semibold text-[#172033] outline-none transition focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10"
                  />
                </label>
              </div>

              <!-- Módulo 4: Métricas -->
              <div
                v-else
                class="grid grid-cols-1 gap-3 sm:grid-cols-3"
              >
                <label class="flex flex-col gap-1">
                  <span class="text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">
                    Horómetro diario
                  </span>

                  <input
                    v-model="form.dailyHourmeter"
                    type="number"
                    min="0"
                    step="0.1"
                    class="h-10 rounded-lg border border-[#cbd5e1] bg-white px-3 text-[12px] font-semibold text-[#172033] outline-none transition placeholder:text-slate-400 focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10"
                    placeholder="6.5"
                  />
                </label>

                <label class="flex flex-col gap-1">
                  <span class="text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">
                    Horómetro total
                  </span>

                  <input
                    v-model="form.totalHourmeter"
                    type="number"
                    min="0"
                    step="0.1"
                    class="h-10 rounded-lg border border-[#cbd5e1] bg-white px-3 text-[12px] font-semibold text-[#172033] outline-none transition placeholder:text-slate-400 focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10"
                    placeholder="1240.8"
                  />
                </label>

                <label class="flex flex-col gap-1">
                  <span class="text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">
                    Odómetro
                  </span>

                  <input
                    v-model="form.odometer"
                    type="number"
                    min="0"
                    step="1"
                    class="h-10 rounded-lg border border-[#cbd5e1] bg-white px-3 text-[12px] font-semibold text-[#172033] outline-none transition placeholder:text-slate-400 focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10"
                    placeholder="125430"
                  />
                </label>

                <div class="rounded-xl border border-[#d8dee8] bg-[#f8fafc] p-3 sm:col-span-3">
                  <p class="text-[11px] font-black text-[#102372]">
                    Resumen
                  </p>

                  <div class="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <div
                      v-for="item in summaryItems"
                      :key="item.label"
                      class="rounded-lg border border-[#e2e8f0] bg-white px-3 py-2"
                    >
                      <p class="text-[9px] font-black uppercase tracking-[0.1em] text-slate-400">
                        {{ item.label }}
                      </p>

                      <p class="mt-1 truncate text-[11px] font-black text-[#172033]">
                        {{ item.value || "-" }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </form>

      <footer class="shrink-0 border-t border-[#d8dee8] bg-[#f8fafc] px-4 py-3">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p class="text-[10px] font-semibold text-slate-500">
            {{ isEditMode ? "Edita los datos necesarios y guarda los cambios." : "Obligatorios: activo y dispositivo." }}
          </p>

          <div class="flex flex-col-reverse gap-2 sm:flex-row">
            <button
              type="button"
              class="h-10 cursor-pointer rounded-lg border border-[#d8dee8] bg-white px-4 text-[11px] font-black text-[#102372] transition hover:border-[#FF6600] hover:text-[#FF6600]"
              @click="currentStep === 0 ? closeModal() : previousStep()"
            >
              {{ currentStep === 0 ? "Cancelar" : "Volver" }}
            </button>

            <button
              v-if="currentStep < steps.length - 1"
              type="button"
              class="h-10 cursor-pointer rounded-lg bg-[#102372] px-4 text-[11px] font-black text-white shadow-sm transition hover:bg-[#0c1b59]"
              @click="nextStep"
            >
              Continuar
            </button>

            <button
              v-else
              type="button"
              class="h-10 cursor-pointer rounded-lg bg-[#FF6600] px-4 text-[11px] font-black text-white shadow-sm transition hover:bg-[#e65c00] disabled:cursor-not-allowed disabled:bg-slate-300"
              :disabled="!canSaveActivo"
              @click="submitForm"
            >
              {{ isEditMode ? "Guardar cambios" : "Crear activo" }}
            </button>
          </div>
        </div>
      </footer>
    </section>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue"

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  mode: {
    type: String,
    default: "create",
  },
  activo: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits([
  "update:modelValue",
  "add-activo",
  "update-activo",
])

const steps = [
  {
    key: "asset",
    label: "Activo",
    helper: "Nombre",
    eyebrow: "Módulo 01",
    title: "Datos del activo",
  },
  {
    key: "device",
    label: "Dispositivo",
    helper: "GPS / IMEI",
    eyebrow: "Módulo 02",
    title: "Dispositivo GPS",
  },
  {
    key: "admin",
    label: "Fechas",
    helper: "Ciclo",
    eyebrow: "Módulo 03",
    title: "Fechas administrativas",
  },
  {
    key: "metrics",
    label: "Métricas",
    helper: "Iniciales",
    eyebrow: "Módulo 04",
    title: "Métricas iniciales",
  },
]

const trackerModelOptions = [
  {
    value: "teltonika-fmb920",
    manufacturer: "Teltonika",
    label: "FMB920",
    description: "Equipo compacto para vehículos livianos.",
  },
  {
    value: "teltonika-fmc130",
    manufacturer: "Teltonika",
    label: "FMC130",
    description: "GPS LTE con entradas/salidas vehiculares.",
  },
  {
    value: "concox-gt06n",
    manufacturer: "Concox",
    label: "GT06N",
    description: "Rastreador estándar para monitoreo vehicular.",
  },
  {
    value: "queclink-gv300",
    manufacturer: "Queclink",
    label: "GV300",
    description: "Equipo profesional para flota y telemetría básica.",
  },
  {
    value: "ruptela-eco5",
    manufacturer: "Ruptela",
    label: "Eco5",
    description: "Dispositivo GPS para gestión de flota.",
  },
]

const createEmptyForm = () => ({
  trackerModel: "",
  imei: "",
  protocol: "tcp",
  name: "",
  displayName: "",
  description: "",
  entryDate: new Date().toISOString().slice(0, 10),
  deactivationDate: "",
  suspensionDate: "",
  dailyHourmeter: "",
  totalHourmeter: "",
  odometer: "",
})

const currentStep = ref(0)
const form = ref(createEmptyForm())

const isEditMode = computed(() => props.mode === "edit")

const currentStepConfig = computed(() => steps[currentStep.value] || steps[0])

const selectedTrackerModel = computed(() => {
  return trackerModelOptions.find((option) => option.value === form.value.trackerModel) || null
})

const selectedTrackerModelLabel = computed(() => {
  if (!selectedTrackerModel.value) return ""

  return `${selectedTrackerModel.value.manufacturer} ${selectedTrackerModel.value.label}`
})

const isAssetStepValid = computed(() => {
  return Boolean(form.value.name.trim() && form.value.displayName.trim())
})

const isDeviceStepValid = computed(() => {
  if (isEditMode.value) {
    return Boolean(form.value.imei.trim())
  }

  return Boolean(form.value.trackerModel && form.value.imei.trim())
})

const canSaveActivo = computed(() => {
  return Boolean(isAssetStepValid.value && isDeviceStepValid.value)
})

const progressWidth = computed(() => {
  return `${((currentStep.value + 1) / steps.length) * 100}%`
})

const requiredStatus = computed(() => [
  {
    label: "Activo",
    done: isAssetStepValid.value,
  },
  {
    label: "Dispositivo",
    done: isDeviceStepValid.value,
  },
])

const summaryItems = computed(() => [
  {
    label: "Activo",
    value: form.value.displayName,
  },
  {
    label: "Modelo",
    value: selectedTrackerModelLabel.value || props.activo?.trackerModelLabel,
  },
  {
    label: "IMEI",
    value: form.value.imei,
  },
  {
    label: "Protocolo",
    value: form.value.protocol.toUpperCase(),
  },
  {
    label: "Ingreso",
    value: form.value.entryDate,
  },
  {
    label: "Odómetro",
    value: form.value.odometer,
  },
])

const normalizeDate = (value) => {
  if (!value || value === "-") return ""

  const text = String(value)

  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    return text.slice(0, 10)
  }

  return ""
}

const extractNumber = (value) => {
  if (!value || value === "-") return ""

  const match = String(value)
    .replace(/\./g, "")
    .replace(",", ".")
    .match(/-?\d+(\.\d+)?/)

  return match ? match[0] : ""
}

const findTrackerModel = (activo) => {
  if (!activo) return ""

  if (activo.trackerModel) {
    const exists = trackerModelOptions.some((option) => {
      return option.value === activo.trackerModel
    })

    if (exists) return activo.trackerModel
  }

  const label = String(activo.trackerModelLabel || "").toLowerCase()

  const option = trackerModelOptions.find((item) => {
    return (
      item.label.toLowerCase() === label ||
      `${item.manufacturer} ${item.label}`.toLowerCase() === label
    )
  })

  return option?.value || ""
}

const fillFormFromActivo = (activo) => {
  form.value = {
    trackerModel: findTrackerModel(activo),
    imei: activo.imei && activo.imei !== "-" ? String(activo.imei) : "",
    protocol: activo.protocol && activo.protocol !== "-" ? String(activo.protocol).toLowerCase() : "tcp",

    name:
      activo.name && activo.name !== "-"
        ? String(activo.name)
        : String(activo.vehiculo || activo.nombrePantalla || ""),

    displayName:
      activo.nombrePantalla && activo.nombrePantalla !== "-"
        ? String(activo.nombrePantalla)
        : String(activo.vehiculo || activo.displayName || activo.name || ""),

    description:
      activo.descripcion && activo.descripcion !== "-"
        ? String(activo.descripcion)
        : String(activo.description || ""),

    entryDate: normalizeDate(activo.fechaIngreso || activo.entryDate),
    deactivationDate: normalizeDate(activo.fechaBaja || activo.deactivationDate),
    suspensionDate: normalizeDate(activo.fechaSuspension || activo.suspensionDate),

    dailyHourmeter: extractNumber(activo.horometroDiario ?? activo.dailyHourmeter),
    totalHourmeter: extractNumber(activo.horometroTotal ?? activo.totalHourmeter),
    odometer: extractNumber(activo.odometro ?? activo.odometer),
  }
}

const resetModal = () => {
  currentStep.value = 0

  if (isEditMode.value && props.activo) {
    fillFormFromActivo(props.activo)
    return
  }

  form.value = createEmptyForm()
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) resetModal()
  },
)

watch(
  () => form.value.trackerModel,
  (trackerModel) => {
    if (!trackerModel && !isEditMode.value) {
      form.value.imei = ""
    }
  },
)

const isStepCompleted = (index) => {
  if (index === 0) return isAssetStepValid.value
  if (index === 1) return isDeviceStepValid.value
  if (index === 2) return Boolean(form.value.entryDate || form.value.deactivationDate || form.value.suspensionDate)
  if (index === 3) return Boolean(form.value.dailyHourmeter || form.value.totalHourmeter || form.value.odometer)

  return false
}

const goToStep = (index) => {
  currentStep.value = Math.min(Math.max(Number(index), 0), steps.length - 1)
}

const nextStep = () => {
  currentStep.value = Math.min(currentStep.value + 1, steps.length - 1)
}

const previousStep = () => {
  currentStep.value = Math.max(currentStep.value - 1, 0)
}

const closeModal = () => {
  emit("update:modelValue", false)
}

const toNumberOrEmpty = (value) => {
  if (value === "" || value === null || value === undefined) return ""

  const numberValue = Number(value)

  return Number.isFinite(numberValue) ? numberValue : ""
}

const buildPayload = () => {
  return {
    trackerModel: form.value.trackerModel,
    trackerModelLabel: selectedTrackerModelLabel.value || props.activo?.trackerModelLabel || "",
    trackerManufacturer: selectedTrackerModel.value?.manufacturer || props.activo?.trackerManufacturer || "",
    imei: form.value.imei.trim(),
    protocol: form.value.protocol || "tcp",
    name: form.value.name.trim(),
    displayName: form.value.displayName.trim(),
    description: form.value.description.trim(),
    entryDate: form.value.entryDate,
    deactivationDate: form.value.deactivationDate,
    suspensionDate: form.value.suspensionDate,
    dailyHourmeter: toNumberOrEmpty(form.value.dailyHourmeter),
    totalHourmeter: toNumberOrEmpty(form.value.totalHourmeter),
    odometer: toNumberOrEmpty(form.value.odometer),
    connectionStatus: isEditMode.value ? "updated" : "pending",
  }
}

const submitForm = () => {
  if (!canSaveActivo.value) return

  const payload = buildPayload()

  if (isEditMode.value) {
    emit("update-activo", {
      id: props.activo?.id,
      data: payload,
    })

    closeModal()
    return
  }

  emit("add-activo", payload)
  closeModal()
}
</script>