<template>
  <section class="min-w-0 overflow-hidden rounded-lg border border-[#d9d9d9] bg-white">
    <header class="border-b border-[#d9d9d9] bg-[#102372] px-3 py-3">
      <div class="flex items-center justify-between gap-3">
        <div class="min-w-0">
          <h3 class="text-[13px] font-black text-white">Sucursales</h3>
          <p class="mt-0.5 text-[10px] font-semibold text-white/60">
            {{ cantidadSucursalesActivas }} activas de {{ sucursales.length }}
          </p>
        </div>

        <button
          type="button"
          role="switch"
          class="flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition"
          :class="company.sucursalesHabilitadas ? 'bg-[#FF6600]' : 'bg-white/25'"
          :aria-checked="company.sucursalesHabilitadas"
          aria-label="Activar sucursales"
          :disabled="!canManage"
          @click="$emit('alternar-sucursales-habilitadas')"
        >
          <span
            class="h-5 w-5 rounded-full bg-white shadow-sm transition"
            :class="company.sucursalesHabilitadas ? 'translate-x-5' : 'translate-x-0'"
          ></span>
        </button>
      </div>

      <label v-if="showCompanySelector" class="mt-3 block">
        <span class="mb-1 block text-[9px] font-black uppercase text-white/60">
          Empresa administrada
        </span>
        <select
          :value="selectedCompanyId"
          class="h-9 w-full cursor-pointer rounded-lg border border-white/25 bg-white px-2 text-[11px] font-black text-[#102372] outline-none focus:border-[#FF6600]"
          @change="$emit('select-company', $event.target.value)"
        >
          <option v-for="item in companies" :key="item.id" :value="item.id">
            {{ item.name }}
          </option>
        </select>
      </label>
    </header>

    <div class="grid gap-3 p-3">
      <div class="grid overflow-hidden rounded-lg border border-[#d9d9d9] sm:grid-cols-3">
        <div class="border-b border-[#d9d9d9] px-3 py-2.5 sm:border-b-0 sm:border-r">
          <p class="text-[9px] font-black uppercase text-[#FF6600]">Sucursales</p>
          <p class="mt-1 text-[17px] font-black text-[#102372]">{{ sucursales.length }}</p>
        </div>

        <div class="border-b border-[#d9d9d9] px-3 py-2.5 sm:border-b-0 sm:border-r">
          <p class="text-[9px] font-black uppercase text-[#FF6600]">Asignados</p>
          <p class="mt-1 text-[17px] font-black text-[#102372]">{{ assignedAssetsCount }}</p>
        </div>

        <div class="px-3 py-2.5">
          <p class="text-[9px] font-black uppercase text-[#FF6600]">Sin sucursal</p>
          <p class="mt-1 text-[17px] font-black text-[#102372]">{{ unassignedAssetsCount }}</p>
        </div>
      </div>

      <button
        type="button"
        class="flex h-10 items-center justify-between gap-3 rounded-lg border border-[#102372] bg-white px-3 text-[10px] font-black text-[#102372] transition hover:bg-[#eef2f7] disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="!company.sucursalesHabilitadas"
        @click="toggleManager('sucursales')"
      >
        <span>Gestionar sucursales</span>
        <span class="flex items-center gap-2">
          <span>{{ sucursales.length }} registradas</span>
          <svg
            viewBox="0 0 24 24"
            class="h-4 w-4 transition"
            :class="activeManager === 'sucursales' ? 'rotate-180' : ''"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="m7 10 5 5 5-5"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
      </button>

      <div
        v-if="activeManager === 'sucursales'"
        class="grid gap-2 transition"
        :class="company.sucursalesHabilitadas ? '' : 'pointer-events-none opacity-45'"
      >
        <div class="relative">
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
            placeholder="Buscar sucursal"
            class="h-9 w-full rounded-lg border border-[#d9d9d9] bg-white pl-9 pr-3 text-[11px] font-semibold text-[#102372] outline-none placeholder:text-[#102372]/40 focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10"
          />
        </div>

        <div
          class="grid max-h-[230px] gap-2 overflow-auto rounded-lg border border-[#d9d9d9] bg-[#eef2f7] p-2"
        >
          <article
            v-for="sucursal in sucursalesFiltradas"
            :key="sucursal.id"
            class="grid gap-2 rounded-lg border border-[#d9d9d9] bg-white p-2 sm:grid-cols-[minmax(0,1fr)_90px_92px_36px] sm:items-center"
          >
            <input
              :value="sucursal.name"
              type="text"
              class="h-9 min-w-0 rounded-lg border border-[#d9d9d9] bg-[#eef2f7] px-2 text-[11px] font-semibold text-[#102372] outline-none transition focus:border-[#FF6600] focus:bg-white focus:ring-2 focus:ring-[#FF6600]/10"
              aria-label="Nombre de sucursal"
              :disabled="!canManage"
              @input="$emit('actualizar-nombre-sucursal', sucursal.id, $event.target.value)"
            />

            <button
              type="button"
              class="rounded-lg px-1 py-1 text-left transition hover:bg-[#eef2f7]"
              title="Ver activos de esta sucursal"
              @click="openGestorActivos(sucursal.id)"
            >
              <p class="text-[9px] font-black uppercase text-[#FF6600]">Activos</p>
              <p class="mt-0.5 text-[11px] font-black text-[#102372]">
                {{ getCantidadActivosSucursal(sucursal.id) }}
              </p>
            </button>

            <button
              type="button"
              role="switch"
              class="flex h-9 items-center justify-between gap-2 rounded-lg border px-2 text-[9px] font-black transition"
              :class="
                sucursal.active
                  ? 'border-[#FF6600] bg-[#fff3eb] text-[#FF6600]'
                  : 'border-[#d9d9d9] bg-white text-[#102372]'
              "
              :aria-checked="sucursal.active"
              :disabled="!canManage"
              @click="$emit('alternar-estado-sucursal', sucursal.id)"
            >
              <span>{{ sucursal.active ? "Activa" : "Inactiva" }}</span>
              <span
                class="h-2 w-2 rounded-full"
                :class="sucursal.active ? 'bg-[#FF6600]' : 'bg-[#102372]'"
              ></span>
            </button>

            <button
              type="button"
              class="h-9 w-9 rounded-lg border border-[#d9d9d9] bg-white text-[#102372] transition hover:border-[#FF6600] hover:bg-[#fff3eb] hover:text-[#FF6600]"
              aria-label="Quitar sucursal"
              :disabled="!canManage"
              @click="$emit('eliminar-sucursal', sucursal.id)"
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

          <div v-if="!sucursalesFiltradas.length" class="px-3 py-7 text-center">
            <p class="text-[11px] font-black text-[#102372]">Sin sucursales encontradas</p>
          </div>
        </div>

        <form
          class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-dashed border-[#d9d9d9] p-2"
          @submit.prevent="handleAgregarSucursal"
        >
          <input
            v-model="nombreSucursal"
            type="text"
            placeholder="Nombre de nueva sucursal"
            class="h-9 min-w-0 rounded-lg border border-[#d9d9d9] bg-white px-2 text-[11px] font-semibold text-[#102372] outline-none transition placeholder:text-[#102372]/40 focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10"
            :disabled="!canManage"
          />

          <button
            type="submit"
            class="h-9 rounded-lg bg-[#FF6600] px-3 text-[10px] font-black text-white transition hover:bg-[#e65c00] disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="!canManage || !nombreSucursal.trim()"
          >
            Agregar
          </button>
        </form>
      </div>

      <button
        type="button"
        class="flex h-10 items-center justify-between gap-3 rounded-lg border border-[#102372] bg-white px-3 text-[10px] font-black text-[#102372] transition hover:bg-[#eef2f7] disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="!company.sucursalesHabilitadas"
        @click="toggleAssetManager"
      >
        <span>Gestionar activos de sucursales</span>
        <span class="flex items-center gap-2">
          <span>{{ assets.length }} disponibles</span>
          <svg
            viewBox="0 0 24 24"
            class="h-4 w-4 transition"
            :class="activeManager === 'assets' ? 'rotate-180' : ''"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="m7 10 5 5 5-5"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
      </button>

      <section
        v-if="activeManager === 'assets'"
        class="overflow-hidden rounded-lg border border-[#d9d9d9] bg-white"
        :class="company.sucursalesHabilitadas ? '' : 'pointer-events-none opacity-45'"
      >
        <header class="border-b border-[#d9d9d9] bg-[#102372] px-3 py-2.5">
          <div class="flex items-center justify-between gap-3">
            <div class="min-w-0">
              <h4 class="text-[11px] font-black text-white">Asignacion de activos</h4>
              <p class="mt-0.5 truncate text-[9px] font-semibold text-white/60">
                Cambia la sucursal directamente desde cada activo.
              </p>
            </div>

            <button
              type="button"
              class="h-8 w-8 rounded-lg border border-white/25 text-white/70 transition hover:bg-white/10 hover:text-white"
              aria-label="Cerrar administrador"
              @click="activeManager = null"
            >
              <svg viewBox="0 0 24 24" class="mx-auto h-4 w-4" fill="none" aria-hidden="true">
                <path
                  d="m7 7 10 10M17 7 7 17"
                  stroke="currentColor"
                  stroke-width="2.2"
                  stroke-linecap="round"
                />
              </svg>
            </button>
          </div>
        </header>

        <div class="grid gap-2 border-b border-[#d9d9d9] bg-[#eef2f7] p-2 sm:grid-cols-2">
          <input
            v-model="assetSearch"
            type="text"
            placeholder="Buscar patente"
            class="h-9 min-w-0 rounded-lg border border-[#d9d9d9] bg-white px-2 text-[11px] font-semibold text-[#102372] outline-none placeholder:text-[#102372]/40 focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10"
          />

          <select
            v-model="filtroSucursalActivo"
            class="h-9 min-w-0 cursor-pointer rounded-lg border border-[#d9d9d9] bg-white px-2 text-[10px] font-black text-[#102372] outline-none focus:border-[#FF6600]"
          >
            <option value="all">Todos los activos</option>
            <option value="unassigned">Sin sucursal</option>
            <option v-for="sucursal in sucursales" :key="sucursal.id" :value="sucursal.id">
              {{ sucursal.name }}
            </option>
          </select>
        </div>

        <div class="max-h-[260px] overflow-auto">
          <article
            v-for="asset in filteredAssets"
            :key="asset.id"
            class="grid gap-2 border-b border-[#d9d9d9] px-3 py-2.5 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-center"
          >
            <div class="min-w-0">
              <p class="truncate text-[11px] font-black text-[#102372]">
                {{ asset.patent || "Sin patente" }}
              </p>
              <p class="mt-0.5 truncate text-[9px] font-semibold text-[#102372]/55">
                {{ getEtiquetaSucursalActivo(asset) }}
              </p>
            </div>

            <select
              :value="asset.sucursalId || ''"
              class="h-8 min-w-0 cursor-pointer rounded-lg border border-[#d9d9d9] bg-white px-2 text-[10px] font-black text-[#102372] outline-none focus:border-[#FF6600]"
              aria-label="Sucursal del activo"
              :disabled="!canManage"
              @change="handleCambioSucursalActivo(asset.id, $event.target.value)"
            >
              <option value="">Sin sucursal</option>
              <option
                v-for="sucursal in sucursales"
                :key="sucursal.id"
                :value="sucursal.id"
                :disabled="!sucursal.active"
              >
                {{ sucursal.name }}{{ sucursal.active ? "" : " (inactiva)" }}
              </option>
            </select>
          </article>

          <div v-if="!filteredAssets.length" class="px-3 py-8 text-center">
            <p class="text-[11px] font-black text-[#102372]">Sin activos encontrados</p>
          </div>
        </div>
      </section>
    </div>
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
  "actualizar-sucursal-activo",
])

