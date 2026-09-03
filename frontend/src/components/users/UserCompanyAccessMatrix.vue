<template>
  <section class="grid gap-3">
    <article
      v-for="access in accesses"
      :key="access.id"
      class="overflow-hidden rounded-xl border border-[#d8dee8] bg-white"
    >
      <!-- CABECERA DEL ACCESO -->
      <header class="border-b border-[#edf1f5] px-4 py-3">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="min-w-0">
            <h3 class="truncate text-[12px] font-black text-[#102372]">
              {{ getCompanyName(access.applicationId) }}
            </h3>

            <p class="mt-0.5 truncate text-[9px] font-semibold text-slate-500">
              {{ getApplication(access.applicationId)?.name || "Aplicación sin nombre" }}
              ·
              {{ getApplication(access.applicationId)?.assetsCount || 0 }}
              activos
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <!-- ROL -->
            <select
              :value="access.role"
              :disabled="!canManageUserPermissions"
              class="h-8 min-w-[150px] rounded-lg border border-[#d8dee8] bg-white px-2 text-[9px] font-black text-[#102372] outline-none transition focus:border-[#102372] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              :class="canManageUserPermissions ? 'cursor-pointer' : 'cursor-not-allowed'"
              aria-label="Rol del acceso"
              @change="$emit('update-access-role', access.id, $event.target.value)"
            >
              <option v-for="role in roles" :key="role.id" :value="role.id">
                {{ role.name }}
              </option>
            </select>

            <!-- ESTADO -->
            <button
              type="button"
              class="h-8 rounded-lg border px-3 text-[9px] font-black transition disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
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

            <!-- QUITAR -->
            <button
              v-if="canManageUserPermissions"
              type="button"
              class="h-8 rounded-lg border border-[#d8dee8] bg-white px-3 text-[9px] font-black text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              @click="$emit('remove-application-access', access.id)"
            >
              Quitar
            </button>
          </div>
        </div>
      </header>

      <!-- NAVEGACIÓN -->
      <nav class="flex border-b border-[#edf1f5] bg-white px-4">
        <button
          type="button"
          class="-mb-px border-b-2 px-1 py-3 text-[10px] font-black transition"
          :class="
            getActivePanel(access.id) === 'permissions'
              ? 'border-[#102372] text-[#102372]'
              : 'border-transparent text-slate-400 hover:text-[#102372]'
          "
          @click="setActivePanel(access.id, 'permissions')"
        >
          Permisos
        </button>

        <button
          type="button"
          class="-mb-px ml-5 border-b-2 px-1 py-3 text-[10px] font-black transition"
          :class="
            getActivePanel(access.id) === 'scope'
              ? 'border-[#102372] text-[#102372]'
              : 'border-transparent text-slate-400 hover:text-[#102372]'
          "
          @click="setActivePanel(access.id, 'scope')"
        >
          Alcance
        </button>
      </nav>

      <!-- CONTENIDO -->
      <div class="bg-[#f8fafc] p-3">
        <!-- PERMISOS -->
        <UserModulePermissionGrid
          v-if="getActivePanel(access.id) === 'permissions'"
          :access="access"
          :modules="modules"
          :module-functions="moduleFunctions"
          :permissions="permissions"
          :can-manage-user-permissions="canManageUserPermissions"
          @toggle-module-access="handleToggleModuleAccess"
          @toggle-function-access="handleToggleFunctionAccess"
          @toggle-permission="handleTogglePermission"
        />

        <!-- ALCANCE -->
        <UserOperationalScopePanel
          v-else
          :access="access"
          :scopes="scopes"
          :assets="assets"
          :asset-tags="getApplicationAssetTags(access.applicationId)"
          :can-manage-user-permissions="canManageUserPermissions"
          @update-operational-scope="handleUpdateOperationalScope"
          @toggle-scope-asset="handleToggleScopeAsset"
          @toggle-scope-asset-tag="handleToggleScopeAssetTag"
        />
      </div>
    </article>

    <!-- SIN ACCESOS -->
    <div
      v-if="!accesses.length"
      class="flex min-h-[180px] flex-col items-center justify-center rounded-xl border border-dashed border-[#cbd5e1] bg-white p-6 text-center"
    >
      <p class="text-[11px] font-black text-[#102372]">Sin accesos asignados</p>

      <p class="mt-1 text-[9px] font-semibold text-slate-500">
        Agrega una empresa para configurar permisos.
      </p>
    </div>
  </section>
</template>

<script setup>
import { ref } from "vue"

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
  assetTags: {
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
  "toggle-scope-asset-tag",
])

const activePanels = ref({})

const getActivePanel = (accessId) => {
  return activePanels.value[String(accessId)] || "permissions"
}

const setActivePanel = (accessId, panel) => {
  activePanels.value = {
    ...activePanels.value,
    [String(accessId)]: panel,
  }
}

const getApplication = (applicationId) => {
  return (
    props.applications.find((application) => {
      return String(application.id) === String(applicationId)
    }) || null
  )
}

const getCompanyName = (applicationId) => {
  const application = getApplication(applicationId)

  const company = props.companies.find((item) => {
    return String(item.id) === String(application?.companyId)
  })

  return company?.name || "Empresa sin nombre"
}

const getApplicationAssetTags = (applicationId) => {
  const application = getApplication(applicationId)
  const applicationKey = String(applicationId || "")
  const companyKey = String(application?.companyId || "")
  const companyName = getCompanyName(applicationId)

  return props.assetTags
    .filter((tag) => {
      if (tag.active === false) return false

      const tagApplicationKey = String(tag.applicationId || "")
      const tagCompanyKey = String(tag.companyId || "")

      return (
        (tagApplicationKey && tagApplicationKey === applicationKey) ||
        (companyKey && tagCompanyKey === companyKey)
      )
    })
    .map((tag) => {
      return {
        ...tag,
        applicationId: tag.applicationId || applicationKey,
        companyId: tag.companyId || companyKey,
        companyName: tag.companyName || companyName,
      }
    })
}

const handleUpdateOperationalScope = (accessId, scopeId) => {
  if (!props.canManageUserPermissions) return

  emit("update-operational-scope", accessId, scopeId)
}

const handleToggleScopeAsset = (accessId, assetId) => {
  if (!props.canManageUserPermissions) return

  emit("toggle-scope-asset", accessId, assetId)
}

const handleToggleScopeAssetTag = (accessId, tagId) => {
  if (!props.canManageUserPermissions) return

  emit("toggle-scope-asset-tag", accessId, tagId)
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
