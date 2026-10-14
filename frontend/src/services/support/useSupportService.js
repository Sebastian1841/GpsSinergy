import { readJsonStorage, writeJsonStorage } from "../storage/browserStorage.js"
import { createSupportRequestStore } from "./supportRequestStore.js"
let store
export const useSupportService = () => {
  if (!store)
    store = createSupportRequestStore({
      read: () => readJsonStorage("sinergy-support-requests-v1", []),
      write: (rows) => writeJsonStorage("sinergy-support-requests-v1", rows),
    })
  return store
}
