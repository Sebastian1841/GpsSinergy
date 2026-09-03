<template>
  <section
    class="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-[#d8dee8] bg-white shadow-sm"
  >
    <template v-if="user">
      <!-- CABECERA -->
      <header class="shrink-0 border-b border-[#edf1f5] bg-white px-5 pt-4">
        <div class="flex items-start justify-between gap-4">
          <div class="flex min-w-0 items-center gap-3">
            <div
              class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#102372] text-[13px] font-black text-white"
            >
              {{ getUserInitials(user.name) }}
            </div>

            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="truncate text-[17px] font-black text-[#102372]">
                  {{ user.name }}
                </h2>

                <span class="rounded-full px-2.5 py-1 text-[10px] font-black" :class="statusClass">
                  {{ getStatusLabel(user.status) }}
                </span>
              </div>

              <p class="mt-0.5 truncate text-[12px] font-semibold text-slate-500">
                {{ user.email }}
              </p>

              <p class="mt-0.5 truncate text-[11px] font-semibold text-slate-400">
                {{ primaryRoleLabel }}
              </p>

              <span
                v-if="isPlatformAdminUser"
                class="mt-2 inline-flex rounded-full border border-[#ff6600]/20 bg-[#fff7ed] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.04em] text-[#ff6600]"
              >
                Acceso total
              </span>
            </div>
          </div>

          <div class="flex shrink-0 gap-2">
            <button
              v-if="canImpersonate"
              type="button"
              class="hidden h-9 rounded-lg border border-[#d8dee8] bg-white px-3 text-[11px] font-black text-[#102372] transition hover:border-[#102372] hover:bg-[#f8fafc] sm:block"
              @click="$emit('impersonate-user')"
            >
              Ver como usuario
            </button>

            <button
              v-if="canEditUsers"
              type="button"
              class="h-9 rounded-lg border border-[#d8dee8] bg-white px-3 text-[11px] font-black text-[#102372] transition hover:border-[#102372] hover:bg-[#f8fafc]"
              @click="$emit('edit-user')"
            >
              Editar
            </button>
          </div>
        </div>

        <nav class="mt-4 flex gap-6">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            type="button"
            class="-mb-px border-b-2 px-1 pb-3 text-[12px] font-black transition"
            :class="
              activeTab === tab.id
                ? 'border-[#102372] text-[#102372]'
                : 'border-transparent text-slate-400 hover:text-[#102372]'
            "
            @click="selectTab(tab.id)"
          >
            {{ tab.label }}
          </button>
        </nav>
      </header>

      <!-- CONTENIDO -->
      <div class="min-h-0 flex-1 overflow-auto bg-[#f3f6fa] p-4">
        <!-- ===================================================== -->
        <!-- RESUMEN                                               -->
        <!-- ===================================================== -->
        <template v-if="activeTab === 'summary'">
          <div class="grid gap-3">
            <section
              v-if="isPlatformAdminUser"
              class="rounded-xl border border-[#ff6600]/20 bg-[#fff7ed] px-4 py-3"
            >
              <h3 class="text-[12px] font-black text-[#102372]">
                Administrador de plataforma
              </h3>

              <p class="mt-1 text-[11px] font-semibold leading-5 text-slate-600">
                Este usuario mantiene acceso activo a todas las empresas, modulos, funciones y
                activos. Sus permisos no se editan manualmente desde esta vista.
              </p>
            </section>

            <!-- DATOS DEL USUARIO -->
            <section class="overflow-hidden rounded-xl border border-[#d8dee8] bg-white">
              <header
                class="flex items-center justify-between gap-4 border-b border-[#edf1f5] px-4 py-3"
              >
                <div>
                  <h3 class="text-[14px] font-black text-[#102372]">Datos de la cuenta</h3>

                  <p class="mt-0.5 text-[11px] font-semibold text-slate-500">
                    Información básica del usuario.
                  </p>
                </div>

                <button
                  v-if="canEditUsers"
                  type="button"
                  class="shrink-0 text-[11px] font-black text-[#102372] transition hover:text-[#ff6600]"
                  @click="$emit('edit-user')"
                >
                  Editar
                </button>
              </header>

              <dl class="grid sm:grid-cols-2">
                <div
                  v-for="item in generalInfoRows"
                  :key="item.label"
                  class="min-w-0 border-b border-[#edf1f5] px-4 py-3.5 odd:sm:border-r"
                >
                  <dt class="text-[10px] font-black uppercase tracking-[0.05em] text-slate-400">
                    {{ item.label }}
                  </dt>

                  <dd
                    class="mt-1 truncate text-[12px] font-bold text-[#172033]"
                    :title="item.value"
                  >
                    {{ item.value }}
                  </dd>
                </div>
              </dl>
            </section>

            <!-- ACCESOS DEL USUARIO -->
            <section class="overflow-hidden rounded-xl border border-[#d8dee8] bg-white">
              <header
                class="flex items-center justify-between gap-4 border-b border-[#edf1f5] px-4 py-3"
              >
                <div>
                  <h3 class="text-[14px] font-black text-[#102372]">Accesos asignados</h3>

                  <p class="mt-0.5 text-[11px] font-semibold text-slate-500">
                    {{ accessCountLabel }}
                  </p>
                </div>

                <button
                  type="button"
                  class="shrink-0 text-[11px] font-black text-[#102372] transition hover:text-[#ff6600]"
                  @click="openAccesses"
                >
                  Administrar
                </button>
              </header>

              <!-- CABECERA -->
              <div
                v-if="accessRows.length"
                class="hidden grid-cols-[minmax(0,1fr)_160px_110px_24px] gap-3 border-b border-[#edf1f5] bg-[#f8fafc] px-4 py-2.5 sm:grid"
              >
                <span class="access-header"> Empresa / aplicación </span>

                <span class="access-header"> Rol </span>

                <span class="access-header"> Estado </span>

                <span></span>
              </div>

              <!-- FILAS -->
              <div class="divide-y divide-[#edf1f5]">
                <button
                  v-for="access in accessRows.slice(0, 4)"
                  :key="access.id"
                  type="button"
                  class="group grid w-full gap-2 px-4 py-3.5 text-left transition hover:bg-[#f8fafc] sm:grid-cols-[minmax(0,1fr)_160px_110px_24px] sm:items-center sm:gap-3"
                  @click="openAccess(access.id)"
                >
                  <div class="min-w-0">
                    <p class="truncate text-[12px] font-black text-[#172033]">
                      {{ access.company }}
                    </p>

                    <p class="mt-0.5 truncate text-[11px] font-semibold text-slate-500">
                      {{ access.application }}
                    </p>
                  </div>

                  <span class="truncate text-[11px] font-bold text-[#334155]">
                    {{ access.role }}
                  </span>

                  <span>
                    <span
                      class="inline-flex rounded-full px-2.5 py-1 text-[9px] font-black"
                      :class="
                        access.active
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      "
                    >
                      {{ access.statusLabel }}
                    </span>
                  </span>

                  <span
                    class="hidden text-right text-[20px] font-light text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#102372] sm:block"
                  >
                    ›
                  </span>
                </button>

                <div v-if="!accessRows.length" class="px-4 py-8 text-center">
                  <p class="text-[12px] font-black text-[#102372]">Sin accesos asignados</p>

                  <p class="mt-1 text-[11px] font-semibold text-slate-500">
                    Este usuario todavía no tiene empresas o aplicaciones asignadas.
                  </p>
                </div>
              </div>
            </section>

            <!-- ESTADO -->
            <section
              v-if="canEditUsers && !isPlatformAdminUser"
              class="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#d8dee8] bg-white px-4 py-3.5"
            >
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <h3 class="text-[13px] font-black text-[#102372]">Estado de la cuenta</h3>

                  <span class="rounded-full px-2.5 py-1 text-[9px] font-black" :class="statusClass">
                    {{ getStatusLabel(user.status) }}
                  </span>
                </div>

                <p class="mt-1 text-[11px] font-semibold text-slate-500">
                  {{ accountStatusDescription }}
                </p>
              </div>

              <button
                type="button"
                class="h-9 shrink-0 rounded-lg border px-4 text-[11px] font-black transition"
                :class="
                  user.status === 'active'
                    ? 'border-red-200 bg-white text-red-500 hover:bg-red-50'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                "
                @click="$emit('toggle-user-status')"
              >
                {{ user.status === "active" ? "Suspender usuario" : "Activar usuario" }}
              </button>
            </section>
          </div>
        </template>

        <!-- ===================================================== -->
        <!-- ACCESOS                                               -->
        <!-- ===================================================== -->
        <template v-else-if="activeTab === 'accesses'">
          <!-- LISTA -->
          <template v-if="!selectedAccess">
            <section class="relative overflow-visible rounded-xl border border-[#d8dee8] bg-white">
              <!-- CABECERA -->
              <header class="relative z-20 border-b border-[#edf1f5] bg-white px-4 py-3">
                <div class="flex items-center justify-between gap-4">
                  <div>
                    <h3 class="text-[14px] font-black text-[#102372]">Accesos del usuario</h3>

                    <p class="mt-0.5 text-[11px] font-semibold text-slate-500">
                      Selecciona un acceso para administrar su rol, permisos y alcance.
                    </p>
                  </div>

                  <span
                    class="shrink-0 rounded-full bg-[#f8fafc] px-2.5 py-1 text-[10px] font-black text-slate-500"
                  >
                    {{ accesses.length }}
                  </span>
                </div>

                <!-- AGREGAR ACCESO -->
                <div v-if="canManageUserPermissions" class="relative z-30 mt-4">
                  <p
                    class="mb-1.5 text-[10px] font-black uppercase tracking-[0.05em] text-slate-400"
                  >
                    Agregar acceso
                  </p>

                  <div class="flex gap-2">
                    <div class="min-w-0 flex-1">
                      <UserApplicationSearchSelect
                        v-model="applicationToAddId"
                        :applications="availableApplications"
                        :companies="companies"
                      />
                    </div>

                    <button
                      type="button"
                      class="h-10 shrink-0 rounded-lg bg-[#ff6600] px-5 text-[11px] font-black text-white transition hover:bg-[#e65c00] disabled:cursor-not-allowed disabled:bg-slate-300"
                      :disabled="!applicationToAddId"
                      @click="handleAddApplicationAccess"
                    >
                      Agregar
                    </button>
                  </div>
                </div>
              </header>

              <!-- CABECERA LISTA -->
              <div
                v-if="accessRows.length"
                class="relative z-10 hidden grid-cols-[minmax(0,1fr)_160px_110px_24px] gap-3 border-b border-[#edf1f5] bg-[#f8fafc] px-4 py-2.5 sm:grid"
              >
                <span class="access-header"> Empresa / aplicación </span>

                <span class="access-header"> Rol </span>

                <span class="access-header"> Estado </span>

                <span></span>
              </div>

              <!-- ACCESOS -->
              <div class="relative z-10 bg-white">
                <section
                  v-for="group in groupedAccessRows"
                  :key="group.key"
                  class="border-b border-[#edf1f5] last:border-b-0"
                >
                  <div
                    v-if="showAccessCompanyGroups"
                    class="flex items-center justify-between gap-3 border-b border-[#edf1f5] bg-[#f8fafc] px-4 py-2"
                  >
                    <p class="truncate text-[10px] font-black uppercase tracking-[0.08em] text-[#102372]">
                      {{ group.label }}
                    </p>

                    <span
                      class="shrink-0 rounded-full bg-white px-2 py-0.5 text-[9px] font-black text-slate-500"
                    >
                      {{ group.rows.length }}
                    </span>
                  </div>

                  <button
                    v-for="access in group.rows"
                    :key="access.id"
                    type="button"
                    class="group grid w-full gap-2 border-b border-[#edf1f5] px-4 py-4 text-left transition last:border-b-0 hover:bg-[#f8fafc] sm:grid-cols-[minmax(0,1fr)_160px_110px_24px] sm:items-center sm:gap-3"
                    @click="openAccess(access.id)"
                  >
                    <div class="min-w-0">
                      <p class="truncate text-[12px] font-black text-[#172033]">
                        {{ showAccessCompanyGroups ? access.application : access.company }}
                      </p>

                      <p class="mt-0.5 truncate text-[11px] font-semibold text-slate-500">
                        {{ showAccessCompanyGroups ? access.company : access.application }}
                      </p>
                    </div>

                    <span class="truncate text-[11px] font-bold text-[#334155]">
                      {{ access.role }}
                    </span>

                    <span>
                      <span
                        class="inline-flex rounded-full px-2.5 py-1 text-[9px] font-black"
                        :class="
                          access.active
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        "
                      >
                        {{ access.statusLabel }}
                      </span>
                    </span>

                    <span
                      class="hidden text-right text-[20px] font-light text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#102372] sm:block"
                    >
                      ›
                    </span>
                  </button>
                </section>

                <div v-if="!accessRows.length" class="p-8 text-center">
                  <p class="text-[12px] font-black text-[#102372]">Sin accesos asignados</p>

                  <p class="mt-1 text-[11px] font-semibold text-slate-500">
                    Agrega una aplicación para comenzar.
                  </p>
                </div>
              </div>
            </section>
          </template>

          <!-- ACCESO SELECCIONADO -->
          <template v-else>
            <div class="grid gap-3">
              <button
                type="button"
                class="flex w-fit items-center gap-2 text-[11px] font-black text-[#102372] transition hover:text-[#ff6600]"
                @click="selectedAccessId = null"
              >
                <span class="text-[18px] font-light"> ‹ </span>

                Volver a accesos
              </button>

              <UserCompanyAccessMatrix
                :accesses="[selectedAccess]"
                :applications="applications"
                :companies="companies"
                :modules="modules"
                :module-functions="moduleFunctions"
                :permissions="permissions"
                :scopes="scopes"
                :roles="roles"
                :assets="assets"
                :asset-tags="assetTags"
                :can-manage-user-permissions="canManageUserPermissions"
                @update-access-role="handleUpdateAccessRole"
                @toggle-access-status="handleToggleAccessStatus"
                @remove-application-access="handleRemoveApplicationAccess"
                @toggle-module-access="handleToggleModuleAccess"
                @toggle-function-access="handleToggleFunctionAccess"
                @toggle-permission="handleTogglePermission"
                @update-operational-scope="handleUpdateOperationalScope"
                @toggle-scope-asset="handleToggleScopeAsset"
                @toggle-scope-asset-tag="handleToggleScopeAssetTag"
              />
            </div>
          </template>
        </template>

        <!-- ===================================================== -->
        <!-- AUDITORÍA                                             -->
        <!-- ===================================================== -->
        <template v-else>
          <section
            class="mx-auto max-w-[560px] rounded-xl border border-[#d8dee8] bg-white p-6 text-center"
          >
            <h3 class="text-[14px] font-black text-[#102372]">Auditoría del usuario</h3>

            <p
              class="mx-auto mt-2 max-w-[460px] text-[11px] font-semibold leading-5 text-slate-500"
            >
              Los cambios de perfil, accesos, permisos y alcance se registran en el módulo de
              auditoría general.
            </p>
          </section>
        </template>
      </div>
    </template>

    <!-- SIN USUARIO -->
    <div
      v-else
      class="flex min-h-[320px] flex-1 flex-col items-center justify-center p-6 text-center"
    >
      <p class="text-[13px] font-black text-[#102372]">Selecciona un usuario</p>

      <p class="mt-1 text-[11px] font-semibold text-slate-500">Su información aparecerá aquí.</p>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from "vue"

