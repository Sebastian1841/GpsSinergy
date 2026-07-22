import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

import { jsPDF } from "jspdf"

import { getReportBrandImageDataUrl } from "../../utils/reports/export/reportBranding.js"
import {
  createItineraryExcelBuffer,
  createItineraryExcelWorkbook,
  exportItineraryPdfReport,
} from "./itineraryExportService.js"
import { injectNativeItineraryCharts } from "./nativeExcelCharts.js"

const BRAND_IMAGE_URL = new URL("../../assets/branding/sinergy-group.png", import.meta.url)

const getOriginalBrandImageBuffer = () => {
  return readFile(BRAND_IMAGE_URL)
}

const getOriginalBrandImageDataUrl = async () => {
  const imageBuffer = await getOriginalBrandImageBuffer()

  return `data:image/png;base64,${imageBuffer.toString("base64")}`
}

const assertZipUsesOriginalBrandImage = async (zip) => {
  const imageFiles = zip.file(/^xl\/media\/.*\.png$/)

  assert.equal(imageFiles.length, 1)

  const [embeddedImage, originalImage] = await Promise.all([
    imageFiles[0].async("uint8array"),
    getOriginalBrandImageBuffer(),
  ])

  assert.deepEqual(Buffer.from(embeddedImage), Buffer.from(originalImage))
}

const loadExcelZip = async (buffer) => {
  const zipModule = await import("jszip")
  const JSZip = zipModule.default || zipModule

  return JSZip.loadAsync(buffer)
}

test("report branding loads the exact original PNG", async () => {
  const [brandImageDataUrl, originalImageDataUrl] = await Promise.all([
    getReportBrandImageDataUrl(),
    getOriginalBrandImageDataUrl(),
  ])

  assert.equal(brandImageDataUrl, originalImageDataUrl)
})

