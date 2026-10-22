import assert from "node:assert/strict"
import test from "node:test"
import { readFileSync } from "node:fs"
import { parse } from "@vue/compiler-sfc"

test("active company options use only current unreported equipment and reset stale selections", () => {
  const { descriptor } = parse(
    readFileSync(new URL("./UnreportedView.vue", import.meta.url), "utf8"),
  )
  assert.match(descriptor.scriptSetup.content, /trackedRows.value.filter\(isUnreportedEquipment\)/)
  assert.match(descriptor.scriptSetup.content, /watch\(companyOptions/)
  assert.match(descriptor.scriptSetup.content, /!companies.includes\(selectedCompany.value\)/)
})

test("active table omits redundant connectivity column but retains silence and review", () => {
  const { descriptor } = parse(
    readFileSync(new URL("./UnreportedView.vue", import.meta.url), "utf8"),
  )
  const columns = descriptor.scriptSetup.content.match(
    /const activeTableColumns = \[([\s\S]*?)\n\]/,
  )[1]
  assert.doesNotMatch(columns, /key: "status"|Conectividad/)
  assert.equal((columns.match(/key:/g) || []).length, 6)
  assert.match(columns, /key: "silence"/)
  assert.match(columns, /key: "review"/)
  assert.doesNotMatch(descriptor.template.content, /visibleColumnKeys.includes\('status'\)/)
})

test("unreported header shares aligned active/history columns without stray text grid items", () => {
  const { descriptor, errors } = parse(
    readFileSync(new URL("./UnreportedView.vue", import.meta.url), "utf8"),
  )
  assert.deepEqual(errors, [])
  const findHeader = (node) => {
    if (
      node.type === 1 &&
      node.props.some(
        (prop) => prop.name === "class" && prop.value?.content.includes("table-grid shrink-0"),
      )
    )
      return node
    for (const child of node.children || []) {
      const match = findHeader(child)
      if (match) return match
    }
  }
  const header = findHeader(descriptor.template.ast)
  assert.ok(header)
  const columns = header.children.filter((node) => node.type === 1)
  assert.equal(columns.length, 1)
  assert.equal(columns[0].tag, "div")
  assert.match(descriptor.template.content, /v-for="column in tableColumns"/)
  assert.match(descriptor.template.content, /@click="toggleTableSort\(column.key\)"/)
  assert.match(descriptor.template.content, /:aria-sort=/)
  assert.match(descriptor.scriptSetup.content, /compareUnreportedColumn\(a, b,/)
  assert.ok(header.children.filter((node) => node.type === 2).every((node) => !node.content.trim()))
})
test("equipment review exposes consultations without the retired notes interface", () => {
  const { descriptor, errors } = parse(
    readFileSync(
      new URL("../components/unreported/UnreportedOperationModal.vue", import.meta.url),
      "utf8",
    ),
  )
  assert.deepEqual(errors, [])
  assert.doesNotMatch(
    descriptor.template.content,
    /equipment\.notes|Agregar nota|Nueva nota|Editar nota/,
  )
  assert.match(descriptor.template.content, /Registrar consulta/)
  assert.match(descriptor.template.content, /Consultas/)
})
test("unreported module no longer exposes a charts view", () => {
  const { descriptor, errors } = parse(
    readFileSync(new URL("./UnreportedView.vue", import.meta.url), "utf8"),
  )
  assert.deepEqual(errors, [])
  assert.doesNotMatch(descriptor.template.content, /Graficos|UnreportedCharts|activeView/)
  assert.doesNotMatch(descriptor.scriptSetup.content, /UnreportedCharts|activeView/)
})
test("simple filter panel exposes only search, company, field decision and silence", () => {
  const { descriptor, errors } = parse(
    readFileSync(new URL("./UnreportedView.vue", import.meta.url), "utf8"),
  )
  assert.deepEqual(errors, [])
  const template = descriptor.template.content
  const panel = template.slice(template.indexOf("<aside"), template.indexOf("</aside>"))
  assert.doesNotMatch(
    panel,
    /Umbral de desconexion|Ordenar por|Fecha ultimo reporte|<span>Conectividad/,
  )
  assert.match(panel, /1 dia o mas/)
  assert.match(panel, /3 dias o mas/)
  assert.match(panel, /7 dias o mas/)
  assert.match(panel, /15 dias o mas/)
  assert.match(panel, /v-model.number="customSilenceDays"/)
  assert.match(panel, /Sin fecha conocida/)
  assert.match(panel, /Ultima consulta/)
  assert.match(panel, /v-model="selectedConsultation"/)
  assert.match(
    descriptor.scriptSetup.content,
    /compareUnreportedColumn\(a, b, "historyLatest", "desc"\)/,
  )
})
test("simple layout keeps actions beside tabs without summary or column controls", () => {
  const { descriptor, errors } = parse(
    readFileSync(new URL("./UnreportedView.vue", import.meta.url), "utf8"),
  )
  assert.deepEqual(errors, [])
  const template = descriptor.template.content
  assert.doesNotMatch(template, /aria-label="Resumen"/)
  assert.ok(
    template.indexOf('aria-label="Seguimiento de equipos"') <
      template.indexOf('@click="exportExcel"'),
  )
  assert.doesNotMatch(template, /v-model="visibleColumnKeys"|Restablecer columnas|columns-menu/)
  const extra = template.match(/<details[^>]*class="extra-filters"[\s\S]*?<\/details>/)[0]
  assert.doesNotMatch(extra, /\sopen[\s>]/)
  assert.match(extra, /selectedConsultation/)
  assert.match(extra, /selectedFollowUp/)
  assert.doesNotMatch(extra, /selectedCompany|selectedSilence|searchTerm/)
  assert.equal((template.match(/:style="tableGridStyle"/g) || []).length, 2)
})
test("equipment thumbnails reuse Activos configuration with fixed size and failure fallback", () => {
  const { descriptor, errors } = parse(
    readFileSync(new URL("./UnreportedView.vue", import.meta.url), "utf8"),
  )
  assert.deepEqual(errors, [])
  assert.match(descriptor.scriptSetup.content, /useActivosService\(\)/)
  assert.match(descriptor.scriptSetup.content, /getAssetImageMarkerVariant\(asset \|\| \{\}\)/)
  assert.match(descriptor.scriptSetup.content, /\[\{\}, \.\.\.vehicleImageIndex.value.values\(\)\]/)
  assert.match(descriptor.scriptSetup.content, /unreportedAssetImageKey\(row.company, row.imei\)/)
  assert.doesNotMatch(descriptor.scriptSetup.content, /camion\|truck\|volvo\|scania/)
  assert.match(descriptor.template.content, /:src="getVehicleImage\(row\)"/)
  assert.match(descriptor.template.content, /@error="markVehicleImageFailed/)
  assert.match(descriptor.template.content, /width="48"/)
  assert.match(descriptor.template.content, /height="48"/)
  assert.match(descriptor.template.content, /SvgIcon v-else name="vehiculos"/)
})
test("short result lists keep normal row heights instead of filling the table", () => {
  const { descriptor, errors } = parse(
    readFileSync(new URL("./UnreportedView.vue", import.meta.url), "utf8"),
  )
  assert.deepEqual(errors, [])
  const styles = descriptor.styles.map((style) => style.content).join("\n")
  const body = styles.match(/\.equipment-table-body\s*\{([^}]+)\}/)?.[1]
  assert.ok(body)
  assert.match(body, /display:\s*block/)
  assert.match(
    styles,
    /\.equipment-table-body > article\s*\{[^}]*height:\s*auto;[^}]*min-height:\s*92px/,
  )
  assert.doesNotMatch(body, /1fr/)
})

test("narrow viewports preserve column widths and keep pagination outside the table scroll", () => {
  const { descriptor, errors } = parse(
    readFileSync(new URL("./UnreportedView.vue", import.meta.url), "utf8"),
  )
  assert.deepEqual(errors, [])
  assert.match(descriptor.scriptSetup.content, /minmax\(\$\{column.width\}px, \$\{column.track\}\)/)
  assert.match(descriptor.scriptSetup.content, /tableMinimumWidth = computed/)
  assert.match(descriptor.template.content, /minWidth: tableMinimumWidth/)
  assert.match(descriptor.template.content, /aria-controls="unreported-filters"/)
  const find = (node, name) =>
    node.type === 1 &&
    node.props.some((prop) => prop.name === "class" && prop.value?.content.includes(name))
      ? node
      : (node.children || []).map((child) => find(child, name)).find(Boolean)
  const scroll = find(descriptor.template.ast, "equipment-table-scroll")
  assert.ok(scroll)
  assert.equal(find(scroll, "table-pagination"), undefined)
  assert.ok(find(descriptor.template.ast, "table-pagination"))
  assert.match(descriptor.styles[0].content, /max-width:\s*1279px/)
})

test("row actions stay centered on one line with a stable touch target", () => {
  const { descriptor } = parse(
    readFileSync(new URL("./UnreportedView.vue", import.meta.url), "utf8"),
  )
  assert.match(descriptor.template.content, /class="module-button row-action-button"/)
  const styles = descriptor.styles.map((style) => style.content).join("\n")
  const action = styles.match(/\.module-button\.row-action-button\s*\{([^}]+)\}/)[1]
  assert.match(action, /white-space:\s*nowrap/)
  assert.match(action, /height:\s*44px/)
  assert.match(action, /justify-content:\s*center/)
  assert.match(action, /padding:\s*0 12px/)
})

