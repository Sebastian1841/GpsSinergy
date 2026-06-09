<template>
  <section class="overflow-hidden rounded-lg border border-[#d8dee8] bg-white">
    <div class="border-b border-[#edf1f5] px-3 py-2">
      <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div class="min-w-0">
          <h4 class="text-[12px] font-black text-[#102372]">Módulos y funciones</h4>
          <p class="mt-0.5 text-[10px] font-black text-slate-400">
            {{ enabledModulesCount }} de {{ modules.length }} módulos ·
            {{ enabledFunctionsCount }} funciones activas
          </p>
        </div>

        <div class="flex items-center gap-2">
          <select
            v-model="selectedModuleId"
            class="h-8 min-w-[210px] cursor-pointer rounded-lg border border-[#d8dee8] bg-white px-2 text-[10px] font-black text-[#102372] outline-none transition focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/10"
          >
            <option v-for="module in modules" :key="module.id" :value="module.id">
              {{ module.name }} · {{ getEnabledFunctionsForModule(module.id) }}/{{
                getFunctionsForModule(module.id).length
              }}
            </option>
          </select>

          <button
            v-if="selectedModule"
            type="button"
            class="relative inline-flex h-5 w-9 shrink-0 rounded-full transition disabled:cursor-not-allowed disabled:opacity-60"
            :class="selectedModuleAccess?.enabled ? 'bg-[#ff6600]' : 'bg-slate-300'"
            :aria-label="`Cambiar acceso a ${selectedModule.name}`"
            :disabled="!canManageUserPermissions"
            @click="$emit('toggle-module-access', access.id, selectedModule.id)"
          >
            <span
              class="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition"
              :class="selectedModuleAccess?.enabled ? 'left-4' : 'left-0.5'"
            ></span>
          </button>
        </div>
      </div>
    </div>

    <div v-if="selectedModule" class="grid gap-3 p-3">
      <div
        class="flex flex-col gap-2 rounded-lg border border-[#edf1f5] bg-[#f8fafc] px-3 py-2 md:flex-row md:items-center md:justify-between"
      >
        <div class="min-w-0">
          <p class="truncate text-[12px] font-black text-[#102372]">
            {{ selectedModule.name }}
          </p>
          <p class="mt-0.5 text-[10px] font-semibold text-slate-500">
            {{ selectedModuleFunctions.length }} funciones disponibles
          </p>
        </div>

        <span
          class="w-fit rounded-full px-2 py-1 text-[10px] font-black"
          :class="
            selectedModuleAccess?.enabled
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-slate-100 text-slate-500'
          "
        >
          {{ selectedModuleAccess?.enabled ? "Módulo activo" : "Módulo inactivo" }}
        </span>
      </div>

      <div
        v-if="selectedModuleAccess?.enabled"
        class="overflow-hidden rounded-lg border border-[#edf1f5]"
      >
        <div class="overflow-x-auto">
          <table class="w-full min-w-[560px] border-collapse">
            <thead>
              <tr class="border-b border-[#edf1f5] bg-[#f8fafc]">
                <th class="px-3 py-2 text-left text-[10px] font-black uppercase text-slate-400">
                  Función
                </th>
                <th
                  class="w-[78px] px-2 py-2 text-center text-[10px] font-black uppercase text-slate-400"
                >
                  Activa
                </th>
                <th
                  v-for="permission in permissions"
                  :key="permission.id"
                  class="w-[76px] px-2 py-2 text-center text-[10px] font-black uppercase text-slate-400"
                >
                  {{ permission.name }}
                </th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="moduleFunction in selectedModuleFunctions"
                :key="moduleFunction.id"
                class="border-b border-[#edf1f5] last:border-b-0"
              >
                <td class="px-3 py-2">
                  <p class="text-[12px] font-black text-[#172033]">{{ moduleFunction.name }}</p>
                </td>

                <td class="px-2 py-2 text-center">
                  <button
                    type="button"
                    class="relative inline-flex h-5 w-9 rounded-full transition disabled:cursor-not-allowed disabled:opacity-60"
                    :class="
                      getFunctionAccess(moduleFunction.id)?.enabled
                        ? 'bg-[#ff6600]'
                        : 'bg-slate-300'
                    "
                    :disabled="!canManageUserPermissions"
                    @click="$emit('toggle-function-access', access.id, moduleFunction.id)"
                  >
                    <span
                      class="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition"
                      :class="getFunctionAccess(moduleFunction.id)?.enabled ? 'left-4' : 'left-0.5'"
                    ></span>
                  </button>
                </td>

                <td
                  v-for="permission in permissions"
                  :key="permission.id"
                  class="px-2 py-2 text-center"
                >
                  <input
                    type="checkbox"
                    class="h-4 w-4 cursor-pointer rounded border-[#d8dee8] accent-[#102372] disabled:cursor-not-allowed disabled:opacity-40"
                    :aria-label="`${moduleFunction.name} ${permission.name}`"
                    :checked="hasPermission(moduleFunction.id, permission.id)"
                    :disabled="
                      !canManageUserPermissions || !getFunctionAccess(moduleFunction.id)?.enabled
                    "
                    @change="
                      $emit('toggle-permission', access.id, moduleFunction.id, permission.id)
                    "
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div
        v-else
        class="rounded-lg border border-dashed border-[#cbd5e1] bg-[#f8fafc] px-3 py-4 text-center"
      >
        <p class="text-[11px] font-black text-[#102372]">
          Activa el módulo para configurar funciones
        </p>
      </div>
    </div>

    <div
      v-else
      class="rounded-lg border border-dashed border-[#cbd5e1] bg-[#f8fafc] px-3 py-4 text-center"
    >
      <p class="text-[11px] font-black text-[#102372]">Sin módulos disponibles</p>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from "vue"