import UserApplicationSearchSelect from "./UserApplicationSearchSelect.vue"
import UserCompanyAccessMatrix from "./UserCompanyAccessMatrix.vue"

import { getStatusLabel, getUserInitials } from "../../utils/users/userAccessUtils.js"

const props = defineProps({
  user: {
    type: Object,
    default: null,
  },
  accesses: {
    type: Array,
    default: () => [],
  },
  applications: {
    type: Array,
    default: () => [],
  },
  companies: {
    type: Array,
    default: () => [],
  },
  modules: {
    type: Array,
    default: () => [],
  },
  moduleFunctions: {
    type: Array,
    default: () => [],
  },
  permissions: {
    type: Array,
    default: () => [],
  },
  scopes: {
    type: Array,
    default: () => [],
  },
  roles: {
    type: Array,
    default: () => [],
  },
  assets: {
    type: Array,
    default: () => [],
  },
  assetTags: {
    type: Array,
    default: () => [],
  },
  canImpersonate: {
    type: Boolean,
    default: false,
  },
  canEditUsers: {
    type: Boolean,
    default: false,
  },
  canManageUserPermissions: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  "impersonate-user",
  "edit-user",
  "toggle-user-status",
  "add-application-access",
  "update-access-role",
  "toggle-access-status",
  "remove-application-access",
  "toggle-module-access",
  "toggle-function-access",
  "toggle-permission",
  "update-operational-scope",
  "toggle-scope-asset",
  "toggle-scope-asset-tag",
])

