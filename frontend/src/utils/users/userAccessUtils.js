export const normalizeText = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase()
}

export const cloneData = (value) => {
  return JSON.parse(JSON.stringify(value))
}

export const getUserInitials = (name) => {
  return String(name || "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
}

export const getStatusLabel = (status) => {
  const labels = {
    active: "Activo",
    pending: "Pendiente",
    inactive: "Inactivo",
    internal: "Interna",
  }

  return labels[status] || "Sin estado"
}

export const getStatusClass = (status) => {
  const classes = {
    active: "bg-emerald-50 text-emerald-700",
    pending: "bg-[#fff3eb] text-[#ff6600]",
    inactive: "bg-slate-100 text-slate-500",
    internal: "bg-[#eef3ff] text-[#102372]",
  }

  return classes[status] || "bg-slate-100 text-slate-500"
}

export const getAvatarClass = (status) => {
  const classes = {
    active: "bg-[#102372]",
    pending: "bg-[#ff6600]",
    inactive: "bg-slate-400",
    internal: "bg-[#102372]",
  }

  return classes[status] || "bg-[#102372]"
}

export const getRoleLabel = (roles = [], roleId) => {
  return roles.find((role) => role.id === roleId)?.name || "Sin rol"
}

export const getCompanyById = (companies = [], companyId) => {
  return companies.find((company) => company.id === companyId) || null
}

export const getApplicationById = (applications = [], applicationId) => {
  return applications.find((application) => application.id === applicationId) || null
}

export const getModuleById = (modules = [], moduleId) => {
  return modules.find((module) => module.id === moduleId) || null
}

export const getModuleFunctionById = (moduleFunctions = [], functionId) => {
  return moduleFunctions.find((moduleFunction) => moduleFunction.id === functionId) || null
}

export const getApplicationCompany = ({ application, companies = [] }) => {
  if (!application) return null

  return getCompanyById(companies, application.companyId)
}

export const getEnabledModulesCount = (access) => {
  return (access?.modules || []).filter((moduleAccess) => moduleAccess.enabled).length
}

export const getAccessSummary = ({ access, applications = [], modules = [] }) => {
  const application = getApplicationById(applications, access?.applicationId)
  const enabledModules = getEnabledModulesCount(access)
  const totalModules = modules.length

  return {
    applicationName: application?.name || "Sin aplicación",
    applicationShortName: application?.shortName || "APP",
    enabledModules,
    totalModules,
  }
}

export const userMatchesSearch = ({
  user,
  accesses = [],
  applications = [],
  companies = [],
  modules = [],
  moduleFunctions = [],
  roles = [],
  term = "",
}) => {
  const normalizedTerm = normalizeText(term)

  if (!normalizedTerm) return true

  const userAccesses = accesses.filter((access) => access.userId === user.id)

  const searchableValues = [
    user.name,
    user.username,
    user.email,
    getStatusLabel(user.status),
    ...userAccesses.map((access) => getRoleLabel(roles, access.role)),
    ...userAccesses.map((access) => getApplicationById(applications, access.applicationId)?.name),
    ...userAccesses.map((access) => {
      const application = getApplicationById(applications, access.applicationId)
      const company = getApplicationCompany({ application, companies })

      return company?.name
    }),
    ...userAccesses.flatMap((access) => {
      return (access.modules || []).map((moduleAccess) => {
        return getModuleById(modules, moduleAccess.moduleId)?.name
      })
    }),
    ...userAccesses.flatMap((access) => {
      return (access.functions || []).map((functionAccess) => {
        return getModuleFunctionById(moduleFunctions, functionAccess.functionId)?.name
      })
    }),
  ]

  return searchableValues.some((value) => {
    return normalizeText(value).includes(normalizedTerm)
  })
}
