import assert from "node:assert/strict"
import test from "node:test"
import {
  createUnreportedExcelWorkbook,
  prepareUnreportedExcelRows,
} from "./unreportedExcelExportService.js"
import { createDemoHistoryEquipment } from "../../utils/unreported/unreportedHistoryDemo.js"
import { groupHistoryEquipment } from "../../utils/unreported/unreportedHistorySearch.js"

test("operational Excel ignores calls from a previous outage and exports current follow-up", async () => {
  const current = { id: "new", lastReportAt: "2026-10-18T12:00:00Z" }
  const oldCall = {
    id: "old",
    interruptionId: "old",
    createdAt: "2026-10-10T12:00:00Z",
    author: "Ana",
    situation: "workshop",
    decision: "no_visit",
    observation: "Llamada anterior",
  }
  const row = {
    mode: "active",
    name: "Equipo",
    imei: "00123",
    interruptions: [current],
    consultations: [oldCall],
    lastConsultation: oldCall,
  }
  const first = await createUnreportedExcelWorkbook(prepareUnreportedExcelRows([row]), {
    brandImage: "",
  })
  assert.equal(first.getWorksheet("Reporte").getCell("H7").value, "Sin llamada registrada")
  row.consultations.push({
    id: "new-call",
    interruptionId: "new",
    createdAt: "2026-10-19T12:00:00Z",
    author: "Luis",
    situation: "workshop",
    decision: "no_visit",
    nextCallDate: "2026-10-20",
    visitDate: "2026-10-19",
    visitResult: "repaired",
    contactedPerson: "Juan Perez",
    contactedRole: "Encargado",
  })
  const second = await createUnreportedExcelWorkbook(prepareUnreportedExcelRows([row]), {
    brandImage: "",
  })
  assert.match(
    second.getWorksheet("Reporte").getCell("K7").value,
    /20-10-2026[\s\S]*Falla corregida/,
  )
  assert.match(second.getWorksheet("Historial de reportes").getCell("H2").value, /Falla corregida/)
  assert.match(second.getWorksheet("Reporte").getCell("K7").value, /Juan Perez \(Encargado\)/)
  assert.match(
    second.getWorksheet("Historial de reportes").getCell("H2").value,
    /Juan Perez \(Encargado\)/,
  )
})

test("demo history exports without a current diagnosis and retains all episode-specific evidence", async () => {
  const teams = groupHistoryEquipment(createDemoHistoryEquipment(new Date("2026-10-15T15:00:00Z")))
  const prepared = prepareUnreportedExcelRows(teams, { history: true })
  assert.equal(prepared.length, 12)
  assert.equal(prepared[0].disconnectionReason, "Diagnostico actual no registrado")
  const workbook = await createUnreportedExcelWorkbook(prepared, { history: true })
  assert.equal(workbook.getWorksheet("Resumen de equipos").rowCount, 13)
  assert.equal(workbook.getWorksheet("Historial de reportes").rowCount, 60)
  assert.equal(
    workbook.getWorksheet("Historial de reportes").getCell("I2").value,
    "Alimentacion desconectada",
  )
  const buffer = await workbook.xlsx.writeBuffer()
  assert.ok(buffer.byteLength > 0)
  const filtered = groupHistoryEquipment(teams, "2026-10-01", "2026-10-15")
  const single = await createUnreportedExcelWorkbook(
    prepareUnreportedExcelRows([filtered[0]], { history: true }),
    { history: true },
  )
  assert.equal(single.getWorksheet("Resumen de equipos").rowCount, 2)
  assert.equal(single.getWorksheet("Historial de reportes").rowCount, 2)
})

test("operational row preparation tolerates missing diagnosis and preserves existing diagnosis", () => {
  const rows = prepareUnreportedExcelRows([
    { name: "Sin dato" },
    { diagnosis: { reason: "SIM ausente", evidence: "SIM no detectada" } },
  ])
  assert.equal(rows[0].diagnosticEvidence, "Sin datos de diagnostico actual")
  assert.equal(rows[1].disconnectionReason, "SIM ausente")
})

test("operational export computes historical summary on demand after it was removed from live rows", () => {
  const record = {
    interruptions: [
      { id: "old", lastReportAt: "2026-10-01T00:00:00Z", recoveredAt: "2026-10-02T12:00:00Z" },
      { id: "current", lastReportAt: "2026-10-03T00:00:00Z", recoveredAt: null },
    ],
  }
  const [prepared] = prepareUnreportedExcelRows([record])
  assert.equal(prepared.interruptionCount, 2)
  assert.match(prepared.lastRecoveryAt, /02-10-2026/)
  assert.equal(record.lastRecoveryAt, undefined)
})

