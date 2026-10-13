<template>
  <aside
    class="relative z-[2000] hidden h-full shrink-0 md:block"
    :class="compactEnabled ? 'w-[76px]' : 'w-0'"
  >
    <div
      class="sidebar-overlay fixed inset-0 z-[1990] bg-slate-950"
      :class="isOpen ? 'pointer-events-auto opacity-40' : 'pointer-events-none opacity-0'"
      aria-hidden="true"
      @click="close"
    />

    <nav
      v-if="compactEnabled"
      class="absolute inset-y-0 left-0 z-[2000] flex w-[76px] flex-col border-r border-white/10 bg-[#1c2937] px-2 py-3 text-white"
      aria-label="Navegacion compacta"
    >
      <ul class="min-h-0 flex-1 space-y-2 overflow-visible">
        <li v-for="item in navigationItems" :key="item.to">
          <RouterLink
            :to="item.to"
            class="rail-link group relative mx-auto flex h-12 w-12 items-center justify-center rounded-md text-slate-300 hover:bg-white/[0.08] hover:text-white"
            :class="{ active: isActive(item) }"
            :aria-label="item.label"
            :title="item.label"
          >
            <SvgIcon :name="item.icon" class="sidebar-navigation-icon" />
            <span class="tooltip">{{ item.label }}</span>
          </RouterLink>
        </li>
      </ul>
      <button
        type="button"
        class="mx-auto mt-3 grid h-10 w-10 place-items-center rounded-md text-slate-400 hover:bg-white/[0.08] hover:text-white"
        title="Ocultar barra compacta"
        aria-label="Ocultar barra compacta"
        @click="setCompact(false)"
      >
        <SvgIcon name="panel-close" />
      </button>
    </nav>

    <section
      class="sidebar-panel fixed inset-y-0 left-0 z-[2000] flex w-[292px] max-w-[calc(100vw-20px)] flex-col border-r border-white/10 bg-[#1c2937] text-white"
      :class="isOpen ? 'sidebar-panel--open' : 'sidebar-panel--closed'"
      :aria-hidden="!isOpen"
      :inert="!isOpen"
      aria-label="Navegacion principal"
    >
      <header class="flex h-[78px] items-center justify-between border-b border-white/10 px-5">
        <div>
          <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Navegacion</p>
          <h2 class="mt-1 text-lg font-extrabold">Modulos</h2>
        </div>
        <div class="flex items-center gap-1">
          <button
            type="button"
            class="grid h-10 w-10 place-items-center rounded-md text-slate-300 hover:bg-white/10 hover:text-white"
            aria-label="Cerrar navegacion"
            @click="close"
          >
            <SvgIcon name="close" />
          </button>
        </div>
      </header>

      <nav class="sidebar-scrollbar min-h-0 flex-1 overflow-y-auto px-3 py-4">
        <ul class="space-y-1">
          <li v-for="item in navigationItems" :key="item.to">
            <RouterLink
              :to="item.to"
              class="menu-link flex min-h-12 items-center gap-3 rounded-md px-3 text-sm font-semibold text-slate-300 hover:bg-white/[0.07] hover:text-white"
              :class="{ active: isActive(item) }"
              @click="close"
            >
              <span class="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-white/[0.06]">
                <SvgIcon :name="item.icon" class="sidebar-navigation-icon" />
              </span>
              <span class="min-w-0 flex-1 truncate">{{ item.label }}</span>
              <span v-if="item.notice" class="h-2 w-2 shrink-0 rounded-full bg-[#ff6600]" />
            </RouterLink>
          </li>
        </ul>
      </nav>

      <footer class="shrink-0 border-t border-white/10 p-3">
        <button
          type="button"
          class="mb-2 grid min-h-11 w-full grid-cols-[36px_minmax(0,1fr)] items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-semibold text-slate-300 hover:bg-white/[0.07] hover:text-white"
          @click="toggleCompact"
        >
          <span class="grid h-9 w-9 place-items-center rounded-md bg-white/[0.06]">
            <SvgIcon :name="compactEnabled ? 'panel-close' : 'panel-open'" />
          </span>
          <span class="min-w-0 whitespace-nowrap">
            {{ compactEnabled ? "Ocultar barra compacta" : "Mostrar barra compacta" }}
          </span>
        </button>
        <div class="flex min-h-14 items-center gap-3 rounded-md bg-black/15 px-3 py-3">
          <img
            src="../../assets/branding/sinergy-group.png"
            alt="Sinergy Group"
            class="h-8 w-auto max-w-[150px] shrink-0 object-contain brightness-0 invert"
          />
          <span class="ml-auto h-2 w-2 rounded-full bg-[#ff6600]" />
        </div>
      </footer>
    </section>
  </aside>
</template>

<script setup>
import { computed, ref } from "vue"
import { useRoute } from "vue-router"
import { useAccessControl } from "../../composables/auth/useAccessControl.js"
import { readStorageValue, writeStorageValue } from "../../services/storage/browserStorage.js"
import SvgIcon from "../icons/SvgIcon.vue"

const STORAGE_KEY = "sinergy-sidebar-compact"
const route = useRoute()
const { isPlatformAdmin, accessibleCompanies, canAccessModule, canAccessFunction } =
  useAccessControl()
const compactEnabled = ref(readStorageValue(STORAGE_KEY) !== "false")
const isOpen = ref(false)
const companyId = computed(() => String(route.params.empresaId || ""))

