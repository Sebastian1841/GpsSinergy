import { performance } from "node:perf_hooks"
import { log } from "node:console"
import {
  buildDriverLicenseList,
  filterDriverLicenseList,
  normalizeDriverSearch,
} from "../src/utils/maintenance/driverLicenseList.js"
import {
  licenseState,
  currentDriverManagements,
} from "../src/utils/maintenance/driverLicenseUtils.js"

const records = Array.from({ length: 10000 }, (_, index) => ({
  name: `Juan Perez ${index}`,
  rut: String(10000000 + index) + "-K",
  classes: ["B"],
  expiresAt: `2027-${String((index % 12) + 1).padStart(2, "0")}-01`,
  licenseId: "current",
  managements: Array.from({ length: 10 }, () => ({ licenseId: "current", result: "notified" })),
}))
const beforeRows = records.map((row) => ({
  ...row,
  state: licenseState(row.expiresAt, "2026-10-20"),
  lastManagement: currentDriverManagements(row).at(-1),
}))
const indexStart = performance.now()
const afterRows = buildDriverLicenseList(records, "2026-10-20").rows
const indexMs = performance.now() - indexStart
const terms = ["j", "ju", "jua", "juan", "perez", "juan perez 1", "100", "10000001k", "inexistente"]
const baseline = (term) =>
  beforeRows
    .filter(
      (row) =>
        !term.trim() ||
        normalizeDriverSearch(row.name).includes(normalizeDriverSearch(term)) ||
        normalizeDriverSearch(row.rut).includes(normalizeDriverSearch(term)),
    )
    .sort((a, b) => a.expiresAt.localeCompare(b.expiresAt) || a.name.localeCompare(b.name, "es"))
const timings = (fn) => {
  const samples = []
  for (let repeat = 0; repeat < 4; repeat++) {
    for (const term of terms) {
      const result = fn(term)
      if (result.length !== baseline(term).length) throw new Error("Search results changed")
    }
    // Baseline verification is excluded in the actual measured loop below.
    const measureStart = performance.now()
    for (const term of terms) fn(term)
    if (repeat) samples.push(performance.now() - measureStart)
  }
  return +samples.sort((a, b) => a - b)[1].toFixed(2)
}
log(
  JSON.stringify({
    drivers: records.length,
    queries: terms.length,
    indexBuildMs: +indexMs.toFixed(2),
    previousQueriesMs: timings(baseline),
    indexedQueriesMs: timings((term) => filterDriverLicenseList(afterRows, term)),
  }),
)
