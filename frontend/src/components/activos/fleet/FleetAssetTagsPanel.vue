<template>
  <div class="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f4f7fb]">
    <div class="shrink-0 border-b border-[#d8dee8] bg-white px-4 py-3">
      <div class="flex items-center justify-between gap-4">
        <div class="min-w-0">
          <h3 class="text-[14px] font-black text-[#102372]">Etiquetas</h3>

          <p class="mt-0.5 text-[10px] font-semibold text-slate-500">
            Organiza los activos mediante etiquetas.
          </p>
        </div>

        <button
          v-if="canManageAssetTags"
          type="button"
          class="flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-lg bg-[#FF6600] px-3.5 text-[10px] font-black text-white transition hover:bg-[#e95d00]"
          @click="openCreateModal"
        >
          <span class="text-[16px] font-medium leading-none">+</span>
          Nueva etiqueta
        </button>
      </div>
    </div>

    <div
      class="flex min-h-[42px] shrink-0 items-center justify-between gap-3 border-b border-[#e7ebf0] bg-[#f8fafc] px-4"
    >
      <div class="flex min-w-0 items-center gap-2">
        <p class="text-[10px] font-bold text-slate-500">
          {{ filteredAssetTags.length }}
          {{ filteredAssetTags.length === 1 ? "etiqueta" : "etiquetas" }}
        </p>

        <template v-if="normalizedAssetTagSearch">
          <span class="text-slate-300">-</span>

          <p class="truncate text-[9px] font-semibold text-slate-400">
            Resultados para "{{ search.trim() }}"
          </p>
        </template>
      </div>

      <p class="shrink-0 text-[9px] font-semibold text-slate-400">
        {{ availableAssetCount }}
        {{ availableAssetCount === 1 ? "activo disponible" : "activos disponibles" }}
      </p>
    </div>

    <div class="min-h-0 flex-1 overflow-auto p-3">
      <div v-if="paginatedAssetTags.length" class="space-y-2.5">
        <article
          v-for="tag in paginatedAssetTags"
          :key="tag.id"
          class="rounded-xl border border-[#d8dee8] bg-white px-3.5 py-3 transition hover:border-[#bec8d8] hover:shadow-[0_4px_16px_rgba(15,23,42,0.05)]"
        >
          <div class="flex items-center gap-3">
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef3ff] text-[14px] font-black text-[#102372]"
            >
              #
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex min-w-0 items-center gap-2">
                <h4 class="truncate text-[11px] font-black text-[#102372]">
                  {{ tag.name }}
                </h4>

                <span
                  class="shrink-0 rounded-full px-2 py-0.5 text-[8px] font-black"
                  :class="
                    tag.active !== false
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                  "
                >
                  {{ tag.active !== false ? "Activa" : "Inactiva" }}
                </span>
              </div>

              <p class="mt-0.5 text-[9px] font-black text-[#102372]">
                {{ getAssetTagAssetCount(tag.id) }}
                {{ getAssetTagAssetCount(tag.id) === 1 ? "activo asignado" : "activos asignados" }}
              </p>
            </div>

            <div v-if="canManageAssetTags" class="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                class="h-8 cursor-pointer rounded-lg border border-[#d8dee8] bg-white px-3 text-[9px] font-black text-[#102372] transition hover:border-[#102372] hover:bg-[#f8faff]"
                @click="openEditModal(tag)"
              >
                Editar
              </button>

              <button
                type="button"
                class="h-8 cursor-pointer rounded-lg border border-red-100 bg-white px-2.5 text-[9px] font-black text-red-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                @click="handleDeleteAssetTag(tag)"
              >
                Eliminar
              </button>
            </div>
          </div>
        </article>
      </div>

      <div
        v-else
        class="flex min-h-[260px] items-center justify-center rounded-xl border border-dashed border-[#cbd5e1] bg-white p-6 text-center"
      >
        <div class="max-w-[280px]">
          <div
            class="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef3ff] text-[18px] font-black text-[#102372]"
          >
            #
          </div>

          <p class="mt-3 text-[12px] font-black text-[#102372]">
            {{ assetTags.length ? "No encontramos etiquetas" : "Aun no hay etiquetas" }}
          </p>

          <p class="mt-1 text-[10px] font-semibold leading-4 text-slate-500">
            {{
              assetTags.length
                ? "Prueba utilizando otro termino de busqueda."
                : "Crea una etiqueta para comenzar a organizar tus activos."
            }}
          </p>

          <button
            v-if="!assetTags.length && canManageAssetTags"
            type="button"
            class="mt-4 h-9 cursor-pointer rounded-lg bg-[#FF6600] px-4 text-[10px] font-black text-white transition hover:bg-[#e95d00]"
            @click="openCreateModal"
          >
            Crear primera etiqueta
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="filteredAssetTags.length"
      class="flex min-h-[48px] shrink-0 items-center justify-between gap-3 border-t border-[#d8dee8] bg-white px-4"
    >
      <p class="text-[9px] font-semibold text-slate-400">
        Mostrando
        {{ firstVisibleTagNumber }}-{{ lastVisibleTagNumber }} de {{ filteredAssetTags.length }}
      </p>

      <div v-if="totalPages > 1" class="flex items-center gap-1">
        <button
          type="button"
          class="flex h-7 w-7 items-center justify-center rounded-lg border border-[#d8dee8] bg-white text-[14px] font-bold text-[#102372] transition hover:border-[#102372] disabled:cursor-not-allowed disabled:opacity-30"
          :disabled="currentPage <= 1"
          @click="previousPage"
        >
          &lt;
        </button>

        <div
          class="flex h-7 min-w-[58px] items-center justify-center rounded-lg bg-[#eef3ff] px-2 text-[9px] font-black text-[#102372]"
        >
          {{ currentPage }} / {{ totalPages }}
        </div>

        <button
          type="button"
          class="flex h-7 w-7 items-center justify-center rounded-lg border border-[#d8dee8] bg-white text-[14px] font-bold text-[#102372] transition hover:border-[#102372] disabled:cursor-not-allowed disabled:opacity-30"
          :disabled="currentPage >= totalPages"
          @click="nextPage"
        >
          &gt;
        </button>
      </div>
    </div>

    <FleetAssetTagModal
      :open="editorOpen"
      :mode="editorMode"
      :tag-name="editorAssetTagName"
      :assets="editorAssetCatalog"
      :selected-asset-ids="editorSelectedAssetIds"
      @close="closeEditor"
      @save="handleSaveAssetTag"
    />
  </div>
</template>

<script setup>
import { computed, markRaw, onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue"

import FleetAssetTagModal from "./FleetAssetTagModal.vue"

const TAGS_PER_PAGE = 6
const TAG_INDEX_REFRESH_INTERVAL_MS = 1000

const props = defineProps({
  activos: {
    type: Array,
    default: () => [],
  },
  allActivos: {
    type: Array,
    default: () => [],
  },
  assetTags: {
    type: Array,
    default: () => [],
  },
  canManageAssetTags: {
    type: Boolean,
    default: false,
  },
  search: {
    type: String,
    default: "",
  },
})

const emit = defineEmits(["create-asset-tag", "update-asset-tag", "delete-asset-tag"])

const currentPage = ref(1)

const editorOpen = ref(false)
const editorMode = ref("create")
const editingAssetTagId = ref(null)
const editorAssetTagName = ref("")
const editorAssetCatalog = shallowRef([])
const editorSelectedAssetIds = shallowRef([])

const assetTagAssetCounts = shallowRef(new Map())

let tagIndexRefreshTimer = null
let tagIndexRefreshPending = false

const normalizeValue = (value) => {
  return String(value ?? "").trim()
}

const normalizeSearchValue = (value) => {
  return normalizeValue(value).toLowerCase()
}

const normalizeAssetTagIds = (assetTagIds) => {
  if (!Array.isArray(assetTagIds)) return []

  return [...new Set(assetTagIds.map((tagId) => normalizeValue(tagId)).filter(Boolean))]
}

const sourceActivos = computed(() => {
  return props.allActivos.length ? props.allActivos : props.activos
})

const availableAssetCount = computed(() => {
  return sourceActivos.value.length
})

const getAssetDisplayName = (activo) => {
  return (
    normalizeValue(activo?.displayName) ||
    normalizeValue(activo?.name) ||
    normalizeValue(activo?.nombre) ||
    normalizeValue(activo?.patente) ||
    normalizeValue(activo?.plate) ||
    `Activo ${normalizeValue(activo?.id)}`
  )
}

const getAssetSecondaryLabel = (activo) => {
  const values = [
    activo?.patente || activo?.plate,
    activo?.imei,
    activo?.trackerModelLabel || activo?.trackerModel,
  ]
    .map((value) => normalizeValue(value))
    .filter(Boolean)

  return [...new Set(values)].join(" - ")
}

const getAssetTypeLabel = (activo) => {
  return normalizeValue(activo?.vehicleType || activo?.assetType || activo?.tipo || activo?.type)
}

const buildEditorAssetCatalog = () => {
  const activosById = new Map()

  sourceActivos.value.forEach((activo) => {
    const id = normalizeValue(activo?.id)

    if (!id || activosById.has(id)) return

    const displayName = getAssetDisplayName(activo)
    const secondaryLabel = getAssetSecondaryLabel(activo)
    const typeLabel = getAssetTypeLabel(activo)
    const assetTagIds = normalizeAssetTagIds(activo?.assetTagIds)

    activosById.set(
      id,
      markRaw({
        id,
        displayName,
        secondaryLabel,
        typeLabel,
        assetTagIds,
        searchText: normalizeSearchValue(
          [
            displayName,
            secondaryLabel,
            typeLabel,
            activo?.patente,
            activo?.plate,
            activo?.imei,
            activo?.trackerModel,
            activo?.trackerModelLabel,
          ]
            .filter(Boolean)
            .join(" "),
        ),
      }),
    )
  })

  editorAssetCatalog.value = markRaw(Array.from(activosById.values()))
}

const rebuildAssetTagIndexes = () => {
  const counts = new Map()
  const processedAssetIds = new Set()

  sourceActivos.value.forEach((activo) => {
    const assetId = normalizeValue(activo?.id)

    if (!assetId || processedAssetIds.has(assetId)) return

    processedAssetIds.add(assetId)

    normalizeAssetTagIds(activo?.assetTagIds).forEach((tagId) => {
      counts.set(tagId, (counts.get(tagId) || 0) + 1)
    })
  })

  assetTagAssetCounts.value = counts
}

const scheduleAssetTagIndexRefresh = () => {
  if (tagIndexRefreshTimer !== null) {
    tagIndexRefreshPending = true
    return
  }

  tagIndexRefreshTimer = setTimeout(() => {
    tagIndexRefreshTimer = null

    rebuildAssetTagIndexes()

    if (tagIndexRefreshPending) {
      tagIndexRefreshPending = false
      scheduleAssetTagIndexRefresh()
    }
  }, TAG_INDEX_REFRESH_INTERVAL_MS)
}

const getAssetTagAssetCount = (tagId) => {
  return assetTagAssetCounts.value.get(normalizeValue(tagId)) || 0
}

const normalizedAssetTagSearch = computed(() => {
  return normalizeSearchValue(props.search)
})

const filteredAssetTags = computed(() => {
  const term = normalizedAssetTagSearch.value

  if (!term) return props.assetTags

  return props.assetTags.filter((tag) => {
    return normalizeSearchValue(tag?.name).includes(term)
  })
})

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredAssetTags.value.length / TAGS_PER_PAGE))
})