test("Excel export includes editable native charts, logo, and complete report data", async () => {
  const report = {
    filename: "itinerario-prueba",
    headerTitle: "Reporte de itinerario",
    selectedAssetsSummary: "Activo de prueba",
    fromDate: "2026-06-22",
    toDate: "2026-06-22",
    generatedAt: "22-06-2026 17:00",
    summary: {
      distanceLabel: "12.4 km",
      movingLabel: "42 min",
      stoppedLabel: "8 min",
      averageSpeedLabel: "31 km/h",
    },
    charts: {
      enabled: true,
      items: [
        {
          id: "chart-1",
          type: "bar",
          key: "canBatteryVoltage",
          label: "Voltaje de bateria",
          unit: "V",
          decimals: 1,
          color: "#0f766e",
          labels: ["22-06-2026 17:00"],
          values: [12.7],
        },
        {
          id: "chart-2",
          type: "line",
          key: "speed",
          label: "Velocidad",
          unit: "km/h",
          decimals: 1,
          color: "#2563eb",
          labels: ["17:00 TEST-01"],
          values: [31],
        },
        {
          id: "chart-3",
          type: "doughnut",
          key: "status",
          label: "Estado operativo",
          unit: "",
          decimals: 0,
          color: "#14b8a6",
          labels: ["Ruta normal"],
          values: [1],
          colors: ["#14b8a6"],
        },
      ],
    },
    assets: [
      {
        name: "Camion 01",
        patent: "TEST-01",
        deviceId: "123456",
        driver: "Conductor",
        points: 1,
        movingPoints: 1,
        distanceLabel: "12.4 km",
      },
    ],
    rows: [
      {
        index: 1,
        asset: "Camion 01",
        patent: "TEST-01",
        deviceId: "123456",
        date: "22-06-2026",
        time: "17:00",
        status: "Movimiento",
        speed: "31 km/h",
        event: "Reporte GPS",
        distance: "12.4 km",
        address: "Santiago",
        lat: -33.44,
        lng: -70.66,
      },
    ],
  }

  const workbook = await createItineraryExcelWorkbook(report)

  assert.deepEqual(
    workbook.worksheets.map((worksheet) => worksheet.name),
    ["Reporte", "Detalle GPS", "Activos", "DatosGraficos"],
  )
  assert.equal(workbook.views[0].activeTab, 0)

  // Con gráficos, la imagen se agrega después mediante OOXML.
  assert.equal(workbook.getWorksheet("Reporte").getImages().length, 0)
  assert.equal(workbook.media.length, 0)

  assert.equal(workbook.getWorksheet("DatosGraficos").state, "veryHidden")
  assert.equal(workbook.getWorksheet("DatosGraficos").getCell("B2").value, 12.7)
  assert.equal(workbook.getWorksheet("DatosGraficos").getCell("D2").value, 31)
  assert.equal(workbook.getWorksheet("DatosGraficos").getCell("E2").value, "Ruta normal")

  assert.equal(workbook.getWorksheet("Reporte").getCell("A46").value, "Activos incluidos")
  assert.equal(workbook.getWorksheet("Reporte").getCell("A47").value, "Activo")
  assert.equal(workbook.getWorksheet("Reporte").getCell("A48").value, "Camion 01")
  assert.equal(workbook.getWorksheet("Reporte").getCell("A50").value, "Detalle GPS")
  assert.equal(workbook.getWorksheet("Reporte").getCell("A51").value, "#")
  assert.equal(workbook.getWorksheet("Reporte").getCell("A52").value, 1)
  assert.equal(workbook.getWorksheet("Detalle GPS").getRow(5).getCell(1).value, "#")

  const buffer = await createItineraryExcelBuffer(report)
  const zip = await loadExcelZip(buffer)

  const drawingXml = await zip.file("xl/drawings/drawing1.xml").async("string")
  const drawingRelsXml = await zip.file("xl/drawings/_rels/drawing1.xml.rels").async("string")
  const contentTypesXml = await zip.file("[Content_Types].xml").async("string")
  const barChartXml = await zip.file("xl/charts/chart1.xml").async("string")
  const lineChartXml = await zip.file("xl/charts/chart2.xml").async("string")
  const doughnutChartXml = await zip.file("xl/charts/chart3.xml").async("string")

  assert.ok(zip.file("xl/media/sinergy-report-logo.png"))
  await assertZipUsesOriginalBrandImage(zip)

  assert.match(drawingXml, /Logo Sinergy Group/)
  assert.match(
    drawingXml,
    /<xdr:oneCellAnchor><xdr:from><xdr:col>1<\/xdr:col><xdr:colOff>\d+<\/xdr:colOff><xdr:row>0<\/xdr:row>[\s\S]*?Logo Sinergy Group/,
  )
  assert.match(drawingXml, /Grafico de Voltaje de bateria/)
  assert.match(drawingXml, /Grafico de Velocidad/)
  assert.match(drawingXml, /Grafico de Estado operativo/)
  assert.equal((drawingXml.match(/<xdr:oneCellAnchor>/g) || []).length, 4)

  assert.equal((drawingRelsXml.match(/relationships\/chart/g) || []).length, 3)
  assert.equal((drawingRelsXml.match(/relationships\/image/g) || []).length, 1)
  assert.match(drawingRelsXml, /Target="\.\.\/media\/sinergy-report-logo\.png"/)

  assert.match(contentTypesXml, /Extension="png" ContentType="image\/png"/)

  assert.match(barChartXml, /<c:barChart>/)
  assert.match(barChartXml, /Voltaje de bateria/)
  assert.match(barChartXml, /<c:formatCode>0\.0&quot;V&quot;<\/c:formatCode>/)
  assert.match(barChartXml, /<a:srgbClr val="0F766E"/)
  assert.match(barChartXml, /DatosGraficos&apos;!\$B\$2:\$B\$2/)

  assert.match(lineChartXml, /<c:lineChart>/)
  assert.match(lineChartXml, /DatosGraficos&apos;!\$D\$2:\$D\$2/)

  assert.match(doughnutChartXml, /<c:doughnutChart>/)
  assert.match(doughnutChartXml, /DatosGraficos&apos;!\$F\$2:\$F\$2/)
})

