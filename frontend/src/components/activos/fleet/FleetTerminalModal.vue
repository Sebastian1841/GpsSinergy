<template>
  <Teleport to="body">
    <div
      v-if="modelValue && activo"
      class="fixed inset-0 z-[2147483646] bg-slate-950/45"
      @click.self="closeModal"
    >
      <section
        ref="modalRef"
        class="fixed flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_28px_80px_rgba(15,23,42,0.35)] ring-1 ring-[#102372]/15"
        :class="isInteracting ? 'select-none' : ''"
        :style="modalFrameStyle"
      >
        <header
          class="flex h-14 shrink-0 touch-none cursor-move items-center justify-between gap-4 border-b border-[#102372]/10 bg-[#102372] px-4 text-white"
          @pointerdown="startDrag"
          @dblclick="resetFrame"
        >
          <div class="flex min-w-0 items-center gap-3">
            <div
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#FF6600] ring-1 ring-white/15"
            >
              <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" aria-hidden="true">
                <path
                  d="m8 9 3 3-3 3M13.5 15h3"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />

                <path
                  d="M4.75 6.75A2 2 0 0 1 6.75 4.75h10.5a2 2 0 0 1 2 2v10.5a2 2 0 0 1-2 2H6.75a2 2 0 0 1-2-2V6.75Z"
                  stroke="currentColor"
                  stroke-width="2"
                />
              </svg>
            </div>

            <div class="min-w-0">
              <p class="truncate font-mono text-xs font-black text-white">
                remote-session://{{ activo.imei || "tracker" }}
              </p>

              <p class="mt-0.5 truncate text-[11px] font-semibold text-white/65">
                {{ deviceName }} · {{ activo.protocol || "TCP" }} ·
                {{ terminalLogs.length }} registros
              </p>
            </div>
          </div>

          <div class="flex shrink-0 items-center gap-2" data-no-drag>
            <span
              class="hidden rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] sm:inline-flex"
              :class="
                isSending ? 'bg-[#FF6600]/20 text-orange-100' : 'bg-emerald-400/20 text-emerald-100'
              "
            >
              {{ isSending ? "Enviando" : "Online" }}
            </span>

            <button
              type="button"
              class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-xl font-black leading-none text-white/70 transition hover:bg-red-500/20 hover:text-white"
              @pointerdown.stop
              @click="closeModal"
            >
              ×
            </button>
          </div>
        </header>

        <main class="flex min-h-0 flex-1 flex-col bg-[#eef2f7] p-3">
          <div
            class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#d8dee8] bg-white shadow-sm"
          >
            <div
              class="flex shrink-0 flex-col gap-3 border-b border-[#e2e8f0] bg-white px-4 py-3 lg:flex-row lg:items-center lg:justify-between"
            >
              <div class="flex min-w-0 items-center gap-3">
                <div
                  class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#102372]/10 text-[#102372]"
                >
                  <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" aria-hidden="true">
                    <path
                      d="M4 7.5h16M4 12h16M4 16.5h10"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                    />
                  </svg>
                </div>

                <div class="min-w-0">
                  <p class="truncate text-sm font-black text-[#102372]">Terminal del dispositivo</p>

                  <p class="truncate text-[11px] font-semibold text-slate-500">
                    {{ deviceName }} · telemetría y comandos remotos
                  </p>
                </div>
              </div>

              <div
                class="flex shrink-0 items-center rounded-xl border border-[#d8dee8] bg-[#f8fafc] p-1"
                data-no-drag
              >
                <button
                  type="button"
                  class="flex items-center gap-2 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] transition"
                  :class="
                    activeTerminalModule === 'telemetry'
                      ? 'bg-[#102372] text-white shadow-sm'
                      : 'text-slate-500 hover:bg-white hover:text-[#102372]'
                  "
                  @click="activeTerminalModule = 'telemetry'"
                >
                  Telemetría

                  <span
                    class="rounded-full px-1.5 py-0.5 font-mono text-[9px]"
                    :class="
                      activeTerminalModule === 'telemetry'
                        ? 'bg-white/15 text-white'
                        : 'bg-[#eef3ff] text-[#102372]'
                    "
                  >
                    {{ visibleTelemetryRows.length }}/{{ telemetryRowCount }}
                  </span>
                </button>

                <button
                  type="button"
                  class="flex items-center gap-2 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] transition"
                  :class="
                    activeTerminalModule === 'commands'
                      ? 'bg-[#FF6600] text-white shadow-sm'
                      : 'text-slate-500 hover:bg-white hover:text-[#FF6600]'
                  "
                  @click="activeTerminalModule = 'commands'"
                >
                  Comandos

                  <span
                    class="rounded-full px-1.5 py-0.5 font-mono text-[9px]"
                    :class="
                      activeTerminalModule === 'commands'
                        ? 'bg-white/20 text-white'
                        : 'bg-[#fff7ed] text-[#FF6600]'
                    "
                  >
                    {{ commandRows.length }}
                  </span>
                </button>
              </div>
            </div>

            <!-- TELEMETRÍA -->
            <section
              v-if="activeTerminalModule === 'telemetry'"
              ref="terminalTableRef"
              class="min-h-0 flex-1 overflow-auto bg-white"
              @click="focusInput"
            >
              <table
                class="w-full min-w-[980px] border-separate border-spacing-0 text-left font-mono"
              >
                <thead
                  class="sticky top-0 z-10 bg-[#f8fafc] text-[10px] font-black uppercase tracking-[0.08em] text-slate-500 shadow-sm"
                >
                  <tr>
                    <th class="w-[82px] border-b border-[#dfe5ed] px-3 py-2">Hora</th>

                    <th class="w-[96px] border-b border-[#dfe5ed] px-3 py-2">Evento</th>

                    <th class="w-[94px] border-b border-[#dfe5ed] px-3 py-2">Estado</th>

                    <th class="w-[94px] border-b border-[#dfe5ed] px-3 py-2">Velocidad</th>

                    <th class="w-[190px] border-b border-[#dfe5ed] px-3 py-2">Posición</th>

                    <th class="border-b border-[#dfe5ed] px-3 py-2">Datos del dispositivo</th>
                  </tr>
                </thead>

                <tbody>
                  <tr v-if="!visibleTelemetryRows.length">
                    <td
                      colspan="6"
                      class="px-4 py-12 text-center text-xs font-semibold text-slate-400"
                    >
                      Sin telemetría recibida para este dispositivo.
                    </td>
                  </tr>

                  <tr
                    v-for="row in visibleTelemetryRows"
                    :key="row.id"
                    class="group text-slate-700 transition hover:bg-[#f8fafc]"
                  >
                    <td
                      class="border-b border-[#e8edf3] px-3 py-2.5 align-top text-[11px] font-black text-slate-500"
                    >
                      {{ row.time }}
                    </td>

                    <td class="border-b border-[#e8edf3] px-3 py-2.5 align-top">
                      <span
                        class="inline-flex rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-[0.06em]"
                        :class="getEventBadgeClass(row)"
                      >
                        {{ row.event }}
                      </span>
                    </td>

                    <td class="border-b border-[#e8edf3] px-3 py-2.5 align-top">
                      <span
                        class="inline-flex rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-[0.06em]"
                        :class="getStateBadgeClass(row.estado)"
                      >
                        {{ row.estadoLabel }}
                      </span>
                    </td>

                    <td
                      class="border-b border-[#e8edf3] px-3 py-2.5 align-top text-[11px] font-black text-[#102372]"
                    >
                      {{ row.velocidad }}
                    </td>

                    <td class="border-b border-[#e8edf3] px-3 py-2.5 align-top">
                      <dl class="space-y-1">
                        <div class="flex items-center justify-between gap-2">
                          <dt class="text-[9px] font-black uppercase tracking-wide text-slate-400">
                            Lat.
                          </dt>

                          <dd
                            class="truncate text-[10px] font-black text-[#102372]"
                            :title="String(row.lat || '')"
                          >
                            {{ getDisplayValue(row.lat) }}
                          </dd>
                        </div>

                        <div class="flex items-center justify-between gap-2">
                          <dt class="text-[9px] font-black uppercase tracking-wide text-slate-400">
                            Lng.
                          </dt>

                          <dd
                            class="truncate text-[10px] font-black text-[#102372]"
                            :title="String(row.lng || '')"
                          >
                            {{ getDisplayValue(row.lng) }}
                          </dd>
                        </div>
                      </dl>
                    </td>

                    <td class="border-b border-[#e8edf3] px-3 py-2 align-top">
                      <dl
                        v-if="row.telemetryDetails?.length"
                        class="grid grid-cols-2 gap-x-4 gap-y-0 xl:grid-cols-4"
                      >
                        <div
                          v-for="detail in row.telemetryDetails"
                          :key="detail.key"
                          class="flex min-w-0 items-center justify-between gap-2 border-b border-[#edf1f5] py-1"
                        >
                          <dt
                            class="min-w-0 truncate text-[9px] font-black uppercase tracking-wide text-slate-400"
                            :title="detail.label"
                          >
                            {{ detail.label }}
                          </dt>

                          <dd
                            class="shrink-0 whitespace-nowrap text-[10px] font-black text-[#102372]"
                            :title="String(detail.value)"
                          >
                            {{ detail.value }}
                          </dd>
                        </div>
                      </dl>

                      <p
                        v-else-if="row.message"
                        class="max-w-[680px] break-words text-[11px] font-semibold leading-relaxed text-slate-500"
                      >
                        {{ row.message }}
                      </p>

                      <p v-else class="text-[10px] font-semibold text-slate-400">
                        Sin datos adicionales
                      </p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>

            <!-- COMANDOS -->
            <section
              v-else
              ref="commandPanelRef"
              class="min-h-0 flex-1 overflow-auto bg-[#f8fafc] p-3"
              @click="focusInput"
            >
              <div
                v-if="!commandRows.length"
                class="flex h-full min-h-[220px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-5 text-center"
              >
                <div>
                  <p class="text-sm font-black text-[#102372]">Sin comandos enviados</p>

                  <p class="mt-1 text-xs font-semibold text-slate-500">
                    Escribe un comando abajo y al enviarlo aparecerá la respuesta en este módulo.
                  </p>
                </div>
              </div>

              <div v-else class="space-y-2">
                <article
                  v-for="row in commandRows"
                  :key="row.id"
                  class="rounded-xl border border-[#d8dee8] bg-white p-3 shadow-sm"
                  :class="row.type === 'error' ? 'border-red-200 bg-red-50/40' : ''"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex min-w-0 items-center gap-2">
                      <span
                        class="inline-flex rounded-full border px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-[0.08em]"
                        :class="getEventBadgeClass(row)"
                      >
                        {{ row.event }}
                      </span>

                      <span class="font-mono text-[11px] font-black text-slate-500">
                        {{ row.time }}
                      </span>
                    </div>

                    <span
                      class="shrink-0 rounded-full border px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-[0.08em]"
                      :class="getStateBadgeClass(row.estado)"
                    >
                      {{ row.estadoLabel }}
                    </span>
                  </div>

                  <p
                    class="mt-2 break-words font-mono text-xs font-semibold leading-relaxed text-slate-700"
                  >
                    {{ row.message }}
                  </p>
                </article>
              </div>
            </section>

            <TerminalInput
              v-model="terminalCommand"
              :is-sending="isSending"
              @submit-command="sendTerminalCommand"
            />
          </div>
        </main>

        <div
          class="absolute left-6 right-6 top-0 z-30 h-3 touch-none cursor-ns-resize"
          @pointerdown.stop="startResize($event, 'n')"
        ></div>

        <div
          class="absolute bottom-0 left-6 right-6 z-30 h-3 touch-none cursor-ns-resize"
          @pointerdown.stop="startResize($event, 's')"
        ></div>

        <div
          class="absolute bottom-6 left-0 top-6 z-30 w-3 touch-none cursor-ew-resize"
          @pointerdown.stop="startResize($event, 'w')"
        ></div>

        <div
          class="absolute bottom-6 right-0 top-6 z-30 w-3 touch-none cursor-ew-resize"
          @pointerdown.stop="startResize($event, 'e')"
        ></div>

        <div
          class="absolute left-0 top-0 z-40 h-6 w-6 touch-none cursor-nwse-resize"
          @pointerdown.stop="startResize($event, 'nw')"
        ></div>

        <div
          class="absolute right-0 top-0 z-40 h-6 w-6 touch-none cursor-nesw-resize"
          @pointerdown.stop="startResize($event, 'ne')"
        ></div>

        <div
          class="absolute bottom-0 left-0 z-40 h-6 w-6 touch-none cursor-nesw-resize"
          @pointerdown.stop="startResize($event, 'sw')"
        ></div>

        <div
          class="absolute bottom-0 right-0 z-40 h-6 w-6 touch-none cursor-nwse-resize"
          @pointerdown.stop="startResize($event, 'se')"
        ></div>
      </section>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, unref } from "vue"

