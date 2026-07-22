<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[900] flex items-end justify-center bg-slate-950/55 p-2 sm:items-center sm:p-4"
      @click.self="$emit('close')"
    >
      <section
        class="flex max-h-[calc(100vh-16px)] w-full max-w-[960px] flex-col overflow-hidden rounded-t-xl bg-white shadow-[0_24px_80px_rgba(15,23,42,0.34)] sm:max-h-[calc(100vh-32px)] sm:rounded-xl"
      >
        <header class="shrink-0 border-b border-white/10 bg-[#102372] px-4 py-3">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-[10px] font-black uppercase tracking-[0.16em] text-white/55">
                {{ reportDraft.id ? "Editar reporte" : "Nuevo reporte" }}
              </p>

              <h2 class="mt-0.5 truncate text-[15px] font-black text-white">
                {{ reportDraft.name || "Reporte personalizado" }}
              </h2>
            </div>

            <button
              type="button"
              class="rounded-lg px-2 py-1 text-[18px] font-black leading-none text-white/65 transition hover:bg-white/10 hover:text-white"
              @click="$emit('close')"
            >
              x
            </button>
          </div>
        </header>

        <nav class="shrink-0 border-b border-slate-200/80 bg-[#f6f8fb] p-2">
          <div class="grid grid-cols-2 gap-1 sm:grid-cols-4">
            <button
              v-for="step in modalSteps"
              :key="step.id"
              type="button"
              class="h-9 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap rounded-lg px-1 text-[10px] font-black uppercase tracking-[0.06em] transition"
              :class="
                activeStep === step.id
                  ? 'bg-[#102372] text-white'
                  : 'bg-white text-slate-500 hover:text-[#102372]'
              "
              @click="activeStep = step.id"
            >
              {{ step.label }}
            </button>
          </div>
        </nav>

        <div class="min-h-0 flex-1 overflow-auto bg-[#f6f8fb] p-3 sm:p-4">
          <section
            v-if="activeStep === 'datos'"
            class="min-w-0 rounded-lg bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70"
          >
            <p class="text-[10px] font-black uppercase tracking-[0.12em] text-[#ff6600]">Datos</p>

            <div class="mt-3 grid gap-3 sm:grid-cols-2">
              <label class="block sm:col-span-2">
                <span class="text-[10px] font-black uppercase text-slate-400">Nombre</span>
                <input
                  :value="reportDraft.name"
                  type="text"
                  class="mt-1 h-9 w-full rounded-lg border border-[#d8dee8] bg-white px-3 text-[12px] font-bold text-[#102372] outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/10"
                  placeholder="Kilometraje mensual"
                  @input="updateDraftField('name', $event.target.value)"
                />
              </label>

              <label class="block">
                <span class="text-[10px] font-black uppercase text-slate-400">Tipo</span>
                <select
                  :value="reportDraft.reportTypeId || ''"
                  class="mt-1 h-9 w-full rounded-lg border border-[#d8dee8] bg-white px-2 text-[11px] font-black text-[#102372] outline-none focus:border-[#ff6600]"
                  @change="updateDraftReportType($event.target.value)"
                >
                  <option value="">Personalizado</option>
                  <option
                    v-for="reportType in availableReportTypes"
                    :key="reportType.id"
                    :value="reportType.id"
                  >
                    {{ reportType.label }}
                  </option>
                </select>
              </label>

              <label class="block">
                <span class="text-[10px] font-black uppercase text-slate-400">Categoria</span>
                <select
                  :value="reportDraft.category"
                  class="mt-1 h-9 w-full rounded-lg border border-[#d8dee8] bg-white px-2 text-[11px] font-black text-[#102372] outline-none focus:border-[#ff6600]"
                  @change="updateDraftField('category', $event.target.value)"
                >
                  <option v-for="category in categories" :key="category.id" :value="category.id">
                    {{ category.label }}
                  </option>
                </select>
              </label>

              <label class="block">
                <span class="text-[10px] font-black uppercase text-slate-400">Estado</span>
                <select
                  :value="reportDraft.status"
                  class="mt-1 h-9 w-full rounded-lg border border-[#d8dee8] bg-white px-2 text-[11px] font-black text-[#102372] outline-none focus:border-[#ff6600]"
                  @change="updateDraftField('status', $event.target.value)"
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </label>

              <label class="block sm:col-span-2">
                <span class="text-[10px] font-black uppercase text-slate-400">Descripcion</span>
                <textarea
                  :value="reportDraft.description"
                  rows="5"
                  class="mt-1 w-full resize-none rounded-lg border border-[#d8dee8] bg-white px-3 py-2 text-[12px] font-semibold leading-relaxed text-[#102372] outline-none placeholder:text-slate-400 focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/10"
                  placeholder="Objetivo y alcance del reporte."
                  @input="updateDraftField('description', $event.target.value)"
                />
              </label>
            </div>
          </section>

          <section
            v-else-if="activeStep === 'evento'"
            class="min-w-0 rounded-lg bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <p class="text-[10px] font-black uppercase tracking-[0.12em] text-[#ff6600]">
                Reglas de evento
              </p>

              <span
                class="max-w-full break-words rounded-md bg-[#eef2f7] px-2 py-1 text-left text-[10px] font-black text-[#102372] sm:max-w-[60%] sm:text-right"
              >
                {{ eventRuleLabel }}
              </span>
            </div>

            <div class="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <button
                v-for="rule in availableEventRules"
                :key="rule.id"
                type="button"
                class="flex min-w-0 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 transition"
                :class="
                  isEventRuleSelected(rule.id)
                    ? 'border-[#102372] bg-[#eef2f7]'
                    : 'border-[#edf1f5] bg-white hover:border-[#ff6600]/50'
                "
                @click="toggleEventRule(rule.id)"
              >
                <input
                  type="checkbox"
                  class="h-3.5 w-3.5 accent-[#ff6600]"
                  :checked="isEventRuleSelected(rule.id)"
                  readonly
                  tabindex="-1"
                />

                <span class="min-w-0 text-left">
                  <span class="block text-[11px] font-black text-[#102372]">
                    {{ rule.label }}
                  </span>
                  <span class="block truncate text-[10px] font-semibold text-slate-500">
                    {{ rule.description }}
                  </span>
                </span>
              </button>
            </div>

            <div
              v-if="isRouteHistoryDraft"
              class="mt-4 rounded-lg border border-[#dbe4f0] bg-[#fbfdff] p-3"
            >
              <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div class="min-w-0">
                  <p class="text-[10px] font-black uppercase tracking-[0.1em] text-[#102372]">
                    Composicion de viajes
                  </p>

                  <p class="mt-1 text-[10px] font-semibold leading-relaxed text-slate-500">
                    Arma el reporte con las reglas que definen movimiento, detenciones, ralenti y
                    cierre de viaje.
                  </p>
                </div>

                <button
                  type="button"
                  class="h-8 w-full shrink-0 rounded-lg bg-[#102372] px-3 text-[9px] font-black uppercase tracking-[0.08em] text-white transition hover:bg-[#0c1b59] sm:w-auto"
                  @click="applyTripReportComposition"
                >
                  Aplicar viajes
                </button>
              </div>

              <div class="mt-3 grid gap-2 sm:grid-cols-2">
                <article
                  v-for="rule in tripReportRules"
                  :key="rule.id"
                  class="rounded-lg border px-3 py-2"
                  :class="
                    isEventRuleSelected(rule.id)
                      ? 'border-[#102372] bg-white'
                      : 'border-[#edf1f5] bg-[#f8fafc]'
                  "
                >
                  <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0">
                      <p class="text-[10px] font-black text-[#102372]">{{ rule.label }}</p>

                      <p class="mt-0.5 line-clamp-2 text-[9px] font-semibold text-slate-500">
                        {{ rule.description }}
                      </p>
                    </div>

                    <span
                      class="shrink-0 rounded-md px-1.5 py-0.5 text-[8px] font-black uppercase"
                      :class="
                        isEventRuleSelected(rule.id)
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      "
                    >
                      {{ isEventRuleSelected(rule.id) ? "Activa" : "Falta" }}
                    </span>
                  </div>
                </article>
              </div>
            </div>
          </section>

          <section
            v-else-if="activeStep === 'columnas'"
            class="min-w-0 rounded-lg bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70"
          >
            <div class="flex items-center justify-between gap-3">
              <p class="text-[10px] font-black uppercase tracking-[0.12em] text-[#ff6600]">
                Columnas
              </p>

              <span class="rounded-md bg-[#eef2f7] px-2 py-1 text-[10px] font-black text-[#102372]">
                {{ selectedColumnsCount }} seleccionadas
              </span>
            </div>

            <div class="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <label
                v-for="column in availableColumns"
                :key="column.id"
                class="flex min-w-0 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 transition"
                :class="
                  reportDraft.columns.includes(column.id)
                    ? 'border-[#102372] bg-[#eef2f7]'
                    : 'border-[#edf1f5] bg-white hover:border-[#ff6600]/50'
                "
              >
                <input
                  type="checkbox"
                  class="h-3.5 w-3.5 accent-[#ff6600]"
                  :checked="reportDraft.columns.includes(column.id)"
                  :disabled="isRequiredColumn(column.id)"
                  @change="toggleDraftListValue('columns', column.id)"
                />

                <span class="min-w-0">
                  <span class="block truncate text-[11px] font-black text-[#102372]">
                    {{ column.label }}
                  </span>
                  <span class="block text-[9px] font-black uppercase text-slate-400">
                    {{ isRequiredColumn(column.id) ? "Obligatoria" : column.group }}
                  </span>
                </span>
              </label>
            </div>
          </section>

          <section v-else class="grid min-w-0 gap-3 lg:grid-cols-[250px_minmax(0,1fr)]">
            <div
              class="min-w-0 rounded-lg bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70"
            >
              <p class="text-[10px] font-black uppercase tracking-[0.12em] text-[#ff6600]">Vista</p>

              <div class="mt-3 grid gap-2">
                <label
                  v-for="widget in availableWidgets"
                  :key="widget.id"
                  class="flex min-w-0 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 transition"
                  :class="
                    reportDraft.widgets.includes(widget.id)
                      ? 'border-[#102372] bg-[#eef2f7]'
                      : 'border-[#edf1f5] bg-white hover:border-[#ff6600]/50'
                  "
                >
                  <input
                    type="checkbox"
                    class="h-3.5 w-3.5 accent-[#ff6600]"
                    :checked="reportDraft.widgets.includes(widget.id)"
                    @change="toggleDraftListValue('widgets', widget.id)"
                  />
                  <span class="min-w-0">
                    <span class="block truncate text-[11px] font-black text-[#102372]">
                      {{ widget.label }}
                    </span>

                    <span class="mt-0.5 block truncate text-[9px] font-bold text-slate-400">
                      {{ widget.description }}
                    </span>
                  </span>
                </label>
              </div>

              <div class="mt-4 border-t border-[#edf1f5] pt-4">
                <p class="text-[10px] font-black uppercase tracking-[0.12em] text-[#ff6600]">
                  Comportamiento
                </p>

                <div class="mt-3 grid gap-3">
                  <section
                    v-for="group in visibleBehaviorOptionGroups"
                    :key="group.id"
                    class="rounded-lg border border-[#edf1f5] bg-[#f8fafc] p-3"
                  >
                    <p class="text-[10px] font-black text-[#102372]">{{ group.label }}</p>

                    <p class="mt-0.5 text-[9px] font-semibold leading-relaxed text-slate-500">
                      {{ group.description }}
                    </p>

                    <div class="mt-2 grid gap-1.5">
                      <label
                        v-for="option in getVisibleBehaviorOptions(group)"
                        :key="option.id"
                        class="flex cursor-pointer items-start gap-2 rounded-md bg-white px-2 py-2"
                      >
                        <input
                          v-if="option.type === 'checkbox'"
                          type="checkbox"
                          class="mt-0.5 h-3.5 w-3.5 accent-[#ff6600]"
                          :checked="isBehaviorOptionEnabled(option.id)"
                          @change="updateDraftBehaviorOption(option.id, $event.target.checked)"
                        />

                        <input
                          v-else-if="option.type === 'number'"
                          type="number"
                          class="mt-0.5 h-7 w-14 rounded-md border border-[#d8dee8] px-2 text-[10px] font-black text-[#102372] outline-none focus:border-[#ff6600]"
                          :min="option.min"
                          :max="option.max"
                          :step="option.step"
                          :value="getBehaviorOptionValue(option.id)"
                          @input="updateDraftBehaviorOption(option.id, $event.target.value)"
                        />

                        <span class="min-w-0">
                          <span class="block text-[10px] font-black text-[#102372]">
                            {{ option.label }}
                          </span>

                          <span
                            class="mt-0.5 block text-[9px] font-semibold leading-snug text-slate-500"
                          >
                            {{ option.description }}
                          </span>
                        </span>
                      </label>
                    </div>
                  </section>
                </div>
              </div>

              <div class="mt-4 border-t border-[#edf1f5] pt-4">
                <p class="text-[10px] font-black uppercase tracking-[0.12em] text-[#ff6600]">
                  Salida
                </p>

                <div class="mt-3 grid gap-3">
                  <section
                    v-for="group in visibleOutputOptionGroups"
                    :key="group.id"
                    class="rounded-lg border border-[#edf1f5] bg-[#f8fafc] p-3"
                  >
                    <p class="text-[10px] font-black text-[#102372]">{{ group.label }}</p>

                    <p class="mt-0.5 text-[9px] font-semibold leading-relaxed text-slate-500">
                      {{ group.description }}
                    </p>

                    <div class="mt-2 grid gap-1.5">
                      <label
                        v-for="option in group.options"
                        :key="option.id"
                        class="flex cursor-pointer items-start gap-2 rounded-md bg-white px-2 py-2"
                      >
                        <input
                          type="checkbox"
                          class="mt-0.5 h-3.5 w-3.5 accent-[#ff6600]"
                          :checked="isOutputOptionEnabled(option.id)"
                          @change="updateDraftOutputOption(option.id, $event.target.checked)"
                        />

                        <span class="min-w-0">
                          <span class="block text-[10px] font-black text-[#102372]">
                            {{ option.label }}
                          </span>

                          <span
                            class="mt-0.5 block text-[9px] font-semibold leading-snug text-slate-500"
                          >
                            {{ option.description }}
                          </span>
                        </span>
                      </label>
                    </div>
                  </section>
                </div>
              </div>
            </div>

            <div
              class="min-w-0 rounded-lg bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="text-[10px] font-black uppercase tracking-[0.12em] text-[#ff6600]">
                    Vista previa
                  </p>
                  <h3 class="mt-0.5 truncate text-[14px] font-black text-[#102372]">
                    {{ reportDraft.name || "Reporte personalizado" }}
                  </h3>
                  <p
                    class="mt-0.5 flex flex-wrap items-center gap-x-1 gap-y-0.5 text-[10px] font-bold text-slate-500"
                  >
                    <span class="min-w-0 break-words">{{ categoryLabel }}</span>
                    <span class="text-slate-300">-</span>
                    <span class="min-w-0 break-words">{{ eventRuleLabel }}</span>
                  </p>
                </div>

                <span
                  class="shrink-0 rounded-md px-2 py-1 text-[9px] font-black uppercase"
                  :class="
                    reportDraft.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                  "
                >
                  {{ reportDraft.status === "active" ? "Activo" : "Inactivo" }}
                </span>
              </div>

              <div
                v-if="reportDraft.widgets.includes(REPORT_WIDGET_IDS.summaryCards)"
                class="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3"
              >
                <article
                  v-for="card in previewCards"
                  :key="card.label"
                  class="min-w-0 rounded-lg border border-[#edf1f5] bg-[#f8fafc] px-2 py-2"
                >
                  <p class="text-[9px] font-black uppercase text-slate-400">{{ card.label }}</p>
                  <p class="mt-1 break-words text-[15px] font-black text-[#102372]">
                    {{ card.value }}
                  </p>
                </article>
              </div>

              <div
                v-if="reportDraft.widgets.includes(REPORT_WIDGET_IDS.charts)"
                class="mt-3 rounded-lg border border-[#dbe4f0] bg-[#fbfdff] p-3"
              >
                <div class="flex items-center justify-between gap-3">
                  <div class="min-w-0">
                    <p class="truncate text-[10px] font-black uppercase text-slate-400">
                      Graficos habilitados
                    </p>
                    <p class="mt-1 text-[11px] font-bold leading-relaxed text-[#102372]">
                      Al ejecutar el reporte se podran agregar graficos y elegir variables con los
                      datos reales.
                    </p>
                  </div>

                  <span
                    class="rounded-md bg-[#102372]/10 px-2 py-1 text-[9px] font-black text-[#102372]"
                  >
                    Opcional
                  </span>
                </div>

                <div v-if="recommendedChartOptions.length" class="mt-3">
                  <p class="text-[9px] font-black uppercase tracking-[0.1em] text-slate-400">
                    Graficos recomendados
                  </p>

                  <div class="mt-2 grid gap-2 sm:grid-cols-2">
                    <article
                      v-for="chart in recommendedChartOptions"
                      :key="chart.id"
                      class="rounded-lg border border-[#edf1f5] bg-white px-3 py-2"
                    >
                      <div class="flex items-center justify-between gap-2">
                        <p class="truncate text-[10px] font-black text-[#102372]">
                          {{ chart.label }}
                        </p>

                        <span
                          class="shrink-0 rounded-md bg-[#eef2ff] px-1.5 py-0.5 text-[8px] font-black uppercase text-[#102372]"
                        >
                          {{ chart.chartTypeLabel }}
                        </span>
                      </div>

                      <p class="mt-1 line-clamp-2 text-[9px] font-semibold text-slate-500">
                        {{ chart.detail }}
                      </p>
                    </article>
                  </div>
                </div>
              </div>

              <div
                v-if="
                  isRouteHistoryDraft &&
                  isOutputOptionEnabled(REPORT_OUTPUT_OPTION_IDS.previewTripMap)
                "
                class="mt-3 rounded-lg border border-[#dbe4f0] bg-[#fbfdff] p-3"
              >
                <div class="h-28 overflow-hidden rounded-lg border border-[#d8dee8] bg-[#eef4fb]">
                  <div class="flex h-full items-center justify-center px-4 text-center">
                    <div>
                      <p class="text-[10px] font-black uppercase tracking-[0.1em] text-[#102372]">
                        Mapa de viajes
                      </p>

                      <p
                        class="mt-1 max-w-[260px] text-[10px] font-bold leading-relaxed text-slate-500"
                      >
                        Se genera con los recorridos reales cuando ejecutes el reporte.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div
                v-if="reportDraft.widgets.includes(REPORT_WIDGET_IDS.table)"
                class="mt-3 overflow-x-auto rounded-lg border border-[#edf1f5]"
              >
                <table class="min-w-[520px] text-left">
                  <thead class="bg-[#102372] text-white">
                    <tr>
                      <th
                        v-for="column in visiblePreviewColumns"
                        :key="column.id"
                        class="whitespace-nowrap px-2 py-2 text-[9px] font-black uppercase"
                      >
                        {{ column.label }}
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr
                      v-for="row in previewRows"
                      :key="row"
                      class="border-b border-[#edf1f5] last:border-b-0"
                    >
                      <td
                        v-for="column in visiblePreviewColumns"
                        :key="`${row}-${column.id}`"
                        class="whitespace-nowrap px-2 py-2 text-[10px] font-bold text-slate-600"
                      >
                        {{ getPreviewValue(column.id, row) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div
                v-if="hiddenColumnsCount"
                class="mt-2 rounded-md bg-[#eef2f7] px-2 py-1 text-[10px] font-black text-slate-500"
              >
                +{{ hiddenColumnsCount }} columnas adicionales
              </div>
            </div>
          </section>
        </div>

        <footer class="shrink-0 border-t border-[#edf1f5] bg-white px-3 py-3">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex w-full flex-wrap gap-2 sm:w-auto">
              <button
                type="button"
                class="h-9 flex-1 rounded-lg border border-[#d8dee8] bg-white px-4 text-[10px] font-black uppercase tracking-[0.08em] text-slate-500 transition hover:border-[#ff6600] hover:text-[#ff6600] sm:flex-none"
                @click="$emit('close')"
              >
                Cancelar
              </button>

              <button
                v-if="canDeleteDraft"
                type="button"
                class="h-9 flex-1 rounded-lg border border-red-200 bg-white px-4 text-[10px] font-black uppercase tracking-[0.08em] text-red-600 transition hover:bg-red-50 sm:flex-none"
                @click="deleteReport"
              >
                Eliminar
              </button>
            </div>

            <div class="flex w-full flex-wrap gap-2 sm:w-auto">
              <button
                type="button"
                class="h-9 flex-1 rounded-lg border border-[#d8dee8] bg-white px-4 text-[10px] font-black uppercase tracking-[0.08em] text-[#102372] transition hover:border-[#ff6600] hover:text-[#ff6600] disabled:cursor-not-allowed disabled:text-slate-300 sm:flex-none"
                :disabled="currentStepIndex === 0"
                @click="goPreviousStep"
              >
                Atras
              </button>

              <button
                v-if="currentStepIndex < modalSteps.length - 1"
                type="button"
                class="h-9 flex-1 rounded-lg bg-[#102372] px-4 text-[10px] font-black uppercase tracking-[0.08em] text-white transition hover:bg-[#0c1b59] sm:flex-none"
                @click="goNextStep"
              >
                Siguiente
              </button>

              <button
                type="button"
                class="h-9 flex-1 rounded-lg bg-[#ff6600] px-4 text-[10px] font-black uppercase tracking-[0.08em] text-white transition hover:bg-[#e65c00] disabled:cursor-not-allowed disabled:bg-slate-300 sm:flex-none"
                :disabled="!canSaveDraft"
                @click="saveReport"
              >
                Guardar
              </button>
            </div>
          </div>
        </footer>
      </section>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from "vue"

import { useReportBuilder } from "../../composables/reports/useReportBuilder.js"
import { REQUIRED_REPORT_COLUMN_IDS } from "../../data/mockReportTemplates.js"
import {
  REPORT_BEHAVIOR_OPTION_IDS,
  REPORT_BEHAVIOR_OPTION_GROUPS,
  normalizeReportBehaviorOptions,
} from "../../utils/reports/config/reportBehaviorOptions.js"
import { getReportChartRecommendations } from "../../utils/reports/config/reportChartRecommendations.js"
import {
  REPORT_OUTPUT_OPTION_GROUPS,
  REPORT_OUTPUT_OPTION_IDS,
  normalizeReportOutputOptions,
} from "../../utils/reports/config/reportOutputOptions.js"
import {
  REPORT_TEMPLATE_MODAL_STEPS,
  REPORT_TEMPLATE_PREVIEW_CARDS,
  REPORT_TEMPLATE_PREVIEW_ROWS,
  TRIP_REPORT_COLUMN_IDS,
  TRIP_REPORT_RULE_IDS,
  TRIP_REPORT_WIDGET_IDS,
  getReportTemplatePreviewValue,
} from "../../utils/reports/views/reportTemplateModalConfig.js"

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  template: {
    type: Object,
    default: null,
  },
  categories: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(["close", "delete", "save"])

const {
  reportDraft,
  availableReportTypes,
  availableEventRules,
  availableColumns,
  availableWidgets,
  canSaveDraft,
  selectedColumnsCount,
  setReportDraft,
  updateDraftField,
  updateDraftReportType,
  updateDraftBehaviorOption,
  updateDraftOutputOption,
  toggleDraftListValue,
  getReportPayload,
} = useReportBuilder()

const modalSteps = REPORT_TEMPLATE_MODAL_STEPS
const previewCards = REPORT_TEMPLATE_PREVIEW_CARDS
const previewRows = REPORT_TEMPLATE_PREVIEW_ROWS
const activeStep = ref(modalSteps[0].id)

watch(
  () => [props.open, props.template],
  ([open]) => {
    if (!open) return
    activeStep.value = modalSteps[0].id
    setReportDraft(props.template)
  },
  {
    immediate: true,
  },
)

const currentStepIndex = computed(() => {
  return Math.max(
    modalSteps.findIndex((step) => step.id === activeStep.value),
    0,
  )
})

const categoryLabel = computed(() => {
  return (
    props.categories.find((category) => category.id === reportDraft.value.category)?.label ||
    "Sin categoria"
  )
})

const selectedEventRuleIds = computed(() => {
  if (Array.isArray(reportDraft.value.eventRuleIds) && reportDraft.value.eventRuleIds.length) {
    return reportDraft.value.eventRuleIds
  }

  return reportDraft.value.eventRuleId ? [reportDraft.value.eventRuleId] : []
})

const selectedEventRuleLabels = computed(() => {
  return selectedEventRuleIds.value
    .map((ruleId) => availableEventRules.value.find((rule) => rule.id === ruleId)?.label)
    .filter(Boolean)
})

const tripReportRules = computed(() => {
  return TRIP_REPORT_RULE_IDS.map((ruleId) => {
    return availableEventRules.value.find((rule) => rule.id === ruleId)
  }).filter(Boolean)
})

const eventRuleLabel = computed(() => {
  if (!selectedEventRuleLabels.value.length) return "Selecciona reglas"
  if (selectedEventRuleLabels.value.length <= 2) {
    return selectedEventRuleLabels.value.join(" + ")
  }

  return `${selectedEventRuleLabels.value[0]} + ${selectedEventRuleLabels.value.length - 1} reglas`
})

const recommendedChartOptions = computed(() => {
  return getReportChartRecommendations({
    reportTypeId: reportDraft.value.reportTypeId,
    eventRuleIds: selectedEventRuleIds.value,
    columnIds: reportDraft.value.columns,
    category: reportDraft.value.category,
  })
})

const visibleOutputOptionGroups = computed(() => {
  return REPORT_OUTPUT_OPTION_GROUPS.filter((group) => {
    if (!Array.isArray(group.reportTypeIds) || !group.reportTypeIds.length) return true

    return group.reportTypeIds.includes(reportDraft.value.reportTypeId)
  })
})

const visibleBehaviorOptionGroups = computed(() => {
  return REPORT_BEHAVIOR_OPTION_GROUPS.filter((group) => {
    if (!Array.isArray(group.reportTypeIds) || !group.reportTypeIds.length) return true

    return group.reportTypeIds.includes(reportDraft.value.reportTypeId)
  })
})

const normalizedOutputOptions = computed(() => {
  return normalizeReportOutputOptions(reportDraft.value.outputOptions)
})

const normalizedBehaviorOptions = computed(() => {
  return normalizeReportBehaviorOptions(reportDraft.value.behaviorOptions)
})

const isRouteHistoryDraft = computed(() => {
  return String(reportDraft.value.reportTypeId || "") === "route-history"
})

const selectedColumns = computed(() => {
  return reportDraft.value.columns
    .map((columnId) => availableColumns.value.find((column) => column.id === columnId))
    .filter(Boolean)
})

const visiblePreviewColumns = computed(() => {
  return selectedColumns.value.slice(0, 5)
})

const hiddenColumnsCount = computed(() => {
  return Math.max(selectedColumns.value.length - visiblePreviewColumns.value.length, 0)
})

const canDeleteDraft = computed(() => {
  return Boolean(reportDraft.value.id)
})

const isRequiredColumn = (columnId) => {
  return REQUIRED_REPORT_COLUMN_IDS.includes(columnId)
}

const isEventRuleSelected = (ruleId) => {
  return selectedEventRuleIds.value.includes(ruleId)
}

const isOutputOptionEnabled = (optionId) => {
  return normalizedOutputOptions.value[optionId] === true
}

const isBehaviorOptionEnabled = (optionId) => {
  return normalizedBehaviorOptions.value[optionId] === true
}

const getBehaviorOptionValue = (optionId) => {
  return normalizedBehaviorOptions.value[optionId]
}

const getVisibleBehaviorOptions = (group) => {
  return (group.options || []).filter((option) => {
    if (!Array.isArray(option.reportTypeIds) || !option.reportTypeIds.length) return true

    return option.reportTypeIds.includes(reportDraft.value.reportTypeId)
  })
}

const setEventRuleIds = (eventRuleIds) => {
  const nextEventRuleIds = eventRuleIds.filter((ruleId) => ruleId !== "all")

  updateDraftField("eventRuleIds", nextEventRuleIds)
  updateDraftField("eventRuleId", nextEventRuleIds[0] || null)
}

const applyTripReportComposition = () => {
  const eventRuleIds = tripReportRules.value.map((rule) => rule.id)
  const columnIds = Array.from(new Set([...REQUIRED_REPORT_COLUMN_IDS, ...TRIP_REPORT_COLUMN_IDS]))

  updateDraftField("reportTypeId", "route-history")
  updateDraftField("category", "itineraries")
  setEventRuleIds(eventRuleIds)
  updateDraftField("columns", columnIds)
  updateDraftField("widgets", TRIP_REPORT_WIDGET_IDS)

  updateDraftBehaviorOption(REPORT_BEHAVIOR_OPTION_IDS.resolveAddresses, true)
  updateDraftBehaviorOption(REPORT_BEHAVIOR_OPTION_IDS.resolveTripEndpoints, true)
  updateDraftBehaviorOption(REPORT_BEHAVIOR_OPTION_IDS.routeTripIncludeStopEvents, true)
  updateDraftBehaviorOption(REPORT_BEHAVIOR_OPTION_IDS.routeTripIncludeIdleEvents, true)

  updateDraftOutputOption(REPORT_OUTPUT_OPTION_IDS.previewTripMap, true)
  updateDraftOutputOption(REPORT_OUTPUT_OPTION_IDS.pdfTripMap, true)
  updateDraftOutputOption(REPORT_OUTPUT_OPTION_IDS.excelTripMap, true)
}

const toggleEventRule = (ruleId) => {
  const currentEventRuleIds = selectedEventRuleIds.value

  const nextEventRuleIds = currentEventRuleIds.includes(ruleId)
    ? currentEventRuleIds.filter((eventRuleId) => eventRuleId !== ruleId)
    : [...currentEventRuleIds, ruleId]

  setEventRuleIds(nextEventRuleIds)
}

const goPreviousStep = () => {
  const nextIndex = Math.max(currentStepIndex.value - 1, 0)
  activeStep.value = modalSteps[nextIndex].id
}

const goNextStep = () => {
  const nextIndex = Math.min(currentStepIndex.value + 1, modalSteps.length - 1)
  activeStep.value = modalSteps[nextIndex].id
}

const getPreviewValue = getReportTemplatePreviewValue

const saveReport = () => {
  if (!canSaveDraft.value) return

  emit("save", {
    templateId: reportDraft.value.id,
    payload: getReportPayload(),
  })
}

const deleteReport = () => {
  if (!canDeleteDraft.value) return

  emit("delete", reportDraft.value.id)
}
</script>
