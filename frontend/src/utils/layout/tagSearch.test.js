import test from "node:test"
import assert from "node:assert/strict"
import { matchesTagAssetSearch } from "./tagSearch.js"

test("global vehicle search narrows assets instead of just locating their tag", () => {
  const query = { tagName: "Supervisores", globalQuery: "TWDR-56", localQuery: "" }
  assert.equal(matchesTagAssetSearch("TWDR-56 Tracto camion norte", query), true)
  assert.equal(matchesTagAssetSearch("MAES-01 Camion reparto 01", query), false)
})
test("tag-name search retains all assigned assets and local search refines them", () => {
  const query = { tagName: "Supervisores", globalQuery: "supervisores", localQuery: "" }
  assert.equal(matchesTagAssetSearch("MAES-01 Camion reparto 01", query), true)
  assert.equal(matchesTagAssetSearch("TWDR-56 Tracto camion norte", { ...query, localQuery: "MAES" }), false)
  assert.equal(matchesTagAssetSearch("Supervisión MAES-01", { ...query, globalQuery: "supervision" }), true)
})
