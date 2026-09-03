import { ref } from "vue"

export function useActivosMapTelemetryBridge() {
  const mapPanelRef = ref(null)

  let pendingMapTelemetryBatch = null

  const applyMapTelemetryBatch = (batch = []) => {
    const applyTelemetryBatch = mapPanelRef.value?.applyTelemetryBatch

    if (typeof applyTelemetryBatch !== "function") {
      pendingMapTelemetryBatch = batch
      return
    }

    pendingMapTelemetryBatch = null
    applyTelemetryBatch(batch)
  }

  const flushPendingMapTelemetryBatch = () => {
    if (!pendingMapTelemetryBatch) return

    applyMapTelemetryBatch(pendingMapTelemetryBatch)
  }

  return {
    mapPanelRef,

    applyMapTelemetryBatch,
    flushPendingMapTelemetryBatch,
  }
}
