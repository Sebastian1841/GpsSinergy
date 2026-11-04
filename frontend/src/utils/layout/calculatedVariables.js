import { calculatedVariableInputs } from "./calculatedVariableInputs.js"

export const CALCULATED_VARIABLES_KEY = "sinergy-calculated-variables-v1:platform"
export const VEHICLE_STATE_SCRIPT = `velocidad = var["speed"]
encendido = var["ignition"]

if encendido == 0:
    out["estado_vehiculo"] = "Apagado"
elif velocidad < 3:
    out["estado_vehiculo"] = "Detenido con motor encendido"
else:
    out["estado_vehiculo"] = "En marcha"`

const copy = value => JSON.parse(JSON.stringify(value))
export const seedCalculatedVariables = (assets = []) => [{
  id: "variable-estado-vehiculo",
  key: "estado_vehiculo",
  label: "Estado del vehículo",
  active: true,
  script: VEHICLE_STATE_SCRIPT,
  assetIds: assets.slice(0, 99).map(asset => String(asset.id)),
  readsProfile: false,
  unit: "",
  showInDetail: true,
  updatedBy: "Referencia original",
  updatedAt: "2026-11-02T12:00:00.000Z",
  versions: [{ number: 1, script: VEHICLE_STATE_SCRIPT, actor: "Referencia original", timestamp: "2026-11-02T12:00:00.000Z" }],
}]

export function validateCalculatedVariables(records) {
  if (!Array.isArray(records) || records.length > 100) throw Error("La lista de variables no es valida.")
  const ids = new Set(), keys = new Set()
  for (const row of records) {
    if (!row || typeof row !== "object" || typeof row.id !== "string" || !row.id || ids.has(row.id) ||
      typeof row.key !== "string" || row.key.length > 64 || !/^[a-z][a-z0-9_]*$/.test(row.key) || keys.has(row.key) ||
      typeof row.label !== "string" || !row.label.trim() || row.label.length > 100 ||
      typeof row.active !== "boolean" || typeof row.readsProfile !== "boolean" ||
      (row.unit !== undefined && (typeof row.unit !== "string" || row.unit.length > 24)) ||
      (row.showInDetail !== undefined && typeof row.showInDetail !== "boolean") ||
      typeof row.script !== "string" || !row.script.trim() || row.script.length > 20000 ||
      !Array.isArray(row.assetIds) || row.assetIds.some(id => typeof id !== "string" || !id) ||
      typeof row.updatedBy !== "string" || !Number.isFinite(Date.parse(row.updatedAt)) ||
      !Array.isArray(row.versions) || !row.versions.length || row.versions.length > 100 ||
      row.versions.some(version => !Number.isInteger(version.number) || version.number < 1 ||
        typeof version.script !== "string" || version.script.length > 20000 ||
        typeof version.actor !== "string" || !Number.isFinite(Date.parse(version.timestamp))))
      throw Error("Hay una variable incompleta o con datos invalidos. Revisa el identificador, nombre y script.")
    ids.add(row.id)
    keys.add(row.key)
  }
  return records
}

export function readCalculatedVariables(read, assets = []) {
  const raw = read(CALCULATED_VARIABLES_KEY)
  if (raw === null) return seedCalculatedVariables(assets)
  let record
  try { record = JSON.parse(raw) } catch { throw Error("No se pudieron leer las variables guardadas. No se modificaron los datos.") }
  if (record?.version !== 1) throw Error("La configuracion de variables guardada no es compatible.")
  return validateCalculatedVariables(record.records).map(row => ({ ...row, readsProfile: calculatedVariableInputs(row.script).profile.length > 0 }))
}

export function saveCalculatedVariables({ read, write, records, expected, assets = [], canEdit }) {
  if (!canEdit()) throw Error("Solo un administrador de plataforma puede modificar variables.")
  const current = readCalculatedVariables(read, assets)
  if (JSON.stringify(current) !== JSON.stringify(expected))
    throw Error("Las variables cambiaron en otra ventana. Recarga antes de guardar.")
  const next = copy(validateCalculatedVariables(records)).map(row => ({ ...row, readsProfile: calculatedVariableInputs(row.script).profile.length > 0 }))
  if (!write(CALCULATED_VARIABLES_KEY, JSON.stringify({ version: 1, records: next })))
    throw Error("No se pudieron guardar las variables. Tu edicion se conserva para reintentar.")
  return next
}

export function updateCalculatedVariable(records, draft, { actor, timestamp, id }) {
  const existing = records.find(row => row.id === draft.id)
  const scriptChanged = !existing || existing.script !== draft.script
  const versions = scriptChanged
    ? [...(existing?.versions || []), { number: (existing?.versions.at(-1)?.number || 0) + 1, script: draft.script, actor, timestamp }].slice(-100)
    : [...existing.versions]
  const next = {
    id: existing?.id || id, key: draft.key.trim(), label: draft.label.trim(),
    active: existing?.active ?? false, script: draft.script, assetIds: [...new Set(draft.assetIds)],
    readsProfile: calculatedVariableInputs(draft.script).profile.length > 0, updatedBy: actor, updatedAt: timestamp,
    unit: String(draft.unit || "").trim(), showInDetail: draft.showInDetail !== false,
    versions,
  }
  return validateCalculatedVariables(existing ? records.map(row => row.id === existing.id ? next : row) : [next, ...records])
}
