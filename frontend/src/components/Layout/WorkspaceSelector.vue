<template>
  <div v-if="enabled" class="relative shrink-0">
    <button
      type="button"
      class="group flex h-10 w-[150px] cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-2.5 text-left text-white transition hover:border-[#ff6600]/50 hover:bg-white/[0.08] min-[1700px]:w-[166px]"
      :class="isOpen ? 'border-[#ff6600]/70 bg-white/[0.1]' : ''"
      @click.stop="toggleOpen"
    >
      <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/10">
        <svg viewBox="0 0 24 24" class="h-3.5 w-3.5 text-[#ff6600]" fill="none" aria-hidden="true">
          <path
            d="M4 6.5h16M4 12h10M4 17.5h16"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
      </span>

      <span class="min-w-0 flex-1">
        <span class="block truncate text-[11px] font-black text-white">
          {{ activeWorkspaceLabel }}
        </span>
        <span class="mt-0.5 block text-[9px] font-black uppercase tracking-[0.1em] text-white/40">
          Mi vista
        </span>
      </span>
    </button>

    <transition
      enter-active-class="transition duration-160 ease-out"
      enter-from-class="opacity-0 translate-y-1 scale-[0.98]"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-120 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-1 scale-[0.98]"
      @before-enter="$emit('before-open')"
      @before-leave="$emit('before-close')"
      @after-leave="$emit('after-close')"
    >
      <div
        v-show="isOpen"
        class="absolute right-0 top-[46px] z-50 w-[336px] overflow-hidden rounded-2xl border border-white/10 bg-[#1b2532]/95 py-2 text-white shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl"
        @click.stop
        @pointerdown.stop
      >
        <div v-if="panelMode === 'menu'">
          <div class="max-h-[190px] overflow-auto px-2 py-1">
            <button
              v-for="workspace in workspaces"
              :key="workspace.id"
              type="button"
              class="grid h-9 w-full grid-cols-[22px_minmax(0,1fr)_auto] items-center gap-1 rounded-xl px-2.5 text-left text-[12px] font-semibold transition"
              :class="
                isActiveWorkspace(workspace)
                  ? 'bg-[#ff6600]/15 text-white'
                  : 'text-white/70 hover:bg-white/[0.07] hover:text-white'
              "
              @click="handleSelectWorkspace(workspace.id)"
            >
              <span class="flex items-center justify-center">
                <span
                  v-if="isActiveWorkspace(workspace)"
                  class="h-1.5 w-1.5 rounded-full bg-[#ff6600]"
                ></span>
              </span>

              <span class="truncate">
                {{ workspace.name }}
              </span>

              <span
                v-if="workspace.sharedWithCurrentUser"
                class="rounded-md bg-white/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.06em] text-white/45"
              >
                Compartido
              </span>
            </button>

            <div
              v-if="!workspaces.length"
              class="px-5 py-4 text-[12px] font-semibold text-white/45"
            >
              Sin espacios guardados
            </div>
          </div>

          <div class="my-1 h-px bg-white/10"></div>

          <button
            type="button"
            class="grid h-9 w-full grid-cols-[22px_minmax(0,1fr)] items-center gap-1 px-4 text-left text-[12px] font-semibold text-white/80 transition hover:bg-white/[0.07] hover:text-white"
            @click="startManage"
          >
            <svg
              viewBox="0 0 24 24"
              class="h-3.5 w-3.5 text-[#ff6600]"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M10.2 4.4 11 2.75h2l.8 1.65 1.85.75 1.75-.6 1.4 1.4-.6 1.75.75 1.85 1.65.8v2l-1.65.8-.75 1.85.6 1.75-1.4 1.4-1.75-.6-1.85.75L13 21.25h-2l-.8-1.65-1.85-.75-1.75.6-1.4-1.4.6-1.75-.75-1.85-1.65-.8v-2l1.65-.8.75-1.85-.6-1.75 1.4-1.4 1.75.6 1.85-.75Z"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linejoin="round"
              />
              <path
                d="M12 14.75a2.75 2.75 0 1 0 0-5.5 2.75 2.75 0 0 0 0 5.5Z"
                stroke="currentColor"
                stroke-width="1.8"
              />
            </svg>

            <span class="truncate">Administrar espacios de trabajo...</span>
          </button>

          <button
            type="button"
            class="grid h-9 w-full grid-cols-[22px_minmax(0,1fr)] items-center gap-1 px-4 text-left text-[12px] font-medium transition"
            :class="
              canSaveActiveWorkspace
                ? 'text-white/80 hover:bg-white/[0.07] hover:text-white'
                : 'cursor-not-allowed text-white/25'
            "
            :disabled="!canSaveActiveWorkspace"
            @click="startCurrentSettings"
          >
            <span></span>
            <span class="truncate">Configuracion del espacio de trabajo...</span>
          </button>

          <div class="my-1 h-px bg-white/10"></div>

          <button
            type="button"
            class="grid h-8 w-full grid-cols-[22px_minmax(0,1fr)] items-center gap-1 px-4 text-left text-[12px] font-medium transition"
            :class="
              canSaveCurrentView
                ? 'text-white/80 hover:bg-white/[0.07] hover:text-white'
                : 'cursor-not-allowed text-white/25'
            "
            :disabled="!canSaveCurrentView"
            :title="saveButtonTitle"
            @click="handleSaveCurrentView"
          >
            <span></span>
            <span>Guardar</span>
          </button>

          <button
            type="button"
            class="grid h-8 w-full grid-cols-[22px_minmax(0,1fr)] items-center gap-1 px-4 text-left text-[12px] font-medium text-white/80 transition hover:bg-white/[0.07] hover:text-white"
            @click="startCreateCopy"
          >
            <span></span>
            <span>Guardar como...</span>
          </button>
        </div>

        <div v-else-if="panelMode === 'manage'" class="text-white">
          <div
            class="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-3 py-2"
          >
            <button
              type="button"
              class="rounded-lg px-2 py-1 text-[11px] font-bold text-white/55 transition hover:bg-white/10 hover:text-white"
              @click="backToMenu"
            >
              Volver
            </button>

            <p class="text-[11px] font-black uppercase tracking-[0.12em] text-white">Espacios</p>

            <button
              type="button"
              class="rounded-lg px-2 py-1 text-[11px] font-black text-[#ff6600] transition hover:bg-[#ff6600]/10"
              @click="startCreate"
            >
              Nuevo
            </button>
          </div>

          <div class="max-h-[270px] overflow-auto p-2">
            <div
              v-for="workspace in workspaces"
              :key="workspace.id"
              class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-xl px-2.5 py-2 transition"
              :class="isActiveWorkspace(workspace) ? 'bg-[#ff6600]/15' : 'hover:bg-white/[0.07]'"
            >
              <button
                type="button"
                class="min-w-0 text-left"
                @click="handleSelectWorkspace(workspace.id)"
              >
                <span class="block truncate text-[12px] font-black text-white">
                  {{ workspace.name }}
                </span>
                <span class="mt-0.5 block truncate text-[10px] font-semibold text-white/45">
                  {{ getWorkspaceMeta(workspace) }}
                </span>
              </button>

              <div v-if="canManageWorkspace(workspace)" class="flex items-center gap-1">
                <button
                  type="button"
                  class="rounded-lg px-1.5 py-1 text-[10px] font-black text-white/55 transition hover:bg-white/10 hover:text-white"
                  @click.stop="startEdit(workspace)"
                >
                  Editar
                </button>

                <button
                  type="button"
                  class="rounded px-1.5 py-1 text-[10px] font-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-30"
                  :class="
                    pendingDeleteId === workspace.id
                      ? 'text-[#ff6600]'
                      : 'text-white/35 hover:text-red-300'
                  "
                  :disabled="ownedWorkspaceCount <= 1"
                  @click.stop="handleDeleteClick(workspace.id)"
                >
                  {{ pendingDeleteId === workspace.id ? "Confirmar" : "Eliminar" }}
                </button>
              </div>

              <span
                v-else
                class="rounded-md bg-white/10 px-1.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-white/35"
              >
                Compartido
              </span>
            </div>
          </div>
        </div>

        <form v-else class="p-3 text-white" @submit.prevent="submitForm">
          <div class="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              class="rounded-lg px-2 py-1 text-[11px] font-bold text-white/55 transition hover:bg-white/10 hover:text-white"
              @click="cancelForm"
            >
              Volver
            </button>

            <p class="truncate text-[11px] font-black uppercase tracking-[0.12em] text-white">
              {{ formTitle }}
            </p>
          </div>

          <label class="block text-[10px] font-black uppercase tracking-[0.1em] text-white/45">
            Nombre del espacio
          </label>

          <input
            v-model="formName"
            type="text"
            autocomplete="off"
            maxlength="40"
            class="mt-1 h-9 w-full rounded-lg border border-white/10 bg-white/[0.06] px-2.5 text-[12px] font-bold text-white outline-none transition placeholder:text-white/35 focus:border-[#ff6600] focus:bg-white/[0.09] focus:ring-2 focus:ring-[#ff6600]/20"
            placeholder="Nombre de la vista"
          />

          <div
            v-if="availableShareUsers.length"
            class="mt-3 max-h-[154px] overflow-auto rounded-lg border border-white/10 bg-white/[0.04] p-1.5"
          >
            <p class="px-1 pb-1 text-[9px] font-black uppercase tracking-[0.12em] text-white/45">
              Compartir con usuarios
            </p>

            <label
              v-for="user in availableShareUsers"
              :key="user.id"
              class="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1.5 transition hover:bg-white/[0.07]"
            >
              <input
                v-model="formSharedUserIds"
                type="checkbox"
                class="h-3.5 w-3.5 accent-[#ff6600]"
                :value="user.id"
              />

              <span class="min-w-0">
                <span class="block truncate text-[10px] font-black text-white">
                  {{ getUserName(user) }}
                </span>
                <span class="block truncate text-[9px] font-semibold text-white/45">
                  {{ user.email || user.username || "Usuario" }}
                </span>
              </span>
            </label>
          </div>

          <div class="mt-3 flex justify-end gap-2">
            <button
              type="button"
              class="rounded-md px-2.5 py-1.5 text-[11px] font-black text-white/55 transition hover:bg-white/10 hover:text-white"
              @click="cancelForm"
            >
              Cancelar
            </button>

            <button
              type="submit"
              class="rounded-md bg-[#ff6600] px-3 py-1.5 text-[11px] font-black text-white transition hover:bg-[#e65c00] disabled:cursor-not-allowed disabled:opacity-40"
              :disabled="!normalizedFormName"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue"