const nombreSucursal = ref("")
const busquedaSucursal = ref("")
const assetSearch = ref("")
const filtroSucursalActivo = ref("all")
const activeManager = ref(null)

const sucursales = computed(() => props.company.sucursales || [])
const assets = computed(() => props.company.assets || [])

watch(
  () => props.company.id,
  () => {
    nombreSucursal.value = ""
    busquedaSucursal.value = ""
    assetSearch.value = ""
    filtroSucursalActivo.value = "all"
    activeManager.value = null
  },
)

const sucursalesFiltradas = computed(() => {
  const term = busquedaSucursal.value.trim().toLowerCase()

  if (!term) return sucursales.value

  return sucursales.value.filter((sucursal) => {
    return String(sucursal.name || "")
      .toLowerCase()
      .includes(term)
  })
})

const cantidadSucursalesActivas = computed(() => {
  return sucursales.value.filter((sucursal) => sucursal.active).length
})

const assignedAssetsCount = computed(() => {
  return assets.value.filter((asset) => asset.sucursalId).length
})

const unassignedAssetsCount = computed(() => {
  return assets.value.filter((asset) => !asset.sucursalId).length
})

const filteredAssets = computed(() => {
  const term = assetSearch.value.trim().toLowerCase()

  return assets.value.filter((asset) => {
    const coincideSucursal =
      filtroSucursalActivo.value === "all" ||
      (filtroSucursalActivo.value === "unassigned" && !asset.sucursalId) ||
      asset.sucursalId === filtroSucursalActivo.value

    if (!coincideSucursal) return false
    if (!term) return true

    return [asset.id, asset.patent].some((value) => {
      return String(value || "")
        .toLowerCase()
        .includes(term)
    })
  })
})

