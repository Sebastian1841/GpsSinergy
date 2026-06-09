import { computed, ref, watch } from "vue"

import { useMockDatabase } from "../mock/useMockDatabase.js"

const SESSION_KEY = "sinergy-auth-user-id"
const IMPERSONATED_USER_KEY = "sinergy-impersonated-user-id"
const IMPERSONATION_RETURN_KEY = "sinergy-impersonation-return-path"

const readSessionValue = (key) => {
  if (typeof window === "undefined") return null

  return window.sessionStorage.getItem(key)
}

const persistSessionValue = (key, value) => {
  if (typeof window === "undefined") return

  if (value) {
    window.sessionStorage.setItem(key, String(value))
    return
  }

  window.sessionStorage.removeItem(key)
}

const authenticatedUserId = ref(readSessionValue(SESSION_KEY))
const impersonatedUserId = ref(readSessionValue(IMPERSONATED_USER_KEY))

const { users, accesses, applications, companies, roles } = useMockDatabase()

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
    return {
      ok: false,
      message: "Usuario o contraseña incorrectos.",
    }
  }

  if (user.status === "pending") {
    return {
      ok: false,
      message: "La cuenta todavía está pendiente de activación.",
    }
  }

  if (user.status !== "active") {
    return {
      ok: false,
      message: "La cuenta se encuentra inactiva.",
    }
  }

  authenticatedUserId.value = String(user.id)
  persistSessionValue(SESSION_KEY, user.id)
  clearImpersonation()
  user.lastAccess = "Ahora"

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
  if (!canImpersonateUser(userId)) {
    return {
      ok: false,
      message: "No es posible abrir la vista de este usuario.",
    }
  }

  impersonatedUserId.value = String(userId)
  persistSessionValue(IMPERSONATED_USER_KEY, userId)
  persistSessionValue(IMPERSONATION_RETURN_KEY, returnPath)

  return {
    ok: true,
    user: impersonatedUser.value,
  }
}

const stopImpersonation = () => {
  const returnPath = readSessionValue(IMPERSONATION_RETURN_KEY) || "/usuarios"

  clearImpersonation()
  persistSessionValue(IMPERSONATION_RETURN_KEY, null)

  return {
    returnPath,
  }
}

const logout = () => {
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
