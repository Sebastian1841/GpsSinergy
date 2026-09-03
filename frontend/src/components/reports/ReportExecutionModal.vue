<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 z-[940] flex items-end justify-center bg-slate-950/55 p-2 sm:items-center sm:p-4"
    @click.self="closeModal"
  >
    <section
      class="flex max-h-[calc(100%-16px)] w-full flex-col overflow-hidden rounded-xl bg-white shadow-[0_24px_80px_rgba(15,23,42,0.34)] sm:max-h-[calc(100%-32px)]"
      :class="isExcelPreview && hasReport ? 'max-w-[1540px]' : 'max-w-[1080px]'"
    >
      <header class="shrink-0 border-b border-slate-200/80 bg-white px-4 py-3">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
              Ejecutar reporte
            </p>

            <h2 class="mt-0.5 truncate text-[16px] font-black text-[#102372]">
              {{ template?.name || "Reporte de activos" }}
            </h2>

            <p class="mt-1 line-clamp-1 text-[11px] font-semibold text-slate-500">
              {{
                template?.description || "Selecciona fechas y activos para generar la vista previa."
              }}
            </p>
          </div>

          <button
            type="button"
            class="shrink-0 rounded-lg px-2 py-1 text-[18px] font-black leading-none text-slate-400 transition hover:bg-[#f8fafc] hover:text-[#ff6600]"
            @click="closeModal"
          >
            ×
          </button>
        </div>
      </header>

      <div class="shrink-0 border-b border-slate-200/80 bg-[#f6f8fb] p-3">
        <div
          class="grid grid-cols-1 gap-2 md:grid-cols-[130px_130px_170px_minmax(0,1fr)_auto] md:items-end"
        >
          <label class="block">
            <span class="text-[10px] font-black uppercase text-slate-400">Desde</span>

            <input
              v-model="dateFrom"
              type="date"
              required
              class="mt-1 h-9 w-full rounded-lg border border-[#d8dee8] bg-white px-2 text-[11px] font-bold text-[#102372] outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/10"
            />
          </label>

          <label class="block">
            <span class="text-[10px] font-black uppercase text-slate-400">Grupo</span>

            <select
              v-model="selectedGroupId"
              class="mt-1 h-9 w-full rounded-lg border border-[#d8dee8] bg-white px-2 text-[11px] font-bold text-[#102372] outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/10"
            >
              <option v-for="group in groupOptions" :key="group.id" :value="String(group.id)">
                {{ group.name }} ({{ group.assetCount }})
              </option>
            </select>
          </label>

          <label class="block">
            <span class="text-[10px] font-black uppercase text-slate-400">Hasta</span>

            <input
              v-model="dateTo"
              type="date"
              required
              class="mt-1 h-9 w-full rounded-lg border border-[#d8dee8] bg-white px-2 text-[11px] font-bold text-[#102372] outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/10"
            />
          </label>

          <label class="block">
            <span class="text-[10px] font-black uppercase text-slate-400">Buscar activo</span>

            <input
              v-model="assetSearch"
              type="search"
              placeholder="Patente, activo o conductor..."
              class="mt-1 h-9 w-full rounded-lg border border-[#d8dee8] bg-white px-3 text-[11px] font-bold text-[#102372] outline-none placeholder:text-slate-400 focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/10"
            />
          </label>

          <button
            type="button"
            class="h-9 rounded-lg bg-[#ff6600] px-4 text-[10px] font-black uppercase tracking-[0.08em] text-white transition hover:bg-[#e65c00] disabled:cursor-not-allowed disabled:bg-slate-300"
            :disabled="!canExecuteReport || isExecutingReport"
            @click="handleExecuteReport"
          >
            {{ isExecutingReport ? "Generando..." : "Generar" }}
          </button>
        </div>

        <div class="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p
            class="text-[10px] font-black"
            :class="dateRangeError ? 'text-[#ff6600]' : 'text-slate-500'"
          >
            <template v-if="dateRangeError">
              {{ dateRangeError }}
            </template>

            <template v-else>
              Rango obligatorio · {{ selectedGroupLabel }} · {{ selectedAssetCount }} de
              {{ groupAssetCount }} patentes seleccionadas
            </template>
          </p>

          <div class="flex flex-wrap items-center gap-1">
            <button
              type="button"
              class="rounded-md border border-[#d8dee8] bg-white px-2.5 py-1.5 text-[10px] font-black text-[#102372] transition hover:border-[#ff6600] hover:text-[#ff6600]"
              @click="selectFilteredAssets"
            >
              Seleccionar visibles
            </button>

            <button
              type="button"
              class="rounded-md border border-[#d8dee8] bg-white px-2.5 py-1.5 text-[10px] font-black text-slate-500 transition hover:border-[#ff6600] hover:text-[#ff6600]"
              @click="clearSelectedAssets"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      <div
        class="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[300px_minmax(0,1fr)]"
      >
        <aside
          class="flex min-h-0 flex-col border-b border-slate-200/80 bg-white lg:border-b-0 lg:border-r lg:border-slate-200/80"
        >
          <div class="shrink-0 border-b border-[#edf1f5] px-3 py-2">
            <p class="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Activos</p>
          </div>

          <div class="min-h-0 flex-1 overflow-auto p-2">
            <label
              v-for="asset in filteredAssets"
              :key="asset.id"
              class="mb-1 flex cursor-pointer items-center gap-2 rounded-lg border border-[#edf1f5] bg-white px-2.5 py-2 transition last:mb-0 hover:border-[#ff6600]/40 hover:bg-[#fff7ed]"
            >
              <input
                type="checkbox"
                class="h-3.5 w-3.5 accent-[#ff6600]"
                :checked="selectedAssetIdSet.has(String(asset.id))"
                @change="toggleAsset(asset.id)"
              />

              <span class="min-w-0 flex-1">
                <span class="block truncate text-[11px] font-black text-[#172033]">
                  {{ getAssetLabel(asset) }}
                </span>

                <span class="mt-0.5 block truncate text-[10px] font-semibold text-slate-500">
                  {{ asset.patente || asset.patent || "Sin patente" }}
                  ·
                  {{ getAssetGroupLabel(asset) }}
                  ·
                  {{ asset.conductor || "Sin conductor" }}
                </span>
              </span>
            </label>

            <div
              v-if="!filteredAssets.length"
              class="flex min-h-[160px] items-center justify-center rounded-lg border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-4 text-center"
            >
              <p class="text-[11px] font-black text-[#102372]">Sin activos disponibles</p>
            </div>
          </div>
        </aside>

        <main
          class="relative flex min-h-0 flex-col overflow-hidden bg-[#f6f8fb]"
          :aria-busy="isReportBusy ? 'true' : 'false'"
        >
          <div class="shrink-0 border-b border-slate-200/80 bg-white px-3 py-2">
            <div class="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
              <div class="min-w-0">
                <p class="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                  Vista previa
                </p>

                <p class="mt-1 text-[12px] font-black text-[#102372]">
                  {{ reportPreviewTitle }} - {{ reportPreviewRangeLabel }}
                </p>

                <p v-if="hasReport" class="mt-0.5 text-[10px] font-bold text-slate-500">
                  Mostrando {{ previewReportRows.length }} de {{ reportRows.length }} filas
                </p>
              </div>

              <div class="flex flex-wrap items-center gap-2">
                <div
                  v-if="hasReport && previewFormatOptions.length > 1"
                  class="grid grid-cols-2 rounded-lg border border-[#d8dee8] bg-[#f8fafc] p-1"
                  aria-label="Formato de vista previa"
                >
                  <button
                    v-for="mode in previewFormatOptions"
                    :key="mode.id"
                    type="button"
                    class="h-7 rounded-md px-3 text-[10px] font-black transition"
                    :class="
                      activePreviewMode === mode.id
                        ? 'bg-[#102372] text-white shadow-sm'
                        : isReportBusy
                          ? 'cursor-not-allowed text-slate-400'
                          : 'text-[#102372] hover:bg-white'
                    "
                    :disabled="isReportBusy"
                    @click="setActivePreviewFormat(mode.id)"
                  >
                    {{ mode.label }}
                  </button>
                </div>

                <button
                  v-if="previewFormatOptions.length"
                  type="button"
                  class="h-8 rounded-lg bg-[#ff6600] px-4 text-[10px] font-black uppercase tracking-[0.08em] text-white transition hover:bg-[#e65c00] disabled:cursor-not-allowed disabled:bg-slate-300"
                  :disabled="!canExportActivePreview"
                  @click="handleExportActivePreview"
                >
                  {{ activePreviewExportLabel }}
                </button>
              </div>
            </div>
          </div>

          <div class="min-h-0 flex-1 overflow-auto bg-[#e8edf5] p-3 sm:p-4">
            <article
              v-if="hasReport"
              class="w-full overflow-hidden bg-white shadow-[0_18px_55px_rgba(15,23,42,0.18)] ring-1 ring-slate-200"
              :class="isPdfPreview ? 'mx-auto max-w-[900px]' : 'min-w-[1180px]'"
            >
              <header class="px-5 pb-4 pt-6 text-center sm:px-7">
                <img
                  :src="reportBrandLogo"
                  alt="Sinergy Group"
                  class="mx-auto h-auto w-[220px] max-w-full object-contain"
                />

                <p class="mt-2 text-[10px] font-semibold italic text-slate-500">
                  Monitoreo GPS y Telemetria IoT
                </p>

                <div class="mt-3 border-t-2 border-[#ff6600]"></div>

                <h3 class="mt-4 text-[18px] font-black uppercase text-[#102372]">
                  {{ activePreviewHeaderTitle }}
                </h3>

                <p class="mt-1 text-[11px] font-semibold text-slate-600">
                  {{ activePreviewSubtitle }}
                </p>
              </header>

              <section class="px-5 py-3 sm:px-7">
                <template v-if="isExcelPreview">
                  <div class="border-l-4 border-[#ff6600] bg-[#102372] px-3 py-2">
                    <h4 class="text-[11px] font-black text-white">Datos generales</h4>
                  </div>

                  <div class="grid border-x border-b border-[#d8dee8] text-center md:grid-cols-4">
                    <div
                      v-for="detail in excelPreviewDetails"
                      :key="detail.label"
                      class="border-b border-r border-[#d8dee8] last:border-r-0 md:border-b-0"
                    >
                      <p class="bg-white px-2 py-2 text-[9px] font-bold text-slate-500">
                        {{ detail.label }}
                      </p>

                      <p
                        class="min-h-[34px] bg-[#f8fafc] px-2 py-2 text-[11px] font-black text-[#102372]"
                      >
                        {{ detail.value }}
                      </p>
                    </div>
                  </div>
                </template>

                <template v-else>
                  <div class="border-b-2 border-[#ff6600] pb-1">
                    <h4 class="text-[12px] font-black text-[#102372]">Datos generales</h4>
                  </div>

                  <dl class="mt-2 overflow-hidden border border-[#d8dee8] text-[10px]">
                    <div
                      v-for="detail in reportPreviewDetails"
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
                </template>
              </section>

              <section
                v-if="shouldShowSummary && previewSummaryCards.length"
                class="px-5 py-3 sm:px-7"
              >
                <template v-if="isExcelPreview">
                  <div class="border-l-4 border-[#ff6600] bg-[#102372] px-3 py-2">
                    <h4 class="text-[11px] font-black text-white">Resumen del periodo</h4>
                  </div>

                  <div class="grid border-x border-b border-[#d8dee8] text-center md:grid-cols-4">
                    <div
                      v-for="card in excelPreviewSummaryCards"
                      :key="card.label"
                      class="border-b border-r border-[#d8dee8] last:border-r-0 md:border-b-0"
                    >
                      <p
                        class="px-2 py-2 text-[10px] font-black text-white"
                        :class="card.labelClass"
                      >
                        {{ card.label }}
                      </p>

                      <p
                        class="bg-[#eff6ff] px-2 py-3 text-[15px] font-black"
                        :class="card.valueClass"
                      >
                        {{ card.value }}
                      </p>
                    </div>
                  </div>
                </template>

                <template v-else>
                  <div class="border-b-2 border-[#ff6600] pb-1">
                    <h4 class="text-[12px] font-black text-[#102372]">Resumen del periodo</h4>
                  </div>

                  <div class="mt-2 grid border border-[#d8dee8] sm:grid-cols-2 xl:grid-cols-4">
                    <div
                      v-for="card in previewSummaryCards"
                      :key="card.label"
                      class="border-b border-r border-[#d8dee8] px-3 py-3 last:border-r-0 sm:[&:nth-child(2n)]:border-r-0 xl:border-b-0 xl:[&:nth-child(2n)]:border-r xl:[&:last-child]:border-r-0"
                    >
                      <p class="text-center text-[9px] font-bold text-slate-500">
                        {{ card.label }}
                      </p>

                      <p class="mt-1 text-center text-[18px] font-black" :class="card.valueClass">
                        {{ card.value }}
                      </p>
                    </div>
                  </div>
                </template>
              </section>

              <section v-if="isMapReport && shouldShowTripMap" class="px-5 py-3 sm:px-7">
                <div
                  :class="
                    isExcelPreview
                      ? 'border-l-4 border-[#ff6600] bg-[#102372] px-3 py-2'
                      : 'border-b-2 border-[#ff6600] pb-1'
                  "
                >
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <h4
                      class="text-[12px] font-black"
                      :class="isExcelPreview ? 'text-white' : 'text-[#102372]'"
                    >
                      {{ isStopsReportTemplate ? "Mapa de detenciones" : "Mapa de viajes" }}
                    </h4>

                    <div
                      class="flex flex-wrap items-center gap-2 text-[9px] font-black"
                      :class="isExcelPreview ? 'text-white/80' : 'text-slate-500'"
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

                      <span v-if="isStopsReportTemplate" class="inline-flex items-center gap-1">
                        <span class="h-2 w-2 rounded-full bg-rose-500"></span>
                        Detenciones
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  class="mt-3 overflow-hidden bg-[#dbe5f0]"
                  :class="isPdfPreview ? 'mx-auto max-w-[620px]' : 'w-full'"
                >
                  <img
                    v-if="tripMapImageDataUrl"
                    :src="tripMapImageDataUrl"
                    :alt="routeMapPreviewAlt"
                    class="block w-full object-contain"
                  />

                  <div
                    v-else-if="isBuildingTripMap"
                    class="flex h-[300px] items-center justify-center px-5 text-center text-[12px] font-black text-[#102372]"
                  >
                    Preparando imagen del mapa...
                  </div>

                  <div
                    v-else
                    class="flex h-[300px] items-center justify-center px-5 text-center text-[12px] font-black text-[#102372]"
                  >
                    {{ routeMapPreviewEmptyText }}
                  </div>
                </div>

                <p
                  class="mt-2 text-[9px] italic text-slate-500"
                  :class="isPdfPreview ? 'mx-auto max-w-[620px]' : ''"
                >
                  {{ routeMapPreviewTitle }}
                </p>
              </section>

              <section
                v-if="shouldShowCharts && reportChartRecommendations.length"
                class="px-5 py-3 sm:px-7"
              >
                <div
                  :class="
                    isExcelPreview
                      ? 'border-l-4 border-[#ff6600] bg-[#102372] px-3 py-2'
                      : 'border-b-2 border-[#ff6600] pb-1'
                  "
                >
                  <h4
                    class="text-[12px] font-black"
                    :class="isExcelPreview ? 'text-white' : 'text-[#102372]'"
                  >
                    Graficos recomendados
                  </h4>
                </div>

                <div class="mt-2 grid gap-2 md:grid-cols-2">
                  <article
                    v-for="chart in reportChartRecommendations"
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

              <section v-if="shouldShowCharts" class="px-5 py-3 sm:px-7">
                <ReportCharts
                  ref="reportChartsRef"
                  title="Graficos del reporte"
                  records-label="filas del reporte"
                  empty-label="No hay graficos agregados al reporte"
                  :rows="reportChartRows"
                  :total-records="reportRows.length"
                  :revision="reportRevision"
                  :summary="reportSummary"
                  @update:chart-count="handleChartCountUpdate"
                />
              </section>

              <section
                v-if="isExcelPreview && excelPreviewAssetRows.length"
                class="px-5 py-3 sm:px-7"
              >
                <div class="border-l-4 border-[#ff6600] bg-[#102372] px-3 py-2">
                  <h4 class="text-[11px] font-black text-white">Activos incluidos</h4>
                </div>

                <div class="overflow-auto border-x border-b border-[#d8dee8]">
                  <table class="min-w-full border-collapse text-left text-[10px]">
                    <thead class="bg-[#102372] text-white">
                      <tr>
                        <th class="whitespace-nowrap px-3 py-2 font-black">Vehiculo</th>
                        <th class="whitespace-nowrap px-3 py-2 font-black">Patente</th>
                        <th class="whitespace-nowrap px-3 py-2 font-black">GPS / IMEI</th>
                        <th class="whitespace-nowrap px-3 py-2 font-black">Conductor</th>
                      </tr>
                    </thead>

                    <tbody>
                      <tr
                        v-for="asset in excelPreviewAssetRows"
                        :key="asset.key"
                        class="border-b border-[#d8dee8] odd:bg-white even:bg-[#f3f4f6]"
                      >
                        <td class="whitespace-nowrap px-3 py-2 font-black text-[#102372]">
                          {{ asset.name }}
                        </td>
                        <td
                          class="whitespace-nowrap bg-[#fff7ed] px-3 py-2 font-black text-[#ff6600]"
                        >
                          {{ asset.patent }}
                        </td>
                        <td class="whitespace-nowrap px-3 py-2 font-semibold text-slate-700">
                          {{ asset.deviceId }}
                        </td>
                        <td class="whitespace-nowrap px-3 py-2 font-semibold text-slate-700">
                          {{ asset.driver }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section v-if="shouldShowTable" class="px-5 py-3 sm:px-7">
                <div
                  :class="
                    isExcelPreview
                      ? 'border-l-4 border-[#ff6600] bg-[#102372] px-3 py-2'
                      : 'border-b-2 border-[#ff6600] pb-1'
                  "
                >
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <h4
                      class="text-[12px] font-black"
                      :class="isExcelPreview ? 'text-white' : 'text-[#102372]'"
                    >
                      {{ isExcelPreview ? reportDetailTitle : "Detalle del reporte" }}
                    </h4>

                    <span
                      class="text-[9px] font-bold"
                      :class="isExcelPreview ? 'text-white/80' : 'text-slate-500'"
                    >
                      {{ activePreviewTableLabel }}
                    </span>
                  </div>
                </div>

                <div class="mt-2 overflow-auto border border-[#d8dee8]">
                  <table class="min-w-full border-collapse text-left text-[10px]">
                    <thead class="bg-[#102372] text-white">
                      <tr>
                        <th
                          v-for="column in previewTableColumns"
                          :key="column.key"
                          class="whitespace-nowrap px-3 py-2 font-black"
                        >
                          {{ column.label }}
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      <tr
                        v-for="(row, rowIndex) in previewReportRowsWithAddresses"
                        :key="row.id"
                        class="border-b border-[#d8dee8] odd:bg-white even:bg-[#f3f4f6]"
                      >
                        <td
                          v-for="column in previewTableColumns"
                          :key="column.key"
                          class="whitespace-nowrap px-3 py-2 font-semibold text-slate-700"
                        >
                          {{ getPreviewTableCellValue(row, column, rowIndex) }}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div
                    v-if="shouldResolvePreviewAddresses"
                    class="border-t border-[#d8dee8] bg-[#f8fafc] px-3 py-1.5 text-[9px] font-bold text-slate-400"
                  >
                    {{ reverseGeocodingAttribution }}
                  </div>

                  <div
                    v-if="isPdfPreview && hiddenPdfPreviewColumnsCount"
                    class="border-t border-[#d8dee8] bg-[#f8fafc] px-3 py-2 text-[10px] font-bold text-slate-500"
                  >
                    PDF compacto: {{ hiddenPdfPreviewColumnsCount }} columnas adicionales se veran
                    en Detalle adicional. Excel conserva todas las columnas.
                  </div>

                  <div
                    v-else-if="isExcelPreview"
                    class="border-t border-[#d8dee8] bg-[#f8fafc] px-3 py-2 text-[10px] font-bold text-slate-500"
                  >
                    Excel muestra todas las columnas seleccionadas y mantiene hojas auxiliares para
                    analisis.
                  </div>

                  <div
                    v-if="hiddenReportRowsCount"
                    class="border-t border-[#d8dee8] bg-[#f8fafc] px-3 py-2 text-[10px] font-bold text-slate-500"
                  >
                    {{ hiddenReportRowsCount }} filas adicionales no se muestran en la vista previa
                    para mantener fluida la pantalla. La exportacion incluye el reporte completo.
                  </div>
                </div>
              </section>

              <footer
                class="mt-4 flex items-center justify-between border-t border-[#d8dee8] px-5 py-3 text-[8px] font-semibold text-slate-500 sm:px-7"
              >
                <span>Sinergy Group Chile</span>
                <span>{{ activePreviewFooterLabel }}</span>
              </footer>
            </article>

            <template v-else>
              <div
                v-if="hasExecutedReport && !hasReport"
                class="flex min-h-[260px] items-center justify-center rounded-xl border border-dashed border-[#cbd5e1] bg-white p-6 text-center"
              >
                <div class="max-w-[360px]">
                  <div
                    class="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#fff3e8] text-[#ff6600]"
                  >
                    <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" aria-hidden="true">
                      <path
                        d="M5 5l14 14M9.5 9.5A4.8 4.8 0 0 1 12 9c3.8 0 7 3 8.2 4.3a1 1 0 0 1 0 1.4 15.6 15.6 0 0 1-3.2 2.5M14.5 14.5A3.5 3.5 0 0 1 8.8 11M6.7 8A15.4 15.4 0 0 0 3.8 10.3a1 1 0 0 0 0 1.4C5 13 8.2 16 12 16c.7 0 1.4-.1 2-.3"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </div>

                  <p class="mt-3 text-[13px] font-black text-[#102372]">
                    {{ emptyReportTitle }}
                  </p>

                  <p class="mt-1 text-[11px] font-semibold leading-relaxed text-slate-500">
                    {{ emptyReportDetail }}
                  </p>
                </div>
              </div>

              <div
                v-else
                class="flex min-h-[260px] items-center justify-center rounded-xl border border-dashed border-[#cbd5e1] bg-white p-6 text-center"
              >
                <div>
                  <p class="text-[13px] font-black text-[#102372]">
                    Configura y genera la vista previa
                  </p>

                  <p
                    class="mt-1 max-w-[280px] text-[11px] font-semibold leading-relaxed text-slate-500"
                  >
                    Selecciona activos y presiona generar para revisar el reporte antes de
                    exportarlo.
                  </p>
                </div>
              </div>
            </template>
          </div>

          <div
            v-if="isReportBusy"
            class="absolute inset-0 z-20 flex items-center justify-center bg-white/75 px-4 backdrop-blur-[1px]"
            role="status"
            aria-live="polite"
          >
            <div
              class="flex min-w-[230px] max-w-[320px] flex-col items-center rounded-xl bg-white px-5 py-4 text-center shadow-[0_18px_50px_rgba(15,23,42,0.24)] ring-1 ring-slate-200/70"
            >
              <span
                class="h-8 w-8 animate-spin rounded-full border-2 border-[#d8dee8] border-t-[#ff6600]"
                aria-hidden="true"
              ></span>

              <p class="mt-3 text-[12px] font-black text-[#102372]">
                {{ reportBusyTitle }}
              </p>

              <p class="mt-1 text-[10px] font-semibold leading-relaxed text-slate-500">
                {{ reportBusyDetail }}
              </p>
            </div>
          </div>
        </main>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent, nextTick, ref, toRef, watch } from "vue"

