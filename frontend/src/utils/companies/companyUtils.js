export const cloneCompanyData = (value) => {
  return JSON.parse(JSON.stringify(value))
}

export const getCompanyInitials = (name = "") => {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

export const getCompanyStatusLabel = (status) => {
  const labels = {
    active: "Activa",
    pending: "Pendiente",
    inactive: "Suspendida",
    internal: "Interna",
  }

  return labels[status] || "Sin estado"
}

export const getCompanyStatusClass = (status) => {
  const classes = {
    active: "bg-emerald-50 text-emerald-700",
    pending: "bg-amber-50 text-amber-700",
    inactive: "bg-slate-100 text-slate-500",
    internal: "bg-[#eef3ff] text-[#102372]",
  }

  return classes[status] || "bg-slate-100 text-slate-500"
}

export const getCompanyWorkspacePath = (company = {}) => {
  return company.workspacePath || `/app/${company.id}/activos`
}

export const getEnabledCompanyReports = (company = {}) => {
  return (company.reports || []).filter((reportAccess) => reportAccess.enabled)
}

export const getCompanyOperationHealth = (company = {}) => {
  const totalAssets = Number(company.assetsCount) || 0
  const activeAssets = Number(company.activeAssetsCount) || 0

  if (!totalAssets) return 0

  return Math.round((activeAssets / totalAssets) * 100)
}

export const companyMatchesSearch = ({ company, term = "" }) => {
  const normalizedTerm = term.trim().toLowerCase()

  if (!normalizedTerm) return true

  const searchableText = [
    company.name,
    company.rut,
    company.contactName,
    company.contactEmail,
    company.region,
    company.city,
    ...(company.sucursales || []).map((sucursal) => sucursal.name),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  return searchableText.includes(normalizedTerm)
}
