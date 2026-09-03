<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[900] flex items-end justify-center overflow-hidden bg-slate-950/55 p-0 sm:items-center sm:p-4"
      @click.self="$emit('close')"
    >
      <section
        class="flex h-[100dvh] w-full max-w-none flex-col overflow-hidden rounded-none bg-white shadow-[0_24px_80px_rgba(15,23,42,0.34)] sm:h-[calc(100dvh-32px)] sm:rounded-xl"
      >
        <header class="shrink-0 border-b border-white/10 bg-[#102372] px-4 py-3 sm:px-5">
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

        <nav class="shrink-0 border-b border-slate-200 bg-white px-2 sm:px-5">
          <div class="flex gap-1 overflow-x-auto">
            <button
              v-for="step in modalSteps"
              :key="step.id"
              type="button"
              class="h-12 min-w-[128px] shrink-0 overflow-hidden border-b-[3px] px-3 text-[10px] font-black uppercase tracking-[0.11em] transition sm:min-w-0 sm:flex-1"
              :class="
                activeStep === step.id
                  ? 'border-[#ff6600] text-[#102372]'
                  : 'border-transparent text-slate-500 hover:text-[#102372]'
              "
              @click="activeStep = step.id"
            >
              {{ step.label }}
            </button>
          </div>
        </nav>

        <div class="min-h-0 flex-1 overflow-auto bg-[#f6f8fb] p-2 sm:p-3 lg:p-4">
          <section
            v-if="activeStep === 'tipo'"
            class="min-w-0 rounded-lg bg-white p-3 shadow-[0_1px_3px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70 sm:p-4"
          >
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="text-[10px] font-black uppercase tracking-[0.12em] text-[#ff6600]">
                  Tipo de reporte
                </p>

                <h3 class="mt-1 text-[16px] font-black text-[#102372]">
                  Elige una base de configuracion
                </h3>

                <p class="mt-1 max-w-[620px] text-[11px] font-semibold leading-5 text-slate-500">
                  El tipo aplica columnas, reglas, vista y exportacion recomendada. Despues puedes
                  ajustar cada parte.
                </p>
              </div>

              <span
                class="rounded-md bg-[#eef3ff] px-2.5 py-1 text-[10px] font-black text-[#102372]"
              >
                {{ reportTypeLabel }}
              </span>
            </div>

            <div class="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <button
                type="button"
                class="min-h-[96px] rounded-lg border p-3 text-left transition"
                :class="
                  !reportDraft.reportTypeId
                    ? 'border-[#ff6600] bg-[#fff7ed] shadow-sm'
                    : 'border-[#d8dee8] bg-white hover:border-[#ff6600]/60'
                "
                @click="updateDraftReportType('')"
              >
                <span
                  class="rounded-md bg-[#eef3ff] px-2 py-1 text-[9px] font-black uppercase text-[#102372]"
                >
                  Libre
                </span>

                <p class="mt-3 text-[14px] font-black text-[#102372]">Personalizado</p>

                <p class="mt-1 text-[11px] font-semibold leading-5 text-slate-500">
                  Parte desde una base simple para definir reglas, columnas y exportacion
                  manualmente.
                </p>
              </button>

              <button
                v-for="reportType in availableReportTypes"
                :key="reportType.id"
                type="button"
                class="min-h-[96px] rounded-lg border p-3 text-left transition"
                :class="
                  reportDraft.reportTypeId === reportType.id
                    ? 'border-[#ff6600] bg-[#fff7ed] shadow-sm'
                    : 'border-[#d8dee8] bg-white hover:border-[#ff6600]/60'
                "
                @click="updateDraftReportType(reportType.id)"
              >
                <span
                  class="rounded-md bg-[#eef3ff] px-2 py-1 text-[9px] font-black uppercase text-[#102372]"
                >
                  {{ reportType.category }}
                </span>

                <p class="mt-3 text-[14px] font-black text-[#102372]">
                  {{ reportType.label }}
                </p>

                <p class="mt-1 text-[11px] font-semibold leading-5 text-slate-500">
                  {{ reportType.description }}
                </p>
              </button>
            </div>
          </section>

          <section
            v-else-if="activeStep === 'datos'"
            class="min-w-0 rounded-lg bg-white p-3 shadow-[0_1px_3px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70 sm:p-4"
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
            v-else-if="activeStep === 'comportamiento'"
            class="min-w-0 rounded-lg bg-white p-3 shadow-[0_1px_3px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70 sm:p-4"
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

            <div class="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
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

            <details
              v-if="visibleBehaviorOptionGroups.length"
              class="mt-4 rounded-lg border border-[#dbe4f0] bg-[#fbfdff] p-3"
            >
              <summary
                class="cursor-pointer text-[10px] font-black uppercase tracking-[0.1em] text-[#102372]"
              >
                Opciones avanzadas de comportamiento
              </summary>

              <div class="mt-3 grid gap-3 lg:grid-cols-2">
                <section
                  v-for="group in visibleBehaviorOptionGroups"
                  :key="group.id"
                  class="rounded-lg border border-[#edf1f5] bg-white p-3"
                >
                  <p class="text-[10px] font-black text-[#102372]">{{ group.label }}</p>

                  <p class="mt-0.5 text-[9px] font-semibold leading-relaxed text-slate-500">
                    {{ group.description }}
                  </p>

                  <div class="mt-2 grid gap-1.5">
                    <label
                      v-for="option in getVisibleBehaviorOptions(group)"
                      :key="option.id"
                      class="flex cursor-pointer items-start gap-2 rounded-md bg-[#f8fafc] px-2 py-2"
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
            </details>
          </section>

          <section
            v-else-if="activeStep === 'visualizacion'"
            class="min-w-0 rounded-lg bg-white p-3 shadow-[0_1px_3px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70 sm:p-4"
          >
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="text-[10px] font-black uppercase tracking-[0.12em] text-[#ff6600]">
                  Visualizacion
                </p>

                <h3 class="mt-1 text-[16px] font-black text-[#102372]">
                  Define lo que vera el usuario
                </h3>
              </div>

              <div class="flex flex-wrap gap-2">
                <span
                  class="rounded-md bg-[#eef2f7] px-2 py-1 text-[10px] font-black text-[#102372]"
                >
                  {{ selectedFiltersCount }} filtros
                </span>

                <span
                  class="rounded-md bg-[#eef2f7] px-2 py-1 text-[10px] font-black text-[#102372]"
                >
                  {{ selectedColumnsCount }} columnas
                </span>
              </div>
            </div>

            <div class="mt-4 grid gap-3 xl:grid-cols-[minmax(240px,0.8fr)_minmax(0,1.2fr)]">
              <div class="grid gap-3">
                <section class="rounded-lg border border-[#edf1f5] bg-[#fbfdff] p-3">
                  <div class="flex items-center justify-between gap-3">
                    <p class="text-[10px] font-black uppercase tracking-[0.12em] text-[#102372]">
                      Filtros
                    </p>

                    <span class="text-[10px] font-black text-slate-400">
                      {{ selectedFiltersCount }} seleccionados
                    </span>
                  </div>

                  <div class="mt-3 grid gap-2">
                    <label
                      v-for="filter in availableFilters"
                      :key="filter.id"
                      class="flex min-w-0 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 transition"
                      :class="
                        reportDraft.filters.includes(filter.id)
                          ? 'border-[#102372] bg-[#eef2f7]'
                          : 'border-[#edf1f5] bg-white hover:border-[#ff6600]/50'
                      "
                    >
                      <input
                        type="checkbox"
                        class="h-3.5 w-3.5 accent-[#ff6600]"
                        :checked="reportDraft.filters.includes(filter.id)"
                        :disabled="isRequiredFilter(filter.id)"
                        @change="toggleDraftListValue('filters', filter.id)"
                      />

                      <span class="min-w-0">
                        <span class="block truncate text-[11px] font-black text-[#102372]">
                          {{ filter.label }}
                        </span>

                        <span class="block truncate text-[9px] font-bold text-slate-400">
                          {{ isRequiredFilter(filter.id) ? "Obligatorio" : filter.type }}
                        </span>
                      </span>
                    </label>
                  </div>
                </section>

                <section class="rounded-lg border border-[#edf1f5] bg-[#fbfdff] p-3">
                  <p class="text-[10px] font-black uppercase tracking-[0.12em] text-[#102372]">
                    Bloques visuales
                  </p>

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

                        <span class="block truncate text-[9px] font-bold text-slate-400">
                          {{ widget.description }}
                        </span>
                      </span>
                    </label>
                  </div>
                </section>
              </div>

              <section class="rounded-lg border border-[#edf1f5] bg-[#fbfdff] p-3">
                <div class="flex items-center justify-between gap-3">
                  <p class="text-[10px] font-black uppercase tracking-[0.12em] text-[#102372]">
                    Columnas
                  </p>

                  <span
                    class="rounded-md bg-[#eef2f7] px-2 py-1 text-[10px] font-black text-[#102372]"
                  >
                    {{ selectedColumnsCount }} seleccionadas
                  </span>
                </div>

                <div class="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
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
            </div>

            <div
              v-if="
                recommendedChartOptions.length &&
                reportDraft.widgets.includes(REPORT_WIDGET_IDS.charts)
              "
              class="mt-3 rounded-lg border border-[#dbe4f0] bg-[#fbfdff] p-3"
            >
              <p class="text-[10px] font-black uppercase tracking-[0.12em] text-[#102372]">
                Graficos recomendados
              </p>

              <div class="mt-2 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
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

            <section class="mt-3 rounded-lg border border-[#dbe4f0] bg-[#fbfdff] p-3">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p class="text-[10px] font-black uppercase tracking-[0.12em] text-[#102372]">
                    Resultado de la vista
                  </p>

                  <p class="mt-0.5 text-[10px] font-semibold text-slate-500">
                    Estos bloques se veran cuando guardes y ejecutes el reporte.
                  </p>
                </div>

                <span
                  class="rounded-md bg-white px-2 py-1 text-[10px] font-black text-slate-500 ring-1 ring-slate-200"
                >
                  {{ selectedWidgetLabels.length }} bloques
                </span>
              </div>

              <div class="mt-3 grid gap-2 md:grid-cols-3">
                <article
                  v-for="item in viewPreviewItems"
                  :key="item.id"
                  class="rounded-lg border px-3 py-2"
                  :class="getDraftOptionCardClass(item.enabled)"
                >
                  <div class="flex items-center justify-between gap-2">
                    <p class="text-[11px] font-black text-[#102372]">{{ item.label }}</p>

                    <span
                      class="rounded-md px-2 py-0.5 text-[9px] font-black uppercase"
                      :class="getDraftOptionStatusClass(item.enabled)"
                    >
                      {{ getDraftOptionStatusLabel(item.enabled) }}
                    </span>
                  </div>

                  <p class="mt-1 text-[9px] font-semibold leading-snug text-slate-500">
                    {{ item.detail }}
                  </p>
                </article>
              </div>

              <div
                v-if="reportDraft.widgets.includes(REPORT_WIDGET_IDS.table)"
                class="mt-3 overflow-x-auto rounded-lg border border-[#edf1f5] bg-white"
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
                      v-for="row in previewRows.slice(0, 2)"
                      :key="`visual-${row}`"
                      class="border-b border-[#edf1f5] last:border-b-0"
                    >
                      <td
                        v-for="column in visiblePreviewColumns"
                        :key="`visual-${row}-${column.id}`"
                        class="whitespace-nowrap px-2 py-2 text-[10px] font-bold text-slate-600"
                      >
                        {{ getPreviewValue(column.id, row) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p
                v-else
                class="mt-3 rounded-lg border border-dashed border-slate-300 bg-white px-3 py-3 text-[10px] font-bold text-slate-500"
              >
                La tabla quedara oculta en la vista previa y en la ejecucion del reporte.
              </p>
            </section>
          </section>

          <section
            v-else-if="activeStep === 'exportacion'"
            class="grid min-w-0 gap-3 xl:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]"
          >
            <div
              class="min-w-0 rounded-lg bg-white p-3 shadow-[0_1px_3px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70 sm:p-4"
            >
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="text-[10px] font-black uppercase tracking-[0.12em] text-[#ff6600]">
                    Exportacion
                  </p>

                  <h3 class="mt-1 text-[16px] font-black text-[#102372]">Salidas del reporte</h3>

                  <p class="mt-1 text-[11px] font-semibold leading-5 text-slate-500">
                    Activa lo que se podra ver o descargar cuando el reporte se ejecute.
                  </p>
                </div>

                <span
                  class="shrink-0 rounded-md bg-[#eef2f7] px-2 py-1 text-[10px] font-black text-[#102372]"
                >
                  {{ selectedOutputOptionLabels.length }} opciones
                </span>
              </div>

              <div class="mt-4 grid gap-3">
                <section
                  v-for="group in visibleOutputOptionGroups"
                  :key="group.id"
                  class="rounded-lg border border-[#d8dee8] bg-[#fbfdff] p-3"
                >
                  <p class="text-[11px] font-black text-[#102372]">{{ group.label }}</p>

                  <p class="mt-1 text-[10px] font-semibold leading-relaxed text-slate-500">
                    {{ group.description }}
                  </p>

                  <div class="mt-3 grid gap-2">
                    <label
                      v-for="option in group.options"
                      :key="option.id"
                      class="flex cursor-pointer items-center justify-between gap-3 rounded-lg border bg-white px-3 py-2.5 transition"
                      :class="
                        isOutputOptionEnabled(option.id)
                          ? 'border-[#102372]/35 shadow-[0_1px_2px_rgba(16,35,114,0.08)]'
                          : 'border-slate-200 opacity-75'
                      "
                    >
                      <span class="flex min-w-0 items-center gap-3">
                        <span
                          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                          :class="
                            isOutputOptionEnabled(option.id)
                              ? 'bg-[#eef3ff] text-[#102372]'
                              : 'bg-slate-100 text-slate-400'
                          "
                        >
                          <SvgIcon :name="getOutputOptionIcon(option.id)" />
                        </span>

                        <span class="min-w-0">
                          <span class="block text-[11px] font-black text-[#102372]">
                            {{ option.label }}
                          </span>

                          <span
                            class="mt-0.5 block text-[10px] font-semibold leading-snug text-slate-500"
                          >
                            {{ option.description }}
                          </span>
                        </span>
                      </span>

                      <span
                        class="relative h-6 w-11 shrink-0 rounded-full transition"
                        :class="isOutputOptionEnabled(option.id) ? 'bg-[#ff6600]' : 'bg-slate-300'"
                        aria-hidden="true"
                      >
                        <span
                          class="absolute top-1 h-4 w-4 rounded-full bg-white shadow transition"
                          :class="isOutputOptionEnabled(option.id) ? 'left-6' : 'left-1'"
                        ></span>
                      </span>

                      <input
                        type="checkbox"
                        class="sr-only"
                        :checked="isOutputOptionEnabled(option.id)"
                        @change="updateDraftOutputOption(option.id, $event.target.checked)"
                      />
                    </label>
                  </div>
                </section>
              </div>
            </div>

            <div
              class="min-w-0 overflow-auto rounded-lg bg-[#eef2f7] p-3 shadow-[0_1px_3px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70 sm:p-4"
            >
              <div
                class="mb-3 flex flex-col gap-3 rounded-lg bg-white p-3 ring-1 ring-slate-200 sm:flex-row sm:items-center sm:justify-between"
              >
                <div class="min-w-0">
                  <p class="text-[10px] font-black uppercase tracking-[0.12em] text-[#ff6600]">
                    Vista previa de exportacion
                  </p>

                  <p class="mt-1 text-[11px] font-semibold leading-5 text-slate-500">
                    {{ activeExportPreviewDetail }}
                  </p>
                </div>

                <div
                  class="grid shrink-0 grid-cols-2 rounded-lg border border-[#d8dee8] bg-[#f8fafc] p-1"
                >
                  <button
                    v-for="mode in exportPreviewModes"
                    :key="mode.id"
                    type="button"
                    class="rounded-md px-4 py-2 text-[11px] font-black transition"
                    :class="
                      activeExportPreview === mode.id && mode.enabled
                        ? 'bg-[#102372] text-white shadow-sm'
                        : mode.enabled
                          ? 'text-[#102372] hover:bg-white'
                          : 'cursor-not-allowed text-slate-400'
                    "
                    :disabled="!mode.enabled"
                    @click="setActiveExportPreview(mode.id)"
                  >
                    {{ mode.label }}
                  </button>
                </div>
              </div>

              <article
                v-if="activeExportPreview === 'pdf'"
                class="mx-auto min-w-[620px] max-w-[760px] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.12)] ring-1 ring-slate-200"
              >
                <header class="px-6 pt-6 text-center">
                  <img
                    :src="reportBrandLogo"
                    alt="Sinergy Group"
                    class="mx-auto h-16 max-w-[240px] object-contain"
                  />

                  <p class="mt-2 text-[9px] font-semibold italic text-slate-500">
                    Monitoreo GPS y Telemetria IoT
                  </p>

                  <div class="mt-3 border-b-2 border-[#ff6600]"></div>
                </header>

                <section class="px-6 py-4 text-center">
                  <h3 class="text-[18px] font-black uppercase text-[#102372]">
                    {{ reportDraft.name || "Reporte personalizado" }}
                  </h3>

                  <p class="mt-1 text-[11px] font-semibold text-slate-600">
                    {{ reportDraft.description || "Vista previa de configuracion del reporte." }}
                  </p>
                </section>

                <section class="px-6 pb-3">
                  <div class="border-b-2 border-[#ff6600] pb-1">
                    <h4 class="text-[12px] font-black text-[#102372]">Datos generales</h4>
                  </div>

                  <dl class="mt-2 border border-[#d8dee8] text-[10px]">
                    <div
                      v-for="detail in exportPreviewDetails"
                      :key="detail.label"
                      class="grid grid-cols-[150px_minmax(0,1fr)] border-b border-[#d8dee8] last:border-b-0"
                    >
                      <dt class="bg-[#f3f4f6] px-2 py-2 font-black text-[#102372]">
                        {{ detail.label }}
                      </dt>

                      <dd class="min-w-0 px-2 py-2 font-semibold text-slate-700">
                        {{ detail.value }}
                      </dd>
                    </div>
                  </dl>
                </section>

                <section
                  v-if="reportDraft.widgets.includes(REPORT_WIDGET_IDS.summaryCards)"
                  class="px-6 py-3"
                >
                  <div class="border-b-2 border-[#ff6600] pb-1">
                    <h4 class="text-[12px] font-black text-[#102372]">Resumen del periodo</h4>
                  </div>

                  <div class="mt-2 grid border border-[#d8dee8] sm:grid-cols-3">
                    <div
                      v-for="card in previewCards"
                      :key="card.label"
                      class="border-b border-r border-[#d8dee8] px-3 py-3 last:border-r-0 sm:border-b-0"
                    >
                      <p class="text-center text-[9px] font-bold text-slate-500">
                        {{ card.label }}
                      </p>

                      <p class="mt-1 text-center text-[18px] font-black text-[#102372]">
                        {{ card.value }}
                      </p>
                    </div>
                  </div>
                </section>

                <section
                  v-if="isMapDraft && isOutputOptionEnabled(REPORT_OUTPUT_OPTION_IDS.pdfTripMap)"
                  class="px-6 py-3"
                >
                  <div class="border-b-2 border-[#ff6600] pb-1">
                    <div class="flex flex-wrap items-center justify-between gap-2">
                      <h4 class="text-[12px] font-black text-[#102372]">Mapa de la ruta</h4>

                      <div
                        class="flex flex-wrap items-center gap-2 text-[9px] font-black text-slate-500"
                      >
                        <span class="inline-flex items-center gap-1">
                          <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
                          Inicio
                        </span>

                        <span class="inline-flex items-center gap-1">
                          <span class="h-2 w-2 rounded-full bg-[#ff6600]"></span>
                          Recorrido
                        </span>

                        <span class="inline-flex items-center gap-1">
                          <span class="h-2 w-2 rounded-full bg-sky-500"></span>
                          Fin
                        </span>
                      </div>
                    </div>
                  </div>

                  <div class="mx-auto mt-3 h-[220px] max-w-[520px] overflow-hidden bg-[#dbe5f0]">
                    <div
                      class="flex h-full items-center justify-center bg-[linear-gradient(135deg,#e8eef7_0%,#f8fafc_44%,#dbeafe_100%)] px-6 text-center"
                    >
                      <div>
                        <p class="text-[12px] font-black uppercase tracking-[0.1em] text-[#102372]">
                          {{ isRouteHistoryDraft ? "Mapa de viajes" : "Mapa de detenciones" }}
                        </p>

                        <p
                          class="mx-auto mt-2 max-w-[300px] text-[10px] font-bold leading-relaxed text-slate-500"
                        >
                          La imagen real se arma al generar el reporte con recorrido, inicio, fin y
                          marcadores disponibles.
                        </p>
                      </div>
                    </div>
                  </div>

                  <p class="mx-auto mt-2 max-w-[520px] text-[9px] italic text-slate-500">
                    Mapa operativo incluido segun la salida seleccionada.
                  </p>
                </section>

                <section
                  v-if="reportDraft.widgets.includes(REPORT_WIDGET_IDS.charts)"
                  class="px-6 py-3"
                >
                  <div class="border-b-2 border-[#ff6600] pb-1">
                    <h4 class="text-[12px] font-black text-[#102372]">Graficos recomendados</h4>
                  </div>

                  <div class="mt-2 grid gap-2 md:grid-cols-2">
                    <article
                      v-for="chart in recommendedChartOptions.slice(0, 2)"
                      :key="chart.id"
                      class="border border-[#d8dee8] bg-[#f8fafc] px-3 py-2"
                    >
                      <div class="flex items-center justify-between gap-2">
                        <p class="truncate text-[10px] font-black text-[#102372]">
                          {{ chart.label }}
                        </p>

                        <span
                          class="shrink-0 bg-white px-1.5 py-0.5 text-[8px] font-black uppercase text-slate-500"
                        >
                          {{ chart.chartTypeLabel }}
                        </span>
                      </div>

                      <p class="mt-1 line-clamp-2 text-[9px] font-semibold text-slate-500">
                        {{ chart.detail }}
                      </p>
                    </article>
                  </div>
                </section>

                <section
                  v-if="reportDraft.widgets.includes(REPORT_WIDGET_IDS.table)"
                  class="px-6 py-3"
                >
                  <div class="border-b-2 border-[#ff6600] pb-1">
                    <div class="flex flex-wrap items-center justify-between gap-2">
                      <h4 class="text-[12px] font-black text-[#102372]">Detalle del reporte</h4>

                      <span class="text-[9px] font-bold text-slate-500"> PDF compacto </span>
                    </div>
                  </div>

                  <div class="mt-2 overflow-auto border border-[#d8dee8]">
                    <table class="min-w-full border-collapse text-left text-[10px]">
                      <thead class="bg-[#102372] text-white">
                        <tr>
                          <th
                            v-for="column in visiblePdfPreviewColumns"
                            :key="column.id"
                            class="whitespace-nowrap px-3 py-2 font-black"
                          >
                            {{ column.label }}
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        <tr
                          v-for="row in previewRows"
                          :key="row"
                          class="border-b border-[#d8dee8] odd:bg-white even:bg-[#f3f4f6]"
                        >
                          <td
                            v-for="column in visiblePdfPreviewColumns"
                            :key="`${row}-${column.id}`"
                            class="whitespace-nowrap px-3 py-2 font-semibold text-slate-700"
                          >
                            {{ getPreviewValue(column.id, row) }}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <div
                      v-if="pdfHiddenColumnsCount"
                      class="border-t border-[#d8dee8] bg-[#f8fafc] px-3 py-2 text-[10px] font-bold text-slate-500"
                    >
                      PDF compacto: +{{ pdfHiddenColumnsCount }} columnas adicionales quedaran
                      completas en Excel y en la vista de ejecucion.
                    </div>
                  </div>
                </section>

                <section class="px-6 py-3">
                  <div class="border-b-2 border-[#ff6600] pb-1">
                    <h4 class="text-[12px] font-black text-[#102372]">Exportacion disponible</h4>
                  </div>

                  <div class="mt-2 flex flex-wrap gap-2">
                    <span
                      v-for="item in outputPreviewItems"
                      :key="item.id"
                      class="inline-flex items-center gap-2 border px-2.5 py-1.5 text-[10px] font-black"
                      :class="
                        item.enabled
                          ? 'border-[#d8dee8] bg-white text-[#102372]'
                          : 'border-slate-200 bg-slate-50 text-slate-400'
                      "
                    >
                      <span
                        class="h-1.5 w-1.5 rounded-full"
                        :class="item.enabled ? 'bg-[#ff6600]' : 'bg-slate-300'"
                      ></span>

                      {{ item.label }}
                    </span>
                  </div>
                </section>

                <footer
                  class="mt-4 flex items-center justify-between border-t border-[#d8dee8] px-6 py-3 text-[8px] font-semibold text-slate-500"
                >
                  <span>Sinergy Group Chile</span>
                  <span>Vista previa PDF</span>
                </footer>
              </article>

              <article
                v-else
                class="w-full min-w-[720px] overflow-hidden bg-white shadow-[0_10px_28px_rgba(15,23,42,0.12)] ring-1 ring-slate-200"
              >
                <header class="px-6 pt-6 text-center">
                  <img
                    :src="reportBrandLogo"
                    alt="Sinergy Group"
                    class="mx-auto h-16 max-w-[240px] object-contain"
                  />

                  <p class="mt-2 text-[9px] font-semibold italic text-slate-500">
                    Monitoreo GPS y Telemetria IoT
                  </p>

                  <div class="mt-3 border-b-2 border-[#ff6600]"></div>
                </header>

                <section class="px-6 py-4 text-center">
                  <h3 class="text-[18px] font-black uppercase text-[#102372]">
                    {{ reportDraft.name || "Reporte personalizado" }}
                  </h3>

                  <p class="mt-1 text-[11px] font-semibold text-slate-600">
                    {{ selectedColumns.length }} columnas disponibles en hojas auxiliares
                  </p>
                </section>

                <section class="border-b border-[#d8dee8] bg-[#f8fafc] px-4 py-3">
                  <div class="grid gap-2 text-[10px] sm:grid-cols-4">
                    <div
                      v-for="detail in excelPreviewDetails"
                      :key="detail.label"
                      class="rounded-md border border-[#d8dee8] bg-white px-3 py-2"
                    >
                      <p class="font-black uppercase tracking-[0.08em] text-slate-400">
                        {{ detail.label }}
                      </p>

                      <p class="mt-1 truncate font-black text-[#102372]">
                        {{ detail.value }}
                      </p>
                    </div>
                  </div>
                </section>

                <section
                  v-if="reportDraft.widgets.includes(REPORT_WIDGET_IDS.summaryCards)"
                  class="border-b border-[#d8dee8] px-4 py-3"
                >
                  <div class="grid grid-cols-3 border border-[#d8dee8] text-center text-[10px]">
                    <div
                      v-for="card in previewCards"
                      :key="card.label"
                      class="border-r border-[#d8dee8] last:border-r-0"
                    >
                      <p class="bg-[#eef3ff] px-2 py-1 font-black text-[#102372]">
                        {{ card.label }}
                      </p>

                      <p class="px-2 py-2 font-black text-[#102372]">
                        {{ card.value }}
                      </p>
                    </div>
                  </div>
                </section>

                <section
                  v-if="isMapDraft && isOutputOptionEnabled(REPORT_OUTPUT_OPTION_IDS.excelTripMap)"
                  class="border-b border-[#d8dee8] px-4 py-3"
                >
                  <div
                    class="grid h-[160px] place-items-center border border-dashed border-[#9fb0cc] bg-[#eef3ff] text-center"
                  >
                    <div>
                      <p class="text-[11px] font-black uppercase tracking-[0.12em] text-[#102372]">
                        Imagen de mapa en hoja Excel
                      </p>

                      <p class="mt-1 text-[10px] font-semibold text-slate-500">
                        Se inserta en la hoja Reporte antes del detalle exportable.
                      </p>
                    </div>
                  </div>
                </section>

                <section
                  v-if="reportDraft.widgets.includes(REPORT_WIDGET_IDS.table)"
                  class="px-4 py-3"
                >
                  <div class="overflow-auto border border-[#d8dee8]">
                    <table class="min-w-full border-collapse text-left text-[10px]">
                      <thead>
                        <tr class="bg-[#102372] text-white">
                          <th
                            v-for="column in visiblePreviewColumns"
                            :key="column.id"
                            class="whitespace-nowrap border-r border-white/20 px-3 py-2 font-black last:border-r-0"
                          >
                            {{ column.label }}
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        <tr
                          v-for="row in previewRows"
                          :key="row"
                          class="border-b border-[#d8dee8] odd:bg-white even:bg-[#f3f4f6]"
                        >
                          <td
                            v-for="column in visiblePreviewColumns"
                            :key="`${row}-${column.id}`"
                            class="whitespace-nowrap border-r border-[#d8dee8] px-3 py-2 font-semibold text-slate-700 last:border-r-0"
                          >
                            {{ getPreviewValue(column.id, row) }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <p class="mt-2 text-[10px] font-bold text-slate-500">
                    Excel no aplica el recorte compacto del PDF: conserva todas las columnas
                    seleccionadas en la misma hoja.
                  </p>
                </section>

                <footer
                  class="flex items-center justify-between border-t border-[#d8dee8] bg-[#f8fafc] px-4 py-3 text-[9px] font-semibold text-slate-500"
                >
                  <span>Hoja principal + datos completos</span>
                  <span>Vista previa Excel</span>
                </footer>
              </article>
            </div>
          </section>

          <section
            v-else
            class="min-w-0 rounded-lg bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70 sm:p-5"
          >
            <header
              class="flex flex-col gap-3 border-b border-[#d8dee8] pb-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div class="min-w-0">
                <p class="text-[10px] font-black uppercase tracking-[0.18em] text-[#ff6600]">
                  Revision final
                </p>

                <h3 class="mt-1 break-words text-[24px] font-black leading-tight text-[#102372]">
                  {{ reportDraft.name || "Reporte personalizado" }}
                </h3>

                <p class="mt-2 max-w-[760px] text-[12px] font-semibold leading-5 text-[#334155]">
                  {{ reportDraft.description || "Sin descripcion definida." }}
                </p>
              </div>

              <span
                class="inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-black uppercase"
                :class="
                  reportDraft.status === 'active'
                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
                    : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200'
                "
              >
                <span
                  class="h-2 w-2 rounded-full"
                  :class="reportDraft.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'"
                ></span>

                {{ reportDraft.status === "active" ? "Activo" : "Inactivo" }}
              </span>
            </header>

            <div class="mt-5">
              <h4 class="text-[13px] font-black uppercase tracking-[0.12em] text-[#102372]">
                Configuracion del reporte
              </h4>

              <div class="mt-3 grid gap-3 lg:grid-cols-2">
                <article
                  v-for="section in finalSummarySections"
                  :key="section.title"
                  class="min-h-[128px] rounded-lg border border-[#d8dee8] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                >
                  <header class="flex items-start justify-between gap-3">
                    <div class="flex min-w-0 items-start gap-3">
                      <span
                        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#eef3ff] text-[#102372]"
                      >
                        <SvgIcon :name="section.icon" />
                      </span>

                      <div class="min-w-0">
                        <h5 class="text-[13px] font-black text-[#102372]">
                          {{ section.title }}
                        </h5>

                        <p class="mt-1 text-[11px] font-semibold leading-5 text-slate-500">
                          {{ section.description }}
                        </p>
                      </div>
                    </div>

                    <span
                      class="shrink-0 whitespace-nowrap text-[11px] font-bold text-[#102372]"
                      :class="section.empty ? 'text-slate-400' : ''"
                    >
                      {{ section.countLabel }}
                    </span>
                  </header>

                  <div class="mt-4 flex flex-wrap gap-2">
                    <span
                      v-for="(item, index) in section.items"
                      :key="`${section.title}-${item}`"
                      class="inline-flex h-9 max-w-full items-center gap-2 rounded-lg border px-3 text-[11px] font-bold"
                      :class="getSummaryChipClass(section, index)"
                    >
                      <span
                        v-if="!section.empty"
                        class="h-1.5 w-1.5 shrink-0 rounded-full"
                        :class="section.highlightFirst && index === 0 ? 'bg-white' : 'bg-[#102372]'"
                      ></span>

                      <span class="min-w-0 truncate">
                        {{ item }}
                      </span>
                    </span>
                  </div>
                </article>
              </div>
            </div>

            <div
              class="mt-4 flex items-start gap-3 rounded-lg border border-[#bcd0f7] bg-[#f4f8ff] p-4"
            >
              <span
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#102372] text-white"
              >
                <SvgIcon name="shield" />
              </span>

              <div class="min-w-0">
                <p class="text-[13px] font-black text-[#102372]">Todo listo para guardar</p>

                <p class="mt-1 text-[11px] font-semibold leading-5 text-[#334155]">
                  La plantilla quedara disponible en Reportes y Fleet con esta misma configuracion.
                </p>
              </div>
            </div>
          </section>
        </div>

        <footer class="shrink-0 border-t border-[#edf1f5] bg-white px-3 py-2.5">
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

            <div class="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
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

import reportBrandLogo from "../../assets/branding/sinergy-group-report.png"
import SvgIcon from "../icons/SvgIcon.vue"
import { useReportBuilder } from "../../composables/reports/useReportBuilder.js"
import {
  REQUIRED_REPORT_COLUMN_IDS,
  REQUIRED_REPORT_FILTER_IDS,
} from "../../data/mockReportTemplates.js"
import {
  REPORT_BEHAVIOR_OPTION_IDS,
  REPORT_BEHAVIOR_OPTION_GROUPS,
  normalizeReportBehaviorOptions,
} from "../../utils/reports/config/reportBehaviorOptions.js"
import { getReportChartRecommendations } from "../../utils/reports/config/reportChartRecommendations.js"
import { getPdfVisibleReportColumns } from "../../utils/reports/execution/assetReportColumnUtils.js"
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
import { REPORT_WIDGET_IDS } from "../../utils/reports/config/reportWidgetUtils.js"

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
  availableFilters,
  availableColumns,
  availableWidgets,
  canSaveDraft,
  selectedFiltersCount,
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
const activeExportPreview = ref("pdf")

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

const reportTypeLabel = computed(() => {
  return (
    availableReportTypes.value.find(
      (reportType) => reportType.id === reportDraft.value.reportTypeId,
    )?.label || "Personalizado"
  )
})

const selectedFilters = computed(() => {
  return reportDraft.value.filters
    .map((filterId) => availableFilters.value.find((filter) => filter.id === filterId))
    .filter(Boolean)
})

const selectedFilterLabels = computed(() => {
  return selectedFilters.value.map((filter) => filter.label)
})

const selectedWidgetLabels = computed(() => {
  return reportDraft.value.widgets
    .map((widgetId) => availableWidgets.value.find((widget) => widget.id === widgetId)?.label)
    .filter(Boolean)
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

const selectedOutputOptionLabels = computed(() => {
  return visibleOutputOptionGroups.value.flatMap((group) => {
    return (group.options || [])
      .filter((option) => normalizedOutputOptions.value[option.id] === true)
      .map((option) => option.label)
  })
})

const selectedBehaviorOptionLabels = computed(() => {
  return visibleBehaviorOptionGroups.value.flatMap((group) => {
    return (group.options || [])
      .filter((option) => {
        if (Array.isArray(option.reportTypeIds) && option.reportTypeIds.length) {
          return option.reportTypeIds.includes(reportDraft.value.reportTypeId)
        }

        return true
      })
      .filter((option) => {
        const value = normalizedBehaviorOptions.value[option.id]

        if (option.type === "checkbox") return value === true

        return value !== null && value !== undefined && String(value).trim() !== ""
      })
      .map((option) => option.label)
  })
})

const isRouteHistoryDraft = computed(() => {
  return String(reportDraft.value.reportTypeId || "") === "route-history"
})

const isMapDraft = computed(() => {
  return ["route-history", "stops"].includes(String(reportDraft.value.reportTypeId || ""))
})

const viewPreviewItems = computed(() => {
  return [
    {
      id: REPORT_WIDGET_IDS.summaryCards,
      label: "Resumen",
      detail: "Muestra KPIs iniciales del periodo antes del detalle.",
      enabled: reportDraft.value.widgets.includes(REPORT_WIDGET_IDS.summaryCards),
    },
    {
      id: REPORT_WIDGET_IDS.charts,
      label: "Graficos",
      detail: recommendedChartOptions.value.length
        ? `${recommendedChartOptions.value.length} graficos recomendados para este tipo.`
        : "Habilita visualizaciones si el reporte tiene datos comparables.",
      enabled: reportDraft.value.widgets.includes(REPORT_WIDGET_IDS.charts),
    },
    {
      id: REPORT_WIDGET_IDS.table,
      label: "Tabla",
      detail: `${selectedColumnsCount.value} columnas configuradas para el detalle.`,
      enabled: reportDraft.value.widgets.includes(REPORT_WIDGET_IDS.table),
    },
  ]
})

const outputPreviewItems = computed(() => {
  const items = [
    {
      id: REPORT_OUTPUT_OPTION_IDS.excelExport,
      label: "Descarga Excel",
      detail: "Permite descargar la planilla desde la ejecucion.",
      enabled: isOutputOptionEnabled(REPORT_OUTPUT_OPTION_IDS.excelExport),
    },
    {
      id: REPORT_OUTPUT_OPTION_IDS.pdfExport,
      label: "Descarga PDF",
      detail: "Permite descargar el documento desde la ejecucion.",
      enabled: isOutputOptionEnabled(REPORT_OUTPUT_OPTION_IDS.pdfExport),
    },
  ]

  if (isMapDraft.value) {
    items.push(
      {
        id: REPORT_OUTPUT_OPTION_IDS.previewTripMap,
        label: "Mapa en pantalla",
        detail: "Muestra la imagen del recorrido en la vista previa.",
        enabled: isOutputOptionEnabled(REPORT_OUTPUT_OPTION_IDS.previewTripMap),
      },
      {
        id: REPORT_OUTPUT_OPTION_IDS.pdfTripMap,
        label: "Mapa en PDF",
        detail: "Incluye la imagen del recorrido al exportar PDF.",
        enabled: isOutputOptionEnabled(REPORT_OUTPUT_OPTION_IDS.pdfTripMap),
      },
      {
        id: REPORT_OUTPUT_OPTION_IDS.excelTripMap,
        label: "Mapa en Excel",
        detail: "Incluye la imagen del recorrido al exportar Excel.",
        enabled: isOutputOptionEnabled(REPORT_OUTPUT_OPTION_IDS.excelTripMap),
      },
    )
  }

  return items
})

const exportPreviewDetails = computed(() => {
  return [
    {
      label: "Tipo",
      value: reportTypeLabel.value,
    },
    {
      label: "Categoria",
      value: categoryLabel.value,
    },
    {
      label: "Eventos",
      value: eventRuleLabel.value,
    },
    {
      label: "Vista",
      value: selectedWidgetLabels.value.length
        ? selectedWidgetLabels.value.join(", ")
        : "Sin bloques visibles",
    },
    {
      label: "Salidas",
      value: selectedOutputOptionLabels.value.length
        ? selectedOutputOptionLabels.value.join(", ")
        : "Sin salidas activas",
    },
  ]
})

const selectedColumns = computed(() => {
  return reportDraft.value.columns
    .map((columnId) => availableColumns.value.find((column) => column.id === columnId))
    .filter(Boolean)
})

const excelPreviewDetails = computed(() => {
  return [
    {
      label: "Tipo",
      value: reportTypeLabel.value,
    },
    {
      label: "Categoria",
      value: categoryLabel.value,
    },
    {
      label: "Eventos",
      value: eventRuleLabel.value,
    },
    {
      label: "Columnas",
      value: `${selectedColumns.value.length} visibles`,
    },
  ]
})

const visiblePreviewColumns = computed(() => {
  return selectedColumns.value
})

const visiblePdfPreviewColumns = computed(() => {
  return getPdfVisibleReportColumns(selectedColumns.value)
})

const pdfHiddenColumnsCount = computed(() => {
  return Math.max(selectedColumns.value.length - visiblePdfPreviewColumns.value.length, 0)
})

const getSummaryItems = (items, fallback) => {
  const validItems = items.filter(Boolean)

  if (!validItems.length) return [fallback]
  if (validItems.length <= 6) return validItems

  return [...validItems.slice(0, 5), `+${validItems.length - 5} mas`]
}

const getSummaryCountLabel = (count, singular, plural = `${singular}s`) => {
  return `${count} ${count === 1 ? singular : plural}`
}

const buildFinalSummarySection = ({
  title,
  description,
  icon,
  items,
  fallback,
  singular,
  plural,
  highlightFirst = false,
}) => {
  const validItems = items.filter(Boolean)

  return {
    title,
    description,
    icon,
    count: validItems.length,
    countLabel: getSummaryCountLabel(validItems.length, singular, plural),
    empty: validItems.length === 0,
    highlightFirst,
    items: getSummaryItems(validItems, fallback),
  }
}

const finalSummarySections = computed(() => {
  const sections = [
    buildFinalSummarySection({
      title: "Datos generales",
      description: "Que informacion incluira el reporte",
      icon: "reportes",
      items: [
        reportTypeLabel.value,
        categoryLabel.value,
        reportDraft.value.status === "active" ? "Activo" : "Inactivo",
      ],
      fallback: "Sin datos generales",
      singular: "seleccionado",
      plural: "seleccionados",
    }),
    buildFinalSummarySection({
      title: "Eventos",
      description: "Reglas y condiciones asociadas",
      icon: "eventos",
      items: selectedEventRuleLabels.value,
      fallback: "Sin reglas",
      singular: "regla",
      plural: "reglas",
    }),
    buildFinalSummarySection({
      title: "Filtros",
      description: "Criterios para acotar la informacion",
      icon: "configuracion",
      items: selectedFilterLabels.value,
      fallback: "Sin filtros",
      singular: "filtro",
      plural: "filtros",
    }),
    buildFinalSummarySection({
      title: "Visualizacion",
      description: "Como se mostrara la informacion",
      icon: "eye",
      items: selectedWidgetLabels.value,
      fallback: "Sin bloques",
      singular: "opcion",
      plural: "opciones",
      highlightFirst: true,
    }),
    buildFinalSummarySection({
      title: "Columnas visibles",
      description: "Campos que se mostraran en el reporte",
      icon: "tables",
      items: selectedColumns.value.map((column) => column.label),
      fallback: "Sin columnas",
      singular: "columna",
      plural: "columnas",
    }),
    buildFinalSummarySection({
      title: "Exportacion",
      description: "Formatos disponibles para el reporte",
      icon: "upload",
      items: selectedOutputOptionLabels.value,
      fallback: "Sin exportacion especial",
      singular: "opcion",
      plural: "opciones",
    }),
  ]

  if (selectedBehaviorOptionLabels.value.length) {
    sections.push(
      buildFinalSummarySection({
        title: "Avanzado",
        description: "Ajustes especiales del comportamiento",
        icon: "llave",
        items: selectedBehaviorOptionLabels.value,
        fallback: "Sin opciones avanzadas",
        singular: "ajuste",
        plural: "ajustes",
      }),
    )
  }

  return sections
})

const getSummaryChipClass = (section, index) => {
  if (section.empty) {
    return "border-slate-200 bg-slate-50 text-slate-400"
  }

  if (section.highlightFirst && index === 0) {
    return "border-[#102372] bg-[#102372] text-white shadow-sm"
  }

  return "border-[#d8dee8] bg-white text-[#102372]"
}

const canDeleteDraft = computed(() => {
  return Boolean(reportDraft.value.id)
})

const isRequiredColumn = (columnId) => {
  return REQUIRED_REPORT_COLUMN_IDS.includes(columnId)
}

const isRequiredFilter = (filterId) => {
  return REQUIRED_REPORT_FILTER_IDS.includes(filterId)
}

const isEventRuleSelected = (ruleId) => {
  return selectedEventRuleIds.value.includes(ruleId)
}

const isOutputOptionEnabled = (optionId) => {
  return normalizedOutputOptions.value[optionId] === true
}

const isPdfExportEnabled = computed(() => {
  return isOutputOptionEnabled(REPORT_OUTPUT_OPTION_IDS.pdfExport)
})

const isExcelExportEnabled = computed(() => {
  return isOutputOptionEnabled(REPORT_OUTPUT_OPTION_IDS.excelExport)
})

const exportPreviewModes = computed(() => {
  return [
    {
      id: "pdf",
      label: "PDF",
      enabled: isPdfExportEnabled.value,
      detail:
        "PDF simula el informe paginado: tabla compacta y columnas sobrantes en Detalle adicional.",
    },
    {
      id: "excel",
      label: "Excel",
      enabled: isExcelExportEnabled.value,
      detail: "Excel simula la hoja Reporte y deja el detalle completo en hojas auxiliares.",
    },
  ]
})

const activeExportPreviewDetail = computed(() => {
  return (
    exportPreviewModes.value.find((mode) => mode.id === activeExportPreview.value)?.detail ||
    "Activa PDF o Excel para revisar como se exportara el reporte."
  )
})

const setActiveExportPreview = (modeId) => {
  const target = exportPreviewModes.value.find((mode) => mode.id === modeId)

  if (!target?.enabled) return
  activeExportPreview.value = target.id
}

watch(
  [isPdfExportEnabled, isExcelExportEnabled],
  ([pdfEnabled, excelEnabled]) => {
    if (activeExportPreview.value === "pdf" && !pdfEnabled && excelEnabled) {
      activeExportPreview.value = "excel"
      return
    }

    if (activeExportPreview.value === "excel" && !excelEnabled && pdfEnabled) {
      activeExportPreview.value = "pdf"
    }
  },
  {
    immediate: true,
  },
)

const getOutputOptionIcon = (optionId) => {
  if (
    optionId === REPORT_OUTPUT_OPTION_IDS.excelExport ||
    optionId === REPORT_OUTPUT_OPTION_IDS.excelTripMap
  ) {
    return "tables"
  }

  if (optionId === REPORT_OUTPUT_OPTION_IDS.pdfExport) {
    return "reporte"
  }

  if (
    optionId === REPORT_OUTPUT_OPTION_IDS.previewTripMap ||
    optionId === REPORT_OUTPUT_OPTION_IDS.pdfTripMap
  ) {
    return "mapa"
  }

  return "upload"
}

const getDraftOptionCardClass = (enabled) => {
  return enabled ? "border-[#dbe4f0] bg-white" : "border-slate-200 bg-slate-50 opacity-70"
}

const getDraftOptionStatusClass = (enabled) => {
  return enabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-200 text-slate-500"
}

const getDraftOptionStatusLabel = (enabled) => {
  return enabled ? "Activo" : "Oculto"
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