import reportBrandLogo from "../../assets/branding/sinergy-group-report.png"
import { useAuditTrail } from "../../composables/audit/useAuditTrail.js"
import { useReverseGeocodedRows } from "../../composables/location/useReverseGeocodedRows.js"
import { useAssetReportExecution } from "../../composables/reports/useAssetReportExecution.js"
import { useRouteTripMapPreview } from "../../composables/reports/useRouteTripMapPreview.js"
import {
  REPORT_BEHAVIOR_OPTION_IDS,
  normalizeReportBehaviorOptions,
} from "../../utils/reports/config/reportBehaviorOptions.js"
import { getReportChartRecommendations } from "../../utils/reports/config/reportChartRecommendations.js"
import {
  buildReportChartRows,
  sampleReportRows,
} from "../../utils/reports/export/reportChartRowUtils.js"
import {
  REPORT_OUTPUT_OPTION_IDS,
  normalizeReportOutputOptions,
} from "../../utils/reports/config/reportOutputOptions.js"
import {
  ASSET_REPORT_PREVIEW_FORMAT_IDS,
  buildAssetReportRenderModel,
  getReportRenderCellValue,
} from "../../utils/reports/execution/assetReportRenderModelUtils.js"
import {
  REPORT_ADDRESS_PREVIEW_RESOLVE_LIMIT,
  REPORT_CHART_LIMIT,
  REPORT_PREVIEW_LIMIT,
  getEmptyExportCharts,
  getEmptyReportContext,
  getReportBusyDetail,
  getReportBusyTitle,
  isRouteMapReport,
  isStopsReport,
} from "../../utils/reports/views/reportExecutionModalUtils.js"
import {
  REPORT_WIDGET_IDS,
  normalizeReportWidgets,
} from "../../utils/reports/config/reportWidgetUtils.js"