const getCantidadActivosSucursal = (sucursalId) => {
  return assets.value.filter((asset) => asset.sucursalId === sucursalId).length
}

const getEtiquetaSucursalActivo = (asset) => {
  if (!asset.sucursalId) return "Sin sucursal"

  return (
    sucursales.value.find((sucursal) => sucursal.id === asset.sucursalId)?.name || "Sin sucursal"
  )
}

const openGestorActivos = (sucursalId = "all") => {
  filtroSucursalActivo.value = sucursalId
  activeManager.value = "assets"
}

const toggleManager = (manager) => {
  activeManager.value = activeManager.value === manager ? null : manager
}

const toggleAssetManager = () => {
  if (activeManager.value === "assets") {
    activeManager.value = null
    return
  }

  filtroSucursalActivo.value = "all"
  activeManager.value = "assets"
}

const handleCambioSucursalActivo = (assetId, sucursalId) => {
  if (!props.canManage) return

  emit("actualizar-sucursal-activo", {
    assetId,
    sucursalId: sucursalId || null,
  })
}

const handleAgregarSucursal = () => {
  if (!props.canManage) return
  if (!nombreSucursal.value.trim()) return

  emit("agregar-sucursal", nombreSucursal.value)
  nombreSucursal.value = ""
}
</script>
