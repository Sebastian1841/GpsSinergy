import { createMockAccessAdapter } from "./mockAccessAdapter.js"

export const useAccessService = () => {
  return createMockAccessAdapter()
}