const ReportCharts = defineAsyncComponent(
  () => import("../activos/itinerarios/ItineraryCharts.vue"),
)

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  template: {
    type: Object,
    default: null,
  },
  assets: {
    type: Array,
    default: () => [],
  },
  companies: {
    type: Array,
    default: () => [],
  },
  geofences: {
    type: Array,
    default: () => [],
  },
  groups: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(["update:modelValue"])
const { recordAudit } = useAuditTrail()

const reportChartsRef = ref(null)
const reportRevision = ref(0)
const reportChartCount = ref(0)
const isExecutingReport = ref(false)
const isExportingExcel = ref(false)
const isExportingPdf = ref(false)
const PREVIEW_FORMAT_IDS = ASSET_REPORT_PREVIEW_FORMAT_IDS
const PREVIEW_METRIC_VALUE_CLASSES = {
  navy: "text-[#102372]",
  teal: "text-[#14b8a6]",
  orange: "text-[#ff6600]",
  blue: "text-[#2563eb]",
}
const EXCEL_PREVIEW_METRIC_LABEL_CLASSES = {
  navy: "bg-[#102372]",
  teal: "bg-[#14b8a6]",
  orange: "bg-[#ff6600]",
  blue: "bg-[#2563eb]",
}
const activePreviewFormat = ref(PREVIEW_FORMAT_IDS.pdf)

