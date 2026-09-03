import { useMockDatabase } from "../../composables/mock/useMockDatabase.js"

export const createMockCompaniesAdapter = () => {
  const {
    companies,
    companyRecords,
    reportTypes,
    getCompany,
    createCompany,
    updateCompany,
    updateAsset,
  } = useMockDatabase()

  return {
    companies,
    companyRecords,
    reportTypes,
    getCompany,
    createCompany,
    updateCompany,
    updateAsset,
  }
}
