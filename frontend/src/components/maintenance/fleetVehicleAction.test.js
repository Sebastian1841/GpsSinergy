import assert from "node:assert/strict"
import test from "node:test"
import { readFileSync } from "node:fs"
import { computed, ref } from "vue"
import { getFleetVehicleAction, getFleetPlanSummary } from "./fleetVehicleAction.js"

test("empty vehicles configure a plan while healthy plans remain available for consultation", () => {
  assert.deepEqual(getFleetVehicleAction([]), {
    label: "Configurar mantencion",
    mode: "configure",
    attention: false,
  })
  const plans = Object.freeze([Object.freeze({ id: "one", status: "current" })])
  assert.deepEqual(getFleetVehicleAction(plans), {
    label: "Ver planes",
    mode: "expand",
    attention: false,
  })
})

test("summary separates actionable plans from open work and renewals", () => {
  assert.deepEqual(getFleetPlanSummary([
    { status: "due" }, { status: "overdue" },
    { status: "overdue", order: { id: "one", status: "scheduled" } },
    { status: "current", order: { id: "two", status: "waiting" } },
    { status: "renewal-pending", orderState: "pending-renewal" },
    { status: "unconfigured" }, { status: "current" },
  ]), { withoutOrder: 2, withOpenOrder: 2, renewal: 1, unconfigured: 1 })
})

test("pending counts include due work without OT and use singular/plural labels", () => {
  assert.equal(getFleetVehicleAction([{ status: "overdue" }]).label, "Revisar 1 pendiente")
  const plans = [{ status: "due" }, { status: "overdue" }, { status: "current" }]
  assert.deepEqual(getFleetVehicleAction(plans), {
    label: "Revisar 2 pendientes",
    mode: "expand",
    attention: true,
  })
})

test("open orders are not counted as work needing a new OT and describe the actual work state", () => {
  const plan = (id, status) => ({ status: "overdue", order: { id, status } })
  assert.equal(getFleetVehicleAction([plan("A", "scheduled")]).label, "Ver OT programada")
  assert.equal(getFleetVehicleAction([plan("A", "in-progress")]).label, "Ver trabajo en curso")
  assert.equal(getFleetVehicleAction([plan("A", "waiting")]).label, "Ver trabajo en espera")
  assert.equal(
    getFleetVehicleAction([plan("A", "scheduled"), plan("B", "scheduled")]).label,
    "Ver 2 OT",
  )
  assert.equal(
    getFleetVehicleAction([plan("A", "waiting"), plan("B", "in-progress")]).label,
    "Ver 2 OT",
  )
  assert.equal(
    getFleetVehicleAction([plan("A", "scheduled"), plan("A", "scheduled")]).label,
    "Ver OT programada",
  )
  assert.equal(getFleetVehicleAction([plan("A", "scheduled")]).attention, false)
})

test("renewals and mixed pending plans never pick one plan as the implicit target", () => {
  const pending = { orderState: "pending-renewal", status: "renewal-pending" }
  assert.equal(getFleetVehicleAction([pending]).label, "Revisar renovacion")
  assert.equal(getFleetVehicleAction([pending, { ...pending }]).label, "Revisar 2 renovaciones")
  assert.deepEqual(
    getFleetVehicleAction([
      pending,
      { status: "due" },
      { status: "overdue", order: { id: "active", status: "in-progress" } },
    ]),
    { label: "Revisar 2 pendientes", mode: "expand", attention: true },
  )
  assert.deepEqual(getFleetVehicleAction([{ status: "unconfigured" }]), {
    label: "Revisar configuracion",
    mode: "expand",
    attention: true,
  })
})

test("terminal orders do not hide a new pending maintenance", () => {
  for (const status of ["finished", "cancelled"]) {
    assert.equal(
      getFleetVehicleAction([{ status: "due", order: { id: "old", status } }]).label,
      "Revisar 1 pendiente",
    )
  }
})

test("row action updates when work is created, started, closed and renewed", () => {
  const plans = ref([{ status: "due" }])
  const action = computed(() => getFleetVehicleAction(plans.value))
  assert.equal(action.value.label, "Revisar 1 pendiente")
  plans.value[0].order = { id: "A", status: "scheduled" }
  assert.equal(action.value.label, "Ver OT programada")
  plans.value[0].order.status = "in-progress"
  assert.equal(action.value.label, "Ver trabajo en curso")
  plans.value[0] = { status: "renewal-pending", orderState: "pending-renewal" }
  assert.equal(action.value.label, "Revisar renovacion")
  plans.value[0] = { status: "current" }
  assert.equal(action.value.label, "Ver planes")
})

test("fleet row only toggles plans and keeps exact per-plan actions", () => {
  const source = readFileSync(new URL("./MaintenanceFleetTab.vue", import.meta.url), "utf8")
  assert.match(source, /@click="toggleVehiclePlans\(item.id\)"/)
  assert.doesNotMatch(source, /getFleetVehicleAction|runVehicleAction|Continuar OT|Ver detalle completo/)
  assert.match(source, /emit\('open-vehicle-maintenance-plans', item.id, plan.id\)/)
  assert.match(source, /columnKey === 'actions' \|\|/)
  assert.match(source, /@click="runPlanAction\(item, plan\)"/)
})

test("a unique open OT opens directly, duplicates deduplicate, and pending decisions retain expansion", () => {
  const order = { id: "OT-1", status: "scheduled" }
  const plan = { status: "due", order }
  assert.deepEqual(getFleetVehicleAction([plan, { ...plan }]), {
    label: "Ver OT programada", mode: "order", orderId: "OT-1", attention: false,
  })
  assert.deepEqual(getFleetVehicleAction([plan, { status: "due", order: { id: "OT-2", status: "waiting" } }]), {
    label: "Ver 2 OT", mode: "expand", attention: false,
  })
  const mixed = getFleetVehicleAction([plan, { status: "overdue" }])
  assert.equal(mixed.mode, "expand")
  assert.equal(mixed.label, "Revisar 1 pendiente")
  assert.equal(mixed.orderId, undefined)
})