const withPreviewMetricClasses = (metrics = [], { includeLabelClass = false } = {}) => {
  return metrics.map((metric) => ({
    ...metric,
    valueClass: PREVIEW_METRIC_VALUE_CLASSES[metric.colorKey] || PREVIEW_METRIC_VALUE_CLASSES.navy,
    ...(includeLabelClass
      ? {
          labelClass:
            EXCEL_PREVIEW_METRIC_LABEL_CLASSES[metric.colorKey] ||
            EXCEL_PREVIEW_METRIC_LABEL_CLASSES.navy,
        }
      : {}),
  }))
}

const templateWidgets = computed(() => {
  return new Set(normalizeReportWidgets(props.template?.widgets))
})

const templateOutputOptions = computed(() => {
  return normalizeReportOutputOptions(props.template?.outputOptions)
})

const templateBehaviorOptions = computed(() => {
  return normalizeReportBehaviorOptions(props.template?.behaviorOptions)
})

const shouldShowSummary = computed(() => {
  return templateWidgets.value.has(REPORT_WIDGET_IDS.summaryCards)
})

const shouldShowTable = computed(() => {
  return templateWidgets.value.has(REPORT_WIDGET_IDS.table)
})

const shouldShowCharts = computed(() => {
  return templateWidgets.value.has(REPORT_WIDGET_IDS.charts)
})

