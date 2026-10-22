import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
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
    "Editar datos",
    "Renovar licencia",
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
  for (const label of ["Datos del conductor", "Licencia actual", "Historial de renovaciones"])
    assert.ok(descriptor.template.content.includes(label))
  assert.doesNotMatch(descriptor.scriptSetup.content, /store.addManagement|saveManagement/)
  assert.doesNotMatch(descriptor.template.content, /managements|Ultima gestion|Registrar llamada/)
  assert.match(descriptor.template.content, /colspan="5"/)
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
  assert.match(descriptor.template.content, /driver-license-thumbnail/)
  assert.match(descriptor.template.content, /filePreviews\[side.key\]/)
  assert.match(descriptor.scriptSetup.content, /watch\(files,/)
  assert.match(descriptor.template.content, /Cerrar imagen/)
  assert.match(descriptor.scriptSetup.content, /onCleanup/)
  assert.match(descriptor.template.content, /@cancel\.stop/)
  assert.doesNotMatch(descriptor.template.content, /driver-menu-trigger|driver-row-menu/)
  assert.doesNotMatch(descriptor.template.content, /companyChoices|changeCompany/)
  assert.doesNotMatch(descriptor.template.content, /Es una licencia renovada|renewalRequested/)
  assert.match(descriptor.template.content, /v-if="mode !== 'renew'"/)
  assert.match(descriptor.template.content, /v-if="mode !== 'edit'"/)
  assert.doesNotMatch(descriptor.template.content, /open\('edit', row\)/)
  assert.doesNotMatch(descriptor.template.content, /open\('renew', row\)/)
  assert.match(descriptor.template.content, /driver-license-summary/)
  assert.match(descriptor.template.content, /driver-profile-actions/)
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
