import { computed, unref } from "vue"
import { useRoute } from "vue-router"

import { useAuthSession } from "../auth/useAuthSession.js"
import { useAccessService } from "../../services/access/useAccessService.js"
import { appendAuditLog } from "../../services/audit/useAuditService.js"
import { normalizeId } from "../../utils/idUtils.js"

const getUserAuditName = (user) => {
  return user?.name || user?.username || user?.email || "Sistema"
}

export function useAuditTrail({ companyId = null } = {}) {
  const route = useRoute()
  const { currentUser } = useAuthSession()
  const { companies } = useAccessService()

  const resolvedCompanyId = computed(() => {
    return normalizeId(unref(companyId) || route.params.empresaId || "")
  })

  const companiesById = computed(() => {
    return new Map(companies.value.map((company) => [normalizeId(company.id), company]))
  })

  const recordAudit = (entry = {}) => {
    const explicitCompanyId = entry.companyId === undefined ? null : normalizeId(entry.companyId)
    const auditCompanyId = explicitCompanyId ?? resolvedCompanyId.value
    const company = auditCompanyId ? companiesById.value.get(auditCompanyId) : null
    const auditCompanyName =
      entry.companyName || company?.name || (auditCompanyId ? "Empresa" : "Plataforma")
    const user = currentUser.value
    const { companyId: _companyId, companyName: _companyName, ...auditEntry } = entry

    return appendAuditLog({
      actorId: user?.id || "system",
      actorName: getUserAuditName(user),
      companyId: auditCompanyId,
      companyName: auditCompanyName,
      status: "success",
      severity: "info",
      ...auditEntry,
    })
  }

  return {
    recordAudit,
  }
}
