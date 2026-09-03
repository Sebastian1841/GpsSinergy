import assert from "node:assert/strict"
import test from "node:test"

import { createReportColumns } from "./assetReportColumnUtils.js"
import {
  ASSET_REPORT_PREVIEW_FORMAT_IDS,
  buildAssetReportRenderModel,
  buildItineraryCompatibleReport,
  getReportRenderCellValue,
} from "./assetReportRenderModelUtils.js"

const buildReportRows = () => [
  {
    id: "row-b",
    timestamp: "2026-09-02T10:15:00Z",
    asset: {
      id: "asset-b",
      name: "Camion B",
      patente: "BB-20",
      deviceId: "DEV-200",
      conductor: "Belen Soto",
    },
    values: {
      fecha: "2026-09-02",
      patente: "BB-20",
      vehiculo: "Camion B",
      deviceId: "DEV-200",
      conductor: "Belen Soto",
      estado: "Detenido",
      velocidad: "0 km/h",
      duracion: "2 min",
      address: "Bodega Norte",
      lat: "-33.45",
      lng: "-70.65",
    },
  },
  {
    id: "row-a",
    timestamp: "2026-09-02T10:10:00Z",
    asset: {
      id: "asset-a",
      name: "Camion A",
      patente: "AA-10",
      deviceId: "DEV-100",
      conductor: "Ana Torres",
    },
    values: {
      fecha: "2026-09-02",
      patente: "AA-10",
      vehiculo: "Camion A",
      deviceId: "DEV-100",
      conductor: "Ana Torres",
      estado: "Detenido",
      velocidad: "0 km/h",
      duracion: "1 min",
      address: "Bodega Norte",
      lat: "-33.46",
      lng: "-70.66",
    },
  },
]

test("asset report render model feeds preview and export with the same report metrics", () => {
  const template = {
    name: "Detenciones",
    reportTypeId: "stops",
    description: "Tiempos detenidos por activo.",
  }
  const reportColumns = createReportColumns({
    columns: ["patente", "vehiculo", "deviceId", "conductor", "estado", "duracion", "address"],
  })
  const reportRows = buildReportRows()
  const model = buildAssetReportRenderModel({
    template,
    reportColumns,
    reportRows,
    dateFrom: "2026-09-01",
    dateTo: "2026-09-02",
    selectedGroupLabel: "Todos los grupos",
    selectedAssetCount: 2,
    format: ASSET_REPORT_PREVIEW_FORMAT_IDS.excel,
    previewRows: reportRows.slice(0, 1),
    generatedAt: "02-09-2026, 10:30",
  })
  const exportReport = buildItineraryCompatibleReport({
    template,
    reportColumns,
    reportRows,
    dateFrom: "2026-09-01",
    dateTo: "2026-09-02",
    selectedGroupLabel: "Todos los grupos",
    selectedAssetCount: 2,
    format: ASSET_REPORT_PREVIEW_FORMAT_IDS.excel,
    previewRows: reportRows.slice(0, 1),
    generatedAt: "02-09-2026, 10:30",
  })

  assert.deepEqual(exportReport.metrics, model.metrics)
  assert.deepEqual(exportReport.assets, model.assets)
  assert.deepEqual(exportReport.rows, model.itineraryRows)
  assert.equal(model.selectedAssetsSummary, "2 activos con detenciones")
  assert.deepEqual(
    model.metrics.map((metric) => [metric.label, metric.value]),
    [
      ["Detenciones", 2],
      ["Activos", 2],
      ["Tiempo detenido", "3 min"],
      ["Ubicaciones", 1],
    ],
  )
})

test("asset report render model keeps Excel complete and PDF compact from the same columns", () => {
  const template = {
    name: "Datos CAN",
    reportTypeId: "can",
  }
  const reportColumns = createReportColumns({
    columns: [
      "patente",
      "vehiculo",
      "deviceId",
      "conductor",
      "estado",
      "ultimoDato",
      "velocidad",
      "odometro",
      "horometro",
    ],
  })
  const [reportRow] = buildReportRows()
  const excelModel = buildAssetReportRenderModel({
    template,
    reportColumns,
    reportRows: [reportRow],
    format: ASSET_REPORT_PREVIEW_FORMAT_IDS.excel,
    generatedAt: "Al exportar",
  })
  const pdfModel = buildAssetReportRenderModel({
    template,
    reportColumns,
    reportRows: [reportRow],
    format: ASSET_REPORT_PREVIEW_FORMAT_IDS.pdf,
    generatedAt: "Al exportar",
  })

  assert.equal(excelModel.columns.visible.length, reportColumns.length + 1)
  assert.equal(pdfModel.columns.visible.length < excelModel.columns.visible.length, true)
  assert.equal(
    pdfModel.hiddenPdfColumnCount,
    reportColumns.length - pdfModel.columns.pdfVisible.length,
  )
  assert.equal(getReportRenderCellValue(reportRow, { key: "duration" }, 0), "2 min")
  assert.equal(getReportRenderCellValue(reportRow, { key: "index" }, 0), 1)
})

test("asset report render model accepts builder columns that only provide id", () => {
  const template = {
    name: "Reporte personalizado",
    reportTypeId: "can",
  }
  const reportColumns = [
    {
      id: "patente",
      label: "Patente",
    },
    {
      id: "vehiculo",
      label: "Vehiculo",
    },
  ]
  const [reportRow] = buildReportRows()
  const model = buildAssetReportRenderModel({
    template,
    reportColumns,
    reportRows: [reportRow],
    format: ASSET_REPORT_PREVIEW_FORMAT_IDS.excel,
  })

  assert.deepEqual(
    model.columns.visible.map((column) => column.key),
    ["index", "patente", "vehiculo"],
  )
  assert.equal(getReportRenderCellValue(reportRow, model.columns.visible[1], 0), "BB-20")
})
