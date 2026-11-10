import assert from "node:assert/strict"
import test from "node:test"

import { ref } from "vue"
import { readFileSync } from "node:fs"
import {
  createEmptyPlannedRoute,
  createPlannedRouteFromPoints,
  createPlannedRouteCatalog,
} from "./usePlannedRouteCatalog.js"

const buildRoutePoints = (count = 30) => {
  return Array.from({ length: count }, (_item, index) => ({
    lat: -33.45 + index * 0.0002,
    lng: -70.67 + index * 0.00025,
  }))
}

test("createPlannedRouteFromPoints keeps captured geometry when requested", () => {
  const points = buildRoutePoints()
  const route = createPlannedRouteFromPoints({
    points,
    includeRoutePoints: true,
  })

  assert.equal(route.stops.length, 8)
  assert.equal(route.routePoints.length, points.length)
  assert.equal(route.routingProvider, "captured")
  assert.ok(route.routingStopsSignature.length > 0)
})

test("createPlannedRouteFromPoints only creates stops by default", () => {
  const route = createPlannedRouteFromPoints({
    points: buildRoutePoints(),
  })

  assert.equal(route.stops.length, 8)
  assert.equal(route.routePoints.length, 0)
  assert.equal(route.routingProvider, "")
  assert.equal(route.routingStopsSignature, "")
})

test("createPlannedRouteFromPoints stores the source asset when provided", () => {
  const route = createPlannedRouteFromPoints({
    points: buildRoutePoints(),
    asset: {
      id: "asset-12",
      displayName: "Camion norte",
      patente: "AA-BB-12",
    },
  })

  assert.equal(route.assetId, "asset-12")
  assert.equal(route.assetLabel, "Camion norte - AA-BB-12")
})

test("createEmptyPlannedRoute seeds stops from the current GPS position", () => {
  const route = createEmptyPlannedRoute({
    centerPoint: {
      lat: -29.902669,
      lng: -71.25201,
    },
    asset: {
      id: "asset-18",
      displayName: "Camion La Serena",
      patente: "LS-001",
    },
  })

  assert.equal(route.assetId, "asset-18")
  assert.equal(route.assetLabel, "Camion La Serena - LS-001")
  assert.equal(route.stops[0].lat, -29.902669)
  assert.equal(route.stops[0].lng, -71.25201)
  assert.equal(route.stops[1].lat, -29.898669)
  assert.equal(route.stops[1].lng, -71.24801)
})

const setupCatalog = (testContext) => {
  const previousWindow = globalThis.window
  testContext.after(() => {
    if (previousWindow === undefined) delete globalThis.window
    else globalThis.window = previousWindow
  })
  const storage = new Map()
  let failing = false
  globalThis.window = {
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => {
        if (failing) throw Error("quota")
        storage.set(key, value)
      },
    },
  }
  const context = ref({
    companyId: "A",
    userId: "operator",
    canView: true,
    canEdit: true,
    assets: [
      { id: "a", companyId: "A" },
      { id: "b", companyId: "B" },
    ],
  })
  const create = () => createPlannedRouteCatalog({ getContext: () => context.value })
  const route = (id, assetId, companyId = "") => ({
    ...createEmptyPlannedRoute({ assetId }),
    id,
    name: id,
    companyId,
  })
  return {
    storage,
    context,
    create,
    route,
    fail: (value) => {
      failing = value
    },
  }
}

test("route catalogs separate companies, filter assets and react to logout", (t) => {
  const { create, route, context, storage } = setupCatalog(t)
  storage.set(
    "activos.planned-routes.v2:A",
    JSON.stringify([route("A", "a", "A"), route("hidden", "hidden", "A")]),
  )
  storage.set("activos.planned-routes.v2:B", JSON.stringify([route("B", "b", "B")]))
  const catalog = create()
  assert.deepEqual(
    catalog.plannedRoutes.value.map((row) => row.id),
    ["A"],
  )
  context.value.companyId = "B"
  assert.deepEqual(
    catalog.plannedRoutes.value.map((row) => row.id),
    ["B"],
  )
  assert.equal(catalog.savePlannedRoutes([route("forged", "a", "A")]), null)
  context.value.userId = ""
  assert.deepEqual(catalog.plannedRoutes.value, [])
  assert.equal(catalog.canEditRoutes.value, false)
  assert.equal(catalog.savePlannedRoutes([]), null)
})

test("read-only access and lost permission cannot save or delete routes", (t) => {
  const { create, route, context, storage } = setupCatalog(t)
  const catalog = create()
  assert.ok(catalog.savePlannedRoutes([route("A", "a")]))
  const before = storage.get("activos.planned-routes.v2:A")
  const editContext = catalog.contextKey.value
  context.value.canEdit = false
  assert.notEqual(catalog.contextKey.value, editContext)
  assert.equal(catalog.plannedRoutes.value.length, 1)
  assert.equal(catalog.savePlannedRoutes([]), null)
  assert.equal(storage.get("activos.planned-routes.v2:A"), before)
  context.value.canView = false
  assert.deepEqual(catalog.plannedRoutes.value, [])
})

