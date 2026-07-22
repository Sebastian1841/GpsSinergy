import { createMockUsersAdapter } from "./mockUsersAdapter.js"

export const useUsersService = () => {
  return createMockUsersAdapter()
}
