import { computed, ref, watch } from "vue"

import { useAuthService } from "../../services/auth/useAuthService.js"
import { appendAuditLog } from "../../services/audit/useAuditService.js"
import {
  readStorageValue,
  removeStorageValue,
  writeStorageValue,
} from "../../services/storage/browserStorage.js"

const SESSION_KEY = "sinergy-auth-user-id"
const IMPERSONATED_USER_KEY = "sinergy-impersonated-user-id"
const IMPERSONATION_RETURN_KEY = "sinergy-impersonation-return-path"

const readSessionValue = (key) => {
  return readStorageValue(key, { type: "session" })
}

const persistSessionValue = (key, value) => {
  if (value) {
    writeStorageValue(key, value, { type: "session" })
    return
  }

  removeStorageValue(key, { type: "session" })
}

const authenticatedUserId = ref(readSessionValue(SESSION_KEY))
const impersonatedUserId = ref(readSessionValue(IMPERSONATED_USER_KEY))

const { users, accesses, applications, companies, roles } = useAuthService()

const getUserAuditName = (user) => {
  return user?.name || user?.username || user?.email || "Usuario desconocido"
}

const recordAuthAudit = (entry = {}) => {
  appendAuditLog({
    module: "auth",
    entityType: "sesion",
    companyId: "",
    companyName: "Plataforma",
    ...entry,
  })
}

const authenticatedUser = computed(() => {
  return users.value.find((user) => String(user.id) === String(authenticatedUserId.value)) || null
})

const impersonatedUser = computed(() => {
  if (!impersonatedUserId.value) return null

  return users.value.find((user) => String(user.id) === String(impersonatedUserId.value)) || null
})

const currentUser = computed(() => {
  return impersonatedUser.value || authenticatedUser.value
})

const currentAccesses = computed(() => {
  if (!currentUser.value) return []

  return accesses.value.filter((access) => {
    return access.userId === currentUser.value.id && access.status === "active"
  })
})

const authenticatedUserIsPlatformAdmin = computed(() => {
  return Boolean(authenticatedUser.value?.isPlatformAdmin)
})

const isPlatformAdmin = computed(() => {
  return Boolean(currentUser.value?.isPlatformAdmin)
})

const isImpersonating = computed(() => {
  return Boolean(impersonatedUser.value && authenticatedUserIsPlatformAdmin.value)
})

const currentRole = computed(() => {
  if (isPlatformAdmin.value) {
    return {
      id: "platform-admin",
      name: "Administrador de plataforma",
    }
  }

  const rolePriority = ["admin", "supervisor", "operator", "technician", "viewer"]
  const activeRoleIds = new Set(currentAccesses.value.map((access) => access.role))
  const roleId = rolePriority.find((id) => activeRoleIds.has(id)) || currentAccesses.value[0]?.role

  return roles.value.find((role) => role.id === roleId) || null
})

const isAuthenticated = computed(() => {
  return Boolean(authenticatedUser.value && authenticatedUser.value.status === "active")
})

const defaultAuthenticatedRoute = computed(() => {
  if (isPlatformAdmin.value) return "/activos"

  const firstAssetsAccess = currentAccesses.value.find((access) => {
    const hasAssetsModule = access.modules?.some((moduleAccess) => {
      return moduleAccess.moduleId === "assets" && moduleAccess.enabled
    })
    const application = applications.value.find((item) => item.id === access.applicationId)
    const company = companies.value.find((item) => item.id === application?.companyId)

    return hasAssetsModule && (company?.status === "active" || company?.status === "internal")
  })
  const firstApplicationId = firstAssetsAccess?.applicationId
  const application = applications.value.find((item) => item.id === firstApplicationId)

  return application?.companyId ? `/app/${application.companyId}/activos` : "/sin-acceso"
})

const clearImpersonation = () => {
  impersonatedUserId.value = null
  persistSessionValue(IMPERSONATED_USER_KEY, null)
}

const clearSession = () => {
  authenticatedUserId.value = null
  persistSessionValue(SESSION_KEY, null)
  clearImpersonation()
  persistSessionValue(IMPERSONATION_RETURN_KEY, null)
}

watch(
  () => authenticatedUser.value?.status,
  (status) => {
    if (authenticatedUserId.value && status !== "active") {
      clearSession()
    }
  },
  { immediate: true },
)

watch(
  () => impersonatedUser.value?.status,
  (status) => {
    if (impersonatedUserId.value && status !== "active") {
      clearImpersonation()
    }
  },
  { immediate: true },
)

watch(authenticatedUserIsPlatformAdmin, (canImpersonate) => {
  if (!canImpersonate) clearImpersonation()
})

