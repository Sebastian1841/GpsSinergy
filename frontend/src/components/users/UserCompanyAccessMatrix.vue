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
              class="h-8 cursor-pointer rounded-lg border border-[#d8dee8] bg-white px-2 text-[10px] font-black text-[#102372] outline-none transition focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/10"
              @change="$emit('update-access-role', access.id, $event.target.value)"
            >
              <option v-for="role in roles" :key="role.id" :value="role.id">
                {{ role.name }}
              </option>
            </select>

            <button
              type="button"
              class="h-8 rounded-lg border px-3 text-[10px] font-black transition"
              :class="
                access.status === 'active'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-slate-100 text-slate-500'
              "
              @click="$emit('toggle-access-status', access.id)"
            >
              {{ access.status === "active" ? "Activo" : "Inactivo" }}
            </button>

            <button
              type="button"
              class="h-8 rounded-lg border border-[#d8dee8] bg-white px-3 text-[10px] font-black text-slate-500 transition hover:border-red-200 hover:text-red-600"
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
          @toggle-module-access="handleToggleModuleAccess"
          @toggle-function-access="handleToggleFunctionAccess"
          @toggle-permission="handleTogglePermission"
        />

        <UserOperationalScopePanel
          :access="access"
          :scopes="scopes"
          :assets="assets"
          @update-operational-scope="handleUpdateOperationalScope"
          @toggle-scope-option="handleToggleScopeOption"
          @toggle-scope-asset="handleToggleScopeAsset"
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
})

const emit = defineEmits([
  "update-access-role",
  "toggle-access-status",
  "remove-application-access",
  "toggle-module-access",
  "toggle-function-access",
  "toggle-permission",
  "update-operational-scope",
  "toggle-scope-option",
  "toggle-scope-asset",
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
  emit("update-operational-scope", accessId, scopeId)
}

const handleToggleScopeOption = (accessId, optionKey) => {
  emit("toggle-scope-option", accessId, optionKey)
}

const handleToggleScopeAsset = (accessId, assetId) => {
  emit("toggle-scope-asset", accessId, assetId)
}

const handleToggleModuleAccess = (accessId, moduleId) => {
  emit("toggle-module-access", accessId, moduleId)
}

const handleToggleFunctionAccess = (accessId, functionId) => {
  emit("toggle-function-access", accessId, functionId)
}

const handleTogglePermission = (accessId, functionId, permissionId) => {
  emit("toggle-permission", accessId, functionId, permissionId)
}
</script>
