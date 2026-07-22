const CHART_RELATIONSHIP_TYPE =
  "http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart"
const DRAWING_RELATIONSHIP_TYPE =
  "http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing"
const IMAGE_RELATIONSHIP_TYPE =
  "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image"

const BRAND_IMAGE_FILENAME = "sinergy-report-logo.png"
const BRAND_IMAGE_NAME = "Logo Sinergy Group"
const BRAND_IMAGE_LAYOUT = {
  column: 1,
  columnOffset: 95250,
  row: 0,
  rowOffset: 80010,
  width: 118,
  height: 42,
}

const CHART_LAYOUT = {
  fullWidth: 1680,
  splitWidth: 830,
  tallHeight: 360,
  compactHeight: 240,
}

const BAR_COLORS = [
  "4F46E5",
  "D97706",
  "7C3AED",
  "0F766E",
  "DC2626",
  "0891B2",
  "DB2777",
  "65A30D",
  "EA580C",
  "059669",
]

const escapeXml = (value) => {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
}

const normalizeHexColor = (value, fallback) => {
  const color = String(value || "")
    .replace("#", "")
    .trim()
    .toUpperCase()

  return /^[0-9A-F]{6}$/.test(color) ? color : fallback
}

const buildSheetReference = (sheetName, range) => {
  const escapedSheetName = String(sheetName).replaceAll("'", "''")

  return `'${escapedSheetName}'!${range}`
}

const buildStringCache = (values) => {
  return `<c:strCache><c:ptCount val="${values.length}"/>${values
    .map((value, index) => {
      return `<c:pt idx="${index}"><c:v>${escapeXml(value)}</c:v></c:pt>`
    })
    .join("")}</c:strCache>`
}

const buildNumberCache = (values, formatCode = "0.0") => {
  return `<c:numCache><c:formatCode>${escapeXml(formatCode)}</c:formatCode><c:ptCount val="${values.length}"/>${values
    .map((value, index) => {
      return `<c:pt idx="${index}"><c:v>${Number(value) || 0}</c:v></c:pt>`
    })
    .join("")}</c:numCache>`
}

const buildStringReference = ({ sheetName, range, values }) => {
  return `<c:strRef><c:f>${escapeXml(
    buildSheetReference(sheetName, range),
  )}</c:f>${buildStringCache(values)}</c:strRef>`
}

const buildNumberReference = ({ sheetName, range, values, formatCode }) => {
  return `<c:numRef><c:f>${escapeXml(
    buildSheetReference(sheetName, range),
  )}</c:f>${buildNumberCache(values, formatCode)}</c:numRef>`
}

const buildChartTitle = (title) => {
  return `<c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="es-CL" sz="1200" b="1"><a:solidFill><a:srgbClr val="102372"/></a:solidFill></a:rPr><a:t>${escapeXml(
    title,
  )}</a:t></a:r><a:endParaRPr lang="es-CL"/></a:p></c:rich></c:tx><c:layout/><c:overlay val="0"/></c:title>`
}

const buildChartBorder = () => {
  return `<c:spPr><a:solidFill><a:srgbClr val="FBFDFF"/></a:solidFill><a:ln w="9525"><a:solidFill><a:srgbClr val="D8DEE8"/></a:solidFill></a:ln></c:spPr>`
}

const buildCategoryAxis = ({ axisId, crossingAxisId, labelCount, rotation = 0 }) => {
  const labelSkip = Math.max(1, Math.ceil(labelCount / 10))
  const rotationValue = Math.round(rotation * -60000)
  const textProperties = `<c:txPr><a:bodyPr rot="${rotationValue}" vert="horz"/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="900"><a:solidFill><a:srgbClr val="64748B"/></a:solidFill></a:defRPr></a:pPr><a:endParaRPr lang="es-CL" sz="900"/></a:p></c:txPr>`

  return `<c:catAx><c:axId val="${axisId}"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="b"/><c:numFmt formatCode="General" sourceLinked="1"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:spPr><a:ln><a:solidFill><a:srgbClr val="CBD5E1"/></a:solidFill></a:ln></c:spPr>${textProperties}<c:crossAx val="${crossingAxisId}"/><c:crosses val="autoZero"/><c:auto val="1"/><c:lblAlgn val="ctr"/><c:lblOffset val="100"/><c:tickLblSkip val="${labelSkip}"/><c:tickMarkSkip val="${labelSkip}"/></c:catAx>`
}

