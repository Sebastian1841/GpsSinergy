import { computed, watch } from "vue"

import { snapOsrmPointToRoad } from "../../../services/routing/osrmRouteService.js"
import { usePlannedRouteMapEditor } from "../routes/usePlannedRouteMapEditor.js"

const hasValidCoordinates = (point) => {
  return Number.isFinite(Number(point?.lat)) && Number.isFinite(Number(point?.lng))
}

const toLatLngTuple = (point) => [Number(point.lat), Number(point.lng)]

const getPointValidationErrorMessage = (error) => {
  if (error?.name === "TypeError") {
    return "No se pudo validar la calle. Intenta nuevamente."
  }

  return error?.message || "Marca el punto sobre una calle habilitada."
}

export const createPlannedRouteMapEditorController = ({ L, getMap, layers }) => {
  const {
    plannedRouteMapDraft,
    isEditingPlannedRouteOnMap,
    addPlannedRouteStop,
    movePlannedRouteStop,
    setPlannedRouteMapNotice,
    selectPlannedRouteStop,
  } = usePlannedRouteMapEditor()

  let routeLine = null
  let lastFocusedRouteId = ""
  let pointValidationAbortController = null

  const createStopIcon = ({ index, selected }) => {
    return L.divIcon({
      className: "",
      html: `<div class="planned-route-stop${selected ? " selected" : ""}">${index + 1}</div>`,
      iconSize: selected ? [30, 30] : [24, 24],
      iconAnchor: selected ? [15, 15] : [12, 12],
    })
  }

  const getValidStops = () => {
    return (plannedRouteMapDraft.value?.stops || []).filter(hasValidCoordinates)
  }

  const getValidReferencePoints = () => {
    return (plannedRouteMapDraft.value?.referencePoints || []).filter(hasValidCoordinates)
  }

  const getValidRoutePoints = () => {
    return (plannedRouteMapDraft.value?.routePoints || []).filter(hasValidCoordinates)
  }

  const getRouteLatLngs = () => {
    return getValidStops().map(toLatLngTuple)
  }

  const getPlannedLineLatLngs = () => {
    const routePoints = getValidRoutePoints()

    if (routePoints.length >= 2) {
      return routePoints.map(toLatLngTuple)
    }

    return getRouteLatLngs()
  }

  const plannedRouteEditorSignature = computed(() => {
    const draft = plannedRouteMapDraft.value

    if (!draft) return "inactive"

    return [
      draft.routeId,
      draft.selectedStopId,
      ...getValidStops().map((stop) => [stop.id, stop.name, stop.lat, stop.lng].join(":")),
      draft.referencePointsSignature || "",
      draft.routePointsSignature || "",
    ].join("|")
  })

  const clearPlannedRouteEditLayer = () => {
    layers.plannedRouteEditLayer?.clearLayers()
    routeLine = null
  }

  const abortPointValidation = () => {
    if (!pointValidationAbortController) return

    pointValidationAbortController.abort()
    pointValidationAbortController = null
  }

  const getAllowedRouteLatLng = async (latLng) => {
    abortPointValidation()

    const abortController = new AbortController()

    pointValidationAbortController = abortController

    try {
      const snappedPoint = await snapOsrmPointToRoad({
        point: latLng,
        signal: abortController.signal,
      })

      setPlannedRouteMapNotice("")

      return L.latLng(snappedPoint.lat, snappedPoint.lng)
    } catch (error) {
      if (error?.name === "AbortError") return null

      setPlannedRouteMapNotice(getPointValidationErrorMessage(error))

      return null
    } finally {
      if (pointValidationAbortController === abortController) {
        pointValidationAbortController = null
      }
    }
  }

  const focusDraftRoute = () => {
    const map = getMap()
    const focusPoint = plannedRouteMapDraft.value?.focusPoint

    if (map && hasValidCoordinates(focusPoint)) {
      map.setView(toLatLngTuple(focusPoint), Math.max(map.getZoom(), 16), {
        animate: true,
      })
      return
    }

    const points = [...getValidStops(), ...getValidReferencePoints()]

    if (!map || points.length < 2) return

    const bounds = L.latLngBounds(points.map(toLatLngTuple))

    if (!bounds.isValid()) return

    map.fitBounds(bounds, {
      animate: true,
      maxZoom: 15,
      padding: [60, 60],
    })
  }

  const updateRouteLineDuringDrag = (stopId, latLng) => {
    if (!routeLine) return

    routeLine.setLatLngs(
      getValidStops().map((stop) => {
        if (stop.id === stopId) return latLng

        return toLatLngTuple(stop)
      }),
    )
  }

  const renderPlannedRouteEditor = () => {
    if (!layers.plannedRouteEditLayer) return

    clearPlannedRouteEditLayer()

    const draft = plannedRouteMapDraft.value

    if (!draft) return

    const referenceLatLngs = getValidReferencePoints().map(toLatLngTuple)
    const routeLatLngs = getPlannedLineLatLngs()

    if (referenceLatLngs.length >= 2) {
      L.polyline(referenceLatLngs, {
        color: "#ff6600",
        opacity: 0.45,
        weight: 4,
        dashArray: "8 8",
      })
        .bindTooltip("Recorrido actual", {
          className: "sinergy-geofence-tooltip",
        })
        .addTo(layers.plannedRouteEditLayer)
    }

    if (routeLatLngs.length >= 2) {
      routeLine = L.polyline(routeLatLngs, {
        color: "#102372",
        opacity: 0.95,
        weight: 6,
        smoothFactor: 1.4,
      }).addTo(layers.plannedRouteEditLayer)
    }

    getValidStops().forEach((stop, index) => {
      const selected = stop.id === draft.selectedStopId
      const marker = L.marker(toLatLngTuple(stop), {
        draggable: true,
        icon: createStopIcon({
          index,
          selected,
        }),
        zIndexOffset: selected ? 900 : 700,
      })

      marker.on("click", (event) => {
        event.originalEvent?.stopPropagation?.()
        selectPlannedRouteStop(stop.id)
      })

      marker.on("drag", (event) => {
        updateRouteLineDuringDrag(stop.id, event.target.getLatLng())
      })

      marker.on("dragend", async (event) => {
        const routeId = plannedRouteMapDraft.value?.routeId || ""
        const allowedLatLng = await getAllowedRouteLatLng(event.target.getLatLng())

        if (!allowedLatLng) {
          renderPlannedRouteEditor()
          return
        }

        if (!isEditingPlannedRouteOnMap.value || plannedRouteMapDraft.value?.routeId !== routeId) {
          return
        }

        movePlannedRouteStop(stop.id, allowedLatLng)
      })

      marker
        .bindTooltip(index === 0 ? "Origen" : stop.name || `Parada ${index + 1}`, {
          direction: "top",
          className: "sinergy-geofence-tooltip",
        })
        .addTo(layers.plannedRouteEditLayer)
    })

    if (draft.routeId !== lastFocusedRouteId) {
      lastFocusedRouteId = draft.routeId
      focusDraftRoute()
    }
  }

  const handleMapClick = async (event) => {
    if (!isEditingPlannedRouteOnMap.value) return

    const routeId = plannedRouteMapDraft.value?.routeId || ""
    const allowedLatLng = await getAllowedRouteLatLng(event.latlng)

    if (!allowedLatLng) return

    if (!isEditingPlannedRouteOnMap.value || plannedRouteMapDraft.value?.routeId !== routeId) {
      return
    }

    addPlannedRouteStop(allowedLatLng)
  }

  const stop = watch(plannedRouteEditorSignature, renderPlannedRouteEditor)

  const cleanupPlannedRouteEditor = () => {
    stop()
    abortPointValidation()
    clearPlannedRouteEditLayer()
  }

  return {
    renderPlannedRouteEditor,
    clearPlannedRouteEditLayer,
    cleanupPlannedRouteEditor,
    handleMapClick,
  }
}
