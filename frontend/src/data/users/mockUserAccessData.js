export const mockCompanies = [
  {
    id: "company-001",
    name: "Transportes San Pedro",
    rut: "76.452.123-8",
    status: "active",
  },
  {
    id: "company-002",
    name: "Forestal Los Robles",
    rut: "77.891.244-5",
    status: "active",
  },
  {
    id: "company-003",
    name: "Constructora Norte",
    rut: "78.234.111-2",
    status: "active",
  },
  {
    id: "company-004",
    name: "Sinergy Interno",
    rut: "76.000.000-0",
    status: "internal",
  },
]

export const mockApplications = [
  {
    id: "app-001",
    companyId: "company-001",
    name: "Transportes San Pedro",
    shortName: "TSP",
    type: "Empresa cliente",
    status: "active",
    assetsCount: 42,
    sucursales: [
      { id: "sucursal-tsp-001", name: "Casa matriz" },
      { id: "sucursal-tsp-002", name: "Operación norte" },
    ],
  },
  {
    id: "app-002",
    companyId: "company-002",
    name: "Forestal Los Robles",
    shortName: "FLR",
    type: "Empresa cliente",
    status: "active",
    assetsCount: 18,
    sucursales: [
      { id: "sucursal-flr-001", name: "Planta Temuco" },
      { id: "sucursal-flr-002", name: "Zona cordillera" },
    ],
  },
  {
    id: "app-003",
    companyId: "company-003",
    name: "Constructora Norte",
    shortName: "CN",
    type: "Empresa cliente",
    status: "active",
    assetsCount: 27,
    sucursales: [
      { id: "sucursal-cn-001", name: "Faena principal" },
      { id: "sucursal-cn-002", name: "Bodega norte" },
    ],
  },
  {
    id: "app-004",
    companyId: "company-004",
    name: "Sinergy Interno",
    shortName: "SG",
    type: "Administración interna",
    status: "internal",
    assetsCount: 7,
    sucursales: [{ id: "sucursal-sg-001", name: "Operación interna" }],
  },
]

export const mockSystemModules = [
  {
    id: "assets",
    name: "Activos",
    description: "Gestión operativa de flota, mapa, rutas, geocercas y reportes.",
  },
  {
    id: "users",
    name: "Usuarios",
    description: "Administración de cuentas, empresas asignadas y permisos.",
  },
]

export const mockModuleFunctions = [
  {
    id: "gps",
    moduleId: "assets",
    name: "Control GPS",
    description: "Monitoreo de activos, mapa, estados y telemetría.",
  },
  {
    id: "geofences",
    moduleId: "assets",
    name: "Geocercas",
    description: "Zonas, entradas, salidas y control territorial.",
  },
  {
    id: "itineraries",
    moduleId: "assets",
    name: "Itinerarios",
    description: "Historial de recorridos, rutas y trazabilidad.",
  },
  {
    id: "maintenance",
    moduleId: "assets",
    name: "Mantenciones",
    description: "Control operacional de mantenimiento.",
  },
  {
    id: "reports",
    moduleId: "assets",
    name: "Reportes",
    description: "Exportaciones, informes y análisis operativo.",
  },
  {
    id: "users-view",
    moduleId: "users",
    name: "Ver usuarios",
    description: "Permite consultar cuentas y accesos asignados.",
  },
  {
    id: "users-create",
    moduleId: "users",
    name: "Crear usuarios",
    description: "Permite registrar nuevos usuarios.",
  },
  {
    id: "users-edit",
    moduleId: "users",
    name: "Editar usuarios",
    description: "Permite modificar datos base de usuarios.",
  },
  {
    id: "users-permissions",
    moduleId: "users",
    name: "Modificar permisos",
    description: "Permite cambiar empresas, módulos, funciones y permisos.",
  },
]
export const mockPermissions = [
  { id: "view", name: "Ver" },
  { id: "edit", name: "Editar" },
  { id: "admin", name: "Administrar" },
]

export const mockOperationalScopes = [
  {
    id: "all-assets",
    name: "Todos los activos",
    description: "Permite acceder a la flota completa de la aplicación.",
  },
  {
    id: "sucursal",
    name: "Sucursal asignada",
    description: "Limita la vista a una o más sucursales.",
  },
  {
    id: "selected-assets",
    name: "Activos específicos",
    description: "Permite asignar solo vehículos determinados.",
  },
  {
    id: "critical-alerts",
    name: "Alertas críticas",
    description: "Permite gestionar eventos relevantes.",
  },
  {
    id: "reports",
    name: "Reportes",
    description: "Permite visualizar reportes operativos.",
  },
]

export const mockRoles = [
  {
    id: "admin",
    name: "Administrador",
  },
  {
    id: "supervisor",
    name: "Supervisor",
  },
  {
    id: "operator",
    name: "Operador",
  },
  {
    id: "technician",
    name: "Técnico",
  },
  {
    id: "viewer",
    name: "Visualizador",
  },
]