const buildValueAxis = ({ axisId, crossingAxisId, formatCode, minimum, maximum }) => {
  const minimumXml = Number.isFinite(minimum) ? `<c:min val="${minimum}"/>` : ""
  const maximumXml = Number.isFinite(maximum) ? `<c:max val="${maximum}"/>` : ""

  return `<c:valAx><c:axId val="${axisId}"/><c:scaling><c:orientation val="minMax"/>${maximumXml}${minimumXml}</c:scaling><c:delete val="0"/><c:axPos val="l"/><c:majorGridlines><c:spPr><a:ln><a:solidFill><a:srgbClr val="E2E8F0"/></a:solidFill></a:ln></c:spPr></c:majorGridlines><c:numFmt formatCode="${escapeXml(
    formatCode,
  )}" sourceLinked="0"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:spPr><a:ln><a:solidFill><a:srgbClr val="CBD5E1"/></a:solidFill></a:ln></c:spPr><c:crossAx val="${crossingAxisId}"/><c:crosses val="autoZero"/><c:crossBetween val="between"/></c:valAx>`
}

const wrapChartXml = ({ title, plotArea, legendPosition = "t", showLegend = true }) => {
  const legend = showLegend
    ? `<c:legend><c:legendPos val="${legendPosition}"/><c:layout/><c:overlay val="0"/></c:legend>`
    : ""

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><c:date1904 val="0"/><c:lang val="es-CL"/><c:roundedCorners val="0"/><c:style val="10"/><c:chart>${buildChartTitle(
    title,
  )}<c:plotArea><c:layout/>${plotArea}</c:plotArea>${legend}<c:plotVisOnly val="1"/><c:dispBlanksAs val="gap"/><c:showDLblsOverMax val="0"/></c:chart>${buildChartBorder()}<c:printSettings><c:headerFooter/><c:pageMargins b="0.75" l="0.7" r="0.7" t="0.75" header="0.3" footer="0.3"/><c:pageSetup/></c:printSettings></c:chartSpace>`
}

const buildSeriesTitle = ({ sheetName, cell, label }) => {
  return `<c:tx>${buildStringReference({
    sheetName,
    range: cell,
    values: [label],
  })}</c:tx>`
}

const getPrimaryColor = ({ key, value, color }) => {
  if (key !== "gpsSatellites") {
    return normalizeHexColor(color, "2563EB")
  }

  if (value >= 8) return "059669"
  if (value >= 4) return "D97706"

  return "DC2626"
}

const buildPrimaryNumberFormat = ({ decimals = 1, unit = "" }) => {
  const decimalPlaces = Math.max(0, Number(decimals) || 0)
  const numberFormat = decimalPlaces ? `0.${"0".repeat(decimalPlaces)}` : "0"

  return unit ? `${numberFormat}"${unit}"` : numberFormat
}

const getExcelColumnName = (columnNumber) => {
  let currentNumber = columnNumber
  let columnName = ""

  while (currentNumber > 0) {
    const remainder = (currentNumber - 1) % 26
    columnName = String.fromCharCode(65 + remainder) + columnName
    currentNumber = Math.floor((currentNumber - 1) / 26)
  }

  return columnName
}

const buildChartRanges = (index, valueCount) => {
  const categoryColumn = getExcelColumnName(index * 2 + 1)
  const valueColumn = getExcelColumnName(index * 2 + 2)
  const endRow = valueCount + 1

  return {
    titleCell: `$${valueColumn}$1`,
    categoryRange: `$${categoryColumn}$2:$${categoryColumn}$${endRow}`,
    valueRange: `$${valueColumn}$2:$${valueColumn}$${endRow}`,
  }
}

const buildBarChartXml = ({ sheetName, item, index }) => {
  const { labels, values } = item
  const categoryAxisId = 48650112
  const valueAxisId = 48672768
  const numberFormat = buildPrimaryNumberFormat(item)
  const ranges = buildChartRanges(index, values.length)
  const dataPointColors = values
    .map((value, valueIndex) => {
      const color = getPrimaryColor({
        key: item.key,
        value,
        color: item.color,
      })

      return `<c:dPt><c:idx val="${valueIndex}"/><c:spPr><a:solidFill><a:srgbClr val="${color}"><a:alpha val="13000"/></a:srgbClr></a:solidFill><a:ln w="19050"><a:solidFill><a:srgbClr val="${color}"/></a:solidFill></a:ln></c:spPr></c:dPt>`
    })
    .join("")

  const plotArea = `<c:barChart><c:barDir val="col"/><c:grouping val="clustered"/><c:varyColors val="0"/><c:ser><c:idx val="0"/><c:order val="0"/>${buildSeriesTitle(
    {
      sheetName,
      cell: ranges.titleCell,
      label: item.label,
    },
  )}${dataPointColors}<c:cat>${buildStringReference({
    sheetName,
    range: ranges.categoryRange,
    values: labels,
  })}</c:cat><c:val>${buildNumberReference({
    sheetName,
    range: ranges.valueRange,
    values,
    formatCode: numberFormat,
  })}</c:val></c:ser><c:dLbls><c:showLegendKey val="0"/><c:showVal val="0"/><c:showCatName val="0"/><c:showSerName val="0"/><c:showPercent val="0"/></c:dLbls><c:gapWidth val="55"/><c:axId val="${categoryAxisId}"/><c:axId val="${valueAxisId}"/></c:barChart>${buildCategoryAxis(
    {
      axisId: categoryAxisId,
      crossingAxisId: valueAxisId,
      labelCount: labels.length,
      rotation: 38,
    },
  )}${buildValueAxis({
    axisId: valueAxisId,
    crossingAxisId: categoryAxisId,
    formatCode: numberFormat,
    minimum: 0,
    maximum: item.maximum,
  })}`

  return wrapChartXml({
    title: item.label,
    plotArea,
    showLegend: false,
  })
}

const buildLineChartXml = ({ sheetName, item, index }) => {
  const { labels, values } = item
  const categoryAxisId = 58650112
  const valueAxisId = 58672768
  const color = normalizeHexColor(item.color, "2563EB")
  const numberFormat = buildPrimaryNumberFormat(item)
  const ranges = buildChartRanges(index, values.length)
  const categories = buildStringReference({
    sheetName,
    range: ranges.categoryRange,
    values: labels,
  })
  const chartValues = buildNumberReference({
    sheetName,
    range: ranges.valueRange,
    values,
    formatCode: numberFormat,
  })

  const areaSeries = `<c:areaChart><c:grouping val="standard"/><c:varyColors val="0"/><c:ser><c:idx val="0"/><c:order val="0"/>${buildSeriesTitle(
    {
      sheetName,
      cell: ranges.titleCell,
      label: item.label,
    },
  )}<c:spPr><a:solidFill><a:srgbClr val="${color}"><a:alpha val="12000"/></a:srgbClr></a:solidFill><a:ln><a:noFill/></a:ln></c:spPr><c:cat>${categories}</c:cat><c:val>${chartValues}</c:val></c:ser><c:dLbls><c:showLegendKey val="0"/><c:showVal val="0"/><c:showCatName val="0"/><c:showSerName val="0"/></c:dLbls><c:axId val="${categoryAxisId}"/><c:axId val="${valueAxisId}"/></c:areaChart>`

  const lineSeries = `<c:lineChart><c:grouping val="standard"/><c:varyColors val="0"/><c:ser><c:idx val="1"/><c:order val="1"/>${buildSeriesTitle(
    {
      sheetName,
      cell: ranges.titleCell,
      label: item.label,
    },
  )}<c:spPr><a:ln w="19050"><a:solidFill><a:srgbClr val="${color}"/></a:solidFill><a:round/></a:ln></c:spPr><c:marker><c:symbol val="none"/></c:marker><c:cat>${categories}</c:cat><c:val>${chartValues}</c:val><c:smooth val="1"/></c:ser><c:dLbls><c:showLegendKey val="0"/><c:showVal val="0"/><c:showCatName val="0"/><c:showSerName val="0"/></c:dLbls><c:marker val="0"/><c:axId val="${categoryAxisId}"/><c:axId val="${valueAxisId}"/></c:lineChart>`

  const plotArea = `${areaSeries}${lineSeries}${buildCategoryAxis({
    axisId: categoryAxisId,
    crossingAxisId: valueAxisId,
    labelCount: labels.length,
  })}${buildValueAxis({
    axisId: valueAxisId,
    crossingAxisId: categoryAxisId,
    formatCode: numberFormat,
    minimum: 0,
    maximum: item.maximum,
  })}`

  return wrapChartXml({
    title: item.label,
    plotArea,
    showLegend: false,
  })
}

const buildDoughnutChartXml = ({ sheetName, item, index }) => {
  const { labels, values } = item
  const ranges = buildChartRanges(index, values.length)
  const dataPointColors = values
    .map((_, colorIndex) => {
      const color = normalizeHexColor(
        item.colors[colorIndex],
        BAR_COLORS[colorIndex % BAR_COLORS.length],
      )

      return `<c:dPt><c:idx val="${colorIndex}"/><c:spPr><a:solidFill><a:srgbClr val="${color}"><a:alpha val="88000"/></a:srgbClr></a:solidFill><a:ln w="28575"><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></a:ln></c:spPr></c:dPt>`
    })
    .join("")

  const plotArea = `<c:doughnutChart><c:varyColors val="1"/><c:ser><c:idx val="0"/><c:order val="0"/>${buildSeriesTitle(
    {
      sheetName,
      cell: ranges.titleCell,
      label: item.label,
    },
  )}${dataPointColors}<c:cat>${buildStringReference({
    sheetName,
    range: ranges.categoryRange,
    values: labels,
  })}</c:cat><c:val>${buildNumberReference({
    sheetName,
    range: ranges.valueRange,
    values,
    formatCode: "0",
  })}</c:val></c:ser><c:dLbls><c:showLegendKey val="0"/><c:showVal val="0"/><c:showCatName val="0"/><c:showSerName val="0"/><c:showPercent val="1"/><c:showLeaderLines val="1"/></c:dLbls><c:firstSliceAng val="270"/><c:holeSize val="68"/></c:doughnutChart>`

  return wrapChartXml({
    title: item.label,
    plotArea,
    legendPosition: "b",
  })
}

const buildChartFrame = ({ id, name, relationshipId, from, width, height }) => {
  const emusPerPixel = 9525

  return `<xdr:oneCellAnchor><xdr:from><xdr:col>${from.col}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${from.row}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from><xdr:ext cx="${width * emusPerPixel}" cy="${height * emusPerPixel}"/><xdr:graphicFrame macro=""><xdr:nvGraphicFramePr><xdr:cNvPr id="${id}" name="${escapeXml(
    name,
  )}"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr><xdr:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></xdr:xfrm><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart"><c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:id="${relationshipId}"/></a:graphicData></a:graphic></xdr:graphicFrame><xdr:clientData/></xdr:oneCellAnchor>`
}

const buildBrandImageFrame = ({ id, relationshipId }) => {
  const emusPerPixel = 9525

  return `<xdr:oneCellAnchor><xdr:from><xdr:col>${BRAND_IMAGE_LAYOUT.column}</xdr:col><xdr:colOff>${BRAND_IMAGE_LAYOUT.columnOffset}</xdr:colOff><xdr:row>${BRAND_IMAGE_LAYOUT.row}</xdr:row><xdr:rowOff>${BRAND_IMAGE_LAYOUT.rowOffset}</xdr:rowOff></xdr:from><xdr:ext cx="${BRAND_IMAGE_LAYOUT.width * emusPerPixel}" cy="${BRAND_IMAGE_LAYOUT.height * emusPerPixel}"/><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="${id}" name="${BRAND_IMAGE_NAME}"/><xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr></xdr:nvPicPr><xdr:blipFill><a:blip r:embed="${relationshipId}"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:oneCellAnchor>`
}

const buildDrawingXml = (items, { brandImageRelationshipId = "" } = {}) => {
  const singleChart = items.length === 1
  const chartHeight = items.length > 2 ? CHART_LAYOUT.compactHeight : CHART_LAYOUT.tallHeight
  const chartWidth = singleChart ? CHART_LAYOUT.fullWidth : CHART_LAYOUT.splitWidth
  const brandFrame = brandImageRelationshipId
    ? buildBrandImageFrame({
        id: 2,
        relationshipId: brandImageRelationshipId,
      })
    : ""

  const frames = items.map((item, index) => {
    const column = singleChart ? 0 : (index % 2) * 7
    const row = items.length > 2 && index >= 2 ? 27 : 7

    return buildChartFrame({
      id: index + (brandImageRelationshipId ? 3 : 2),
      name: `Grafico de ${item.label}`,
      relationshipId: `rId${index + 1}`,
      from: {
        col: column,
        row,
      },
      width: chartWidth,
      height: chartHeight,
    })
  })

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">${brandFrame}${frames.join(
    "",
  )}</xdr:wsDr>`
}

