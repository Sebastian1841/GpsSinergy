<template>
  <section
    class="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#d8dee8] bg-white shadow-sm"
  >
    <!-- CABECERA -->
    <header
      class="flex shrink-0 flex-col gap-3 border-b border-[#edf1f5] px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <h2 class="text-[15px] font-black text-[#102372]">
          {{ totalUsersLabel }}
        </h2>

        <p class="mt-0.5 text-[11px] font-semibold text-slate-400">
          {{ resultsLabel }}
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <span class="text-[9px] font-black uppercase tracking-[0.08em] text-slate-400">
          Ordenar por
        </span>

        <select
          :value="sortKey"
          class="h-8 min-w-[132px] cursor-pointer rounded-lg border border-[#d8dee8] bg-white px-2.5 text-[10px] font-bold text-[#102372] outline-none transition focus:border-[#102372]"
          @change="$emit('update:sort-key', $event.target.value)"
        >
          <option value="name">Nombre</option>
          <option value="role">Rol</option>
          <option value="company">Empresa</option>
          <option value="accesses">Accesos</option>
          <option value="status">Estado</option>
        </select>

        <button
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d8dee8] bg-white text-[#102372] transition hover:bg-[#f6f8fb]"
          :aria-label="sortDirection === 'asc' ? 'Orden descendente' : 'Orden ascendente'"
          :title="sortDirection === 'asc' ? 'Orden descendente' : 'Orden ascendente'"
          @click="$emit('update:sort-direction', sortDirection === 'asc' ? 'desc' : 'asc')"
        >
          <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" aria-hidden="true">
            <path
              v-if="sortDirection === 'asc'"
              d="M8 18V5m0 0L4.5 8.5M8 5l3.5 3.5M16 6h4M16 11h3M16 16h2"
              stroke="currentColor"
              stroke-width="1.9"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              v-else
              d="M8 6v13m0 0-3.5-3.5M8 19l3.5-3.5M16 6h2M16 11h3M16 16h4"
              stroke="currentColor"
              stroke-width="1.9"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>

        <div class="flex overflow-hidden rounded-lg border border-[#d8dee8] bg-white">
          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center transition"
            :class="
              viewMode === 'list'
                ? 'bg-[#102372] text-white'
                : 'text-slate-400 hover:bg-[#f6f8fb] hover:text-[#102372]'
            "
            aria-label="Vista lista"
            title="Vista lista"
            @click="$emit('update:view-mode', 'list')"
          >
            <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" aria-hidden="true">
              <path
                d="M4 6h16M4 12h16M4 18h16"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          </button>

          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center border-l border-[#d8dee8] transition"
            :class="
              viewMode === 'cards'
                ? 'bg-[#102372] text-white'
                : 'text-slate-400 hover:bg-[#f6f8fb] hover:text-[#102372]'
            "
            aria-label="Vista cards"
            title="Vista cards"
            @click="$emit('update:view-mode', 'cards')"
          >
            <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" aria-hidden="true">
              <path
                d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>

    <!-- CABECERA TABLA -->
    <div
      v-if="userRows.length && viewMode === 'list'"
      class="hidden h-11 shrink-0 grid-cols-[minmax(320px,1.6fr)_minmax(170px,0.8fr)_130px_130px_24px] items-center gap-5 border-b border-[#edf1f5] bg-[#fafbfc] px-5 lg:grid"
    >
      <span class="table-header">Usuario</span>

      <span class="table-header">Rol</span>

      <span class="table-header">Accesos</span>

      <span class="table-header">Estado</span>

      <span></span>
    </div>

    <!-- USUARIOS -->
    <div class="min-h-0 flex-1 overflow-auto">
      <section
        v-if="userRows.length && viewMode === 'list'"
        class="border-b border-[#edf1f5] last:border-b-0"
      >
        <button
          v-for="row in userRows"
          :key="row.key"
          type="button"
          class="group relative grid w-full cursor-pointer grid-cols-[42px_minmax(0,1fr)_24px] items-center gap-3 border-b border-[#edf1f5] px-5 py-3 text-left transition last:border-b-0 hover:bg-[#fafbfc] lg:min-h-[70px] lg:grid-cols-[minmax(320px,1.6fr)_minmax(170px,0.8fr)_130px_130px_24px] lg:gap-5 lg:py-2"
          :class="isSelectedUser(row.user.id) ? 'bg-[#f7f9ff]' : 'bg-white'"
          @click="$emit('select-user', row.user.id)"
        >
          <!-- SELECCION -->
          <span
            v-if="isSelectedUser(row.user.id)"
            class="absolute inset-y-0 left-0 w-[3px] bg-[#102372]"
          ></span>

          <!-- USUARIO DESKTOP -->
          <span class="hidden min-w-0 items-center gap-3 lg:flex">
            <span
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[11px] font-black text-white"
              :class="getAvatarClass(row.user.status)"
            >
              {{ getUserInitials(row.user.name) }}
            </span>

            <span class="min-w-0">
              <span class="block truncate text-[13px] font-black text-[#172033]">
                {{ row.user.name }}
              </span>

              <span class="mt-0.5 block truncate text-[11px] font-semibold text-slate-400">
                {{ row.user.email }}
              </span>
            </span>
          </span>

          <!-- USUARIO MOBILE -->
          <span
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[11px] font-black text-white lg:hidden"
            :class="getAvatarClass(row.user.status)"
          >
            {{ getUserInitials(row.user.name) }}
          </span>

          <span class="min-w-0 lg:hidden">
            <span class="flex min-w-0 items-center gap-2">
              <span class="truncate text-[13px] font-black text-[#172033]">
                {{ row.user.name }}
              </span>

              <span
                class="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-black"
                :class="getStatusClass(row.user.status)"
              >
                {{ getStatusLabel(row.user.status) }}
              </span>
            </span>

            <span class="mt-0.5 block truncate text-[11px] font-semibold text-slate-400">
              {{ row.user.email }}
            </span>

            <span class="mt-1 block truncate text-[11px] font-semibold text-slate-500">
              {{ getPrimaryRoleLabel(row) }}
              -
              {{ getAccessLabel(row) }}
            </span>
          </span>

          <!-- ROL -->
          <span class="hidden truncate text-[12px] font-semibold text-[#334155] lg:block">
            {{ getPrimaryRoleLabel(row) }}
          </span>

          <!-- ACCESOS -->
          <span class="hidden text-[12px] font-semibold text-[#334155] lg:block">
            {{ getAccessLabel(row) }}
          </span>

          <!-- ESTADO -->
          <span class="hidden lg:block">
            <span
              class="inline-flex rounded-md px-2.5 py-1 text-[10px] font-black"
              :class="getStatusClass(row.user.status)"
            >
              {{ getStatusLabel(row.user.status) }}
            </span>
          </span>

          <!-- ABRIR -->
          <span
            class="flex items-center justify-end text-[20px] font-light text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#102372]"
          >
            &gt;
          </span>
        </button>
      </section>

      <section
        v-else-if="userRows.length && viewMode === 'cards'"
        class="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3"
      >
        <button
          v-for="row in userRows"
          :key="row.key"
          type="button"
          class="group relative flex min-h-[178px] flex-col rounded-xl border bg-white p-4 text-left transition hover:border-[#102372]/25 hover:bg-[#fbfcff]"
          :class="
            isSelectedUser(row.user.id)
              ? 'border-[#102372]/35 ring-2 ring-[#102372]/10'
              : 'border-[#e3e9f2]'
          "
          @click="$emit('select-user', row.user.id)"
        >
          <div class="flex min-w-0 items-start justify-between gap-3">
            <span class="flex min-w-0 items-center gap-3">
              <span
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[12px] font-black text-white"
                :class="getAvatarClass(row.user.status)"
              >
                {{ getUserInitials(row.user.name) }}
              </span>

              <span class="min-w-0">
                <span class="block truncate text-[14px] font-black text-[#172033]">
                  {{ row.user.name }}
                </span>

                <span class="mt-0.5 block truncate text-[11px] font-semibold text-slate-400">
                  {{ row.user.email }}
                </span>
              </span>
            </span>

            <span
              class="shrink-0 rounded-md px-2 py-1 text-[10px] font-black"
              :class="getStatusClass(row.user.status)"
            >
              {{ getStatusLabel(row.user.status) }}
            </span>
          </div>

          <dl class="mt-4 grid gap-2 border-t border-[#edf1f5] pt-3">
            <div class="flex items-center justify-between gap-3">
              <dt class="text-[10px] font-black uppercase tracking-[0.06em] text-slate-400">Rol</dt>
              <dd class="min-w-0 truncate text-[12px] font-black text-[#102372]">
                {{ getPrimaryRoleLabel(row) }}
              </dd>
            </div>

            <div class="flex items-center justify-between gap-3">
              <dt class="text-[10px] font-black uppercase tracking-[0.06em] text-slate-400">
                Accesos
              </dt>
              <dd class="text-[12px] font-black text-[#102372]">
                {{ getAccessLabel(row) }}
              </dd>
            </div>

            <div class="flex items-center justify-between gap-3">
              <dt class="text-[10px] font-black uppercase tracking-[0.06em] text-slate-400">
                Empresa
              </dt>
              <dd class="min-w-0 truncate text-[12px] font-black text-[#102372]">
                {{ getCompanySummaryLabel(row) }}
              </dd>
            </div>
          </dl>

          <span
            class="mt-auto flex items-center justify-end gap-1 pt-4 text-[11px] font-black text-[#102372]"
          >
            Ver detalle
            <svg
              viewBox="0 0 24 24"
              class="h-3.5 w-3.5 transition group-hover:translate-x-0.5"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="m9 6 6 6-6 6"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </span>
        </button>
      </section>

      <!-- VACIO -->
      <div
        v-if="!userRows.length"
        class="flex min-h-[260px] flex-col items-center justify-center p-6 text-center"
      >
        <p class="text-[13px] font-black text-[#102372]">No encontramos usuarios</p>

        <p class="mt-1 text-[11px] font-semibold text-slate-500">
          Prueba cambiando o limpiando los filtros.
        </p>

        <button
          type="button"
          class="mt-4 h-9 rounded-lg border border-[#d8dee8] bg-white px-4 text-[11px] font-black text-[#102372] transition hover:border-[#ff6600] hover:text-[#ff6600]"
          @click="$emit('clear-filters')"
        >
          Limpiar filtros
        </button>
      </div>
    </div>

    <!-- PIE -->
    <footer
      v-if="totalUsers"
      class="flex shrink-0 flex-col gap-3 border-t border-[#edf1f5] bg-[#fafbfc] px-5 py-2.5 sm:flex-row sm:items-center sm:justify-between"
    >
      <p class="text-[10px] font-semibold text-slate-400">
        Mostrando
        <span class="font-black text-slate-600">{{ paginationFrom }}-{{ paginationTo }}</span>
        de
        <span class="font-black text-slate-600">{{ totalUsers }}</span>
        usuarios
      </p>

      <div class="flex items-center gap-1">
        <button
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d8dee8] text-slate-400 transition hover:text-[#102372] disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="currentPage <= 1"
          aria-label="Pagina anterior"
          title="Pagina anterior"
          @click="$emit('previous-page')"
        >
          <svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" aria-hidden="true">
            <path
              d="m14 7-5 5 5 5"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>

        <button
          v-for="page in visiblePages"
          :key="page"
          type="button"
          class="flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-[10px] font-black transition"
          :class="
            currentPage === page
              ? 'bg-[#102372] text-white'
              : 'border border-[#d8dee8] bg-white text-slate-500 hover:text-[#102372]'
          "
          @click="$emit('go-to-page', page)"
        >
          {{ page }}
        </button>

        <button
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d8dee8] text-slate-400 transition hover:text-[#102372] disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="currentPage >= totalPages"
          aria-label="Pagina siguiente"
          title="Pagina siguiente"
          @click="$emit('next-page')"
        >
          <svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" aria-hidden="true">
            <path
              d="m10 7 5 5-5 5"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>
    </footer>
  </section>
</template>

<script setup>
import { computed } from "vue"

import {
  getAvatarClass,
  getStatusLabel,
  getUserInitials,
} from "../../utils/users/userAccessUtils.js"

const props = defineProps({
  users: {
    type: Array,
    default: () => [],
  },
  totalUsers: {
    type: Number,
    default: 0,
  },
  accesses: {
    type: Array,
    default: () => [],
  },
  applications: {
    type: Array,
    default: () => [],
  },
  companies: {
    type: Array,
    default: () => [],
  },
  roles: {
    type: Array,
    default: () => [],
  },
  selectedCompany: {
    type: String,
    default: "all",
  },
  selectedUserId: {
    type: [String, Number],
    default: null,
  },
  sortKey: {
    type: String,
    default: "name",
  },
  sortDirection: {
    type: String,
    default: "asc",
  },
  viewMode: {
    type: String,
    default: "list",
    validator: (value) => ["list", "cards"].includes(value),
  },
  currentPage: {
    type: Number,
    default: 1,
  },
  totalPages: {
    type: Number,
    default: 1,
  },
  pageSize: {
    type: Number,
    default: 8,
  },
})

defineEmits([
  "select-user",
  "clear-filters",
  "update:sort-key",
  "update:sort-direction",
  "update:view-mode",
  "previous-page",
  "next-page",
  "go-to-page",
])

const totalUsersLabel = computed(() => {
  const total = props.totalUsers

  return `${total} ${total === 1 ? "usuario" : "usuarios"}`
})

const resultsLabel = computed(() => {
  if (!props.totalUsers) {
    return "Sin resultados para los filtros aplicados"
  }

  return "Listado de usuarios disponibles en el sistema"
})

const totalUsers = computed(() => props.totalUsers)

const paginationFrom = computed(() => {
  if (!props.totalUsers) return 0

  return (props.currentPage - 1) * props.pageSize + 1
})

const paginationTo = computed(() => {
  return Math.min(props.currentPage * props.pageSize, props.totalUsers)
})

const visiblePages = computed(() => {
  if (props.totalPages <= 5) {
    return Array.from({ length: props.totalPages }, (_, index) => index + 1)
  }

  const start = Math.min(Math.max(props.currentPage - 2, 1), props.totalPages - 4)

  return Array.from({ length: 5 }, (_, index) => start + index)
})

const rolesById = computed(() => {
  return new Map(props.roles.map((role) => [String(role.id), role]))
})

const applicationsById = computed(() => {
  return new Map(props.applications.map((application) => [String(application.id), application]))
})

const companiesById = computed(() => {
  return new Map(props.companies.map((company) => [String(company.id), company]))
})

const accessesByUserId = computed(() => {
  const index = new Map()

  props.accesses.forEach((access) => {
    const userId = String(access.userId)

    if (!index.has(userId)) {
      index.set(userId, [])
    }

    index.get(userId).push(access)
  })

  return index
})

const isSelectedUser = (userId) => {
  return String(props.selectedUserId ?? "") === String(userId)
}

const getUserAccesses = (user) => {
  return accessesByUserId.value.get(String(user.id)) || []
}

const getAccessCompany = (access = {}) => {
  const application = applicationsById.value.get(String(access.applicationId))
  const companyId = String(application?.companyId || access.companyId || "")

  return (
    companiesById.value.get(companyId) || {
      id: companyId || "sin-empresa",
      name: companyId ? `Empresa ${companyId}` : "Sin empresa",
    }
  )
}

const getCompanySummaryLabel = (row) => {
  if (row.companyId !== "all") {
    return row.companyLabel || "Empresa"
  }

  const companyNames = new Set(
    row.accesses
      .map((access) => getAccessCompany(access).name)
      .filter((companyName) => companyName && companyName !== "Sin empresa"),
  )

  if (companyNames.size === 0) return "Sin empresa"
  if (companyNames.size === 1) return [...companyNames][0]

  return `${companyNames.size} empresas`
}

const buildRowsForUser = (user) => {
  const userAccesses = getUserAccesses(user)

  if (props.selectedCompany !== "all") {
    return [
      {
        key: String(user.id),
        user,
        accesses: userAccesses.filter((access) => {
          return String(getAccessCompany(access).id) === String(props.selectedCompany)
        }),
        companyId: props.selectedCompany,
        companyLabel: companiesById.value.get(String(props.selectedCompany))?.name || "Empresa",
      },
    ]
  }

  return [
    {
      key: String(user.id),
      user,
      accesses: userAccesses,
      companyId: "all",
      companyLabel: "Todas las empresas",
    },
  ]
}

const userRows = computed(() => {
  return props.users.flatMap(buildRowsForUser)
})

const getAccessLabel = (row) => {
  const count = row.accesses.length

  return `${count} ${count === 1 ? "acceso" : "accesos"}`
}

const getPrimaryRoleLabel = (row) => {
  const primaryAccess = row.accesses[0]

  if (!primaryAccess?.role) {
    return "Sin rol"
  }

  return rolesById.value.get(String(primaryAccess.role))?.name || "Sin rol"
}

const getStatusClass = (status) => {
  if (status === "active") {
    return "bg-emerald-50 text-emerald-700"
  }

  if (status === "pending") {
    return "bg-[#fff7ed] text-[#ff6600]"
  }

  return "bg-slate-100 text-slate-500"
}
</script>

<style scoped>
.table-header {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #94a3b8;
}
</style>
