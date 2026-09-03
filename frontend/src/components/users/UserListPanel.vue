<template>
  <section
    class="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#d8dee8] bg-white shadow-sm"
  >
    <!-- CABECERA -->
    <header
      class="flex shrink-0 items-center justify-between gap-4 border-b border-[#edf1f5] px-5 py-4"
    >
      <div>
        <h2 class="text-[15px] font-black text-[#102372]">
          {{ totalUsersLabel }}
        </h2>

        <p class="mt-0.5 text-[11px] font-semibold text-slate-400">
          {{ resultsLabel }}
        </p>
      </div>
    </header>

    <!-- CABECERA TABLA -->
    <div
      v-if="userRows.length"
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
      <section class="border-b border-[#edf1f5] last:border-b-0">
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

      <!-- MOSTRAR MAS -->
      <div v-if="canShowMore" class="border-t border-[#edf1f5] px-5 py-3">
        <button
          type="button"
          class="mx-auto flex h-9 min-w-[180px] items-center justify-center rounded-lg border border-[#d8dee8] bg-white px-4 text-[11px] font-black text-[#102372] transition hover:border-[#102372]"
          @click="$emit('show-more')"
        >
          Mostrar {{ visibleUsersRemaining }} mas
        </button>
      </div>

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
      v-if="userRows.length"
      class="flex shrink-0 items-center border-t border-[#edf1f5] bg-[#fafbfc] px-5 py-2.5"
    >
      <p class="text-[10px] font-semibold text-slate-400">
        {{ footerLabel }}
      </p>
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
  visibleUsersRemaining: {
    type: Number,
    default: 0,
  },
  canShowMore: {
    type: Boolean,
    default: false,
  },
})

defineEmits(["select-user", "clear-filters", "show-more"])

const totalUsers = computed(() => {
  return props.users.length + props.visibleUsersRemaining
})

const totalUsersLabel = computed(() => {
  const total = totalUsers.value

  return `${total} ${total === 1 ? "usuario" : "usuarios"}`
})

const resultsLabel = computed(() => {
  if (!props.canShowMore) {
    return "Mostrando todos los resultados"
  }

  return `Mostrando ${props.users.length} de ${totalUsers.value}`
})

const footerLabel = computed(() => {
  if (!props.canShowMore) {
    return `Mostrando ${props.users.length} de ${props.users.length} usuarios`
  }

  return `Mostrando ${props.users.length} de ${totalUsers.value} usuarios`
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
