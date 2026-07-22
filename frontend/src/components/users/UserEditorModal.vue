<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 z-[900] flex items-end justify-center bg-slate-950/35 p-2 sm:items-center"
    @click.self="$emit('close')"
  >
    <section
      class="flex max-h-[calc(100%-16px)] w-full max-w-[520px] flex-col overflow-hidden rounded-xl bg-white shadow-[0_24px_80px_rgba(15,23,42,0.34)]"
    >
      <header class="border-b border-[#edf1f5] px-4 py-3">
        <div class="flex items-center justify-between gap-3">
          <div class="min-w-0">
            <p class="text-[10px] font-black uppercase tracking-[0.16em] text-[#ff6600]">
              {{ mode === "edit" ? "Editar usuario" : "Nuevo usuario" }}
            </p>

            <h2 class="mt-1 text-[15px] font-black text-[#102372]">
              {{ mode === "edit" ? "Datos del usuario" : "Crear usuario" }}
            </h2>
          </div>

          <button
            type="button"
            class="rounded-md px-2 py-1 text-[18px] font-black text-slate-400 transition hover:bg-slate-100 hover:text-[#102372]"
            @click="$emit('close')"
          >
            ×
          </button>
        </div>
      </header>

      <div class="min-h-0 overflow-auto p-4">
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="block">
            <span class="text-[10px] font-black uppercase text-slate-400">Nombre</span>
            <input
              :value="draftUser.name"
              type="text"
              class="mt-1 h-10 w-full rounded-lg border border-[#d8dee8] px-3 text-[12px] font-semibold outline-none transition focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/10"
              @input="updateDraftField('name', $event.target.value)"
            />
          </label>

          <label class="block">
            <span class="text-[10px] font-black uppercase text-slate-400">Correo</span>
            <input
              :value="draftUser.email"
              type="email"
              class="mt-1 h-10 w-full rounded-lg border border-[#d8dee8] px-3 text-[12px] font-semibold outline-none transition focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/10"
              @input="updateDraftField('email', $event.target.value)"
            />
          </label>

          <label class="block">
            <span class="text-[10px] font-black uppercase text-slate-400">Usuario</span>
            <input
              :value="draftUser.username"
              type="text"
              autocomplete="username"
              class="mt-1 h-10 w-full rounded-lg border border-[#d8dee8] px-3 text-[12px] font-semibold outline-none transition focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/10"
              @input="updateDraftField('username', $event.target.value)"
            />
          </label>

          <label class="block">
            <span class="text-[10px] font-black uppercase text-slate-400">
              {{ mode === "edit" ? "Nueva contraseña" : "Contraseña" }}
            </span>
            <input
              :value="draftUser.password"
              type="password"
              autocomplete="new-password"
              class="mt-1 h-10 w-full rounded-lg border border-[#d8dee8] px-3 text-[12px] font-semibold outline-none transition focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/10"
              :placeholder="mode === 'edit' ? 'Dejar en blanco para mantenerla' : ''"
              @input="updateDraftField('password', $event.target.value)"
            />
          </label>

          <label class="block">
            <span class="text-[10px] font-black uppercase text-slate-400">Estado</span>
            <select
              :value="draftUser.status"
              class="mt-1 h-10 w-full cursor-pointer rounded-lg border border-[#d8dee8] bg-white px-3 text-[12px] font-black text-[#102372] outline-none transition focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/10"
              @change="updateDraftField('status', $event.target.value)"
            >
              <option value="active">Activo</option>
              <option value="pending">Pendiente</option>
              <option value="inactive">Inactivo</option>
            </select>
          </label>

          <label class="block">
            <span class="text-[10px] font-black uppercase text-slate-400">Rol</span>
            <select
              :value="draftUser.initialRole"
              class="mt-1 h-10 w-full cursor-pointer rounded-lg border border-[#d8dee8] bg-white px-3 text-[12px] font-black text-[#102372] outline-none transition focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/10"
              @change="updateDraftField('initialRole', $event.target.value)"
            >
              <option v-for="role in roles" :key="role.id" :value="role.id">
                {{ role.name }}
              </option>
            </select>
          </label>
        </div>

        <label v-if="mode !== 'edit'" class="mt-3 block">
          <span class="text-[10px] font-black uppercase text-slate-400">Empresa inicial</span>
          <select
            :value="draftUser.initialApplicationId"
            class="mt-1 h-10 w-full cursor-pointer rounded-lg border border-[#d8dee8] bg-white px-3 text-[12px] font-black text-[#102372] outline-none transition focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/10"
            @change="updateDraftField('initialApplicationId', $event.target.value)"
          >
            <option value="">Sin empresa inicial</option>
            <option
              v-for="application in applications"
              :key="application.id"
              :value="application.id"
            >
              {{ application.name }}
            </option>
          </select>
        </label>
      </div>

      <footer class="flex justify-end gap-2 border-t border-[#edf1f5] bg-[#f8fafc] px-4 py-3">
        <button
          type="button"
          class="h-9 rounded-lg border border-[#d8dee8] bg-white px-4 text-[11px] font-black text-[#102372] transition hover:bg-[#f8fafc]"
          @click="$emit('close')"
        >
          Cancelar
        </button>

        <button
          type="button"
          class="h-9 rounded-lg bg-[#102372] px-4 text-[11px] font-black text-white transition hover:bg-[#0c1b59] disabled:cursor-not-allowed disabled:bg-slate-300"
          :disabled="!canSave"
          @click="$emit('save')"
        >
          {{ mode === "edit" ? "Guardar" : "Crear" }}
        </button>
      </footer>
    </section>
  </div>
</template>

<script setup>
import { computed } from "vue"

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  mode: {
    type: String,
    default: "create",
  },
  draftUser: {
    type: Object,
    required: true,
  },
  roles: {
    type: Array,
    default: () => [],
  },
  applications: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(["update:draft-user", "close", "save"])

const canSave = computed(() => {
  const hasRequiredBase = Boolean(
    props.draftUser.name?.trim() &&
    props.draftUser.email?.trim() &&
    props.draftUser.username?.trim(),
  )

  if (props.mode === "edit") return hasRequiredBase

  return Boolean(hasRequiredBase && props.draftUser.password?.trim())
})

const updateDraftField = (field, value) => {
  emit("update:draft-user", {
    ...props.draftUser,
    [field]: value,
  })
}
</script>
