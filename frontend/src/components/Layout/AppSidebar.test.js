import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { computed, ref } from "vue"
import { parse, compileScript, compileTemplate } from "@vue/compiler-sfc"
import { CONFIGURATION_MODULES } from "../../utils/layout/configurationNavigation.js"

const source = readFileSync(new URL("./AppSidebar.vue", import.meta.url), "utf8")
const { descriptor } = parse(source)
const script = descriptor.scriptSetup.content

function categories(platform, allowed = []) {
  const moduleSource = script.slice(
    script.indexOf("const moduleItem ="),
    script.indexOf("const unreportedItem ="),
  )
  const categorySource = script.slice(
    script.indexOf("const navigationCategories ="),
    script.indexOf("const isActive ="),
  )
  return new Function(
    "computed",
    "isPlatformAdmin",
    "accessibleCompanies",
    "companyId",
    "canAccessFunction",
    "assetItems",
    "unreportedItem",
    "CONFIGURATION_MODULES",
    `${moduleSource}\n${categorySource}\nreturn navigationCategories.value`,
  )(
    computed,
    ref(platform),
    ref([{ id: "one", name: "Empresa" }]),
    ref("one"),
    (permission) => allowed.includes(permission),
    ref([{ label: "Activos", icon: "activos", to: "/activos" }]),
    () => ({ label: "Sin reportar", icon: "unreported", to: "/sin-reportar" }),
    CONFIGURATION_MODULES,
  )
}

test("sidebar preserves category order, existing icons and separate alerts routes", () => {
  const groups = categories(true)
  assert.deepEqual(
    groups.map((group) => group.id),
    ["operation", "configuration", "administration"],
  )
  assert.deepEqual(
    groups[0].items.map((item) => item.label),
    ["Activos", "Reportes", "Alertas", "Mantenciones", "Sin reportar"],
  )
  assert.deepEqual(
    groups[0].items.map((item) => item.icon),
    ["activos", "reportes", "alertas", "mantenciones", "unreported"],
  )
  assert.deepEqual(
    groups[1].items.map((item) => item.label),
    CONFIGURATION_MODULES.map((item) => item.label),
  )
  assert.deepEqual(
    groups[2].items.map((item) => item.icon),
    ["empresas", "usuarios", "auditoria"],
  )
  assert.notEqual(groups[0].items[2].to, groups[1].items[2].to)
  assert.equal(groups[1].items[2].to, "/configuracion/alertas")
  assert.deepEqual(groups[1].items.map(item => item.icon), ["configuration-limits", "configuration-tags", "configuration-alerts", "variable-code", "configuration-sliders"])
})

test("configuration uses explicit permissions and platform items never leak to clients", () => {
  assert.ok(!categories(false).some((group) => group.id === "configuration"))
  const groups = categories(false, ["configuration-tags", "alarms", "audit-view"])
  const config = groups.find((group) => group.id === "configuration")
  assert.deepEqual(
    config.items.map((item) => item.to),
    ["/app/one/configuracion/etiquetas"],
  )
  assert.deepEqual(
    groups.find((group) => group.id === "administration").items.map((item) => item.to),
    ["/app/one/auditoria"],
  )
  assert.ok(!config.items.some((item) => item.platformOnly))
})

