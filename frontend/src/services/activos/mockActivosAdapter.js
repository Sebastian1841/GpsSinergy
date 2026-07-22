import { useMockDatabase } from "../../composables/mock/useMockDatabase.js"

const buildFallbackPatent = (assets = []) => {
  return `MOCK-${String(assets.length + 1).padStart(3, "0")}`
}

export const createMockActivosAdapter = () => {
  const { assets, getApplicationForCompany, createAsset, updateAsset, deleteAsset } =
    useMockDatabase()

  const buildCreateActivoPayload = ({ activo, companyId }) => {
    const application = getApplicationForCompany(companyId)
    const patent = activo.patente || activo.patent || buildFallbackPatent(assets.value)

    return {
      ...activo,
      companyId,
      applicationId: application?.id || null,
      sucursalId: activo.sucursalId || null,
      patente: patent,
      patent,
    }
  }

  const createActivo = ({ activo, companyId }) => {
    return createAsset(
      buildCreateActivoPayload({
        activo,
        companyId,
      }),
    )
  }

  return {
    activos: assets,
    createActivo,
    updateActivo: updateAsset,
    deleteActivo: deleteAsset,
  }
}