const login = ({ identifier, password }) => {
  const normalizedIdentifier = String(identifier || "")
    .trim()
    .toLowerCase()
  const normalizedPassword = String(password || "")

  const user = users.value.find((item) => {
    return [item.username, item.email].some((value) => {
      return (
        String(value || "")
          .trim()
          .toLowerCase() === normalizedIdentifier
      )
    })
  })

  if (!user || String(user.password || "") !== normalizedPassword) {
    recordAuthAudit({
      actorId: "anonymous",
      actorName: normalizedIdentifier || "Anonimo",
      action: "auth:login",
      entityName: normalizedIdentifier || "Sin usuario",
      status: "failed",
      severity: "warning",
      description: "Intento de inicio de sesion rechazado por credenciales invalidas.",
    })

    return {
      ok: false,
      message: "Usuario o contraseña incorrectos.",
    }
  }

  if (user.status === "pending") {
    recordAuthAudit({
      actorId: user.id,
      actorName: getUserAuditName(user),
      action: "auth:login",
      entityName: getUserAuditName(user),
      status: "failed",
      severity: "warning",
      description: "Intento de inicio de sesion con cuenta pendiente de activacion.",
    })

    return {
      ok: false,
      message: "La cuenta todavía está pendiente de activación.",
    }
  }

  if (user.status !== "active") {
    recordAuthAudit({
      actorId: user.id,
      actorName: getUserAuditName(user),
      action: "auth:login",
      entityName: getUserAuditName(user),
      status: "failed",
      severity: "warning",
      description: "Intento de inicio de sesion con cuenta inactiva.",
    })

    return {
      ok: false,
      message: "La cuenta se encuentra inactiva.",
    }
  }

  authenticatedUserId.value = String(user.id)
  persistSessionValue(SESSION_KEY, user.id)
  clearImpersonation()
  user.lastAccess = "Ahora"

  recordAuthAudit({
    actorId: user.id,
    actorName: getUserAuditName(user),
    action: "auth:login",
    entityName: getUserAuditName(user),
    status: "success",
    severity: "info",
    description: "Sesion iniciada correctamente.",
  })

  return {
    ok: true,
    user,
  }
}

const canImpersonateUser = (userId) => {
  const target = users.value.find((user) => String(user.id) === String(userId))

  return Boolean(
    authenticatedUserIsPlatformAdmin.value &&
    target &&
    target.status === "active" &&
    String(target.id) !== String(authenticatedUser.value?.id),
  )
}

const startImpersonation = (userId, returnPath = "/usuarios") => {
  const target = users.value.find((user) => String(user.id) === String(userId))

  if (!canImpersonateUser(userId)) {
    return {
      ok: false,
      message: "No es posible abrir la vista de este usuario.",
    }
  }

  impersonatedUserId.value = String(userId)
  persistSessionValue(IMPERSONATED_USER_KEY, userId)
  persistSessionValue(IMPERSONATION_RETURN_KEY, returnPath)

  recordAuthAudit({
    actorId: authenticatedUser.value?.id || "system",
    actorName: getUserAuditName(authenticatedUser.value),
    action: "auth:impersonation:start",
    entityType: "usuario",
    entityName: getUserAuditName(target),
    status: "success",
    severity: "warning",
    description: `Se inicio vista como ${getUserAuditName(target)}.`,
  })

  return {
    ok: true,
    user: impersonatedUser.value,
  }
}

const stopImpersonation = () => {
  const returnPath = readSessionValue(IMPERSONATION_RETURN_KEY) || "/usuarios"
  const target = impersonatedUser.value

  clearImpersonation()
  persistSessionValue(IMPERSONATION_RETURN_KEY, null)

  recordAuthAudit({
    actorId: authenticatedUser.value?.id || "system",
    actorName: getUserAuditName(authenticatedUser.value),
    action: "auth:impersonation:stop",
    entityType: "usuario",
    entityName: getUserAuditName(target),
    status: "success",
    severity: "info",
    description: `Se cerro la vista como ${getUserAuditName(target)}.`,
  })

  return {
    returnPath,
  }
}

const logout = () => {
  const user = currentUser.value

  if (user) {
    recordAuthAudit({
      actorId: user.id,
      actorName: getUserAuditName(user),
      action: "auth:logout",
      entityName: getUserAuditName(user),
      status: "success",
      severity: "info",
      description: "Sesion cerrada correctamente.",
    })
  }

  clearSession()
}

export function useAuthSession() {
  return {
    authenticatedUser,
    currentUser,
    currentAccesses,
    currentRole,
    isAuthenticated,
    isPlatformAdmin,
    isImpersonating,
    defaultAuthenticatedRoute,
    login,
    logout,
    canImpersonateUser,
    startImpersonation,
    stopImpersonation,
  }
}