const shouldAllowExcelExport = computed(() => {
  return templateOutputOptions.value[REPORT_OUTPUT_OPTION_IDS.excelExport] === true
})

const shouldAllowPdfExport = computed(() => {
  return templateOutputOptions.value[REPORT_OUTPUT_OPTION_IDS.pdfExport] === true
})

const previewFormatOptions = computed(() => {
  return [
    {
      id: PREVIEW_FORMAT_IDS.pdf,
      label: "PDF",
      enabled: shouldAllowPdfExport.value,
    },
    {
      id: PREVIEW_FORMAT_IDS.excel,
      label: "Excel",
      enabled: shouldAllowExcelExport.value,
    },
  ].filter((option) => option.enabled)
})

const activePreviewMode = computed(() => {
  const activeOption = previewFormatOptions.value.find((option) => {
    return option.id === activePreviewFormat.value
  })

  return activeOption?.id || previewFormatOptions.value[0]?.id || PREVIEW_FORMAT_IDS.pdf
})

const isPdfPreview = computed(() => {
  return activePreviewMode.value === PREVIEW_FORMAT_IDS.pdf
})

const isExcelPreview = computed(() => {
  return activePreviewMode.value === PREVIEW_FORMAT_IDS.excel
})

const setActivePreviewFormat = (formatId) => {
  const nextOption = previewFormatOptions.value.find((option) => {
    return option.id === formatId
  })

  if (nextOption) {
    activePreviewFormat.value = nextOption.id
  }
}

