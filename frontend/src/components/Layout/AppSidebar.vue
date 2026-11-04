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
      @mouseover="showTooltip"
      @mouseleave="hideTooltip"
      @focusin="showTooltip"
      @focusout="hideTooltip"
      @click="hideTooltip"
      @keydown.esc="hideTooltip"
    >
      <div class="sidebar-section-selector" aria-label="Secciones">
        <button
v-for="category in navigationCategories" :key="category.id" type="button"
          :class="{ selected: expandedCategory === category.id }"
          :aria-label="category.label"
          :aria-pressed="expandedCategory === category.id" @click="selectCategory(category.id)"
>
          <SvgIcon :name="categoryIcon(category.id)" />
        </button>
      </div>
      <div class="sidebar-scrollbar min-h-0 flex-1 overflow-y-auto">
        <section v-for="category in navigationCategories.filter(group => group.id === expandedCategory)" :key="category.id">
          <ul :id="`rail-${category.id}`" class="space-y-1 pt-3">
            <li v-for="item in category.items" :key="item.to">
              <RouterLink
:to="item.to" class="rail-link group relative mx-auto flex h-12 w-12 items-center justify-center rounded-md text-slate-300 hover:bg-white/[0.08] hover:text-white"
                :class="{ active: isActive(item) }"
                :aria-label="item.companyName ? `${item.label} - ${item.companyName}` : `${category.label}: ${item.label}`"
>
                <SvgIcon :name="item.icon" class="sidebar-navigation-icon" />
              </RouterLink>
            </li>
          </ul>
        </section>
      </div>
      <button
        type="button"
        class="mx-auto mt-3 grid h-10 w-10 place-items-center rounded-md text-slate-400 hover:bg-white/[0.08] hover:text-white"
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
        <section v-for="category in navigationCategories" :key="category.id" class="sidebar-accordion-group mb-2">
          <button
            type="button"
            class="flex min-h-9 w-full items-center justify-between px-3 text-xs font-bold text-slate-400 hover:text-white"
            :aria-expanded="expandedCategory === category.id"
            :aria-controls="`menu-${category.id}`"
            @click="toggleCategory(category.id)"
          >
            <span class="sidebar-category-icon"><SvgIcon :name="categoryIcon(category.id)" /></span>
            <span class="sidebar-category-name">{{ categoryLabel(category.id) }}</span>
            <span class="sidebar-category-count">{{ category.items.length }}</span>
            <SvgIcon
              :name="expandedCategory === category.id ? 'chevron-down' : 'chevron-right'"
              class="h-4 w-4"
            />
          </button>
          <ul
            v-show="expandedCategory === category.id"
            :id="`menu-${category.id}`"
            class="space-y-1"
          >
            <li v-for="item in category.items" :key="item.to">
              <RouterLink
                :to="item.to"
                class="menu-link flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-semibold text-slate-300 hover:bg-white/[0.07] hover:text-white"
                :class="{ active: isActive(item) }"
                @click="close"
              >
                <span class="grid h-7 w-7 shrink-0 place-items-center">
                  <SvgIcon :name="item.icon" class="sidebar-navigation-icon" />
                </span>
                <span class="min-w-0 flex-1 truncate">{{ item.label
                  }}<small
                    v-if="item.companyName"
                    class="block truncate text-xs font-normal text-slate-300"
                    >{{ item.companyName }}</small></span>
                <span v-if="item.notice" class="h-2 w-2 shrink-0 rounded-full bg-[#ff6600]" />
              </RouterLink>
            </li>
          </ul>
        </section>
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
    <Teleport to="body">
      <div v-if="tooltip" id="sidebar-floating-tooltip" class="sidebar-floating-tooltip" role="tooltip" :style="{ left: tooltip.left + 'px', top: tooltip.top + 'px', maxWidth: tooltip.width + 'px' }">{{ tooltip.text }}</div>
    </Teleport>
  </aside>
</template>

<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount } from "vue"
import { useRoute } from "vue-router"
import { useAccessControl } from "../../composables/auth/useAccessControl.js"
import { readStorageValue, writeStorageValue } from "../../services/storage/browserStorage.js"
import SvgIcon from "../icons/SvgIcon.vue"
import { CONFIGURATION_MODULES } from "../../utils/layout/configurationNavigation.js"

const STORAGE_KEY = "sinergy-sidebar-compact"
const route = useRoute()
const { isPlatformAdmin, accessibleCompanies, canAccessModule, canAccessFunction } =
  useAccessControl()
const compactEnabled = ref(readStorageValue(STORAGE_KEY) !== "false")
const isOpen = ref(false)
const tooltip = ref(null)
let tooltipTarget = null
const hideTooltip = () => {
  tooltipTarget?.removeAttribute("aria-describedby")
  tooltipTarget = null
  tooltip.value = null
}
const showTooltip = (event) => {
  const target = event.target.closest?.("a, button")
  if (!target || isOpen.value || !event.currentTarget.contains(target)) return
  const text = target.getAttribute("aria-label")
  if (!text) return
  hideTooltip()
  const rect = target.getBoundingClientRect()
  const left = rect.right + 14
  tooltipTarget = target
  target.setAttribute("aria-describedby", "sidebar-floating-tooltip")
  tooltip.value = { text, left, top: Math.max(40, Math.min(window.innerHeight - 40, rect.top + rect.height / 2)), width: Math.min(260, window.innerWidth - left - 12) }
}
watch([() => route.fullPath, compactEnabled, isOpen], hideTooltip)
onMounted(() => {
  window.addEventListener("resize", hideTooltip)
  window.addEventListener("scroll", hideTooltip, true)
})
onBeforeUnmount(() => {
  hideTooltip()
  window.removeEventListener("resize", hideTooltip)
  window.removeEventListener("scroll", hideTooltip, true)
})
const expandedCategory = ref("operation")
const selectCategory = (id) => { expandedCategory.value = id }
const toggleCategory = (id) => {
  expandedCategory.value = id
}
const categoryIcon = (id) => ({ operation: "activos", configuration: "configuracion", administration: "usuarios" })[id]
const categoryLabel = (id) => ({ operation: "Operación", configuration: "Configuración", administration: "Administración" })[id]
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
      label: "Activos",
      companyName: company.name,
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

