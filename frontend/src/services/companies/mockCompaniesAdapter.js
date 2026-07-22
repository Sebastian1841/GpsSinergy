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
    addSucursal,
    updateSucursal,
    deleteSucursal,
  } = useMockDatabase()

  return {
    companies,
    companyRecords,
    reportTypes,
    getCompany,
    createCompany,
    updateCompany,
    updateAsset,
    addSucursal,
    updateSucursal,
    deleteSucursal,
  }
}