const reportChartRecommendations = computed(() => {
  return getReportChartRecommendations({
    reportTypeId: props.template?.reportTypeId,
    eventRuleIds: props.template?.eventRuleIds || props.template?.eventRuleId,
    columnIds: props.template?.columns,
    category: props.template?.category,
  })
})

const emptyReportContext = computed(() => {
  return getEmptyReportContext(props.template)
})

const emptyReportTitle = computed(() => {
  return emptyReportContext.value.title
})

const emptyReportDetail = computed(() => {
  return emptyReportContext.value.detail
})

const isReportBusy = computed(() => {
  return isExecutingReport.value || isExportingExcel.value || isExportingPdf.value
})

const reportBusyTitle = computed(() => {
  return getReportBusyTitle({
    isExportingExcel: isExportingExcel.value,
    isExportingPdf: isExportingPdf.value,
  })
})

const reportBusyDetail = computed(() => {
  return getReportBusyDetail({
    isExportingExcel: isExportingExcel.value,
    isExportingPdf: isExportingPdf.value,
  })
})

const templateRef = toRef(props, "template")
const assetsRef = computed(() => props.assets)
const companiesRef = computed(() => props.companies)
const geofencesRef = computed(() => props.geofences)
const groupsRef = computed(() => props.groups)

const {
  dateFrom,
  dateTo,
  assetSearch,
  selectedGroupId,
  selectedAssetIdSet,
  groupOptions,
  groupAssetCount,
  selectedAssetCount,
  selectedGroupLabel,
  filteredAssets,
  reportColumns,
  reportRows,
  reportSummary,
  hasReport,
  hasExecutedReport,
  dateRangeError,
  canExecuteReport,

  getAssetLabel,
  getAssetGroupLabel,
  toggleAsset,
  selectFilteredAssets,
  clearSelectedAssets,
  executeReport,
  exportExcel,
  exportPdf,
  resetExecution,
} = useAssetReportExecution({
  template: templateRef,
  assets: assetsRef,
  companies: companiesRef,
  geofences: geofencesRef,
  groups: groupsRef,
})

