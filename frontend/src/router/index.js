import { createRouter, createWebHistory } from "vue-router"

// ==================
// VISTAS
// ==================
import ActivosView from "../views/ActivosView.vue"

const CompanyManagementView = () => import("../views/CompanyManagementView.vue")
const UserManagementView = () => import("../views/UserManagementView.vue")

// ==================
// RUTAS
// ==================
const routes = [
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
  },

  // ==================
  // GESTION DE USUARIOS
  // ==================
  {
    path: "/usuarios",
    name: "UserManagement",
    component: UserManagementView,
  },

  // ==================
  // GESTION DE EMPRESAS
  // ==================
  {
    path: "/empresas",
    name: "CompanyManagement",
    component: CompanyManagementView,
  },

  // ==================
  // ACTIVOS EMPRESA
  // ==================
  {
    path: "/app/:empresaId/activos",
    name: "AppActivos",
    component: ActivosView,
  },

  // ==================
  // GESTION DE USUARIOS EMPRESA
  // ==================
  {
    path: "/app/:empresaId/usuarios",
    name: "AppUserManagement",
    component: UserManagementView,
  },

  // ==================
  // GESTION DE EMPRESAS EMPRESA
  // ==================
  {
    path: "/app/:empresaId/empresas",
    name: "AppCompanyManagement",
    component: CompanyManagementView,
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

export default router