const tabs = [
  {
    id: "summary",
    label: "Resumen",
  },
  {
    id: "accesses",
    label: "Accesos",
  },
  {
    id: "audit",
    label: "Auditoría",
  },
]

const activeTab = ref("summary")
const applicationToAddId = ref("")
const selectedAccessId = ref(null)

const applicationsById = computed(() => {
  return new Map(props.applications.map((application) => [String(application.id), application]))
})

const companiesById = computed(() => {
  return new Map(props.companies.map((company) => [String(company.id), company]))
})

const rolesById = computed(() => {
  return new Map(props.roles.map((role) => [String(role.id), role]))
})

const primaryRoleLabel = computed(() => {
  if (isPlatformAdminUser.value) return "Administrador de plataforma"

  const access = props.accesses[0]

  return rolesById.value.get(String(access?.role ?? ""))?.name || "Sin rol"
})

const isPlatformAdminUser = computed(() => {
  return Boolean(props.user?.isPlatformAdmin)
})

const generalInfoRows = computed(() => {
  return [
    {
      label: "Nombre",
      value: props.user?.name || "-",
    },
    {
      label: "Usuario",
      value: props.user?.username || "-",
    },
    {
      label: "Correo",
      value: props.user?.email || "-",
    },
    {
      label: "Rol principal",
      value: primaryRoleLabel.value,
    },
  ]
})