const recordReportAudit = ({ action, description }) => {
  recordAudit({
    module: "reportes",
    action,
    entityType: "reporte",
    entityName: props.template?.name || "Reporte de activos",
    description,
    metadata: {
      templateId: props.template?.id || "",
      reportTypeId: props.template?.reportTypeId || "",
      dateFrom: dateFrom.value,
      dateTo: dateTo.value,
      groupId: selectedGroupId.value,
      selectedAssetCount: selectedAssetCount.value,
      rowCount: reportRows.value.length,
    },
  })
}

const previewReportRows = computed(() => {
  return reportRows.value.slice(0, REPORT_PREVIEW_LIMIT)
})

const isStopsReportTemplate = computed(() => {
  return isStopsReport(props.template)
})

const isMapReport = computed(() => {
  return isRouteMapReport(props.template)
})

const shouldShowTripMap = computed(() => {
  if (!isMapReport.value || !templateOutputOptions.value[REPORT_OUTPUT_OPTION_IDS.previewTripMap]) {
    return false
  }

  if (isPdfPreview.value) {
    return templateOutputOptions.value[REPORT_OUTPUT_OPTION_IDS.pdfTripMap]
  }

  return templateOutputOptions.value[REPORT_OUTPUT_OPTION_IDS.excelTripMap]
})

const routeMapPreviewTitle = computed(() => {
  return isStopsReportTemplate.value
    ? "Detenciones numeradas sobre la ruta del vehiculo"
    : "Recorridos agrupados por origen, destino y kilometraje"
})

const routeMapPreviewAlt = computed(() => {
  return isStopsReportTemplate.value
    ? "Mapa del reporte de detenciones"
    : "Mapa del reporte de viajes"
})

const routeMapPreviewEmptyText = computed(() => {
  return isStopsReportTemplate.value
    ? "No hay coordenadas suficientes para dibujar el mapa de detenciones."
    : "No hay coordenadas suficientes para dibujar el mapa de viajes."
})

const { tripMapImageDataUrl, isBuildingTripMap, resetTripMapPreview } = useRouteTripMapPreview({
  reportRows,
  shouldShowTripMap,
})

const reportRenderModel = computed(() => {
  return buildAssetReportRenderModel({
    template: props.template,
    reportColumns: reportColumns.value,
    reportRows: reportRows.value,
    dateFrom: dateFrom.value,
    dateTo: dateTo.value,
    selectedGroupLabel: selectedGroupLabel.value,
    selectedAssetCount: selectedAssetCount.value,
    format: activePreviewMode.value,
    previewRows: previewReportRows.value,
    routeMapImageDataUrl: tripMapImageDataUrl.value,
    generatedAt: "Al exportar",
  })
})

const reportPreviewTitle = computed(() => {
  return reportRenderModel.value.previewTitle
})

const activePreviewHeaderTitle = computed(() => {
  return reportRenderModel.value.headerTitle
})

const reportPreviewRangeLabel = computed(() => {
  return reportRenderModel.value.rangeLabel
})

const excelPreviewAssetRows = computed(() => {
  return reportRenderModel.value.assets
})

const reportPreviewDetails = computed(() => {
  return reportRenderModel.value.details
})

const excelPreviewDetails = computed(() => {
  return reportRenderModel.value.excelDetails
})

const hiddenPdfPreviewColumnsCount = computed(() => {
  return reportRenderModel.value.hiddenPdfColumnCount
})

const previewTableColumns = computed(() => {
  return reportRenderModel.value.columns.visible
})

const activePreviewSubtitle = computed(() => {
  return reportRenderModel.value.subtitle
})

const activePreviewTableLabel = computed(() => {
  return reportRenderModel.value.tableLabel
})

const getPreviewTableCellValue = (row = {}, column = {}, rowIndex = 0) => {
  return getReportRenderCellValue(row, column, rowIndex)
}

const activePreviewFooterLabel = computed(() => {
  return reportRenderModel.value.footerLabel
})

const reportDetailTitle = computed(() => {
  return reportRenderModel.value.detailTitle
})

const activePreviewExportLabel = computed(() => {
  if (isExportingExcel.value || isExportingPdf.value) return "Exportando..."
  if (isExecutingReport.value) return "Generando..."

  return isPdfPreview.value ? "Exportar PDF" : "Exportar Excel"
})

const canExportActivePreview = computed(() => {
  if (!hasReport.value || dateRangeError.value || isReportBusy.value) return false

  return isPdfPreview.value ? shouldAllowPdfExport.value : shouldAllowExcelExport.value
})

