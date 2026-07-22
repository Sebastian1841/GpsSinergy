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
const ActivosView = () => import("../views/ActivosView.vue")
const AuditView = () => import("../views/AuditView.vue")
const CompanyManagementView = () => import("../views/CompanyManagementView.vue")
const UserManagementView = () => import("../views/UserManagementView.vue")
const ReportsView = () => import("../views/ReportsView.vue")
const LoginView = () => import("../views/LoginView.vue")
const NoAccessView = () => import("../views/NoAccessView.vue")

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

const getLastAccessibleAssetsCompany = ({ accessibleCompanies, canAccessModule }) => {
  const companies = accessibleCompanies.value || []
  const cachedCompanyId = String(readLastCompanyId() || "")

  const cachedCompany = companies.find((company) => {
    return String(company.id) === cachedCompanyId && canAccessModule("assets", company.id)
  })

  if (cachedCompany) return cachedCompany

  return (
    companies.find((company) => {
      return canAccessModule("assets", company.id)
    }) || null
  )
}

// ==================
// RUTAS
// ==================
const routes = [
  {
    path: "/login",
    name: "Login",
    component: LoginView,
    meta: {
      public: true,
    },
  },
  {
    path: "/sin-acceso",
    name: "NoAccess",
    component: NoAccessView,
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
    component: ActivosView,
    meta: {
      requiresPlatformAdmin: true,
    },
  },

  // ==================
  // REPORTES GENERAL
  // ==================
  {
    path: "/reportes",
    name: "Reports",
    component: ReportsView,
    meta: {
      requiresPlatformAdmin: true,
    },
  },

  // ==================
  // AUDITORIA GENERAL
  // ==================
  {
    path: "/auditoria",
    name: "Audit",
    component: AuditView,
    meta: {
      requiresPlatformAdmin: true,
    },
  },

  // ==================
  // GESTION DE USUARIOS
  // ==================
  {
    path: "/usuarios",
    name: "UserManagement",
    component: UserManagementView,
    meta: {
      requiresUserManagementView: true,
    },
  },

  // ==================
  // GESTION DE EMPRESAS
  // ==================
  {
    path: "/empresas",
    name: "CompanyManagement",
    component: CompanyManagementView,
    meta: {
      requiresPlatformAdmin: true,
    },
  },

  // ==================
  // ACTIVOS EMPRESA
  // ==================
  {
    path: "/app/:empresaId/activos",
    name: "AppActivos",
    component: ActivosView,
    meta: {
      requiresModule: "assets",
    },
  },

  // ==================
  // REPORTES EMPRESA
  // ==================
  {
    path: "/app/:empresaId/reportes",
    name: "AppReports",
    component: ReportsView,
    meta: {
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
    component: AuditView,
    meta: {
      requiresFunction: {
        id: "audit-view",
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
    component: UserManagementView,
    meta: {
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
    component: CompanyManagementView,
    meta: {
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
