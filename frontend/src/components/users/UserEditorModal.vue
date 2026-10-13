<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-[2147483000] grid place-items-center overflow-y-auto bg-slate-950/50 p-3 sm:p-5"
      @click.self="$emit('close')"
    >
      <section
        class="my-auto flex max-h-[calc(100vh-24px)] w-full max-w-[960px] flex-col overflow-hidden rounded-xl bg-white shadow-[0_30px_80px_rgba(13,23,38,0.28)] sm:max-h-[calc(100vh-40px)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-editor-title"
      >
        <header
          class="flex shrink-0 items-center justify-between gap-4 border-b border-[#e6eaf1] px-5 py-4 sm:px-8 sm:py-5"
        >
          <div class="min-w-0">
            <p class="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#ff6600]">
              Gestion de usuarios · {{ mode === "edit" ? "Edicion" : "Alta" }}
            </p>
            <h2
              id="user-editor-title"
              class="mt-1 text-[22px] font-extrabold leading-tight text-[#102372]"
            >
              {{ mode === "edit" ? "Editar usuario" : "Nuevo usuario" }}
            </h2>
          </div>

          <button
            type="button"
            class="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#f1f4f8] text-slate-500 transition hover:bg-[#e7edf6] hover:text-[#102372]"
            aria-label="Cerrar"
            @click="$emit('close')"
          >
            <SvgIcon name="close" class="h-5 w-5" />
          </button>
        </header>

        <form class="min-h-0 overflow-y-auto" novalidate @submit.prevent="$emit('save')">
          <div class="grid lg:grid-cols-[minmax(0,1.2fr)_minmax(295px,0.8fr)]">
            <section class="p-5 sm:p-7 lg:px-8">
              <div class="mb-5 flex items-baseline justify-between gap-3">
                <h3 class="text-[15px] font-extrabold text-[#172b4a]">Datos de la cuenta</h3>
                <span class="text-[11px] text-slate-500">Identificacion y credenciales</span>
              </div>

              <div class="space-y-4">
                <FieldLabel label="Nombre completo" required>
                  <input
                    :value="draftUser.name"
                    type="text"
                    autocomplete="name"
                    placeholder="Ej.: Maria Gonzalez"
                    class="user-field"
                    @input="updateDraftField('name', $event.target.value)"
                  />
                </FieldLabel>

                <FieldLabel label="Correo electronico" required>
                  <input
                    :value="draftUser.email"
                    type="email"
                    autocomplete="email"
                    placeholder="nombre@empresa.cl"
                    class="user-field"
                    @input="updateDraftField('email', $event.target.value)"
                  />
                </FieldLabel>

                <div class="grid gap-4 sm:grid-cols-2">
                  <FieldLabel label="Usuario" required>
                    <input
                      :value="draftUser.username"
                      type="text"
                      autocomplete="username"
                      placeholder="Nombre de usuario"
                      class="user-field"
                      @input="updateDraftField('username', $event.target.value)"
                    />
                  </FieldLabel>

                  <FieldLabel
                    :label="mode === 'edit' ? 'Nueva contrasena' : 'Contrasena'"
                    :required="mode !== 'edit'"
                  >
                    <div class="relative">
                      <input
                        :value="draftUser.password"
                        :type="showPassword ? 'text' : 'password'"
                        autocomplete="new-password"
                        :placeholder="
                          mode === 'edit' ? 'Dejar en blanco para mantenerla' : 'Min. 8 caracteres'
                        "
                        class="user-field pr-11"
                        @input="updateDraftField('password', $event.target.value)"
                      />
                      <button
                        type="button"
                        class="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-[#102372]"
                        :aria-label="showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'"
                        :aria-pressed="showPassword"
                        @click="showPassword = !showPassword"
                      >
                        <SvgIcon
                          :name="showPassword ? 'eye-off' : 'eye'"
                          class="h-[18px] w-[18px]"
                        />
                      </button>
                    </div>
                  </FieldLabel>
                </div>
              </div>
            </section>

            <section
              class="border-t border-[#e7eaf0] bg-[#f4f6fa] p-5 sm:p-7 lg:border-l lg:border-t-0"
            >
              <div class="mb-5 flex items-baseline justify-between gap-3">
                <h3 class="text-[15px] font-extrabold text-[#172b4a]">Acceso inicial</h3>
                <span class="text-[11px] text-slate-500">Configuracion</span>
              </div>

              <div class="space-y-5">
                <FieldLabel label="Estado">
                  <select
                    :value="draftUser.status"
                    class="user-field user-select"
                    @change="updateDraftField('status', $event.target.value)"
                  >
                    <option value="pending">Pendiente</option>
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </FieldLabel>

                <FieldLabel label="Rol">
                  <select
                    :value="draftUser.initialRole"
                    class="user-field user-select"
                    @change="updateDraftField('initialRole', $event.target.value)"
                  >
                    <option v-for="role in roles" :key="role.id" :value="role.id">
                      {{ role.name }}
                    </option>
                  </select>
                </FieldLabel>

                <FieldLabel v-if="mode !== 'edit'" label="Empresa inicial" required>
                  <select
                    :value="draftUser.initialApplicationId"
                    class="user-field user-select"
                    @change="updateDraftField('initialApplicationId', $event.target.value)"
                  >
                    <option value="">Seleccionar empresa</option>
                    <option
                      v-for="application in applications"
                      :key="application.id"
                      :value="application.id"
                    >
                      {{ application.name }}
                    </option>
                  </select>
                </FieldLabel>

                <p
                  v-else
                  class="rounded-lg border border-[#dce3ee] bg-white px-3 py-2.5 text-[11px] leading-relaxed text-slate-500"
                >
                  Los accesos por empresa se administran desde el detalle del usuario.
                </p>
              </div>
            </section>
          </div>

          <footer
            class="sticky bottom-0 flex shrink-0 flex-col gap-3 border-t border-[#e6eaf1] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8"
          >
            <small class="text-[11px] text-slate-500">* Campos obligatorios</small>
            <div class="flex justify-end gap-2">
              <button
                type="button"
                class="h-10 rounded-lg border border-[#ccd6e6] bg-white px-5 text-[12px] font-bold text-[#152756] hover:bg-[#f5f7fb]"
                @click="$emit('close')"
              >
                Cancelar
              </button>
              <button
                type="submit"
                class="h-10 min-w-[120px] rounded-lg bg-[#ff6600] px-5 text-[12px] font-bold text-white hover:bg-[#e85c00] disabled:cursor-not-allowed disabled:bg-slate-300"
                :disabled="!canSave"
              >
                {{ mode === "edit" ? "Guardar cambios" : "Crear usuario" }}
              </button>
            </div>
          </footer>
        </form>
      </section>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, defineComponent, h, onBeforeUnmount, onMounted, ref } from "vue"
