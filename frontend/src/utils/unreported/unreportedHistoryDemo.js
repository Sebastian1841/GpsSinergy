const companies = ["Transportes San Pedro", "Forestal Los Robles", "Constructora Norte"]
const names = [
  "JSFG-74 · Camion forestal",
  "FLRB-22 · Camioneta supervisora",
  "MDFR-09 · Excavadora",
  "KJHG-33 · Camion Volvo",
  "PLRT-55 · Camion Scania",
  "LPQS-47 · Camion MAN",
  "TRNV-62 · Camion Volvo",
  "BXTC-23 · Camioneta Maxus",
  "BHKD-56 · Camioneta JAC",
  "VPKH-43 · Furgon",
  "DCXJ-29 · Camion grua",
  "KXSG-70 · Camion de reparto",
]
const hour = 3600000
const situations = ["workshop", "not_in_use", "not_contacted", "working"]
const observations = [
  "Ejemplo: bateria desconectada durante reparacion en taller.",
  "Ejemplo: vehiculo detenido por termino de faena.",
  "Ejemplo: no se logro contactar a la empresa; se intentara nuevamente.",
  "Ejemplo: vehiculo trabajando; se solicita revisar el GPS.",
]

export const createDemoHistoryEquipment = (reference = new Date()) => {
  const base = new Date(reference).getTime()
  if (!Number.isFinite(base)) return []
  return names.map((name, index) => {
    const consultations = []
    const interruptions = Array.from(
      { length: index === 0 ? 8 : 3 + (index % 4) },
      (_, episodeIndex) => {
        const start = base - (3 + index + episodeIndex * 28) * 24 * hour
        const duration = (episodeIndex % 3 === 0 ? 52 : episodeIndex % 3 === 1 ? 8 : 20) * hour
        const id = `demo-history-${index}-${episodeIndex}`
        const lastReportAt = new Date(start).toISOString()
        // Repeated power loss allows comparison of the same symptom across dates.
        const kind = index === 0 && episodeIndex % 2 === 0 ? 0 : (index + episodeIndex) % 4
        const telemetry =
          kind === 0
            ? { reportedAt: lastReportAt, externalVoltage: 0, internalVoltage: 3.45 }
            : kind === 1
              ? { reportedAt: lastReportAt, simStatus: "absent" }
              : kind === 2
                ? { reportedAt: lastReportAt, mobileRegistered: false, mobileSignalDbm: -110 }
                : null
        if (episodeIndex % 3 !== 2) {
          const situation = situations[kind]
          consultations.push({
            id: `${id}-call`,
            interruptionId: id,
            createdAt: new Date(start + 8 * hour).toISOString(),
            author: "Ana Morales (demo)",
            situation,
            decision: kind < 2 ? "no_visit" : kind === 2 ? "pending" : "field_review",
            observation: observations[kind],
          })
          if (episodeIndex === 0)
            consultations.push({
              id: `${id}-followup`,
              interruptionId: id,
              createdAt: new Date(start + 12 * hour).toISOString(),
              author: "Luis Rojas (demo)",
              situation,
              decision: "no_visit",
              observation: "Ejemplo: segunda llamada; confirman que se retomo el uso del equipo.",
            })
        }
        return {
          id,
          lastReportAt,
          detectedAt: new Date(start + 7 * hour).toISOString(),
          recoveredAt: new Date(start + duration).toISOString(),
          durationMs: duration,
          ...(telemetry ? { telemetry } : {}),
        }
      },
    )
    return {
      name: `${name} (DEMO)`,
      company: companies[index % companies.length],
      imei: `DEMO-${String(index + 1).padStart(3, "0")}`,
      demo: true,
      archived: true,
      mode: "reporting",
      status: "Ejemplo",
      location: "Datos de demostracion",
      interruptions,
      consultations,
    }
  })
}
