import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { runInNewContext } from "node:vm"
import { lastDriverRenewalDate } from '../../utils/maintenance/driverLicenseUtils.js'
import { parse, compileScript, compileTemplate } from "@vue/compiler-sfc"
import { MAINTENANCE_TABS } from "../../utils/maintenance/maintenanceModuleConfig.js"

test("maintenance includes a ready, company-keyed drivers tab without a loading placeholder", () => {
  assert.ok(MAINTENANCE_TABS.some((tab) => tab.id === "drivers" && tab.label === "Conductores"))
  const { descriptor } = parse(
    readFileSync(new URL("../../views/MaintenanceView.vue", import.meta.url), "utf8"),
  )
  assert.match(descriptor.template.content, /activeTab !== 'drivers'/)
  assert.match(descriptor.template.content, /v-if="activeTab === 'drivers'"/)
  assert.match(descriptor.template.content, /<KeepAlive :max="1">/)
  assert.match(
    descriptor.template.content,
    /:company-id="String\(route.params.empresaId \|\| ''\)"/,
  )
  assert.match(descriptor.scriptSetup.content, /import MaintenanceDriversTab from/)
  assert.match(descriptor.scriptSetup.content, /import MaintenanceWorkOrdersTab from/)
  assert.doesNotMatch(
    descriptor.scriptSetup.content,
    /MaintenanceWorkOrdersTab = asyncMaintenanceTab/,
  )
  assert.doesNotMatch(descriptor.scriptSetup.content, /MaintenanceDriversTab = asyncMaintenanceTab/)
  assert.match(descriptor.scriptSetup.content, /loadingComponent: MaintenanceTabLoading/)
  assert.match(descriptor.scriptSetup.content, /import MaintenanceCostsTab from/)
  assert.match(descriptor.scriptSetup.content, /import MaintenanceOverviewTab from/)
  assert.doesNotMatch(descriptor.scriptSetup.content, /MaintenanceCostsTab = asyncMaintenanceTab/)
})

