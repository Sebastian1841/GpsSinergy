<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 z-[950] flex items-end justify-center bg-slate-950/45 p-2 sm:items-center sm:p-4"
    @click.self="closeModal"
  >
    <section
      class="flex max-h-[calc(100%-16px)] w-full max-w-[920px] flex-col overflow-hidden rounded-t-2xl border border-[#d8dee8] bg-white shadow-2xl sm:max-h-[calc(100%-32px)] sm:rounded-2xl"
    >
      <header class="shrink-0 bg-[#102372] px-4 py-3 sm:px-5">
        <div class="flex items-center justify-between gap-3">
          <div class="min-w-0">
            <p class="text-[10px] font-black uppercase tracking-[0.18em] text-[#FF6600]">
              Alta de activo
            </p>

            <h2 class="mt-0.5 truncate text-[16px] font-black text-white">Registrar activo GPS</h2>

            <p class="mt-1 truncate text-[11px] font-semibold text-white/65">
              Completa los datos principales para registrar un nuevo activo.
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
          <aside class="rounded-2xl border border-[#d8dee8] bg-white p-2 shadow-sm">
            <div class="rounded-xl bg-[#f8fafc] p-1">
              <button
                v-for="(step, index) in steps"
                :key="step.key"
                type="button"
                class="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left transition"
                :class="
                  currentStep === index
                    ? 'bg-[#102372] text-white shadow-sm'
                    : 'text-[#102372] hover:bg-white hover:text-[#FF6600]'
                "
                @click="goToStep(index)"
              >
                <span
                  class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[11px] font-black"
                  :class="
                    currentStep === index
                      ? 'bg-[#FF6600] text-white'
                      : isStepCompleted(index)
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-[#eef3ff] text-[#102372]'
                  "
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
                    :class="
                      item.done ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'
                    "
                  >
                    {{ item.done ? "OK" : "Pend." }}
                  </span>
                </div>
              </div>
            </div>
          </aside>

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

                <span
                  class="shrink-0 rounded-full bg-[#102372]/10 px-2.5 py-1 text-[10px] font-black text-[#102372]"
                >
                  {{ currentStep + 1 }} / {{ steps.length }}
                </span>
              </div>
            </div>

            <div class="p-4">
              <div v-if="currentStep === 0" class="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

              <div v-else-if="currentStep === 1" class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label class="flex flex-col gap-1 sm:col-span-2">
                  <span class="text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">
                    Modelo GPS *
                  </span>

                  <select
                    v-model="form.trackerModel"
                    class="h-10 cursor-pointer rounded-lg border border-[#cbd5e1] bg-white px-3 text-[12px] font-black text-[#172033] outline-none transition focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10"
                  >
                    <option value="">Seleccionar modelo GPS</option>

                    <option
                      v-for="option in trackerModelOptions"
                      :key="option.value"
                      :value="option.value"
                    >
                      {{ option.manufacturer }} {{ option.label }}
                    </option>
                  </select>

                  <span class="text-[10px] font-semibold text-slate-400">
                    {{
                      selectedTrackerModel?.description ||
                      "Selecciona el modelo para habilitar el IMEI."
                    }}
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
                    :disabled="!form.trackerModel"
                    class="h-10 rounded-lg border border-[#cbd5e1] bg-white px-3 text-[12px] font-semibold text-[#172033] outline-none transition placeholder:text-slate-400 focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    :placeholder="form.trackerModel ? '867123456789012' : 'Selecciona un modelo'"
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
                    <p class="text-[11px] font-black text-[#102372]">Comunicación</p>

                    <span
                      class="rounded-full bg-[#102372] px-2.5 py-1 text-[10px] font-black text-white"
                    >
                      {{ form.protocol?.toUpperCase() || "TCP" }}
                    </span>
                  </div>
                </div>
              </div>

              <div v-else-if="currentStep === 2" class="grid grid-cols-1 gap-3 sm:grid-cols-3">
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

              <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
                  <p class="text-[11px] font-black text-[#102372]">Resumen</p>

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
            Obligatorios: activo y dispositivo.
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
              Crear activo
            </button>
          </div>
        </div>
      </footer>
    </section>
  </div>
</template>

<script setup>
import { useFleetCreateForm } from "../../../composables/activos/fleet/useFleetCreateForm.js"

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(["update:modelValue", "add-activo"])

const {
  steps,
  trackerModelOptions,
  currentStep,
  currentStepConfig,
  progressWidth,
  goToStep,
  nextStep,
  previousStep,
  form,
  selectedTrackerModel,
  canSaveActivo,
  requiredStatus,
  summaryItems,
  isStepCompleted,
  closeModal,
  submitForm,
} = useFleetCreateForm({ props, emit })
</script>
