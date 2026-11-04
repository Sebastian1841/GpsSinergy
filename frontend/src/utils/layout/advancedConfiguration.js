export const ADVANCED_STORAGE_KEY = "sinergy-advanced-configuration-v1:platform"
export const ADVANCED_AUDIT_ACTION = "configuration:advanced:update"

export const ADVANCED_GROUPS = [
  {
    id: "temperature",
    category: "Temperatura",
    title: "Cuándo se cierra una excursión de temperatura",
    description:
      "Una excursión termina cuando la temperatura vuelve adentro del rango con margen de sobra, en los dos sentidos. Sin margen, una sonda que oscila sobre el límite parte una misma excursión en varias.",
    reference:
      "Medido sobre la flota: sin margen salen 303 excursiones en vez de 286, y la mediana de duración baja de 129 a 112 minutos. No borra excursiones: junta los pedazos de una misma.",
    fields: [
      {
        id: "temperatureReturnMargin",
        label: "Margen de retorno",
        prefix: "Vuelve adentro por",
        suffix: "°C o más",
        unit: "°C",
        default: 0.5,
        min: 0,
        max: 100,
        step: 0.1,
      },
    ],
  },
  {
    id: "fuelLoad",
    category: "Consumo",
    title: "Cuándo una subida de nivel es una carga de combustible",
    description:
      "Con el vehículo detenido y sin avanzar. Se acota por arriba en tiempo porque una carga es rápida: una subida repartida en dos días no es una carga, es el nivel asentándose o la temperatura.",
    reference:
      "Medido: RHDR12 pasó de 30 % a 99 % en dos minutos. Con estos valores salen 70 cargas en 30 días sobre los 15 equipos que reportan nivel.",
    fields: [
      {
        id: "fuelLoadRise",
        label: "Subida minima de nivel",
        prefix: "El nivel sube",
        suffix: "puntos",
        unit: "puntos",
        default: 10,
        min: 1,
        max: 100,
        step: 1,
      },
      {
        id: "fuelLoadWindowMinutes",
        label: "Tiempo maximo",
        prefix: "en hasta",
        suffix: "minutos",
        unit: "min",
        default: 30,
        min: 1,
        max: 1440,
        step: 1,
      },
    ],
  },
  {
    id: "fuelDrop",
    category: "Consumo",
    title: "Cuándo una bajada de nivel es sospechosa",
    description:
      "Tolera el ruido del GPS —hasta 3 km/h y 50 m— porque acá el error caro es el otro: una caída perdida es un robo que no se avisa. El techo de ritmo es un techo y no un piso: más rápido que eso es el sensor.",
    reference:
      "Medido: HWFY29 bajó de 90 % a 42 % en un minuto, dos veces, y medio estanque no se sifona en sesenta segundos. Con estos valores salen 4 caídas en 30 días; creyendo los ceros del sensor salían 18, de las cuales 14 eran falsas.",
    fields: [
      {
        id: "fuelDropAmount",
        label: "Bajada minima de nivel",
        prefix: "El nivel baja",
        suffix: "puntos",
        unit: "puntos",
        default: 10,
        min: 1,
        max: 100,
        step: 1,
      },
      {
        id: "fuelDropMaxRate",
        label: "Ritmo maximo de bajada",
        prefix: "a no más de",
        suffix: "puntos por minuto",
        unit: "puntos/min",
        default: 10,
        min: 0.1,
        max: 100,
        step: 0.1,
      },
    ],
  },
  {
    id: "ignition",
    category: "Horas de motor",
    title: "Cuándo se sospecha que la ignición está mal conectada",
    description:
      "Un equipo que pasa casi todo su tiempo de motor en ralentí y casi no se mueve puede tener la ignición mal conectada. Sólo se señalan los que no tienen contador CAN: el que lo tiene y marca consumo real está midiendo bien.",
    reference:
      "Conservador a propósito: con estos valores, sobre la semana del 29-09 al 05-10-2026 no señala a ningún equipo. Prefiere no molestar al taller con falsos positivos.",
    fields: [
      {
        id: "ignitionIdlePercent",
        label: "Mas del tiempo en ralenti",
        prefix: "Más del",
        suffix: "% en ralentí",
        unit: "%",
        default: 90,
        min: 1,
        max: 100,
        step: 1,
      },
      {
        id: "ignitionMovingMinutes",
        label: "Menos tiempo en marcha",
        prefix: "y menos de",
        suffix: "min en marcha",
        unit: "min",
        default: 30,
        min: 1,
        max: 1440,
        step: 1,
      },
    ],
  },
]
export const ADVANCED_FIELDS = ADVANCED_GROUPS.flatMap((group) => group.fields)
export const advancedDefaults = () =>
  Object.fromEntries(ADVANCED_FIELDS.map((field) => [field.id, field.default]))

export function validateAdvancedConfiguration(values) {
  const errors = {}
  for (const field of ADVANCED_FIELDS) {
    const raw = values?.[field.id]
    const value = Number(raw)
    const steps = (value - field.min) / field.step
    if (
      raw === "" ||
      raw === null ||
      raw === undefined ||
      !["string", "number"].includes(typeof raw) ||
      (typeof raw === "string" && !raw.trim()) ||
      !Number.isFinite(value) ||
      value < field.min ||
      value > field.max ||
      Math.abs(steps - Math.round(steps)) > 1e-7
    )
      errors[field.id] =
        `Ingresa un valor entre ${field.min} y ${field.max}, en incrementos de ${field.step}.`
  }
  return errors
}
export const sameAdvancedConfiguration = (left, right) =>
  ADVANCED_FIELDS.every((field) => left[field.id] === right[field.id])