const paginatedAssetTags = computed(() => {
  const start = (currentPage.value - 1) * TAGS_PER_PAGE

  return filteredAssetTags.value.slice(start, start + TAGS_PER_PAGE)
})

const firstVisibleTagNumber = computed(() => {
  if (!filteredAssetTags.value.length) return 0

  return (currentPage.value - 1) * TAGS_PER_PAGE + 1
})

const lastVisibleTagNumber = computed(() => {
  return Math.min(currentPage.value * TAGS_PER_PAGE, filteredAssetTags.value.length)
})

const previousPage = () => {
  if (currentPage.value <= 1) return

  currentPage.value -= 1
}

const nextPage = () => {
  if (currentPage.value >= totalPages.value) return

  currentPage.value += 1
}

const resetEditor = () => {
  editorMode.value = "create"
  editingAssetTagId.value = null
  editorAssetTagName.value = ""
  editorAssetCatalog.value = []
  editorSelectedAssetIds.value = []
}

const openCreateModal = () => {
  if (!props.canManageAssetTags) return

  resetEditor()
  buildEditorAssetCatalog()

  editorMode.value = "create"
  editorOpen.value = true
}

const openEditModal = (tag) => {
  if (!props.canManageAssetTags) return

  resetEditor()
  buildEditorAssetCatalog()

  const tagId = normalizeValue(tag?.id)

  editorMode.value = "edit"
  editingAssetTagId.value = tagId
  editorAssetTagName.value = normalizeValue(tag?.name)

  editorSelectedAssetIds.value = editorAssetCatalog.value
    .filter((activo) => {
      return activo.assetTagIds.includes(tagId)
    })
    .map((activo) => activo.id)

  editorOpen.value = true
}

