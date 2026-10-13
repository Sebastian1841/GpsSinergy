import { computed, ref, watch } from "vue"

export const useUnreportedPagination = (rows, resetSources = []) => {
  const page = ref(1)
  const pageSize = ref(10)
  const totalPages = computed(() => Math.max(1, Math.ceil(rows.value.length / pageSize.value)))
  const currentPage = computed(() => Math.min(Math.max(1, page.value), totalPages.value))
  const offset = computed(() => (currentPage.value - 1) * pageSize.value)
  const visibleRows = computed(() => rows.value.slice(offset.value, offset.value + pageSize.value))
  const firstRow = computed(() => rows.value.length ? offset.value + 1 : 0)
  const lastRow = computed(() => offset.value + visibleRows.value.length)
  watch([pageSize, ...resetSources], () => { page.value = 1 }, { flush: "sync" })
  watch(totalPages, () => { page.value = currentPage.value }, { flush: "sync" })
  const changePage = (delta) => {
    page.value = Math.min(totalPages.value, Math.max(1, currentPage.value + delta))
  }
  return { pageSize, currentPage, totalPages, visibleRows, firstRow, lastRow, changePage }
}
