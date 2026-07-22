import { useMockDatabase } from "../../composables/mock/useMockDatabase.js"

export const createMockReportsAdapter = () => {
  const { companyRecords, reportTypes } = useMockDatabase()

  return {
    companyRecords,
    reportTypes,
  }
}
