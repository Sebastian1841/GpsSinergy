const DEFAULT_MEASURE_THRESHOLD_MS = 16

export const startDevMeasure = (label) => {
  if (!import.meta.env?.DEV || typeof performance === "undefined") return null

  return {
    label,
    startedAt: performance.now(),
  }
}

export const endDevMeasure = (measure, thresholdMs = DEFAULT_MEASURE_THRESHOLD_MS) => {
  if (!measure || !import.meta.env?.DEV || typeof performance === "undefined") return

  const duration = performance.now() - measure.startedAt

  if (duration >= thresholdMs) {
    console.info(`${measure.label}: ${duration.toFixed(1)}ms`)
  }
}
