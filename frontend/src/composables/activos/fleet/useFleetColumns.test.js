import assert from "node:assert/strict"
import test from "node:test"
import { ref } from "vue"

import { useFleetColumns } from "./useFleetColumns.js"

const columns = [
  { key: "estado", label: "Estado", width: "92px", locked: true },
  { key: "vehiculo", label: "Activo", width: "160px", locked: true },
  { key: "velocidad", label: "Vel.", width: "82px", align: "right" },
  { key: "combustible", label: "Comb.", width: "86px", align: "right" },
  { key: "lastPosition", label: "Direccion", width: "240px" },
]

test("useFleetColumns exports and restores table column preferences", () => {
  const {
    visibleColumnKeys,
    visibleColumns,
    setColumnWidth,
    moveColumn,
    getColumnPreferences,
    applyColumnPreferences,
  } = useFleetColumns({
    columns: ref(columns),
  })

  visibleColumnKeys.value = ["estado", "vehiculo", "velocidad"]
  moveColumn("velocidad", "estado")
  setColumnWidth("velocidad", 145)

  const preferences = getColumnPreferences()

  assert.deepEqual(preferences.visibleColumnKeys, ["estado", "vehiculo", "velocidad"])
  assert.equal(preferences.columnOrderKeys[0], "velocidad")
  assert.equal(preferences.columnWidthsByKey.velocidad, 145)

  applyColumnPreferences({
    visibleColumnKeys: ["estado", "vehiculo", "lastPosition"],
    columnOrderKeys: ["lastPosition", "vehiculo", "estado"],
    columnWidthsByKey: {
      lastPosition: 320,
      unknown: 999,
    },
  })

  assert.deepEqual(
    visibleColumns.value.map((column) => column.key),
    ["lastPosition", "vehiculo", "estado"],
  )
  assert.equal(visibleColumns.value[0].width, "320px")
  assert.equal(getColumnPreferences().columnWidthsByKey.unknown, undefined)
})
