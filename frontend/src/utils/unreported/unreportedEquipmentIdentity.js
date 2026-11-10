export const equipmentKey = (row) =>
  row.companyId != null && String(row.companyId).trim()
    ? JSON.stringify(["company-id", String(row.companyId), String(row.imei)])
    : JSON.stringify([row.company, String(row.imei)])

export const migrateUnreportedEquipmentIdentities = (records, rows, companies = []) => {
  const next = { ...records }
  const changedKeys = new Set()
  const names = new Map()
  for (const company of companies) {
    const matches = names.get(company.name) || new Set()
    matches.add(String(company.id))
    names.set(company.name, matches)
  }
  const targets = new Map(
    rows.filter((row) => row.companyId != null).map((row) => [equipmentKey(row), row]),
  )
  const visibleImeis = new Set(rows.map((row) => String(row.imei)))
  const candidates = []
  const claims = new Map()
  let unresolved = false
  for (const [key, record] of Object.entries(records)) {
    if (!record || record.identityMigratedTo) continue
    let identity
    try {
      identity = JSON.parse(key)
    } catch {
      continue
    }
    if (!Array.isArray(identity) || identity.length !== 2) continue
    const [name, imei] = identity
    const explicitId = record.equipment?.companyId
    const matches = names.get(name)
    const companyId =
      explicitId != null && String(explicitId).trim()
        ? String(explicitId)
        : matches?.size === 1
          ? [...matches][0]
          : ""
    const targetKey = equipmentKey({ companyId, company: name, imei })
    candidates.push({ key, record, companyId, imei, targetKey })
    claims.set(targetKey, (claims.get(targetKey) || 0) + 1)
  }
  for (const { key, record, companyId, imei, targetKey } of candidates) {
    const row = targets.get(targetKey)
    if (!row) {
      if (visibleImeis.has(String(imei))) unresolved = true
      continue
    }
    // Never overwrite a newer ID-based record or merge ambiguous legacy histories.
    if (next[targetKey] || claims.get(targetKey) !== 1) {
      unresolved = true
      continue
    }
    next[targetKey] = {
      ...record,
      equipment: { ...record.equipment, companyId, company: row.company, imei: String(imei) },
    }
    // Keep the original data as a migration backup, excluded from visible history.
    next[key] = { ...record, identityMigratedTo: targetKey }
    changedKeys.add(key)
    changedKeys.add(targetKey)
  }
  return { records: next, changedKeys, unresolved }
}
