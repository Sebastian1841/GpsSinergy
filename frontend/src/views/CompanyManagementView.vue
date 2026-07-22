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
      @alternar-sucursales-habilitadas="alternarSucursalesHabilitadas"
      @agregar-sucursal="agregarSucursal"
      @actualizar-nombre-sucursal="actualizarNombreSucursal"
      @alternar-estado-sucursal="alternarEstadoSucursal"
      @eliminar-sucursal="eliminarSucursal"
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

import { useAuditTrail } from "../composables/audit/useAuditTrail.js"
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
  saveCompanyFromModal: saveCompanyFromModalBase,
  toggleSelectedCompanyStatus: toggleSelectedCompanyStatusBase,
  alternarSucursalesHabilitadas: alternarSucursalesHabilitadasBase,
  agregarSucursal: agregarSucursalBase,
  actualizarNombreSucursal: actualizarNombreSucursalBase,
  alternarEstadoSucursal: alternarEstadoSucursalBase,
  eliminarSucursal: eliminarSucursalBase,
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

const alternarSucursalesHabilitadas = () => {
  const company = selectedCompany.value
  const previousEnabled = company?.sucursalesHabilitadas !== false

  alternarSucursalesHabilitadasBase()

  if (!company || previousEnabled === (company.sucursalesHabilitadas !== false)) return

  recordCompanyAudit({
    action: "branch:toggle",
    company,
    entityType: "sucursales",
    entityName: "Sucursales",
    description: "Se cambio la configuracion de sucursales de la empresa.",
    metadata: {
      previousEnabled,
      nextEnabled: company.sucursalesHabilitadas !== false,
    },
  })
}

const agregarSucursal = (nombreSucursal) => {
  const company = selectedCompany.value
  const previousBranchCount = company?.sucursales?.length || 0

  agregarSucursalBase(nombreSucursal)

  if (!company || (company.sucursales?.length || 0) <= previousBranchCount) return

  const branch = company.sucursales[company.sucursales.length - 1]

  recordCompanyAudit({
    action: "branch:create",
    company,
    entityType: "sucursal",
    entityName: branch?.name || nombreSucursal || "Sucursal",
    description: "Se creo una sucursal.",
    metadata: {
      branchId: branch?.id || "",
    },
  })
}

const actualizarNombreSucursal = (sucursalId, nombreSucursal) => {
  const company = selectedCompany.value
  const branch = company?.sucursales?.find((item) => String(item.id) === String(sucursalId))
  const previousName = branch?.name

  actualizarNombreSucursalBase(sucursalId, nombreSucursal)

  if (!company || !branch || previousName === branch.name) return

  recordCompanyAudit({
    action: "branch:rename",
    company,
    entityType: "sucursal",
    entityName: branch.name || nombreSucursal || "Sucursal",
    description: "Se renombro una sucursal.",
    metadata: {
      branchId: sucursalId,
      previousName,
    },
  })
}

const alternarEstadoSucursal = (sucursalId) => {
  const company = selectedCompany.value
  const branch = company?.sucursales?.find((item) => String(item.id) === String(sucursalId))
  const previousActive = branch?.active !== false

  alternarEstadoSucursalBase(sucursalId)

  if (!company || !branch || previousActive === (branch.active !== false)) return

  recordCompanyAudit({
    action: "branch:status",
    company,
    entityType: "sucursal",
    entityName: branch.name || "Sucursal",
    description: "Se cambio el estado de una sucursal.",
    metadata: {
      branchId: sucursalId,
      previousActive,
      nextActive: branch.active !== false,
    },
  })
}

const eliminarSucursal = (sucursalId) => {
  const company = selectedCompany.value
  const branch = company?.sucursales?.find((item) => String(item.id) === String(sucursalId))

  eliminarSucursalBase(sucursalId)

  const stillExists = company?.sucursales?.some((item) => String(item.id) === String(sucursalId))

  if (!company || !branch || stillExists) return

  recordCompanyAudit({
    action: "branch:delete",
    company,
    entityType: "sucursal",
    entityName: branch.name || "Sucursal",
    severity: "warning",
    description: "Se elimino una sucursal.",
    metadata: {
      branchId: sucursalId,
    },
  })
}
</script>
