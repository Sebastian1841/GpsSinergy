<template>
  <Teleport to="body">
    <div
      v-if="modelValue && activo"
      class="fixed inset-0 z-[950] flex items-end justify-center bg-slate-950/45 p-2 sm:items-center sm:p-4"
      @click.self="closeModal"
    >
      <section
        class="flex max-h-[calc(100%-16px)] w-full max-w-[920px] flex-col overflow-hidden rounded-t-2xl bg-white shadow-[0_24px_80px_rgba(15,23,42,0.34)] sm:max-h-[calc(100%-32px)] sm:rounded-2xl"
      >
        <header class="shrink-0 bg-[#102372] px-4 py-3 sm:px-5">
          <div class="flex items-center justify-between gap-3">
            <div class="min-w-0">
              <p class="text-[10px] font-black uppercase tracking-[0.18em] text-[#FF6600]">
                Edición de activo
              </p>

              <h2 class="mt-0.5 truncate text-[16px] font-black text-white">
                Modificar activo GPS
              </h2>

              <p class="mt-1 truncate text-[11px] font-semibold text-white/65">
                {{ form.displayName || form.name || "Activo seleccionado" }}

                <span v-if="form.imei"> · IMEI {{ form.imei }}</span>
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

              <div class="mt-2 rounded-xl border border-[#FF6600]/20 bg-[#fff7ed] p-3">
                <p class="text-[10px] font-black uppercase tracking-[0.12em] text-[#FF6600]">
                  Modo edición
                </p>

                <p class="mt-1 text-[10px] font-semibold leading-relaxed text-slate-600">
                  Los cambios se aplicarán sobre el activo seleccionado.
                </p>
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
                <!-- PASO 1: ACTIVO -->
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

                  <div class="flex flex-col gap-1 sm:col-span-2">
                    <span class="text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">
                      Tipo de activo en mapa
                    </span>

                    <div class="grid grid-cols-2 gap-2 md:grid-cols-4">
                      <button
                        v-for="option in assetTypeOptions"
                        :key="option.value"
                        type="button"
                        class="min-h-[62px] cursor-pointer rounded-lg border px-3 py-2 text-left transition"
                        :class="
                          selectedAssetType?.value === option.value
                            ? 'border-[#FF6600] bg-[#fff7ed] shadow-sm'
                            : 'border-[#d8dee8] bg-white hover:border-[#102372]/35 hover:bg-[#f8fafc]'
                        "
                        @click="selectAssetType(option.value)"
                      >
                        <span
                          class="block truncate text-[11px] font-black"
                          :class="
                            selectedAssetType?.value === option.value
                              ? 'text-[#FF6600]'
                              : 'text-[#102372]'
                          "
                        >
                          {{ option.label }}
                        </span>

                        <span
                          class="mt-1 line-clamp-2 block text-[9px] font-semibold text-slate-500"
                        >
                          {{ option.description }}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div class="rounded-xl border border-[#102372]/15 bg-[#f8fafc] p-3 sm:col-span-2">
                    <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div class="min-w-0">
                        <p
                          class="text-[10px] font-black uppercase tracking-[0.12em] text-[#FF6600]"
                        >
                          Perfil operativo
                        </p>

                        <h4 class="mt-1 text-[13px] font-black text-[#102372]">
                          {{ selectedOperationalProfile.label }}
                        </h4>

                        <p class="mt-1 text-[10px] font-semibold leading-relaxed text-slate-500">
                          {{ selectedOperationalProfile.summary }}
                        </p>
                      </div>

                      <span
                        class="shrink-0 rounded-full bg-[#102372] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-white"
                      >
                        Automatico
                      </span>
                    </div>

                    <div class="mt-3 grid gap-2 md:grid-cols-2">
                      <div class="rounded-lg border border-[#d8dee8] bg-white p-2.5">
                        <p class="text-[9px] font-black uppercase tracking-[0.1em] text-slate-400">
                          Reportes predeterminados
                        </p>

                        <div class="mt-2 flex flex-wrap gap-1.5">
                          <span
                            v-for="report in selectedOperationalProfile.reports"
                            :key="report.id"
                            class="rounded-md bg-[#eef3ff] px-2 py-1 text-[9px] font-black text-[#102372]"
                          >
                            {{ report.label }}
                          </span>
                        </div>
                      </div>

                      <div class="rounded-lg border border-[#d8dee8] bg-white p-2.5">
                        <p class="text-[9px] font-black uppercase tracking-[0.1em] text-slate-400">
                          KPIs sugeridos
                        </p>

                        <div class="mt-2 flex flex-wrap gap-1.5">
                          <span
                            v-for="kpi in selectedOperationalProfile.kpis"
                            :key="kpi"
                            class="rounded-md bg-[#fff7ed] px-2 py-1 text-[9px] font-black text-[#FF6600]"
                          >
                            {{ kpi }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

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

                <!-- PASO 2: ETIQUETAS -->
                <div v-else-if="currentStep === 1" class="space-y-3">
                  <div>
                    <p class="text-[11px] font-black text-[#102372]">Etiquetas del activo</p>

                    <p class="mt-1 text-[10px] font-semibold text-slate-500">
                      Selecciona una o más etiquetas para organizar este activo.
                    </p>
                  </div>

                  <div
                    v-if="assetTags.length"
                    class="overflow-hidden rounded-xl border border-[#d8dee8]"
                  >
                    <label
                      v-for="tag in assetTags"
                      :key="tag.id"
                      class="flex cursor-pointer items-center gap-3 border-b border-[#edf1f5] px-3 py-3 transition last:border-b-0 hover:bg-[#f8fafc]"
                      :class="isAssetTagSelected(tag.id) ? 'bg-[#102372]/[0.035]' : 'bg-white'"
                    >
                      <input
                        type="checkbox"
                        class="h-4 w-4 cursor-pointer rounded border-[#cbd5e1] accent-[#102372]"
                        :checked="isAssetTagSelected(tag.id)"
                        @change="toggleAssetTag(tag.id)"
                      />

                      <span class="min-w-0 flex-1">
                        <span class="block truncate text-[11px] font-black text-[#102372]">
                          {{ tag.name }}
                        </span>

                        <span
                          v-if="tag.description"
                          class="mt-0.5 block truncate text-[9px] font-semibold text-slate-500"
                        >
                          {{ tag.description }}
                        </span>
                      </span>

                      <span
                        v-if="isAssetTagSelected(tag.id)"
                        class="shrink-0 rounded-full bg-[#eef3ff] px-2 py-1 text-[9px] font-black text-[#102372]"
                      >
                        Seleccionada
                      </span>
                    </label>
                  </div>

                  <div
                    v-else
                    class="rounded-xl border border-dashed border-[#cbd5e1] bg-[#f8fafc] px-4 py-8 text-center"
                  >
                    <p class="text-[11px] font-black text-[#102372]">
                      No hay etiquetas disponibles
                    </p>

                    <p class="mt-1 text-[10px] font-semibold text-slate-500">
                      Puedes crear etiquetas desde la sección Etiquetas del módulo de activos.
                    </p>
                  </div>

                  <div class="rounded-xl border border-[#d8dee8] bg-[#f8fafc] p-3">
                    <div class="flex items-center justify-between gap-3">
                      <div>
                        <p class="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
                          Etiquetas seleccionadas
                        </p>

                        <p class="mt-1 text-[10px] font-semibold text-slate-500">
                          {{ selectedAssetTagNames.length }}
                          {{
                            selectedAssetTagNames.length === 1
                              ? "etiqueta seleccionada"
                              : "etiquetas seleccionadas"
                          }}
                        </p>
                      </div>
                    </div>

                    <div v-if="selectedAssetTags.length" class="mt-3 flex flex-wrap gap-2">
                      <button
                        v-for="tag in selectedAssetTags"
                        :key="tag.id"
                        type="button"
                        class="flex cursor-pointer items-center gap-2 rounded-lg bg-[#eef3ff] px-2.5 py-1.5 text-[10px] font-black text-[#102372] transition hover:bg-[#102372] hover:text-white"
                        @click="toggleAssetTag(tag.id)"
                      >
                        <span>{{ tag.name }}</span>
                        <span class="text-[12px] leading-none">×</span>
                      </button>
                    </div>

                    <p
                      v-else
                      class="mt-3 rounded-lg bg-white px-3 py-2 text-[10px] font-semibold text-slate-400"
                    >
                      Este activo quedará sin etiquetas.
                    </p>
                  </div>
                </div>

                <!-- PASO 3: DISPOSITIVO -->
                <div v-else-if="currentStep === 2" class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label class="flex flex-col gap-1 sm:col-span-2">
                    <span class="text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">
                      Modelo GPS
                    </span>

                    <select
                      v-model="form.trackerModel"
                      class="h-10 cursor-pointer rounded-lg border border-[#cbd5e1] bg-white px-3 text-[12px] font-black text-[#172033] outline-none transition focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10"
                    >
                      <option value="">Sin modelo asociado</option>

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
                        form.trackerModelLabel ||
                        "Puedes modificar el modelo sin bloquear el IMEI."
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
                      class="h-10 rounded-lg border border-[#cbd5e1] bg-white px-3 text-[12px] font-semibold text-[#172033] outline-none transition placeholder:text-slate-400 focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10"
                      placeholder="867123456789012"
                    />
                  </label>

                  <label class="flex flex-col gap-1">
                    <span class="text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">
                      Protocolo
                    </span>

                    <input
                      v-model="form.protocol"
                      type="text"
                      class="h-10 rounded-lg border border-[#cbd5e1] bg-[#eef3ff] px-3 text-[12px] font-black uppercase text-[#102372] outline-none transition focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10"
                      placeholder="tcp"
                    />
                  </label>

                  <div class="rounded-xl border border-[#d8dee8] bg-[#f8fafc] p-3 sm:col-span-2">
                    <div class="flex items-center justify-between gap-3">
                      <div>
                        <p class="text-[11px] font-black text-[#102372]">Comunicación</p>

                        <p class="mt-1 text-[10px] font-semibold text-slate-500">
                          {{
                            selectedTrackerModelLabel ||
                            form.trackerModelLabel ||
                            "Modelo no definido"
                          }}
                        </p>
                      </div>

                      <span
                        class="rounded-full bg-[#102372] px-2.5 py-1 text-[10px] font-black text-white"
                      >
                        {{ form.protocol?.toUpperCase() || "TCP" }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- PASO 4: FECHAS -->
                <div v-else-if="currentStep === 3" class="grid grid-cols-1 gap-3 sm:grid-cols-3">
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

                <!-- PASO 5: MÉTRICAS -->
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
                    <p class="text-[11px] font-black text-[#102372]">Resumen de cambios</p>

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
              Edita los datos necesarios y guarda los cambios.
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
                Guardar cambios
              </button>
            </div>
          </div>
        </footer>
      </section>
    </div>
  </Teleport>
</template>

<script setup>
import { useFleetEditForm } from "../../../composables/activos/fleet/useFleetEditForm.js"

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  activo: {
    type: Object,
    default: null,
  },
  assetTags: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(["update:modelValue", "update-activo"])

const {
  steps,
  trackerModelOptions,
  assetTypeOptions,
  currentStep,
  currentStepConfig,
  progressWidth,
  goToStep,
  nextStep,
  previousStep,
  form,
  selectedTrackerModel,
  selectedTrackerModelLabel,
  selectedAssetType,
  selectedOperationalProfile,
  selectedAssetTags,
  selectedAssetTagNames,
  canSaveActivo,
  requiredStatus,
  summaryItems,
  isStepCompleted,
  closeModal,
  selectAssetType,
  submitForm,
} = useFleetEditForm({ props, emit })

const isAssetTagSelected = (tagId) => {
  const selectedTagIds = Array.isArray(form.value.assetTagIds) ? form.value.assetTagIds : []

  return selectedTagIds.some((selectedTagId) => {
    return String(selectedTagId) === String(tagId)
  })
}

const toggleAssetTag = (tagId) => {
  const normalizedTagId = String(tagId)
  const currentTagIds = Array.isArray(form.value.assetTagIds)
    ? form.value.assetTagIds.map((currentTagId) => String(currentTagId))
    : []

  if (currentTagIds.includes(normalizedTagId)) {
    form.value.assetTagIds = currentTagIds.filter((currentTagId) => {
      return currentTagId !== normalizedTagId
    })

    return
  }

  form.value.assetTagIds = [...currentTagIds, normalizedTagId]
}
</script>