test("Excel native charts preserve every supplied chart point", async () => {
  const rows = Array.from({ length: 150 }, (_, index) => ({
    index: index + 1,
    asset: "Camion 01",
    patent: "TEST-01",
    deviceId: "123456",
    date: "23-06-2026",
    time: `09:${String(index % 60).padStart(2, "0")}:30 a. m.`,
    status: index % 6 === 0 ? "Detenido" : "Movimiento",
    speed: `${index % 6 === 0 ? 0 : 25 + (index % 30)} km/h`,
    event: "Reporte GPS",
    distance: `${(index * 0.4).toFixed(1)} km`,
    address: "Santiago",
    lat: -33.44,
    lng: -70.66,
  }))

  const buffer = await createItineraryExcelBuffer({
    filename: "itinerario-puntos",
    selectedAssetsSummary: "Camion 01",
    fromDate: "2026-06-23",
    toDate: "2026-06-23",
    generatedAt: "23-06-2026 09:20",
    summary: {},
    charts: {
      enabled: true,
      items: [
        {
          id: "chart-1",
          type: "bar",
          key: "gpsSatellites",
          label: "Satelites GPS",
          unit: "sat",
          decimals: 0,
          color: "#059669",
          labels: rows.map((row) => `${row.date} ${row.time}`),
          values: rows.map((_, index) => index % 17),
        },
        {
          id: "chart-2",
          type: "line",
          key: "speed",
          label: "Velocidad",
          unit: "km/h",
          decimals: 1,
          color: "#2563eb",
          labels: rows.map((row) => `${row.date} ${row.time}`),
          values: rows.map((_, index) => index % 70),
        },
        {
          id: "chart-3",
          type: "doughnut",
          key: "status",
          label: "Estado operativo",
          unit: "",
          decimals: 0,
          color: "#14b8a6",
          labels: ["Ruta normal", "Parada"],
          values: [125, 25],
          colors: ["#14b8a6", "#f97316"],
        },
      ],
    },
    assets: [],
    rows,
  })

  const zip = await loadExcelZip(buffer)
  const drawingXml = await zip.file("xl/drawings/drawing1.xml").async("string")
  const barChartXml = await zip.file("xl/charts/chart1.xml").async("string")
  const lineChartXml = await zip.file("xl/charts/chart2.xml").async("string")

  assert.ok(zip.file("xl/media/sinergy-report-logo.png"))
  await assertZipUsesOriginalBrandImage(zip)

  assert.match(barChartXml, /<c:ptCount val="150"/)
  assert.match(barChartXml, /DatosGraficos&apos;!\$B\$2:\$B\$151/)
  assert.match(barChartXml, /<c:tickLblSkip val="15"/)
  assert.match(barChartXml, /<c:varyColors val="0"/)
  assert.match(barChartXml, /<a:alpha val="13000"/)
  assert.doesNotMatch(barChartXml, /<c:legend>/)

  assert.match(lineChartXml, /<c:areaChart>/)
  assert.match(lineChartXml, /DatosGraficos&apos;!\$D\$2:\$D\$151/)
  assert.match(lineChartXml, /<c:tickLblSkip val="15"/)
  assert.match(lineChartXml, /<a:alpha val="12000"/)

  // Tres gráficos y un logo.
  assert.equal((drawingXml.match(/<xdr:oneCellAnchor>/g) || []).length, 4)
  assert.doesNotMatch(drawingXml, /<xdr:twoCellAnchor/)
})

test("Excel export creates only the selected number of charts", async () => {
  const report = {
    filename: "itinerario-un-grafico",
    selectedAssetsSummary: "Activo de prueba",
    fromDate: "2026-06-22",
    toDate: "2026-06-22",
    generatedAt: "22-06-2026 17:00",
    summary: {},
    charts: {
      enabled: true,
      items: [
        {
          id: "chart-1",
          type: "line",
          key: "fuelPercent",
          label: "Nivel de combustible",
          unit: "%",
          decimals: 1,
          color: "#d97706",
          maximum: 100,
          labels: ["17:00", "17:10"],
          values: [82.5, 81.9],
        },
      ],
    },
    assets: [],
    rows: [],
  }

  const workbook = await createItineraryExcelWorkbook(report)

  assert.equal(workbook.getWorksheet("Reporte").getCell("A29").value, "Activos incluidos")
  assert.equal(workbook.getWorksheet("DatosGraficos").columnCount, 2)

  const buffer = await createItineraryExcelBuffer(report)
  const zip = await loadExcelZip(buffer)

  const drawingXml = await zip.file("xl/drawings/drawing1.xml").async("string")
  const chartXml = await zip.file("xl/charts/chart1.xml").async("string")

  assert.equal(zip.file(/^xl\/charts\/chart\d+\.xml$/).length, 1)
  assert.ok(zip.file("xl/media/sinergy-report-logo.png"))
  await assertZipUsesOriginalBrandImage(zip)

  // Un gráfico y un logo.
  assert.equal((drawingXml.match(/<xdr:oneCellAnchor>/g) || []).length, 2)

  assert.match(drawingXml, /Logo Sinergy Group/)
  assert.match(drawingXml, /Grafico de Nivel de combustible/)
  assert.match(drawingXml, /cx="16002000" cy="3429000"[\s\S]*?Grafico de Nivel de combustible/)
  assert.match(chartXml, /<c:lineChart>/)
  assert.match(chartXml, /Nivel de combustible/)
  assert.match(chartXml, /<c:max val="100"/)
})

