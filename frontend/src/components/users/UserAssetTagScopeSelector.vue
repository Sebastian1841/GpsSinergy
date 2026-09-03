<template>
  <section class="mt-3 overflow-hidden rounded-lg border border-[#d8dee8] bg-white">
    <header class="border-b border-[#edf1f5] bg-[#f8fafc] px-3 py-2">
      <div class="flex items-center justify-between gap-2">
        <p class="text-[10px] font-black uppercase text-slate-500">Etiquetas autorizadas</p>
        <span class="text-[10px] font-black text-[#ff6600]">
          {{ selectedTagIds.size }} seleccionadas
        </span>
      </div>
      <p class="mt-1 text-[9px] font-semibold leading-4 text-slate-500">
        El usuario vera los activos que tengan cualquiera de las etiquetas marcadas.
      </p>
    </header>

    <input
      v-model="searchTerm"
      type="text"
      placeholder="Buscar etiqueta"
      class="m-2 h-8 w-[calc(100%-16px)] rounded-lg border border-[#d8dee8] bg-[#f8fafc] px-2 text-[11px] font-semibold text-[#172033] outline-none transition placeholder:text-slate-400 focus:border-[#ff6600] focus:bg-white focus:ring-2 focus:ring-[#ff6600]/10"
    />

    <div v-if="filteredTags.length" class="max-h-[220px] overflow-auto px-2 pb-2">
      <section v-for="group in filteredTagGroups" :key="group.key" class="mb-2.5 last:mb-0">
        <div
          v-if="showCompanyGroups"
          class="mb-1.5 flex items-center justify-between rounded-lg bg-[#eef3ff] px-2.5 py-1.5"
        >
          <span class="truncate text-[9px] font-black uppercase tracking-[0.08em] text-[#102372]">
            {{ group.label }}
          </span>

          <span class="shrink-0 text-[9px] font-black text-slate-500">
            {{ group.tags.length }}
          </span>
        </div>

        <label
          v-for="tag in group.tags"
          :key="tag.id"
          class="mb-2 flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 transition last:mb-0 hover:border-[#102372]/35 hover:bg-[#f8fafc]"
          :class="
            isTagSelected(tag.id) ? 'border-[#102372] bg-[#102372]/5' : 'border-[#edf1f5] bg-white'
          "
        >
          <input
            type="checkbox"
            class="h-4 w-4 cursor-pointer rounded border-[#d8dee8] accent-[#102372]"
            :checked="isTagSelected(tag.id)"
            @change="emitToggleTag(tag)"
          />

          <span class="min-w-0 flex-1">
            <span class="block truncate text-[11px] font-black text-[#172033]">
              {{ tag.name }}
            </span>

            <span class="mt-0.5 block truncate text-[9px] font-semibold text-slate-500">
              {{ tag.assetCount }} {{ tag.assetCount === 1 ? "activo" : "activos" }}
              <template v-if="!showCompanyGroups && tag.companyName">
                · {{ tag.companyName }}
              </template>
            </span>
          </span>
        </label>
      </section>
    </div>

    <div v-else class="px-3 py-5 text-center">
      <p class="text-[11px] font-black text-[#102372]">Sin etiquetas disponibles</p>
      <p class="mt-1 text-[9px] font-semibold text-slate-500">
        Los activos deben tener etiquetas o un tipo operativo reconocible.
      </p>
    </div>

    <p
      v-if="tags.length && !selectedTagIds.size"
      class="border-t border-[#edf1f5] px-3 py-2 text-[9px] font-semibold text-[#ff6600]"
    >
      Selecciona al menos una etiqueta para aplicar este alcance.
    </p>
  </section>
</template>

<script setup>
import { computed, ref } from "vue"

import {
  groupAssetTagsByCompany,
  normalizeAssetTagId,
} from "../../utils/users/userAssetTagUtils.js"

const props = defineProps({
  tags: {
    type: Array,
    default: () => [],
  },
  selectedIds: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(["toggle-tag"])

const searchTerm = ref("")

const selectedTagIds = computed(() => {
  return new Set(props.selectedIds.map(normalizeAssetTagId).filter(Boolean))
})

const filteredTags = computed(() => {
  const query = searchTerm.value.trim().toLowerCase()

  if (!query) return props.tags

  return props.tags.filter((tag) => {
    return [tag.id, tag.name, tag.companyName, tag.companyId].some((value) => {
      return String(value || "")
        .toLowerCase()
        .includes(query)
    })
  })
})

const filteredTagGroups = computed(() => {
  return groupAssetTagsByCompany(filteredTags.value)
})

const showCompanyGroups = computed(() => {
  return filteredTagGroups.value.length > 1
})

const isTagSelected = (tagId) => {
  return selectedTagIds.value.has(normalizeAssetTagId(tagId))
}

const emitToggleTag = (tag) => {
  emit("toggle-tag", tag.id)
}
</script>
