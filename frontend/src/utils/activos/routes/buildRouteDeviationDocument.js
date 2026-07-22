import { buildRouteComparisonSnapshotSvg } from "./routeDeviationSnapshotUtils.js"

const firstValue = (...values) => {
  return values.find((value) => {
    if (value === 0) return true
    if (value === null || value === undefined) return false

    return String(value).trim() !== ""
  })
}

const firstText = (...values) => {
  return values.map((value) => String(value ?? "").trim()).find((value) => value && value !== "-")
}

const escapeHtml = (value) => {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }

    return entities[character]
  })
}

const toFiniteNumber = (value) => {
  const number = Number(value)

  return Number.isFinite(number) ? number : null
}

const formatDistance = (value) => {
  const meters = toFiniteNumber(value)

  if (meters === null) return "Sin dato"

  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`
  }

  return `${Math.round(meters)} m`
}

const formatDateTime = (value) => {
  if (value === null || value === undefined || String(value).trim() === "") {
    return "Sin fecha"
  }

  let normalizedValue = value

  if (typeof value === "number" && value < 100000000000) {
    normalizedValue = value * 1000
  }

  const date = value instanceof Date ? value : new Date(normalizedValue)

  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(date)
}

const getAssetName = (asset) => {
  return (
    firstValue(
      asset?.displayName,
      asset?.nombrePantalla,
      asset?.name,
      asset?.nombre,
      asset?.alias,
      asset?.deviceName,
      asset?.deviceId,
    ) || "Activo"
  )
}

const getAssetPlate = (asset) => {
  return (
    firstValue(
      asset?.patente,
      asset?.plate,
      asset?.licensePlate,
      asset?.license_plate,
      asset?.ppu,
      asset?.matricula,
      asset?.vehicle?.patente,
      asset?.vehicle?.plate,
    ) || "Sin patente"
  )
}

const getDeviationPoint = (deviation) => {
  return (
    deviation?.maxPoint ||
    deviation?.actualPoint ||
    deviation?.point ||
    deviation?.position ||
    (typeof deviation?.location === "object" ? deviation.location : undefined) ||
    deviation?.startPoint ||
    deviation?.endPoint ||
    deviation ||
    {}
  )
}

const getDeviationTimestamp = (deviation) => {
  const point = getDeviationPoint(deviation)

  return firstValue(
    deviation?.timestamp,
    deviation?.dateTime,
    deviation?.datetime,
    deviation?.occurredAt,
    deviation?.time,
    deviation?.maxPoint?.timestamp,
    deviation?.startPoint?.timestamp,
    deviation?.endPoint?.timestamp,
    point?.timestamp,
    point?.dateTime,
    point?.datetime,
    point?.occurredAt,
    point?.time,
    point?.fecha,
    point?.hora,
  )
}

const getDeviationPeriod = (deviation) => {
  const startTime = firstText(
    deviation?.startDateTimeLabel,
    deviation?.startTimeLabel,
    deviation?.startTime,
    deviation?.startPoint?.timeLabel,
  )
  const endTime = firstText(
    deviation?.endDateTimeLabel,
    deviation?.endTimeLabel,
    deviation?.endTime,
    deviation?.endPoint?.timeLabel,
  )
  const duration = firstText(deviation?.durationLabel)
  const period =
    startTime && endTime && startTime !== endTime
      ? `${startTime} - ${endTime}`
      : startTime || endTime

  if (period && duration) return `${period} (${duration})`
  if (period) return period

  return formatDateTime(getDeviationTimestamp(deviation))
}

const getDeviationPeriodParts = (deviation) => {
  const startTime = firstText(
    deviation?.startDateTimeLabel,
    deviation?.startTimeLabel,
    deviation?.startTime,
    deviation?.startPoint?.timeLabel,
  )
  const endTime = firstText(
    deviation?.endDateTimeLabel,
    deviation?.endTimeLabel,
    deviation?.endTime,
    deviation?.endPoint?.timeLabel,
  )
  const duration = firstText(deviation?.durationLabel)

  return {
    start: startTime || formatDateTime(getDeviationTimestamp(deviation)),
    end: endTime || "Sin cierre",
    duration: duration || "Sin duración",
  }
}

const getDeviationDistanceParts = (deviation) => {
  const point = getDeviationPoint(deviation)

  const maxDistanceLabel = firstValue(
    deviation?.maxDistanceLabel,
    deviation?.distanceLabel,
    deviation?.deviationLabel,
    point?.maxDistanceLabel,
    point?.distanceLabel,
    point?.deviationLabel,
  )
  const maxDistanceMeters = firstValue(
    deviation?.maxDistanceMeters,
    deviation?.distanceMeters,
    deviation?.deviationMeters,
    deviation?.distanceToRouteMeters,
    deviation?.distance,
    point?.distanceMeters,
    point?.deviationMeters,
    point?.distanceToRouteMeters,
    point?.distance,
  )
  const averageDistanceLabel = firstText(
    deviation?.averageDistanceLabel,
    point?.averageDistanceLabel,
  )
  const averageDistanceMeters = toFiniteNumber(
    firstValue(deviation?.averageDistanceMeters, point?.averageDistanceMeters),
  )

  return {
    max: maxDistanceLabel ? String(maxDistanceLabel) : formatDistance(maxDistanceMeters),
    average:
      averageDistanceLabel ||
      (averageDistanceMeters !== null ? formatDistance(averageDistanceMeters) : "Sin dato"),
  }
}

const getDeviationDistance = (deviation) => {
  const distance = getDeviationDistanceParts(deviation)

  if (distance.max === "Sin dato") return distance.average

  if (distance.average !== "Sin dato" && distance.average !== distance.max) {
    return `Máx. ${distance.max} / Prom. ${distance.average}`
  }

  return distance.max
}

const getDeviationLocation = (deviation) => {
  const point = getDeviationPoint(deviation)

  return (
    firstValue(
      deviation?.address,
      deviation?.addressLabel,
      deviation?.locationLabel,
      deviation?.direccion,
      typeof deviation?.location === "string" ? deviation.location : undefined,
      point?.address,
      point?.addressLabel,
      point?.locationLabel,
      point?.direccion,
      point?.locationName,
      point?.label,
    ) || "Punto máximo del desvío"
  )
}

const getDeviationCoordinates = (deviation) => {
  const point = getDeviationPoint(deviation)

  const coordinates = Array.isArray(point?.coordinates) ? point.coordinates : []

  const latitude = toFiniteNumber(
    firstValue(
      point?.lat,
      point?.latitude,
      deviation?.lat,
      deviation?.latitude,
      deviation?.maxPoint?.lat,
      deviation?.maxPoint?.latitude,
      deviation?.startPoint?.lat,
      deviation?.startPoint?.latitude,
      coordinates[1],
    ),
  )

  const longitude = toFiniteNumber(
    firstValue(
      point?.lng,
      point?.lon,
      point?.longitude,
      deviation?.lng,
      deviation?.lon,
      deviation?.longitude,
      deviation?.maxPoint?.lng,
      deviation?.maxPoint?.lon,
      deviation?.maxPoint?.longitude,
      deviation?.startPoint?.lng,
      deviation?.startPoint?.lon,
      deviation?.startPoint?.longitude,
      coordinates[0],
    ),
  )

  if (latitude === null || longitude === null) {
    return "Sin coordenadas"
  }

  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
}

const normalizeDeviation = (deviation, index) => {
  const period = getDeviationPeriodParts(deviation)
  const distance = getDeviationDistanceParts(deviation)

  return {
    index: index + 1,
    timestamp: getDeviationPeriod(deviation),
    startTime: period.start,
    endTime: period.end,
    duration: period.duration,
    distance: getDeviationDistance(deviation),
    maxDistance: distance.max,
    averageDistance: distance.average,
    location: getDeviationLocation(deviation),
    coordinates: getDeviationCoordinates(deviation),
    points: getDeviationPointsLabel(deviation) || "Sin dato",
  }
}

const buildDeviationRows = (deviations) => {
  if (!deviations.length) {
    return `
      <tr>
        <td colspan="9" class="empty">
          No se detectaron puntos fuera de la tolerancia configurada.
        </td>
      </tr>
    `
  }

  return deviations
    .map((deviation) => {
      return `
        <tr>
          <td class="index">${deviation.index}</td>
          <td class="time-cell">${escapeHtml(deviation.startTime)}</td>
          <td class="time-cell">${escapeHtml(deviation.endTime)}</td>
          <td class="duration-cell">${escapeHtml(deviation.duration)}</td>
          <td class="distance max-distance">${escapeHtml(deviation.maxDistance)}</td>
          <td class="distance average-distance">${escapeHtml(deviation.averageDistance)}</td>
          <td class="points-cell">${escapeHtml(deviation.points)}</td>
          <td class="location-cell">${escapeHtml(deviation.location)}</td>
          <td class="coordinates">${escapeHtml(deviation.coordinates)}</td>
        </tr>
      `
    })
    .join("")
}

const getComplianceLabel = (summary) => {
  if (summary?.complianceLabel) {
    return summary.complianceLabel
  }

  const compliance = toFiniteNumber(summary?.compliance)

  return compliance === null ? "0 %" : `${Math.round(compliance)} %`
}

const formatCountLabel = (value, singular, plural) => {
  const count = toFiniteNumber(value) ?? 0

  return count === 1 ? `1 ${singular}` : `${count} ${plural}`
}

const getDeviationPointsLabel = (deviation) => {
  const pointsCount = toFiniteNumber(deviation?.pointsCount)

  if (pointsCount === null) return ""

  return formatCountLabel(pointsCount, "punto fuera de ruta", "puntos fuera de ruta")
}

const getRouteVerdict = ({ deviationCount, offRoutePointsCount, summary }) => {
  const compliance = toFiniteNumber(summary?.compliance)

  if (deviationCount === 0 && offRoutePointsCount === 0) {
    return {
      label: "Sin desvíos detectados",
      status: "Sin desvíos",
      tone: "success",
    }
  }

  if (compliance !== null && compliance >= 90) {
    return {
      label: "Ruta mayormente cumplida",
      status: "Revisar",
      tone: "warning",
    }
  }

  return {
    label: "Recorrido con desvíos relevantes",
    status: "Con desvíos",
    tone: "danger",
  }
}

const getExecutiveSummary = ({
  deviationCount,
  offRoutePointsCount,
  maxDeviationLabel,
  averageDeviationLabel,
  toleranceLabel,
  complianceLabel,
}) => {
  if (deviationCount === 0 && offRoutePointsCount === 0) {
    return `El recorrido se mantuvo dentro de la tolerancia configurada de ${toleranceLabel}. Cumplimiento registrado: ${complianceLabel}.`
  }

  const deviationText = formatCountLabel(deviationCount, "desvío", "desvíos")
  const deviationSentence =
    deviationCount === 1 ? "Se detectó 1 desvío" : `Se detectaron ${deviationText}`
  const pointSentence =
    offRoutePointsCount === 1
      ? "1 punto quedó fuera"
      : `${formatCountLabel(offRoutePointsCount, "punto", "puntos")} quedaron fuera`

  return `${deviationSentence} durante el rango consultado. ${pointSentence} de la tolerancia de ${toleranceLabel}. El mayor desvío fue ${maxDeviationLabel} y el promedio fue ${averageDeviationLabel}.`
}

export const buildRouteDeviationDocument = (payload = {}) => {
  const asset = payload.asset || {}
  const route = payload.route || {}
  const comparison = payload.comparison || {}
  const summary = comparison.summary || {}
  const comparisonSnapshotSvg = buildRouteComparisonSnapshotSvg(comparison)
  const brandImageDataUrl = firstText(payload.brandImageDataUrl)
  const brandLogoHtml = brandImageDataUrl
    ? `<img class="brand-logo" src="${escapeHtml(brandImageDataUrl)}" alt="Sinergy Group" />`
    : ""

  const deviations = Array.isArray(comparison.deviations)
    ? comparison.deviations.map(normalizeDeviation)
    : []

  const assetName = getAssetName(asset)
  const assetPlate = getAssetPlate(asset)
  const routeName = route.name || "Ruta esperada"
  const corridorLabel = route.corridorLabel || "Corredor operativo"
  const rangeLabel = payload.rangeLabel || "Vista actual"

  const toleranceLabel = formatDistance(payload.toleranceMeters)

  const offRoutePointsCount = toFiniteNumber(summary.offRoutePointsCount) ?? deviations.length

  const maxDeviationLabel = summary.maxDeviationLabel || formatDistance(summary.maxDeviationMeters)

  const averageDeviationLabel =
    summary.averageDeviationLabel || formatDistance(summary.averageDeviationMeters)
  const deviationCount = deviations.length
  const complianceLabel = getComplianceLabel(summary)
  const routeVerdict = getRouteVerdict({
    deviationCount,
    offRoutePointsCount,
    summary,
  })
  const executiveSummary = getExecutiveSummary({
    deviationCount,
    offRoutePointsCount,
    maxDeviationLabel,
    averageDeviationLabel,
    toleranceLabel,
    complianceLabel,
  })

  const generatedAt = new Intl.DateTimeFormat("es-CL", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date())

  const documentTitle = `Informe de desvío - ${assetPlate}`

  return {
    title: documentTitle,

    html: `
      <!doctype html>

      <html lang="es">
        <head>
          <meta charset="UTF-8" />

          <meta
            name="viewport"
            content="width=device-width, initial-scale=1"
          />

          <title>${escapeHtml(documentTitle)}</title>

          <style>
            @page {
              size: A4 portrait;
              margin: 12mm;
            }

            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              background: #eef2f7;
              color: #172033;
              font-family: Arial, Helvetica, sans-serif;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            .document {
              width: 100%;
              max-width: 980px;
              margin: 24px auto;
              overflow: hidden;
              border: 1px solid #d8dee8;
              border-radius: 14px;
              background: #ffffff;
              box-shadow: 0 18px 50px rgba(15, 35, 114, 0.12);
            }

            .header {
              display: flex;
              align-items: flex-start;
              justify-content: space-between;
              gap: 24px;
              padding: 28px 30px;
              background: #102372;
              color: #ffffff;
            }

            .header-main {
              display: flex;
              align-items: flex-start;
              gap: 16px;
              min-width: 0;
            }

            .brand-logo {
              width: 178px;
              max-height: 62px;
              object-fit: contain;
              filter: drop-shadow(0 5px 12px rgba(0, 0, 0, 0.2));
            }

            .header-copy {
              min-width: 0;
            }

            .kicker {
              margin: 0 0 6px;
              color: #ffb580;
              font-size: 11px;
              font-weight: 800;
              letter-spacing: 0.16em;
              text-transform: uppercase;
            }

            h1 {
              margin: 0;
              font-size: 29px;
              line-height: 1.1;
            }

            .subtitle {
              margin: 8px 0 0;
              color: rgba(255, 255, 255, 0.68);
              font-size: 13px;
              font-weight: 600;
            }

            .status {
              min-width: 165px;
              border: 1px solid rgba(255, 255, 255, 0.18);
              border-radius: 11px;
              background: rgba(255, 255, 255, 0.08);
              padding: 14px 16px;
              text-align: right;
            }

            .status-label {
              color: rgba(255, 255, 255, 0.55);
              font-size: 9px;
              font-weight: 800;
              letter-spacing: 0.12em;
              text-transform: uppercase;
            }

            .status-value {
              margin-top: 6px;
              color: ${routeVerdict.tone === "success" ? "#86efac" : "#ffb580"};
              font-size: 20px;
              font-weight: 900;
            }

            .content {
              padding: 28px 30px 34px;
            }

            .details {
              display: grid;
              grid-template-columns: repeat(3, minmax(0, 1fr));
              gap: 16px;
            }

            .detail,
            .metric {
              break-inside: avoid;
              border: 1px solid #dfe5ed;
              border-radius: 10px;
              padding: 16px 17px;
            }

            .detail {
              background: #f8fafc;
            }

            .label {
              color: #7b8798;
              font-size: 9px;
              font-weight: 800;
              letter-spacing: 0.1em;
              text-transform: uppercase;
            }

            .value {
              margin-top: 8px;
              overflow-wrap: anywhere;
              color: #102372;
              font-size: 13px;
              font-weight: 800;
              line-height: 1.45;
            }

            .metrics {
              display: grid;
              grid-template-columns: repeat(4, minmax(0, 1fr));
              gap: 16px;
              margin-top: 20px;
            }

            .summary-panel {
              break-inside: avoid;
              margin-top: 20px;
              border: 1px solid #dfe5ed;
              border-left: 5px solid #102372;
              border-radius: 12px;
              background: #ffffff;
              padding: 18px 20px;
            }

            .summary-panel.success {
              border-left-color: #16a34a;
            }

            .summary-panel.warning {
              border-left-color: #ff6600;
            }

            .summary-panel.danger {
              border-left-color: #dc2626;
            }

            .summary-kicker {
              color: #64748b;
              font-size: 9px;
              font-weight: 900;
              letter-spacing: 0.12em;
              text-transform: uppercase;
            }

            .summary-heading {
              margin: 5px 0 0;
              color: #102372;
              font-size: 19px;
              font-weight: 900;
            }

            .summary-text {
              margin: 9px 0 0;
              color: #475569;
              font-size: 13px;
              font-weight: 700;
              line-height: 1.55;
            }

            .snapshot {
              break-inside: avoid;
              margin-top: 20px;
              overflow: hidden;
              border: 1px solid #dfe5ed;
              border-radius: 12px;
              background: #ffffff;
            }

            .snapshot-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 14px;
              border-bottom: 1px solid #e5eaf1;
              padding: 14px 16px;
            }

            .snapshot-title {
              color: #102372;
              font-size: 12px;
              font-weight: 900;
              letter-spacing: 0.08em;
              text-transform: uppercase;
            }

            .snapshot-legend {
              display: flex;
              flex-wrap: wrap;
              justify-content: flex-end;
              gap: 8px;
              color: #64748b;
              font-size: 9px;
              font-weight: 800;
            }

            .snapshot-legend-item {
              display: inline-flex;
              align-items: center;
              gap: 5px;
              white-space: nowrap;
            }

            .snapshot-legend-color {
              width: 16px;
              height: 4px;
              border-radius: 999px;
            }

            .snapshot-legend-color.planned {
              background: #102372;
            }

            .snapshot-legend-color.actual {
              background: #ff6600;
            }

            .snapshot-legend-color.deviation {
              background: #dc2626;
            }

            .snapshot-body {
              padding: 12px;
              background: #f8fafc;
            }

            .snapshot-map {
              display: block;
              width: 100%;
              height: auto;
            }

            .snapshot-background {
              fill: #dbe3ee;
            }

            .snapshot-tile {
              opacity: 0.96;
            }

            .snapshot-map-soft-overlay {
              fill: rgba(255, 255, 255, 0.1);
            }

            .snapshot-grid-line {
              stroke: rgba(16, 35, 114, 0.08);
              stroke-width: 1;
            }

            .snapshot-route-planned,
            .snapshot-route-actual,
            .snapshot-route-deviation {
              fill: none;
              stroke-linecap: round;
              stroke-linejoin: round;
            }

            .snapshot-route-planned {
              stroke: #102372;
              stroke-width: 8;
              opacity: 0.78;
            }

            .snapshot-route-actual {
              stroke: #ff6600;
              stroke-width: 5;
              opacity: 0.95;
            }

            .snapshot-route-deviation {
              stroke: #dc2626;
              stroke-width: 8;
              opacity: 0.95;
            }

            .snapshot-marker-start,
            .snapshot-marker-end,
            .snapshot-marker-deviation {
              stroke: #ffffff;
              stroke-width: 2;
            }

            .snapshot-marker-start {
              fill: #22c55e;
            }

            .snapshot-marker-end {
              fill: #38bdf8;
            }

            .snapshot-marker-deviation {
              fill: #dc2626;
            }

            .snapshot-marker-label {
              fill: #102372;
              font-size: 12px;
              font-weight: 900;
              paint-order: stroke;
              stroke: #ffffff;
              stroke-width: 3px;
            }

            .snapshot-attribution {
              fill: rgba(15, 23, 42, 0.72);
              font-size: 9px;
              font-weight: 700;
              text-anchor: end;
              paint-order: stroke;
              stroke: rgba(255, 255, 255, 0.85);
              stroke-width: 3px;
            }

            .snapshot-empty {
              fill: #ffffff;
              font-size: 12px;
              font-weight: 800;
              text-anchor: middle;
              dominant-baseline: middle;
            }

            .metric {
              background: #ffffff;
            }

            .metric-value {
              margin-top: 8px;
              color: #102372;
              font-size: 23px;
              font-weight: 900;
            }

            .metric-value.warning {
              color: #ff6600;
            }

            .metric-value.danger {
              color: #dc2626;
            }

            .section-header {
              display: flex;
              align-items: flex-end;
              justify-content: space-between;
              gap: 14px;
              margin: 30px 0 13px;
            }

            .section-title {
              margin: 0;
              color: #102372;
              font-size: 17px;
              font-weight: 900;
            }

            .section-description {
              margin-top: 5px;
              color: #7b8798;
              font-size: 11px;
              font-weight: 700;
            }

            table {
              width: 100%;
              overflow: hidden;
              border: 1px solid #dfe5ed;
              border-collapse: separate;
              border-spacing: 0;
              border-radius: 10px;
              font-size: 10px;
            }

            thead {
              display: table-header-group;
            }

            th {
              padding: 11px 7px;
              background: #102372;
              color: #ffffff;
              text-align: left;
              font-size: 9px;
              font-weight: 900;
              letter-spacing: 0.05em;
              text-transform: uppercase;
            }

            td {
              border-top: 1px solid #e8ecf2;
              padding: 12px 7px;
              vertical-align: top;
              color: #475569;
              font-weight: 600;
              line-height: 1.45;
            }

            tbody tr {
              break-inside: avoid;
            }

            tbody tr:nth-child(even) td {
              background: #f8fafc;
            }

            tbody tr + tr td {
              border-top: 4px solid #eef2f7;
            }

            .index {
              width: 34px;
              color: #102372;
              text-align: center;
              font-weight: 900;
            }

            .time-cell {
              width: 70px;
              color: #334155;
              font-weight: 800;
            }

            .duration-cell {
              width: 68px;
              color: #102372;
              font-weight: 900;
            }

            .distance {
              width: 80px;
              color: #dc2626;
              font-weight: 900;
            }

            .average-distance {
              color: #ff6600;
            }

            .points-cell {
              width: 100px;
              color: #475569;
              font-weight: 800;
            }

            .location-cell {
              min-width: 155px;
              color: #334155;
              font-weight: 800;
              line-height: 1.45;
            }

            .coordinates {
              width: 132px;
              color: #64748b;
              font-family: Consolas, Monaco, monospace;
              font-size: 9px;
            }

            .empty {
              padding: 30px;
              color: #15803d;
              text-align: center;
              font-weight: 800;
            }

            .footer {
              display: flex;
              justify-content: space-between;
              gap: 18px;
              margin-top: 18px;
              border-top: 1px solid #e5eaf1;
              padding-top: 12px;
              color: #8a95a5;
              font-size: 8px;
              font-weight: 600;
            }

            .print-help {
              margin: 0 auto 18px;
              color: #64748b;
              text-align: center;
              font-size: 11px;
              font-weight: 700;
            }

            @media print {
              body {
                background: #ffffff;
              }

              .document {
                max-width: none;
                margin: 0;
                border: 0;
                border-radius: 0;
                box-shadow: none;
              }

              .print-help {
                display: none;
              }
            }
          </style>
        </head>

        <body>
          <article class="document">
            <header class="header">
              <div class="header-main">
                ${brandLogoHtml}

                <div class="header-copy">
                <p class="kicker">Itinerarios</p>

                <h1>Informe de desvío de ruta</h1>

                <p class="subtitle">
                  Comparación entre la ruta esperada y el recorrido real del vehículo.
                </p>
                </div>
              </div>

              <div class="status">
                <div class="status-label">Resultado</div>

                <div class="status-value">
                  ${escapeHtml(routeVerdict.status)}
                </div>
              </div>
            </header>

            <main class="content">
              <section class="details">
                <div class="detail">
                  <div class="label">Vehículo</div>
                  <div class="value">${escapeHtml(assetName)}</div>
                </div>

                <div class="detail">
                  <div class="label">Patente</div>
                  <div class="value">${escapeHtml(assetPlate)}</div>
                </div>

                <div class="detail">
                  <div class="label">Ruta esperada</div>
                  <div class="value">${escapeHtml(routeName)}</div>
                </div>

                <div class="detail">
                  <div class="label">Corredor</div>
                  <div class="value">${escapeHtml(corridorLabel)}</div>
                </div>

                <div class="detail">
                  <div class="label">Rango consultado</div>
                  <div class="value">${escapeHtml(rangeLabel)}</div>
                </div>

                <div class="detail">
                  <div class="label">Tolerancia</div>
                  <div class="value">${escapeHtml(toleranceLabel)}</div>
                </div>
              </section>

              <section class="summary-panel ${routeVerdict.tone}">
                <div class="summary-kicker">Resumen del resultado</div>

                <h2 class="summary-heading">
                  ${escapeHtml(routeVerdict.label)}
                </h2>

                <p class="summary-text">
                  ${escapeHtml(executiveSummary)}
                </p>
              </section>

              <section class="metrics">
                <div class="metric">
                  <div class="label">Cumplimiento</div>

                  <div
                    class="metric-value ${Number(summary.compliance || 0) < 80 ? "warning" : ""}"
                  >
                    ${escapeHtml(complianceLabel)}
                  </div>
                </div>

                <div class="metric">
                  <div class="label">Puntos fuera</div>

                  <div
                    class="metric-value ${offRoutePointsCount > 0 ? "danger" : ""}"
                  >
                    ${escapeHtml(offRoutePointsCount)} pts
                  </div>
                </div>

                <div class="metric">
                  <div class="label">Máximo desvío</div>

                  <div
                    class="metric-value ${
                      Number(summary.maxDeviationMeters || 0) > 0 ? "danger" : ""
                    }"
                  >
                    ${escapeHtml(maxDeviationLabel)}
                  </div>
                </div>

                <div class="metric">
                  <div class="label">Desvío promedio</div>

                  <div
                    class="metric-value ${
                      Number(summary.averageDeviationMeters || 0) > 0 ? "warning" : ""
                    }"
                  >
                    ${escapeHtml(averageDeviationLabel)}
                  </div>
                </div>
              </section>

              <section class="snapshot">
                <div class="snapshot-header">
                  <div class="snapshot-title">Mapa de comparación</div>

                  <div class="snapshot-legend">
                    <span class="snapshot-legend-item">
                      <span class="snapshot-legend-color planned"></span>
                      Ruta esperada
                    </span>

                    <span class="snapshot-legend-item">
                      <span class="snapshot-legend-color actual"></span>
                      Ruta real
                    </span>

                    <span class="snapshot-legend-item">
                      <span class="snapshot-legend-color deviation"></span>
                      Fuera de tolerancia
                    </span>
                  </div>
                </div>

                <div class="snapshot-body">
                  ${comparisonSnapshotSvg}
                </div>
              </section>

              <section>
                <div class="section-header">
                  <div>
                    <h2 class="section-title">
                      Desvíos detectados
                    </h2>

                    <div class="section-description">
                      Periodos y puntos principales que superaron la tolerancia.
                    </div>
                  </div>
                </div>

                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Inicio</th>
                      <th>Fin</th>
                      <th>Duración</th>
                      <th>Desvío máx.</th>
                      <th>Promedio</th>
                      <th>Puntos</th>
                      <th>Referencia</th>
                      <th>Coordenadas</th>
                    </tr>
                  </thead>

                  <tbody>
                    ${buildDeviationRows(deviations)}
                  </tbody>
                </table>
              </section>

              <footer class="footer">
                <span>
                  Generado el ${escapeHtml(generatedAt)}.
                </span>

                <span>
                  Documento generado desde el comparador de rutas.
                </span>
              </footer>
            </main>
          </article>

          <p class="print-help">
            El PDF se descarga automáticamente desde el comparador.
          </p>
        </body>
      </html>
    `,
  }
}
