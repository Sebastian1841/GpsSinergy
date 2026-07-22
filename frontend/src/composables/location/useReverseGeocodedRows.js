import { computed, onBeforeUnmount, ref, unref, watch } from "vue"

import {
  REVERSE_GEOCODING_ATTRIBUTION,
  formatFallbackCoordinateAddress,
  getCachedReverseGeocodeAddress,
  getExistingAddressValue,
  getReverseGeocodeCoordinates,
  getReverseGeocodeKey,
  getRouteTripEndpointAddressValue,
  getRouteTripEndpointCoordinates,
  isResolvableAddressPlaceholder,
  isReverseGeocodingEnabled,
  reverseGeocodeCoordinates,
  shouldResolveReverseGeocode,
  shouldResolveRouteTripEndpointReverseGeocode,
  withResolvedRouteTripEndpointAddresses,
} from "../../services/location/reverseGeocodingService.js"

const DEFAULT_VISIBLE_RESOLVE_LIMIT = 60
const DEFAULT_FAILED_RETRY_MS = 30 * 1000

export function useReverseGeocodedRows(
  rows,
  {
    limit = DEFAULT_VISIBLE_RESOLVE_LIMIT,
    enabled = true,
    retryFailedAfterMs = DEFAULT_FAILED_RETRY_MS,
  } = {},
) {
  const resolvedAddressByKey = ref({})
  const pendingAddressByKey = ref({})
  const failedAddressByKey = ref({})
  const stopped = ref(false)

  let failedRetryTimerId = null

  const sourceRows = computed(() => {
    const value = unref(rows)

    return Array.isArray(value) ? value : []
  })

  const isEnabled = computed(() => {
    return unref(enabled) !== false && isReverseGeocodingEnabled()
  })

  const resolvedLimit = computed(() => {
    const value = Number(unref(limit))

    return Number.isFinite(value) && value > 0 ? value : DEFAULT_VISIBLE_RESOLVE_LIMIT
  })

  const resolvedRetryFailedAfterMs = computed(() => {
    const value = Number(unref(retryFailedAfterMs))

    return Number.isFinite(value) && value > 0 ? value : DEFAULT_FAILED_RETRY_MS
  })

  const isRecentlyFailed = (key) => {
    const failedAt = failedAddressByKey.value[key]

    if (!failedAt) return false

    return Date.now() - failedAt < resolvedRetryFailedAfterMs.value
  }

  const clearFailedRetryTimer = () => {
    if (failedRetryTimerId === null) return

    globalThis.clearTimeout(failedRetryTimerId)
    failedRetryTimerId = null
  }

  const scheduleFailedRetry = () => {
    clearFailedRetryTimer()

    if (stopped.value || !isEnabled.value) return

    const visibleFailedAtValues = Array.from(visibleAddressKeys.value)
      .map((key) => failedAddressByKey.value[key])
      .filter(Boolean)

    if (!visibleFailedAtValues.length) return

    const now = Date.now()
    const retryDelay = Math.max(
      250,
      Math.min(
        ...visibleFailedAtValues.map((failedAt) => {
          return resolvedRetryFailedAfterMs.value - (now - failedAt)
        }),
      ),
    )

    failedRetryTimerId = globalThis.setTimeout(() => {
      failedRetryTimerId = null
      resolveVisibleRows()
    }, retryDelay)
  }

  const getCachedAddress = (key, coordinates) => {
    return resolvedAddressByKey.value[key] || getCachedReverseGeocodeAddress(coordinates)
  }

  const getResolvedAddressForCoordinates = ({ existingAddress = "", coordinates = null } = {}) => {
    if (!isResolvableAddressPlaceholder(existingAddress)) {
      return existingAddress
    }

    if (!isEnabled.value) return existingAddress || ""

    const key = getReverseGeocodeKey(coordinates)
    const cachedAddress = key ? getCachedAddress(key, coordinates) : ""

    if (cachedAddress) {
      return cachedAddress
    }

    return formatFallbackCoordinateAddress(coordinates)
  }

  const getResolvedAddress = (row = {}) => {
    return getResolvedAddressForCoordinates({
      existingAddress: getExistingAddressValue(row),
      coordinates: getReverseGeocodeCoordinates(row),
    })
  }

  const getResolvedTripEndpointAddress = (row = {}, endpoint = "start") => {
    return getResolvedAddressForCoordinates({
      existingAddress: getRouteTripEndpointAddressValue(row, endpoint),
      coordinates: getRouteTripEndpointCoordinates(row, endpoint),
    })
  }

  const withResolvedAddress = (row = {}) => {
    if (!isEnabled.value) return row

    const address = getResolvedAddress(row)
    const startAddress = getResolvedTripEndpointAddress(row, "start")
    const endAddress = getResolvedTripEndpointAddress(row, "end")
    const values = row.values ? { ...row.values } : null
    const itineraryRow = row.itineraryRow ? { ...row.itineraryRow, address } : null

    if (values) {
      if (Object.hasOwn(values, "address")) values.address = address
      if (Object.hasOwn(values, "lastPosition")) values.lastPosition = address
    }

    const resolvedRow = {
      ...row,
      address,
      direccion: address,
      lastPosition: address,
      resolvedAddress: address,
      ...(values ? { values } : {}),
      ...(itineraryRow ? { itineraryRow } : {}),
    }

    return withResolvedRouteTripEndpointAddresses(resolvedRow, {
      startAddress,
      endAddress,
    })
  }

  const rowsWithResolvedAddresses = computed(() => {
    return sourceRows.value.map(withResolvedAddress)
  })

  const collectCandidates = () => {
    if (!isEnabled.value) return []
    const candidates = []
    const candidateKeys = new Set()

    for (const row of sourceRows.value) {
      const rowCandidates = [
        shouldResolveReverseGeocode(row)
          ? {
              coordinates: getReverseGeocodeCoordinates(row),
            }
          : null,
        shouldResolveRouteTripEndpointReverseGeocode(row, "start")
          ? {
              coordinates: getRouteTripEndpointCoordinates(row, "start"),
            }
          : null,
        shouldResolveRouteTripEndpointReverseGeocode(row, "end")
          ? {
              coordinates: getRouteTripEndpointCoordinates(row, "end"),
            }
          : null,
      ].filter(Boolean)

      for (const { coordinates } of rowCandidates) {
        const key = getReverseGeocodeKey(coordinates)

        if (!key) continue
        if (getCachedAddress(key, coordinates) || pendingAddressByKey.value[key]) continue
        if (isRecentlyFailed(key)) continue
        if (candidateKeys.has(key)) continue

        candidateKeys.add(key)
        candidates.push({ key, coordinates })

        if (candidates.length >= resolvedLimit.value) break
      }

      if (candidates.length >= resolvedLimit.value) break
    }

    return candidates
  }

  const visibleAddressKeys = computed(() => {
    return new Set(
      sourceRows.value
        .flatMap((row) => {
          return [
            getReverseGeocodeCoordinates(row),
            getRouteTripEndpointCoordinates(row, "start"),
            getRouteTripEndpointCoordinates(row, "end"),
          ]
        })
        .map((coordinates) => getReverseGeocodeKey(coordinates))
        .filter(Boolean),
    )
  })

  const candidateSignature = computed(() => {
    return collectCandidates()
      .map((candidate) => candidate.key)
      .join("|")
  })

  const resolveVisibleRows = async () => {
    if (stopped.value || !isEnabled.value) return

    const candidates = collectCandidates()

    if (!candidates.length) return

    pendingAddressByKey.value = {
      ...pendingAddressByKey.value,
      ...Object.fromEntries(candidates.map(({ key }) => [key, true])),
    }

    for (const { key, coordinates } of candidates) {
      const address = await reverseGeocodeCoordinates(coordinates)

      const nextPending = { ...pendingAddressByKey.value }
      delete nextPending[key]
      pendingAddressByKey.value = nextPending

      if (!address || stopped.value) {
        failedAddressByKey.value = {
          ...failedAddressByKey.value,
          [key]: Date.now(),
        }
        scheduleFailedRetry()

        continue
      }

      resolvedAddressByKey.value = {
        ...resolvedAddressByKey.value,
        [key]: address,
      }

      const nextFailed = { ...failedAddressByKey.value }
      delete nextFailed[key]
      failedAddressByKey.value = nextFailed
      scheduleFailedRetry()
    }
  }

  watch(
    candidateSignature,
    () => {
      resolveVisibleRows()
    },
    {
      immediate: true,
    },
  )

  onBeforeUnmount(() => {
    stopped.value = true
    clearFailedRetryTimer()
  })

  const pendingAddressCount = computed(() => {
    if (!isEnabled.value) return 0

    return Object.keys(pendingAddressByKey.value).filter((key) => {
      return visibleAddressKeys.value.has(key)
    }).length
  })

  return {
    rowsWithResolvedAddresses,
    pendingAddressCount,
    reverseGeocodingAttribution: REVERSE_GEOCODING_ATTRIBUTION,
  }
}
