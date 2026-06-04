<template>
  <router-view v-if="isPublicRoute" />

  <div v-else class="fixed inset-0 flex flex-col overflow-hidden bg-gray-50 font-sans">
    <AppHeader @toggle-sidebar="toggleSidebar" />
    <ImpersonationBanner />

    <div class="relative flex min-h-0 flex-1 overflow-hidden">
      <AppSidebar :is-open="showSidebar" @update:is-open="showSidebar = $event" />

      <main class="min-h-0 flex-1 overflow-hidden bg-[#f3f3f3]">
        <router-view :app-sidebar-open="showSidebar" />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue"
import { useRoute } from "vue-router"

import AppHeader from "./components/Layout/AppHeader.vue"
import AppSidebar from "./components/Layout/AppSidebar.vue"
import ImpersonationBanner from "./components/auth/ImpersonationBanner.vue"

const route = useRoute()
const showSidebar = ref(false)

const isPublicRoute = computed(() => route.meta.public === true)

const toggleSidebar = () => {
  showSidebar.value = !showSidebar.value
}
</script>