const assetItems = computed(() => {
  if (isPlatformAdmin.value)
    return [
      { to: "/activos", label: "Activos", icon: "activos", routes: ["Activos", "AppActivos"] },
    ]
  return accessibleCompanies.value
    .filter((company) => canAccessModule("assets", company.id))
    .map((company) => ({
      to: `/app/${company.id}/activos`,
      label: company.name,
      icon: "activos",
      routes: ["AppActivos"],
      exact: true,
    }))
})

const moduleItem = (options) => {
  if (isPlatformAdmin.value) return { ...options, to: options.platformPath }
  const companies = accessibleCompanies.value
  const company =
    companies.find(
      (candidate) =>
        String(candidate.id) === companyId.value &&
        canAccessFunction(options.permission, candidate.id, "view"),
    ) || companies.find((candidate) => canAccessFunction(options.permission, candidate.id, "view"))
  return company ? { ...options, to: `/app/${company.id}/${options.segment}` } : null
}

const unreportedItem = () => {
  if (isPlatformAdmin.value) {
    return {
      to: "/sin-reportar",
      label: "Sin reportar",
      icon: "unreported",
      routes: ["Unreported", "AppUnreported"],
    }
  }

  const company =
    accessibleCompanies.value.find(
      (candidate) =>
        String(candidate.id) === companyId.value && canAccessModule("assets", candidate.id),
    ) || accessibleCompanies.value.find((candidate) => canAccessModule("assets", candidate.id))

  return company
    ? {
        to: `/app/${company.id}/sin-reportar`,
        label: "Sin reportar",
        icon: "unreported",
        routes: ["Unreported", "AppUnreported"],
      }
    : null
}

const navigationItems = computed(() => {
  const modules = [
    moduleItem({
      label: "Reportes",
      icon: "reportes",
      permission: "reports",
      segment: "reportes",
      platformPath: "/reportes",
      routes: ["Reports", "AppReports"],
    }),
    moduleItem({
      label: "Alertas",
      icon: "alertas",
      permission: "alarms",
      segment: "alertas",
      platformPath: "/alertas",
      routes: ["Alarms", "AppAlarms"],
      notice: true,
    }),
    moduleItem({
      label: "Auditoria",
      icon: "auditoria",
      permission: "audit-view",
      segment: "auditoria",
      platformPath: "/auditoria",
      routes: ["Audit", "AppAudit"],
    }),
    moduleItem({
      label: "Mantenciones",
      icon: "mantenciones",
      permission: "maintenance-view",
      segment: "mantenciones",
      platformPath: "/mantenciones",
      routes: ["Maintenance", "AppMaintenance"],
    }),
    unreportedItem(),
  ].filter(Boolean)
  const admin = isPlatformAdmin.value
    ? [
        { to: "/empresas", label: "Empresas", icon: "empresas", routes: ["CompanyManagement"] },
        {
          to: "/usuarios",
          label: "Gestion de usuarios",
          icon: "usuarios",
          routes: ["UserManagement"],
        },
      ]
    : []
  return [...assetItems.value, ...modules, ...admin]
})

const isActive = (item) =>
  item.exact
    ? route.path === item.to
    : item.routes?.includes(String(route.name)) || route.path === item.to
const close = () => {
  isOpen.value = false
}
const open = () => {
  isOpen.value = true
}
const toggle = () => {
  isOpen.value = !isOpen.value
}
const setCompact = (enabled) => {
  compactEnabled.value = enabled
  writeStorageValue(STORAGE_KEY, enabled)
}
const toggleCompact = () => {
  setCompact(!compactEnabled.value)
  close()
}

defineExpose({ close, open, toggle })
</script>

<style scoped>
.rail-link,
.menu-link {
  transition:
    color 140ms ease,
    background-color 140ms ease;
}
.sidebar-navigation-icon {
  width: 1.25rem;
  height: 1.25rem;
  max-width: 1.25rem;
  max-height: 1.25rem;
  flex-shrink: 0;
}
.rail-link.active {
  background: #ff6600;
  color: #fff;
  box-shadow: 0 7px 16px rgb(255 102 0/24%);
}
.menu-link.active {
  background: #ff6600;
  color: #fff;
  font-weight: 800;
}
.menu-link.active > span:first-child {
  background: rgb(255 255 255/16%);
}
.tooltip {
  pointer-events: none;
  position: absolute;
  left: calc(100% + 12px);
  top: 50%;
  z-index: 70;
  width: max-content;
  max-width: 220px;
  transform: translate(-4px, -50%);
  border-radius: 4px;
  background: #111827;
  padding: 6px 9px;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  opacity: 0;
  box-shadow: 0 8px 22px rgb(0 0 0/28%);
  transition:
    opacity 120ms ease,
    transform 120ms ease;
}
.rail-link:hover .tooltip,
.rail-link:focus-visible .tooltip {
  transform: translate(0, -50%);
  opacity: 1;
}
.sidebar-panel {
  contain: layout paint style;
  will-change: transform;
  backface-visibility: hidden;
  transition: transform 140ms cubic-bezier(0.2, 0, 0, 1);
}
.sidebar-panel--open {
  pointer-events: auto;
  transform: translate3d(0, 0, 0);
}
.sidebar-panel--closed {
  pointer-events: none;
  transform: translate3d(-100%, 0, 0);
}
.sidebar-overlay {
  contain: strict;
  will-change: opacity;
  transition: opacity 100ms linear;
}
.sidebar-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgb(255 255 255/18%) transparent;
}
@media (max-width: 767px) {
  aside {
    display: block;
    width: 0 !important;
  }
}
@media (prefers-reduced-motion: reduce) {
  .sidebar-panel,
  .sidebar-overlay,
  .rail-link,
  .menu-link,
  .tooltip {
    transition: none;
  }
}
</style>
