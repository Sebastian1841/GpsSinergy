export const CALCULATED_VARIABLE_TESTS_KEY = "sinergy-calculated-variable-tests-v1:platform"

function validateResults(results) {
  if (!Array.isArray(results) || results.length > 100) throw Error("El registro de pruebas no es valido.")
  const ids = new Set()
  for (const result of results) {
    if (!result || typeof result.variableId !== "string" || !result.variableId || ids.has(result.variableId) ||
      typeof result.key !== "string" || !/^[a-z][a-z0-9_]{0,63}$/.test(result.key) ||
      typeof result.script !== "string" || !result.script.trim() || result.script.length > 20000 ||
      !["passed", "failed"].includes(result.status) || result.source !== "backend" ||
      !Number.isFinite(Date.parse(result.testedAt)) || typeof result.assetId !== "string" ||
      (result.error !== undefined && (typeof result.error !== "string" || result.error.length > 2000)))
      throw Error("El registro de pruebas contiene un resultado incompleto o invalido.")
    ids.add(result.variableId)
  }
  return results
}

export function readCalculatedVariableTests(read) {
  const raw = read(CALCULATED_VARIABLE_TESTS_KEY)
  if (raw === null) return []
  let stored
  try { stored = JSON.parse(raw) } catch { throw Error("No se pudo leer el registro de pruebas. No se modificaron los datos.") }
  if (stored?.version !== 1) throw Error("El registro de pruebas no es compatible.")
  return validateResults(stored.results)
}

// Integration boundary for an actual engine response, never called by opening
// the test tab or entering manual values. Saving does not change definitions.
export function saveCalculatedVariableTest({ read, write, result, expected, canEdit }) {
  if (!canEdit()) throw Error("No tienes permiso para registrar pruebas.")
  const current = readCalculatedVariableTests(read)
  if (JSON.stringify(current) !== JSON.stringify(expected)) throw Error("El registro de pruebas cambio. Recarga antes de registrar el resultado.")
  const next = JSON.parse(JSON.stringify(validateResults([...current.filter(item => item.variableId !== result.variableId), result])))
  if (!write(CALCULATED_VARIABLE_TESTS_KEY, JSON.stringify({ version: 1, results: next }))) throw Error("No se pudo guardar el resultado de la prueba.")
  return next
}

export function calculatedVariableTestStatus(variable, result) {
  if (!result || result.variableId !== variable.id) return { state: "never", label: "Nunca probado", badge: "SIN PROBAR", pending: true, canSave: false }
  if (variable.script !== result.script || variable.key !== result.key)
    return { state: "stale", label: "Modificado desde la última prueba", badge: "REPETIR PRUEBA", pending: true, canSave: false }
  if (result.status !== "passed" || result.source !== "backend")
    return { state: "failed", label: "Última prueba con error", badge: "CON ERROR", pending: true, canSave: false }
  return { state: "passed", label: "Prueba vigente sin errores", badge: "PROBADO", pending: false, canSave: true }
}
