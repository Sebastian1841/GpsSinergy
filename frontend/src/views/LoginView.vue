<template>
  <main class="login-page relative min-h-dvh overflow-hidden text-white">
    <!-- IMAGEN ORIGINAL DEL LOGIN -->
    <div class="hero-visual pointer-events-none absolute inset-0" aria-hidden="true">
      <div class="hero-image absolute inset-0" :style="heroPanelStyle"></div>

      <div class="scene-contrast absolute inset-0"></div>
    </div>

    <!-- PANEL ANGULAR -->
    <div
      class="login-panel-shape pointer-events-none absolute inset-y-0 left-0 z-[2]"
      aria-hidden="true"
    ></div>

    <!-- LOGIN -->
    <section class="login-content relative z-10">
      <section class="login-zone relative w-full">
        <header class="login-header flex items-center justify-start">
          <div class="login-logo-frame" role="img" aria-label="Sinergy Group">
            <iframe
              class="login-logo-animation"
              src="/logo-sinergy.html"
              title="Sinergy Group"
              loading="eager"
              scrolling="no"
              tabindex="-1"
              aria-hidden="true"
            ></iframe>
          </div>
        </header>

        <form @submit.prevent="handleSubmit">
          <!-- PRESENTACIÓN -->
          <div class="login-intro">
            <div class="access-heading flex items-center gap-3">
              <span class="access-line h-[3px] w-6 rounded-full"></span>

              <p class="access-label font-black uppercase">Acceso a plataforma</p>
            </div>

            <h1 class="login-title font-black text-white">Bienvenido</h1>

            <p class="login-description max-w-[340px] font-medium">
              Ingresa tus credenciales para acceder al monitoreo y control de tu flota.
            </p>
          </div>

          <div class="login-form-fields grid">
            <!-- USUARIO -->
            <label class="login-field group block">
              <span class="field-label block"> Usuario o correo </span>

              <div class="relative">
                <div
                  class="field-icon pointer-events-none absolute left-3 top-1/2 grid -translate-y-1/2 place-items-center rounded-lg"
                >
                  <SvgIcon name="user" class="h-[18px] w-[18px]" />
                </div>

                <input
                  v-model="identifier"
                  type="text"
                  autocomplete="username"
                  class="login-input w-full rounded-xl font-bold text-white outline-none transition"
                  placeholder="usuario@empresa.cl"
                  @input="clearError"
                />
              </div>
            </label>

            <!-- CONTRASEÑA -->
            <label class="login-field group block">
              <span class="field-label block"> Contraseña </span>

              <div class="relative">
                <div
                  class="field-icon pointer-events-none absolute left-3 top-1/2 grid -translate-y-1/2 place-items-center rounded-lg"
                >
                  <SvgIcon name="lock" class="h-[18px] w-[18px]" />
                </div>

                <input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="current-password"
                  class="login-input w-full rounded-xl font-bold text-white outline-none transition"
                  placeholder="Ingresa tu contraseña"
                  @input="clearError"
                />

                <button
                  type="button"
                  class="password-toggle absolute right-2 top-1/2 grid -translate-y-1/2 place-items-center rounded-lg transition"
                  :aria-label="showPassword ? 'Ocultar contraseña' : 'Ver contraseña'"
                  :title="showPassword ? 'Ocultar contraseña' : 'Ver contraseña'"
                  @click="showPassword = !showPassword"
                >
                  <SvgIcon :name="showPassword ? 'eye-off' : 'eye'" class="h-[19px] w-[19px]" />
                </button>
              </div>
            </label>

            <!-- OPCIONES -->
            <div class="login-options flex items-center justify-between gap-4">
              <label
                class="remember-option inline-flex cursor-pointer items-center gap-2.5 font-bold"
              >
                <input
                  v-model="rememberSession"
                  type="checkbox"
                  class="remember-checkbox cursor-pointer rounded"
                />

                Mantener sesión
              </label>

              <div class="protected-access flex items-center gap-2.5 font-bold">
                <SvgIcon name="shield" class="h-[18px] w-[18px]" />

                Acceso protegido
              </div>
            </div>

            <!-- ERROR -->
            <div
              v-if="errorMessage"
              role="alert"
              class="flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3"
            >
              <div
                class="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-red-400/15 text-[11px] font-black text-red-300"
              >
                !
              </div>

              <p class="text-[10px] font-bold leading-5 text-red-200">
                {{ errorMessage }}
              </p>
            </div>

            <!-- BOTÓN -->
            <button
              type="submit"
              class="login-button group flex w-full items-center justify-center rounded-xl px-5 font-black text-white transition"
              :disabled="!canSubmit || isSubmitting"
            >
              <span class="relative z-10 flex items-center justify-center gap-4">
                <span
                  v-if="isSubmitting"
                  class="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                ></span>

                {{ isSubmitting ? "Validando acceso..." : "Ingresar a la plataforma" }}

                <SvgIcon
                  v-if="!isSubmitting"
                  name="arrow-right"
                  class="h-5 w-5 transition-transform group-hover:translate-x-1"
                />
              </span>
            </button>
          </div>
        </form>

        <!-- CONEXIÓN SEGURA -->
        <div class="secure-summary flex items-start gap-4">
          <div class="secure-summary-icon grid shrink-0 place-items-center rounded-lg">
            <SvgIcon name="shield" class="h-5 w-5" />
          </div>

          <div>
            <p class="secure-summary-title font-black">Conexión segura</p>

            <p class="secure-summary-description font-medium">
              Tus datos están protegidos con cifrado de nivel empresarial.
            </p>
          </div>
        </div>
      </section>
    </section>
  </main>
