import { computed, onBeforeUnmount, ref, shallowRef, watch } from "vue"

const ASSETS_PER_PAGE = 25
const SEARCH_DELAY_MS = 100

export function useFleetAssetTagModal({ props, emit }) {
  const name = ref("")
  const search = ref("")
  const debouncedSearch = ref("")
  const filter = ref("all")
  const page = ref(1)
  const selectedIds = shallowRef(new Set())

  let searchTimer = null
  let previousBodyOverflow = ""

  const selectedCount = computed(() => {
    return selectedIds.value.size
  })

  const searchedAssets = computed(() => {
    const term = debouncedSearch.value

    if (!term) return props.assets

    return props.assets.filter((asset) => {
      return asset.searchText.includes(term)
    })
  })

  const filteredAssets = computed(() => {
    if (filter.value === "all") {
      return searchedAssets.value
    }

    const selected = selectedIds.value

    return searchedAssets.value.filter((asset) => {
      const isSelected = selected.has(asset.id)

      return filter.value === "selected" ? isSelected : !isSelected
    })
  })

  const totalPages = computed(() => {
    return Math.max(1, Math.ceil(filteredAssets.value.length / ASSETS_PER_PAGE))
  })

  const pageAssets = computed(() => {
    const start = (page.value - 1) * ASSETS_PER_PAGE

    return filteredAssets.value.slice(start, start + ASSETS_PER_PAGE)
  })

  const firstVisibleAsset = computed(() => {
    if (!filteredAssets.value.length) return 0

    return (page.value - 1) * ASSETS_PER_PAGE + 1
  })

  const lastVisibleAsset = computed(() => {
    return Math.min(page.value * ASSETS_PER_PAGE, filteredAssets.value.length)
  })

  const currentPageFullySelected = computed(() => {
    return (
      pageAssets.value.length > 0 &&
      pageAssets.value.every((asset) => {
        return selectedIds.value.has(asset.id)
      })
    )
  })

  const isSelected = (assetId) => {
    return selectedIds.value.has(String(assetId))
  }

  const replaceSelection = (callback) => {
    const nextSelectedIds = new Set(selectedIds.value)

    callback(nextSelectedIds)

    selectedIds.value = nextSelectedIds
  }

  const setFilter = (nextFilter) => {
    filter.value = nextFilter
    page.value = 1
  }

  const toggleAsset = (assetId) => {
    const id = String(assetId)

    replaceSelection((selection) => {
      if (selection.has(id)) {
        selection.delete(id)
      } else {
        selection.add(id)
      }
    })
  }

  const clearSelection = () => {
    selectedIds.value = new Set()

    if (filter.value === "selected") {
      filter.value = "all"
    }

    page.value = 1
  }

  const toggleCurrentPageSelection = () => {
    const remove = currentPageFullySelected.value

    replaceSelection((selection) => {
      pageAssets.value.forEach((asset) => {
        if (remove) {
          selection.delete(asset.id)
        } else {
          selection.add(asset.id)
        }
      })
    })
  }

  const previousPage = () => {
    if (page.value > 1) {
      page.value -= 1
    }
  }

  const nextPage = () => {
    if (page.value < totalPages.value) {
      page.value += 1
    }
  }

  const reset = () => {
    name.value = props.tagName
    search.value = ""
    debouncedSearch.value = ""
    filter.value = "all"
    page.value = 1

    selectedIds.value = new Set(props.selectedAssetIds.map(String))
  }

  const save = () => {
    const normalizedName = name.value.trim()

    if (!normalizedName) return

    emit("save", {
      name: normalizedName,
      assetIds: Array.from(selectedIds.value),
    })
  }

  const lockBodyScroll = () => {
    if (typeof document === "undefined") return

    previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
  }

  const unlockBodyScroll = () => {
    if (typeof document === "undefined") return

    document.body.style.overflow = previousBodyOverflow
    previousBodyOverflow = ""
  }

  const handleKeydown = (event) => {
    if (event.key === "Escape") {
      emit("close")
    }
  }

  const addKeyListener = () => {
    if (typeof window !== "undefined") {
      window.addEventListener("keydown", handleKeydown)
    }
  }

  const removeKeyListener = () => {
    if (typeof window !== "undefined") {
      window.removeEventListener("keydown", handleKeydown)
    }
  }

  watch(
    () => props.open,
    (isOpen) => {
      if (isOpen) {
        reset()
        lockBodyScroll()
        addKeyListener()

        return
      }

      unlockBodyScroll()
      removeKeyListener()
    },
    {
      immediate: true,
    },
  )

  watch(search, (value) => {
    if (searchTimer !== null) {
      clearTimeout(searchTimer)
    }

    searchTimer = setTimeout(() => {
      debouncedSearch.value = value.trim().toLowerCase()
      page.value = 1
      searchTimer = null
    }, SEARCH_DELAY_MS)
  })

  watch(totalPages, (pages) => {
    if (page.value > pages) {
      page.value = pages
    }
  })

  onBeforeUnmount(() => {
    if (searchTimer !== null) {
      clearTimeout(searchTimer)
    }

    removeKeyListener()
    unlockBodyScroll()
  })

  return {
    name,
    search,
    filter,
    page,
    selectedCount,
    filteredAssets,
    pageAssets,
    totalPages,
    firstVisibleAsset,
    lastVisibleAsset,
    currentPageFullySelected,
    isSelected,
    setFilter,
    toggleAsset,
    clearSelection,
    toggleCurrentPageSelection,
    previousPage,
    nextPage,
    save,
  }
}