test("Excel export omits native charts and inserts the logo with ExcelJS when disabled", async () => {
  const report = {
    filename: "itinerario-sin-graficos",
    selectedAssetsSummary: "Activo de prueba",
    fromDate: "2026-06-22",
    toDate: "2026-06-22",
    generatedAt: "22-06-2026 17:00",
    summary: {},
    charts: {
      enabled: false,
    },
    assets: [],
    rows: [],
  }

  const workbook = await createItineraryExcelWorkbook(report)

  assert.deepEqual(
    workbook.worksheets.map((worksheet) => worksheet.name),
    ["Reporte", "Detalle GPS", "Activos"],
  )
  assert.equal(workbook.getWorksheet("Reporte").getCell("A8").value, "Activos incluidos")
  assert.equal(workbook.getWorksheet("Reporte").getImages().length, 1)
  assert.equal(workbook.media.length, 1)

  const buffer = await createItineraryExcelBuffer(report)
  const zip = await loadExcelZip(buffer)
  const worksheetXml = await zip.file("xl/worksheets/sheet1.xml").async("string")

  assert.equal(zip.file(/^xl\/charts\/chart\d+\.xml$/).length, 0)
  assert.equal(zip.file(/^xl\/media\/.*\.png$/).length, 1)
  await assertZipUsesOriginalBrandImage(zip)
  assert.ok(zip.file("xl/drawings/drawing1.xml"))
  assert.match(worksheetXml, /<drawing r:id="rId\d+"/)
})

test("Excel export sorts assets and detail rows by device", async () => {
  const report = {
    filename: "itinerario-orden-dispositivo",
    selectedAssetsSummary: "Activos de prueba",
    fromDate: "2026-06-22",
    toDate: "2026-06-22",
    generatedAt: "22-06-2026 17:00",
    summary: {},
    charts: {
      enabled: false,
    },
    assets: [
      {
        name: "Camion Z",
        patent: "ZZ-99",
        deviceId: "DEV-200",
        driver: "Conductor Z",
        points: 1,
        movingPoints: 1,
        distanceLabel: "2 km",
      },
      {
        name: "Camion A",
        patent: "AA-01",
        deviceId: "DEV-100",
        driver: "Conductor A",
        points: 1,
        movingPoints: 1,
        distanceLabel: "1 km",
      },
    ],
    rows: [
      {
        index: 1,
        asset: "Camion Z",
        patent: "ZZ-99",
        deviceId: "DEV-200",
        date: "22-06-2026",
        time: "17:05",
        status: "Movimiento",
        speed: "40 km/h",
        event: "Reporte GPS",
        distance: "2 km",
        address: "Santiago",
        lat: -33.44,
        lng: -70.66,
      },
      {
        index: 2,
        asset: "Camion A",
        patent: "AA-01",
        deviceId: "DEV-100",
        date: "22-06-2026",
        time: "17:00",
        status: "Movimiento",
        speed: "30 km/h",
        event: "Reporte GPS",
        distance: "1 km",
        address: "Santiago",
        lat: -33.45,
        lng: -70.67,
      },
    ],
  }

  const workbook = await createItineraryExcelWorkbook(report)

  assert.equal(workbook.getWorksheet("Activos").getRow(6).getCell(3).value, "DEV-100")
  assert.equal(workbook.getWorksheet("Activos").getRow(7).getCell(3).value, "DEV-200")
  assert.equal(workbook.getWorksheet("Detalle GPS").getRow(6).getCell(4).value, "DEV-100")
  assert.equal(workbook.getWorksheet("Detalle GPS").getRow(7).getCell(4).value, "DEV-200")
  assert.equal(workbook.getWorksheet("Reporte").getRow(10).getCell(7).value, "DEV-100")
  assert.equal(workbook.getWorksheet("Reporte").getRow(11).getCell(7).value, "DEV-200")
  assert.equal(workbook.getWorksheet("Reporte").getRow(15).getCell(4).value, "DEV-100")
  assert.equal(workbook.getWorksheet("Reporte").getRow(16).getCell(4).value, "DEV-200")
})

