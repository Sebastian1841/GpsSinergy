<template>
  <header
    ref="headerRef"
    class="relative border-b border-white/10 bg-gradient-to-r from-[#182230] via-[#1f2937] to-[#182230] shadow-[0_8px_30px_rgba(0,0,0,0.18)]"
    :class="showDropdown ? 'z-[700]' : 'z-30'"
  >
    <div
      class="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-[#ff6600]/70 to-transparent"
    ></div>

    <div class="flex items-center justify-between gap-4 px-4 py-2.5">
      <div class="flex min-w-0 items-center gap-3">
        <button
          class="inline-flex h-10 w-10 items-center justify-center rounded-xl text-white transition-all duration-200 hover:bg-white/10 active:scale-95"
          aria-label="Abrir menú"
          type="button"
          @click="emit('toggle-sidebar')"
        >
          <span class="text-2xl leading-none">☰</span>
        </button>

        <div
          class="relative flex h-[56px] w-[168px] shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm"
        >
          <div
            class="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent"
          ></div>

          <iframe
            src="/logo-sinergy.html"
            title="Logo Sinergy"
            class="pointer-events-none relative h-full w-full border-0 bg-transparent"
            scrolling="no"
          />
        </div>
      </div>

      <div v-if="currentUser" class="relative z-40 shrink-0">
        <button
          class="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-white backdrop-blur-sm transition-all duration-200 hover:border-white/20 hover:bg-white/[0.08]"
          aria-label="Abrir menú de usuario"
          type="button"
          @click="toggleDropdown"
        >
          <div
            class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#ff6600] to-[#ff8c42] text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.20)]"
          >
            {{ userInitial }}
          </div>

          <div class="flex flex-col items-start leading-tight">
            <strong class="max-w-[150px] truncate text-sm font-semibold text-white">
              {{ userName }}
            </strong>

            <div class="flex items-center gap-2">
              <span
                class="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(74,222,128,0.9)]"
              ></span>
              <span class="text-xs text-gray-300">
                {{ userRole }}
              </span>
            </div>
          </div>

          <span
            class="text-[10px] text-gray-300 transition-transform duration-200"
            :class="{ 'rotate-180': showDropdown }"
          >
            ▼
          </span>
        </button>

        <transition
          enter-active-class="transition duration-180 ease-out"
          enter-from-class="opacity-0 translate-y-1 scale-[0.98]"
          enter-to-class="opacity-100 translate-y-0 scale-100"
          leave-active-class="transition duration-140 ease-in"
          leave-from-class="opacity-100 translate-y-0 scale-100"
          leave-to-class="opacity-0 translate-y-1 scale-[0.98]"
        >
          <div
            v-if="showDropdown"
            class="absolute right-0 z-50 mt-3 w-64 overflow-hidden rounded-2xl border border-white/10 bg-[#1b2532]/95 text-white shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl"
          >
            <div class="border-b border-white/10 bg-white/[0.03] px-4 py-3">
              <p class="truncate text-sm font-semibold text-white">
                {{ userName }}
              </p>
              <p class="mt-0.5 text-xs text-gray-400">
                {{ userRole }}
              </p>
            </div>

            <div class="p-2">
              <button
                class="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white transition-all duration-200 hover:bg-[#ff6600] hover:shadow-[0_8px_24px_rgba(255,102,0,0.28)]"
                type="button"
                @click="logout"
              >
                <div
                  class="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 transition-colors duration-200 group-hover:bg-white/15"
                >
                  <SvgIcon name="logout" class="h-4 w-4" />
                </div>

                <div class="flex flex-col items-start leading-tight">
                  <span class="font-medium">Cerrar sesión</span>
                  <span class="text-[11px] text-gray-300 group-hover:text-white/90">
                    Salir del panel actual
                  </span>
                </div>
              </button>
            </div>
          </div>
        </transition>
      </div>

      <div
        v-else
        class="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-gray-300 backdrop-blur-sm"
      >
        Invitado
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue"
import { useRouter } from "vue-router"
import { useAuthSession } from "../../composables/auth/useAuthSession.js"
import SvgIcon from "../icons/SvgIcon.vue"

const emit = defineEmits(["toggle-sidebar"])

const router = useRouter()
const { currentUser, currentRole, logout: logoutSession } = useAuthSession()

const showDropdown = ref(false)
const headerRef = ref(null)

onMounted(() => {
  document.addEventListener("click", handleClickOutside)
  document.addEventListener("keydown", handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside)
  document.removeEventListener("keydown", handleKeydown)
})

const userName = computed(() => {
  return currentUser.value?.name || currentUser.value?.username || "Invitado"
})

const userInitial = computed(() => {
  return userName.value.charAt(0).toUpperCase()
})

const userRole = computed(() => {
  return currentRole.value?.name || "Sin rol asignado"
})

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
}

const handleClickOutside = (event) => {
  if (!headerRef.value) return

  if (!headerRef.value.contains(event.target)) {
    showDropdown.value = false
  }
}

const handleKeydown = (event) => {
  if (event.key === "Escape") {
    showDropdown.value = false
  }
}

const logout = () => {
  logoutSession()
  showDropdown.value = false
  router.replace("/login")
}
</script>
