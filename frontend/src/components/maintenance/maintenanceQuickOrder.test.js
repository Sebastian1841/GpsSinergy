import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { parse, compileScript, compileTemplate } from "@vue/compiler-sfc"

test("client fleet filters do not expose company or vehicle type selectors", () => {
  const source = readFileSync(new URL('./MaintenanceFleetTab.vue', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /selectedCompany|selectedVehicleType/)
  assert.match(source, /Tipo de mantencion/)
  assert.match(source, /Fecha de vencimiento/)
})

test("redundant vehicle maintenance detail is removed and deletion remains available while editing", () => {
  const source = readFileSync(new URL('./MaintenanceActionModal.vue', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /modalType === 'maintenance-detail'|Mantenciones del vehiculo/)
  assert.match(source, /open-delete-maintenance-plan', editingMaintenancePlan/)
})

test("GPS summary displays selected historical reading instead of the current odometer", () => {
  const source = readFileSync(new URL("./MaintenanceActionModal.vue", import.meta.url), "utf8")
  assert.equal((source.match(/{{ maintenanceDisplayedReading }}/g) || []).length, 2)
  assert.equal((source.match(/{{ maintenanceDisplayedReadingTitle }}/g) || []).length, 2)
  assert.doesNotMatch(source, /<strong>{{ maintenanceGpsReading }}<\/strong>/)
  assert.match(source, /Sin lectura para esta fecha/)
})

test("configuration follows criterion and date, reading, target and warning without a duplicated plan name", () => {
  const source = readFileSync(new URL("./MaintenanceActionModal.vue", import.meta.url), "utf8")
  const step = source.slice(source.indexOf(`<template v-else-if="modalType === 'maintenance' && maintenanceWizardStep === 2">`), source.indexOf(`<template v-else-if="modalType === 'edit-maintenance'">`))
  const date = step.indexOf('v-model="draft.startDate"')
  const reading = step.indexOf('class="maintenance-gps-reading"')
  const target = step.indexOf('v-model="maintenanceScheduleValue"')
  const warning = step.indexOf('v-model="draft.alertValue"')
  assert.ok(date > 0 && date < reading && reading < target && target < warning)
  assert.doesNotMatch(step, /Nombre del plan/)
  assert.match(step, /<details class="maintenance-config-extra">/)
  assert.doesNotMatch(source, /Datos de prueba|isDemoHistory|historyPreview/)
})

test("new plan types are disabled without a valid vehicle and do not show a false configured label", () => {
  const source = readFileSync(new URL("./MaintenanceActionModal.vue", import.meta.url), "utf8")
  assert.match(source, /if \(!vehicleId \|\| !type \|\| !props\.maintenanceItems\.some\([^\n]+return true/)
  assert.match(source, /v-if="draft.vehicleId && isCreateMaintenanceTypeDisabled\(type\)"/)
  assert.match(source, /active: draft.type === type && !isCreateMaintenanceTypeDisabled\(type\)/)
  assert.match(source, /if \(props.modalType === 'maintenance' && isCreateMaintenanceTypeDisabled\(type\)\) return/)
})

test("new plan type list shows criterion but not a fixed interval", () => {
  const source = readFileSync(new URL("./MaintenanceActionModal.vue", import.meta.url), "utf8")
  const list = source.slice(source.indexOf('<div class="maintenance-create-types">'), source.indexOf('<template v-else-if="modalType === \'maintenance\' && maintenanceWizardStep === 3">'))
  assert.match(list, /<strong>{{ type }}<\/strong\s*>/)
  assert.match(list, /Ya configurada/)
  assert.match(list, /getMaintenanceTypeCriterionLabel\(type\)/)
  assert.doesNotMatch(list, /getMaintenanceTypeInterval/)
  assert.match(source, /<select v-model="draft.readingSourceLabel" @change="prefillMaintenanceGpsReading">/)
  assert.match(source, /v-model="maintenanceScheduleValue"/)
  assert.match(source, /v-model="maintenanceScheduleValue"[^>]+required/)
  assert.match(source, /Fecha de la proxima mantencion/)
  assert.doesNotMatch(source, /Cada \(dias\)/)
  assert.match(source, /Proxima mantencion a las \(horas\)/)
  assert.doesNotMatch(source, /Cada \(horas\)/)
  assert.match(source, /!isMaintenanceTargetValid/)
  assert.match(source, /maintenanceWizardStep.value > 1 && !isMaintenanceTargetValid.value/)
  assert.doesNotMatch(source, /Cada \(km\)/)
  assert.match(source, /v-model="draft.alertValue"/)
})

test("new OT uses three steps with optional costs and notes in confirmation and compiles", () => {
  const source = readFileSync(new URL("./MaintenanceActionModal.vue", import.meta.url), "utf8")
  const section = source.slice(source.indexOf(`<template v-else-if="modalType === 'create-order'">`), source.indexOf(`<template v-else-if="modalType === 'edit-order'">`))
  for (const key of ["vehicleId", "maintenancePlanId", "plannedStartDate", "owner", "workshop", "priority", "job", "scheduledDate", "description", "observations", "estimatedLabor", "estimatedParts", "estimatedOther"]) assert.ok(section.includes(`draft.${key}`))
  assert.match(section, /orderWizardStep === 1/)
  assert.match(section, /orderWizardStep === 2/)
  assert.match(section, /v-if="orderCreationContext"/)
  assert.match(section, /order-wizard-summary/)
  assert.match(source, /\["maintenance", "create-order", "close-order"\]\.includes\(props.modalType\)/)
  const styles = readFileSync(new URL('./maintenance.css', import.meta.url), 'utf8')
  assert.match(styles, /\.order-wizard-main \{[^}]*background: #fff/)
  assert.match(styles, /\.order-wizard-layout \{[^}]*grid-template-columns: 250px/)
  assert.doesNotMatch(styles, /\.work-order-create-shell > header \{[^}]*background: #fff/)
  assert.match(section, /<details class="order-wizard-optional">/)
  assert.match(source, /else emit\('submit'\)/)
  assert.match(source, /orderWizardError.value\) return/)
  const { descriptor } = parse(source)
  const script = compileScript(descriptor, { id: "quick-order" })
  const result = compileTemplate({ source: descriptor.template.content, filename: "MaintenanceActionModal.vue", id: "quick-order", compilerOptions: { bindingMetadata: script.bindings } })
  assert.deepEqual(result.errors, [])
})
