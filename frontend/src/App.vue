<template>
  <div class="fixed inset-0 flex flex-col overflow-hidden bg-gray-50 font-sans">
    <AppHeader @toggle-sidebar="toggleSidebar" />

    <div class="relative flex min-h-0 flex-1 overflow-hidden">
      <AppSidebar v-model:is-open="showSidebar" />

      <main class="min-h-0 flex-1 overflow-hidden bg-[#f3f3f3]">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue"
import AppHeader from "./components/Layout/AppHeader.vue"
import AppSidebar from "./components/Layout/AppSidebar.vue"

const showSidebar = ref(false)

const toggleSidebar = () => {
  showSidebar.value = !showSidebar.value
}
</script>