test("export preparation errors are caught and the exporting state is always reset", () => {
  const { descriptor } = parse(
    readFileSync(new URL("./UnreportedView.vue", import.meta.url), "utf8"),
  )
  const handler = descriptor.scriptSetup.content.match(
    /const exportExcel = async \(\) => \{([\s\S]*?)\nconst sourceEquipment/,
  )[1]
  assert.ok(
    handler.indexOf("try {") < handler.indexOf("prepareUnreportedExcelRows(equipmentToExport"),
  )
  assert.match(handler, /finally\s*\{\s*isExporting.value = false/)
  assert.doesNotMatch(handler, /row.diagnosis.reason/)
})
test("history has one entry point and equipment review only contains summary and consultations", () => {
  const { descriptor, errors } = parse(
    readFileSync(new URL("./UnreportedView.vue", import.meta.url), "utf8"),
  )
  assert.deepEqual(errors, [])
  assert.match(descriptor.scriptSetup.content, /id: "history", label: "Historial de desconexiones"/)
  assert.match(descriptor.scriptSetup.content, /groupHistoryEquipment\(/)
  assert.match(
    descriptor.scriptSetup.content,
    /buildUnreportedEquipment\(visibleAssets.value, accessibleCompanies.value\)/,
  )
  assert.doesNotMatch(descriptor.scriptSetup.content, /createDemoHistoryEquipment|const sourceRows/)
  assert.match(descriptor.template.content, /row.completedCount/)
  assert.doesNotMatch(descriptor.template.content, /row.interruptionCount/)
  assert.match(descriptor.template.content, /Actualmente sin reportar/)
  assert.match(descriptor.template.content, /Ver desconexiones/)
  assert.match(
    descriptor.template.content,
    /UnreportedHistoryDetail\s+v-if="selectedHistoryEquipment"/,
  )
  assert.match(descriptor.template.content, /@back="selectedHistoryKey = ''"/)
  assert.match(descriptor.scriptSetup.content, /key: "historyTotal"/)
  assert.match(descriptor.scriptSetup.content, /key: "historyLatest"/)
  assert.doesNotMatch(descriptor.template.content, /openOperation\(row, 'history'\)|Historial \(/)
  assert.doesNotMatch(descriptor.template.content, /:initial-tab=/)
  assert.match(descriptor.template.content, /Todo el historial/)
  assert.match(descriptor.template.content, /v-model="historyFrom"/)
  assert.match(descriptor.template.content, /v-model="historyTo"/)
  const pagination = descriptor.scriptSetup.content.slice(
    descriptor.scriptSetup.content.indexOf("useUnreportedPagination(filteredRows"),
  )
  assert.doesNotMatch(pagination, /\[selectedHistoryKey/)
  const modal = parse(
    readFileSync(
      new URL("../components/unreported/UnreportedOperationModal.vue", import.meta.url),
      "utf8",
    ),
  ).descriptor
  assert.doesNotMatch(modal.template.content, /Historial de desconexiones|activeTab === 'history'/)
  assert.match(modal.template.content, /Detalles del vehiculo/)
  assert.match(modal.template.content, /Consultas/)
})

test("refresh updates without a fixed delay, prevents overlap and reports its outcome", async () => {
  const { descriptor } = parse(
    readFileSync(new URL("./UnreportedView.vue", import.meta.url), "utf8"),
  )
  const body = descriptor.scriptSetup.content.match(
    /const refreshData = async \(\) => \{([\s\S]*?)\n\}\nconst filteredRows/,
  )[1]
  assert.doesNotMatch(body, /setTimeout|800/)
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
  let release,
    observed = 0,
    fail = false
  const isRefreshing = { value: false },
    flowError = { value: "Previous error" },
    flowNotice = { value: "Previous notice" }
  const refresh = new AsyncFunction(
    "isRefreshing",
    "flowError",
    "flowNotice",
    "nextTick",
    "observeReports",
    body,
  )
  const run = () =>
    refresh(
      isRefreshing,
      flowError,
      flowNotice,
      () =>
        new Promise((resolve) => {
          release = resolve
        }),
      () => {
        observed++
        if (fail) flowError.value = "No se pudo guardar"
      },
    )
  const pending = run()
  assert.equal(isRefreshing.value, true)
  assert.equal(flowError.value, "")
  assert.equal(flowNotice.value, "")
  await run()
  assert.equal(observed, 0)
  release()
  await pending
  assert.equal(observed, 1)
  assert.equal(isRefreshing.value, false)
  assert.equal(flowNotice.value, "Listado actualizado.")
  fail = true
  const failed = run()
  release()
  await failed
  assert.equal(isRefreshing.value, false)
  assert.equal(flowNotice.value, "")
  assert.equal(flowError.value, "No se pudo guardar")
  await assert.rejects(
    refresh(
      isRefreshing,
      flowError,
      flowNotice,
      async () => {},
      () => {
        throw new Error("Unexpected")
      },
    ),
  )
  assert.equal(isRefreshing.value, false)
})

test("current review scopes consultations and preserves legacy follow-up without visit inputs", () => {
  const modal = parse(
    readFileSync(
      new URL("../components/unreported/UnreportedOperationModal.vue", import.meta.url),
      "utf8",
    ),
  ).descriptor
  assert.match(modal.scriptSetup.content, /currentConsultations\(props.equipment\)/)
  assert.match(modal.template.content, /Consultas registradas/)
  assert.doesNotMatch(modal.template.content, /v-model="consultation.nextCallDate"|Llamar manana/)
  assert.doesNotMatch(modal.template.content, /Registrar visita realizada/)
  assert.doesNotMatch(modal.template.content, /v-model="consultation.visitDate"/)
  assert.match(modal.template.content, /call.visitResult/)
  const view = parse(
    readFileSync(new URL("./UnreportedView.vue", import.meta.url), "utf8"),
  ).descriptor
  assert.match(
    view.scriptSetup.content,
    /lastConsultation: currentConsultations\(record\).at\(-1\)/,
  )
  assert.match(view.template.content, /Llamada pendiente/)
})

test("review shows company contact from the shared authorized company catalog", () => {
  const view = parse(
    readFileSync(new URL("./UnreportedView.vue", import.meta.url), "utf8"),
  ).descriptor
  assert.match(view.scriptSetup.content, /useCompaniesService\(\)/)
  assert.match(view.scriptSetup.content, /equipmentContext.value.companies.includes\(company\)/)
  assert.match(view.template.content, /:company-contact="operationCompanyContact"/)
  const modal = parse(
    readFileSync(
      new URL("../components/unreported/UnreportedOperationModal.vue", import.meta.url),
      "utf8",
    ),
  ).descriptor
  assert.match(modal.template.content, /Sin contacto registrado/)
  assert.match(modal.template.content, /Sin telefono registrado/)
  assert.match(modal.template.content, /:href="companyContact.href"/)
})

test("simulation opens the recovered equipment after clearing history filters and watcher flush", () => {
  const { descriptor } = parse(
    readFileSync(new URL("./UnreportedView.vue", import.meta.url), "utf8"),
  )
  const handler = descriptor.scriptSetup.content.slice(
    descriptor.scriptSetup.content.indexOf("const simulateReport ="),
    descriptor.scriptSetup.content.indexOf("const saveConsultation ="),
  )
  assert.match(handler, /if \(!received\)/)
  assert.match(handler, /searchTerm.value = String\(row.imei\)/)
  assert.match(handler, /selectedCompany.value = row.company/)
  assert.match(handler, /historyPeriod.value = "all"/)
  assert.match(handler, /await nextTick\(\)/)
  assert.ok(
    handler.indexOf("await nextTick()") <
      handler.indexOf("selectedHistoryKey.value = equipmentKey(row)"),
  )
})

test("consultation form and both history views expose optional contacted person fields", () => {
  const modal = parse(
    readFileSync(
      new URL("../components/unreported/UnreportedOperationModal.vue", import.meta.url),
      "utf8",
    ),
  ).descriptor
  assert.match(modal.template.content, /v-model="consultation.contactedPerson"/)
  assert.match(modal.template.content, /v-model="consultation.contactedRole"/)
  assert.match(modal.template.content, /maxlength="100"/)
  assert.match(modal.template.content, /maxlength="80"/)
  assert.match(modal.template.content, /consultationContactLabel\(call\)/)
  const history = parse(
    readFileSync(
      new URL("../components/unreported/UnreportedHistoryDetail.vue", import.meta.url),
      "utf8",
    ),
  ).descriptor
  assert.match(history.template.content, /consultationContactLabel\(call\)/)
})

test("history counters do not request grouped details and search precedes episode processing", () => {
  const { descriptor } = parse(
    readFileSync(new URL("./UnreportedView.vue", import.meta.url), "utf8"),
  )
  const script = descriptor.scriptSetup.content
  const count = script.slice(
    script.indexOf("const sectionCounts ="),
    script.indexOf("const observeReports ="),
  )
  assert.match(count, /countHistoryEquipment\(/)
  assert.doesNotMatch(count, /historyRows.value|groupHistoryEquipment/)
  const history = script.slice(
    script.indexOf("const historyRows ="),
    script.indexOf("const sectionCounts ="),
  )
  assert.match(history, /if \(equipmentSection.value !== "history"\) return \[\]/)
  assert.ok(history.indexOf("filterHistoryEquipment(") < history.indexOf("groupHistoryEquipment("))
  const tracked = script.slice(
    script.indexOf("const trackedRows ="),
    script.indexOf("const historySourceRows ="),
  )
  assert.doesNotMatch(tracked, /interruptionSummary/)
})
