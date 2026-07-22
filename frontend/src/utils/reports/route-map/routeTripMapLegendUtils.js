import { ROUTE_COLORS } from "./routeTripMapRouteUtils.js"

const drawRoundedRect = (context, x, y, width, height, radius) => {
  context.beginPath()
  context.moveTo(x + radius, y)
  context.lineTo(x + width - radius, y)
  context.quadraticCurveTo(x + width, y, x + width, y + radius)
  context.lineTo(x + width, y + height - radius)
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  context.lineTo(x + radius, y + height)
  context.quadraticCurveTo(x, y + height, x, y + height - radius)
  context.lineTo(x, y + radius)
  context.quadraticCurveTo(x, y, x + radius, y)
  context.closePath()
}

const trimCanvasText = ({ context, text, maxWidth }) => {
  const safeText = String(text || "").trim()

  if (!safeText || context.measureText(safeText).width <= maxWidth) return safeText

  let trimmedText = safeText

  while (trimmedText.length > 1 && context.measureText(`${trimmedText}...`).width > maxWidth) {
    trimmedText = trimmedText.slice(0, -1).trim()
  }

  return `${trimmedText}...`
}

const getRouteLegendItems = (routes = []) => {
  const items = []
  const seenDeviceKeys = new Set()

  routes.forEach((route) => {
    if (seenDeviceKeys.has(route.deviceKey)) return

    seenDeviceKeys.add(route.deviceKey)
    items.push({
      color: route.color || ROUTE_COLORS[0],
      label: route.deviceLabel || "Recorrido",
    })
  })

  return items
}

const getLegendRows = ({ context, entries, maxWidth }) => {
  const rows = []
  let currentRow = []
  let currentWidth = 0
  const gap = 18

  entries.forEach((entry) => {
    const labelMaxWidth = entry.type === "route" ? 128 : 82
    const displayLabel = trimCanvasText({
      context,
      text: entry.label,
      maxWidth: labelMaxWidth,
    })
    const swatchWidth = entry.type === "route" ? 36 : 12
    const entryWidth = swatchWidth + 8 + context.measureText(displayLabel).width
    const nextWidth = currentWidth + (currentRow.length ? gap : 0) + entryWidth

    if (currentRow.length && nextWidth > maxWidth) {
      rows.push(currentRow)
      currentRow = []
      currentWidth = 0
    }

    currentRow.push({
      ...entry,
      displayLabel,
      width: entryWidth,
    })
    currentWidth += (currentRow.length > 1 ? gap : 0) + entryWidth
  })

  if (currentRow.length) rows.push(currentRow)

  return rows
}

const drawLegendEntry = ({ context, entry, x, y }) => {
  if (entry.type === "route") {
    context.strokeStyle = entry.color
    context.lineWidth = 5
    context.lineCap = "round"
    context.beginPath()
    context.moveTo(x, y)
    context.lineTo(x + 30, y)
    context.stroke()
    context.fillStyle = "#102372"
    context.fillText(entry.displayLabel, x + 38, y)
    return
  }

  context.beginPath()
  context.arc(x + 6, y, 6, 0, Math.PI * 2)
  context.fillStyle = entry.color
  context.fill()
  context.fillStyle = "#102372"
  context.fillText(entry.displayLabel, x + 20, y)
}

const drawMapLegend = ({ context, routes, width, height }) => {
  const routeLegendItems = getRouteLegendItems(routes)
  const visibleRouteItems = routeLegendItems.slice(0, 4)
  const overflowCount = routeLegendItems.length - visibleRouteItems.length
  const maxLegendWidth = Math.min(width - 170, 760)
  const entries = [
    {
      type: "dot",
      color: "#22c55e",
      label: "Inicio",
    },
    {
      type: "dot",
      color: "#38bdf8",
      label: "Fin",
    },
    ...visibleRouteItems.map((item) => ({
      type: "route",
      color: item.color,
      label: routeLegendItems.length === 1 ? "Recorrido" : item.label,
    })),
  ]

  if (overflowCount > 0) {
    entries.push({
      type: "text",
      color: "#64748b",
      label: `+${overflowCount} dispositivos`,
    })
  }

  context.save()
  context.font = "700 15px Arial, Helvetica, sans-serif"
  context.textBaseline = "middle"
  context.textAlign = "left"

  const rows = getLegendRows({
    context,
    entries,
    maxWidth: maxLegendWidth - 32,
  })
  const rowHeight = 23
  const boxWidth = Math.min(
    maxLegendWidth,
    Math.max(
      ...rows.map((row) => {
        return row.reduce((total, entry, index) => total + entry.width + (index ? 18 : 0), 0) + 32
      }),
      220,
    ),
  )
  const boxHeight = rows.length * rowHeight + 20
  const boxX = 20
  const boxY = height - boxHeight - 20

  context.shadowColor = "rgba(15, 23, 42, 0.22)"
  context.shadowBlur = 16
  context.shadowOffsetY = 4
  drawRoundedRect(context, boxX, boxY, boxWidth, boxHeight, 12)
  context.fillStyle = "rgba(255, 255, 255, 0.9)"
  context.fill()
  context.shadowColor = "transparent"

  rows.forEach((row, rowIndex) => {
    let entryX = boxX + 16
    const entryY = boxY + 11 + rowIndex * rowHeight + rowHeight / 2

    row.forEach((entry) => {
      if (entry.type === "text") {
        context.fillStyle = "#64748b"
        context.fillText(entry.displayLabel, entryX, entryY)
      } else {
        drawLegendEntry({
          context,
          entry,
          x: entryX,
          y: entryY,
        })
      }

      entryX += entry.width + 18
    })
  })

  context.restore()
}

export const drawRouteTripMapChrome = ({ context, routes, width, height, usedTiles }) => {
  drawMapLegend({ context, routes, width, height })

  context.font = "700 11px Arial, Helvetica, sans-serif"
  context.fillStyle = "rgba(15, 23, 42, 0.72)"
  context.textAlign = "right"
  context.fillText(
    usedTiles ? "OpenStreetMap / CARTO" : "Mapa referencial",
    width - 16,
    height - 14,
  )
  context.textAlign = "left"
}
