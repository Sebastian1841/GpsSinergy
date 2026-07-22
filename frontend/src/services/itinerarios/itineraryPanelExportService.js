import { resolveReverseGeocodedSources } from "../location/reverseGeocodingService.js"

const EXPORT_ADDRESS_RESOLVE_LIMIT = 8

const escapeHtml = (value) => {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

const escapeCsvValue = (value) => {
  const text = String(value ?? "")

  if (!/[",\n\r;]/.test(text)) return text

  return `"${text.replace(/"/g, '""')}"`
}

const parseReportNumber = (value) => {
  const parsed = Number(
    String(value ?? "")
      .replace(",", ".")
      .replace(/[^\d.-]/g, ""),
  )

  return Number.isFinite(parsed) ? parsed : 0
}

const formatGeneratedAt = () => {
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date())
}

export const resolveItineraryExportRows = (rows = [], options = {}) => {
  return resolveReverseGeocodedSources(rows, {
    limit: options.limit || EXPORT_ADDRESS_RESOLVE_LIMIT,
  })
}

export const createItineraryExportContext = ({
  routeResult = null,
  fromDate = "",
  toDate = "",
  selectedAssetsSummary = "",
  activeRangeLabel = "",
  generatedAt = "",
  exportRows = null,
} = {}) => {
  const normalizedRouteResult = routeResult || {}
  const rows = Array.isArray(exportRows) ? exportRows : normalizedRouteResult.rows || []

  return {
    routeResult: normalizedRouteResult,
    rows,
    fromDate,
    toDate,
    selectedAssetsSummary,
    activeRangeLabel,
    generatedAt: generatedAt || formatGeneratedAt(),
  }
}

const getExportAssets = (context) => {
  if (context.routeResult?.assets?.length) return context.routeResult.assets

  return [context.routeResult?.asset].filter(Boolean)
}

const buildRowsByAssetId = (context) => {
  const rowsByAssetId = new Map()
  const fallbackAssetId = String(context.routeResult?.asset?.id || "")

  context.rows.forEach((row) => {
    const assetId = String(row?.assetId || fallbackAssetId)

    if (!rowsByAssetId.has(assetId)) {
      rowsByAssetId.set(assetId, [])
    }

    rowsByAssetId.get(assetId).push(row)
  })

  return rowsByAssetId
}

const getRowsForAsset = (context, rowsByAssetId, asset) => {
  const assetId = String(asset?.id || "")

  return rowsByAssetId.get(assetId) || []
}

const getRouteAssetLabel = (context, row) => {
  return (
    row.assetDisplayName ||
    row.assetPatente ||
    context.routeResult?.asset?.displayName ||
    context.routeResult?.asset?.patente ||
    "-"
  )
}

const getRouteAssetPatente = (context, row) => {
  return row.assetPatente || context.routeResult?.asset?.patente || ""
}

const getRouteAssetDevice = (context, row) => {
  return row.assetDeviceId || context.routeResult?.asset?.deviceId || ""
}

const getRouteStatusLabel = (row) => {
  return row.status === "moving" ? "Movimiento" : "Detenido"
}

const buildCsvLine = (row) => {
  return row.map(escapeCsvValue).join(";")
}

export const buildItineraryExportBaseName = (context) => {
  const assetLabel =
    context.routeResult?.asset?.displayName ||
    context.routeResult?.asset?.patente ||
    context.routeResult?.asset?.id ||
    "itinerario"

  const normalizedAssetLabel = String(assetLabel)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()

  return `itinerario-${normalizedAssetLabel || "activos"}-${context.fromDate}-${context.toDate}`
}

export const buildItineraryExportFilename = (context, extension = "html") => {
  return `${buildItineraryExportBaseName(context)}.${extension}`
}

const buildItineraryCsv = (context) => {
  const summary = context.routeResult?.summary || {}
  const assets = getExportAssets(context)
  const rowsByAssetId = buildRowsByAssetId(context)
  const csvRows = [
    ["REPORTE DE ITINERARIO"],
    ["Generado", context.generatedAt],
    ["Rango", `${context.fromDate} a ${context.toDate}`],
    ["Activos", context.selectedAssetsSummary],
    [],
    ["RESUMEN"],
    ["Distancia total", summary.distanceLabel || "0 km"],
    ["Tiempo en movimiento", summary.movingLabel || "0 min"],
    ["Tiempo detenido", summary.stoppedLabel || "0 min"],
    ["Velocidad promedio", summary.averageSpeedLabel || "0 km/h"],
    ["Paradas", summary.stopsCount || 0],
    ["Puntos GPS", summary.pointsCount || context.rows.length || 0],
    [],
    ["ACTIVOS"],
    ["Activo", "Patente", "Dispositivo", "Conductor", "Puntos", "En ruta", "Distancia"],
    ...assets.map((asset) => {
      const rows = getRowsForAsset(context, rowsByAssetId, asset)
      const movingRows = rows.filter((row) => row.status === "moving")
      const maxDistance = rows.reduce((maxValue, row) => {
        return Math.max(maxValue, parseReportNumber(row.accumulatedDistanceKm))
      }, 0)

      return [
        asset.displayName || asset.patente || asset.id || "-",
        asset.patente || "-",
        asset.deviceId || "-",
        asset.conductor || "Sin conductor",
        rows.length,
        movingRows.length,
        `${maxDistance.toFixed(1)} km`,
      ]
    }),
    [],
    ["DETALLE GPS"],
    [
      "#",
      "Activo",
      "Patente",
      "Dispositivo",
      "Fecha",
      "Hora",
      "Estado",
      "Velocidad",
      "Direccion",
      "Evento",
      "Km acumulado",
      "Latitud",
      "Longitud",
    ],
    ...context.rows.map((row, index) => [
      index + 1,
      getRouteAssetLabel(context, row),
      getRouteAssetPatente(context, row),
      getRouteAssetDevice(context, row),
      row.dateLabel || "",
      row.timeLabel || "",
      getRouteStatusLabel(row),
      row.speedLabel || row.speed || "",
      row.address || "",
      row.event || "",
      row.accumulatedDistanceLabel || "",
      row.lat ?? "",
      row.lng ?? "",
    ]),
  ]

  return csvRows.map(buildCsvLine).join("\n")
}

export const buildItineraryCsvContent = (context) => {
  return `\uFEFF${buildItineraryCsv(context)}`
}

const buildReportMetricCardsHtml = (context) => {
  const summary = context.routeResult?.summary || {}
  const items = [
    {
      label: "Distancia total",
      value: summary.distanceLabel || "0 km",
      accent: "#102372",
      footer: "Recorrido calculado",
    },
    {
      label: "Tiempo en movimiento",
      value: summary.movingLabel || "0 min",
      accent: "#14b8a6",
      footer: "Operacion efectiva",
    },
    {
      label: "Tiempo detenido",
      value: summary.stoppedLabel || "0 min",
      accent: "#f97316",
      footer: `${summary.stopsCount || 0} paradas`,
    },
    {
      label: "Velocidad promedio",
      value: summary.averageSpeedLabel || "0 km/h",
      accent: "#2563eb",
      footer: "Solo puntos en movimiento",
    },
  ]

  return items
    .map((item) => {
      return `
        <article class="metric-card" style="--accent:${item.accent}">
          <div class="metric-head">
            <span>${escapeHtml(item.label)}</span>
            <i></i>
          </div>
          <strong>${escapeHtml(item.value)}</strong>
          <small>${escapeHtml(item.footer)}</small>
        </article>
      `
    })
    .join("")
}

const buildReportAssetsHtml = (context) => {
  const rowsByAssetId = buildRowsByAssetId(context)

  return getExportAssets(context)
    .map((asset) => {
      const rows = getRowsForAsset(context, rowsByAssetId, asset)
      const movingRows = rows.filter((row) => row.status === "moving")
      const maxDistance = rows.reduce((maxValue, row) => {
        return Math.max(maxValue, parseReportNumber(row.accumulatedDistanceKm))
      }, 0)

      return `
        <tr>
          <td>
            <strong>${escapeHtml(asset.displayName || asset.patente || asset.id || "-")}</strong>
            <span>${escapeHtml(asset.conductor || "Sin conductor")}</span>
          </td>
          <td>${escapeHtml(asset.patente || "-")}</td>
          <td>${escapeHtml(asset.deviceId || "-")}</td>
          <td>${rows.length}</td>
          <td>${movingRows.length}</td>
          <td>${maxDistance.toFixed(1)} km</td>
        </tr>
      `
    })
    .join("")
}

const buildReportRowsHtml = (context) => {
  return context.rows
    .map((row, index) => {
      return `
        <tr>
          <td>${index + 1}</td>
          <td>
            <strong>${escapeHtml(getRouteAssetLabel(context, row))}</strong>
            <span>${escapeHtml(getRouteAssetDevice(context, row) || getRouteAssetPatente(context, row))}</span>
          </td>
          <td>${escapeHtml(row.dateLabel || "")}</td>
          <td>${escapeHtml(row.timeLabel || "")}</td>
          <td><span class="status-pill ${row.status === "moving" ? "moving" : "stopped"}">${escapeHtml(getRouteStatusLabel(row))}</span></td>
          <td>${escapeHtml(row.speedLabel || row.speed || "")}</td>
          <td>${escapeHtml(row.event || "")}</td>
          <td>${escapeHtml(row.accumulatedDistanceLabel || "")}</td>
          <td>${escapeHtml(row.address || "")}</td>
          <td>${escapeHtml(row.lat ?? "")}, ${escapeHtml(row.lng ?? "")}</td>
        </tr>
      `
    })
    .join("")
}

const buildReportChartCardHtml = ({ title, subtitle, image, large = false }) => {
  if (!image) {
    return `
      <article class="chart-card ${large ? "large" : ""}">
        <div class="chart-title">
          <strong>${escapeHtml(title)}</strong>
          <span>${escapeHtml(subtitle)}</span>
        </div>
        <div class="chart-empty">Grafico no disponible en esta exportacion.</div>
      </article>
    `
  }

  return `
    <article class="chart-card ${large ? "large" : ""}">
      <div class="chart-title">
        <strong>${escapeHtml(title)}</strong>
        <span>${escapeHtml(subtitle)}</span>
      </div>
      <img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" />
    </article>
  `
}

const getExportChartTypeLabel = (type) => {
  if (type === "line") return "grafico de linea"
  if (type === "doughnut") return "distribucion"

  return "grafico de barras"
}

const buildReportChartsHtml = (charts = {}) => {
  if (charts.enabled === false || !charts.items?.length) return ""

  const chartCards = charts.items
    .map((chart) => {
      return buildReportChartCardHtml({
        title: chart.label || "Grafico",
        subtitle: chart.unit ? `${chart.unit} por reporte` : getExportChartTypeLabel(chart.type),
        image: chart.image,
        large: charts.items.length === 1,
      })
    })
    .join("")

  return `
    <section class="section">
      <div class="section-title">
        <h2>Graficos</h2>
        <p>Visualizacion exportada desde el panel de itinerarios.</p>
      </div>
      <div class="chart-grid">
        ${chartCards}
      </div>
    </section>
  `
}

const buildReportStyles = () => {
  return `
    :root {
      color: #172033;
      background: #eef2f7;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      background: #eef2f7;
      color: #172033;
    }

    .report {
      max-width: 1120px;
      margin: 0 auto;
      padding: 24px;
    }

    .hero {
      display: grid;
      gap: 18px;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: start;
      border: 1px solid #dbe4f0;
      border-radius: 18px;
      background:
        linear-gradient(135deg, rgba(16, 35, 114, 0.96), rgba(16, 35, 114, 0.82)),
        #102372;
      color: #fff;
      padding: 24px;
      box-shadow: 0 18px 50px rgba(15, 23, 42, 0.16);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 18px;
    }

    .brand-mark {
      display: grid;
      place-items: center;
      width: 42px;
      height: 42px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.18);
      font-weight: 900;
    }

    .brand small,
    .hero p {
      color: rgba(255, 255, 255, 0.72);
      font-weight: 700;
    }

    h1 {
      margin: 0;
      font-size: 30px;
      line-height: 1.08;
      letter-spacing: 0;
    }

    h2,
    h3,
    p {
      margin: 0;
    }

    .hero-meta {
      display: grid;
      gap: 8px;
      min-width: 250px;
      padding: 14px;
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.16);
    }

    .hero-meta span {
      display: flex;
      justify-content: space-between;
      gap: 14px;
      color: rgba(255, 255, 255, 0.7);
      font-size: 12px;
      font-weight: 800;
    }

    .hero-meta strong {
      color: #fff;
      text-align: right;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 18px;
    }

    .action {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 34px;
      border-radius: 10px;
      padding: 0 14px;
      background: #ff6600;
      color: #fff;
      text-decoration: none;
      font-size: 12px;
      font-weight: 900;
      border: 0;
      cursor: pointer;
    }

    .action.secondary {
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .section {
      margin-top: 18px;
      border: 1px solid #dbe4f0;
      border-radius: 18px;
      background: #fff;
      padding: 18px;
      box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);
    }

    .section-title {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 14px;
      align-items: end;
    }

    .section-title h2 {
      color: #102372;
      font-size: 18px;
    }

    .section-title p {
      color: #64748b;
      font-size: 12px;
      font-weight: 700;
    }

    .metrics {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
    }

    .metric-card {
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 14px;
      background: linear-gradient(180deg, color-mix(in srgb, var(--accent) 7%, #ffffff), #ffffff);
    }

    .metric-head {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      color: #64748b;
      font-size: 11px;
      font-weight: 900;
      text-transform: uppercase;
    }

    .metric-head i {
      width: 9px;
      height: 9px;
      border-radius: 999px;
      background: var(--accent);
    }

    .metric-card strong {
      display: block;
      margin-top: 10px;
      color: var(--accent);
      font-size: 26px;
      line-height: 1;
    }

    .metric-card small {
      display: block;
      margin-top: 6px;
      color: #64748b;
      font-size: 11px;
      font-weight: 700;
    }

    .chart-grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      gap: 14px;
    }

    .chart-card {
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      background: #fbfdff;
      padding: 14px;
    }

    .chart-card.large {
      grid-column: 1 / -1;
    }

    .chart-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin-bottom: 10px;
    }

    .chart-title strong {
      color: #102372;
      font-size: 13px;
    }

    .chart-title span {
      color: #64748b;
      font-size: 11px;
      font-weight: 800;
    }

    .chart-card img {
      display: block;
      width: 100%;
      max-height: 330px;
      object-fit: contain;
    }

    .chart-empty {
      display: grid;
      min-height: 180px;
      place-items: center;
      border-radius: 12px;
      border: 1px dashed #cbd5e1;
      color: #64748b;
      font-size: 12px;
      font-weight: 800;
    }

    .status-legend {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    }

    .legend-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border: 1px solid #e2e8f0;
      border-radius: 999px;
      padding: 6px 9px;
      color: #475569;
      background: #fff;
      font-size: 11px;
      font-weight: 800;
    }

    .legend-chip i {
      width: 9px;
      height: 9px;
      border-radius: 999px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      overflow: hidden;
      border-radius: 14px;
      font-size: 12px;
    }

    th {
      background: #102372;
      color: #fff;
      padding: 10px;
      text-align: left;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0;
    }

    td {
      border-bottom: 1px solid #edf2f7;
      padding: 10px;
      vertical-align: top;
      color: #334155;
      font-weight: 700;
    }

    td span {
      display: block;
      margin-top: 3px;
      color: #64748b;
      font-size: 11px;
      font-weight: 700;
    }

    tbody tr:nth-child(even) {
      background: #f8fafc;
    }

    .status-pill {
      display: inline-flex;
      width: max-content;
      border-radius: 999px;
      padding: 4px 8px;
      font-size: 10px;
      font-weight: 900;
    }

    .status-pill.moving {
      background: #ccfbf1;
      color: #0f766e;
    }

    .status-pill.stopped {
      background: #ffedd5;
      color: #c2410c;
    }

    @media (max-width: 820px) {
      .report {
        padding: 14px;
      }

      .hero,
      .metrics,
      .chart-grid {
        grid-template-columns: 1fr;
      }

      .hero-meta {
        min-width: 0;
      }
    }

    @media print {
      body {
        background: #fff;
      }

      .report {
        max-width: none;
        padding: 0;
      }

      .action {
        display: none;
      }

      .section,
      .hero {
        box-shadow: none;
        break-inside: avoid;
      }
    }
  `
}

export const buildItineraryPrintableHtml = (context, charts = {}) => {
  const summary = context.routeResult?.summary || {}
  const csv = buildItineraryCsvContent(context)
  const csvHref = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Reporte de itinerario</title>
    <style>${buildReportStyles()}</style>
  </head>
  <body>
    <main class="report">
      <section class="hero">
        <div>
          <div class="brand">
            <span class="brand-mark">GPS</span>
            <div>
              <strong>Reporte de itinerario</strong><br />
              <small>Exportacion completa con graficos y datos GPS</small>
            </div>
          </div>
          <h1>${escapeHtml(context.routeResult?.asset?.patente || "Itinerario de activos")}</h1>
          <p>${escapeHtml(context.selectedAssetsSummary)} - ${escapeHtml(context.activeRangeLabel)}</p>
          <div class="actions">
            <button class="action" onclick="window.print()">Imprimir / guardar PDF</button>
            <a class="action secondary" href="${escapeHtml(csvHref)}" download="${escapeHtml(buildItineraryExportFilename(context, "csv"))}">Descargar CSV</a>
          </div>
        </div>

        <aside class="hero-meta">
          <span>Generado <strong>${escapeHtml(context.generatedAt)}</strong></span>
          <span>Rango <strong>${escapeHtml(context.fromDate)} a ${escapeHtml(context.toDate)}</strong></span>
          <span>Puntos GPS <strong>${escapeHtml(summary.pointsCount || context.rows.length || 0)}</strong></span>
          <span>Activos <strong>${escapeHtml(summary.assetsCount || getExportAssets(context).length)}</strong></span>
        </aside>
      </section>

      <section class="section">
        <div class="section-title">
          <h2>Resumen ejecutivo</h2>
          <p>${escapeHtml(summary.startAddress || "-")} -> ${escapeHtml(summary.endAddress || "-")}</p>
        </div>
        <div class="metrics">${buildReportMetricCardsHtml(context)}</div>
      </section>

      ${buildReportChartsHtml(charts)}

      <section class="section">
        <div class="section-title">
          <h2>Activos incluidos</h2>
          <p>${escapeHtml(getExportAssets(context).length)} registros de activo</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Activo</th>
              <th>Patente</th>
              <th>Dispositivo</th>
              <th>Puntos</th>
              <th>En ruta</th>
              <th>Distancia</th>
            </tr>
          </thead>
          <tbody>${buildReportAssetsHtml(context)}</tbody>
        </table>
      </section>

      <section class="section">
        <div class="section-title">
          <h2>Detalle GPS</h2>
          <p>${escapeHtml(context.rows.length || 0)} puntos exportados</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Activo</th>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Estado</th>
              <th>Velocidad</th>
              <th>Evento</th>
              <th>Km</th>
              <th>Direccion</th>
              <th>Coordenadas</th>
            </tr>
          </thead>
          <tbody>${buildReportRowsHtml(context)}</tbody>
        </table>
      </section>
    </main>
  </body>
</html>`
}

const buildExcelStyles = () => {
  return `
    body {
      font-family: Calibri, Arial, sans-serif;
      color: #172033;
      background: #ffffff;
    }

    table {
      border-collapse: collapse;
      width: 100%;
      margin-bottom: 18px;
    }

    th {
      background: #102372;
      color: #ffffff;
      font-weight: 700;
      border: 1px solid #102372;
      padding: 8px;
      text-align: left;
    }

    td {
      border: 1px solid #d8dee8;
      padding: 8px;
      vertical-align: top;
    }

    .title {
      background: #102372;
      color: #ffffff;
      font-size: 24px;
      font-weight: 700;
    }

    .subtitle {
      background: #eef2f7;
      color: #475569;
      font-weight: 700;
    }

    .section-title {
      background: #ff6600;
      color: #ffffff;
      font-size: 16px;
      font-weight: 700;
    }

    .metric-label {
      background: #f8fafc;
      color: #64748b;
      font-weight: 700;
    }

    .metric-value {
      color: #102372;
      font-size: 18px;
      font-weight: 700;
    }

    .chart-cell {
      background: #fbfdff;
      text-align: center;
    }

    .chart-cell img {
      max-width: 920px;
      width: 100%;
      height: auto;
    }

    .moving {
      color: #0f766e;
      font-weight: 700;
    }

    .stopped {
      color: #c2410c;
      font-weight: 700;
    }
  `
}

const buildExcelMetricRowsHtml = (context) => {
  const summary = context.routeResult?.summary || {}
  const metrics = [
    ["Distancia total", summary.distanceLabel || "0 km"],
    ["Tiempo en movimiento", summary.movingLabel || "0 min"],
    ["Tiempo detenido", summary.stoppedLabel || "0 min"],
    ["Velocidad promedio", summary.averageSpeedLabel || "0 km/h"],
    ["Paradas", summary.stopsCount || 0],
    ["Puntos GPS", summary.pointsCount || context.rows.length || 0],
  ]

  return metrics
    .map((metric) => {
      return `
        <tr>
          <td class="metric-label">${escapeHtml(metric[0])}</td>
          <td class="metric-value">${escapeHtml(metric[1])}</td>
        </tr>
      `
    })
    .join("")
}

const buildExcelChartRowsHtml = (charts = {}) => {
  return (charts.items || [])
    .map((chart) => {
      const title = chart.label || "Grafico"
      const image = chart.image

      if (!image) {
        return `
          <tr>
            <td class="metric-label">${escapeHtml(title)}</td>
            <td>Grafico no disponible</td>
          </tr>
        `
      }

      return `
        <tr>
          <td class="metric-label">${escapeHtml(title)}</td>
          <td class="chart-cell"><img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" /></td>
        </tr>
      `
    })
    .join("")
}

const buildExcelChartsTableHtml = (charts = {}) => {
  if (charts.enabled === false) return ""

  return `
    <table>
      <tr><td colspan="2" class="section-title">Graficos</td></tr>
      ${buildExcelChartRowsHtml(charts)}
    </table>
  `
}

const buildExcelAssetsRowsHtml = (context) => {
  const rowsByAssetId = buildRowsByAssetId(context)

  return getExportAssets(context)
    .map((asset) => {
      const rows = getRowsForAsset(context, rowsByAssetId, asset)
      const movingRows = rows.filter((row) => row.status === "moving")
      const maxDistance = rows.reduce((maxValue, row) => {
        return Math.max(maxValue, parseReportNumber(row.accumulatedDistanceKm))
      }, 0)

      return `
        <tr>
          <td>${escapeHtml(asset.displayName || asset.patente || asset.id || "-")}</td>
          <td>${escapeHtml(asset.patente || "-")}</td>
          <td>${escapeHtml(asset.deviceId || "-")}</td>
          <td>${escapeHtml(asset.conductor || "Sin conductor")}</td>
          <td>${rows.length}</td>
          <td>${movingRows.length}</td>
          <td>${maxDistance.toFixed(1)} km</td>
        </tr>
      `
    })
    .join("")
}

const buildExcelDetailRowsHtml = (context) => {
  return context.rows
    .map((row, index) => {
      const statusClass = row.status === "moving" ? "moving" : "stopped"

      return `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(getRouteAssetLabel(context, row))}</td>
          <td>${escapeHtml(getRouteAssetPatente(context, row))}</td>
          <td>${escapeHtml(getRouteAssetDevice(context, row))}</td>
          <td>${escapeHtml(row.dateLabel || "")}</td>
          <td>${escapeHtml(row.timeLabel || "")}</td>
          <td class="${statusClass}">${escapeHtml(getRouteStatusLabel(row))}</td>
          <td>${escapeHtml(row.speedLabel || row.speed || "")}</td>
          <td>${escapeHtml(row.event || "")}</td>
          <td>${escapeHtml(row.accumulatedDistanceLabel || "")}</td>
          <td>${escapeHtml(row.address || "")}</td>
          <td>${escapeHtml(row.lat ?? "")}</td>
          <td>${escapeHtml(row.lng ?? "")}</td>
        </tr>
      `
    })
    .join("")
}

export const buildItineraryExcelFallbackHtml = (context, charts = {}) => {
  const summary = context.routeResult?.summary || {}

  return `<!doctype html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="ProgId" content="Excel.Sheet" />
    <meta name="Generator" content="Itinerarios" />
    <style>${buildExcelStyles()}</style>
  </head>
  <body>
    <table>
      <tr><td colspan="7" class="title">Reporte de itinerario</td></tr>
      <tr><td colspan="7" class="subtitle">Generado: ${escapeHtml(context.generatedAt)}</td></tr>
      <tr><td colspan="7" class="subtitle">Rango: ${escapeHtml(context.fromDate)} a ${escapeHtml(context.toDate)}</td></tr>
      <tr><td colspan="7" class="subtitle">Activos: ${escapeHtml(context.selectedAssetsSummary)}</td></tr>
      <tr><td colspan="7" class="subtitle">Origen / destino: ${escapeHtml(summary.startAddress || "-")} -> ${escapeHtml(summary.endAddress || "-")}</td></tr>
    </table>

    <table>
      <tr><td colspan="2" class="section-title">Resumen ejecutivo</td></tr>
      ${buildExcelMetricRowsHtml(context)}
    </table>

    ${buildExcelChartsTableHtml(charts)}

    <table>
      <tr><td colspan="7" class="section-title">Activos incluidos</td></tr>
      <tr>
        <th>Activo</th>
        <th>Patente</th>
        <th>Dispositivo</th>
        <th>Conductor</th>
        <th>Puntos</th>
        <th>En ruta</th>
        <th>Distancia</th>
      </tr>
      ${buildExcelAssetsRowsHtml(context)}
    </table>

    <table>
      <tr><td colspan="13" class="section-title">Detalle GPS</td></tr>
      <tr>
        <th>#</th>
        <th>Activo</th>
        <th>Patente</th>
        <th>Dispositivo</th>
        <th>Fecha</th>
        <th>Hora</th>
        <th>Estado</th>
        <th>Velocidad</th>
        <th>Evento</th>
        <th>Km acumulado</th>
        <th>Direccion</th>
        <th>Latitud</th>
        <th>Longitud</th>
      </tr>
      ${buildExcelDetailRowsHtml(context)}
    </table>
  </body>
</html>`
}

export const buildItineraryExportReportData = (context, charts = {}) => {
  const rowsByAssetId = buildRowsByAssetId(context)
  const assets = getExportAssets(context).map((asset) => {
    const rows = getRowsForAsset(context, rowsByAssetId, asset)
    const movingRows = rows.filter((row) => row.status === "moving")
    const maxDistance = rows.reduce((maxValue, row) => {
      return Math.max(maxValue, parseReportNumber(row.accumulatedDistanceKm))
    }, 0)

    return {
      name: asset.displayName || asset.patente || asset.id || "-",
      patent: asset.patente || "-",
      deviceId: asset.deviceId || "-",
      driver: asset.conductor || "Sin conductor",
      points: rows.length,
      movingPoints: movingRows.length,
      distanceLabel: `${maxDistance.toFixed(1)} km`,
    }
  })
  const rows = context.rows.map((row, index) => ({
    index: index + 1,
    asset: getRouteAssetLabel(context, row),
    patent: getRouteAssetPatente(context, row),
    deviceId: getRouteAssetDevice(context, row),
    date: row.dateLabel || "",
    time: row.timeLabel || "",
    status: getRouteStatusLabel(row),
    speed: row.speedLabel || row.speed || "",
    event: row.event || "",
    distance: row.accumulatedDistanceLabel || "",
    address: row.address || "",
    lat: row.lat ?? "",
    lng: row.lng ?? "",
  }))

  return {
    filename: buildItineraryExportBaseName(context),
    title: context.routeResult?.asset?.patente || "Itinerario de activos",
    selectedAssetsSummary: context.selectedAssetsSummary,
    generatedAt: context.generatedAt,
    fromDate: context.fromDate,
    toDate: context.toDate,
    summary: context.routeResult?.summary || {},
    charts,
    assets,
    rows,
  }
}

export const downloadTextFile = ({ content, filename, type }) => {
  const blob = new Blob([content], {
    type,
  })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement("a")

  link.href = url
  link.download = filename
  link.click()

  window.setTimeout(() => {
    window.URL.revokeObjectURL(url)
  }, 1000)
}

export const openPrintableItineraryReport = ({
  html,
  reportWindow = null,
  fallbackFilename = "reporte-itinerario.html",
}) => {
  if (!reportWindow) {
    downloadTextFile({
      content: html,
      filename: fallbackFilename,
      type: "text/html;charset=utf-8;",
    })
    return
  }

  reportWindow.document.open()
  reportWindow.document.write(html)
  reportWindow.document.close()
  reportWindow.focus()

  window.setTimeout(() => {
    reportWindow.print()
  }, 700)
}
