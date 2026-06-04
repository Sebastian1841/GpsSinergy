<template>
  <section
    class="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-[#d8dee8] bg-white"
  >
    <header class="shrink-0 border-b border-[#edf1f5] px-4 py-3">
      <div v-if="user" class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex min-w-0 items-center gap-3">
          <div
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[13px] font-black text-white"
            :class="getAvatarClass(user.status)"
          >
            {{ getUserInitials(user.name) }}
          </div>

          <div class="min-w-0">
            <h2 class="truncate text-[16px] font-black text-[#102372]">
              {{ user.name }}
            </h2>

            <p class="truncate text-[11px] font-semibold text-slate-500">
              @{{ user.username || "sin-usuario" }} · {{ user.email }} ·
              {{ getStatusLabel(user.status) }}
            </p>
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            v-if="canImpersonate"
            type="button"
            class="h-9 rounded-lg bg-[#102372] px-3 text-[10px] font-black text-white transition hover:bg-[#0c1b59]"
            @click="$emit('impersonate-user')"
          >
            Ver como usuario
          </button>

          <button
            v-if="!user.isPlatformAdmin"
            type="button"
            class="h-9 rounded-lg border border-[#d8dee8] bg-white px-3 text-[10px] font-black text-[#102372] transition hover:border-[#102372]/40"
            @click="$emit('edit-user')"
          >
            Editar
          </button>

          <button
            v-if="!user.isPlatformAdmin"
            type="button"
            class="h-9 rounded-lg border border-[#d8dee8] bg-white px-3 text-[10px] font-black text-[#ff6600] transition hover:border-[#ff6600]/50"
            @click="$emit('toggle-user-status')"
          >
            {{ user.status === "active" ? "Suspender" : "Activar" }}
          </button>
        </div>
      </div>
    </header>

    <template v-if="user">
      <section class="shrink-0 border-b border-[#d8dee8] bg-white px-3 py-3">
        <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div class="min-w-0">
            <p class="text-[12px] font-black text-[#102372]">Accesos por empresa</p>
            <p class="mt-0.5 text-[10px] font-semibold text-slate-500">
              {{ accesses.length }} empresa{{ accesses.length === 1 ? "" : "s" }} asignada{{
                accesses.length === 1 ? "" : "s"
              }}
            </p>
          </div>

          <div class="flex min-w-0 flex-col gap-2 sm:flex-row md:w-full md:max-w-[560px]">
            <UserApplicationSearchSelect
              v-model="applicationToAddId"
              :applications="availableApplications"
              :companies="companies"
            />

            <button
              type="button"
              class="h-9 rounded-lg bg-[#102372] px-3 text-[10px] font-black text-white transition hover:bg-[#0c1b59] disabled:cursor-not-allowed disabled:bg-slate-300"
              :disabled="!applicationToAddId"
              @click="handleAddApplicationAccess"
            >
              Agregar
            </button>
          </div>
        </div>
      </section>

      <div class="min-h-0 flex-1 overflow-auto p-3">
        <UserCompanyAccessMatrix
          :accesses="accesses"
          :applications="applications"
          :companies="companies"
          :modules="modules"
          :module-functions="moduleFunctions"
          :permissions="permissions"
          :scopes="scopes"
          :roles="roles"
          :assets="assets"
          @update-access-role="handleUpdateAccessRole"
          @toggle-access-status="handleToggleAccessStatus"
          @remove-application-access="handleRemoveApplicationAccess"
          @toggle-module-access="handleToggleModuleAccess"
          @toggle-function-access="handleToggleFunctionAccess"
          @toggle-permission="handleTogglePermission"
          @update-operational-scope="handleUpdateOperationalScope"
          @toggle-scope-option="handleToggleScopeOption"
          @toggle-scope-asset="handleToggleScopeAsset"
          @toggle-scope-sucursal="handleToggleScopeSucursal"
        />
      </div>
    </template>

    <div
      v-else
      class="flex min-h-[320px] flex-1 flex-col items-center justify-center p-6 text-center"
    >
      <p class="text-[13px] font-black text-[#102372]">Selecciona un usuario</p>
      <p class="mt-1 text-[11px] font-semibold text-slate-500">
        Sus empresas, módulos y permisos aparecerán aquí.
      </p>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from "vue"

import UserApplicationSearchSelect from "./UserApplicationSearchSelect.vue"
import UserCompanyAccessMatrix from "./UserCompanyAccessMatrix.vue"

import {
  getAvatarClass,
  getStatusLabel,
  getUserInitials,
} from "../../utils/users/userAccessUtils.js"

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
  canImpersonate: {
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
  "toggle-scope-option",
  "toggle-scope-asset",
  "toggle-scope-sucursal",
])

const applicationToAddId = ref("")

const availableApplications = computed(() => {
  const usedApplicationIds = new Set(props.accesses.map((access) => access.applicationId))

  return props.applications.filter((application) => {
    return !usedApplicationIds.has(application.id)
  })
})

watch(
  () => availableApplications.value,
  (items) => {
    if (!items.some((item) => item.id === applicationToAddId.value)) {
      applicationToAddId.value = ""
    }
  },
)

const handleAddApplicationAccess = () => {
  if (!applicationToAddId.value) return

  emit("add-application-access", applicationToAddId.value)
  applicationToAddId.value = ""
}

const handleUpdateAccessRole = (accessId, roleId) => {
  emit("update-access-role", accessId, roleId)
}

const handleToggleAccessStatus = (accessId) => {
  emit("toggle-access-status", accessId)
}

const handleRemoveApplicationAccess = (accessId) => {
  emit("remove-application-access", accessId)
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

const handleUpdateOperationalScope = (accessId, scopeId) => {
  emit("update-operational-scope", accessId, scopeId)
}

const handleToggleScopeOption = (accessId, optionKey) => {
  emit("toggle-scope-option", accessId, optionKey)
}

const handleToggleScopeAsset = (accessId, assetId) => {
  emit("toggle-scope-asset", accessId, assetId)
}

const handleToggleScopeSucursal = (accessId, sucursalId) => {
  emit("toggle-scope-sucursal", accessId, sucursalId)
}
</script>
