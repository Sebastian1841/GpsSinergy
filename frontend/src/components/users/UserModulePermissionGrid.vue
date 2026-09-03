<template>
  <section class="overflow-hidden rounded-xl border border-[#d8dee8] bg-white">
    <!-- LISTA DE MÓDULOS -->
    <template v-if="!selectedModule">
      <header class="flex items-center justify-between gap-3 border-b border-[#edf1f5] px-4 py-3">
        <div class="min-w-0">
          <h4 class="text-[12px] font-black text-[#102372]">Permisos</h4>

          <p class="mt-0.5 text-[9px] font-semibold text-slate-500">
            Selecciona un módulo para configurar sus permisos.
          </p>
        </div>

        <span
          class="shrink-0 rounded-full bg-[#f8fafc] px-2 py-1 text-[8px] font-black text-slate-500"
        >
          {{ enabledModulesCount }}/{{ modules.length }} activos
        </span>
      </header>

      <div v-if="modules.length" class="divide-y divide-[#edf1f5]">
        <button
          v-for="module in modules"
          :key="module.id"
          type="button"
          class="group flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left transition hover:bg-[#f8fafc]"
          @click="selectedModuleId = module.id"
        >
          <div class="min-w-0">
            <p class="truncate text-[10px] font-black text-[#172033]">
              {{ module.name }}
            </p>

            <p class="mt-0.5 text-[9px] font-semibold text-slate-500">
              {{ getFunctionsForModule(module.id).length }}
              {{ getFunctionsForModule(module.id).length === 1 ? "función" : "funciones" }}
            </p>
          </div>

          <div class="flex shrink-0 items-center gap-3">
            <span
              class="rounded-full px-2 py-1 text-[8px] font-black"
              :class="
                getModuleAccess(module.id)?.enabled
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-slate-100 text-slate-500'
              "
            >
              {{ getModuleAccess(module.id)?.enabled ? "Activo" : "Inactivo" }}
            </span>

            <span
              class="text-[18px] font-light text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#102372]"
            >
              ›
            </span>
          </div>
        </button>
      </div>

      <div v-else class="px-4 py-8 text-center">
        <p class="text-[11px] font-black text-[#102372]">Sin módulos disponibles</p>
      </div>
    </template>

    <!-- DETALLE DE UN MÓDULO -->
    <template v-else>
      <header class="border-b border-[#edf1f5] px-4 py-3">
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#d8dee8] bg-white text-[18px] font-light text-[#102372] transition hover:border-[#102372]"
            aria-label="Volver a módulos"
            @click="selectedModuleId = null"
          >
            ‹
          </button>

          <div class="min-w-0 flex-1">
            <p class="text-[8px] font-black uppercase tracking-[0.06em] text-slate-400">Permisos</p>

            <h4 class="mt-0.5 truncate text-[12px] font-black text-[#102372]">
              {{ selectedModule.name }}
            </h4>
          </div>

          <button
            type="button"
            class="h-8 shrink-0 rounded-lg border px-3 text-[9px] font-black transition disabled:cursor-not-allowed disabled:opacity-60"
            :class="
              selectedModuleAccess?.enabled
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 bg-slate-100 text-slate-500'
            "
            :disabled="!canManageUserPermissions"
            @click="$emit('toggle-module-access', access.id, selectedModule.id)"
          >
            {{ selectedModuleAccess?.enabled ? "Activo" : "Inactivo" }}
          </button>
        </div>
      </header>

      <!-- MÓDULO ACTIVO -->
      <div v-if="selectedModuleAccess?.enabled" class="divide-y divide-[#edf1f5]">
        <article
          v-for="moduleFunction in selectedModuleFunctions"
          :key="moduleFunction.id"
          class="px-4 py-3"
        >
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="min-w-0">
              <p class="truncate text-[10px] font-black text-[#172033]">
                {{ moduleFunction.name }}
              </p>

              <p class="mt-0.5 text-[8px] font-semibold text-slate-400">
                Configura qué puede hacer el usuario.
              </p>
            </div>

            <label
              class="flex shrink-0 cursor-pointer items-center gap-2 text-[8px] font-black"
              :class="
                getFunctionAccess(moduleFunction.id)?.enabled
                  ? 'text-emerald-700'
                  : 'text-slate-400'
              "
            >
              <input
                type="checkbox"
                class="h-4 w-4 cursor-pointer rounded border-[#d8dee8] accent-[#ff6600] disabled:cursor-not-allowed disabled:opacity-40"
                :checked="getFunctionAccess(moduleFunction.id)?.enabled"
                :disabled="!canManageUserPermissions"
                @change="$emit('toggle-function-access', access.id, moduleFunction.id)"
              />

              Activa
            </label>
          </div>

          <!-- PERMISOS -->
          <div
            v-if="getFunctionAccess(moduleFunction.id)?.enabled"
            class="mt-3 flex flex-wrap gap-2"
          >
            <label
              v-for="permission in permissions"
              :key="permission.id"
              class="flex cursor-pointer items-center gap-2 rounded-lg border border-[#d8dee8] bg-white px-3 py-2 text-[8px] font-black text-[#102372] transition hover:border-[#102372]/40"
            >
              <input
                type="checkbox"
                class="h-3.5 w-3.5 cursor-pointer rounded border-[#d8dee8] accent-[#102372] disabled:cursor-not-allowed disabled:opacity-40"
                :checked="hasPermission(moduleFunction.id, permission.id)"
                :disabled="!canManageUserPermissions"
                @change="$emit('toggle-permission', access.id, moduleFunction.id, permission.id)"
              />

              {{ permission.name }}
            </label>
          </div>

          <p v-else class="mt-2 text-[8px] font-semibold text-slate-400">
            Activa esta función para configurar sus permisos.
          </p>
        </article>

        <div v-if="!selectedModuleFunctions.length" class="px-4 py-8 text-center">
          <p class="text-[10px] font-black text-[#102372]">Sin funciones configuradas</p>
        </div>
      </div>

      <!-- MÓDULO INACTIVO -->
      <div v-else class="px-4 py-10 text-center">
        <p class="text-[11px] font-black text-[#102372]">Módulo inactivo</p>

        <p class="mx-auto mt-1 max-w-[320px] text-[9px] font-semibold leading-4 text-slate-500">
          Activa el módulo para configurar sus funciones y permisos.
        </p>

        <button
          v-if="canManageUserPermissions"
          type="button"
          class="mt-4 h-9 rounded-lg bg-[#102372] px-4 text-[9px] font-black text-white transition hover:bg-[#0b1953]"
          @click="$emit('toggle-module-access', access.id, selectedModule.id)"
        >
          Activar módulo
        </button>
      </div>
    </template>
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

const selectedModuleId = ref(null)

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
  const grouped = new Map()

  props.moduleFunctions.forEach((moduleFunction) => {
    if (!grouped.has(moduleFunction.moduleId)) {
      grouped.set(moduleFunction.moduleId, [])
    }

    grouped.get(moduleFunction.moduleId).push(moduleFunction)
  })

  return grouped
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

const hasPermission = (functionId, permissionId) => {
  return Boolean(getFunctionAccess(functionId)?.permissions?.[permissionId])
}

const selectedModule = computed(() => {
  if (!selectedModuleId.value) return null

  return (
    props.modules.find((module) => {
      return module.id === selectedModuleId.value
    }) || null
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
  return (props.access.modules || []).filter((moduleAccess) => {
    return moduleAccess.enabled
  }).length
})

watch(
  () => props.access.id,
  () => {
    selectedModuleId.value = null
  },
)

watch(
  () => props.modules,
  (modules) => {
    if (!selectedModuleId.value) return

    const stillExists = modules.some((module) => {
      return module.id === selectedModuleId.value
    })

    if (!stillExists) {
      selectedModuleId.value = null
    }
  },
)
</script>