const previewSummaryCards = computed(() => {
  if (!shouldShowSummary.value || !hasReport.value) return []

  return withPreviewMetricClasses(reportRenderModel.value.metrics)
})

const excelPreviewSummaryCards = computed(() => {
  if (!shouldShowSummary.value || !hasReport.value) return []

  return withPreviewMetricClasses(reportRenderModel.value.metrics, {
    includeLabelClass: true,
  })
})

const shouldResolvePreviewAddresses = computed(() => {
  const canResolveAddresses =
    templateBehaviorOptions.value[REPORT_BEHAVIOR_OPTION_IDS.resolveAddresses] === true
  const canResolveTripEndpoints =
    templateBehaviorOptions.value[REPORT_BEHAVIOR_OPTION_IDS.resolveTripEndpoints] === true

  return previewTableColumns.value.some((column) => {
    if (["address", "lastPosition", "direccion"].includes(column.key)) {
      return canResolveAddresses
    }

    if (["tripOrigin", "tripDestination"].includes(column.key)) {
      return canResolveTripEndpoints
    }

    return false
  })
})

const { rowsWithResolvedAddresses: previewReportRowsWithAddresses, reverseGeocodingAttribution } =
  useReverseGeocodedRows(previewReportRows, {
    limit: REPORT_ADDRESS_PREVIEW_RESOLVE_LIMIT,
    enabled: shouldResolvePreviewAddresses,
  })

const hiddenReportRowsCount = computed(() => {
  return Math.max(0, reportRows.value.length - previewReportRows.value.length)
})

const waitForPaint = async () => {
  await nextTick()

  await new Promise((resolve) => {
    if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(resolve)
      })
      return
    }

    setTimeout(resolve, 0)
  })
}

const reportChartRows = computed(() => {
  if (!shouldShowCharts.value || !hasReport.value || reportRows.value.length === 0) {
    return []
  }

  const sampledRows = sampleReportRows(reportRows.value, REPORT_CHART_LIMIT)

  return buildReportChartRows(sampledRows)
})

const handleChartCountUpdate = (chartCount) => {
  if (!shouldShowCharts.value) {
    reportChartCount.value = 0
    return
  }

  const normalizedCount = Number(chartCount)

  reportChartCount.value = Number.isFinite(normalizedCount)
    ? Math.max(0, Math.trunc(normalizedCount))
    : 0
}

const getReportExportCharts = async ({ includeImages = true } = {}) => {
  if (
    !shouldShowCharts.value ||
    reportChartCount.value === 0 ||
    !reportChartsRef.value?.getExportCharts
  ) {
    return getEmptyExportCharts()
  }

  /*
   * Esta transformación completa ocurre únicamente cuando el usuario
   * presiona Excel o PDF.
   */
  const fullData = !includeImages
  const fullReportChartRows = fullData ? buildReportChartRows(reportRows.value) : undefined

  return reportChartsRef.value.getExportCharts({
    includeImages,
    fullData,
    rows: fullReportChartRows,
  })
}

const handleExecuteReport = async () => {
  if (!canExecuteReport.value || isExecutingReport.value) return

  isExecutingReport.value = true

  try {
    await waitForPaint()
    await Promise.resolve(executeReport())
    reportRevision.value += 1
    recordReportAudit({
      action: "report:generate",
      description: "Se genero la vista previa de un reporte.",
    })
  } finally {
    isExecutingReport.value = false
  }
}

const handleExportExcel = async () => {
  if (
    !shouldAllowExcelExport.value ||
    !hasReport.value ||
    dateRangeError.value ||
    isExportingExcel.value ||
    isExportingPdf.value
  ) {
    return
  }

  isExportingExcel.value = true

  try {
    await waitForPaint()

    const charts = await getReportExportCharts({
      includeImages: false,
    })

    await Promise.resolve(exportExcel(charts))
    recordReportAudit({
      action: "report:export:excel",
      description: "Se exporto un reporte en formato Excel.",
    })
  } finally {
    isExportingExcel.value = false
  }
}

const handleExportPdf = async () => {
  if (
    !shouldAllowPdfExport.value ||
    !hasReport.value ||
    dateRangeError.value ||
    isExportingExcel.value ||
    isExportingPdf.value
  ) {
    return
  }

  isExportingPdf.value = true

  try {
    await waitForPaint()

    const charts = await getReportExportCharts({
      includeImages: true,
    })

    await Promise.resolve(exportPdf(charts))
    recordReportAudit({
      action: "report:export:pdf",
      description: "Se exporto un reporte en formato PDF.",
    })
  } finally {
    isExportingPdf.value = false
  }
}

const handleExportActivePreview = async () => {
  if (!canExportActivePreview.value) return

  if (isPdfPreview.value) {
    await handleExportPdf()
    return
  }

  await handleExportExcel()
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) return

    resetExecution()
    reportRevision.value = 0
    reportChartCount.value = 0
    resetTripMapPreview()
    isExecutingReport.value = false
    isExportingExcel.value = false
    isExportingPdf.value = false
    activePreviewFormat.value =
      previewFormatOptions.value.find((option) => option.id === PREVIEW_FORMAT_IDS.pdf)?.id ||
      previewFormatOptions.value[0]?.id ||
      PREVIEW_FORMAT_IDS.pdf
  },
)

const closeModal = () => {
  emit("update:modelValue", false)
}
</script>