test("driver screen compiles and exposes company-scoped CRUD, renewals, photos and filters", () => {
  const { descriptor, errors } = parse(
    readFileSync(new URL("./MaintenanceDriversTab.vue", import.meta.url), "utf8"),
  )
  assert.deepEqual(errors, [])
  const script = compileScript(descriptor, { id: "drivers" })
  assert.deepEqual(
    compileTemplate({
      source: descriptor.template.content,
      filename: "MaintenanceDriversTab.vue",
      id: "drivers",
      compilerOptions: { bindingMetadata: script.bindings },
    }).errors,
    [],
  )
  for (const text of [
    "Agregar conductor",
    "Exportar",
    "Excel (.xlsx)",
    "PDF (.pdf)",
    "Historial de renovaciones",
    "Pagina siguiente",
    "Buscar conductor o RUT",
  ])
    assert.ok(descriptor.template.content.includes(text))
  assert.match(descriptor.scriptSetup.content, /maintenance-plans/)
  assert.match(descriptor.scriptSetup.content, /repository: createDriverLicenseRepository/)
  assert.match(descriptor.scriptSetup.content, /await store.save\(payload/)
  assert.match(descriptor.scriptSetup.content, /await store.load\(\)/)
  assert.match(descriptor.scriptSetup.content, /saveMaintenanceEvidenceFile/)
  assert.match(descriptor.scriptSetup.content, /URL.revokeObjectURL/)
  assert.match(descriptor.scriptSetup.content, /Promise.allSettled/)
  assert.match(descriptor.template.content, /Confirmar nueva licencia/)
  assert.match(descriptor.template.content, /<DriverCurrentLicense/)
  assert.match(descriptor.template.content, /Historial de renovaciones/)
  assert.match(descriptor.scriptSetup.content, /await store.addManagement/)
  assert.doesNotMatch(descriptor.template.content, /Ultima gestion|Registrar llamada/)
  assert.match(descriptor.template.content, /Seguimiento de la licencia anterior/)
  assert.match(descriptor.template.content, /colspan="8"/)
  assert.match(descriptor.scriptSetup.content, /renewalConfirmation.value = true/)
  assert.match(descriptor.scriptSetup.content, /useDebouncedValue\(search, 120\)/)
  assert.match(descriptor.scriptSetup.content, /onDeactivated/)
  assert.match(descriptor.scriptSetup.content, /if \(!active\) activate\(\)/)
  assert.match(descriptor.scriptSetup.content, /!alive \|\| !active/)
  assert.match(descriptor.scriptSetup.content, /revision !== formRevision/)
  assert.match(descriptor.template.content, /counts\[option.key\]/)
  assert.match(descriptor.scriptSetup.content, /historySection = ref\("current"\)/)
  assert.match(descriptor.template.content, /v-if="historySection === 'current'"/)
  assert.doesNotMatch(descriptor.template.content, /Último contacto por esta licencia/)
  assert.match(descriptor.template.content, /v-model="pageSizeChoice"/)
  assert.match(descriptor.template.content, /option value="auto"/)
  assert.match(descriptor.scriptSetup.content, /pageSizeChoice = ref\("auto"\)/)
  assert.match(descriptor.scriptSetup.content, /ResizeObserver/)
  assert.match(descriptor.template.content, /size in \[5, 10, 20, 50\]/)
  assert.match(descriptor.template.content, /@cancel\.self\.prevent=/)
  assert.match(descriptor.template.content, /:thumbnails="photoThumbnails"/)
  assert.match(descriptor.template.content, /filePreviews\[side.key\]/)
  assert.match(descriptor.scriptSetup.content, /watch\(files,/)
  assert.match(descriptor.template.content, /Cerrar imagen/)
  assert.match(descriptor.scriptSetup.content, /onCleanup/)
  assert.match(descriptor.template.content, /@cancel\.stop/)
  assert.doesNotMatch(descriptor.template.content, /driver-menu-trigger|driver-row-menu/)
  assert.doesNotMatch(descriptor.template.content, /companyChoices|changeCompany/)
  assert.doesNotMatch(descriptor.template.content, /Es una licencia renovada|renewalRequested/)
  assert.match(descriptor.template.content, /v-if="mode !== 'renew'"/)
  assert.match(descriptor.template.content, /v-if="isEditing && licenseCorrectionNeeded"/)
  assert.doesNotMatch(descriptor.template.content, /open\('edit', row\)/)
  assert.match(descriptor.template.content, /v-if="canEdit && row.state.key !== 'unknown'"/)
  assert.match(descriptor.template.content, /@click="open\('renew', row\)"/)
  assert.doesNotMatch(descriptor.template.content, /driver-license-summary|driver-profile-actions/)
  assert.match(descriptor.template.content, /Nuevo vencimiento/)
  assert.match(
    descriptor.scriptSetup.content,
    /isRenewal = computed\(\(\) => mode.value === "renew"\)/,
  )
  assert.match(descriptor.scriptSetup.content, /const renewal = isRenewal.value/)
  assert.doesNotMatch(descriptor.template.content, /@click="reload"/)
  assert.match(descriptor.scriptSetup.content, /exporter\(rows/)
  assert.match(descriptor.scriptSetup.content, /driverLicensePdfExport/)
})

test("license layout groups header, filters and compact table like the reference", () => {
  const source = readFileSync(new URL("./MaintenanceDriversTab.vue", import.meta.url), "utf8")
  assert.match(source, /class="drivers-controls"/)
  const header = source.indexOf('class="drivers-list-header"')
  const filters = source.indexOf('class="driver-filters"')
  const states = source.indexOf('class="driver-status-filter"')
  const table = source.indexOf('ref="tableViewport"')
  assert.ok(header < filters && filters < states && states < table)
  assert.match(source, /const states = DRIVER_LICENSE_FILTERS/)
  assert.match(source, /aria-label="Filtrar licencias por vencimiento"/)
  assert.doesNotMatch(source, /<nav class="driver-states"/)
  assert.match(source, /class="driver-history-table"/)
  assert.doesNotMatch(source, /renewalPickerOpen|renewableDrivers|driver-renewal-control|driver-renewal-picker/)
  assert.match(source, /@click="open\('renew', row\)"/)
  assert.match(source, /flex: 0 1 auto/)
  assert.match(source, /th:last-child\s*\{\s*width: 360px/)
  assert.match(source, /class="driver-action-buttons"/)
  assert.match(source, /target === "renew" &&\s+licenseState\(row\?\.expiresAt, driverToday\(\)\).key === 'unknown'/)
})

test("license reference layout exposes renewal dates and direct renewal history without inventing records", () => {
  const source = readFileSync(new URL("./MaintenanceDriversTab.vue", import.meta.url), "utf8")
  for (const label of ["Licencias de conducir", "Dias restantes", "Ultima renovacion", "Registrar renovacion"])
    assert.ok(source.includes(label))
  assert.match(source, /@click="openHistory\(row\)"/)
  assert.match(source, /selectDetailTab\('renewals'\)/)
  const body = source.match(/const latestRenewalLabel = \(row\) => \{([\s\S]*?)\n\}/)[1]
  const label = new Function('licenseDateLabel', 'lastDriverRenewalDate', `return (row) => {${body}}`)((value) => value, lastDriverRenewalDate)
  assert.equal(label({ history: [] }), '-')
  const row = { history: [{ renewedAt: '2026-11-11T12:00:00Z' }, { renewedAt: '2022-01-01T12:00:00Z' }] }
  assert.equal(label(row), '2026-11-11')
  assert.equal(row.history[0].renewedAt, '2026-11-11T12:00:00Z')
})

test("reference panels are separate renewal and history dialogs with driver summaries", () => {
  const source = readFileSync(new URL("./MaintenanceDriversTab.vue", import.meta.url), "utf8")
  assert.match(source, /'driver-renew-dialog': mode === 'renew'/)
  assert.match(source, /'driver-renew-history-dialog': mode === 'detail' && historySection === 'renewals'/)
  assert.match(source, /class="driver-reference-summary"/)
  for (const field of ['draft.renewedOn', 'draft.expiresAt', 'draft.notes']) assert.ok(source.includes(`v-model="${field}"`))
  assert.match(source, /accept="application\/pdf,image\/jpeg,image\/png"/)
  assert.match(source, /@click="downloadReceipt\(entry.receipt\)"/)
  assert.match(source, /<DriverCurrentLicense v-if="historySection === 'current'"/)
})

test("license table shows an explicit view action and the driver name is plain text", () => {
  const source = readFileSync(new URL("./MaintenanceDriversTab.vue", import.meta.url), "utf8")
  const template = source.split('<template>')[1].split('<Teleport')[0]
  assert.equal((template.match(/<col style=/g) || []).length, 8)
  assert.doesNotMatch(template, /driver-detail-icon|ellipsis|three-dots/)
  assert.doesNotMatch(template, /driver-name-link/)
  assert.match(template, /<strong class="driver-name">\{\{ row.name \}\}<\/strong>/)
  assert.match(template, /class="driver-view-button"[^>]*@click="open\('detail', row\)"/)
  assert.match(template, />Ver licencia<\/button>/)
  assert.match(template, /class="driver-renew-button"/)
  assert.match(template, /class="driver-history-button"/)
  assert.match(source, /\.driver-license-table \.driver-action-buttons \{ flex-wrap: nowrap/)
  assert.match(source, /\.driver-license-table \.driver-state \{[^}]*white-space: nowrap/)
})

test("requested demo drivers load only in development for the designated companies with edit access", () => {
  const source = readFileSync(new URL("./MaintenanceDriversTab.vue", import.meta.url), "utf8")
  assert.match(source, /import.meta.env.DEV && canEdit.value && \/schuck\|\^transportes\\s\+san\\s\+pedro\$\/i.test\(props.companyName.trim\(\)\)/)
  assert.match(source, /await seedDriverLicenseDemo\(store, today.value/)
})

test("renewal form updates both license photos and history keeps photos accessible alongside receipts", () => {
  const source = readFileSync(new URL("./MaintenanceDriversTab.vue", import.meta.url), "utf8")
  const renewalForm = source.split('<div v-if="isRenewal" class="driver-reference-form">')[1].split('<template v-else>')[0]
  assert.match(renewalForm, /v-for="side in sides"/)
  assert.match(renewalForm, /@change="selectFile\(side.key, \$event\)"/)
  assert.match(renewalForm, /filePreviews\[side.key\]/)
  assert.match(source, /<template v-if="entry.displayedLicense.photos\?\.front \|\| entry.displayedLicense.photos\?\.back">/)
  const photos = renewalForm.indexOf('class="driver-renewal-photos"')
  const receipt = renewalForm.indexOf('class="driver-renewal-receipt"')
  const notes = renewalForm.indexOf('class="driver-reference-notes"')
  assert.ok(photos >= 0 && photos < receipt && receipt < notes)
  assert.match(renewalForm, /class="driver-renewal-photo-grid"/)
  assert.match(renewalForm, /Comprobante adicional/)
})

test("renewal warns about missing new photos, supports removal and separates prior documents", () => {
  const source = readFileSync(new URL("./MaintenanceDriversTab.vue", import.meta.url), "utf8")
  assert.match(source, /@click="removePhoto\(side.key\)"/)
  assert.match(source, /v-if="missingRenewalPhotos.length" class="driver-photo-warning" role="alert"/)
  assert.match(source, /validateDriverRenewalDetails\(renewalDetails, payload.expiresAt, driverToday\(\), selected.value\)/)
  assert.match(source, /getDriverRenewalLicense\(entry, selected.value\)/)
  assert.match(source, /<summary>Licencia anterior<\/summary>/)
  assert.match(source, /showPhoto\(entry.displayedLicense.photos\[side.key\], entry.displayedLicense.photos, side.key\)/)
  const body = source.match(/const removePhoto = \(side\) => \{([\s\S]*?)\n\}/)[1]
  const busy = { value: false }
  const files = { value: { front: { name: 'front.png' }, back: { name: 'back.png' }, receipt: { name: 'receipt.pdf' } } }
  const confirmation = { value: true }
  const removePhoto = new Function('busy', 'files', 'renewalConfirmation', `return (side) => {${body}}`)(busy, files, confirmation)
  removePhoto('front')
  assert.equal(files.value.front, undefined)
  assert.equal(files.value.back.name, 'back.png')
  assert.equal(files.value.receipt.name, 'receipt.pdf')
  assert.equal(confirmation.value, false)
  busy.value = true
  removePhoto('back')
  assert.equal(files.value.back.name, 'back.png')
})

test("complete renewals save directly; incomplete photos ask once before uploading or saving", async () => {
  const source = readFileSync(new URL('./MaintenanceDriversTab.vue', import.meta.url), 'utf8')
  const body = source.match(/const save = async \(\) => \{([\s\S]*?)\n\}\nconst saveManagement/)[1]
  const makeFlow = (photoFiles, validationError = '') => {
    const calls = { uploaded: [], saved: [], closed: 0 }
    const context = {
      busy: { value: false }, formRevision: 1,
      currentUser: { value: { id: 'operator' } }, isRenewal: { value: true },
      selected: { value: { id: 'driver' } },
      editorFromDetail: { value: false }, licenseCorrectionNeeded: { value: false },
      draft: { value: { expiresAt: '2030-11-12', renewedOn: '2026-11-12', notes: '' } },
      files: { value: photoFiles },
      missingRenewalPhotos: { value: ['front', 'back'].filter((side) => !photoFiles[side]) },
      renewalConfirmation: { value: false }, dialogError: { value: '' }, error: { value: '' },
      normalizeDriverLicense: (draft) => draft,
      validateDriverRenewal: () => { if (validationError) throw new Error(validationError) },
      validateDriverRenewalDetails: () => {}, driverToday: () => '2026-11-12',
      saveMaintenanceEvidenceFile: async (file) => { calls.uploaded.push(file.name); return { storageId: file.name } },
      deleteMaintenanceEvidence: async () => {},
      sides: [{ key: 'front' }, { key: 'back' }], alive: true, active: true,
      store: { save: async (...args) => calls.saved.push(args) },
      close: () => { calls.closed++ },
    }
    return { calls, context, save: runInNewContext(`(async () => {${body}})`, context) }
  }
  const full = makeFlow({ front: { name: 'front.jpg' }, back: { name: 'back.jpg' } })
  await full.save()
  assert.equal(full.calls.saved.length, 1)
  assert.equal(full.calls.uploaded.length, 2)
  assert.equal(full.context.renewalConfirmation.value, false)
  assert.equal(full.calls.closed, 1)
  const fromDetail = makeFlow({ front: { name: 'front.jpg' }, back: { name: 'back.jpg' } })
  fromDetail.context.editorFromDetail.value = true
  fromDetail.context.store.records = { value: [{ id: 'driver', expiresAt: '2030-11-12' }] }
  let returnedMode = ''
  fromDetail.context.open = async (mode, row) => { returnedMode = mode; assert.equal(row.expiresAt, '2030-11-12') }
  await fromDetail.save()
  assert.equal(returnedMode, 'detail')
  assert.equal(fromDetail.calls.closed, 0)
  for (const files of [{}, { front: { name: 'front.jpg' } }]) {
    const flow = makeFlow(files)
    await flow.save()
    assert.equal(flow.context.renewalConfirmation.value, true)
    assert.equal(flow.calls.saved.length, 0)
    assert.equal(flow.calls.uploaded.length, 0)
    assert.equal(flow.context.busy.value, false)
    await flow.save()
    assert.equal(flow.calls.saved.length, 1)
    assert.equal(flow.calls.uploaded.length, Object.keys(files).length)
    assert.equal(flow.calls.closed, 1)
  }
  const invalid = makeFlow({ front: { name: 'front.jpg' }, back: { name: 'back.jpg' } }, 'Fecha invalida')
  await invalid.save()
  assert.equal(invalid.calls.saved.length, 0)
  assert.equal(invalid.calls.uploaded.length, 0)
  assert.equal(invalid.context.dialogError.value, 'Fecha invalida')
  const invalidCorrection = makeFlow({ front: { name: 'front.jpg' } })
  invalidCorrection.context.isRenewal.value = false
  invalidCorrection.context.licenseCorrectionNeeded.value = true
  invalidCorrection.context.draft.value.correctionReason = 'Fecha incorrecta'
  invalidCorrection.context.validateDriverLicenseCorrection = () => { throw new Error('Vencimiento anterior a renovacion') }
  await invalidCorrection.save()
  assert.equal(invalidCorrection.calls.uploaded.length, 0)
  assert.equal(invalidCorrection.calls.saved.length, 0)
  assert.equal(invalidCorrection.context.dialogError.value, 'Vencimiento anterior a renovacion')
  assert.match(source, /Guardar con fotos pendientes/)
})

test('management persists through the existing company store and respects view/edit access', async () => {
  const source = readFileSync(new URL('./MaintenanceDriversTab.vue', import.meta.url), 'utf8')
  const body = source.match(/const saveManagement = async \(\) => \{([\s\S]*?)\n\}\nconst refreshLicenseAlerts/)[1]
  const saved = []
  let closed = 0
  const context = {
    busy: { value: false }, canEdit: { value: true }, selected: { value: { id: 'driver' } },
    formRevision: 1, currentUser: { value: { id: 'operator' } },
    draft: { value: { result: 'appointment', appointmentDate: '2026-11-20', observation: 'Hora confirmada' } },
    dialogError: { value: '' }, alive: true, active: true,
    store: { records: { value: [] }, addManagement: async (...args) => saved.push(args) }, close: () => { closed++ },
  }
  const save = runInNewContext(`(async () => {${body}})`, context)
  await save()
  assert.equal(saved.length, 1)
  assert.equal(saved[0][0], 'driver')
  assert.equal(saved[0][1].appointmentDate, '2026-11-20')
  assert.equal(closed, 1)
  context.canEdit.value = false
  await save()
  assert.equal(saved.length, 1)
  context.canEdit.value = true
  context.store.addManagement = async () => { throw new Error('Fecha invalida') }
  await save()
  assert.equal(context.dialogError.value, 'Fecha invalida')
  assert.equal(closed, 1)
  assert.equal(context.busy.value, false)
  assert.match(source, /v-model="draft.warningDays"/)
  assert.doesNotMatch(source, /v-model="managementFilter"|data-label="Seguimiento"/)
  assert.match(source, /tracker.markShown\(fresh\)/)
  assert.match(source, /watch\(\[records, today, driversLoaded\]/)
})

test('floating alerts filter the table instead of opening another modal', () => {
  const source = readFileSync(new URL('./MaintenanceDriversTab.vue', import.meta.url), 'utf8')
  const refreshBody = source.match(/const refreshLicenseAlerts = \(\) => \{([\s\S]*?)\n\}\nconst reviewLicenseAlerts/)[1]
  let shown = false
  const alert = { key: 'key', driverId: 'driver' }
  const tracker = { unshown: () => shown ? [] : [alert], markShown: () => { shown = true } }
  const context = { alive: true, active: true, canView: { value: true }, driversLoaded: { value: true }, currentUser: { value: { id: 'user' } }, props: { companyId: 'company' }, storage: {}, records: { value: [] }, today: { value: '2026-11-12' }, error: { value: '' }, licenseAlerts: { value: [] }, buildDriverLicenseAlerts: () => [alert], createDriverLicenseAlertTracker: () => tracker }
  const refresh = runInNewContext(`(() => {${refreshBody}})`, context)
  refresh()
  assert.equal(shown, true)
  context.licenseAlerts.value = []
  refresh()
  assert.equal(context.licenseAlerts.value.length, 0)
  context.search = { value: 'Juan' }; context.status = { value: 'valid' }; context.licenseClass = { value: 'A4' }; context.page = { value: 3 }; context.sortKey = { value: 'name' }; context.sortDirection = { value: 'desc' }
  const clearBody = source.match(/const clearFilters = \(\) => \{([\s\S]*?)\n\}/)[1]
  context.clearFilters = runInNewContext(`(() => {${clearBody}})`, context)
  const reviewBody = source.match(/const reviewLicenseAlerts = \(\) => \{([\s\S]*?)\n\}/)[1]
  runInNewContext(`(() => {${reviewBody}})`, context)()
  assert.equal(context.status.value, 'attention')
  assert.equal(context.licenseClass.value, 'all')
  assert.equal(context.search.value, '')
  assert.equal(context.page.value, 1)
  assert.doesNotMatch(source, /Avisos pendientes|mode === 'alerts'|driver-attention-summary|managementFilter|pendingLicenseAlerts/)
})

test('renewal inherits notification settings and groups optional fields', () => {
  const source = readFileSync(new URL('./MaintenanceDriversTab.vue', import.meta.url), 'utf8')
  const renewalForm = source.slice(source.indexOf('<div v-if="isRenewal" class="driver-reference-form">'), source.indexOf('<template v-else>'))
  assert.doesNotMatch(renewalForm, /DriverLicenseNotificationsFields|draft.warningDays/)
  assert.match(renewalForm, /<details class="driver-renewal-additional">/)
  assert.match(source, /notifications: normalizeDriverLicenseNotifications\(row.notifications\)/)
})

test('renewal history scopes archived follow-up to the previous license', () => {
  const source = readFileSync(new URL('./MaintenanceDriversTab.vue', import.meta.url), 'utf8')
  const expression = source.match(/const renewalHistory = computed\(\(\) => (.*)\)\n/)[1]
  const selected = { value: { history: [{ id: 'h1', licenseId: 'old' }, { id: 'h2', licenseId: 'other' }], managements: [{ id: 'm1', licenseId: 'old' }, { id: 'm2', licenseId: 'current' }] } }
  const rows = runInNewContext(expression, { selected, getDriverRenewalLicense: () => ({}) })
  assert.equal(rows[0].managements.length, 0)
  assert.equal(rows[1].managements.length, 1)
  assert.equal(rows[1].managements[0].id, 'm1')
  assert.equal(selected.value.history[0].id, 'h1')
})

test('license view and renewal share the compact shell', () => {
  const source = readFileSync(new URL('./MaintenanceDriversTab.vue', import.meta.url), 'utf8')
  assert.match(source, /'driver-reference-dialog': mode !== 'create'/)
  assert.match(source, /\.driver-dialog\.driver-renew-dialog, \.driver-dialog\.driver-current-dialog \{ width: min\(800px/)
  assert.match(source, /v-model="draft.confirmCorrection" type="checkbox" required/)
  assert.match(source, /:disabled="busy \|\| !draft.result \|\| !managementChanged"/)

})

test('editing and management are sections of current license, never separate modal modes', async () => {
  const source = readFileSync(new URL('./MaintenanceDriversTab.vue', import.meta.url), 'utf8')
  const body = source.match(/const open = async \(target, row = null\) => \{([\s\S]*?)\n\}\nconst setRut/)[1]
  const context = {
    busy: { value: false }, active: true, alive: true, canView: { value: true }, canEdit: { value: true },
    mode: { value: '' }, currentSection: { value: 'view' }, editorFromDetail: { value: false },
    formRevision: 0, clearPreview() {}, dialogError: { value: '' }, files: { value: {} },
    selected: { value: null }, renewalConfirmation: { value: false }, historySection: { value: 'current' }, draft: { value: {} },
    driverToday: () => '2026-11-12', driverManagementStatus: () => ({ result: '', appointmentDate: '' }), normalizeDriverLicenseNotifications: () => ({}),
    today: { value: '2026-11-12' }, nextTick: async () => {}, dialog: { value: null }, licenseState: () => ({ key: 'valid' }),
  }
  const open = runInNewContext(`(async (target, row = null) => {${body}})`, context)
  const driver = { id: 'driver', name: 'Juan', rut: '12345678-K', classes: ['B'], expiresAt: '2030-01-01' }
  for (const section of ['edit', 'management']) {
    await open(section, driver)
    assert.equal(context.mode.value, 'detail')
    assert.equal(context.currentSection.value, section)
  }
  await open('detail', driver)
  assert.equal(context.currentSection.value, 'view')
  context.canEdit.value = false
  await open('edit', driver)
  assert.equal(context.currentSection.value, 'view')
  await open('management', driver)
  assert.equal(context.mode.value, 'detail')
  assert.equal(context.currentSection.value, 'management')
  await open('alerts', driver)
  assert.equal(context.mode.value, 'detail')
  assert.equal(context.currentSection.value, 'management')
  assert.doesNotMatch(source, /mode === 'management'|mode === 'edit'|driver-profile-dialog|Conductor y licencia/)
})