export const mockUsers = [
  {
    id: "user-001",
    name: "Administrador Principal",
    username: "admin",
    password: "admin1234",
    email: "admin@sinergy.cl",
    status: "active",
    lastAccess: "Hoy 09:42",
  },
  {
    id: "user-002",
    name: "Operador Flota Norte",
    username: "operador-norte",
    password: "operador1234",
    email: "operador.norte@sinergy.cl",
    status: "active",
    lastAccess: "Hoy 08:16",
  },
  {
    id: "user-003",
    name: "Supervisor Territorial",
    username: "supervisor-geo",
    password: "supervisor1234",
    email: "supervisor.geo@sinergy.cl",
    status: "active",
    lastAccess: "Ayer 17:55",
  },
  {
    id: "user-004",
    name: "Visualizador Cliente",
    username: "cliente",
    password: "cliente1234",
    email: "cliente@sinergy.cl",
    status: "pending",
    lastAccess: "-",
  },
  {
    id: "user-005",
    name: "Soporte Técnico",
    username: "soporte",
    password: "soporte1234",
    email: "soporte@sinergy.cl",
    status: "inactive",
    lastAccess: "Lun 18:03",
  },
]

export const mockUserAccesses = [
  {
    id: "access-001",
    userId: "user-001",
    applicationId: "app-001",
    role: "admin",
    status: "active",
    modules: [
      {
        moduleId: "gps",
        enabled: true,
        permissions: { view: true, edit: true, admin: true },
      },
      {
        moduleId: "geofences",
        enabled: true,
        permissions: { view: true, edit: true, admin: true },
      },
      {
        moduleId: "itineraries",
        enabled: true,
        permissions: { view: true, edit: true, admin: false },
      },
      {
        moduleId: "maintenance",
        enabled: true,
        permissions: { view: true, edit: true, admin: false },
      },
      {
        moduleId: "reports",
        enabled: true,
        permissions: { view: true, edit: false, admin: false },
      },
    ],
    scope: {
      type: "all-assets",
      sucursalIds: [],
      assetIds: [],
      criticalAlerts: true,
      reports: true,
    },
  },
  {
    id: "access-002",
    userId: "user-001",
    applicationId: "app-002",
    role: "supervisor",
    status: "active",
    modules: [
      {
        moduleId: "gps",
        enabled: true,
        permissions: { view: true, edit: true, admin: false },
      },
      {
        moduleId: "geofences",
        enabled: true,
        permissions: { view: true, edit: false, admin: false },
      },
      {
        moduleId: "itineraries",
        enabled: true,
        permissions: { view: true, edit: false, admin: false },
      },
      {
        moduleId: "maintenance",
        enabled: false,
        permissions: { view: false, edit: false, admin: false },
      },
      {
        moduleId: "reports",
        enabled: true,
        permissions: { view: true, edit: false, admin: false },
      },
    ],
    scope: {
      type: "sucursal",
      sucursalIds: ["sucursal-flr-001"],
      assetIds: [],
      criticalAlerts: false,
      reports: true,
    },
  },
  {
    id: "access-003",
    userId: "user-002",
    applicationId: "app-003",
    role: "operator",
    status: "active",
    modules: [
      {
        moduleId: "gps",
        enabled: true,
        permissions: { view: true, edit: true, admin: false },
      },
      {
        moduleId: "geofences",
        enabled: false,
        permissions: { view: false, edit: false, admin: false },
      },
      {
        moduleId: "itineraries",
        enabled: true,
        permissions: { view: true, edit: false, admin: false },
      },
      {
        moduleId: "maintenance",
        enabled: false,
        permissions: { view: false, edit: false, admin: false },
      },
      {
        moduleId: "reports",
        enabled: false,
        permissions: { view: false, edit: false, admin: false },
      },
    ],
    scope: {
      type: "sucursal",
      sucursalIds: ["sucursal-cn-001"],
      assetIds: [],
      criticalAlerts: true,
      reports: false,
    },
  },
  {
    id: "access-004",
    userId: "user-003",
    applicationId: "app-001",
    role: "supervisor",
    status: "active",
    modules: [
      {
        moduleId: "gps",
        enabled: true,
        permissions: { view: true, edit: false, admin: false },
      },
      {
        moduleId: "geofences",
        enabled: true,
        permissions: { view: true, edit: true, admin: false },
      },
      {
        moduleId: "itineraries",
        enabled: false,
        permissions: { view: false, edit: false, admin: false },
      },
      {
        moduleId: "maintenance",
        enabled: false,
        permissions: { view: false, edit: false, admin: false },
      },
      {
        moduleId: "reports",
        enabled: true,
        permissions: { view: true, edit: false, admin: false },
      },
    ],
    scope: {
      type: "all-assets",
      sucursalIds: [],
      assetIds: [],
      criticalAlerts: false,
      reports: true,
    },
  },
  {
    id: "access-005",
    userId: "user-004",
    applicationId: "app-001",
    role: "viewer",
    status: "pending",
    modules: [
      {
        moduleId: "gps",
        enabled: true,
        permissions: { view: true, edit: false, admin: false },
      },
      {
        moduleId: "geofences",
        enabled: false,
        permissions: { view: false, edit: false, admin: false },
      },
      {
        moduleId: "itineraries",
        enabled: false,
        permissions: { view: false, edit: false, admin: false },
      },
      {
        moduleId: "maintenance",
        enabled: false,
        permissions: { view: false, edit: false, admin: false },
      },
      {
        moduleId: "reports",
        enabled: false,
        permissions: { view: false, edit: false, admin: false },
      },
    ],
    scope: {
      type: "sucursal",
      sucursalIds: ["sucursal-tsp-001"],
      assetIds: [],
      criticalAlerts: false,
      reports: false,
    },
  },
]
