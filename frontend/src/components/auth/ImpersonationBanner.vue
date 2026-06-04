<template>
  <div
    v-if="isImpersonating"
    class="flex shrink-0 items-center justify-between gap-3 border-b border-[#ffb27c] bg-[#fff3eb] px-4 py-2"
  >
    <p class="min-w-0 truncate text-[11px] font-bold text-[#102372]">
      Vista de <span class="font-black">{{ currentUser?.name }}</span>
      <span class="text-slate-500"> iniciada por {{ authenticatedUser?.name }}</span>
    </p>

    <button
      type="button"
      class="shrink-0 rounded-lg bg-[#102372] px-3 py-1.5 text-[10px] font-black text-white transition hover:bg-[#0c1b59]"
      @click="handleStopImpersonation"
    >
      Volver a administración
    </button>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router"

import { useAuthSession } from "../../composables/auth/useAuthSession.js"

const router = useRouter()
const { authenticatedUser, currentUser, isImpersonating, stopImpersonation } = useAuthSession()

const handleStopImpersonation = async () => {
  const { returnPath } = stopImpersonation()

  await router.replace(returnPath)
}
</script>
