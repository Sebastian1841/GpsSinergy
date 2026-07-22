const normalizeId = (value) => {
  return String(value ?? "")
}

const normalizeBranchName = (value) => {
  return String(value || "").trim()
}

const createSucursalId = (companyId) => {
  return `sucursal-${normalizeId(companyId)}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const findSucursal = (sucursales = [], sucursalId) => {
  const normalizedSucursalId = normalizeId(sucursalId)

  return sucursales.find((sucursal) => {
    return normalizeId(sucursal.id) === normalizedSucursalId
  })
}

const buildSucursalPayload = ({ companyId, name, branch = {} }) => {
  const normalizedName = normalizeBranchName(branch.name ?? name)

  return {
    ...branch,
    id: branch.id || createSucursalId(companyId),
    name: normalizedName || "Nuevo grupo",
    active: branch.active ?? branch.enabled ?? true,
  }
}

export function useCompanyBranches({
  getCompany,
  updateCompany,
  addSucursal,
  updateSucursal,
  deleteSucursal,
  updateAsset,
} = {}) {
  const alternarSucursalesHabilitadas = (companyId, currentValue) => {
    const company = getCompany?.(companyId)

    if (!company) return null

    const currentEnabled =
      typeof currentValue === "boolean" ? currentValue : company.sucursalesHabilitadas !== false

    if (typeof updateCompany === "function") {
      return updateCompany(company.id, {
        sucursalesHabilitadas: !currentEnabled,
      })
    }

    company.sucursalesHabilitadas = !currentEnabled
    return company
  }

  const agregarSucursal = (companyId, branchOrName = {}) => {
    const company = getCompany?.(companyId)

    if (!company) return null

    const branch = typeof branchOrName === "string" ? {} : branchOrName
    const name = typeof branchOrName === "string" ? branchOrName : branchOrName.name
    const nextSucursal = buildSucursalPayload({
      companyId: company.id,
      name,
      branch,
    })

    if (!normalizeBranchName(nextSucursal.name)) return null

    if (typeof addSucursal === "function") {
      return addSucursal(company.id, nextSucursal)
    }

    company.sucursales = [...(company.sucursales || []), nextSucursal]

    return nextSucursal
  }

  const actualizarNombreSucursal = (sucursalId, name, sucursales = []) => {
    const nombreSucursal = normalizeBranchName(name)
    const sucursal = sucursales.length ? findSucursal(sucursales, sucursalId) : null
    const resolvedSucursalId = sucursal?.id || sucursalId

    if (!resolvedSucursalId || !nombreSucursal || typeof updateSucursal !== "function") {
      return null
    }

    return updateSucursal(resolvedSucursalId, {
      name: nombreSucursal,
    })
  }

  const alternarEstadoSucursal = (sucursalId, sucursalesOrActive = [], explicitActive = null) => {
    const sucursales = Array.isArray(sucursalesOrActive) ? sucursalesOrActive : []
    const nextActiveOverride =
      typeof sucursalesOrActive === "boolean" ? sucursalesOrActive : explicitActive
    const sucursal = sucursales.length ? findSucursal(sucursales, sucursalId) : null
    const resolvedSucursalId = sucursal?.id || sucursalId

    if (!resolvedSucursalId || typeof updateSucursal !== "function") return null

    if (typeof nextActiveOverride === "boolean") {
      return updateSucursal(resolvedSucursalId, {
        active: nextActiveOverride,
      })
    }

    if (!sucursal) return null

    return updateSucursal(resolvedSucursalId, {
      active: sucursal.active === false,
    })
  }

  const eliminarSucursal = (sucursalId, sucursales = []) => {
    const sucursal = sucursales.length ? findSucursal(sucursales, sucursalId) : null
    const resolvedSucursalId = sucursal?.id || sucursalId

    if (!resolvedSucursalId || typeof deleteSucursal !== "function") return null

    return deleteSucursal(resolvedSucursalId)
  }

  const actualizarSucursalActivo = (payloadOrAssetId, maybeSucursalId = null) => {
    const payload =
      payloadOrAssetId && typeof payloadOrAssetId === "object"
        ? payloadOrAssetId
        : {
            assetId: payloadOrAssetId,
            sucursalId: maybeSucursalId,
          }

    const resolvedAssetId = payload.asset?.id ?? payload.assetId
    const siguienteSucursalId = payload.sucursalId || null
    const sucursales = payload.sucursales || []

    if (!resolvedAssetId || typeof updateAsset !== "function") return null

    const sucursalExiste =
      !siguienteSucursalId ||
      !sucursales.length ||
      Boolean(findSucursal(sucursales, siguienteSucursalId))

    if (!sucursalExiste) return null

    return updateAsset(resolvedAssetId, {
      sucursalId: siguienteSucursalId,
    })
  }

  return {
    alternarSucursalesHabilitadas,
    agregarSucursal,
    actualizarNombreSucursal,
    alternarEstadoSucursal,
    eliminarSucursal,
    actualizarSucursalActivo,
  }
}
