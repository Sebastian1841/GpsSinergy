import { computed, ref, watch } from "vue"

export const useMaintenanceTypeCatalog = ({ types, origins, readingSource, search, criterion, mode, selected }) => {
  const originFilter = ref("all")
  const page = ref(1)
  const pageSize = ref(10)
  const direction = ref(0)
  const filtered = computed(() => {
    const query = search.value.trim().toLocaleLowerCase("es")
    return types().filter((type) =>
      !(mode.value === "edit" && type === selected.value) &&
      (!query || type.toLocaleLowerCase("es").includes(query)) &&
      (criterion.value === "all" || readingSource(type) === criterion.value) &&
      (originFilter.value === "all" || (origins()[type] || "factory") === originFilter.value),
    )
  })
  const sorted = computed(() => direction.value
    ? [...filtered.value].sort((a, b) => direction.value * a.localeCompare(b, "es", { numeric: true }))
    : filtered.value)
  const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize.value)))
  const displayed = computed(() => sorted.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value))
  const toggleSort = () => { direction.value = direction.value === 1 ? -1 : 1 }
  watch([search, criterion, originFilter, pageSize], () => { page.value = 1 })
  watch(pageCount, (count) => { page.value = Math.min(page.value, count) })
  return { originFilter, page, pageSize, direction, filtered, pageCount, displayed, toggleSort }
}