test("history groups episodes by equipment while preserving report branding and all calls", async () => {
  const teams = groupHistoryEquipment(createDemoHistoryEquipment(new Date("2026-10-15T15:00:00Z")))
  const workbook = await createUnreportedExcelWorkbook(
    prepareUnreportedExcelRows(teams, { history: true }),
    {
      history: true,
      observedAt: "2026-10-15T15:00:00Z",
      reportWidthPx: 1800,
      filterDescription: "Todas las empresas | Todo el historial",
    },
  )
  const report = workbook.getWorksheet("Reporte")
  assert.equal(workbook.worksheets[0].name, "Reporte")
  assert.equal(workbook.creator, "Sinergy Group")
  assert.equal(report.getCell("C1").value, "HISTORIAL DE DESCONEXIONES")
  assert.match(report.getCell("G3").value, /Generado:.*15-10-2026/)
  assert.match(report.getCell("B3").value, /12 equipos.*59 desconexiones terminadas/)
  assert.equal(report.getImages().length, 1)
  const logo = report.getImages()[0].range.ext
  assert.ok(Math.abs(logo.width / logo.height - 2800 / 900) < 0.0001)
  assert.ok(logo.width <= report.getColumn(2).width * 7 + 5 - 12)
  assert.equal(report.getColumn(1).width, report.getColumn(11).width)
  assert.ok(report.columnCount <= 11)
  assert.equal(report.views[0].showGridLines, false)
  assert.equal(report.views[0].zoomScale, 85)
  assert.equal(report.pageSetup.printTitlesRow, "1:5")
  assert.equal(report.pageSetup.printArea, "A1:K99")
  assert.equal(report.autoFilter, null)
  assert.equal(report.rowCount, 99)
  assert.match(report.getCell("B6").value, /JSFG-74[\s\S]*DEMO-001/)
  assert.equal(report.getCell("B7").value, "Dejó de reportar")
  assert.equal(report.getCell("C7").value, "Volvió a reportar")
  assert.equal(report.getCell("B7").font.color.argb, "FFFFFFFF")
  assert.equal(report.getCell("B7").font.size, 12)
  assert.equal(report.getCell("E8").value, "Alimentacion desconectada")
  assert.match(report.getCell("G8").value, /Ana Morales/)
  assert.match(report.getCell("G8").value, /Luis Rojas/)
  assert.match(report.getCell("J8").value, /segunda llamada/)
  assert.ok(report.getRow(8).height > 44)
  assert.equal(report.getCell("J8").alignment.wrapText, true)
  assert.equal(report.getRow(16).height, 16)
  assert.match(report.getCell("B17").value, /FLRB-22/)
  assert.equal(report.getCell("B18").value, "Dejó de reportar")
  const buffer = await workbook.xlsx.writeBuffer()
  const module = await import("exceljs")
  const reloaded = new (module.default || module).Workbook()
  await reloaded.xlsx.load(buffer)
  assert.equal(reloaded.worksheets[0].name, "Reporte")
  assert.equal(reloaded.getWorksheet("Reporte").getImages().length, 1)
  assert.equal(reloaded.getWorksheet("Historial de reportes").rowCount, 60)
  assert.equal(reloaded.getWorksheet("Reporte").getCell("B17").value, report.getCell("B17").value)
  assert.equal(reloaded.getWorksheet("Historial de reportes").autoFilter, "A1:J1")
})