</template>

<script setup>
import { computed, ref } from "vue"
import { useRoute, useRouter } from "vue-router"

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

/*
 * Se conserva la imagen original que ya utilizaba el login.
 * Debe continuar ubicada dentro de la carpeta public.
 */
const loginHeroImagePath = "/login-dashboard-hero.jpg?v=20260811"

const heroPanelStyle = Object.freeze({
  backgroundImage: `url("${loginHeroImagePath}")`,
  backgroundPosition: "right center",
  backgroundSize: "contain",
  backgroundRepeat: "no-repeat",
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
.login-page {
  --panel-width: clamp(500px, 33vw, 560px);
  --content-left: clamp(48px, 5vw, 82px);

  --sinergy-blue: #102372;
  --sinergy-orange: #ff6600;
  --sinergy-orange-light: #ff8126;
  --tech-blue: #38bdf8;

  isolation: isolate;
  background: #020916;
}

/* =========================================================
   IMAGEN ORIGINAL
   ========================================================= */

.hero-visual {
  z-index: 0;
  overflow: hidden;
  isolation: isolate;
  transform: translateZ(0);
}

.hero-image {
  position: absolute;
  inset: 0;

  background-position: right center;
  background-repeat: no-repeat;
  background-size: contain;

  transform: translateZ(0);
  backface-visibility: hidden;
}

/*
 * Solo añade una corrección mínima de contraste.
 * No cambia los colores ni tapa la imagen original.
 */
.scene-contrast {
  background:
    linear-gradient(90deg, rgba(1, 7, 17, 0.12) 0%, rgba(1, 7, 17, 0.05) 32%, transparent 54%),
    linear-gradient(180deg, rgba(1, 7, 17, 0.025) 0%, transparent 40%, rgba(1, 7, 17, 0.06) 100%);
}

/* =========================================================
   PANEL ANGULAR
   ========================================================= */

.login-panel-shape {
  width: var(--panel-width);
  background: var(--sinergy-orange);

  clip-path: polygon(0 0, 79% 0, 100% 12.2%, 100% 84.2%, 79% 100%, 0 100%);

  filter: drop-shadow(16px 0 38px rgba(0, 0, 0, 0.25))
    drop-shadow(4px 0 18px rgba(255, 102, 0, 0.08));
}

.login-panel-shape::before {
  content: "";
  position: absolute;
  inset: 0 2px 0 0;

  clip-path: polygon(0 0, 79% 0, 100% 12.2%, 100% 84.2%, 79% 100%, 0 100%);

  background:
    radial-gradient(circle at 24% 18%, rgba(16, 35, 114, 0.24), transparent 43%),
    linear-gradient(
      145deg,
      rgba(6, 22, 48, 0.96) 0%,
      rgba(3, 17, 39, 0.97) 45%,
      rgba(2, 10, 25, 0.98) 75%,
      rgba(1, 7, 17, 0.99) 100%
    );
}

.login-panel-shape::after {
  content: "";
  position: absolute;
  inset: 0 2px 0 0;

  clip-path: polygon(0 0, 79% 0, 100% 12.2%, 100% 84.2%, 79% 100%, 0 100%);

  opacity: 0.08;

  background-image: radial-gradient(circle, rgba(56, 189, 248, 0.48) 0.8px, transparent 0.8px);

  background-size: 25px 25px;

  mask-image: linear-gradient(90deg, transparent 5%, rgba(0, 0, 0, 0.55) 55%, black 100%);
}

/* =========================================================
   POSICIÓN DEL CONTENIDO
   ========================================================= */

.login-content {
  display: flex;
  min-height: 100dvh;
  align-items: center;
  padding-left: var(--content-left);
}

.login-zone {
  width: 408px;
  max-width: calc(var(--panel-width) - var(--content-left) - 48px);
}

.login-header {
  padding-bottom: 34px;
}

.login-logo-frame {
  display: grid;
  width: 190px;
  height: 72px;
  place-items: center start;
  overflow: hidden;
}

.login-logo-animation {
  display: block;
  width: 214px;
  height: 82px;
  border: 0;
  background: transparent;
  overflow: hidden;
  pointer-events: none;
  transform: translateX(-10px);
  transform-origin: left center;
}

/* =========================================================
   PRESENTACIÓN
   ========================================================= */

.login-intro {
  margin-bottom: 36px;
}

.access-heading {
  margin-bottom: 25px;
}

.access-line {
  background: var(--sinergy-orange);
  box-shadow: 0 0 11px rgba(255, 102, 0, 0.35);
}

.access-label {
  color: var(--sinergy-orange);
  font-size: 10px;
  letter-spacing: 0.16em;
  text-shadow: 0 0 14px rgba(255, 102, 0, 0.12);
}

.login-title {
  font-size: 48px;
  line-height: 1;
  letter-spacing: -0.045em;
}

.login-description {
  margin-top: 20px;
  color: #a5afc0;
  font-size: 12px;
  line-height: 1.8;
}

/* =========================================================
   FORMULARIO
   ========================================================= */

.login-form-fields {
  gap: 20px;
}

.field-label {
  margin-bottom: 10px;
  color: #f0f2f6;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  transition: color 180ms ease;
}

.login-field:focus-within .field-label {
  color: var(--sinergy-orange-light);
}

.login-input {
  height: 60px;
  padding-left: 68px;
  padding-right: 18px;

  border: 1px solid rgba(104, 126, 165, 0.42);
  background: rgba(2, 12, 28, 0.76);

  font-size: 13px;

  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.018),
    0 10px 26px rgba(0, 0, 0, 0.1);

  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}

.login-input::placeholder {
  color: #6e7b92;
  font-weight: 500;
}

.login-input:hover {
  border-color: rgba(255, 102, 0, 0.45);
  background: rgba(3, 15, 34, 0.84);
}

.login-input:focus {
  border-color: rgba(255, 102, 0, 0.92);
  background: rgba(2, 12, 28, 0.96);

  box-shadow:
    0 0 0 4px rgba(255, 102, 0, 0.09),
    0 0 24px rgba(255, 102, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.025);
}

.login-field:nth-of-type(2) .login-input {
  padding-right: 62px;
}

/* =========================================================
   ICONOS
   ========================================================= */

.field-icon {
  z-index: 2;
  width: 44px;
  height: 44px;

  border: 1px solid rgba(255, 102, 0, 0.42);
  background: rgba(255, 102, 0, 0.1);
  color: var(--sinergy-orange-light);

  transition:
    color 180ms ease,
    border-color 180ms ease,
    background 180ms ease,
    box-shadow 180ms ease;
}

.field-icon :deep(svg),
.password-toggle :deep(svg),
.protected-access :deep(svg),
.secure-summary-icon :deep(svg) {
  opacity: 1;
  stroke-width: 2.35;
  filter: drop-shadow(0 0 6px rgba(255, 102, 0, 0.24));
}

.login-field:first-of-type .field-icon :deep(svg) {
  width: 20px;
  height: 20px;
  opacity: 0.98;
  filter: drop-shadow(0 0 6px rgba(255, 102, 0, 0.34)) drop-shadow(0 0 10px rgba(255, 102, 0, 0.16));
}

.login-field:focus-within .field-icon {
  border-color: rgba(255, 102, 0, 0.58);

  background: linear-gradient(145deg, rgba(255, 102, 0, 0.15), rgba(16, 35, 114, 0.34));

  color: var(--sinergy-orange-light);

  box-shadow:
    inset 0 0 14px rgba(255, 102, 0, 0.06),
    0 0 15px rgba(255, 102, 0, 0.09);
}

.password-toggle {
  z-index: 2;
  width: 44px;
  height: 44px;
  color: var(--sinergy-orange-light);
}

.password-toggle:hover {
  background: rgba(255, 102, 0, 0.09);
  color: var(--sinergy-orange-light);
}

/* =========================================================
   OPCIONES
   ========================================================= */

.login-options {
  min-height: 24px;
  margin-top: 1px;
}

.remember-option {
  color: #c3cad6;
  font-size: 11px;
}

.remember-option:hover {
  color: #ffffff;
}

.remember-checkbox {
  width: 18px;
  height: 18px;

  border: 1px solid rgba(255, 102, 0, 0.65);
  background: #07152d;

  accent-color: var(--sinergy-orange);
}

.protected-access {
  color: #9aa5b6;
  font-size: 10px;
}

.protected-access svg {
  color: #7dd3fc;
  filter: drop-shadow(0 0 5px rgba(56, 189, 248, 0.22));
}

/* =========================================================
   BOTÓN
   ========================================================= */

.login-button {
  position: relative;
  height: 60px;
  overflow: hidden;

  border: 1px solid rgba(255, 174, 112, 0.66);

  background: linear-gradient(105deg, #ff5800 0%, #ff6600 50%, #ff7d00 100%);

  font-size: 14px;

  box-shadow:
    0 17px 34px rgba(255, 102, 0, 0.23),
    0 0 25px rgba(255, 102, 0, 0.07),
    inset 0 1px 0 rgba(255, 255, 255, 0.21);
}

.login-button::before {
  content: "";
  position: absolute;
  top: 0;
  left: 7%;
  width: 86%;
  height: 1px;

  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.68), transparent);
}