import { normalizeId } from "../../utils/idUtils.js"

const props = defineProps({
  enabled: {
    type: Boolean,
    default: false,
  },
  isOpen: {
    type: Boolean,
    default: false,
  },
  workspaces: {
    type: Array,
    default: () => [],
  },
  activeWorkspaceId: {
    type: [String, Number],
    default: null,
  },
  currentUserId: {
    type: [String, Number],
    default: null,
  },
  hasUnsavedChanges: {
    type: Boolean,
    default: false,
  },
  users: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits([
  "open",
  "close",
  "before-open",
  "before-close",
  "after-close",
  "select-workspace",
  "create-workspace",
  "rename-workspace",
  "delete-workspace",
  "save-current-view",
])

const panelMode = ref("menu")
const formMode = ref(null)
const formName = ref("")
const formSharedUserIds = ref([])
const editingWorkspaceId = ref(null)
const pendingDeleteId = ref(null)

const activeWorkspace = computed(() => {
  return (
    props.workspaces.find((workspace) => {
      return normalizeId(workspace.id) === normalizeId(props.activeWorkspaceId)
    }) || props.workspaces[0]
  )
})

const activeWorkspaceLabel = computed(() => {
  return activeWorkspace.value?.name || "Vista principal"
})

const normalizedFormName = computed(() => {
  return String(formName.value || "").trim()
})

const ownedWorkspaceCount = computed(() => {
  return props.workspaces.filter((workspace) => canManageWorkspace(workspace)).length
})

const formTitle = computed(() => {
  if (formMode.value === "create") return "Guardar como"
  if (formMode.value === "edit") return "Configuracion"

  return "Espacio"
})

const availableShareUsers = computed(() => {
  const currentUserId = normalizeId(props.currentUserId)

  return props.users.filter((user) => {
    return normalizeId(user?.id) && normalizeId(user?.id) !== currentUserId
  })
})

const canSaveActiveWorkspace = computed(() => {
  return canManageWorkspace(activeWorkspace.value)
})

const canSaveCurrentView = computed(() => {
  return canSaveActiveWorkspace.value && props.hasUnsavedChanges
})

const saveButtonTitle = computed(() => {
  if (!canSaveActiveWorkspace.value) {
    return "Solo el dueno puede guardar cambios en este espacio"
  }

  if (!props.hasUnsavedChanges) {
    return "No hay cambios pendientes"
  }

  return "Guardar la configuracion actual"
})

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      panelMode.value = "menu"
      pendingDeleteId.value = null
      return
    }

    resetForm()
    panelMode.value = "menu"
    pendingDeleteId.value = null
  },
)

