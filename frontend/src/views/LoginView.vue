<template>
  <main class="min-h-dvh overflow-x-hidden bg-[#020916] text-[#172033]">
    <section class="grid min-h-dvh lg:grid-cols-[minmax(440px,500px)_minmax(0,1fr)]">
      <section
        class="login-sidebar relative flex min-h-dvh flex-col overflow-y-auto border-r border-[#102372]/10 bg-[#f3f6fb]"
      >
        <div
          class="pointer-events-none absolute -left-[86px] -top-[72px] h-[260px] w-[330px] -skew-x-12 rounded-br-[64px] bg-[#102372]"
        ></div>

        <div
          class="pointer-events-none absolute -right-[115px] top-[58px] h-[230px] w-[230px] rounded-full bg-[#ff6600]/85"
        ></div>

        <div
          class="pointer-events-none absolute -bottom-[150px] right-[18px] h-[260px] w-[260px] rounded-full bg-[#102372]/8"
        ></div>

        <header
          class="relative z-10 flex shrink-0 items-center justify-between px-7 pb-3 pt-6 sm:px-9"
        >
          <div class="grid h-[58px] w-[184px] place-items-center overflow-hidden">
            <img
              :src="brandLogo"
              alt="Sinergy Group"
              class="block h-auto w-[164px]"
              decoding="async"
            />
          </div>

          <div
            class="flex items-center gap-2 rounded-full border border-white/70 bg-white/75 px-3 py-2 shadow-sm"
          >
            <span class="h-2 w-2 rounded-full bg-emerald-500"></span>

            <span class="text-[9px] font-black uppercase tracking-[0.12em] text-emerald-700">
              Online
            </span>
          </div>
        </header>

        <div class="relative z-10 flex flex-1 items-center justify-center px-7 py-6 sm:px-9">
          <form
            class="w-full max-w-[400px] rounded-lg border border-white/80 bg-white/95 p-5 shadow-[0_18px_44px_rgba(15,23,42,0.1)] sm:p-6"
            @submit.prevent="handleSubmit"
          >
            <div class="mb-6">
              <div class="mb-4 flex items-center gap-3">
                <div class="relative h-[14px] w-[48px] shrink-0">
                  <span
                    class="absolute left-0 top-0 h-[14px] w-[30px] rounded-full bg-[#102372]"
                  ></span>

                  <span
                    class="absolute right-0 top-0 h-[14px] w-[30px] rounded-full bg-[#ff6600]/90"
                  ></span>
                </div>

                <p class="text-[10px] font-black uppercase tracking-[0.18em] text-[#102372]">
                  Acceso a plataforma
                </p>
              </div>

              <h1 class="text-[33px] font-black leading-none text-[#102372]">Bienvenido</h1>

              <p class="mt-3 max-w-[340px] text-[12px] font-medium leading-5 text-slate-500">
                Ingresa tus credenciales para acceder al monitoreo y control de tu flota.
              </p>
            </div>

            <div class="grid gap-4">
              <label class="group block">
                <span
                  class="mb-2 block text-[10px] font-black uppercase tracking-[0.07em] text-slate-600 transition-colors group-focus-within:text-[#102372]"
                >
                  Usuario o correo
                </span>

                <div class="relative">
                  <div
                    class="pointer-events-none absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg bg-[#e7ebf2] text-slate-500 transition-colors group-focus-within:bg-[#102372] group-focus-within:text-white"
                  >
                    <SvgIcon name="user" class="h-4 w-4" />
                  </div>

                  <input
                    v-model="identifier"
                    type="text"
                    autocomplete="username"
                    autofocus
                    class="h-[54px] w-full rounded-lg border border-[#d2d9e5] bg-[#f8fafc] pl-[58px] pr-4 text-[13px] font-bold text-[#172033] outline-none transition-colors placeholder:font-medium placeholder:text-slate-400 hover:border-[#b6c0cf] focus:border-[#102372] focus:bg-white focus:ring-4 focus:ring-[#102372]/10"
                    placeholder="usuario@empresa.cl"
                    @input="clearError"
                  />
                </div>
              </label>

              <label class="group block">
                <span
                  class="mb-2 block text-[10px] font-black uppercase tracking-[0.07em] text-slate-600 transition-colors group-focus-within:text-[#102372]"
                >
                  Contrase&ntilde;a
                </span>

                <div class="relative">
                  <div
                    class="pointer-events-none absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg bg-[#e7ebf2] text-slate-500 transition-colors group-focus-within:bg-[#102372] group-focus-within:text-white"
                  >
                    <SvgIcon name="lock" class="h-4 w-4" />
                  </div>

                  <input
                    v-model="password"
                    :type="showPassword ? 'text' : 'password'"
                    autocomplete="current-password"
                    class="h-[54px] w-full rounded-lg border border-[#d2d9e5] bg-[#f8fafc] pl-[58px] pr-[54px] text-[13px] font-bold text-[#172033] outline-none transition-colors placeholder:font-medium placeholder:text-slate-400 hover:border-[#b6c0cf] focus:border-[#102372] focus:bg-white focus:ring-4 focus:ring-[#102372]/10"
                    placeholder="Ingresa tu contrase&ntilde;a"
                    @input="clearError"
                  />

                  <button
                    type="button"
                    class="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-[#102372]/5 hover:text-[#102372]"
                    :aria-label="showPassword ? 'Ocultar contrase\u00f1a' : 'Ver contrase\u00f1a'"
                    :title="showPassword ? 'Ocultar contrase\u00f1a' : 'Ver contrase\u00f1a'"
                    @click="showPassword = !showPassword"
                  >
                    <SvgIcon :name="showPassword ? 'eye-off' : 'eye'" class="h-4 w-4" />
                  </button>
                </div>
              </label>

              <div class="flex items-center justify-between gap-4 py-1">
                <label
                  class="inline-flex cursor-pointer items-center gap-2 text-[11px] font-bold text-slate-500"
                >
                  <input
                    v-model="rememberSession"
                    type="checkbox"
                    class="h-4 w-4 cursor-pointer rounded border-[#aeb8c8] accent-[#ff6600]"
                  />

                  Mantener sesi&oacute;n
                </label>

                <div class="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                  <SvgIcon name="shield" class="h-4 w-4 text-[#102372]" />
                  Acceso protegido
                </div>
              </div>

              <div
                v-if="errorMessage"
                role="alert"
                class="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3"
              >
                <div
                  class="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-red-100 text-[11px] font-black text-red-600"
                >
                  !
                </div>

                <p class="text-[11px] font-bold leading-5 text-red-700">
                  {{ errorMessage }}
                </p>
              </div>

              <button
                type="submit"
                class="group relative mt-1 flex h-[54px] items-center justify-center overflow-hidden rounded-lg bg-[#102372] px-5 text-[13px] font-black text-white shadow-[0_12px_24px_rgba(16,35,114,0.16)] transition-colors hover:bg-[#0c1c60] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                :disabled="!canSubmit || isSubmitting"
              >
                <span
                  class="pointer-events-none absolute -right-8 top-1/2 h-20 w-20 -translate-y-1/2 rounded-full bg-[#ff6600]"
                ></span>

                <span class="relative flex items-center justify-center gap-3">
                  <span
                    v-if="isSubmitting"
                    class="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                  ></span>

                  {{ isSubmitting ? "Validando acceso..." : "Ingresar a la plataforma" }}

                  <SvgIcon v-if="!isSubmitting" name="arrow-right" class="h-4 w-4" />
                </span>
              </button>
            </div>

            <div class="mt-5 flex items-center justify-between border-t border-[#102372]/10 pt-4">
              <span class="text-[8px] font-bold uppercase tracking-[0.12em] text-slate-400">
                Sinergy GPS Platform
              </span>

              <div class="flex items-center gap-2 text-[8px] font-bold text-slate-400">
                <span class="h-1.5 w-1.5 rounded-full bg-[#ff6600]"></span>
                Soluciones tecnol&oacute;gicas
              </div>
            </div>
          </form>
        </div>
      </section>

      <aside class="relative hidden min-h-dvh overflow-hidden bg-[#020916] lg:block">
        <div class="absolute inset-0 bg-cover bg-center bg-no-repeat" :style="heroPanelStyle"></div>

        <div
          class="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,9,22,0.28)_0%,rgba(2,9,22,0.04)_34%,rgba(2,9,22,0.12)_100%)]"
        ></div>

        <div
          class="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,9,22,0.12),transparent_28%,rgba(2,9,22,0.28))]"
        ></div>
      </aside>
    </section>
  </main>
</template>

<script setup>
import { computed, ref } from "vue"
import { useRoute, useRouter } from "vue-router"

import brandLogo from "../assets/branding/sinergy-group.png"
import SvgIcon from "../components/icons/SvgIcon.vue"
import { useAuthSession } from "../composables/auth/useAuthSession.js"

const route = useRoute()
const router = useRouter()
const { login, defaultAuthenticatedRoute } = useAuthSession()

const identifier = ref("")
const password = ref("")
const showPassword = ref(false)
const rememberSession = ref(true)
const errorMessage = ref("")
const isSubmitting = ref(false)

const loginHeroImagePath = "/login-telemetry-hero.jpg?v=20260720"
const heroPanelStyle = Object.freeze({
  backgroundImage: `url(${loginHeroImagePath})`,
})

const canSubmit = computed(() => {
  return Boolean(identifier.value.trim() && password.value)
})

const clearError = () => {
  if (errorMessage.value) {
    errorMessage.value = ""
  }
}

const getRedirectPath = () => {
  const redirect = route.query.redirect

  if (typeof redirect === "string" && redirect.startsWith("/") && !redirect.startsWith("//")) {
    return redirect
  }

  return defaultAuthenticatedRoute.value
}

const handleSubmit = async () => {
  if (!canSubmit.value || isSubmitting.value) return

  errorMessage.value = ""
  isSubmitting.value = true

  try {
    const result = login({
      identifier: identifier.value,
      password: password.value,
      rememberSession: rememberSession.value,
    })

    if (!result.ok) {
      errorMessage.value = result.message
      return
    }

    await router.replace(getRedirectPath())
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.login-sidebar {
  scrollbar-width: none;
}

.login-sidebar::-webkit-scrollbar {
  display: none;
}
</style>
