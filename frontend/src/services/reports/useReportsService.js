import { createMockReportsAdapter } from "./mockReportsAdapter.js"

export const useReportsService = () => {
  return createMockReportsAdapter()
}