import TerminalInput from "./terminal/TerminalInput.vue"

import { useFleetTerminalModal } from "../../../composables/activos/fleet/useFleetTerminalModal.js"

const MAX_VISIBLE_TELEMETRY_ROWS = 5

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  activo: {
    type: Object,
    default: null,
  },
  history: {
    type: Array,
    default: () => [],
  },
  simulateHistory: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(["update:modelValue", "send-command"])

const {
  activeTerminalModule,
  terminalTableRef,
  commandPanelRef,
  terminalCommand,
  terminalLogs,
  isSending,
  modalRef,
  modalFrameStyle,
  isInteracting,
  resetFrame,
  startDrag,
  startResize,
  deviceName,
  telemetryRows,
  commandRows,
  telemetryRowCount,
  focusInput,
  closeModal,
  sendTerminalCommand,
  getStateBadgeClass,
  getEventBadgeClass,
} = useFleetTerminalModal({ props, emit })

const visibleTelemetryRows = computed(() => {
  const rows = unref(telemetryRows)

  if (!Array.isArray(rows)) return []

  return rows.slice(0, MAX_VISIBLE_TELEMETRY_ROWS)
})

const normalizeTelemetryText = (value) => {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

const hasTelemetryValue = (value) => {
  if (value === null || value === undefined) return false

  const normalizedValue = normalizeTelemetryText(value)

  return !["", "-", "--", "n/a", "na", "null", "undefined", "sin dato"].includes(normalizedValue)
}

const getDisplayValue = (value) => {
  return hasTelemetryValue(value) ? value : "—"
}
</script>