const accessCountLabel = computed(() => {
  const count = props.accesses.length

  return `${count} ${count === 1 ? "acceso asignado" : "accesos asignados"}`
})

const accountStatusDescription = computed(() => {
  if (props.user?.status === "active") {
    return "El usuario puede acceder actualmente al sistema."
  }

  if (props.user?.status === "pending") {
    return "La cuenta está pendiente de habilitación."
  }

  return "El usuario no puede acceder actualmente al sistema."
})

const availableApplications = computed(() => {
  const usedIds = new Set(
    props.accesses.map((access) => {
      return String(access.applicationId)
    }),
  )

  return props.applications.filter((application) => {
    return !usedIds.has(String(application.id))
  })
})

const accessRows = computed(() => {
  return props.accesses.map((access) => {
    const application = applicationsById.value.get(String(access.applicationId))

    const company = companiesById.value.get(String(application?.companyId ?? ""))

    const active = access.status === "active"

    return {
      id: access.id,
      companyId: company?.id || application?.companyId || "",
      company: company?.name || "Empresa sin nombre",
      application: application?.name || application?.label || "Aplicación sin nombre",
      role: rolesById.value.get(String(access.role))?.name || "Sin rol",
      active,
      statusLabel: active ? "Activo" : "Inactivo",
    }
  })
})

