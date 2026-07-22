import { createMockCompaniesAdapter } from "./mockCompaniesAdapter.js"

export const useCompaniesService = () => {
  return createMockCompaniesAdapter()
}