const closeEditor = () => {
  editorOpen.value = false
  resetEditor()
}

const handleSaveAssetTag = ({ name, assetIds }) => {
  if (!props.canManageAssetTags) return

  if (editorMode.value === "create") {
    emit("create-asset-tag", {
      name,
      assetIds,
    })

    closeEditor()
    scheduleAssetTagIndexRefresh()

    return
  }

  if (!editingAssetTagId.value) return

  const nextCounts = new Map(assetTagAssetCounts.value)

  nextCounts.set(editingAssetTagId.value, assetIds.length)

  assetTagAssetCounts.value = nextCounts

  emit("update-asset-tag", {
    id: editingAssetTagId.value,
    changes: {
      name,
    },
    assetIds,
  })

  closeEditor()
}

const handleDeleteAssetTag = (tag) => {
  if (!props.canManageAssetTags) return

  const tagId = normalizeValue(tag?.id)

  emit("delete-asset-tag", tagId)

  const nextCounts = new Map(assetTagAssetCounts.value)

  nextCounts.delete(tagId)

  assetTagAssetCounts.value = nextCounts

  if (editorOpen.value && editingAssetTagId.value === tagId) {
    closeEditor()
  }
}

watch(normalizedAssetTagSearch, () => {
  currentPage.value = 1
})

watch(totalPages, (nextTotalPages) => {
  if (currentPage.value > nextTotalPages) {
    currentPage.value = nextTotalPages
  }
})

watch(sourceActivos, () => {
  scheduleAssetTagIndexRefresh()
})

watch(
  () =>
    props.assetTags
      .map((tag) => normalizeValue(tag?.id))
      .filter(Boolean)
      .join("|"),
  () => {
    scheduleAssetTagIndexRefresh()

    if (!editorOpen.value || editorMode.value !== "edit" || !editingAssetTagId.value) {
      return
    }

    const editingTagExists = props.assetTags.some((tag) => {
      return normalizeValue(tag?.id) === editingAssetTagId.value
    })

    if (!editingTagExists) {
      closeEditor()
    }
  },
)

onMounted(() => {
  rebuildAssetTagIndexes()
})

onBeforeUnmount(() => {
  if (tagIndexRefreshTimer !== null) {
    clearTimeout(tagIndexRefreshTimer)
    tagIndexRefreshTimer = null
  }
})
</script>