const groupedAccessRows = computed(() => {
  const groupsByCompany = new Map()

  accessRows.value.forEach((access) => {
    const companyKey = String(access.companyId || access.company || "sin-empresa")
    const currentGroup = groupsByCompany.get(companyKey) || {
      key: companyKey,
      label: access.company,
      rows: [],
    }

    currentGroup.rows.push(access)
    groupsByCompany.set(companyKey, currentGroup)
  })

  return Array.from(groupsByCompany.values()).sort((left, right) => {
    return left.label.localeCompare(right.label, "es", {
      sensitivity: "base",
    })
  })
})

const showAccessCompanyGroups = computed(() => {
  return groupedAccessRows.value.length > 1
})

const selectedAccess = computed(() => {
  return (
    props.accesses.find((access) => {
      return String(access.id) === String(selectedAccessId.value)
    }) || null
  )
})

const statusClass = computed(() => {
  if (props.user?.status === "active") {
    return "bg-emerald-50 text-emerald-700"
  }

  if (props.user?.status === "pending") {
    return "bg-[#fff7ed] text-[#ff6600]"
  }

  return "bg-slate-100 text-slate-500"
})

const selectTab = (tabId) => {
  activeTab.value = tabId

  if (tabId !== "accesses") {
    selectedAccessId.value = null
  }
}