const props = defineProps({
  access: {
    type: Object,
    required: true,
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
  canManageUserPermissions: {
    type: Boolean,
    default: false,
  },
})

defineEmits(["toggle-module-access", "toggle-function-access", "toggle-permission"])

const selectedModuleId = ref(props.modules[0]?.id || null)

const moduleAccessById = computed(() => {
  return new Map(
    (props.access.modules || []).map((moduleAccess) => [moduleAccess.moduleId, moduleAccess]),
  )
})

const functionAccessById = computed(() => {
  return new Map(
    (props.access.functions || []).map((functionAccess) => [
      functionAccess.functionId,
      functionAccess,
    ]),
  )
})

const functionsByModuleId = computed(() => {
  const groupedFunctions = new Map()

  props.moduleFunctions.forEach((moduleFunction) => {
    if (!groupedFunctions.has(moduleFunction.moduleId)) {
      groupedFunctions.set(moduleFunction.moduleId, [])
    }

    groupedFunctions.get(moduleFunction.moduleId).push(moduleFunction)
  })

  return groupedFunctions
})

const getModuleAccess = (moduleId) => {
  return moduleAccessById.value.get(moduleId) || null
}

const getFunctionAccess = (functionId) => {
  return functionAccessById.value.get(functionId) || null
}

const getFunctionsForModule = (moduleId) => {
  return functionsByModuleId.value.get(moduleId) || []
}

const getEnabledFunctionsForModule = (moduleId) => {
  return getFunctionsForModule(moduleId).filter((moduleFunction) => {
    return getFunctionAccess(moduleFunction.id)?.enabled
  }).length
}

const hasPermission = (functionId, permissionId) => {
  return Boolean(getFunctionAccess(functionId)?.permissions?.[permissionId])
}

const selectedModule = computed(() => {
  return (
    props.modules.find((module) => module.id === selectedModuleId.value) || props.modules[0] || null
  )
})

const selectedModuleAccess = computed(() => {
  if (!selectedModule.value) return null

  return getModuleAccess(selectedModule.value.id)
})

const selectedModuleFunctions = computed(() => {
  if (!selectedModule.value) return []

  return getFunctionsForModule(selectedModule.value.id)
})

const enabledModulesCount = computed(() => {
  return (props.access.modules || []).filter((moduleAccess) => moduleAccess.enabled).length
})

const enabledFunctionsCount = computed(() => {
  return (props.access.functions || []).filter((functionAccess) => functionAccess.enabled).length
})

watch(
  () => props.modules,
  (modules) => {
    if (modules.some((module) => module.id === selectedModuleId.value)) return

    selectedModuleId.value = modules[0]?.id || null
  },
  { immediate: true },
)
</script>
