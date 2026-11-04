import test from "node:test"
import assert from "node:assert/strict"
import { alarmEpisodeDisplay } from "./alarmEpisodeDisplay.js"
test("episode shows stored speed and limit, excess, duration and detection without consulting current rule", () => {
  const display = alarmEpisodeDisplay(
    {
      type: "speeding",
      createdAt: "2026-10-28T12:00:00Z",
      metadata: {
        speed: "112 km/h",
        limit: "100 km/h",
        durationSeconds: 240,
        detectedOn: "episode-end",
      },
    },
    Date.parse("2026-10-28T13:00:00Z"),
  )
  assert.equal(display.measurement, "112 km/h · limite 100 km/h · +12 km/h · moderada")
  assert.equal(display.duration, "4 min")
  assert.equal(display.detection, "Detectada al cerrar")
  assert.equal(display.age, "Hace 1 h")
})
test("missing episode data is not inferred from attention resolution and digital zero remains valid", () => {
  const display = alarmEpisodeDisplay({
    type: "speeding",
    resolvedAt: "2026-10-28T13:00:00Z",
    metadata: { speed: 0, limit: 80, durationSeconds: 0 },
  })
  assert.equal(display.measurement, "0 km/h · limite 80 km/h")
  assert.equal(display.duration, "0 s")
  assert.equal(display.detection, "Deteccion sin dato")
  assert.equal(alarmEpisodeDisplay({ metadata: {} }).duration, "Sin dato")
})
