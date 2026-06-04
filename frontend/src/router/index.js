import { createRouter, createWebHistory } from "vue-router"
import { useAccessControl } from "../composables/auth/useAccessControl.js"
import { useAuthSession } from "../composables/auth/useAuthSession.js"

// ==================
// VISTAS
// ==================
import ActivosView from "../views/ActivosView.vue"

const CompanyManagementView = () => import("../views/CompanyManagementView.vue")
const UserManagementView = () => import("../views/UserManagementView.vue")
const LoginView = () => import("../views/LoginView.vue")
const NoAccessView = () => import("../views/NoAccessView.vue")

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
  // GESTION DE USUARIOS
  // ==================
  {
    path: "/usuarios",
    name: "UserManagement",
    component: UserManagementView,
    meta: {
      requiresPlatformAdmin: true,
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
  // GESTION DE USUARIOS EMPRESA
  // ==================
  {
    path: "/app/:empresaId/usuarios",
    name: "AppUserManagement",
    component: UserManagementView,
    meta: {
      requiresPlatformAdmin: true,
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
  const { canAccessCompany, canAccessModule } = useAccessControl()

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

  return true
})

export default router
