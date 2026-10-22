import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { parse } from "@vue/compiler-sfc"
import { computed } from "vue"

test("maintenance title takes precedence over company context on both maintenance routes", () => {
  const { descriptor } = parse(readFileSync(new URL("./AppHeader.vue", import.meta.url), "utf8"))
  const source = descriptor.scriptSetup.content
  for (const [name, moduleName] of [
    ["Maintenance", "Mantenciones"],
    ["AppMaintenance", "Mantenciones"],
    ["AppActivos", "Activos"],
    ["AppReports", "Reportes"],
    ["AppAlarms", "Alertas"],
    ["AppUnreported", "Sin reportar"],
    ["AppAudit", "Auditoria"],
  ]) {
    for (const [key, expected] of [
      ["activeContextName", moduleName],
      ["activeContextLabel", "Transportes Schuck"],
    ]) {
      const expression = source.match(
        new RegExp(`const ${key} = (computed\\(\\(\\) => \\{[\\s\\S]*?\\n\\}\\))`),
      )[1]
      const result = new Function(
        "computed",
        "route",
        "activeCompanyId",
        "activeHeaderCompany",
        `return ${expression}`,
      )(computed, { name }, { value: "company-1" }, { value: { name: "Transportes Schuck" } })
      assert.equal(result.value, expected)
    }
  }
})

test("header identifies the drivers subtab without changing other maintenance contexts", () => {
  const { descriptor } = parse(readFileSync(new URL("./AppHeader.vue", import.meta.url), "utf8"))
  const expression = descriptor.scriptSetup.content.match(
    /const activeContextName = (computed\(\(\) => \{[\s\S]*?\n\}\))/,
  )[1]
  const result = new Function("computed", "route", `return ${expression}`)(computed, {
    name: "AppMaintenance",
    query: { tab: "drivers" },
  })
  assert.equal(result.value, "Conductores")
})
