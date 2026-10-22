import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { parse } from "@vue/compiler-sfc"

test("IMEI copy offers accessible feedback and handles clipboard rejection", () => {
  const { descriptor, errors } = parse(
    readFileSync(new URL("./UnreportedCopyImei.vue", import.meta.url), "utf8"),
  )
  assert.deepEqual(errors, [])
  assert.match(descriptor.template.content, /aria-label/)
  assert.match(descriptor.template.content, /role="status"/)
  assert.match(descriptor.scriptSetup.content, /await navigator.clipboard.writeText\(props.imei\)/)
  assert.match(descriptor.scriptSetup.content, /No se pudo copiar el IMEI/)
  assert.match(descriptor.scriptSetup.content, /onBeforeUnmount\(reset\)/)
})
