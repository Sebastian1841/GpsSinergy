<template>
  <div>
    <!-- Overlay en todos los tamaños -->
    <div
      v-if="isOpen"
      class="fixed inset-0 z-40 bg-slate-950/30 [contain:paint]"
      @click="$emit('update:isOpen', false)"
    />

    <aside
      :class="[
        'fixed left-0 top-0 z-50 h-full w-72',
        'flex flex-col overflow-hidden text-white',
        'bg-[#1c2634]',
        'border-r border-white/10 shadow-lg',
        'transform-gpu transition-transform duration-150 ease-out',
        '[contain:layout_paint] [backface-visibility:hidden]',
        isOpen ? 'translate-x-0 will-change-transform' : '-translate-x-full',
      ]"
    >
      <!-- Header -->
      <header class="relative z-10 border-b border-white/10 px-4 py-4">
        <div class="flex items-center justify-between gap-3">
          <button
            class="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition-colors duration-100 hover:bg-white/10 active:scale-95"
            type="button"
            aria-label="Cerrar menú"
            @click="$emit('update:isOpen', false)"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div class="min-w-0 flex-1">
            <p class="text-[10px] font-black uppercase tracking-[0.22em] text-white/45">
              Plataforma
            </p>
            <h2 class="mt-1 truncate text-sm font-bold text-white">Sistema</h2>
          </div>

          <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#ff6600]">
            <span class="text-xs font-black">SG</span>
          </div>
        </div>
      </header>

      <!-- Menú -->
      <nav class="relative z-10 flex-1 overflow-y-auto px-3 py-4 custom-scrollbar">
        <div class="mb-2 px-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
          Navegación
        </div>

        <ul class="space-y-1.5">
          <li v-for="item in assetNavigationItems" :key="item.to">
            <RouterLink
              :to="item.to"
              class="group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-white/75 transition-colors duration-100 hover:bg-white/[0.08] hover:text-white"
              active-class="sidebar-link-active"
              @click="$emit('update:isOpen', false)"
            >
              <div
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-white/70 transition-colors duration-100 group-hover:bg-[#ff6600] group-hover:text-white"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M3 7h18M5 7v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"
                  />
                </svg>
              </div>

              <span class="min-w-0 flex-1 truncate">
                {{ item.label }}
              </span>

              <span
                class="h-2 w-2 rounded-full bg-transparent transition-colors duration-100 group-hover:bg-[#ff6600]"
              ></span>
            </RouterLink>
          </li>

          <li v-if="isPlatformAdmin">
            <RouterLink
              to="/empresas"
              class="group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-white/75 transition-colors duration-100 hover:bg-white/[0.08] hover:text-white"
              active-class="sidebar-link-active"
              @click="$emit('update:isOpen', false)"
            >
              <div
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-white/70 transition-colors duration-100 group-hover:bg-[#ff6600] group-hover:text-white"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M4 20h16M6 20V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13M9 9h1M14 9h1M9 13h1M14 13h1M11 20v-3h2v3"
                  />
                </svg>
              </div>

              <span class="min-w-0 flex-1 truncate"> Empresas </span>

              <span
                class="h-2 w-2 rounded-full bg-transparent transition-colors duration-100 group-hover:bg-[#ff6600]"
              ></span>
            </RouterLink>
          </li>

          <li v-if="isPlatformAdmin">
            <RouterLink
              to="/usuarios"
              class="group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-white/75 transition-colors duration-100 hover:bg-white/[0.08] hover:text-white"
              active-class="sidebar-link-active"
              @click="$emit('update:isOpen', false)"
            >
              <div
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-white/70 transition-colors duration-100 group-hover:bg-[#ff6600] group-hover:text-white"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0ZM4.5 20a7.5 7.5 0 0 1 15 0M18.5 8.5a3 3 0 0 1 0 5M21 20a5.5 5.5 0 0 0-3-4.9"
                  />
                </svg>
              </div>

              <span class="min-w-0 flex-1 truncate"> Gestión de usuarios </span>

              <span
                class="h-2 w-2 rounded-full bg-transparent transition-colors duration-100 group-hover:bg-[#ff6600]"
              ></span>
            </RouterLink>
          </li>
        </ul>
      </nav>

      <!-- Footer -->
      <footer class="relative z-10 border-t border-white/10 px-4 py-3">
        <div class="flex items-center justify-between rounded-2xl bg-black/10 px-3 py-2">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">Sinergy</p>
            <p class="text-xs text-white/60">Sistema corporativo</p>
          </div>

          <div class="h-2.5 w-2.5 rounded-full bg-[#ff6600]"></div>
        </div>
      </footer>
    </aside>
  </div>
</template>

<script setup>
import { computed } from "vue"

import { useAccessControl } from "../../composables/auth/useAccessControl.js"

const { isPlatformAdmin, accessibleCompanies } = useAccessControl()

const assetNavigationItems = computed(() => {
  if (isPlatformAdmin.value) {
    return [
      {
        to: "/activos",
        label: "Activos",
      },
    ]
  }

  return accessibleCompanies.value.map((company) => ({
    to: `/app/${company.id}/activos`,
    label: company.name,
  }))
})

defineProps({
  isOpen: { type: Boolean, default: false },
})

defineEmits(["update:isOpen"])
</script>

<style scoped>
.sidebar-link-active {
  background: #ff6600;
  color: white;
  font-weight: 800;
}

.sidebar-link-active > div {
  background: rgba(255, 255, 255, 0.18);
  color: white;
}

.sidebar-link-active > span:last-child {
  background: white;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.16);
  border-radius: 999px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.28);
}
</style>
