<template>
  <section class="grid gap-4">
    <article
      v-for="(access, index) in accesses"
      :key="access.id"
      class="overflow-hidden rounded-xl border-2 border-[#cbd5e1] bg-white shadow-sm"
    >
      <header class="border-b border-[#d8dee8] bg-[#f8fafc] px-3 py-3">
        <div class="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div class="flex min-w-0 items-center gap-3">
            <span
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#102372] text-[11px] font-black text-white"
            >
              {{ index + 1 }}
            </span>

            <div class="min-w-0">
              <p class="text-[9px] font-black uppercase tracking-[0.14em] text-[#ff6600]">
                Empresa {{ index + 1 }}
              </p>

              <p class="truncate text-[13px] font-black text-[#102372]">
                {{ getApplication(access.applicationId)?.name || "Aplicación sin nombre" }}
              </p>

              <p class="mt-0.5 truncate text-[10px] font-semibold text-slate-500">
                {{ getCompanyName(access.applicationId) }} ·
                {{ getApplication(access.applicationId)?.assetsCount || 0 }} activos
              </p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <select
              :value="access.role"
              :disabled="!canManageUserPermissions"
              class="h-8 rounded-lg border border-[#d8dee8] bg-white px-2 text-[10px] font-black text-[#102372] outline-none transition focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              :class="canManageUserPermissions ? 'cursor-pointer' : 'cursor-not-allowed'"
              @change="$emit('update-access-role', access.id, $event.target.value)"
            >
              <option v-for="role in roles" :key="role.id" :value="role.id">
                {{ role.name }}
              </option>
            </select>

            <button
              type="button"
              class="h-8 rounded-lg border px-3 text-[10px] font-black transition disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
              :class="
                access.status === 'active'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-slate-100 text-slate-500'
              "
              :disabled="!canManageUserPermissions"
              @click="$emit('toggle-access-status', access.id)"
            >
              {{ access.status === "active" ? "Activo" : "Inactivo" }}
            </button>

            <button
              type="button"
              class="h-8 rounded-lg border border-[#d8dee8] bg-white px-3 text-[10px] font-black text-slate-500 transition hover:border-red-200 hover:text-red-600 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:hover:border-slate-200 disabled:hover:text-slate-400"
              :disabled="!canManageUserPermissions"
              @click="$emit('remove-application-access', access.id)"
            >
              Quitar
            </button>
          </div>
        </div>
      </header>

      <div class="grid gap-3 p-3 xl:grid-cols-[minmax(0,1fr)_280px]">
        <UserModulePermissionGrid
          :access="access"
          :modules="modules"
          :module-functions="moduleFunctions"
          :permissions="permissions"
          :can-manage-user-permissions="canManageUserPermissions"
          @toggle-module-access="handleToggleModuleAccess"
          @toggle-function-access="handleToggleFunctionAccess"
          @toggle-permission="handleTogglePermission"
        />

        <UserOperationalScopePanel
          :access="access"
          :scopes="scopes"
          :assets="assets"
          :sucursales="getApplication(access.applicationId)?.sucursales || []"
          :can-manage-user-permissions="canManageUserPermissions"
          @update-operational-scope="handleUpdateOperationalScope"
          @toggle-scope-asset="handleToggleScopeAsset"
          @toggle-scope-sucursal="handleToggleScopeSucursal"
        />
      </div>
    </article>

    <div
      v-if="!accesses.length"
      class="flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-6 text-center"
    >
      <p class="text-[13px] font-black text-[#102372]">Sin empresas asociadas</p>
      <p class="mt-1 text-[11px] font-semibold text-slate-500">
        Agrega una empresa para configurar sus módulos y permisos.
      </p>
    </div>
  </section>
</template>

<script setup>
import UserModulePermissionGrid from "./UserModulePermissionGrid.vue"
import UserOperationalScopePanel from "./UserOperationalScopePanel.vue"

const props = defineProps({
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
  canManageUserPermissions: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  "update-access-role",
  "toggle-access-status",
  "remove-application-access",
  "toggle-module-access",
  "toggle-function-access",
  "toggle-permission",
  "update-operational-scope",
  "toggle-scope-asset",
  "toggle-scope-sucursal",
])

const getApplication = (applicationId) => {
  return props.applications.find((application) => application.id === applicationId) || null
}

const getCompanyName = (applicationId) => {
  const application = getApplication(applicationId)
  const company = props.companies.find((item) => item.id === application?.companyId)

  return company?.name || "Empresa sin nombre"
}

const handleUpdateOperationalScope = (accessId, scopeId) => {
  if (!props.canManageUserPermissions) return

  emit("update-operational-scope", accessId, scopeId)
}

const handleToggleScopeAsset = (accessId, assetId) => {
  if (!props.canManageUserPermissions) return

  emit("toggle-scope-asset", accessId, assetId)
}

const handleToggleScopeSucursal = (accessId, sucursalId) => {
  if (!props.canManageUserPermissions) return

  emit("toggle-scope-sucursal", accessId, sucursalId)
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
</script>