test("history and active reports share styling and unknown starts remain explicit", async () => {
  const equipment = {
    name: "=Equipo",
    imei: "00123",
    company: "Empresa",
    interruptions: [
      {
        id: "first",
        kind: "first_report",
        lastReportAt: null,
        recoveredAt: "2026-10-19T12:00:00Z",
      },
      { id: "open", lastReportAt: "2026-10-19T12:00:00Z", recoveredAt: null },
    ],
    consultations: [
      {
        id: "c",
        interruptionId: "first",
        createdAt: "2026-10-19T11:00:00Z",
        author: "Ana",
        nextCallDate: "2026-10-20",
        visitDate: "2026-10-19",
        visitResult: "repaired",
        contactedPerson: "Juan Perez",
        contactedRole: "Encargado",
      },
    ],
  }
  const active = (
    await createUnreportedExcelWorkbook(prepareUnreportedExcelRows([equipment]))
  ).getWorksheet("Reporte")
  const history = (
    await createUnreportedExcelWorkbook(
      prepareUnreportedExcelRows([equipment], { history: true }),
      { history: true },
    )
  ).getWorksheet("Reporte")
  assert.deepEqual(history.getCell("B7").font, active.getCell("B6").font)
  assert.deepEqual(history.getCell("B7").fill, active.getCell("B6").fill)
  assert.deepEqual(history.getCell("B8").alignment, active.getCell("B7").alignment)
  assert.equal(history.views[0].zoomScale, active.views[0].zoomScale)
  assert.equal(history.views[0].ySplit, 5)
  assert.deepEqual(history.pageSetup.margins, active.pageSetup.margins)
  assert.equal(history.getCell("B8").value, "Sin reporte previo")
  assert.equal(history.getCell("D8").value, "Inicio desconocido")
  assert.match(history.getCell("J8").value, /20-10-2026[\s\S]*Falla corregida/)
  assert.match(history.getCell("J8").value, /Juan Perez \(Encargado\)/)
  assert.equal(history.rowCount, 8)
  assert.match(history.getCell("B6").value, /^=Equipo/)
})

test("operational report is one continuous table with compact branding and safe rich text", async () => {
  const workbook = await createUnreportedExcelWorkbook(
    prepareUnreportedExcelRows([
      {
        name: "=1+1",
        imei: "00123",
        company: "Empresa",
        status: "Sin reportar",
        duration: "8 h",
        diagnosis: { reason: "SIM ausente", evidence: "SIM no detectada" },
      },
    ]),
    { observedAt: "2026-10-15T15:00:00Z" },
  )
  const report = workbook.getWorksheet("Reporte")
  assert.equal(report.getCell("C1").value, "REPORTE DE EQUIPOS SIN REPORTAR")
  assert.deepEqual(report.getRow(6).values.slice(2), [
    "Equipo",
    "Empresa",
    "Tiempo sin reportar",
    "Último reporte",
    "Diagnóstico GPS",
    "Evidencia GPS",
    "Última llamada",
    "Situación",
    "Decisión",
    "Observaciones",
  ])
  assert.equal(report.getCell("F7").value, "SIM ausente")
  assert.equal(report.getCell("B7").value.richText[0].text, "=1+1")
  assert.equal(report.getCell("B7").value.richText[0].font.bold, true)
  assert.equal(report.getCell("B7").value.richText[1].text, "\nIMEI: 00123")
  assert.equal(report.getCell("B7").value.richText[1].font.size, 11)
  assert.equal(report.getCell("B7").value.richText[0].font.size, 12)
  assert.equal(report.getCell("C7").font.size, 12)
  assert.equal(report.getCell("B6").font.size, 12)
  assert.equal(report.getCell("C1").font.size, 17)
  assert.equal(report.getCell("H7").value, "Sin llamada registrada")
  assert.equal(report.getCell("I7").value, "—")
  assert.equal(report.getCell("J7").value, "—")
  assert.equal(report.getCell("K7").value, "—")
  assert.equal(report.getCell("B7").alignment.vertical, "middle")
  assert.equal(report.autoFilter, "B6:K7")
  assert.equal(report.views[0].ySplit, 6)
  assert.equal(report.pageSetup.printTitlesRow, "1:6")
  assert.equal(report.getColumn(1).width, report.getColumn(12).width)
  const logo = report.getImages()[0].range.ext
  assert.ok(logo.width > 120)
  assert.ok(Math.abs(logo.width / logo.height - 2800 / 900) < 0.0001)
  assert.ok(logo.width <= report.getColumn(2).width * 7 + 5 - 12 + 0.001)
  assert.ok(
    logo.height <= ((report.getRow(1).height + report.getRow(2).height) * 4) / 3 - 8 + 0.001,
  )
  assert.equal(report.pageSetup.horizontalCentered, true)
  assert.equal(report.pageSetup.margins.left, report.pageSetup.margins.right)
  assert.equal(report.rowCount, 7)
  assert.ok(workbook.getWorksheet("Equipos sin reporte"))
})

