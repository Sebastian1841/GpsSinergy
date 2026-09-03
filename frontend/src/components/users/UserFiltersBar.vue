<template>
  <section class="shrink-0 rounded-xl border border-[#d8dee8] bg-white p-3 shadow-sm">
    <div class="flex flex-wrap items-center gap-2">
      <!-- BUSCADOR -->
      <label class="relative min-w-[240px] flex-1">
        <svg
          viewBox="0 0 24 24"
          class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="m20 20-4.35-4.35M18 10.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>

        <input
          v-model="searchModel"
          type="search"
          autocomplete="off"
          placeholder="Buscar por nombre, correo, rol o permiso..."
          class="h-10 w-full rounded-lg border border-[#d8dee8] bg-white pl-10 pr-3 text-[11px] font-semibold text-[#172033] outline-none transition placeholder:text-slate-400 focus:border-[#102372] focus:ring-2 focus:ring-[#102372]/10"
        />
      </label>

      <!-- EMPRESA -->
      <select
        v-model="companyModel"
        class="h-10 min-w-[170px] cursor-pointer rounded-lg border border-[#d8dee8] bg-white px-3 text-[10px] font-bold text-[#102372] outline-none transition hover:border-[#b8c2d1] focus:border-[#102372] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        :disabled="companyFilterLocked"
        aria-label="Filtrar por empresa"
      >
        <option value="all">Todas las empresas</option>

        <option v-for="company in companies" :key="company.id" :value="company.id">
          {{ company.name }}
        </option>
      </select>

      <!-- ESTADO -->
      <select
        v-model="statusModel"
        class="h-10 min-w-[140px] cursor-pointer rounded-lg border border-[#d8dee8] bg-white px-3 text-[10px] font-bold text-[#102372] outline-none transition hover:border-[#b8c2d1] focus:border-[#102372]"
        aria-label="Filtrar por estado"
      >
        <option value="all">Todos los estados</option>
        <option value="active">Activos</option>
        <option value="pending">Pendientes</option>
        <option value="inactive">Inactivos</option>
      </select>

      <!-- ROL -->
      <select
        v-model="roleModel"
        class="h-10 min-w-[150px] cursor-pointer rounded-lg border border-[#d8dee8] bg-white px-3 text-[10px] font-bold text-[#102372] outline-none transition hover:border-[#b8c2d1] focus:border-[#102372]"
        aria-label="Filtrar por rol"
      >
        <option value="all">Todos los roles</option>

        <option v-for="role in roles" :key="role.id" :value="role.id">
          {{ role.name }}
        </option>
      </select>

      <!-- MÁS FILTROS -->
      <button
        type="button"
        class="relative flex h-10 shrink-0 items-center gap-2 rounded-lg border px-3 text-[10px] font-black transition"
        :class="
          showMoreFilters || selectedModule !== 'all'
            ? 'border-[#102372] bg-[#eef3ff] text-[#102372]'
            : 'border-[#d8dee8] bg-white text-slate-600 hover:border-[#102372] hover:text-[#102372]'
        "
        @click="showMoreFilters = !showMoreFilters"
      >
        Más filtros

        <span
          v-if="selectedModule !== 'all'"
          class="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF6600] px-1 text-[8px] font-black text-white"
        >
          1
        </span>

        <svg
          viewBox="0 0 20 20"
          class="h-3.5 w-3.5 transition-transform"
          :class="{ 'rotate-180': showMoreFilters }"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="m6 8 4 4 4-4"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>

      <!-- LIMPIAR -->
      <button
        v-if="hasActiveFilters"
        type="button"
        class="h-10 shrink-0 px-2 text-[10px] font-black text-slate-500 transition hover:text-[#FF6600]"
        @click="$emit('clear-filters')"
      >
        Limpiar
      </button>
    </div>

    <!-- FILTROS SECUNDARIOS -->
    <div v-if="showMoreFilters" class="mt-3 flex items-center gap-3 border-t border-[#edf1f5] pt-3">
      <div class="min-w-[200px]">
        <p class="mb-1.5 text-[9px] font-black uppercase tracking-[0.06em] text-slate-400">
          Módulo
        </p>

        <select
          v-model="moduleModel"
          class="h-9 w-full cursor-pointer rounded-lg border border-[#d8dee8] bg-white px-3 text-[10px] font-bold text-[#102372] outline-none transition focus:border-[#102372]"
        >
          <option value="all">Todos los módulos</option>

          <option v-for="module in modules" :key="module.id" :value="module.id">
            {{ module.name }}
          </option>
        </select>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from "vue"

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
  companyFilterLocked: {
    type: Boolean,
    default: false,
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

const showMoreFilters = ref(false)

const createModel = (propName, eventName) => {
  return computed({
    get: () => props[propName],
    set: (value) => emit(eventName, value),
  })
}

const searchModel = createModel("searchTerm", "update:searchTerm")

const roleModel = createModel("selectedRole", "update:selectedRole")

const companyModel = createModel("selectedCompany", "update:selectedCompany")

const statusModel = createModel("selectedStatus", "update:selectedStatus")

const moduleModel = createModel("selectedModule", "update:selectedModule")

const hasActiveFilters = computed(() => {
  return (
    props.searchTerm.trim() ||
    props.selectedRole !== "all" ||
    props.selectedCompany !== "all" ||
    props.selectedStatus !== "all" ||
    props.selectedModule !== "all"
  )
})
</script>
