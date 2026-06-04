import { computed, ref, watch } from "vue"

import { mockCompanyRecords } from "../../../data/companies/mockCompanyManagementData.js"

const PATENT_LETTERS = "BCDFGHJKLMPRSTVWXYZ"

const cloneData = (value) => JSON.parse(JSON.stringify(value))

const buildMockPatent = (companyId, assetId, index) => {
  const seedSource = `${companyId}-${assetId}-${index}`
  let seed = seedSource.split("").reduce((total, character) => {
    return total * 31 + character.charCodeAt(0)
  }, 17)

  const letters = Array.from({ length: 4 }, () => {
    const letter = PATENT_LETTERS[Math.abs(seed) % PATENT_LETTERS.length]

    seed = Math.trunc(seed / PATENT_LETTERS.length)
    return letter
  })

  const digits = String((Math.abs(seed) % 90) + 10)

  return `${letters[0]}${letters[1]}-${letters[2]}${letters[3]}-${digits}`
}

const getStorageKey = (companyId) => {
  return `sinergy-sucursales-flota-${companyId || "general"}`
}

const getLegacyStorageKey = (companyId) => {
  return `sinergy-fleet-branches-${companyId || "general"}`
}

const readStoredState = (companyId) => {
  if (typeof window === "undefined") return null

  try {
    const serializedState =
      window.localStorage.getItem(getStorageKey(companyId)) ||
      window.localStorage.getItem(getLegacyStorageKey(companyId))

    const parsedState = JSON.parse(serializedState || "null")

    if (!parsedState || typeof parsedState !== "object") return null

    const storedSucursales = parsedState.sucursales || parsedState.branches
    const storedAssets = Array.isArray(parsedState.assets) ? parsedState.assets : []
    const storedAssignments = parsedState.asignacionesActivos || parsedState.assetAssignments

    return {
      sucursalesHabilitadas:
        parsedState.sucursalesHabilitadas ?? parsedState.branchesEnabled ?? true,
      sucursales: Array.isArray(storedSucursales) ? storedSucursales : [],
      assets: storedAssets.map((asset) => ({
        ...asset,
        sucursalId: asset.sucursalId ?? asset.branchId ?? null,
      })),
      asignacionesActivos:
        storedAssignments && typeof storedAssignments === "object" ? storedAssignments : {},
    }
  } catch {
    return null
  }
}

const writeStoredState = (storageKey, state) => {
  if (typeof window === "undefined") return

  try {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        ...state,
        updatedAt: new Date().toISOString(),
      }),
    )
  } catch {
    // Local storage is optional for the frontend-only prototype.
  }
}

const getSucursalesPredeterminadas = (companyId) => {
  const company = mockCompanyRecords.find((item) => String(item.id) === String(companyId))
  const sucursales = company?.sucursales?.length
    ? company.sucursales
    : [{ id: `sucursal-${companyId || "general"}-001`, name: "Casa matriz" }]

  return cloneData(sucursales).map((sucursal) => ({
    ...sucursal,
    active: sucursal.active ?? true,
  }))
}

