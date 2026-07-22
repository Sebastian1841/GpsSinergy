<template>
  <section
    class="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-[#d8dee8] bg-white"
  >
    <header class="shrink-0 border-b border-[#d8dee8] bg-white px-3 py-3">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <div class="flex min-w-0 items-center gap-2">
            <h3 class="truncate text-[13px] font-black text-[#102372]">Grupos</h3>
            <span
              class="shrink-0 rounded-md px-2 py-0.5 text-[8px] font-black uppercase tracking-wide"
              :class="
                company.sucursalesHabilitadas
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-slate-100 text-slate-500'
              "
            >
              {{ company.sucursalesHabilitadas ? "Activo" : "Pausado" }}
            </span>
          </div>

          <p class="mt-0.5 truncate text-[10px] font-semibold text-slate-500">
            {{ cantidadSucursalesActivas }} habilitados de {{ sucursales.length }} registrados
          </p>
        </div>

        <button
          type="button"
          role="switch"
          class="flex h-8 w-14 shrink-0 items-center rounded-full p-1 transition disabled:cursor-not-allowed disabled:opacity-50"
          :class="company.sucursalesHabilitadas ? 'bg-[#FF6600]' : 'bg-slate-300'"
          :aria-checked="company.sucursalesHabilitadas"
          aria-label="Activar grupos"
          :disabled="!canManage"
          @click="$emit('alternar-sucursales-habilitadas')"
        >
          <span
            class="h-6 w-6 rounded-full bg-white shadow-sm transition"
            :class="company.sucursalesHabilitadas ? 'translate-x-6' : 'translate-x-0'"
          ></span>
        </button>
      </div>

      <label v-if="showCompanySelector" class="mt-3 block">
        <span class="mb-1 block text-[9px] font-black uppercase tracking-[0.08em] text-slate-400">
          Empresa
        </span>
        <select
          :value="selectedCompanyId"
          class="h-9 w-full cursor-pointer rounded-lg border border-[#d8dee8] bg-[#f8fafc] px-2 text-[11px] font-black text-[#102372] outline-none focus:border-[#FF6600]"
          @change="$emit('select-company', $event.target.value)"
        >
          <option v-for="item in companies" :key="item.id" :value="item.id">
            {{ item.name }}
          </option>
        </select>
      </label>
    </header>

    <main class="min-h-0 flex-1 overflow-auto bg-[#f6f8fb] p-3">
      <div class="grid gap-3">
        <section class="grid gap-2 sm:grid-cols-3">
          <div
            v-for="stat in statCards"
            :key="stat.label"
            class="rounded-lg border border-[#d8dee8] bg-white px-3 py-2.5"
          >
            <p class="text-[8px] font-black uppercase tracking-[0.08em] text-[#FF6600]">
              {{ stat.label }}
            </p>
            <p class="mt-1 text-[18px] font-black text-[#102372]">
              {{ stat.value }}
            </p>
            <p class="mt-0.5 truncate text-[9px] font-bold text-[#102372]/45">
              {{ stat.detail }}
            </p>
          </div>
        </section>

        <section
          class="overflow-hidden rounded-lg border border-[#d8dee8] bg-white"
          :class="company.sucursalesHabilitadas ? '' : 'opacity-55'"
        >
          <header class="grid gap-2 border-b border-[#d8dee8] bg-white p-2">
            <div class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_142px]">
              <div class="relative min-w-0">
                <span
                  class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#102372]/40"
                >
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
                  v-model="busquedaSucursal"
                  type="text"
                  placeholder="Buscar grupo"
                  class="h-9 w-full rounded-lg border border-[#d8dee8] bg-[#f8fafc] pl-9 pr-3 text-[11px] font-semibold text-[#102372] outline-none placeholder:text-[#102372]/40 focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10"
                  :disabled="!company.sucursalesHabilitadas"
                />
              </div>

              <select
                v-model="filtroEstadoSucursal"
                class="h-9 min-w-0 cursor-pointer rounded-lg border border-[#d8dee8] bg-[#f8fafc] px-2 text-[10px] font-black text-[#102372] outline-none focus:border-[#FF6600]"
                :disabled="!company.sucursalesHabilitadas"
              >
                <option value="all">Todos</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
            </div>

            <form
              class="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2"
              @submit.prevent="handleAgregarSucursal"
            >
              <div class="min-w-0">
                <input
                  v-model="nombreSucursal"
                  type="text"
                  placeholder="Nombre del nuevo grupo"
                  class="h-9 w-full min-w-0 rounded-lg border border-[#d8dee8] bg-[#f8fafc] px-2 text-[11px] font-semibold text-[#102372] outline-none transition placeholder:text-[#102372]/40 focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10"
                  :disabled="!canManage || !company.sucursalesHabilitadas"
                />

                <p
                  v-if="nombreSucursalError"
                  class="mt-1 truncate text-[9px] font-black text-[#FF6600]"
                >
                  {{ nombreSucursalError }}
                </p>
              </div>

              <button
                type="submit"
                class="h-9 rounded-lg bg-[#FF6600] px-3 text-[10px] font-black text-white transition hover:bg-[#e65c00] disabled:cursor-not-allowed disabled:opacity-40"
                :disabled="!canAddSucursal"
              >
                Agregar
              </button>
            </form>
          </header>

          <div class="grid max-h-[420px] gap-2 overflow-auto bg-[#f6f8fb] p-2">
            <article
              v-for="sucursal in sucursalesFiltradas"
              :key="sucursal.id"
              class="grid gap-2 rounded-lg border border-[#d8dee8] bg-white p-2 transition hover:border-[#b7c2d1] lg:grid-cols-[minmax(0,1fr)_100px_40px] lg:items-center"
            >
              <div class="min-w-0">
                <div class="flex min-w-0 items-center gap-2">
                  <span
                    class="h-2.5 w-2.5 shrink-0 rounded-full"
                    :class="sucursal.active !== false ? 'bg-emerald-500' : 'bg-slate-300'"
                  ></span>

                  <input
                    :value="sucursal.name"
                    type="text"
                    class="h-9 w-full min-w-0 rounded-lg border border-[#d8dee8] bg-[#f8fafc] px-2 text-[11px] font-black text-[#102372] outline-none transition focus:border-[#FF6600] focus:bg-white focus:ring-2 focus:ring-[#FF6600]/10"
                    aria-label="Nombre de grupo"
                    :disabled="!canManage || !company.sucursalesHabilitadas"
                    @change="handleActualizarNombreSucursal(sucursal.id, $event.target.value)"
                  />
                </div>
              </div>

              <button
                type="button"
                role="switch"
                class="flex h-9 items-center justify-between gap-2 rounded-lg border px-2 text-[9px] font-black transition"
                :class="
                  sucursal.active !== false
                    ? 'border-[#FF6600] bg-[#fff3eb] text-[#FF6600]'
                    : 'border-[#d8dee8] bg-white text-[#102372]'
                "
                :aria-checked="sucursal.active !== false"
                :disabled="!canManage || !company.sucursalesHabilitadas"
                @click="$emit('alternar-estado-sucursal', sucursal.id)"
              >
                <span>{{ sucursal.active !== false ? "Activo" : "Inactivo" }}</span>
                <span
                  class="h-2 w-2 rounded-full"
                  :class="sucursal.active !== false ? 'bg-[#FF6600]' : 'bg-[#102372]'"
                ></span>
              </button>

              <button
                type="button"
                class="h-9 w-9 rounded-lg border border-[#d8dee8] bg-white text-[#102372] transition hover:border-[#FF6600] hover:bg-[#fff3eb] hover:text-[#FF6600] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Quitar grupo"
                :disabled="!canManage || !company.sucursalesHabilitadas"
                @click="handleEliminarSucursal(sucursal)"
              >
                <svg viewBox="0 0 24 24" class="mx-auto h-4 w-4" fill="none" aria-hidden="true">
                  <path
                    d="M6 12h12"
                    stroke="currentColor"
                    stroke-width="2.2"
                    stroke-linecap="round"
                  />
                </svg>
              </button>
            </article>

            <div v-if="!sucursalesFiltradas.length" class="px-3 py-8 text-center">
              <p class="text-[11px] font-black text-[#102372]">Sin grupos encontrados</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  </section>
