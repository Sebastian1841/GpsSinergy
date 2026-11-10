import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import { plainTextTooltipContent } from "./plainTextTooltipContent.js"

test("tooltip names are DOM text, never parsed HTML", (context) => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "document")
  context.after(() => {
    if (previous) Object.defineProperty(globalThis, "document", previous)
    else delete globalThis.document
  })
  globalThis.document = {
    createElement(tag) {
      assert.equal(tag, "span")
      return {
        textContent: "",
        set innerHTML(_value) {
          assert.fail("Tooltip content must not use innerHTML")
        },
      }
    },
  }
  for (const name of [
    '<img src=x onerror="alert(1)">',
    "<svg onload=alert(1)></svg>",
    "<b>Nombre</b>",
    "A & B < Norte > Sur",
    "&lt;img src=x&gt;",
    'Comillas "simples\'"',
    "Ruta normal",
  ]) {
    assert.equal(plainTextTooltipContent(name).textContent, name)
  }
  assert.equal(plainTextTooltipContent(null).textContent, "")
  assert.equal(plainTextTooltipContent(undefined).textContent, "")
  assert.notEqual(plainTextTooltipContent("A"), plainTextTooltipContent("A"))
})

test("geofence and planned stop tooltips use the plain-text boundary", () => {
  const renderer = readFileSync(
    new URL("./geofences/useGeofenceRenderer.js", import.meta.url),
    "utf8",
  )
  const editor = readFileSync(new URL("./useMapPlannedRouteEditor.js", import.meta.url), "utf8")
  assert.match(renderer, /bindTooltip\(plainTextTooltipContent\(geofence\.name\)/)
  assert.match(
    editor,
    /bindTooltip\(\s*plainTextTooltipContent\(index === 0 \? "Origen" : stop\.name/,
  )
  assert.doesNotMatch(renderer, /bindTooltip\(geofence\.name/)
})
