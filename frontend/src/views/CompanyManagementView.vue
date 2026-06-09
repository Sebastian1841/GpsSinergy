<template>
  <section class="h-full min-h-0 bg-[#eef2f7]">
    <div class="grid h-full min-h-0 grid-rows-[auto_1fr]">
      <CompanyManagementHeader
        :summary-items="summaryItems"
        @create-company="openCreateCompanyModal"
      />

      <main class="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-3 overflow-hidden p-3">
        <CompanyFiltersBar
          :search-term="searchTerm"
          :selected-status="selectedStatus"
          @update:search-term="searchTerm = $event"
          @update:selected-status="selectedStatus = $event"
          @clear-filters="clearFilters"
        />

        <CompanyCatalog
          :companies="visibleCompanies"
          :visible-companies-remaining="visibleCompaniesRemaining"
          :can-show-more="canShowMoreCompanies"
          :get-company-health="getCompanyHealth"
          @configure-company="openCompanyConfigPanel"
          @enter-company="enterCompanyWorkspace"
          @clear-filters="clearFilters"
          @show-more="showMoreCompanies"
        />
      </main>
    </div>

    <CompanyConfigPanel
      :model-value="showConfigPanel"
      :company="selectedCompany"
      :report-types="reportTypes"
      :get-company-health="getCompanyHealth"
      @close="showConfigPanel = false"
      @edit-company="openEditCompanyModal"
      @toggle-company-status="toggleSelectedCompanyStatus"
      @toggle-company-report="toggleCompanyReport"
      @alternar-sucursales-habilitadas="alternarSucursalesHabilitadas"
      @agregar-sucursal="agregarSucursal"
      @actualizar-nombre-sucursal="actualizarNombreSucursal"
      @alternar-estado-sucursal="alternarEstadoSucursal"
      @eliminar-sucursal="eliminarSucursal"
      @actualizar-sucursal-activo="actualizarSucursalActivo"
      @enter-company="enterCompanyWorkspace"
    />

    <CompanyEditorModal
      :model-value="showEditorModal"
      :mode="editorMode"
      :draft-company="draftCompany"
      @update:draft-company="updateDraftCompany"
      @close="closeEditorModal"
      @save="saveCompanyFromModal"
    />
  </section>
</template>

<script setup>
import { ref } from "vue"
import { useRouter } from "vue-router"

import CompanyCatalog from "../components/companies/CompanyCatalog.vue"
import CompanyConfigPanel from "../components/companies/CompanyConfigPanel.vue"
import CompanyEditorModal from "../components/companies/CompanyEditorModal.vue"
import CompanyFiltersBar from "../components/companies/CompanyFiltersBar.vue"
import CompanyManagementHeader from "../components/companies/CompanyManagementHeader.vue"

import { useCompanyManagement } from "../composables/companies/useCompanyManagement.js"
import { getCompanyWorkspacePath } from "../utils/companies/companyUtils.js"

const router = useRouter()

const {
  reportTypes,

  searchTerm,
  selectedStatus,
  selectedCompany,
  visibleCompanies,
  visibleCompaniesRemaining,
  canShowMoreCompanies,
  summaryItems,

  showEditorModal,
  editorMode,
  draftCompany,

  selectCompany,
  clearFilters,
  showMoreCompanies,
  openCreateCompanyModal,
  openEditCompanyModal,
  closeEditorModal,
  saveCompanyFromModal,
  toggleSelectedCompanyStatus,
  toggleCompanyReport,
  alternarSucursalesHabilitadas,
  agregarSucursal,
  actualizarNombreSucursal,
  alternarEstadoSucursal,
  eliminarSucursal,
  actualizarSucursalActivo,
  getCompanyHealth,
} = useCompanyManagement()

const showConfigPanel = ref(false)

const openCompanyConfigPanel = (companyId) => {
  selectCompany(companyId)
  showConfigPanel.value = true
}

const enterCompanyWorkspace = (company) => {
  if (!company?.id) return

  router.push(getCompanyWorkspacePath(company))
}

const updateDraftCompany = (nextDraftCompany) => {
  draftCompany.value = nextDraftCompany
}
</script>
