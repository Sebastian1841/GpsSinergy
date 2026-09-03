import { createRouter, createWebHistory } from "vue-router"
import { useAccessControl } from "../composables/auth/useAccessControl.js"
import { useAuthSession } from "../composables/auth/useAuthSession.js"
import {
  readStorageValue,
  removeStorageValue,
  writeStorageValue,
} from "../services/storage/browserStorage.js"

// ==================
// VISTAS
// ==================
const routeViewLoaders = {
  activos: () => import("../views/ActivosView.vue"),
  audit: () => import("../views/AuditView.vue"),
  companies: () => import("../views/CompanyManagementView.vue"),
  login: () => import("../views/LoginView.vue"),
  maintenance: () => import("../views/MaintenanceView.vue"),
  noAccess: () => import("../views/NoAccessView.vue"),
  reports: () => import("../views/ReportsView.vue"),
  users: () => import("../views/UserManagementView.vue"),
}

const PRIVATE_ROUTE_VIEW_KEYS = ["activos", "reports", "maintenance", "audit", "users", "companies"]
const preloadedRouteViewKeys = new Set()

export const preloadPrivateRouteViews = ({
  batchDelayMs = 280,
  exclude = [],
  startDelayMs = 1200,
} = {}) => {
  if (typeof window === "undefined") return () => {}

  const excludedKeys = new Set(exclude.filter(Boolean))
  const pendingKeys = PRIVATE_ROUTE_VIEW_KEYS.filter((key) => {
    return !excludedKeys.has(key) && !preloadedRouteViewKeys.has(key)
  })

  let cancelled = false
  let idleId = null
  let startTimeoutId = null
  let timeoutId = null

  const clearScheduledWork = () => {
    if (startTimeoutId !== null) {
      window.clearTimeout(startTimeoutId)
      startTimeoutId = null
    }

    if (idleId !== null && typeof window.cancelIdleCallback === "function") {
      window.cancelIdleCallback(idleId)
      idleId = null
    }

    if (timeoutId !== null) {
      window.clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  const scheduleNextLoad = () => {
    if (cancelled || !pendingKeys.length) return

    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(loadNextView, {
        timeout: 1800,
      })
      return
    }

    timeoutId = window.setTimeout(loadNextView, batchDelayMs)
  }

  const loadNextView = () => {
    if (cancelled) return

    idleId = null
    timeoutId = null

    const key = pendingKeys.shift()
    const loadView = routeViewLoaders[key]

    if (!loadView) {
      scheduleNextLoad()
      return
    }

    preloadedRouteViewKeys.add(key)

    loadView()
      .catch(() => {
        preloadedRouteViewKeys.delete(key)
      })
      .finally(() => {
        if (!cancelled && pendingKeys.length) {
          timeoutId = window.setTimeout(scheduleNextLoad, batchDelayMs)
        }
      })
  }

  startTimeoutId = window.setTimeout(() => {
    startTimeoutId = null
    scheduleNextLoad()
  }, startDelayMs)

  return () => {
    cancelled = true
    clearScheduledWork()
  }
}

const LAST_COMPANY_CACHE_KEY = "sinergy-last-company-id"

const readLastCompanyId = () => {
  return readStorageValue(LAST_COMPANY_CACHE_KEY)
}

const persistLastCompanyId = (companyId) => {
  if (companyId) {
    writeStorageValue(LAST_COMPANY_CACHE_KEY, companyId)
    return
  }

  removeStorageValue(LAST_COMPANY_CACHE_KEY)
}

const getLastAccessibleCompany = ({ accessibleCompanies, canAccess }) => {
  const companies = accessibleCompanies.value || []
  const cachedCompanyId = String(readLastCompanyId() || "")

  const cachedCompany = companies.find((company) => {
    return String(company.id) === cachedCompanyId && canAccess(company)
  })

  if (cachedCompany) return cachedCompany

  return (
    companies.find((company) => {
      return canAccess(company)
    }) || null
  )
}

const getLastAccessibleAssetsCompany = ({ accessibleCompanies, canAccessModule }) => {
  return getLastAccessibleCompany({
    accessibleCompanies,
    canAccess: (company) => canAccessModule("assets", company.id),
  })
}

const getLastAccessibleMaintenanceCompany = ({ accessibleCompanies, canAccessFunction }) => {
  return getLastAccessibleCompany({
    accessibleCompanies,
    canAccess: (company) => canAccessFunction("maintenance-view", company.id, "view"),
  })
}

// ==================
// RUTAS
// ==================
const routes = [
  {
    path: "/login",
    name: "Login",
    component: routeViewLoaders.login,
    meta: {
      public: true,
    },
  },
  {
    path: "/sin-acceso",
    name: "NoAccess",
    component: routeViewLoaders.noAccess,
  },

  // ==================
  // RUTA PRINCIPAL
  // ==================
  {
    path: "/",
    redirect: "/activos",
  },

  // ==================
  // ACTIVOS GENERAL
  // ==================
  {
    path: "/activos",
    name: "Activos",
    component: routeViewLoaders.activos,
    meta: {
      preloadKey: "activos",
      requiresPlatformAdmin: true,
    },
  },

  // ==================
  // REPORTES GENERAL
  // ==================
  {
    path: "/reportes",
    name: "Reports",
    component: routeViewLoaders.reports,
    meta: {
      preloadKey: "reports",
      requiresPlatformAdmin: true,
    },
  },

  // ==================
  // AUDITORIA GENERAL
  // ==================
  {
    path: "/auditoria",
    name: "Audit",
    component: routeViewLoaders.audit,
    meta: {
      preloadKey: "audit",
      requiresPlatformAdmin: true,
    },
  },

  // ==================
  // MANTENCIONES GENERAL
  // ==================
  {
    path: "/mantenciones",
    name: "Maintenance",
    component: routeViewLoaders.maintenance,
    meta: {
      preloadKey: "maintenance",
      requiresPlatformAdmin: true,
    },
  },

  // ==================
  // GESTION DE USUARIOS
  // ==================
  {
    path: "/usuarios",
    name: "UserManagement",
    component: routeViewLoaders.users,
    meta: {
      preloadKey: "users",
      requiresUserManagementView: true,
    },
  },

  // ==================
  // GESTION DE EMPRESAS
  // ==================
  {
    path: "/empresas",
    name: "CompanyManagement",
    component: routeViewLoaders.companies,
    meta: {
      preloadKey: "companies",
      requiresPlatformAdmin: true,
    },
  },

  // ==================
  // ACTIVOS EMPRESA
  // ==================
  {
    path: "/app/:empresaId/activos",
    name: "AppActivos",
    component: routeViewLoaders.activos,
    meta: {
      preloadKey: "activos",
      requiresModule: "assets",
    },
  },

  // ==================
  // REPORTES EMPRESA
  // ==================
  {
    path: "/app/:empresaId/reportes",
    name: "AppReports",
    component: routeViewLoaders.reports,
    meta: {
      preloadKey: "reports",
      requiresFunction: {
        id: "reports",
        permission: "view",
      },
    },
  },

  // ==================
  // AUDITORIA EMPRESA
  // ==================
  {
    path: "/app/:empresaId/auditoria",
    name: "AppAudit",
    component: routeViewLoaders.audit,
    meta: {
      preloadKey: "audit",
      requiresFunction: {
        id: "audit-view",
        permission: "view",
      },
    },
  },

  // ==================
  // MANTENCIONES EMPRESA
  // ==================
  {
    path: "/app/:empresaId/mantenciones",
    name: "AppMaintenance",
    component: routeViewLoaders.maintenance,
    meta: {
      preloadKey: "maintenance",
      requiresFunction: {
        id: "maintenance-view",
        permission: "view",
      },
    },
  },

  // ==================
  // GESTION DE USUARIOS EMPRESA
  // ==================
  {
    path: "/app/:empresaId/usuarios",
    name: "AppUserManagement",
    component: routeViewLoaders.users,
    meta: {
      preloadKey: "users",
      requiresFunction: {
        id: "users-view",
        permission: "view",
      },
    },
  },

  // ==================
  // GESTION DE EMPRESAS EMPRESA
  // ==================
  {
    path: "/app/:empresaId/empresas",
    name: "AppCompanyManagement",
    component: routeViewLoaders.companies,
    meta: {
      preloadKey: "companies",
      requiresPlatformAdmin: true,
    },
  },

  // ==================
  // LEGACY / REDIRECCIONES
  // ==================
  {
    path: "/dashboard",
    redirect: "/activos",
  },
  {
    path: "/admin",
    redirect: "/activos",
  },
  {
    path: "/admin/:pathMatch(.*)*",
    redirect: "/activos",
  },
  {
    path: "/app/:empresaId/dashboard",
    redirect: (to) => `/app/${to.params.empresaId}/activos`,
  },
  {
    path: "/app/:empresaId/can",
    redirect: (to) => `/app/${to.params.empresaId}/activos`,
  },
  {
    path: "/app/:empresaId/ranking",
    redirect: (to) => `/app/${to.params.empresaId}/activos`,
  },

  // ==================
  // CATCH ALL
  // ==================
  {
    path: "/:pathMatch(.*)*",
    redirect: "/activos",
  },
]

// ==================
// ROUTER
// ==================
const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const { isAuthenticated, isPlatformAdmin, defaultAuthenticatedRoute } = useAuthSession()
  const {
    accessibleCompanies,
    canAccessCompany,
    canAccessModule,
    canAccessFunction,
    canViewUsers,
  } = useAccessControl()

  if (to.meta.public) {
    return isAuthenticated.value ? defaultAuthenticatedRoute.value : true
  }

  if (!isAuthenticated.value) {
    return {
      name: "Login",
      query: {
        redirect: to.fullPath,
      },
    }
  }

  if (to.path === "/activos") {
    const targetCompany = getLastAccessibleAssetsCompany({
      accessibleCompanies,
      canAccessModule,
    })

    if (targetCompany) {
      return `/app/${targetCompany.id}/activos`
    }

    return isPlatformAdmin.value
      ? {
          name: "CompanyManagement",
        }
      : {
          name: "NoAccess",
        }
  }

  if (to.path === "/mantenciones") {
    const targetCompany = getLastAccessibleMaintenanceCompany({
      accessibleCompanies,
      canAccessFunction,
    })

    if (targetCompany) {
      return `/app/${targetCompany.id}/mantenciones`
    }
  }

  if (to.meta.requiresPlatformAdmin && !isPlatformAdmin.value) {
    return defaultAuthenticatedRoute.value === to.fullPath
      ? {
          name: "NoAccess",
        }
      : defaultAuthenticatedRoute.value
  }

  const companyId = to.params.empresaId

  if (companyId && !canAccessCompany(companyId)) {
    return defaultAuthenticatedRoute.value === to.fullPath
      ? {
          name: "NoAccess",
        }
      : defaultAuthenticatedRoute.value
  }

  if (to.meta.requiresModule && !canAccessModule(to.meta.requiresModule, companyId)) {
    return {
      name: "NoAccess",
    }
  }

  if (to.meta.requiresUserManagementView && !canViewUsers.value) {
    return defaultAuthenticatedRoute.value === to.fullPath
      ? {
          name: "NoAccess",
        }
      : defaultAuthenticatedRoute.value
  }

  if (to.meta.requiresFunction) {
    const functionAccess = to.meta.requiresFunction

    const canEnter = canAccessFunction(
      functionAccess.id,
      companyId || null,
      functionAccess.permission || "view",
    )

    if (!canEnter) {
      return {
        name: "NoAccess",
      }
    }
  }

  if (companyId) {
    persistLastCompanyId(companyId)
  }

  return true
})

export default router