</template>

<script setup>
import { computed, ref, watch } from "vue"

const props = defineProps({
  company: {
    type: Object,
    required: true,
  },
  companies: {
    type: Array,
    default: () => [],
  },
  selectedCompanyId: {
    type: [String, Number],
    default: "",
  },
  showCompanySelector: {
    type: Boolean,
    default: false,
  },
  canManage: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits([
  "select-company",
  "alternar-sucursales-habilitadas",
  "agregar-sucursal",
  "actualizar-nombre-sucursal",
  "alternar-estado-sucursal",
  "eliminar-sucursal",
])

const nombreSucursal = ref("")
const busquedaSucursal = ref("")
const filtroEstadoSucursal = ref("all")

const sucursales = computed(() => props.company.sucursales || [])

const normalizeKey = (value) => {
  return String(value ?? "").trim()
}

const normalizeSearch = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

watch(
  () => props.company.id,
  () => {
    nombreSucursal.value = ""
    busquedaSucursal.value = ""
    filtroEstadoSucursal.value = "all"
  },
)

const cantidadSucursalesActivas = computed(() => {
  return sucursales.value.filter((sucursal) => sucursal.active !== false).length
})

const cantidadSucursalesInactivas = computed(() => {
  return sucursales.value.length - cantidadSucursalesActivas.value
})

const normalizedSucursalNames = computed(() => {
  return new Set(sucursales.value.map((sucursal) => normalizeSearch(sucursal.name)).filter(Boolean))
})

const nombreSucursalError = computed(() => {
  const normalizedName = normalizeSearch(nombreSucursal.value)

  if (!normalizedName) return ""

  return normalizedSucursalNames.value.has(normalizedName)
    ? "Ya existe un grupo con ese nombre"
    : ""
})

const canAddSucursal = computed(() => {
  return (
    props.canManage &&
    props.company.sucursalesHabilitadas &&
    Boolean(normalizeKey(nombreSucursal.value)) &&
    !nombreSucursalError.value
  )
})

const statCards = computed(() => [
  {
    label: "Registrados",
    value: sucursales.value.length,
    detail: "Total de grupos",
  },
  {
    label: "Habilitados",
    value: cantidadSucursalesActivas.value,
    detail: "Disponibles",
  },
  {
    label: "Inactivos",
    value: cantidadSucursalesInactivas.value,
    detail: "Ocultos",
  },
])

const sucursalesFiltradas = computed(() => {
  const term = normalizeSearch(busquedaSucursal.value)

  return sucursales.value.filter((sucursal) => {
    const matchesStatus =
      filtroEstadoSucursal.value === "all" ||
      (filtroEstadoSucursal.value === "active" && sucursal.active !== false) ||
      (filtroEstadoSucursal.value === "inactive" && sucursal.active === false)

    if (!matchesStatus) return false
    if (!term) return true

    return normalizeSearch(sucursal.name).includes(term)
  })
})

const handleActualizarNombreSucursal = (sucursalId, nombreSucursal) => {
  if (!props.canManage) return

  const normalizedSucursalId = normalizeKey(sucursalId)
  const nextName = normalizeKey(nombreSucursal)
  const currentSucursal = sucursales.value.find((sucursal) => {
    return normalizeKey(sucursal.id) === normalizedSucursalId
  })

  if (!currentSucursal || !nextName || normalizeKey(currentSucursal.name) === nextName) return

  const duplicatedName = sucursales.value.some((sucursal) => {
    return (
      normalizeKey(sucursal.id) !== normalizedSucursalId &&
      normalizeSearch(sucursal.name) === normalizeSearch(nextName)
    )
  })

  if (duplicatedName) return

  emit("actualizar-nombre-sucursal", sucursalId, nextName)
}

const handleEliminarSucursal = (sucursal) => {
  if (!props.canManage || !sucursal?.id) return

  const message = `Eliminar "${sucursal.name}"?`
  const confirmed = typeof window === "undefined" ? true : window.confirm(message)

  if (!confirmed) return

  emit("eliminar-sucursal", sucursal.id)
}

const handleAgregarSucursal = () => {
  if (!canAddSucursal.value) return

  emit("agregar-sucursal", normalizeKey(nombreSucursal.value))
  nombreSucursal.value = ""
}
</script>