const buildDrawingRelationshipsXml = (chartCount, { brandImageFilename = "" } = {}) => {
  const relationships = Array.from(
    {
      length: chartCount,
    },
    (_, index) => {
      const chartNumber = index + 1

      return `<Relationship Id="rId${chartNumber}" Type="${CHART_RELATIONSHIP_TYPE}" Target="../charts/chart${chartNumber}.xml"/>`
    },
  )

  if (brandImageFilename) {
    relationships.push(
      `<Relationship Id="rId${chartCount + 1}" Type="${IMAGE_RELATIONSHIP_TYPE}" Target="../media/${escapeXml(
        brandImageFilename,
      )}"/>`,
    )
  }

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relationships.join(
    "",
  )}</Relationships>`
}

const addDrawingRelationship = async (zip, worksheetPath) => {
  const worksheetFileName = worksheetPath.split("/").pop()
  const relationshipsPath = `xl/worksheets/_rels/${worksheetFileName}.rels`
  const existingRelationships = zip.file(relationshipsPath)

  if (!existingRelationships) {
    zip.file(
      relationshipsPath,
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${DRAWING_RELATIONSHIP_TYPE}" Target="../drawings/drawing1.xml"/></Relationships>`,
    )

    return "rId1"
  }

  const relationshipsXml = await existingRelationships.async("string")
  const relationshipIds = [...relationshipsXml.matchAll(/Id="rId(\d+)"/g)].map((match) => {
    return Number(match[1])
  })
  const relationshipId = `rId${Math.max(0, ...relationshipIds) + 1}`
  const drawingRelationship = `<Relationship Id="${relationshipId}" Type="${DRAWING_RELATIONSHIP_TYPE}" Target="../drawings/drawing1.xml"/>`

  zip.file(
    relationshipsPath,
    relationshipsXml.replace("</Relationships>", `${drawingRelationship}</Relationships>`),
  )

  return relationshipId
}