test("continuous report scales to 100 vehicles without repeated headings and shows the latest call", async () => {
  const calls = [
    {
      id: "latest",
      createdAt: "2026-10-15T15:35:00Z",
      author: "Ana Morales",
      situation: "workshop",
      decision: "no_visit",
      observation: "Revision de alimentacion en taller",
    },
    {
      id: "older",
      createdAt: "2026-10-13T15:00:00Z",
      author: "Luis Rojas",
      situation: "not_contacted",
      decision: "pending",
      observation: "Primera llamada sin respuesta",
    },
  ]
  const rows = Array.from({ length: 100 }, (_, index) => ({
    name: `Equipo ${index + 1}`,
    imei: `00${index}`,
    company: "Empresa",
    duration: "22 dias 5 h",
    lastSeenAt: "2026-09-23T14:05:00Z",
    lastReport: "23-09-2026, 11:05",
    diagnosis: {
      reason: index === 0 ? "Alimentacion desconectada" : "Sin comunicacion",
      evidence:
        index === 0
          ? "Externa: 0 V · Interna: 3,46 V"
          : "Sin datos de conexion · Causa no determinada",
    },
    consultations: index === 0 ? calls : [],
  }))
  const workbook = await createUnreportedExcelWorkbook(prepareUnreportedExcelRows(rows), {
    observedAt: "2026-10-15T19:05:00Z",
    filterDescription: "Todas las empresas",
  })
  const report = workbook.getWorksheet("Reporte")
  assert.equal(report.rowCount, 106)
  assert.equal(report.getCell("B3").value, "100 equipos · Todas las empresas")
  assert.equal(report.getCell("G3").value, "Generado: 15-10-2026 · 16:05")
  assert.equal(report.getCell("E7").value, "23-09-2026\n11:05")
  assert.equal(report.getCell("G7").value, "Externa: 0 V\nInterna: 3,46 V")
  assert.equal(report.getCell("H7").value, "15-10-26 · 12:35\nAna Morales")
  assert.equal(report.getCell("I7").value, "En taller")
  assert.equal(report.getCell("J7").value, "No requiere por ahora")
  assert.equal(report.getCell("K7").value, calls[0].observation)
  assert.equal(report.getCell("F7").fill.fgColor.argb, "FFFFF4EA")
  assert.match(
    workbook.getWorksheet("Equipos sin reporte").getCell("P2").value,
    /Primera llamada sin respuesta/,
  )
  assert.equal(report.autoFilter, "B6:K106")
  for (let row = 7; row <= 106; row++) {
    assert.ok(report.getCell(row, 2).value.richText)
    assert.equal(report.getCell(row, 2).isMerged, false)
    assert.equal(report.getCell(row, 3).fill.fgColor.argb, row % 2 ? "FFFFFFFF" : "FFFAFBFD")
    assert.equal(report.getCell(row, 3).border.left, undefined)
  }
  const buffer = await workbook.xlsx.writeBuffer()
  const module = await import("exceljs")
  const reloaded = new (module.default || module).Workbook()
  await reloaded.xlsx.load(buffer)
  const saved = reloaded.getWorksheet("Reporte")
  assert.equal(saved.getCell("B106").value.richText[0].text, "Equipo 100")
  assert.equal(saved.getCell("H7").value, "15-10-26 · 12:35\nAna Morales")
  assert.ok(saved.getImages()[0].range.ext.width > 120)
  assert.equal(calls[0].id, "latest")
})

test("operational report does not end in hidden columns or shrink to a narrow browser window", async () => {
  const rows = prepareUnreportedExcelRows([{ name: "Equipo", imei: "00123", company: "Empresa" }])
  const normal = (await createUnreportedExcelWorkbook(rows, { reportWidthPx: 1800 })).getWorksheet(
    "Reporte",
  )
  const narrow = (await createUnreportedExcelWorkbook(rows, { reportWidthPx: 1000 })).getWorksheet(
    "Reporte",
  )
  const wide = (await createUnreportedExcelWorkbook(rows, { reportWidthPx: 2200 })).getWorksheet(
    "Reporte",
  )
  assert.equal(narrow.getColumn(2).width, normal.getColumn(2).width)
  assert.ok(wide.getColumn(2).width > normal.getColumn(2).width)
  for (const column of [12, 13, 100, 16384]) assert.notEqual(narrow.getColumn(column).hidden, true)
  assert.equal(narrow.pageSetup.printArea, "A1:L7")
  assert.equal(narrow.getColumn(1).width, narrow.getColumn(12).width)
})