const toggleOpen = () => {
  emit(props.isOpen ? "close" : "open")
}

const isActiveWorkspace = (workspace) => {
  return normalizeId(workspace?.id) === normalizeId(props.activeWorkspaceId)
}

const handleSelectWorkspace = (workspaceId) => {
  emit("select-workspace", workspaceId)
  emit("close")
}

const startManage = () => {
  resetForm()
  pendingDeleteId.value = null
  panelMode.value = "manage"
}

const backToMenu = () => {
  resetForm()
  pendingDeleteId.value = null
  panelMode.value = "menu"
}

const startCreate = () => {
  pendingDeleteId.value = null
  panelMode.value = "form"
  formMode.value = "create"
  editingWorkspaceId.value = null
  formName.value = ""
  formSharedUserIds.value = []
}

const startCreateCopy = () => {
  pendingDeleteId.value = null
  panelMode.value = "form"
  formMode.value = "create"
  editingWorkspaceId.value = null
  formName.value = `${activeWorkspaceLabel.value} copia`
  formSharedUserIds.value = []
}

const startCurrentSettings = () => {
  if (!canSaveActiveWorkspace.value) return

  startEdit(activeWorkspace.value)
}

const startEdit = (workspace) => {
  if (!canManageWorkspace(workspace)) return

  pendingDeleteId.value = null
  panelMode.value = "form"
  formMode.value = "edit"
  editingWorkspaceId.value = workspace?.id || null
  formName.value = workspace?.name || ""
  formSharedUserIds.value = [...(workspace?.sharedWithUserIds || [])]
}