test("both sidebar modes use accessible collapsible categories and compile", () => {
  const compiled = compileScript(descriptor, { id: "sidebar" })
  const result = compileTemplate({
    source: descriptor.template.content,
    filename: "AppSidebar.vue",
    id: "sidebar",
    compilerOptions: { bindingMetadata: compiled.bindings },
  })
  assert.deepEqual(result.errors, [])
  assert.equal((descriptor.template.content.match(/:aria-expanded=/g) || []).length, 1)
  assert.match(descriptor.template.content, /:aria-pressed="expandedCategory === category.id"/)
  assert.doesNotMatch(script, /collapsedCategories/)
  assert.match(source, /\.rail-link.active \{\s*background: #ff6600/)
  assert.match(source, /sinergy-sidebar-compact/)
})

test("sidebar accordion opens only one category and rail selector reopens it", () => {
  const stateSource = script.slice(script.indexOf("const expandedCategory ="), script.indexOf("const companyId ="))
  const state = new Function("ref", `${stateSource}; return { expandedCategory, selectCategory, toggleCategory }`)(ref)
  assert.equal(state.expandedCategory.value, "operation")
  state.toggleCategory("configuration")
  assert.equal(state.expandedCategory.value, "configuration")
  state.toggleCategory("administration")
  assert.equal(state.expandedCategory.value, "administration")
  state.toggleCategory("administration")
  assert.equal(state.expandedCategory.value, "administration")
  state.selectCategory("configuration")
  assert.equal(state.expandedCategory.value, "configuration")
  assert.match(script, /category.items.some\(isActive\)/)
  assert.match(script, /immediate: true/)
})

test("new routes remain guarded and placeholders contain no business UI", () => {
  const router = readFileSync(new URL("../../router/index.js", import.meta.url), "utf8")
  assert.match(router, /requiresPlatformAdmin: true, navigationTitle: item.label/)
  assert.match(router, /!item.platformOnly/)
  assert.match(router, /requiresFunction: \{ id: item.permission, permission: "view" \}/)
  const placeholder = parse(
    readFileSync(new URL("../../views/ConfigurationPlaceholderView.vue", import.meta.url), "utf8"),
  ).descriptor
  assert.doesNotMatch(placeholder.template.content, /<form|<table|<input|<button|role="tab"/)
})

test("direct configuration navigation enforces authentication, company and function access", () => {
  const source = readFileSync(new URL("../../router/index.js", import.meta.url), "utf8")
  const routeSource = source.slice(
    source.indexOf("const routes = ["),
    source.indexOf("// ROUTER\n"),
  )
  const routes = new Function(
    "CONFIGURATION_MODULES",
    "routeViewLoaders",
    `${routeSource}\nreturn routes`,
  )(CONFIGURATION_MODULES, new Proxy({}, { get: () => () => Promise.resolve({}) }))
  const state = { authenticated: true, platform: false, company: true, permission: false }
  let guard
  const guardSource = source.slice(
    source.indexOf("router.beforeEach((to) => {"),
    source.indexOf("export default router"),
  )
  new Function("router", "useAuthSession", "useAccessControl", "persistLastCompanyId", guardSource)(
    {
      beforeEach: (callback) => {
        guard = callback
      },
    },
    () => ({
      isAuthenticated: ref(state.authenticated),
      isPlatformAdmin: ref(state.platform),
      defaultAuthenticatedRoute: ref("/activos"),
    }),
    () => ({
      accessibleCompanies: ref([]),
      canAccessCompany: () => state.company,
      canAccessModule: () => true,
      canAccessFunction: () => state.permission,
      canViewUsers: ref(false),
    }),
    () => {},
  )
  const destination = (name) => {
    const route = routes.find((item) => item.name === name)
    assert.ok(route)
    return {
      ...route,
      fullPath: route.path,
      params: name.startsWith("App") ? { empresaId: "one" } : {},
    }
  }
  for (const item of CONFIGURATION_MODULES) {
    assert.equal(guard(destination(item.name)), "/activos")
    if (item.platformOnly) {
      assert.ok(!routes.some((route) => route.name === `App${item.name}`))
      continue
    }
    const to = destination(`App${item.name}`)
    assert.deepEqual(guard(to), { name: "NoAccess" })
    state.permission = true
    assert.equal(guard(to), true)
    state.company = false
    assert.equal(guard(to), "/activos")
    state.company = true
    state.permission = false
  }
  state.authenticated = false
  assert.equal(guard(destination("ConfigurationAdvanced")).name, "Login")
  state.authenticated = true
  state.platform = true
  assert.equal(guard(destination("ConfigurationAdvanced")), true)
})