.login-button::after {
  content: "";
  position: absolute;
  top: -85%;
  left: -35%;
  width: 34%;
  height: 280%;

  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.19), transparent);

  transform: rotate(18deg);
  transition: left 480ms ease;
}

.login-button:hover:not(:disabled) {
  border-color: rgba(255, 202, 162, 0.88);

  background: linear-gradient(105deg, #ff6900 0%, #ff7900 52%, #ff901d 100%);

  box-shadow:
    0 20px 40px rgba(255, 102, 0, 0.31),
    0 0 31px rgba(255, 102, 0, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.27);

  transform: translateY(-2px);
}

.login-button:hover:not(:disabled)::after {
  left: 112%;
}

.login-button:active:not(:disabled) {
  transform: translateY(0);
}

.login-button:disabled {
  cursor: not-allowed;

  border-color: rgba(255, 158, 87, 0.54);

  background: linear-gradient(105deg, #ee5800 0%, #f26200 52%, #e95d00 100%);

  color: rgba(255, 255, 255, 0.82);

  box-shadow:
    0 13px 28px rgba(255, 102, 0, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.13);
}

.login-button:disabled::after {
  display: none;
}

/* =========================================================
   CONEXIÓN SEGURA
   ========================================================= */

.secure-summary {
  margin-top: 40px;
  padding-top: 22px;
  border-top: 1px solid rgba(148, 163, 184, 0.14);
}

.secure-summary-icon {
  width: 44px;
  height: 44px;

  border: 1px solid rgba(56, 189, 248, 0.43);

  background: linear-gradient(145deg, rgba(16, 35, 114, 0.51), rgba(3, 20, 43, 0.86));

  color: #7dd3fc;

  box-shadow:
    inset 0 0 17px rgba(56, 189, 248, 0.07),
    0 8px 20px rgba(0, 0, 0, 0.12);
}

.secure-summary-title {
  color: #d9e0eb;
  font-size: 11px;
}

.secure-summary-description {
  max-width: 245px;
  margin-top: 5px;
  color: #69778e;
  font-size: 9px;
  line-height: 1.55;
}

/* =========================================================
   RESPONSIVE
   ========================================================= */

@media (max-width: 1100px) {
  .login-page {
    --panel-width: 500px;
    --content-left: 48px;
  }

  .login-zone {
    width: 390px;
  }
}

@media (max-width: 1023px) {
  .login-panel-shape {
    width: 100%;
    clip-path: none;
    background: rgba(2, 9, 22, 0.91);
    filter: none;
  }

  .login-panel-shape::before,
  .login-panel-shape::after {
    inset: 0;
    clip-path: none;
  }

  .login-content {
    justify-content: center;
    padding: 30px 24px;
  }

  .login-zone {
    width: min(408px, 100%);
    max-width: 100%;
  }

  .login-logo-frame {
    width: 184px;
    height: 70px;
  }

  .login-logo-animation {
    width: 204px;
    height: 78px;
    transform: translateX(-9px);
  }

  .hero-image {
    background-position: center center !important;
    background-size: contain !important;
  }

  .scene-contrast {
    background: rgba(2, 9, 22, 0.78);
  }
}

@media (max-width: 520px) {
  .login-content {
    padding: 26px 20px;
  }

  .login-zone {
    width: 100%;
  }

  .login-header {
    padding-bottom: 28px;
  }

  .login-header img {
    width: 168px;
  }

  .login-title {
    font-size: 38px;
  }

  .login-description {
    max-width: 100%;
  }

  .login-input {
    height: 56px;
  }

  .login-button {
    height: 56px;
  }

  .secure-summary {
    margin-top: 28px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .login-button::after {
    display: none;
  }
}

@media (max-height: 820px) and (min-width: 1024px) {
  .login-zone {
    transform: scale(0.86);
    transform-origin: left center;
  }
}
</style>
