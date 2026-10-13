<template>
  <router-view v-if="isPublicRoute" />

  <div v-else class="fixed inset-0 flex flex-col overflow-hidden bg-gray-50 font-sans">
    <AppHeader @toggle-sidebar="toggleSidebar" />
    <ImpersonationBanner />

    <div class="relative flex min-h-0 flex-1 overflow-hidden">
      <AppSidebar ref="appSidebarRef" />

      <main
        class="min-h-0 flex-1 overflow-hidden bg-[#f3f3f3]"
        :class="{ 'module-readable': !isAssetsRoute }"
      >
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue"
import { useRoute } from "vue-router"

import AppHeader from "./components/Layout/AppHeader.vue"
import AppSidebar from "./components/Layout/AppSidebar.vue"
import ImpersonationBanner from "./components/auth/ImpersonationBanner.vue"
import { useAuthSession } from "./composables/auth/useAuthSession.js"
import { LIGHT_PRIVATE_ROUTE_VIEW_KEYS, preloadPrivateRouteViews } from "./router"

const route = useRoute()
const { isAuthenticated } = useAuthSession()
const appSidebarRef = ref(null)
let cancelRouteViewPreload = null

const isPublicRoute = computed(() => route.meta.public === true)
const isAssetsRoute = computed(() => {
  return route.name === "Activos" || route.name === "AppActivos"
})

const toggleSidebar = () => {
  appSidebarRef.value?.toggle()
}

watch(
  [isAuthenticated, isPublicRoute, () => route.meta.preloadKey],
  ([authenticated, publicRoute, currentPreloadKey]) => {
    if (cancelRouteViewPreload) {
      cancelRouteViewPreload()
      cancelRouteViewPreload = null
    }

    if (!authenticated || publicRoute) return

    cancelRouteViewPreload = preloadPrivateRouteViews({
      batchDelayMs: 1800,
      exclude: [currentPreloadKey],
      idleTimeoutMs: 7000,
      include: LIGHT_PRIVATE_ROUTE_VIEW_KEYS,
      maxPreloads: 2,
      startDelayMs: 5500,
    })
  },
  {
    flush: "post",
    immediate: true,
  },
)

onBeforeUnmount(() => {
  if (cancelRouteViewPreload) {
    cancelRouteViewPreload()
  }
})
</script>

<style>
.module-readable .text-\[9px\] {
  font-size: 11px !important;
}

.module-readable .text-\[10px\] {
  font-size: 12px !important;
}

.module-readable .text-\[11px\] {
  font-size: 13px !important;
}
</style>
