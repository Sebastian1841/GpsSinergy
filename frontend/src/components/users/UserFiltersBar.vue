<template>
  <section class="rounded-xl border border-[#d8dee8] bg-white p-3">
    <div class="grid gap-2">
      <div class="relative">
        <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" aria-hidden="true">
            <path
              d="m20 20-4.35-4.35M18 10.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </span>

        <input
          v-model="searchModel"
          type="text"
          placeholder="Buscar usuario, empresa o módulo"
          class="h-10 w-full rounded-lg border border-[#d8dee8] bg-[#f8fafc] pl-9 pr-3 text-[12px] font-semibold text-[#172033] outline-none transition placeholder:text-slate-400 focus:border-[#ff6600] focus:bg-white focus:ring-2 focus:ring-[#ff6600]/10"
        />
      </div>

      <div class="grid grid-cols-1 gap-2">
        <select
          v-model="companyModel"
          class="h-9 cursor-pointer rounded-lg border border-[#d8dee8] bg-white px-2 text-[11px] font-black text-[#102372] outline-none transition focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/10"
        >
          <option value="all">Todas las empresas</option>
          <option v-for="company in companies" :key="company.id" :value="company.id">
            {{ company.name }}
          </option>
        </select>

        <select
          v-model="moduleModel"
          class="h-9 cursor-pointer rounded-lg border border-[#d8dee8] bg-white px-2 text-[11px] font-black text-[#102372] outline-none transition focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/10"
        >
          <option value="all">Todos los módulos</option>
          <option v-for="module in modules" :key="module.id" :value="module.id">
            {{ module.name }}
          </option>
        </select>

        <div class="grid grid-cols-2 gap-2">
          <select
            v-model="roleModel"
            class="h-9 cursor-pointer rounded-lg border border-[#d8dee8] bg-white px-2 text-[11px] font-black text-[#102372] outline-none transition focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/10"
          >
            <option value="all">Todos los roles</option>
            <option v-for="role in roles" :key="role.id" :value="role.id">
              {{ role.name }}
            </option>
          </select>

          <select
            v-model="statusModel"
            class="h-9 cursor-pointer rounded-lg border border-[#d8dee8] bg-white px-2 text-[11px] font-black text-[#102372] outline-none transition focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/10"
          >
            <option value="all">Todos</option>
            <option value="active">Activos</option>
            <option value="pending">Pendientes</option>
            <option value="inactive">Inactivos</option>
          </select>
        </div>
      </div>

      <button
        type="button"
        class="h-8 rounded-lg border border-[#d8dee8] bg-white text-[10px] font-black text-[#ff6600] transition hover:border-[#ff6600]/50 hover:bg-[#fff7ed]"
        @click="$emit('clear-filters')"
      >
        Limpiar filtros
      </button>
    </div>
  </section>
</template>

<script setup>
import { computed } from "vue"

const props = defineProps({
  searchTerm: {
    type: String,
    default: "",
  },
  selectedRole: {
    type: String,
    default: "all",
  },
  selectedCompany: {
    type: String,
    default: "all",
  },
  selectedStatus: {
    type: String,
    default: "all",
  },
  selectedModule: {
    type: String,
    default: "all",
  },
  roles: {
    type: Array,
    default: () => [],
  },
  companies: {
    type: Array,
    default: () => [],
  },
  modules: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits([
  "update:searchTerm",
  "update:selectedRole",
  "update:selectedCompany",
  "update:selectedStatus",
  "update:selectedModule",
  "clear-filters",
])

const searchModel = computed({
  get: () => props.searchTerm,
  set: (value) => emit("update:searchTerm", value),
})

const roleModel = computed({
  get: () => props.selectedRole,
  set: (value) => emit("update:selectedRole", value),
})

const companyModel = computed({
  get: () => props.selectedCompany,
  set: (value) => emit("update:selectedCompany", value),
})

const statusModel = computed({
  get: () => props.selectedStatus,
  set: (value) => emit("update:selectedStatus", value),
})

const moduleModel = computed({
  get: () => props.selectedModule,
  set: (value) => emit("update:selectedModule", value),
})
</script>