const navigationCategories = computed(() => {
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
          label: "Gesti\u00f3n de usuarios",
          icon: "usuarios",
          routes: ["UserManagement"],
        },
      ]
    : []
  const audit = moduleItem({
    label: "Auditor\u00eda",
    icon: "auditoria",
    permission: "audit-view",
    segment: "auditoria",
    platformPath: "/auditoria",
    routes: ["Audit", "AppAudit"],
  })
  const configuration = CONFIGURATION_MODULES.map((item) => {
    if (item.platformOnly && !isPlatformAdmin.value) return null
    return moduleItem({
      ...item,
      segment: `configuracion/${item.slug}`,
      platformPath: `/configuracion/${item.slug}`,
      routes: [item.name, `App${item.name}`],
    })
  }).filter(Boolean)
  return [
    { id: "operation", label: "OPERACI\u00d3N", items: [...assetItems.value, ...modules] },
    { id: "configuration", label: "CONFIGURACI\u00d3N", items: configuration },
    {
      id: "administration",
      label: "ADMINISTRACI\u00d3N",
      items: [...admin, audit].filter(Boolean),
    },
  ].filter((category) => category.items.length)
})

const isActive = (item) =>
  item.exact
    ? route.path === item.to
    : item.routes?.includes(String(route.name)) || route.path === item.to
watch(
  () => [route.fullPath, navigationCategories.value],
  () => {
    const current = navigationCategories.value.find(category => category.items.some(isActive))
    expandedCategory.value = current?.id || navigationCategories.value.find(category => category.id === expandedCategory.value)?.id || navigationCategories.value[0]?.id || ""
  },
  { immediate: true },
)
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
  nav[aria-label="Navegacion compacta"] {
    display: none;
  }
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
.sidebar-section-selector { display: flex; flex-direction: column; gap: 4px; padding-bottom: 12px; margin-bottom: 4px; border-bottom: 1px solid #ffffff24; }
.sidebar-section-selector button { display: grid; place-items: center; width: 44px; height: 36px; margin: 0 auto; border: 1px solid transparent; border-radius: 5px; background: transparent; color: #94a3b8; cursor: pointer; }
.sidebar-section-selector button.selected { background: #ffffff12; border-color: #ff6600; color: #ff8a3d; }
.sidebar-section-selector button:hover { background: #ffffff16; color: white; }
.sidebar-accordion-group { margin-bottom: 10px; }
.sidebar-accordion-group > button { display: flex; gap: 10px; min-height: 48px; padding: 8px 10px; border: 1px solid transparent; border-radius: 6px; text-align: left; font-size: 13px; color: #b6c2cf; }
.sidebar-accordion-group > button:hover { background: #ffffff08; }
.sidebar-accordion-group > button[aria-expanded="true"] { color: white; border-color: #ffffff18; background: #ffffff0c; }
.sidebar-category-icon { display: grid; place-items: center; width: 28px; height: 28px; color: #8c9fb3; }
.sidebar-category-icon :deep(.svg-icon-wrapper) { width: 20px; height: 20px; }
.sidebar-accordion-group > button[aria-expanded="true"] .sidebar-category-icon { color: #ff8a3d; }
.sidebar-category-name { flex: 1; }
.sidebar-category-count { font-size: 11px; font-weight: 400; color: #8c9fb3; }
.sidebar-accordion-group ul { padding: 8px 0 6px 12px; margin: 4px 0 0 23px; border-left: 1px solid #ffffff1c; }
.sidebar-accordion-group .menu-link { min-height: 40px; padding: 6px 10px; font-size: 13px; font-weight: 400; }
.sidebar-accordion-group .menu-link.active { background: #ff66001c; color: #ff9a57; box-shadow: inset 3px 0 #ff6600; font-weight: 700; }
.sidebar-accordion-group .menu-link.active > span:first-child { background: none; }
.sidebar-section-selector button:focus-visible { outline: 2px solid #ff6600; outline-offset: 2px; }
.sidebar-floating-tooltip { position: fixed; z-index: 10000; pointer-events: none; transform: translateY(-50%); padding: 9px 12px; border: 1px solid #ffffff1f; border-radius: 5px; background: #14212f; color: white; box-shadow: 0 6px 20px #00000030; font-size: 12px; font-weight: 600; line-height: 1.5; overflow-wrap: anywhere; }
.sidebar-floating-tooltip::before { content: ""; position: absolute; top: calc(50% - 5px); left: -5px; width: 8px; height: 8px; background: #14212f; transform: rotate(45deg); }
</style>
