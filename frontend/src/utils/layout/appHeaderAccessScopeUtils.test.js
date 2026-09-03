import assert from "node:assert/strict"
import test from "node:test"

import {
  HEADER_USER_SEARCH_SCOPE_KEY,
  buildScopedHeaderUsers,
  filterActiveHeaderUsers,
} from "./appHeaderAccessScopeUtils.js"

const companies = [
  { id: "company-001", name: "Constructora Norte" },
  { id: "company-002", name: "Forestal Los Robles" },
]

const applications = [
  { id: "app-001", companyId: "company-001" },
  { id: "app-002", companyId: "company-002" },
]

const users = [
  { id: "user-001", name: "Admin", status: "active" },
  { id: "user-002", name: "Operador Norte", status: "active" },
  { id: "user-003", name: "Operador Forestal", status: "active" },
  { id: "user-004", name: "Pendiente", status: "pending" },
]

const accesses = [
  { id: "access-001", userId: "user-001", applicationId: "app-001" },
  { id: "access-002", userId: "user-002", applicationId: "app-001" },
  { id: "access-003", userId: "user-003", applicationId: "app-002" },
  { id: "access-004", userId: "user-004", applicationId: "app-001" },
]

test("buildScopedHeaderUsers exposes only users from companies with users-view", () => {
  const scopedUsers = buildScopedHeaderUsers({
    users,
    accesses,
    applications,
    companies,
    canAccessFunction: (functionId, companyId) => {
      return functionId === "users-view" && companyId === "company-001"
    },
  })

  assert.deepEqual(
    scopedUsers.map((user) => user.id),
    ["user-001", "user-002", "user-004"],
  )
  assert.deepEqual(scopedUsers[1][HEADER_USER_SEARCH_SCOPE_KEY], {
    companyIds: ["company-001"],
    companyNames: ["Constructora Norte"],
    fallbackPath: "",
  })
})

test("buildScopedHeaderUsers hides users when no company is viewable", () => {
  const scopedUsers = buildScopedHeaderUsers({
    users,
    accesses,
    applications,
    companies,
    canAccessFunction: () => false,
  })

  assert.deepEqual(scopedUsers, [])
})

test("buildScopedHeaderUsers keeps platform admin access global", () => {
  const scopedUsers = buildScopedHeaderUsers({
    users: [{ id: "user-999", name: "Sin acceso", status: "active" }],
    accesses,
    applications,
    companies,
    canAccessFunction: () => true,
    isPlatformAdmin: true,
  })

  assert.deepEqual(scopedUsers[0][HEADER_USER_SEARCH_SCOPE_KEY], {
    companyIds: [],
    companyNames: [],
    fallbackPath: "/usuarios",
  })
})

test("filterActiveHeaderUsers keeps only active scoped users", () => {
  const scopedUsers = buildScopedHeaderUsers({
    users,
    accesses,
    applications,
    companies,
    canAccessFunction: () => true,
  })

  assert.deepEqual(
    filterActiveHeaderUsers(scopedUsers).map((user) => user.id),
    ["user-001", "user-002", "user-003"],
  )
})