import SvgIcon from "../icons/SvgIcon.vue"

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  mode: { type: String, default: "create" },
  draftUser: { type: Object, required: true },
  roles: { type: Array, default: () => [] },
  applications: { type: Array, default: () => [] },
})
const emit = defineEmits(["update:draft-user", "close", "save"])
const showPassword = ref(false)
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const canSave = computed(() => {
  const baseValid = Boolean(
    props.draftUser.name?.trim() &&
    emailPattern.test(props.draftUser.email?.trim() || "") &&
    props.draftUser.username?.trim(),
  )
  if (props.mode === "edit") return baseValid
  return Boolean(
    baseValid &&
    props.draftUser.password?.trim().length >= 8 &&
    props.draftUser.initialApplicationId,
  )
})

const updateDraftField = (field, value) =>
  emit("update:draft-user", { ...props.draftUser, [field]: value })
const handleKeydown = (event) => {
  if (event.key === "Escape") emit("close")
}
onMounted(() => document.addEventListener("keydown", handleKeydown))
onBeforeUnmount(() => document.removeEventListener("keydown", handleKeydown))

const FieldLabel = defineComponent({
  props: { label: { type: String, required: true }, required: { type: Boolean, default: false } },
  setup(fieldProps, { slots }) {
    return () =>
      h("label", { class: "block" }, [
        h("span", { class: "mb-2 block text-[11px] font-bold text-[#4d607a]" }, [
          fieldProps.label,
          fieldProps.required ? h("span", { class: "text-[#ff6600]" }, " *") : null,
        ]),
        slots.default?.(),
      ])
  },
})
</script>

<style scoped>
.user-field {
  height: 43px;
  width: 100%;
  border: 1px solid #d2ddeb;
  border-radius: 8px;
  background: white;
  padding-left: 12px;
  padding-right: 12px;
  color: #182d4c;
  font-size: 12px;
  font-weight: 600;
  outline: none;
  transition:
    border-color 140ms ease,
    box-shadow 140ms ease;
}
.user-field::placeholder {
  color: #93a1b6;
}
.user-field:focus {
  border-color: #6986d7;
  box-shadow: 0 0 0 3px rgb(16 35 114 / 7%);
}
.user-select {
  cursor: pointer;
  padding-right: 32px;
}
</style>
