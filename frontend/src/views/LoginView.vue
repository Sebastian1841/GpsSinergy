<template>
  <main class="grid min-h-screen place-items-center bg-[#eef2f7] px-4 py-8">
    <section
      class="w-full max-w-[410px] overflow-hidden rounded-lg border border-[#d8dee8] bg-white shadow-xl"
    >
      <header class="bg-[#102372] px-5 py-5">
        <div class="flex items-center justify-between gap-4">
          <div class="min-w-0">
            <p class="text-[10px] font-black uppercase tracking-[0.18em] text-white/55">
              Plataforma de control GPS
            </p>
            <h1 class="mt-1 text-[18px] font-black text-white">Iniciar sesión</h1>
          </div>

          <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#ff6600]">
            <span class="text-[13px] font-black text-white">SG</span>
          </div>
        </div>
      </header>

      <form class="grid gap-4 p-5" @submit.prevent="handleSubmit">
        <label class="block">
          <span class="text-[10px] font-black uppercase text-slate-500">Usuario o correo</span>
          <input
            v-model="identifier"
            type="text"
            autocomplete="username"
            autofocus
            class="mt-1.5 h-11 w-full rounded-lg border border-[#d8dee8] px-3 text-[13px] font-semibold text-[#172033] outline-none transition placeholder:text-slate-400 focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/10"
            placeholder="Ingresa tu usuario"
          />
        </label>

        <label class="block">
          <span class="text-[10px] font-black uppercase text-slate-500">Contraseña</span>
          <div class="relative mt-1.5">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              class="h-11 w-full rounded-lg border border-[#d8dee8] px-3 pr-16 text-[13px] font-semibold text-[#172033] outline-none transition placeholder:text-slate-400 focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/10"
              placeholder="Ingresa tu contraseña"
            />

            <button
              type="button"
              class="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-[10px] font-black text-[#102372] transition hover:bg-[#eef2f7]"
              @click="showPassword = !showPassword"
            >
              {{ showPassword ? "Ocultar" : "Ver" }}
            </button>
          </div>
        </label>

        <p
          v-if="errorMessage"
          role="alert"
          class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-bold text-red-700"
        >
          {{ errorMessage }}
        </p>

        <button
          type="submit"
          class="h-11 rounded-lg bg-[#ff6600] px-4 text-[12px] font-black text-white transition hover:bg-[#e65c00] disabled:cursor-not-allowed disabled:bg-slate-300"
          :disabled="!canSubmit"
        >
          Ingresar
        </button>
      </form>

      <footer class="border-t border-[#edf1f5] bg-[#f8fafc] px-5 py-3">
        <p class="text-[10px] font-semibold text-slate-500">
          Acceso temporal: <span class="font-black text-[#102372]">admin</span> /
          <span class="font-black text-[#102372]">admin1234</span>
        </p>
      </footer>
    </section>
  </main>
</template>

<script setup>
import { computed, ref } from "vue"
import { useRoute, useRouter } from "vue-router"

import { useAuthSession } from "../composables/auth/useAuthSession.js"

const route = useRoute()
const router = useRouter()
const { login, defaultAuthenticatedRoute } = useAuthSession()

const identifier = ref("")
const password = ref("")
const showPassword = ref(false)
const errorMessage = ref("")

const canSubmit = computed(() => {
  return Boolean(identifier.value.trim() && password.value)
})

const getRedirectPath = () => {
  const redirect = route.query.redirect

  if (typeof redirect === "string" && redirect.startsWith("/") && !redirect.startsWith("//")) {
    return redirect
  }

  return defaultAuthenticatedRoute.value
}

const handleSubmit = async () => {
  if (!canSubmit.value) return

  errorMessage.value = ""

  const result = login({
    identifier: identifier.value,
    password: password.value,
  })

  if (!result.ok) {
    errorMessage.value = result.message
    return
  }

  await router.replace(getRedirectPath())
}
</script>
