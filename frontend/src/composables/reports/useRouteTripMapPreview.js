import { ref, watch } from "vue"

import { REPORT_MAP_PREVIEW_LIMIT } from "../../utils/reports/views/reportExecutionModalUtils.js"
import {
  buildRouteTripMapImageDataUrl,
  getRouteTripMapRoutes,
} from "../../utils/reports/route-map/routeTripMapImageUtils.js"

export function useRouteTripMapPreview({
  height = 360,
  reportRows,
  shouldShowTripMap,
  width = 1100,
}) {
  const tripMapImageDataUrl = ref("")
  const isBuildingTripMap = ref(false)
  let tripMapRequestId = 0

  const resetTripMapPreview = () => {
    tripMapRequestId += 1
    tripMapImageDataUrl.value = ""
    isBuildingTripMap.value = false
  }

  watch(
    [reportRows, shouldShowTripMap],
    async ([rows, shouldBuildTripMap]) => {
      tripMapRequestId += 1
      const requestId = tripMapRequestId
      const mapPreviewRows = rows.slice(0, REPORT_MAP_PREVIEW_LIMIT)

      tripMapImageDataUrl.value = ""

      if (
        !shouldBuildTripMap ||
        !mapPreviewRows.length ||
        !getRouteTripMapRoutes(mapPreviewRows).length
      ) {
        isBuildingTripMap.value = false
        return
      }

      isBuildingTripMap.value = true

      try {
        const imageDataUrl = await buildRouteTripMapImageDataUrl(mapPreviewRows, {
          height,
          width,
        })

        if (requestId !== tripMapRequestId) return

        tripMapImageDataUrl.value = imageDataUrl
      } finally {
        if (requestId === tripMapRequestId) {
          isBuildingTripMap.value = false
        }
      }
    },
    {
      flush: "post",
    },
  )

  return {
    isBuildingTripMap,
    resetTripMapPreview,
    tripMapImageDataUrl,
  }
}
