const same = (left, right) => JSON.stringify(left) === JSON.stringify(right)

// Three-way merge: independent records survive; concurrent edits of one record conflict.
export const mergeStoredRecords = (baseline, next, latest) => {
  if (same(next, baseline)) return latest
  if (same(latest, baseline) || same(next, latest)) return next
  if (![baseline, next, latest].every(Array.isArray)) {
    throw new Error("Los datos cambiaron en otra ventana. Recarga antes de guardar.")
  }
  const index = (rows) => {
    const map = new Map()
    for (const row of rows) {
      if (row?.id == null || map.has(String(row.id))) {
        throw new Error("No se pueden combinar registros sin identidad unica.")
      }
      map.set(String(row.id), row)
    }
    return map
  }
  const before = index(baseline)
  const after = index(next)
  const current = index(latest)
  const changed = new Set(
    [...before.keys(), ...after.keys()].filter((id) => !same(before.get(id), after.get(id))),
  )
  for (const id of changed) {
    if (!same(before.get(id), current.get(id)) && !same(after.get(id), current.get(id))) {
      throw new Error("El registro cambio en otra ventana. Recarga antes de guardar.")
    }
  }
  return [
    ...next.filter((row) => !current.has(String(row.id)) && changed.has(String(row.id))),
    ...latest
      .filter((row) => !changed.has(String(row.id)) || after.has(String(row.id)))
      .map((row) => (changed.has(String(row.id)) ? after.get(String(row.id)) : row)),
  ]
}