export const advancedChanges = (before, after) =>
  ADVANCED_FIELDS.filter((field) => Number(before[field.id]) !== Number(after[field.id])).map(
    (field) => ({
      fieldId: field.id,
      before: Number(before[field.id]),
      after: Number(after[field.id]),
    }),
  )

function validHistory(history) {
  return (
    Array.isArray(history) &&
    history.every(
      (entry) =>
        typeof entry?.id === "string" &&
        entry.id.length > 0 &&
        typeof entry.timestamp === "string" &&
        Number.isFinite(Date.parse(entry.timestamp)) &&
        typeof entry.actor?.id === "string" &&
        typeof entry.actor?.name === "string" &&
        entry.actor.name.trim() &&
        Array.isArray(entry.changes) &&
        entry.changes.length > 0 &&
        new Set(entry.changes.map((change) => change.fieldId)).size === entry.changes.length &&
        entry.changes.every((change) => {
          const field = ADVANCED_FIELDS.find((item) => item.id === change.fieldId)
          return (
            field &&
            typeof change.before === "number" &&
            typeof change.after === "number" &&
            change.before !== change.after &&
            !validateAdvancedConfiguration({ ...advancedDefaults(), [field.id]: change.before })[
              field.id
            ] &&
            !validateAdvancedConfiguration({ ...advancedDefaults(), [field.id]: change.after })[
              field.id
            ]
          )
        }),
    )
  )
}

function readAdvancedRecord(read) {
  const raw = read(ADVANCED_STORAGE_KEY)
  if (raw === null) return { values: advancedDefaults(), history: [], pendingAudit: [] }
  try {
    const record = JSON.parse(raw)
    if (
      record?.version !== 1 ||
      !record.values ||
      Object.keys(validateAdvancedConfiguration(record.values)).length ||
      ADVANCED_FIELDS.some((field) => typeof record.values[field.id] !== "number") ||
      (record.history !== undefined && !validHistory(record.history)) ||
      (record.pendingAudit !== undefined && !validHistory(record.pendingAudit))
    )
      throw Error()
    return {
      values: Object.fromEntries(
        ADVANCED_FIELDS.map((field) => [field.id, record.values[field.id]]),
      ),
      history: record.history || [],
      pendingAudit: record.pendingAudit || [],
    }
  } catch {
    throw Error(
      "No se pudo leer la configuracion avanzada guardada. No se sobrescribieron los datos.",
    )
  }
}
export const readAdvancedConfiguration = (read) => readAdvancedRecord(read).values

export function saveAdvancedConfiguration({
  read,
  write,
  draft,
  expected,
  canEdit,
  actor,
  now = () => new Date().toISOString(),
}) {
  if (!canEdit()) throw Error("Solo un administrador de plataforma puede modificar estos ajustes.")
  if (Object.keys(validateAdvancedConfiguration(draft)).length)
    throw Error("Revisa los valores indicados antes de guardar.")
  const record = readAdvancedRecord(read)
  if (!sameAdvancedConfiguration(record.values, expected))
    throw Error("Los ajustes cambiaron en otra ventana. Recarga antes de guardar.")
  const values = Object.fromEntries(
    ADVANCED_FIELDS.map((field) => [field.id, Number(draft[field.id])]),
  )
  const changes = advancedChanges(record.values, values)
  if (!changes.length) return values
  const entry = {
    id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    timestamp: now(),
    actor: {
      id: String(actor?.id || "unknown"),
      name: String(actor?.name || "Usuario no identificado"),
    },
    changes,
  }
  if (!validHistory([entry])) throw Error("No se pudo preparar el historial de cambios.")
  if (
    !write(
      ADVANCED_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        values,
        history: record.history,
        pendingAudit: [...record.pendingAudit, entry],
      }),
    )
  )
    throw Error("No se pudieron guardar los ajustes. Intenta nuevamente.")
  return values
}

export function syncAdvancedAudit({ read, write, recordAudit }) {
  const record = readAdvancedRecord(read)
  const entries = [...record.history, ...record.pendingAudit].sort(
    (a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp),
  )
  if (!entries.length) return 0
  for (const entry of entries) {
    const before = {},
      after = {}
    for (const change of entry.changes) {
      const field = ADVANCED_FIELDS.find((item) => item.id === change.fieldId)
      const group = ADVANCED_GROUPS.find((item) =>
        item.fields.some((itemField) => itemField.id === field.id),
      )
      const label = `${group.category} · ${field.label}`
      before[label] = `${change.before} ${field.unit}`
      after[label] = `${change.after} ${field.unit}`
    }
    const result = recordAudit({
      id: `advanced-settings-${entry.id}`,
      timestamp: entry.timestamp,
      actorId: entry.actor.id,
      actorName: entry.actor.name,
      companyId: "",
      companyName: "Plataforma",
      module: "configuracion",
      action: ADVANCED_AUDIT_ACTION,
      entityType: "ajustes-avanzados",
      entityName: "Ajustes avanzados",
      status: "success",
      severity: "info",
      description: `Se modificaron ${entry.changes.length} parametros de ajustes avanzados.`,
      metadata: { before, after, changes: entry.changes, storage: "local" },
    })
    if (!result) throw Error("No se pudo registrar el cambio en Auditoria.")
  }
  const current = readAdvancedRecord(read)
  const completed = new Set(entries.map((entry) => entry.id))
  if (
    !write(
      ADVANCED_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        values: current.values,
        history: current.history.filter((entry) => !completed.has(entry.id)),
        pendingAudit: current.pendingAudit.filter((entry) => !completed.has(entry.id)),
      }),
    )
  )
    throw Error("Auditoria registrada; queda pendiente confirmar la sincronizacion local.")
  return entries.length
}
