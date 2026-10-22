import { performance } from "node:perf_hooks"
import { log } from "node:console"
import {
  countHistoryEquipment,
  groupHistoryEquipment,
} from "../src/utils/unreported/unreportedHistorySearch.js"

// Synthetic data only: never reads or writes the user's browser storage.
for (const episodesPerVehicle of [100, 500]) {
  const rows = Array.from({ length: 100 }, (_, vehicle) => {
    const interruptions = Array.from({ length: episodesPerVehicle }, (_, index) => ({
      id: `${vehicle}-${index}`,
      lastReportAt: new Date(Date.UTC(2020, 0, index * 3 + 1)).toISOString(),
      recoveredAt: new Date(Date.UTC(2020, 0, index * 3 + 3)).toISOString(),
      durationMs: 2 * 86400000,
    }))
    return {
      name: `Vehicle ${vehicle}`,
      company: `Company ${vehicle % 10}`,
      imei: String(vehicle),
      interruptions,
      consultations: interruptions.flatMap((episode, index) =>
        Array.from({ length: 3 }, (_, call) => ({
          id: `${episode.id}-${call}`,
          interruptionId: episode.id,
          createdAt: episode.lastReportAt,
          situation: index % 2 ? "workshop" : "working",
          decision: index % 2 ? "pending" : "field_review",
        })),
      ),
    }
  })
  const filters = { situation: "working", review: "yes", duration: "1d" }
  const samples = []
  let cases = 0
  for (let repeat = 0; repeat < 4; repeat++) {
    const start = performance.now()
    const grouped = groupHistoryEquipment(rows, "", "", filters)
    const count = countHistoryEquipment(rows, "", "", filters)
    cases = grouped.reduce((sum, row) => sum + row.completedCount, 0)
    if (count !== 100 || cases !== (100 * episodesPerVehicle) / 2)
      throw new Error("Unexpected history results")
    if (repeat) samples.push(performance.now() - start)
  }
  samples.sort((a, b) => a - b)
  log(
    JSON.stringify({
      vehicles: 100,
      episodes: 100 * episodesPerVehicle,
      consultations: 300 * episodesPerVehicle,
      matchedEpisodes: cases,
      medianMs: +samples[1].toFixed(2),
      samplesMs: samples.map((value) => +value.toFixed(2)),
    }),
  )
}
