export function fuelDropEpisode(condition = {}) {
  if (condition.episodeSource !== "fuel-drop") return null
  return {
    field: "fuelLevel",
    operator: "decrease",
    value: "detected-drop",
    unit: "",
    episodeSource: "fuel-drop",
    stationaryOnly: true,
    notifyOn: "episode-end",
    evaluationIntervalMinutes: 10,
  }
}