test("unreported Excel exports all supplied rows in order with text IMEIs and safe literal values", async () => {
  const rows = Array.from({ length: 25 }, (_, index) => ({
    name: index === 0 ? "=1+1" : `Equipo ${index}`,
    imei: "001234567890123",
    company: "Empresa",
    status: "Sin conexion",
    duration: "14 horas",
    lastReport: "Sin reporte",
    power: "Sin datos",
    location: "Norte",
    recoveredAt: "13-10-2026 12:00",
    interruption: "14 horas",
    followUpAt: "12-10-2026 12:00",
    followUpLabel: "Sin revision por ahora",
    followUpBy: "Operador",
    consultations: [
      {
        id: "c1",
        situation: "workshop",
        decision: "no_visit",
        observation: "En reparacion",
        author: "Operador",
        createdAt: "2026-10-14T15:00:00Z",
      },
    ],
    notes: [
      { id: "n1", text: "Esta en taller", author: "Operador", createdAt: "2026-10-14T15:00:00Z" },
    ],
  }))
  const workbook = await createUnreportedExcelWorkbook(rows)
  const buffer = await workbook.xlsx.writeBuffer()
  const module = await import("exceljs")
  const ExcelJS = module.default || module
  const reloaded = new ExcelJS.Workbook()
  await reloaded.xlsx.load(buffer)
  const sheet = reloaded.getWorksheet("Equipos sin reporte")
  assert.equal(sheet.rowCount, 26)
  assert.equal(sheet.getCell("A2").value, "=1+1")
  assert.equal(sheet.getCell("B2").value, "001234567890123")
  assert.equal(sheet.getCell("A26").value, "Equipo 24")
  assert.equal(sheet.getCell("C2").value, "Empresa")
  assert.equal(sheet.getCell("H2").value, "Norte")
  assert.equal(sheet.getCell("I2").value, "13-10-2026 12:00")
  assert.equal(sheet.getCell("J2").value, "14 horas")
  assert.equal(sheet.getCell("L2").value, "Sin revision por ahora")
  assert.equal(sheet.getCell("L1").value, "Decision de revision")
  assert.equal(sheet.getCell("K2").value, "12-10-2026 12:00")
  assert.equal(sheet.getCell("M2").value, "Operador")
  assert.equal(sheet.getCell("P1").value, "Consultas a la empresa")
  assert.match(sheet.getCell("P2").value, /Operador: En taller/)
  assert.match(sheet.getCell("P2").value, /No requiere por ahora/)
  assert.match(sheet.getCell("P2").value, /En reparacion/)
  assert.equal(sheet.columnCount, 16)
  assert.doesNotMatch(JSON.stringify(sheet.getRow(2).values), /Esta en taller/)
})
test("history export has one summary row per equipment and one detail row per interruption", async () => {
  const episodes = [
    { id: "one", lastReportAt: "2026-10-12T00:00:00Z", recoveredAt: "2026-10-13T12:00:00Z" },
    { id: "two", lastReportAt: "2026-10-13T12:00:00Z", recoveredAt: null },
  ]
  const workbook = await createUnreportedExcelWorkbook(
    [
      {
        name: "Equipo",
        imei: "00123",
        company: "Empresa",
        status: "Sin reportar",
        interruptionCount: 2,
        lastRecoveryAt: "13-10-2026",
        interruptions: episodes,
        consultations: [
          {
            id: "c1",
            interruptionId: "one",
            situation: "workshop",
            decision: "no_visit",
            author: "Operador",
            createdAt: "2026-10-13T11:00:00Z",
          },
        ],
      },
    ],
    { history: true, observedAt: "2026-10-14T12:00:00Z" },
  )
  const summary = workbook.getWorksheet("Resumen de equipos")
  assert.equal(summary.rowCount, 2)
  assert.equal(summary.getCell("F2").value, 2)
  assert.equal(summary.getCell("G2").value, "13-10-2026")
  const detail = workbook.getWorksheet("Historial de reportes")
  assert.equal(detail.rowCount, 3)
  assert.equal(detail.getCell("B2").value, "00123")
  assert.equal(detail.getCell("F2").value, "1 dias 12 h")
  assert.equal(detail.getCell("E3").value, "Aun sin recuperar")
  assert.equal(detail.getCell("F3").value, "1 dias 0 h")
  assert.match(detail.getCell("H2").value, /Operador: En taller/)
  assert.equal(detail.getCell("H3").value, "")
  assert.equal(detail.getCell("I2").value, "Diagnostico no registrado")
  assert.equal(detail.getCell("J2").value, "No se guardaron datos GPS de esta interrupcion")
})