const addContentTypeOverride = (contentTypesXml, partName, contentType) => {
  if (contentTypesXml.includes(`PartName="${partName}"`)) {
    return contentTypesXml
  }

  const override = `<Override PartName="${partName}" ContentType="${contentType}"/>`

  return contentTypesXml.replace("</Types>", `${override}</Types>`)
}

const addContentTypeDefault = (contentTypesXml, extension, contentType) => {
  const extensionPattern = new RegExp(`Extension=["']${extension}["']`, "i")

  if (extensionPattern.test(contentTypesXml)) {
    return contentTypesXml
  }

  const defaultType = `<Default Extension="${extension}" ContentType="${contentType}"/>`

  return contentTypesXml.replace("</Types>", `${defaultType}</Types>`)
}

const getDataUrlBase64 = (dataUrl) => {
  const match = String(dataUrl || "").match(
    /^data:image\/png(?:;charset=[^;,]+)?;base64,([\s\S]+)$/i,
  )

  return match?.[1]?.replace(/\s/g, "") || ""
}

const buildChartXml = ({ sheetName, item, index }) => {
  if (item.type === "line") {
    return buildLineChartXml({
      sheetName,
      item,
      index,
    })
  }

  if (item.type === "doughnut") {
    return buildDoughnutChartXml({
      sheetName,
      item,
      index,
    })
  }

  return buildBarChartXml({
    sheetName,
    item,
    index,
  })
}