export function useSucursalesFlota({ activos, companyId = "general" }) {
  const storageKey = getStorageKey(companyId)
  const storedState = readStoredState(companyId)

  const sucursalesHabilitadas = ref(storedState?.sucursalesHabilitadas ?? true)
  const sucursales = ref(
    Array.isArray(storedState?.sucursales)
      ? storedState.sucursales
      : getSucursalesPredeterminadas(companyId),
  )
  const idsSucursalesValidas = new Set(sucursales.value.map((sucursal) => sucursal.id))
  const asignacionesActivos = ref(
    Object.fromEntries(
      Object.entries(storedState?.asignacionesActivos || {}).map(([assetId, sucursalId]) => [
        assetId,
        idsSucursalesValidas.has(sucursalId) ? sucursalId : null,
      ]),
    ),
  )

  let assignmentsInitialized = false

  const empresaSucursales = computed(() => {
    const fleetAssets = activos.value || []

    return {
      id: companyId,
      sucursalesHabilitadas: sucursalesHabilitadas.value,
      sucursales: sucursales.value,
      assetsCount: fleetAssets.length,
      assets: fleetAssets.map((activo, index) => {
        const assetId = String(activo.id)

        return {
          id: assetId,
          patent: activo.patente || activo.patent || buildMockPatent(companyId, assetId, index),
          sucursalId: asignacionesActivos.value[assetId] || null,
        }
      }),
    }
  })

  const persistirSucursales = () => {
    writeStoredState(storageKey, {
      sucursalesHabilitadas: sucursalesHabilitadas.value,
      sucursales: sucursales.value,
      assets: empresaSucursales.value.assets,
      asignacionesActivos: asignacionesActivos.value,
    })
  }

  const alternarSucursalesHabilitadas = () => {
    sucursalesHabilitadas.value = !sucursalesHabilitadas.value
  }

  const agregarSucursal = (name) => {
    const nombreSucursal = String(name || "").trim()

    if (!nombreSucursal) return

    sucursales.value = [
      ...sucursales.value,
      {
        id: `sucursal-${companyId}-${Date.now()}`,
        name: nombreSucursal,
        active: true,
      },
    ]
  }

  const actualizarNombreSucursal = (sucursalId, name) => {
    const sucursal = sucursales.value.find((item) => item.id === sucursalId)

    if (!sucursal) return

    sucursal.name = name
  }

  const alternarEstadoSucursal = (sucursalId) => {
    const sucursal = sucursales.value.find((item) => item.id === sucursalId)

    if (!sucursal) return

    sucursal.active = !sucursal.active
  }

  const eliminarSucursal = (sucursalId) => {
    sucursales.value = sucursales.value.filter((sucursal) => sucursal.id !== sucursalId)

    const nextAssignments = {
      ...asignacionesActivos.value,
    }

    Object.entries(nextAssignments).forEach(([assetId, sucursalAsignadaId]) => {
      if (sucursalAsignadaId === sucursalId) {
        nextAssignments[assetId] = null
      }
    })

    asignacionesActivos.value = nextAssignments
  }

  const actualizarSucursalActivo = ({ assetId, sucursalId }) => {
    const normalizedAssetId = String(assetId)
    const siguienteSucursalId = sucursalId || null
    const sucursalExiste =
      !siguienteSucursalId ||
      sucursales.value.some((sucursal) => sucursal.id === siguienteSucursalId)

    if (!sucursalExiste) return

    asignacionesActivos.value = {
      ...asignacionesActivos.value,
      [normalizedAssetId]: siguienteSucursalId,
    }
  }

  watch(
    activos,
    (fleetAssets = []) => {
      const validAssetIds = new Set(fleetAssets.map((activo) => String(activo.id)))
      const hasMatchingAssignments = fleetAssets.some((activo) => {
        return Object.prototype.hasOwnProperty.call(asignacionesActivos.value, String(activo.id))
      })

      const nextAssignments = Object.fromEntries(
        Object.entries(asignacionesActivos.value).filter(([assetId]) => validAssetIds.has(assetId)),
      )

      if (
        !assignmentsInitialized &&
        !hasMatchingAssignments &&
        fleetAssets.length &&
        sucursales.value.length
      ) {
        const assignedLimit = Math.floor(fleetAssets.length * 0.85)

        fleetAssets.forEach((activo, index) => {
          nextAssignments[String(activo.id)] =
            index < assignedLimit ? sucursales.value[index % sucursales.value.length].id : null
        })
      }

      if (fleetAssets.length) assignmentsInitialized = true

      asignacionesActivos.value = nextAssignments
    },
    { immediate: true },
  )

  watch([sucursalesHabilitadas, sucursales, asignacionesActivos], persistirSucursales, {
    deep: true,
  })

  return {
    empresaSucursales,
    alternarSucursalesHabilitadas,
    agregarSucursal,
    actualizarNombreSucursal,
    alternarEstadoSucursal,
    eliminarSucursal,
    actualizarSucursalActivo,
  }
}
