import { createMockAuthAdapter } from "./mockAuthAdapter.js"

export const useAuthService = () => {
  return createMockAuthAdapter()
}
