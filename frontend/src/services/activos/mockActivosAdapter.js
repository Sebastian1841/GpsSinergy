import { useMockDatabase } from "../../composables/mock/useMockDatabase.js"
import { normalizeFleetAssetTagIds } from "../../utils/activos/fleetAssetFormUtils.js"

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

      assetTagIds: normalizeFleetAssetTagIds(activo.assetTagIds),

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

  const updateActivo = (id, changes = {}) => {
    const normalizedChanges = {
      ...changes,
    }

    if (Object.prototype.hasOwnProperty.call(changes, "assetTagIds")) {
      normalizedChanges.assetTagIds = normalizeFleetAssetTagIds(changes.assetTagIds)
    }

    return updateAsset(id, normalizedChanges)
  }

  return {
    activos: assets,
    createActivo,
    updateActivo,
    deleteActivo: deleteAsset,
  }
}
