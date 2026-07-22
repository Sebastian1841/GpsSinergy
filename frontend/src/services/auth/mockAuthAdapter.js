import { useMockDatabase } from "../../composables/mock/useMockDatabase.js"

export const createMockAuthAdapter = () => {
  const { users, accesses, applications, companies, roles } = useMockDatabase()

  return {
    users,
    accesses,
    applications,
    companies,
    roles,
  }
}
