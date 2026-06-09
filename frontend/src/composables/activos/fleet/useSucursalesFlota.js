import { computed, unref } from "vue"

import { useCompanyBranches } from "../../companies/useCompanyBranches.js"
import { useMockDatabase } from "../../mock/useMockDatabase.js"

const getPatent = (activo) => {
  return activo.patente || activo.patent || activo.vehiculo || `Activo ${activo.id}`
}

export function useSucursalesFlota({ activos, companyId = "general" }) {
  const {
    companyRecords,
    getCompany,
    updateCompany,
    updateAsset,
    addSucursal: addDatabaseSucursal,
    updateSucursal,
    deleteSucursal: deleteDatabaseSucursal,
  } = useMockDatabase()

  const {
    alternarSucursalesHabilitadas: toggleCompanyBranchesEnabled,
    agregarSucursal: addCompanyBranch,
    actualizarNombreSucursal: updateCompanyBranchName,
    alternarEstadoSucursal: toggleCompanyBranchStatus,
    eliminarSucursal: deleteCompanyBranch,
    actualizarSucursalActivo: updateAssetBranch,
  } = useCompanyBranches({
    getCompany,
    updateCompany,
    updateAsset,
    addSucursal: addDatabaseSucursal,
    updateSucursal,
    deleteSucursal: deleteDatabaseSucursal,
  })

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

    toggleCompanyBranchesEnabled(
      selectedCompany.value.id,
      empresaSucursales.value.sucursalesHabilitadas,
    )
  }

  const agregarSucursal = (name) => {
    if (!selectedCompany.value) return

    addCompanyBranch(selectedCompany.value.id, name)
  }

  const actualizarNombreSucursal = (sucursalId, name) => {
    updateCompanyBranchName(sucursalId, name, empresaSucursales.value.sucursales)
  }

  const alternarEstadoSucursal = (sucursalId) => {
    toggleCompanyBranchStatus(sucursalId, empresaSucursales.value.sucursales)
  }

  const eliminarSucursal = (sucursalId) => {
    deleteCompanyBranch(sucursalId, empresaSucursales.value.sucursales)
  }

  const actualizarSucursalActivo = ({ assetId, sucursalId }) => {
    const asset = selectedCompanyAssets.value.find((item) => {
      return String(item.id) === String(assetId)
    })

    if (!asset) return

    updateAssetBranch({
      asset,
      sucursalId,
      sucursales: empresaSucursales.value.sucursales,
    })
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