test("Excel native charts share the report drawing with the brand image", async () => {
  const report = {
    filename: "itinerario-drawing-compartido",
    selectedAssetsSummary: "Activo de prueba",
    fromDate: "2026-06-22",
    toDate: "2026-06-22",
    generatedAt: "22-06-2026 17:00",
    summary: {},
    charts: {
      enabled: true,
      items: [
        {
          id: "chart-1",
          type: "line",
          key: "speed",
          label: "Velocidad",
          unit: "km/h",
          decimals: 1,
          color: "#2563eb",
          labels: ["17:00", "17:05"],
          values: [34, 45],
        },
      ],
    },
    assets: [],
    rows: [],
  }

  const chartData = {
    items: report.charts.items,
  }

  const workbook = await createItineraryExcelWorkbook(report, chartData)
  const workbookBuffer = await workbook.xlsx.writeBuffer()

  const buffer = await injectNativeItineraryCharts({
    workbookBuffer,
    chartData,
    brandImageDataUrl: await getOriginalBrandImageDataUrl(),
  })

  const zip = await loadExcelZip(buffer)

  const drawingXml = await zip.file("xl/drawings/drawing1.xml").async("string")
  const drawingRelsXml = await zip.file("xl/drawings/_rels/drawing1.xml.rels").async("string")
  const contentTypesXml = await zip.file("[Content_Types].xml").async("string")

  assert.ok(zip.file("xl/media/sinergy-report-logo.png"))
  await assertZipUsesOriginalBrandImage(zip)

  assert.match(drawingXml, /Logo Sinergy Group/)
  assert.match(
    drawingXml,
    /<xdr:oneCellAnchor><xdr:from><xdr:col>1<\/xdr:col><xdr:colOff>\d+<\/xdr:colOff><xdr:row>0<\/xdr:row>[\s\S]*?Logo Sinergy Group/,
  )
  assert.match(drawingXml, /r:embed="rId2"/)
  assert.match(drawingXml, /Grafico de Velocidad/)
  assert.equal((drawingXml.match(/<xdr:oneCellAnchor>/g) || []).length, 2)

  assert.match(drawingRelsXml, /relationships\/chart/)
  assert.match(drawingRelsXml, /relationships\/image/)
  assert.match(drawingRelsXml, /Target="\.\.\/media\/sinergy-report-logo\.png"/)
  assert.match(contentTypesXml, /Extension="png" ContentType="image\/png"/)
})

test("PDF export uses the original logo and configured filename", async () => {
  const originalAddImage = jsPDF.API.addImage
  const originalSave = jsPDF.API.save
  const originalText = jsPDF.API.text
  const expectedBrandImage = await getOriginalBrandImageDataUrl()
  let addedBrandImage = ""
  let savedFilename = ""
  const writtenText = []
  const textPlacements = []

  jsPDF.API.addImage = function addImage(imageData) {
    addedBrandImage = imageData
    return this
  }

  jsPDF.API.text = function text(...args) {
    const [value, x, y] = args

    if (Array.isArray(value)) {
      writtenText.push(...value.map((textValue) => String(textValue)))
    } else {
      writtenText.push(String(value))
    }

    textPlacements.push({
      value: Array.isArray(value) ? value.join(" ") : String(value),
      x,
      y,
    })

    if (typeof originalText === "function") {
      return originalText.apply(this, args)
    }

    return this
  }

  jsPDF.API.save = function save(filename) {
    savedFilename = filename
    return this
  }

  try {
    await exportItineraryPdfReport({
      filename: "reporte-pdf-prueba",
      headerTitle: "Reporte de itinerario",
      title: "Exportacion operativa",
      selectedAssetsSummary: "Camion 01",
      fromDate: "2026-06-22",
      toDate: "2026-06-22",
      generatedAt: "22-06-2026 17:00",
      rowsLabel: "puntos GPS",
      summary: {
        distanceLabel: "12.4 km",
        movingLabel: "42 min",
        stoppedLabel: "8 min",
        averageSpeedLabel: "31 km/h",
      },
      charts: {
        enabled: false,
      },
      assets: [
        {
          name: "Camion 01",
          patent: "TEST-01",
          deviceId: "123456",
          driver: "Conductor",
          points: 1,
          movingPoints: 1,
          distanceLabel: "12.4 km",
        },
      ],
      rows: [
        {
          index: 1,
          asset: "Camion 01",
          patent: "TEST-01",
          deviceId: "123456",
          date: "22-06-2026",
          time: "17:00",
          status: "Movimiento",
          speed: "31 km/h",
          event: "Reporte GPS",
          distance: "12.4 km",
          address: "Santiago",
          lat: -33.44,
          lng: -70.66,
        },
      ],
    })
  } finally {
    jsPDF.API.addImage = originalAddImage
    jsPDF.API.text = originalText
    jsPDF.API.save = originalSave
  }

  assert.equal(addedBrandImage, expectedBrandImage)
  assert.equal(savedFilename, "reporte-pdf-prueba.pdf")
  assert.match(writtenText.join(" "), /Resumen del informe: Reporte de itinerario/)
  assert.ok(
    textPlacements.some((placement) => {
      return placement.value === "Activos incluidos" && placement.y >= 80
    }),
  )
})
