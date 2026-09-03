import assert from "node:assert/strict"
import test from "node:test"

import { useItineraryFilters } from "./useItineraryFilters.js"

const addDays = (dateString, amount) => {
  const date = new Date(`${dateString}T00:00:00`)
  date.setDate(date.getDate() + amount)

  return date.toISOString().slice(0, 10)
}

const rangeOptions = [
  {
    value: "today",
    label: "Hoy",
  },
  {
    value: "yesterday",
    label: "Ayer",
  },
  {
    value: "week",
    label: "Esta semana",
  },
  {
    value: "last-week",
    label: "Ultima semana",
  },
]

test("useItineraryFilters uses calendar weeks for quick ranges", () => {
  const filters = useItineraryFilters({
    latestDate: "2026-08-10",
    addDays,
    rangeOptions,
  })

  filters.setDateRange("week")

  assert.equal(filters.fromDate.value, "2026-08-10")
  assert.equal(filters.toDate.value, "2026-08-10")
  assert.equal(filters.activeRangeLabel.value, "Esta semana")

  filters.setDateRange("last-week")

  assert.equal(filters.fromDate.value, "2026-08-03")
  assert.equal(filters.toDate.value, "2026-08-09")
  assert.equal(filters.activeRangeLabel.value, "Ultima semana")
})
