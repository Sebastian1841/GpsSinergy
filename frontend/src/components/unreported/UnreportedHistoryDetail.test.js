import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { parse } from "@vue/compiler-sfc"
test("equipment history is inline, paginated and retains episode-specific GPS and calls", () => {
  const { descriptor, errors } = parse(
    readFileSync(new URL("./UnreportedHistoryDetail.vue", import.meta.url), "utf8"),
  )
  assert.deepEqual(errors, [])
  assert.match(descriptor.template.content, /Volver a resultados/)
  assert.match(descriptor.template.content, /\$emit\('back'\)/)
  assert.doesNotMatch(descriptor.template.content, /dialog|Teleport/)
  assert.match(descriptor.template.content, /v-for="item in presentedRows"/)
  assert.match(descriptor.template.content, /v-for="call in item.calls"/)
  assert.match(descriptor.template.content, /item.diagnosis.reason/)
  assert.match(descriptor.template.content, /v-if="item.open" class="episode-information"/)
  assert.match(descriptor.template.content, /@toggle="item.open = \$event.target.open"/)
  assert.match(descriptor.template.content, /call.observation/)
  assert.match(descriptor.template.content, /equipment.totalCompletedCount/)
  assert.match(descriptor.scriptSetup.content, /useUnreportedPagination\(episodes, \[sort\]\)/)
  assert.match(descriptor.template.content, /:aria-sort=/)
  assert.match(descriptor.template.content, /class="episode-dropdown"/)
  assert.match(descriptor.template.content, /<summary\s+class="episode-summary"/)
  assert.doesNotMatch(descriptor.template.content, /<details[^>]*\sopen[\s>]/)
  assert.match(descriptor.template.content, /Dato del GPS/)
  assert.match(descriptor.template.content, /Situacion informada/)
  assert.match(descriptor.template.content, /Decision/)
  assert.match(descriptor.template.content, /class="power-readings"/)
  assert.match(descriptor.scriptSetup.content, /pageSize.value = 20/)
  assert.match(descriptor.scriptSetup.content, /useUnreportedHistoryPresentation\(visibleRows/)
  assert.match(descriptor.template.content, /<p v-else>\{\{ item.diagnosis.evidence \}\}<\/p>/)
  const root = descriptor.template.ast.children.find((node) => node.type === 1)
  const scroll = root.children.find(
    (node) =>
      node.type === 1 &&
      node.props.some(
        (prop) => prop.name === "class" && prop.value?.content.includes("history-scroll"),
      ),
  )
  assert.ok(scroll)
  assert.ok(scroll.children.some((node) => node.type === 1 && node.tag === "header"))
  assert.ok(scroll.children.some((node) => node.type === 1 && node.tag === "table"))
  assert.ok(root.children.some((node) => node.type === 1 && node.tag === "footer"))
})