export const injectNativeItineraryCharts = async ({
  workbookBuffer,
  chartData,
  worksheetPath = "xl/worksheets/sheet1.xml",
  dataSheetName = "DatosGraficos",
  brandImageDataUrl = "",
}) => {
  const zipModule = await import("jszip")
  const JSZip = zipModule.default || zipModule
  const zip = await JSZip.loadAsync(workbookBuffer)
  const worksheetFile = zip.file(worksheetPath)
  const chartItems = Array.isArray(chartData?.items) ? chartData.items : []
  const brandImageBase64 = getDataUrlBase64(brandImageDataUrl)
  const brandImageFilename = brandImageBase64 ? BRAND_IMAGE_FILENAME : ""

  if (!worksheetFile) {
    throw new Error(`No se encontro la hoja para los graficos: ${worksheetPath}`)
  }

  if (!chartItems.length) {
    throw new Error("No se recibieron graficos nativos para insertar en el Excel")
  }

  const drawingRelationshipId = await addDrawingRelationship(zip, worksheetPath)
  const worksheetXml = await worksheetFile.async("string")

  if (worksheetXml.includes("<drawing ")) {
    throw new Error("La hoja de reporte ya contiene un dibujo OOXML")
  }

  zip.file(
    worksheetPath,
    worksheetXml.replace("</worksheet>", `<drawing r:id="${drawingRelationshipId}"/></worksheet>`),
  )

  if (brandImageBase64) {
    zip.file(`xl/media/${brandImageFilename}`, brandImageBase64, {
      base64: true,
    })
  }

  zip.file(
    "xl/drawings/drawing1.xml",
    buildDrawingXml(chartItems, {
      brandImageRelationshipId: brandImageFilename ? `rId${chartItems.length + 1}` : "",
    }),
  )

  zip.file(
    "xl/drawings/_rels/drawing1.xml.rels",
    buildDrawingRelationshipsXml(chartItems.length, {
      brandImageFilename,
    }),
  )

  chartItems.forEach((item, index) => {
    zip.file(
      `xl/charts/chart${index + 1}.xml`,
      buildChartXml({
        sheetName: dataSheetName,
        item,
        index,
      }),
    )
  })

  const contentTypesFile = zip.file("[Content_Types].xml")

  if (!contentTypesFile) {
    throw new Error("El XLSX no contiene [Content_Types].xml")
  }

  let contentTypesXml = await contentTypesFile.async("string")

  if (brandImageFilename) {
    contentTypesXml = addContentTypeDefault(contentTypesXml, "png", "image/png")
  }

  contentTypesXml = addContentTypeOverride(
    contentTypesXml,
    "/xl/drawings/drawing1.xml",
    "application/vnd.openxmlformats-officedocument.drawing+xml",
  )

  for (let chartNumber = 1; chartNumber <= chartItems.length; chartNumber += 1) {
    contentTypesXml = addContentTypeOverride(
      contentTypesXml,
      `/xl/charts/chart${chartNumber}.xml`,
      "application/vnd.openxmlformats-officedocument.drawingml.chart+xml",
    )
  }

  zip.file("[Content_Types].xml", contentTypesXml)

  return zip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: {
      level: 6,
    },
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
}
