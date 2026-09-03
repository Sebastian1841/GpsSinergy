<template>
  <section class="h-full min-h-0 bg-[#eef2f7]">
    <div class="grid h-full min-h-0 grid-rows-[auto_1fr]">
      <CompanyManagementHeader
        :search-term="searchTerm"
        :selected-status="selectedStatus"
        :summary-items="summaryItems"
        @clear-filters="clearFilters"
        @create-company="openCreateCompanyModal"
        @select-status="selectedStatus = $event"
        @update:search-term="searchTerm = $event"
      />

      <main class="min-h-0 overflow-y-auto bg-[#f6f8fb] px-4 pb-6 sm:px-8">
        <CompanyCatalog
          :companies="visibleCompanies"
          :selected-company-id="selectedCompanyId || ''"
          :visible-companies-remaining="visibleCompaniesRemaining"
          :can-show-more="canShowMoreCompanies"
          :get-company-health="getCompanyHealth"
          @configure-company="openCompanyConfigPanel"
          @enter-company="enterCompanyWorkspace"
          @clear-filters="clearFilters"
          @select-company="selectCompany"
          @show-more="showMoreCompanies"
        />
      </main>
    </div>

    <CompanyConfigPanel
      v-if="showConfigPanel"
      :model-value="showConfigPanel"
      :company="selectedCompany"
      :report-types="reportTypes"
      :get-company-health="getCompanyHealth"
      @close="showConfigPanel = false"
      @edit-company="openEditCompanyModal"
      @toggle-company-status="toggleSelectedCompanyStatus"
      @enter-company="enterCompanyWorkspace"
    />

    <CompanyEditorModal
      v-if="showEditorModal"
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
import { defineAsyncComponent, onMounted, ref } from "vue"
import { useRouter } from "vue-router"

import CompanyCatalog from "../components/companies/CompanyCatalog.vue"
import CompanyManagementHeader from "../components/companies/CompanyManagementHeader.vue"

import { useAuditTrail } from "../composables/audit/useAuditTrail.js"
import { useCompanyManagement } from "../composables/companies/useCompanyManagement.js"
import { preloadWhenIdle } from "../composables/ui/useIdlePreload.js"
import { getCompanyWorkspacePath } from "../utils/companies/companyUtils.js"

const loadCompanyConfigPanel = () => import("../components/companies/CompanyConfigPanel.vue")
const loadCompanyEditorModal = () => import("../components/companies/CompanyEditorModal.vue")

const CompanyConfigPanel = defineAsyncComponent(loadCompanyConfigPanel)
const CompanyEditorModal = defineAsyncComponent(loadCompanyEditorModal)

const router = useRouter()

const {
  reportTypes,

  searchTerm,
  selectedStatus,
  selectedCompanyId,
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
  saveCompanyFromModal: saveCompanyFromModalBase,
  toggleSelectedCompanyStatus: toggleSelectedCompanyStatusBase,
  getCompanyHealth,
} = useCompanyManagement()

const showConfigPanel = ref(false)
const { recordAudit } = useAuditTrail()

const getCompanyAuditName = (company = {}) => {
  return company.name || company.shortName || company.id || "Empresa"
}

const recordCompanyAudit = ({
  action,
  company,
  entityType = "empresa",
  entityName = getCompanyAuditName(company),
  description,
  severity = "info",
  metadata = {},
}) => {
  if (!company) return

  recordAudit({
    companyId: company.id || "",
    companyName: company.name || "",
    module: "empresas",
    action,
    entityType,
    entityName,
    severity,
    description,
    metadata: {
      companyId: company.id,
      ...metadata,
    },
  })
}

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

const saveCompanyFromModal = () => {
  const mode = editorMode.value
  const draftSnapshot = {
    ...draftCompany.value,
  }
  const previousSelectedCompanyId = selectedCompany.value?.id

  saveCompanyFromModalBase()

  const company =
    mode === "create"
      ? selectedCompany.value
      : selectedCompany.value?.id === draftSnapshot.id
        ? selectedCompany.value
        : null

  if (!company) return

  if (mode === "create" && company.id !== previousSelectedCompanyId) {
    recordCompanyAudit({
      action: "company:create",
      company,
      description: "Se creo una empresa.",
    })
    return
  }

  if (mode === "edit") {
    recordCompanyAudit({
      action: "company:update",
      company,
      description: "Se actualizo la ficha de una empresa.",
      metadata: {
        changedFields: Object.keys(draftSnapshot),
      },
    })
  }
}

const toggleSelectedCompanyStatus = () => {
  const company = selectedCompany.value
  const previousStatus = company?.status

  toggleSelectedCompanyStatusBase()

  if (!company || previousStatus === company.status) return

  recordCompanyAudit({
    action: "company:status",
    company,
    severity: "warning",
    description: "Se cambio el estado de una empresa.",
    metadata: {
      previousStatus,
      nextStatus: company.status,
    },
  })
}

onMounted(() => {
  preloadWhenIdle([loadCompanyConfigPanel, loadCompanyEditorModal])
})
</script>
