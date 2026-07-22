import { readonly, ref } from "vue"

const isRouteComparisonModalOpen = ref(false)

export const useRouteComparisonUiState = () => {
  const setRouteComparisonModalOpen = (isOpen) => {
    isRouteComparisonModalOpen.value = Boolean(isOpen)
  }

  return {
    isRouteComparisonModalOpen: readonly(isRouteComparisonModalOpen),
    setRouteComparisonModalOpen,
  }
}
