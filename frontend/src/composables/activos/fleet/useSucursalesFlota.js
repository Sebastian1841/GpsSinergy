import { computed, unref } from "vue"

import { useMockDatabase } from "../../mock/useMockDatabase.js"

const getPatent = (activo) => {
  return activo.patente || activo.patent || activo.vehiculo || `Activo ${activo.id}`
}

export function useSucursalesFlota({ activos, companyId = "general" }) {
  const {
    companies,
    companyRecords,
    updateCompany,
    updateAsset,
    addSucursal: addDatabaseSucursal,
    updateSucursal,
    deleteSucursal: deleteDatabaseSucursal,
  } = useMockDatabase()

  const resolvedCompanyId = computed(() => String(unref(companyId) || ""))

  const selectedCompany = computed(() => {
    return (
      companyRecords.value.find((company) => {
        return String(company.id) === resolvedCompanyId.value
      }) || null
    )
  })

  const selectedCompanyAssets = computed(() => {
    if (!selectedCompany.value) return []

    return (unref(activos) || []).filter((activo) => {
      return (
        String(activo.companyId) === String(selectedCompany.value.id) ||
        String(activo.applicationId) === String(selectedCompany.value.applicationId)
      )
    })
  })

  const empresaSucursales = computed(() => {
    const company = selectedCompany.value
    const fleetAssets = selectedCompanyAssets.value

    return {
      id: company?.id || null,
      name: company?.name || "",
      sucursalesHabilitadas: Boolean(company && company.sucursalesHabilitadas !== false),
      sucursales: company?.sucursales || [],
      assetsCount: fleetAssets.length,
      assets: fleetAssets.map((activo) => ({
        id: String(activo.id),
        patent: getPatent(activo),
        sucursalId: activo.sucursalId || null,
      })),
    }
  })

  const alternarSucursalesHabilitadas = () => {
    if (!selectedCompany.value) return

    const nextValue = !empresaSucursales.value.sucursalesHabilitadas

    updateCompany(selectedCompany.value.id, { sucursalesHabilitadas: nextValue })
  }

  const agregarSucursal = (name) => {
    const nombreSucursal = String(name || "").trim()

    if (!selectedCompany.value || !nombreSucursal) return

    addDatabaseSucursal(selectedCompany.value.id, {
      id: `sucursal-${selectedCompany.value.id}-${Date.now()}`,
      name: nombreSucursal,
      active: true,
    })
  }

  const actualizarNombreSucursal = (sucursalId, name) => {
    const sucursal = empresaSucursales.value.sucursales.find((item) => item.id === sucursalId)

    if (!sucursal) return

    updateSucursal(sucursalId, { name })
  }

  const alternarEstadoSucursal = (sucursalId) => {
    const sucursal = empresaSucursales.value.sucursales.find((item) => item.id === sucursalId)

    if (!sucursal) return

    updateSucursal(sucursalId, { active: !sucursal.active })
  }

  const eliminarSucursal = (sucursalId) => {
    const sucursal = empresaSucursales.value.sucursales.find((item) => item.id === sucursalId)

    if (!sucursal) return

    deleteDatabaseSucursal(sucursalId)
  }

  const actualizarSucursalActivo = ({ assetId, sucursalId }) => {
    const asset = selectedCompanyAssets.value.find((item) => String(item.id) === String(assetId))

    if (!asset) return

    const siguienteSucursalId = sucursalId || null
    const ownerCompany = companies.value.find((company) => company.id === asset.companyId)
    const sucursalExiste =
      !siguienteSucursalId ||
      ownerCompany?.sucursales?.some((sucursal) => sucursal.id === siguienteSucursalId)

    if (!sucursalExiste) return

    updateAsset(asset.id, { sucursalId: siguienteSucursalId })
  }

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
