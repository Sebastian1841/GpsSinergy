import { useMockDatabase } from "../../composables/mock/useMockDatabase.js"

export const createMockAccessAdapter = () => {
  const { companies, applications, assets, moduleFunctions } = useMockDatabase()

  return {
    companies,
    applications,
    assets,
    moduleFunctions,
  }
}