const openAccesses = () => {
  activeTab.value = "accesses"
  selectedAccessId.value = null
}

const openAccess = (accessId) => {
  activeTab.value = "accesses"
  selectedAccessId.value = accessId
}

watch(
  () => props.user?.id,
  () => {
    activeTab.value = "summary"
    applicationToAddId.value = ""
    selectedAccessId.value = null
  },
)

watch(availableApplications, (applications) => {
  if (
    applicationToAddId.value &&
    !applications.some((application) => {
      return String(application.id) === String(applicationToAddId.value)
    })
  ) {
    applicationToAddId.value = ""
  }
})

watch(
  () => props.accesses.map((access) => String(access.id)),
  (accessIds) => {
    if (selectedAccessId.value && !accessIds.includes(String(selectedAccessId.value))) {
      selectedAccessId.value = null
    }
  },
)

const handleAddApplicationAccess = () => {
  if (!props.canManageUserPermissions || !applicationToAddId.value) {
    return
  }

  emit("add-application-access", applicationToAddId.value)
  applicationToAddId.value = ""
}

const handleUpdateAccessRole = (accessId, roleId) => {
  if (!props.canManageUserPermissions) return

  emit("update-access-role", accessId, roleId)
}

const handleToggleAccessStatus = (accessId) => {
  if (!props.canManageUserPermissions) return

  emit("toggle-access-status", accessId)
}

const handleRemoveApplicationAccess = (accessId) => {
  if (!props.canManageUserPermissions) return

  emit("remove-application-access", accessId)

  if (String(selectedAccessId.value) === String(accessId)) {
    selectedAccessId.value = null
  }
}

const handleToggleModuleAccess = (accessId, moduleId) => {
  if (!props.canManageUserPermissions) return

  emit("toggle-module-access", accessId, moduleId)
}

const handleToggleFunctionAccess = (accessId, functionId) => {
  if (!props.canManageUserPermissions) return

  emit("toggle-function-access", accessId, functionId)
}

const handleTogglePermission = (accessId, functionId, permissionId) => {
  if (!props.canManageUserPermissions) return

  emit("toggle-permission", accessId, functionId, permissionId)
}

const handleUpdateOperationalScope = (accessId, scopeType) => {
  if (!props.canManageUserPermissions) return

  emit("update-operational-scope", accessId, scopeType)
}

const handleToggleScopeAsset = (accessId, assetId) => {
  if (!props.canManageUserPermissions) return

  emit("toggle-scope-asset", accessId, assetId)
}

const handleToggleScopeAssetTag = (accessId, tagId) => {
  if (!props.canManageUserPermissions) return

  emit("toggle-scope-asset-tag", accessId, tagId)
}
</script>

<style scoped>
.access-header {
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #94a3b8;
}
</style>