test("deleting the final route leaves an empty draft that can be saved", () => {
  const source = readFileSync(
    new URL("../../../components/activos/routes/RoutePlanConfiguratorModal.vue", import.meta.url),
    "utf8",
  )
  const handler = source.slice(
    source.indexOf("const handleDeleteRoute ="),
    source.indexOf("const handleRemoveStop ="),
  )
  const draftRoutes = ref([{ id: "last", stops: [] }])
  const activeRoute = {
    get value() {
      return draftRoutes.value[0] || null
    },
  }
  const activeRouteId = ref("last")
  const selectedStopId = ref("stop")
  const noop = () => {}
  new Function(
    "activeRoute",
    "draftRoutes",
    "activeRouteId",
    "selectedStopId",
    "clearRouteCalculationTimer",
    "abortRouteCalculation",
    "stopPlannedRouteMapEditing",
    "startActiveRouteMapEditing",
    "scheduleActiveRouteCalculation",
    `${handler}; handleDeleteRoute()`,
  )(activeRoute, draftRoutes, activeRouteId, selectedStopId, noop, noop, noop, noop, noop)
  assert.deepEqual(draftRoutes.value, [])
  assert.equal(activeRouteId.value, "")
  assert.doesNotMatch(source, /draftRoutes\.value\.length > 0 && !routeValidationMessage/)
  assert.doesNotMatch(source, /:disabled="draftRoutes.length <= 1"/)
})

test("saving visible routes preserves hidden records and rejects forged identifiers", (t) => {
  const { create, route, storage } = setupCatalog(t)
  storage.set(
    "activos.planned-routes.v2:A",
    JSON.stringify([route("visible", "a", "A"), route("hidden", "other", "A")]),
  )
  const catalog = create()
  assert.equal(catalog.savePlannedRoutes([route("hidden", "a", "A")]), null)
  assert.equal(catalog.savePlannedRoutes([route("bad", "b", "A")]), null)
  assert.ok(catalog.savePlannedRoutes([route("new", "a", "A")]))
  assert.deepEqual(
    JSON.parse(storage.get("activos.planned-routes.v2:A")).map((row) => row.id),
    ["hidden", "new"],
  )
})

test("legacy ownership is never guessed and original records remain untouched", (t) => {
  const { create, route, storage } = setupCatalog(t)
  const legacy = JSON.stringify([route("unknown", "a"), route("A", "a", "A"), route("B", "b", "B")])
  storage.set("activos.planned-routes.v1", legacy)
  const catalog = create()
  assert.deepEqual(
    catalog.plannedRoutes.value.map((row) => row.id),
    ["A"],
  )
  assert.ok(catalog.savePlannedRoutes(catalog.plannedRoutes.value))
  assert.equal(storage.get("activos.planned-routes.v1"), legacy)
  assert.deepEqual(
    JSON.parse(storage.get("activos.planned-routes.v2:A")).map((row) => row.id),
    ["A"],
  )
})

test("failed writes preserve routes and drafts; an empty catalog stays empty after reload", (t) => {
  const { create, route, storage, fail } = setupCatalog(t)
  const catalog = create()
  const draft = [route("new", "a", "A")]
  fail(true)
  assert.equal(catalog.savePlannedRoutes(draft), null)
  assert.equal(draft[0].id, "new")
  assert.equal(storage.has("activos.planned-routes.v2:A"), false)
  assert.match(catalog.catalogError.value, /guardar/)
  fail(false)
  assert.ok(catalog.savePlannedRoutes(draft))
  assert.equal(catalog.plannedRoutes.value.length, 1)
  assert.ok(catalog.savePlannedRoutes([]))
  assert.deepEqual(create().plannedRoutes.value, [])
  assert.equal(storage.get("activos.planned-routes.v2:A"), "[]")
})

test("corrupt route storage is not overwritten", (t) => {
  const { create, storage, route } = setupCatalog(t)
  storage.set("activos.planned-routes.v2:A", "{broken")
  const catalog = create()
  assert.deepEqual(catalog.plannedRoutes.value, [])
  assert.equal(catalog.savePlannedRoutes([route("new", "a")]), null)
  assert.equal(storage.get("activos.planned-routes.v2:A"), "{broken")
})

test("route UI checks permission and session, and keeps failed saves open", () => {
  const panel = readFileSync(
    new URL("../../../components/activos/itinerarios/ItineraryPanel.vue", import.meta.url),
    "utf8",
  )
  const modal = readFileSync(
    new URL("../../../components/activos/routes/RoutePlanConfiguratorModal.vue", import.meta.url),
    "utf8",
  )
  const comparison = readFileSync(
    new URL("../../../components/activos/routes/RouteComparisonModal.vue", import.meta.url),
    "utf8",
  )
  assert.match(panel, /routePlanContextKey\.value !== contextKey\.value/)
  assert.match(panel, /if \(!canEditRoutes\.value\) return/)
  assert.match(comparison, /if \(!props\.canManageRoutes\) return/)
  assert.doesNotMatch(comparison, /usePlannedRouteCatalog/)
  const handler = modal.slice(
    modal.indexOf("const handleSave ="),
    modal.indexOf("const closeModal ="),
  )
  let closed = false
  new Function(
    "canSaveRoutes",
    "props",
    "normalizePlannedRoutes",
    "draftRoutes",
    "emit",
    "activeRouteId",
    "stopPlannedRouteMapEditing",
    "closeModal",
    `${handler}; handleSave()`,
  )(
    ref(true),
    { saveRoutes: () => null },
    (rows) => rows,
    ref([]),
    () => assert.fail("Must not select on failure"),
    ref("route"),
    () => assert.fail("Must keep editor open"),
    () => {
      closed = true
    },
  )
  assert.equal(closed, false)
})
