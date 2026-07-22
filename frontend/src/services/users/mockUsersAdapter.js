import { useMockDatabase } from "../../composables/mock/useMockDatabase.js"

export const createMockUsersAdapter = () => {
  const {
    users,
    accesses,
    companies,
    applications,
    modules,
    moduleFunctions,
    permissions,
    scopes,
    roles,
    assets,
    createUser,
    updateUser,
    createAccess,
    deleteAccess,
  } = useMockDatabase()

  return {
    users,
    accesses,
    companies,
    applications,
    modules,
    moduleFunctions,
    permissions,
    scopes,
    roles,
    assets,
    createUser,
    updateUser,
    createAccess,
    deleteAccess,
  }
}
