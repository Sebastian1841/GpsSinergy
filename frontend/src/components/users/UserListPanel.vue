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
          :value="`${sortKey}:${sortDirection}`"
          class="h-8 min-w-[150px] cursor-pointer rounded-lg border border-[#d8dee8] bg-white px-2.5 text-[10px] font-bold text-[#102372] outline-none transition focus:border-[#102372]"
          @change="handleSortSelection($event.target.value)"
        >
          <option value="name:asc">Nombre (A-Z)</option>
          <option value="name:desc">Nombre (Z-A)</option>
          <option value="role:asc">Rol (A-Z)</option>
          <option value="company:asc">Empresa (A-Z)</option>
          <option value="accesses:desc">Mas accesos</option>
          <option value="accesses:asc">Menos accesos</option>
          <option value="status:asc">Estado</option>
        </select>

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

    <!-- USUARIOS -->
    <div class="min-h-0 flex-1 overflow-auto">
      <section
        v-if="userRows.length && viewMode === 'list'"
        class="min-w-[1120px] border-b border-[#edf1f5] last:border-b-0"
      >
        <div
          class="grid h-11 grid-cols-[minmax(270px,1.35fr)_minmax(145px,0.7fr)_minmax(220px,1fr)_minmax(135px,0.65fr)_minmax(170px,0.8fr)_130px_100px] items-center gap-4 border-b border-[#edf1f5] bg-[#fafbfc] px-5"
        >
          <span class="table-header">Usuario</span>
          <span class="table-header">Rol</span>
          <span class="table-header">Empresa</span>
          <span class="table-header">Accesos</span>
          <span class="table-header">Ultimo acceso</span>
          <span class="table-header">Estado</span>
          <span class="table-header text-right">Acciones</span>
        </div>

        <div
          v-for="row in userRows"
          :key="row.key"
          class="group relative grid min-h-[72px] grid-cols-[minmax(270px,1.35fr)_minmax(145px,0.7fr)_minmax(220px,1fr)_minmax(135px,0.65fr)_minmax(170px,0.8fr)_130px_100px] items-center gap-4 border-b border-[#edf1f5] px-5 text-left transition last:border-b-0 hover:bg-[#fafbfc]"
          :class="isSelectedUser(row.user.id) ? 'bg-[#f7f9ff]' : 'bg-white'"
        >
          <span
            v-if="isSelectedUser(row.user.id)"
            class="absolute inset-y-0 left-0 w-[3px] bg-[#102372]"
          ></span>

          <span class="flex min-w-0 items-center gap-3">
            <span
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[12px] font-black text-white"
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

          <span
            class="w-fit max-w-full truncate rounded-md bg-[#eef3ff] px-2.5 py-1 text-[11px] font-black text-[#1751c0]"
          >
            {{ getPrimaryRoleLabel(row) }}
          </span>

          <span class="flex min-w-0 items-center gap-2 text-[12px] text-[#263f76]">
            <SvgIcon name="empresas" class="h-5 w-5 shrink-0 text-[#102372]" />
            <span class="min-w-0">
              <strong class="block truncate font-black">{{ getCompanySummaryLabel(row) }}</strong>
              <small
                v-if="row.companyId === 'all'"
                class="mt-0.5 block truncate text-[10px] text-slate-400"
              >
                {{ getCompanySummaryLabel(row) }}
              </small>
            </span>
          </span>

          <span class="flex items-center gap-2 text-[12px] font-semibold text-[#263f76]">
            <SvgIcon name="llave" class="h-5 w-5 shrink-0 text-[#102372]" />
            {{ getAccessLabel(row) }}
          </span>

          <span class="flex min-w-0 items-center gap-2 text-[12px] font-semibold text-[#52698f]">
            <svg
              viewBox="0 0 24 24"
              class="h-5 w-5 shrink-0 text-[#102372]"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" />
              <path
                d="M12 7v5l3 2"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <span class="truncate">{{ getLastAccessLabel(row.user) }}</span>
          </span>

          <span>
            <span
              class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-black"
              :class="getStatusClass(row.user.status)"
            >
              <span class="h-2 w-2 rounded-full bg-current" />
              {{ getStatusLabel(row.user.status) }}
            </span>
          </span>

          <span class="flex items-center justify-end gap-2">
            <button
              v-if="canEditUsers"
              type="button"
              class="grid h-9 w-9 cursor-pointer place-items-center rounded-md border border-[#d8dee8] bg-white text-[#102372] transition hover:bg-[#eef3ff]"
              aria-label="Editar usuario"
              title="Editar usuario"
              @click="$emit('edit-user', row.user.id)"
            >
              <SvgIcon name="pencil" class="h-4 w-4" />
            </button>
            <button
              type="button"
              class="grid h-9 w-9 cursor-pointer place-items-center rounded-md border border-[#d8dee8] bg-white text-[#102372] transition hover:bg-[#eef3ff]"
              aria-label="Ver detalle"
              title="Ver detalle"
              @click="$emit('select-user', row.user.id)"
            >
              <span class="text-lg font-black leading-none">⋮</span>
            </button>
          </span>
        </div>
      </section>

      <section
        v-else-if="userRows.length && viewMode === 'cards'"
        class="grid content-start gap-4 p-4 md:grid-cols-2 xl:grid-cols-3"
      >
        <article
          v-for="row in userRows"
          :key="row.key"
          class="relative flex min-h-[214px] flex-col rounded-lg border bg-white p-4 text-left transition hover:border-[#102372]/25 hover:shadow-sm"
          :class="
            isSelectedUser(row.user.id)
              ? 'border-[#102372]/35 ring-2 ring-[#102372]/10'
              : 'border-[#e3e9f2]'
          "
        >
          <div class="flex min-w-0 items-start justify-between gap-3">
            <span class="flex min-w-0 items-center gap-3">
              <span
                class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[13px] font-black text-white"
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

                <span
                  class="mt-2 inline-flex rounded bg-[#eef3ff] px-2 py-1 text-[9px] font-black text-[#102372]"
                >
                  {{ getPrimaryRoleLabel(row) }}
                </span>
              </span>
            </span>

            <span
              class="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-[9px] font-black"
              :class="getStatusClass(row.user.status)"
            >
              <span class="h-2 w-2 rounded-full bg-current" />
              {{ getStatusLabel(row.user.status) }}
            </span>
          </div>

          <dl class="mt-4 grid grid-cols-2 border-t border-[#edf1f5] pt-3">
            <div class="flex min-w-0 items-start gap-2 border-r border-[#edf1f5] pr-3">
              <SvgIcon name="empresas" class="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
              <div class="min-w-0">
                <dt class="text-[9px] font-black uppercase tracking-[0.06em] text-slate-400">
                  Empresa
                </dt>
                <dd class="mt-1 truncate text-[11px] font-black text-[#172033]">
                  {{ getCompanySummaryLabel(row) }}
                </dd>
              </div>
            </div>

            <div class="flex min-w-0 items-start gap-2 pl-4">
              <SvgIcon name="llave" class="mt-0.5 h-5 w-5 shrink-0 text-[#102372]" />
              <div class="min-w-0">
                <dt class="text-[9px] font-black uppercase tracking-[0.06em] text-slate-400">
                  Accesos
                </dt>
                <dd class="mt-1 truncate text-[11px] font-black text-[#172033]">
                  {{ getAccessLabel(row) }}
                </dd>
              </div>
            </div>
          </dl>

          <div
            class="mt-auto grid gap-2 pt-4"
            :class="canEditUsers ? 'grid-cols-2' : 'grid-cols-1'"
          >
            <button
              v-if="canEditUsers"
              type="button"
              class="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-[#d8dee8] bg-white px-3 text-[10px] font-black text-[#102372] transition hover:bg-[#f7f9fc]"
              @click="$emit('select-user', row.user.id)"
            >
              <SvgIcon name="eye" class="h-4 w-4" />
              Ver detalle
            </button>
            <button
              type="button"
              class="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md bg-[#183568] px-3 text-[10px] font-black text-white transition hover:bg-[#102372]"
              @click="$emit('edit-user', row.user.id)"
            >
              <SvgIcon name="pencil" class="h-4 w-4" />
              Editar
            </button>
          </div>
        </article>
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

      <div class="flex flex-wrap items-center justify-end gap-2">
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

        <label class="ml-2 flex items-center gap-2 text-[10px] font-semibold text-slate-500">
          Mostrar
          <select
            :value="pageSize"
            class="h-8 cursor-pointer rounded-lg border border-[#d8dee8] bg-white px-2 text-[10px] font-black text-[#102372] outline-none focus:border-[#102372]"
            aria-label="Usuarios por pagina"
            @change="$emit('update:page-size', Number($event.target.value))"
          >
            <option :value="5">5</option>
            <option :value="10">10</option>
            <option :value="20">20</option>
          </select>
          por pagina
        </label>
      </div>
    </footer>
  </section>
</template>

<script setup>
import { computed } from "vue"
import SvgIcon from "../icons/SvgIcon.vue"

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
    default: 10,
  },
  canEditUsers: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  "select-user",
  "edit-user",
  "clear-filters",
  "update:sort-key",
  "update:sort-direction",
  "update:view-mode",
  "previous-page",
  "next-page",
  "go-to-page",
  "update:page-size",
])

const handleSortSelection = (selection) => {
  const [nextSortKey, nextSortDirection = "asc"] = String(selection).split(":")

  emit("update:sort-key", nextSortKey)
  emit("update:sort-direction", nextSortDirection)
}

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

const getLastAccessLabel = (user) => {
  const value = String(user?.lastAccess || "").trim()

  return value && value !== "-" ? value : "Sin acceso aun"
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