const resetForm = () => {
  formMode.value = null
  formName.value = ""
  formSharedUserIds.value = []
  editingWorkspaceId.value = null
}

const cancelForm = () => {
  resetForm()
  panelMode.value = "menu"
}

const submitForm = () => {
  const name = normalizedFormName.value

  if (!name) return

  if (formMode.value === "create") {
    emit("create-workspace", {
      name,
      sharedWithUserIds: formSharedUserIds.value,
    })
    resetForm()
    panelMode.value = "menu"
    return
  }

  if (formMode.value === "edit" && editingWorkspaceId.value) {
    emit("rename-workspace", {
      workspaceId: editingWorkspaceId.value,
      name,
      sharedWithUserIds: formSharedUserIds.value,
    })
    resetForm()
    panelMode.value = "menu"
  }
}

const handleDeleteClick = (workspaceId) => {
  if (pendingDeleteId.value === workspaceId) {
    emit("delete-workspace", workspaceId)
    pendingDeleteId.value = null
    return
  }

  pendingDeleteId.value = workspaceId
}

const handleSaveCurrentView = () => {
  if (!canSaveCurrentView.value) return

  emit("save-current-view")
}

const getWorkspaceMeta = (workspace) => {
  if (workspace?.sharedWithCurrentUser) {
    return `Compartido por ${getOwnerName(workspace)}`
  }

  return workspace.routeName || workspace.routePath || "Vista guardada"
}

const canManageWorkspace = (workspace) => {
  return normalizeId(workspace?.userId) === normalizeId(props.currentUserId)
}

const getUserName = (user) => {
  return user?.name || user?.username || user?.email || "Usuario"
}

const getOwnerName = (workspace) => {
  const owner = props.users.find((user) => {
    return normalizeId(user?.id) === normalizeId(workspace?.userId)
  })

  return getUserName(owner)
}
</script>
