<template>
  <section class="configuration-alerts" aria-label="Configuración de alertas">
    <AlarmConfigPanel
      :key="companyId"
      presentation="configuration"
      :company-id="companyId"
      :companies="companies"
      :assets="fleet"
      :asset-tags="tags"
      :geofences="geofences"
      :geofence-groups="geofenceGroups"
      :can-manage="canManage"
      :inbox-to="inboxTo"
    />
  </section>
</template>
<script setup>
import { computed } from "vue"
import { useRoute } from "vue-router"
import AlarmConfigPanel from "../components/alarms/AlarmConfigPanel.vue"
import { useAccessControl } from "../composables/auth/useAccessControl.js"
import { useMockDatabase } from "../composables/mock/useMockDatabase.js"
import { useGeofences } from "../composables/activos/geocercas/useGeofences.js"

const route = useRoute()
const companyId = computed(() => String(route.params.empresaId || ""))
const { isPlatformAdmin, accessibleCompanies, visibleAssets, canAccessFunction, canAccessCompany } =
  useAccessControl()
const { assetTags } = useMockDatabase()
const companies = computed(() =>
  accessibleCompanies.value.filter(
    (company) => !companyId.value || String(company.id) === companyId.value,
  ),
)
const allowedCompanies = computed(
  () => new Set(companies.value.map((company) => String(company.id))),
)
const fleet = computed(() =>
  visibleAssets.value.filter((asset) => allowedCompanies.value.has(String(asset.companyId))),
)
const tags = computed(() =>
  assetTags.value.filter((tag) => allowedCompanies.value.has(String(tag.companyId))),
)
const { geofences, geofenceGroups } = useGeofences({ companyId })
const canManage = computed(
  () =>
    isPlatformAdmin.value ||
    Boolean(
      companyId.value &&
      canAccessCompany(companyId.value) &&
      canAccessFunction("configuration-alerts", companyId.value, "edit") &&
      canAccessFunction("alarms", companyId.value, "edit"),
    ),
)
const inboxTo = computed(() =>
  isPlatformAdmin.value || canAccessFunction("alarms", companyId.value, "view")
    ? companyId.value
      ? `/app/${companyId.value}/alertas`
      : "/alertas"
    : "",
)
</script>
<style scoped>
.configuration-alerts {
  height: 100%;
  min-height: 0;
  padding: 12px;
  background: #f4f7fb;
  color: #102372;
}
</style>
